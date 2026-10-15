/* CODEX-C10 — open-game phase-end priority windows.
   A phase transition requested by the turn player must first give both players
   the chance to use legal Spell Speed 2 effects.  The same applies before the
   End Phase commits the turn.  Real DUEL activation and Replay/save paths. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function uid(c){return ensureCardUid(gameState,c);}
function zone(c){const h=findCardByUid(uid(c));return h?h.zone:null;}
function point(){const w=gameState.processorWaiting;return w&&w.type==='POINT'&&gameState.processorPaused?w:null;}
function pointKind(){const w=point();return w&&w.payload&&w.payload.kind;}
function pickUid(c){const q=pc(),i=q?q.candidates.findIndex(x=>x.uid===uid(c)):-1;if(i<0)return false;__choicePickV49(i);return true;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(active,phase){resetA();gameState.activePlayer=active;gameState.turn=9;gameState.phase=phase||'main1';gameState.rngInitialSeed=gameState.rngState=0xc10a11;}
function drive(stopAtPhaseEnd){for(let i=0;i<900;i++){
  if(pc())return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=point();if(w){if(stopAtPhaseEnd&&pointKind()==='phaseEnd')return 'phaseEnd';pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';
}return 'loop';}
`;

/* A. Reproduces the user report through the actual phase button path: P2 tries
   to leave Main Phase 1, then P1 activates its previously Set Safe Zone. */
harness(COMMON+String.raw`
fresh(1,'main1');
const safe=mk('安全地帯',0,'down'),target=mk('ワイト',0,'up','atk');safe.setTurn=7;
gameState.players[0].sz=[safe];gameState.players[0].mz=[target];baselineA();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});
const w=point(), offered=(getChainResponsesV2(0)||[]).map(x=>x.db.n);
ok('A: before leaving the opponent Main Phase, P1 receives a phaseEnd POINT while the phase is still main1',
  !!w&&pointKind()==='phaseEnd'&&w.payload.phase==='main1'&&w.payload.priority===0&&gameState.phase==='main1',JSON.stringify({kind:pointKind(),payload:w&&w.payload,phase:gameState.phase}));
ok('A: 安全地帯 is offered from that real opponent-turn priority window',offered.includes('安全地帯'),JSON.stringify(offered));
if(w)pointActivateV27(0,'sz',0);if(pc())pickUid(target);drive(false);
ok('A: 安全地帯 resolves, then the requested transition continues into the Battle Phase',zone(safe)==='sz'&&safe.face==='up'&&linkWatchesV9(safe,uid(target))&&gameState.phase==='battle',JSON.stringify({safe:zone(safe),phase:gameState.phase,toasts:TOASTS}));
audit('A');
`);

/* B. Negative control: no legal fast effect means no visible pause and the
   same phase transition completes normally. */
harness(COMMON+String.raw`
fresh(1,'standby');baselineA();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'main1'});const r=drive(false);
ok('B: an empty phase-end window auto-passes and does not block normal phase flow',r==='idle'&&gameState.phase==='main1'&&!gameState.processorPaused&&!point(),JSON.stringify({r,phase:gameState.phase,paused:gameState.processorPaused}));
audit('B');
`);

/* C. End Phase uses the TURN processor rather than PHASE.  The opponent still
   gets one last open-game window before hand limit / turn-end processing. */
harness(COMMON+String.raw`
fresh(1,'end');
const safe=mk('安全地帯',0,'down'),target=mk('ワイト',0,'up','atk');safe.setTurn=7;
gameState.players[0].sz=[safe];gameState.players[0].mz=[target];baselineA();
requestProcessorV27(PROCESSOR_V27.TURN,{});const w=point();
ok('C: ending the opponent turn pauses at an End Phase priority window for P1',!!w&&pointKind()==='phaseEnd'&&w.payload.phase==='end'&&w.payload.priority===0&&gameState.activePlayer===1,JSON.stringify({kind:pointKind(),payload:w&&w.payload,active:gameState.activePlayer}));
if(w)pointActivateV27(0,'sz',0);if(pc())pickUid(target);drive(false);
ok('C: the End Phase activation resolves before the turn changes',zone(safe)==='sz'&&linkWatchesV9(safe,uid(target))&&gameState.activePlayer===0&&gameState.turn===10,JSON.stringify({safe:zone(safe),active:gameState.activePlayer,turn:gameState.turn}));
audit('C');
`);

/* D. A save taken at the new window restores both the POINT and its queued
   phase-transition continuation. */
const saved=harness(COMMON+String.raw`
fresh(1,'main1');
const safe=mk('安全地帯',0,'down'),target=mk('ワイト',0,'up','atk');safe.setTurn=7;
gameState.players[0].sz=[safe];gameState.players[0].mz=[target];baselineA();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});
ok('D1: save point is the phaseEnd priority window',pointKind()==='phaseEnd');
saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);
`);
if(!saved.__RAW){console.log('FAIL D1 did not create a save');process.exitCode=2;}
else harness('const RAW='+JSON.stringify(saved.__RAW)+';'+COMMON+String.raw`
resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);const resumed=offerResumeDuel();
ok('D2: resume restores the same phaseEnd POINT',resumed&&pointKind()==='phaseEnd'&&gameState.phase==='main1',JSON.stringify({resumed,kind:pointKind(),phase:gameState.phase}));
const r=drive(false);
ok('D2: passing the restored window executes its saved phase continuation',r==='idle'&&gameState.phase==='battle'&&!gameState.processorPaused,JSON.stringify({r,phase:gameState.phase,paused:gameState.processorPaused}));
audit('D2');
`);
