/* S03-U88: 砂塵の大竜巻 (Dust Tornado) — an IMPLEMENTED main-deck Trap found via priority #7's IMPLEMENTED-
   tier audit (qty=5 across agent/debris/tg_gadget main decks). Already correctly implemented
   (cards/20_control_counter.js) as a real Trap targeting 1 Spell/Trap the opponent controls (face-up or
   face-down alike, matching real text exactly: "Target 1 Spell/Trap your opponent controls; destroy that
   target, then you can Set 1 Spell/Trap from your hand"), destroying it, then optionally setting 1 Spell/Trap
   from hand via the S03-U62 registered choice handler (s03u62.giant-trunade-set). This exact card was
   central to S03-U70's real R1 infinite-loop investigation (a generic getChainResponsesV2 mz-zone gating
   bug, fixed generically, unrelated to this card's own script, which was and remains correct) — U70
   deliberately used an empty CARD_TEST_FOCUS entry to avoid promoting it via incidental mention. This unit
   only adds the missing dedicated real-DUEL-path test, promoting it to TESTED. No code change to the card
   itself. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.phase='main1';}
function drive(){for(let i=0;i<600;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}
  return 'loop';}
function zoneOf(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
`;

/* ===== A. Real activation, real face-down opponent Trap target, real optional Set from hand really
   exercised (picking a real Spell/Trap to set). ===== */
harness(COMMON+String.raw`
fresh();
const dt=mk('砂塵の大竜巻',0,'down'); dt.setTurn=gameState.turn-1;
const foeTrap=mk('リビングデッドの呼び声',1,'down');
gameState.players[0].sz=[dt];
gameState.players[0].hand=[mk('サイクロン',0)];
gameState.players[1].sz=[foeTrap];
baselineA();
duelActivateFromZone(0,'sz',0);
if(pendingChoiceV49(gameState)){
  const pc=pendingChoiceV49(gameState);
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h&&nm(h.card)==='リビングデッドの呼び声';});
  ok('A: the real face-down opponent Trap is really offered as a target candidate',i>=0,JSON.stringify(pc.candidates));
  __choicePickV49(i>=0?i:0);
}
drive();
if(pendingChoiceV49(gameState)){
  const pc=pendingChoiceV49(gameState);
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h&&nm(h.card)==='サイクロン';});
  __choicePickV49(i>=0?i:0);
}
drive();
ok('A: the real targeted opponent Trap is really destroyed',
  gameState.players[1].grave.some(c=>nm(c)==='リビングデッドの呼び声')&&!gameState.players[1].sz.length,
  JSON.stringify({p1sz:gameState.players[1].sz.map(nm),p1grave:gameState.players[1].grave.map(nm)}));
ok('A: サイクロン is really Set from hand as the optional follow-up',
  gameState.players[0].sz.some(c=>nm(c)==='サイクロン'&&c.face==='down')&&!gameState.players[0].hand.length,
  JSON.stringify({p0sz:gameState.players[0].sz.map(c=>[nm(c),c.face]),p0hand:gameState.players[0].hand.map(nm)}));
ok('A: 砂塵の大竜巻 itself resolves to the grave as a normal Trap',
  gameState.players[0].grave.some(c=>nm(c)==='砂塵の大竜巻'),JSON.stringify(gameState.players[0].grave.map(nm)));
audit('A');
`);

/* ===== B. Real face-up opponent Spell target (no face restriction, matching real text); the optional Set
   is really declined (cancelled). ===== */
harness(COMMON+String.raw`
fresh();
const dt=mk('砂塵の大竜巻',0,'down'); dt.setTurn=gameState.turn-1;
const foeSpell=mk('速攻のかかし',1,'up');
gameState.players[0].sz=[dt];
gameState.players[1].sz=[foeSpell];
baselineA();
duelActivateFromZone(0,'sz',0);
if(pendingChoiceV49(gameState)){
  const pc=pendingChoiceV49(gameState);
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h&&nm(h.card)==='速攻のかかし';});
  ok('B: a real face-up opponent Spell is also a legal target (no face restriction)',i>=0,JSON.stringify(pc.candidates));
  __choicePickV49(i>=0?i:0);
}
drive();
if(pendingChoiceV49(gameState)){
  const pc=pendingChoiceV49(gameState);
  ok('B: with no Spell/Trap in hand at all, no optional-Set choice is offered here (empty hand)',pc.candidates.length===0,JSON.stringify(pc));
  __choicePickV49(-1);
}
drive();
ok('B: the real targeted opponent Spell is really destroyed; no card was Set (empty hand)',
  gameState.players[1].grave.some(c=>nm(c)==='速攻のかかし')&&!gameState.players[0].sz.some(c=>c!==dt&&zoneOf(c.uid)==='sz'),
  JSON.stringify({p1grave:gameState.players[1].grave.map(nm),p0sz:gameState.players[0].sz.map(nm)}));
`);

/* ===== C. Real negative control: with no Spell/Trap anywhere on the real opponent field, the card is
   correctly illegal. ===== */
harness(COMMON+String.raw`
fresh();
const dt=mk('砂塵の大竜巻',0,'down'); dt.setTurn=gameState.turn-1;
gameState.players[0].sz=[dt];
baselineA();
const leg=strictScriptLegalityV2('砂塵の大竜巻',0,'sz',0,{});
ok('C: illegal when the opponent controls no Spell/Trap at all',!leg.ok,JSON.stringify(leg));
`);
