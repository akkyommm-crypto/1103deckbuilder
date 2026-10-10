/* S03-U296: gameState.lastBattle holds the two battling cards as object references and card scripts compare them with ===
   (u52WasFaceUpAttackInBattle: 「表側攻撃表示で戦闘によって破壊された場合のみ」). The JSON round trip of a save turned them into copies, so after a resume
   ジュラック・ヴェロー's battle-destruction trigger was refused for ever ("…戦闘によって破壊された場合のみ発動できます") and the duel stalled.
   Real DUEL path: P1's attacker ジュラック・ヴェロー is destroyed in battle → the trigger selection opens → saveDuel → fresh VM → offerResumeDuel → the trigger is
   picked and Special Summons a ジュラック from the Deck. Replay-audited in both VMs. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function zoneOf(u){const h=findCardByUid(u);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function drive(stopAtEvt){for(let i=0;i<500;i++){
  if(pc())return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){if(stopAtEvt)return 'evt';const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length&&st.rank<2)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
`;
const first=harness(COMMON+String.raw`
resetA();
gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5329606;
const velo=mk('ジュラック・ヴェロー',0,'up','atk'),def=mk('ジェネティック・ワーウルフ',1,'up','atk');
const g1=mk('ジュラック・グアイバ',0,'down'),g2=mk('ジュラック・ガリム',0,'down');
gameState.players[0].mz=[velo];gameState.players[1].mz=[def];
gameState.players[1].deck=Array.from({length:8},()=>mk('ワイト',1));gameState.players[0].deck=[g1,g2].concat(Array.from({length:8},()=>mk('ワイト',0)));
baselineA();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive(false);
battlePickAttackerV29(velo.uid);battlePickTargetV29(def.uid);
const r=drive(true);
const st=(typeof EVT_V2_STATE!=='undefined')?EVT_V2_STATE:null;
const names=st?st.groups.flat().map(c=>c.name):[];
ok('VM1: ジュラック・ヴェロー is destroyed in battle and its trigger selection is open',r==='evt'&&zoneOf(velo.uid)==='grave'&&names.includes('ジュラック・ヴェロー'),JSON.stringify({r,velo:zoneOf(velo.uid),names}));
ok('VM1: lastBattle refers to the live cards (the scripts compare them with ===)',gameState.lastBattle&&gameState.lastBattle.atkCard===findCardByUid(velo.uid).card&&gameState.lastBattle.defCard===findCardByUid(def.uid).card,'');
audit('VM1');
saveDuel();globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);globalThis.__U={def:def.uid,velo:velo.uid,g1:g1.uid,g2:g2.uid};
`);
if(!first.__RAW){console.log('FAIL VM1 did not reach the save point');process.exitCode=2;}
else{
  harness('const RAW='+JSON.stringify(first.__RAW)+';const U='+JSON.stringify(first.__U)+';'+COMMON+String.raw`
  resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const r=offerResumeDuel();
  const st=(typeof EVT_V2_STATE!=='undefined')?EVT_V2_STATE:null;
  ok('VM2: the resume reopens the selection with ジュラック・ヴェロー and links lastBattle to the live cards again',r&&!!st&&st.groups.flat().some(c=>c.name==='ジュラック・ヴェロー')
    &&gameState.lastBattle.atkCard===findCardByUid(U.velo).card&&gameState.lastBattle.defCard===findCardByUid(U.def).card,
    JSON.stringify({r,names:st&&st.groups.flat().map(c=>c.name)}));
  let d='none';
  if(st){const g=st.groups[st.rank];const i=g.findIndex(c=>c.name==='ジュラック・ヴェロー');eventPickV2(i);d=drive(false);}
  ok('VM2: the trigger is accepted (no refusal) and asks which ジュラック to Special Summon',d==='choice'&&!TOASTS.some(t=>/戦闘によって破壊された場合のみ/.test(t))&&!!pc(),JSON.stringify({d,title:pc()&&pc().title,toasts:TOASTS.slice(-2)}));
  if(pc()){const q=pc();const k=q.candidates.findIndex(x=>x.uid===U.g1);__choicePickV49(k<0?0:k);d=drive(false);}
  ok('VM2: ジュラック・グアイバ is Special Summoned from the Deck; nothing is stuck',zoneOf(U.g1)==='mz'&&!pc()&&d==='idle'&&!gameState.processorPaused,JSON.stringify({g1:zoneOf(U.g1),d,paused:gameState.processorPaused}));
  audit('VM2');
  `);
  /* the trigger's own activation (a legacy target choice) interrupted by a save: the activation is undone and the battle step is still there */
  const second=harness('const RAW='+JSON.stringify(first.__RAW)+';const U='+JSON.stringify(first.__U)+';'+COMMON+String.raw`
  resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  offerResumeDuel();
  const st=EVT_V2_STATE;if(st){const g=st.groups[st.rank];eventPickV2(g.findIndex(c=>c.name==='ジュラック・ヴェロー'));}
  ok('VM2b: picking the trigger opens its legacy target choice inside the damage step (battle step "leave")',!!pc()&&pc().legacy===true&&!!gameState.battle&&gameState.battle.step==='leave',JSON.stringify({pc:pc()&&pc().title,battle:gameState.battle&&gameState.battle.step}));
  saveDuel();globalThis.__RAW2=localStorage.getItem(DUEL_SAVE_KEY);
  `);
  if(!second.__RAW2){console.log('FAIL VM2b did not reach its save point');process.exitCode=2;}
  else harness('const RAW='+JSON.stringify(second.__RAW2)+';const U='+JSON.stringify(first.__U)+';'+COMMON+String.raw`
  resetA();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const r=offerResumeDuel();
  ok('VM3: the interrupted activation is undone, the selection is open again and the battle step ("leave") and the damage-step timing window survived the rebuild',
    r&&TOASTS.some(t=>/発動を取り消し/.test(t))&&!pc()&&!!EVT_V2_STATE&&!!gameState.battle&&gameState.battle.step==='leave'&&!!gameState.timingWindow&&gameState.timingWindow.kind==='damageStep',
    JSON.stringify({r,evt:!!EVT_V2_STATE,battle:gameState.battle&&gameState.battle.step,tw:gameState.timingWindow,toasts:TOASTS.slice(-2)}));
  let d='none';
  if(EVT_V2_STATE){const st=EVT_V2_STATE;eventPickV2(st.groups[st.rank].findIndex(c=>c.name==='ジュラック・ヴェロー'));d=drive(false);}
  ok('VM3: the trigger is activated again (not refused) and asks which ジュラック to Special Summon',d==='choice'&&!TOASTS.some(t=>/戦闘によって破壊された場合のみ/.test(t)),JSON.stringify({d,toasts:TOASTS.slice(-2)}));
  if(pc()){const q=pc();const k=q.candidates.findIndex(x=>x.uid===U.g1);__choicePickV49(k<0?0:k);d=drive(false);}
  ok('VM3: ジュラック・グアイバ is Special Summoned; nothing is stuck',zoneOf(U.g1)==='mz'&&d==='idle'&&!gameState.processorPaused,JSON.stringify({g1:zoneOf(U.g1),d}));
  audit('VM3');
  `);
}
