/* P1 ChoiceRequest v4.9.0 recovery mini-batch — 16 ChoiceRequest-only gaps.
   All continuations use stable registry names plus JSON-only arguments. */

function v49P1ChoiceCards(answer){
  return (answer&&answer.cards||[]).filter(x=>x&&!x.stale&&x.card);
}
function v49P1FinishSource(args){
  if(!args||args.sourceUid==null)return;
  const h=findCardByUid(args.sourceUid);
  if(h&&h.zone==='sz')API.sendToGrave(h,args.reason||'効果解決');
}
function v49P1Open(ctx,spec,handler,args,finishSource){
  const candidates=(spec.candidates||[]).slice();
  candidates.forEach(x=>{if(x&&x.card)ensureCardUid(gameState,x.card);});
  if(ctx&&ctx.card)ensureCardUid(gameState,ctx.card);
  const resumeArgs=Object.assign({player:ctx.player,reason:spec.title||'効果'},args||{});
  if(finishSource)resumeArgs.sourceUid=ctx.card&&ctx.card.uid!=null?ctx.card.uid:null;
  const opened=API.requestChoice(Object.assign({},spec,{cancelable:false,resume:{handler,args:resumeArgs},meta:{v4EffectKey:ctx.v4EffectKey||null,scriptName:dbOf(ctx.card).n}}));
  if(!opened&&finishSource)v49P1FinishSource(resumeArgs);
  return opened;
}

API.registerChoiceHandler('p1cards.hand-send-draw',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0],h=picked&&locateCardAnyV4(picked.card);
  if(h&&h.p===args.player&&h.zone==='hand'){
    API.sendHandToGrave(args.player,h.index,args.reason);
    API.draw(args.player,1);
  }
  v49P1FinishSource(args);
});
API.registerChoiceHandler('p1cards.discard',(answer,args)=>{
  for(const picked of v49P1ChoiceCards(answer)){
    const h=locateCardAnyV4(picked.card);
    if(h&&h.p===args.player&&h.zone==='hand')API.discard(args.player,h.index,args.reason);
  }
  v49P1FinishSource(args);
});
API.registerChoiceHandler('p1cards.poison-mode',(answer,args)=>{
  const picked=(answer&&answer.cards||[])[0],mode=picked&&picked.value;
  if(mode==='recover')API.recoverLP(args.player,1200);
  else if(mode==='damage')API.damageLP(args.player===0?1:0,800);
  v49P1FinishSource(args);
});
API.registerChoiceHandler('p1cards.return-hand-deck',(answer,args)=>{
  for(const picked of v49P1ChoiceCards(answer)){
    const h=locateCardAnyV4(picked.card);
    if(h&&h.p===args.player&&h.zone==='hand')API.returnToDeck(h,false,args.reason);
  }
  API.shuffle(args.player);
  v49P1FinishSource(args);
});
API.registerChoiceHandler('p1cards.special-summon',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  if(picked&&hasMonsterZoneSpace(args.player)){
    const h=locateCardAnyV4(picked.card);
    const emptyOk=!args.requireEmptyOwn||gameState.players[args.player].mz.length===0;
    if(h&&h.p===args.player&&h.zone===args.from&&emptyOk)API.specialSummon(args.player,args.from,h.index,args.pos||'atk',args.reason);
  }
  if(args.shuffleDeck)API.shuffle(args.player);
  v49P1FinishSource(args);
});
API.registerChoiceHandler('p1cards.deck-to-hand',(answer,args)=>{
  for(const picked of v49P1ChoiceCards(answer)){
    const h=locateCardAnyV4(picked.card);
    if(h&&h.p===args.player&&h.zone==='deck')API.searchDeck(args.player,h.index,args.reason);
  }
  v49P1FinishSource(args);
});

defineUnifiedCardV4('No.10 白輝士イルミネーター',[{
  key:'detach-cycle',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,events:['activate'],
  condition(ctx){return !!((ctx.card.xyz||[]).length&&API.me(ctx).hand.length&&API.me(ctx).deck.length);},
  /* S03-U114 */detachCostS03:{count:1,reason:'No.10 白輝士イルミネーター（コスト）'},
  operation(ctx){v49P1Open(ctx,{kind:'card',title:'No.10 白輝士イルミネーター：墓地へ送る手札',candidates:API.pileCards(ctx.player,'hand'),min:1,max:1},'p1cards.hand-send-draw',{},false);},afterResolve(){}
}],{type:'xyz',priority:1,countLimit:1,timing:['mainPhase']});

defineUnifiedCardV4('罰則金',[{
  key:'discard-two',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],
  condition(ctx){return API.me(ctx).hand.length>=2;},
  operation(ctx){v49P1Open(ctx,{kind:'card',title:'罰則金：捨てる手札2枚',candidates:API.pileCards(ctx.player,'hand'),min:2,max:2},'p1cards.discard',{},true);},afterResolve(){}
}],{type:'trap',priority:2});

defineUnifiedCardV4('ご隠居の猛毒薬',[{
  key:'choose-recover-or-damage',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],
  operation(ctx){v49P1Open(ctx,{kind:'declare',title:'ご隠居の猛毒薬：効果を選択',candidates:[{key:'recover',label:'自分は1200LP回復',value:'recover'},{key:'damage',label:'相手に800ダメージ',value:'damage'}],min:1,max:1},'p1cards.poison-mode',{},true);},afterResolve(){}
}],{type:'spell',priority:2});

defineUnifiedCardV4('天使の施し',[{
  key:'draw-three-discard-two',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:1,events:['activate'],
  condition(ctx){return API.me(ctx).deck.length>=3;},
  operation(ctx){API.draw(ctx.player,3);v49P1Open(ctx,{kind:'card',title:'天使の施し：捨てる手札2枚',candidates:API.pileCards(ctx.player,'hand'),min:2,max:2},'p1cards.discard',{},true);},afterResolve(){}
}],{type:'spell',priority:1});

defineUnifiedCardV4('謙虚な壺',[{
  key:'return-two-hand',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:1,events:['activate'],
  condition(ctx){return API.me(ctx).hand.length>=2;},
  operation(ctx){v49P1Open(ctx,{kind:'card',title:'謙虚な壺：デッキへ戻す手札2枚',candidates:API.pileCards(ctx.player,'hand'),min:2,max:2},'p1cards.return-hand-deck',{},true);},afterResolve(){}
}],{type:'spell',priority:1});

defineUnifiedCardV4('陽気な葬儀屋',[{
  key:'discard-monsters',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:1,events:['activate'],
  condition(ctx){return API.pileCards(ctx.player,'hand',x=>x.db.k==='m').length>0;},
  operation(ctx){const list=API.pileCards(ctx.player,'hand',x=>x.db.k==='m');v49P1Open(ctx,{kind:'card',title:'陽気な葬儀屋：捨てるモンスター（3枚まで）',candidates:list,min:1,max:Math.min(3,list.length)},'p1cards.discard',{},true);},afterResolve(){}
}],{type:'spell',priority:1});

defineUnifiedCardV4('D－スピリッツ',[{
  key:'summon-dhero',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:1,events:['activate'],
  condition(ctx){return hasMonsterZoneSpace(ctx.player)&&!API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card.face==='up'&&isSetCardV4(x.db,SETCODE.DESTINY_HERO)}).length&&API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&(x.db.lv||99)<=4&&isSetCardV4(x.db,SETCODE.DESTINY_HERO)).length>0;},
  operation(ctx){v49P1Open(ctx,{kind:'card',title:'D－スピリッツ：特殊召喚するD－HERO',candidates:API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&(x.db.lv||99)<=4&&isSetCardV4(x.db,SETCODE.DESTINY_HERO)),min:1,max:1},'p1cards.special-summon',{from:'hand',pos:'atk'},true);},afterResolve(){}
}],{type:'spell',priority:1,includesSpecialSummon:true,blocksIfNoSpecialSummon:true});

defineUnifiedCardV4('狩猟本能',[{
  key:'opponent-special-dinosaur',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['onSpecialSummon'],
  condition(ctx){return !!(ctx.event&&ctx.event.player===ctx.opponent&&hasMonsterZoneSpace(ctx.player)&&API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&x.db.ra==='恐竜').length);},
  operation(ctx){v49P1Open(ctx,{kind:'card',title:'狩猟本能：特殊召喚する恐竜族',candidates:API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&x.db.ra==='恐竜'),min:1,max:1},'p1cards.special-summon',{from:'hand',pos:'atk'},true);},afterResolve(){}
}],{type:'trap',priority:2,includesSpecialSummon:true,blocksIfNoSpecialSummon:true,passive:{onSpecialSummon:()=>true}});

defineUnifiedCardV4('隠れ兵',[{
  key:'opponent-summon-dark',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['onNormalSummon','onFlip'],
  condition(ctx){return !!(ctx.event&&ctx.event.player===ctx.opponent&&(ctx.eventName!=='onFlip'||ctx.event.flipSummon)&&hasMonsterZoneSpace(ctx.player)&&API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&(x.db.lv||99)<=4&&x.db.at==='闇').length);},
  operation(ctx){v49P1Open(ctx,{kind:'card',title:'隠れ兵：特殊召喚する闇属性',candidates:API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&(x.db.lv||99)<=4&&x.db.at==='闇'),min:1,max:1},'p1cards.special-summon',{from:'hand',pos:'atk'},true);},afterResolve(){}
}],{type:'trap',priority:2,includesSpecialSummon:true,blocksIfNoSpecialSummon:true,passive:{onNormalSummon:()=>true,onFlip:ctx=>!!(ctx.event&&ctx.event.flipSummon)}});

defineUnifiedCardV4('アポート',[{
  key:'pay-summon-psychic',type:EFFECT_TYPE.IGNITION,range:LOCATION.SZONE,speed:1,events:['activate'],
  condition(ctx){return API.me(ctx).lp>800&&API.me(ctx).mz.length===0&&API.foe(ctx).mz.length>0&&hasMonsterZoneSpace(ctx.player)&&API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&x.db.ra==='サイキック').length>0;},
  cost(ctx,done){API.payCost(ctx.player,800);done(true);},
  operation(ctx){v49P1Open(ctx,{kind:'card',title:'アポート：特殊召喚するサイキック族',candidates:API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&x.db.ra==='サイキック'),min:1,max:1},'p1cards.special-summon',{from:'hand',pos:'atk',requireEmptyOwn:true},false);},afterResolve(){}
}],{type:'spell',priority:1,countLimit:1,timing:['mainPhase'],includesSpecialSummon:true,blocksIfNoSpecialSummon:true,continuous:{scope:'self',from:['sz'],apply(){return null;}}});

defineUnifiedCardV4('ガスタの希望 カムイ',[{
  key:'flip-gusto-tuner',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onFlip'],
  condition(ctx){return !!(ctx.event&&ctx.event.card===ctx.card&&hasMonsterZoneSpace(ctx.player)&&API.pileCards(ctx.player,'deck',x=>isSetCardV4(x.db,SETCODE.GUSTO)&&(x.db.st||[]).includes('チューナー')).length);},
  operation(ctx){v49P1Open(ctx,{kind:'card',title:'ガスタの希望 カムイ：特殊召喚するガスタのチューナー',candidates:API.pileCards(ctx.player,'deck',x=>isSetCardV4(x.db,SETCODE.GUSTO)&&(x.db.st||[]).includes('チューナー')),min:1,max:1},'p1cards.special-summon',{from:'deck',pos:'atk',shuffleDeck:true},false);},afterResolve(){}
}],{type:'monster',priority:1,forced:true,includesSpecialSummon:true,blocksIfNoSpecialSummon:true,passive:{onFlip:ctx=>ctx.event&&ctx.event.card===ctx.card}});

defineUnifiedCardV4('サンダー・ドラゴン',[{
  key:'discard-search-copies',type:EFFECT_TYPE.IGNITION,range:LOCATION.HAND,speed:1,events:['activate'],
  condition(ctx){const ref=dbOf(ctx.card);return ctx.zone==='hand'&&API.pileCards(ctx.player,'deck',x=>sameCanonicalCardV4(x.db,ref)).length>0;},
  cost(ctx,done){const i=API.me(ctx).hand.indexOf(ctx.card);if(i<0){done(false);return;}API.discard(ctx.player,i,'サンダー・ドラゴン（コスト）',{byEffect:false});done(true);},
  operation(ctx){const ref=dbOf(ctx.card),list=API.pileCards(ctx.player,'deck',x=>sameCanonicalCardV4(x.db,ref));v49P1Open(ctx,{kind:'card',title:'サンダー・ドラゴン：手札に加える同名カード（2枚まで）',candidates:list,min:1,max:Math.min(2,list.length)},'p1cards.deck-to-hand',{},false);},afterResolve(){}
}],{type:'monster',priority:1,activateFrom:['hand'],timing:['mainPhase']});

defineUnifiedCardV4('ジェネクス・ワーカー',[{
  key:'tribute-summon-genex',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,events:['activate'],
  condition(ctx){return API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&isSetCardV4(x.db,SETCODE.GENEX)).length>0;},
  cost(ctx,done){const h=locateCardAnyV4(ctx.card);if(!h){done(false);return;}API.sendToGrave(h,'ジェネクス・ワーカー（リリース）');done(true);},
  operation(ctx){v49P1Open(ctx,{kind:'card',title:'ジェネクス・ワーカー：特殊召喚するジェネクス',candidates:API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&isSetCardV4(x.db,SETCODE.GENEX)),min:1,max:1},'p1cards.special-summon',{from:'hand',pos:'atk'},false);},afterResolve(){}
}],{type:'monster',priority:1,timing:['mainPhase'],includesSpecialSummon:true,blocksIfNoSpecialSummon:true});

function v49P1RitualSearch(name,ritualMonster){
  defineUnifiedCardV4(name,[{
    key:'summon-search-ritual',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onNormalSummon','onFlip'],
    condition(ctx){return !!(ctx.event&&ctx.event.card===ctx.card&&(ctx.eventName!=='onFlip'||ctx.event.flipSummon)&&API.pileCards(ctx.player,'deck',x=>ritualMonster?x.db.k==='m'&&(x.db.st||[]).includes('儀式'):x.db.k==='s'&&x.db.sub==='儀式').length);},
    operation(ctx){v49P1Open(ctx,{kind:'card',title:name+'：手札に加える'+(ritualMonster?'儀式モンスター':'儀式魔法'),candidates:API.pileCards(ctx.player,'deck',x=>ritualMonster?x.db.k==='m'&&(x.db.st||[]).includes('儀式'):x.db.k==='s'&&x.db.sub==='儀式'),min:1,max:1},'p1cards.deck-to-hand',{},false);},afterResolve(){}
  }],{type:'monster',priority:1,passive:{onNormalSummon:ctx=>ctx.event&&ctx.event.card===ctx.card,onFlip:ctx=>!!(ctx.event&&ctx.event.card===ctx.card&&ctx.event.flipSummon)}});
}
v49P1RitualSearch('センジュ・ゴッド',true);
v49P1RitualSearch('ソニックバード',false);

defineUnifiedCardV4('ミイラの呼び声',[{
  key:'empty-field-zombie',type:EFFECT_TYPE.IGNITION,range:LOCATION.SZONE,speed:1,events:['activate'],
  condition(ctx){return API.me(ctx).mz.length===0&&hasMonsterZoneSpace(ctx.player)&&API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&x.db.ra==='アンデット').length>0;},
  operation(ctx){v49P1Open(ctx,{kind:'card',title:'ミイラの呼び声：特殊召喚するアンデット族',candidates:API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&x.db.ra==='アンデット'),min:1,max:1},'p1cards.special-summon',{from:'hand',pos:'atk',requireEmptyOwn:true},false);},afterResolve(){}
}],{type:'spell',priority:1,countLimit:1,timing:['mainPhase'],includesSpecialSummon:true,blocksIfNoSpecialSummon:true,continuous:{scope:'self',from:['sz'],apply(){return null;}}});
