/* S03-U293: monsters sent from the field to the GY together (engine/1ZZN onFieldToGraveBatchS03, also in the battle cleanup batch) — 死の演算盤, バックファイア.
   One summary per group of monsters that went to the GY at the same time, with each card's owner, controller on the field, destruction, face and Attribute
   (graveInfo written by the move: last known information). Tokens never reach the GY and are not counted. */

/* ---- 死の演算盤 (Continuous Trap): フィールド上に存在するモンスターが墓地へ送られる度に、そのモンスターの持ち主は1枚につき500ポイントダメージを受ける。 ----
   Forced, once per group: each owner takes 500 × the number of its monsters in the group (both players at once when both lost monsters). Any cause:
   destruction, battle, Tribute, Synchro material, an effect that sends to the GY. Not while this card is being activated. */
function calcReadyS293(ctx){
  if(ctx.zone!=='sz' || !ctx.card || ctx.card.face!=='up' || cardBeingActivatedS03(ctx.card)) return false;
  const e = ctx.event || {};
  return ctx.eventName==='onFieldToGraveBatchS03' && Number(e.count)>0;
}
defineUnifiedCardV4('死の演算盤', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(){ return true; }, operation(){}, afterResolve(){}
},{
  key:'grave-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onFieldToGraveBatchS03'], forced:true,
  condition(ctx){ return calcReadyS293(ctx); },
  operation(ctx){
    const e = ctx.event || {};
    [0, 1].forEach(p=>{ const n = Math.max(0, Number(e['count' + p])||0); if(n) API.damageLP(p, 500*n); });
  },
  afterResolve(){}
}], {type:'trap', subtype:'永続', priority:2, timing:['free'],
     passive:{ onFieldToGraveBatchS03:ctx=>calcReadyS293(ctx) }});

/* ---- バックファイア (Continuous Trap): 自分フィールド上に表側表示で存在する炎属性モンスターが破壊され墓地へ送られる度に、相手ライフに500ポイントダメージを与える。 ----
   Forced, once per group (500, not per monster): at least one monster of the group was a face-up FIRE monster on this card's controller's field, and
   was destroyed (by battle or by an effect) and sent to the GY. The face and Attribute are those on the field. */
function backfireReadyS293(ctx){
  if(ctx.zone!=='sz' || !ctx.card || ctx.card.face!=='up' || cardBeingActivatedS03(ctx.card)) return false;
  const e = ctx.event || {};
  if(ctx.eventName!=='onFieldToGraveBatchS03' || !Array.isArray(e.items)) return false;
  return e.items.some(x=>x && x.ctrl===ctx.player && x.byDestroy && x.face==='up' && x.attr==='炎');
}
defineUnifiedCardV4('バックファイア', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(){ return true; }, operation(){}, afterResolve(){}
},{
  key:'fire-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onFieldToGraveBatchS03'], forced:true,
  condition(ctx){ return backfireReadyS293(ctx); },
  operation(ctx){ API.damageLP(ctx.opponent, 500); },
  afterResolve(){}
}], {type:'trap', subtype:'永続', priority:2, timing:['free'],
     passive:{ onFieldToGraveBatchS03:ctx=>backfireReadyS293(ctx) }});
