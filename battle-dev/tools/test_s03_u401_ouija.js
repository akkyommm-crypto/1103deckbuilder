/* S03-U401: ウィジャ盤, 死のメッセージ「E」「A」「T」「H」 (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4010001;
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



























const OUI='ウィジャ盤',MSG=['死のメッセージ「E」','死のメッセージ「A」','死のメッセージ「T」','死のメッセージ「H」'];
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}
function faceSet(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function ouijaField(){fresh();const o=faceSet(OUI,0),m=MSG.map(n=>mk(n,0));
  gameState.players[0].sz=[o];gameState.players[0].hand=[m[0],m[1]];gameState.players[0].deck=gameState.players[0].deck.concat([m[2],m[3]]);baselineA();return {o,m};}
function oppEnd(){endTurn();phase('end');}
{ const x=ouijaField();
  actSzC(x.o);
  ok('ウィジャ盤: activated (face-up Continuous Trap)',z(x.o)==='sz'&&C(x.o).face==='up',JSON.stringify([z(x.o),C(x.o)&&C(x.o).face]));
  oppEnd();
  ok('ウィジャ盤: 1st opponent End Phase → 「E」 comes out of the hand',z(x.m[0])==='sz'&&C(x.m[0]).face==='up'&&z(x.m[1])==='hand',JSON.stringify(x.m.map(c=>z(c))));
  endTurn();oppEnd();
  ok('ウィジャ盤: 2nd → 「A」 (the order E, A, T, H)',z(x.m[1])==='sz'&&z(x.m[2])==='deck',JSON.stringify(x.m.map(c=>z(c))));
  ok('ウィジャ盤: no win yet',gameState.loser==null,String(gameState.loser));
  endTurn();oppEnd();
  endTurn();oppEnd();
  ok('ウィジャ盤: after 「T」 and 「H」 (4th End Phase) all five stand on my field: I win the Duel (the opponent loses)',x.m.every(c=>z(c)==='sz')&&gameState.loser===1&&gameState.duelEndedReason==='specialWin',JSON.stringify({loser:gameState.loser,reason:gameState.duelEndedReason,z:x.m.map(c=>z(c))}));
  audit('ウィジャ盤 1'); }
{ const x=ouijaField();
  actSzC(x.o);
  oppEnd();
  const m0=findCardByUid(x.m[0].uid);
  API.destroy(m0,'test');drive();
  ok('ウィジャ盤: when a 「死のメッセージ」 leaves the field the 「ウィジャ盤」 and the others go to the Graveyard',z(x.m[0])==='grave'&&z(x.o)==='grave',JSON.stringify({o:z(x.o),e:z(x.m[0])}));
  audit('ウィジャ盤 2'); }
{ const x=ouijaField();
  ok('死のメッセージ: cannot be activated or Set by the player',getLegalHandActions(0,0).every(a=>a.id!=='activate'),JSON.stringify(getLegalHandActions(0,0).map(a=>a.id))); }
{ const x=ouijaField();
  actSzC(x.o);
  endTurn();phase('end');
  ok('ウィジャ盤 control: nothing is placed in my own End Phase / before the opponent End Phase (still E only after the 1st)',z(x.m[0])==='sz'&&z(x.m[1])==='hand',JSON.stringify(x.m.map(c=>z(c)))); }
`);
