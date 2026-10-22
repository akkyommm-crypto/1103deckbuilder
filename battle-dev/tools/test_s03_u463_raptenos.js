/* S03-U463 — 超合魔獣ラプテノス. Real DUEL actions, both fields,
   face-down/negated negatives, Gemini Summon legality and Replay audit. */
const harness=require('./astra_harness');
const COMMON=String.raw`
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function idx(c){const h=findCardByUid(c.uid);return h?h.index:-1;}
function drive(){for(let i=0;i<500;i++){
  const q=pendingChoiceV49(gameState);if(q){__choicePickV49(0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&(gameState.processorQueue||[]).length){pumpProcessorV27();continue;}
  return 'idle';
}return 'loop';}
function zoneActions(p,c){const h=findCardByUid(c.uid);return h?getLegalZoneActions(p,h.zone,h.index).map(a=>a.id):[];}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit',pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,260));}
function fresh(){resetA();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=9;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x46301103;}
`;

harness(COMMON+String.raw`
fresh();const rap=mk('超合魔獣ラプテノス',0,'up'),py=mk('灼熱王パイロン',0,'up'),tuned=mk('チューンド・マジシャン',1,'up');gameState.players[0].mz=[rap,py];gameState.players[1].mz=[tuned];baselineA();
ok('A: Raptinus grants Gemini effects to own and opponent face-up Gemini monsters',geminiActiveS03(py)&&geminiActiveS03(tuned)&&isTunerNowV17(tuned),JSON.stringify({py:geminiActiveS03(py),tuned:geminiActiveS03(tuned),tuner:isTunerNowV17(tuned)}));
ok('A: a monster already treated as Gemini Summoned is not offered another Gemini Summon',!zoneActions(0,py).includes('geminiSummon')&&/既にもう1度召喚/.test(geminiSummonBlockedS03(py,0)),JSON.stringify(zoneActions(0,py)));
ok('A: Pyron ignition is offered through the real DUEL action path',zoneActions(0,py).includes('effect'),JSON.stringify(zoneActions(0,py)));
duelActivateFromZone(0,'mz',idx(py));drive();
ok('A: Pyron effect enabled by Raptinus deals 1000 damage',gameState.players[1].lp===7000,String(gameState.players[1].lp));
audit('A');
`);

harness(COMMON+String.raw`
fresh();const rap=mk('超合魔獣ラプテノス',0,'up'),py=mk('灼熱王パイロン',0,'up');gameState.players[0].mz=[rap,py];baselineA();
act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,flag:'negated',reason:'U463 negative'});
ok('B negative: a negated Raptinus grants no Gemini effects',!geminiActiveS03(py)&&!zoneActions(0,py).includes('effect')&&zoneActions(0,py).includes('geminiSummon'),JSON.stringify(zoneActions(0,py)));
act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,flag:'negated',reason:'U463 restore'});
ok('B: removing negation restores the continuous rule without writing dualUp',geminiActiveS03(py)&&!py.dualUp,JSON.stringify({active:geminiActiveS03(py),dualUp:py.dualUp}));
act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,face:'down',pos:'def',reason:'U463 negative'});
ok('C negative: a face-down Raptinus grants no Gemini effects',!geminiActiveS03(py)&&zoneActions(0,py).includes('geminiSummon'),JSON.stringify(zoneActions(0,py)));
audit('B/C');
`);
