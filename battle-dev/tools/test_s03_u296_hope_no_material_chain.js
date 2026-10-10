/* S03-U296: No.39 希望皇ホープ ②「X素材の無い状態で攻撃対象に選択された場合に発動する。このカードを破壊する」 is one forced effect per selection.
   Found by the R1 save / resume sweep (karakuri vs tg_gadget): once ② was on the chain the Quick-Effect response path judged ② legal again on top of it,
   so every chain window offered Hope again and the chain grew for ever (chain 1, 2, 3 …) — a stall that does not need a save at all.
   Real DUEL path: P1's Hope without X material is selected as the attack target → ② triggers → no further response from Hope is offered, the link resolves,
   Hope is destroyed, and the battle goes on. Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zoneOf(u){const h=findCardByUid(u);return h?h.zone:null;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
resetA();
gameState.activePlayer=0;gameState.turn=7;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5329607;
const atk=mk('カラクリ大将軍 無零怒',0,'up','atk'),hope=mk('No.39 希望皇ホープ',1,'up','atk');hope.xyz=[];
gameState.players[0].mz=[atk];gameState.players[1].mz=[hope];
gameState.players[0].deck=Array.from({length:8},()=>mk('ワイト',0));gameState.players[1].deck=Array.from({length:8},()=>mk('ワイト',1));
baselineA();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});
for(let i=0;i<6;i++){const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused)pointPassV27();else if(!gameState.processorPaused&&gameState.processorQueue.length)pumpProcessorV27();}
battlePickAttackerV29(atk.uid);battlePickTargetV29(hope.uid);
const OFFERED=[];let maxChain=0,trig=0;
for(let i=0;i<300;i++){
  if(pc()){__choicePickV49(0);continue;}
  if(EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length&&st.rank<2){trig++;eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){
    maxChain=Math.max(maxChain,gameState.chain.length);
    const pr=gameState.chainWindow.priority;const r=getChainResponsesV2(pr)||[];OFFERED.push(r.map(x=>x.db.n));
    if(r.length&&OFFERED.length<12){duelActivateResponseV2(pr,r[0].zone,r[0].index,r[0].ownerS03);continue;}   /* the driver's policy: activate the first offered response */
    chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  break;}
ok('② is a forced trigger of the Hope without X material (picked once) and puts exactly one link on the chain',trig===1&&maxChain===1,JSON.stringify({trig,maxChain}));
ok('no chain window offers Hope\'s effect again on top of its own link (the Quick-Effect path does not re-judge ②)',OFFERED.every(o=>!o.includes('No.39 希望皇ホープ')),JSON.stringify(OFFERED));
ok('the link resolves: Hope is destroyed, the chain is over, and the battle waits only for the attacker replay choice (the target is gone)',zoneOf(hope.uid)==='grave'&&gameState.chain.length===0&&!pc()&&(!gameState.processorPaused||BATTLE_COMMAND_V29.mode==='replayTarget'),
  JSON.stringify({hope:zoneOf(hope.uid),chain:gameState.chain.length,paused:gameState.processorPaused,cmd:BATTLE_COMMAND_V29.mode,phase:gameState.phase}));
audit('end');
`);
