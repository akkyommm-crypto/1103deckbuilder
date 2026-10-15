/* S03-VS2 vertical slice #2: provisional 真六武衆 list (P1) vs the 1103兎ラギア sample (P2), real game path.
   Not a user deck and not legality-checked; decks are loaded in a fixed order (no shuffle) so the path is reproducible.
   Checklist: every card named in this file is TESTED or GENERIC_OK (the 兎ラギア list is built at runtime; only its arranged top
   cards are named). The deck's Synchro line needs a 六武衆 Tuner that is not scripted yet, so this slice is the non-Synchro line.
   T1 search → Normal Summon → summon trigger Special Summon → hand Special Summon procedure → set trap;
   T2 opponent line with a Bottomless response; T3 three direct attacks; save; VM2 continuation. */
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
function handIdx(p,name){const i=gameState.players[p].hand.findIndex(c=>nm(c)===name);if(i<0)throw Error(name+' not in hand of P'+(p+1));return i;}
function zoneIdx(p,zone,name){const i=(gameState.players[p][zone]||[]).findIndex(c=>c&&nm(c)===name);if(i<0)throw Error(name+' not in '+zone+' of P'+(p+1));return i;}
function pickChoice(match){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing');const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return (h&&nm(h.card)===match)||String(x.label||'').includes(match);});if(i<0)throw Error('candidate '+match+' missing in '+pc.title+': '+JSON.stringify(pc.candidates.map(x=>x.label)));__choicePickV49(i);}
function answerEvent(name){const st=EVT_V2_STATE;if(!st)return false;const g=st.groups[st.rank];const i=name?g.findIndex(c=>c.name===name):-1;if(i>=0){eventPickV2(i);return true;}if(st.rank>=2){eventSkipGroupV2();return false;}throw Error('forced group without '+name+': '+JSON.stringify(g.map(c=>c.name)));}
function offered(name){const st=EVT_V2_STATE;return !!st&&st.groups.flat().some(c=>c.name===name);}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function mz(p,name){return gameState.players[p].mz.find(c=>nm(c)===name);}
function replayAudit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,200));}
`;
const P1_LIST=[['紫炎の狼煙',1],['真六武衆－キザン',1],['六武衆－ザンジ',1],['奈落の落とし穴',1],['サイクロン',1],['異次元の女戦士',1],
 ['真六武衆－カゲキ',3],['真六武衆－キザン',2],['六武衆－ザンジ',1],['真六武衆－ミズホ',2],['真六武衆－エニシ',2],['六武衆の露払い',2],['六武衆の師範',2],['紫炎の足軽',3],['六武衆－ヤイチ',1],['六武衆のご隠居',2],
 ['紫炎の狼煙',2],['紫炎の計略',1],['諸刃の活人剣術',1],['増援',1],['死者蘇生',1],['奈落の落とし穴',1],['強制脱出装置',1],['エフェクト・ヴェーラー',2],['異次元の女戦士',1],['ライオウ',2],['サイクロン',1]];
const RABBIT_FRONT=['レスキューラビット','セイバーザウルス','サイクロン','奈落の落とし穴','禁じられた聖槍','ジェネティック・ワーウルフ'];

const first=harness(COMMON+'const P1_LIST='+JSON.stringify(P1_LIST)+';const RABBIT_FRONT='+JSON.stringify(RABBIT_FRONT)+';'+String.raw`
function expand(list){const out=[];for(const [n,q] of list)for(let i=0;i<q;i++){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);out.push({id,face:'down',pos:'atk'});}return out;}
function arrangeRabbit(){const rab=buildTestDeck('rabbit');const rest=rab.main.map(c=>({id:c.id,face:'down',pos:'atk'}));const top=[];for(const n of RABBIT_FRONT){const i=rest.findIndex(c=>CARD_DB[c.id].n===n);if(i<0)throw Error('rabbit front card missing '+n);top.push(rest.splice(i,1)[0]);}return {main:top.concat(rest),ex:rab.ex.map(c=>({id:c.id,face:'down',pos:'atk'}))};}
function setup(reverse){
  resetA();resetForTestDuel();gameState.rngInitialSeed=1395762661;gameState.rngState=1395762661;v41ResetActionJournal(gameState);/* S03-U151: fixed RNG seed (was Date.now()) */
  let a=expand(P1_LIST),r=arrangeRabbit(),b=r.main;if(reverse){a.reverse();b.reverse();}
  act({type:'LOAD_DECK',player:0,deck:a,ex:[],source:'test',name:'真六武衆 provisional (VS2)'});act({type:'DRAW',player:0,n:5,initial:true});
  act({type:'LOAD_DECK',player:1,deck:b,ex:r.ex,source:'opponentSample',name:RABBIT_LAGGIA_DECK.name});act({type:'DRAW',player:1,n:5,initial:true});
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=1;gameState.phase='draw';gameState.drawnThisTurn=false;
}
setup(false);if(!gameState.players[0].hand.some(c=>nm(c)==='紫炎の狼煙'))setup(true);
const P0=()=>gameState.players[0],P1=()=>gameState.players[1];
ok('setup: 40-card provisional list and the 兎ラギア sample, 5 cards each',P0().deck.length+P0().hand.length===40&&P0().hand.length===5&&P1().hand.length===5,JSON.stringify({total:P0().deck.length+P0().hand.length,hand:P0().hand.map(nm)}));

/* ===== T1 (P1) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});drive();phase('standby');phase('main1');
ok('T1: normal draw to 6, Main Phase 1',P0().hand.length===6&&gameState.phase==='main1');
duelActivateFromHand(handIdx(0,'紫炎の狼煙'));
for(let k=0;k<6;k++){const r=drive();if(r==='choice'){pickChoice('真六武衆－カゲキ');continue;}break;}
ok('T1 紫炎の狼煙: adds 真六武衆－カゲキ and goes to the GY',P0().hand.some(c=>nm(c)==='真六武衆－カゲキ')&&P0().grave.some(c=>nm(c)==='紫炎の狼煙'));
doNormalSummon(handIdx(0,'真六武衆－カゲキ'),'atk');
let kagekiOffered=false;
for(let k=0;k<8;k++){const r=drive();if(r==='choice'){pickChoice('六武衆－ザンジ');continue;}if(r==='evt'){if(offered('真六武衆－カゲキ'))kagekiOffered=true;answerEvent('真六武衆－カゲキ');continue;}break;}
ok('T1 カゲキ: its summon trigger was offered and Special Summoned 六武衆－ザンジ from the hand',kagekiOffered&&!!mz(0,'真六武衆－カゲキ')&&!!mz(0,'六武衆－ザンジ'));
const procOk=getLegalHandActions(0,handIdx(0,'真六武衆－キザン')).some(a=>a.id==='specialSummonProcedure');
ok('T1 キザン: its hand Special Summon procedure is offered (another 六武衆 is on the field)',procOk);
runSummonProcedure('真六武衆－キザン',0,'hand',handIdx(0,'真六武衆－キザン'));
/* the procedure allows attack or defense position, so the UI shows a position sheet whose button calls finishSummonProcedure (the sheet is stubbed in tests) */
if(!mz(0,'真六武衆－キザン'))finishSummonProcedure('真六武衆－キザン',0,'hand',handIdx(0,'真六武衆－キザン'),'atk');
for(let k=0;k<6;k++){const r=drive();if(r==='choice'){const pc=pendingChoiceV49(gameState);const i=pc.candidates.findIndex(x=>/攻撃/.test(String(x.label||'')));__choicePickV49(i<0?0:i);continue;}if(r==='evt'){answerEvent(null);continue;}break;}
ok('T1 キザン: Special Summoned by its procedure',!!mz(0,'真六武衆－キザン'),JSON.stringify(P0().mz.map(nm)));
ok('T1 continuous boosts: カゲキ 1700 (another 六武衆), キザン 2100 (two other 六武衆), ザンジ 1800',!!mz(0,'真六武衆－キザン')&&curATK(mz(0,'真六武衆－カゲキ'))===1700&&curATK(mz(0,'真六武衆－キザン'))===2100&&curATK(mz(0,'六武衆－ザンジ'))===1800,JSON.stringify(P0().mz.map(c=>nm(c)+':'+curATK(c))));
doSetST(handIdx(0,'奈落の落とし穴'),false);drive();
phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();
ok('T1 → T2: P2 turn, draw phase',gameState.turn===2&&gameState.activePlayer===1&&gameState.phase==='draw');

/* ===== T2 (P2) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});drive();phase('standby');phase('main1');
doNormalSummon(handIdx(1,'レスキューラビット'),'atk');
ok('T2: P1\'s set 奈落 is not offered for the 300-ATK Normal Summon',!offered('奈落の落とし穴'));
for(let k=0;k<4&&drive()==='evt';k++)answerEvent(null);
duelActivateFromZone(1,'mz',zoneIdx(1,'mz','レスキューラビット'));
let bottomlessOffered=false;
for(let k=0;k<10;k++){const r=drive();
  if(r==='choice'){pickChoice('セイバーザウルス');continue;}
  if(r==='evt'){if(offered('奈落の落とし穴'))bottomlessOffered=true;answerEvent('奈落の落とし穴');continue;}
  break;}
ok('T2: P1\'s 奈落 is offered for the Special Summoned セイバーザウルス and banishes both',bottomlessOffered&&P1().banish.filter(c=>nm(c)==='セイバーザウルス').length===2&&P1().mz.length===0,JSON.stringify(P1().mz.map(nm)));
phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();

/* ===== T3 (P1) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});drive();phase('standby');phase('main1');phase('battle');
for(const name of ['真六武衆－カゲキ','六武衆－ザンジ','真六武衆－キザン']){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:zoneIdx(0,'mz',name),target:'direct'});drive();
}
ok('T3: three direct attacks (1700 + 1800 + 2100) take P2 to 2400',P1().lp===2400,P1().lp);
phase('main2');
ok('T3: Main Phase 2 reached',gameState.phase==='main2');
replayAudit('VM1 T1–T3 real path');
globalThis.__SAVE=JSON.stringify({state:gameState});globalThis.__DIG=v41StateDigest(gameState);
`);

if(first.__SAVE){
  harness('const SAVED='+JSON.stringify(first.__SAVE)+';const DIG='+JSON.stringify(first.__DIG)+';'+COMMON+String.raw`
  resetA();gameState=JSON.parse(SAVED).state;
  if(typeof v41EnsureReplayState==='function')v41EnsureReplayState(gameState);
  if(typeof v41SyncJournalToState==='function')v41SyncJournalToState(gameState);
  ok('VM2: saved T3 Main Phase 2 loads with a matching digest',v41StateDigest(gameState)===DIG);
  phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();
  ok('VM2: turn 4 begins for P2; the continuous boosts still apply',gameState.turn===4&&gameState.activePlayer===1&&curATK(mz(0,'真六武衆－カゲキ'))===1700&&curATK(mz(0,'真六武衆－キザン'))===2100,JSON.stringify(gameState.players[0].mz.map(c=>nm(c)+':'+curATK(c))));
  requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});drive();
  replayAudit('VM2 continuation');
  `);
}else{console.log('FAIL VM1 did not reach the save point');process.exitCode=2;}
