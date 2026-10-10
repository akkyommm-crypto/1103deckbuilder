/* S03-U99: ヒーロー・ブラスト (Hero Blast) — priority #7's IMPLEMENTED-tier audit, continuing after U98
   (one of the 7 remaining qty=3 main-deck candidates found by U97's corrected cross-reference). Real text
   (confirmed via Yugipedia): "Target 1 'Elemental HERO' Normal Monster in your GY; add that target to your
   hand, then if your opponent controls any monsters with ATK less than or equal to that target's ATK,
   destroy 1 of them." Note there is no "you can" before "destroy" — the destroy is MANDATORY once the
   condition (the opponent controls a qualifying monster) is met; only WHICH qualifying monster to destroy is
   a free choice, not WHETHER to destroy at all. The GY target search (heroNormalInGrave, reusing
   treatedAsNormal so a "Dual"/Gemini "E・HERO" monster like E・HERO アナザー・ネオス correctly counts as a
   Normal Monster while sitting in the GY, matching real rulings) and the ATK-threshold opponent-monster
   filter were already correctly implemented in cards/30_themes_b.js. But the resolve() step's
   API.requestChoice for the destroy target was declared with cancelable:true, letting the controller
   illegally decline the destroy even when a real qualifying opponent monster existed — a real, previously-
   undiscovered bug (the mandatory-vs-optional pattern already found once this session, S03-U94's ライコウ,
   but the opposite direction: there the mandatory half was wrongly gated behind an optional choice; here the
   entire destroy step is wrongly optional). Fixed by declaring the choice cancelable:false — the destroy
   target selection can no longer be declined once a real qualifying candidate exists (matching the engine's
   own cancelable semantics, engine/09_choice_request_v49.js: a non-cancelable pending choice rejects
   __choiceCancelV49() outright and stays pending). No engine change; single-card fix. Promotes ヒーロー・
   ブラスト IMPLEMENTED->TESTED. */
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

/* ===== A. Real activation: a real "E・HERO" monster treated as Normal in the real GY (E・HERO アナザー・
   ネオス, ATK 1900, not re-summoned) is really targeted and really added to hand; the real opponent controls
   one real qualifying monster (もけもけ, ATK 300 <= 1900) and one real non-qualifying monster (青眼の白龍,
   ATK 3000 > 1900) — only the real qualifying one is really destroyed, the other untouched. The mandatory
   destroy choice is confirmed real non-cancelable (the fix under test): __choiceCancelV49() really fails and
   the choice really stays pending, before it is really answered. ===== */
harness(COMMON+String.raw`
fresh();
const hb=mk('ヒーロー・ブラスト',0,'down');
gameState.players[0].sz=[hb];
gameState.players[0].grave=[mk('E・HERO アナザー・ネオス',0)];
const weak=mk('もけもけ',1,'up'), strong=mk('青眼の白龍',1,'up');
gameState.players[1].mz=[weak,strong];
baselineA();
duelActivateFromZone(0,'sz',0);
if(pendingChoiceV49(gameState)) __choicePickV49(0);
drive();
ok('A: the real "E・HERO" Normal-treated monster is really added to the real hand',
  gameState.players[0].hand.some(c=>nm(c)==='E・HERO アナザー・ネオス')&&!gameState.players[0].grave.some(c=>nm(c)==='E・HERO アナザー・ネオス'),
  JSON.stringify({hand:gameState.players[0].hand.map(nm),grave:gameState.players[0].grave.map(nm)}));
const pcA=pendingChoiceV49(gameState);
ok('A: the real destroy choice is really non-cancelable (the fix)',
  !!pcA&&pcA.cancelable===false,JSON.stringify(pcA&&{cancelable:pcA.cancelable}));
__choiceCancelV49();
ok('A: a real cancel attempt on the real non-cancelable choice really fails and the choice really stays pending',
  !!pendingChoiceV49(gameState),JSON.stringify({stillPending:!!pendingChoiceV49(gameState)}));
pickByName('もけもけ');
drive();
ok('A: the real qualifying opponent monster (ATK<=1900) is really destroyed',
  gameState.players[1].grave.some(c=>nm(c)==='もけもけ')&&!gameState.players[1].mz.some(c=>nm(c)==='もけもけ'),
  JSON.stringify({p1grave:gameState.players[1].grave.map(nm),p1mz:gameState.players[1].mz.map(nm)}));
ok('A: the real non-qualifying opponent monster (ATK>1900) is really left untouched',
  gameState.players[1].mz.some(c=>nm(c)==='青眼の白龍'),
  JSON.stringify({p1mz:gameState.players[1].mz.map(nm)}));
audit('A');
`);

/* ===== B. Negative control: with no real "E・HERO" Normal(-treated) monster in the real GY, the card is
   correctly illegal (unchanged pre-existing behavior). ===== */
harness(COMMON+String.raw`
fresh();
const hb=mk('ヒーロー・ブラスト',0,'down');
gameState.players[0].sz=[hb];
gameState.players[0].grave=[mk('青眼の白龍',0)];
baselineA();
ok('B: illegal with no real "E・HERO" Normal-treated monster in the real GY',
  !strictScriptLegalityV2('ヒーロー・ブラスト',0,'sz',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('ヒーロー・ブラスト',0,'sz',0,{})));
`);

/* ===== C. Real negative control on the destroy clause: with the real opponent controlling only a real
   NON-qualifying monster (ATK strictly greater than the returned target's ATK), the real add-to-hand still
   happens but no destroy choice is offered at all (the mandatory clause correctly never triggers when its
   own real condition is false) — proving the fix (cancelable:false) does not turn this into an incorrectly
   forced destroy when no legal candidate exists. ===== */
harness(COMMON+String.raw`
fresh();
const hb=mk('ヒーロー・ブラスト',0,'down');
gameState.players[0].sz=[hb];
gameState.players[0].grave=[mk('E・HERO アナザー・ネオス',0)];
gameState.players[1].mz=[mk('青眼の白龍',1,'up')];
baselineA();
duelActivateFromZone(0,'sz',0);
if(pendingChoiceV49(gameState)) __choicePickV49(0);
drive();
ok('C: the real target still really moves to the real hand even with no real qualifying opponent monster',
  gameState.players[0].hand.some(c=>nm(c)==='E・HERO アナザー・ネオス'),
  JSON.stringify(gameState.players[0].hand.map(nm)));
ok('C: no real destroy choice is offered and the real non-qualifying opponent monster is untouched',
  !pendingChoiceV49(gameState)&&gameState.players[1].mz.some(c=>nm(c)==='青眼の白龍'),
  JSON.stringify({pending:pendingChoiceV49(gameState),p1mz:gameState.players[1].mz.map(nm)}));
audit('C');
`);
