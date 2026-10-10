/* S03-U55 C-S03-42 NORMAL_SUMMON_METHOD_REPLAY
   Requirement: a NORMAL_SUMMON / SET_MONSTER Action that carries summonMethod must apply that method inside the reducer.
   Before the fix, DUEL-mode callers applied バルバロス0体召喚's procedureBaseStats after act(), so the next journaled
   EVENT_QUEUE_V31 digest contained unjournaled state and replay diverged at the summon event. */
const harness=require('./astra_harness');

harness(String.raw`
function nm(c){return c?cardName(c):null;}
function auditNow(){
  const pkg=v41ReplayPackage(gameState);
  return {pkg,audit:v44ReplayAuditPackage(pkg)};
}
function barbaros(){return mk('神獣王バルバロス',0,'down','atk');}

resetA();
gameState.players[0].hand=[barbaros()];
baselineA();
act({type:'NORMAL_SUMMON_ATTEMPT',player:0,name:'神獣王バルバロス',extraNormalKey:null});
act({type:'SUMMON_WINDOW_OPEN_V42',pending:{player:0,name:'神獣王バルバロス',kind:'normal',uid:gameState.players[0].hand[0].uid,resumeS03:{uid:gameState.players[0].hand[0].uid,tributes:0,tributeValue:0,summonMethod:'barbaros0',p3Materials:[]}}});
act({type:'SUMMON_WINDOW_CLOSE_V42',result:'commit'});
act({type:'NORMAL_SUMMON',player:0,handIndex:0,pos:'atk',tributes:0,tributeValue:0,prepaid:true,summonMethod:'barbaros0',p3Materials:[]});
let summoned=gameState.players[0].mz[0];
ok('U55: NORMAL_SUMMON action applies バルバロス0 procedure state before the event is queued',
  nm(summoned)==='神獣王バルバロス'&&summoned.normalSummonMethod==='barbaros0'&&summoned.procedureBaseStats&&summoned.procedureBaseStats.atk===1900&&curATK(summoned)===1900,
  JSON.stringify({name:nm(summoned),method:summoned&&summoned.normalSummonMethod,stats:summoned&&summoned.procedureBaseStats,atk:summoned&&curATK(summoned)}));
queueDeferredEventV2('onNormalSummon',{player:0,name:'神獣王バルバロス',card:summoned});
let r=auditNow();
ok('U55: queued summon event replays after バルバロス0 without digest divergence',
  r.audit.ok&&r.audit.count===r.pkg.actions.length,
  JSON.stringify(r.audit));
act({type:'FX_CARD_FLAG_V46',player:0,zone:'mz',index:0,flag:'negatedUntilTurn',value:gameState.turn,reason:'エフェクト・ヴェーラー',silent:true});
ok('U55: effect-negation flag action ends バルバロス0 procedure state inside the reducer',
  summoned.negatedUntilTurn===gameState.turn&&!summoned.procedureBaseStats&&curATK(summoned)===3000,
  JSON.stringify({negated:summoned.negatedUntilTurn,stats:summoned.procedureBaseStats,atk:curATK(summoned)}));
act({type:'EVENT_DEQUEUE_V31'});
r=auditNow();
ok('U55: dequeue after effect negation replays without digest divergence',
  r.audit.ok&&r.audit.count===r.pkg.actions.length,
  JSON.stringify(r.audit));

resetA();
gameState.players[0].sz=[mk('スキルドレイン',0,'up','atk')];
gameState.players[0].hand=[barbaros()];
baselineA();
act({type:'NORMAL_SUMMON',player:0,handIndex:0,pos:'atk',tributes:0,tributeValue:0,summonMethod:'barbaros0',p3Materials:[]});
summoned=gameState.players[0].mz[0];
ok('U55: バルバロス0 summoned under face-up スキルドレイン loses procedure state inside the same action',
  nm(summoned)==='神獣王バルバロス'&&summoned.normalSummonMethod==='barbaros0'&&!summoned.procedureBaseStats&&curATK(summoned)===3000,
  JSON.stringify({name:nm(summoned),method:summoned&&summoned.normalSummonMethod,stats:summoned&&summoned.procedureBaseStats,atk:summoned&&curATK(summoned)}));
r=auditNow();
ok('U55: Skill Drain continuous negation of procedure state replays cleanly',
  r.audit.ok&&r.audit.count===r.pkg.actions.length,
  JSON.stringify(r.audit));

resetA();
gameState.players[0].hand=[barbaros()];
baselineA();
act({type:'SET_MONSTER',player:0,handIndex:0,tributes:0,tributeValue:0,summonMethod:'barbaros0'});
let set=gameState.players[0].mz[0];
ok('U55: SET_MONSTER action records set-side summon method for later flip handling',
  nm(set)==='神獣王バルバロス'&&set.face==='down'&&set.normalSummonMethod==='barbaros0'&&!set.procedureBaseStats,
  JSON.stringify({name:nm(set),face:set&&set.face,method:set&&set.normalSummonMethod,stats:set&&set.procedureBaseStats}));
r=auditNow();
ok('U55: set-side summon method action also replays cleanly',r.audit.ok&&r.audit.count===r.pkg.actions.length,JSON.stringify(r.audit));
`);
