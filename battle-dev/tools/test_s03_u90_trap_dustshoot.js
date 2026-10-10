/* S03-U90: ダスト・シュート (Trap Dustshoot) — an IMPLEMENTED main-deck Normal Trap found via priority #7's
   IMPLEMENTED-tier audit (qty=4 across agent/bf/six/worm main decks). Already correctly implemented
   (cards/00_generic_core.js) as a real Trap requiring the opponent to have 4+ cards in hand (matching real
   text confirmed via Yugipedia: "If your opponent has 4 or more cards in their hand: Look at your
   opponent's hand and choose 1 monster from it to shuffle into the Deck."), letting the controller choose 1
   real monster from the opponent's real hand and shuffle it into the Deck. This unit only adds the missing
   dedicated real-DUEL-path test, promoting it to TESTED. No code change to the card itself. */
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
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
`;

/* ===== A. Real activation with the opponent's real 4-card hand (2 monsters, 2 Spells): the real Monster
   candidates only include the real monsters, not the Spells; the real chosen monster is really shuffled
   into the Deck. ===== */
harness(COMMON+String.raw`
fresh();
const ds=mk('ダスト・シュート',0,'down'); ds.setTurn=gameState.turn-1;
gameState.players[0].sz=[ds];
gameState.players[1].hand=[mk('ワイト',1),mk('もけもけ',1),mk('サイクロン',1),mk('死者蘇生',1)];
gameState.players[1].deck=[mk('バット',1)];
baselineA();
duelActivateFromZone(0,'sz',0);
if(pendingChoiceV49(gameState)){
  const pc=pendingChoiceV49(gameState);
  ok('A: only the real opponent hand MONSTERS are offered as candidates (Spells excluded)',
    pc.candidates.length===2&&pc.candidates.every(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h&&['ワイト','もけもけ'].includes(nm(h.card));}),
    JSON.stringify(pc.candidates));
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h&&nm(h.card)==='ワイト';});
  __choicePickV49(i>=0?i:0);
}
drive();
ok('A: the real chosen monster is really removed from the real opponent hand and really shuffled into the Deck',
  !gameState.players[1].hand.some(c=>nm(c)==='ワイト')&&gameState.players[1].deck.some(c=>nm(c)==='ワイト')
  &&gameState.players[1].hand.some(c=>nm(c)==='もけもけ'),
  JSON.stringify({hand:gameState.players[1].hand.map(nm),deck:gameState.players[1].deck.map(nm)}));
ok('A: ダスト・シュート itself resolves to the grave as a normal Trap',
  gameState.players[0].grave.some(c=>nm(c)==='ダスト・シュート'),JSON.stringify(gameState.players[0].grave.map(nm)));
audit('A');
`);

/* ===== B. Real negative control: with exactly 3 cards in the real opponent's hand (fewer than the real
   text's "4 or more"), the card is correctly illegal. ===== */
harness(COMMON+String.raw`
fresh();
const ds=mk('ダスト・シュート',0,'down'); ds.setTurn=gameState.turn-1;
gameState.players[0].sz=[ds];
gameState.players[1].hand=[mk('ワイト',1),mk('もけもけ',1),mk('サイクロン',1)];
baselineA();
const leg=strictScriptLegalityV2('ダスト・シュート',0,'sz',0,{});
ok('B: illegal when the real opponent has fewer than 4 cards in hand',!leg.ok,JSON.stringify(leg));
`);

/* ===== C. Real negative control: with a real 4-card opponent hand that contains no monster at all, the
   card is correctly illegal (no legal target). ===== */
harness(COMMON+String.raw`
fresh();
const ds=mk('ダスト・シュート',0,'down'); ds.setTurn=gameState.turn-1;
gameState.players[0].sz=[ds];
gameState.players[1].hand=[mk('サイクロン',1),mk('死者蘇生',1),mk('強欲な壺',1),mk('死者蘇生',1)];
baselineA();
duelActivateFromZone(0,'sz',0);
ok('C: with a real 4-card opponent hand containing no monster, no choice is offered (correctly no-op)',
  !pendingChoiceV49(gameState),JSON.stringify(pendingChoiceV49(gameState)));
drive();
ok('C: the real opponent hand is completely untouched and ダスト・シュート still resolves to the grave',
  gameState.players[1].hand.length===4&&gameState.players[0].grave.some(c=>nm(c)==='ダスト・シュート'),
  JSON.stringify({hand:gameState.players[1].hand.map(nm),p0grave:gameState.players[0].grave.map(nm)}));
audit('C');
`);
