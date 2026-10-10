/* =========================================================================
   S03-U145 — 「このカードが〜された時／場合」: is the triggering event about this card?
   -------------------------------------------------------------------------
   The deferred leave-field events (onDestroy / onSendToGrave / onRemove, engine/00 FX_TO_GRAVE and FX_WIPE_ZONE; onBattleDestroy /
   onDestroy / onSendToGrave from BATTLE_CLEANUP) are broadcast to every card: collectHandlers asks each script's passive
   handler, and the battle events' `selfOnly` flag is not read anywhere. A script whose text is about THIS card must therefore
   compare the event's card with itself. Several did not (ダンディライオン, the cards on c1EffectDestroyedGrave …): with two cards
   destroyed at once — or one sent to the GY while such a card already lies there — they activated once per event.
   eventIsSelfS03(ctx): true when the event names this card (evt.uid / evt.card), or when the event carries no card at all
   (then there is nothing to compare and the caller's own checks decide). */
function eventIsSelfS03(ctx){
  if(!ctx || !ctx.card) return false;
  const e = ctx.event || {};
  const u = (e.uid != null) ? e.uid : ((e.card && e.card.uid != null) ? e.card.uid : null);
  if(u == null) return !e.card || e.card === ctx.card;
  return e.card === ctx.card || u === ctx.card.uid;
}
