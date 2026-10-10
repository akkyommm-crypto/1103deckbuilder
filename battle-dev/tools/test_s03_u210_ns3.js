/* S03-U210: NOT_STARTED → TESTED — D－フォーチュン, 無視加護, ジュラック・ヘレラ, ガスタの賢者 ウィンダール, スクラップ・ワーム (engine: the Battle Phase exit
   destroys a monster with destroyAfterAttackS03 that attacked). Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
function toPoint(kind){for(let i=0;i<80;i++){
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind===kind)return true;
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function oppBattle(){gameState.activePlayer=1;gameState.phase='battle';}

/* ===== A: D－フォーチュン — the opponent declares a direct attack: banish a 「D－HERO」 (cost), the Battle Phase ends ===== */
fresh();
let df=mk('D－フォーチュン',0,'down');df.setTurn=4;let dh=mk('D－HERO ダガーガイ',0),at=mk('ブラッド・ヴォルス',1,'up'),at2=mk('ギガンテス',1,'up');
gameState.players[0].sz=[df];gameState.players[0].grave=[dh];gameState.players[1].mz=[at,at2];oppBattle();baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:'direct'});
const pA=toPoint('attackDeclare');const offA=pA&&(getChainResponsesV2(0)||[]).some(r=>r.card===C(df));
if(offA)pointActivateV27(0,'sz',0);drive();
ok('A: D－HERO ダガーガイ banished; no damage; the Battle Phase ended',offA&&z(dh)==='banish'&&gameState.players[0].lp===8000&&gameState.phase!=='battle',JSON.stringify({offA,lp:gameState.players[0].lp,ph:gameState.phase}));
audit('A');

/* ===== B: 無視加護 — the opponent's attack declaration: banish an Insect (cost), the attack negated ===== */
fresh();
let ig=mk('無視加護',0,'up');let ins=mk('N・フレア・スカラベ',0);at=mk('ブラッド・ヴォルス',1,'up');let my=mk('ワイト',0,'up');
gameState.players[0].sz=[ig];gameState.players[0].grave=[ins];gameState.players[0].mz=[my];gameState.players[1].mz=[at];oppBattle();baselineA();
TRIG.length=0;requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('B: face-up 無視加護 offered at the attack declaration; スカラベ banished; the attack negated (ワイト survives)',TRIG.some(t=>/無視加護/.test(t))&&z(ins)==='banish'&&z(my)==='mz',JSON.stringify({TRIG,ins:z(ins),my:z(my)}));
audit('B');

/* ===== C: ジュラック・ヘレラ — an own Defense Position 「ジュラック」 destroyed by battle: special summoned from the hand ===== */
fresh();
let hr=mk('ジュラック・ヘレラ',0),jg=mk('ジュラック・グアイバ',0,'up','def');at=mk('青眼の白龍',1,'up');
gameState.players[0].hand=[hr];gameState.players[0].mz=[jg];gameState.players[1].mz=[at];oppBattle();baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('C: グアイバ (Defense) destroyed → ヘレラ special summoned from the hand',z(jg)==='grave'&&z(hr)==='mz');
audit('C');
fresh();
hr=mk('ジュラック・ヘレラ',0);jg=mk('ジュラック・グアイバ',0,'up','atk');at=mk('青眼の白龍',1,'up');
gameState.players[0].grave=[hr];gameState.players[0].mz=[jg];gameState.players[1].mz=[at];oppBattle();baselineA();TRIG.length=0;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('C2: an Attack Position 「ジュラック」 destroyed — no activation',z(hr)==='grave'&&!TRIG.some(t=>/ヘレラ/.test(t)));
audit('C2');

/* ===== D: ガスタの賢者 ウィンダール — destroys a monster by battle: a Level 3 or lower 「ガスタ」 from the GY in face-up Defense ===== */
fresh();
let wd=mk('ガスタの賢者 ウィンダール',0,'up'),gg=mk('ガスタ・ガルド',0),om=mk('ワイト',1,'up');
gameState.players[0].mz=[wd];gameState.players[0].grave=[gg];gameState.players[1].mz=[om];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('D: ワイト destroyed → ガスタ・ガルド special summoned in face-up Defense',z(om)==='grave'&&z(gg)==='mz'&&C(gg).pos==='def'&&C(gg).face==='up');
audit('D');

/* ===== E: スクラップ・ワーム — attacks directly, destroyed at the end of the Battle Phase; destroyed by a 「スクラップ」 effect → a 「スクラップ」 back ===== */
fresh();
let sw=mk('スクラップ・ワーム',0,'up'),sb=mk('スクラップ・ビースト',0);om=mk('ブラッド・ヴォルス',1,'up');
gameState.players[0].mz=[sw];gameState.players[0].grave=[sb];gameState.players[1].mz=[om];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('E: direct attack past ブラッド・ヴォルス (500)',gameState.players[1].lp===7500);
phase('main2');
ok('E: destroyed at the end of the Battle Phase; not by a 「スクラップ」 effect → no retrieval',z(sw)==='grave'&&z(sb)==='grave');
audit('E');
fresh();
sw=mk('スクラップ・ワーム',0,'up');sb=mk('スクラップ・ビースト',0);let sq=mk('スクラップ・スコール',0),sd=mk('スクラップ・ゴブリン',0);
gameState.players[0].mz=[sw];gameState.players[0].grave=[sb];gameState.players[0].hand=[sq];gameState.players[0].deck.unshift(sd);baselineA();
duelActivateFromHand(0);drive();
ok('E2: destroyed by スクラップ・スコール → スクラップ・ビースト added',z(sw)==='grave'&&z(sb)==='hand');
audit('E2');
`);
