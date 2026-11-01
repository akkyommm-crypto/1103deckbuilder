/* S03-U467: 二重の落とし穴.
   When an own Gemini monster that was treated as Gemini Summoned is destroyed
   by battle, this Normal Trap destroys every monster on the opponent's field. */
function u467GeminiBattleVictim(ctx){
  const e=ctx.event||{};
  if(e.uid==null) return null;
  const h=findCardByUid(e.uid);
  if(!h || h.zone!=='grave' || !h.card || !isGeminiS03(h.card)) return null;
  const g=h.card.graveInfo;
  if(!g || g.from!=='mz' || !g.byDestroy || !g.battle || g.geminiActiveS03!==true) return null;
  if(Number(g.turn)!==Number(gameState.turn) || Number(g.ctrlS03)!==Number(ctx.player)) return null;
  return h;
}
function u467CanTrigger(ctx){
  if(ctx.zone!=='sz' || !u467GeminiBattleVictim(ctx)) return false;
  return API.fieldCards({player:ctx.opponent,zone:'mz'}).length>0;
}
defineUnifiedCardV4('二重の落とし穴',[{
  key:'gemini-battle-wipe',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,
  speed:2,events:['onSendToGrave'],targetRange:LOCATION.MZONE,targetSide:'opponent',
  condition(ctx){return u467CanTrigger(ctx);},
  operation(ctx){
    API.fieldCards({player:ctx.opponent,zone:'mz'}).slice().forEach(h=>{
      const live=findCardByUid(h.card.uid);
      if(live&&live.p===ctx.opponent&&live.zone==='mz') API.destroy(live,'二重の落とし穴');
    });
  },
  afterResolve(){}
}],{type:'trap',priority:2,destroysFieldV46:true,
  passive:{onSendToGrave(ctx){return u467CanTrigger(ctx);}}});
