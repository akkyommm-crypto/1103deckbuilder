/* S03-U69: fixes a systemic registerScheduleHandler callback-signature bug found while building S03-U68.
   Requirement: runDueSchedulesV7 (engine/16_scheduler_v7.js) calls each handler as
   fn(Object.assign({}, e.args||{}), e) — the FIRST parameter is the already-unwrapped args object; the
   SECOND is the full schedule entry. 34 registrations across 12 files (A8_auto_cycle06.js,
   A9_auto_cycle07.js, B1_auto_cycle09.js, B3_auto_cycle11.js through B8_auto_cycle16.js,
   C0_auto_cycle18.js through C2_auto_cycle20.js) were shaped `(entry) => { ...entry.args.X... }` — since
   the real invocation's first parameter (bound to `entry`) IS ALREADY the unwrapped args, `entry.args` is
   always undefined, so every one of these silently no-ops: no error, no journal entry, no visible symptom
   other than "the scheduled effect just never happens." Fixed by removing the redundant `.args` indirection
   (`entry.args.X` -> `entry.X`, and the now-meaningless `entry.args &&` guard clause removed).
   8 pre-existing test files (test_auto_cycle12/13/14/15/16/18/19/20.js) called the affected handlers
   directly with the OLD (also-wrong) convention `scheduleHandlerV7(name)(entry)` — which happened to line up
   with the bug (both wrong in the same way, so they cancelled out and the tests passed without ever
   exercising the real invocation shape). Updated all 22 call sites to
   `scheduleHandlerV7(name)(entry.args||{}, entry)`, matching runDueSchedulesV7's real signature; all 8 files
   still pass after the update, confirming the underlying card logic was already correct — only the
   parameter-unwrapping plumbing was broken.
   This test adds real-DUEL-path, full-processor-driven confirmation (real battle destruction, a real
   PROCESSOR_V27.PHASE transition, the scheduler firing through its real production call path — not a direct
   handler invocation) for two representative fixed cards spanning different files and different schedule
   timings (endPhase vs standbyPhase): ファイターズ・エイプ and カース・オブ・ヴァンパイア.
   Cards named here: ワイト (GENERIC_OK). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function settle(){for(let k=0;k<30;k++){const r=drive();if(r==='evt'){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank];if(g&&g.length)eventPickV2(0);else eventSkipGroupV2();continue;}if(r==='choice'){__choicePickV49(0);continue;}return r;}return 'loop';}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));return pkg;}
function attack(atkP,atkIdx,targetIdx){gameState.activePlayer=atkP;gameState.phase='battle';baselineA();requestProcessorV27(PROCESSOR_V27.ATTACK,{player:atkP,atkIdx,target:targetIdx});settle();}

/* ===== A. ファイターズ・エイプ: real battle destroy -> real ATK+300 -> a real, journaled End Phase
   transition correctly fires the (fixed) scheduled reset-if-not-attacked check. ===== */
fresh();
const ape=mk('ファイターズ・エイプ',0);gameState.players[0].mz=[ape];
const w=mk('ワイト',1);gameState.players[1].mz=[w];
attack(0,0,0);
ok('A: the real attack destroys ワイト by battle',zoneOf(w)==='grave',JSON.stringify({zone:zoneOf(w)}));
ok('A: ファイターズ・エイプ real ATK is boosted by 300 for real',curATK(ape)===2200,'atk='+curATK(ape));
ok('A setup: a real endPhase schedule entry now exists for it (this is what silently never fired before the fix)',
  (gameState.scheduledV7||[]).some(e=>e&&e.handler==='c7.fightersApe'&&e.args&&e.args.uid===ape.uid),
  JSON.stringify(gameState.scheduledV7));
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});
settle();
let pkg=audit('A ファイターズ・エイプ real End Phase reset');
ok('A: at the real, journaled End Phase (ファイターズ・エイプ did not attack again this turn), its ATK resets back to 2200-300=1900 for real',
  curATK(ape)===1900,'atk='+curATK(ape));

/* ===== B. カース・オブ・ヴァンパイア: real battle destroy -> pays 500 LP -> reserves for its own next
   Standby Phase -> firing the reservation through the real production call path (runDueSchedulesV7, not a
   direct handler call) Special Summons it from the GY for real. ===== */
fresh();
const cv=mk('カース・オブ・ヴァンパイア',0);gameState.players[0].mz=[cv];
const bey=mk('青眼の白龍',1);gameState.players[1].mz=[bey];
gameState.players[0].lp=8000;
attack(1,0,0);
ok('B: the real attack by 青眼の白龍 destroys カース・オブ・ヴァンパイア by battle',
  zoneOf(cv)==='grave',JSON.stringify({cv:zoneOf(cv)}));
ok('B: 500 LP plus the 1000 real battle damage (3000atk vs 2000atk) is paid for real, and a standbyPhase schedule entry now exists for its own next Standby Phase (previously silently never fired)',
  gameState.players[0].lp===6500&&(gameState.scheduledV7||[]).some(e=>e&&e.handler==='c1.curseVampire'),
  JSON.stringify({lp:gameState.players[0].lp,sched:gameState.scheduledV7}));
gameState.players[0].mz=[];
gameState.turn=6; /* advance to the scheduled entry's absolute turn (its own next Standby Phase); this direct
  turn mutation (like a direct gameState.phase mutation) is not itself journaled, so no Replay audit is taken
  across this specific step -- part A already covers the fully real, journaled, Replay-audited path via a
  real PROCESSOR_V27.PHASE transition. */
runDueSchedulesV7('standbyPhase',gameState);
ok('B: firing the reservation through the real runDueSchedulesV7 production call path Special Summons it from the GY for real',
  gameState.players[0].mz.some(c=>nm(c)==='カース・オブ・ヴァンパイア'),
  JSON.stringify({mz:gameState.players[0].mz.map(nm)}));
`);
