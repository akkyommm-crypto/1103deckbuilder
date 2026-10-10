/* S03-VS5 vertical slice #5: a provisional beatdown list (the TESTED / GENERIC_OK core of the confirmed 1103完走テスト deck plus
   ハイドロゲドン, ロケット戦士, 電磁ミノ虫) vs the 1103兎ラギア sample, real game path.
   It exercises the units since VS4 in one game:
   - U20: ロケット戦士's damage text in its own Battle Phase;
   - U21: Replay audits over battles with damage-step context;
   - U22: ロケット戦士 ② lowers its attack target after damage calculation;
   - U23: 電磁ミノ虫 ② and ハイドロゲドン trigger after the destroyed monster is sent to the GY.
   Not a user deck and not legality-checked. Decks are loaded in a fixed order: the arranged top cards come first, so the path is reproducible.
   Checklist: every card named in this file is TESTED or GENERIC_OK (the 兎ラギア list is built at runtime; only its arranged top cards are named).
   T1: set 電磁ミノ虫. T2: セイバーザウルス attacks it → 電磁ミノ虫 ② → 1400/0.
   T3: ハイドロゲドン destroys セイバーザウルス → Special Summons ハイドロゲドン → direct attack.
   T4: ジェネティック・ワーウルフ destroys ハイドロゲドン.
   T5: ロケット戦士 attacks the wolf (not destroyed, no damage, wolf 1500) → ハイドロゲドン destroys the wolf → third ハイドロゲドン → direct attack; save.
   VM2 T6: セイバーザウルス destroys ロケット戦士 in P2's Battle Phase (①only in P1's own Battle Phase). */
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
let SEEN=[];
function settle(){for(let k=0;k<24;k++){const r=drive();if(r==='evt'){EVT_V2_STATE.groups.flat().forEach(c=>SEEN.push(c.name));const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank];if(g&&g.length)eventPickV2(0);else eventSkipGroupV2();continue;}if(r==='choice'){__choicePickV49(0);continue;}return r;}return 'loop';}
function handIdx(p,name){const i=gameState.players[p].hand.findIndex(c=>nm(c)===name);if(i<0)throw Error(name+' not in hand of P'+(p+1)+': '+JSON.stringify(gameState.players[p].hand.map(nm)));return i;}
function mzIdxOf(p,card){const i=gameState.players[p].mz.indexOf(card);if(i<0)throw Error(nm(card)+' not in mz of P'+(p+1));return i;}
function mzAll(p,name){return gameState.players[p].mz.filter(c=>nm(c)===name);}
function mzNames(p){return gameState.players[p].mz.map(c=>nm(c)+':'+curATK(c)+'/'+curDEF(c));}
function names(p,zone){return (gameState.players[p][zone]||[]).map(nm);}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});settle();}
function nextTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});settle();}
function attack(p,card,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:mzIdxOf(p,card),target:target==='direct'?'direct':mzIdxOf(1-p,target)});settle();}
function replayAudit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));}
`;
/* opening 5, then the T1 / T3 / T5 draws. ハイドロゲドン is drawn at T3 so that two copies stay in the Deck for its two Special Summons
   (first draft: the T3 draw took a copy and the T5 trigger correctly had no 「ハイドロゲドン」 left in the Deck). */
const P1_FRONT=['電磁ミノ虫','ロケット戦士','ダッシュ・ウォリアー','セイバーザウルス','ファイターズ・エイプ','ジェネティック・ワーウルフ','ハイドロゲドン','ダーク・グレファー'];
const P1_LIST=[['ハイドロゲドン',3],['ロケット戦士',2],['電磁ミノ虫',1],['ダッシュ・ウォリアー',2],['マジック・ストライカー',1],['ファイターズ・エイプ',3],
 ['E・HERO エアーマン',1],['ダーク・グレファー',2],['サイバー・ドラゴン',2],['クリッター',1],['オネスト',1],['セイバーザウルス',3],['ジェネティック・ワーウルフ',3],['エフェクト・ヴェーラー',2],
 ['死者蘇生',1],['ハリケーン',1],['強欲で謙虚な壺',2],['サイクロン',2],['増援',1],['天使の施し',1],
 ['奈落の落とし穴',2],['強制脱出装置',1],['昇天の角笛',1],['マジック・ジャマー',1]];
const RABBIT_FRONT=['セイバーザウルス','ジェネティック・ワーウルフ','セイバーザウルス','エフェクト・ヴェーラー','サイクロン','レスキューラビット','ライオウ','死者蘇生'];

const first=harness(COMMON+'const P1_FRONT='+JSON.stringify(P1_FRONT)+';const P1_LIST='+JSON.stringify(P1_LIST)+';const RABBIT_FRONT='+JSON.stringify(RABBIT_FRONT)+';'+String.raw`
function arranged(list,front){const rest=[];for(const [n,q] of list)for(let i=0;i<q;i++){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);rest.push({id,face:'down',pos:'atk'});}
  const top=[];for(const n of front){const i=rest.findIndex(c=>CARD_DB[c.id].n===n);if(i<0)throw Error('front card not in list '+n);top.push(rest.splice(i,1)[0]);}return top.concat(rest);}
function arrangeRabbit(){const rab=buildTestDeck('rabbit');const rest=rab.main.map(c=>({id:c.id,face:'down',pos:'atk'}));const top=[];for(const n of RABBIT_FRONT){const i=rest.findIndex(c=>CARD_DB[c.id].n===n);if(i<0)throw Error('rabbit front card missing '+n);top.push(rest.splice(i,1)[0]);}return {main:top.concat(rest),ex:rab.ex.map(c=>({id:c.id,face:'down',pos:'atk'}))};}
resetA();resetForTestDuel();
/* S03-U150: fixed duel RNG seed. The seed came from Date.now(): the Deck shuffle after T3's Special Summon from the Deck made the
   T5 draw take the last ハイドロゲドン about 1 run in 29, and the T5 trigger then (correctly) had none to summon — U150's first gate
   run failed that way. The journal is reset so the Replay audit starts from the seeded state. */
gameState.rngInitialSeed=0x5331a5e5;gameState.rngState=0x5331a5e5;v41ResetActionJournal(gameState);
const a=arranged(P1_LIST,P1_FRONT),r=arrangeRabbit();
act({type:'LOAD_DECK',player:0,deck:a,ex:[],source:'test',name:'beatdown provisional (VS5)'});act({type:'DRAW',player:0,n:5,initial:true});
act({type:'LOAD_DECK',player:1,deck:r.main,ex:r.ex,source:'opponentSample',name:RABBIT_LAGGIA_DECK.name});act({type:'DRAW',player:1,n:5,initial:true});
gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=1;gameState.phase='draw';gameState.drawnThisTurn=false;
const P0=()=>gameState.players[0],P1=()=>gameState.players[1];
ok('setup: 40-card list and the 兎ラギア sample; arranged opening hands',P0().deck.length+P0().hand.length===40&&P0().hand.length===5&&P1().hand.length===5,JSON.stringify({total:P0().deck.length+P0().hand.length,h0:P0().hand.map(nm),h1:P1().hand.map(nm)}));

/* ===== T1 (P1) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});settle();phase('standby');phase('main1');
const mino=P0().hand[handIdx(0,'電磁ミノ虫')];
doSetMonster(handIdx(0,'電磁ミノ虫'));settle();
ok('T1: 電磁ミノ虫 is set in face-down Defense Position',zoneOf(mino)==='mz'&&mino.face==='down'&&mino.pos==='def',JSON.stringify({zone:zoneOf(mino),face:mino.face,pos:mino.pos,toasts:TOASTS.slice(-2)}));
nextTurn();
ok('T1 → T2: P2 turn',gameState.turn===2&&gameState.activePlayer===1);

/* ===== T2 (P2) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});settle();phase('standby');phase('main1');
const saber1=P1().hand[handIdx(1,'セイバーザウルス')];
doNormalSummon(handIdx(1,'セイバーザウルス'),'atk');settle();
phase('battle');SEEN=[];
attack(1,saber1,mino);
ok('T2: セイバーザウルス attacks the set 電磁ミノ虫: it is flipped and destroyed; its ② (battle destruction) lowers セイバーザウルス to 1400 / 0 (U23)',
  zoneOf(mino)==='grave'&&SEEN.includes('電磁ミノ虫')&&curATK(saber1)===1400&&curDEF(saber1)===0&&P0().lp===8000,
  JSON.stringify({mino:zoneOf(mino),saber:curATK(saber1)+'/'+curDEF(saber1),lp:P0().lp,seen:SEEN,toasts:TOASTS.slice(-2)}));
nextTurn();

/* ===== T3 (P1) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});settle();phase('standby');phase('main1');
const hydro1=P0().hand[handIdx(0,'ハイドロゲドン')];
doNormalSummon(handIdx(0,'ハイドロゲドン'),'atk');settle();
phase('battle');SEEN=[];
attack(0,hydro1,saber1);
const hydroT3=mzAll(0,'ハイドロゲドン');
ok('T3: ハイドロゲドン destroys セイバーザウルス (1600 vs 1400) and sends it to the GY: its trigger Special Summons ハイドロゲドン from the Deck (U23)',
  zoneOf(saber1)==='grave'&&SEEN.includes('ハイドロゲドン')&&hydroT3.length===2&&P1().lp===7800,
  JSON.stringify({mz:mzNames(0),lp:P1().lp,seen:SEEN}));
const hydro2=hydroT3.find(c=>c!==hydro1);
attack(0,hydro2,'direct');
ok('T3: the Special Summoned ハイドロゲドン attacks directly for 1600',P1().lp===6200,JSON.stringify({lp:P1().lp}));
nextTurn();

/* ===== T4 (P2) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});settle();phase('standby');phase('main1');
const wolf=P1().hand[handIdx(1,'ジェネティック・ワーウルフ')];
doNormalSummon(handIdx(1,'ジェネティック・ワーウルフ'),'atk');settle();
phase('battle');
attack(1,wolf,hydro1);
ok('T4: ジェネティック・ワーウルフ destroys ハイドロゲドン; P1 takes 400',zoneOf(hydro1)==='grave'&&P0().lp===7600,JSON.stringify({mz0:mzNames(0),lp:P0().lp}));
nextTurn();

/* ===== T5 (P1) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});settle();phase('standby');phase('main1');
const rocket=P0().hand[handIdx(0,'ロケット戦士')];
doNormalSummon(handIdx(0,'ロケット戦士'),'atk');settle();
phase('battle');SEEN=[];
attack(0,rocket,wolf);
ok('T5: ロケット戦士 attacks ジェネティック・ワーウルフ in P1’s Battle Phase: it is not destroyed and P1 takes no damage (U20); after damage calculation the wolf has 1500 ATK (U22)',
  zoneOf(rocket)==='mz'&&P0().lp===7600&&zoneOf(wolf)==='mz'&&curATK(wolf)===1500&&!TOASTS.some(t=>t.indexOf('ダメージ計算時以降は攻守を変更できません')>=0),
  JSON.stringify({rocket:zoneOf(rocket),wolf:curATK(wolf),lp:P0().lp,seen:SEEN,toasts:TOASTS.slice(-2)}));
SEEN=[];
attack(0,hydro2,wolf);
const hydroT5=mzAll(0,'ハイドロゲドン');
ok('T5: ハイドロゲドン destroys the weakened wolf (1600 vs 1500) and Special Summons another ハイドロゲドン (U23)',
  zoneOf(wolf)==='grave'&&hydroT5.length===2&&P1().lp===6100&&SEEN.includes('ハイドロゲドン'),JSON.stringify({mz:mzNames(0),lp:P1().lp,seen:SEEN}));
const hydro3=hydroT5.find(c=>c!==hydro2);
attack(0,hydro3,'direct');
ok('T5: the new ハイドロゲドン attacks directly for 1600',P1().lp===4500,JSON.stringify({lp:P1().lp}));
phase('main2');
replayAudit('VM1 T1–T5 real path');
saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);
`);

if(first.__RAW){
  harness('const RAW='+JSON.stringify(first.__RAW)+';'+COMMON+String.raw`
  resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const P0=()=>gameState.players[0],P1=()=>gameState.players[1];
  ok('VM2: the T5 Main Phase 2 save resumes',offerResumeDuel()&&gameState.turn===5&&gameState.phase==='main2'&&P1().lp===4500);
  nextTurn();
  ok('VM2: T6 begins for P2; the wolf’s ATK loss ended with T5 is irrelevant (it is in the GY)',gameState.turn===6&&gameState.activePlayer===1);
  requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});settle();phase('standby');phase('main1');
  const saber2=P1().hand[handIdx(1,'セイバーザウルス')];
  doNormalSummon(handIdx(1,'セイバーザウルス'),'atk');settle();
  phase('battle');
  const rocket=P0().mz.find(c=>nm(c)==='ロケット戦士');
  attack(1,saber2,rocket);
  ok('VM2 T6: セイバーザウルス attacks ロケット戦士 in P2’s Battle Phase: ① does not apply, so it is destroyed and P1 takes 400',
    zoneOf(rocket)==='grave'&&P0().lp===7200,JSON.stringify({rocket:zoneOf(rocket),lp:P0().lp}));
  nextTurn();
  ok('VM2: T7 begins for P1; the game continues',gameState.turn===7&&gameState.activePlayer===0);
  replayAudit('VM2 T6 continuation');
  `);
}else{console.log('FAIL VM1 did not reach the save point');process.exitCode=2;}
