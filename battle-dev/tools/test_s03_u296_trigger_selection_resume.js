/* S03-U296: a save taken while the trigger selection (SEGOC sheet) is open resumes with the selection open again.
   Before: offerResumeDuel dropped the processor and the selection (EVT_V2_STATE lives outside gameState), so 神秘の代行者 アース's optional
   「通常召喚した場合」 trigger was lost. Real DUEL path: Normal Summon → summon window → trigger selection → saveDuel → a fresh VM → offerResumeDuel →
   pick the trigger → the search resolves; Replay-audited in both VMs. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function zoneOf(u){const h=findCardByUid(u);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function drive(){for(let i=0;i<400;i++){
  if(pc())return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE)return 'evt';
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
`;
const first=harness(COMMON+String.raw`
resetA();
gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5329601;
const earth=mk('神秘の代行者 アース',0,'down');const venus=mk('創造の代行者 ヴィーナス',0,'down');
gameState.players[0].hand=[earth];
gameState.players[0].deck=[venus].concat(Array.from({length:8},()=>mk('ワイト',0)));
gameState.players[1].deck=Array.from({length:8},()=>mk('ワイト',1));
baselineA();
doNormalSummon(0,'atk');
const r=drive();
const st=(typeof EVT_V2_STATE!=='undefined')?EVT_V2_STATE:null;
ok('VM1: after the Normal Summon the trigger selection of アース is open (processor waiting on the EVENT)',r==='evt'&&!!st&&st.groups.some(g=>g.some(c=>c.name==='神秘の代行者 アース'))
  &&gameState.processorPaused&&gameState.processorWaiting&&gameState.processorWaiting.type==='EVENT',
  JSON.stringify({r,groups:st&&st.groups.map(g=>g.map(c=>c.name)),w:gameState.processorWaiting&&gameState.processorWaiting.type}));
audit('VM1');
saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);globalThis.__U={earth:earth.uid,venus:venus.uid};
`);
if(!first.__RAW){console.log('FAIL VM1 did not reach the save point');process.exitCode=2;}
else{
  harness('const RAW='+JSON.stringify(first.__RAW)+';const U='+JSON.stringify(first.__U)+';'+COMMON+String.raw`
  resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const r=offerResumeDuel();
  const st=(typeof EVT_V2_STATE!=='undefined')?EVT_V2_STATE:null;
  ok('VM2: the resume reopens the trigger selection with アース (the processor waits on the EVENT again)',r&&!!st&&st.groups.some(g=>g.some(c=>c.name==='神秘の代行者 アース'))
    &&gameState.processorPaused&&gameState.processorWaiting&&gameState.processorWaiting.type==='EVENT',
    JSON.stringify({r,groups:st&&st.groups.map(g=>g.map(c=>c.name)),w:gameState.processorWaiting&&gameState.processorWaiting.type,toasts:TOASTS.slice(-3)}));
  if(st){
    const g=st.groups[st.rank]||[];
    ok('VM2: the trigger is optional and offered to its owner',g.length===1&&g[0].p===0,JSON.stringify(g.map(c=>[c.name,c.p])));
    eventPickV2(0);
    let d=drive();
    ok('VM2: the picked trigger resolves into the search choice with ヴィーナス as a candidate',d==='choice'&&!!pc()&&pc().candidates.some(x=>x.uid===U.venus),JSON.stringify({d,title:pc()&&pc().title}));
    const q=pc();if(q){const k=q.candidates.findIndex(x=>x.uid===U.venus);__choicePickV49(k<0?0:k);}
    d=drive();
    ok('VM2: ヴィーナス is added to the hand and the duel is idle again (no selection, no chain, processor free)',zoneOf(U.venus)==='hand'&&d==='idle'&&!gameState.processorPaused&&gameState.chain.length===0,
      JSON.stringify({venus:zoneOf(U.venus),d,paused:gameState.processorPaused}));
  }
  audit('VM2');
  `);
}
