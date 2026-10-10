/* S03-U290: grouped Deck-to-GY / discard events (engine/1ZZN onMillBatchS03 / onDiscardBatchS03) — パラライズ・チェーン, 魔力の棘 (2011 texts).
   One summary per player for the cards that moved together, with the count and the provenance stamped on the move (cost / effect / rule). */

/* ---- パラライズ・チェーン (Continuous Trap): カードの効果によって相手のデッキからカードが墓地へ送られる度に、相手ライフに300ポイントダメージを与える。 ----
   Forced, once per group of cards sent together (300, not 300 per card). Any card's effect (either player's, the opponent's own included); a cost is not
   a card effect. Not while this card is still being activated (activationPending). */
function paralyzeReadyS290(ctx){
  if(ctx.zone!=='sz' || !ctx.card || ctx.card.face!=='up' || cardBeingActivatedS03(ctx.card)) return false;
  const e = ctx.event || {};
  return ctx.eventName==='onMillBatchS03' && e.player===ctx.opponent && Number(e.count)>0 && eventSummaryByEffectS03(e);
}
defineUnifiedCardV4('パラライズ・チェーン', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(){ return true; }, operation(){}, afterResolve(){}
},{
  key:'mill-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onMillBatchS03'], forced:true,
  condition(ctx){ return paralyzeReadyS290(ctx); },
  operation(ctx){ API.damageLP(ctx.opponent, 300); },
  afterResolve(){}
}], {type:'trap', subtype:'永続', priority:2, timing:['free'],
     passive:{ onMillBatchS03:ctx=>paralyzeReadyS290(ctx) }});

/* ---- 魔力の棘 (Continuous Trap): 相手の手札が墓地へ捨てられた時、捨てたカードの数×500ポイントダメージを相手ライフに与える。 ----
   Forced, once per group of the opponent's cards discarded together (a cost, an effect or the hand-size rule: 「捨てられた時」 names no cause);
   the damage is 500 × the number of cards in that group (the count fixed when it triggers). */
function thornReadyS290(ctx){
  if(ctx.zone!=='sz' || !ctx.card || ctx.card.face!=='up' || cardBeingActivatedS03(ctx.card)) return false;
  const e = ctx.event || {};
  return ctx.eventName==='onDiscardBatchS03' && e.player===ctx.opponent && Number(e.count)>0;
}
defineUnifiedCardV4('魔力の棘', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(){ return true; }, operation(){}, afterResolve(){}
},{
  key:'discard-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDiscardBatchS03'], forced:true,
  condition(ctx){ return thornReadyS290(ctx); },
  operation(ctx){ const n = Math.max(0, Number((ctx.event||{}).count)||0); if(n) API.damageLP(ctx.opponent, 500*n); },
  afterResolve(){}
}], {type:'trap', subtype:'永続', priority:2, timing:['free'],
     passive:{ onDiscardBatchS03:ctx=>thornReadyS290(ctx) }});
