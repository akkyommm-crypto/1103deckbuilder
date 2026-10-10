/* =========================================================================
   S03-U152 — 「バトルフェイズを終了する」 (an effect ends the Battle Phase)
   -------------------------------------------------------------------------
   Before this unit the cards used three different things, and none was the rule:
   - endBattle() (engine/60) ends only the CURRENT battle — 攻撃の無力化, 強制終了, ナチュル・スティンクバグ used it, so after
     them the turn player could still attack with the other monsters;
   - API.endBattlePhase() wrote BATTLE_PHASE_V6 'endNow' (battlePhaseV6.endedTurn, read nowhere) and cleared the battle, but the
     phase stayed 'battle' — ハーフorストップ's 「バトルフェイズを終了する」 did nothing more than that;
   - v350EndBattlePhase() (バトルフェーダー, 薄幸の美少女) wrote SET_PHASE main2 directly, skipping the end of the Battle Phase
     (BATTLE_PHASE_V6 'finish', 'battlePhaseEnd' schedules, onBattlePhaseEnd triggers);
   - 速攻のかかし only left a manual note.
   ■ endBattlePhaseByEffectS03(reason): the pending attack is cleared (Action), the current battle ends, BATTLE_PHASE_V6 'endNow'
     marks this turn's Battle Phase as ended (no attack can be declared any more — canDeclareAttackV48), and in DUEL the normal
     transition to Main Phase 2 is queued (processPhaseV27 with byEffectS03: no must-attack confirmation, the usual end of the
     Battle Phase). Outside DUEL the phase is set directly as before. */
function battlePhaseEndedByEffectS03(gs){
  gs = gs || gameState;
  const st = gs && gs.battlePhaseV6;
  return !!(st && st.endedTurn!=null && st.endedTurn===gs.turn && gs.phase==='battle');
}
function endBattlePhaseByEffectS03(reason){
  if(typeof gameState==='undefined' || !gameState || gameState.phase!=='battle') return false;
  if(gameState.pendingAttack || gameState.attackNegated) act({type:'ATTACK_PENDING_CLEAR_S03', reason:'endBattlePhase'});
  act({type:'BATTLE_PHASE_V6', player:gameState.activePlayer, mode:'endNow'});
  gameState.battle = null; gameState.timingWindow = null;
  if(typeof battleCommandResetV29==='function') battleCommandResetV29();
  logIt(gameState, `${reason||'効果'}：バトルフェイズを終了する`);
  if(typeof PLAY_MODE!=='undefined' && PLAY_MODE===PLAY_MODES.DUEL && typeof enqueueProcessorV27==='function'){
    enqueueProcessorV27(PROCESSOR_V27.PHASE, {to:'main2', force:true, byEffectS03:true});
  }else{
    act({type:'SET_PHASE', phase:'main2'});
  }
  return true;
}

/* S03-U153: 「このターン、相手モンスターの攻撃を1度だけ無効にする」 (ネクロ・ガードナー) activated when no attack is going on: the next
   attack declared by that player this turn is negated at its declaration (NEGATE_ATTACK_V45, journaled) and the mark is used up.
   The mark is u153NecroTurn on the banished ネクロ・ガードナー of the defending player. Called by processAttackV27 right after
   ATTACK_DECLARE_V48. */
function pendingAttackNegatorsS03(attackingPlayer){
  if(typeof gameState==='undefined' || !gameState || !gameState.pendingAttack) return false;
  const def = attackingPlayer===0 ? 1 : 0;
  const pile = gameState.players[def].banish || [];
  for(let i=0;i<pile.length;i++){
    const c = pile[i];
    if(!c || Number(c.u153NecroTurn)!==gameState.turn) continue;
    act({type:'FX_CARD_FLAG_V46', player:def, zone:'banish', index:i, flag:'u153NecroTurn', value:0, reason:'ネクロ・ガードナー', silent:true});
    act({type:'NEGATE_ATTACK_V45', attackerUid:gameState.pendingAttack.attackerUid, reason:'ネクロ・ガードナー'});
    return true;
  }
  return false;
}
