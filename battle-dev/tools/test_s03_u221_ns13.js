/* S03-U221: NOT_STARTED → TESTED — 通行税 (engine: attackTaxS03), 真空イタチ (engine: the Spell / Trap activation flag), 白兵戦, 英雄変化－リフレクター・レイ,
   女王の選択, 侵略の手段, 野生の咆哮. Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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

/* ===== A: 通行税 — every attack costs its player 500 LP ===== */
fresh();
let tt=mk('通行税',1,'up'),at=mk('青眼の白龍',0,'up');gameState.players[1].sz=[tt];gameState.players[0].mz=[at];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('A: 500 LP paid at the declaration; 3000 damage',lp(0)===7500&&lp(1)===5000,JSON.stringify({lp0:lp(0),lp1:lp(1)}));
audit('A');
fresh();
tt=mk('通行税',1,'up');at=mk('青眼の白龍',0,'up');gameState.players[1].sz=[tt];gameState.players[0].mz=[at];gameState.players[0].lp=400;gameState.phase='battle';baselineA();
ok('A2: 400 LP — cannot declare an attack',!canDeclareAttackV48(C(at)));
fresh();
tt=mk('通行税',1,'down');at=mk('青眼の白龍',0,'up');gameState.players[1].sz=[tt];gameState.players[0].mz=[at];gameState.phase='battle';baselineA();
ok('A3: set face-down — no cost',attackLpCostS03(C(at))===0);

/* ===== B: 真空イタチ — flipped: the opponent cannot activate Spell / Trap cards this turn ===== */
fresh();
let vw=mk('真空イタチ',0,'down','def');vw.setTurn=4;let oc=mk('サイクロン',1,'down');oc.setTurn=4;let oh=mk('サイクロン',1);
gameState.players[0].mz=[vw];gameState.players[1].sz=[oc];gameState.players[1].hand=[oh];baselineA();
doFlipUp(0,'mz',0,'atk');drive();
ok('B: flipped — the opponent\'s set and hand Spells are locked; its controller\'s are not',/発動できません/.test(activationTypeLockReasonS03(1,C(oc),'sz',dbOf(oc),{}))&&/発動できません/.test(activationTypeLockReasonS03(1,C(oh),'hand',dbOf(oh),{}))&&activationTypeLockReasonS03(0,mk('サイクロン',0),'hand',dbOf(mk('サイクロン',0)),{})==='');
audit('B');
ok('B: the next turn it is gone',(function(){gameState.turn=6;return activationTypeLockReasonS03(1,C(oc),'sz',dbOf(oc),{})==='';})());

/* ===== C: 白兵戦 — its controller takes battle damage: 700 (+300 per 「白兵戦」 in its GY) ===== */
fresh();
let cc=mk('白兵戦',0,'down');cc.setTurn=4;at=mk('青眼の白龍',1,'up');
gameState.players[0].sz=[cc];gameState.players[0].grave=[mk('白兵戦',0)];gameState.players[1].mz=[at];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:'direct'});drive();
ok('C: 3000 battle damage taken → 700 + 300 × 1 = 1000 to the opponent',lp(0)===5000&&lp(1)===7000,JSON.stringify({lp0:lp(0),lp1:lp(1),TRIG}));
audit('C');

/* ===== D: 英雄変化－リフレクター・レイ — an own 「E・HERO」 Fusion Monster destroyed by battle: its Level × 300 ===== */
fresh();
let rr=mk('英雄変化－リフレクター・レイ',0,'down');rr.setTurn=4;let an=mk('E・HERO アクア・ネオス',0,'up');at=mk('青眼の白龍',1,'up');an.properlySummonedS03=true;
gameState.players[0].sz=[rr];gameState.players[0].mz=[an];gameState.players[1].mz=[at];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('D: アクア・ネオス (Level 7) destroyed → 2100 damage',z(an)==='grave'&&lp(1)===8000-2100,JSON.stringify({lp1:lp(1),TRIG}));
audit('D');

/* ===== E: 女王の選択 — an own 「アマゾネス」 destroys a monster by battle: a Level 4 or lower 「アマゾネス」 from the Deck ===== */
fresh();
let qc=mk('女王の選択',0,'down');qc.setTurn=4;let as=mk('アマゾネスの剣士',0,'up'),ar=mk('アマゾネスの射手',0),ow=mk('ワイト',1,'up');
gameState.players[0].sz=[qc];gameState.players[0].mz=[as];gameState.players[0].deck.push(ar);gameState.players[1].mz=[ow];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('E: アマゾネスの射手 special summoned from the Deck',z(ow)==='grave'&&z(ar)==='mz');
audit('E');

/* ===== F: 侵略の手段 — send an 「インヴェルズ」 from the Deck (cost): an own 「インヴェルズ」 +800 until the End Phase ===== */
fresh();
let im=mk('侵略の手段',0,'down');im.setTurn=4;let gk=mk('インヴェルズの門番',0,'up'),sc=mk('インヴェルズの斥候',0);
gameState.players[0].sz=[im];gameState.players[0].mz=[gk];gameState.players[0].deck.push(sc);baselineA();
const a0=curATK(C(gk));
duelActivateFromZone(0,'sz',0);drive();
ok('F: インヴェルズの斥候 sent from the Deck; 門番 +800',z(sc)==='grave'&&curATK(C(gk))===a0+800);
audit('F');

/* ===== G: 野生の咆哮 — face-up: an own monster destroys a monster by battle → 300 per own face-up Beast ===== */
fresh();
let wr=mk('野生の咆哮',0,'up'),wf=mk('オオカミ',0,'up'),wm=mk('ウィルミー',0,'up');ow=mk('ワイト',1,'up');
gameState.players[0].sz=[wr];gameState.players[0].mz=[wf,wm];gameState.players[1].mz=[ow];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('G: ワイト destroyed (900 battle damage) + 2 Beasts × 300',z(ow)==='grave'&&lp(1)===8000-900-600,JSON.stringify({lp1:lp(1),TRIG}));
audit('G');
fresh();
wr=mk('野生の咆哮',0,'down');wr.setTurn=4;wf=mk('オオカミ',0,'up');ow=mk('ワイト',1,'up');
gameState.players[0].sz=[wr];gameState.players[0].mz=[wf];gameState.players[1].mz=[ow];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('G2: set face-down — nothing',lp(1)===8000-900);
`);
