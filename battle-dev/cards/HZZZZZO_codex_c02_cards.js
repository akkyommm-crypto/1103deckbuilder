/* CODEX-C02 — six previously ENGINE_GAP cards, using existing v4 / v49 primitives. */

function c02Opponent(p){ return p===0?1:0; }
function c02FourAttributes(){
  const have={};
  API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'}).forEach(x=>{ have[currentAttributeV17(x.card)]=true; });
  return ['風','水','炎','地'].every(a=>have[a]);
}

API.registerChoiceHandler('c02.twins-second-discard',(answer,args)=>{
  const picked=(answer&&answer.cards||[])[0], h=picked&&locateCardAnyV4(picked.card);
  if(h&&h.p===args.player&&h.zone==='hand') API.discard(args.player,h.index,'いたずら好きな双子悪魔',{byEffect:true,byPlayer:args.byPlayer});
});
API.registerChoiceHandler('c02.wind-mode',(answer,args)=>{
  const mode=(answer&&answer.cards||[])[0]; if(!mode) return;
  const p=args.player, foe=c02Opponent(p);
  if(mode.value==='monsters') API.fieldCards({player:foe,zone:'mz'}).slice().forEach(t=>API.destroy(t,'風林火山'));
  if(mode.value==='spells') API.fieldCards({player:foe,filter:x=>x.zone==='sz'||x.zone==='field'}).slice().forEach(t=>API.destroy(t,'風林火山'));
  if(mode.value==='discard') for(let i=0;i<2&&API.me({player:foe}).hand.length;i++) API.discard(foe,duelRandomInt(API.me({player:foe}).hand.length),'風林火山',{byEffect:true,byPlayer:p});
  if(mode.value==='draw') API.draw(p,2,'風林火山');
});
API.registerChoiceHandler('c02.bond-summon',(answer,args)=>{
  const picks=(answer&&answer.cards||[]).filter(x=>x&&!x.stale&&x.card);
  const free=5-(gameState.players[args.player].mz||[]).length;
  const valid=picks.filter(p=>{const h=locateCardAnyV4(p.card);return h&&h.p===args.player&&h.zone==='hand'&&isSetCardV4(dbOf(h.card),SETCODE.ELEMENTAL_HERO)&&(dbOf(h.card).lv||99)<=4&&canEffectSpecialSummonS03(h.card,'hand','HERO’S ボンド');});
  if(picks.length!==2 || valid.length!==2 || free<2) return;
  /* Re-resolve each UID after the preceding summon changes the hand indexes.  The
     chain resolver still batches both summon-success events as one simultaneous summon. */
  valid.forEach(p=>{const h=locateCardAnyV4(p.card);if(h&&h.p===args.player&&h.zone==='hand')API.specialSummon(args.player,'hand',h.index,'atk','HERO’S ボンド');});
});

defineUnifiedCardV4('またたびキャット',[
  {key:'set-def-zero',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,targetRange:LOCATION.MZONE,targetSide:'opponent',speed:1,events:['activate'],
   condition(ctx){return API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'}).length>0;},
   target(ctx,done){API.selectCard('またたびキャット：守備力を0にする相手モンスター',API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'}),t=>done([t]));},
   operation(ctx){const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);if(t&&t.card.face==='up')API.setDef(t,0,'endTurn','またたびキャット');},afterResolve(){}}
],{type:'monster',priority:1,countLimit:1,timing:['mainPhase'],targets:true,continuous:{scope:'self',from:['mz'],apply(){return null;},cannotBeAttackTarget(target,self){if(target!==self||self.face!=='up')return false;const h=locateCard(self);return !!h&&(gameState.players[h.p].mz||[]).some(c=>c&&c!==self&&c.face==='up'&&currentRaceV17(c)==='獣');}}});

defineUnifiedCardV4('H－ヒートハート',[
  {key:'boost-pierce',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,targetRange:LOCATION.MZONE,targetSide:'self',speed:1,events:['activate'],
   condition(ctx){return API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card.face==='up'}).length>0;},
   target(ctx,done){API.selectCard('H－ヒートハート：強化する表側モンスター',API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card.face==='up'}),t=>done([t]));},
   operation(ctx){const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);if(!t||t.card.face!=='up')return;API.modAtk(t,500,0,'endTurn','H－ヒートハート');API.setCardFlag(t,'pierceBattleS03',{turn:gameState.turn},'H－ヒートハート',{silent:true});},afterResolve(){}}
],{type:'spell',priority:1,targets:true});

defineUnifiedCardV4('HERO’S ボンド',[
  {key:'two-elemental-heroes',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:1,events:['activate'],
   condition(ctx){const heroes=API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'&&isSetCardV4(x.db,SETCODE.HERO)});const hand=API.pileCards(ctx.player,'hand',x=>isSetCardV4(x.db,SETCODE.ELEMENTAL_HERO)&&(x.db.lv||99)<=4&&canEffectSpecialSummonS03(x.card,'hand','HERO’S ボンド'));return heroes.length>0&&hand.length>=2&&(5-(gameState.players[ctx.player].mz||[]).length)>=2&&!(gameState.players[ctx.player].temporaryFlags||{}).noSpecialSummon;},
   operation(ctx){API.requestChoice({player:ctx.player,kind:'card',title:'HERO’S ボンド：特殊召喚するレベル4以下のE・HEROを2体',candidates:API.pileCards(ctx.player,'hand',x=>isSetCardV4(x.db,SETCODE.ELEMENTAL_HERO)&&(x.db.lv||99)<=4&&canEffectSpecialSummonS03(x.card,'hand','HERO’S ボンド')),min:2,max:2,cancelable:false,resume:{handler:'c02.bond-summon',args:{player:ctx.player}},meta:{scriptName:'HERO’S ボンド'}});},afterResolve(){}}
],{type:'spell',priority:1,includesSpecialSummon:true,blocksIfNoSpecialSummon:true});

defineUnifiedCardV4('ロスト',[
  {key:'banish-opponent-grave',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,targetRange:LOCATION.GRAVE,targetSide:'opponent',speed:2,events:['activate'],
   condition(ctx){return !inDamageStepS03()&&API.pileCards(ctx.opponent,'grave').length>0;},target(ctx,done){API.selectCard('ロスト：除外する相手の墓地のカード',API.pileCards(ctx.opponent,'grave'),t=>done([t]));},operation(ctx){const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);if(t)API.banish(t,'ロスト');},afterResolve(){}}
],{type:'trap',priority:2,targets:true});

defineUnifiedCardV4('いたずら好きな双子悪魔',[
  {key:'random-then-chosen-discard',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:1,events:['activate'],
   condition(ctx){return API.me(ctx).lp>1000&&API.foe(ctx).hand.length>0;},cost(ctx,done){API.payCost(ctx.player,1000);done(true);},
   operation(ctx){const foe=ctx.opponent, hand=API.me({player:foe}).hand;if(!hand.length)return;API.discard(foe,duelRandomInt(hand.length),'いたずら好きな双子悪魔',{byEffect:true,byPlayer:ctx.player});if(API.me({player:foe}).hand.length)API.requestChoice({player:foe,kind:'card',title:'いたずら好きな双子悪魔：捨てる手札を選択',candidates:API.pileCards(foe,'hand'),min:1,max:1,cancelable:false,resume:{handler:'c02.twins-second-discard',args:{player:foe,byPlayer:ctx.player}},meta:{scriptName:'いたずら好きな双子悪魔'}});},afterResolve(){}}
],{type:'spell',priority:1});

defineUnifiedCardV4('風林火山',[
  {key:'resolve-mode',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],condition(){return !inDamageStepS03()&&c02FourAttributes();},
   operation(ctx){API.requestChoice({player:ctx.player,kind:'option',title:'風林火山：適用する効果を選択',candidates:[{key:'monsters',value:'monsters',label:'相手モンスターを全て破壊'},{key:'spells',value:'spells',label:'相手魔法・罠を全て破壊'},{key:'discard',value:'discard',label:'相手の手札をランダムに2枚捨てる'},{key:'draw',value:'draw',label:'自分は2枚ドロー'}],min:1,max:1,cancelable:false,resume:{handler:'c02.wind-mode',args:{player:ctx.player}},meta:{scriptName:'風林火山'}});},afterResolve(){}}
],{type:'trap',priority:2});
