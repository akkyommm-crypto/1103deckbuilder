/* S03-U218: NOT_STARTED → TESTED — 陽動作戦 (engine/1ZU turn flag), デーモンの雄叫び, エレキーパー, ブラック・サンダー, TG－SX1, エクシーズエフェクト.
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
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function lp(p){return gameState.players[p].lp;}

/* ===== A: 陽動作戦 — this turn neither player can attack face-down monsters ===== */
fresh();
let dv=mk('陽動作戦',0,'down');dv.setTurn=4;let fd=mk('ワイト',1,'down','def');fd.setTurn=4;let at=mk('青眼の白龍',0,'up');
gameState.players[0].sz=[dv];gameState.players[1].mz=[fd];gameState.players[0].mz=[at];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('A: resolved — the face-down ワイト cannot be chosen by either player',z(dv)==='grave'&&!!attackTargetForbiddenReasonS03(0,C(fd)));
phase('battle');
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('A: the attack on it is refused',z(fd)==='mz'&&C(fd).face==='down');
audit('A');
ok('A: the next turn it applies no more',(function(){gameState.turn=6;return attackTargetForbiddenReasonS03(0,C(fd))==='';})());

/* ===== B: デーモンの雄叫び — pay 500 (cost): a 「デーモン」 from the GY; cannot be Tributed; destroyed at the End Phase ===== */
fresh();
let dr=mk('デーモンの雄叫び',0,'down');dr.setTurn=4;let sd=mk('シャドウナイトデーモン',0);gameState.players[0].sz=[dr];gameState.players[0].grave=[sd];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('B: 500 LP paid; シャドウナイトデーモン special summoned, cannot be Tributed',lp(0)===7500&&z(sd)==='mz'&&C(sd).cannotTribute===true);
ok('B: not among the Tribute candidates',!tributeCandidates(0,dbOf(mk('青眼の白龍',0))).some(x=>x.card===C(sd)));
phase('battle');phase('main2');phase('end');
ok('B: destroyed at the End Phase',z(sd)==='grave');
audit('B');

/* ===== C: エレキーパー — a Level 4 or lower 「エレキ」 from the GY, destroyed at the End Phase ===== */
fresh();
let ek=mk('エレキーパー',0,'down');ek.setTurn=4;let ej=mk('エレキジ',0);gameState.players[0].sz=[ek];gameState.players[0].grave=[ej];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('C: エレキジ special summoned',z(ej)==='mz');
phase('battle');phase('main2');phase('end');
ok('C: destroyed at the End Phase',z(ej)==='grave');
audit('C');

/* ===== D: ブラック・サンダー — an own 「BF」 destroyed by battle: 400 per opponent card ===== */
fresh();
let bt=mk('ブラック・サンダー',0,'down');bt.setTurn=4;let gl=mk('BF－疾風のゲイル',0,'up'),be=mk('青眼の白龍',1,'up');
gameState.players[0].sz=[bt];gameState.players[0].mz=[gl];gameState.players[1].mz=[be];gameState.players[1].sz=[mk('サイクロン',1,'down'),mk('サイクロン',1,'down')];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('D: ゲイル destroyed → 3 opponent cards × 400 = 1200',z(gl)==='grave'&&lp(1)===6800,JSON.stringify({lp:lp(1),TRIG}));
audit('D');

/* ===== E: TG－SX1 — an own 「TG」 destroys a monster by battle: a 「TG」 Synchro Monster from the GY ===== */
fresh();
let sx=mk('TG－SX1',0,'down');sx.setTurn=4;let rh=mk('TG ラッシュ・ライノ',0,'up'),pg=mk('TG パワー・グラディエイター',0),ow=mk('ワイト',1,'up');pg.properlySummonedS03=true;   /* it was Synchro Summoned earlier (a Synchro Monster must have been properly summoned to be revived) */
gameState.players[0].sz=[sx];gameState.players[0].mz=[rh];gameState.players[0].grave=[pg];gameState.players[1].mz=[ow];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('E: ワイト destroyed → TG パワー・グラディエイター special summoned',z(ow)==='grave'&&z(pg)==='mz',JSON.stringify({pg:z(pg),TRIG}));
audit('E');
fresh();
sx=mk('TG－SX1',0,'down');sx.setTurn=4;let nt=mk('青眼の白龍',0,'up');pg=mk('TG パワー・グラディエイター',0);pg.properlySummonedS03=true;ow=mk('ワイト',1,'up');
gameState.players[0].sz=[sx];gameState.players[0].mz=[nt];gameState.players[0].grave=[pg];gameState.players[1].mz=[ow];gameState.phase='battle';baselineA();TRIG.length=0;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('E2: a non-「TG」 destroys it — no activation',z(ow)==='grave'&&z(pg)==='grave'&&!TRIG.some(t=>/SX1/.test(t)));

/* ===== F: エクシーズエフェクト — an own Xyz Summon: destroy a targeted card ===== */
fresh();
let xe=mk('エクシーズエフェクト',0,'down');xe.setTurn=4;let m1=mk('セイバーザウルス',0,'up'),m2=mk('セイバーザウルス',0,'up'),hp=mk('No.39 希望皇ホープ',0),oc=mk('サイクロン',1,'down');
gameState.players[0].sz=[xe];gameState.players[0].mz=[m1,m2];gameState.players[0].ex=[hp];gameState.players[1].sz=[oc];baselineA();
const cbF=exCombos(0,dbOf(hp)).combos.find(c=>c.materials.length===2);
PREFER=[oc.uid];if(cbF)beginExSummonV2(0,0,cbF.materials,'xyz','atk');drive();PREFER=[];
ok('F: ホープ Xyz Summoned → the opponent\'s set サイクロン destroyed',!!cbF&&z(hp)==='mz'&&z(oc)==='grave'&&z(xe)==='grave',JSON.stringify({hp:z(hp),oc:z(oc),TRIG}));
audit('F');
fresh();
xe=mk('エクシーズエフェクト',0,'down');xe.setTurn=4;let sw=mk('ワイト',0);let mr=mk('死者蘇生',0);oc=mk('サイクロン',1,'down');
gameState.players[0].sz=[xe];gameState.players[0].grave=[sw];gameState.players[0].hand=[mr];gameState.players[1].sz=[oc];baselineA();TRIG.length=0;
duelActivateFromHand(0);drive();
ok('F2: a special summon that is not an Xyz Summon — no activation',z(sw)==='mz'&&z(oc)==='sz'&&!TRIG.some(t=>/エクシーズエフェクト/.test(t)));
`);
