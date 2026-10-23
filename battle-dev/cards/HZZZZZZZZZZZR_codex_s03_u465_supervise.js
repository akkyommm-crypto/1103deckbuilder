/* S03-U465: スーペルヴィス.
   Equip only to a face-up Gemini monster. Its live continuous source treats
   that host as Gemini Summoned; when this face-up Equip is sent from the field
   to the Graveyard, its optional trigger targets and revives a Normal monster
   from its controller's Graveyard. */
function u465SuperviseHosts(){
  return API.fieldCards({zone:'mz',filter:x=>x.card&&x.card.face==='up'&&isGeminiS03(x.card)});
}
function u465SuperviseSent(ctx){
  const e=ctx.event||{},g=ctx.card&&ctx.card.graveInfo;
  return ctx.zone==='grave'&&e.uid===ctx.card.uid&&e.toZone==='grave'&&e.fromFace==='up'
    &&!!g&&(g.from==='sz'||g.from==='field')&&Number(g.turn)===Number(gameState.turn);
}
function u465SuperviseNormals(ctx){
  return API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card&&x.db.k==='m'
    &&treatedAsNormal(x.card)&&canEffectSpecialSummonS03(x.card,'grave','スーペルヴィス'));
}
defineUnifiedCardV4('スーペルヴィス',[{
  key:'equip',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['activate'],
  condition(){return u465SuperviseHosts().length>0;},
  target(ctx,done){API.selectCard('スーペルヴィス：装備するデュアルモンスター',u465SuperviseHosts(),t=>done([t]));},
  operation(ctx){
    const source=locateCardAnyV4(ctx.card),target=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(source&&target&&target.zone==='mz'&&target.card.face==='up'&&isGeminiS03(target.card)) API.equipSpell(source,target,'スーペルヴィス');
  },
  afterResolve(){}
},{
  key:'field-grave-revive-normal',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,
  targetRange:LOCATION.GRAVE,targetSide:'self',speed:1,events:['onLeaveField'],
  condition(ctx){return u465SuperviseSent(ctx)&&hasMonsterZoneSpace(ctx.player)&&u465SuperviseNormals(ctx).length>0;},
  target(ctx,done){API.selectCard('スーペルヴィス：特殊召喚する通常モンスター',u465SuperviseNormals(ctx),t=>done([t]));},
  operation(ctx){
    const target=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(!target||target.zone!=='grave'||target.p!==ctx.player||!treatedAsNormal(target.card)||!hasMonsterZoneSpace(ctx.player)) return;
    specialSummonPositionsS03(ctx.player,[{uid:target.card.uid,from:'grave'}],'スーペルヴィス');
  },
  afterResolve(){}
}],{type:'spell',priority:1,targets:true,activateFrom:['hand','sz','grave'],
  includesSpecialSummon:true,blocksIfNoSpecialSummon(ctx){return ctx&&ctx.zone==='grave';},
  equipSpec:{canEquip(h){return !!(h&&h.card&&h.card.face==='up'&&isGeminiS03(h.card));},label:'デュアルモンスターのみ'},
  passive:{onLeaveField(ctx){return u465SuperviseSent(ctx);}},
  continuous:{scope:'equippedMonster',from:['sz'],treatEquippedAsGeminiSummonedS03:true,apply(){return null;}}
});
