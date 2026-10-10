/* S03-U228: NOT_STARTED → TESTED — 金剛真力, ワーム・コール, 機皇帝の賜与, 獣神機王バルバロスUr, 魔法族の里 (engine: the activation lock reads Spell
   sources). Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
function lp(p){return gameState.players[p].lp;}
function lock(p,c,zone){return activationTypeLockReasonS03(p,C(c),zone,dbOf(c),{});}

/* ===== A: 金剛真力 — only the opponent has monsters: a Level 4 or lower Gemini monster from the hand; once per turn ===== */
fresh();
let kr=mk('金剛真力',0,'up'),an=mk('E・HERO アナザー・ネオス',0),wt=mk('ワイト',0);gameState.players[0].sz=[kr];gameState.players[0].hand=[an,wt];gameState.players[1].mz=[mk('ワイト',1,'up')];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('A: アナザー・ネオス special summoned (ワイト is no Gemini)',z(an)==='mz'&&z(wt)==='hand');
ok('A: once per turn',strictScriptLegalityV2('金剛真力',0,'sz',0,{}).ok===false);
audit('A');
fresh();
kr=mk('金剛真力',0,'up');an=mk('E・HERO アナザー・ネオス',0);gameState.players[0].sz=[kr];gameState.players[0].hand=[an];gameState.players[0].mz=[mk('ワイト',0,'up')];gameState.players[1].mz=[mk('ワイト',1,'up')];baselineA();
ok('A2: its controller has a monster — not activatable',strictScriptLegalityV2('金剛真力',0,'sz',0,{}).ok===false);

/* ===== B: ワーム・コール — a 「ワーム」 Reptile from the hand in face-down Defense ===== */
fresh();
let wc=mk('ワーム・コール',0,'up'),wx=mk('ワーム・ゼクス',0);gameState.players[0].sz=[wc];gameState.players[0].hand=[wx];gameState.players[1].mz=[mk('ワイト',1,'up')];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('B: ワーム・ゼクス special summoned face-down in Defense',z(wx)==='mz'&&C(wx).face==='down'&&C(wx).pos==='def');
audit('B');

/* ===== C: 機皇帝の賜与 — the field's face-up monsters are exactly two 「機皇」: draw 2; no Battle Phase this turn ===== */
fresh();
let gi=mk('機皇帝の賜与',0);gameState.players[0].hand=[gi];gameState.players[0].mz=[mk('機皇兵スキエル・アイン',0,'up'),mk('機皇兵スキエル・アイン',0,'up')];baselineA();
duelActivateFromHand(0);drive();
ok('C: 2 cards drawn; the Battle Phase is forbidden this turn',gameState.players[0].hand.length===2&&!!battlePhaseForbiddenV340(gameState));
audit('C');
fresh();
gi=mk('機皇帝の賜与',0);gameState.players[0].hand=[gi];gameState.players[0].mz=[mk('機皇兵スキエル・アイン',0,'up'),mk('機皇兵スキエル・アイン',0,'up')];gameState.players[1].mz=[mk('ワイト',1,'up')];baselineA();
ok('C2: a third face-up monster — not activatable',strictScriptLegalityV2('機皇帝の賜与',0,'hand',0,{}).ok===false);

/* ===== D: 獣神機王バルバロスUr — banish a Beast-Warrior and a Machine from hand / field / GY: special summoned; its battles deal the opponent no damage ===== */
fresh();
let ur=mk('獣神機王バルバロスUr',0),bw=mk('剣闘獣ラクエル',0),mc=mk('サイバー・ドラゴン',0);gameState.players[0].hand=[ur,bw];gameState.players[0].grave=[mc];baselineA();
PREFER=[bw.uid,mc.uid];runSummonProcedure('獣神機王バルバロスUr',0,'hand',0);if(!gameState.pendingSummon&&!pendingChoiceV49(gameState))finishSummonProcedure('獣神機王バルバロスUr',0,'hand',0,'atk');drive();PREFER=[];
ok('D: ラクエル (hand) and サイバー・ドラゴン (GY) banished; Ur special summoned',z(ur)==='mz'&&z(bw)==='banish'&&z(mc)==='banish',JSON.stringify({ur:z(ur),bw:z(bw),mc:z(mc),T:TOASTS.slice(-2)}));
audit('D');
fresh();
ur=mk('獣神機王バルバロスUr',0,'up');let ow=mk('ワイト',1,'up');gameState.players[0].mz=[ur];gameState.players[1].mz=[ow];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'main2'});drive();
ok('D2: ワイト destroyed, no battle damage to the opponent',z(ow)==='grave'&&lp(1)===8000);
fresh();
ur=mk('獣神機王バルバロスUr',0);gameState.players[0].hand=[ur,mk('剣闘獣ラクエル',0)];baselineA();
ok('D3: no Machine available — the procedure is not legal',strictSummonProcedureLegality('獣神機王バルバロスUr',0,'hand',0).ok===false);

/* ===== E: 魔法族の里 — Spellcasters only on its controller's side: the opponent cannot activate Spells; none on its side: its controller cannot ===== */
fresh();
let vl=mk('魔法族の里',0,'up'),bm=mk('ブラック・マジシャン',0,'up'),oc=mk('サイクロン',1),mc2=mk('サイクロン',0);
gameState.players[0].field=vl;gameState.players[0].mz=[bm];gameState.players[1].hand=[oc];gameState.players[0].hand=[mc2];baselineA();
ok('E: the opponent locked; its controller not',/魔法族の里/.test(lock(1,oc,'hand'))&&lock(0,mc2,'hand')==='');
fresh();
vl=mk('魔法族の里',0,'up');oc=mk('サイクロン',1);mc2=mk('サイクロン',0);
gameState.players[0].field=vl;gameState.players[0].mz=[mk('ワイト',0,'up')];gameState.players[1].hand=[oc];gameState.players[0].hand=[mc2];baselineA();
ok('E2: no Spellcaster on its side — its controller locked; the opponent not',/魔法族の里/.test(lock(0,mc2,'hand'))&&lock(1,oc,'hand')==='');
fresh();
vl=mk('魔法族の里',0,'up');oc=mk('サイクロン',1);gameState.players[0].field=vl;gameState.players[0].mz=[mk('ブラック・マジシャン',0,'up')];gameState.players[1].mz=[mk('ブラック・マジシャン',1,'up')];gameState.players[1].hand=[oc];baselineA();
ok('E3: both sides have Spellcasters — the opponent is not locked',lock(1,oc,'hand')==='');
`);
