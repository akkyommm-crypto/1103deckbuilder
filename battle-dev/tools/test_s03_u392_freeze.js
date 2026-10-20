/* S03-U392: 悪夢の鉄檻, 大寒波, 閃光弾 (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x3920001;
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


















const CAG='悪夢の鉄檻',COL='大寒波',FLA='閃光弾';
function foeAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function myAttack(att,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});drive();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function legalH(i){const acts=getLegalHandActions(0,i||0);return {ok:acts.some(x=>x.id==='activate'),actions:acts.map(x=>x.id)};}
function faceSet(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}

/* ===== 悪夢の鉄檻 ===== */
{ fresh();const sp=mk(CAG,0,'up'),a=mon('ブラック・マジシャン',0),f=mon('青眼の白龍',1);gameState.players[0].hand=[sp];gameState.players[0].mz=[a];gameState.players[1].mz=[f];baselineA();
  cast(0,CAG);
  ok('鉄檻: the Spell stays on the field after the activation',z(sp)==='sz'&&C(sp).face==='up',JSON.stringify([z(sp),C(sp)&&C(sp).face]));
  phase('battle');myAttack(a,f);
  ok('鉄檻: my monster cannot declare an attack (both monsters survive)',z(a)==='mz'&&z(f)==='mz',JSON.stringify([z(a),z(f)]));
  endTurn();phase('battle');
  foeAttack(f,a);
  ok('鉄檻: the opponent monster cannot declare an attack in the 1st opponent turn either',z(a)==='mz'&&z(sp)==='sz',JSON.stringify([z(a),z(sp)]));
  endTurn();
  ok('鉄檻: still on the field in my next turn',z(sp)==='sz',z(sp));
  endTurn();phase('battle');
  foeAttack(f,a);
  ok('鉄檻: and in the 2nd opponent turn (still no attack)',z(a)==='mz'&&z(sp)==='sz',JSON.stringify([z(a),z(sp)]));
  phase('end');
  ok('鉄檻: destroyed at the End Phase of the 2nd opponent turn',z(sp)==='grave',z(sp));
  endTurn();toOppBattle();
  foeAttack(f,a);
  ok('鉄檻: afterwards attacks are possible again (ブラック・マジシャン destroyed)',z(a)==='grave',z(a));
  audit('鉄檻 1'); }

/* ===== 大寒波 ===== */
{ fresh();const sp=mk(COL,0,'up'),rev=mk('死者蘇生',0),tr=faceSet('激流葬',1),s2=mk('ブラック・ホール',0),gy=mk('青眼の白龍',0);
  gameState.players[0].hand=[sp,rev,s2];gameState.players[0].grave=[gy];gameState.players[1].sz=[tr];baselineA();
  ok('大寒波: activatable at the start of Main Phase 1',legalH(0).ok===true,JSON.stringify(legalH(0)));
  cast(0,COL);
  ok('大寒波: resolved (the Spell went to the Graveyard)',z(sp)==='grave',z(sp));
  ok('大寒波: I cannot activate 死者蘇生 nor Set a Spell this turn',legalH(0).ok===false,JSON.stringify(legalH(0)));
  const sz0=gameState.players[0].sz.length;const hand0=gameState.players[0].hand.length;
  doSetST(0);
  ok('大寒波: Setting a Spell is refused',gameState.players[0].sz.length===sz0&&gameState.players[0].hand.length===hand0,JSON.stringify([gameState.players[0].sz.length,gameState.players[0].hand.length]));
  endTurn();
  ok('大寒波: the opponent in turn 2 cannot activate the Set trap (the effect lock)',(function(){const m=gameState.players[1].sz[0]; return m&&m.face==='down';})(),'');
  const acts=getLegalZoneActions(1,'sz',0).map(a=>a.id);
  ok('大寒波: the Set 激流葬 offers no activation to the opponent while it lasts',acts.indexOf('activate')<0,JSON.stringify(acts));
  endTurn();
  ok('大寒波: over at my next Draw Phase (the Spell can be activated again, 死者蘇生)',legalH(0).actions.length>=0&&getLegalHandActions(0,gameState.players[0].hand.findIndex(c=>cardName(c)==='死者蘇生')).some(x=>x.id==='activate'),'');
  audit('大寒波 1'); }
{ fresh();const sp=mk(COL,0,'up');gameState.players[0].hand=[sp];baselineA();
  phase('battle');
  ok('大寒波 negative: not in Main Phase 1 → not activatable',legalH(0).ok===false,JSON.stringify(legalH(0))); }

/* ===== 閃光弾 ===== */
{ fresh();const tr=faceSet(FLA,0),f=mon('青眼の白龍',1);gameState.players[0].sz=[tr];gameState.players[1].mz=[f];baselineA();
  toOppBattle();
  PREFER=['yes'];foeAttack(f,'direct');PREFER=[];
  drive();
  ok('閃光弾: after the direct battle damage the trap resolves and the turn proceeds to the End Phase',z(tr)==='grave'&&lp(0)===5000,JSON.stringify([z(tr),lp(0),gameState.phase]));
  ok('閃光弾: the phase is End Phase',gameState.phase==='end',gameState.phase);
  audit('閃光弾 1'); }
{ fresh();const tr=faceSet(FLA,0),f=mon('青眼の白龍',1),m=mon('ワイト',0);gameState.players[0].sz=[tr];gameState.players[0].mz=[m];gameState.players[1].mz=[f];baselineA();
  toOppBattle();
  foeAttack(f,m);
  ok('閃光弾 negative: a battle against a monster (no direct attack) → the trap stays Set',z(tr)==='sz',z(tr)); }
`);
