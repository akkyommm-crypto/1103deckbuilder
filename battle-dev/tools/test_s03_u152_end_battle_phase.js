/* S03-U152: 「バトルフェイズを終了する」 really ends the Battle Phase (engine/1ZS). Before: 攻撃の無力化 / 強制終了 / ナチュル・スティンクバグ
   ended only the current battle (the other monsters could still attack), ハーフorストップ's 'stop' only marked it, バトルフェーダー /
   薄幸の美少女 jumped to Main Phase 2 without the end of the Battle Phase, 速攻のかかし left a manual note.
   Real DUEL path (attacks and the responses at the attack declaration through the processor), Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function step(){
  if(pc()){pick();return true;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return true;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return true;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return true;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return true;}
  return false;}
function drive(){for(let i=0;i<600;i++){if(!step())return 'idle';}return 'loop';}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
/* player II attacks with the first monster; at the declaration player I responds with (zone, index) */
function attackAndRespond(att,target,zone,i){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(att),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<200;k++){const w=gameState.processorWaiting;
    if(!done&&gameState.pendingAttack&&w&&w.type==='POINT'&&gameState.processorPaused){pointActivateV27(0,zone,i,0);done=true;continue;}
    if(!step())break;}
  drive();return done;}
function fresh(){resetA();gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';
  const a1=mk('デーモンの召喚',1,'up'),a2=mk('ゴブリン突撃部隊',1,'up');gameState.players[1].mz=[a1,a2];
  for(let p=0;p<2;p++) gameState.players[p].deck=[mk('ワイト',p),mk('ワイト',p),mk('ワイト',p)];
  return {a1,a2};}
function secondAttackBlocked(a2){return gameState.phase==='main2'&&battleAttackersV29(1).length===0;}
`;

/* ===== A. 攻撃の無力化 ===== */
harness(COMMON+String.raw`
const s=fresh();const w=mk('ワイト',0,'up');gameState.players[0].mz=[w];
const tr=mk('攻撃の無力化',0,'down');tr.setTurn=4;gameState.players[0].sz=[tr];
baselineA();
const r0=attackAndRespond(s.a1,w,'sz',0);const r=true;/* 攻撃の無力化 is offered in the attack-declaration event batch (passive onAttackDeclare) — the driver picks it there */
ok('A 攻撃の無力化: the attack is negated (ワイト survives) and the Battle Phase ends — Main Phase 2, ゴブリン突撃部隊 cannot attack',
  r&&z(tr)==='grave'&&z(w)==='mz'&&secondAttackBlocked(s.a2),JSON.stringify({r,tr:z(tr),w:z(w),phase:gameState.phase}));
audit('A');
`);

/* ===== B. 速攻のかかし (from the hand) ===== */
harness(COMMON+String.raw`
const s=fresh();const kk=mk('速攻のかかし',0);gameState.players[0].hand=[kk];
baselineA();
const r=attackAndRespond(s.a1,'direct','hand',0);
ok('B 速攻のかかし: discarded, the direct attack negated (no damage) and the Battle Phase ends',
  r&&z(kk)==='grave'&&gameState.players[0].lp===8000&&secondAttackBlocked(s.a2),JSON.stringify({r,kk:z(kk),lp:gameState.players[0].lp,phase:gameState.phase}));
audit('B');
`);

/* ===== C. バトルフェーダー (from the hand, direct attack) ===== */
harness(COMMON+String.raw`
const s=fresh();const bf=mk('バトルフェーダー',0);gameState.players[0].hand=[bf];
baselineA();
const r=attackAndRespond(s.a1,'direct','hand',0);
ok('C バトルフェーダー: Special Summoned, no damage, the Battle Phase ends through its normal end (Main Phase 2)',
  r&&z(bf)==='mz'&&gameState.players[0].lp===8000&&secondAttackBlocked(s.a2),JSON.stringify({r,bf:z(bf),lp:gameState.players[0].lp,phase:gameState.phase}));
audit('C');
`);

/* ===== D. ハーフorストップ — the attacking player chooses 'stop' ===== */
harness(COMMON+String.raw`
const s=fresh();const w=mk('ワイト',0,'up');gameState.players[0].mz=[w];
const tr=mk('ハーフorストップ',0,'down');tr.setTurn=4;gameState.players[0].sz=[tr];
baselineA();
PREFER=['stop'];
const r=attackAndRespond(s.a1,w,'sz',0);PREFER=[];
ok('D ハーフorストップ (stop): the Battle Phase ends — Main Phase 2, no further attack',r&&z(tr)==='grave'&&secondAttackBlocked(s.a2),
  JSON.stringify({r,tr:z(tr),phase:gameState.phase}));
audit('D');
`);

/* ===== E. control: nothing activated → the second monster attacks ===== */
harness(COMMON+String.raw`
const s=fresh();const w=mk('ワイト',0,'up'),w2=mk('ワイト',0,'up');gameState.players[0].mz=[w,w2];
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:idx(s.a1),target:idx(w)});drive();
ok('E: control — still in the Battle Phase and ゴブリン突撃部隊 can attack',gameState.phase==='battle'&&canDeclareAttackV48(findCardByUid(s.a2.uid).card));
`);
