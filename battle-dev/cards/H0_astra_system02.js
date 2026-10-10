/* Astra System 02: continuous attack-count consumers.
   The attack allowance is read by attackLimitV48 while the equip source is
   currently active; it is never converted into a temporary turn grant. */
function as02FaceUpMonsterTarget(x){return x.db.k==='m'&&x.card.face==='up';}
function as02TryceCost(ctx){
  const self=locateCardAnyV4(ctx.card);
  return API.pileCards(ctx.player,'hand',x=>x.card!==ctx.card&&(!self||x.card.uid!==ctx.card.uid));
}
function as02TryceTargets(ctx){
  return API.fieldCards({zone:'mz',filter:as02FaceUpMonsterTarget});
}
API.registerChoiceHandler('astra02.tryce-cost',(answer,args)=>{
  const d=args.activation,cost=p11cCards(answer)[0],hit=cost&&findCardByUid(cost.uid);
  if(answer.cancelled||!hit||hit.p!==d.player||hit.zone!=='hand')return p11cAbort(d);
  const source=findCardByUid(d.uid);
  if(!source||source.p!==d.player||source.zone!=='sz'||hit.card===source.card)return p11cAbort(d);
  API.recordActivationCost(p11cCtx(d.player),'send',[hit],[],1);
  API.sendHandToGrave(d.player,hit.index,d.name+'（コスト）');
  const ctx=p11cCtx(d.player);
  p11cOpen(d,{title:d.name+'：装備する表側モンスター',candidates:as02TryceTargets(ctx),targeting:true,cancelable:false},'p11cards.commit-targets',{mode:'equip'});
});

defineScript('ドラグニティ－ブランディストック',{
  type:'monster',priority:1,
  continuous:{from:['sz'],scope:'equippedMonster',
    grantsAttackLimit(){return 2;}
  }
});

defineUnifiedCardV4('閃光の双剣－トライス',[{key:'equip',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,events:['activate'],categories:{destroy:false},
  condition(ctx){return as02TryceCost(ctx).length>0&&as02TryceTargets(ctx).length>0;},
  operation(ctx){
    const source=ctx.card&&locateCardAnyV4(ctx.card),target=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(source&&source.zone==='sz'&&target&&target.zone==='mz'&&target.card.face==='up')API.equipSpell(source,target,'閃光の双剣－トライス');
  },afterResolve(){}
}],{type:'spell',priority:1,targets:true,timing:['mainPhase'],
  activationV11(ctx,d){p11cOpen(d,{title:d.name+'：墓地へ送る手札',candidates:as02TryceCost(ctx),targeting:false},'astra02.tryce-cost',{});},
  continuous:{from:['sz'],scope:'equippedMonster',
    apply(){return {atk:-500};},
    grantsAttackLimit(){return 2;}
  }
});
