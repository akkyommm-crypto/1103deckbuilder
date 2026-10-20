/* CODEX-C07 — 連鎖除外.
   Real DUEL summon-response paths plus simultaneous-summon and resolution-time
   controls. Official ruling: non-targeting; only face-up summoned monsters with
   current ATK <=1000 are banished, then every printed-name copy in the
   activator's opponent hand/Deck is banished. */
const harness=require('./astra_harness');
const COMMON=String.raw`
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=12;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0xc07a11;EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;}
function drive(){for(let i=0;i<900;i++){
  const q=pendingChoiceV49(gameState);if(q){__choicePickV49(0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){return 'evt';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';
}return 'loop';}
function reach(name){for(let i=0;i<20;i++){const r=drive();if(r!=='evt')return r;const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[],k=g.findIndex(x=>x.name===name);if(k>=0)return 'offered';eventSkipGroupV2();}return 'loop';}
function pick(name){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[],k=g.findIndex(x=>x.name===name);if(k<0)throw Error('offer missing '+name);eventPickV2(k);}
function finish(){for(let i=0;i<900;i++){
  const q=pendingChoiceV49(gameState);if(q){__choicePickV49(0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';
}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit',a.ok,JSON.stringify(a).slice(0,260));}
`;

/* A. Opponent Normal Summon: summoned card plus every same-name hand/Deck copy. */
harness(COMMON+String.raw`
fresh();
const summoned=mk('クリボー',0),handCopy=mk('クリボー',0),deckCopy=mk('クリボー',0),other=mk('ワイト',0),trap=mk('連鎖除外',1,'down');trap.setTurn=gameState.turn-1;
gameState.players[0].hand=[summoned,handCopy];gameState.players[0].deck=[deckCopy,other];gameState.players[1].sz=[trap];baselineA();
ok('A: 連鎖除外 script is registered',!!CARD_SCRIPTS['連鎖除外']);
doNormalSummon(0,'atk');
const r=reach('連鎖除外');ok('A: offered after a face-up 300 ATK Normal Summon',r==='offered',r);
if(r==='offered'){pick('連鎖除外');finish();}
ok('A: summoned monster and all printed-name copies in opponent hand/Deck are banished',z(summoned)==='banish'&&z(handCopy)==='banish'&&z(deckCopy)==='banish'&&z(other)==='deck',JSON.stringify({s:z(summoned),h:z(handCopy),d:z(deckCopy),o:z(other)}));
ok('A: non-targeting resolution consumes the Trap',z(trap)==='grave');
audit('A');
`);

/* B. It may answer the controller's own summon; copies are removed from the other player. */
harness(COMMON+String.raw`
fresh();
const summoned=mk('クリボー',0),foeHand=mk('クリボー',1),foeDeck=mk('クリボー',1),trap=mk('連鎖除外',0,'down');trap.setTurn=gameState.turn-1;
gameState.players[0].hand=[summoned];gameState.players[0].sz=[trap];gameState.players[1].hand=[foeHand];gameState.players[1].deck=[foeDeck];baselineA();
doNormalSummon(0,'atk');const r=reach('連鎖除外');ok('B: offered after its controller own summon',r==='offered',r);
if(r==='offered'){pick('連鎖除外');finish();}
ok('B: own summoned monster is banished and opponent copies are banished',z(summoned)==='banish'&&z(foeHand)==='banish'&&z(foeDeck)==='banish');
audit('B');
`);

/* C. Simultaneous event and resolution-time checks. */
harness(COMMON+String.raw`
fresh();
const a=mk('クリボー',0),b=mk('ワイト',0),high=mk('ライオウ',0),trap=mk('連鎖除外',1,'down');
gameState.players[0].mz=[a,b,high];gameState.players[0].hand=[mk('クリボー',0),mk('ワイト',0)];gameState.players[0].deck=[mk('クリボー',0),mk('ワイト',0)];gameState.players[1].sz=[trap];baselineA();
const sc=CARD_SCRIPTS['連鎖除外'],ctx=makeContext(1,trap,'sz',0,'onSpecialSummon',{event:{player:0,cards:[a,b,high],kind:'effect'}});
ok('C: simultaneous batch with low-ATK face-up monsters is legal',!!sc&&sc.condition(ctx)===true);
ok('C: effect is non-targeting',!!sc&&typeof sc.selectTargets!=='function');
if(sc){sc.resolve(ctx);drive();}
ok('C: one qualifying summoned monster is chosen and banished; the others remain',z(a)==='banish'&&z(b)==='mz'&&z(high)==='mz');
ok('C: hand/Deck copies only for the chosen banished name are removed',gameState.players[0].hand.length===1&&gameState.players[0].deck.length===1&&dbOf(gameState.players[0].hand[0]).n==='ワイト'&&dbOf(gameState.players[0].deck[0]).n==='ワイト');
audit('C');
`);
harness(COMMON+String.raw`
fresh();
const boosted=mk('クリボー',0),down=mk('ワイト',0,'down','def'),trap=mk('連鎖除外',1,'down');gameState.players[0].mz=[boosted,down];gameState.players[1].sz=[trap];baselineA();
const sc=CARD_SCRIPTS['連鎖除外'],ctx=makeContext(1,trap,'sz',0,'onSpecialSummon',{event:{player:0,cards:[boosted,down],kind:'effect'}});
ok('C negative: activation sees the original face-up low-ATK monster',!!sc&&sc.condition(ctx)===true);
v4RegisterStatModifier({p:0,zone:'mz',index:0,card:boosted},{atk:1500},{code:'CODEX-C07 boost',resetMask:RESET.END});
if(sc)sc.resolve(ctx);
ok('C negative: resolution rechecks ATK and face-up state',z(boosted)==='mz'&&z(down)==='mz');
audit('C resolution negative');
`);

/* D. A face-down Special Summon alone cannot start the Trap. */
harness(COMMON+String.raw`
fresh();const down=mk('ワイト',0,'down','def'),trap=mk('連鎖除外',1,'down');gameState.players[0].mz=[down];gameState.players[1].sz=[trap];baselineA();
const sc=CARD_SCRIPTS['連鎖除外'],ctx=makeContext(1,trap,'sz',0,'onSpecialSummon',{event:{player:0,card:down,cards:[down],kind:'effect'}});
ok('D negative: face-down Special Summon is not an activation window',!!sc&&sc.condition(ctx)===false);
audit('D');
`);
