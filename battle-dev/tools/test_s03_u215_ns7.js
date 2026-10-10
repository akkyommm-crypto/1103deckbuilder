/* S03-U215: NOT_STARTED → TESTED — 華麗なる潜入工作員, 智天使ハーヴェスト, 氷結界の虎将 ガンターラ, 灼熱工の巨匠カエン, 摩天楼2－ヒーローシティ,
   インヴェルズ・ギラファ. Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[],OFFERED=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){[0,1].forEach(p=>(pointResponsesV27(p,w.payload||{})||[]).forEach(r=>OFFERED.push((r.db||{}).n)));pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function oppAttack(){gameState.activePlayer=1;gameState.phase='battle';}

/* ===== A: 華麗なる潜入工作員 — Normal Summoned: the opponent's set 激流葬 is not offered ===== */
fresh();
let sp=mk('華麗なる潜入工作員',0),gk=mk('激流葬',1,'down');gk.setTurn=4;gameState.players[0].hand=[sp];gameState.players[1].sz=[gk];baselineA();
TRIG.length=0;OFFERED.length=0;
doNormalSummon(0,'atk');drive();
ok('A: 激流葬 not offered; both stay',z(sp)==='mz'&&z(gk)==='sz'&&!TRIG.some(t=>/激流葬/.test(t))&&OFFERED.indexOf('激流葬')<0,JSON.stringify({TRIG,OFFERED}));
audit('A');

/* ===== B: 智天使ハーヴェスト — destroyed by battle: a Counter Trap from the GY to the hand ===== */
fresh();
let hv=mk('智天使ハーヴェスト',0,'up'),ct=mk('神の宣告',0),at=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[hv];gameState.players[0].grave=[ct];gameState.players[1].mz=[at];oppAttack();baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('B: 神の宣告 added to the hand',z(hv)==='grave'&&z(ct)==='hand');
audit('B');
fresh();
hv=mk('智天使ハーヴェスト',0,'up');let ns=mk('サイクロン',0);gameState.players[0].mz=[hv];gameState.players[0].grave=[ns];gameState.players[1].mz=[mk('青眼の白龍',1,'up')];oppAttack();baselineA();TRIG.length=0;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('B2: no Counter Trap in the GY — no activation',z(ns)==='grave'&&!TRIG.some(t=>/ハーヴェスト/.test(t)));

/* ===== C: 氷結界の虎将 ガンターラ — own End Phase: another 「氷結界」 monster from the GY ===== */
fresh();
let gt=mk('氷結界の虎将 ガンターラ',0,'up'),ib=mk('氷結界の修験者',0);gameState.players[0].mz=[gt];gameState.players[0].grave=[ib];gameState.phase='main2';baselineA();
phase('end');
ok('C: 氷結界の修験者 special summoned at the End Phase',z(ib)==='mz');
audit('C');
fresh();
gt=mk('氷結界の虎将 ガンターラ',0,'up');ib=mk('氷結界の修験者',0);gameState.players[0].mz=[gt];gameState.players[0].grave=[ib];baselineA();
ok('C2: not in the Main Phase',strictScriptLegalityV2('氷結界の虎将 ガンターラ',0,'mz',0,{}).ok===false);
fresh();
gt=mk('氷結界の虎将 ガンターラ',1,'up');ib=mk('氷結界の修験者',1);gameState.players[1].mz=[gt];gameState.players[1].grave=[ib];gameState.phase='main2';baselineA();
phase('end');
ok('C3: the opponent\'s End Phase — its ガンターラ does nothing',z(ib)==='grave');

/* ===== D: 灼熱工の巨匠カエン — banish it from the GY (cost): all own 「ラヴァル」 monsters +400 ===== */
fresh();
let ka=mk('灼熱工の巨匠カエン',0),l1=mk('ラヴァルのマグマ砲兵',0,'up'),l2=mk('ラヴァルの炎車回し',0,'up'),wt=mk('ワイト',0,'up');
gameState.players[0].grave=[ka];gameState.players[0].mz=[l1,l2,wt];baselineA();
const a1=curATK(C(l1)),a2=curATK(C(l2)),a3=curATK(C(wt));
duelActivateFromZone(0,'grave',0);drive();
ok('D: カエン banished; both 「ラヴァル」 +400; ワイト unchanged',z(ka)==='banish'&&curATK(C(l1))===a1+400&&curATK(C(l2))===a2+400&&curATK(C(wt))===a3);
audit('D');

/* ===== E: 摩天楼2－ヒーローシティ — an 「E・HERO」 destroyed by battle, from the GY ===== */
fresh();
let hc=mk('摩天楼2－ヒーローシティ',0,'up'),cl=mk('E・HERO クレイマン',0,'up');at=mk('青眼の白龍',1,'up');
gameState.players[0].field=hc;gameState.players[0].mz=[cl];gameState.players[1].mz=[at];oppAttack();baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
phase('main2');phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();phase('standby');phase('main1');
ok('E: turn passed to its controller; クレイマン in the GY (battle)',gameState.activePlayer===0&&z(cl)==='grave'&&C(cl).graveInfo&&C(cl).graveInfo.battle===true,JSON.stringify({ap:gameState.activePlayer,ph:gameState.phase,cl:z(cl)}));
duelActivateFromZone(0,'field',0);drive();
ok('E: クレイマン special summoned',z(cl)==='mz');
ok('E: once per turn',strictScriptLegalityV2('摩天楼2－ヒーローシティ',0,'field',0,{}).ok===false);
audit('E');
fresh();
hc=mk('摩天楼2－ヒーローシティ',0,'up');cl=mk('E・HERO クレイマン',0);let tr=mk('おろかな埋葬',0);gameState.players[0].field=hc;gameState.players[0].deck.unshift(cl);gameState.players[0].hand=[tr];baselineA();
PREFER=[cl.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('E2: an 「E・HERO」 sent by an effect — not a target',z(cl)==='grave'&&strictScriptLegalityV2('摩天楼2－ヒーローシティ',0,'field',0,{}).ok===false);

/* ===== F: インヴェルズ・ギラファ — Tribute Summon with 1 「インヴェルズ」: an opponent card to the GY, 1000 LP ===== */
fresh();
let gi=mk('インヴェルズ・ギラファ',0),iv=mk('インヴェルズの門番',0,'up'),os=mk('サイクロン',1,'down');
gameState.players[0].hand=[gi];gameState.players[0].mz=[iv];gameState.players[1].sz=[os];baselineA();
PREFER=[iv.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('F: Tribute Summoned with 1 「インヴェルズ」; サイクロン sent to the GY; 9000 LP',z(gi)==='mz'&&z(iv)==='grave'&&z(os)==='grave'&&gameState.players[0].lp===9000,JSON.stringify({gi:z(gi),os:z(os),lp:gameState.players[0].lp,TRIG}));
audit('F');
fresh();
gi=mk('インヴェルズ・ギラファ',0);gameState.players[0].hand=[gi];gameState.players[0].mz=[mk('ワイト',0,'up')];baselineA();
doNormalSummon(0,'atk');drive();
ok('F2: 1 non-「インヴェルズ」 — no Tribute Summon',z(gi)==='hand');
fresh();
gi=mk('インヴェルズ・ギラファ',0);let w1=mk('ワイト',0,'up'),w2=mk('ワイト',0,'up');os=mk('サイクロン',1,'down');
gameState.players[0].hand=[gi];gameState.players[0].mz=[w1,w2];gameState.players[1].sz=[os];baselineA();TRIG.length=0;
PREFER=[w1.uid,w2.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('F3: Tribute Summoned with 2 non-「インヴェルズ」 — no activation',z(gi)==='mz'&&z(os)==='sz'&&gameState.players[0].lp===8000);
`);
