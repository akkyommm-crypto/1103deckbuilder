/* S03-U465 — スーペルヴィス. Real Equip activation, Gemini-effect grant,
   live negation, Cyclone destruction, Normal-monster revival and Replay. */
const harness=require('./astra_harness');
const COMMON=String.raw`
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function hi(c){return gameState.players[0].hand.indexOf(c);}
function acts(c){const i=hi(c);return i<0?[]:getLegalHandActions(0,i).map(a=>a.id);}
function zoneActs(p,c){const h=findCardByUid(c.uid);return h?getLegalZoneActions(p,h.zone,h.index).map(a=>a.id):[];}
function drive(){for(let i=0;i<700;i++){
  const q=pendingChoiceV49(gameState);if(q){__choicePickV49(0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&(gameState.processorQueue||[]).length){pumpProcessorV27();continue;}
  return 'idle';
}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit',pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,260));}
function fresh(){resetA();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=11;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x46501103;}
`;

harness(COMMON+String.raw`
fresh();const py=mk('灼熱王パイロン',0,'up'),sup=mk('スーペルヴィス',0),cy=mk('サイクロン',0),w=mk('ワイト',0,'up');gameState.players[0].mz=[py];gameState.players[0].hand=[sup,cy];gameState.players[0].grave=[w];baselineA();
ok('A: Supervise can activate from hand with a face-up Gemini host',acts(sup).includes('activate'),JSON.stringify(acts(sup)));
duelActivateFromHand(hi(sup));drive();
const eq=findCardByUid(sup.uid);
ok('A: Supervise resolves as an Equip Spell on Pyron',z(sup)==='sz'&&eq.card.equipTo&&eq.card.equipTo.uid===py.uid,JSON.stringify({zone:z(sup),equip:eq&&eq.card.equipTo}));
ok('A: equipped Pyron is treated as Gemini Summoned without writing dualUp',geminiActiveS03(py)&&!py.dualUp&&zoneActs(0,py).includes('effect'),JSON.stringify({active:geminiActiveS03(py),dualUp:py.dualUp,acts:zoneActs(0,py)}));
act({type:'FX_SET_STATE',player:0,zone:'sz',index:findCardByUid(sup.uid).index,flag:'negated',reason:'U465 negative'});
ok('B negative: a negated Supervise grants no Gemini effect',!geminiActiveS03(py)&&zoneActs(0,py).includes('geminiSummon'),JSON.stringify(zoneActs(0,py)));
act({type:'FX_SET_STATE',player:0,zone:'sz',index:findCardByUid(sup.uid).index,flag:'negated',reason:'U465 restore'});
duelActivateFromHand(hi(cy));drive();
ok('A: real Cyclone destruction sends Supervise to the Graveyard',z(sup)==='grave',z(sup));
ok('A: Supervise leave trigger revives the targeted Normal Monster',z(w)==='mz',JSON.stringify({w:z(w),grave:gameState.players[0].grave.map(cardName)}));
audit('A/B');
`);

harness(COMMON+String.raw`
fresh();const sup=mk('スーペルヴィス',0),wrong=mk('ワイト',0,'up');gameState.players[0].hand=[sup];gameState.players[0].mz=[wrong];baselineA();
ok('C negative: without a face-up Gemini monster Supervise cannot activate',!acts(sup).includes('activate'),JSON.stringify(acts(sup)));
`);
