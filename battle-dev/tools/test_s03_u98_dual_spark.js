/* S03-U98: デュアルスパーク (Dual Spark / Gemini Spark) — priority #7's IMPLEMENTED-tier audit, continuing
   after U97 (one of the 8 remaining qty=3 main-deck candidates found by U97's corrected cross-reference).
   Real text (OCG, confirmed via Yugipedia): "You can activate this by releasing 1 face-up Level 4 Gemini
   monster on your field, targeting 1 card on the field; destroy that card, and you draw 1 card from the
   Deck." Konami's own official rulings (both the TCG Gameplay FAQ and the OCG Card Database, read directly
   via Yugipedia's Card Rulings page) are explicit: "Destroying the target card and drawing 1 card are
   resolved at the same time. If you cannot destroy the target card, you cannot draw." The cost (release 1
   face-up Level 4 Gemini/デュアル monster you control) and the "any 1 card anywhere on the field" target pool
   (API.fieldCards with no zone/player restriction) were already correctly implemented in
   cards/30_themes_b.js. But the old resolve() unconditionally drew a card regardless of whether the destroy
   actually happened — directly contradicting the ruling above. This is genuinely reachable in real play
   whenever the target cannot actually be destroyed at resolution for any reason (most commonly: an opponent
   responds by protecting or removing the target — Yugipedia's own Judge Forum ruling for this exact card
   notes Stardust Dragon can be activated in response; more simply and reproducibly, any real destruction-
   immune monster). Fixed by resolving the destroy and the draw together: re-locate the target's real
   position right before destroying it, destroy it, then check whether it actually ended up in the real
   Graveyard before drawing — reusing the existing resolveTarget/locateCardAnyV4 primitives already used
   elsewhere in this codebase for exactly this kind of post-resolution position check. No engine change;
   single-card fix. Promotes デュアルスパーク IMPLEMENTED->TESTED. */
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
function pickByName(match){
  const pc=pendingChoiceV49(gameState);
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h&&nm(h.card)===match;});
  __choicePickV49(i>=0?i:0);
}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
`;

/* ===== A. Real activation, normal case: the real Level 4 Gemini monster is really released as the real
   cost (confirmed to resolve BEFORE target selection: at target-selection time the candidate pool is the
   real post-cost field; S03-U111 correction: the activated デュアルスパーク itself is NOT a legal target — an
   activated Spell/Trap cannot target itself — and is no longer offered, see test_s03_u111_god_bird_attack.js), a
   real opponent monster is really targeted and really destroyed instead, and since the real destroy really
   succeeded, the controller really draws 1 real card (regression: the already-correct "destroy succeeds ->
   draw" half of the ruling keeps working). ===== */
harness(COMMON+String.raw`
fresh();
const ds=mk('デュアルスパーク',0);
gameState.players[0].hand=[ds];
const gemini=mk('E・HERO アナザー・ネオス',0,'up');
gameState.players[0].mz=[gemini];
const foeMon=mk('青眼の白龍',1,'up');
gameState.players[1].mz=[foeMon];
gameState.players[0].deck=[mk('もけもけ',0)];
baselineA();
duelActivateFromHand(0);
if(pendingChoiceV49(gameState)) __choicePickV49(0);
pickByName('青眼の白龍');
drive();
ok('A: the real Level 4 Gemini monster is really released (sent to the real GY) as the real cost',
  gameState.players[0].grave.some(c=>nm(c)==='E・HERO アナザー・ネオス')&&!gameState.players[0].mz.length,
  JSON.stringify({grave:gameState.players[0].grave.map(nm),mz:gameState.players[0].mz.map(nm)}));
ok('A: the real targeted opponent monster is really destroyed',
  gameState.players[1].grave.some(c=>nm(c)==='青眼の白龍')&&!gameState.players[1].mz.length,
  JSON.stringify({p1grave:gameState.players[1].grave.map(nm),p1mz:gameState.players[1].mz.map(nm)}));
ok('A: since the real destroy really succeeded, the controller really draws 1 real card',
  gameState.players[0].hand.some(c=>nm(c)==='もけもけ')&&!gameState.players[0].deck.length,
  JSON.stringify({hand:gameState.players[0].hand.map(nm),deck:gameState.players[0].deck.map(nm)}));
audit('A');
`);

/* ===== B. Negative control: with no real face-up Level 4 Gemini monster on the controller's field, the card
   is correctly illegal (unchanged pre-existing behavior). ===== */
harness(COMMON+String.raw`
fresh();
const ds=mk('デュアルスパーク',0);
gameState.players[0].hand=[ds];
gameState.players[0].mz=[mk('青眼の白龍',0,'up')];
baselineA();
ok('B: illegal with no real face-up Level 4 Gemini monster to release',
  !strictScriptLegalityV2('デュアルスパーク',0,'hand',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('デュアルスパーク',0,'hand',0,{})));
`);

/* ===== C. The real bug fix under test, matching Konami's own official ruling exactly: the real target
   (M・HERO ヴェイパー, a real card with real unconditional effect-destruction immunity, System v21) really
   cannot be destroyed by デュアルスパーク's real effect. Per the official ruling ("if you cannot destroy the
   target card, you cannot draw"), the controller must NOT draw — even though the real cost (the Tribute) is
   still really paid regardless, since a paid cost is never undone by a failed effect. ===== */
harness(COMMON+String.raw`
fresh();
const ds=mk('デュアルスパーク',0);
gameState.players[0].hand=[ds];
const gemini=mk('E・HERO アナザー・ネオス',0,'up');
gameState.players[0].mz=[gemini];
const immune=mk('M・HERO ヴェイパー',1,'up');
gameState.players[1].mz=[immune];
gameState.players[0].deck=[mk('もけもけ',0)];
baselineA();
duelActivateFromHand(0);
if(pendingChoiceV49(gameState)) __choicePickV49(0);
pickByName('M・HERO ヴェイパー');
drive();
ok('C: the real Gemini monster is still really released as the real cost regardless (a paid cost is never undone)',
  gameState.players[0].grave.some(c=>nm(c)==='E・HERO アナザー・ネオス')&&!gameState.players[0].mz.length,
  JSON.stringify({grave:gameState.players[0].grave.map(nm),mz:gameState.players[0].mz.map(nm)}));
ok('C: the real destruction-immune target really survives (System v21 really blocks the real destroy)',
  gameState.players[1].mz.some(c=>nm(c)==='M・HERO ヴェイパー')&&!gameState.players[1].grave.length,
  JSON.stringify({p1mz:gameState.players[1].mz.map(nm),p1grave:gameState.players[1].grave.map(nm)}));
ok('C: since the real target could not really be destroyed, the controller correctly does NOT draw',
  !gameState.players[0].hand.some(c=>nm(c)==='もけもけ')&&gameState.players[0].deck.some(c=>nm(c)==='もけもけ'),
  JSON.stringify({hand:gameState.players[0].hand.map(nm),deck:gameState.players[0].deck.map(nm)}));
audit('C');
`);
