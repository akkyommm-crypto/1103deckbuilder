/* S03-U219: NOT_STARTED → TESTED — Counter Traps ツタン仮面, フォースフィールド, トラップ・ジャマー, ディザーム, パリィ. Real DUEL paths (the opponent's
   card activation, then the Counter Trap as a chain response), Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
let PREFER=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
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

/* ===== A: ツタン仮面 — 月の書 targeting a face-up Zombie: negated and destroyed ===== */
fresh();
let tm=mk('ツタン仮面',1,'down');tm.setTurn=4;let wz=mk('ワイト',1,'up'),mb=mk('月の書',0);
gameState.players[1].sz=[tm];gameState.players[1].mz=[wz];gameState.players[0].hand=[mb];baselineA();
PREFER=[wz.uid];duelActivateFromHand(0);
let w1=toWindow();const offA=w1&&offered(1,tm);if(offA)duelActivateResponseV2(1,'sz',0);drive();
ok('A: 月の書 negated and destroyed; ワイト stays face-up',offA&&z(mb)==='grave'&&z(tm)==='grave'&&C(wz).face==='up',JSON.stringify({offA,wz:C(wz).face}));
audit('A');
fresh();
tm=mk('ツタン仮面',1,'down');tm.setTurn=4;let nz=mk('青眼の白龍',1,'up');mb=mk('月の書',0);
gameState.players[1].sz=[tm];gameState.players[1].mz=[nz];gameState.players[0].hand=[mb];baselineA();
PREFER=[nz.uid];duelActivateFromHand(0);
w1=toWindow();
ok('A2: targeting a non-Zombie — not offered',!(w1&&offered(1,tm)));

/* ===== B: フォースフィールド — a Spell targeting 1 monster: negated and destroyed ===== */
fresh();
let ff=mk('フォースフィールド',1,'down');ff.setTurn=4;nz=mk('青眼の白龍',1,'up');mb=mk('月の書',0);
gameState.players[1].sz=[ff];gameState.players[1].mz=[nz];gameState.players[0].hand=[mb];baselineA();
PREFER=[nz.uid];duelActivateFromHand(0);
w1=toWindow();const offB=w1&&offered(1,ff);if(offB)duelActivateResponseV2(1,'sz',0);drive();
ok('B: 月の書 negated; 青眼 stays face-up',offB&&z(mb)==='grave'&&C(nz).face==='up');
audit('B');
fresh();
ff=mk('フォースフィールド',1,'down');ff.setTurn=4;let bh=mk('ブラック・ホール',0);gameState.players[1].sz=[ff];gameState.players[1].mz=[mk('ワイト',1,'up')];gameState.players[0].hand=[bh];baselineA();
duelActivateFromHand(0);w1=toWindow();
ok('B2: a non-targeting Spell (ブラック・ホール) — not offered',!(w1&&offered(1,ff)));

/* ===== C: トラップ・ジャマー — in the Battle Phase, the opponent's Trap activation negated ===== */
fresh();
let tj=mk('トラップ・ジャマー',0,'down');tj.setTurn=4;let ir=mk('威嚇する咆哮',1,'down');ir.setTurn=4;
gameState.players[0].sz=[tj];gameState.players[1].sz=[ir];gameState.players[1].mz=[mk('青眼の白龍',1,'up')];gameState.activePlayer=1;gameState.phase='battle';baselineA();
duelActivateFromZone(1,'sz',0);
w1=toWindow();const offC=w1&&offered(0,tj);if(offC)duelActivateResponseV2(0,'sz',0);drive();
ok('C: 威嚇する咆哮 negated and destroyed',offC&&z(ir)==='grave'&&z(tj)==='grave'&&!(gameState.players[0].temporaryFlags||{}).noAttackDeclareS03,JSON.stringify({offC,ir:z(ir)}));
audit('C');
fresh();
tj=mk('トラップ・ジャマー',0,'down');tj.setTurn=4;ir=mk('威嚇する咆哮',1,'down');ir.setTurn=4;
gameState.players[0].sz=[tj];gameState.players[1].sz=[ir];gameState.activePlayer=1;gameState.phase='main1';baselineA();
duelActivateFromZone(1,'sz',0);w1=toWindow();
ok('C2: in the Main Phase — not offered',!(w1&&offered(0,tj)));

/* ===== D: ディザーム — return a 「剣闘獣」 card from the hand (cost): a Spell activation negated ===== */
fresh();
let da=mk('ディザーム',0,'down');da.setTurn=4;let gl=mk('剣闘獣ラクエル',0);let mr=mk('死者蘇生',1),wg=mk('ワイト',1);
gameState.players[0].sz=[da];gameState.players[0].hand=[gl];gameState.players[1].hand=[mr];gameState.players[1].grave=[wg];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);
w1=toWindow();const offD=w1&&offered(0,da);if(offD)duelActivateResponseV2(0,'sz',0);drive();
ok('D: ラクエル returned to the Deck; 死者蘇生 negated and destroyed',offD&&z(gl)==='deck'&&z(mr)==='grave'&&z(wg)==='grave',JSON.stringify({offD,gl:z(gl),wg:z(wg)}));
audit('D');
fresh();
da=mk('ディザーム',0,'down');da.setTurn=4;mr=mk('死者蘇生',1);gameState.players[0].sz=[da];gameState.players[0].hand=[mk('ワイト',0)];gameState.players[1].hand=[mr];gameState.players[1].grave=[mk('ワイト',1)];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);w1=toWindow();
ok('D2: no 「剣闘獣」 in the hand — not offered',!(w1&&offered(0,da)));

/* ===== E: パリィ — return a 「剣闘獣」 card (cost): a Trap activation negated ===== */
fresh();
let pr=mk('パリィ',0,'down');pr.setTurn=4;gl=mk('剣闘獣ラクエル',0);ir=mk('威嚇する咆哮',1,'down');ir.setTurn=4;
gameState.players[0].sz=[pr];gameState.players[0].hand=[gl];gameState.players[1].sz=[ir];gameState.activePlayer=1;baselineA();
duelActivateFromZone(1,'sz',0);
w1=toWindow();const offE=w1&&offered(0,pr);if(offE)duelActivateResponseV2(0,'sz',0);drive();
ok('E: 威嚇する咆哮 negated and destroyed (no attack lock set); ラクエル returned',offE&&z(ir)==='grave'&&z(gl)==='deck'&&!(gameState.players[0].temporaryFlags||{}).noAttackDeclareS03);
audit('E');
`);
