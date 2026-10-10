/* S03-U70: fixes a real R1 hang found by an additional real-duel sweep (fixed fallback priority #6, after
   S03-U69 closed the previous priority #1 bug class with no further scope).
   Requirement: an R1 sweep of a fresh major-deck pair (Dark World vs Agent, seed 0x1, first player 1) hung
   past the harness's own 120s VM timeout (`Error: Script execution timed out after 120000ms`) — a genuine
   infinite loop in real DUEL-path play, not a driver artifact (confirmed by an instrumented trace showing
   `gameState.chain` growing without bound: 85, 86, 87, 88, 89... links, each topped by the same card).
   Root cause: getChainResponsesV2 (engine/30_processor_chain_battle.js)'s generic "declared quick-effect
   responder" scan iterates ['hand','grave','banish','mz'] and, for zone==='mz' specifically, skips the normal
   canActivateFromZone gate entirely (`if(!canActivateFromZone(db,z)&&z!=='mz') return;`) — an exemption meant
   for real on-field monster quick-effects (e.g. クレボンス negating an attack against itself). The scan never
   checked db.k, so a Spell/Trap card whose script happens to have quickEffect:true (needed for it to be a
   valid CHAIN response at all, e.g. 砂塵の大竜巻) is offered as a legal responder from mz with none of the
   real zone/timing safeguards a Trap normally gets from the P.sz branch (in particular the
   `c.setTurn===gameState.turn` same-turn-Set guard). In the reproduced duel, this let a Trap that should only
   ever be a valid responder from sz be repeatedly "activated" from mz, each activation opening a fresh chain
   link that itself became eligible to respond to (since nothing ever removed it from wherever the mz
   candidate list found it) — the chain never received two consecutive passes, so it never resolved, and grew
   forever. (How a Spell/Trap card ends up referenced from a player's mz array in the first place was not
   further traced within this unit's scope — see docs/S03_U70_REPORT.md Remaining.)
   Fix: for zone==='mz', additionally require db.k==='m' — a Spell/Trap card must never be offered as a
   chain-response candidate via the mz-zone exemption, regardless of how a reference to it ends up scanned
   there. Real on-field monster quick-effects (db.k==='m') are completely unaffected.
   Cards named here: クレボンス, くず鉄のかかし, ワイト (all already TESTED — chosen deliberately so this
   engine-dispatch-only test does not itself flip any card's status; it exercises the shared gatekeeper, not
   either card's own resolve() logic). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
function driveToPoint(){for(let i=0;i<200;i++){
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused)return 'point';
  if(pendingChoiceV49(gameState))return 'choice';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));return pkg;}

/* ===== A. real regression: a real attack declaration against a real, legitimate face-up monster
   quick-effect (クレボンス, on-field, negates the attack targeting it) is still correctly offered from mz —
   confirms the fix's db.k==='m' gate does not break the case the mz exemption exists for. ===== */
fresh();
const atk=mk('ワイト',0);const kreb=mk('クレボンス',1);
gameState.players[0].mz=[atk];gameState.players[1].mz=[kreb];
gameState.players[1].lp=8000;
gameState.activePlayer=0;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});
const rA=driveToPoint();
ok('A setup: the real attack declaration reaches a real POINT window',rA==='point',JSON.stringify(gameState.processorWaiting));
const respA=getChainResponsesV2(1);
ok('A: クレボンス (a real face-up monster quick-effect in mz) IS still correctly offered as a chain response',
  respA.some(r=>r.db.n==='クレボンス'&&r.zone==='mz'),JSON.stringify(respA.map(r=>r.db.n+'@'+r.zone)));
pointActivateV27(1,'mz',0,null);
for(let i=0;i<200;i++){if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}break;}
let pkg=audit('A クレボンス real attack negation');
ok('A: クレボンス really negates the attack for real (800 LP paid, no battle damage)',
  gameState.players[1].lp===7200&&zoneOf(kreb)==='mz',JSON.stringify({lp:gameState.players[1].lp,kreb:zoneOf(kreb)}));
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}

/* ===== B. the actual bug: a Trap card (くず鉄のかかし) that ends up referenced from a player's mz array is no
   longer offered as a chain-response candidate via the mz exemption (this is the exact shape the real R1 hang
   needed: a Spell/Trap found via the generic quickEffect scan's zone==='mz' branch, bypassing every normal
   Trap-activation safeguard). The fix's guard fires before condition()/legality are even consulted, so no
   pendingAttack setup is needed here — this isolates the dispatch-level bug from the card's own logic. ===== */
fresh();
const trap=mk('くず鉄のかかし',1);
gameState.players[1].mz=[trap];   /* simulates the corrupted/mis-scanned reference the real R1 hang exhibited */
gameState.activePlayer=0;gameState.phase='battle';baselineA();
const respB=getChainResponsesV2(1);
ok('B: a Trap card referenced from mz is NOT offered as a chain-response candidate (the actual fix)',
  !respB.some(r=>r.db.n==='くず鉄のかかし'),JSON.stringify(respB.map(r=>r.db.n+'@'+r.zone)));

/* ===== C. control: the same Trap, correctly Set in sz on an earlier turn, is still a legal responder from sz
   during a real attack-declare POINT window — confirms the fix does not disturb the normal, correct
   Trap-response path (real DUEL path, mirroring section A's attack setup but from the defender's side). ===== */
fresh();
const atk2=mk('ワイト',0);const dummy=mk('ワイト',1);
gameState.players[0].mz=[atk2];gameState.players[1].mz=[dummy];
const trap2=mk('くず鉄のかかし',1,'down');trap2.setTurn=gameState.turn-1;
gameState.players[1].sz=[trap2];
gameState.activePlayer=0;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});
const rC=driveToPoint();
ok('C setup: a real attack declaration against the defender reaches a real POINT window',rC==='point',JSON.stringify(gameState.processorWaiting));
const respC=getChainResponsesV2(1);
ok('C control: the same Trap, correctly Set in sz on an earlier turn, is still legally offered as a real chain response',
  respC.some(r=>r.db.n==='くず鉄のかかし'&&r.zone==='sz'),JSON.stringify(respC.map(r=>r.db.n+'@'+r.zone)));
pointActivateV27(1,'sz',0,null);
for(let i=0;i<200;i++){if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}break;}
audit('C くず鉄のかかし real attack negation');
ok('C: くず鉄のかかし really negates the attack for real (no battle damage, ends up Set again in sz)',
  gameState.players[0].lp===8000&&gameState.players[1].lp===8000&&zoneOf(trap2)==='sz',
  JSON.stringify({lp0:gameState.players[0].lp,lp1:gameState.players[1].lp,trap2:zoneOf(trap2)}));
`);
