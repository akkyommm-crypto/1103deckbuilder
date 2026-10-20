/* S03-U403: 異次元隔離マシーン, コーリング・マジック (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4030001;
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






























const ISO='異次元隔離マシーン',CAL='コーリング・マジック';
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function faceSet(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function legalH(i){const acts=getLegalHandActions(0,i||0);return {ok:acts.some(x=>x.id==='activate'),actions:acts.map(x=>x.id)};}

/* ===== 異次元隔離マシーン ===== */
{ fresh();const m=mk(ISO,0,'up'),a=mon('ブラック・マジシャン',0),b=mon('青眼の白龍',1,'def'),cy=mk('サイクロン',1);
  gameState.players[0].hand=[m];gameState.players[0].mz=[a];gameState.players[1].mz=[b];gameState.players[1].hand=[cy];baselineA();
  cast(0,ISO);PREFER=[uid(a),uid(b)];duelActivateFromZone(0,'sz',idx(m));drive();PREFER=[];
  ok('隔離マシーン: a monster of each side was banished',z(a)==='banish'&&z(b)==='banish'&&z(m)==='sz'&&C(m).face==='up',JSON.stringify({a:z(a),b:z(b),m:z(m)}));
  endTurn();
  cast(1,'サイクロン',[uid(m)]);
  ok('隔離マシーン: destroyed → the banished monsters returned to their fields in the same Battle Position (mine Attack, theirs Defense)',z(m)==='grave'&&z(a)==='mz'&&pl(a)===0&&C(a).pos==='atk'&&z(b)==='mz'&&pl(b)===1&&C(b).pos==='def',JSON.stringify({m:z(m),a:[z(a),pl(a),C(a)&&C(a).pos],b:[z(b),pl(b),C(b)&&C(b).pos]}));
  audit('隔離マシーン 1'); }
{ fresh();const m=mk(ISO,0,'up'),a=mon('ブラック・マジシャン',0);gameState.players[0].hand=[m];gameState.players[0].mz=[a];baselineA();
  cast(0,ISO);
  ok('隔離マシーン negative: the opponent has no monster → no isolate effect offered',getLegalZoneActions(0,'sz',idx(m)).every(x=>x.id!=='effect'),JSON.stringify(getLegalZoneActions(0,'sz',idx(m)).map(x=>x.id))); }

/* ===== コーリング・マジック ===== */
{ fresh();const c=faceSet(CAL,0),q=mk('サイクロン',0),cy=mk('サイクロン',1);gameState.players[0].sz=[c];gameState.players[0].deck=[q].concat(gameState.players[0].deck);gameState.players[1].hand=[cy];baselineA();
  endTurn();
  cast(1,'サイクロン',[uid(c)]);
  ok('コーリング・マジック: the Set card destroyed by the opponent Spell → a Quick-Play Spell of the Deck was Set face-down on my field',z(c)==='grave'&&z(q)==='sz'&&C(q).face==='down',JSON.stringify({c:z(c),q:z(q),face:C(q)&&C(q).face}));
  audit('コーリング・マジック 1'); }
{ fresh();const c=faceSet(CAL,0),q=mk('サイクロン',0),cy=mk('サイクロン',0);gameState.players[0].sz=[c];gameState.players[0].hand=[cy];gameState.players[0].deck=[q].concat(gameState.players[0].deck);baselineA();
  cast(0,'サイクロン',[uid(c)]);
  ok('コーリング・マジック negative: destroyed by my own card → no effect',z(c)==='grave'&&z(q)==='deck',JSON.stringify({c:z(c),q:z(q)})); }
`);
