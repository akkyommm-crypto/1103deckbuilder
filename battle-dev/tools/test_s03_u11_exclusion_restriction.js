/* S03-U11 C-S03-08 EXCLUSION_RESTRICTION (F5)
   Requirement: while 御前試合 / 群雄割拠 is face-up, the rules pass after every action (enforceExclusions) must work:
   a player whose face-up monsters have 2 or more Attributes (御前試合) / Types (群雄割拠) keeps one kind and sends the rest to the GY.
   Measured before the fix: activating either card threw `r.violations is not a function`, and because enforceExclusions()
   runs after every committed action outside battle, every later action threw while the card stayed face-up.
   Cause: the v49 unified redefinition keeps restriction {key, jp} only; the legacy exclusionViolations() called violations().
   Existing coverage stubbed enforceExclusions (tools/test_v460_native_cards.js), so this path never ran in tests.
   This test does NOT stub enforceExclusions. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;EXCLUSION_PENDING=false;EXCLUSION_RESOLVING=false;}
function drive(){for(let i=0;i<200;i++){
  if(EVT_V2_STATE||pendingChoiceV49(gameState))return EVT_V2_STATE?'evt':'choice';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function faceOf(c){const h=findCardByUid(c.uid);return h?h.card.face:null;}
function replay(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a));}
function tryRun(fn){try{fn();return null;}catch(e){return String(e&&e.message||e);}}
function scenario(cardName,key,keepValue){
  fresh();
  const trap=mk(cardName,0,'down');trap.setTurn=gameState.turn-1;
  const raioh=mk('ライオウ'),airman=mk('E・HERO エアーマン');
  gameState.players[0].sz=[trap];gameState.players[0].mz=[raioh,airman];baselineA();
  const errActivate=tryRun(()=>{duelActivateFromZone(0,'sz',0,{});drive();});
  ok(cardName+' activates from a set without an exception',errActivate===null&&faceOf(trap)==='up',errActivate||faceOf(trap));
  const v=exclusionViolations();
  ok(cardName+' reports the violation for the player with 2 kinds ('+key+')',v.length===1&&v[0].player===0&&v[0].script===cardName&&v[0].kinds.length===2,JSON.stringify(v.map(x=>({p:x.player,kinds:x.kinds}))));
  const errAfter=tryRun(()=>{requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();});
  ok(cardName+': the next committed action runs the rules pass without an exception',errAfter===null,errAfter);
  return {trap,raioh,airman};
}
`;

harness(COMMON+String.raw`
/* ===== 御前試合: Attributes ===== */
let s=scenario('御前試合','at');
fresh();
s=(function(){
  const trap=mk('御前試合',0,'down');trap.setTurn=gameState.turn-1;
  const raioh=mk('ライオウ'),airman=mk('E・HERO エアーマン');
  gameState.players[0].sz=[trap];gameState.players[0].mz=[raioh,airman];baselineA();
  duelActivateFromZone(0,'sz',0,{});drive();
  return {trap,raioh,airman};
})();
const keepAttr=dbOf(s.raioh).at;
__exclPick(0,'at',keepAttr);
ok('御前試合: keeping ライオウ\'s Attribute sends the other-Attribute monster to the GY',zoneOf(s.raioh)==='mz'&&zoneOf(s.airman)==='grave',JSON.stringify({raioh:zoneOf(s.raioh),airman:zoneOf(s.airman)}));
ok('御前試合: no violation remains',exclusionViolations().length===0);
replay('御前試合 enforcement');

/* ===== 群雄割拠: Types ===== */
scenario('群雄割拠','ra');
fresh();
const t=mk('群雄割拠',0,'down');t.setTurn=gameState.turn-1;const r2=mk('ライオウ'),a2=mk('E・HERO エアーマン');
gameState.players[0].sz=[t];gameState.players[0].mz=[r2,a2];baselineA();
duelActivateFromZone(0,'sz',0,{});drive();
__exclPick(0,'ra',dbOf(a2).ra);
ok('群雄割拠: keeping エアーマン\'s Type sends the other-Type monster to the GY',zoneOf(a2)==='mz'&&zoneOf(r2)==='grave',JSON.stringify({raioh:zoneOf(r2),airman:zoneOf(a2)}));
replay('群雄割拠 enforcement');

/* ===== control: one kind only → no violation ===== */
fresh();
const g=mk('御前試合',0,'down');g.setTurn=gameState.turn-1;const only=mk('ライオウ');
gameState.players[0].sz=[g];gameState.players[0].mz=[only];baselineA();
duelActivateFromZone(0,'sz',0,{});drive();
ok('control: a single Attribute is not a violation',faceOf(g)==='up'&&exclusionViolations().length===0&&zoneOf(only)==='mz');
`);
