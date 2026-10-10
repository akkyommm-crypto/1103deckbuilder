/* Astra System 01 validation. Historical 1103 card effects, independently written.
   Equipment movement belongs to v31; card predicates/costs/targets live here.
   P1.1 choices persist through save/load; no legacy selection callbacks. */
function as01Face(ctx){const at=ctx.card&&locateCardAnyV4(ctx.card);return !!(at&&at.p===ctx.player&&at.zone==='mz'&&at.card.face==='up');}
function as01SelfEvent(ctx){const e=ctx.event||{};return e.uid===ctx.card.uid||e.card===ctx.card||(e.uids||[]).includes(ctx.card.uid)||(e.cards||[]).includes(ctx.card);}
function as01Dragon(x){return x.db.k==='m'&&x.db.ra==='ドラゴン'&&Number(x.db.lv)<=3&&isSetCardV4(x.db,SETCODE.DRAGUNITY);}
function as01Spell(x){return x.db.k==='s'&&x.db.sub==='装備';}
function as01Pool(ctx,predicate){const self=locateCardAnyV4(ctx.card);return API.pileCards(ctx.player,'grave',x=>predicate(x)&&graveEquipLegalV31(gameState,ctx.player,x,self));}
function as01EquipCondition(ctx,predicate){return as01Face(ctx)&&as01SelfEvent(ctx)&&as01Pool(ctx,predicate).length>0;}
function as01EquipOperation(ctx,predicate){
 const self=ctx.card&&locateCardAnyV4(ctx.card),target=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
 if(!self||self.zone!=='mz'||self.card.face!=='up'||!target||target.zone!=='grave'||target.p!==ctx.player||!predicate({card:target.card,db:dbOf(target.card)}))return;
 API.equipFromGrave(ctx.player,target,self,cardName(ctx.card),ctx.card.uid,ctx.chainId);
}
function as01EquipChoice(ctx,d,predicate){
 p11cOpen(d,{title:d.name+'：墓地から装備するカード',candidates:as01Pool(ctx,predicate),targeting:true},'p11cards.commit-targets',{mode:'equip'});
}
function as01EquipEffect(events,predicate,extra){return Object.assign({key:'equip',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,events,categories:{destroy:false},
 condition(ctx){return as01EquipCondition(ctx,predicate);},operation(ctx){as01EquipOperation(ctx,predicate);},afterResolve(){}},extra||{});}

defineUnifiedCardV4('ドラグニティ－ドゥクス',[as01EquipEffect(['onNormalSummon'],as01Dragon)],{
 type:'monster',priority:1,targets:true,
 activationV11(ctx,d){as01EquipChoice(ctx,d,as01Dragon);},
 passive:{onNormalSummon(ctx){return as01EquipCondition(ctx,as01Dragon);}},
 continuous:{from:['mz'],scope:'self',apply(card){const at=locateCardAnyV4(card);return {atk:at?200*API.fieldCards({player:at.p,filter:x=>x.card.face==='up'&&isSetCardV4(x.db,SETCODE.DRAGUNITY)}).length:0};}}
});
defineUnifiedCardV4('ザ・キックマン',[as01EquipEffect(['onSpecialSummon'],as01Spell)],{
 type:'monster',priority:1,targets:true,
 activationV11(ctx,d){as01EquipChoice(ctx,d,as01Spell);},
 passive:{onSpecialSummon(ctx){return as01EquipCondition(ctx,as01Spell);}}
});
defineUnifiedCardV4('凶悪犯－チョップマン',[as01EquipEffect(['onFlip'],as01Spell,{condition(ctx){return !!(ctx.event&&ctx.event.flipSummon)&&as01EquipCondition(ctx,as01Spell);}})],{
 type:'monster',priority:1,targets:true,
 activationV11(ctx,d){as01EquipChoice(ctx,d,as01Spell);},
 passive:{onFlip(ctx){return !!(ctx.event&&ctx.event.flipSummon)&&as01EquipCondition(ctx,as01Spell);}}
});

function as01TruckVictim(ctx){
 if(!as01Face(ctx))return null;
 const b=ctx.battle||battleContextV28();if(!b)return null;
 let victim=null;
 if(b.atkCard===ctx.card&&b.destroyedDef&&!b.destroyedAtk)victim=b.defCard;
 if(b.defCard===ctx.card&&b.destroyedAtk&&!b.destroyedDef)victim=b.atkCard;
 const at=victim&&locateCardAnyV4(victim);
 return at&&at.zone==='grave'&&dbOf(at.card).k==='m'?at:null;
}
defineUnifiedCardV4('トラックロイド',[{key:'absorb',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,events:['onDamageStep'],categories:{destroy:false},
 condition(ctx){return ctx.step==='leave'&&!!as01TruckVictim(ctx);},
 operation(ctx){const target=ctx.event&&findCardByUid(ctx.event.absorbedUid),self=ctx.card&&locateCardAnyV4(ctx.card);
   if(self&&self.zone==='mz'&&self.card.face==='up'&&target&&target.zone==='grave')API.equipFromGrave(ctx.player,target,self,'トラックロイド',ctx.card.uid,ctx.chainId);},afterResolve(){}
}],{type:'monster',priority:1,forced:true,targets:false,dsTiming:'leave',
 activationV11(ctx,d){const target=as01TruckVictim(ctx);if(!target)return p11cAbort(d);d.event.absorbedUid=target.card.uid;p11cCommit(d,[],'absorb');},
 passive:{onDamageStep(ctx){return ctx.step==='leave'&&!!as01TruckVictim(ctx);}},
 continuous:{from:['mz'],scope:'self',apply(card){return {atk:equipsOnV15(card,gameState).filter(x=>x.card.v46MonsterEquip&&x.card.equipTo&&x.card.equipTo.sourceUid===card.uid).reduce((sum,x)=>sum+(Number(x.db.atk)||0),0)};}}
});

/* Vajrayana is deliberately not partially registered. Its own ATK-doubling
   effect needs a separate stat-lifetime audit (existing setAtk is before
   ongoing additions; simply setting current ATK*2 double-counts modifiers).
   Grave-equipping is now available, but that alone is not a complete card. */

function as01LegionCost(ctx){return API.fieldCards({player:ctx.player,zone:'sz',filter:x=>x.card.face==='up'&&isSetCardV4(x.db,SETCODE.DRAGUNITY)});}
function as01LegionTargets(ctx){return API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'});}
API.registerChoiceHandler('astra01.legion-cost',(answer,args)=>{
 const d=args.activation,cost=p11cCards(answer)[0],eq=cost&&findCardByUid(cost.uid);
 if(answer.cancelled||!eq||eq.p!==d.player||eq.zone!=='sz'||eq.card.face!=='up'||!isSetCardV4(dbOf(eq.card),SETCODE.DRAGUNITY))return p11cAbort(d);
 API.recordActivationCost(p11cCtx(d.player),'send',[eq],[],1);API.sendToGrave(eq,d.name+'（コスト）');
 p11cOpen(d,{title:d.name+'：破壊する相手モンスター',candidates:as01LegionTargets(p11cCtx(d.player)),targeting:true,cancelable:false},'p11cards.commit-targets',{mode:'destroy'});
});
defineUnifiedCardV4('ドラグニティ－レギオン',[
 as01EquipEffect(['onNormalSummon'],as01Dragon),
 {key:'destroy',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,events:['activate'],categories:{destroy:true},
 condition(ctx){return as01Face(ctx)&&as01LegionCost(ctx).length>0&&as01LegionTargets(ctx).length>0;},
 operation(ctx){const target=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);if(target&&target.p===ctx.opponent&&target.zone==='mz'&&target.card.face==='up')API.destroy(target,'ドラグニティ－レギオン');},afterResolve(){}}
],{type:'monster',priority:1,targets:true,timing:['mainPhase','normalSummon'],
 activationV11(ctx,d){if(ctx.eventName==='onNormalSummon')as01EquipChoice(ctx,d,as01Dragon);
   else p11cOpen(d,{title:d.name+'：墓地へ送るドラグニティ',candidates:as01LegionCost(ctx),targeting:false},'astra01.legion-cost',{});},
 passive:{onNormalSummon(ctx){return as01EquipCondition(ctx,as01Dragon);}}
});
