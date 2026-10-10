/* S03-U236: 「戦闘を行ったバトルフェイズ終了時」 — the finished Battle Phase's attack record survives its cleanup for onBattlePhaseEnd (engine/00, engine/15).
   Real DUEL checks of ビッグ・ジョーズ, ステルスロイド, 始祖の守護者ティラス. Replay-audited. */
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

/* ===== A: ビッグ・ジョーズ — it attacked → banished at the end of the Battle Phase; it did not attack → stays ===== */
fresh();
let bj=mk('ビッグ・ジョーズ',0,'up'),w=mk('ワイト',1,'up');gameState.players[0].mz=[bj];gameState.players[1].mz=[w];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
const midA=z(bj);
phase('main2');
ok('A: attacked (ワイト destroyed); still on the field during the Battle Phase, banished at its end',z(w)==='grave'&&midA==='mz'&&z(bj)==='banish',JSON.stringify({midA,bj:z(bj),TRIG}));
audit('A');
fresh();
bj=mk('ビッグ・ジョーズ',0,'up');gameState.players[0].mz=[bj];gameState.phase='battle';baselineA();
phase('main2');
ok('A2: it did not attack — stays on the field',z(bj)==='mz',JSON.stringify({bj:z(bj)}));
audit('A2');

/* ===== B: ステルスロイド — with another 「ロイド」, it battled in its controller's Battle Phase → at its end, destroy a Spell / Trap card ===== */
fresh();
let st=mk('ステルスロイド',0,'up'),gy=mk('ジャイロイド',0,'up'),vw=mk('ワイト',1,'up'),sc=mk('サイクロン',1,'down');sc.setTurn=4;
gameState.players[0].mz=[st,gy];gameState.players[1].mz=[vw];gameState.players[1].sz=[sc];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
phase('main2');
ok('B: battled → at the end of the Battle Phase the opponent\'s Set card is destroyed',z(vw)==='grave'&&z(sc)==='grave',JSON.stringify({vw:z(vw),sc:z(sc),TRIG}));
audit('B');
fresh();
st=mk('ステルスロイド',0,'up');gy=mk('ジャイロイド',0,'up');sc=mk('サイクロン',1,'down');sc.setTurn=4;
gameState.players[0].mz=[st,gy];gameState.players[1].sz=[sc];gameState.phase='battle';baselineA();
phase('main2');
ok('B2: it did not battle — nothing destroyed',z(sc)==='sz',JSON.stringify({sc:z(sc)}));
audit('B2');

/* ===== C: 始祖の守護者ティラス (with materials) — it battled → at the end of the Battle Phase, destroy 1 card on the opponent's field ===== */
fresh();
let ty=mk('始祖の守護者ティラス',0,'up');ty.xyz=[mk('ワイト',0),mk('ワイト',0)];let sp=mk('サイクロン',1,'down');sp.setTurn=4;
gameState.players[0].mz=[ty];gameState.players[1].sz=[sp];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
const lpC=lp(1),midC=z(sp);
phase('main2');
ok('C: direct attack (2600), the Set card survives the battle, destroyed at the end of the Battle Phase',lpC===8000-2600&&midC==='sz'&&z(sp)==='grave',JSON.stringify({lpC,midC,sp:z(sp),TRIG}));
audit('C');
`);
