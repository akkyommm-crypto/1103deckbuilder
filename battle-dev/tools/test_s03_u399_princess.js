/* S03-U399: 王女の試練, 魔法の国の王女－ピケル, 魔法の国の王女－クラン (NOT_STARTED cards).
   Real DUEL paths, Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pl(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function C(c){const h=findCardByUid(c.uid);return h?h.card:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];const SEEN=[];
function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}
  if(q.min>1){const keys=[];PREFER.forEach(u=>{const x=q.candidates.find(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(x&&keys.length<q.max&&keys.indexOf(x.key)<0)keys.push(x.key);});q.candidates.forEach(x=>{if(keys.length<q.min&&keys.indexOf(x.key)<0)keys.push(x.key);});answerChoiceV49(keys);return;}SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid||x.value||x.key)});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0){const u=PREFER.find(u=>q.candidates.some(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u)));PREFER.splice(PREFER.indexOf(u),1);}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3990001;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function lp(p){return gameState.players[p].lp;}
function mon(name,p,pos){const c=mk(name,p,'up',pos||'atk');c.summonedTurn=3;return c;}
function startTurn(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function endTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();startTurn();}
function toOppBattle(){endTurn();phase('battle');}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function actC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function equipped(host,eq){const h=C(host),e=C(eq);return !!h&&!!e&&e.equipTo&&e.equipTo.uid===host.uid&&Array.isArray(h.equippedBy)&&h.equippedBy.indexOf(e.equipUid)>=0;}
function legalH(i){const acts=getLegalHandActions(0,i||0);return {ok:acts.some(x=>x.id==='activate'),actions:acts.map(x=>x.id)};}
function cc(c){const x=C(c);return x&&x.counters?Number(x.counters['魔力'])||0:0;}
function setCard(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}

function offeredTo(p,c){return !!(gameState.chainWindow&&gameState.chain.length&&getChainResponsesV2(p).some(x=>x.card===c));}
function respond(p,c,prefer){const hh=findCardByUid(c.uid); if(!hh) return false;
  PREFER=(prefer||[]).slice();duelActivateResponseV2(p,hh.zone,hh.index);for(let i=0;i<10&&pc();i++)pick();PREFER=[];return true;}
function foeCast(name,prefer){const i=gameState.players[1].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);for(let i2=0;i2<10&&pc();i2++)pick();PREFER=[];}
function actZ(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'mz',idx(c));drive();PREFER=[];}
function canZ(c){return getLegalZoneActions(0,'mz',idx(c)).map(a=>a.id).indexOf('effect')>=0;}

function sz(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function actSz(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function legalSz(c){return strictScriptLegalityV2(cardName(c),0,'sz',idx(c)).ok;}
function gv(c){return curATK(C(c));}

























const TRI='王女の試練',PIK='魔法の国の王女－ピケル',CLA='魔法の国の王女－クラン',WPI='白魔導士ピケル',BCL='黒魔導師クラン';
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function szActs(p,c){return getLegalZoneActions(p,'sz',idx(c)).map(a=>a.id);}
function legalH(i){const acts=getLegalHandActions(0,i||0);return {ok:acts.some(x=>x.id==='activate'),actions:acts.map(x=>x.id)};}

/* ===== 王女の試練 ===== */
{ fresh();const t=mk(TRI,0,'up'),p=mon(WPI,0);gameState.players[0].hand=[t];gameState.players[0].mz=[p];baselineA();
  cast(0,TRI,[uid(p)]);
  ok('試練: equipped to 白魔導士ピケル; ATK 1200 + 800 = 2000',z(t)==='sz'&&C(t).equipTo&&C(t).equipTo.uid===p.uid&&curATK(C(p))===2000,JSON.stringify({t:z(t),atk:curATK(C(p))}));
  audit('試練 1'); }
{ fresh();const t=mk(TRI,0,'up'),w=mon('ワイト',0);gameState.players[0].hand=[t];gameState.players[0].mz=[w];baselineA();
  ok('試練 negative: only a ワイト on my field → cannot be equipped (not activatable)',legalH(0).ok===false,JSON.stringify(legalH(0))); }
function trial(victim,pos){fresh();const t=mk(TRI,0,'up'),p=mon(WPI,0),pr=mk(PIK,0),v=mon(victim,1,pos||'atk');gameState.players[0].hand=[t,pr];gameState.players[0].mz=[p];gameState.players[1].mz=[v];baselineA();
  cast(0,TRI,[uid(p)]);return {t,p,pr,v};}
{ const x=trial('アイツ','atk');
  phase('battle');atkTarget(0,x.p,x.v);phase('main2');
  ok('試練: the equipped monster destroyed a Level 5 monster in battle',z(x.v)==='grave',z(x.v));
  ok('試練: the Princess effect is offered in that turn',szActs(0,x.t).some(a=>a==='effect'||a==='activate'),JSON.stringify(szActs(0,x.t)));
  actSzC(x.t);
  ok('試練: 白魔導士ピケル and the Equip Spell were Tributed; 魔法の国の王女－ピケル Special Summoned from the hand',z(x.p)==='grave'&&z(x.t)==='grave'&&z(x.pr)==='mz',JSON.stringify({p:z(x.p),t:z(x.t),pr:z(x.pr)}));
  audit('試練 2'); }
{ const x=trial('ワイト','atk');
  phase('battle');atkTarget(0,x.p,x.v);phase('main2');
  ok('試練 negative: a Level 1 victim → the Princess effect is not offered',z(x.v)==='grave'&&!szActs(0,x.t).some(a=>a==='effect'||a==='activate'),JSON.stringify(szActs(0,x.t))); }
{ const x=trial('アイツ','atk');
  ok('試練 negative: no battle yet → not offered',!szActs(0,x.t).some(a=>a==='effect'||a==='activate'),JSON.stringify(szActs(0,x.t))); }

/* ===== 王女 ===== */
{ fresh();const pr=mon(PIK,0),o=mon('ワイト',0);gameState.players[0].mz=[pr,o];baselineA();
  const l0=lp(0);endTurn();endTurn();
  ok('ピケル: at my Standby Phase I recover 800 x 2 monsters = 1600',lp(0)===l0+1600,JSON.stringify([l0,lp(0)]));
  audit('ピケル 1'); }
{ fresh();const pr=mon(CLA,0),f1=mon('ワイト',1),f2=mon('ワイト',1);gameState.players[0].mz=[pr];gameState.players[1].mz=[f1,f2];baselineA();
  const l1=lp(1);endTurn();endTurn();
  ok('クラン: at my Standby Phase the opponent takes 600 x 2 monsters = 1200',lp(1)===l1-1200,JSON.stringify([l1,lp(1)]));
  audit('クラン 1'); }
{ fresh();const pr=mk(PIK,0),cl=mk(CLA,0);gameState.players[0].hand=[pr,cl];baselineA();
  ok('王女: Special Summonable by the effect of 王女の試練 only',canEffectSpecialSummonS03(C(pr),'hand','王女の試練')===true&&canEffectSpecialSummonS03(C(pr),'hand','死者蘇生')===false,JSON.stringify([canEffectSpecialSummonS03(C(pr),'hand','王女の試練'),canEffectSpecialSummonS03(C(pr),'hand','死者蘇生')]));
  ok('王女: no Normal Summon',getLegalHandActions(0,0).every(a=>a.id!=='summon'&&a.id!=='normalSummon'),JSON.stringify(getLegalHandActions(0,0).map(a=>a.id))); }
`);
