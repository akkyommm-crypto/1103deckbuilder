/* S03-U84: 激流葬 (Torrential Tribute) — an IMPLEMENTED main-deck Trap found via priority #7's IMPLEMENTED-tier
   audit (qty=9 across 9 of the 13 fixed decks, the highest-impact main-deck candidate remaining after
   S03-U83's ブラック・ホール). Already correctly implemented (cards/00_generic_core.js) as a real Trap
   responding to any real Normal/Special/Flip Summon (either player, matching the real text "When a
   monster(s) is Summoned: Destroy all monsters on the field") via the generic API.destroyAll('mz', null,
   reason) primitive. This unit only adds the missing dedicated real-DUEL-path test, promoting it to TESTED.
   No code change to the card itself. */
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
function driveAll(){for(let i=0;i<30;i++){const st=drive();if(st!=='choice')return st;__choicePickV49(0);}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function zoneOf(uid){const h=findCardByUid(uid);return h?h.zone:null;}
`;

/* ===== A. Real set Trap, responding to the real OPPONENT's real Normal Summon: destroys every real monster
   on both sides, including the newly-summoned one and an already-present ally of the controller's. ===== */
harness(COMMON+String.raw`
fresh();
const tt=mk('激流葬',0,'down'); tt.setTurn=gameState.turn-1;
const mine=mk('もけもけ',0);
gameState.players[0].sz=[tt];
gameState.players[0].mz=[mine];
gameState.players[1].hand=[mk('ワイト',1)];
gameState.activePlayer=1;gameState.phase='main1';
baselineA();
doNormalSummon(0,'atk');
driveAll();
audit('A real Torrential Tribute response to a real opponent Normal Summon');
const newFoe=gameState.players[1].grave.find(c=>cardName(c)==='ワイト');
ok('A: every real monster on both sides is really destroyed (the newly-Normal-Summoned ワイト and the already-present もけもけ alike)',
  zoneOf(mine.uid)==='grave'&&!!newFoe,JSON.stringify({mine:zoneOf(mine.uid),foeGrave:gameState.players[1].grave.map(c=>cardName(c))}));
ok('A: 激流葬 itself resolves to the grave as a normal Trap',zoneOf(tt.uid)==='grave',JSON.stringify({tt:zoneOf(tt.uid)}));
`);

/* ===== B. Real negative control: a set 激流葬 with no legal monster anywhere on the field is never offered
   as a legal response (condition() correctly rejects). ===== */
harness(COMMON+String.raw`
fresh();
const tt=mk('激流葬',0,'down'); tt.setTurn=gameState.turn-1;
gameState.players[0].sz=[tt];
baselineA();
const leg=strictScriptLegalityV2('激流葬',0,'sz',0,{});
ok('B: illegal when the real field has no monster at all',!leg.ok,JSON.stringify(leg));
`);
