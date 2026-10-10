/* Existing-engine Class A recovery — sub-batch 3.
   Card scripts only: P1/P1.1, P3, P4, Battle v6, v14, v17, v18 and v21. */

function ca3Ref(name){ return dbOf({id:findCardIndex(name)}); }
function ca3Same(x,name){ return sameCanonicalCardV4(x.db||dbOf(x),ca3Ref(name)); }
function ca3Own(ctx,pred){ return API.fieldCards({player:ctx.player,zone:'mz',filter:x=>!pred||pred(x)}); }
function ca3Open(d,s,h,args){ return p11cOpen(d,s,h,args||{}); }
function ca3Hit(uid){ return p11cHit(uid); }

API.registerScheduleHandler('classa3.clear-lp-rule',(args)=>{
  if(args&&args.label) API.clearLpRules(args.label);
});

API.registerChoiceHandler('classa3.tribute-commit',(answer,args)=>{
  if(answer.cancelled||!p11cCards(answer).length)return p11cAbort(args.activation);
  p11cRecordMove(args.activation,answer,'tribute','tribute',args.fields||[]);
  p11cCommit(args.activation,[],args.mode||null);
});
API.registerChoiceHandler('classa3.orca-mode',(answer,args)=>{
  if(answer.cancelled)return p11cAbort(args.activation);
  const mode=String(answer.cards&&answer.cards[0]&&answer.cards[0].value||'');
  const costName=mode==='monster'?'魚雷魚':'砲弾ヤリ貝';
  ca3Open(args.activation,{kind:'card',title:'暗黒大要塞鯱：リリースする'+costName,
    candidates:ca3Own(p11cCtx(args.activation.player),x=>ca3Same(x,costName)),min:1,max:1},
    'classa3.orca-cost',{mode});
});
API.registerChoiceHandler('classa3.orca-cost',(answer,args)=>{
  if(answer.cancelled||p11cCards(answer).length!==1)return p11cAbort(args.activation);
  p11cRecordMove(args.activation,answer,'tribute','tribute',[]);
  const p=p11cCtx(args.activation.player),monster=args.mode==='monster';
  ca3Open(args.activation,{title:'暗黒大要塞鯱：破壊する'+(monster?'モンスター':'魔法・罠'),
    candidates:API.fieldCards({filter:x=>monster?x.zone==='mz':['sz','field'].includes(x.zone)}),
    targeting:true,min:1,max:1},'classa3.orca-target',{mode:args.mode});
});
API.registerChoiceHandler('classa3.orca-target',(answer,args)=>{
  if(answer.cancelled||p11cCards(answer).length!==1)return p11cAbort(args.activation);
  p11cCommit(args.activation,p11cCards(answer),args.mode);
});
API.registerChoiceHandler('classa3.special-many',(answer,args)=>{
  if(answer.cancelled)return;
  p11cCards(answer).forEach(t=>{
    const h=ca3Hit(t.uid);if(h&&h.zone==='deck'&&hasMonsterZoneSpace(args.player))API.specialSummon(args.player,'deck',h.index,'atk',args.reason);
  });
  API.shuffle(args.player);
});
API.registerChoiceHandler('classa3.blackspear-cost',(answer,args)=>{
  if(answer.cancelled||p11cCards(answer).length!==1)return p11cAbort(args.activation);
  p11cRecordMove(args.activation,answer,'tribute','tribute',[]);
  ca3Open(args.activation,{title:'ドラグニティ－ブラックスピア：特殊召喚する鳥獣族',
    candidates:API.pileCards(args.activation.player,'grave',x=>x.db.k==='m'&&x.db.ra==='鳥獣'&&Number(x.db.lv||0)<=4),
    targeting:true,min:1,max:1},'classa3.commit-target',{});
});
API.registerChoiceHandler('classa3.commit-target',(answer,args)=>{
  if(answer.cancelled||p11cCards(answer).length!==1)return p11cAbort(args.activation);
  p11cCommit(args.activation,p11cCards(answer));
});
API.registerChoiceHandler('classa3.element-step',(answer,args)=>{
  if(answer.cancelled||p11cCards(answer).length!==1)return p11cAbort(args.activation);
  const picked=(args.picked||[]).concat(p11cCards(answer).map(x=>x.uid));
  const attrs=['風','水','炎','地'],next=picked.length;
  if(next<4){
    ca3Open(args.activation,{title:'エレメンタルバースト：'+attrs[next]+'属性をリリース',
      candidates:ca3Own(p11cCtx(args.activation.player),x=>API.attrOf(x)===attrs[next]&&!picked.includes(x.card.uid)),min:1,max:1},
      'classa3.element-step',{picked});return;
  }
  const q=p11cByUid(picked);API.recordActivationCost(p11cCtx(args.activation.player),'tribute',q,[],4);
  q.forEach(t=>{const h=ca3Hit(t.card?t.card.uid:t.uid);if(h)API.sendToGrave(h,'エレメンタルバースト（リリース）');});
  p11cCommit(args.activation,[]);
});
API.registerChoiceHandler('classa3.mother-cost',(answer,args)=>{
  if(answer.cancelled||p11cCards(answer).length!==1)return p11cAbort(args.activation);
  p11cRecordMove(args.activation,answer,'discard','discard',[]);
  ca3Open(args.activation,{title:'マザー・ブレイン：破壊するセットカード',
    candidates:API.fieldCards({filter:x=>x.card.face==='down'}),targeting:true,min:1,max:1},
    'classa3.commit-target',{});
});

defineScript('シンクロ・バリアー',{type:'trap',priority:2,
  condition(ctx){return ca3Own(ctx,x=>x.db.k==='s').length>0;},
  activationV11(ctx,d){ca3Open(d,{title:'シンクロ・バリアー：リリースするシンクロモンスター',candidates:ca3Own(ctx,x=>x.db.k==='s'),min:1,max:1},'classa3.tribute-commit',{fields:['level','atk','def']});},
  resolve(ctx){const label='シンクロ・バリアー#'+String(ctx.chainLink&&ctx.chainLink.chainId||ctx.card.uid);
    API.addLpRule({player:ctx.player,cause:'all',mode:'prevent',turns:turnsUntilOwnTurnV7(gameState,ctx.player),label});
    API.schedule({at:'standbyPhase',turns:turnsUntilOwnTurnV7(gameState,ctx.player),player:ctx.player,handler:'classa3.clear-lp-rule',args:{label},note:'シンクロ・バリアー解除'});}});

defineScript('暗黒大要塞鯱',{type:'monster',priority:1,timing:['mainPhase'],targets:true,destroysFieldV46:true,
  condition(ctx){const mon=API.fieldCards({zone:'mz'}).length>0,st=API.fieldCards({filter:x=>['sz','field'].includes(x.zone)}).length>0;
    return (mon&&ca3Own(ctx,x=>ca3Same(x,'魚雷魚')).length>0)||(st&&ca3Own(ctx,x=>ca3Same(x,'砲弾ヤリ貝')).length>0);},
  activationV11(ctx,d){const choices=[];
    if(API.fieldCards({zone:'mz'}).length&&ca3Own(ctx,x=>ca3Same(x,'魚雷魚')).length)choices.push({value:'monster',label:'魚雷魚：モンスターを破壊'});
    if(API.fieldCards({filter:x=>['sz','field'].includes(x.zone)}).length&&ca3Own(ctx,x=>ca3Same(x,'砲弾ヤリ貝')).length)choices.push({value:'spelltrap',label:'砲弾ヤリ貝：魔法・罠を破壊'});
    API.requestChoice({player:d.player,kind:'option',title:'暗黒大要塞鯱：効果を選択',candidates:choices,min:1,max:1,cancelable:true,resume:{handler:'classa3.orca-mode',args:{activation:d}},meta:{scriptName:d.name}});},
  resolve(ctx){const h=ctx.selectedTargets[0]&&resolveTarget(ctx.selectedTargets[0]);if(h)API.destroy(h,'暗黒大要塞鯱');}});

defineScript('インフェルニティ・ビートル',{type:'monster',priority:1,timing:['mainPhase'],includesSpecialSummon:true,blocksIfNoSpecialSummon:true,
  condition(ctx){return gameState.players[ctx.player].hand.length===0&&API.pileCards(ctx.player,'deck',x=>ca3Same(x,'インフェルニティ・ビートル')).length>0;},
  activationV11(ctx,d){const h=ca3Hit(ctx.card.uid);if(!h)return abortPreparedActivationV11(d,'自身が存在しません');API.recordActivationCost(ctx,'tribute',[h],[],1);API.sendToGrave(h,'インフェルニティ・ビートル（リリース）');p11cCommit(d,[]);},
  resolve(ctx){const q=API.pileCards(ctx.player,'deck',x=>ca3Same(x,'インフェルニティ・ビートル')),space=Math.max(0,5-gameState.players[ctx.player].mz.length),max=Math.min(2,q.length,space);if(max)API.requestChoice({player:ctx.player,kind:'card',title:'インフェルニティ・ビートル：特殊召喚（2体まで）',candidates:q,min:1,max,cancelable:false,resume:{handler:'classa3.special-many',args:{player:ctx.player,reason:'インフェルニティ・ビートル'}},meta:{scriptName:'インフェルニティ・ビートル'}});}});

defineScript('フレムベル・アーチャー',{type:'monster',priority:1,timing:['mainPhase'],countLimit:1,
  condition(ctx){return ca3Own(ctx,x=>x.card.face==='up'&&API.raceOf(x)==='炎').length>0;},
  activationV11(ctx,d){ca3Open(d,{title:'フレムベル・アーチャー：リリースする炎族',candidates:ca3Own(ctx,x=>x.card.face==='up'&&API.raceOf(x)==='炎'),min:1,max:1},'classa3.tribute-commit',{});},
  resolve(){API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'&&isSetCardV4(x.db,SETCODE.FLAMVELL)}).forEach(h=>API.modAtk(h,800,0,'endPhase','フレムベル・アーチャー'));}});

defineScript('ドラグニティ－ブラックスピア',{type:'monster',priority:1,timing:['mainPhase'],countLimit:1,targets:true,includesSpecialSummon:true,blocksIfNoSpecialSummon:true,
  condition(ctx){return ca3Own(ctx,x=>x.card.face==='up'&&API.raceOf(x)==='ドラゴン'&&isSetCardV4(x.db,SETCODE.DRAGUNITY)).length>0&&API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&x.db.ra==='鳥獣'&&Number(x.db.lv||0)<=4).length>0;},
  activationV11(ctx,d){ca3Open(d,{title:'ドラグニティ－ブラックスピア：リリースするドラグニティのドラゴン族',candidates:ca3Own(ctx,x=>x.card.face==='up'&&API.raceOf(x)==='ドラゴン'&&isSetCardV4(x.db,SETCODE.DRAGUNITY)),min:1,max:1},'classa3.blackspear-cost',{});},
  resolve(ctx){const h=ctx.selectedTargets[0]&&resolveTarget(ctx.selectedTargets[0]),d=h&&dbOf(h.card);if(h&&h.zone==='grave'&&d.ra==='鳥獣'&&Number(d.lv||0)<=4&&hasMonsterZoneSpace(ctx.player))API.specialSummon(ctx.player,'grave',h.index,'atk','ドラグニティ－ブラックスピア');}});

defineScript('エレメンタルバースト',{type:'trap',priority:2,destroysFieldV46:true,
  condition(ctx){return ['風','水','炎','地'].every(a=>ca3Own(ctx,x=>API.attrOf(x)===a).length>0);},
  activationV11(ctx,d){ca3Open(d,{title:'エレメンタルバースト：風属性をリリース',candidates:ca3Own(ctx,x=>API.attrOf(x)==='風'),min:1,max:1},'classa3.element-step',{picked:[]});},
  resolve(ctx){API.fieldCards({player:ctx.opponent}).slice().forEach(h=>API.destroy(h,'エレメンタルバースト'));}});

defineScript('マザー・ブレイン',{type:'monster',priority:1,timing:['mainPhase'],targets:true,destroysFieldV46:true,
  summonProcedure:{from:['hand'],positions:['atk','def'],condition({player}){return hasMonsterZoneSpace(player)&&API.fieldCards({player,zone:'mz',filter:x=>x.card.face==='up'&&ca3Same(x,'オーシャンズ・オーパー')}).length>0;},cost({player,done}){const q=API.fieldCards({player,zone:'mz',filter:x=>x.card.face==='up'&&ca3Same(x,'オーシャンズ・オーパー')});API.selectCard('マザー・ブレイン：リリースするオーシャンズ・オーパー',q,h=>{API.sendToGrave(h,'マザー・ブレイン（リリース）');done(true);});}},
  condition(ctx){return gameState.players[ctx.player].hand.some(c=>API.attrOf({card:c,db:dbOf(c)})==='水')&&API.fieldCards({filter:x=>x.card.face==='down'}).length>0;},
  activationV11(ctx,d){ca3Open(d,{title:'マザー・ブレイン：捨てる水属性カード',candidates:API.pileCards(ctx.player,'hand',x=>API.attrOf(x)==='水'),min:1,max:1},'classa3.mother-cost',{});},
  resolve(ctx){const h=ctx.selectedTargets[0]&&resolveTarget(ctx.selectedTargets[0]);if(h&&h.card.face==='down')API.destroy(h,'マザー・ブレイン');}});

defineScript('ミストデーモン',{type:'monster',priority:1,forced:true,
  normalSummonProcedure:{includeStandard:true,methods:[{id:'mistNoTribute',tributes:0,modes:['summon'],summonLabel:'リリースなしで召喚'}]},
  condition(ctx){return ctx.eventName==='onEndPhase'&&ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.card.normalSummonMethod==='mistNoTribute'&&gameState.activePlayer===ctx.player;},
  resolve(ctx){const h=locateCardAnyV4(ctx.card);if(h)API.destroy(h,'ミストデーモン');API.damageLP(ctx.player,1000,'ミストデーモン');},
  passive:{onEndPhase(ctx){return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.card.normalSummonMethod==='mistNoTribute'&&gameState.activePlayer===ctx.player;}}});

defineScript('E－HERO マリシャス・エッジ',{type:'monster',priority:1,
  normalSummonProcedure:{includeStandard:true,methods:[{id:'maliciousEdge1',tributes:1,modes:['summon'],summonLabel:'相手モンスターが存在するため1体リリースして召喚',condition({player}){return gameState.players[player===0?1:0].mz.length>0;}}]},
  continuous:{scope:'self',from:['mz'],apply(){return null;},piercingDamage(info){if(info.atkCard!==info.self||!info.defCard||info.defCard.pos!=='def')return 0;return Math.max(0,curATK(info.atkCard)-curDEF(info.defCard));}}});
