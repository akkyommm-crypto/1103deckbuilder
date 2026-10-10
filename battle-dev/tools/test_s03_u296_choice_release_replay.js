/* S03-U296: a save taken while a legacy choice (a closure) is open — here the Tribute choice of a Normal Summon — resumes without that choice
   (the closure cannot be restored), and the release is an Action in the Replay Journal: the Replay still reproduces the resumed duel.
   Before: the pending choice was dropped without an Action, the Journal kept an unclosed CHOICE_OPEN_V49 and the Replay audit failed (digest of the
   pending choice). After the resume the Normal Summon can be done again and goes through. Real DUEL path, fresh VM, Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function zoneOf(u){const h=findCardByUid(u);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function drive(){for(let i=0;i<400;i++){
  if(pc())return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
`;
const first=harness(COMMON+String.raw`
resetA();
gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5329603;
const t1=mk('ワイト',0),t2=mk('はにわ',0),big=mk('デーモンの召喚',0,'down');
gameState.players[0].mz=[t1,t2];gameState.players[0].hand=[big];
gameState.players[0].deck=Array.from({length:8},()=>mk('ワイト',0));gameState.players[1].deck=Array.from({length:8},()=>mk('ワイト',1));
baselineA();
doNormalSummon(0,'atk');
const q=pc();
ok('VM1: the Normal Summon of デーモンの召喚 asks for its Tribute through a legacy (closure) choice',!!q&&q.legacy===true&&/リリース/.test(q.title||'')&&zoneOf(big.uid)==='hand',JSON.stringify({title:q&&q.title,legacy:q&&q.legacy}));
saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);globalThis.__U={t1:t1.uid,t2:t2.uid,big:big.uid};
`);
if(!first.__RAW){console.log('FAIL VM1 did not reach the save point');process.exitCode=2;}
else{
  harness('const RAW='+JSON.stringify(first.__RAW)+';const U='+JSON.stringify(first.__U)+';'+COMMON+String.raw`
  resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const r=offerResumeDuel();
  ok('VM2: the resume releases the unrestorable choice; the summoning monster is still in the hand and both Tributes are on the field',
    r&&!pc()&&zoneOf(U.big)==='hand'&&zoneOf(U.t1)==='mz'&&zoneOf(U.t2)==='mz'&&gameState.phase==='main1',JSON.stringify({r,pc:pc()&&pc().title,big:zoneOf(U.big),t1:zoneOf(U.t1),t2:zoneOf(U.t2)}));
  ok('VM2: the release is an Action in the Journal (CHOICE_CANCEL_V49 closes the CHOICE_OPEN_V49)',(()=>{const t=v41ReplayPackage(gameState).actions.map(e=>e.action.type);const o=t.lastIndexOf('CHOICE_OPEN_V49');return o>=0&&t[o+1]==='CHOICE_CANCEL_V49';})(),
    JSON.stringify(v41ReplayPackage(gameState).actions.map(e=>e.action.type)));
  audit('VM2 right after the resume');
  doNormalSummon(gameState.players[0].hand.findIndex(c=>c.uid===U.big),'atk');
  const q=pc();
  if(q){const k=q.candidates.findIndex(x=>x.uid===U.t1);__choicePickV49(k<0?0:k);}
  drive();
  ok('VM2: the Normal Summon can be done again — デーモンの召喚 is on the field, the Tribute went to the Graveyard',zoneOf(U.big)==='mz'&&zoneOf(U.t1)==='grave'&&zoneOf(U.t2)==='mz',
    JSON.stringify({big:zoneOf(U.big),t1:zoneOf(U.t1),t2:zoneOf(U.t2)}));
  audit('VM2 after the summon');
  `);
}
