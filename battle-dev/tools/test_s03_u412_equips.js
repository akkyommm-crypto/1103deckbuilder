/* S03-U412: 災いの装備品, D・パワーユニット, コアバスター (NOT_STARTED Equip Spells).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x40C0001;
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
const CAL='災いの装備品',DPU='D・パワーユニット',COB='コアバスター';
function atkTarget(p,c,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(c),target:t==='direct'?'direct':idx(t)});drive();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function legalH(i){const acts=getLegalHandActions(0,i||0);return {ok:acts.some(x=>x.id==='activate'),actions:acts.map(x=>x.id)};}

/* ===== 災いの装備品 ===== */
{ fresh();const e=mk(CAL,0,'up'),w1=mon('ワイト',0),w2=mon('ワイト',0),f=mon('青眼の白龍',1),g=mon('ライオウ',1),cy=mk('サイクロン',0);
  gameState.players[0].hand=[e,cy];gameState.players[0].mz=[w1,w2];gameState.players[1].mz=[f,g];baselineA();
  cast(0,CAL,[uid(f)]);
  ok('災いの装備品: equipped to the opponent 青眼; ATK 3000 - 600 x my 2 monsters = 1800',z(e)==='sz'&&C(e).equipTo&&C(e).equipTo.uid===f.uid&&curATK(C(f))===1800,JSON.stringify([z(e),curATK(C(f))]));
  ok('災いの装備品: the equipped Equip card is not offered its equip activation again',getLegalZoneActions(0,'sz',idx(e)).every(a=>a.id!=='activate'),JSON.stringify(getLegalZoneActions(0,'sz',idx(e)).map(a=>a.id)));
  cast(0,'サイクロン',[uid(e),'yes',uid(g)]);
  ok('災いの装備品: destroyed on the field (サイクロン) → it equipped itself to the other opponent monster ライオウ (ATK 1900 - 1200 = 700)',z(e)==='sz'&&C(e).equipTo&&C(e).equipTo.uid===g.uid&&curATK(C(g))===700&&curATK(C(f))===3000,JSON.stringify([z(e),C(e)&&C(e).equipTo&&C(e).equipTo.uid,curATK(C(g)),curATK(C(f))]));
  audit('災いの装備品 1'); }

/* ===== D・パワーユニット ===== */
{ fresh();const e=mk(DPU,0,'up'),d=mon('D・ボードン',0);gameState.players[0].hand=[e];gameState.players[0].mz=[d];baselineA();
  cast(0,DPU,[uid(d)]);
  ok('D・パワーユニット: equipped to D・ボードン (Level 3); original ATK 500 doubled → 1000',z(e)==='sz'&&curATK(C(d))===1000,JSON.stringify([z(e),curATK(C(d))]));
  endTurn();endTurn();
  ok('D・パワーユニット: still in place at the first own Standby Phase after the activation',z(e)==='sz',z(e));
  const l0=lp(0);endTurn();endTurn();
  ok('D・パワーユニット: at the 2nd own Standby Phase after the activation it is destroyed and I take the original ATK 500',z(e)==='grave'&&lp(0)===l0-500,JSON.stringify([z(e),l0,lp(0)]));
  audit('D・パワーユニット 1'); }
{ fresh();const e=mk(DPU,0,'up'),k=mon('ワイト',0);gameState.players[0].hand=[e];gameState.players[0].mz=[k];baselineA();
  ok('D・パワーユニット negative: only a non-「D」 monster → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== コアバスター ===== */
function coreField(){fresh();const e=mk(COB,0,'up'),c=mon('コアキメイル・ウォーアームズ',0),l=mon('青眼の白龍',1),bh=mk('ブラック・ホール',0);
  gameState.players[0].hand=[e,bh];gameState.players[0].mz=[c];gameState.players[1].mz=[l];baselineA();cast(0,COB,[uid(c)]);return {e,c,l,bh};}
{ const x=coreField();
  phase('battle');const l0=lp(0);atkTarget(0,x.c,x.l);
  ok('コアバスター: the host (ATK 1400) attacked 青眼 (LIGHT, ATK 3000): destroyed without damage calculation, no damage to me',z(x.l)==='grave'&&z(x.c)==='mz'&&lp(0)===l0,JSON.stringify([z(x.l),z(x.c),lp(0)]));
  audit('コアバスター 1'); }
{ fresh();const e=mk(COB,0,'up'),c=mon('コアキメイル・ウォーアームズ',0),m=mon('きのこマン',1);gameState.players[0].hand=[e];gameState.players[0].mz=[c];gameState.players[1].mz=[m];baselineA();
  cast(0,COB,[uid(c)]);phase('battle');atkTarget(0,c,m);
  ok('コアバスター negative: an EARTH monster (きのこマン) is fought normally (the host ATK 1400 > 800 destroys it by the calculation)',z(m)==='grave'&&z(c)==='mz',JSON.stringify([z(m),z(c)])); }
{ const x=coreField();
  PREFER=['yes'];cast(0,'ブラック・ホール');PREFER=[];
  ok('コアバスター: the host left the field → the Equip went to the Graveyard and returned to my hand',z(x.c)==='grave'&&z(x.e)==='hand',JSON.stringify([z(x.c),z(x.e)]));
  audit('コアバスター 2'); }
`);
