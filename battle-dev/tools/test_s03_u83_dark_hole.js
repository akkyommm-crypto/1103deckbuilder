/* S03-U83: ブラック・ホール — an IMPLEMENTED main-deck Spell found via priority #7's IMPLEMENTED-tier audit
   (highest consumer count among all IMPLEMENTED cards on the fixed major-deck lists: qty=10 across 10 of the
   13 fixed decks). Already correctly implemented (cards/00_generic_core.js) reusing the generic
   API.destroyAll('mz', null, reason) primitive (player:null -> both sides, matching real Dark Hole text
   "Destroy all monsters on the field") — this unit only adds the missing dedicated real-DUEL-path test,
   promoting it to TESTED. No code change to the card itself. */
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

/* ===== A. Real activation from hand: destroys every real monster on BOTH sides, face-up and face-down
   alike, and leaves non-monster cards (a real Spell/Trap) untouched. ===== */
harness(COMMON+String.raw`
fresh();
const bh=mk('ブラック・ホール',0);
const m1=mk('青眼の白龍',0), m2=mk('もけもけ',0,'down','def');
const m3=mk('ワイト',1), m4=mk('青眼の究極竜',1,'down','def');
gameState.players[0].hand=[bh];
gameState.players[0].mz=[m1,m2];
gameState.players[1].mz=[m3,m4];
const st=mk('サイクロン',1,'down'); st.setTurn=gameState.turn-1;
gameState.players[1].sz=[st];
baselineA();
duelActivateFromHand(0);
driveAll();
audit('A real Dark Hole activation destroying every real monster on both sides');
ok('A: every real monster on both sides (face-up and face-down alike) is really destroyed',
  zoneOf(m1.uid)==='grave'&&zoneOf(m2.uid)==='grave'&&zoneOf(m3.uid)==='grave'&&zoneOf(m4.uid)==='grave',
  JSON.stringify({m1:zoneOf(m1.uid),m2:zoneOf(m2.uid),m3:zoneOf(m3.uid),m4:zoneOf(m4.uid)}));
ok('A: a real Spell/Trap Zone card is left untouched (this effect only destroys monsters)',
  zoneOf(st.uid)==='sz',JSON.stringify({st:zoneOf(st.uid)}));
ok('A: ブラック・ホール itself resolves and leaves the field as a normal Spell',
  zoneOf(bh.uid)==='grave',JSON.stringify({bh:zoneOf(bh.uid)}));
`);

/* ===== B. Real negative control: illegal when the field has no real monster at all. ===== */
harness(COMMON+String.raw`
fresh();
const bh=mk('ブラック・ホール',0);
gameState.players[0].hand=[bh];
baselineA();
const leg=strictScriptLegalityV2('ブラック・ホール',0,'hand',0,{});
ok('B: illegal to activate when the real field has no monster at all',!leg.ok,JSON.stringify(leg));
`);
