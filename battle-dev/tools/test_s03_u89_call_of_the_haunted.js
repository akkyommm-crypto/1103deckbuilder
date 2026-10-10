/* S03-U89: リビングデッドの呼び声 (Call of the Haunted) — an IMPLEMENTED main-deck Continuous Trap found via
   priority #7's IMPLEMENTED-tier audit (qty=5 across bf/dark/debris/jurrac/tg_gadget of the 13 fixed decks).
   Real text (confirmed via Yugipedia): "Activate this card by targeting 1 monster in your GY; Special
   Summon that target in Attack Position. When this card leaves the field, destroy that monster. When that
   monster is destroyed, destroy this card." The old implementation (cards/00_generic_core.js) only handled
   the Special Summon itself — the entire leave-field/mutual-destruction pair of clauses was missing, a real
   gap (not just a missing test). Fixed using the same System v9 linked-lifecycle primitive as リミット・
   リバース (cards/HE_claude_s03_u56_limit_reverse.js), but asymmetrically: real text destroys this card
   only when the summoned monster is specifically DESTROYED (not any leave-field reason, e.g. a bounce or
   Tribute), unlike the "this card leaves -> destroy monster" direction, which is unconditional on the leave
   reason. Card converted from a plain defineScript to defineUnifiedCardV4 (two effect entries: the
   activation itself, and a forced onDestroy-triggered secondary that destroys this card when the linked
   monster is specifically destroyed). Promotes リビングデッドの呼び声 IMPLEMENTED->TESTED. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function nm(c){return c?cardName(c):null;}
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
  return 'idle';}
  return 'loop';}
function driveAll(){for(let i=0;i<20;i++){const st=drive();if(st!=='choice')return st;__choicePickV49(0);}return 'loop';}
function zoneOf(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function pickTarget(match){
  const pc=pendingChoiceV49(gameState);
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h&&nm(h.card)===match;});
  __choicePickV49(i>=0?i:0);
}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
`;

/* ===== A. Real activation: real GY-monster target selection, real Special Summon in Attack Position
   (fixed position, no choice). ===== */
harness(COMMON+String.raw`
fresh();
const coth=mk('リビングデッドの呼び声',0,'down'); coth.setTurn=gameState.turn-1;
gameState.players[0].sz=[coth];
gameState.players[0].grave=[mk('ワイト'),mk('もけもけ')];
baselineA();
duelActivateFromZone(0,'sz',0);
if(pendingChoiceV49(gameState)) pickTarget('ワイト');
driveAll();
ok('A: 蘇生対象の real Special Summon really happens in Attack Position',
  gameState.players[0].mz.some(c=>nm(c)==='ワイト'&&c.pos==='atk'),
  JSON.stringify(gameState.players[0].mz.map(c=>[nm(c),c.pos])));
ok('A: リビングデッドの呼び声 really stays on the field as a Continuous Trap',
  gameState.players[0].sz.some(c=>nm(c)==='リビングデッドの呼び声'),JSON.stringify(gameState.players[0].sz.map(nm)));
audit('A');
`);

/* ===== B. Real battle destruction of the summoned monster really destroys リビングデッドの呼び声 too
   (the "when that monster is destroyed, destroy this card" clause). ===== */
harness(COMMON+String.raw`
fresh();
const coth=mk('リビングデッドの呼び声',0,'down'); coth.setTurn=gameState.turn-1;
gameState.players[0].sz=[coth];
gameState.players[0].grave=[mk('ワイト')];
baselineA();
duelActivateFromZone(0,'sz',0);
if(pendingChoiceV49(gameState)) pickTarget('ワイト');
driveAll();
const wightUid=gameState.players[0].mz.find(c=>nm(c)==='ワイト').uid;
const atk1=mk('青眼の究極竜',1);
gameState.players[1].mz=[atk1];
gameState.activePlayer=1;gameState.phase='battle';
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});
driveAll();
ok('B: real battle destroys ワイト',zoneOf(wightUid)==='grave',JSON.stringify({wight:zoneOf(wightUid)}));
ok('B: リビングデッドの呼び声 is really ALSO destroyed when its Special Summoned monster is destroyed',
  zoneOf(coth.uid)==='grave',JSON.stringify({coth:zoneOf(coth.uid),p0sz:gameState.players[0].sz.map(nm)}));
audit('B');
`);

/* ===== C. リビングデッドの呼び声 itself really destroyed by 砂塵の大竜巻 (a real chain resolution) really
   destroys the Special Summoned monster too (the "when this card leaves the field, destroy that monster"
   clause) — the mutual link fires in the opposite direction from segment B. ===== */
harness(COMMON+String.raw`
fresh();
const coth=mk('リビングデッドの呼び声',0,'down'); coth.setTurn=gameState.turn-1;
gameState.players[0].sz=[coth];
gameState.players[0].grave=[mk('ワイト')];
baselineA();
duelActivateFromZone(0,'sz',0);
if(pendingChoiceV49(gameState)) pickTarget('ワイト');
driveAll();
const wightUid=gameState.players[0].mz.find(c=>nm(c)==='ワイト').uid;
const dt=mk('砂塵の大竜巻',1,'down'); dt.setTurn=gameState.turn-1;
gameState.players[1].sz=[dt];
baselineA();
duelActivateFromZone(1,'sz',0);
if(pendingChoiceV49(gameState)) pickTarget('リビングデッドの呼び声');
driveAll();
if(pendingChoiceV49(gameState)) __choicePickV49(-1);
driveAll();
ok('C: real 砂塵の大竜巻 really destroys リビングデッドの呼び声',
  zoneOf(coth.uid)==='grave',JSON.stringify({coth:zoneOf(coth.uid)}));
ok('C: the real Special Summoned ワイト is really ALSO destroyed when リビングデッドの呼び声 leaves the field',
  zoneOf(wightUid)==='grave',JSON.stringify({wight:zoneOf(wightUid),p0mz:gameState.players[0].mz.map(nm)}));
audit('C');
`);

/* ===== D. Negative control: the Special Summoned monster leaves the field by a non-destroy reason (real
   bounce to hand) — リビングデッドの呼び声 correctly stays on the field (the real "destroyed" specificity,
   not the broader "leaves the field", governs this direction). ===== */
harness(COMMON+String.raw`
fresh();
const coth=mk('リビングデッドの呼び声',0,'down'); coth.setTurn=gameState.turn-1;
gameState.players[0].sz=[coth];
gameState.players[0].grave=[mk('ワイト')];
baselineA();
duelActivateFromZone(0,'sz',0);
if(pendingChoiceV49(gameState)) pickTarget('ワイト');
driveAll();
const wight=gameState.players[0].mz.find(c=>nm(c)==='ワイト');
API.returnToHand({p:0,zone:'mz',index:gameState.players[0].mz.indexOf(wight),card:wight},'test-bounce-not-destroy');
driveAll();
ok('D: the monster really leaves the field by bounce (not destroy)',
  gameState.players[0].hand.some(c=>nm(c)==='ワイト'),JSON.stringify(gameState.players[0].hand.map(nm)));
ok('D: リビングデッドの呼び声 correctly stays on the real field (only "destroyed" triggers self-destruction, not any leave)',
  zoneOf(coth.uid)==='sz',JSON.stringify({coth:zoneOf(coth.uid)}));
audit('D');
`);

/* ===== E. Real negative controls: illegal with no monster in the Graveyard; illegal with the Monster Zone
   full. ===== */
harness(COMMON+String.raw`
fresh();
const coth=mk('リビングデッドの呼び声',0,'down'); coth.setTurn=gameState.turn-1;
gameState.players[0].sz=[coth];
baselineA();
ok('E: illegal with no monster in the real Graveyard at all',!strictScriptLegalityV2('リビングデッドの呼び声',0,'sz',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('リビングデッドの呼び声',0,'sz',0,{})));
gameState.players[0].grave=[mk('ワイト')];
gameState.players[0].mz=[mk('もけもけ',0),mk('バット',0),mk('もけもけ',0),mk('バット',0),mk('もけもけ',0)];
baselineA();
ok('E: illegal with the real Monster Zone full',!strictScriptLegalityV2('リビングデッドの呼び声',0,'sz',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('リビングデッドの呼び声',0,'sz',0,{})));
`);
