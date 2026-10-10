/* S03-U86: 盗賊の七つ道具 / ナチュル・パルキオン — priority #7's IMPLEMENTED-tier audit picked up
   盗賊の七つ道具 (Seven Tools of the Bandit, qty=7 across jurrac/karakuri/tg_skill main decks) next after
   S03-U85's 月の書. Reading its existing implementation (cards/20_control_counter.js) surfaced a real,
   previously-undiscovered ENGINE_MISSING bug shared with ナチュル・パルキオン: real "when a Trap Card is
   activated: negate that activation and destroy it" text needs the S03-U18/C-S03-15 activation-response
   mechanism (ctx.event, declareActivationResponseS03 — engine/1P_activation_response_s03.js) exactly like
   マジック・ジャマー and the other 21 declared cards. Neither card ever used it: both freely selected ANY
   Trap card sitting in the S/T zone as a manual target with no chain-response gating at all, meaning they
   were illegally activatable with no Trap Card activation in progress (a stray already-resolved Continuous
   Trap could be destroyed for free at any time the player had priority). This bug class was never caught by
   the original C-S03-15 audit because it was scoped to scripts that already referenced ctx.event/
   onActivateSuccess; these two never did. Fixed by converting both to the same ctx.event + API.negateChainLink
   pattern as 王宮の陥落/マジック・ジャマー, and declaring them in ACTIVATION_RESPONSE_S03. This test also
   promotes both cards IMPLEMENTED->TESTED. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=1;gameState.phase='main1';}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function settle(){for(let k=0;k<16;k++){const r=drive();if(r!=='idle'&&r!=='loop')return r;return r;}return 'loop';}
function chainNames(){return gameState.chain.map(l=>l.name);}
function responses(p){return getChainResponsesV2(p).map(x=>x.db.n);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,260));}
`;

/* ===== A. 盗賊の七つ道具 really responds to a real Trap Card activation: negates and destroys it,
   confirming the trap's own resolve() never runs (trapStun flag never set), pays the real 1000 LP cost,
   and itself resolves normally to the grave. ===== */
harness(COMMON+String.raw`
fresh();
const st=mk('盗賊の七つ道具',0,'down'); st.setTurn=gameState.turn-1;
const ts=mk('トラップ・スタン',1,'down'); ts.setTurn=gameState.turn-1;
gameState.players[0].sz=[st];
gameState.players[0].lp=8000;
gameState.players[1].sz=[ts];
baselineA();
ok('A: with no chain open, 盗賊の七つ道具 is not a legal activation',!strictScriptLegalityV2('盗賊の七つ道具',0,'sz',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('盗賊の七つ道具',0,'sz',0,{})));
duelActivateFromZone(1,'sz',0);
ok('A: P2 really activates トラップ・スタン; P1’s real chain responses list 盗賊の七つ道具',
  chainNames().join()==='トラップ・スタン'&&responses(0).includes('盗賊の七つ道具'),JSON.stringify({chain:chainNames(),resp:responses(0)}));
duelActivateResponseV2(0,'sz',0);
settle();
ok('A: resolution really negates and destroys トラップ・スタン; its own resolve() never ran (trapStun flag never set)',
  gameState.players[1].grave.some(c=>nm(c)==='トラップ・スタン')&&!gameState.players[1].sz.some(c=>nm(c)==='トラップ・スタン')
  &&!(gameState.players[0].temporaryFlags&&gameState.players[0].temporaryFlags.trapStun)&&!gameState.chain.length,
  JSON.stringify({p1sz:gameState.players[1].sz.map(nm),p1grave:gameState.players[1].grave.map(nm),flags:gameState.players[0].temporaryFlags}));
ok('A: 盗賊の七つ道具 itself resolves to the grave and its real 1000 LP cost was really paid',
  gameState.players[0].grave.some(c=>nm(c)==='盗賊の七つ道具')&&gameState.players[0].lp===7000,
  JSON.stringify({p0grave:gameState.players[0].grave.map(nm),lp:gameState.players[0].lp}));
audit('A');
`);

/* ===== B. ナチュル・パルキオン (same bug, same fix) really responds to a real Trap Card activation from
   the field as a face-up monster effect, paying its real banish-2-from-grave cost. ===== */
harness(COMMON+String.raw`
fresh();
const bk=mk('ナチュル・パルキオン',0,'up');
const ts=mk('トラップ・スタン',1,'down'); ts.setTurn=gameState.turn-1;
gameState.players[0].mz=[bk];
gameState.players[0].grave=[mk('ワイト'),mk('もけもけ')];
gameState.players[1].sz=[ts];
baselineA();
duelActivateFromZone(1,'sz',0);
ok('B: P1’s real chain responses list ナチュル・パルキオン',responses(0).includes('ナチュル・パルキオン'),JSON.stringify(responses(0)));
duelActivateResponseV2(0,'mz',0);
for(let k=0;k<4&&pendingChoiceV49(gameState);k++)__choicePickV49(0);
settle();
ok('B: resolution really negates and destroys トラップ・スタン; ナチュル・パルキオン really banished 2 real GY cards as cost',
  gameState.players[1].grave.some(c=>nm(c)==='トラップ・スタン')&&gameState.players[0].banish.length===2
  &&!gameState.players[0].grave.length&&!gameState.chain.length,
  JSON.stringify({p1grave:gameState.players[1].grave.map(nm),banish:gameState.players[0].banish.map(nm),p0grave:gameState.players[0].grave.map(nm)}));
audit('B');
`);

/* ===== C. Negative control: 盗賊の七つ道具 with the controller's own LP at exactly 1000 (not more than
   1000) is correctly refused even while a real Trap Card activation is on the chain. ===== */
harness(COMMON+String.raw`
fresh();
const st=mk('盗賊の七つ道具',0,'down'); st.setTurn=gameState.turn-1;
const ts=mk('トラップ・スタン',1,'down'); ts.setTurn=gameState.turn-1;
gameState.players[0].sz=[st];
gameState.players[0].lp=1000;
gameState.players[1].sz=[ts];
baselineA();
duelActivateFromZone(1,'sz',0);
ok('C: with LP not more than 1000, 盗賊の七つ道具 is correctly excluded from the real chain responses even though a real Trap just activated',
  !responses(0).includes('盗賊の七つ道具'),JSON.stringify(responses(0)));
`);

/* ===== D. Negative control: with no chain open at all, neither card is a legal activation (the
   original bug this unit fixes). ===== */
harness(COMMON+String.raw`
fresh();
const bk=mk('ナチュル・パルキオン',0,'up');
gameState.players[0].mz=[bk];
gameState.players[0].grave=[mk('ワイト'),mk('もけもけ')];
baselineA();
ok('D: with no chain open, ナチュル・パルキオン is not a legal activation',!strictScriptLegalityV2('ナチュル・パルキオン',0,'mz',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('ナチュル・パルキオン',0,'mz',0,{})));
`);
