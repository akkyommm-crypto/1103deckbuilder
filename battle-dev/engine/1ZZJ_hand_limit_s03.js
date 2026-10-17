/* =========================================================================
   S03-U273 — Hand size limit (rule) and its modifiers
   -------------------------------------------------------------------------
   Rule: at the end of the turn, a turn player holding more cards than the hand size limit (6) discards down to it. DUEL had no such
   step: processTurnV27 went straight to PASS_TURN, so hands grew without bound.

   - handLimitS03(gs, p): the current limit of player p.
       * 6 by default;
       * player flag effectFlags.handLimitS03 (a number, for the whole duel — ヒエログリフの石版: 7);
       * continuous sources: continuous.handLimitS03(player, card, controller) returning a number (that player's limit — 衰弱の霧: the opponent 5)
         or Infinity (no limit — 無限の手札). Any "no limit" wins; otherwise the smallest number given by a source applies over the flag.
   - processTurnV27 (engine/30) calls handLimitStepS03() first: with an excess it opens a choice for the turn player (min = max = excess),
     re-queues the TURN item, and waits. The answer discards the chosen cards as a rule discard (FX_DISCARD byEffect:false, reason
     手札制限 — not 「効果で捨てられた」), then resumes the processor. The choice and the discards are journaled Actions (Replay).
   ========================================================================= */
const HAND_LIMIT_BASE_S03 = 6;

function handLimitS03(gs, p){
  gs = gs || gameState;
  const P = gs && gs.players && gs.players[p];
  if(!P) return HAND_LIMIT_BASE_S03;
  let limit = HAND_LIMIT_BASE_S03;
  const flag = P.effectFlags && P.effectFlags.handLimitS03;
  if(Number.isFinite(Number(flag)) && Number(flag) > 0) limit = Number(flag);
  let unlimited = false, srcMin = null;
  if(typeof continuousSources === 'function'){
    continuousSources().forEach(src=>{
      const f = src && src.sc && src.sc.continuous && src.sc.continuous.handLimitS03;
      if(typeof f !== 'function') return;
      let v = null;
      try{ v = f(p, src.card, src.p); }catch(e){ v = null; }
      if(v === Infinity){ unlimited = true; return; }
      if(Number.isFinite(Number(v)) && v !== null && Number(v) >= 0) srcMin = (srcMin == null) ? Number(v) : Math.min(srcMin, Number(v));
    });
  }
  if(unlimited) return Infinity;
  return (srcMin != null) ? srcMin : limit;
}

/* Called by processTurnV27 before the turn ends. Returns true when it opened the discard choice (the caller waits). */
function handLimitStepS03(){
  if(typeof PLAY_MODE === 'undefined' || PLAY_MODE !== PLAY_MODES.DUEL) return false;
  if(gameState.loser != null || gameState.pendingChoice) return false;
  const p = gameState.activePlayer, P = gameState.players[p];
  const limit = handLimitS03(gameState, p);
  const excess = (P.hand || []).length - limit;
  if(!(excess > 0)) return false;
  const cands = API.pileCards(p, 'hand');
  const ok = requestChoiceV49({
    player:p, kind:'card', title:`手札制限：手札が${limit}枚になるように${excess}枚捨てる`, candidates:cands, min:excess, max:excess,
    cancelable:false, resume:{handler:'s03.hand-limit-discard', args:{player:p, turn:gameState.turn}}, meta:{scriptName:'手札制限'}
  });
  return !!ok;
}

registerChoiceHandlerV49('s03.hand-limit-discard', (a, x)=>{
  if(!x) return;
  const p = x.player, P = gameState.players[p];
  const uids = ((a && a.cards) || []).filter(y=>y && !y.stale && y.uid != null).map(y=>y.uid);
  /* discard from the highest hand index down, so earlier indexes stay valid */
  const idxs = uids.map(u=>(P.hand||[]).findIndex(c=>c && c.uid === u)).filter(i=>i >= 0).sort((i, j)=>j - i);
  idxs.forEach(i=>act({type:'FX_DISCARD', player:p, handIndex:i, reason:'手札制限', byEffect:false}));
  /* S03-U393: 暗黒界の書物 — face-up Spell / Trap / Field cards with handLimitDiscardS03(player, uids, card) react to the discard */
  if(uids.length){ [].concat(P.sz||[], P.field?[P.field]:[]).forEach(c=>{ if(!c || c.face!=='up' || c.activationPending) return;
    const sc = CARD_SCRIPTS[cardName(c)], f = sc && sc.handLimitDiscardS03; if(typeof f!=='function') return;
    if(typeof effectNegated==='function' && effectNegated(c)) return;
    try{ f(p, uids, c); }catch(e){} }); }
  const w = gameState.processorWaiting;
  if(gameState.processorPaused && w && w.type === PROCESSOR_V27.TURN && w.payload && w.payload.handLimitWaitS03) processorResumeV27();
});
