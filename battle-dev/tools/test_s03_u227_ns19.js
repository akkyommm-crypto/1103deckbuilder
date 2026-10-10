/* S03-U227: NOT_STARTED → TESTED — 暴君の暴飲暴食 (engine: selfDestroyWhenS03), ハンター・アウル, 切り込み隊長, 夜薔薇の騎士, フェアリー・アーチャー,
   ソニックジャマー (engine: the Spell lock until a turn), アマゾネスの剣士. Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
function ssr(p,name){return v46SpecialSummonRestrictionReason(p,dbOf(mk(name,p)));}
function forb(p,c){return !!attackTargetForbiddenReasonS03(p,C(c));}

/* ===== A: 暴君の暴飲暴食 — release (cost); no Level 6+ special summons; destroyed while its controller holds 3 or more cards ===== */
fresh();
let tg=mk('暴君の暴飲暴食',0,'down');tg.setTurn=4;let wt=mk('ワイト',0,'up');gameState.players[0].sz=[tg];gameState.players[0].mz=[wt];gameState.players[0].hand=[mk('ワイト',0)];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('A: ワイト released; face-up; Level 8 locked for both, Level 1 and an Xyz not',z(wt)==='grave'&&z(tg)==='sz'&&C(tg).face==='up'&&!!ssr(0,'青眼の白龍')&&!!ssr(1,'青眼の白龍')&&ssr(0,'ワイト')===''&&ssr(0,'No.39 希望皇ホープ')==='');
act({type:'DRAW',player:0,n:2});
ok('A: its controller now holds 3 cards — destroyed',z(tg)==='grave'&&gameState.players[0].hand.length===3);
audit('A');

/* ===== B: ハンター・アウル — +500 per own face-up WIND monster; not an attack target while another WIND is on its side ===== */
fresh();
let ow=mk('ハンター・アウル',0,'up'),am=mk('E・HERO エアーマン',0,'up');gameState.players[0].mz=[ow,am];baselineA();
ok('B: two WIND → 2000; protected',curATK(C(ow))===2000&&forb(1,ow));
fresh();
ow=mk('ハンター・アウル',0,'up');gameState.players[0].mz=[ow];baselineA();
ok('B2: alone → 1500; attackable',curATK(C(ow))===1500&&!forb(1,ow));

/* ===== C: 切り込み隊長 — Normal Summoned: a Level 4 or lower monster from the hand; other Warriors are not attack targets ===== */
fresh();
let cp=mk('切り込み隊長',0),cl=mk('E・HERO クレイマン',0);gameState.players[0].hand=[cp,cl];baselineA();
doNormalSummon(0,'atk');drive();
ok('C: クレイマン special summoned from the hand',z(cp)==='mz'&&z(cl)==='mz');
ok('C: クレイマン (Warrior) protected; 切り込み隊長 itself not',forb(1,cl)&&!forb(1,cp));
audit('C');

/* ===== D: 夜薔薇の騎士 — Normal Summoned: a Level 4 or lower Plant from the hand; Plants are not attack targets ===== */
fresh();
let nr=mk('夜薔薇の騎士',0),kn=mk('E・HERO クノスペ',0),wt2=mk('ワイト',0);gameState.players[0].hand=[nr,kn,wt2];baselineA();
PREFER=[kn.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('D: クノスペ special summoned; ワイト (not a Plant) stays',z(kn)==='mz'&&z(wt2)==='hand');
ok('D: クノスペ protected; the knight (Warrior) not',forb(1,kn)&&!forb(1,nr));
audit('D');

/* ===== E: フェアリー・アーチャー — 400 per own face-up LIGHT; once per turn; it cannot attack that turn ===== */
fresh();
let fa=mk('フェアリー・アーチャー',0,'up'),be=mk('青眼の白龍',0,'up');gameState.players[0].mz=[fa,be];baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('E: two LIGHT → 800 damage; once per turn',lp(1)===7200&&strictScriptLegalityV2('フェアリー・アーチャー',0,'mz',0,{}).ok===false);
phase('battle');
ok('E: it cannot attack this turn; 青眼 can',!canDeclareAttackV48(C(fa))&&canDeclareAttackV48(C(be)));
audit('E');

/* ===== F: ソニックジャマー — flipped: the opponent cannot activate Spell cards until the end of the next turn ===== */
fresh();
let sj=mk('ソニックジャマー',0,'down','def');sj.setTurn=4;let oc=mk('サイクロン',1);gameState.players[0].mz=[sj];gameState.players[1].hand=[oc];baselineA();
doFlipUp(0,'mz',0,'atk');drive();
const lk=()=>activationTypeLockReasonS03(1,C(oc),'hand',dbOf(oc),{});
ok('F: this turn and the next the opponent\'s Spell is locked; the turn after, not',!!lk()&&(function(){gameState.turn=6;const a=!!lk();gameState.turn=7;const b=lk()==='';gameState.turn=5;return a&&b;})());
ok('F: its controller is not locked',activationTypeLockReasonS03(0,mk('サイクロン',0),'hand',dbOf(mk('サイクロン',0)),{})==='');
audit('F');

/* ===== G: アマゾネスの剣士 — battle damage to its controller from its battles goes to the opponent ===== */
fresh();
let as=mk('アマゾネスの剣士',0,'up'),at=mk('青眼の白龍',1,'up');gameState.players[0].mz=[as];gameState.players[1].mz=[at];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('G: 青眼 attacks — the 1500 damage goes to the opponent',z(as)==='grave'&&lp(0)===8000&&lp(1)===6500,JSON.stringify({lp0:lp(0),lp1:lp(1)}));
audit('G');
fresh();
as=mk('アマゾネスの剣士',0,'up');let ow2=mk('ワイト',1,'up');gameState.players[0].mz=[as];gameState.players[1].mz=[ow2];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('G2: damage it inflicts is unchanged (1200 to the opponent)',lp(1)===6800&&lp(0)===8000);
`);
