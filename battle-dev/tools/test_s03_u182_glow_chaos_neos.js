/* S03-U182: E・HERO グロー・ネオス (destroy a face-up opponent card; gain by its type; Main Phase 1, once per turn; End Phase return) and
   E・HERO カオス・ネオス (3 coin tosses: 3 / 2 / 1 heads; End Phase: return + set every face-up monster). Contact fusion (engine/1ZW).
   Real DUEL paths; Replay-audited. Coin results come from seeds chosen in the test (the tosses use the duel RNG). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(seed){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=(seed||0x5331a5e5)>>>0;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:4},()=>mk('ワイト',p));}
let PREFER=[];
function drive(){for(let i=0;i<600;i++){
  const q=pc();
  if(q){let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function fire(c){const hh=findCardByUid(c.uid);const L=strictScriptLegalityV2(cardName(c),hh.p,'mz',hh.index,{});if(!L.ok)return L.reason;duelActivateFromZone(hh.p,'mz',hh.index);drive();return true;}
function glowSetup(){
  fresh();
  gameState.players[0].mz=[mk('E・HERO ネオス',0,'up'),mk('N・グロー・モス',0,'up')];
  const g=mk('E・HERO グロー・ネオス',0,'up');gameState.players[0].ex=[g];
  const tr=mk('王宮のお触れ',1,'up'),sp=mk('ウォーターワールド',1,'up'),mo=mk('ギガンテス',1,'up');gameState.players[1].sz=[tr];gameState.players[1].field=sp;gameState.players[1].mz=[mo];
  baselineA();finishSummonProcedure('E・HERO グロー・ネオス',0,'ex',0,'atk');drive();
  return {g,tr,sp,mo};
}
/* ===== A: グロー・ネオス ===== */
let s=glowSetup();
ok('A: contact-summoned',z(s.g)==='mz');
PREFER=[s.tr.uid];fire(s.g);PREFER=[];
ok('A: a Trap destroyed → グロー・ネオス becomes Defense Position',z(s.tr)==='grave'&&C(s.g).pos==='def');
ok('A: once per turn',fire(s.g)!==true);
phase('battle');phase('main2');phase('end');
ok('A: End Phase — back to the EX Deck',z(s.g)==='ex');
audit('A');
s=glowSetup();PREFER=[s.sp.uid];fire(s.g);PREFER=[];
ok('A: a Spell destroyed (field spell) → it may attack directly this turn',z(s.sp)==='grave'&&canDirectAttackThroughMonstersV51(C(s.g))===true&&C(s.g).pos==='atk');
audit('A2');
s=glowSetup();PREFER=[s.mo.uid];fire(s.g);PREFER=[];
ok('A: a monster destroyed → it cannot battle this turn',z(s.mo)==='grave'&&cannotAttackNow(C(s.g))===true);
audit('A3');
s=glowSetup();phase('battle');phase('main2');
ok('A: not in Main Phase 2 (「自分のメインフェイズ1に使用」)',fire(s.g)!==true&&z(s.tr)==='sz');

/* ===== B: カオス・ネオス — seeds for 3 / 2 / 1 heads ===== */
function seedFor(h){for(let sd=1;sd<20000;sd++){gameState.rngState=sd;const t=[duelRandomInt(2),duelRandomInt(2),duelRandomInt(2)];if(t.filter(x=>x===0).length===h)return sd;}return null;}
function chaosSetup(h){
  fresh();const sd=seedFor(h);fresh(sd);
  const cn=mk('E・HERO カオス・ネオス',0,'up');cn.properlySummonedS03=true;const own=mk('ワイト',0,'up');gameState.players[0].mz=[cn,own];
  const cd=mk('サイバー・ドラゴン',1,'up'),gi=mk('ブラッド・ヴォルス',1,'up');gameState.players[1].mz=[cd,gi];baselineA();
  return {cn,own,cd,gi,sd};
}
let c3=chaosSetup(3);fire(c3.cn);
ok('B: 3 heads — every opponent monster destroyed',c3.sd!=null&&z(c3.cd)==='grave'&&z(c3.gi)==='grave'&&z(c3.cn)==='mz');
audit('B3');
let c2=chaosSetup(2);fire(c2.cn);
ok('B: 2 heads — the opponent’s face-up effect monster (サイバー・ドラゴン) is negated this turn, the Normal Monster is not; both stay',c2.sd!=null&&effectNegated(C(c2.cd))&&z(c2.gi)==='mz'&&!effectNegated(C(c2.gi)));
phase('battle');phase('main2');phase('end');
ok('B: End Phase — カオス・ネオス back to the EX Deck; every face-up monster set (face-down Defense)',z(c2.cn)==='ex'&&C(c2.cd).face==='down'&&C(c2.cd).pos==='def'&&C(c2.gi).face==='down'&&C(c2.own).face==='down');
audit('B2');
let c1=chaosSetup(1);fire(c1.cn);
ok('B: 1 head — every own monster returns to the hand (カオス・ネオス to the EX Deck)',c1.sd!=null&&z(c1.own)==='hand'&&z(c1.cn)==='ex'&&z(c1.cd)==='mz');
audit('B1');
`);
