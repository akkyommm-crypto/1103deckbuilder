/* S03-U39 C-S03-30 ATTACK_STATE_JOURNAL — the attack in progress (pendingAttack / attackNegated) changes only through Actions.
   Requirement: a response at attack declaration (a Trap activated while the attack is pending) must replay. Found by the R1 real-duel run
   in responder mode: seeds 0x52310007 and 0x5231000a diverged right after ATTACK_DECLARE_V48; the only differing digest part was
   pendingAttack, which the battle processor set and cleared by direct writes (and attack-negating scripts wrote attackNegated directly).
   The same run found End-Phase runtime-effect expiry applied outside Actions (seed 0x52310007 turn 23, part runtimeEffects).
   Responses at the POINT go through pointActivateV27 (the UI path, which reopens the POINT after the chain).
   Cards named here: 強制脱出装置, くず鉄のかかし, サイバー・ドラゴン (TESTED); ワイト (GENERIC_OK). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
/* pass everything; at the first attack-declaration POINT, the defending player activates the named set card */
function run(respondName){
  let responded=false;
  for(let i=0;i<400;i++){
    const q=pendingChoiceV49(gameState); if(q){__choicePickV49(0);continue;}
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    const w=gameState.processorWaiting;
    if(w&&w.type==='POINT'&&gameState.processorPaused){
      const pl=w.payload||{};
      if(respondName&&!responded&&pl.kind==='attackDeclare'){
        const pr=pl.priority!=null?pl.priority:gameState.activePlayer, foe=gameState.activePlayer===0?1:0;
        const resp=(getChainResponsesV2(foe)||[]).filter(r=>r.db.n===respondName);
        /* the UI activates a response at a POINT with pointActivateV27, which reopens the POINT after the chain */
        if(resp.length){responded=true;pointActivateV27(foe,resp[0].zone,resp[0].index);continue;}
      }
      pointPassV27();continue;
    }
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    return responded;
  }
  return responded;
}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest including the final one',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function board(setName){
  resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='battle';
  const atk=mk('サイバー・ドラゴン',0);gameState.players[0].mz=[atk];
  const set=setName?mk(setName,1,'down'):null;if(set){set.setTurn=gameState.turn-1;gameState.players[1].sz=[set];}
  baselineA();
  return {atk,set};
}
function types(){return V41_ACTION_JOURNAL.map(x=>x.action.type);}

/* ===== A. 強制脱出装置 at attack declaration returns the attacker ===== */
let B=board('強制脱出装置');
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});
const respA=run('強制脱出装置');
ok('A: 強制脱出装置 is activated at the attack declaration and returns サイバー・ドラゴン to the hand; no damage',
  respA&&z(B.atk)==='hand'&&gameState.players[1].lp===8000&&!gameState.pendingAttack&&types().includes('ATTACK_PENDING_CLEAR_S03'),
  JSON.stringify({respA,atk:z(B.atk),lp:gameState.players[1].lp,pending:gameState.pendingAttack,types:types().slice(-8)}));
audit('A');

/* ===== C. くず鉄のかかし negates the attack through NEGATE_ATTACK_V45 and is set again ===== */
B=board('くず鉄のかかし');
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});
const respC=run('くず鉄のかかし');
ok('C: くず鉄のかかし negates the attack (journaled NEGATE_ATTACK_V45), no damage, and it is set again',
  respC&&gameState.players[1].lp===8000&&types().includes('NEGATE_ATTACK_V45')&&z(B.set)==='sz'&&(findCardByUid(B.set.uid)||{card:{}}).card.face==='down',
  JSON.stringify({respC,lp:gameState.players[1].lp,set:z(B.set),types:types().slice(-8)}));
audit('C');

/* ===== D. control: no response, the attack goes through ===== */
B=board(null);
gameState.players[1].mz=[mk('ワイト',1)];baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});
run(null);
ok('D: without a response the attack destroys ワイト and the attack state ends cleared',
  (findCardByUid(gameState.players[0].mz[0].uid)||{}).zone==='mz'&&!gameState.players[1].mz.some(c=>nm(c)==='ワイト')&&!gameState.pendingAttack,
  JSON.stringify({mz1:gameState.players[1].mz.map(nm),pending:gameState.pendingAttack,types:types().slice(-6)}));
audit('D');

/* ===== E. a runtime effect that ends in the End Phase expires through an Action (Replay keeps it in step) ===== */
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main2';
const srcE=mk('サイバー・ドラゴン',0);gameState.players[0].mz=[srcE];baselineA();
v4RegisterRuntimeEffect({owner:0,controller:0,code:'u39-end-test',kind:'u39EndTest',sourceCard:srcE,resetMask:RESET.END});
ok('E setup: the End-Phase runtime effect is registered',(gameState.runtimeEffects||[]).some(e=>e.code==='u39-end-test'));
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});run(null);
ok('E: reaching the End Phase ends the effect through a journaled V4_EFFECT_RESET_S03',
  !(gameState.runtimeEffects||[]).some(e=>e.code==='u39-end-test')&&types().includes('V4_EFFECT_RESET_S03'),
  JSON.stringify({phase:gameState.phase,effects:(gameState.runtimeEffects||[]).map(e=>e.code),types:types().slice(-6)}));
audit('E');
`);
