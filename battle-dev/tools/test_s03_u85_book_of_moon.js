/* S03-U85: 月の書 (Book of Moon) — an IMPLEMENTED main-deck Quick-Play Spell found via priority #7's
   IMPLEMENTED-tier audit (qty=7 across 7 of the 13 fixed decks, continuing after S03-U83/U84). Already
   correctly implemented (cards/00_generic_core.js): targets 1 face-up monster on the field (either side, no
   restriction, matching the real text "Target 1 face-up monster on the field; change that target to
   face-down Defense Position"), resolving via API.flip + API.changePosition, both of which safely re-resolve
   the target (and no-op if it is gone) rather than trusting a stale reference. This unit only adds the
   missing dedicated real-DUEL-path test, promoting it to TESTED. No code change to the card itself. */
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
function pickUid(uid){const q=pendingChoiceV49(gameState);if(!q)return false;
  const i=q.candidates.findIndex(c=>c.uid===uid);if(i<0)return false;__choicePickV49(i);return true;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function zoneOf(uid){const h=findCardByUid(uid);return h?h.zone:null;}
`;

/* ===== A. Real activation targeting a real face-up opponent ATK-position monster: flips it real face-down
   Defense Position. ===== */
harness(COMMON+String.raw`
fresh();
const bom=mk('月の書',0);
gameState.players[0].hand=[bom];
const foe=mk('青眼の白龍',1,'up','atk');
gameState.players[1].mz=[foe];
baselineA();
duelActivateFromHand(0);
driveAll();
pickUid(foe.uid);
driveAll();
audit('A real Book of Moon on a real opponent ATK-position monster');
ok('A: the real opponent monster is really flipped face-down Defense Position, still on the field',
  zoneOf(foe.uid)==='mz'&&foe.face==='down'&&foe.pos==='def',
  JSON.stringify({zone:zoneOf(foe.uid),face:foe.face,pos:foe.pos}));
`);

/* ===== B. Real activation targeting the controller's own real face-up monster (no side restriction). ===== */
harness(COMMON+String.raw`
fresh();
const bom=mk('月の書',0);
gameState.players[0].hand=[bom];
const mine=mk('もけもけ',0,'up','atk');
gameState.players[0].mz=[mine];
baselineA();
duelActivateFromHand(0);
driveAll();
pickUid(mine.uid);
driveAll();
audit('B real Book of Moon on the real controllers own monster');
ok('B: the real controllers own monster is really flipped face-down Defense Position',
  zoneOf(mine.uid)==='mz'&&mine.face==='down'&&mine.pos==='def',
  JSON.stringify({zone:zoneOf(mine.uid),face:mine.face,pos:mine.pos}));
`);

/* ===== C. Real negative control: illegal with no face-up monster anywhere on the field. ===== */
harness(COMMON+String.raw`
fresh();
const bom=mk('月の書',0);
gameState.players[0].hand=[bom];
const foe=mk('ワイト',1,'down','def');
gameState.players[1].mz=[foe];
baselineA();
const leg=strictScriptLegalityV2('月の書',0,'hand',0,{cardOverride:bom,logicalZone:'sz',prospectiveIndex:0});
ok('C: illegal to activate when the real field has no face-up monster at all',!leg.ok,JSON.stringify(leg));
`);
