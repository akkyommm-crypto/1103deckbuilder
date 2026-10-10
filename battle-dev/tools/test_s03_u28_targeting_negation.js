/* S03-U28 TARGETING_NEGATION
   Requirement: continuous effects that negate an activation or effect targeting the card apply automatically when that activation is
   put on the chain:
   - ミドル・シールド・ガードナー 「裏側表示のこのモンスター1体を対象とする魔法カードの発動を無効にする。その時、このカードは表側守備表示になる。」
   - アルカナフォース0－THE FOOL 「●表:このカードを対象にする自分のカードの効果を無効にし破壊する。●裏:このカードを対象にする相手のカードの効果を無効にし破壊する。」
     (2011 wiki: both coin effects are continuous effects.)
   Before the fix: both were scripted as onActivateSuccess triggers, which S03-U19 suppresses as late triggers, so neither negated anything.
   Every card named here is TESTED or GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
let SEEN=[];
function settle(){for(let k=0;k<30;k++){const r=drive();if(r==='evt'){EVT_V2_STATE.groups.flat().forEach(c=>SEEN.push(c.name));const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank];if(g&&g.length)eventPickV2(0);else eventSkipGroupV2();continue;}if(r==='choice'){__choicePickV49(0);continue;}return r;}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));return pkg;}
function negatedLinks(pkg){return pkg.actions.map(x=>x&&x.action).filter(x=>x&&x.type==='CHAIN_NEGATE_LINK').map(x=>({mode:x.mode,reason:x.reason}));}
function handIdx(p,name){const i=gameState.players[p].hand.findIndex(c=>nm(c)===name);if(i<0)throw Error(name+' not in hand');return i;}
/* all fixture state (active player, phase) is set before baselineA so Replay starts from the same state */
function ready(p){gameState.activePlayer=p;gameState.phase='main1';baselineA();}
/* activate a card from player p's hand, choosing t as the target and otherwise the candidate whose label contains costMatch (or the first) */
function activateFromHand(p,name,t,costMatch){
  duelActivateFromHand(handIdx(p,name));
  for(let k=0;k<4&&pendingChoiceV49(gameState);k++){const pc=pendingChoiceV49(gameState);
    let i=pc.candidates.findIndex(x=>x.uid===t.uid);
    if(i<0&&costMatch)i=pc.candidates.findIndex(x=>String(x.label||'').includes(costMatch));
    __choicePickV49(i<0?0:i);}
  settle();}

/* ===== ミドル・シールド・ガードナー (face-down) vs シールドクラッシュ ===== */
fresh();SEEN=[];
let msg=mk('ミドル・シールド・ガードナー',0,'down','def');msg.setTurn=gameState.turn-1;gameState.players[0].mz=[msg];
gameState.players[1].hand=[mk('シールドクラッシュ',1)];ready(1);
activateFromHand(1,'シールドクラッシュ',msg);
let pkg=audit('MSG vs シールドクラッシュ');
ok('MSG: P2’s シールドクラッシュ targeting the face-down MSG has its activation negated automatically; MSG is not destroyed and becomes face-up Defense Position',
  zoneOf(msg)==='mz'&&msg.face==='up'&&msg.pos==='def'&&negatedLinks(pkg).some(x=>x.mode==='activation'),
  JSON.stringify({msg:zoneOf(msg),face:msg.face,pos:msg.pos,neg:negatedLinks(pkg),g1:gameState.players[1].grave.map(nm),sz1:gameState.players[1].sz.map(nm),toasts:TOASTS.slice(-3)}));
ok('MSG: no chain block is created for MSG and it is not offered as a trigger',!SEEN.includes('ミドル・シールド・ガードナー')&&!pkg.actions.map(x=>x&&x.action).some(x=>x&&x.type==='CHAIN_ADD'&&x.name==='ミドル・シールド・ガードナー'),JSON.stringify(SEEN));

/* ===== control: face-up MSG is destroyed by シールドクラッシュ ===== */
fresh();SEEN=[];
msg=mk('ミドル・シールド・ガードナー',0,'up','def');gameState.players[0].mz=[msg];
gameState.players[1].hand=[mk('シールドクラッシュ',1)];ready(1);
activateFromHand(1,'シールドクラッシュ',msg);
pkg=audit('control face-up MSG');
ok('control: a face-up MSG targeted by シールドクラッシュ is destroyed (the negation applies only while it is face-down)',zoneOf(msg)==='grave'&&negatedLinks(pkg).length===0,JSON.stringify({msg:zoneOf(msg),neg:negatedLinks(pkg)}));

/* ===== 死者への手向け (a Normal Spell with a discard cost) targeting face-down MSG is negated too ===== */
fresh();SEEN=[];
msg=mk('ミドル・シールド・ガードナー',0,'down','def');msg.setTurn=gameState.turn-1;gameState.players[0].mz=[msg];
gameState.players[1].hand=[mk('死者への手向け',1),mk('ワイト',1)];ready(1);
activateFromHand(1,'死者への手向け',msg,'ワイト');
pkg=audit('MSG vs 死者への手向け');
ok('MSG: 死者への手向け (a Spell card) targeting the face-down MSG has its activation negated; MSG survives in face-up Defense Position',
  zoneOf(msg)==='mz'&&msg.face==='up'&&msg.pos==='def'&&negatedLinks(pkg).some(x=>x.mode==='activation'),JSON.stringify({msg:zoneOf(msg),face:msg.face,pos:msg.pos,neg:negatedLinks(pkg),toasts:TOASTS.slice(-3)}));

/* ===== control: a Trap card (六芒星の呪縛) targeting face-down MSG is not negated ===== */
fresh();SEEN=[];
msg=mk('ミドル・シールド・ガードナー',0,'down','def');msg.setTurn=gameState.turn-1;gameState.players[0].mz=[msg];
let hex=mk('六芒星の呪縛',1,'down');hex.setTurn=gameState.turn-1;gameState.players[1].sz=[hex];ready(1);
duelActivateFromZone(1,'sz',0);
for(let k=0;k<4&&pendingChoiceV49(gameState);k++){const pc=pendingChoiceV49(gameState);const i=pc.candidates.findIndex(x=>x.uid===msg.uid);__choicePickV49(i<0?0:i);}
settle();
pkg=audit('control trap vs MSG');
ok('control: 六芒星の呪縛 (a Trap card) targeting the face-down MSG is not negated; MSG stays face-down and the trap stays on the field',
  negatedLinks(pkg).length===0&&zoneOf(msg)==='mz'&&msg.face==='down'&&zoneOf(hex)==='sz',JSON.stringify({msg:zoneOf(msg),face:msg.face,hex:zoneOf(hex),neg:negatedLinks(pkg),toasts:TOASTS.slice(-3)}));

/* ===== THE FOOL, tails (2): negates the opponent's card effect targeting it, and destroys that card ===== */
fresh();SEEN=[];
let fool=mk('アルカナフォース0－THE FOOL',0);fool.e9FoolCoin=2;gameState.players[0].mz=[fool];
let soul=mk('ソウルテイカー',1);gameState.players[1].hand=[soul];ready(1);
const lp1=gameState.players[1].lp;
activateFromHand(1,'ソウルテイカー',fool);
pkg=audit('THE FOOL tails vs ソウルテイカー');
ok('THE FOOL (tails): P2’s ソウルテイカー targeting it has its effect negated and is destroyed; THE FOOL survives and P2 gains no LP',
  zoneOf(fool)==='mz'&&zoneOf(soul)==='grave'&&gameState.players[1].lp===lp1&&negatedLinks(pkg).some(x=>x.mode==='effect'),
  JSON.stringify({fool:zoneOf(fool),soul:zoneOf(soul),lp1:gameState.players[1].lp,neg:negatedLinks(pkg),toasts:TOASTS.slice(-3)}));

/* ===== THE FOOL, heads (1): negates its controller's own card effect ===== */
fresh();SEEN=[];
fool=mk('アルカナフォース0－THE FOOL',0);fool.e9FoolCoin=1;gameState.players[0].mz=[fool];
let half=mk('ハーフ・シャット',0);gameState.players[0].hand=[half];ready(0);
activateFromHand(0,'ハーフ・シャット',fool);
pkg=audit('THE FOOL heads vs own ハーフ・シャット');
ok('THE FOOL (heads): P1’s own ハーフ・シャット targeting it has its effect negated and is destroyed',
  zoneOf(half)==='grave'&&negatedLinks(pkg).some(x=>x.mode==='effect'),JSON.stringify({half:zoneOf(half),neg:negatedLinks(pkg)}));

/* ===== THE FOOL, heads (1): the opponent's card effect is not negated ===== */
fresh();SEEN=[];
fool=mk('アルカナフォース0－THE FOOL',0);fool.e9FoolCoin=1;gameState.players[0].mz=[fool];
half=mk('ハーフ・シャット',1);gameState.players[1].hand=[half];ready(1);
activateFromHand(1,'ハーフ・シャット',fool);
pkg=audit('THE FOOL heads vs opponent ハーフ・シャット');
ok('THE FOOL (heads): P2’s ハーフ・シャット targeting it is not negated',negatedLinks(pkg).length===0,JSON.stringify({half:zoneOf(half),neg:negatedLinks(pkg)}));
`);
