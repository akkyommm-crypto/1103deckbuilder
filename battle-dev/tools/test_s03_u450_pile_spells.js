/* S03-U450: 魔の試着部屋, ヴォルカニック・チャージ, 次元融合, ブレンD, バブル・クラッシュ (stale ENGINE_GAP Spells / Traps).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4310001;
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
const FIT='魔の試着部屋',VOL='ヴォルカニック・チャージ',DIM='次元融合',BLE='ブレンD',CRU='バブル・クラッシュ';
function H(c){return findCardByUid(c.uid);}
function setTrap(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function legalT(i){return strictScriptLegalityV2(cardName(gameState.players[0].sz[i]),0,'sz',i).ok;}
let ALL=false;const __p=pick;pick=function(){const q=pc();if(ALL&&q&&q.title.indexOf('ヴォルカニック')>=0){answerChoiceV49(q.candidates.map(c=>c.key));return;}return __p();};

/* ===== 魔の試着部屋 ===== */
{ fresh();const sp=mk(FIT,0),a=mk('ウィルミー',0),b=mk('ワイト',0),c=mk('ブラック・マジシャン',0),d=mk('アイヴィ・ウォール',0);gameState.players[0].hand=[sp];
  gameState.players[0].deck=[a,b,c,d].concat(gameState.players[0].deck);baselineA();
  const l0=lp(0);cast(0,FIT);
  ok('魔の試着部屋: 800 LP paid; of the top 4 cards only the Level 3 or lower Normal Monster (ワイト) was Special Summoned',lp(0)===l0-800&&z(b)==='mz'&&z(a)==='deck'&&z(c)==='deck'&&z(d)==='deck',JSON.stringify([l0,lp(0),z(a),z(b),z(c),z(d)]));
  audit('試着部屋 1'); }
{ fresh();const sp=mk(FIT,0);gameState.players[0].hand=[sp];gameState.players[0].deck=[];baselineA();
  ok('魔の試着部屋 negative: empty Deck → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== ヴォルカニック・チャージ ===== */
{ fresh();const tr=setTrap(VOL,0),a=mk('ヴォルカニック・エッジ',0),b=mk('ヴォルカニック・カウンター',0),c=mk('ヴォルカニック・クイーン',0),x=mk('ワイト',0);gameState.players[0].sz=[tr];gameState.players[0].grave=[a,b,c,x];baselineA();
  ALL=true;duelActivateFromZone(0,'sz',0);drive();ALL=false;
  ok('ヴォルカニック・チャージ: the three 「ヴォルカニック」 of my Graveyard went back to the Deck (the non-ヴォルカニック stays)',z(a)==='deck'&&z(b)==='deck'&&z(c)==='deck'&&z(x)==='grave',JSON.stringify([z(a),z(b),z(c),z(x)]));
  audit('ヴォルカニック 1'); }
{ fresh();const tr=setTrap(VOL,0),x=mk('ワイト',0);gameState.players[0].sz=[tr];gameState.players[0].grave=[x];baselineA();
  ok('ヴォルカニック・チャージ negative: no 「ヴォルカニック」 in the Graveyard → not activatable',legalT(0)===false,''); }

/* ===== 次元融合 ===== */
{ fresh();const sp=mk(DIM,0),a=mk('ワイト',0),b=mk('ブラック・マジシャン',1),c=mk('ワイト',1);gameState.players[0].hand=[sp];gameState.players[0].banish=[a];gameState.players[1].banish=[b,c];baselineA();
  const l0=lp(0);cast(0,DIM);
  ok('次元融合: 2000 LP paid; the banished monsters of both players were Special Summoned to their own fields',lp(0)===l0-2000&&z(a)==='mz'&&H(a).p===0&&z(b)==='mz'&&H(b).p===1&&z(c)==='mz'&&H(c).p===1,JSON.stringify([l0,lp(0),z(a),z(b),z(c)]));
  audit('次元融合 1'); }
{ fresh();const sp=mk(DIM,0);gameState.players[0].hand=[sp];baselineA();
  ok('次元融合 negative: no banished monster → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== ブレンD ===== */
{ fresh();const tr=setTrap(BLE,0),d1=mon('D・キャメラン',0),d2=mon('D・クリーナン',0),f=mon('青眼の白龍',1),st=mk('ブラック・ホール',1,'down');gameState.players[0].sz=[tr];gameState.players[0].mz=[d1,d2];gameState.players[1].mz=[f];gameState.players[1].sz=[st];baselineA();
  PREFER=[uid(f),uid(st),uid(st)];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  ok('ブレンD: two opponent cards chosen; the opponent chose the Set card to be destroyed (the monster stays)',z(st)==='grave'&&z(f)==='mz',JSON.stringify([z(st),z(f)]));
  audit('ブレンD 1'); }
{ fresh();const tr=setTrap(BLE,0),d1=mon('D・キャメラン',0),f=mon('青眼の白龍',1),st=mk('ブラック・ホール',1,'down');gameState.players[0].sz=[tr];gameState.players[0].mz=[d1];gameState.players[1].mz=[f];gameState.players[1].sz=[st];baselineA();
  ok('ブレンD negative: only one 「D」 monster → not activatable',legalT(0)===false,''); }

/* ===== バブル・クラッシュ ===== */
{ fresh();const tr=setTrap(CRU,0),A=[1,2,3,4,5,6].map(()=>mk('ワイト',0)),B=[1,2,3,4,5,6].map(()=>mk('ワイト',1));gameState.players[0].sz=[tr];gameState.players[0].hand=A;gameState.players[1].hand=B;baselineA();
  const a0=uid(A[0]),a1=uid(A[1]),b0=uid(B[0]);PREFER=[a0,a1,b0];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
  const g0=gameState.players[0].grave.map(c=>c.uid),g1=gameState.players[1].grave.map(c=>c.uid);
  ok('バブル・クラッシュ: I (6 hand cards + the Trap on the field = 7) chose 2, the opponent (6 cards) chose 1',g0.indexOf(a0)>=0&&g0.indexOf(a1)>=0&&g1.indexOf(b0)>=0&&gameState.players[0].hand.length===4&&gameState.players[1].hand.length===5,JSON.stringify([gameState.players[0].hand.length,gameState.players[1].hand.length,g0,g1,a0,a1,b0]));
  audit('バブルクラッシュ 1'); }
{ fresh();const tr=setTrap(CRU,0);gameState.players[0].sz=[tr];gameState.players[0].hand=[mk('ワイト',0)];gameState.players[1].hand=[mk('ワイト',1)];baselineA();
  ok('バブル・クラッシュ negative: nobody has 6 or more cards → not activatable',legalT(0)===false,''); }
`);
