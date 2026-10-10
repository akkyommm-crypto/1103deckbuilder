/* S03-U105: 血の代償 (Cost of the Blood) — Tribute-payment fix. Direct follow-up to U104's own flagged
   top-priority finding: resolve() Special-Summoned the chosen hand monster (treated as a Normal Summon) via
   a raw FX_SPECIAL_SUMMON action with ZERO Tribute payment or Tribute-count check at all, regardless of the
   summoned monster's real Level (confirmed empirically in U104: a real Level-8 monster, real 2-Tribute
   requirement, was Special Summoned for free). No card anywhere in this codebase previously reused the real
   tribute-selection machinery (normalSummonMethodsFor/pickTributes, engine/70_summon_procedures.js) from
   within a script's own resolve() — both are designed as top-level UI-action handlers (openPick/showToast,
   reading gameState.activePlayer directly), not safely composable mid-chain-resolution.

   Fixed with a new, small, resolve()-safe recursive Tribute-selection helper
   (s03BloodOfferTributeThenSummon, cards/00_generic_core.js) that reuses the existing PURE-LOGIC pieces of
   the real summon-procedure machinery (normalSummonMethodsFor to determine the real required Tribute count
   generically — including any registered alternate summon methods, not just naive Level math;
   tributeCandidatesForV23 for the real legal Tribute pool including any material-filter restrictions;
   tributeValueOptions for the real 2-for-1-style Tribute value exceptions) via the same replay-safe
   API.selectCard pattern already used throughout this codebase's card scripts, instead of the raw
   openPick/act() combo pickTributes uses. condition()/selectTargets() were also fixed to only recognize a
   hand monster as legal if a real affordable Tribute method actually exists for it (previously any hand
   monster was offered regardless of whether the real board could pay for it) — reusing
   normalSummonMethodsFor's own real affordability filtering (it excludes methods whose Tribute count
   exceeds the real Tribute capacity currently on the field).

   No engine change; single-card fix (cards/00_generic_core.js only), directly composing existing engine
   primitives. Promotes nothing new by name (血の代償 was already promoted to TESTED in U104) — this is a
   pure correctness follow-up fix to the same card, verified by its own dedicated test. */
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
function driveAll(){for(let i=0;i<20;i++){const st=drive();if(st!=='choice')return st;__choicePickV49(0);}return 'loop';}
function pickByName(match){
  const pc=pendingChoiceV49(gameState);
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h&&nm(h.card)===match;});
  __choicePickV49(i>=0?i:0);
}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
`;

/* ===== A. Real 1-Tribute monster: a real Level 6 hand monster (ジュラック・ヘレラ, no special summon
   procedure) is really chosen; exactly 1 real field monster is really released as the real Tribute before
   the real Special Summon (treated as a Normal Summon) succeeds. ===== */
harness(COMMON+String.raw`
fresh();
const chi=mk('血の代償',0,'up');
gameState.players[0].sz=[chi];
gameState.players[0].hand=[mk('ジュラック・ヘレラ',0)];
gameState.players[0].mz=[mk('もけもけ',0,'up')];
gameState.players[0].lp=8000;
baselineA();
duelActivateFromZone(0,'sz',0);
if(pendingChoiceV49(gameState)) pickByName('ジュラック・ヘレラ');
driveAll();
ok('A: the real Level 6 monster really needs and really pays exactly 1 real Tribute (もけもけ really sent to the real Graveyard)',
  gameState.players[0].grave.some(c=>nm(c)==='もけもけ')&&!gameState.players[0].mz.some(c=>nm(c)==='もけもけ'),
  JSON.stringify({grave:gameState.players[0].grave.map(nm),mz:gameState.players[0].mz.map(nm)}));
ok('A: ジュラック・ヘレラ is really Special Summoned (treated as a Normal Summon) in real Attack Position',
  gameState.players[0].mz.some(c=>nm(c)==='ジュラック・ヘレラ'&&c.pos==='atk')&&!gameState.players[0].hand.length,
  JSON.stringify({mz:gameState.players[0].mz.map(c=>[nm(c),c.pos])}));
audit('A');
`);

/* ===== B. Real 2-Tribute monster: a real Level 8 hand monster (青眼の白龍) is really chosen; both real
   field monsters are really released as the real Tributes before the real Special Summon succeeds — the
   core fixed bug (previously summoned for free with zero Tributes paid). ===== */
harness(COMMON+String.raw`
fresh();
const chi=mk('血の代償',0,'up');
gameState.players[0].sz=[chi];
gameState.players[0].hand=[mk('青眼の白龍',0)];
gameState.players[0].mz=[mk('もけもけ',0,'up'),mk('ワイト',0,'up')];
gameState.players[0].lp=8000;
baselineA();
duelActivateFromZone(0,'sz',0);
if(pendingChoiceV49(gameState)) pickByName('青眼の白龍');
driveAll();
ok('B: the real Level 8 monster really pays BOTH real Tributes (the fixed bug)',
  gameState.players[0].grave.some(c=>nm(c)==='もけもけ')&&gameState.players[0].grave.some(c=>nm(c)==='ワイト')&&!gameState.players[0].mz.some(c=>nm(c)==='もけもけ'||nm(c)==='ワイト'),
  JSON.stringify({grave:gameState.players[0].grave.map(nm),mz:gameState.players[0].mz.map(nm)}));
ok('B: 青眼の白龍 is really Special Summoned (treated as a Normal Summon) after really paying both real Tributes',
  gameState.players[0].mz.some(c=>nm(c)==='青眼の白龍'&&c.pos==='atk'),
  JSON.stringify(gameState.players[0].mz.map(c=>[nm(c),c.pos])));
audit('B');
`);

/* ===== C. Real negative control: with only 1 real Tribute available for a real 2-Tribute-requiring monster
   (青眼の白龍), the card is correctly illegal — the real board cannot really afford the real Tribute cost
   (the fixed bug's other half: previously ANY hand monster was offered regardless of real affordability). ===== */
harness(COMMON+String.raw`
fresh();
const chi=mk('血の代償',0,'up');
gameState.players[0].sz=[chi];
gameState.players[0].hand=[mk('青眼の白龍',0)];
gameState.players[0].mz=[mk('もけもけ',0,'up')];
gameState.players[0].lp=8000;
baselineA();
ok('C: illegal with only 1 real Tribute available for a real 2-Tribute monster',
  !strictScriptLegalityV2('血の代償',0,'sz',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('血の代償',0,'sz',0,{})));
`);

/* ===== D. Real mixed-hand confirmation: with a real affordable Level-4 monster AND a real unaffordable
   Level-8 monster (no Tributes at all on the real field) both in hand, only the real affordable one is
   really offered as a selectTargets candidate. ===== */
harness(COMMON+String.raw`
fresh();
const chi=mk('血の代償',0,'up');
gameState.players[0].sz=[chi];
gameState.players[0].hand=[mk('青眼の白龍',0),mk('カラクリ兵 弐参六',0)];
gameState.players[0].lp=8000;
baselineA();
duelActivateFromZone(0,'sz',0);
const pc=pendingChoiceV49(gameState);
ok('D: only the real affordable Level-4 monster is really offered as a target candidate, not the real unaffordable Level-8 one',
  !!pc&&pc.candidates.length===1&&(()=>{const h=findCardByUid(pc.candidates[0].uid);return h&&nm(h.card)==='カラクリ兵 弐参六';})(),
  JSON.stringify(pc&&pc.candidates.map(c=>{const h=findCardByUid(c.uid);return h&&nm(h.card);})));
`);
