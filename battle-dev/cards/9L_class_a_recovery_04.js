/* Existing-engine Class A recovery — sub-batch 4.
   Card scripts only: P1/P1.1, P3, P4, v14, v15, v17, v18, v20 and v21. */

function ca4Own(ctx,pred){return API.fieldCards({player:ctx.player,zone:'mz',filter:x=>!pred||pred(x)});}
function ca4Foe(ctx,pred){return API.fieldCards({player:ctx.opponent,filter:x=>!pred||pred(x)});}
function ca4TributeProvenance(ctx){
  const p=API.summonProvenance(ctx.card);
  return ctx.zone==='mz'&&ctx.event&&ctx.event.card===ctx.card&&p&&p.summonType==='tribute'&&Array.isArray(p.materialSnapshots)?p:null;
}
function ca4MaterialHas(ctx,pred){const p=ca4TributeProvenance(ctx);return !!(p&&p.materialSnapshots.some(pred));}
function ca4InGroupSnapshot(s,g){return !!(s&&s.code!=null&&isCardInGroupV4(s.code,g));}
function ca4InSetSnapshot(s,setcode){const d=s&&s.code!=null?CARD_DB.find(x=>x&&Number(x.c)===Number(s.code)):null;return !!(d&&isSetCardV4(d,setcode));}
function ca4CommitOne(answer,args){
  if(answer.cancelled||p11cCards(answer).length!==1)return p11cAbort(args.activation);
  p11cCommit(args.activation,p11cCards(answer),args.mode||null);
}
function ca4DestroyTargets(ctx){
  (ctx.selectedTargets||[]).forEach(t=>{const h=resolveTarget(t);if(h)API.destroy(h,ctx.script&&ctx.script.name||'カード効果');});
}
function ca4AnchorCosts(ctx){
  const syn=ca4Own(ctx,x=>x.card.face==='up'&&x.db.k==='s');
  return ca4Own(ctx,x=>isSetCardV4(x.db,SETCODE.BLACKWING)&&syn.some(s=>s.card.uid!==x.card.uid));
}

API.registerChoiceHandler('classa4.commit-one',ca4CommitOne);
API.registerChoiceHandler('classa4.commit-many',(answer,args)=>{
  const q=p11cCards(answer);
  if(answer.cancelled||q.length<(args.min||1))return p11cAbort(args.activation);
  p11cCommit(args.activation,q,args.mode||null);
});
API.registerChoiceHandler('classa4.gazas-mode',(answer,args)=>{
  if(answer.cancelled)return p11cAbort(args.activation);
  const mode=String(answer.cards&&answer.cards[0]&&answer.cards[0].value||'');
  if(mode!=='monsters'&&mode!=='spells')return p11cAbort(args.activation);
  p11cCommit(args.activation,[],mode);
});
API.registerChoiceHandler('classa4.madis-cost',(answer,args)=>{
  if(answer.cancelled)return p11cAbort(args.activation);
  API.payCost(args.activation.player,1000,'インヴェルズ・マディス');
  p11cOpen(args.activation,{title:'インヴェルズ・マディス：特殊召喚するインヴェルズ',
    candidates:API.pileCards(args.activation.player,'grave',x=>isSetCardV4(x.db,SETCODE.INVELLZ)),targeting:true,min:1,max:1},
    'classa4.commit-one',{});
});
API.registerChoiceHandler('classa4.mors-cost',(answer,args)=>{
  if(answer.cancelled)return p11cAbort(args.activation);
  API.payCost(args.activation.player,1000,'インヴェルズ・モース');
  const ctx=p11cCtx(args.activation.player);
  p11cOpen(args.activation,{title:'インヴェルズ・モース：手札に戻す相手カード',
    candidates:ca4Foe(ctx),targeting:true,min:1,max:Math.min(2,ca4Foe(ctx).length)},
    'classa4.commit-many',{min:1});
});
API.registerChoiceHandler('classa4.kerubim-cost',(answer,args)=>{
  if(answer.cancelled)return p11cAbort(args.activation);
  const ctx=p11cCtx(args.activation.player);
  if(gameState.players[ctx.player].deck.length<4)return p11cAbort(args.activation);
  API.recordActivationCost(ctx,'deck-mill',[],[],4);
  API.millTop(ctx.player,4,'ライトロード・エンジェル ケルビム（コスト）');
  p11cOpen(args.activation,{title:'ライトロード・エンジェル ケルビム：破壊する相手カード',
    candidates:ca4Foe(ctx),targeting:true,min:1,max:Math.min(2,ca4Foe(ctx).length)},
    'classa4.commit-many',{min:1});
});
API.registerChoiceHandler('classa4.anchor-cost',(answer,args)=>{
  const q=p11cCards(answer);
  if(answer.cancelled||q.length!==1)return p11cAbort(args.activation);
  p11cRecordMove(args.activation,answer,'tribute','tribute',['atk']);
  const ctx=p11cCtx(args.activation.player);
  p11cOpen(args.activation,{title:'BF－アンカー：強化するシンクロモンスター',
    candidates:ca4Own(ctx,x=>x.card.face==='up'&&x.db.k==='s'),targeting:true,min:1,max:1},
    'classa4.commit-one',{});
});

defineScript('アーマロイドガイデンゴー',{type:'monster',priority:1,forced:true,
  condition(ctx){return ca4MaterialHas(ctx,s=>ca4InGroupSnapshot(s,GROUP.ROID));},
  resolve(){API.fieldCards({filter:x=>['sz','field'].includes(x.zone)}).slice().forEach(h=>API.banish(h,'アーマロイドガイデンゴー'));},
  passive:{onNormalSummon(ctx){return !!ca4TributeProvenance(ctx);}}});

defineScript('アーミー・ジェネクス',{type:'monster',priority:1,targets:true,destroysFieldV46:true,
  condition(ctx){return ca4MaterialHas(ctx,s=>ca4InGroupSnapshot(s,'GENEX'))&&ca4Foe(ctx).length>0;},
  activationV11(ctx,d){p11cOpen(d,{title:'アーミー・ジェネクス：破壊する相手カード',candidates:ca4Foe(ctx),targeting:true,min:1,max:1},'classa4.commit-one',{});},
  resolve(ctx){ca4DestroyTargets(ctx);},passive:{onNormalSummon(ctx){return !!ca4TributeProvenance(ctx);}}});

defineScript('インヴェルズ・ガザス',{type:'monster',priority:1,forced:true,destroysFieldV46:true,
  condition(ctx){const p=ca4TributeProvenance(ctx);return !!(p&&p.materialSnapshots.filter(s=>ca4InSetSnapshot(s,SETCODE.INVELLZ)).length>=2);},
  activationV11(ctx,d){API.requestChoice({player:d.player,kind:'option',title:'インヴェルズ・ガザス：破壊する種類',
    candidates:[{key:'monsters',value:'monsters',label:'このカード以外のモンスター'},{key:'spells',value:'spells',label:'魔法・罠'}],
    min:1,max:1,cancelable:false,resume:{handler:'classa4.gazas-mode',args:{activation:d}},meta:{scriptName:d.name}});},
  resolve(ctx){const mode=ctx.chainLink&&ctx.chainLink.v4EffectKey;
    const q=mode==='monsters'?API.fieldCards({zone:'mz',filter:x=>x.card!==ctx.card}):API.fieldCards({filter:x=>['sz','field'].includes(x.zone)});
    q.slice().forEach(h=>API.destroy(h,'インヴェルズ・ガザス'));},passive:{onNormalSummon(ctx){return !!ca4TributeProvenance(ctx);}}});

defineScript('インヴェルズ・マディス',{type:'monster',priority:1,targets:true,includesSpecialSummon:true,blocksIfNoSpecialSummon:true,
  condition(ctx){return ca4MaterialHas(ctx,s=>ca4InSetSnapshot(s,SETCODE.INVELLZ))&&gameState.players[ctx.player].lp>1000&&hasMonsterZoneSpace(ctx.player)&&API.pileCards(ctx.player,'grave',x=>isSetCardV4(x.db,SETCODE.INVELLZ)).length>0;},
  activationV11(ctx,d){API.requestChoice({player:d.player,kind:'option',title:'インヴェルズ・マディス：1000LP払う',candidates:[{key:'pay',value:'pay',label:'1000LP払う'}],min:1,max:1,cancelable:true,resume:{handler:'classa4.madis-cost',args:{activation:d}},meta:{scriptName:d.name}});},
  resolve(ctx){const h=ctx.selectedTargets[0]&&resolveTarget(ctx.selectedTargets[0]);if(h&&h.zone==='grave'&&isSetCardV4(dbOf(h.card),SETCODE.INVELLZ)&&hasMonsterZoneSpace(ctx.player))API.specialSummon(ctx.player,'grave',h.index,'atk','インヴェルズ・マディス');},
  passive:{onNormalSummon(ctx){return !!ca4TributeProvenance(ctx);}}});

defineScript('インヴェルズ・モース',{type:'monster',priority:1,targets:true,
  condition(ctx){return ca4MaterialHas(ctx,s=>ca4InSetSnapshot(s,SETCODE.INVELLZ))&&gameState.players[ctx.player].lp>1000&&ca4Foe(ctx).length>0;},
  activationV11(ctx,d){API.requestChoice({player:d.player,kind:'option',title:'インヴェルズ・モース：1000LP払う',candidates:[{key:'pay',value:'pay',label:'1000LP払う'}],min:1,max:1,cancelable:true,resume:{handler:'classa4.mors-cost',args:{activation:d}},meta:{scriptName:d.name}});},
  resolve(ctx){(ctx.selectedTargets||[]).forEach(t=>{const h=resolveTarget(t);if(h)API.returnToHand(h,'インヴェルズ・モース');});},passive:{onNormalSummon(ctx){return !!ca4TributeProvenance(ctx);}}});

defineScript('タイガードラゴン',{type:'monster',priority:1,targets:true,destroysFieldV46:true,
  condition(ctx){return ca4MaterialHas(ctx,s=>s.race==='ドラゴン')&&API.fieldCards({player:ctx.opponent,filter:x=>['sz','field'].includes(x.zone)&&x.card.face==='down'}).length>0;},
  activationV11(ctx,d){const q=API.fieldCards({player:ctx.opponent,filter:x=>['sz','field'].includes(x.zone)&&x.card.face==='down'});p11cOpen(d,{title:'タイガードラゴン：破壊するセットカード',candidates:q,targeting:true,min:1,max:Math.min(2,q.length)},'classa4.commit-many',{min:1});},
  resolve(ctx){ca4DestroyTargets(ctx);},passive:{onNormalSummon(ctx){return !!ca4TributeProvenance(ctx);}}});

defineScript('ライトロード・エンジェル ケルビム',{type:'monster',priority:1,targets:true,destroysFieldV46:true,
  condition(ctx){return ca4MaterialHas(ctx,s=>ca4InSetSnapshot(s,SETCODE.LIGHTSWORN))&&gameState.players[ctx.player].deck.length>=4&&ca4Foe(ctx).length>0;},
  activationV11(ctx,d){API.requestChoice({player:d.player,kind:'option',title:'ケルビム：デッキの上から4枚を墓地へ送る',candidates:[{key:'mill',value:'mill',label:'4枚送る'}],min:1,max:1,cancelable:true,resume:{handler:'classa4.kerubim-cost',args:{activation:d}},meta:{scriptName:d.name}});},
  resolve(ctx){ca4DestroyTargets(ctx);},passive:{onNormalSummon(ctx){return !!ca4TributeProvenance(ctx);}}});

defineScript('BF－アンカー',{type:'trap',priority:2,targets:true,
  condition(ctx){return ca4AnchorCosts(ctx).length>0;},
  activationV11(ctx,d){p11cOpen(d,{title:'BF－アンカー：リリースするBF',candidates:ca4AnchorCosts(ctx),min:1,max:1},'classa4.anchor-cost',{});},
  resolve(ctx){const h=ctx.selectedTargets[0]&&resolveTarget(ctx.selectedTargets[0]),s=(API.costSnapshots(ctx)||[])[0];if(h&&s&&typeof s.atk==='number')API.modAtk(h,s.atk,0,'endPhase','BF－アンカー');}});

function ca4SwordTop(ctx){const h=locateCardAnyV4(ctx.card);if(h&&h.zone==='grave')API.returnToDeck(h,false,'執念の剣');}
defineUnifiedCardV4('執念の剣',[{
  key:'grave-to-deck-top',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,speed:1,events:['onSendToGrave'],forced:true,
  condition(ctx){return ctx.zone==='grave'&&ctx.event&&ctx.event.card===ctx.card;},
  operation:ca4SwordTop,afterResolve(){}
},{
  key:'equipped-left-to-deck-top',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,speed:1,events:['onLeaveField'],forced:true,
  condition(ctx){return ctx.zone==='grave'&&ctx.event&&ctx.event.uid===ctx.card.uid&&ctx.event.toZone==='grave';},
  operation:ca4SwordTop,afterResolve(){}
}],{type:'spell',subtype:'装備',priority:1,activateFrom:['grave'],equipSpec:{canEquip(h){return h.zone==='mz'&&h.card.face==='up';}},
  continuous:{scope:'equippedMonster',from:['sz'],apply(){return {atk:500,def:500};}},passive:{
    onSendToGrave(ctx){return ctx.zone==='grave'&&ctx.event&&ctx.event.card===ctx.card;},
    onLeaveField(ctx){return ctx.zone==='grave'&&ctx.event&&ctx.event.uid===ctx.card.uid&&ctx.event.toZone==='grave';}}});

defineUnifiedCardV4('守護神の矛',[],{type:'spell',subtype:'装備',priority:1,equipSpec:{canEquip(h){return h.zone==='mz'&&h.card.face==='up';}},
  continuous:{scope:'equippedMonster',from:['sz'],apply(card){
    const ref=overriddenNameDbV17(card)||dbOf(card);let n=0;
    [0,1].forEach(p=>gameState.players[p].grave.forEach(c=>{if(sameCanonicalCardV4(dbOf(c),ref))n++;}));
    return {atk:n*900};}}});
