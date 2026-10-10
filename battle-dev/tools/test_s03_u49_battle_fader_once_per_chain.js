/* S03-U49 バトルフェーダー — once per chain (real-duel RESPOND_LOOP).
   Found by R1 on Astra's fixed lists (【BF】 vs 1103兎ラギア, R1_DECKS=bf,rabbit, seed 0x52310501, first 0, turn 6 Battle Phase): a バトルフェーダー
   in the hand stays there until its effect resolves, and the same copy was offered and activated again on top of its own link, thousands of
   times (RESPOND_LOOP after 4544 ops; the 120 s harness timeout had hidden it in the sweep).
   2011 source: yugioh-wiki 《バトルフェーダー》 age 55 (2011-08-23): activated at the opponent's direct attack declaration; several copies cannot
   be activated in the same chain (09/12/09); it Special Summons itself and ends the Battle Phase.
   Among the fixed-list hand effects offered as chain responses, it is the only one that stays in the hand until resolution (scan u49_hand_stay_scan.js).
   Cards named here: バトルフェーダー (TESTED); ワイト (GENERIC_OK). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function nm(c){return c?cardName(c):null;}
function zoneOf(c){const x=findCardByUid(c.uid);return x?x.zone:null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;TOASTS.length=0;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest including the final one',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
/* advance to player 1's first response opportunity at the direct attack declaration */
function toDeclarationWindow(){for(let i=0;i<200;i++){
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){const pl=w.payload||{};const pr=pl.priority!=null?pl.priority:gameState.activePlayer;
    if(pl.kind==='attackDeclare'&&pr===1)return 'point';pointPassV27();continue;}
  if(gameState.chainWindow&&gameState.chain.length){if(gameState.chainWindow.priority===1)return 'chain';chainPassV2();continue;}
  if(pendingChoiceV49(gameState)){__choicePickV49(0);continue;}
  if(EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function settle(){for(let i=0;i<400;i++){
  if(pendingChoiceV49(gameState)){__choicePickV49(0);continue;}
  if(EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}

/* ===== A. one バトルフェーダー resolves: it is Special Summoned and the Battle Phase ends ===== */
fresh();
{
  const wight=mk('ワイト',0);gameState.players[0].mz=[wight];
  const fader=mk('バトルフェーダー',1);gameState.players[1].hand=[fader];
  gameState.phase='battle';gameState.activePlayer=0;
  baselineA();
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});
  const r=toDeclarationWindow();
  const resp=getChainResponsesV2(1);
  ok('A: at the direct attack declaration player 1 is offered バトルフェーダー from the hand',r!=='idle'&&resp.some(x=>x.card===fader),JSON.stringify({r,resp:resp.map(x=>x.db.n)}));
  if(r==='point')pointActivateV27(1,'hand',0);else duelActivateResponseV2(1,'hand',0);
  settle();
  ok('A: バトルフェーダー is Special Summoned in defense position; player 1 takes no damage; the Battle Phase is over',
    zoneOf(fader)==='mz'&&fader.pos==='def'&&gameState.players[1].lp===8000&&gameState.phase!=='battle'||(zoneOf(fader)==='mz'&&gameState.players[1].lp===8000&&!gameState.pendingAttack),
    JSON.stringify({fader:zoneOf(fader),pos:fader.pos,lp:gameState.players[1].lp,phase:gameState.phase,pendingAttack:!!gameState.pendingAttack}));
  audit('A');
}

/* ===== B. with its link on the chain, neither the same copy nor another copy can be activated again (09/12/09) ===== */
fresh();
{
  const wight=mk('ワイト',0);gameState.players[0].mz=[wight];
  const f1=mk('バトルフェーダー',1), f2=mk('バトルフェーダー',1);gameState.players[1].hand=[f1,f2];
  gameState.phase='battle';gameState.activePlayer=0;
  baselineA();
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});
  const r=toDeclarationWindow();
  if(r==='point')pointActivateV27(1,'hand',0);else duelActivateResponseV2(1,'hand',0);
  const onChain=gameState.chain.filter(l=>l.name==='バトルフェーダー').length;
  const again=getChainResponsesV2(1).filter(x=>x.db.n==='バトルフェーダー');
  const legalSame=strictScriptLegalityV2('バトルフェーダー',1,'hand',0,(typeof attackDeclareResponseOptsS03==='function'&&attackDeclareResponseOptsS03('バトルフェーダー',{}))||{});
  const legalOther=strictScriptLegalityV2('バトルフェーダー',1,'hand',1,(typeof attackDeclareResponseOptsS03==='function'&&attackDeclareResponseOptsS03('バトルフェーダー',{}))||{});
  ok('B: one バトルフェーダー link is on the chain',onChain===1,JSON.stringify(gameState.chain.map(l=>l.name)));
  ok('B: no バトルフェーダー is offered again while its link is on the chain (neither copy)',!again.length&&!legalSame.ok&&!legalOther.ok,
    JSON.stringify({again:again.map(x=>x.index),legalSame,legalOther}));
  settle();
  ok('B: the chain resolves once: exactly one バトルフェーダー is Special Summoned, the other stays in the hand',
    [f1,f2].filter(c=>zoneOf(c)==='mz').length===1&&[f1,f2].filter(c=>zoneOf(c)==='hand').length===1&&gameState.players[1].lp===8000,
    JSON.stringify({f1:zoneOf(f1),f2:zoneOf(f2),lp:gameState.players[1].lp}));
  audit('B');
}
`);
