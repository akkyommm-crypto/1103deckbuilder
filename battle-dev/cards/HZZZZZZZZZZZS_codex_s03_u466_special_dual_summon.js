/* S03-U466: スペシャル・デュアル・サモン.
   The target becomes Gemini Summoned without using a Normal Summon, then the
   same stay on the field returns to its owner's hand at this turn's End Phase.
   u466ReturnTurn is zone-local, so leaving and returning does not inherit the
   delayed return. */
function u466GeminiTargets(p){
  return API.fieldCards({player:p,zone:'mz',filter:x=>x.card&&x.card.face==='up'&&isGeminiS03(x.card)});
}
API.registerScheduleHandler('s03u466.return-gemini',(args)=>{
  const h=args&&args.uid!=null?findCardByUid(args.uid):null;
  if(h&&h.zone==='mz'&&Number(h.card.u466ReturnTurn)===Number(args.turn)) API.returnToHand(h,'スペシャル・デュアル・サモン');
});
defineUnifiedCardV4('スペシャル・デュアル・サモン',[{
  key:'gemini-now-return-end',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'self',speed:2,events:['activate'],
  condition(ctx){return u466GeminiTargets(ctx.player).length>0;},
  target(ctx,done){API.selectCard('スペシャル・デュアル・サモン：再度召喚した状態にするデュアル',u466GeminiTargets(ctx.player),t=>done([t]));},
  operation(ctx){
    const target=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(!target||target.p!==ctx.player||target.zone!=='mz'||target.card.face!=='up'||!isGeminiS03(target.card)) return;
    const uid=ensureCardUid(gameState,target.card),turn=gameState.turn;
    API.setCardFlag(target,'dualUp',true,'スペシャル・デュアル・サモン',{silent:true});
    API.setCardFlag(target,'u466ReturnTurn',turn,'スペシャル・デュアル・サモン',{silent:true});
    API.schedule({at:'endPhase',turns:0,player:ctx.player,handler:'s03u466.return-gemini',args:{uid,turn},note:'スペシャル・デュアル・サモン'});
  },
  afterResolve(){}
}],{type:'spell',priority:2,quickEffect:true,targets:true});
