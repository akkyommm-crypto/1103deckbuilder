/* S03-U427: マスクド・チョッパー, 原子ホタル, タイム・イーター, ビッグ・ワン・ウォリアー, 魔轟神獣チャワ, コロボックリ, マツボックル (ENGINE_GAP cards).
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
let PREFER=[];function pick(){const q=pc();if(q.min===0){answerChoiceV49([]);return;}
  if(q.min>1){const keys=[];PREFER.forEach(u=>{const x=q.candidates.find(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(x&&keys.length<q.max&&keys.indexOf(x.key)<0)keys.push(x.key);});q.candidates.forEach(x=>{if(keys.length<q.min&&keys.indexOf(x.key)<0)keys.push(x.key);});answerChoiceV49(keys);return;}SEEN.push({title:q.title,cands:q.candidates.map(x=>x.uid||x.value||x.key)});let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0){const u=PREFER.find(u=>q.candidates.some(x=>x.uid===u||x.value===u||x.key===u||x.label===u||(x.card&&x.card.uid===u)));PREFER.splice(PREFER.indexOf(u),1);}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<800;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x41B0001;
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





























































const SEEN=[];
const CHO='マスクド・チョッパー',FLY='原子ホタル',TIM='タイム・イーター',BIG='ビッグ・ワン・ウォリアー',CHA='魔轟神獣チャワ',KOR='コロボックリ',MAT='マツボックル';
function myAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function toOppBattle(){endTurn();phase('battle');}
function boost(c,n){c.mods=[{atk:n,def:0,until:'permanent',label:'fixture',turn:5}];}
function handFx(i){return getLegalHandActions(0,i).some(a=>a.id==='handEffect');}

/* ===== マスクド・チョッパー ===== */
{ fresh();const c=mon(CHO,0),f=mon('ワイト',1);boost(c,2000);gameState.players[0].mz=[c];gameState.players[1].mz=[f];baselineA();
  const l1=lp(1);phase('battle');myAttack(c,f);
  ok('チョッパー: it destroyed a monster in battle → 2000 damage to the opponent on top of the battle damage (2100-300)',z(f)==='grave'&&l1-lp(1)===1800+2000,JSON.stringify([z(f),l1,lp(1)]));
  audit('チョッパー 1'); }
{ fresh();const c=mon(CHO,0),f=mon('青眼の白龍',1);gameState.players[0].mz=[c];gameState.players[1].mz=[f];baselineA();
  const l1=lp(1);phase('battle');myAttack(c,f);
  ok('チョッパー negative: it was destroyed instead → no effect damage',z(c)==='grave'&&lp(1)===l1,JSON.stringify([z(c),l1,lp(1)])); }

/* ===== タイム・イーター ===== */
{ fresh();const c=mon(TIM,0),f=mon('ワイト',1);gameState.players[0].mz=[c];gameState.players[1].mz=[f];baselineA();
  phase('battle');myAttack(c,f);
  ok('タイム・イーター: it destroyed a monster in battle → the opponent\'s next Main Phase 1 is skipped',z(f)==='grave'&&JSON.stringify((gameState.phaseSkipV7||{})['1:main1'])==='['+(gameState.turn+1)+']',JSON.stringify([z(f),gameState.phaseSkipV7]));
  endTurn();
  ok('タイム・イーター: the opponent\'s turn did not reach Main Phase 1',gameState.activePlayer===1&&gameState.phase!=='main1',JSON.stringify([gameState.activePlayer,gameState.phase]));
  audit('タイム・イーター 1'); }

/* ===== 原子ホタル ===== */
{ fresh();const h=mon(FLY,0),b=mon('青眼の白龍',1);gameState.players[0].mz=[h];gameState.players[1].mz=[b];baselineA();
  const l1=lp(1);toOppBattle();foeAttack(b,h);
  ok('原子ホタル: destroyed in battle while face-up → the destroyer\'s controller took 1000 damage',z(h)==='grave'&&l1-lp(1)===1000,JSON.stringify([z(h),l1,lp(1)]));
  audit('原子ホタル 1'); }
{ fresh();const h=mon(FLY,0);gameState.players[0].mz=[h];baselineA();
  const l1=lp(1);API.destroy(findCardByUid(h.uid),'test');flushDeferredEventsV2();drive();
  ok('原子ホタル negative: destroyed by a card effect (not in battle) → no damage',z(h)==='grave'&&lp(1)===l1,JSON.stringify([z(h),l1,lp(1)])); }

/* ===== ビッグ・ワン・ウォリアー ===== */
{ fresh();const b=mk(BIG,0),w=mk('ワイト',0);gameState.players[0].hand=[b,w];baselineA();
  ok('ビッグ・ワン: the hand effect is offered (another Level 1 monster in the hand)',handFx(0)===true,JSON.stringify(getLegalHandActions(0,0).map(a=>a.id)));
  PREFER=[uid(w)];duelActivateFromHand(0);drive();PREFER=[];
  ok('ビッグ・ワン: ワイト was sent to the Graveyard and it was Special Summoned from the hand',z(b)==='mz'&&z(w)==='grave',JSON.stringify([z(b),z(w)]));
  audit('ビッグ・ワン 1'); }
{ fresh();const b=mk(BIG,0),w=mk('ブラック・マジシャン',0);gameState.players[0].hand=[b,w];baselineA();
  ok('ビッグ・ワン negative: no other Level 1 monster in the hand → not offered',handFx(0)===false,JSON.stringify(getLegalHandActions(0,0).map(a=>a.id))); }

/* ===== 魔轟神獣チャワ ===== */
{ fresh();const c=mk(CHA,0),f=mk('魔轟神ウルストス',0);gameState.players[0].hand=[c,f];baselineA();
  ok('チャワ: the hand effect is offered (another 「魔轟神」 monster in the hand)',handFx(0)===true,JSON.stringify(getLegalHandActions(0,0).map(a=>a.id)));
  PREFER=[uid(f)];duelActivateFromHand(0);drive();PREFER=[];
  ok('チャワ: the 「魔轟神」 monster was discarded and it was Special Summoned from the hand',z(c)==='mz'&&z(f)==='grave',JSON.stringify([z(c),z(f)]));
  audit('チャワ 1'); }
{ fresh();const c=mk(CHA,0),w=mk('ワイト',0);gameState.players[0].hand=[c,w];baselineA();
  ok('チャワ negative: no other 「魔轟神」 monster in the hand → not offered',handFx(0)===false,JSON.stringify(getLegalHandActions(0,0).map(a=>a.id))); }

/* ===== コロボックリ / マツボックル ===== */
{ fresh();const k=mk(KOR,0),m=mk(MAT,0);gameState.players[0].hand=[k,m];baselineA();
  ok('コロボックリ: the hand effect is offered (マツボックル in the hand)',handFx(0)===true,JSON.stringify(getLegalHandActions(0,0).map(a=>a.id)));
  duelActivateFromHand(0);drive();
  ok('コロボックリ: マツボックル was sent to the Graveyard; コロボックリ was Special Summoned',z(k)==='mz'&&(z(m)==='grave'||z(m)==='mz'),JSON.stringify([z(k),z(m)]));
  ok('マツボックル: sent by コロボックリ\'s effect → Special Summoned from the Graveyard',z(m)==='mz',z(m));
  audit('コロボックリ 1'); }
{ fresh();const m=mk(MAT,0);gameState.players[0].hand=[m];baselineA();
  API.sendHandToGrave(0,0,'test');flushDeferredEventsV2();drive();
  ok('マツボックル negative: sent to the Graveyard by something else → not Special Summoned',z(m)==='grave',z(m)); }
{ fresh();const k=mk(KOR,0),w=mk('ワイト',0);gameState.players[0].hand=[k,w];baselineA();
  ok('コロボックリ negative: no マツボックル in the hand → not offered',handFx(0)===false,JSON.stringify(getLegalHandActions(0,0).map(a=>a.id))); }
`);
