/* S03-U78: エクシーズエナジー real-target field-name bug (found incidentally in S03-U76, flagged via
   spawn_task, fixed here). Real text (this project's own card database, printed 2011-03-19, within cutoff):
   "You can activate this by removing 1 Xyz Material from your field. Select 1 face-up monster your opponent
   controls and destroy it." The pre-existing script (cards/56_v56_autobuild_batch08.js) checked
   `card.materials` to find a legal Xyz monster to detach a material from, but the real production
   Xyz-Summon/detach code (engine/00_state_actions.js, FX_EX_SUMMON/FX_DETACH) stores attached materials on
   `card.xyz` — a field never set as `.materials` anywhere for a real Xyz monster (confirmed while building
   S03-U76's 始祖の守護者ティラス). This means the card could never find a legal cost source in any real duel,
   despite carrying TESTED status — its own dedicated test (tools/test_v560_batch08.js) only checks that the
   registration string exists in the built HTML, never exercises real behavior. Fixed by changing both
   `card.materials` references to `card.xyz`. No status change: the card was already (incorrectly) TESTED;
   this is a pure correctness fix, not a promotion. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
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

/* ===== A. Before the fix this could never even be a legal activation: a real Xyz Summon attaches materials
   on card.xyz, condition() checked card.materials (always undefined -> never >0), so the card was always
   illegal despite a real Xyz monster with real materials sitting on the field. Confirms it is now legal. ===== */
harness(COMMON+String.raw`
fresh();
const tyrant=mk('始祖の守護者ティラス',0);
const mat1=mk('3万年の白亀',0), mat2=mk('アイツ',0);
gameState.players[0].mz=[mat1,mat2];
gameState.players[0].ex=[tyrant];
const foe=mk('ワイト',1);
gameState.players[1].mz=[foe];
const xe=mk('エクシーズエナジー',0);
gameState.players[0].hand=[xe];
baselineA();
const combos=exCombos(0,dbOf(tyrant)).combos;
doExSummon(0,0,combos[0].materials,'xyz','atk');
drive();
ok('A setup: a real Xyz Summon really attaches 2 materials (card.xyz)',
  zoneOf(tyrant.uid)==='mz'&&Array.isArray(tyrant.xyz)&&tyrant.xyz.length===2,
  JSON.stringify({xyz:(tyrant.xyz||[]).length}));
const legA=strictScriptLegalityV2('エクシーズエナジー',0,'hand',0,{cardOverride:xe,logicalZone:'sz',prospectiveIndex:0});
ok('A: エクシーズエナジー is now really legal to activate (real card.xyz materials found — the bug: this used to always be illegal)',
  legA.ok,JSON.stringify(legA));
`);

/* ===== B. Real activation: detaches 1 real material from the real Xyz monster (cost) and destroys a real
   face-up opponent monster (target), with a clean Replay audit. ===== */
harness(COMMON+String.raw`
fresh();
const tyrant=mk('始祖の守護者ティラス',0);
const mat1=mk('3万年の白亀',0), mat2=mk('アイツ',0);
gameState.players[0].mz=[mat1,mat2];
gameState.players[0].ex=[tyrant];
const foe=mk('ワイト',1);
gameState.players[1].mz=[foe];
const xe=mk('エクシーズエナジー',0);
gameState.players[0].hand=[xe];
baselineA();
const combos=exCombos(0,dbOf(tyrant)).combos;
doExSummon(0,0,combos[0].materials,'xyz','atk');
drive();
duelActivateFromHand(0);
driveAll();
audit('B real detach + destroy');
ok('B: a real material is detached from the real Xyz monster (2 -> 1) and the real opponent monster is really destroyed',
  tyrant.xyz.length===1&&zoneOf(foe.uid)==='grave',
  JSON.stringify({xyz:tyrant.xyz.length,foeZone:zoneOf(foe.uid)}));
`);

/* ===== C. Illegal when no real Xyz monster with materials is controlled (materials all detached to 0) — the
   condition correctly re-checks live card.xyz state, not a stale/undefined field. ===== */
harness(COMMON+String.raw`
fresh();
const tyrant=mk('始祖の守護者ティラス',0);
tyrant.xyz=[];
gameState.players[0].mz=[tyrant];
const foe=mk('ワイト',1);
gameState.players[1].mz=[foe];
const xe=mk('エクシーズエナジー',0);
gameState.players[0].hand=[xe];
baselineA();
const legC=strictScriptLegalityV2('エクシーズエナジー',0,'hand',0,{cardOverride:xe,logicalZone:'sz',prospectiveIndex:0});
ok('C: エクシーズエナジー is illegal when the only real Xyz monster on the field has 0 materials',
  !legC.ok,JSON.stringify(legC));
`);
