/* S03-U544 ヴァイロン・ポリトープ.
 WIKI-C30715479B04 (2011-04-29): face-down monster-Equips cannot be selected.
 WIKI-6B66E303623E (2011-05-12): a target that cannot be summoned at resolution goes to the GY.
 Existing P4 group, multi-target P1 choice, v46 unequip/SS and banishWhenLeavesField only. */
function u544VylonEquipsS03(ctx){
  return API.fieldCards({player:ctx.player,zone:'sz',filter:x=>x.card.face==='up'
    && x.db.k==='m' && x.card.v46MonsterEquip===true && !!x.card.equipTo
    && isCardInGroupV4(x.card,GROUP.VYLON)});
}
EQUIP_TARGET_POOLS_U542.vylon=u544VylonEquipsS03;
defineUnifiedCardV4('ヴァイロン・ポリトープ',[{
  key:'summon-equips',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.HAND|LOCATION.SZONE,speed:2,events:['activate'],
  targetRange:LOCATION.SZONE,targetSide:'self',
  condition(ctx){ return hasMonsterZoneSpace(ctx.player) && !v46GlobalSpecialSummonRestrictionReason(ctx.player) && u542TargetCountsS03(ctx,u544VylonEquipsS03(ctx),ZONE_LIMITS.mz-gameState.players[ctx.player].mz.length).length>0; },
  operation(ctx){
    (ctx.selectedTargets||[]).forEach(t=>{
      const eq=t && resolveTarget(t);
      if(!eq || !u544VylonEquipsS03(ctx).some(x=>x.card===eq.card)) return;
      const uid=eq.card.uid;
      if(hasMonsterZoneSpace(ctx.player)){
        API.unequip(eq,'ヴァイロン・ポリトープ');
        const now=findCardByUid(uid);
        if(now && now.zone==='sz') API.specialSummon(ctx.player,'sz',now.index,'def','ヴァイロン・ポリトープ');
      }
      const summoned=findCardByUid(uid);
      if(summoned && summoned.zone==='mz') API.setCardFlag(summoned,'banishWhenLeavesField',true,'ヴァイロン・ポリトープ',{silent:true});
      else if(summoned && summoned.zone==='sz') API.sendToGrave(summoned,'ヴァイロン・ポリトープ（特殊召喚できない）');
    });
  },afterResolve(){}
}],{type:'spell',priority:2,targets:true,includesSpecialSummon:true,targetCountRange:[1,5],
  activationV11(ctx,d){u542EquipActivationS03(ctx,d,'vylon',ZONE_LIMITS.mz-gameState.players[ctx.player].mz.length);}});
