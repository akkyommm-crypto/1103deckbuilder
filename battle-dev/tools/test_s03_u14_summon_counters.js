/* S03-U14 C-S03-11 SUMMON_COUNTER_PLACEMENT
   Requirement: 「『六武衆』モンスターが召喚・特殊召喚される度に、このカードに武士道カウンターを置く」 places the counters at summon
   success, without a chain, once per summon event (a simultaneous Special Summon is one event: R1103-SIXGATE-002), on every
   face-up applying card that declares it; the cards' own effects then pay those counters through restorable choices.
   Before the fix: no code placed 武士道 counters, so 六武の門 / 六武衆の結束 could never use their effects in a duel;
   紫炎の道場 was unscripted and 六武院 was ENGINE_GAP.
   Target cards (declared in data/s03_status_changes.json): 六武の門, 六武衆の結束, 紫炎の道場, 六武院.
   Every other card named here is TESTED or GENERIC_OK. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
const GATE='六武の門',BOND='六武衆の結束',DOJO='紫炎の道場',HALL='六武院';
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
let SEEN=[];
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE){EVT_V2_STATE.groups.flat().forEach(c=>SEEN.push(c.name));return 'evt';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function settle(){for(let k=0;k<12;k++){const r=drive();if(r==='evt'){if(EVT_V2_STATE.rank>=2)eventSkipGroupV2();else eventPickV2(0);continue;}return r;}return 'loop';}
function st(p,name){const c=mk(name,p);gameState.players[p].sz.push(c);return c;}
function cnt(c){return (c&&c.counters&&c.counters['武士道'])||0;}
function handIdx(p,name){const i=gameState.players[p].hand.findIndex(c=>nm(c)===name);if(i<0)throw Error(name+' not in hand');return i;}
function labels(){const pc=pendingChoiceV49(gameState);return pc?pc.candidates.map(x=>String(x.label||'')):[];}
function pick(match){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing for '+match);
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return String(x.value||'')===match||(h&&nm(h.card)===match)||String(x.label||'').includes(match);});
  if(i<0)throw Error('candidate '+match+' missing: '+JSON.stringify(labels()));__choicePickV49(i);}
function pickAll(){const pc=pendingChoiceV49(gameState);CHOICE_UI_SEL_V49=[];pc.candidates.forEach((x,i)=>{if(pendingChoiceV49(gameState))__choicePickV49(i);});if(pendingChoiceV49(gameState))__choiceCommitV49();}
function addCounters(zone,index,n){act({type:'COUNTER_ADD',player:0,zone,index,kind:'武士道',n});}
function queueSummon(uids){commitAutomaticActionV44({type:'EVENT_QUEUE_V31',item:{eventName:'onSpecialSummon',evt:{player:0,uids,kind:'effect'}}});}
function chainNames(){return (gameState.chain||[]).map(l=>l.name);}
function mzNames(p){return gameState.players[p].mz.map(nm);}
function replay(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));}
`;

const first=harness(COMMON+String.raw`
/* ===== A/B. real Normal Summon, then the summon trigger's Special Summon ===== */
fresh();
let gate=st(0,GATE),bond=st(0,BOND),dojo=st(0,DOJO);const hall=mk(HALL,0);gameState.players[0].field=hall;
gameState.players[0].hand=[mk('真六武衆－カゲキ'),mk('六武衆－ザンジ')];
gameState.players[1].mz=[mk('ヂェミナイ・エルフ',1)];
baselineA();SEEN=[];
doNormalSummon(handIdx(0,'真六武衆－カゲキ'),'atk');
const r1=drive();
ok('A: at the first stop after the Normal Summon (the カゲキ trigger window) the counters are already placed: 六武の門 2, 六武衆の結束 1, 紫炎の道場 1, 六武院 1',
  r1==='evt'&&cnt(gate)===2&&cnt(bond)===1&&cnt(dojo)===1&&cnt(hall)===1,JSON.stringify({r1,gate:cnt(gate),bond:cnt(bond),dojo:cnt(dojo),hall:cnt(hall)}));
ok('A: none of the counter cards is offered as a trigger and nothing is chained',
  !SEEN.some(n=>[GATE,BOND,DOJO,HALL].includes(n))&&!gameState.chain.length,JSON.stringify(SEEN));
if(r1==='evt'){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank];const i=g.findIndex(c=>c.name==='真六武衆－カゲキ');if(i>=0)eventPickV2(i);}
for(let k=0;k<8;k++){const r=drive();if(r==='choice'){pick('六武衆－ザンジ');continue;}if(r==='evt'){if(EVT_V2_STATE.rank>=2)eventSkipGroupV2();else eventPickV2(0);continue;}break;}
const zanji=gameState.players[0].mz.find(c=>nm(c)==='六武衆－ザンジ');
ok('B: the effect Special Summon of 六武衆－ザンジ adds 2 to 六武の門 (4); 六武衆の結束 stops at its maximum 2; 紫炎の道場 2; 六武院 2',
  !!zanji&&cnt(gate)===4&&cnt(bond)===2&&cnt(dojo)===2&&cnt(hall)===2,JSON.stringify({mz:mzNames(0),gate:cnt(gate),bond:cnt(bond),dojo:cnt(dojo),hall:cnt(hall)}));
ok('B: 六武院 lowers the opponent\'s face-up monster by 100 per counter (1900 → 1700), not its controller\'s monsters',
  curATK(gameState.players[1].mz[0])===1700&&!!zanji&&curATK(zanji)===1800,JSON.stringify({opp:curATK(gameState.players[1].mz[0]),zanji:zanji&&curATK(zanji)}));
ok('B: still no counter card was offered or chained',!SEEN.some(n=>[GATE,BOND,DOJO,HALL].includes(n))&&!chainNames().some(n=>[GATE,BOND,DOJO,HALL].includes(n)),JSON.stringify(SEEN));
replay('A/B real summon path');

/* ===== C. a 紫炎 (setcode 0x1000 but not 「六武衆」) Normal Summon adds nothing ===== */
fresh();gate=st(0,GATE);gameState.players[0].hand=[mk('紫炎の足軽')];baselineA();
doNormalSummon(0,'atk');settle();
ok('C: Normal Summon of 紫炎の足軽 places no counter',mzNames(0).includes('紫炎の足軽')&&cnt(gate)===0,JSON.stringify({mz:mzNames(0),gate:cnt(gate)}));

/* ===== D. the opponent's 「六武衆」 summon also counts ===== */
fresh();gate=st(0,GATE);gameState.activePlayer=1;gameState.players[1].hand=[mk('真六武衆－カゲキ',1)];baselineA();
doNormalSummon(0,'atk');settle();
ok('D: the opponent\'s Normal Summon of a 六武衆 places 2 on 六武の門',mzNames(1).includes('真六武衆－カゲキ')&&cnt(gate)===2,JSON.stringify({mz:mzNames(1),gate:cnt(gate)}));
replay('D opponent summon');

/* ===== E. a simultaneous summon is one event; every face-up declaring card gets its own counters ===== */
fresh();gate=st(0,GATE);const gate2=st(0,GATE);bond=st(0,BOND);
const a1=mk('六武衆－ザンジ'),a2=mk('真六武衆－カゲキ'),fd=mk('六武衆のご隠居',0,'down','def'),shien=mk('紫炎の足軽'),hidden=mk('六武衆－ザンジ',0,'down','def');
gameState.players[0].mz=[a1,a2,fd,shien,hidden];baselineA();
queueSummon([a1.uid,a2.uid,fd.uid,shien.uid]);
ok('E: one simultaneous Special Summon of two face-up 六武衆 (with a face-down 六武衆 and a 紫炎) places 2 on each face-up 六武の門 and 1 on 六武衆の結束 (R1103-SIXGATE-002/003)',
  cnt(gate)===2&&cnt(gate2)===2&&cnt(bond)===1,JSON.stringify({gate:cnt(gate),gate2:cnt(gate2),bond:cnt(bond)}));
ok('E: the placement belongs to the queued event Action: one summon event, no chain',
  !gameState.chain.length&&(gameState.deferredEvents||[]).filter(e=>e.eventName==='onSpecialSummon').length===1);
queueSummon([hidden.uid,shien.uid]);
ok('E: an event whose summoned monsters are only a face-down 六武衆 and a 紫炎 places nothing',cnt(gate)===2&&cnt(gate2)===2&&cnt(bond)===1,JSON.stringify({gate:cnt(gate),gate2:cnt(gate2),bond:cnt(bond)}));
replay('E simultaneous event');

/* ===== F. observer state: face-down, card activation on the chain ===== */
fresh();const setGate=mk(GATE,0,'down');gameState.players[0].sz=[setGate];const s1=mk('六武衆－ザンジ');gameState.players[0].mz=[s1];
gameState.players[0].hand=[mk(GATE)];baselineA();
queueSummon([s1.uid]);
ok('F: a face-down 六武の門 gets no counters',cnt(setGate)===0);
duelActivateFromHand(handIdx(0,GATE));
const liveGate=gameState.players[0].sz.find(c=>c!==setGate);
const onChain=gameState.chain.some(l=>l.name===GATE&&l.cardActivationOnly);
queueSummon([s1.uid]);
ok('F: while its card activation is still on the chain, 六武の門 gets no counters',onChain&&!!liveGate&&cnt(liveGate)===0,JSON.stringify({onChain,c:cnt(liveGate)}));
settle();
queueSummon([s1.uid]);
ok('F: after the activation resolves, the next 六武衆 summon places 2',cnt(liveGate)===2&&cnt(setGate)===0,JSON.stringify({live:cnt(liveGate),set:cnt(setGate)}));

/* ===== G. activation legality ===== */
fresh();gate=st(0,GATE);bond=st(0,BOND);gameState.players[0].mz=[mk('真六武衆－カゲキ')];baselineA();
ok('G: 六武の門 with no counters on the field cannot activate its effect',!strictScriptLegalityV2(GATE,0,'sz',0,{}).ok);
addCounters('sz',0,1);
ok('G: 1 counter is not enough',!strictScriptLegalityV2(GATE,0,'sz',0,{}).ok);
ok('G: 六武衆の結束 with no counter cannot activate',!strictScriptLegalityV2(BOND,0,'sz',1,{}).ok);
addCounters('sz',1,1);
ok('G: counters on another own card count for 六武の門 (1 + 1)',strictScriptLegalityV2(GATE,0,'sz',0,{}).ok,JSON.stringify(strictScriptLegalityV2(GATE,0,'sz',0,{})));
fresh();const hallUp=mk(HALL,0);gameState.players[0].field=hallUp;gameState.players[1].mz=[mk('ヂェミナイ・エルフ',1)];baselineA();
ok('G: a face-up 六武院 has no effect to activate',!strictScriptLegalityV2(HALL,0,'field',0,{}).ok);
fresh();const hallHand=mk(HALL,0);gameState.players[0].hand=[hallHand];baselineA();
const hallAct=strictScriptLegalityV2(HALL,0,'hand',0,{cardOverride:hallHand,logicalZone:'field',prospectiveIndex:0});
ok('G: 六武院 can still be activated from the hand (card activation only)',hallAct.ok&&hallAct.cardActivationOnly===true,JSON.stringify(hallAct));

/* ===== H. 六武の門 2 counters: target 1 face-up 六武衆/紫炎 effect monster, ATK +500 ===== */
fresh();gate=st(0,GATE);const kageki=mk('真六武衆－カゲキ');gameState.players[0].mz=[kageki];gameState.players[1].mz=[mk('ヂェミナイ・エルフ',1)];baselineA();
addCounters('sz',0,2);
const atk0=curATK(kageki);
duelActivateFromZone(0,'sz',0);
ok('H: 六武の門 with 2 counters opens a mode choice listing only the 2-counter effect',labels().length===1&&/2つ/.test(labels()[0]),JSON.stringify(labels()));
pick('m2');
ok('H: the 2 counters are paid before the target choice, which lists the 六武衆 effect monster and not the Normal Monster',
  cnt(gate)===0&&labels().length===1&&labels()[0].includes('カゲキ'),JSON.stringify({c:cnt(gate),labels:labels()}));
pick('真六武衆－カゲキ');
ok('H: the effect is chained with its mode',gameState.chain.some(l=>l.name===GATE&&l.v4EffectKey==='m2'),JSON.stringify(gameState.chain.map(l=>[l.name,l.v4EffectKey])));
settle();
ok('H: resolution raises カゲキ by 500 and 六武の門 stays face-up',curATK(kageki)===atk0+500&&gameState.players[0].sz[0]===gate&&!gameState.chain.length,JSON.stringify({atk0,now:curATK(kageki)}));
replay('H 2-counter effect');

/* ===== I. 4 counters under ライオウ: only the GY is searchable ===== */
fresh();gate=st(0,GATE);gameState.players[1].mz=[mk('ライオウ',1)];gameState.players[0].grave=[mk('六武衆－ザンジ')];gameState.players[0].deck=[mk('六武衆のご隠居',0,'down')];baselineA();
addCounters('sz',0,4);
duelActivateFromZone(0,'sz',0);
ok('I: with 4 counters and no boost target only the 4-counter effect is offered',labels().length===1&&/4つ/.test(labels()[0]),JSON.stringify(labels()));
pick('m4');
ok('I: 4 counters paid, no target choice, the effect is chained',cnt(gate)===0&&!pendingChoiceV49(gameState)&&chainNames().includes(GATE),JSON.stringify({c:cnt(gate),chain:chainNames()}));
const rI=drive();
ok('I: at resolution under ライオウ the only candidate is the GY 六武衆－ザンジ (the Deck 六武衆のご隠居 cannot be added)',rI==='choice'&&labels().length===1&&labels()[0].includes('ザンジ'),JSON.stringify({rI,labels:labels()}));
if(rI==='choice')pick('六武衆－ザンジ');settle();
ok('I: 六武衆－ザンジ is added to the hand from the GY',gameState.players[0].hand.some(c=>nm(c)==='六武衆－ザンジ')&&!gameState.players[0].grave.some(c=>nm(c)==='六武衆－ザンジ'));
replay('I 4-counter effect');

/* ===== J. 6 counters: Special Summon a 紫炎 effect monster from the GY (save at the mode choice) ===== */
fresh();gate=st(0,GATE);gameState.players[0].grave=[mk('紫炎の足軽'),mk('紫炎の影武者')];baselineA();
addCounters('sz',0,6);
duelActivateFromZone(0,'sz',0);
ok('J: with 6 counters and a 紫炎 effect monster in the GY only the 6-counter effect is offered',labels().length===1&&/6つ/.test(labels()[0]),JSON.stringify(labels()));
globalThis.__SAVE=JSON.stringify({state:gameState});globalThis.__DIG=v41StateDigest(gameState);
pick('m6');
ok('J: the target candidates are the 紫炎 effect monster only (紫炎の影武者 is a Normal Monster)',labels().length===1&&labels()[0].includes('紫炎の足軽'),JSON.stringify(labels()));
pick('紫炎の足軽');settle();
ok('J: 紫炎の足軽 is Special Summoned; it is not a 六武衆, so 六武の門 gets no new counter',mzNames(0).includes('紫炎の足軽')&&cnt(gate)===0,JSON.stringify({mz:mzNames(0),c:cnt(gate)}));
replay('J 6-counter effect');

/* ===== K. counters on two cards: the player chooses the units to remove ===== */
fresh();gate=st(0,GATE);bond=st(0,BOND);gameState.players[0].grave=[mk('真六武衆－シエン')];baselineA();
addCounters('sz',0,2);addCounters('sz',1,2);
duelActivateFromZone(0,'sz',0);pick('m4');
ok('K: with counters on 六武の門 and 六武衆の結束 the cost is a choice of 4 counter units',labels().length===4,JSON.stringify(labels()));
pickAll();
ok('K: both cards pay 2 and the effect is chained',cnt(gate)===0&&cnt(bond)===0&&chainNames().includes(GATE),JSON.stringify({g:cnt(gate),b:cnt(bond),chain:chainNames()}));
if(drive()==='choice')pick('真六武衆－シエン');settle();
ok('K: choosing the Synchro 真六武衆－シエン from the GY applies, and it returns to the Extra Deck instead of the hand (R1103-SHIEN-004)',
  (gameState.players[0].ex||[]).some(c=>nm(c)==='真六武衆－シエン')&&!gameState.players[0].hand.some(c=>nm(c)==='真六武衆－シエン')&&!gameState.players[0].grave.some(c=>nm(c)==='真六武衆－シエン'),
  JSON.stringify({ex:(gameState.players[0].ex||[]).map(nm),hand:gameState.players[0].hand.map(nm),grave:gameState.players[0].grave.map(nm)}));
replay('K spread cost');

/* ===== L. 六武衆の結束: self-send cost, draw the counters it had ===== */
fresh();bond=st(0,BOND);gameState.players[0].deck=[mk('ヂェミナイ・エルフ',0,'down'),mk('ヂェミナイ・エルフ',0,'down'),mk('ヂェミナイ・エルフ',0,'down')];baselineA();
addCounters('sz',0,2);
const h0=gameState.players[0].hand.length;
duelActivateFromZone(0,'sz',0);
ok('L: 六武衆の結束 is sent to the GY as the cost before the chain',gameState.players[0].grave.includes(bond)&&chainNames().includes(BOND),JSON.stringify({grave:gameState.players[0].grave.map(nm),chain:chainNames()}));
settle();
ok('L: resolution draws 2',gameState.players[0].hand.length===h0+2&&gameState.players[0].deck.length===1,JSON.stringify({hand:gameState.players[0].hand.length,deck:gameState.players[0].deck.length}));
replay('L 六武衆の結束');

/* ===== M. 紫炎の道場: self-send cost, Special Summon Level <= counters from the Deck ===== */
fresh();dojo=st(0,DOJO);
gameState.players[0].deck=[mk('六武衆－ザンジ',0,'down'),mk('真六武衆－カゲキ',0,'down'),mk('紫炎の足軽',0,'down'),mk('紫炎の影武者',0,'down'),mk('六武衆の侍従',0,'down')];baselineA();
addCounters('sz',0,3);
duelActivateFromZone(0,'sz',0);
ok('M: 紫炎の道場 is sent to the GY as the cost before the chain',gameState.players[0].grave.includes(dojo)&&chainNames().includes(DOJO),JSON.stringify({grave:gameState.players[0].grave.map(nm),chain:chainNames()}));
const rM=drive();
ok('M: the candidates are the Level 3 or lower 六武衆/紫炎 effect monsters: 真六武衆－カゲキ and 紫炎の足軽',
  rM==='choice'&&labels().length===2&&labels().some(l=>l.includes('カゲキ'))&&labels().some(l=>l.includes('紫炎の足軽')),JSON.stringify({rM,labels:labels()}));
if(rM==='choice')pick('真六武衆－カゲキ');settle();
ok('M: 真六武衆－カゲキ is Special Summoned from the Deck',mzNames(0).includes('真六武衆－カゲキ')&&gameState.players[0].deck.length===4,JSON.stringify({mz:mzNames(0),deck:gameState.players[0].deck.length}));
replay('M 紫炎の道場');
`);

if(first.__SAVE){
  harness('const SAVED='+JSON.stringify(first.__SAVE)+';const DIG='+JSON.stringify(first.__DIG)+';'+COMMON+String.raw`
  resetA();gameState=JSON.parse(SAVED).state;
  if(typeof v41EnsureReplayState==='function')v41EnsureReplayState(gameState);
  if(typeof v41SyncJournalToState==='function')v41SyncJournalToState(gameState);
  ok('VM2: the save taken at the 六武の門 mode choice loads with a matching digest and the choice pending',v41StateDigest(gameState)===DIG&&!!pendingChoiceV49(gameState));
  const gate=gameState.players[0].sz[0];
  pick('m6');pick('紫炎の足軽');settle();
  ok('VM2: the restored choice continues: 6 counters paid and 紫炎の足軽 Special Summoned',cnt(gate)===0&&mzNames(0).includes('紫炎の足軽'),JSON.stringify({c:cnt(gate),mz:mzNames(0)}));
  replay('VM2 continuation');
  `);
}else{console.log('FAIL VM1 did not reach the save point');process.exitCode=2;}
