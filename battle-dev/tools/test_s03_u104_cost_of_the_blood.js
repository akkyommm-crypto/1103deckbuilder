/* S03-U104: 血の代償 (Cost of the Blood) — priority #7's IMPLEMENTED-tier audit, continuing after U103.
   Real text (this project's own authoritative data/carddata.json 'e' field, no Yugipedia page found under
   any searched English title): "500ライフポイントを払う事で、モンスター1体を通常召喚する。この効果は
   自分のメインフェイズ時及び相手のバトルフェイズ時にのみ発動できる。" ("By paying 500 Life Points, Normal
   Summon 1 monster. This effect can only be activated during your own Main Phase and during the opponent's
   Battle Phase.") No "once per turn" restriction (matches the project's own "1103では無制限" note — Unlimited
   as of the March 2011 format).

   Reading the existing implementation (cards/00_generic_core.js) surfaced a real, previously-undiscovered
   bug: the timing restriction ("only during your own Main Phase and the opponent's Battle Phase") was
   entirely missing from condition() — with no passive hooks and no explicit `timing` declaration, the
   generic scriptTimings() defaulted to ['free'] (always-legal-timing), so activation was possible during
   ANY phase of EITHER player's turn — confirmed empirically illegal-but-accepted cases: the opponent's Main
   Phase, the controller's own Battle Phase, and the controller's own End Phase. Since "own" vs "opponent's"
   turn-ownership can't be expressed through the generic per-card `timing` whitelist (which only tracks phase
   kind, not whose turn it is), the fix checks activePlayer/phase directly inside condition() (matching the
   established pattern for other custom-condition cards this session, e.g. S03-U93's カオス・ソーサラー).

   A SECOND, separate real bug was also found but is OUT OF SCOPE for this unit and deliberately NOT fixed
   here: resolve() special-summons the chosen hand monster via a raw FX_SPECIAL_SUMMON action with no tribute
   payment or tribute-count check at all, regardless of the summoned monster's real Level — confirmed
   empirically that a real Level-8 monster (real 2-Tribute requirement) was summoned for free, paying only
   the 500 LP. No existing card in this codebase reuses the real tribute-selection machinery
   (normalSummonMethodsFor/pickTributes, engine/70_summon_procedures.js) from within a script's resolve() —
   building that generically is a real engineering task, not a quick fix, so it is flagged as the top-priority
   next unit (S03-U105) rather than folded into this one. This unit's test deliberately only exercises
   no-Tribute-required (Level<=4) hand monsters to avoid conflating the two separate findings.

   Fixed (this unit): the timing restriction. Promotes 血の代償 IMPLEMENTED->TESTED. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.phase='main1';}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
`;

/* ===== A. Real activation during the real controller's own real Main Phase: really pays the real 500 LP
   cost and really Special-Summons (treated as a Normal Summon) a real no-Tribute-required (Level 4) hand
   monster in real Attack Position. ===== */
harness(COMMON+String.raw`
fresh();
const chi=mk('血の代償',0,'up');
gameState.players[0].sz=[chi];
gameState.players[0].hand=[mk('カラクリ兵 弐参六',0)]; // real Level 4, no Tribute
gameState.players[0].lp=8000;
baselineA();
duelActivateFromZone(0,'sz',0);
if(pendingChoiceV49(gameState)) __choicePickV49(0);
drive();
ok('A: the real 500 LP cost is really paid',
  gameState.players[0].lp===7500,JSON.stringify(gameState.players[0].lp));
ok('A: the real hand monster is really Special Summoned (treated as a Normal Summon) in real Attack Position',
  gameState.players[0].mz.some(c=>nm(c)==='カラクリ兵 弐参六'&&c.pos==='atk')&&!gameState.players[0].hand.length,
  JSON.stringify({mz:gameState.players[0].mz.map(c=>[nm(c),c.pos]),hand:gameState.players[0].hand.map(nm)}));
audit('A');
`);

/* ===== B. Real activation during the real OPPONENT's real Battle Phase — the fixed bug's positive real-text
   case, confirming this unusual cross-turn window really works, not just the normal own-Main-Phase case. ===== */
harness(COMMON+String.raw`
fresh();
const chi=mk('血の代償',0,'up');
gameState.players[0].sz=[chi];
gameState.players[0].hand=[mk('カラクリ商人 壱七七',0)]; // real Level 2, no Tribute
gameState.players[0].lp=8000;
gameState.activePlayer=1;gameState.phase='battle';
baselineA();
ok('B: really legal during the real opponents real Battle Phase',
  strictScriptLegalityV2('血の代償',0,'sz',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('血の代償',0,'sz',0,{})));
duelActivateFromZone(0,'sz',0);
if(pendingChoiceV49(gameState)) __choicePickV49(0);
drive();
ok('B: the real Special Summon really succeeds during the real opponents Battle Phase',
  gameState.players[0].mz.some(c=>nm(c)==='カラクリ商人 壱七七'),
  JSON.stringify(gameState.players[0].mz.map(nm)));
audit('B');
`);

/* ===== C. Real negative timing controls (the fixed bug): illegal during the real opponents Main Phase, the
   real controllers own Battle Phase, and the real controllers own End Phase — none of these real timing
   windows are listed in the real text, and before this unit's fix all three were wrongly accepted. ===== */
harness(COMMON+String.raw`
fresh();
const chi=mk('血の代償',0,'up');
gameState.players[0].sz=[chi];
gameState.players[0].hand=[mk('青眼の白龍',0)];
gameState.players[0].lp=8000;
baselineA();
gameState.activePlayer=1;gameState.phase='main1';
ok('C: illegal during the real opponents Main Phase',
  !strictScriptLegalityV2('血の代償',0,'sz',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('血の代償',0,'sz',0,{})));
gameState.activePlayer=0;gameState.phase='battle';
ok('C: illegal during the real controllers own Battle Phase',
  !strictScriptLegalityV2('血の代償',0,'sz',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('血の代償',0,'sz',0,{})));
gameState.phase='end';
ok('C: illegal during the real controllers own End Phase',
  !strictScriptLegalityV2('血の代償',0,'sz',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('血の代償',0,'sz',0,{})));
`);

/* ===== D. Real negative controls (pre-existing, unchanged): illegal with LP<500, an empty hand, or a full
   real Monster Zone. ===== */
harness(COMMON+String.raw`
fresh();
const chi=mk('血の代償',0,'up');
gameState.players[0].sz=[chi];
gameState.players[0].hand=[mk('青眼の白龍',0)];
gameState.players[0].lp=400;
baselineA();
ok('D: illegal with real LP<500',
  !strictScriptLegalityV2('血の代償',0,'sz',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('血の代償',0,'sz',0,{})));
gameState.players[0].lp=8000;
gameState.players[0].hand=[];
baselineA();
ok('D: illegal with an empty real hand',
  !strictScriptLegalityV2('血の代償',0,'sz',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('血の代償',0,'sz',0,{})));
gameState.players[0].hand=[mk('青眼の白龍',0)];
gameState.players[0].mz=[mk('もけもけ',0,'up'),mk('もけもけ',0,'up'),mk('もけもけ',0,'up'),mk('もけもけ',0,'up'),mk('もけもけ',0,'up')];
baselineA();
ok('D: illegal with a full real Monster Zone',
  !strictScriptLegalityV2('血の代償',0,'sz',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('血の代償',0,'sz',0,{})));
`);
