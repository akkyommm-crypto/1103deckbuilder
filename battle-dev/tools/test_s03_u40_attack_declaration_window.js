/* S03-U40 C-S03-31 ATTACK_DECLARATION_RESPONSE_WINDOW — responses to an attack declaration in DUEL.
   Requirement: at the attack-declaration window the defender can activate cards that respond to 「相手モンスターの攻撃宣言時」, and the
   attacking player cannot activate them against its own attack.
   Found by R1 (Dragunity / レダメ provisional vs 1103兎ラギア) and measured in logs/S03_MEASURE_ATTACK_DECLARATION_WINDOW_20260913.md:
   the attacker was offered its own 聖なるバリア －ミラーフォース－ / 次元幽閉 at its own attack, while 31 of 37 attack-declaration cards
   (e.g. 攻撃の無力化, ドレインシールド) were never offered to the defender, because response legality at the POINT had no
   onAttackDeclare event context.
   Cards named here: 攻撃の無力化, ドレインシールド, 強制脱出装置, サイバー・ドラゴン (TESTED); ワイト (GENERIC_OK);
   聖なるバリア －ミラーフォース－, 次元幽閉 (declared IMPLEMENTED → TESTED by this unit). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function toPoint(){
  for(let i=0;i<80;i++){
    const w=gameState.processorWaiting;
    if(w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind==='attackDeclare')return true;
    if(pendingChoiceV49(gameState)){__choicePickV49(0);continue;}
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    return false;
  }
  return false;
}
function finish(){
  for(let i=0;i<300;i++){
    if(pendingChoiceV49(gameState)){__choicePickV49(0);continue;}
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    const w=gameState.processorWaiting;
    if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    return;
  }
}
function offered(p,name){return (getChainResponsesV2(p)||[]).filter(r=>r.db.n===name);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest including the final one',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
/* attacker 0 attacks defender 1's ワイト; defender 1 holds the named card set */
function board(setName,attackerHoldsIt){
  resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='battle';
  const atk=mk('サイバー・ドラゴン',0);gameState.players[0].mz=[atk];
  const def=mk('ワイト',1);gameState.players[1].mz=[def];
  const holder=attackerHoldsIt?0:1;
  const set=mk(setName,holder,'down');set.setTurn=gameState.turn-1;gameState.players[holder].sz=[set];
  /* the window only pauses when someone has a response: when the attacker holds the card, the defender holds a legal control card */
  if(attackerHoldsIt){const ctl=mk('強制脱出装置',1,'down');ctl.setTurn=gameState.turn-1;gameState.players[1].sz=[ctl];}
  baselineA();
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});
  return {atk,def,set,atPoint:toPoint()};
}

/* ===== A. 攻撃の無力化 is offered to the defender and negates the attack ===== */
let B=board('攻撃の無力化',false);
const offA=offered(1,'攻撃の無力化');
ok('A: at the attack-declaration window 攻撃の無力化 is offered to the defender',B.atPoint&&offA.length===1,JSON.stringify({atPoint:B.atPoint,offered:(getChainResponsesV2(1)||[]).map(r=>r.db.n)}));
if(offA.length)pointActivateV27(1,offA[0].zone,offA[0].index);
finish();
ok('A: the attack is negated — ワイト survives, no battle damage',z(B.def)==='mz'&&gameState.players[1].lp===8000&&!gameState.pendingAttack,
  JSON.stringify({def:z(B.def),lp:gameState.players[1].lp,phase:gameState.phase,pending:gameState.pendingAttack,toasts:TOASTS.slice(-3)}));
audit('A');

/* ===== B. ドレインシールド is offered and gains the attacker's ATK ===== */
B=board('ドレインシールド',false);
const offB=offered(1,'ドレインシールド');
ok('B: ドレインシールド is offered to the defender',B.atPoint&&offB.length===1,JSON.stringify({offered:(getChainResponsesV2(1)||[]).map(r=>r.db.n)}));
if(offB.length)pointActivateV27(1,offB[0].zone,offB[0].index);
finish();
ok('B: the attack is negated and the defender gains 2100 LP',z(B.def)==='mz'&&gameState.players[1].lp===10100,JSON.stringify({def:z(B.def),lp:gameState.players[1].lp,toasts:TOASTS.slice(-3)}));
audit('B');

/* ===== C / D. the attacking player is not offered its own ミラーフォース / 次元幽閉; the defender is ===== */
for(const [label,name] of [['C','聖なるバリア －ミラーフォース－'],['D','次元幽閉']]){
  B=board(name,true);
  ok(label+': '+name+' is NOT offered to the attacking player at its own attack',B.atPoint&&offered(0,name).length===0,JSON.stringify({offered0:(getChainResponsesV2(0)||[]).map(r=>r.db.n)}));
  B=board(name,false);
  const off=offered(1,name);
  ok(label+': '+name+' is offered to the defender',B.atPoint&&off.length===1,JSON.stringify({offered1:(getChainResponsesV2(1)||[]).map(r=>r.db.n)}));
  if(off.length)pointActivateV27(1,off[0].zone,off[0].index);
  finish();
  ok(label+': '+name+' removes the attacking サイバー・ドラゴン',z(B.atk)!=='mz'&&z(B.def)==='mz',JSON.stringify({atk:z(B.atk),def:z(B.def)}));
  audit(label);
}

/* ===== E. control: a free-chain trap still works at the window (強制脱出装置) ===== */
B=board('強制脱出装置',false);
const offE=offered(1,'強制脱出装置');
ok('E: 強制脱出装置 is still offered at the window',B.atPoint&&offE.length===1);
if(offE.length)pointActivateV27(1,offE[0].zone,offE[0].index);
finish();
ok('E: it returns the attacker to the hand',z(B.atk)==='hand',JSON.stringify({atk:z(B.atk)}));
audit('E');

/* ===== F. outside an attack, ミラーフォース cannot be activated in the Battle Phase ===== */
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='battle';
gameState.players[0].mz=[mk('サイバー・ドラゴン',0)];
const mf=mk('聖なるバリア －ミラーフォース－',1,'down');mf.setTurn=4;gameState.players[1].sz=[mf];baselineA();
ok('F: with no attack declared, ミラーフォース is refused',!strictScriptLegalityV2('聖なるバリア －ミラーフォース－',1,'sz',0,{}).ok);
`);
