/* S03-U93: カオス・ソーサラー (Chaos Sorcerer) — priority #7's IMPLEMENTED-tier audit picked this up next
   after S03-U92 (qty=3, debris main deck). Real text (confirmed via Yugipedia): "Cannot be Normal Summoned/
   Set. Must first be Special Summoned (from your hand) by banishing 1 LIGHT and 1 DARK monster from your
   GY. Once per turn: You can target 1 face-up monster on the field; banish that target. This card cannot
   attack the turn you activate this effect." Reading the existing implementation (cards/00_generic_core.js)
   surfaced a real, previously-undiscovered bug: the "cannot attack the turn you activate this effect"
   clause was only ever written to a log message (API.log) — never actually enforced. Confirmed empirically:
   a real attack right after activating the field effect succeeded and destroyed the opponent's monster.
   Fixed using the engine's existing dynamic continuous.cannotAttack(card) hook (already used by 光の護封剣)
   combined with a turn-number-stamped card flag (API.setCardFlag) so the restriction is correctly
   turn-scoped (not permanent, since a raw card.cannotAttack=true would persist until the card leaves the
   field). Promotes カオス・ソーサラー IMPLEMENTED->TESTED. */
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
function pickByName(match){
  const pc=pendingChoiceV49(gameState);
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h&&nm(h.card)===match;});
  __choicePickV49(i>=0?i:0);
}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
`;

/* ===== A. Real hand-based Special Summon: really banishes 1 real LIGHT and 1 real DARK monster from the
   Graveyard, really Special Summons itself from hand in Attack Position. ===== */
harness(COMMON+String.raw`
fresh();
const cs=mk('カオス・ソーサラー',0);
gameState.players[0].hand=[cs];
gameState.players[0].grave=[mk('ワイト'),mk('青眼の白龍')];
baselineA();
duelActivateFromZone(0,'hand',0);
if(pendingChoiceV49(gameState)) pickByName('青眼の白龍');
drive();
if(pendingChoiceV49(gameState)) pickByName('ワイト');
drive();
ok('A: カオス・ソーサラー really Special Summons itself from hand in real Attack Position',
  gameState.players[0].mz.some(c=>nm(c)==='カオス・ソーサラー'&&c.pos==='atk'),
  JSON.stringify(gameState.players[0].mz.map(c=>[nm(c),c.pos])));
ok('A: the real LIGHT (青眼の白龍) and DARK (ワイト) Graveyard monsters are really banished as cost',
  gameState.players[0].banish.some(c=>nm(c)==='ワイト')&&gameState.players[0].banish.some(c=>nm(c)==='青眼の白龍')
  &&!gameState.players[0].grave.length,
  JSON.stringify({banish:gameState.players[0].banish.map(nm),grave:gameState.players[0].grave.map(nm)}));
audit('A');
`);

/* ===== B/C. Real field ignition effect: really banishes a real face-up monster on the field (including
   itself, no side restriction, matching real text); the real "cannot attack the turn you activate this
   effect" clause is now really enforced (the fixed bug — before this unit, this was ONLY a log message). =====
   ===== D. On a real LATER turn, the same カオス・ソーサラー can attack normally again (confirming the
   restriction is correctly turn-scoped, not permanent). ===== */
harness(COMMON+String.raw`
fresh();
const cs=mk('カオス・ソーサラー',0);
const foe=mk('もけもけ',1);
gameState.players[0].mz=[cs];
gameState.players[1].mz=[foe];
baselineA();
duelActivateFromZone(0,'mz',0);
if(pendingChoiceV49(gameState)){
  const pc=pendingChoiceV49(gameState);
  ok('B: both カオス・ソーサラー itself and the real opponent monster are legal real targets (no side restriction)',
    pc.candidates.length===2,JSON.stringify(pc.candidates.map(c=>c.label)));
  pickByName('もけもけ');
}
driveAll();
ok('B: the real targeted face-up opponent monster is really banished',
  zoneOf(foe.uid)==='banish',JSON.stringify({foe:zoneOf(foe.uid)}));
gameState.activePlayer=0;gameState.phase='battle';
const foe2=mk('バット',1);
gameState.players[1].mz=[foe2];
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});
driveAll();
ok('C: カオス・ソーサラー really CANNOT attack the same real turn it activated its field effect (the fixed bug)',
  zoneOf(foe2.uid)==='mz',JSON.stringify({foe2:zoneOf(foe2.uid)}));
gameState.turn=gameState.turn+1;
gameState.activePlayer=0;gameState.phase='battle';
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});
driveAll();
ok('D: on a real LATER turn, カオス・ソーサラー really CAN attack again (turn-scoped, not permanent)',
  zoneOf(foe2.uid)==='grave',JSON.stringify({foe2:zoneOf(foe2.uid)}));
audit('D');
`);

/* ===== E. Real negative control: illegal from hand with no LIGHT+DARK pair in the Graveyard. (A field
   activation is always legal at minimum against the activator's own real face-up self, matching segment
   B's confirmed no-side-restriction real text, so a "no face-up monster anywhere" case never actually
   arises once the card itself is face-up on the field.) ===== */
harness(COMMON+String.raw`
fresh();
const cs=mk('カオス・ソーサラー',0);
gameState.players[0].hand=[cs];
gameState.players[0].grave=[mk('もけもけ'),mk('青眼の白龍')];
baselineA();
ok('E: illegal from hand with no real DARK monster in the Graveyard (2 LIGHT, 0 DARK)',
  !strictScriptLegalityV2('カオス・ソーサラー',0,'hand',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('カオス・ソーサラー',0,'hand',0,{})));
`);
