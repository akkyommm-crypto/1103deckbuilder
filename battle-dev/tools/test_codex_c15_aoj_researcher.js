/* CODEX-C15 — A・O・J リサーチャー / no-Flip-effect primitive.
   Real DUEL path, cost/target legality, resolution recheck, once-per-turn,
   normal-flip negative control and Replay audit. */
const harness=require('./astra_harness');
const COMMON=String.raw`
let PREFER=[];
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function fresh(){resetA();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=9;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0xc1501103;}
function choose(){const q=pendingChoiceV49(gameState);if(!q)return false;let i=q.candidates.findIndex(x=>PREFER.includes(x.uid));if(i<0)i=0;__choicePickV49(i);return true;}
function drive(){for(let i=0;i<700;i++){
  if(pendingChoiceV49(gameState)){choose();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&(gameState.processorQueue||[]).length){pumpProcessorV27();continue;}
  return 'idle';
}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit',pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,260));}
`;

/* A. Actual ignition-effect route: discard, target, suppress Flip effect. */
harness(COMMON+String.raw`
fresh();const src=mk('A・O・J リサーチャー',0),cost=mk('ワイト',0),pot=mk('メタモルポット',1,'down');pot.pos='def';
gameState.players[0].mz=[src];gameState.players[0].hand=[cost];gameState.players[1].mz=[pot];gameState.players[1].hand=[mk('ワイト',1)];gameState.players[1].deck=[mk('岩石の巨兵',1),mk('ワイト',1),mk('セイバーザウルス',1),mk('ライオウ',1),mk('クリッター',1)];baselineA();PREFER=[cost.uid,pot.uid];
duelActivateFromZone(0,'mz',0);drive();
const flipAction=V41_ACTION_JOURNAL.map(x=>x.action).find(a=>a.type==='FX_SET_STATE'&&a.reason==='A・O・J リサーチャー');
ok('A: discard cost reaches GY and target becomes face-up Attack',z(cost)==='grave'&&z(pot)==='mz'&&pot.face==='up'&&pot.pos==='atk',JSON.stringify({cost:z(cost),pot:z(pot),face:pot.face,pos:pot.pos}));
ok('A: Morphing Jar Flip effect did not activate',gameState.players[0].hand.length===0&&gameState.players[1].hand.length===1,JSON.stringify({h0:gameState.players[0].hand.length,h1:gameState.players[1].hand.length}));
ok('A: journaled state action explicitly omits normal effect-flip marker',!!flipAction&&flipAction.v10FlipEffect!==true,JSON.stringify(flipAction));
audit('A');
const second=mk('ペンギン・ソルジャー',1,'down');second.pos='def';gameState.players[1].mz.push(second);gameState.players[0].hand.push(mk('ワイト',0));
ok('A: once-per-turn prevents a second activation',!getLegalZoneActions(0,'mz',0).some(a=>a.id==='effect'),JSON.stringify(getLegalZoneActions(0,'mz',0)));
`);

/* B/C. Activation legality and target filtering. */
harness(COMMON+String.raw`
fresh();const src=mk('A・O・J リサーチャー',0),pot=mk('メタモルポット',1,'down');pot.pos='def';gameState.players[0].mz=[src];gameState.players[1].mz=[pot];baselineA();
ok('B negative: no discardable hand means no effect action',!getLegalZoneActions(0,'mz',0).some(a=>a.id==='effect'));
gameState.players[0].hand=[mk('ワイト',0)];pot.face='up';pot.pos='def';
ok('B negative: no opposing face-down Defense target means no effect action',!getLegalZoneActions(0,'mz',0).some(a=>a.id==='effect'));
`);
harness(COMMON+String.raw`
fresh();const src=mk('A・O・J リサーチャー',0),cost=mk('ワイト',0),own=mk('ペンギン・ソルジャー',0,'down'),legal=mk('メタモルポット',1,'down'),up=mk('ライオウ',1);own.pos=legal.pos='def';gameState.players[0].mz=[src,own];gameState.players[0].hand=[cost];gameState.players[1].mz=[legal,up];baselineA();
duelActivateFromZone(0,'mz',0);__choicePickV49(0);const q=pendingChoiceV49(gameState),uids=q?q.candidates.map(x=>x.uid):[];
ok('C: target choice contains only opponent face-down Defense monster',uids.length===1&&uids[0]===legal.uid,JSON.stringify({uids,legal:legal.uid,own:own.uid,up:up.uid}));
`);

/* D. Resolution rechecks that the target is still face-down Defense. */
harness(COMMON+String.raw`
fresh();const src=mk('A・O・J リサーチャー',0),cost=mk('ワイト',0),pot=mk('メタモルポット',1,'down');pot.pos='def';gameState.players[0].mz=[src];gameState.players[0].hand=[cost];gameState.players[1].mz=[pot];baselineA();
duelActivateFromZone(0,'mz',0);__choicePickV49(0);__choicePickV49(0);act({type:'FX_SET_STATE',player:1,zone:'mz',index:0,face:'up',pos:'def',reason:'chain simulation'});drive();
ok('D negative: face-up target at resolution is not changed to Attack',z(cost)==='grave'&&pot.face==='up'&&pot.pos==='def',JSON.stringify({cost:z(cost),face:pot.face,pos:pot.pos}));
`);

/* E. The ordinary effect-flip API remains distinct and still emits onFlip. */
harness(COMMON+String.raw`
fresh();const pot=mk('メタモルポット',1,'down');pot.pos='def';gameState.players[1].mz=[pot];baselineA();gameState.posSnapV10=positionSnapshotV10(gameState);gameState.deferredEvents=[];
API.flipFaceUpByEffect({p:1,zone:'mz',index:0,card:pot},'atk','ordinary effect flip');
ok('E negative control: ordinary effect flip still emits onFlip',(gameState.deferredEvents||[]).some(e=>e.eventName==='onFlip'&&e.evt&&e.evt.uid===pot.uid&&e.evt.byEffect===true),JSON.stringify(gameState.deferredEvents));
`);
