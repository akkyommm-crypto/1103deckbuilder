/* S03-U296: a save taken while a POINT window is open (here: the attack declaration, P2 holds 聖なるバリア －ミラーフォース－) resumes with the window open
   and the attack still pending; a save taken while a chain started from that window is on the stack resumes with the window's follow-up rebuilt.
   Before: offerResumeDuel dropped the processor and cleared pendingAttack without an Action — the attack vanished (no damage, no window) and the Replay
   no longer matched; a chain from the window ended with nothing to continue. Real DUEL path, fresh VMs, Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function zoneOf(u){const h=findCardByUid(u);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function drive(stopAtPoint){for(let i=0;i<400;i++){
  if(pc())return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length&&st.rank<2)eventPickV2(0);else eventSkipGroupV2();continue;}   /* optional groups are skipped: ミラーフォース is used from the POINT window */
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){if(stopAtPoint)return 'point';pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function pointKind(){const w=gameState.processorWaiting;return w&&w.type==='POINT'&&gameState.processorPaused?(w.payload&&w.payload.kind):null;}
`;
const first=harness(COMMON+String.raw`
resetA();
gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5329602;
const atk=mk('ワイト',0,'up','atk');atk.summonedTurn=3;
const mf=mk('聖なるバリア －ミラーフォース－',1,'down');mf.setTurn=3;
gameState.players[0].mz=[atk];gameState.players[1].sz=[mf];
gameState.players[0].deck=Array.from({length:8},()=>mk('ワイト',0));gameState.players[1].deck=Array.from({length:8},()=>mk('ワイト',1));
baselineA();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});let r=drive(true);
while(r==='point'&&pointKind()!=='attackDeclare'&&gameState.phase==='battle'&&!gameState.pendingAttack){
  if(pointKind()==='battleStart'){pointPassV27();r=drive(true);continue;}break;}
battlePickAttackerV29(atk.uid);battleDirectV29();r=drive(true);
ok('VM1: the attack declaration window is open for P2 (POINT attackDeclare, attack pending, ミラーフォース offered)',r==='point'&&pointKind()==='attackDeclare'&&!!gameState.pendingAttack
  &&(getChainResponsesV2(1)||[]).some(x=>x.db.n==='聖なるバリア －ミラーフォース－'),JSON.stringify({r,kind:pointKind(),pa:!!gameState.pendingAttack,phase:gameState.phase}));
audit('VM1');
saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);globalThis.__U={atk:atk.uid,mf:mf.uid};
`);
if(!first.__RAW){console.log('FAIL VM1 did not reach the save point');process.exitCode=2;}
else{
  /* (a) both pass: the attack goes on and hits */
  harness('const RAW='+JSON.stringify(first.__RAW)+';const U='+JSON.stringify(first.__U)+';'+COMMON+String.raw`
  resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const r=offerResumeDuel();
  ok('VM2a: the resume reopens the attack declaration window with the attack pending',r&&pointKind()==='attackDeclare'&&!!gameState.pendingAttack&&gameState.pendingAttack.attackerUid===U.atk,
    JSON.stringify({r,kind:pointKind(),pa:gameState.pendingAttack,toasts:TOASTS.slice(-2)}));
  const lp0=gameState.players[1].lp;
  const d=drive(false);
  ok('VM2a: both players pass → the attack goes through: P2 takes the attacker\'s ATK, the attack is no longer pending, the duel is idle in the Battle Phase',
    gameState.players[1].lp<lp0&&!gameState.pendingAttack&&d==='idle'&&gameState.phase==='battle',JSON.stringify({lp:gameState.players[1].lp,lp0,pa:!!gameState.pendingAttack,d,phase:gameState.phase}));
  audit('VM2a');
  `);
  /* (b) P2 activates ミラーフォース from the window; saved with the chain on the stack */
  const second=harness('const RAW='+JSON.stringify(first.__RAW)+';const U='+JSON.stringify(first.__U)+';'+COMMON+String.raw`
  resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  offerResumeDuel();
  const i=gameState.players[1].sz.findIndex(c=>c&&c.uid===U.mf);
  if(pointKind()==='attackDeclare'&&i>=0)pointActivateV27(1,'sz',i);
  ok('VM2b: ミラーフォース is activated from the resumed window; its link is on the chain and a window is open',gameState.chain.length===1&&!!gameState.chainWindow,
    JSON.stringify({chain:gameState.chain.map(l=>l.name),win:gameState.chainWindow,kind:pointKind()}));
  audit('VM2b');
  saveDuel();globalThis.__RAW2=localStorage.getItem(DUEL_SAVE_KEY);
  `);
  if(!second.__RAW2){console.log('FAIL VM2b did not reach its save point');process.exitCode=2;}
  else harness('const RAW='+JSON.stringify(second.__RAW2)+';const U='+JSON.stringify(first.__U)+';'+COMMON+String.raw`
  resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const r=offerResumeDuel();
  ok('VM3: the chain-on-a-window save resumes: one link, the chain window, the POINT unit waiting under it, and the window follow-up callback rebuilt',
    r&&gameState.chain.length===1&&!!gameState.chainWindow&&pointKind()==='attackDeclare'&&typeof CHAIN_AFTER_V2==='function'&&!!gameState.pendingAttack,
    JSON.stringify({r,chain:gameState.chain.length,win:!!gameState.chainWindow,kind:pointKind(),cb:typeof CHAIN_AFTER_V2,pa:!!gameState.pendingAttack}));
  const lp0=gameState.players[1].lp;
  const d=drive(false);
  ok('VM3: the chain resolves — ミラーフォース destroys the attacker, P2 takes no damage, nothing is pending and the processor is free',
    zoneOf(U.atk)==='grave'&&zoneOf(U.mf)==='grave'&&gameState.players[1].lp===lp0&&!gameState.pendingAttack&&d==='idle'&&!gameState.processorPaused,
    JSON.stringify({atk:zoneOf(U.atk),mf:zoneOf(U.mf),lp:gameState.players[1].lp,pa:!!gameState.pendingAttack,d,paused:gameState.processorPaused,kind:pointKind()}));
  audit('VM3');
  `);
}
