/* S03-VS1 vertical slice #1: provisional Dragunity list (P1) vs the 1103兎ラギア sample (P2), real game path.
   Not a user deck and not legality-checked; decks are loaded in a fixed order (no shuffle) so the path is reproducible.
   Every card named in this file is TESTED or GENERIC_OK (the 兎ラギア list is built at runtime and only its arranged top cards are named).
   The path exercises the Requirements this slice found and the units closed:
     U10 card activation vs effect (竜の渓谷), U09 offer legality (奈落 not offered for 300 ATK, offered for 1900 ATK),
     U08 journaled flags (レスキューラビット end-destroy marks → Replay), plus S03-U02/U03 ヴァジュランダ and SaveLoad/VM2. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function drive(){for(let i=0;i<300;i++){
  /* a pending choice is answered first: a SEGOC group stays open until the picked trigger's choices are answered */
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function handIdx(p,name){const i=gameState.players[p].hand.findIndex(c=>nm(c)===name);if(i<0)throw Error(name+' not in hand of P'+(p+1));return i;}
function zoneIdx(p,zone,name){const i=(gameState.players[p][zone]||[]).findIndex(c=>c&&nm(c)===name);if(i<0)throw Error(name+' not in '+zone+' of P'+(p+1));return i;}
function pickChoice(match){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing');const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return (h&&nm(h.card)===match)||String(x.label||'').includes(match);});if(i<0)throw Error('candidate '+match+' missing in '+pc.title+': '+JSON.stringify(pc.candidates.map(x=>x.label)));__choicePickV49(i);}
/* answer the current SEGOC group: pick the named trigger if offered, otherwise skip an optional group */
function answerEvent(name){const st=EVT_V2_STATE;if(!st)return false;const g=st.groups[st.rank];const i=name?g.findIndex(c=>c.name===name):-1;if(i>=0){eventPickV2(i);return true;}if(st.rank>=2){eventSkipGroupV2();return false;}throw Error('forced group without '+name+': '+JSON.stringify(g.map(c=>c.name)));}
function offered(name){const st=EVT_V2_STATE;return !!st&&st.groups.flat().some(c=>c.name===name);}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function replayAudit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,200));}
`;
const P1_LIST=[['竜の渓谷',1],['ドラグニティ－ドゥクス',1],['ドラグニティ－ファランクス',1],['奈落の落とし穴',1],['調和の宝札',1],['ドラグニティ－レギオン',1],
 ['ドラグニティ－ドゥクス',2],['ドラグニティ－ファランクス',1],['ドラグニティ－レギオン',1],['ドラグニティ－ミリトゥム',2],['ドラグニティ－ブラックスピア',2],['ドラグニティ－アングス',2],
 ['異次元の女戦士',2],['エフェクト・ヴェーラー',2],['スノーマンイーター',2],['サイバー・ドラゴン',1],['ライオウ',1],['魔導戦士 ブレイカー',2],
 ['竜の渓谷',2],['調和の宝札',2],['サイクロン',1],['死者蘇生',1],['強欲で謙虚な壺',2],['奈落の落とし穴',1],['強制脱出装置',1],['ゴブリンドバーグ',2],['ドラグニティ－ミリトゥム',1],['スノーマンイーター',1]];
const P1_EX=[['ドラグニティナイト－ヴァジュランダ',2],['ドラグニティナイト－ガジャルグ',1],['ドラグニティナイト－バルーチャ',1]];
const RABBIT_FRONT=['レスキューラビット','セイバーザウルス','サイクロン','奈落の落とし穴','エフェクト・ヴェーラー','ジェネティック・ワーウルフ'];

const first=harness(COMMON+'const P1_LIST='+JSON.stringify(P1_LIST)+';const P1_EX='+JSON.stringify(P1_EX)+';const RABBIT_FRONT='+JSON.stringify(RABBIT_FRONT)+';'+String.raw`
function expand(list){const out=[];for(const [n,q] of list)for(let i=0;i<q;i++){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);out.push({id,face:'down',pos:'atk'});}return out;}
function arrangeRabbit(){const rab=buildTestDeck('rabbit');const rest=rab.main.map(c=>({id:c.id,face:'down',pos:'atk'}));const top=[];for(const n of RABBIT_FRONT){const i=rest.findIndex(c=>CARD_DB[c.id].n===n);top.push(rest.splice(i,1)[0]);}return {main:top.concat(rest),ex:rab.ex.map(c=>({id:c.id,face:'down',pos:'atk'}))};}
function setup(reverse){
  resetA();resetForTestDuel();gameState.rngInitialSeed=1395762661;gameState.rngState=1395762661;v41ResetActionJournal(gameState);/* S03-U151: fixed RNG seed (was Date.now()) */
  let a=expand(P1_LIST),r=arrangeRabbit(),b=r.main;if(reverse){a.reverse();b.reverse();}
  act({type:'LOAD_DECK',player:0,deck:a,ex:expand(P1_EX),source:'test',name:'Dragunity provisional (VS1)'});act({type:'DRAW',player:0,n:5,initial:true});
  act({type:'LOAD_DECK',player:1,deck:b,ex:r.ex,source:'opponentSample',name:RABBIT_LAGGIA_DECK.name});act({type:'DRAW',player:1,n:5,initial:true});
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=1;gameState.phase='draw';gameState.drawnThisTurn=false;
}
setup(false);if(!gameState.players[0].hand.some(c=>nm(c)==='竜の渓谷'))setup(true);
const P0=()=>gameState.players[0],P1=()=>gameState.players[1];
ok('setup: 40-card provisional list and the 兎ラギア sample, 5 cards each',P0().deck.length+P0().hand.length===40&&P0().hand.length===5&&P1().hand.length===5,JSON.stringify(P0().hand.map(nm)));

/* ===== T1 (P1) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});drive();phase('standby');phase('main1');
ok('T1: normal draw to 6, Main Phase 1',P0().hand.length===6&&gameState.phase==='main1');
duelActivateFromHand(handIdx(0,'竜の渓谷'));
ok('T1 竜の渓谷: activating the card opens no effect choice (U10)',!pendingChoiceV49(gameState)&&gameState.chain.length===1&&gameState.chain[0].cardActivationOnly===true);
drive();
ok('T1 竜の渓谷: face-up in the Field Zone, nothing discarded yet',P0().field&&nm(P0().field)==='竜の渓谷'&&P0().grave.length===0);
duelActivateFromZone(0,'field',0);pickChoice('ドラグニティを手札へ');pickChoice('ドラグニティ－ファランクス');drive();pickChoice('ドラグニティ－ドゥクス');drive();
ok('T1 竜の渓谷 effect: discards ファランクス and adds ドゥクス',P0().grave.some(c=>nm(c)==='ドラグニティ－ファランクス')&&P0().hand.filter(c=>nm(c)==='ドラグニティ－ドゥクス').length===2);
doNormalSummon(handIdx(0,'ドラグニティ－ドゥクス'),'atk');
for(let k=0;k<6;k++){const r=drive();if(r==='evt'){answerEvent('ドラグニティ－ドゥクス');continue;}if(r==='choice'){pickChoice('ドラグニティ－ファランクス');continue;}break;}
ok('T1 ドゥクス: Normal Summoned and equips ファランクス from the GY',zoneIdx(0,'mz','ドラグニティ－ドゥクス')>=0&&P0().sz.some(c=>nm(c)==='ドラグニティ－ファランクス'&&c.equipTo));
duelActivateFromZone(0,'sz',zoneIdx(0,'sz','ドラグニティ－ファランクス'));drive();
ok('T1 ファランクス: Special Summons itself',P0().mz.some(c=>nm(c)==='ドラグニティ－ファランクス'));
const vajIdx=P0().ex.findIndex(c=>nm(c)==='ドラグニティナイト－ヴァジュランダ');
const combos=exCombos(0,dbOf(P0().ex[vajIdx])).combos;
doExSummon(0,vajIdx,combos[0].materials,'synchro','atk');
for(let k=0;k<6;k++){const r=drive();if(r==='evt'){answerEvent('ドラグニティナイト－ヴァジュランダ');continue;}if(r==='choice'){pickChoice('ドラグニティ－ファランクス');continue;}break;}
const vaj=()=>P0().mz.find(c=>nm(c)==='ドラグニティナイト－ヴァジュランダ');
ok('T1 ヴァジュランダ: Synchro Summoned and equips ファランクス (ATK 1900)',!!vaj()&&curATK(vaj())===1900&&P0().sz.some(c=>nm(c)==='ドラグニティ－ファランクス'&&c.equipTo));
doSetST(handIdx(0,'奈落の落とし穴'),false);drive();
ok('T1: 奈落の落とし穴 set',P0().sz.some(c=>nm(c)==='奈落の落とし穴'&&c.face==='down'));
phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();
ok('T1 → T2: P2 turn, draw phase',gameState.turn===2&&gameState.activePlayer===1&&gameState.phase==='draw');

/* ===== T2 (P2) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});drive();phase('standby');phase('main1');
doNormalSummon(handIdx(1,'レスキューラビット'),'atk');
ok('T2: P1\'s set 奈落 is not offered for the 300-ATK Normal Summon (U09)',!offered('奈落の落とし穴'));
for(let k=0;k<4&&drive()==='evt';k++)answerEvent(null);
duelActivateFromZone(1,'mz',zoneIdx(1,'mz','レスキューラビット'));
let bottomlessOffered=false;
for(let k=0;k<10;k++){const r=drive();
  if(r==='choice'){pickChoice('セイバーザウルス');continue;}
  if(r==='evt'){if(offered('奈落の落とし穴'))bottomlessOffered=true;answerEvent('奈落の落とし穴');continue;}
  break;}
ok('T2 レスキューラビット: banished as cost; two セイバーザウルス were Special Summoned and P1\'s 奈落 was offered (1900 ATK)',P1().banish.some(c=>nm(c)==='レスキューラビット')&&bottomlessOffered);
ok('T2 奈落: both セイバーザウルス are banished',P1().banish.filter(c=>nm(c)==='セイバーザウルス').length===2&&!P1().mz.some(c=>nm(c)==='セイバーザウルス'));
phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();

/* ===== T3 (P1) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});drive();phase('standby');phase('main1');
duelActivateFromZone(0,'mz',zoneIdx(0,'mz','ドラグニティナイト－ヴァジュランダ'));
for(let k=0;k<4;k++){const r=drive();if(r==='choice'){pickChoice('ドラグニティ－ファランクス');continue;}break;}
ok('T3 ヴァジュランダ: sends the equip as cost and doubles to 3800',curATK(vaj())===3800,curATK(vaj()));
phase('battle');
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:zoneIdx(0,'mz','ドラグニティナイト－ヴァジュランダ'),target:'direct'});drive();
ok('T3: direct attack takes P2 to 4200',P1().lp===4200,P1().lp);
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
  const vaj=()=>gameState.players[0].mz.find(c=>nm(c)==='ドラグニティナイト－ヴァジュランダ');
  ok('VM2: ヴァジュランダ is still 3800 before the End Phase',!!vaj()&&curATK(vaj())===3800);
  phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();
  ok('VM2: turn 4 begins for P2 and ヴァジュランダ is back to 1900',gameState.turn===4&&gameState.activePlayer===1&&curATK(vaj())===1900,JSON.stringify({turn:gameState.turn,atk:vaj()&&curATK(vaj())}));
  requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});drive();
  replayAudit('VM2 continuation');
  `);
}else{console.log('FAIL VM1 did not reach the save point');process.exitCode=2;}
