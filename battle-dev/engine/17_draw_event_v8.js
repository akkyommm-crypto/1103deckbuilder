/* =========================================================================
   System v8 — Draw event primitive
   -------------------------------------------------------------------------
   「ドローしたカードが◯◯だった場合」「この効果でドローしたカード」
   「相手がドローフェイズ以外でドローした時」を書けるようにする。

   既に存在するので**作り直さない**もの:
     DRAW Action / gs.drawnThisTurn（通常ドロー済みフラグ）
     onDraw イベント（player と枚数だけを運ぶ）
     FX_DECK_TO_HAND（サーチ）
     P1 ChoiceRequest / P3 の uid 思想

   今回足りないので足すもの:
     1. 引いたカードの identity（uid）を運ぶイベント
     2. 通常ドローと効果ドローの区別
     3. デッキから手札に加わった時（サーチ）のイベント
     4. 「直前のドロー」を解決中に参照するための一時記録

   ■ Replay 安全性
     - state は純JSON。identity は uid。カード名を authority にしない。
     - 直前のドローの記録は1件だけ持ち、次のドローで上書きする。
       無制限の履歴は作らない。
     - 記録は Action の中で作られるので Journal に載り、
       Replay / Undo / Redo / SaveLoad で復元される。
   ========================================================================= */

/* ---- 直前のドローの記録 -------------------------------------------------
   {player, uids:[uid], byEffect, turn, phase}
   「この効果でドローしたカード」を解決中に参照するために使う。         */
function lastDrawV8(gs){
  gs = gs || gameState;
  return (gs && gs.lastDrawV8) ? gs.lastDrawV8 : null;
}
function lastDrawCardsV8(gs){
  const d = lastDrawV8(gs);
  if(!d || !Array.isArray(d.uids)) return [];
  return d.uids.map(u => (typeof findCardByUid === 'function') ? findCardByUid(u) : null)
               .filter(h => h && h.zone === 'hand');
}
/* 直前のドローがそのプレイヤーの効果ドローだったか */
function lastDrawByEffectV8(gs, player){
  const d = lastDrawV8(gs);
  return !!(d && d.byEffect && (player == null || d.player === player));
}

/* ---- ドローイベントの payload ------------------------------------------
   1枚ごとに1イベント。カードの identity は uid で運ぶ。               */
function makeDrawEventV8(o){
  return {
    player: o.player,
    uid: (o.uid != null) ? o.uid : null,
    byEffect: !!o.byEffect,
    phase: o.phase || null,
    /* 通常ドロー＝ドローフェイズに1枚引く手番プレイヤーのドロー */
    normalDraw: !o.byEffect && o.phase === 'draw',
    index: Number(o.index) || 0,
    total: Number(o.total) || 1
  };
}
function makeAddToHandEventV8(o){
  return {
    player: o.player,
    uid: (o.uid != null) ? o.uid : null,
    from: o.from || 'deck',
    reason: o.reason || ''
  };
}

/* ---- DRAW Action から呼ぶ記録＋イベント発火 ---------------------------- */
function recordDrawV8(gs, player, cards, byEffect){
  gs = gs || gameState;
  const list = (cards || []).filter(Boolean);
  list.forEach(c => { if(typeof ensureCardUid === 'function') ensureCardUid(gs, c); });
  gs.lastDrawV8 = {
    player: player,
    uids: list.map(c => (c.uid != null) ? c.uid : null).filter(x => x != null),
    byEffect: !!byEffect,
    turn: Number(gs.turn) || 0,
    phase: gs.phase || null
  };
  return gs.lastDrawV8;
}
function emitDrawEventsV8(gs, player, cards, byEffect){
  if(typeof queueDeferredEventV2 !== 'function') return;
  if(typeof PLAY_MODE === 'undefined' || PLAY_MODE !== PLAY_MODES.DUEL) return;
  const list = (cards || []).filter(Boolean);
  list.forEach((c, i) => {
    queueDeferredEventV2('onDrawCard', makeDrawEventV8({
      player, uid: c.uid, byEffect, phase: gs.phase, index: i, total: list.length}));
  });
}
function emitAddToHandV8(gs, player, card, from, reason){
  if(typeof queueDeferredEventV2 !== 'function') return;
  if(typeof PLAY_MODE === 'undefined' || PLAY_MODE !== PLAY_MODES.DUEL) return;
  if(!card) return;
  if(typeof ensureCardUid === 'function') ensureCardUid(gs, card);
  queueDeferredEventV2('onAddToHand', makeAddToHandEventV8({
    player, uid: card.uid, from, reason}));
}

/* ---- 参照ヘルパ（カードスクリプト用） ---------------------------------- */
/* イベントで引かれたカードの実体（まだ手札にある場合のみ） */
function drawnCardOfV8(evt){
  if(!evt || evt.uid == null) return null;
  const h = (typeof findCardByUid === 'function') ? findCardByUid(evt.uid) : null;
  return (h && h.zone === 'hand') ? h : null;
}
/* そのイベントが「ドローフェイズ以外のドロー」か */
function drawOutsideDrawPhaseV8(evt){
  return !!(evt && evt.phase !== 'draw');
}

/* ---- 直列化検査（テスト用） -------------------------------------------- */
function assertDrawStateSerializableV8(gs){
  gs = gs || gameState;
  const d = gs.lastDrawV8;
  if(d == null) return {ok:true, why:''};
  const bad = [];
  const walk = (v, path, dep) => {
    if(dep > 8 || v === null) return;
    const t = typeof v;
    if(t === 'function' || t === 'symbol'){ bad.push(path + ': ' + t); return; }
    if(t !== 'object') return;
    if(v instanceof Map || v instanceof Set){ bad.push(path + ': ' + v.constructor.name); return; }
    if(v.nodeType != null){ bad.push(path + ': DOM'); return; }
    if(typeof v.then === 'function'){ bad.push(path + ': thenable'); return; }
    if(Array.isArray(v)){ v.forEach((x, i) => walk(x, path + '[' + i + ']', dep + 1)); return; }
    Object.keys(v).forEach(k => walk(v[k], path + '.' + k, dep + 1));
  };
  walk(d, 'lastDrawV8', 0);
  let rt = true;
  try{ JSON.parse(JSON.stringify(d)); }catch(e){ rt = false; bad.push('JSON roundtrip failed'); }
  return {ok: bad.length === 0 && rt, why: bad.join(', ')};
}
