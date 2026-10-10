/* Auto cycle 53 — existing Scheduler + StatModifier monster pickup.
   Engine changes: none. New primitive: none. */

defineUnifiedCardV4('疫病狼',[{
  key:'double-original-atk',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,events:['activate'],
  condition(ctx){return ctx.zone==='mz'&&ctx.card.face==='up';},
  operation(ctx){
    const h=locateCardAnyV4(ctx.card);
    if(!h) return;
    const original=Math.max(0,dbOf(ctx.card).atk||0);
    v4RegisterStatModifier(h,{setAtk:original*2},{controller:ctx.player,code:'疫病狼',targetCard:ctx.card,resetMask:RESET.END|RESET.LEAVE|RESET.FACE_DOWN});
    ensureCardUid(gameState,ctx.card);
    API.schedule({at:'endPhase',turns:0,player:ctx.player,handler:'v7.destroyUid',
      args:{uid:ctx.card.uid,reason:'疫病狼'},source:ctx.card,sourceZone:'mz',note:'疫病狼'});
  },afterResolve(){}
}],{type:'monster',priority:1,countLimit:1,timing:['mainPhase']});
