/* S03-U09 TRIGGER_OFFER_LEGALITY
   Requirement: in DUEL mode, SEGOC offers only triggers that can actually be activated now, with the same
   legality as when the player picks one (condition, count limit, locks, trap negation).
   Found by vertical slice #1: after a 300-ATK Normal Summon the opponent's set 奈落 was offered; picking it only toasted.
   Measured before the fix: a forced trigger with no legal target (聖なる魔術師 with no Spell in the GY, 闇霊使いダルク
   with no DARK monster) was offered in a forced group, the pick was refused and forced groups cannot be skipped,
   so the duel stalled. Rules: an effect that cannot be activated (no target) is simply not activated.
   Real paths: Normal Summon, attack on a face-down monster (the flip trigger is offered in the damage step, then the monster is destroyed by battle). */
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
function offeredNames(){const st=EVT_V2_STATE;return st?st.groups.flat().map(c=>c.name):[];}
/* drive, skipping unrelated optional groups, until the named trigger is offered or the duel is idle */
function reach(name){
  for(let k=0;k<12;k++){
    const r=drive();
    if(r!=='evt')return r;
    const st=EVT_V2_STATE;
    if(st.groups[st.rank].some(c=>c.name===name))return 'offered';
    if(st.rank>=2){eventSkipGroupV2();continue;}
    return 'other-forced';
  }
  return 'gave-up';
}
function pickOffer(name){const st=EVT_V2_STATE,g=st.groups[st.rank],i=g.findIndex(c=>c.name===name);eventPickV2(i);}
function pickChoiceLabel(s){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing');const i=pc.candidates.findIndex(x=>String(x.label||'').includes(s));if(i<0)throw Error('candidate missing '+s);__choicePickV49(i);}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function replay(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a));}
function attackFaceDown(defName,graveNames){
  fresh();
  const atk=mk('ジェネティック・ワーウルフ'),def=mk(defName,1,'down','def');def.setTurn=gameState.turn-1;
  gameState.players[0].mz=[atk];gameState.players[1].mz=[def];gameState.players[1].grave=(graveNames||[]).map(n=>mk(n,1));
  baselineA();
  requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});
  return {atk,def};
}
`;

harness(COMMON+String.raw`
/* ===== optional trap: 奈落の落とし穴 ===== */
fresh();
let small=mk('レスキューラビット'),bot=mk('奈落の落とし穴',1,'down');bot.setTurn=gameState.turn-1;
gameState.players[0].hand=[small];gameState.players[1].sz=[bot];baselineA();
doNormalSummon(0,'atk');
let r=reach('奈落の落とし穴');
ok('奈落 is not offered for a Normal Summon of a monster with less than 1500 ATK',r==='idle'&&!offeredNames().includes('奈落の落とし穴'),r+' '+JSON.stringify(offeredNames()));
ok('no refused pick and the summon window closes normally',!TOASTS.some(t=>/1500以上/.test(t))&&zoneOf(small)==='mz'&&zoneOf(bot)==='sz');
replay('奈落 not offered');

fresh();
let big=mk('ジェネティック・ワーウルフ');bot=mk('奈落の落とし穴',1,'down');bot.setTurn=gameState.turn-1;
gameState.players[0].hand=[big];gameState.players[1].sz=[bot];baselineA();
doNormalSummon(0,'atk');
r=reach('奈落の落とし穴');
ok('奈落 is still offered for a 2000-ATK Normal Summon',r==='offered');
pickOffer('奈落の落とし穴');drive();
ok('奈落 activates and banishes the summoned monster',zoneOf(big)==='banish'&&zoneOf(bot)==='grave',JSON.stringify({big:zoneOf(big),bot:zoneOf(bot)}));
replay('奈落 offered and resolved');

/* ===== forced flip with no legal target: 聖なる魔術師 ===== */
let f=attackFaceDown('聖なる魔術師',[]);
r=reach('聖なる魔術師');
ok('forced 聖なる魔術師 flip is not offered when its GY has no Spell',r==='idle'&&!offeredNames().includes('聖なる魔術師'),r+' '+JSON.stringify(offeredNames()));
ok('the battle finished: the flipped monster was destroyed and no forced group is left open',zoneOf(f.def)==='grave'&&!EVT_V2_STATE);
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'main2'});drive();
ok('the turn advances to Main Phase 2 (no stall)',gameState.phase==='main2',gameState.phase);
replay('聖なる魔術師 without target');

/* ===== positive control: same flip with a Spell in the GY ===== */
f=attackFaceDown('聖なる魔術師',['サイクロン']);
r=reach('聖なる魔術師');
ok('forced 聖なる魔術師 flip is offered when a Spell is in its GY',r==='offered',r+' zone='+zoneOf(f.def)+' evt='+JSON.stringify(EVT_V2_STATE&&{eventName:EVT_V2_STATE.eventName,rank:EVT_V2_STATE.rank}));
pickOffer('聖なる魔術師');
ok('its target choice lists the Spell in the GY',!!pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).candidates.some(x=>String(x.label).includes('サイクロン')));
pickChoiceLabel('サイクロン');drive();
ok('聖なる魔術師 adds the Spell to its controller hand',gameState.players[1].hand.some(c=>cardName(c)==='サイクロン')&&!gameState.players[1].grave.some(c=>cardName(c)==='サイクロン'));
ok('the battle then finishes: 聖なる魔術師 is destroyed and no event is left open',zoneOf(f.def)==='grave'&&!EVT_V2_STATE,zoneOf(f.def));
replay('聖なる魔術師 with target');

/* ===== forced flip with an attribute condition: 闇霊使いダルク ===== */
f=attackFaceDown('闇霊使いダルク',[]);
r=reach('闇霊使いダルク');
ok('forced 闇霊使いダルク flip is not offered when the opponent controls no DARK monster',r==='idle'&&!offeredNames().includes('闇霊使いダルク'),r+' '+JSON.stringify(offeredNames()));
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'main2'});drive();
ok('the turn advances after 闇霊使いダルク is destroyed (no stall)',gameState.phase==='main2'&&zoneOf(f.def)==='grave',gameState.phase);
replay('闇霊使いダルク without target');
`);
