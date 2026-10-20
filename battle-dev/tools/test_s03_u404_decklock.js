/* S03-U404: 次元要塞兵器, G・B・ハンター, 転生断絶 (NOT_STARTED cards).
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
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x4040001;
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































const DIM='次元要塞兵器',GBH='G・B・ハンター',TEN='転生断絶';
function faceSet(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}
function actSzC(c,prefer){PREFER=(prefer||[]).slice();duelActivateFromZone(0,'sz',idx(c));drive();PREFER=[];}

/* ===== 次元要塞兵器 ===== */
{ fresh();const d=mon(DIM,0);gameState.players[0].mz=[d];baselineA();
  const dk=gameState.players[0].deck.length;
  API.millTop(0,2,'test');drive();
  ok('次元要塞兵器: millTop is refused (the Deck keeps its cards, nothing in the Graveyard)',gameState.players[0].deck.length===dk&&gameState.players[0].grave.length===0,JSON.stringify([gameState.players[0].deck.length,dk,gameState.players[0].grave.length]));
  const c=gameState.players[0].deck[0];API.sendToGrave(findCardByUid(ensureCardUid(gameState,c)),'test');drive();
  ok('次元要塞兵器: sending a Deck card to the Graveyard (cost / effect) is refused too',gameState.players[0].grave.length===0,String(gameState.players[0].grave.length));
  API.millTop(1,1,'test');drive();
  ok('次元要塞兵器: for both players',gameState.players[1].grave.length===0,String(gameState.players[1].grave.length));
  endTurn();
  audit('次元要塞兵器 1'); }
{ fresh();baselineA();
  API.millTop(0,2,'test');drive();
  ok('次元要塞兵器 control: without it millTop sends 2 cards to the Graveyard',gameState.players[0].grave.length===2,String(gameState.players[0].grave.length)); }
{ fresh();const d=mon(DIM,0);d.negated=true;gameState.players[0].mz=[d];baselineA();
  API.millTop(0,1,'test');drive();
  ok('次元要塞兵器 negative: negated → no lock',gameState.players[0].grave.length===1,String(gameState.players[0].grave.length)); }

/* ===== G・B・ハンター ===== */
{ fresh();const g=mon(GBH,0),m=mon('ワイト',1);gameState.players[0].mz=[g];gameState.players[1].mz=[m];baselineA();
  const mh=findCardByUid(m.uid);
  API.returnToDeck(mh,false,'test');drive();
  ok('G・B・ハンター: a monster of the opponent cannot be returned to the Deck (it stays on the field)',z(m)==='mz',z(m));
  audit('G・B・ハンター 1'); }
{ fresh();const m=mon('ワイト',1);gameState.players[1].mz=[m];baselineA();
  const mh=findCardByUid(m.uid);
  API.returnToDeck(mh,false,'test');drive();
  ok('G・B・ハンター control: without it the monster returns to the Deck',z(m)==='deck',z(m)); }

/* ===== 転生断絶 ===== */
{ fresh();const t=faceSet(TEN,0),w=mk('ワイト',0),w2=mk('ワイト',0);gameState.players[0].sz=[t];gameState.players[0].grave=[w,w2];baselineA();
  actSzC(t);
  const wh=findCardByUid(w.uid);
  API.returnToDeck(wh,false,'test');drive();
  ok('転生断絶: a card returning from the Graveyard to the Deck is banished instead',z(w)==='banish',z(w));
  audit('転生断絶 1'); }
{ fresh();const w=mk('ワイト',0);gameState.players[0].grave=[w];baselineA();
  const wh=findCardByUid(w.uid);
  API.returnToDeck(wh,false,'test');drive();
  ok('転生断絶 control: without it the card returns to the Deck',z(w)==='deck',z(w)); }
`);
