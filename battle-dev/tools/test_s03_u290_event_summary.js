/* S03-U290: grouped Deck-to-GY / discard summary events (engine/1ZZN onMillBatchS03 / onDiscardBatchS03) — パラライズ・チェーン, 魔力の棘 (2011 texts).
   Real DUEL paths (card activations, a chain response paying a Deck cost, the hand-size rule), Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function pl(c){const hh=findCardByUid(c.uid);return hh?hh.p:null;}
function C(c){const hh=findCardByUid(c.uid);return hh?hh.card:null;}
function idx(c){const hh=findCardByUid(c.uid);return hh?hh.index:-1;}
function pc(){return pendingChoiceV49(gameState);}
function lp(p){return gameState.players[p].lp;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;SEEN=[];TRIG=[];PREFER=[];
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:10},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[],SEEN=[];
function step(){const q=pc();if(!q)return false;
  SEEN.push({title:q.title||'',kind:q.kind,min:q.min,max:q.max,n:(q.candidates||[]).length,keys:(q.candidates||[]).map(x=>x.uid!=null?x.uid:x.key)});
  const find=u=>q.candidates.findIndex(x=>x.uid===u||x.key===u||x.value===u||(x.card&&x.card.uid===u));
  if(q.max>1||q.min!==q.max){
    let ks=[];for(const u of PREFER){const j=find(u);if(j>=0&&ks.indexOf(q.candidates[j].key)<0)ks.push(q.candidates[j].key);}
    ks=ks.slice(0,q.max);for(const c of q.candidates){if(ks.length>=q.min)break;if(ks.indexOf(c.key)<0)ks.push(c.key);}
    PREFER=PREFER.filter(u=>find(u)<0);answerChoiceV49(ks);return true;}
  let j=-1,k=-1;for(k=0;k<PREFER.length;k++){j=find(PREFER[k]);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}
function drive(){for(let i=0;i<800;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push({names:g.map(c=>c.name),forced:st.rank<2});eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function up(n,p,pos){return mk(n,p,'up',pos);}
function down(n,p){const c=mk(n,p,'down');c.pos='def';return c;}
function setT(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function fieldSp(p){const f=up('山',p);gameState.players[p].field=f;return f;}
function base(){gameState.posSnapV10=positionSnapshotV10(gameState);baselineA();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function ign(c,prefer){const h=findCardByUid(c.uid);PREFER=(prefer||[]).slice();duelActivateFromZone(h.p,'mz',h.index);drive();PREFER=[];}
function toWindow(){for(let i=0;i<200;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length)return true;
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}
function toPhase(ph){const ord=['draw','standby','main1','battle','main2','end'];for(let k=0;k<8&&gameState.phase!==ph;k++){const i=ord.indexOf(gameState.phase);if(i<0||i>=ord.indexOf(ph))break;requestProcessorV27(PROCESSOR_V27.PHASE,{to:ord[i+1]});drive();}}
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}
const trigNamed=n=>TRIG.filter(t=>t.names.indexOf(n)>=0);
const PC='パラライズ・チェーン',TH='魔力の棘';
function sumEvents(kind){return (gameState.eventLogS03||[]).filter(e=>e.eventName===kind);}
let S0,S1,t,w,ha,nb,gb;

/* ===== P: パラライズ・チェーン — each time cards are sent from the opponent's Deck to the GY by a card effect: 300 to the opponent ===== */
/* P1: the opponent's own effect sends 5 cards together (針虫の巣窟) — one trigger, 300 (not 1500) */
fresh();gameState.activePlayer=1;gameState.turn=6;
S0=up(PC,0);t=setT('針虫の巣窟',1);gameState.players[0].sz=[S0];gameState.players[1].sz=[t];base();
duelActivateFromZone(1,'sz',0);drive();
ok('P1: 針虫の巣窟 sent 5 cards of the opponent Deck together — パラライズ・チェーン triggers once, the opponent takes 300',gameState.players[1].grave.filter(c=>cardName(c)==='ワイト').length===5&&lp(1)===7700&&lp(0)===8000&&trigNamed(PC).length===1,JSON.stringify({lp:[lp(0),lp(1)],TRIG}));
audit('P1');
/* P1b: forced — skipping the Spell / Trap trigger group does not drop it (S03-U290 forcedSTS03) */
fresh();gameState.activePlayer=1;gameState.turn=6;
S0=up(PC,0);t=setT('針虫の巣窟',1);gameState.players[0].sz=[S0];gameState.players[1].sz=[t];base();
duelActivateFromZone(1,'sz',0);
let skipped=0,flagged=false;for(let i=0;i<400;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
    if(g.length&&g.some(c=>c.name===PC)&&skipped<3){flagged=flagged||g.some(c=>c.name===PC&&c.forcedSTS03===true);skipped++;eventSkipGroupV2();continue;}
    if(g.length){TRIG.push({names:g.map(c=>c.name)});eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w2=gameState.processorWaiting;if(w2&&w2.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}break;}
ok('P1b: the trigger is forced — declining the group 3 times keeps it; it resolves (300)',flagged&&skipped===3&&lp(1)===7700&&trigNamed(PC).length===1,JSON.stringify({flagged,skipped,lp:lp(1),TRIG}));
audit('P1b');
/* P2: two separate activations of 針虫の巣窟 (5 cards each) — two groups, two triggers */
fresh();gameState.activePlayer=1;gameState.turn=6;
S0=up(PC,0);gameState.players[0].sz=[S0];gameState.players[1].sz=[setT('針虫の巣窟',1),setT('針虫の巣窟',1)];base();
const n1=gameState.players[1].sz[0],n2=gameState.players[1].sz[1];duelActivateFromZone(1,'sz',idx(n1));drive();duelActivateFromZone(1,'sz',idx(n2));drive();
ok('P2: two separate resolutions (5 + 5) — two triggers, 600',lp(1)===7400&&trigNamed(PC).length===2,JSON.stringify({lp:lp(1),TRIG}));
audit('P2');
/* P3: the controller's own Deck — no trigger (「相手のデッキから」) */
fresh();
S0=up(PC,0);gameState.players[0].sz=[S0,setT('針虫の巣窟',0)];base();
duelActivateFromZone(0,'sz',1);drive();
ok('P3: own Deck milled by own effect — no trigger, no damage',gameState.players[0].grave.filter(c=>cardName(c)==='ワイト').length===5&&lp(0)===8000&&lp(1)===8000&&!trigNamed(PC).length,JSON.stringify({lp:[lp(0),lp(1)],TRIG}));
audit('P3');
/* P4: a cost (ナチュル・ビースト sends the top 2 of its controller's Deck to negate a Spell) is not 「カードの効果によって」 — no trigger */
fresh();
S0=up(PC,0);nb=up('ナチュル・ビースト',1);gameState.players[0].sz=[S0];gameState.players[1].mz=[nb];gameState.players[0].hand=[mk('強欲な壺',0)];base();
duelActivateFromHand(0);
let offP4=toWindow()&&offered(1,nb);
if(offP4){const o=findCardByUid(nb.uid);duelActivateResponseV2(1,o.zone,o.index);}
drive();
ok('P4: ナチュル・ビースト paid its cost (2 cards from its Deck) — no パラライズ・チェーン trigger, no damage',offP4&&gameState.players[1].grave.filter(c=>cardName(c)==='ワイト').length===2&&lp(1)===8000&&!trigNamed(PC).length,JSON.stringify({offP4,g:gameState.players[1].grave.length,lp:lp(1),TRIG}));
audit('P4');

/* ===== T: 魔力の棘 — the opponent's hand discarded: 500 × the number of cards discarded ===== */
/* T1: 手札抹殺 (activated by the controller): the opponent discards 3 together — one trigger, 1500; the controller's own discards do not count */
fresh();
S0=up(TH,0);gameState.players[0].sz=[S0];gameState.players[0].hand=[mk('手札抹殺',0),mk('ワイト',0)];
gameState.players[1].hand=[mk('ワイト',1),mk('ワイト',1),mk('ワイト',1)];base();
cast(0,'手札抹殺');
ok('T1: the opponent discarded 3 together — 魔力の棘 triggers once, 1500 to the opponent',lp(1)===6500&&lp(0)===8000&&trigNamed(TH).length===1,JSON.stringify({lp:[lp(0),lp(1)],TRIG}));
audit('T1');
/* T2: the hand-size rule — the opponent discards 2 together: one trigger, 1000 */
fresh();gameState.activePlayer=1;gameState.turn=6;
S0=up(TH,0);gameState.players[0].sz=[S0];gameState.players[1].hand=Array.from({length:8},()=>mk('ワイト',1));base();
toPhase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();
ok('T2: the opponent discarded 2 by the hand-size rule — one trigger, 1000',gameState.players[1].hand.length===6&&lp(1)===7000&&trigNamed(TH).length===1,JSON.stringify({hand:gameState.players[1].hand.length,lp:lp(1),TRIG}));
audit('T2');
/* T3: only the controller's own hand discarded — no trigger */
fresh();
S0=up(TH,0);gameState.players[0].sz=[S0];gameState.players[0].hand=[mk('手札抹殺',0),mk('ワイト',0),mk('ワイト',0)];gameState.players[1].hand=[];base();
cast(0,'手札抹殺');
ok('T3: only own cards discarded — no trigger, no damage',lp(0)===8000&&lp(1)===8000&&!trigNamed(TH).length,JSON.stringify({lp:[lp(0),lp(1)],TRIG}));
audit('T3');
/* T4: face-down 魔力の棘 — no trigger */
fresh();
S0=setT(TH,0);gameState.players[0].sz=[S0];gameState.players[0].hand=[mk('手札抹殺',0)];gameState.players[1].hand=[mk('ワイト',1),mk('ワイト',1)];base();
cast(0,'手札抹殺');
ok('T4: set face-down — no trigger',lp(1)===8000&&!trigNamed(TH).length,JSON.stringify({lp:lp(1),TRIG}));
audit('T4');

/* ===== E: the summary itself ===== */
fresh();gameState.activePlayer=1;gameState.turn=6;
gameState.players[1].sz=[setT('針虫の巣窟',1)];base();
const SUMS=[],origReduce=(typeof eventSummaryReduceS03==='function')?eventSummaryReduceS03:null;
if(origReduce) eventSummaryReduceS03=function(gs){const before=(gs.deferredEvents||[]).slice();origReduce(gs);(gs.deferredEvents||[]).filter(x=>before.indexOf(x)<0).forEach(x=>SUMS.push(JSON.parse(JSON.stringify(x))));};   /* new items by identity (S03-U293 inserts summaries after their group) */
duelActivateFromZone(1,'sz',0);drive();if(origReduce) eventSummaryReduceS03=origReduce;
const seenSum=SUMS.filter(x=>x.eventName==='onMillBatchS03').length===1?SUMS.find(x=>x.eventName==='onMillBatchS03'):null;
ok('E1: one onMillBatchS03 for the 5 cards — player 1, count 5, reasons [effect], acting player 1',!!seenSum&&seenSum.evt.player===1&&seenSum.evt.count===5&&JSON.stringify(seenSum.evt.reasons)==='["effect"]'&&JSON.stringify(seenSum.evt.actingPlayers)==='[1]'&&seenSum.evt.uids.length===5,JSON.stringify(SUMS));
audit('E1');
`);
