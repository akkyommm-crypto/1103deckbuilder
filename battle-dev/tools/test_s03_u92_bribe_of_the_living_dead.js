/* S03-U92: 墓穴の道連れ — priority #7's IMPLEMENTED-tier audit picked this up next after S03-U91 (qty=3,
   dark main deck). Real text (this project's own card database, data/carddata.json, printed 2003-02-20,
   within the 2011-08-31 cutoff): "①: Both players look at their opponent's hand and choose 1 card from it
   to discard. After that, both players each draw 1 card from their Deck." Reading the existing
   implementation (cards/39_1103_expansion_v380b.js) surfaced a real, previously-undiscovered bug: the
   second of the card's two sequential discard choices was made by the ACTIVATING player selecting from
   THEIR OWN hand — contradicting both the real card text (each player's discard from their own hand should
   be chosen by their OPPONENT, not by themselves) and the choice prompt's own title text ("相手が自分の
   手札から捨てさせるカード" = "the card the OPPONENT makes you discard"), which the code silently
   contradicted. Fixed by making the second choice's `player` the opponent, selecting from the activator's
   hand. Promotes 墓穴の道連れ IMPLEMENTED->TESTED. */
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

/* ===== A. Real activation: the FIRST discard choice (which of the opponent's hand cards to discard) is
   really made by the activator; the SECOND discard choice (which of the activator's OWN hand cards is
   discarded) is really made by the real OPPONENT, not the activator (the fixed bug). Both real discards and
   both real draws happen. ===== */
harness(COMMON+String.raw`
fresh();
const gy=mk('墓穴の道連れ',0);
gameState.players[0].hand=[gy,mk('サイクロン',0),mk('強欲な壺',0)];
gameState.players[0].deck=[mk('もけもけ',0)];
gameState.players[1].hand=[mk('死者蘇生',1),mk('王宮のお触れ',1)];
gameState.players[1].deck=[mk('バット',1)];
baselineA();
duelActivateFromHand(0);
drive();
let pc=pendingChoiceV49(gameState);
ok('A: the real FIRST choice (which real opponent hand card to discard) is really made by the activator (P1)',
  pc.player===0&&pc.candidates.length===2,JSON.stringify(pc));
pickByName('死者蘇生');
pc=pendingChoiceV49(gameState);
ok('A: the real SECOND choice (which of the activator’s OWN hand cards is discarded) is really made by the real OPPONENT (P2), not the activator',
  pc.player===1&&pc.candidates.length===2,JSON.stringify(pc));
pickByName('サイクロン');
drive();
ok('A: the real chosen opponent card (死者蘇生) is really discarded from the real opponent hand',
  gameState.players[1].grave.some(c=>nm(c)==='死者蘇生')&&gameState.players[1].hand.some(c=>nm(c)==='王宮のお触れ'),
  JSON.stringify({p1hand:gameState.players[1].hand.map(nm),p1grave:gameState.players[1].grave.map(nm)}));
ok('A: the real opponent-chosen card (サイクロン) is really discarded from the activator’s real hand, not the activator’s own free choice',
  gameState.players[0].grave.some(c=>nm(c)==='サイクロン')&&gameState.players[0].hand.some(c=>nm(c)==='強欲な壺'),
  JSON.stringify({p0hand:gameState.players[0].hand.map(nm),p0grave:gameState.players[0].grave.map(nm)}));
ok('A: both real players really draw 1 card each',
  gameState.players[0].hand.some(c=>nm(c)==='もけもけ')&&gameState.players[1].hand.some(c=>nm(c)==='バット'),
  JSON.stringify({p0hand:gameState.players[0].hand.map(nm),p1hand:gameState.players[1].hand.map(nm)}));
audit('A');
`);

/* ===== B. Real negative control: illegal with an empty real opponent hand. ===== */
harness(COMMON+String.raw`
fresh();
const gy=mk('墓穴の道連れ',0);
gameState.players[0].hand=[gy];
gameState.players[0].deck=[mk('もけもけ',0)];
gameState.players[1].deck=[mk('バット',1)];
baselineA();
ok('B: illegal with an empty real opponent hand',!strictScriptLegalityV2('墓穴の道連れ',0,'hand',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('墓穴の道連れ',0,'hand',0,{})));
`);

/* ===== C. Real negative control: illegal with an empty real Deck on either side. ===== */
harness(COMMON+String.raw`
fresh();
const gy=mk('墓穴の道連れ',0);
gameState.players[0].hand=[gy,mk('サイクロン',0)];
gameState.players[0].deck=[];
gameState.players[1].hand=[mk('死者蘇生',1)];
gameState.players[1].deck=[mk('バット',1)];
baselineA();
ok('C: illegal with an empty real Deck for the activator',!strictScriptLegalityV2('墓穴の道連れ',0,'hand',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('墓穴の道連れ',0,'hand',0,{})));
`);
