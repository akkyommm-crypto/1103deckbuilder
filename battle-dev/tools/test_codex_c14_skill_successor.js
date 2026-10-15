/* CODEX-C14 — スキル・サクセサー.
   - Set Trap: target one own face-up monster; +400 ATK until End Phase.
   - GY Trap effect: only during its owner's turn and not the turn it reached
     the GY; banish itself as cost, then target one own face-up monster for
     +800 ATK until End Phase.
   Real DUEL activation paths, timing/target negatives and Replay audits. */
const harness=require('./astra_harness');
const COMMON=String.raw`
let PREFER=[];
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function fresh(active){resetA();gameState.activePlayer=active==null?0:active;gameState.firstPlayer=0;gameState.turn=8;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0xc1401103;}
function choose(){const q=pendingChoiceV49(gameState);if(!q)return false;let i=q.candidates.findIndex(x=>PREFER.includes(x.uid));if(i<0)i=0;__choicePickV49(i);return true;}
function drive(){for(let i=0;i<600;i++){
  if(pendingChoiceV49(gameState)){choose();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&(gameState.processorQueue||[]).length){pumpProcessorV27();continue;}
  return 'idle';
}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit',pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,260));}
`;

/* A. The Set Trap can be used in the opponent's turn and expires normally. */
harness(COMMON+String.raw`
fresh(1);const trap=mk('スキル・サクセサー',0,'down'),wolf=mk('ジェネティック・ワーウルフ',0);trap.setTurn=7;gameState.players[0].sz=[trap];gameState.players[0].mz=[wolf];baselineA();PREFER=[wolf.uid];
duelActivateFromZone(0,'sz',0);drive();
ok('A: Set Trap targets own face-up monster and gives +400 ATK',z(trap)==='grave'&&curATK(wolf)===2400,JSON.stringify({trap:z(trap),atk:curATK(wolf)}));
audit('A boosted');
act({type:'PASS_TURN'});
ok('A: +400 expires when that turn ends',curATK(wolf)===2000,curATK(wolf));
`);

/* B. On a later own turn the GY effect banishes itself as activation cost and
   gives +800. */
harness(COMMON+String.raw`
fresh(0);const trap=mk('スキル・サクセサー',0),wolf=mk('ジェネティック・ワーウルフ',0);trap.graveInfo={from:'sz',turn:7};gameState.players[0].grave=[trap];gameState.players[0].mz=[wolf];baselineA();PREFER=[wolf.uid];
ok('B: later-turn GY effect is offered',getLegalZoneActions(0,'grave',0).some(a=>a.id==='effect'),JSON.stringify(getLegalZoneActions(0,'grave',0)));
duelActivateFromZone(0,'grave',0);drive();
ok('B: GY copy is banished as cost and target gains +800',z(trap)==='banish'&&curATK(wolf)===2800,JSON.stringify({trap:z(trap),atk:curATK(wolf)}));
audit('B');
`);

/* C/D. The GY effect is unavailable on the sent turn and during the opponent's turn. */
harness(COMMON+String.raw`
fresh(0);const trap=mk('スキル・サクセサー',0),wolf=mk('ジェネティック・ワーウルフ',0);trap.graveInfo={from:'sz',turn:8};gameState.players[0].grave=[trap];gameState.players[0].mz=[wolf];baselineA();
ok('C negative: GY effect is not offered on the turn sent there',!getLegalZoneActions(0,'grave',0).some(a=>a.id==='effect'),JSON.stringify(getLegalZoneActions(0,'grave',0)));
`);
harness(COMMON+String.raw`
fresh(1);const trap=mk('スキル・サクセサー',0),wolf=mk('ジェネティック・ワーウルフ',0);trap.graveInfo={from:'sz',turn:7};gameState.players[0].grave=[trap];gameState.players[0].mz=[wolf];baselineA();
ok('D negative: GY effect is not offered during the opponent turn',!getLegalZoneActions(0,'grave',0).some(a=>a.id==='effect'),JSON.stringify(getLegalZoneActions(0,'grave',0)));
`);

/* E. Both effects target only the activator's face-up monsters. */
harness(COMMON+String.raw`
fresh(0);const trap=mk('スキル・サクセサー',0),own=mk('ジェネティック・ワーウルフ',0),setOwn=mk('セイバーザウルス',0,'down'),foe=mk('ライオウ',1);trap.graveInfo={from:'sz',turn:7};gameState.players[0].grave=[trap];gameState.players[0].mz=[own,setOwn];gameState.players[1].mz=[foe];baselineA();
duelActivateFromZone(0,'grave',0);
const q=pendingChoiceV49(gameState),uids=q?q.candidates.map(x=>x.uid):[];
ok('E: GY target choice contains only own face-up monster',z(trap)==='banish'&&uids.length===1&&uids[0]===own.uid,JSON.stringify({trap:z(trap),uids,own:own.uid,setOwn:setOwn.uid,foe:foe.uid}));
PREFER=[own.uid];drive();
ok('E: selected legal target receives +800',curATK(own)===2800&&curATK(setOwn)===1900&&curATK(foe)===1900,JSON.stringify({own:curATK(own),setOwn:curATK(setOwn),foe:curATK(foe)}));
audit('E');
`);
