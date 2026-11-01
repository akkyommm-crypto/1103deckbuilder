/* S03-U466 — スペシャル・デュアル・サモン. Real Quick-Play activation,
   targeted Gemini state, same-turn End Phase return, stale-instance control and Replay. */
const harness=require('./astra_harness');
const COMMON=String.raw`
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function hi(c){return gameState.players[0].hand.indexOf(c);}
function acts(c){const i=hi(c);return i<0?[]:getLegalHandActions(0,i).map(a=>a.id);}
function drive(){for(let i=0;i<700;i++){
  const q=pendingChoiceV49(gameState);if(q){__choicePickV49(0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&(gameState.processorQueue||[]).length){pumpProcessorV27();continue;}
  return 'idle';
}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit',pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,260));}
function fresh(){resetA();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=13;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x46601103;}
`;

harness(COMMON+String.raw`
fresh();const py=mk('灼熱王パイロン',0,'up'),spell=mk('スペシャル・デュアル・サモン',0);gameState.players[0].mz=[py];gameState.players[0].hand=[spell];baselineA();
ok('A: Quick-Play Spell can activate from hand with an own face-up Gemini',acts(spell).includes('activate'),JSON.stringify(acts(spell)));
duelActivateFromHand(hi(spell));drive();
ok('A: target becomes Gemini Summoned without consuming the Normal Summon',py.dualUp===true&&!gameState.players[0].normalSummonUsed,JSON.stringify({dual:py.dualUp,normal:gameState.players[0].normalSummonUsed}));
ok('A: a serializable End Phase return is scheduled',API.schedules('s03u466.return-gemini').length===1&&assertScheduleSerializableV7(gameState).ok,JSON.stringify(gameState.scheduledV7));
phase('end');
ok('A: the same field instance returns to the hand at this turn End Phase',z(py)==='hand',z(py));
audit('A');
`);

harness(COMMON+String.raw`
fresh();const py=mk('灼熱王パイロン',0,'up'),spell=mk('スペシャル・デュアル・サモン',0);gameState.players[0].mz=[py];gameState.players[0].hand=[spell];baselineA();
duelActivateFromHand(hi(spell));drive();
let hit466=findCardByUid(py.uid);act({type:'FX_TO_GRAVE',player:hit466.p,zone:hit466.zone,index:hit466.index,reason:'U466 instance negative'});hit466=findCardByUid(py.uid);act({type:'FX_SPECIAL_SUMMON',player:0,from:'grave',fromIndex:hit466.index,pos:'atk',reason:'U466 instance negative'});
phase('end');
ok('B negative: a monster that left and was Special Summoned again is not returned by the old schedule',z(py)==='mz',JSON.stringify({zone:z(py),mark:py.u466ReturnTurn}));
audit('B');
`);

harness(COMMON+String.raw`
fresh();const wrong=mk('ワイト',0,'up'),spell=mk('スペシャル・デュアル・サモン',0);gameState.players[0].mz=[wrong];gameState.players[0].hand=[spell];baselineA();
ok('C negative: without an own face-up Gemini the Spell cannot activate',!acts(spell).includes('activate'),JSON.stringify(acts(spell)));
`);
