/* S03-U275: 「デッキから手札に加わった」 (2011 texts) — ワタポン, 強烈なはたき落とし.
   Engine (this unit, engine/00 FX_SEARCH): a search (API.searchDeck) now raises onAddToHand like FX_DECK_TO_HAND did; before, the usual
   searches never reached Deck-to-hand triggers. Event: {player (whose hand), uid, from:'deck', reason}. */

function addedFromDeckS275(ctx){ const e = ctx.event || {}; return e.from === 'deck' && e.uid != null ? e : null; }

/* ---- ワタポン: このカードがカードの効果によって自分のデッキから手札に加わった場合、このカードを手札から特殊召喚できる。 ---- */
function watapoAddedS275(ctx){
  const e = addedFromDeckS275(ctx);
  if(!e || !ctx.card || e.uid !== ctx.card.uid || e.player !== ctx.player) return false;
  const h = locateCardAnyV4(ctx.card);
  return !!h && h.zone === 'hand' && h.p === ctx.player;
}
defineUnifiedCardV4('ワタポン', [{
  key:'added-special', type:EFFECT_TYPE.TRIGGER, range:LOCATION.HAND, speed:1, events:['onAddToHand'],
  condition(ctx){
    if(!watapoAddedS275(ctx)){ ctx.reason = 'カードの効果で自分のデッキから手札に加わった時に発動します'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  operation(ctx){
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone !== 'hand' || h.p !== ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
    specialSummonPositionsS03(ctx.player, [{uid:ctx.card.uid, from:'hand'}], 'ワタポン');   /* face-up Attack or Defense (engine/1ZZK) */
  },
  afterResolve(){}
}], {
  type:'monster', priority:1, activateFrom:['hand'], includesSpecialSummon:true,
  blocksIfNoSpecialSummon(ctx){ return !!ctx && ctx.zone === 'hand'; },
  passive:{ onAddToHand: ctx => watapoAddedS275(ctx) }
});

/* ---- 強烈なはたき落とし (Counter Trap): ①:相手がデッキからカードを手札に加えた時に発動できる。相手は手札に加えたそのカード1枚を捨てる。 ---- */
function knockAddedS275(ctx){
  const e = addedFromDeckS275(ctx);
  if(!e || e.player !== ctx.opponent) return null;
  const h = findCardByUid(e.uid);
  return (h && h.zone === 'hand' && h.p === ctx.opponent) ? e : null;
}
defineScript('強烈なはたき落とし', {
  type:'counter', priority:3,
  condition(ctx){
    if(ctx.eventName !== 'onAddToHand' || !knockAddedS275(ctx)){ ctx.reason = '相手がデッキからカードを手札に加えた時に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const e = ctx.event || {};
    const h = e.uid != null ? findCardByUid(e.uid) : null;
    if(!h || h.zone !== 'hand' || h.p !== ctx.opponent){ API.log('強烈なはたき落とし：そのカードはもう手札にない'); return; }
    API.discard(ctx.opponent, h.index, '強烈なはたき落とし', {byPlayer:ctx.player});
  },
  afterResolve(){},
  passive:{ onAddToHand(ctx){ return ctx.zone === 'sz' && ctx.card.face === 'down' && !!knockAddedS275(ctx); } }
});
