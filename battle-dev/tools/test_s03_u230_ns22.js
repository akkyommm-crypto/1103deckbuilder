/* S03-U230: NOT_STARTED → TESTED — ヒーローズルール2, 極星將テュール, ヴォルカニック・カウンター, 黒魔導の執行官, 守護神エクゾード, 地縛神の咆哮.
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
function lp(p){return gameState.players[p].lp;}
function proc(name,p,idx){runSummonProcedure(name,p,'hand',idx);if(!gameState.pendingSummon&&!pendingChoiceV49(gameState))finishSummonProcedure(name,p,'hand',idx,'atk');drive();}

/* ===== A: ヒーローズルール2 — an activation targeting a card in the GY: negated and destroyed ===== */
fresh();
let hr=mk('ヒーローズルール2',0,'down');hr.setTurn=4;let mr=mk('死者蘇生',1),wg=mk('ワイト',1);
gameState.players[0].sz=[hr];gameState.players[1].hand=[mr];gameState.players[1].grave=[wg];gameState.activePlayer=1;baselineA();
PREFER=[wg.uid];duelActivateFromHand(0);
let w1=toWindow();const offA=w1&&offered(0,hr);if(offA)duelActivateResponseV2(0,'sz',0);drive();PREFER=[];
ok('A: 死者蘇生 negated; ワイト stays in the GY',offA&&z(mr)==='grave'&&z(wg)==='grave');
audit('A');
fresh();
hr=mk('ヒーローズルール2',0,'down');hr.setTurn=4;let bh=mk('ブラック・ホール',1);gameState.players[0].sz=[hr];gameState.players[1].hand=[bh];gameState.players[1].mz=[mk('ワイト',1,'up')];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);w1=toWindow();
ok('A2: a non-targeting Spell — not offered',!(w1&&offered(0,hr)));

/* ===== B: 極星將テュール — the opponent cannot target its other 「極星」 monsters; destroyed without another face-up 「極星」 ===== */
fresh();
let ty=mk('極星將テュール',0,'up'),gf=mk('極星獣グルファクシ',0,'up');gameState.players[0].mz=[ty,gf];baselineA();
ok('B: グルファクシ protected; テュール not',!!attackTargetForbiddenReasonS03(1,C(gf))&&!attackTargetForbiddenReasonS03(1,C(ty)));
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:1,byDestroy:true,reason:'test'});
ok('B: グルファクシ gone — テュール destroyed by its own text',z(ty)==='grave');

/* ===== C: ヴォルカニック・カウンター — in the GY, its controller takes battle damage: banish it, the same damage to the opponent ===== */
fresh();
let vc=mk('ヴォルカニック・カウンター',0),vb=mk('ヴォルカニック・バレット',0),at=mk('青眼の白龍',1,'up');
gameState.players[0].grave=[vc,vb];gameState.players[1].mz=[at];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:'direct'});drive();
ok('C: 3000 taken → counter banished, 3000 to the opponent',lp(0)===5000&&z(vc)==='banish'&&lp(1)===5000,JSON.stringify({lp0:lp(0),lp1:lp(1),vc:z(vc)}));
audit('C');
fresh();
vc=mk('ヴォルカニック・カウンター',0);at=mk('青眼の白龍',1,'up');gameState.players[0].grave=[vc];gameState.players[1].mz=[at];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:'direct'});drive();
ok('C2: no other FIRE in the GY — banished, no damage',z(vc)==='banish'&&lp(1)===8000);

/* ===== D: 黒魔導の執行官 — release ブラック・マジシャン: special summoned; each Normal Spell activation → 1000 to the opponent ===== */
fresh();
let en=mk('黒魔導の執行官',0),bm=mk('ブラック・マジシャン',0,'up'),fb=mk('おろかな埋葬',0);gameState.players[0].hand=[en,fb];gameState.players[0].mz=[bm];baselineA();
proc('黒魔導の執行官',0,0);
ok('D: ブラック・マジシャン released; 執行官 special summoned',z(en)==='mz'&&z(bm)==='grave');
duelActivateFromHand(0);drive();
ok('D: its controller\'s おろかな埋葬 → 1000 to the opponent',lp(1)===7000&&z(fb)==='grave',JSON.stringify({lp1:lp(1),TRIG}));
audit('D');
fresh();
en=mk('黒魔導の執行官',0,'up');let ob=mk('おろかな埋葬',1);gameState.players[0].mz=[en];gameState.players[1].hand=[ob];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);drive();
ok('D2: the opponent\'s Normal Spell → 1000 to the opponent too',lp(1)===7000&&lp(0)===8000);
fresh();
en=mk('黒魔導の執行官',0,'up');let cy=mk('サイクロン',0),os=mk('サイクロン',1,'down');gameState.players[0].mz=[en];gameState.players[0].hand=[cy];gameState.players[1].sz=[os];baselineA();
duelActivateFromHand(0);drive();
ok('D3: a Quick-Play Spell — no damage',lp(1)===8000);

/* ===== E: 守護神エクゾード — release a 「スフィンクス」: special summoned; an EARTH monster Flip Summoned → 1000 to the opponent ===== */
fresh();
let ex=mk('守護神エクゾード',0),sp=mk('ヒエラコスフィンクス',0,'up'),ed=mk('セイバーザウルス',0,'down','def');ed.setTurn=4;
gameState.players[0].hand=[ex];gameState.players[0].mz=[sp,ed];baselineA();
proc('守護神エクゾード',0,0);
ok('E: ヒエラコスフィンクス released; エクゾード special summoned',z(ex)==='mz'&&z(sp)==='grave');
doFlipUp(0,'mz',findCardByUid(ed.uid).index,'atk');drive();
ok('E: セイバーザウルス (EARTH) Flip Summoned → 1000',lp(1)===7000,JSON.stringify({lp1:lp(1),TRIG}));
audit('E');

/* ===== F: 地縛神の咆哮 — the opponent attacks with a monster weaker than its 「地縛神」: destroyed, half its ATK as damage ===== */
fresh();
let rr=mk('地縛神の咆哮',0,'up'),eb=mk('地縛神 Ccapac Apu',0,'up');let ow=mk('ワイト',1,'up');
let dw=mk('ワイト',0,'up');gameState.players[0].sz=[rr];gameState.players[0].mz=[eb,dw];gameState.players[0].field=mk('天空の聖域',0,'up');gameState.players[1].mz=[ow];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:1});drive();
ok('F: ワイト destroyed at its attack declaration; 150 damage to the opponent; the target survives',z(ow)==='grave'&&lp(1)===7850&&lp(0)===8000&&z(dw)==='mz',JSON.stringify({ow:z(ow),lp0:lp(0),lp1:lp(1),TRIG}));
audit('F');
fresh();
rr=mk('地縛神の咆哮',0,'up');eb=mk('地縛神 Ccapac Apu',0,'up');let big=mk('青眼の白龍',1,'up');
let dw2=mk('ワイト',0,'up');gameState.players[0].sz=[rr];gameState.players[0].mz=[eb,dw2];gameState.players[0].field=mk('天空の聖域',0,'up');gameState.players[1].mz=[big];gameState.activePlayer=1;gameState.phase='battle';baselineA();TRIG.length=0;
const strongerF=curATK(C(big))>=curATK(C(eb));
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:1});drive();
ok('F2: an attacker not weaker than the 「地縛神」 — not destroyed',strongerF&&z(big)==='mz',JSON.stringify({a:curATK(C(big)),e:curATK(C(eb))}));
`);
