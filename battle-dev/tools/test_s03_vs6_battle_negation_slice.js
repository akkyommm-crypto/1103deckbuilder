/* S03-VS6 vertical slice #6: a provisional beatdown list with battle effects (P1) vs the provisional 真六武衆 list of VS3 (P2), real game path.
   It exercises the units since VS5 in one game:
   - U24: 時の機械－タイム・マシーン (set trap) returns a monster destroyed by battle;
   - U25: 漆黒の魔王 LV4 negates the effect of the monster it destroys by battle (紫炎の足軽 summons nothing);
   - U26: 電動刃虫's end-of-damage-step effect applies after it destroys a monster.
   The 兎ラギア sample has no monster with a battle-destruction trigger, so P2 uses the VS3 真六武衆 list (紫炎の足軽).
   Not user decks and not legality-checked. Decks are loaded in a fixed order: the arranged top cards come first, so the path is reproducible.
   Checklist: every card named in this file is TESTED or GENERIC_OK.
   T1: 漆黒の魔王 LV4, set 時の機械. T2: 紫炎の足軽. T3: LV4 destroys 紫炎の足軽 → its trigger is negated (P1 declines 時の機械, which since S03-U27 is offered after the trigger effects).
   T4: 六武衆の露払い destroys LV4 → 時の機械 returns it. T5: 電動刃虫 destroys 六武衆の露払い → P2 draws 1; LV4 attacks directly; save.
   VM2: resume → T6. */
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
/* settle(take, decline): an event group containing a declined card is skipped (optional groups only); a named card is taken; otherwise the first. */
function settle(take,decline){take=take||[];decline=decline||[];for(let k=0;k<30;k++){const r=drive();if(r==='evt'){const st=EVT_V2_STATE;st.groups.flat().forEach(c=>SEEN.push(c.name));const g=st.groups[st.rank];
  if(!(g&&g.length)){eventSkipGroupV2();continue;}
  let i=g.findIndex(c=>take.includes(c.name));
  if(i<0&&st.rank>=2&&g.some(c=>decline.includes(c.name))){eventSkipGroupV2();continue;}
  eventPickV2(i<0?0:i);continue;}if(r==='choice'){__choicePickV49(0);continue;}return r;}return 'loop';}
function handIdx(p,name){const i=gameState.players[p].hand.findIndex(c=>nm(c)===name);if(i<0)throw Error(name+' not in hand of P'+(p+1)+': '+JSON.stringify(gameState.players[p].hand.map(nm)));return i;}
function mzIdxOf(p,card){const i=gameState.players[p].mz.indexOf(card);if(i<0)throw Error(nm(card)+' not in mz of P'+(p+1));return i;}
function mzNames(p){return gameState.players[p].mz.map(c=>nm(c)+':'+curATK(c));}
function names(p,zone){return (gameState.players[p][zone]||[]).map(nm);}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});settle();}
function nextTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});settle();}
function attack(p,card,target,take,decline){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:mzIdxOf(p,card),target:target==='direct'?'direct':mzIdxOf(1-p,target)});settle(take,decline);}
function chained(name){const pkg=v41ReplayPackage(gameState);return pkg.actions.map(x=>x&&x.action).some(x=>x&&x.type==='CHAIN_ADD'&&x.name===name);}
function replayAudit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));}
`;
/* P1: opening 5, then the T1 / T3 / T5 draws. P2: opening 5, then the T2 / T4 / T6 draws. */
const P1_FRONT=['漆黒の魔王 LV4','時の機械－タイム・マシーン','ファイターズ・エイプ','セイバーザウルス','ダーク・グレファー','クリッター','ジェネティック・ワーウルフ','電動刃虫'];
const P1_LIST=[['ハイドロゲドン',3],['漆黒の魔王 LV4',1],['電動刃虫',1],['電磁ミノ虫',1],['ダッシュ・ウォリアー',2],['マジック・ストライカー',1],['ファイターズ・エイプ',3],
 ['E・HERO エアーマン',1],['ダーク・グレファー',2],['サイバー・ドラゴン',2],['クリッター',1],['オネスト',1],['セイバーザウルス',3],['ジェネティック・ワーウルフ',3],['エフェクト・ヴェーラー',2],
 ['死者蘇生',1],['ハリケーン',1],['強欲で謙虚な壺',2],['サイクロン',2],['増援',1],['天使の施し',1],
 ['奈落の落とし穴',2],['強制脱出装置',1],['時の機械－タイム・マシーン',1],['マジック・ジャマー',1]];
const P2_FRONT=['紫炎の足軽','六武衆の露払い','真六武衆－カゲキ','紫炎の狼煙','増援','サイクロン','真六武衆－キザン','六武の門'];
const P2_LIST=[['真六武衆－カゲキ',3],['六武衆－ザンジ',2],['真六武衆－キザン',3],['真六武衆－ミズホ',2],['真六武衆－エニシ',2],['六武衆の露払い',2],['六武衆の師範',2],['紫炎の足軽',3],['六武衆－ヤイチ',1],['六武衆のご隠居',2],
 ['紫炎の狼煙',3],['紫炎の計略',1],['六武の門',2],['六武衆の結束',1],['増援',1],['死者蘇生',1],['奈落の落とし穴',2],['強制脱出装置',1],['エフェクト・ヴェーラー',2],['昇天の角笛',1],['サイクロン',2],['ライオウ',1]];

const first=harness(COMMON+'const P1_FRONT='+JSON.stringify(P1_FRONT)+';const P1_LIST='+JSON.stringify(P1_LIST)+';const P2_FRONT='+JSON.stringify(P2_FRONT)+';const P2_LIST='+JSON.stringify(P2_LIST)+';'+String.raw`
function arranged(list,front){const rest=[];for(const [n,q] of list)for(let i=0;i<q;i++){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);rest.push({id,face:'down',pos:'atk'});}
  const top=[];for(const n of front){const i=rest.findIndex(c=>CARD_DB[c.id].n===n);if(i<0)throw Error('front card not in list '+n);top.push(rest.splice(i,1)[0]);}return top.concat(rest);}
resetA();resetForTestDuel();gameState.rngInitialSeed=1395762661;gameState.rngState=1395762661;v41ResetActionJournal(gameState);/* S03-U151: fixed RNG seed (was Date.now()) */
const a=arranged(P1_LIST,P1_FRONT),b=arranged(P2_LIST,P2_FRONT);
act({type:'LOAD_DECK',player:0,deck:a,ex:[],source:'test',name:'battle effects provisional (VS6)'});act({type:'DRAW',player:0,n:5,initial:true});
act({type:'LOAD_DECK',player:1,deck:b,ex:[],source:'test',name:'真六武衆 provisional (VS3 list)'});act({type:'DRAW',player:1,n:5,initial:true});
gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=1;gameState.phase='draw';gameState.drawnThisTurn=false;
const P0=()=>gameState.players[0],P1=()=>gameState.players[1];
ok('setup: two 40-card lists; arranged opening hands',P0().deck.length+P0().hand.length===40&&P1().deck.length+P1().hand.length===40&&P0().hand.length===5&&P1().hand.length===5,JSON.stringify({h0:P0().hand.map(nm),h1:P1().hand.map(nm)}));

/* ===== T1 (P1) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});settle();phase('standby');phase('main1');
const lv4=P0().hand[handIdx(0,'漆黒の魔王 LV4')];
doNormalSummon(handIdx(0,'漆黒の魔王 LV4'),'atk');settle();
const tm=P0().hand[handIdx(0,'時の機械－タイム・マシーン')];
doSetST(handIdx(0,'時の機械－タイム・マシーン'),false);settle();
ok('T1: 漆黒の魔王 LV4 is summoned and 時の機械－タイム・マシーン is set',zoneOf(lv4)==='mz'&&zoneOf(tm)==='sz'&&tm.face==='down',JSON.stringify({mz:mzNames(0),sz:names(0,'sz')}));
nextTurn();

/* ===== T2 (P2) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});settle();phase('standby');phase('main1');
const foot=P1().hand[handIdx(1,'紫炎の足軽')];
doNormalSummon(handIdx(1,'紫炎の足軽'),'atk');settle();
ok('T2: P2 Normal Summons 紫炎の足軽',zoneOf(foot)==='mz',JSON.stringify(mzNames(1)));
nextTurn();

/* ===== T3 (P1) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});settle();phase('standby');phase('main1');phase('battle');
const deckPay=P1().deck.filter(c=>nm(c)==='六武衆の露払い').length;
SEEN=[];
attack(0,lv4,foot,['漆黒の魔王 LV4','紫炎の足軽'],['時の機械－タイム・マシーン']);   /* P1 keeps 時の機械 for T4 */
ok('T3: 漆黒の魔王 LV4 destroys 紫炎の足軽; its trigger is activated but negated, so P2 Special Summons nothing (U25)',
  zoneOf(foot)==='grave'&&chained('紫炎の足軽')&&P1().mz.length===0&&P1().deck.filter(c=>nm(c)==='六武衆の露払い').length===deckPay&&P1().lp===7700,
  JSON.stringify({mz1:mzNames(1),lp:P1().lp,seen:SEEN}));
nextTurn();

/* ===== T4 (P2) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});settle();phase('standby');phase('main1');
const pay=P1().hand[handIdx(1,'六武衆の露払い')];
doNormalSummon(handIdx(1,'六武衆の露払い'),'atk');settle();
phase('battle');SEEN=[];
attack(1,pay,lv4,['時の機械－タイム・マシーン'],[]);
ok('T4: 六武衆の露払い destroys 漆黒の魔王 LV4 (P1 takes 600); P1’s 時の機械－タイム・マシーン returns it in Attack Position (U24)',
  chained('時の機械－タイム・マシーン')&&zoneOf(lv4)==='mz'&&lv4.pos==='atk'&&zoneOf(tm)==='grave'&&P0().lp===7400,
  JSON.stringify({lv4:zoneOf(lv4),pos:lv4.pos,tm:zoneOf(tm),lp:P0().lp,seen:SEEN}));
nextTurn();

/* ===== T5 (P1) ===== */
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});settle();phase('standby');phase('main1');
const blade=P0().hand[handIdx(0,'電動刃虫')];
doNormalSummon(handIdx(0,'電動刃虫'),'atk');settle();
phase('battle');
const h1=P1().hand.length;SEEN=[];
attack(0,blade,pay);
ok('T5: 電動刃虫 destroys 六武衆の露払い; at the end of the damage step P2 draws 1 (U26)',
  zoneOf(pay)==='grave'&&SEEN.includes('電動刃虫')&&P1().hand.length===h1+1&&P1().lp===6900,
  JSON.stringify({hand1:P1().hand.length,h1,lp:P1().lp,seen:SEEN}));
attack(0,lv4,'direct');
ok('T5: 漆黒の魔王 LV4 attacks directly for 1000',P1().lp===5900,JSON.stringify({lp:P1().lp}));
phase('main2');
replayAudit('VM1 T1–T5 real path');
saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);
`);

if(first.__RAW){
  harness('const RAW='+JSON.stringify(first.__RAW)+';'+COMMON+String.raw`
  resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const P0=()=>gameState.players[0],P1=()=>gameState.players[1];
  ok('VM2: the T5 Main Phase 2 save resumes',offerResumeDuel()&&gameState.turn===5&&gameState.phase==='main2'&&P1().lp===5900);
  nextTurn();
  ok('VM2: T6 begins for P2; the game continues',gameState.turn===6&&gameState.activePlayer===1);
  replayAudit('VM2 continuation');
  `);
}else{console.log('FAIL VM1 did not reach the save point');process.exitCode=2;}
