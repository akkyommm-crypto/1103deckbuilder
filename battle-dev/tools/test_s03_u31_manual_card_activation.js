/* S03-U31 MANUAL_CARD_ACTIVATION
   Requirement (C-S03-07 in MANUAL): activating a declared Field/Continuous card from the hand — or from the set state —
   performs the CARD activation only: it is placed face-up, no mode choice opens, no cost is paid, nothing leaves the Deck,
   and the effect's 1/turn is NOT consumed. The effect is a separate operation on the face-up card, and it asks the mode,
   then the cost, then resolves only the chosen mode.
   Before the fix: MANUAL's openHand() -> activateFromHand() -> askChain() -> runEffect() -> runScript() never consulted
   cardActivationOnlyV32 and never called activationV11, so 竜の渓谷's resolve saw ctx.v4EffectKey === undefined and took its
   dragon-mill branch with no choice and no discard, while runScript's countLimit check consumed the 1/turn.
   The user plays in MANUAL; U30 covers the DUEL route only.
   Every card named here is TESTED or GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function P0(){return gameState.players[0];}
/* MANUAL asks the opponent for a chain response through a dialog; headless, run the continuation immediately. */
askChain=(label,cb)=>{TOASTS.push('askChain:'+label);if(typeof cb==='function')cb();};
function drive(){for(let k=0;k<40;k++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  return 'idle';}return 'loop';}
function pick(m){const q=pendingChoiceV49(gameState);if(!q){TOASTS.push('PICK_MISS:'+m);return false;}
  const i=q.candidates.findIndex(x=>String(x.label||x.key||'').includes(m)||(x.uid!=null&&findCardByUid(x.uid)&&nm(findCardByUid(x.uid).card)===m));
  if(i<0){TOASTS.push('PICK_MISS:'+m+' in '+JSON.stringify(q.candidates.map(x=>x.label||x.key)));__choicePickV49(0);return false;}__choicePickV49(i);return true;}
function titles(){const q=pendingChoiceV49(gameState);return q?String(q.title||''):null;}
function left(){return P0().field?countLeft(0,'竜の渓谷',CARD_SCRIPTS['竜の渓谷'],P0().field):null;}
function snap(){return {hand:P0().hand.map(nm),deck:P0().deck.length,grave:P0().grave.map(nm),
  field:P0().field?nm(P0().field):null,face:P0().field?P0().field.face:null,sz:P0().sz.map(nm),left:left()};}
function manualBoard(){
  resetA();PLAY_MODE=PLAY_MODES.MANUAL;
  gameState.activePlayer=0;gameState.phase='main1';
  P0().hand=[mk('竜の渓谷',0),mk('ワイト',0)];
  P0().deck=[mk('ドラグニティ－ドゥクス',0,'down'),mk('青眼の白龍',0,'down'),mk('ワイト',0,'down')];
  baselineA();
}

/* ===== A. MANUAL hand route: the card activation must run no effect ===== */
manualBoard();
const beforeA=snap();
activateFromHand(0);
const afterA=snap();
ok('MANUAL A: activating 竜の渓谷 from the hand performs the CARD activation only — no mode choice, no discard, nothing out of the Deck',
  !pendingChoiceV49(gameState)&&afterA.deck===beforeA.deck&&afterA.grave.length===0,
  JSON.stringify({beforeA,afterA,choice:titles(),toasts:TOASTS.slice(-3)}));
ok('MANUAL A: the effect 1/turn is NOT consumed by the card activation',afterA.left>0,JSON.stringify({left:afterA.left}));
ok('MANUAL A: 竜の渓谷 is face-up in the Field Zone',afterA.field==='竜の渓谷'&&afterA.face==='up',JSON.stringify(afterA));

/* ===== B. MANUAL effect route (search mode): mode -> discard cost -> resolve ===== */
const seenB=[];
activateFromZone(0,'field',0);
for(let k=0;k<8;k++){const r=drive();if(r!=='choice')break;seenB.push(titles());
  if(/効果を選択/.test(titles())){pick('ドラグニティを手札へ');continue;}
  if(/捨てる手札/.test(titles())){pick('ワイト');continue;}
  if(/デッキから選択/.test(titles())){pick('ドラグニティ－ドゥクス');continue;}
  break;}
drive();
const afterB=snap();
ok('MANUAL B: the effect asks the mode first, then the discard cost, then the Deck pick',
  seenB.length===3&&/効果を選択/.test(seenB[0])&&/捨てる手札/.test(seenB[1])&&/デッキから選択/.test(seenB[2]),JSON.stringify(seenB));
ok('MANUAL B (search mode): ワイト was discarded as the cost, ドゥクス added to the hand, 竜の渓谷 still face-up, 1/turn now used',
  afterB.grave.includes('ワイト')&&afterB.hand.includes('ドラグニティ－ドゥクス')&&afterB.field==='竜の渓谷'&&afterB.left<=0,
  JSON.stringify({afterB,toasts:TOASTS.slice(-3)}));

/* ===== C. MANUAL effect route (mill mode) ===== */
manualBoard();
activateFromHand(0);
const seenC=[];
activateFromZone(0,'field',0);
for(let k=0;k<8;k++){const r=drive();if(r!=='choice')break;seenC.push(titles());
  if(/効果を選択/.test(titles())){pick('ドラゴン族を墓地へ');continue;}
  if(/捨てる手札/.test(titles())){pick('ワイト');continue;}
  if(/デッキから選択/.test(titles())){pick('青眼の白龍');continue;}
  break;}
drive();
const afterC=snap();
ok('MANUAL C (mill mode): ワイト discarded as the cost and 青眼の白龍 sent from the Deck to the GY',
  afterC.grave.includes('ワイト')&&afterC.grave.includes('青眼の白龍')&&afterC.deck===2,
  JSON.stringify({afterC,seenC}));

/* ===== D. MANUAL set declared Continuous Spell: activating it from the zone is a card activation ===== */
resetA();PLAY_MODE=PLAY_MODES.MANUAL;
gameState.activePlayer=0;gameState.phase='main1';
const gt=mk('歯車街',0,'down');gt.setTurn=gameState.turn-1;P0().sz=[gt];
P0().deck=[mk('ワイト',0,'down')];
baselineA();
const beforeD={sz:P0().sz.map(nm),deck:P0().deck.length,grave:P0().grave.map(nm)};
activateFromZone(0,'sz',0);
const hGt=findCardByUid(gt.uid);
ok('MANUAL D: the set 歯車街 (declared Continuous Spell) becomes face-up as a CARD activation, with no choice and no card movement',
  !!hGt&&hGt.zone==='sz'&&hGt.card.face==='up'&&!pendingChoiceV49(gameState)&&P0().deck.length===beforeD.deck&&P0().grave.length===0,
  JSON.stringify({beforeD,after:{sz:P0().sz.map(nm),face:hGt&&hGt.card.face,deck:P0().deck.length,grave:P0().grave.map(nm)},choice:titles()}));

/* ===== E. control: an undeclared targeting Continuous Trap still uses the legacy route ===== */
resetA();PLAY_MODE=PLAY_MODES.MANUAL;
gameState.activePlayer=0;gameState.phase='main1';
const hex=mk('六芒星の呪縛',0,'down');hex.setTurn=gameState.turn-1;P0().sz=[hex];
gameState.players[1].mz=[mk('ワイト',1)];
baselineA();
activateFromZone(0,'sz',0);
ok('MANUAL E control: 六芒星の呪縛 is not declared card-activation-free, so its legacy route still runs and asks for its target',
  !!pendingChoiceV49(gameState),JSON.stringify({choice:titles(),toasts:TOASTS.slice(-3)}));
`);
