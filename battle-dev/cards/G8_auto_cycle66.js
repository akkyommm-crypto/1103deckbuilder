/* Codex Auto Cycle 66 — コストなし・1ターンに1度の融合モンスター起動効果。 */
(function(){
defineUnifiedCardV4('E－HERO ライトニング・ゴーレム',[{
  key:'destroy-field-monster',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['activate'],
  condition(){return API.fieldCards({zone:'mz'}).length>0;},
  target(ctx,done){API.selectCard('E－HERO ライトニング・ゴーレム：破壊するモンスター',API.fieldCards({zone:'mz'}),t=>done([t]));},
  operation(ctx){const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);if(t)API.destroy(t,'E－HERO ライトニング・ゴーレム');},afterResolve(){}
}],{type:'fusion',priority:1,countLimit:1,timing:['mainPhase'],targets:true,destroysFieldV46:true});

defineUnifiedCardV4('E・HERO グラン・ネオス',[{
  key:'bounce-opponent-monster',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,
  targetRange:LOCATION.MZONE,targetSide:'opponent',speed:1,events:['activate'],
  condition(ctx){return API.fieldCards({player:ctx.opponent,zone:'mz'}).length>0;},
  target(ctx,done){API.selectCard('E・HERO グラン・ネオス：手札へ戻す相手モンスター',API.fieldCards({player:ctx.opponent,zone:'mz'}),t=>done([t]));},
  operation(ctx){const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);if(t)API.returnToHand(t,'E・HERO グラン・ネオス');},afterResolve(){}
},endPhaseReturnExEffectS03('E・HERO グラン・ネオス')],   /* S03-U174: 「エンドフェイズ時、このカードはエクストラデッキに戻る」 */
{type:'fusion',priority:1,countLimit:{n:1,effects:['bounce-opponent-monster']},timing:['mainPhase'],targets:true,
 passive:{onEndPhase(ctx){return ctx.zone==='mz'&&ctx.card.face==='up';}}});
declareContactFusionS03('E・HERO グラン・ネオス');   /* S03-U174: contact fusion (engine/1ZW) */
})();
