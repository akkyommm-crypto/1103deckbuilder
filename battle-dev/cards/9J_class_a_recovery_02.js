/* Existing-engine Class A recovery — sub-batch 2 (10 cards).
   Uses P1/P1.1, P3 snapshots, P4 identity, Battle v6 and v14/v17 only. */

function ca2Ref(name){ return dbOf({id:findCardIndex(name)}); }
function ca2Same(x,name){ return sameCanonicalCardV4(x.db||dbOf(x),ca2Ref(name)); }
function ca2OwnMonsters(ctx,pred){
  return API.fieldCards({player:ctx.player,zone:'mz',filter:x=>(!pred||pred(x))});
}
function ca2SpecialPool(player,name){
  return ['hand','deck','grave'].flatMap(z=>API.pileCards(player,z,x=>ca2Same(x,name)));
}
function ca2ResolveChoice(ctx,title,candidates,handler,args,min,max,player){
  if(!candidates.length)return false;
  return API.requestChoice({player:player==null?ctx.player:player,kind:'card',title,candidates,
    min:min==null?1:min,max:max==null?1:max,cancelable:min===0,
    resume:{handler,args:Object.assign({player:ctx.player},args||{})},
    meta:{scriptName:cardName(ctx.card),v4EffectKey:ctx.v4EffectKey||null}});
}

API.registerChoiceHandler('classa2.cost-commit',(answer,args)=>{
  if(answer.cancelled)return p11cAbort(args.activation);
  const q=p11cCards(answer);if(!q.length)return p11cAbort(args.activation);
  if(args.sourceFields){
    const h=p11cHit(args.activation.uid);
    if(h)API.recordActivationCost(p11cCtx(args.activation.player),'source-stat',[h],args.sourceFields,1);
  }
  p11cRecordMove(args.activation,answer,args.kind||'tribute','tribute',args.fields||[]);
  p11cCommit(args.activation,[]);
});
API.registerChoiceHandler('classa2.hades-target',(answer,args)=>{
  if(answer.cancelled)return p11cAbort(args.activation);
  const h=p11cHit(args.activation.uid);if(!h)return p11cAbort(args.activation);
  API.recordActivationCost(p11cCtx(args.activation.player),'tribute',[h],[],1);
  API.sendToGrave(h,'ハ・デスの使い魔（リリース）');
  p11cCommit(args.activation,p11cCards(answer));
});
API.registerChoiceHandler('classa2.smash-target',(answer,args)=>{
  if(answer.cancelled||!p11cCards(answer).length)return p11cAbort(args.activation);
  p11cCommit(args.activation,p11cCards(answer));
});
API.registerChoiceHandler('classa2.bond-hydro',(answer,args)=>{
  if(answer.cancelled||p11cCards(answer).length!==2)return p11cAbort(args.activation);
  p11cOpen(args.activation,{title:'ボンディング－H2O：オキシゲドン1体',candidates:ca2OwnMonsters(p11cCtx(args.activation.player),x=>ca2Same(x,'オキシゲドン')),min:1,max:1},'classa2.bond-oxy',{hydro:p11cCards(answer).map(x=>x.uid)});
});
API.registerChoiceHandler('classa2.bond-oxy',(answer,args)=>{
  if(answer.cancelled||p11cCards(answer).length!==1)return p11cAbort(args.activation);
  const q=p11cByUid(args.hydro).concat(p11cCards(answer));
  API.recordActivationCost(p11cCtx(args.activation.player),'tribute',q,[],3);
  q.forEach(t=>{const h=p11cHit(t.card?t.card.uid:t.uid);if(h)API.sendToGrave(h,'ボンディング－H2O（リリース）');});
  p11cCommit(args.activation,[]);
});
API.registerChoiceHandler('classa2.special',(answer,args)=>{
  const t=p11cCards(answer)[0],h=t&&p11cHit(t.uid);if(!h)return;
  const from=h.zone;API.specialSummon(args.player,from,h.index,args.pos||'atk',args.reason);
  if(from==='deck')API.shuffle(args.player);
});
API.registerChoiceHandler('classa2.grave-hand',(answer,args)=>{
  const t=p11cCards(answer)[0],h=t&&p11cHit(t.uid);if(h&&h.zone==='grave')API.returnToHand(h,args.reason);
});
API.registerChoiceHandler('classa2.destroy-one',(answer,args)=>{
  const t=p11cCards(answer)[0],h=t&&p11cHit(t.uid);if(h)API.destroy(h,args.reason);
});
API.registerChoiceHandler('classa2.destroy-st',(answer,args)=>{
  if(answer.cancelled)return;
  p11cCards(answer).forEach(t=>{const h=p11cHit(t.uid);if(h)API.destroy(h,args.reason);});
});
API.registerChoiceHandler('classa2.opponent-tribute',(answer,args)=>{
  const t=p11cCards(answer)[0],h=t&&p11cHit(t.uid);if(h)API.sendToGrave(h,args.reason);
});
API.registerChoiceHandler('classa2.hero-search',(answer,args)=>{
  const t=p11cCards(answer)[0],h=t&&p11cHit(t.uid);if(h&&h.zone==='deck'){API.searchDeck(args.player,h.index,args.reason);API.shuffle(args.player);}
});

defineScript('孵化',{type:'spell',priority:1,includesSpecialSummon:true,blocksIfNoSpecialSummon:true,
  condition(ctx){return hasMonsterZoneSpace(ctx.player)&&ca2OwnMonsters(ctx,x=>curLV(x.card)>0&&API.pileCards(ctx.player,'deck',d=>d.db.k==='m'&&d.db.ra==='昆虫'&&d.db.lv===curLV(x.card)+1).length>0).length>0;},
  activationV11(ctx,d){p11cOpen(d,{title:'孵化：リリースするモンスター',candidates:ca2OwnMonsters(ctx,x=>curLV(x.card)>0&&API.pileCards(ctx.player,'deck',q=>q.db.k==='m'&&q.db.ra==='昆虫'&&q.db.lv===curLV(x.card)+1).length>0)},'classa2.cost-commit',{fields:['level']});},
  resolve(ctx){const s=(API.costSnapshots(ctx)||[])[0];if(!s)return;ca2ResolveChoice(ctx,'孵化：特殊召喚する昆虫族',API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&x.db.ra==='昆虫'&&x.db.lv===s.level+1),'classa2.special',{reason:'孵化'});}});

defineScript('トラスト・マインド',{type:'spell',priority:1,
  condition(ctx){return ca2OwnMonsters(ctx,x=>curLV(x.card)>0&&Number.isInteger(curLV(x.card)/2)&&API.pileCards(ctx.player,'grave',g=>g.db.k==='m'&&g.db.lv===curLV(x.card)/2&&API.isTunerNow(g)).length>0).length>0;},
  activationV11(ctx,d){p11cOpen(d,{title:'トラスト・マインド：リリースするモンスター',candidates:ca2OwnMonsters(ctx,x=>curLV(x.card)>0&&Number.isInteger(curLV(x.card)/2)&&API.pileCards(ctx.player,'grave',g=>g.db.k==='m'&&g.db.lv===curLV(x.card)/2&&API.isTunerNow(g)).length>0)},'classa2.cost-commit',{fields:['level']});},
  resolve(ctx){const s=(API.costSnapshots(ctx)||[])[0];if(!s)return;ca2ResolveChoice(ctx,'トラスト・マインド：手札に加えるチューナー',API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&x.db.lv===s.level/2&&API.isTunerNow(x)),'classa2.grave-hand',{reason:'トラスト・マインド'});}});

defineScript('投石部隊',{type:'monster',priority:1,timing:['mainPhase'],destroysFieldV46:true,
  condition(ctx){return ca2OwnMonsters(ctx,x=>x.db.ra==='戦士').length>0;},
  activationV11(ctx,d){p11cOpen(d,{title:'投石部隊：リリースする戦士族',candidates:ca2OwnMonsters(ctx,x=>x.db.ra==='戦士')},'classa2.cost-commit',{fields:[],sourceFields:['atk']});},
  resolve(ctx){const c=API.activationCosts(ctx,'source-stat')[0],s=c&&c.snapshots&&c.snapshots[0];if(!s)return;ca2ResolveChoice(ctx,'投石部隊：破壊するモンスター',API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'&&curDEF(x.card)<=s.atk}),'classa2.destroy-one',{reason:'投石部隊'});}});

defineScript('ハ・デスの使い魔',{type:'monster',priority:1,timing:['mainPhase'],targets:true,
  condition(ctx){return API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'&&API.raceOf(x)==='悪魔'}).length>0;},
  activationV11(ctx,d){p11cOpen(d,{title:'ハ・デスの使い魔：強化する悪魔族',candidates:API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'&&API.raceOf(x)==='悪魔'}),targeting:true},'classa2.hades-target',{});},
  resolve(ctx){const h=ctx.selectedTargets[0]&&resolveTarget(ctx.selectedTargets[0]);if(h)v4RegisterStatModifier(h,{atk:700,def:700},{code:'ハ・デスの使い魔',resetMask:RESET.LEAVE|RESET.FACE_DOWN});}});

defineScript('玉砕指令',{type:'trap',priority:2,targets:true,destroysFieldV46:true,
  condition(ctx){return ca2OwnMonsters(ctx,x=>x.card.face==='up'&&!x.card.token&&(x.db.st||[]).includes('通常')&&curLV(x.card)<=2).length>0;},
  activationV11(ctx,d){p11cOpen(d,{title:'玉砕指令：リリースする通常モンスター',candidates:ca2OwnMonsters(ctx,x=>x.card.face==='up'&&!x.card.token&&(x.db.st||[]).includes('通常')&&curLV(x.card)<=2),targeting:true},'classa2.smash-target',{});},
  resolve(ctx){const t=ctx.selectedTargets[0]&&resolveTarget(ctx.selectedTargets[0]),d=t&&dbOf(t.card);if(!t||t.card.face!=='up'||t.card.token||!(d.st||[]).includes('通常')||curLV(t.card)>2)return;API.sendToGrave(t,'玉砕指令（リリース）');const q=API.fieldCards({player:ctx.opponent,filter:x=>['sz','field'].includes(x.zone)});if(q.length)ca2ResolveChoice(ctx,'玉砕指令：破壊する魔法・罠（2枚まで）',q,'classa2.destroy-st',{reason:'玉砕指令'},0,Math.min(2,q.length));}});

defineScript('痛み分け',{type:'spell',priority:1,
  condition(ctx){return ca2OwnMonsters(ctx).length>0&&API.fieldCards({player:ctx.opponent,zone:'mz'}).length>0;},
  activationV11(ctx,d){p11cOpen(d,{title:'痛み分け：リリースする自分のモンスター',candidates:ca2OwnMonsters(ctx)},'classa2.cost-commit',{fields:[]});},
  resolve(ctx){ca2ResolveChoice(ctx,'痛み分け：リリースするモンスター',API.fieldCards({player:ctx.opponent,zone:'mz'}),'classa2.opponent-tribute',{reason:'痛み分け'},1,1,ctx.opponent);}});

defineScript('光と闇の洗礼',{type:'spell',priority:2,includesSpecialSummon:true,blocksIfNoSpecialSummon:true,
  condition(ctx){return hasMonsterZoneSpace(ctx.player)&&ca2OwnMonsters(ctx,x=>ca2Same(x,'ブラック・マジシャン')).length>0&&ca2SpecialPool(ctx.player,'混沌の黒魔術師').length>0;},
  activationV11(ctx,d){p11cOpen(d,{title:'光と闇の洗礼：リリースするブラック・マジシャン',candidates:ca2OwnMonsters(ctx,x=>ca2Same(x,'ブラック・マジシャン'))},'classa2.cost-commit',{fields:[]});},
  resolve(ctx){ca2ResolveChoice(ctx,'光と闇の洗礼：特殊召喚する混沌の黒魔術師',ca2SpecialPool(ctx.player,'混沌の黒魔術師'),'classa2.special',{reason:'光と闇の洗礼'});}});

defineScript('フォトン・ジェネレーター・ユニット',{type:'spell',priority:2,includesSpecialSummon:true,blocksIfNoSpecialSummon:true,
  condition(ctx){return hasMonsterZoneSpace(ctx.player)&&ca2OwnMonsters(ctx,x=>ca2Same(x,'サイバー・ドラゴン')).length>=2&&ca2SpecialPool(ctx.player,'サイバー・レーザー・ドラゴン').length>0;},
  activationV11(ctx,d){p11cOpen(d,{title:'フォトン・ジェネレーター・ユニット：サイバー・ドラゴン2体',candidates:ca2OwnMonsters(ctx,x=>ca2Same(x,'サイバー・ドラゴン')),min:2,max:2},'classa2.cost-commit',{fields:[]});},
  resolve(ctx){ca2ResolveChoice(ctx,'フォトン・ジェネレーター・ユニット：特殊召喚',ca2SpecialPool(ctx.player,'サイバー・レーザー・ドラゴン'),'classa2.special',{reason:'フォトン・ジェネレーター・ユニット'});}});

defineScript('ボンディング－H2O',{type:'spell',priority:1,includesSpecialSummon:true,blocksIfNoSpecialSummon:true,
  condition(ctx){return hasMonsterZoneSpace(ctx.player)&&ca2OwnMonsters(ctx,x=>ca2Same(x,'ハイドロゲドン')).length>=2&&ca2OwnMonsters(ctx,x=>ca2Same(x,'オキシゲドン')).length>=1&&ca2SpecialPool(ctx.player,'ウォーター・ドラゴン').length>0;},
  activationV11(ctx,d){p11cOpen(d,{title:'ボンディング－H2O：ハイドロゲドン2体',candidates:ca2OwnMonsters(ctx,x=>ca2Same(x,'ハイドロゲドン')),min:2,max:2},'classa2.bond-hydro',{});},
  resolve(ctx){ca2ResolveChoice(ctx,'ボンディング－H2O：特殊召喚するウォーター・ドラゴン',ca2SpecialPool(ctx.player,'ウォーター・ドラゴン'),'classa2.special',{reason:'ボンディング－H2O'});}});

defineScript('キッズ・ガード',{type:'trap',priority:2,includesSpecialSummon:false,
  condition(ctx){const a=gameState.pendingAttack;return !!(a&&a.player===ctx.opponent&&ca2OwnMonsters(ctx,x=>ca2Same(x,'ヒーロー・キッズ')).length>0&&API.pileCards(ctx.player,'deck',x=>isSetCardV4(x.db,SETCODE.ELEMENTAL_HERO)).length>0);},
  activationV11(ctx,d){p11cOpen(d,{title:'キッズ・ガード：リリースするヒーロー・キッズ',candidates:ca2OwnMonsters(ctx,x=>ca2Same(x,'ヒーロー・キッズ'))},'classa2.cost-commit',{fields:[]});},
  resolve(ctx){API.negateAttack('キッズ・ガード');ca2ResolveChoice(ctx,'キッズ・ガード：手札に加えるE・HERO',API.pileCards(ctx.player,'deck',x=>isSetCardV4(x.db,SETCODE.ELEMENTAL_HERO)),'classa2.hero-search',{reason:'キッズ・ガード'});},
  passive:{onAttackDeclare(ctx){const a=gameState.pendingAttack;return ctx.zone==='sz'&&!!a&&a.player===ctx.opponent;}}});
