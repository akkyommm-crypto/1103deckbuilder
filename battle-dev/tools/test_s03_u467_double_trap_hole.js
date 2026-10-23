/* S03-U467 — 二重の落とし穴. Battle-destruction provenance preserves the
   victim's live Gemini-Summoned treatment; a Set Trap responds through the
   real event/chain path and destroys every opponent monster. */
const harness=require('./astra_harness');
const COMMON=String.raw`
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
let TRIG=[];
function drive(){for(let i=0;i<900;i++){
  const q=pendingChoiceV49(gameState);if(q){__choicePickV49(0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)TRIG.push(g.map(x=>x.name));if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&(gameState.processorQueue||[]).length){pumpProcessorV27();continue;}
  return 'idle';
}return 'loop';}
function battle(p,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:0,target});drive();}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit',pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,260));}
function fresh(){resetA();TRIG=[];gameState.activePlayer=1;gameState.firstPlayer=0;gameState.turn=17;gameState.phase='battle';gameState.rngInitialSeed=gameState.rngState=0x46701103;}
`;

harness(COMMON+String.raw`
fresh();const py=mk('灼熱王パイロン',0,'up'),rap=mk('超合魔獣ラプテノス',0,'up'),trap=mk('二重の落とし穴',0,'down'),blue=mk('青眼の白龍',1,'up'),other=mk('ワイト',1,'up');gameState.players[0].mz=[py,rap];gameState.players[0].sz=[trap];gameState.players[1].mz=[blue,other];baselineA();
ok('A: Raptinus dynamically treats Pyron as Gemini Summoned before battle',geminiActiveS03(py)&&!py.dualUp,JSON.stringify({active:geminiActiveS03(py),dual:py.dualUp}));
battle(1,0);
const fallen=findCardByUid(py.uid);
ok('A: battle provenance preserves that the destroyed victim was Gemini Summoned',z(py)==='grave'&&fallen.card.graveInfo&&fallen.card.graveInfo.geminiActiveS03===true,JSON.stringify(fallen&&fallen.card.graveInfo));
ok('A: Double Trap Hole is offered and resolves through the real event/chain path',TRIG.some(g=>g.includes('二重の落とし穴'))&&z(trap)==='grave',JSON.stringify(TRIG));
ok('A: every opponent monster is destroyed',z(blue)==='grave'&&z(other)==='grave',JSON.stringify({blue:z(blue),other:z(other)}));
audit('A');
`);

harness(COMMON+String.raw`
fresh();const py=mk('灼熱王パイロン',0,'up'),trap=mk('二重の落とし穴',0,'down'),blue=mk('青眼の白龍',1,'up');gameState.players[0].mz=[py];gameState.players[0].sz=[trap];gameState.players[1].mz=[blue];baselineA();
battle(1,0);
ok('B negative: a Gemini not treated as Gemini Summoned does not open the Trap',!TRIG.some(g=>g.includes('二重の落とし穴'))&&z(trap)==='sz'&&z(blue)==='mz',JSON.stringify(TRIG));
audit('B');
`);

harness(COMMON+String.raw`
fresh();const py=mk('灼熱王パイロン',0,'up'),trap=mk('二重の落とし穴',0,'down'),blue=mk('青眼の白龍',1,'up');py.dualUp=true;gameState.players[0].mz=[py];gameState.players[0].sz=[trap];gameState.players[1].mz=[blue];baselineA();
API.destroy(findCardByUid(py.uid),'U467 effect-destruction negative');drive();
ok('C negative: effect destruction of a Gemini-Summoned monster does not open the Trap',!TRIG.some(g=>g.includes('二重の落とし穴'))&&z(trap)==='sz'&&z(blue)==='mz',JSON.stringify(TRIG));
`);
