/* =========================================================================
   System v9 — Leave-field event / linked lifecycle primitive
   -------------------------------------------------------------------------
   「このカードがフィールドから離れた時」と、
   「A が離れたら B を破壊する／B が離れたら A を破壊する」の相互リンクを
   共通化する。

   既に存在するので**作り直さない**もの:
     onRemove … ただし発火するのは
                 ①FX_TO_GRAVE（フィールド→墓地）
                 ②v42OnActionApplied（行き先が除外のとき）
                だけで、バウンス・デッキ戻し・EX戻しを拾えない。
     v42MarkBanishInfo / banishInfo / graveInfo（移動先の記録）
     P3 moveProvenance（誰の効果で動いたか）
     P1 ChoiceRequest / P4 predicate / v7 scheduler
     commitAutomaticActionV44（ルール処理を Journal に載せる既存の入口）

   今回足りないので足すもの:
     1. 行き先を問わない「フィールドを離れた」イベント
     2. カード同士の生存リンク（片方が離れたらもう片方をどうするか）

   ■ Replay 安全性
     - state は純JSON。identity は uid。カード名・配列 index を authority にしない。
     - フィールドの直前状態は uid の小さな配列1本だけ持つ（最大でも十数件）。
       無制限の履歴は作らない。
     - リンク処理は commitAutomaticActionV44 で Action として記録するので、
       Replay / Undo / Redo / SaveLoad / digest がそのまま効く。
     - リンクは領域ローカル。場を離れたカードのリンクは reset() で消える。
   ========================================================================= */

const FIELD_ZONES_V9 = Object.freeze(['mz','sz','field']);
/* 相手側がいなくなったときに自分へ適用する処理 */
/* System v26: コントロールを元の持ち主へ戻す 'controlReturn' を追加。 */
const LINK_ON_GONE_V9 = Object.freeze(['destroy','banish','destroyBanish','toHand','none','controlReturn','toDeck','destroyIfDestroyed']);   /* S03-U184: toDeck; S03-U188: destroyIfDestroyed */

/* ---- フィールドの直前状態 ---------------------------------------------- */
function fieldSnapshotV9(gs){
  gs = gs || gameState;
  const out = [];
  for(let p=0;p<2;p++){
    const P = gs.players[p]; if(!P) continue;
    FIELD_ZONES_V9.forEach(z=>{
      if(z === 'field'){
        const c = P.field;
        if(c && c.uid != null) out.push({uid:c.uid, p, zone:'field', face:c.face||null});
        return;
      }
      (P[z]||[]).forEach(c=>{
        if(c && c.uid != null) out.push({uid:c.uid, p, zone:z, face:c.face||null});
      });
    });
  }
  return out;
}
function ensureFieldSnapshotV9(gs){
  gs = gs || gameState;
  if(!Array.isArray(gs.fieldSnapV9)) gs.fieldSnapV9 = fieldSnapshotV9(gs);
  return gs.fieldSnapV9;
}
/* 直前状態と今を比べて、フィールドを離れたカードを返す */
function departedFromFieldV9(gs){
  gs = gs || gameState;
  const before = ensureFieldSnapshotV9(gs);
  const nowUids = new Set(fieldSnapshotV9(gs).map(x => x.uid));
  return before.filter(x => !nowUids.has(x.uid));
}

/* System v26: フィールドには残っているが表側から裏側へなったカード。
   snapshot は最初から face を持っているので、同じ比較を一回増やすだけ。
   「表側表示で存在する限り」の寿命を正しく切るために使う。 */
function flippedFaceDownV9(gs){
  gs = gs || gameState;
  const before = ensureFieldSnapshotV9(gs);
  const now = new Map(fieldSnapshotV9(gs).map(x => [x.uid, x]));
  return before.filter(x => {
    if(x.face !== 'up') return false;
    const cur = now.get(x.uid);
    return !!cur && cur.face === 'down';
  });
}

/* ---- 生存リンク ---------------------------------------------------------
   card.linkV9 = {watch:[{uid, onGone}], label}
   「watch に載っている uid がフィールドを離れたら、このカードに onGone を適用する」
   という**片方向**の宣言。相互破壊は両側に1本ずつ張って表現する。
   離れた側のデータを読まずに済むので、reset() でリンクが消えても壊れない。 */
function linkStateV9(card){ return (card && card.linkV9) || null; }
function ensureLinkStateV9(card, label){
  if(!card) return null;
  if(!card.linkV9) card.linkV9 = {watch:[], label:label||''};
  if(!Array.isArray(card.linkV9.watch)) card.linkV9.watch = [];
  if(label && !card.linkV9.label) card.linkV9.label = label;
  return card.linkV9;
}
function linkWatchesV9(card, uid){
  const s = linkStateV9(card);
  if(!s || !Array.isArray(s.watch)) return null;
  return s.watch.find(w => w && w.uid === uid) || null;
}
/* リンク宣言が純JSONで妥当か */
function linkEntryValidV9(w){
  return !!(w && typeof w === 'object'
    && Number.isFinite(Number(w.uid))
    && LINK_ON_GONE_V9.indexOf(w.onGone) >= 0);
}

/* ---- イベント payload ---------------------------------------------------- */
function makeLeaveFieldEventV9(o){
  return {
    uid: (o.uid != null) ? o.uid : null,
    player: o.p,
    fromZone: o.zone || null,
    fromFace: o.face || null,
    toZone: o.toZone || null,
    byDestroy: !!o.byDestroy
  };
}
/* 離れたカードの現在地（墓地・除外・手札・デッキ・EX、消滅なら null） */
function whereNowV9(uid){
  const h = (typeof findCardByUid === 'function') ? findCardByUid(uid) : null;
  return h ? h.zone : null;
}

/* ---- 検出とイベント発火（applyAction の末尾から呼ぶ） -----------------
   ここを applyAction 側に置くのは Replay 決定性のため。
   deferredEvents は digest に含まれるので、act() だけで積むと
   Action を直接再適用する再生と食い違ってしまう。                     */
let LAST_DEPARTED_V9 = [];
let TOKEN_DESTROY_DAMAGE_S03 = [];   /* S03-U195 */
function applyTokenDestroyDamageS03(gs){
  let n = 0;
  while(TOKEN_DESTROY_DAMAGE_S03.length){
    const d = TOKEN_DESTROY_DAMAGE_S03.shift();
    if(!d || d.gs !== gs) continue;
    commitAutomaticActionV44({type:'LP', player:d.player, delta:-Math.abs(d.amount), cause:'effect', reason:`${d.key}（破壊）`});
    n++;
  }
  return n;
}
/* System v26: 裏側になったカードの uid。LAST_DEPARTED_V9 と同じ作法で
   gameState には積まない（再生時は Journal 側が持つ）。 */
let LAST_FACEDOWN_V26 = [];
function v9DetectLeaveField(gs){
  gs = gs || gameState;
  if(!gs || !gs.players) return 0;
  const gone = departedFromFieldV9(gs);
  /* snapshot を更新する前に裏側化も拾う。 */
  const faceDown = flippedFaceDownV9(gs);
  faceDown.forEach(x => { if(LAST_FACEDOWN_V26.indexOf(x.uid) < 0) LAST_FACEDOWN_V26.push(x.uid); });
  gs.fieldSnapV9 = fieldSnapshotV9(gs);
  if(!gone.length) return 0;
  if(typeof queueDeferredEventV2 === 'function'
     && typeof PLAY_MODE !== 'undefined' && PLAY_MODE === PLAY_MODES.DUEL){
    gone.forEach(x => {
      const to = whereNowV9(x.uid);
      const evt = makeLeaveFieldEventV9(
        Object.assign({}, x, {toZone:to, byDestroy:(to === 'grave')}));
      /* System v11: トークンは墓地へ行かないので、行き先からは破壊を
         判定できない。消滅した事実をイベントに載せて渡す。 */
      if(typeof stampTokenGoneV11 === 'function') stampTokenGoneV11(gs, evt);
      queueDeferredEventV2('onLeaveField', evt);
    });
  }
  /* S03-U195: destroyed tokens that damage their controller (おジャマトークン) — applied at the rule processing point (enforceLinkedLeaveV9)
     as a journaled LP Action. Kept out of gameState like LAST_DEPARTED_V9 (a replay follows the Journal). */
  if(Array.isArray(gs.tokensGoneV11)) gs.tokensGoneV11.forEach(t=>{
    if(t && t.byDestroy && Number(t.destroyDamageS03)>0 && (t.controller===0 || t.controller===1))
      TOKEN_DESTROY_DAMAGE_S03.push({gs, uid:t.uid, player:t.controller, amount:Number(t.destroyDamageS03), key:t.key||'トークン'});
  });
  if(Array.isArray(gs.tokensGoneV11) && gs.tokensGoneV11.length) gs.tokensGoneV11 = [];
  /* リンク解決へ渡す。gameState には積まない（再生時は Journal 側が持つ）。 */
  gone.forEach(x => { if(LAST_DEPARTED_V9.indexOf(x.uid) < 0) LAST_DEPARTED_V9.push(x.uid); });
  return gone.length;
}

/* ---- 生存リンクの解決（act() のルール処理点から呼ぶ） -------------------
   離れた側ではなく、場に残っている側が持つ watch を見る。
   commitAutomaticActionV44 で Action として記録するので、
   再生は Journal をそのまま辿るだけでよい。                            */
let LINK_RESOLVING_V9 = false;
function enforceLinkedLeaveV9(gs){
  gs = gs || gameState;
  if(LINK_RESOLVING_V9) return 0;
  if(!gs || !gs.players) return 0;
  if(typeof commitAutomaticActionV44 !== 'function'){ LAST_DEPARTED_V9 = []; return 0; }
  let acted = 0, guard = 0;
  LINK_RESOLVING_V9 = true;
  try{
    /* S03-U195: 「破壊された時にそのコントローラーは1体につき300ダメージを受ける」. Only entries of this state: a Replay audit runs the
       reducers on another state object (its entries are dropped here). */
    acted += applyTokenDestroyDamageS03(gs);
    while((LAST_DEPARTED_V9.length || LAST_FACEDOWN_V26.length || TOKEN_DESTROY_DAMAGE_S03.length) && guard++ < 16){
      acted += applyTokenDestroyDamageS03(gs);
      const goneUids = LAST_DEPARTED_V9.slice();
      LAST_DEPARTED_V9 = [];
      /* System v26: 裏側化は onFaceDown:true を宣言した watch だけが見る。 */
      const faceDownUids = LAST_FACEDOWN_V26.slice();
      LAST_FACEDOWN_V26 = [];
      for(let p=0;p<2;p++){
        const P = gs.players[p]; if(!P) continue;
        FIELD_ZONES_V9.forEach(z => {
          const arr = (z === 'field') ? (P.field ? [P.field] : []) : (P[z] || []);
          for(let i = arr.length - 1; i >= 0; i--){
            const c = arr[i]; if(!c) continue;
            const st = linkStateV9(c); if(!st || !Array.isArray(st.watch)) continue;
            const hit = st.watch.find(w => linkEntryValidV9(w) && (
              goneUids.indexOf(w.uid) >= 0
              || (w.onFaceDown === true && faceDownUids.indexOf(w.uid) >= 0)));
            if(!hit || hit.onGone === 'none') continue;
            const here = (typeof findCardByUid === 'function') ? findCardByUid(c.uid) : null;
            if(!here || FIELD_ZONES_V9.indexOf(here.zone) < 0) continue;
            const reason = st.label || 'リンクの解除';
            if(hit.onGone === 'destroy'){
              commitAutomaticActionV44({type:'FX_TO_GRAVE', player:here.p, zone:here.zone,
                index:here.index, reason, byDestroy:true});
            }else if(hit.onGone === 'banish'){
              commitAutomaticActionV44({type:'FX_BANISH', player:here.p, zone:here.zone,
                index:here.index, reason});
            }else if(hit.onGone === 'destroyBanish'){
              commitAutomaticActionV44({type:'FX_DESTROY_BANISH', player:here.p, zone:here.zone,
                index:here.index, reason});
            }else if(hit.onGone === 'toDeck'){
              /* S03-U184: 「このカードがフィールドから離れた時にそのモンスターは持ち主のデッキに戻る」 (剣闘獣ダリウス) */
              const ownerS03 = cardOwnerIndex(gameState, here.card, here.p);
              commitAutomaticActionV44({type:'FX_RETURN_DECK', player:here.p, zone:here.zone,
                index:here.index, toBottom:false, reason});
              commitAutomaticActionV44({type:'SHUFFLE', player:ownerS03});
            }else if(hit.onGone === 'destroyIfDestroyed'){
              /* S03-U188: 「選択したモンスターが破壊された時、このカードを破壊する」 (デモンズ・チェーン). Only when the watched card was
                 destroyed (graveInfo.byDestroy of this turn); any other departure ends the link (LINK_CLEAR_V9), so the monster coming
                 back later is not watched. A destroyed-and-banished monster (FX_DESTROY_BANISH) carries no mark and is not detected. */
              const wh = (typeof findCardByUid === 'function') ? findCardByUid(hit.uid) : null;
              const gi = wh && wh.card && wh.card.graveInfo;
              if(wh && wh.zone === 'grave' && gi && gi.byDestroy && Number(gi.turn) === Number(gs.turn)){
                commitAutomaticActionV44({type:'FX_TO_GRAVE', player:here.p, zone:here.zone,
                  index:here.index, reason, byDestroy:true});
              }else{
                commitAutomaticActionV44({type:'LINK_CLEAR_V9', player:here.p, zone:here.zone, index:here.index, reason});
              }
            }else if(hit.onGone === 'toHand'){
              commitAutomaticActionV44({type:'FX_BOUNCE', player:here.p, zone:here.zone,
                index:here.index, reason});
            }else if(hit.onGone === 'controlReturn'){
              /* System v26: 奇っ取ったカードを元のコントローラへ戻す。
                 戻し先は watch エントリの returnTo（純 JSON）。 */
              const back = (hit.returnTo === 0 || hit.returnTo === 1) ? hit.returnTo : null;
              if(back != null && back !== here.p){
                commitAutomaticActionV44({type:'CONTROL_RETURN_ONE_V26', player:here.p,
                  zone:here.zone, index:here.index, toPlayer:back, reason,
                  sourceUid:(hit.uid != null ? hit.uid : null)});
              }
            }
            acted++;
          }
        });
      }
    }
  } finally {
    LINK_RESOLVING_V9 = false;
    LAST_DEPARTED_V9 = [];
    TOKEN_DESTROY_DAMAGE_S03 = [];
    LAST_FACEDOWN_V26 = [];
  }
  return acted;
}

/* ---- 参照ヘルパ（テスト・カードスクリプト用） -------------------------- */
function leavingCardOfV9(evt){
  if(!evt || evt.uid == null) return null;
  return (typeof findCardByUid === 'function') ? findCardByUid(evt.uid) : null;
}
function leftOwnFieldV9(evt, player){
  return !!(evt && evt.player === player);
}
function assertLinkStateSerializableV9(gs){
  gs = gs || gameState;
  const bad = [];
  const walk = (v, path, d) => {
    if(d > 8 || v === null) return;
    const t = typeof v;
    if(t === 'function' || t === 'symbol'){ bad.push(path + ': ' + t); return; }
    if(t !== 'object') return;
    if(v instanceof Map || v instanceof Set){ bad.push(path + ': ' + v.constructor.name); return; }
    if(v.nodeType != null){ bad.push(path + ': DOM'); return; }
    if(typeof v.then === 'function'){ bad.push(path + ': thenable'); return; }
    if(Array.isArray(v)){ v.forEach((x, i) => walk(x, path + '[' + i + ']', d + 1)); return; }
    Object.keys(v).forEach(k => walk(v[k], path + '.' + k, d + 1));
  };
  walk(gs.fieldSnapV9, 'fieldSnapV9', 0);
  for(let p=0;p<2;p++){
    const P = gs.players[p]; if(!P) continue;
    FIELD_ZONES_V9.forEach(z => {
      const arr = (z === 'field') ? (P.field ? [P.field] : []) : (P[z] || []);
      arr.forEach((c, i) => walk(c && c.linkV9, 'p' + p + '.' + z + '[' + i + '].linkV9', 0));
    });
  }
  let rt = true;
  try{ JSON.parse(JSON.stringify(gs.fieldSnapV9 || [])); }
  catch(e){ rt = false; bad.push('JSON roundtrip failed'); }
  return {ok: bad.length === 0 && rt, why: bad.join(', ')};
}
