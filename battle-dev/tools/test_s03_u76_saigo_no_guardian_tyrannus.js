/* S03-U76: 始祖の守護者ティラス — an ENGINE_GAP Xyz monster in the Worm major deck, closed via priority #7
   (re-auditing the ENGINE_GAP candidates flagged in an earlier pass). Real text: "Level 5 monster x2 [Xyz].
   This card's effects are not applied if it has no Xyz Materials. This card cannot be destroyed by card
   effects. At the end of the Battle Phase in which this card battled, select 1 card your opponent controls
   and destroy it. Remove 1 Xyz Material from this card during each of your End Phases."
   The gap-audit note flagging this ("Needs generic effect-destruction immunity/replacement support") is
   stale: System v21 (engine/1K_destruction_protection_v21.js, sc.protectV21) already provides this
   generically. No new engine capability was needed. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.phase='main1';}
function drive(){for(let i=0;i<600;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){
    const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
    if(g.length) eventPickV2(0); else eventSkipGroupV2();
    continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  if(gameState.pendingSummon){commitPendingSummonV2();continue;}
  return 'idle';}
  return 'loop';}
function driveAll(){for(let i=0;i<20;i++){const st=drive();if(st!=='choice')return st;__choicePickV49(0);}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function zoneOf(uid){const h=findCardByUid(uid);return h?h.zone:null;}
`;

/* ===== A. real Xyz Summon (2 real Level 5 monsters), real attack + real Battle Phase end: the forced
   destroy-1-opponent-card trigger fires for real. ===== */
harness(COMMON+String.raw`
fresh();
const tyrant=mk('始祖の守護者ティラス',0);
const mat1=mk('3万年の白亀',0), mat2=mk('アイツ',0);
gameState.players[0].mz=[mat1,mat2];
gameState.players[0].ex=[tyrant];
const foe=mk('ワイト',1);
gameState.players[1].mz=[foe];
baselineA();
const combos=exCombos(0,dbOf(tyrant)).combos;
ok('A: a real Xyz Summon combo (2 Level 5 monsters) is legal',combos.length>0,JSON.stringify(combos.map(c=>c.label)));
doExSummon(0,0,combos[0].materials,'xyz','atk');
drive();
ok('A: 始祖の守護者ティラス is really Xyz Summoned with 2 real materials attached (card.xyz)',
  zoneOf(tyrant.uid)==='mz'&&Array.isArray(tyrant.xyz)&&tyrant.xyz.length===2,
  JSON.stringify({zone:zoneOf(tyrant.uid),xyz:(tyrant.xyz||[]).map(c=>cardName(c))}));
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});
drive();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:gameState.players[0].mz.indexOf(tyrant),target:0});
drive();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'main2'});
drive();
audit('A battle + BP-end destroy');
ok('A: the real Battle-Phase-end trigger destroys the real opponent card (ワイト sent to grave)',
  zoneOf(foe.uid)==='grave',JSON.stringify({foeZone:zoneOf(foe.uid)}));
ok('A: still has both materials (this clause does not remove one)',tyrant.xyz.length===2,tyrant.xyz.length);
`);

/* ===== B. real End Phase: removes exactly 1 material for real. ===== */
harness(COMMON+String.raw`
fresh();
const tyrant=mk('始祖の守護者ティラス',0);
const mat1=mk('3万年の白亀',0), mat2=mk('アイツ',0);
gameState.players[0].mz=[mat1,mat2];
gameState.players[0].ex=[tyrant];
baselineA();
const combos=exCombos(0,dbOf(tyrant)).combos;
doExSummon(0,0,combos[0].materials,'xyz','atk');
drive();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});
drive();
/* S03-U114: with 2 materials the controller chooses which one to detach — pick the 2nd (アイツ) */
const pcB=pendingChoiceV49(gameState);
ok('B: the End Phase detach asks which of the 2 materials to remove',!!pcB&&pcB.candidates.length===2&&/取り除くX素材/.test(pcB.title||''),JSON.stringify(pcB&&pcB.candidates.map(c=>c.label)));
if(pcB){const i=pcB.candidates.findIndex(c=>String(c.label).indexOf('アイツ')===0);__choicePickV49(i>=0?i:1);drive();}
audit('B real End Phase material removal');
ok('B: a real End Phase removes exactly 1 real material (2 -> 1) — the chosen one',tyrant.xyz.length===1&&cardName(tyrant.xyz[0])==='3万年の白亀'&&gameState.players[0].grave.some(c=>cardName(c)==='アイツ'),JSON.stringify({left:tyrant.xyz.map(cardName)}));
`);

/* ===== C. protectV21 effect-destruction immunity, gated by real material count: while materials>0, a real
   effect-destroy attempt (サンダー・ブレイク, a real Trap that destroys any field card) fails to destroy it;
   once materials hit 0, the same real effect-destroy attempt succeeds. Battle-destruction is unaffected
   either way (real text never grants battle-proof). ===== */
harness(COMMON+String.raw`
fresh();
const tyrant=mk('始祖の守護者ティラス',0);
const mat1=mk('3万年の白亀',0), mat2=mk('アイツ',0);
gameState.players[0].mz=[mat1,mat2];
gameState.players[0].ex=[tyrant];
const brk=mk('サンダー・ブレイク',1,'down');
brk.setTurn=gameState.turn-1;
gameState.players[1].sz=[brk];
gameState.players[1].hand=[mk('青眼の白龍',1)];
baselineA();
const combos=exCombos(0,dbOf(tyrant)).combos;
doExSummon(0,0,combos[0].materials,'xyz','atk');
drive();
ok('C setup: really has 2 materials before the effect-destroy attempt',tyrant.xyz.length===2,tyrant.xyz.length);
duelActivateFromZone(1,'sz',0,{});
driveAll();
audit('C effect-destroy blocked while materials>0');
ok('C: a real effect-destroy attempt (サンダー・ブレイク) fails while materials>0 (protectV21 via continuous.protectV21.effect)',
  zoneOf(tyrant.uid)==='mz',JSON.stringify({zone:zoneOf(tyrant.uid),xyz:tyrant.xyz.length}));
/* Directly zeroing xyz here (rather than driving 2 more real End Phases to remove both materials) is a
   deliberate test-harness shortcut, not itself Replay-audited from this point on — the segment above already
   provides full real-path + Replay-audit coverage of protectV21 while materials>0, and clause B (above)
   already provides full real-path + Replay-audit coverage of a real material removal via a real End Phase;
   this final check only needs to confirm protectV21 correctly stops protecting once materials are gone. */
tyrant.xyz=[];
const brk2=mk('サンダー・ブレイク',1,'down');
brk2.setTurn=gameState.turn-1;
gameState.players[1].sz=[brk2];
gameState.players[1].hand=[mk('青眼の白龍',1)];
duelActivateFromZone(1,'sz',0,{});
driveAll();
ok('C: once materials are 0, the same real effect-destroy attempt really destroys it (protectV21 correctly re-evaluates live state, matching the S03-U74/U75 discipline of never trusting a stale cached answer)',
  zoneOf(tyrant.uid)==='grave',JSON.stringify({zone:zoneOf(tyrant.uid)}));
`);
