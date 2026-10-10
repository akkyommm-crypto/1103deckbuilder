/* S03-U248: Trap Monsters — アポピスの化神, メタル・リフレクト・スライム, 死霊ゾーマ, 機動砦 ストロング・ホールド (engine/1ZZI: asMonsterDbS03 read by dbOf).
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
function setT(n,p){const c=mk(n,p,'down');c.setTurn=4;return c;}

/* ===== A: アポピスの化神 — activated in the Main Phase: a Normal Monster (Reptile / EARTH / 4 / 1600 / 1800) that is also a Trap card ===== */
fresh();
let ap=setT('アポピスの化神',0);gameState.players[0].sz=[ap];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('A: special summoned from the Spell & Trap Zone — ATK 1600 / DEF 1800, Level 4, Reptile, EARTH, Normal; still a Trap card',
  z(ap)==='mz'&&curATK(C(ap))===1600&&curStat(C(ap),'def')===1800&&curLV(C(ap))===4&&dbOf(C(ap)).ra==='爬虫類'&&dbOf(C(ap)).at==='地'&&dbOf(C(ap)).k==='m'&&isTrapCardS03(C(ap)),
  JSON.stringify({z:z(ap),atk:curATK(C(ap)),db:dbOf(C(ap)).k}));
let bh=mk('ブラック・ホール',0);gameState.players[0].hand=[bh];ensureAllCardUids(gameState);baselineA();
duelActivateFromHand(0);drive();
ok('A: destroyed → in the GY it is a Trap card again',z(ap)==='grave'&&dbOf(C(ap)).k==='t'&&!C(ap).asMonsterDbS03,JSON.stringify({z:z(ap),k:dbOf(C(ap)).k}));
audit('A');
fresh();
ap=setT('アポピスの化神',0);gameState.players[0].sz=[ap];gameState.phase='battle';baselineA();
const lgA=strictScriptLegalityV2('アポピスの化神',0,'sz',0,{});
ok('A2: not in the Battle Phase (「メインフェイズに発動できる」)',lgA.ok===false,JSON.stringify(lgA));
fresh();
ap=setT('アポピスの化神',0);gameState.players[0].sz=[ap];gameState.players[0].mz=[0,1,2,3,4].map(()=>mk('ワイト',0,'up'));baselineA();
const lgA3=strictScriptLegalityV2('アポピスの化神',0,'sz',0,{});
ok('A3: no Monster Zone space — cannot be activated',lgA3.ok===false,JSON.stringify(lgA3));

/* ===== B: メタル・リフレクト・スライム — Defense Position 0 / 3000, Level 10; it cannot attack ===== */
fresh();
let sl=setT('メタル・リフレクト・スライム',0);gameState.players[0].sz=[sl];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('B: summoned in Defense Position, DEF 3000, Level 10, cannot attack',z(sl)==='mz'&&C(sl).pos==='def'&&curStat(C(sl),'def')===3000&&curLV(C(sl))===10&&cannotAttackNow(C(sl)),
  JSON.stringify({pos:C(sl).pos,def:curStat(C(sl),'def'),lv:curLV(C(sl))}));
audit('B');

/* ===== C: 死霊ゾーマ — destroyed by battle (summoned by its own effect) → the destroyer's ATK as damage to the opponent ===== */
fresh();
let zm=setT('死霊ゾーマ',0),be=mk('青眼の白龍',1,'up');gameState.players[0].sz=[zm];gameState.players[1].mz=[be];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('C: summoned in Defense Position (1800 / 500)',z(zm)==='mz'&&C(zm).pos==='def'&&curStat(C(zm),'def')===500);
phase('main2');phase('end');requestProcessorV27(PROCESSOR_V27.TURN);drive();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'standby'});drive();phase('main1');phase('battle');
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('C: destroyed by 青眼 → 3000 damage to the opponent',z(zm)==='grave'&&lp(1)===5000,JSON.stringify({zm:z(zm),lp1:lp(1),TRIG}));
audit('C');
fresh();
zm=setT('死霊ゾーマ',0);let bh2=mk('ブラック・ホール',0);gameState.players[0].sz=[zm];gameState.players[0].hand=[bh2];baselineA();
duelActivateFromZone(0,'sz',0);drive();duelActivateFromHand(0);drive();
ok('C2: destroyed by an effect (ブラック・ホール) — no damage',z(zm)==='grave'&&lp(1)===8000,JSON.stringify({zm:z(zm),lp1:lp(1)}));
audit('C2');

/* ===== D: 機動砦 ストロング・ホールド — ATK +3000 while the three Gadgets are on its controller's field ===== */
fresh();
let sh=setT('機動砦 ストロング・ホールド',0);gameState.players[0].sz=[sh];
gameState.players[0].mz=['グリーン・ガジェット','レッド・ガジェット','イエロー・ガジェット'].map(n=>mk(n,0,'up'));baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('D: with all three Gadgets — ATK 0 + 3000',z(sh)==='mz'&&curATK(C(sh))===3000,JSON.stringify({atk:curATK(C(sh))}));
audit('D');
fresh();
sh=setT('機動砦 ストロング・ホールド',0);gameState.players[0].sz=[sh];gameState.players[0].mz=[mk('グリーン・ガジェット',0,'up')];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('D2: only one Gadget — ATK 0',z(sh)==='mz'&&curATK(C(sh))===0,JSON.stringify({atk:curATK(C(sh))}));
audit('D2');
`);
