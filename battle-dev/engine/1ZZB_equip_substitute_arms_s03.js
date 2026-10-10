/* =========================================================================
   S03-U183 — equip-spell mechanics for the 剣闘獣の闘器 cards
   -------------------------------------------------------------------------
   1. 「装備モンスターが破壊される場合、代わりにこのカードを破壊する」 (mandatory; 剣闘獣の闘器デーモンズシールド): an equip spell that
      declares equipSubstituteS03:true. Decided inside the destruction reducers (FX_TO_GRAVE / FX_WIPE_ZONE / BATTLE_CLEANUP), so Replay
      reproduces it: when the equipped monster would be destroyed, the face-up, not-negated equip is destroyed instead (graveInfo
      byDestroy, onDestroy / onSendToGrave queued) and the monster stays.
   2. 「装備モンスターが自分フィールド上からデッキに戻る事によってこのカードが墓地へ送られた時」: dropEquips(P, card, gs, 'deck') (the
      FX_RETURN_DECK reducer) marks each equip sent to the GY by that rule with graveInfo.hostToDeckS03 when the monster returned from
      the equip controller's own field. armsReturnTriggerS03(ctx) recognises the matching onSendToGrave event this turn.
   ========================================================================= */
function equipSubstituteDestroyS03(gs, monster){
  if(!monster || !Array.isArray(monster.equippedBy) || !monster.equippedBy.length) return false;
  for(let pi=0; pi<(gs.players||[]).length; pi++){
    const PP = gs.players[pi];
    for(let i=0; i<(PP.sz||[]).length; i++){
      const eq = PP.sz[i];
      if(!eq || eq.face!=='up' || eq.equipUid==null || monster.equippedBy.indexOf(eq.equipUid)<0) continue;
      const sc = (typeof CARD_SCRIPTS!=='undefined') ? CARD_SCRIPTS[cardName(eq)] : null;
      if(!sc || sc.equipSubstituteS03!==true) continue;
      if(typeof effectNegated==='function' && effectNegated(eq)) continue;
      PP.sz.splice(i, 1);
      monster.equippedBy = monster.equippedBy.filter(u=>u!==eq.equipUid);
      const owner = cardOwnerIndex(gs, eq, pi);
      pushZone(gs.players[owner].grave, eq);
      const put = gs.players[owner].grave[gs.players[owner].grave.length-1];
      if(put) put.graveInfo = {turn:gs.turn, from:'sz', byDestroy:true, byPlayer:null, face:'up', pos:null, equipSubstituteS03:true};
      logIt(gs, `${cardName(eq)}：${cardName(monster)} の代わりに破壊`);
      if(typeof queueDeferredEventV2==='function' && typeof PLAY_MODE!=='undefined' && PLAY_MODE===PLAY_MODES.DUEL && put){
        queueDeferredEventV2('onDestroy', {player:owner, card:put, reason:'effect', byPlayer:null});
        queueDeferredEventV2('onSendToGrave', {uid:put.uid, player:owner, fromPlayer:pi, from:'sz', reason:'destroy', byPlayer:null});
      }
      return true;
    }
  }
  return false;
}
/* 闘器: 「装備モンスターが自分フィールド上からデッキに戻る事によってこのカードが墓地へ送られた時、このカードを手札に戻す」 */
function armsReturnTriggerS03(ctx){
  const e = ctx.event || {};
  const g = ctx.card && ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.hostToDeckS03===true && g.turn===gameState.turn;
}
