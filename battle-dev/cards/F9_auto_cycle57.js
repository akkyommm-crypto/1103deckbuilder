/* Codex Auto Cycle 57
   既存 P4 GENEX authority + v17 name override のみ。 */
(function(){
function f9GraveGenex(ctx){
  return API.pileCards(ctx.player,'grave',x=>x.db&&x.db.k==='m'&&isSetCardV4(x.db,SETCODE.GENEX));
}
defineUnifiedCardV4('リサイクル・ジェネクス',[{
  key:'copy-grave-genex-name',
  type:EFFECT_TYPE.IGNITION,
  range:LOCATION.MZONE,
  targetRange:LOCATION.GRAVE,
  targetSide:'self',
  speed:1,
  events:['activate'],
  condition(ctx){
    return ctx.card.face==='up' && f9GraveGenex(ctx).length>0;
  },
  target(ctx,done){
    API.selectCard('リサイクル・ジェネクス：名前を得る墓地のジェネクス',f9GraveGenex(ctx),t=>done([t]));
  },
  operation(ctx){
    const h=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    const self=locateCardAnyV4(ctx.card);
    if(!h||!self||self.zone!=='mz') return;
    API.setCardName(self,API.nameOf(h),'endPhase','リサイクル・ジェネクス');
  },
  afterResolve(){}
}],{type:'monster',priority:1,countLimit:1,timing:['mainPhase'],targets:true});
})();
