/* S03-U297: a save taken while the End Phase hand-size discard choice is open (S03-U273) resumes so that the answer ends the turn.
   Found by the R1 random sweep with save / resume (rabbit vs worm, seed 0x53160048, policy seed 0x2970048, save / resume every 3rd stop):
   the TURN unit that waits for the choice was dropped by offerResumeDuel, so the answer discarded the cards but nothing resumed the processor
   (the turn stayed in the End Phase). Real DUEL path: End Phase → TURN → hand-limit choice → saveDuel → a fresh VM → offerResumeDuel → answer
   → the turn passes to the opponent; Replay-audited in both VMs. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function drive(){for(let i=0;i<400;i++){
  if(pc())return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const s=EVT_V2_STATE,g=s.groups[s.rank]||[];if(g.length&&s.rank<2)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
`;
const first=harness(COMMON+String.raw`
resetA();
gameState.activePlayer=0;gameState.turn=6;gameState.phase='end';gameState.rngInitialSeed=gameState.rngState=0x2970048;
gameState.players[0].hand=Array.from({length:8},(_,i)=>mk(i%2?'ワイト':'もけもけ',0,'down'));
gameState.players[0].deck=Array.from({length:8},()=>mk('ワイト',0));
gameState.players[1].deck=Array.from({length:8},()=>mk('ワイト',1));
baselineA();
requestProcessorV27(PROCESSOR_V27.TURN,{});
const r=drive();
const w=gameState.processorWaiting;
ok('VM1: the End Phase opens the hand-size choice (discard 2) and the TURN unit waits for it',r==='choice'&&!!pc()&&pc().min===2&&pc().max===2&&gameState.processorPaused&&!!w&&w.type==='TURN'&&!!(w.payload&&w.payload.handLimitWaitS03),
  JSON.stringify({r,min:pc()&&pc().min,paused:gameState.processorPaused,w:w&&w.type}));
audit('VM1');
saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);
`);
if(!first.__RAW){console.log('FAIL VM1 did not reach the save point');process.exitCode=2;}
else{
  harness('const RAW='+JSON.stringify(first.__RAW)+';'+COMMON+String.raw`
  resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const r=offerResumeDuel();
  const w=gameState.processorWaiting;
  ok('VM2: the resume reopens the hand-size choice and the TURN unit waits for it again',r&&!!pc()&&pc().min===2&&gameState.processorPaused&&!!w&&w.type==='TURN',
    JSON.stringify({r,choice:!!pc(),paused:gameState.processorPaused,w:w&&w.type,toasts:TOASTS.slice(-3)}));
  if(pc()){
    answerChoiceV49(pc().candidates.slice(0,2).map(x=>x.key));
    const d=drive();
    ok('VM2: the answer discards 2 cards and the turn passes to the opponent (turn 7, the hand is at the limit)',gameState.turn===7&&gameState.activePlayer===1&&gameState.players[0].hand.length===6&&d!=='loop',
      JSON.stringify({turn:gameState.turn,ap:gameState.activePlayer,phase:gameState.phase,hand:gameState.players[0].hand.length,d}));
    ok('VM2: nothing is left waiting',!pc()&&gameState.chain.length===0&&!(gameState.processorPaused&&gameState.processorWaiting&&gameState.processorWaiting.type==='TURN'),
      JSON.stringify({paused:gameState.processorPaused,w:gameState.processorWaiting&&gameState.processorWaiting.type}));
  }
  audit('VM2');
  `);
}
