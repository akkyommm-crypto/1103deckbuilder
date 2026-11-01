/* S03-U464: 進化の繭.
   The hand monster becomes a real monster-Equip on a face-up Petit Moth.
   Its continuous modifier derives the host's ATK/DEF from Cocoon's printed
   values, so removing or disabling the Equip immediately removes the effect. */
function u464PetitMoths(p){
  return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && sameCanonicalCardV4(x.db, dbOf({id:findCardIndex('プチモス')}))});
}
defineUnifiedCardV4('進化の繭', [{
  key:'equip-from-hand', type:EFFECT_TYPE.IGNITION, range:LOCATION.HAND,
  targetRange:LOCATION.MZONE, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='hand'){ ctx.reason='手札から発動します'; return false; }
    if(API.me(ctx).sz.length>=ZONE_LIMITS.sz){ ctx.reason='魔法・罠ゾーンが一杯です'; return false; }
    if(!u464PetitMoths(ctx.player).length){ ctx.reason='表側表示の「プチモス」がいません'; return false; }
    return true;
  },
  target(ctx,done){ API.selectCard('進化の繭：装備する「プチモス」',u464PetitMoths(ctx.player),t=>done([t])); },
  operation(ctx){
    const source=locateCardAnyV4(ctx.card), target=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(!source || source.zone!=='hand' || !target || target.zone!=='mz' || target.p!==ctx.player || target.card.face!=='up') return;
    if(!sameCanonicalCardV4(dbOf(target.card),dbOf({id:findCardIndex('プチモス')}))) return;
    API.equipMonsterFromHand(ctx.player,source.index,target,'進化の繭');
  },
  afterResolve(){}
}], {type:'monster', priority:1, activateFrom:['hand'], timing:['mainPhase'], targets:true,
  continuous:{ scope:'ownMonsters', from:['sz'], apply(card,self){
    if(!self || self.face!=='up' || self.v46MonsterEquip!==true || !self.equipTo || card.uid!==self.equipTo.uid) return null;
    const d=dbOf(self); return {setAtk:Math.max(0,Number(d.atk)||0),setDef:Math.max(0,Number(d.def)||0)};
  } }
});
