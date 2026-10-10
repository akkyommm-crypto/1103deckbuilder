/* S03-U235: NOT_STARTED → TESTED — E・HERO アイスエッジ, ラヴァル・ガンナー, リチュア・ノエリア, 真六武衆－シナイ, 魔轟神獣ガナシア.
   Real DUEL paths (real discards, Normal Summons, attacks, the ミズホ release cost), Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;TRIG.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5335a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
let PREFER=[],ORDER=[],TRIG=[];
function step(){const q=pc();if(!q)return false;
  if(q.min>1&&q.min===q.max){const keys=[];ORDER.forEach(u=>{const c=q.candidates.find(x=>x.uid===u||x.key===u);if(c)keys.push(c.key);});q.candidates.forEach(c=>{if(keys.indexOf(c.key)<0)keys.push(c.key);});answerChoiceV49(keys.slice(0,q.min));return true;}
  let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function lp(p){return gameState.players[p].lp;}
function idx(c){return findCardByUid(c.uid).index;}
function legal(name,p,i){return strictScriptLegalityV2(name,p,'mz',i,{});}

/* ===== A: E・HERO アイスエッジ — Main Phase 1: discard 1 (cost) → direct attack this turn; direct battle damage → destroys 1 Set card.
          The discarded 魔轟神獣ガナシア (forced, from the GY): +200, banished when it leaves the field ===== */
fresh();
let ie=mk('E・HERO アイスエッジ',0,'up'),gs=mk('魔轟神獣ガナシア',0),x1=mk('ワイト',0),bw=mk('青眼の白龍',1,'up'),s1=mk('D2シールド',1,'down'),s2=mk('サイクロン',1,'down');
gameState.players[0].mz=[ie];gameState.players[0].hand=[gs,x1];gameState.players[1].mz=[bw];gameState.players[1].sz=[s1,s2];baselineA();
PREFER=[gs.uid];duelActivateFromZone(0,'mz',idx(ie));drive();PREFER=[];
ok('A: ガナシア discarded as the cost → special summoned from the GY (forced), ATK 1600 + 200',z(gs)==='mz'&&curATK(C(gs))===1800&&C(gs).banishWhenLeavesField===true&&z(x1)==='hand',JSON.stringify([z(gs),curATK(C(gs)),z(x1)]));
ok('A: once per turn (アイスエッジ cannot use it again)',legal('E・HERO アイスエッジ',0,idx(ie)).ok===false);
phase('battle');
PREFER=[s2.uid];requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();PREFER=[];
ok('A: direct attack (青眼 present): 800 damage; the chosen Set card (サイクロン) destroyed, the other stays',lp(1)===7200&&z(s2)==='grave'&&z(s1)==='sz',JSON.stringify([lp(1),z(s2),z(s1)]));
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:1,target:0});drive();
ok('A: ガナシア (1800) destroyed by 青眼 → banished, not in the GY',z(gs)==='banish'&&lp(0)===8000-1200,JSON.stringify([z(gs),lp(0)]));
audit('A');

/* ===== B: アイスエッジ cannot be used in Main Phase 2 ===== */
fresh();
ie=mk('E・HERO アイスエッジ',0,'up');gameState.players[0].mz=[ie];gameState.players[0].hand=[mk('ワイト',0)];gameState.phase='main2';baselineA();
const lgB=legal('E・HERO アイスエッジ',0,0);
ok('B: Main Phase 2 → not activatable',lgB.ok===false,JSON.stringify(lgB));

/* ===== C: ラヴァル・ガンナー — Normal Summon with another 「ラヴァル」 in the GY: send up to 5 (chosen as the cost); ATK +200 per 「ラヴァル」 sent ===== */
fresh();
let gn=mk('ラヴァル・ガンナー',0),lw=mk('ラヴァル・ウォリアー',0);
gameState.players[0].deck=[mk('ラヴァルのマグマ砲兵',0),mk('ワイト',0),mk('ラヴァル・ウォリアー',0),mk('ワイト',0),mk('ワイト',0)].concat(gameState.players[0].deck);
gameState.players[0].hand=[gn];gameState.players[0].grave=[lw];baselineA();
PREFER=['5'];doNormalSummon(0,'atk');drive();PREFER=[];
ok('C: 5 cards sent (2 「ラヴァル」 among them) → ATK 1200 + 400',z(gn)==='mz'&&gameState.players[0].grave.length===6&&gameState.players[0].deck.length===14&&curATK(C(gn))===1600,JSON.stringify([gameState.players[0].grave.length,gameState.players[0].deck.length,curATK(C(gn))]));
audit('C');

/* ===== C2: no other 「ラヴァル」 in the GY → no effect ===== */
fresh();
gn=mk('ラヴァル・ガンナー',0);let gn2=mk('ラヴァル・ガンナー',0);
gameState.players[0].hand=[gn];gameState.players[0].grave=[gn2];baselineA();
doNormalSummon(0,'atk');drive();
ok('C2: only ラヴァル・ガンナー in the GY → no trigger, nothing sent, ATK 1200',z(gn)==='mz'&&TRIG.length===0&&gameState.players[0].grave.length===1&&gameState.players[0].deck.length===14&&curATK(C(gn))===1200,JSON.stringify([TRIG,gameState.players[0].grave.length,curATK(C(gn))]));
audit('C2');

/* ===== D: リチュア・ノエリア — top 5: Ritual Spells and 「リチュア」 monsters to the GY; the rest to the bottom of the Deck in the chosen order ===== */
fresh();
let nr=mk('リチュア・ノエリア',0),ea=mk('リチュア・エリアル',0),w1=mk('ワイト',0),rs=mk('リチュアの儀水鏡',0),rv=mk('死者蘇生',0),w2=mk('ワイト',0);
gameState.players[0].deck=[ea,w1,rs,rv,w2].concat(gameState.players[0].deck);gameState.players[0].hand=[nr];baselineA();
ORDER=[rv.uid,w2.uid,w1.uid];doNormalSummon(0,'atk');drive();ORDER=[];
const dk=gameState.players[0].deck;
ok('D: リチュア・エリアル and the Ritual Spell sent to the GY; the other 3 stay out of it',z(ea)==='grave'&&z(rs)==='grave'&&z(w1)==='deck'&&z(rv)==='deck'&&z(w2)==='deck'&&dk.length===17,JSON.stringify([z(ea),z(rs),dk.length]));
ok('D: the rest returned to the bottom in the chosen order (死者蘇生, ワイト, ワイト)',dk.slice(-3).map(c=>c.uid).join()===[rv.uid,w2.uid,w1.uid].join(),JSON.stringify(dk.slice(-3).map(c=>c.uid)));
audit('D');

/* ===== E: 真六武衆－シナイ — Special Summoned from the hand with ミズホ face-up; released by ミズホ's real cost → a 「六武衆」 (not シナイ) from the GY to the hand ===== */
fresh();
let mzh=mk('真六武衆－ミズホ',0,'up'),sh=mk('真六武衆－シナイ',0),sh2=mk('真六武衆－シナイ',0),zj=mk('六武衆－ザンジ',0),wt=mk('ワイト',0),foe=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[mzh];gameState.players[0].hand=[sh];gameState.players[0].grave=[sh2,zj,wt];gameState.players[1].mz=[foe];baselineA();
const lgE=strictSummonProcedureLegality('真六武衆－シナイ',0,'hand',0);
finishSummonProcedure('真六武衆－シナイ',0,'hand',0,'atk');drive();
ok('E: Special Summoned from the hand (ミズホ face-up)',lgE.ok===true&&z(sh)==='mz',JSON.stringify([lgE,z(sh)]));
PREFER=[sh.uid,foe.uid,zj.uid];duelActivateFromZone(0,'mz',idx(mzh));drive();PREFER=[];
ok('E: ミズホ released シナイ (cost) and destroyed 青眼',z(sh)==='grave'&&z(foe)==='grave');
ok('E: シナイ released → ザンジ to the hand; the other シナイ and ワイト are not taken',z(zj)==='hand'&&z(sh2)==='grave'&&z(wt)==='grave',JSON.stringify([z(zj),z(sh2),z(wt)]));
audit('E');

/* ===== E2: no ミズホ on the field → the summon procedure is refused ===== */
fresh();
sh=mk('真六武衆－シナイ',0);gameState.players[0].hand=[sh];baselineA();
const lgE2=strictSummonProcedureLegality('真六武衆－シナイ',0,'hand',0);
ok('E2: without 真六武衆－ミズホ the procedure is not legal',lgE2.ok===false,JSON.stringify(lgE2));
/* ===== E3 (parent review): シナイ destroyed by ブラック・ホール — destruction is not 「リリースされた」, no trigger ===== */
fresh();
let shD=mk('真六武衆－シナイ',0,'up'),zjD=mk('六武衆－ザンジ',0),bhD=mk('ブラック・ホール',0);
gameState.players[0].mz=[shD];gameState.players[0].grave=[zjD];gameState.players[0].hand=[bhD];baselineA();
duelActivateFromHand(0);drive();
ok('E3: シナイ destroyed (not released) — ザンジ stays in the GY',z(shD)==='grave'&&z(zjD)==='grave',JSON.stringify([z(shD),z(zjD)]));
audit('E3');
`);
