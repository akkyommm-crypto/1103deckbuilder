/* S03-U77: C-S03-26 DRAW_REPLACEMENT — the last remaining declared item (WORK_QUEUE.md), Sin World.
   Real text (2011-02-24, Field Spell, within cutoff): "①: Instead of your normal draw during your Draw
   Phase, you can activate this: show your opponent 3 "Sin" cards from your Deck; your opponent randomly
   picks 1; add that 1 to your hand; return the rest to the Deck."
   The WORK_QUEUE gap note's implied "needs a new random-reveal-pick primitive" turned out to be stale, the
   same pattern already proven for 始祖の守護者ティラス (S03-U76): every piece already exists —
   duelRandomInt (engine/06_replay_rng_v41.js, precedent: v80DiscardRandom) for the opponent's random pick,
   a resolution-time multi-select requestChoice (min=max=N, precedent: 酒呑童子 in cards/C6_auto_cycle24.js)
   for which N cards the controller reveals, and fieldIgnition (precedent: 大樹海/血の代償) for the ordinary
   Field-Spell placement-from-hand needing no script logic at all. The one genuinely new piece is a third
   extension of drawReplacementCandidatesS03 (engine/1V_draw_replacement_s03.js) to also scan P.field — the
   same shape as the S03-U65 grave extension — plus updating the hardcoded mz/grave zone check in
   cards/H9_claude_s03_draw_replacement.js's 's03u33.draw-choice' handler to also accept 'field' (the same
   kind of hardcoded-elsewhere gotcha the U65 extension also had to fix). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function title(){const q=pendingChoiceV49(gameState);return q?String(q.title||''):null;}
function labels(){const q=pendingChoiceV49(gameState);return q?q.candidates.map(x=>String(x.label||x.key||'')):[];}
function pick(m){const q=pendingChoiceV49(gameState);if(!q){TOASTS.push('PICK_MISS:'+m);return false;}
  const i=q.candidates.findIndex(x=>String(x.label||x.key||'').includes(m)||(x.uid!=null&&findCardByUid(x.uid)&&nm(findCardByUid(x.uid).card)===m));
  if(i<0){TOASTS.push('PICK_MISS:'+m+' in '+JSON.stringify(labels()));return false;}__choicePickV49(i);return true;}
function pickUid(uid){const q=pendingChoiceV49(gameState);if(!q)return false;
  const i=q.candidates.findIndex(c=>c.uid===uid);if(i<0)return false;__choicePickV49(i);return true;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));return pkg;}
function hand(p){return gameState.players[p].hand.map(nm);}
function deck(p){return gameState.players[p].deck.map(nm);}
function requestNormalDraw(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:0,n:1,normal:true});}
function fieldDrawPhaseBoard(deckNames){
  fresh();
  const sw=mk('Sin World',0,'up');
  gameState.players[0].field=sw;
  gameState.players[0].deck=deckNames.map(n=>mk(n,0,'down'));
  gameState.players[0].hand=[];
  gameState.activePlayer=0;gameState.phase='draw';gameState.drawnThisTurn=false;
  baselineA();
  return sw;
}

/* ===== A. Ordinary Field-Spell activation from hand: Sin World is placed face-up on the field zone with no
   chain effect resolving (fieldIgnition + cardActivationOnlyV32 bypass condition()/resolve() entirely — the
   generic behavior shared by every Field Spell, no script logic needed for this part). ===== */
fresh();
const swHand=mk('Sin World',0);
gameState.players[0].hand=[swHand];
gameState.players[0].deck=[mk('ワイト',0,'down')];
baselineA();
duelActivateFromHand(0);drive();
ok('A: Sin World is really placed on the field zone face-up by an ordinary hand activation, with no reveal choice opening (a plain card-activation-only Field Spell placement)',
  gameState.players[0].field&&nm(gameState.players[0].field)==='Sin World'&&gameState.players[0].field.face==='up'&&!pendingChoiceV49(gameState),
  JSON.stringify({field:gameState.players[0].field&&nm(gameState.players[0].field),pending:!!pendingChoiceV49(gameState)}));
audit('A Sin World real placement from hand');

/* ===== B. Real Draw Phase: with Sin World resting face-up on the field and 5 real "Sin" cards + 2 filler
   cards in the Deck, the draw-replacement offer includes it; choosing it opens a resolution-time reveal
   choice restricted to exactly 3 distinct "Sin" cards (filler cards excluded from the candidate pool);
   after revealing 3 and letting duelRandomInt pick 1, exactly that 1 (one of the 3 actually revealed) is
   added to hand, the other 2 stay in the Deck, and the normal draw is replaced (drawnThisTurn becomes true
   with no card physically drawn beyond the 1 added). ===== */
fieldDrawPhaseBoard(['Sin 青眼の白龍','Sin 真紅眼の黒竜','Sin パラレルギア','Sin Claw Stream','Sin レインボー・ドラゴン','ワイト','もけもけ']);
requestNormalDraw();drive();
ok('B setup: the draw-replacement offer includes Sin World from the field zone',
  /通常のドロー/.test(title()||'')&&labels().some(l=>l.includes('Sin World')),JSON.stringify({title:title(),labels:labels()}));
pick('Sin World');drive();
const bChoice=pendingChoiceV49(gameState);
ok('B: Sin World opens a resolution-time choice to reveal exactly 3 distinct "Sin" cards from the Deck (min=max=3), with the 2 filler cards correctly excluded from the candidate pool',
  !!bChoice&&bChoice.min===3&&bChoice.max===3&&bChoice.candidates.length===5&&labels().every(l=>l.indexOf('Sin')===0),
  JSON.stringify({min:bChoice&&bChoice.min,max:bChoice&&bChoice.max,labels:labels()}));
const bRevealedUids=bChoice.candidates.slice(0,3).map(c=>c.uid);
const bRevealedNames=bRevealedUids.map(u=>nm(findCardByUid(u).card));
bRevealedUids.forEach(pickUid);
__choiceCommitV49();drive();
ok('B: exactly 1 of the 3 revealed "Sin" cards is added to hand (duelRandomInt picked it), the other 2 stay in the Deck, and the normal draw is replaced (no separate normal draw on top)',
  hand(0).length===1&&bRevealedNames.includes(hand(0)[0])&&deck(0).length===6&&gameState.drawnThisTurn===true,
  JSON.stringify({hand:hand(0),revealed:bRevealedNames,deckLen:deck(0).length,deck:deck(0)}));
audit('B Sin World reveal-3 draw replacement');

/* ===== C. Fewer than 3 "Sin" cards in the Deck (only 1): the reveal choice correctly asks for exactly that
   1 (min=max=1, not the full 3 — the standard "reveal as many as you have" ruling for a reveal-N effect,
   not a hard requirement of 3 in hand). ===== */
fieldDrawPhaseBoard(['Sin パラレルギア','ワイト']);
requestNormalDraw();drive();
pick('Sin World');drive();
const cChoice=pendingChoiceV49(gameState);
ok('C: with only 1 "Sin" card in the Deck, the reveal choice requires exactly that 1 (min=max=1)',
  !!cChoice&&cChoice.min===1&&cChoice.max===1&&cChoice.candidates.length===1,
  JSON.stringify({min:cChoice&&cChoice.min,max:cChoice&&cChoice.max}));
pick('Sin パラレルギア');drive();
ok('C: the sole "Sin" card is added to hand, the Deck keeps the filler card, and the normal draw is replaced',
  hand(0).length===1&&hand(0)[0]==='Sin パラレルギア'&&deck(0).length===1&&deck(0)[0]==='ワイト'&&gameState.drawnThisTurn===true,
  JSON.stringify({hand:hand(0),deck:deck(0)}));
audit('C single-Sin-card reveal');

/* ===== D. Zero "Sin" cards in the Deck: Sin World is not offered as a draw-replacement candidate at all
   (condition() correctly rejects it before it ever reaches the offer UI) — the normal draw proceeds with no
   choice opening. ===== */
fieldDrawPhaseBoard(['ワイト','もけもけ']);
requestNormalDraw();drive();
ok('D: with zero "Sin" cards in the Deck, no choice opens at all and the normal draw proceeds for real',
  !pendingChoiceV49(gameState)&&hand(0).length===1&&gameState.drawnThisTurn===true,
  JSON.stringify({hand:hand(0),pending:!!pendingChoiceV49(gameState)}));
audit('D no Sin cards -> normal draw, Sin World not offered');

/* ===== E. Sin World set face-down on the field: not offered as a draw-replacement candidate (must be
   face-up, matching the same 11/01/10 円盤ムスキー-shaped "resolve-time face-up requirement" this file's
   own condition()/resolve() both enforce). ===== */
fresh();
const swDown=mk('Sin World',0,'down');
gameState.players[0].field=swDown;
gameState.players[0].deck=[mk('Sin パラレルギア',0,'down'),mk('ワイト',0,'down')];
gameState.players[0].hand=[];
gameState.activePlayer=0;gameState.phase='draw';gameState.drawnThisTurn=false;
baselineA();
requestNormalDraw();drive();
ok('E: a face-down Sin World on the field is not offered as a draw-replacement candidate; a real normal draw takes the real top Deck card instead',
  !pendingChoiceV49(gameState)&&hand(0).length===1&&hand(0)[0]==='Sin パラレルギア'&&deck(0).length===1&&deck(0)[0]==='ワイト'&&gameState.drawnThisTurn===true,
  JSON.stringify({hand:hand(0),deck:deck(0),pending:!!pendingChoiceV49(gameState)}));
audit('E face-down Sin World not offered');
`);
