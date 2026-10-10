/* S03-U247: turn-duration Level changes — ダーク・スパイダー, タイムパッセージ, コピー・プラント, フルエルフ (existing v16 Level layer).
   Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
let PREFER=[],TRIG=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function toWindow(){for(let i=0;i<200;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length)return true;
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function lp(p){return gameState.players[p].lp;}
function turn(){requestProcessorV27(PROCESSOR_V27.TURN);drive();}
function synLv(c){const m=(materialCandidates(0,'synchro')||[]).find(x=>x.c===C(c));return m?m.lv:null;}

/* ===== A: ダーク・スパイダー — an own Insect +2 Levels until the End Phase (Synchro material Level too); back after the End Phase ===== */
fresh();
let ds=mk('ダーク・スパイダー',0,'up'),km=mk('カマキラー',0,'up');gameState.players[0].mz=[ds,km];gameState.phase='main1';baselineA();
PREFER=[km.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('A: カマキラー Level 4 → 6, also as Synchro material',curLV(C(km))===6&&synLv(km)===6,JSON.stringify({lv:curLV(C(km)),syn:synLv(km)}));
const lgA2=strictScriptLegalityV2('ダーク・スパイダー',0,'mz',0,{});
ok('A: once per turn',lgA2.ok===false,JSON.stringify(lgA2));
phase('end');turn();
ok('A: after the End Phase — Level 4 again',curLV(C(km))===4,JSON.stringify({lv:curLV(C(km))}));
audit('A');

/* ===== B: タイムパッセージ — a 「フォーチュンレディ」 +3 Levels until the End Phase (its ATK follows its Level) ===== */
fresh();
let tp=mk('タイムパッセージ',0),li=mk('フォーチュンレディ・ライティー',0,'up');gameState.players[0].hand=[tp];gameState.players[0].mz=[li];baselineA();
PREFER=[li.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('B: ライティー Level 1 → 4, ATK 200 → 800',curLV(C(li))===4&&curATK(C(li))===800,JSON.stringify({lv:curLV(C(li)),atk:curATK(C(li))}));
audit('B');
fresh();
tp=mk('タイムパッセージ',0);let wt=mk('ワイト',0,'up');gameState.players[0].hand=[tp];gameState.players[0].mz=[wt];baselineA();
const lgB=strictScriptLegalityV2('タイムパッセージ',0,'hand',0,{});
ok('B2: no 「フォーチュンレディ」 — cannot be activated',lgB.ok===false,JSON.stringify(lgB));

/* ===== C: コピー・プラント — its Level becomes the chosen Plant's until the End Phase ===== */
fresh();
let cp=mk('コピー・プラント',0,'up'),sp=mk('スネーク・パーム',1,'up');gameState.players[0].mz=[cp];gameState.players[1].mz=[sp];baselineA();
PREFER=[sp.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('C: コピー・プラント Level 1 → 4 (スネーク・パーム on the opponent field)',curLV(C(cp))===4&&synLv(cp)===4,JSON.stringify({lv:curLV(C(cp))}));
audit('C');

/* ===== D: フルエルフ — reveal a hand monster (cost): its Level added until the End Phase ===== */
fresh();
let fe=mk('フルエルフ',0,'up'),hm=mk('カマキラー',0);gameState.players[0].mz=[fe];gameState.players[0].hand=[hm];baselineA();
PREFER=[hm.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('D: revealed カマキラー (Level 4) stays in the hand; フルエルフ Level 2 → 6',z(hm)==='hand'&&curLV(C(fe))===6,JSON.stringify({hm:z(hm),lv:curLV(C(fe))}));
audit('D');
fresh();
fe=mk('フルエルフ',0,'up');gameState.players[0].mz=[fe];gameState.players[0].hand=[mk('死者蘇生',0)];baselineA();
const lgD=strictScriptLegalityV2('フルエルフ',0,'mz',0,{});
ok('D2: no monster in the hand — cannot be activated',lgD.ok===false,JSON.stringify(lgD));
`);
