/* S03-U94: ライトロード・ハンター ライコウ (Ryko, Lightsworn Hunter) — priority #7's IMPLEMENTED-tier audit
   picked this up next after S03-U93 (qty=3, debris main deck). Real text (confirmed via Yugipedia): "FLIP:
   Apply these effects (simultaneously). You can destroy 1 card on the field. Send the top 3 cards of your
   Deck to the GY." Reading the existing implementation (cards/30_themes_b.js) surfaced a real, previously-
   undiscovered bug: the two bullet effects were NOT actually independent — the mandatory deck-mill was only
   performed as a side effect of the registered choice handler for the OPTIONAL destroy, so declining the
   destroy (a real, common, legal choice) silently skipped the mandatory mill too. This traces back to a
   legacy "cancel = nothing happens at all" pattern preserved during the S03-U62 SaveLoad migration, which
   never should have applied to the always-mandatory mill. Fixed by moving the mandatory mill directly into
   resolve(), unconditional on the optional destroy choice. Promotes ライトロード・ハンター ライコウ
   IMPLEMENTED->TESTED. */
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
  if(gameState.pendingSummon){commitPendingSummonV2();continue;}
  return 'idle';}
  return 'loop';}
function driveAll(){for(let i=0;i<20;i++){const st=drive();if(st!=='choice')return st;__choicePickV49(0);}return 'loop';}
function zoneOf(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function pickCancel(){ __choiceCancelV49(); }
function pickByName(match){
  const pc=pendingChoiceV49(gameState);
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h&&nm(h.card)===match;});
  __choicePickV49(i>=0?i:0);
}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
`;

/* ===== A. Real Flip Summon, real DECLINED destroy choice: the mandatory real deck-mill still really
   happens (the fixed bug — the old implementation skipped it entirely when the destroy was declined). ===== */
harness(COMMON+String.raw`
fresh();
const ryko=mk('ライトロード・ハンター ライコウ',0,'down');
gameState.players[0].mz=[ryko];
gameState.players[0].deck=[mk('もけもけ'),mk('バット'),mk('ワイト'),mk('青眼の白龍')];
const foe=mk('青眼の究極竜',1);
gameState.players[1].mz=[foe];
baselineA();
doFlipUp(0,'mz',0,'atk');
drive();
if(pendingChoiceV49(gameState)) pickCancel();
driveAll();
ok('A: ライトロード・ハンター ライコウ really Flip Summons face-up',
  gameState.players[0].mz.some(c=>nm(c)==='ライトロード・ハンター ライコウ'&&c.face==='up'),
  JSON.stringify(gameState.players[0].mz.map(c=>[nm(c),c.face])));
ok('A: with the real destroy declined, the real opponent monster survives untouched',
  zoneOf(foe.uid)==='mz',JSON.stringify({foe:zoneOf(foe.uid)}));
ok('A: the mandatory real deck-mill of exactly 3 cards still really happens even though the destroy was declined (the fixed bug)',
  gameState.players[0].grave.length===3&&gameState.players[0].deck.length===1,
  JSON.stringify({grave:gameState.players[0].grave.map(nm),deck:gameState.players[0].deck.map(nm)}));
audit('A');
`);

/* ===== B. Real Flip Summon, real destroy chosen: both real effects really happen together (the real
   opponent monster destroyed AND the real mandatory mill of 3). ===== */
harness(COMMON+String.raw`
fresh();
const ryko=mk('ライトロード・ハンター ライコウ',0,'down');
gameState.players[0].mz=[ryko];
gameState.players[0].deck=[mk('もけもけ'),mk('バット'),mk('ワイト'),mk('青眼の白龍')];
const foe=mk('青眼の究極竜',1);
gameState.players[1].mz=[foe];
baselineA();
doFlipUp(0,'mz',0,'atk');
drive();
if(pendingChoiceV49(gameState)) pickByName('青眼の究極竜');
driveAll();
ok('B: the real chosen opponent monster is really destroyed',
  zoneOf(foe.uid)==='grave',JSON.stringify({foe:zoneOf(foe.uid)}));
ok('B: the real mandatory deck-mill of exactly 3 cards also really happens',
  gameState.players[0].grave.filter(c=>nm(c)!=='青眼の究極竜').length===3&&gameState.players[0].deck.length===1,
  JSON.stringify({grave:gameState.players[0].grave.map(nm),deck:gameState.players[0].deck.map(nm)}));
audit('B');
`);

/* ===== C. Negative control: with an empty real Deck, only the destroy effect resolves (nothing to mill;
   no error). ===== */
harness(COMMON+String.raw`
fresh();
const ryko=mk('ライトロード・ハンター ライコウ',0,'down');
gameState.players[0].mz=[ryko];
gameState.players[0].deck=[];
baselineA();
doFlipUp(0,'mz',0,'atk');
drive();
if(pendingChoiceV49(gameState)) pickCancel();
driveAll();
ok('C: with a real empty Deck, ライコウ still really resolves cleanly with no cards to mill',
  gameState.players[0].mz.some(c=>nm(c)==='ライトロード・ハンター ライコウ'&&c.face==='up')&&!gameState.players[0].grave.length,
  JSON.stringify({mz:gameState.players[0].mz.map(c=>[nm(c),c.face]),grave:gameState.players[0].grave.map(nm)}));
`);
