/* S03-U30 UI_ACTIVATION_PATHS: drive the action-menu entries the real battle.html hands the browser
   (getLegalHandActions / getLegalZoneActions `run` strings), not the engine functions directly.
   Requirement under test (C-S03-07 / U10, via the UI): activating a declared Field/Continuous card from the hand
   performs the CARD activation only — no mode choice, no cost, no deck movement, no 1/turn consumption — and the
   EFFECT is a separate operation on the face-up card that asks mode first, then the discard cost, then resolves.
   Every card named here is TESTED or GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;CHOICES.length=0;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
/* answer choices the way a player would, recording each title in order */
const CHOICES=[];
function answer(pick){for(let k=0;k<12;k++){const r=drive();
  if(r==='choice'){const pc=pendingChoiceV49(gameState);CHOICES.push(pc.title);
    const i=pick?pick(pc):0;__choicePickV49(i<0?0:i);continue;}
  if(r==='evt'){eventSkipGroupV2();continue;} break;}}
/* run a menu entry exactly as the UI does: eval the action's run string */
function runMenu(list,id){const e=(list||[]).find(a=>a.id===id);if(!e)throw Error(id+' not offered: '+JSON.stringify((list||[]).map(a=>a.id)));eval(e.run);return e;}
function ids(list){return (list||[]).map(a=>a.id);}
function P0(){return gameState.players[0];}
function field(){return P0().field;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}

/* ===== board: 竜の渓谷 + a discardable card in hand; a Dragunity and dragons in the deck ===== */
fresh();
gameState.activePlayer=0;gameState.phase='main1';
const valley=mk('竜の渓谷',0), pitch=mk('ワイト',0);
P0().hand=[valley,pitch];
const dux=mk('ドラグニティ－ドゥクス',0,'down'), blue=mk('青眼の白龍',0,'down'), wight=mk('ワイト',0,'down');
P0().deck=[dux,blue,wight];
baselineA();
const deck0=P0().deck.length, hand0=P0().hand.length;

/* ---- A. the hand menu's activation entry performs the CARD activation only ---- */
const handActs=getLegalHandActions(0,0);
ok('UI hand menu: 竜の渓谷 offers 発動 (card activation) and セット only',
  ids(handActs).includes('activate')&&!ids(handActs).includes('handEffect'),JSON.stringify(handActs.map(a=>({id:a.id,label:a.label,run:a.run}))));
runMenu(handActs,'activate');
ok('UI: no choice is opened by the card activation (no mode, no discard)',!pendingChoiceV49(gameState),
  JSON.stringify({choice:pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).title,chain:gameState.chain.map(l=>({name:l.name,cao:!!l.cardActivationOnly,key:l.v4EffectKey}))}));
const link=gameState.chain[gameState.chain.length-1];
ok('UI: the chain link is a card activation (cardActivationOnly, no effect mode)',
  !!link&&link.cardActivationOnly===true&&(link.v4EffectKey==null),JSON.stringify(link&&{cao:link.cardActivationOnly,key:link.v4EffectKey,from:link.from}));
answer();
ok('UI: 竜の渓谷 is face-up in the Field Zone, nothing was discarded and the Deck is untouched',
  !!field()&&nm(field())==='竜の渓谷'&&field().face==='up'&&P0().hand.length===hand0-1&&P0().deck.length===deck0&&P0().grave.length===0,
  JSON.stringify({field:field()&&nm(field()),face:field()&&field().face,hand:P0().hand.map(nm),deck:P0().deck.length,grave:P0().grave.map(nm),choices:CHOICES}));
ok('UI: the effect 1/turn is NOT consumed by the card activation',
  countLeft(0,'竜の渓谷',CARD_SCRIPTS['竜の渓谷'],field())>0,'left='+countLeft(0,'竜の渓谷',CARD_SCRIPTS['竜の渓谷'],field()));
audit('UI card activation');

/* ---- B/C. the face-up card's effect: mode first, then the discard cost, then the mill ---- */
const zoneActs=getLegalZoneActions(0,'field',0);
ok('UI field menu: the face-up 竜の渓谷 offers 効果を発動',ids(zoneActs).includes('effect'),JSON.stringify(zoneActs.map(a=>({id:a.id,label:a.label,run:a.run}))));
CHOICES.length=0;
runMenu(zoneActs,'effect');
answer(pc=>{
  if(/効果を選択/.test(pc.title)) return (pc.candidates||[]).findIndex(c=>String(c.value||c.key)==='dragon');
  if(/捨てる手札/.test(pc.title)) return (pc.candidates||[]).findIndex(c=>c.uid===pitch.uid);
  if(/デッキから選択/.test(pc.title)) return (pc.candidates||[]).findIndex(c=>c.uid===blue.uid);
  return 0;});
ok('UI: the effect asks the mode first, then the discard cost, then the Deck pick',
  CHOICES.length===3&&/効果を選択/.test(CHOICES[0])&&/捨てる手札/.test(CHOICES[1])&&/デッキから選択/.test(CHOICES[2]),JSON.stringify(CHOICES));
ok('UI (mill mode): ワイト was discarded as the cost and 青眼の白龍 went from the Deck to the GY',
  P0().grave.some(c=>c.uid===pitch.uid)&&P0().grave.some(c=>c.uid===blue.uid)&&P0().deck.length===deck0-1&&!P0().hand.some(c=>c.uid===pitch.uid),
  JSON.stringify({hand:P0().hand.map(nm),deck:P0().deck.length,grave:P0().grave.map(nm)}));
ok('UI: the effect consumed the 1/turn',countLeft(0,'竜の渓谷',CARD_SCRIPTS['竜の渓谷'],field())<=0,'left='+countLeft(0,'竜の渓谷',CARD_SCRIPTS['竜の渓谷'],field()));
ok('UI: the effect is no longer offered this turn',!ids(getLegalZoneActions(0,'field',0)).includes('effect'),JSON.stringify(ids(getLegalZoneActions(0,'field',0))));
audit('UI effect activation (mill)');

/* ---- D. the search mode, on a fresh turn-equivalent board ---- */
fresh();
gameState.activePlayer=0;gameState.phase='main1';
const valley2=mk('竜の渓谷',0), pitch2=mk('ワイト',0);
P0().hand=[valley2,pitch2];
const dux2=mk('ドラグニティ－ドゥクス',0,'down'), blue2=mk('青眼の白龍',0,'down');
P0().deck=[dux2,blue2];
baselineA();
runMenu(getLegalHandActions(0,0),'activate');answer();
CHOICES.length=0;
runMenu(getLegalZoneActions(0,'field',0),'effect');
answer(pc=>{
  if(/効果を選択/.test(pc.title)) return (pc.candidates||[]).findIndex(c=>String(c.value||c.key)==='dragunity');
  if(/捨てる手札/.test(pc.title)) return (pc.candidates||[]).findIndex(c=>c.uid===pitch2.uid);
  if(/デッキから選択/.test(pc.title)) return (pc.candidates||[]).findIndex(c=>c.uid===dux2.uid);
  return 0;});
ok('UI (search mode): ドラグニティ－ドゥクス went from the Deck to the hand, ワイト was the discard cost',
  P0().hand.some(c=>c.uid===dux2.uid)&&P0().grave.some(c=>c.uid===pitch2.uid)&&!P0().deck.some(c=>c.uid===dux2.uid),
  JSON.stringify({hand:P0().hand.map(nm),deck:P0().deck.map(nm),grave:P0().grave.map(nm),choices:CHOICES}));
audit('UI effect activation (search)');
`);
