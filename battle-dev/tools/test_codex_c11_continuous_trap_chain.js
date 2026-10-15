/* CODEX-C11 - Continuous Trap card activations in response lists.
   Exercises the real DUEL preparation / chain / resolution path and Replay. */
const harness=require('./astra_harness');
const COMMON=String.raw`
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(lp=8000){resetA();gameState.activePlayer=0;gameState.turn=7;gameState.phase='main1';
  gameState.players[1].lp=lp;gameState.rngInitialSeed=gameState.rngState=0xc11003;}
function drive(){for(let i=0;i<700;i++){
  if(pendingChoiceV49(gameState)) return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';
}return 'loop';}
function setup(lp=8000){fresh(lp);
  const drain=mk('スキルドレイン',1,'down'),escape=mk('強制脱出装置',1,'down');
  const monster=mk('魔導戦士 ブレイカー',0,'up','atk'),spell=mk('増援',0);
  drain.setTurn=escape.setTurn=5;
  gameState.players[0].mz=[monster];gameState.players[0].hand=[spell];gameState.players[0].deck=[mk('E・HERO クレイマン',0)];
  gameState.players[1].sz=[drain,escape];baselineA();duelActivateFromHand(0);
  return {drain,escape,monster,spell};
}
`;

/* The reported shape: an ordinary Trap was offered, but Skill Drain was not. */
harness(COMMON+String.raw`
const B=setup();
const offers=getChainResponsesV2(1).map(x=>cardName(x.card));
ok('both 強制脱出装置 and スキルドレイン are offered in the same response window',
  offers.includes('強制脱出装置')&&offers.includes('スキルドレイン'),JSON.stringify(offers));
duelActivateResponseV2(1,'sz',0);
ok('activating スキルドレイン pays 1000 LP and adds chain link 2',
  gameState.players[1].lp===7000&&gameState.chain.length===2&&B.drain.face==='up',JSON.stringify({lp:gameState.players[1].lp,chain:gameState.chain.map(x=>x.name)}));
drive();
ok('resolved スキルドレイン remains face-up and negates a face-up monster',
  z(B.drain)==='sz'&&B.drain.face==='up'&&effectNegated(B.monster),JSON.stringify({drain:z(B.drain),negated:effectNegated(B.monster)}));
audit('continuous Trap response');
`);

/* LP cost legality must be applied while building the response list. */
harness(COMMON+String.raw`
const B=setup(1000);
const offers=getChainResponsesV2(1).map(x=>cardName(x.card));
ok('スキルドレイン is not offered at exactly 1000 LP while 強制脱出装置 remains legal',
  !offers.includes('スキルドレイン')&&offers.includes('強制脱出装置'),JSON.stringify(offers));
`);

/* Engine guard: a pure continuous card needs no artificial no-op resolve to
   participate in the response list. */
harness(COMMON+String.raw`
const original=CARD_SCRIPTS['スキルドレイン'];
CARD_SCRIPTS['スキルドレイン']=Object.assign({},original);delete CARD_SCRIPTS['スキルドレイン'].resolve;
const B=setup();
const offers=getChainResponsesV2(1).map(x=>cardName(x.card));
ok('a continuous-only Trap script is still offered as a card activation',offers.includes('スキルドレイン'),JSON.stringify(offers));
CARD_SCRIPTS['スキルドレイン']=original;
`);
