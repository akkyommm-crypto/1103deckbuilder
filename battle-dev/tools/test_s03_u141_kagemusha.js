/* S03-U141: 六武衆の影武者 (ENGINE_GAP; fixed Six Samurai list x3) — redirect a targeting effect to itself during chain building
   (CHAIN_RETARGET_S03). Real DUEL path, Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<600;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function fresh(){resetA();gameState.activePlayer=1;gameState.turn=6;gameState.phase='main1';}
function responses(p){return getChainResponsesV2(p).map(x=>x.db.n);}
function answerTargets(){for(let i=0;i<5&&pc();i++)pick();}
`;

/* ===== A. the opponent's 月の書 targets 六武衆－イロウ → 影武者 takes the target ===== */
harness(COMMON+String.raw`
fresh();
const km=mk('六武衆の影武者',0,'up'),ir=mk('六武衆－イロウ',0,'up');gameState.players[0].mz=[km,ir];
const moon=mk('月の書',1);gameState.players[1].hand=[moon];
baselineA();
PREFER=[uid(ir)];duelActivateFromHand(0);answerTargets();PREFER=[];
ok('A: 影武者 is offered as a response',responses(0).indexOf('六武衆の影武者')>=0,JSON.stringify(responses(0)));
duelActivateResponseV2(0,'mz',0);drive();
ok('A: 月の書 resolves on 影武者 (face-down DEF); イロウ stays face-up',km.face==='down'&&km.pos==='def'&&ir.face==='up',JSON.stringify({km:[km.face,km.pos],ir:ir.face}));
ok('A: the log shows the redirection',gameState.log.some(l=>/対象を移し替えた/.test(l.msg)));
audit('A');
`);

/* ===== B. not offered: non-targeting effects, a non-「六武衆」 target, 影武者 itself as the target, a face-down 影武者 ===== */
harness(COMMON+String.raw`
fresh();
const km=mk('六武衆の影武者',0,'up'),ir=mk('六武衆－イロウ',0,'up'),wt=mk('ワイト',0,'up');gameState.players[0].mz=[km,ir,wt];
gameState.players[1].hand=[mk('月の書',1),mk('月の書',1),mk('サンダー・ボルト',1)];
baselineA();
PREFER=[uid(wt)];duelActivateFromHand(0);answerTargets();PREFER=[];
ok('B: 月の書 on ワイト (not 「六武衆」) → not offered',responses(0).indexOf('六武衆の影武者')<0,JSON.stringify(responses(0)));
drive();
PREFER=[uid(km)];duelActivateFromHand(0);answerTargets();PREFER=[];
ok('B: 月の書 on 影武者 itself → not offered',responses(0).indexOf('六武衆の影武者')<0);
drive();
duelActivateFromHand(0);
ok('B: サンダー・ボルト (no target) → not offered',responses(0).indexOf('六武衆の影武者')<0);
drive();
audit('B');
fresh();
const kd=mk('六武衆の影武者',0,'down');kd.pos='def';const ir2=mk('六武衆－イロウ',0,'up');gameState.players[0].mz=[kd,ir2];
gameState.players[1].hand=[mk('月の書',1)];
baselineA();
PREFER=[uid(ir2)];duelActivateFromHand(0);answerTargets();PREFER=[];
ok('B: a face-down 影武者 → not offered',responses(0).indexOf('六武衆の影武者')<0);
drive();
ok('B: … so 月の書 turns イロウ face-down',ir2.face==='down');
audit('B2');
`);
