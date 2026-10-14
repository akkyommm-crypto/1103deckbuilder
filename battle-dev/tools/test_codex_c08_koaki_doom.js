/* CODEX-C08 — コアキメイル・デビル.
   Official ruling: its continuous effect negates LIGHT/DARK monster effects
   activated in a Main Phase, including effects activated in the hand or GY;
   it does not negate continuous effects or effects activated outside Main. */
const harness=require('./astra_harness');
const COMMON=String.raw`
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function fresh(phase='main1'){resetA();gameState.activePlayer=0;gameState.turn=14;gameState.phase=phase;gameState.rngInitialSeed=gameState.rngState=0xc08a11;EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;}
function drive(){for(let i=0;i<900;i++){
  const q=pendingChoiceV49(gameState);if(q){__choicePickV49(0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';
}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit',a.ok,JSON.stringify(a).slice(0,260));}
function activateHandFor(p){const c=gameState.players[p].hand[0];return prepareDuelActivation(cardName(c),p,'hand',0,{});}
`;

/* A. DARK hand effect in Main Phase: cost is paid, effect is negated. */
harness(COMMON+String.raw`
fresh();const doom=mk('コアキメイル・デビル',0),crow=mk('D.D.クロウ',0),target=mk('死者蘇生',1);gameState.players[0].mz=[doom];gameState.players[0].hand=[crow];gameState.players[1].grave=[target];baselineA();
ok('A: コアキメイル・デビル script is registered',!!CARD_SCRIPTS['コアキメイル・デビル']);
duelActivateFromHand(0);drive();
ok('A: DARK hand effect activated in Main is negated',z(crow)==='grave'&&z(target)==='grave',JSON.stringify({crow:z(crow),target:z(target)}));
audit('A');
`);

/* B. LIGHT hand effect in opponent Main Phase is also negated. */
harness(COMMON+String.raw`
fresh();gameState.activePlayer=1;const doom=mk('コアキメイル・デビル',0),veiler=mk('エフェクト・ヴェーラー',0),foe=mk('魔導戦士 ブレイカー',1);gameState.players[0].mz=[doom];gameState.players[0].hand=[veiler];gameState.players[1].mz=[foe];baselineA();
activateHandFor(0);drive();
ok('B: LIGHT hand effect activated in Main is negated after paying its send cost',z(veiler)==='grave'&&foe.negatedUntilTurn==null,JSON.stringify({veiler:z(veiler),neg:foe.negatedUntilTurn}));
audit('B');
`);

/* C. DARK GY effect and DARK field effect are negated. */
harness(COMMON+String.raw`
fresh();const doom=mk('コアキメイル・デビル',0),carrier=mk('ゾンビキャリア',0),hand=mk('ワイト',0);gameState.players[0].mz=[doom];gameState.players[0].grave=[carrier];gameState.players[0].hand=[hand];baselineA();
duelActivateFromZone(0,'grave',0);drive();
ok('C: DARK GY effect activated in Main does not Special Summon',z(carrier)==='grave');
audit('C grave');
`);
harness(COMMON+String.raw`
fresh();const doom=mk('コアキメイル・デビル',0),breaker=mk('魔導戦士 ブレイカー',0),set=mk('サイクロン',1,'down');breaker.counters={'魔力':1};gameState.players[0].mz=[doom,breaker];gameState.players[1].sz=[set];baselineA();
ok('C negative: Doom does not blanket-negate a DARK monster or its continuous ATK layer',effectNegated(breaker)===false&&curATK(breaker)===1900,JSON.stringify({neg:effectNegated(breaker),atk:curATK(breaker)}));
duelActivateFromZone(0,'mz',1);drive();
ok('C: DARK field effect pays its counter but is negated',API.countCounter({p:0,zone:'mz',index:1},'魔力')===0&&z(set)==='sz',JSON.stringify({counter:API.countCounter({p:0,zone:'mz',index:1},'魔力'),set:z(set)}));
audit('C field');
`);

/* D. Outside Main Phase the same DARK hand effect resolves normally. */
harness(COMMON+String.raw`
fresh('battle');const doom=mk('コアキメイル・デビル',0),crow=mk('D.D.クロウ',0),target=mk('死者蘇生',1);gameState.players[0].mz=[doom];gameState.players[0].hand=[crow];gameState.players[1].grave=[target];baselineA();
duelActivateFromHand(0);drive();
ok('D negative: effect activated outside Main is not negated',z(crow)==='grave'&&z(target)==='banish');
audit('D');
`);

/* E. A face-down or negated Doom does not apply its continuous negation. */
harness(COMMON+String.raw`
fresh();const doom=mk('コアキメイル・デビル',0,'down','def'),crow=mk('D.D.クロウ',0),target=mk('死者蘇生',1);gameState.players[0].mz=[doom];gameState.players[0].hand=[crow];gameState.players[1].grave=[target];baselineA();
duelActivateFromHand(0);drive();ok('E negative: face-down Doom does not negate',z(target)==='banish');audit('E face-down');
`);
harness(COMMON+String.raw`
fresh();const doom=mk('コアキメイル・デビル',0),crow=mk('D.D.クロウ',0),target=mk('死者蘇生',1);gameState.players[0].mz=[doom];gameState.players[0].hand=[crow];gameState.players[1].grave=[target];baselineA();API.negateEffectUntil({p:0,zone:'mz',index:0,card:doom},'permanent','CODEX-C08');
duelActivateFromHand(0);drive();ok('E negative: negated Doom does not negate',z(target)==='banish');audit('E negated');
`);

/* F. Existing Koa'ki upkeep path remains live. */
harness(COMMON+String.raw`
fresh();const doom=mk('コアキメイル・デビル',0),core=mk('コアキメイルの鋼核',0);gameState.players[0].mz=[doom];gameState.players[0].hand=[core];baselineA();requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});drive();
ok('F: own End Phase upkeep sends Iron Core and keeps Doom',z(core)==='grave'&&z(doom)==='mz');audit('F');
`);
