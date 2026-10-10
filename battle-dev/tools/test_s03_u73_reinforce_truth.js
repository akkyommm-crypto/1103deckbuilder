/* S03-U73: トゥルース・リインフォース (Reinforce Truth) — continues U72's priority #7 pass over the fixed
   lists' remaining PARTIAL AUTO_DECK_TABLE cards.
   Real text (Yugipedia, printed 2009-04-18 OCG, within cutoff): "Special Summon 1 Level 2 or lower
   Warrior-Type monster from your Deck. You cannot conduct your Battle Phase the turn you activate this
   card." Unlike U72's three Gadgets, the pre-existing AUTO_DECK_TABLE entry could only express the Special
   Summon filter, not the card-specific "cannot conduct your Battle Phase this turn" restriction — a genuine
   functional gap, closed here with a real, literal defineScript reusing two already-established primitives:
   the s03u58.deck-special resolution-time choice handler (this is a non-targeting Deck choice, so per this
   session's own C-S03-26/S03-U58 precedent it must NOT be a selectTargets/activation-time choice), and the
   existing temporaryFlags.noBattlePhase primitive (set in cost(), matching the real "Condition"-type Battle
   Phase locks already used elsewhere in this codebase: 裁きの代行者 サターン, エンシェント・フェアリー・ドラゴン). */
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
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function isRegistry(){return pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume&&pendingChoiceV49(gameState).resume.mode==='registry';}
`;

/* ===== A. real Set (an earlier turn) + real activation from sz during Main Phase 1: confirms the
   Battle-Phase lock is paid as a real cost (before/independent of the resolution-time choice), the real
   resolution-time choice is correctly filtered to Level<=2 Warrior monsters only, the real Special Summon
   happens, and — the actual real-rules point of this card — a real attempt to leave Main Phase 1 for Battle
   is genuinely redirected straight to the End Phase this turn (nextPhaseIdV27, the real production function
   every phase transition in this engine goes through). ===== */
harness(COMMON+String.raw`
fresh();
const trap=mk('トゥルース・リインフォース',0,'down');
trap.setTurn=gameState.turn-1;
gameState.players[0].sz=[trap];
gameState.players[0].deck=[mk('TG ストライカー',0),mk('青眼の白龍',0)];
baselineA();
duelActivateFromZone(0,'sz',0);
drive();
ok('A: the Battle-Phase lock is paid as a real cost, before the resolution-time choice even opens',
  gameState.players[0].temporaryFlags&&gameState.players[0].temporaryFlags.noBattlePhase===true,
  JSON.stringify(gameState.players[0].temporaryFlags));
ok('A: a real resolution-time choice opens (registry resume), correctly filtered to Level<=2 Warrior monsters',
  isRegistry()&&pendingChoiceV49(gameState).candidates.length===1,
  JSON.stringify(pendingChoiceV49(gameState)&&{resume:pendingChoiceV49(gameState).resume,n:pendingChoiceV49(gameState).candidates.length}));
__choicePickV49(0);
drive();
audit('A トゥルース・リインフォース full cycle');
ok('A: TG ストライカー is really Special Summoned from the Deck',
  gameState.players[0].mz.some(c=>cardName(c)==='TG ストライカー'),
  JSON.stringify(gameState.players[0].mz.map(c=>cardName(c))));
ok('A: a real attempt to leave Main Phase 1 for Battle is genuinely redirected straight to the End Phase this turn',
  nextPhaseIdV27()==='end',nextPhaseIdV27());

/* ===== B. negative control: activated with NO Level<=2 Warrior anywhere in the deck — condition() correctly
   refuses; the card cannot even be activated (matching the real card's non-optional recruit requirement). ===== */
fresh();
const trap2=mk('トゥルース・リインフォース',0,'down');
trap2.setTurn=gameState.turn-1;
gameState.players[0].sz=[trap2];
gameState.players[0].deck=[mk('青眼の白龍',0)];
baselineA();
const legal=strictScriptLegalityV2('トゥルース・リインフォース',0,'sz',0,{});
ok('B: with no Level<=2 Warrior in the deck, real activation legality correctly refuses',
  !legal.ok,JSON.stringify(legal));
`);
