/* S03-U225: NOT_STARTED → TESTED — 猛毒の風, 電池メン－単一型, 氷結界の術者, 氷結界の守護陣, 蜃気楼の筒, ジャンク・ブレーダー, グレイヴ・オージャ.
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
function toPoint(kind){for(let i=0;i<80;i++){
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind===kind)return true;
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function lp(p){return gameState.players[p].lp;}
function ssr(p,name){return v46SpecialSummonRestrictionReason(p,dbOf(mk(name,p)));}
function forb(p,c){return !!attackTargetForbiddenReasonS03(p,C(c));}

/* ===== A: 猛毒の風 — no WIND special summons; face-up WIND monsters -500 ATK ===== */
fresh();
let pw=mk('猛毒の風',0,'up'),am=mk('E・HERO エアーマン',1,'up'),bm=mk('青眼の白龍',1,'up');
gameState.players[0].sz=[pw];gameState.players[1].mz=[am,bm];baselineA();
ok('A: エアーマン (WIND) 1300; 青眼 unchanged',curATK(C(am))===1300&&curATK(C(bm))===3000);
ok('A: WIND locked for both players; LIGHT not',!!ssr(0,'E・HERO エアーマン')&&!!ssr(1,'E・HERO エアーマン')&&ssr(0,'青眼の白龍')==='');
fresh();
gameState.players[0].sz=[mk('猛毒の風',0,'down')];am=mk('E・HERO エアーマン',1,'up');gameState.players[1].mz=[am];baselineA();
ok('A2: set face-down — nothing',curATK(C(am))===1800&&ssr(0,'E・HERO エアーマン')==='');

/* ===== B: 電池メン－単一型 — the opponent cannot target its controller's other Thunder monsters ===== */
fresh();
let bt=mk('電池メン－単一型',0,'up'),vt=mk('E・HERO ボルテック',0,'up'),b2=mk('電池メン－単一型',0,'up');let wt=mk('ワイト',0,'up');
gameState.players[0].mz=[bt,vt,b2,wt];baselineA();
ok('B: ボルテック protected; the 単一型 copies and ワイト not',forb(1,vt)&&!forb(1,bt)&&!forb(1,b2)&&!forb(1,wt));

/* ===== C: 氷結界の術者 — with another 「氷結界」, Level 4 or higher monsters cannot declare attacks ===== */
fresh();
let ju=mk('氷結界の術者',0,'up'),ib=mk('氷結界の修験者',0,'up'),be=mk('青眼の白龍',1,'up'),w1=mk('ワイト',1,'up');
gameState.players[0].mz=[ju,ib];gameState.players[1].mz=[be,w1];gameState.activePlayer=1;gameState.phase='battle';baselineA();
ok('C: 青眼 (8) cannot attack; ワイト (1) can; its own 修験者 (4) cannot',!canDeclareAttackV48(C(be))&&canDeclareAttackV48(C(w1))&&!canDeclareAttackV48(C(ib)));
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('C: 青眼\'s attack request is refused',z(ju)==='mz'&&z(ib)==='mz'&&lp(0)===8000);
fresh();
ju=mk('氷結界の術者',0,'up');be=mk('青眼の白龍',1,'up');gameState.players[0].mz=[ju];gameState.players[1].mz=[be];gameState.activePlayer=1;gameState.phase='battle';baselineA();
ok('C2: no other 「氷結界」 — 青眼 can attack',canDeclareAttackV48(C(be)));

/* ===== D: 氷結界の守護陣 — with another 「氷結界」, opponent monsters with ATK ≥ its DEF cannot declare attacks ===== */
fresh();
let gj=mk('氷結界の守護陣',0,'up');ib=mk('氷結界の修験者',0,'up');be=mk('青眼の白龍',1,'up');w1=mk('ワイト',1,'up');
gameState.players[0].mz=[gj,ib];gameState.players[1].mz=[be,w1];gameState.activePlayer=1;gameState.phase='battle';baselineA();
ok('D: 青眼 (ATK ≥ DEF) cannot attack; ワイト can',!canDeclareAttackV48(C(be))&&canDeclareAttackV48(C(w1)),JSON.stringify({def:curDEF(C(gj))}));

/* ===== E: 蜃気楼の筒 — its controller's face-up monster chosen as an attack target: 1000 damage ===== */
fresh();
let mt=mk('蜃気楼の筒',0,'down');mt.setTurn=4;wt=mk('ワイト',0,'up');let at=mk('青眼の白龍',1,'up');
gameState.players[0].sz=[mt];gameState.players[0].mz=[wt];gameState.players[1].mz=[at];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});
const pE=toPoint('attackDeclare');const offE=pE&&(getChainResponsesV2(0)||[]).some(r=>r.card===C(mt));
if(offE)pointActivateV27(0,'sz',0);drive();
ok('E: activated at the attack declaration → 1000 damage to the opponent',offE&&lp(1)===7000&&z(mt)==='grave',JSON.stringify({offE,lp1:lp(1)}));
audit('E');
fresh();
mt=mk('蜃気楼の筒',0);gameState.players[0].hand=[mt];baselineA();
ok('E2: not activatable from the hand',strictScriptLegalityV2('蜃気楼の筒',0,'hand',0,{}).ok===false);

/* ===== F: ジャンク・ブレーダー — banish a 「ジャンク」 from the GY (cost): +400 until the End Phase ===== */
fresh();
let jb=mk('ジャンク・ブレーダー',0,'up'),js=mk('ジャンク・シンクロン',0);gameState.players[0].mz=[jb];gameState.players[0].grave=[js];baselineA();
const aF=curATK(C(jb));
duelActivateFromZone(0,'mz',0);drive();
ok('F: ジャンク・シンクロン banished; +400',z(js)==='banish'&&curATK(C(jb))===aF+400);
audit('F');

/* ===== G: グレイヴ・オージャ — not an attack target while a face-down Defense monster is on its side; own Flip Summons: 300 damage ===== */
fresh();
let go=mk('グレイヴ・オージャ',0,'up'),fd=mk('ワイト',0,'down','def');fd.setTurn=4;
gameState.players[0].mz=[go,fd];baselineA();
ok('G: protected while the face-down monster is there',forb(1,go));
doFlipUp(0,'mz',1,'atk');drive();
ok('G: the Flip Summon → 300 damage; no longer protected',lp(1)===7700&&!forb(1,go),JSON.stringify({lp1:lp(1),TRIG}));
audit('G');
/* ===== H: the onOtherFlipS03 opt-in also completes アテナ (S03-U212) ②: another Fairy Flip Summoned → 600 damage ===== */
fresh();
let an=mk('アテナ',0,'up'),se=mk('シャインエンジェル',0,'down','def');se.setTurn=4;gameState.players[0].mz=[an,se];baselineA();
doFlipUp(0,'mz',1,'atk');drive();
ok('H: シャインエンジェル Flip Summoned → アテナ deals 600',lp(1)===7400,JSON.stringify({lp1:lp(1),TRIG}));
audit('H');
fresh();
an=mk('アテナ',0,'up');let wd=mk('ワイト',0,'down','def');wd.setTurn=4;gameState.players[0].mz=[an,wd];baselineA();
doFlipUp(0,'mz',1,'atk');drive();
ok('H2: a non-Fairy Flip Summoned — no damage',lp(1)===8000);
`);
