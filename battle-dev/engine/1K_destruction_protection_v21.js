/* =========================================================================
   System v21 — DestructionProtection（破壊されない）
   -------------------------------------------------------------------------
   「1ターンに1度だけ戦闘では破壊されない」
   「攻撃力1900以上のモンスターとの戦闘では破壊されない」
   「カードの効果では破壊されない」
   を共通化する。

   ■ 既存を作り直さない
     battleProof(card)                 … 無条件の戦闘破壊耐性。**そのまま**。
                                         v21 は battleProof が false のときだけ働く。
     continuous.immuneToTarget         … 対象耐性。**触らない**。
                                         「対象にならない」と「破壊されない」は別物。
     v21 が防ぐのは **破壊だけ**。墓地送り・除外・バウンスは防がない。

   ■ 中央地点は2つだけ
     戦闘破壊 … BATTLE の killAtk / killDef（既に1箇所）
     効果破壊 … FX_TO_GRAVE の byDestroy と FX_WIPE_ZONE（既に1箇所ずつ）
     効果処理の各所へ if をばら撒かない。

   ■ state に入るのは「使った回数」と「一時付与」だけ
     条件式はカードスクリプト側（CARD_SCRIPTS / continuous）に住む。
     battleProof が sc.battleProof を読むのと同じ作法。
       card.protUsedV21 = { key: {turn, count} }      1ターンに◯度の消費記録
       card.protV21     = [ {battle,effect,until,...} ] 一時的に与えられた耐性
     どちらも領域ローカル。場を離れたら消える。
     digest は「キーがある時だけ」載るので後方互換を壊さない。
   ========================================================================= */

const PROT_CAUSE_V21   = Object.freeze(['battle','effect']);
const PROT_UNTIL_V21   = Object.freeze(['endTurn','endPhase','endBattlePhase','permanent','chain']);

/* ---- 一時付与の記録 ----------------------------------------------------- */
function makeProtGrantV21(spec){
  const s = spec || {};
  return {
    key:     String(s.key || 'grant'),
    battle:  !!s.battle,
    effect:  !!s.effect,
    perTurn: (typeof s.perTurn==='number' && s.perTurn>0) ? s.perTurn : null,
    until:   PROT_UNTIL_V21.indexOf(s.until)>=0 ? s.until : 'endTurn',
    chainId: (s.chainId!=null) ? s.chainId : null,
    sourceUid:(s.sourceUid!=null) ? s.sourceUid : null,
    /* 発動元カードの種類で絞る場合だけ入れる（'s'/'t'/'m'）。 */
    sourceKind: Array.isArray(s.sourceKind) ? s.sourceKind.slice() : (s.sourceKind || null),
    /* 対象を取らない効果だけ防ぐ場合 */
    nonTargetingOnly: !!s.nonTargetingOnly,
    /* 相手のカードの効果だけ防ぐ場合 */
    opponentOnly: !!s.opponentOnly,
    label:   String(s.label || ''),
    turn:    (typeof s.turn==='number') ? s.turn : 0
  };
}
function protGrantsV21(card){
  return (card && Array.isArray(card.protV21)) ? card.protV21 : [];
}

/* ---- 届く範囲。continuousReaches は触らず v21 独自に持つ ---------------- */
function protReachesV21(scope, srcP, tgtLoc, src, target){
  switch(scope){
    case 'self':        return src === target;
    case 'equippedMonster':
      return !!(src && src.equipTo && target && target.uid!=null
                && src.equipTo.uid===target.uid && tgtLoc.zone==='mz');
    case 'ownMonsters': return tgtLoc.p===srcP && tgtLoc.zone==='mz';
    case 'oppMonsters': return tgtLoc.p!==srcP && tgtLoc.zone==='mz';
    case 'allMonsters': return tgtLoc.zone==='mz';
    case 'ownCards':    return tgtLoc.p===srcP;
    case 'allCards':    return true;
    default:            return false;
  }
}

/* ---- 宣言を集める -------------------------------------------------------
   戻り値は解決済みの記述の配列。関数は state へ入れずここでだけ評価する。 */
function protRecordsForV21(gs, card, ctx){
  gs = gs || gameState;
  const out = [];
  if(!card) return out;
  const loc = (typeof locateCardAnyV4==='function') ? locateCardAnyV4(card) : null;
  if(!loc) return out;

  /* ① カード自身の宣言 */
  const sc = (typeof CARD_SCRIPTS!=='undefined') ? CARD_SCRIPTS[cardName(card)] : null;
  const own = sc && sc.protectV21;
  if(own) out.push(resolveProtSpecV21(own, 'self', card, card, ctx));
  /* S03-U426: トラスト・ガーディアン — a Synchro Monster inherits synchroMatProtectV21 of the scripts of its materials (v380SummonMaterials) */
  if(Array.isArray(card.v380SummonMaterials)){
    card.v380SummonMaterials.forEach(m=>{
      const scM = (typeof CARD_SCRIPTS!=='undefined') ? CARD_SCRIPTS[m && m.name] : null, specM = scM && scM.synchroMatProtectV21;
      if(specM) out.push(resolveProtSpecV21(specM, 'mat:'+m.name, card, card, ctx));
    });
  }

  /* ② 継続効果による付与 */
  if(typeof continuousSources==='function'){
    continuousSources().forEach(src=>{
      const spec = src.sc && src.sc.continuous && src.sc.continuous.protectV21;
      if(!spec) return;
      const scope = spec.scope || src.sc.continuous.scope || 'self';
      if(!protReachesV21(scope, src.p, loc, src.card, card)) return;
      out.push(resolveProtSpecV21(spec, 'src'+(src.card.uid!=null?src.card.uid:'?'),
                                  src.card, card, ctx));
    });
  }

  /* ③ 一時付与 */
  protGrantsV21(card).forEach(g=>{
    if(!protGrantActiveV21(gs, g)) return;
    out.push({
      key:g.key, battle:!!g.battle, effect:!!g.effect, perTurn:g.perTurn,
      sourceKind:g.sourceKind, nonTargetingOnly:g.nonTargetingOnly,
      opponentOnly:g.opponentOnly, label:g.label
    });
  });
  return out.filter(Boolean);
}
/* 宣言（関数可）を、この判定コンテキストでの真偽へ落とす */
function resolveProtSpecV21(spec, key, srcCard, target, ctx){
  const ev = (v)=>{
    if(typeof v==='function'){
      try{ return !!v(target, srcCard, ctx||{}); }catch(e){ return false; }
    }
    return !!v;
  };
  return {
    key: String(spec.key || key),
    battle: ev(spec.battle),
    effect: ev(spec.effect),
    perTurn: (typeof spec.perTurn==='number' && spec.perTurn>0) ? spec.perTurn : null,
    /* S03-U81: 既定は対象（守られるカード）ごとに「1ターンに◯度」を数える。
       'source' を宣言すると、発動元カード（srcCard）側で数える — 「このカードの効果で1ターンに1度だけ、
       自分の『BF』モンスターのいずれかを守れる」のように、複数の異なる対象へ跨って共有する回数制限を表せる
       （precedent: BF－孤高のシルバー・ウィンド）。 */
    perTurnScope: spec.perTurnScope==='source' ? 'source' : 'target',
    sourceCard: srcCard || null,
    afterUseS03: (typeof spec.afterUseS03==='function') ? spec.afterUseS03 : null,   /* S03-U426: runs inside the battle reducer when this protection saved the card */
    sourceKind: spec.sourceKind || null,
    nonTargetingOnly: !!spec.nonTargetingOnly,
    opponentOnly: !!spec.opponentOnly,
    label: String(spec.label || (srcCard?cardName(srcCard):''))
  };
}
/* perTurn の消費先カード（既定は対象、source 指定なら発動元）。発動元が場に見つからなければ対象に落ちる
   （直列化できないカード参照を保持しないため、毎回 srcCard から辿る）。 */
function protCountCardV21(r, target){
  if(r && r.perTurnScope==='source' && r.sourceCard) return r.sourceCard;
  return target;
}
/* 一時付与がまだ生きているか */
function protGrantActiveV21(gs, g){
  gs = gs || gameState;
  if(!g) return false;
  if(g.chainId!=null){
    const live = Array.isArray(gs.chain) && gs.chain.some(l=>l&&l.chainId===g.chainId);
    if(!live) return false;
  }
  if(g.sourceUid!=null){
    const h = (typeof findCardByUidInState==='function')
      ? findCardByUidInState(gs, g.sourceUid) : null;
    if(!h) return false;
    if(h.zone!=='mz' && h.zone!=='sz' && h.zone!=='field') return false;
  }
  return true;
}

/* ---- 「1ターンに◯度」の消費記録 ---------------------------------------- */
function protUsedCountV21(gs, card, key){
  gs = gs || gameState;
  const m = card && card.protUsedV21;
  const e = m && m[key];
  if(!e || e.turn!==gs.turn) return 0;
  return Number(e.count)||0;
}
function protConsumeV21(gs, card, key){
  gs = gs || gameState;
  if(!card) return;
  if(!card.protUsedV21) card.protUsedV21 = {};
  const e = card.protUsedV21[key];
  if(!e || e.turn!==gs.turn) card.protUsedV21[key] = {turn:gs.turn, count:1};
  else e.count = (Number(e.count)||0) + 1;
}

/* ---- 判定 ---------------------------------------------------------------
   ctx = {cause:'battle'|'effect', opponentCard, byPlayer, targeting, sourceKind}
   使える記述が1つでもあればそれを返す。無ければ null。            */
function protectionRecordV21(gs, card, ctx){
  gs = gs || gameState;
  const c = ctx || {};
  if(PROT_CAUSE_V21.indexOf(c.cause) < 0) return null;
  const recs = protRecordsForV21(gs, card, c);
  for(const r of recs){
    if(c.cause==='battle' && !r.battle) continue;
    if(c.cause==='effect' && !r.effect) continue;
    /* S03-U168: the source kind limits effect destruction only — a record that also carries a battle protection (異次元竜
       トワイライトゾーンドラゴン: 「…魔法・罠カードの効果では破壊されない。また、…戦闘では破壊されない」) must not lose it */
    if(r.sourceKind && c.cause==='effect'){
      /* 単一の種類でも、「魔法・罠」のような複数指定でもよい。 */
      const want = Array.isArray(r.sourceKind) ? r.sourceKind : [r.sourceKind];
      if(want.indexOf(c.sourceKind) < 0) continue;
    }
    if(r.nonTargetingOnly && c.targeting) continue;
    if(r.opponentOnly && c.byPlayer!=null){
      const mine = (typeof locateCardAnyV4==='function') ? locateCardAnyV4(card) : null;
      if(mine && c.byPlayer===mine.p) continue;
    }
    if(r.perTurn!=null && protUsedCountV21(gs, protCountCardV21(r, card), r.key) >= r.perTurn) continue;
    return r;
  }
  return null;
}
/* 判定して、実際に守った時だけ回数を消費する。Action の中からだけ呼ぶ。 */
function applyDestructionProtectionV21(gs, card, ctx){
  gs = gs || gameState;
  const r = protectionRecordV21(gs, card, ctx);
  if(!r) return null;
  if(r.perTurn!=null) protConsumeV21(gs, protCountCardV21(r, card), r.key);
  return r;
}

/* ---- 一時付与の掃除。clearExpiredMods から相乗りする -------------------- */
function clearExpiredProtV21(gs, when){
  gs = gs || gameState;
  (gs.players||[]).forEach(P=>{
    ['mz','sz'].forEach(z=>{
      (P[z]||[]).forEach(c=>{
        if(!c || !Array.isArray(c.protV21)) return;
        c.protV21 = c.protV21.filter(g=>{
          if(!g) return false;
          if(g.until==='permanent') return true;
          if(when==='endBattlePhase') return g.until!=='endBattlePhase';
          if(when==='endTurn')  return g.until!=='endTurn' && g.until!=='endPhase' && g.until!=='endBattlePhase';
          if(when==='endPhase') return g.until!=='endPhase';
          return true;
        });
        if(!c.protV21.length) delete c.protV21;
      });
    });
  });
}

/* ---- 破壊元の種類を今のチェーンリンクから取る ----------------------------
   「魔法・罠カードの効果では破壊されない」の判定に使う。
   解決中のチェーンリンクが無ければ null（＝種類で絞る記述は働かない）。 */
function destroyerKindV21(gs){
  gs = gs || gameState;
  const chain = Array.isArray(gs.chain) ? gs.chain : [];
  if(!chain.length) return null;
  const link = chain[chain.length-1];
  if(!link || link.cardId==null || typeof CARD_DB==='undefined') return null;
  const db = CARD_DB[link.cardId] || {};
  return db.k || null;
}
/* 解決中のチェーンリンクが対象を取っているか */
function destroyerTargetingV21(gs){
  gs = gs || gameState;
  const chain = Array.isArray(gs.chain) ? gs.chain : [];
  if(!chain.length) return false;
  const link = chain[chain.length-1];
  if(!link) return false;
  const t = link.targets, s = link.selection;
  return !!((Array.isArray(t)&&t.length) || (Array.isArray(s)&&s.length));
}
/* 効果破壊の判定コンテキストを組み立てる */
function effectDestroyCtxV21(gs, a, card){
  gs = gs || gameState;
  /* S03-U168: 「対象を取らない効果では破壊されない」 — did the destroying effect target THIS card? From the action's source stamp
     (a.srcS03.tg, the resolving link's targeted uids; empty/absent = not targeting). destroyerTargetingV21 read the top of gs.chain,
     which is empty while a link resolves (always false in the real path). */
  const src = a && a.srcS03;
  const targeting = src ? (Array.isArray(src.tg) && (card && card.uid!=null ? src.tg.indexOf(card.uid)>=0 : src.tg.length>0))
                        : destroyerTargetingV21(gs);
  return {
    cause:'effect',
    /* CODEX-C04: mass-destruction Actions normally omit byPlayer and carry the
       resolving controller in the Replay-safe P3 stamp. Use the same v30
       authority as graveInfo/onDestroy so opponent-only protection also works
       for FX_WIPE_ZONE (Black Hole, Torrential Tribute, etc.). */
    byPlayer: (typeof destroyerPlayerV30==='function') ? destroyerPlayerV30(gs,a)
      : ((a && (a.byPlayer===0||a.byPlayer===1)) ? a.byPlayer : null),
    reason: (a && a.reason) || null,
    /* S03-U167: the resolving link has already left gs.chain when its effect destroys (destroyerKindV21 always saw an empty chain in
       the real DUEL path, so 「罠カードの効果では破壊されない」 / 「魔法・罠カードの効果では破壊されない」 never applied). The action's
       source stamp a.srcS03.k (engine/1ZG, written when the action is committed, replayed with it) is authoritative. */
    sourceKind: (a && a.srcS03 && a.srcS03.k) ? a.srcS03.k : destroyerKindV21(gs),
    targeting: targeting
  };
}

/* ---- 直列化検査（テスト用） -------------------------------------------- */
function assertProtSerializableV21(gs){
  gs = gs || gameState;
  let bad = null;
  (gs.players||[]).forEach(P=>{
    ['mz','sz','hand','grave','banish','deck'].forEach(z=>{
      (P[z]||[]).forEach(c=>{
        if(!c) return;
        if(c.protV21!=null){
          if(!Array.isArray(c.protV21)){ bad = bad||'protV21 が配列ではない'; return; }
          c.protV21.forEach(g=>{
            Object.keys(g||{}).forEach(k=>{
              const v=g[k];
              if(v===null) return;
              if(typeof v==='function' || typeof v==='object') bad = bad||('protV21.'+k+' が直列化できない');
            });
          });
        }
        if(c.protUsedV21!=null){
          if(typeof c.protUsedV21!=='object'){ bad = bad||'protUsedV21 がオブジェクトではない'; return; }
          Object.keys(c.protUsedV21).forEach(k=>{
            const e=c.protUsedV21[k];
            if(!e || typeof e!=='object' || typeof e.turn!=='number' || typeof e.count!=='number')
              bad = bad||'protUsedV21 の中身が {turn,count} ではない';
          });
        }
      });
    });
  });
  if(bad) return bad;
  try{ JSON.parse(JSON.stringify(gs.players)); }catch(e){ return 'JSON 往復できない'; }
  return null;
}
