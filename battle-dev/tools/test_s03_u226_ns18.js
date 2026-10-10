/* S03-U226: NOT_STARTED → TESTED — 超伝導恐獣, 邪神機－獄炎, キングゴブリン, 究極恐獣, グランド・ドラゴン. Real DUEL paths, Replay-audited.
   Other cards named here are TESTED / GENERIC_OK. */
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

/* ===== A: 超伝導恐獣 — release a monster (cost): 1000 damage; it cannot attack this turn; once per turn ===== */
fresh();
let sd=mk('超伝導恐獣',0,'up'),wt=mk('ワイト',0,'up');gameState.players[0].mz=[sd,wt];baselineA();
PREFER=[wt.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('A: ワイト released; 1000 damage',z(wt)==='grave'&&lp(1)===7000);
ok('A: once per turn',strictScriptLegalityV2('超伝導恐獣',0,'mz',0,{}).ok===false);
phase('battle');
ok('A: it cannot declare an attack this turn',!canDeclareAttackV48(C(sd)));
audit('A');

/* ===== B: 邪神機－獄炎 — Normal Summoned without Tributes; at the End Phase it goes to the GY and its controller takes 2400 ===== */
fresh();
let gk=mk('邪神機－獄炎',0);gameState.players[0].hand=[gk];baselineA();
doNormalSummon(0,'atk');drive();
ok('B: summoned with no Tribute',z(gk)==='mz'&&C(gk).normalSummonMethod==='gokuen0');
phase('battle');phase('main2');phase('end');
ok('B: End Phase — sent to the GY; 2400 damage to its controller',z(gk)==='grave'&&lp(0)===5600,JSON.stringify({gk:z(gk),lp0:lp(0),TRIG}));
audit('B');
fresh();
gk=mk('邪神機－獄炎',0);gameState.players[0].hand=[gk];gameState.players[1].mz=[mk('ワイト',1,'up')];baselineA();
doNormalSummon(0,'atk');drive();phase('battle');phase('main2');phase('end');
ok('B2: another face-up Zombie on the field — nothing happens',z(gk)==='mz'&&lp(0)===8000);

/* ===== C: キングゴブリン — ATK / DEF = other face-up Fiends × 1000; not an attack target while its controller has another Fiend ===== */
fresh();
let kg=mk('キングゴブリン',0,'up'),f1=mk('シャドウナイトデーモン',0,'up'),f2=mk('ジェノサイドキングデーモン',1,'up');
gameState.players[0].mz=[kg,f1];gameState.players[1].mz=[f2];baselineA();
ok('C: two other Fiends — 2000 / 2000; not an attack target',curATK(C(kg))===2000&&curDEF(C(kg))===2000&&!!attackTargetForbiddenReasonS03(1,C(kg)));
fresh();
kg=mk('キングゴブリン',0,'up');f2=mk('ジェノサイドキングデーモン',1,'up');gameState.players[0].mz=[kg];gameState.players[1].mz=[f2];baselineA();
ok('C2: only the opponent\'s Fiend — 1000; it can be attacked',curATK(C(kg))===1000&&!attackTargetForbiddenReasonS03(1,C(kg)));

/* ===== D: 究極恐獣 — attacks every opponent monster once; while it can attack, its controller's other monsters cannot ===== */
fresh();
let ud=mk('究極恐獣',0,'up');wt=mk('ワイト',0,'up');let o1=mk('ワイト',1,'up'),o2=mk('ワイト',1,'up');
gameState.players[0].mz=[ud,wt];gameState.players[1].mz=[o1,o2];gameState.phase='battle';baselineA();
ok('D: ワイト cannot declare an attack while 究極恐獣 can',!canDeclareAttackV48(C(wt))&&canDeclareAttackV48(C(ud)));
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('D: both opponent monsters destroyed by 究極恐獣',z(o1)==='grave'&&z(o2)==='grave',JSON.stringify({o1:z(o1),o2:z(o2)}));
ok('D: after it can attack no more, ワイト can attack',!canDeclareAttackV48(C(ud))&&canDeclareAttackV48(C(wt)));
audit('D');

/* ===== E: グランド・ドラゴン — no Normal Summon while its controller has a monster; attacks only with another face-up Dragon ===== */
fresh();
let gd=mk('グランド・ドラゴン',0);gameState.players[0].hand=[gd];gameState.players[0].mz=[mk('ワイト',0,'up')];baselineA();
ok('E: with a monster on its field — no Normal Summon method; it can still be Set',!normalSummonMethodsFor(dbOf(gd),0,'summon').length&&normalSummonMethodsFor(dbOf(gd),0,'set').length>0);
fresh();
gd=mk('グランド・ドラゴン',0);gameState.players[0].hand=[gd];baselineA();
doNormalSummon(0,'atk');drive();
ok('E: with an empty field — Normal Summoned',z(gd)==='mz');
phase('battle');
ok('E: alone — cannot declare an attack',!canDeclareAttackV48(C(gd)));
audit('E');
fresh();
gd=mk('グランド・ドラゴン',0,'up');gameState.players[0].mz=[gd,mk('青眼の白龍',0,'up')];gameState.phase='battle';baselineA();
ok('E2: with another face-up Dragon — it can attack',canDeclareAttackV48(C(gd)));
`);
