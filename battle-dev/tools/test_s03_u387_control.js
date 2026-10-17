/* S03-U387: 洗脳光線, 集団催眠, 破邪の刻印 (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3870001;
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













const BEAM='洗脳光線',HYP='集団催眠',SEAL='破邪の刻印';
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function faceSet(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function acnt(c){const x=C(c);return x&&x.counters?(Number(x.counters['A'])||0):0;}
function legalSz(c){return strictScriptLegalityV2(cardName(c),0,'sz',idx(c)).ok;}

/* ===== 洗脳光線 ===== */
function beamField(){fresh();const t=faceSet(BEAM,0),f=mon('ライオウ',1),g=mon('ワイト',1);f.counters={'A':2};
  gameState.players[0].sz=[t];gameState.players[1].mz=[f,g];baselineA();return {t,f,g};}
{ const x=beamField();
  ok('洗脳光線: activatable with an A Counter monster on the opposing field',legalSz(x.t)===true,'');
  actSzC(x.t,[uid(x.f)]);
  ok('洗脳光線: I took control of the A Counter monster (ワイト stays with the opponent)',pl(x.f)===0&&pl(x.g)===1,JSON.stringify([pl(x.f),pl(x.g)]));
  phase('end');
  ok('洗脳光線: at my End Phase one A Counter is removed (2 -> 1); I still control it',acnt(x.f)===1&&pl(x.f)===0,JSON.stringify([acnt(x.f),pl(x.f)]));
  endTurn();endTurn();phase('end');
  ok('洗脳光線: the next End Phase of mine removes the last A Counter -> the Trap is destroyed and the monster goes back',z(x.t)==='grave'&&pl(x.f)===1,JSON.stringify([z(x.t),pl(x.f),acnt(x.f)]));
  audit('洗脳光線 1'); }
{ const x=beamField();
  actSzC(x.t,[uid(x.f)]);
  act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:idx(x.f),byDestroy:true,reason:'test'});drive();
  ok('洗脳光線: the controlled monster destroyed -> the Trap is destroyed',z(x.f)==='grave'&&z(x.t)==='grave',JSON.stringify([z(x.f),z(x.t)])); }
{ fresh();const t=faceSet(BEAM,0),g=mon('ワイト',1);gameState.players[0].sz=[t];gameState.players[1].mz=[g];baselineA();
  ok('洗脳光線 negative: no A Counter monster -> not activatable',legalSz(t)===false,''); }

/* ===== 集団催眠 ===== */
function hypField(withAlien){fresh();const t=faceSet(HYP,0),e=mon(withAlien?'エーリアン・ソルジャー':'ワイト',0),f1=mon('ライオウ',1),f2=mon('ワイト',1),f3=mon('青眼の白龍',1),f4=mon('ブラック・マジシャン',1);
  [f1,f2,f3,f4].forEach(f=>{f.counters={'A':1};});
  gameState.players[0].sz=[t];gameState.players[0].mz=[e];gameState.players[1].mz=[f1,f2,f3,f4];baselineA();return {t,e,f1,f2,f3,f4};}
{ const x=hypField(true);
  ok('集団催眠: activatable with an エーリアン monster and A Counter monsters',legalSz(x.t)===true,'');
  actSzC(x.t,[uid(x.f1),'yes',uid(x.f2),'yes',uid(x.f3)]);
  ok('集団催眠: control of three A Counter monsters taken (the fourth stays)',pl(x.f1)===0&&pl(x.f2)===0&&pl(x.f3)===0&&pl(x.f4)===1,JSON.stringify([pl(x.f1),pl(x.f2),pl(x.f3),pl(x.f4)]));
  phase('end');
  ok('集団催眠: destroyed at the End Phase of the activation turn; the monsters go back',z(x.t)==='grave'&&pl(x.f1)===1&&pl(x.f2)===1&&pl(x.f3)===1,JSON.stringify([z(x.t),pl(x.f1),pl(x.f2),pl(x.f3)]));
  audit('集団催眠 1'); }
{ const x=hypField(false);
  ok('集団催眠 negative: no エーリアン monster on my field -> not activatable',legalSz(x.t)===false,''); }

/* ===== 破邪の刻印 ===== */
function sealField(){fresh();const t=faceSet(SEAL,0),f=mon('ライオウ',1);gameState.players[0].sz=[t];gameState.players[1].mz=[f];baselineA();return {t,f};}
{ const x=sealField();
  actSzC(x.t);
  PREFER=[uid(x.f)];endTurn();PREFER=[];
  ok('破邪の刻印: at the opponent Standby Phase the chosen face-up card (ライオウ) has its effect negated for the turn',effectNegated(C(x.f))===true,String(effectNegated(C(x.f))));
  PREFER=['yes'];endTurn();PREFER=[];
  ok('破邪の刻印: the negation is over the next turn',effectNegated(C(x.f))===false,String(effectNegated(C(x.f))));
  ok('破邪の刻印: at my Standby Phase answering yes -> 500 LP paid, the Trap stays',lp(0)===7500&&z(x.t)==='sz',JSON.stringify([lp(0),z(x.t)]));
  audit('破邪の刻印 1'); }
{ const x=sealField();
  actSzC(x.t);
  PREFER=[uid(x.f)];endTurn();PREFER=[];
  PREFER=['no'];endTurn();PREFER=[];
  ok('破邪の刻印: at my Standby Phase answering no -> no payment, the Trap is destroyed',lp(0)===8000&&z(x.t)==='grave',JSON.stringify([lp(0),z(x.t)])); }
`);
