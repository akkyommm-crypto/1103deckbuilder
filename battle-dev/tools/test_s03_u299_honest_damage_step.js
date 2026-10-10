/* S03-U299 (hand-trigger audit of the 13 major decks): オネスト is a Quick Effect (Spell Speed 2) activated from the hand during the Damage Step while one of
   your LIGHT monsters battles (「自分の光属性モンスターが戦闘を行うダメージステップ開始時からダメージ計算前までに、このカードを手札から墓地へ送って発動できる」).
   Before: the script lacked quickEffect:true, so the Damage Step windows of a real duel never offered it (getChainResponsesV2 skipped it; only a direct call could
   activate it), and the condition accepted any LIGHT monster on the field, in any battle. Real DUEL path (POINT windows), Replay-audited.
   A: own LIGHT attacker vs a monster: オネスト is offered in the Damage Step window, activated: ATK + the opposing monster's ATK, it is sent to the Graveyard, the
      opposing monster is destroyed and the opponent takes 1900 (1600 without オネスト).
   B: the opponent's LIGHT attacker vs own non-LIGHT monster: not offered to the defender (nor, for a non-LIGHT battle, to anyone).
   C: not offered in the attack declaration window (no Damage Step yet). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
const nm=c=>c?cardName(c):null;
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
const SEEN=[];
/* drive the real flow; at every POINT window record who is offered オネスト; take it when opts.take (player) is set */
function drive(opts){opts=opts||{};
  for(let i=0;i<800;i++){
    if(pc()){__choicePickV49(0);continue;}
    if(EVT_V2_STATE){const s=EVT_V2_STATE,g=s.groups[s.rank]||[];if(g.length&&s.rank<2)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    const w=gameState.processorWaiting;
    if(w&&w.type==='POINT'&&gameState.processorPaused){
      const kind=(w.payload&&w.payload.kind)||'',step=(w.payload&&w.payload.step)||'';
      let took=false;
      for(const p of [0,1]){
        const list=pointResponsesV27(p,w.payload)||[];
        const r=list.find(x=>x.db.n==='オネスト');
        if(r){SEEN.push({p,kind,step});if(opts.take===p&&!took){pointActivateV27(p,r.zone,r.index);took=true;break;}}
      }
      if(took)continue;
      pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    if(gameState.pendingSummon){commitPendingSummonV2();continue;}
    break;}
}
const filler=(n,p)=>Array.from({length:n},()=>mk('ワイト',p));

/* ===== A. own LIGHT attacker (ライオウ, ATK 1900) attacks ワイト; オネスト from the hand in the Damage Step ===== */
resetA();
gameState.activePlayer=0;gameState.turn=6;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x2990101;
{
  const atk=mk('ライオウ',0,'up','atk');atk.summonedTurn=3;
  const def=mk('ワイト',1,'up','atk');def.summonedTurn=3;
  gameState.players[0].mz=[atk];gameState.players[1].mz=[def];
  gameState.players[0].hand=[mk('オネスト',0,'down')];
  gameState.players[0].deck=filler(8,0);gameState.players[1].deck=filler(8,1);
  baselineA();
  const lp1=gameState.players[1].lp;
  requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive({});
  battlePickAttackerV29(atk.uid);battlePickTargetV29(def.uid);
  SEEN.length=0;
  drive({take:0});
  ok('A: オネスト is offered to its owner in the Damage Step window of the battle of its LIGHT monster',SEEN.some(x=>x.p===0&&x.kind==='damageStep'),JSON.stringify(SEEN));
  ok('A: it was activated and resolved: オネスト is in the Graveyard',gameState.players[0].grave.some(c=>nm(c)==='オネスト')&&!gameState.players[0].hand.some(c=>nm(c)==='オネスト')&&!gameState.chain.length,
    JSON.stringify({grave:gameState.players[0].grave.map(nm),hand:gameState.players[0].hand.map(nm)}));
  ok('A: the opposing monster is destroyed and the opponent takes 1900 (ライオウ 1900 + オネスト 300 - ワイト 300; 1600 without オネスト)',
    gameState.players[1].grave.some(c=>nm(c)==='ワイト')&&gameState.players[0].lp===8000&&gameState.players[1].lp===lp1-1900,
    JSON.stringify({lp0:gameState.players[0].lp,lp1:gameState.players[1].lp,grave1:gameState.players[1].grave.map(nm)}));
  audit('A');
}

/* ===== B. the opponent's LIGHT attacker vs own non-LIGHT monster: オネスト of the defender is not offered ===== */
resetA();
gameState.activePlayer=1;gameState.turn=6;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x2990102;
{
  const atk=mk('ライオウ',1,'up','atk');atk.summonedTurn=3;
  const def=mk('ワイト',0,'up','atk');def.summonedTurn=3;
  gameState.players[1].mz=[atk];gameState.players[0].mz=[def];
  gameState.players[0].hand=[mk('オネスト',0,'down')];
  gameState.players[0].deck=filler(8,0);gameState.players[1].deck=filler(8,1);
  baselineA();
  requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive({});
  battlePickAttackerV29(atk.uid);battlePickTargetV29(def.uid);
  SEEN.length=0;
  drive({take:0});
  ok('B: the defender is not offered オネスト when no LIGHT monster of his battles (it stays in the hand)',!SEEN.some(x=>x.p===0)&&gameState.players[0].hand.some(c=>nm(c)==='オネスト'),JSON.stringify(SEEN));
  ok('B: the legality check agrees: not legal',!strictScriptLegalityV2('オネスト',0,'hand',0,{}).ok,JSON.stringify(strictScriptLegalityV2('オネスト',0,'hand',0,{})));
}

/* ===== C. attack declaration window: no Damage Step yet ===== */
resetA();
gameState.activePlayer=0;gameState.turn=6;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x2990103;
{
  const atk=mk('ライオウ',0,'up','atk');atk.summonedTurn=3;
  const def=mk('ワイト',1,'up','atk');def.summonedTurn=3;
  gameState.players[0].mz=[atk];gameState.players[1].mz=[def];
  gameState.players[0].hand=[mk('オネスト',0,'down')];
  gameState.players[0].deck=filler(8,0);gameState.players[1].deck=filler(8,1);
  baselineA();
  requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive({});
  battlePickAttackerV29(atk.uid);battlePickTargetV29(def.uid);
  SEEN.length=0;
  drive({});
  ok('C: the offers are only in Damage Step windows (never in the attack declaration or the battle step windows)',SEEN.length>0&&SEEN.every(x=>x.kind==='damageStep'),JSON.stringify(SEEN));
}
`);
