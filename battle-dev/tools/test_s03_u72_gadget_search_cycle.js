/* S03-U72: promotes the three original Gadget monsters (グリーン・ガジェット / レッド・ガジェット /
   イエロー・ガジェット), all x1+ in the TG Gadget major deck, from PARTIAL ("AUTO_DECK_TABLE coarse
   implementation; requires card-specific historical review") to TESTED via a real DUEL-path exercise —
   found via priority #7 after four consecutive fresh major-deck-pair sweeps (TG Gadget+Worm, Six+HERO,
   Jurrac+TG Skill, Dragunity+BF) found no new blocker.
   Real text (Yugipedia / db.yugioh-card.com, all three printed well before the 2011-08-31 cutoff):
   "When this card is Normal Summoned or Special Summoned, you can add 1 [color] Gadget from your Deck to
   your hand." Green -> Red, Red -> Yellow, Yellow -> Green (a 3-way cycle), confirmed both by the exact
   cardCode cross-references already present in the AUTO_DECK_TABLE entry (cards/40_auto_interpreter.js)
   and independently via a live Yugipedia/db.yugioh-card.com search.
   The generic AUTO_DECK_TABLE interpreter (defineAutoDeckScript, same file) already wires this up
   correctly and generically: timing:['summon'] + passive.onNormalSummon/onSpecialSummon (both, matching
   the real "Normal Summoned or Special Summoned" text), an optional (non-forced) trigger, op:'search'
   resolving via the real API.searchDeck primitive. This unit found no functional gap in the table itself —
   it was flagged PARTIAL purely for lacking a dedicated card-specific real-path test, which this unit
   supplies. */
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
function handNames(){return gameState.players[0].hand.map(c=>cardName(c));}
`;

/* ===== A. real Normal Summon: グリーン・ガジェット (Green) searches レッド・ガジェット (Red). ===== */
harness(COMMON+String.raw`
fresh();
const green=mk('グリーン・ガジェット',0);
gameState.players[0].hand=[green];
gameState.players[0].deck=[mk('レッド・ガジェット',0),mk('青眼の白龍',0)];
baselineA();
doNormalSummon(0,'atk');
flushDeferredEventsThroughProcessorV27();
let state=drive();
if(state==='choice'){ __choicePickV49(0); drive(); }
audit('A グリーン・ガジェット search');
ok('A: レッド・ガジェット is really added to hand, deck really shrinks by 1',
  handNames().includes('レッド・ガジェット')&&gameState.players[0].deck.length===1,
  JSON.stringify({hand:handNames(),deckLeft:gameState.players[0].deck.length}));
`);

/* ===== B. real Normal Summon: レッド・ガジェット (Red) searches イエロー・ガジェット (Yellow). ===== */
harness(COMMON+String.raw`
fresh();
const red=mk('レッド・ガジェット',0);
gameState.players[0].hand=[red];
gameState.players[0].deck=[mk('イエロー・ガジェット',0),mk('青眼の白龍',0)];
baselineA();
doNormalSummon(0,'atk');
flushDeferredEventsThroughProcessorV27();
let stB=drive();
if(stB==='choice'){ __choicePickV49(0); drive(); }
audit('B レッド・ガジェット search');
ok('B: イエロー・ガジェット is really added to hand',handNames().includes('イエロー・ガジェット'),JSON.stringify(handNames()));
`);

/* ===== C. real Special Summon: イエロー・ガジェット (Yellow) searches グリーン・ガジェット (Green) —
   exercises the passive.onSpecialSummon branch specifically (real text: "Normal Summoned OR Special
   Summoned"), via a real FX_SPECIAL_SUMMON action from hand (the same primitive every card script's own
   API.specialSummon ultimately issues). ===== */
harness(COMMON+String.raw`
fresh();
const yellow=mk('イエロー・ガジェット',0);
gameState.players[0].hand=[yellow];
gameState.players[0].deck=[mk('グリーン・ガジェット',0)];
baselineA();
act({type:'FX_SPECIAL_SUMMON',player:0,from:'hand',fromIndex:0,pos:'atk',reason:'テスト特殊召喚'});
queueSpecialSummonSuccessV2(0,yellow,'effect');
flushDeferredEventsThroughProcessorV27();
let stC=drive();
if(stC==='choice'){ __choicePickV49(0); drive(); }
audit('C イエロー・ガジェット special-summon search');
ok('C: a real Special Summon also triggers the search (not just Normal Summon) — グリーン・ガジェット in hand',
  handNames().includes('グリーン・ガジェット'),JSON.stringify(handNames()));
`);

/* ===== D. negative control: グリーン・ガジェット Normal Summoned with NO レッド・ガジェット anywhere in the
   deck — condition() correctly refuses (no candidate, no choice ever opens, nothing added to hand). ===== */
harness(COMMON+String.raw`
fresh();
const green2=mk('グリーン・ガジェット',0);
gameState.players[0].hand=[green2];
gameState.players[0].deck=[mk('青眼の白龍',0)];
baselineA();
const handBefore=gameState.players[0].hand.length;
doNormalSummon(0,'atk');
flushDeferredEventsThroughProcessorV27();
drive();
audit('D negative control');
ok('D: with no レッド・ガジェット in deck, nothing is searched and the deck is untouched',
  gameState.players[0].hand.length===handBefore-1&&gameState.players[0].deck.length===1,
  JSON.stringify({hand:handNames(),deckLeft:gameState.players[0].deck.length}));
`);
