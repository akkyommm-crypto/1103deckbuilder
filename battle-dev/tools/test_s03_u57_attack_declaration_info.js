/* S03-U57 C-S03-32 ATTACK_DECLARATION_INFO — battle identity / redirect is available at the DUEL attack-declaration POINT.
   Requirement: cards written against API.battleContext() / battleContextV28() must see the declared attack before Damage Step
   creates gameState.battle, and API.redirectAttack() must mutate the declared attack through replayable Actions instead of
   unjournaled direct writes. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function types(){return V41_ACTION_JOURNAL.map(x=>x.action.type);}
function actionOf(t){return V41_ACTION_JOURNAL.map(x=>x.action).find(a=>a&&a.type===t);}
function offered(p,name){return (getChainResponsesV2(p)||[]).filter(r=>r.db.n===name);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest including the final one',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function toAttackPoint(){
  for(let i=0;i<120;i++){
    const q=pendingChoiceV49(gameState); if(q){__choicePickV49(0);continue;}
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    const w=gameState.processorWaiting;
    if(w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind==='attackDeclare')return true;
    if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    return false;
  }
  return false;
}
function respondAndReturnPoint(name){
  let responded=false;
  for(let i=0;i<240;i++){
    const q=pendingChoiceV49(gameState); if(q){__choicePickV49(0);continue;}
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    const w=gameState.processorWaiting;
    if(w&&w.type==='POINT'&&gameState.processorPaused){
      const pl=w.payload||{};
      if(responded&&pl.kind==='attackDeclare')return true;
      if(!responded&&pl.kind==='attackDeclare'){
        const resp=offered(1,name);
        if(resp.length){responded=true;pointActivateV27(1,resp[0].zone,resp[0].index);continue;}
        return false;
      }
      pointPassV27();continue;
    }
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    return false;
  }
  return false;
}
function finish(){
  for(let i=0;i<420;i++){
    const q=pendingChoiceV49(gameState); if(q){__choicePickV49(0);continue;}
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    const w=gameState.processorWaiting;
    if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    return;
  }
}
function board(setName,defenders,target){
  resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='battle';
  const atk=mk('サイバー・ドラゴン',0);gameState.players[0].mz=[atk];
  const set=mk(setName,1,'down');set.setTurn=gameState.turn-1;gameState.players[1].sz=[set];
  gameState.players[1].mz=defenders.map(n=>mk(n,1));
  baselineA();
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target});
  return {atk,set,defs:gameState.players[1].mz.slice()};
}

/* ===== A. Attack-declaration battleContext falls back to pendingAttack. ===== */
let B=board('アストラルバリア',['ワイト','リバイバルスライム'],0);
ok('A setup: DUEL reaches the attack-declaration POINT before gameState.battle exists',toAttackPoint()&&!gameState.battle&&!!gameState.pendingAttack,
  JSON.stringify({battle:!!gameState.battle,pending:gameState.pendingAttack}));
let bc=API.battleContext(), ctx=battleContextV28();
ok('A: API.battleContext exposes the pending attacker and defender uid',
  !!bc&&bc.attackerUid===B.atk.uid&&bc.defenderUid===B.defs[0].uid&&bc.direct===false&&bc.step==='attackDeclare',
  JSON.stringify(bc));
ok('A: battleContextV28 exposes card handles during attack declaration',
  !!ctx&&ctx.atkCard===B.atk&&ctx.defCard===B.defs[0]&&ctx.target===0&&ctx.step==='attackDeclare',
  JSON.stringify({atk:ctx.atkName,def:ctx.defName,target:ctx.target,step:ctx.step}));
ok('A: アストラルバリア is offered from the pending attack context',offered(1,'アストラルバリア').length===1,
  JSON.stringify({offered:(getChainResponsesV2(1)||[]).map(r=>r.db.n)}));
respondAndReturnPoint('アストラルバリア');
const rA=actionOf('ATTACK_PENDING_RETARGET_S03');
ok('A: アストラルバリア resolves and journals direct retarget on the declared attack',
  !!rA&&rA.targetUid===null&&!!rA.redirectV6&&rA.redirectV6.toDirect===true,
  JSON.stringify({retarget:rA,types:types().slice(-8)}));
finish();
ok('A: direct redirect proceeds without attack replay despite defender monsters',
  !gameState.pendingAttack&&gameState.players[1].lp===5900&&z(B.defs[0])==='mz'&&z(B.defs[1])==='mz',
  JSON.stringify({lp:gameState.players[1].lp,defs:B.defs.map(z),toasts:TOASTS.slice(-4)}));
audit('A');

/* ===== B. 地縛霊の誘い can reselect the target while the attack is only pending. ===== */
B=board('地縛霊の誘い',['岩石の巨兵','ワイト'],1);
ok('B setup: 地縛霊の誘い is offered at the pending attack declaration',toAttackPoint()&&offered(1,'地縛霊の誘い').length===1);
respondAndReturnPoint('地縛霊の誘い');
ok('B: 地縛霊の誘い resolves and journals a targetUid change before Damage Step',
  !!actionOf('ATTACK_PENDING_RETARGET_S03')&&actionOf('ATTACK_PENDING_RETARGET_S03').targetUid===B.defs[0].uid,
  JSON.stringify({pending:gameState.pendingAttack,retarget:actionOf('ATTACK_PENDING_RETARGET_S03')}));
finish();
ok('B: the reselected 岩石の巨兵 is the monster that battled; original ワイト remains',
  !gameState.pendingAttack&&z(B.defs[1])==='mz'&&types().includes('ATTACK'),
  JSON.stringify({defs:B.defs.map(z),types:types().slice(-8)}));
audit('B');

/* ===== C. ディフェンド・スライム redirects to リバイバルスライム from the same shared API. ===== */
B=board('ディフェンド・スライム',['ワイト','リバイバルスライム'],0);
ok('C setup: ディフェンド・スライム is offered at the pending attack declaration',toAttackPoint()&&offered(1,'ディフェンド・スライム').length===1);
respondAndReturnPoint('ディフェンド・スライム');
ok('C: ディフェンド・スライム journals the attack target as リバイバルスライム',
  !!actionOf('ATTACK_PENDING_RETARGET_S03')&&actionOf('ATTACK_PENDING_RETARGET_S03').targetUid===B.defs[1].uid,
  JSON.stringify({pending:gameState.pendingAttack,retarget:actionOf('ATTACK_PENDING_RETARGET_S03')}));
finish();
ok('C: the original target remains available after the redirected battle resolves',
  !gameState.pendingAttack&&z(B.defs[0])==='mz'&&types().includes('ATTACK'),
  JSON.stringify({defs:B.defs.map(z),types:types().slice(-8)}));
audit('C');
`);
