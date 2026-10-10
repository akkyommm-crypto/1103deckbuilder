/* S03-VS3 vertical slice #3: provisional 真六武衆 list with 六武の門 (P1) vs the 1103兎ラギア sample (P2), real game path.
   It exercises the three units since VS2 in one game:
   - U14: counters from summons, and 六武の門 / 六武衆の結束 effects;
   - U15: save and resume inside a summon-negation window;
   - U16: 昇天の角笛 activated from a set position.
   Not a user deck and not legality-checked. Decks are loaded in a fixed order: the arranged top cards come first, so the path is reproducible.
   Checklist: every card named in this file is TESTED or GENERIC_OK (the 兎ラギア list is built at runtime; only its arranged top cards are named).
   T1: 六武の門 / 六武衆の結束 card activations → Normal Summon カゲキ → trigger Special Summon ザンジ → キザン procedure (6 counters) → 六武の門 4-counter search → set 昇天の角笛.
   T2: P2 Normal Summons ライオウ; P1 passes the 昇天の角笛 window.
   T3: the キザン procedure waits in the window facing ライオウ; save.
   VM2: resume → ライオウ negates the procedure → direct attacks → 六武衆の結束 draw → T4 P2 Normal Summons セイバーザウルス → 昇天の角笛 negates it. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function settle(){for(let k=0;k<16;k++){const r=drive();if(r==='evt'){if(EVT_V2_STATE.rank>=2)eventSkipGroupV2();else eventPickV2(0);continue;}return r;}return 'loop';}
function labels(){const pc=pendingChoiceV49(gameState);return pc?pc.candidates.map(x=>String(x.label||'')):[];}
function pick(match){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing for '+match+' toasts='+JSON.stringify(TOASTS.slice(-3)));
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return String(x.value||'')===match||(h&&nm(h.card)===match)||String(x.label||'').includes(match);});
  if(i<0)throw Error('candidate '+match+' missing in '+pc.title+': '+JSON.stringify(labels()));__choicePickV49(i);}
function handIdx(p,name){const i=gameState.players[p].hand.findIndex(c=>nm(c)===name);if(i<0)throw Error(name+' not in hand of P'+(p+1)+': '+JSON.stringify(gameState.players[p].hand.map(nm)));return i;}
function zoneIdx(p,zone,name){const i=(gameState.players[p][zone]||[]).findIndex(c=>c&&nm(c)===name);if(i<0)throw Error(name+' not in '+zone+' of P'+(p+1));return i;}
function mz(p,name){return gameState.players[p].mz.find(c=>nm(c)===name);}
function mzNames(p){return gameState.players[p].mz.map(nm);}
function szCard(p,name){return gameState.players[p].sz.find(c=>nm(c)===name);}
function cnt(c){return (c&&c.counters&&c.counters['武士道'])||0;}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});settle();}
function nextTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});settle();}
function replayAudit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));}
`;
const P1_FRONT=['六武の門','真六武衆－カゲキ','六武衆－ザンジ','真六武衆－キザン','六武衆の結束','昇天の角笛'];
const P1_LIST=[['真六武衆－カゲキ',3],['六武衆－ザンジ',2],['真六武衆－キザン',3],['真六武衆－ミズホ',2],['真六武衆－エニシ',2],['六武衆の露払い',2],['六武衆の師範',2],['紫炎の足軽',3],['六武衆－ヤイチ',1],['六武衆のご隠居',2],
 ['紫炎の狼煙',3],['紫炎の計略',1],['六武の門',2],['六武衆の結束',1],['増援',1],['死者蘇生',1],['奈落の落とし穴',2],['強制脱出装置',1],['エフェクト・ヴェーラー',2],['昇天の角笛',1],['サイクロン',2],['ライオウ',1]];
const RABBIT_FRONT=['ライオウ','レスキューラビット','ジェネティック・ワーウルフ','サイクロン','奈落の落とし穴','エフェクト・ヴェーラー','セイバーザウルス'];

const first=harness(COMMON+'const P1_FRONT='+JSON.stringify(P1_FRONT)+';const P1_LIST='+JSON.stringify(P1_LIST)+';const RABBIT_FRONT='+JSON.stringify(RABBIT_FRONT)+';'+String.raw`
function arranged(list,front){const rest=[];for(const [n,q] of list)for(let i=0;i<q;i++){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);rest.push({id,face:'down',pos:'atk'});}
  const top=[];for(const n of front){const i=rest.findIndex(c=>CARD_DB[c.id].n===n);if(i<0)throw Error('front card not in list '+n);top.push(rest.splice(i,1)[0]);}return top.concat(rest);}
function arrangeRabbit(){const rab=buildTestDeck('rabbit');const rest=rab.main.map(c=>({id:c.id,face:'down',pos:'atk'}));const top=[];for(const n of RABBIT_FRONT){const i=rest.findIndex(c=>CARD_DB[c.id].n===n);top.push(rest.splice(i,1)[0]);}return {main:top.concat(rest),ex:rab.ex.map(c=>({id:c.id,face:'down',pos:'atk'}))};}
resetA();resetForTestDuel();gameState.rngInitialSeed=1395762661;gameState.rngState=1395762661;v41ResetActionJournal(gameState);/* S03-U151: fixed RNG seed (was Date.now()) */
const a=arranged(P1_LIST,P1_FRONT),r=arrangeRabbit();
act({type:'LOAD_DECK',player:0,deck:a,ex:[],source:'test',name:'真六武衆 + 六武の門 provisional (VS3)'});act({type:'DRAW',player:0,n:5,initial:true});
act({type:'LOAD_DECK',player:1,deck:r.main,ex:r.ex,source:'opponentSample',name:RABBIT_LAGGIA_DECK.name});act({type:'DRAW',player:1,n:5,initial:true});
gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=1;gameState.phase='draw';gameState.drawnThisTurn=false;
const P0=()=>gameState.players[0],P1=()=>gameState.players[1];
ok('setup: 40-card list and the 兎ラギア sample; arranged opening hands',P0().deck.length+P0().hand.length===40&&P0().hand.length===5&&P1().hand.length===5&&P1().hand.some(c=>nm(c)==='ライオウ'),JSON.stringify({total:P0().deck.length+P0().hand.length,h0:P0().hand.map(nm),h1:P1().hand.map(nm)}));

/* ===== T1 (P1) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});settle();phase('standby');phase('main1');
ok('T1: draw to 6 (六武の門 … 昇天の角笛), Main Phase 1',P0().hand.length===6&&gameState.phase==='main1'&&P0().hand.some(c=>nm(c)==='昇天の角笛'),JSON.stringify(P0().hand.map(nm)));
duelActivateFromHand(handIdx(0,'六武の門'));settle();
duelActivateFromHand(handIdx(0,'六武衆の結束'));settle();
const gate=szCard(0,'六武の門'),bond=szCard(0,'六武衆の結束');
ok('T1: 六武の門 and 六武衆の結束 are activated as cards and stay face-up with no counters',!!gate&&!!bond&&gate.face==='up'&&bond.face==='up'&&cnt(gate)===0,JSON.stringify(P0().sz.map(c=>nm(c)+':'+c.face)));
doNormalSummon(handIdx(0,'真六武衆－カゲキ'),'atk');
let kagekiOffered=false;
for(let k=0;k<10;k++){const r=drive();if(r==='choice'){pick('六武衆－ザンジ');continue;}if(r==='evt'){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank];const i=g.findIndex(c=>c.name==='真六武衆－カゲキ');if(i>=0){kagekiOffered=true;eventPickV2(i);}else if(EVT_V2_STATE.rank>=2)eventSkipGroupV2();else eventPickV2(0);continue;}break;}
ok('T1: Normal Summon カゲキ (2) and its trigger Special Summons ザンジ (2 more): 六武の門 4, 六武衆の結束 2',kagekiOffered&&!!mz(0,'六武衆－ザンジ')&&cnt(gate)===4&&cnt(bond)===2,JSON.stringify({mz:mzNames(0),gate:cnt(gate),bond:cnt(bond)}));
runSummonProcedure('真六武衆－キザン',0,'hand',handIdx(0,'真六武衆－キザン'));
if(!mz(0,'真六武衆－キザン')&&!gameState.pendingSummon)finishSummonProcedure('真六武衆－キザン',0,'hand',handIdx(0,'真六武衆－キザン'),'atk');
settle();
ok('T1: the キザン procedure (no opponent negator) summons immediately: 六武の門 6, 六武衆の結束 stays at 2',!!mz(0,'真六武衆－キザン')&&!gameState.pendingSummon&&cnt(gate)===6&&cnt(bond)===2,JSON.stringify({mz:mzNames(0),gate:cnt(gate),bond:cnt(bond),pending:gameState.pendingSummon}));
duelActivateFromZone(0,'sz',zoneIdx(0,'sz','六武の門'));
ok('T1: 六武の門 with 6 counters offers the 2- and 4-counter effects (no 紫炎 in the GY)',labels().length===2&&labels().some(l=>/2つ/.test(l))&&labels().some(l=>/4つ/.test(l)),JSON.stringify(labels()));
pick('m4');
let unitChoiceSeen=false;
for(let k=0;k<10;k++){const r=drive();
  if(r==='choice'){const pc=pendingChoiceV49(gameState);
    if(/取り除く武士道カウンター/.test(pc.title)){ /* counters on two cards: pay the 4 from 六武の門 itself, keep 六武衆の結束's for its draw */
      unitChoiceSeen=true;CHOICE_UI_SEL_V49=[];
      pc.candidates.map((x,i)=>[x,i]).filter(([x])=>String(x.label||'').startsWith('六武の門')).slice(0,4).forEach(([,i])=>{if(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).cid===pc.cid)__choicePickV49(i);});
      if(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).cid===pc.cid)__choiceCommitV49();
      continue;}
    pick('真六武衆－キザン');continue;}
  if(r==='evt'){if(EVT_V2_STATE.rank>=2)eventSkipGroupV2();else eventPickV2(0);continue;}break;}
ok('T1: with counters on two cards the player chooses which 4 to remove',unitChoiceSeen);
ok('T1: the 4-counter effect adds 真六武衆－キザン from the Deck; 六武の門 keeps 2',P0().hand.some(c=>nm(c)==='真六武衆－キザン')&&cnt(gate)===2,JSON.stringify({hand:P0().hand.map(nm),gate:cnt(gate)}));
doSetST(handIdx(0,'昇天の角笛'),false);settle();
nextTurn();
ok('T1 → T2: P2 turn',gameState.turn===2&&gameState.activePlayer===1);

/* ===== T2 (P2) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});settle();phase('standby');phase('main1');
doNormalSummon(handIdx(1,'ライオウ'),'atk');
const psT2=gameState.pendingSummon;
ok('T2: P2 Normal Summons ライオウ; the summon waits because P1 can activate the set 昇天の角笛',!!psT2&&summonNegatorsV2(psT2).some(x=>x.db.n==='昇天の角笛'),JSON.stringify({pending:psT2,toasts:TOASTS.slice(-3)}));
commitPendingSummonV2();settle();
ok('T2: P1 does not negate; ライオウ is summoned',!!mz(1,'ライオウ')&&!gameState.pendingSummon,JSON.stringify(mzNames(1)));
nextTurn();
ok('T2 → T3: P1 turn',gameState.turn===3&&gameState.activePlayer===0);

/* ===== T3 (P1) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});settle();phase('standby');phase('main1');
runSummonProcedure('真六武衆－キザン',0,'hand',handIdx(0,'真六武衆－キザン'));
if(!gameState.pendingSummon&&P0().hand.some(c=>nm(c)==='真六武衆－キザン'))finishSummonProcedure('真六武衆－キザン',0,'hand',handIdx(0,'真六武衆－キザン'),'atk');
const psT3=gameState.pendingSummon;
ok('T3: the second キザン procedure waits in the summon-negation window facing ライオウ',!!psT3&&psT3.kind==='procedure'&&summonNegatorsV2(psT3).some(x=>x.db.n==='ライオウ'),JSON.stringify(psT3));
replayAudit('VM1 T1–T3 real path');
saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);
`);

if(first.__RAW){
  harness('const RAW='+JSON.stringify(first.__RAW)+';'+COMMON+String.raw`
  resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const P0=()=>gameState.players[0],P1=()=>gameState.players[1];
  ok('VM2: the save taken inside the window resumes with the procedure still waiting and the window shown again',offerResumeDuel()&&!!gameState.pendingSummon&&reopenSummonWindowAfterLoadS03()==='sheet');
  const gate=szCard(0,'六武の門'),bond=szCard(0,'六武衆の結束');
  activateSummonNegatorV2(1,'mz',zoneIdx(1,'mz','ライオウ'));settle();
  ok('VM2 T3: ライオウ (sent to the GY as cost) negates the procedure: キザン goes to the GY; the counters do not change',
    P0().grave.some(c=>nm(c)==='真六武衆－キザン')&&P1().grave.some(c=>nm(c)==='ライオウ')&&!gameState.pendingSummon&&cnt(gate)===2&&cnt(bond)===2,
    JSON.stringify({g0:P0().grave.map(nm),g1:P1().grave.map(nm),gate:cnt(gate),bond:cnt(bond),pending:gameState.pendingSummon}));
  phase('battle');
  const lp0=P1().lp;
  for(const name of mzNames(0)){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:zoneIdx(0,'mz',name),target:'direct'});settle();}
  const expected=P0().mz.reduce((s,c)=>s+curATK(c),0);
  ok('VM2 T3: with P2 empty, P1 attacks directly with each monster',P1().lp===lp0-expected&&expected>0,JSON.stringify({lp0,lp:P1().lp,atk:P0().mz.map(c=>nm(c)+':'+curATK(c))}));
  phase('main2');
  const h0=P0().hand.length;
  duelActivateFromZone(0,'sz',zoneIdx(0,'sz','六武衆の結束'));settle();
  ok('VM2 T3: 六武衆の結束 (2 counters) is sent as cost and draws 2',P0().hand.length===h0+2&&P0().grave.some(c=>nm(c)==='六武衆の結束'),JSON.stringify({h0,hand:P0().hand.length}));
  nextTurn();
  ok('VM2: T4 begins for P2',gameState.turn===4&&gameState.activePlayer===1);
  requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});settle();phase('standby');phase('main1');
  doNormalSummon(handIdx(1,'セイバーザウルス'),'atk');
  ok('VM2 T4: the Normal Summon of セイバーザウルス waits for P1’s set 昇天の角笛',!!gameState.pendingSummon&&summonNegatorsV2(gameState.pendingSummon).some(x=>x.db.n==='昇天の角笛'));
  activateSummonNegatorV2(0,'sz',zoneIdx(0,'sz','昇天の角笛'));
  pick('六武衆－ザンジ');settle();
  ok('VM2 T4: 昇天の角笛 (tributing ザンジ) negates the summon; セイバーザウルス goes to the GY',
    P1().grave.some(c=>nm(c)==='セイバーザウルス')&&!mz(1,'セイバーザウルス')&&P0().grave.some(c=>nm(c)==='六武衆－ザンジ')&&P0().grave.some(c=>nm(c)==='昇天の角笛')&&!gameState.pendingSummon,
    JSON.stringify({mz1:mzNames(1),g0:P0().grave.map(nm),g1:P1().grave.map(nm),toasts:TOASTS.slice(-3)}));
  replayAudit('VM2 T3–T4 continuation');
  `);
}else{console.log('FAIL VM1 did not reach the save point');process.exitCode=2;}
