/* S03-U548: Limiter Break / Z-ONE — existing self-GY events and selections.
 Limiter WIKI-13A9970A6EB9 (2008-10-19): Decree/Jinzo do not negate this GY effect;
 WIKI-BBCC410DBB6D (2009-11-05): only own Speed Warrior; WIKI-607AD34AAFE3
 (2010-07-05): triggers in Damage Step/calculation. WIKI-E6938D59A2A8 / WIKI-AEA00A774890
 concern GY-effect responses and stay on the shared response layer.
 Z-ONE WIKI-32079ACBCD89 (2011-02-24): targets; WIKI-A25E392FB7EB (2011-05-04):
 even a chain-2 destruction triggers after that chain (forced).
 All archive matches, including question text, were read. */
function u548SelfSentS03(ctx){return ctx.zone==='grave' && ctx.eventName==='onSendToGrave' && eventIsSelfS03(ctx);}
function u548SpeedWarriorsS03(ctx){
  return deckTriggerPoolS03('リミッター・ブレイク',{action:'summon',from:['hand','deck','grave'],filter:{name:'スピード・ウォリアー'}},ctx.player);
}
defineUnifiedCardV4('リミッター・ブレイク',[{
  key:'grave-summon',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,speed:1,events:['onSendToGrave'],forced:true,
  condition(ctx){return u548SelfSentS03(ctx);},
  operation(ctx){
    if(!hasMonsterZoneSpace(ctx.player) || v46GlobalSpecialSummonRestrictionReason(ctx.player))return;
    const pool=u548SpeedWarriorsS03(ctx);if(!pool.length)return;
    API.selectCard('リミッター・ブレイク：特殊召喚するスピード・ウォリアー',pool,t=>{
      const picked=t && resolveTarget(t);if(!picked || !u548SpeedWarriorsS03(ctx).some(x=>x.card===picked.card))return;
      specialSummonPositionsS03(ctx.player,[{uid:picked.card.uid,from:picked.zone}],'リミッター・ブレイク');
    });
  },afterResolve(){}
}],{type:'trap',priority:1,activateFrom:['grave'],timing:['free'],includesSpecialSummon:true,blocksIfNoSpecialSummon:false});
function u548ZoneSetDestroyedS03(ctx){return u548SelfSentS03(ctx) && e8DestroyedToGrave(ctx,'sz') && ctx.card.graveInfo.face==='down';}
function u548RecoverSpellsS03(ctx){return API.pileCards(ctx.player,'grave',x=>x.db.k==='s' && (x.db.sub==='永続'||x.db.sub==='フィールド'));}
defineUnifiedCardV4('Z－ONE',[{
  key:'destroyed-recover',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,speed:1,events:['onSendToGrave'],forced:true,
  targetRange:LOCATION.GRAVE,targetSide:'self',
  condition(ctx){return u548ZoneSetDestroyedS03(ctx) && u548RecoverSpellsS03(ctx).length>0;},
  target(ctx,done){API.selectCard('Z－ONE：手札に加える永続・フィールド魔法',u548RecoverSpellsS03(ctx),t=>done([t]));},
  operation(ctx){const t=ctx.selectedTargets && ctx.selectedTargets[0],picked=t && resolveTarget(t);if(picked && picked.zone==='grave' && picked.p===ctx.player)API.returnToHand(picked,'Z－ONE');},
  afterResolve(){}
}],{type:'spell',priority:1,targets:true,activateFrom:['grave'],timing:['free']});
