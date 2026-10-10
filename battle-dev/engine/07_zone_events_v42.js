/* =========================================================================
   System v4.2 — zone transition / removed-card event layer
   -------------------------------------------------------------------------
   Centralizes "a card became banished" metadata and event emission so new
   Unified Effects can react to REMOVED without card-name-specific patches.
   ========================================================================= */
function v42MarkBanishInfo(card,before,a){
  if(!card) return;
  card.banishInfo={
    turn:gameState.turn,
    from:(before&&before.zone)||null,
    face:(before&&before.face)||null,
    pos:(before&&before.pos)||null,
    reason:(a&&a.reason)||a&&a.type||'banish',
    byPlayer:(a&&a.byPlayer!=null)?a.byPlayer:null,
  };
}
function v42OnActionApplied(gs,a,before){
  if(!gs||!a||!before||before.uid==null||before.zone==='banish') return;
  const after=findCardByUid(before.uid);
  if(!after||after.zone!=='banish') return;
  v42MarkBanishInfo(after.card,before,a);
  if(typeof PLAY_MODE!=='undefined' && PLAY_MODE===PLAY_MODES.DUEL && typeof queueDeferredEventV2==='function'){
    queueDeferredEventV2('onRemove',{
      player:after.p,card:after.card,fromPlayer:before.player,fromZone:before.zone,
      fromFace:before.face,fromPos:before.pos,reason:(a.reason||a.type),byPlayer:a.byPlayer,
    });
  }
}
function v42WasBanishedThisTurn(card){
  return !!(card&&card.banishInfo&&Number(card.banishInfo.turn)===Number(gameState.turn));
}
function v42WasFaceUpFieldWhenBanished(card){
  const b=card&&card.banishInfo;
  return !!(b&&['mz','sz','field'].includes(b.from)&&b.face==='up');
}
