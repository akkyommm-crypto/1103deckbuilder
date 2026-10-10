/* S03-U10 C-S03-07 CARD_ACTIVATION_VS_EFFECT
   Requirement: a Continuous/Field Spell or Continuous Trap whose text puts no requirement on activating the card itself
   can be activated from the hand or from a set as a card activation only; its effects are activated or applied separately
   once it is face-up. Rulings (2011 wiki): 竜の渓谷 10/07/04; 神の居城－ヴァルハラ; コア転送ユニット / 擬似空間 10/09/23.
   Measured before: 135 of 188 scripted Continuous/Field S/T could not be activated as cards on an empty board (effect
   conditions blocked the card), and where the condition held the card activation ran the effect. After: 155/188; the rest
   are cards whose activation has a real requirement (target, cost, declaration, activation condition).
   1. name-free sweep over the declaration table (CARD_ACTIVATION_FREE_V32, read at runtime)
   2. real paths: 竜の渓谷 (card, then effect from the field), アポート (unified), 木遁封印式 (set trap), 一族の結束 (continuous),
      SEGOC exclusion of a set declared trap, control card 正統なる血統 (activation requirement kept), VM2 continuation. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
function drive(){for(let i=0;i<200;i++){
  if(EVT_V2_STATE||pendingChoiceV49(gameState))return EVT_V2_STATE?'evt':'choice';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function faceOf(c){const h=findCardByUid(c.uid);return h?h.card.face:null;}
function pickCard(c){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing');const i=pc.candidates.findIndex(x=>x.uid===c.uid);if(i<0)throw Error('candidate missing '+cardName(c)+' in '+pc.title);__choicePickV49(i);}
function pickLabel(s){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing');const i=pc.candidates.findIndex(x=>String(x.label||'').includes(s));if(i<0)throw Error('candidate missing '+s);__choicePickV49(i);}
function replay(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a));}
function journalFrom(i){return V41_ACTION_JOURNAL.slice(i).map(x=>x.action);}
/* CODEX-C01: the per-link special-win bracket is journaled engine bookkeeping,
   not this card activation's effect; it remains intentionally replay/digest-visible. */
const NO_EFFECT_TYPES=new Set(['MOVE','CHAIN_ADD','CHAIN_RESOLVE_TOP','SPECIAL_WIN_DEFER_S03','FX_SET_STATE','DECLARE_V11','CHOICE_OPEN_V49','CHOICE_ANSWER_V49','EVENT_QUEUE_V31','EVENT_DEQUEUE_V31','EVENT_RESUME_V11']);
`;

const first=harness(COMMON+String.raw`
/* ===== 1. name-free sweep over the declaration table ===== */
const names=[...CARD_ACTIVATION_FREE_V32].filter(n=>CARD_SCRIPTS[n]);
const bad=[],replayBad=[];let checked=0;
for(const name of names){
  try{
    const id=findCardIndex(name),db=id>=0?CARD_DB[id]:null;
    if(!db||(db.k!=='s'&&db.k!=='t')||!['永続','フィールド'].includes(db.sub)){bad.push(name+': not a Continuous/Field S/T');continue;}
    fresh();const c=mk(name);let j0;
    if(db.k==='s'){
      gameState.players[0].hand=[c];baselineA();j0=V41_ACTION_JOURNAL.length;
      if(!getLegalHandActions(0,0).some(a=>a.id==='activate')){bad.push(name+': activation not offered from hand');continue;}
      duelActivateFromHand(0);
    }else{
      c.face='down';c.setTurn=gameState.turn-1;gameState.players[0].sz=[c];baselineA();j0=V41_ACTION_JOURNAL.length;
      if(!getLegalZoneActions(0,'sz',0).some(a=>a.id==='activateSet')){bad.push(name+': set activation not offered');continue;}
      duelActivateFromZone(0,'sz',0,{});
    }
    const choiceAtActivation=!!pendingChoiceV49(gameState);
    const r=drive();
    const acts=journalFrom(j0),add=acts.find(a=>a.type==='CHAIN_ADD');
    const effects=acts.filter(a=>!NO_EFFECT_TYPES.has(a.type)).map(a=>a.type);
    const zone=zoneOf(c),onField=(db.sub==='フィールド'?zone==='field':zone==='sz')&&faceOf(c)==='up';
    if(choiceAtActivation||r!=='idle'||!add||add.cardActivationOnly!==true||add.v44CountConsume||effects.length||!onField)
      bad.push(name+': '+JSON.stringify({choiceAtActivation,r,add:!!add,flag:add&&add.cardActivationOnly,count:!!(add&&add.v44CountConsume),effects,zone,face:faceOf(c)}));
    const pkg=v41ReplayPackage(gameState),au=v44ReplayAuditPackage(pkg);if(!au.ok)replayBad.push(name);
    checked++;
  }catch(e){bad.push(name+': '+String(e&&e.message||e).slice(0,80));}
}
ok('declaration table is loaded ('+names.length+' scripted names)',names.length>=100,String(names.length));
ok('every declared card can be activated as a card on an empty board (from hand, or from a set for traps): no effect choice, no effect, no count use, face-up on the field',bad.length===0&&checked===names.length,bad.slice(0,5).join(' | '));
ok('every declared card activation replays with matching digests',replayBad.length===0,replayBad.join(','));

/* ===== 2a. 竜の渓谷: card activation, then its effect from the field ===== */
fresh();
let valley=mk('竜の渓谷'),pha=mk('ドラグニティ－ファランクス'),dux=mk('ドラグニティ－ドゥクス'),legion=mk('ドラグニティ－レギオン');
gameState.players[0].hand=[valley,pha];gameState.players[0].deck=[dux,legion];baselineA();
duelActivateFromHand(0);
ok('竜の渓谷 card activation opens no mode or discard choice',!pendingChoiceV49(gameState)&&gameState.chain.length===1&&gameState.chain[0].cardActivationOnly===true);
drive();
ok('it resolves as a card activation: face-up in the Field Zone, nothing discarded or searched',zoneOf(valley)==='field'&&faceOf(valley)==='up'&&zoneOf(pha)==='hand'&&zoneOf(dux)==='deck'&&!V41_ACTION_JOURNAL.some(x=>['FX_DISCARD','FX_SEARCH'].includes(x.action.type)));
ok('the card activation uses none of the effect 1/turn',countLeft(0,'竜の渓谷',CARD_SCRIPTS['竜の渓谷'],findCardByUid(valley.uid).card)>0);
replay('竜の渓谷 card activation');
globalThis.__SAVE=JSON.stringify({state:gameState});globalThis.__DIG=v41StateDigest(gameState);
ok('its effect is offered from the face-up card',getLegalZoneActions(0,'field',0).some(a=>a.id==='effect'));
duelActivateFromZone(0,'field',0);
let pc=pendingChoiceV49(gameState);
ok('activating the effect from the field asks for the mode',!!pc&&pc.candidates.length===2,JSON.stringify(pc&&pc.candidates.map(x=>x.label)));
pickLabel('ドラグニティを手札へ');pc=pendingChoiceV49(gameState);
ok('then asks for the discard cost',!!pc&&/捨て/.test(pc.title||''),pc&&pc.title);
pickCard(pha);drive();
if(pendingChoiceV49(gameState)){pickCard(dux);drive();}
ok('the effect discards and searches',zoneOf(pha)==='grave'&&zoneOf(dux)==='hand');
ok('the effect uses the 1/turn',countLeft(0,'竜の渓谷',CARD_SCRIPTS['竜の渓谷'],findCardByUid(valley.uid).card)<=0);
replay('竜の渓谷 effect');

/* ===== 2b. アポート (unified): the card activation pays nothing; the effect pays 800 ===== */
fresh();
let apo=mk('アポート'),psy=mk('サイコ・コマンダー');
gameState.players[0].hand=[apo,psy];gameState.players[1].mz=[mk('セイバーザウルス',1)];baselineA();
duelActivateFromHand(0);drive();
ok('アポート card activation pays no LP and summons nothing',zoneOf(apo)==='sz'&&faceOf(apo)==='up'&&gameState.players[0].lp===8000&&zoneOf(psy)==='hand');
replay('アポート card activation');
ok('アポート effect is offered from the face-up card',getLegalZoneActions(0,'sz',0).some(a=>a.id==='effect'));
duelActivateFromZone(0,'sz',0);
for(let k=0;k<4;k++){if(pendingChoiceV49(gameState)){pickCard(psy);continue;}if(drive()==='idle')break;}
ok('アポート effect pays 800 LP and Special Summons the Psychic',gameState.players[0].lp===7200&&zoneOf(psy)==='mz',JSON.stringify({lp:gameState.players[0].lp,psy:zoneOf(psy)}));
replay('アポート effect');

/* ===== 2c. 木遁封印式: activating the set Continuous Trap releases and banishes nothing ===== */
fresh();
let moku=mk('木遁封印式',0,'down');moku.setTurn=gameState.turn-1;let earth=mk('セイバーザウルス');
gameState.players[0].sz=[moku];gameState.players[0].mz=[earth];gameState.players[1].grave=[mk('サイクロン',1),mk('サイクロン',1)];baselineA();
ok('set 木遁封印式 offers its activation',getLegalZoneActions(0,'sz',0).some(a=>a.id==='activateSet'));
duelActivateFromZone(0,'sz',0);
ok('its card activation asks for no release or target',!pendingChoiceV49(gameState));
drive();
ok('木遁封印式 is face-up; nothing was released or banished',faceOf(moku)==='up'&&zoneOf(earth)==='mz'&&gameState.players[1].grave.length===2&&gameState.players[1].banish.length===0);
replay('木遁封印式 card activation');

/* ===== 2d. 一族の結束: activatable with no GY; its continuous boost applies after activation ===== */
fresh();
let clan=mk('一族の結束');gameState.players[0].hand=[clan];baselineA();
duelActivateFromHand(0);drive();
ok('一族の結束 can be activated with an empty GY and stays face-up',zoneOf(clan)==='sz'&&faceOf(clan)==='up');
fresh();
clan=mk('一族の結束');let wolfField=mk('ジェネティック・ワーウルフ'),wolfGrave=mk('ジェネティック・ワーウルフ');
gameState.players[0].hand=[clan];gameState.players[0].mz=[wolfField];gameState.players[0].grave=[wolfGrave];baselineA();
duelActivateFromHand(0);drive();
ok('once face-up, 一族の結束 boosts a same-Type monster by 800',curATK(findCardByUid(wolfField.uid).card)===2800,curATK(findCardByUid(wolfField.uid).card));
replay('一族の結束');

/* ===== 2e. a set declared Continuous Trap is not a SEGOC trigger, but remains a chain response ===== */
fresh();
let ice=mk('アイスバーン',1,'down');ice.setTurn=gameState.turn-1;let rab=mk('レスキューラビット');
gameState.players[1].sz=[ice];gameState.players[0].hand=[rab];baselineA();
doNormalSummon(0,'atk');
ok('a set declared Continuous Trap is not offered as a SEGOC trigger candidate',!(EVT_V2_STATE&&EVT_V2_STATE.groups.flat().some(c=>c.name==='アイスバーン')));
ok('it can still be activated as a chain response (card activation)',getChainResponsesV2(1).some(x=>cardName(x.card)==='アイスバーン'));

/* ===== 2f. control: 正統なる血統 keeps its activation requirement and activation effect ===== */
fresh();
let blood=mk('正統なる血統',0,'down');blood.setTurn=gameState.turn-1;gameState.players[0].sz=[blood];baselineA();
ok('正統なる血統 (activation targets a Normal Monster) is not offered with an empty GY',!getLegalZoneActions(0,'sz',0).some(a=>a.id==='activateSet'));
fresh();
blood=mk('正統なる血統',0,'down');blood.setTurn=gameState.turn-1;let normal=mk('セイバーザウルス');
gameState.players[0].sz=[blood];gameState.players[0].grave=[normal];baselineA();
duelActivateFromZone(0,'sz',0);
for(let k=0;k<4;k++){if(pendingChoiceV49(gameState)){pickCard(normal);continue;}if(drive()==='idle')break;}
ok('with a target, its activation still Special Summons the monster (activation effect kept)',zoneOf(normal)==='mz'&&!gameState.chain.some(l=>l.cardActivationOnly));
replay('正統なる血統');
`);

if(first.__SAVE){
  harness('const SAVED='+JSON.stringify(first.__SAVE)+';const DIG='+JSON.stringify(first.__DIG)+';'+COMMON+String.raw`
  resetA();gameState=JSON.parse(SAVED).state;
  if(typeof v41EnsureReplayState==='function')v41EnsureReplayState(gameState);
  if(typeof v41SyncJournalToState==='function')v41SyncJournalToState(gameState);
  ok('VM2: the saved 竜の渓谷 card activation state loads with a matching digest',v41StateDigest(gameState)===DIG);
  const v=gameState.players[0].field;
  ok('VM2: 竜の渓谷 is face-up with its 1/turn unused',!!v&&cardName(v)==='竜の渓谷'&&v.face==='up'&&countLeft(0,'竜の渓谷',CARD_SCRIPTS['竜の渓谷'],v)>0);
  duelActivateFromZone(0,'field',0);const pc=pendingChoiceV49(gameState);
  ok('VM2: its effect can be activated after resuming (mode choice)',!!pc&&pc.candidates.length===2);
  `);
}else{console.log('FAIL VM2 save missing');process.exitCode=2;}
