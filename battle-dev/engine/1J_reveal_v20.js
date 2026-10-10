/* =========================================================================
   System v20 — Reveal / Inspect / AtomicDeck
   -------------------------------------------------------------------------
   「確認する」「公開する」「好きな順番でデッキの上に戻す」を共通化する。

   ■ 「見る」と「公開」を分ける
     確認（inspect） … そのプレイヤーだけが情報を得る。
                       gameState には何も書かない。相手側の state にも入れない。
                       Journal に残すのは「誰が何枚見たか」だけで、
                       中身は残さない。だから Replay で情報が漏れない。
     公開（reveal）   … 見せた事自体がゲーム上の状態。
                       gs.revealV20 に直列化可能な記録として残す。

   ■ 使うまで state を作らない
     gs.revealV20 は最初の公開まで存在しない。
     digest も「非空のときだけ」追記するので後方互換を壊さない。

   ■ デッキ操作は1つの Action で原子的に行う
     「3枚めくって1枚を下に、残りを好きな順で上に」のような処理を
     途中状態のまま放置しない。順番はプレイヤーが選び（v49 P1）、
     確定した並びだけを1つの Action として適用する。
   ========================================================================= */

const REVEAL_AUDIENCE_V20 = Object.freeze(['self','opponent','both']);
const REVEAL_UNTIL_V20 = Object.freeze(['resolution','endPhase','endTurn','permanent','endPhaseCount']);

/* ---- 確認（private inspect）-------------------------------------------
   state を一切変えない。呼び出し側は戻り値のハンドルをその場で使う。 */
function inspectV20(gs, viewer, handles, label){
  gs = gs || gameState;
  const raw = (Array.isArray(handles) ? handles : [handles]).filter(h=>h&&h.card);
  /* db を必ず添えて返す。呼び出し側はその場で絞り込める。 */
  const list = raw.map(h=>h.db ? h : Object.assign({}, h, {db:dbOf(h.card)}));
  const uids = list.map(h=>ensureCardUid(gs,h.card));
  /* 中身はログに残さない。枚数だけ残す。 */
  if(typeof logIt === 'function'){
    logIt(gs, `${label||'効果'}：${nameOf(viewer)}はカード${uids.length}枚を確認した（内容は非公開）`);
  }
  return {viewer, uids, count:uids.length, handles:list};
}
/* 確認した中から条件に合うものだけを返す小道具 */
function inspectFilterV20(res, pred){
  if(!res || !Array.isArray(res.handles)) return [];
  return res.handles.filter(h=>{ try{ return !!pred(h); }catch(e){ return false; } });
}

/* ---- 公開（reveal）----------------------------------------------------- */
function revealListV20(gs){
  gs = gs || gameState;
  return Array.isArray(gs.revealV20) ? gs.revealV20 : [];
}
function makeRevealV20(spec){
  const s = spec || {};
  const rec = {
    id: (s.id!=null) ? s.id : null,
    player: (s.player===0||s.player===1) ? s.player : 0,   /* 公開する側 */
    audience: REVEAL_AUDIENCE_V20.indexOf(s.audience)>=0 ? s.audience : 'both',
    uids: Array.isArray(s.uids) ? s.uids.slice() : [],
    zone: s.zone || null,          /* 'hand' 等。ゾーン全体を公開し続ける場合 */
    label: s.label || '',
    until: REVEAL_UNTIL_V20.indexOf(s.until)>=0 ? s.until : 'resolution',
    remaining: (typeof s.remaining==='number') ? s.remaining : null,
    endPhaseOf: (s.endPhaseOf===0||s.endPhaseOf===1) ? s.endPhaseOf : null,
    sourceUid: (s.sourceUid!=null) ? s.sourceUid : null,
    /* on を持つ記録は「これから公開し続ける義務」であって、
       それ自体は何も見せていない。寿命規約だけを共有する。 */
    on: s.on || null,
    turn: (typeof s.turn==='number') ? s.turn : 0
  };
  return rec;
}
/* 公開が今も有効か。source が場を離れたら終わる。 */
function revealActiveV20(gs, rec){
  gs = gs || gameState;
  if(!rec) return false;
  if(rec.sourceUid!=null){
    const h = findCardByUidInState ? findCardByUidInState(gs, rec.sourceUid) : findCardByUid(rec.sourceUid);
    if(!h) return false;
    if(h.zone!=='mz' && h.zone!=='sz' && h.zone!=='field') return false;
    if(h.card && h.card.face==='down') return false;
  }
  return true;
}
/* その uid が player から見えるか */
function isRevealedToV20(gs, uid, player){
  gs = gs || gameState;
  return revealListV20(gs).some(r=>{
    if(r && r.on) return false;                 /* 義務記録は見え方を変えない */
    if(!revealActiveV20(gs,r)) return false;
    if(r.audience==='self' && r.player!==player) return false;
    if(r.audience==='opponent' && r.player===player) return false;
    if(Array.isArray(r.uids) && r.uids.indexOf(uid)>=0) return true;
    if(r.zone){
      const h = findCardByUidInState ? findCardByUidInState(gs, uid) : findCardByUid(uid);
      return !!h && h.zone===r.zone && h.p===r.player;
    }
    return false;
  });
}
/* player に公開されているカードのハンドル一覧 */
function revealedCardsV20(gs, player){
  gs = gs || gameState;
  const out = [];
  revealListV20(gs).forEach(r=>{
    if(r && r.on) return;                       /* 義務記録は公開されたカードではない */
    if(!revealActiveV20(gs,r)) return;
    if(r.audience==='self' && r.player!==player) return;
    if(r.audience==='opponent' && r.player===player) return;
    if(r.zone){
      (gs.players[r.player][r.zone]||[]).forEach(c=>{ if(c) out.push(locateCardAnyV4(c)); });
      return;
    }
    (r.uids||[]).forEach(u=>{
      const h = findCardByUidInState ? findCardByUidInState(gs,u) : findCardByUid(u);
      if(h) out.push(h);
    });
  });
  return out.filter(Boolean);
}
/* 「この先引いたカードを公開する」のような継続的な公開義務。
   義務自体は公開記録と同じ寿命規約で管理する。 */
function revealObligationV20(gs, player, on){
  gs = gs || gameState;
  return revealListV20(gs).find(r=>r && r.on===on && r.player===player && revealActiveV20(gs,r)) || null;
}

/* 公開義務の適用。カード名ではなく義務記録だけを見る。
   DRAW Action の中から呼ばれるので Journal / Replay に乗る。 */
function applyDrawRevealObligationV20(gs, player, cards){
  gs = gs || gameState;
  const ob = revealObligationV20(gs, player, 'draw');
  if(!ob) return 0;
  const list = (cards||[]).filter(Boolean);
  if(!list.length) return 0;
  const uids = list.map(c=>ensureCardUid(gs,c));
  if(!gs.revealV20) gs.revealV20 = [];
  gs.revealV20.push(makeRevealV20({
    id: ++gs.uidSeq, player, audience:ob.audience, uids,
    label: ob.label || '公開義務', until:ob.until,
    remaining:ob.remaining, endPhaseOf:ob.endPhaseOf,
    sourceUid:ob.sourceUid, turn:gs.turn}));
  if(typeof logIt==='function')
    logIt(gs, `${ob.label||'効果'}：${nameOf(player)}は引いた${uids.length}枚を公開した`);
  return uids.length;
}

/* 期間切れの掃除。clearExpiredMods から相乗りする。 */
function clearExpiredRevealsV20(gs, when){
  gs = gs || gameState;
  if(!Array.isArray(gs.revealV20) || !gs.revealV20.length) return;
  gs.revealV20 = gs.revealV20.filter(r=>{
    if(!r) return false;
    if(!revealActiveV20(gs,r)) return false;
    if(r.until==='permanent') return true;
    if(r.until==='endPhaseCount'){
      /* 「相手の2回目のエンドフェイズまで」のような数え方 */
      if(when!=='endPhase') return true;
      if(r.endPhaseOf!=null && gs.activePlayer!==r.endPhaseOf) return true;
      r.remaining = (typeof r.remaining==='number' ? r.remaining : 1) - 1;
      return r.remaining > 0;
    }
    if(when==='endTurn')  return r.until!=='endTurn' && r.until!=='endPhase' && r.until!=='resolution';
    if(when==='endPhase') return r.until!=='endPhase' && r.until!=='resolution';
    if(when==='resolution') return r.until!=='resolution';
    return true;
  });
  if(!gs.revealV20.length) delete gs.revealV20;
}

/* ---- デッキの並べ替え --------------------------------------------------
   uids に挙げた順でデッキの上（または下）へ戻す。
   デッキに無い uid は無視する。1つの Action で原子的に行う。 */
function applyDeckOrderV20(gs, player, uids, toBottom){
  gs = gs || gameState;
  const P = gs.players[player];
  if(!P || !Array.isArray(P.deck)) return 0;
  const want = Array.isArray(uids) ? uids.slice() : [];
  const picked = [];
  want.forEach(u=>{
    const i = P.deck.findIndex(c=>c && c.uid===u);
    if(i>=0) picked.push(P.deck.splice(i,1)[0]);
  });
  if(!picked.length) return 0;
  if(toBottom) picked.forEach(c=>P.deck.push(c));
  else for(let i=picked.length-1;i>=0;i--) P.deck.unshift(picked[i]);
  return picked.length;
}
/* デッキトップ n 枚のハンドル。state は変えない。 */
function deckTopHandlesV20(gs, player, n){
  gs = gs || gameState;
  const P = gs.players[player];
  const out = [];
  const deck = (P && P.deck) || [];
  for(let i=0;i<Math.min(n||0, deck.length);i++){
    ensureCardUid(gs, deck[i]);
    out.push({p:player, zone:'deck', index:i, card:deck[i], db:dbOf(deck[i])});
  }
  return out;
}
/* 裏側守備表示モンスターだけを決定論的にシャッフルする。
   表側のカードや並び位置以外の情報は動かさない。 */
function shuffleFaceDownV20(gs, player){
  gs = gs || gameState;
  const P = gs.players[player];
  if(!P || !Array.isArray(P.mz)) return 0;
  const idx = [];
  P.mz.forEach((c,i)=>{ if(c && c.face==='down') idx.push(i); });
  if(idx.length<2) return 0;
  const cards = idx.map(i=>P.mz[i]);
  for(let i=cards.length-1;i>0;i--){
    const j = duelRandomInt(i+1);
    const t = cards[i]; cards[i] = cards[j]; cards[j] = t;
  }
  idx.forEach((slot,k)=>{ P.mz[slot] = cards[k]; });
  return cards.length;
}

/* ---- 直列化の検査（テスト用）------------------------------------------ */
function assertRevealSerializableV20(gs){
  gs = gs || gameState;
  if(gs.revealV20 == null) return null;
  if(!Array.isArray(gs.revealV20)) return 'revealV20 が配列ではない';
  for(const r of gs.revealV20){
    if(r == null || typeof r !== 'object') return 'record がオブジェクトではない';
    for(const k of Object.keys(r)){
      const v = r[k];
      if(v===null) continue;
      if(k==='uids'){ if(!Array.isArray(v)) return 'uids が配列ではない'; continue; }
      if(typeof v==='function' || typeof v==='object') return `${k} が直列化できない`;
    }
  }
  try{ JSON.parse(JSON.stringify(gs.revealV20)); }catch(e){ return 'JSON 往復できない'; }
  return null;
}
