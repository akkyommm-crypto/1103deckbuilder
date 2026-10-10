/* S03-U213: NOT_STARTED → TESTED — イーグル・アイ, 侵略の炎, 忍び寄るデビルマンタ (engine: 「このカードが召喚に成功した時、罠カードを発動する事はできない」),
   増幅する悪意. Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
let PREFER=[],TRIG=[],OFFERED=[],KINDS=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
/* drive(): records every card offered to either player at a POINT (and in event groups) and passes */
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){[0,1].forEach(p=>(getChainResponsesV2(p)||[]).forEach(r=>OFFERED.push((r.db||{}).n)));chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){KINDS.push((w.payload||{}).kind);[0,1].forEach(p=>(pointResponsesV27(p,w.payload||{})||[]).forEach(r=>OFFERED.push((r.db||{}).n)));pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function offeredGekiryu(){return TRIG.some(t=>/激流葬/.test(t))||OFFERED.indexOf('激流葬')>=0;}

/* ===== A: each of the three Normal Summoned — the opponent's set 激流葬 is not offered at that summon-success timing ===== */
['イーグル・アイ','侵略の炎','忍び寄るデビルマンタ'].forEach((n,ix)=>{
  fresh();
  const m=mk(n,0),gk=mk('激流葬',1,'down');gk.setTurn=4;gameState.players[0].hand=[m];gameState.players[1].sz=[gk];baselineA();
  TRIG.length=0;OFFERED.length=0;
  doNormalSummon(0,'atk');drive();
  ok('A'+ix+': '+n+' summoned — 激流葬 not offered; both stay',z(m)==='mz'&&z(gk)==='sz'&&!offeredGekiryu(),JSON.stringify({TRIG,OFFERED}));
  ok('A'+ix+': the lock ends with the summon-success timing',!gameState.summonTrapLockS03&&activationTypeLockReasonS03(1,C(gk),'sz',dbOf(gk),{})==='');
  audit('A'+ix);
});

/* ===== A-control: ワイト Normal Summoned — 激流葬 is offered ===== */
fresh();
let wt=mk('ワイト',0),gk=mk('激流葬',1,'down');gk.setTurn=4;gameState.players[0].hand=[wt];gameState.players[1].sz=[gk];baselineA();
TRIG.length=0;OFFERED.length=0;
doNormalSummon(0,'atk');drive();
ok('A-control: ワイト summoned — 激流葬 offered',offeredGekiryu(),JSON.stringify({TRIG,OFFERED,KINDS}));

/* ===== B: イーグル・アイ special summoned (not 「召喚」) by 死者蘇生 — 激流葬 is offered ===== */
fresh();
let ea=mk('イーグル・アイ',0),mr=mk('死者蘇生',0);gk=mk('激流葬',1,'down');gk.setTurn=4;gameState.players[0].grave=[ea];gameState.players[0].hand=[mr];gameState.players[1].sz=[gk];baselineA();
TRIG.length=0;OFFERED.length=0;
duelActivateFromHand(0);drive();
ok('B: special summoned — 激流葬 offered',offeredGekiryu(),JSON.stringify({TRIG,OFFERED,ea:z(ea)}));
fresh();
ea=mk('イーグル・アイ',0,'up');gameState.players[0].mz=[ea];baselineA();
ok('B: Flip / Special Summon events record no lock (Normal Summon does)',(function(){noteSummonTrapLockS03('onFlip',{uid:ea.uid});const a=!gameState.summonTrapLockS03;noteSummonTrapLockS03('onSpecialSummon',{uid:ea.uid});const b=!gameState.summonTrapLockS03;noteSummonTrapLockS03('onNormalSummon',{uid:ea.uid});const c=!!gameState.summonTrapLockS03;delete gameState.summonTrapLockS03;return a&&b&&c;})());

/* ===== C: while the lock holds, a Trap activation is refused (legality), and a face-up Trap's effect is not a card activation ===== */
fresh();
ea=mk('イーグル・アイ',0);let ir=mk('威嚇する咆哮',1,'down');ir.setTurn=4;gameState.players[0].hand=[ea];gameState.players[1].sz=[ir];baselineA();
let seen=false,why='';
const noteOrig=noteSummonTrapLockS03;
noteSummonTrapLockS03=function(n,e){noteOrig(n,e);if(gameState.summonTrapLockS03&&!seen){seen=true;why=activationTypeLockReasonS03(1,C(ir),'sz',dbOf(ir),{});}};
doNormalSummon(0,'atk');drive();
noteSummonTrapLockS03=noteOrig;
ok('C: during the summon-success timing, a set Trap is locked with the reason',seen&&/イーグル・アイ/.test(why),JSON.stringify({seen,why}));
ok('C: after it, the Trap is legal again',activationTypeLockReasonS03(1,C(ir),'sz',dbOf(ir),{})==='');

/* ===== D: 増幅する悪意 — the opponent's Standby Phase: mill the opponent's Deck by the number of 「増幅する悪意」 in its controller's GY ===== */
fresh();
let am=mk('増幅する悪意',0,'up');gameState.players[0].mz=[am];gameState.players[0].grave=[mk('増幅する悪意',0),mk('増幅する悪意',0)];gameState.phase='main2';baselineA();
const d1=gameState.players[1].deck.length;
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});drive();
requestProcessorV27(PROCESSOR_V27.TURN);drive();requestProcessorV27(PROCESSOR_V27.PHASE,{to:'standby'});drive();
ok('D: the opponent\'s Standby Phase — its Deck milled by 2 (after its draw)',gameState.activePlayer===1&&gameState.players[1].grave.length===2&&gameState.players[1].grave.every(c=>c.owner!==0),JSON.stringify({ap:gameState.activePlayer,g:gameState.players[1].grave.length,d:gameState.players[1].deck.length,ph:gameState.phase}));
audit('D');
fresh();
am=mk('増幅する悪意',0,'up');gameState.players[0].mz=[am];gameState.players[0].grave=[mk('増幅する悪意',0)];gameState.activePlayer=1;gameState.phase='main2';baselineA();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});drive();
requestProcessorV27(PROCESSOR_V27.TURN);drive();requestProcessorV27(PROCESSOR_V27.PHASE,{to:'standby'});drive();
ok('D2: its controller\'s own Standby Phase — nothing milled',gameState.activePlayer===0&&gameState.players[0].grave.length===1&&gameState.players[1].grave.length===0);
`);
