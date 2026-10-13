/* S03-U306: オネスト — 「このカードを手札から墓地へ送って発動できる」: the Graveyard send is the COST, paid at activation.
   Before: the card was discarded after resolution (afterResolve), so while it was on the chain it was still in the hand and every chain window offered it again:
   the R1 responder put the same card (one uid) on the chain without end and the duel never returned (major-deck sweep, worm vs agent, seed 0x53040018).
   Real DUEL path (POINT window of the Damage Step, chain windows), Replay-audited.
   A: one オネスト: at activation it has left the hand for the Graveyard, the chain has 1 link, no response is offered any more (the second activation of
      the same card is impossible), and it resolves: ATK + the opposing monster's ATK (ライオウ 1900 + 300 vs ワイト 300 → the opponent takes 1900).
   B: two オネスト: both can be activated (chain of 2, both in the Graveyard, hand empty) — a legal chain; ATK 1900 + 300 + 300 vs 300 → 2200.
   C: the responder loop itself: with one オネスト the player is offered the card in the chain window exactly zero times after activating it. */
const harness=require('./astra_harness');
harness(String.raw`
const nm=c=>c?cardName(c):null;
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
const filler=(n,p)=>Array.from({length:n},()=>mk('ワイト',p));
const hasHonest=l=>(l||[]).some(x=>x.db&&x.db.n==='オネスト');
/* drive the real flow; at the first Damage Step POINT window where p0 is offered オネスト take it up to opts.times times; snapshot right after each activation */
function drive(opts){opts=opts||{};const snaps=[];let took=0,offersAfter=0;
  for(let i=0;i<800;i++){
    if(pc()){__choicePickV49(0);continue;}
    if(EVT_V2_STATE){const s=EVT_V2_STATE,g=s.groups[s.rank]||[];if(g.length&&s.rank<2)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){
      /* the chain window after an activation: record whether the activator is offered オネスト again, take it again if the test wants a second copy */
      const offer=getChainResponsesV2(0).find(x=>x.db.n==='オネスト');
      if(snaps.length&&snaps.length===took&&!snaps[took-1].offerChecked){snaps[took-1].offerChecked=true;snaps[took-1].offeredAgain=!!offer;}
      if(offer&&took<(opts.times||0)){took++;duelActivateResponseV2(0,offer.zone,offer.index);snaps.push({chain:gameState.chain.length,hand:gameState.players[0].hand.map(nm),grave:gameState.players[0].grave.map(nm)});continue;}
      if(offer)offersAfter++;
      chainPassV2();continue;}
    const w=gameState.processorWaiting;
    if(w&&w.type==='POINT'&&gameState.processorPaused){
      const r=took<(opts.times||0)?(pointResponsesV27(0,w.payload)||[]).find(x=>x.db.n==='オネスト'):null;
      if(r){took++;pointActivateV27(0,r.zone,r.index);snaps.push({chain:gameState.chain.length,hand:gameState.players[0].hand.map(nm),grave:gameState.players[0].grave.map(nm)});continue;}
      pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    if(gameState.pendingSummon){commitPendingSummonV2();continue;}
    break;}
  return {snaps,took,offersAfter};
}
function setup(seed,nHonest){
  resetA();gameState.activePlayer=0;gameState.turn=6;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=seed;
  const atk=mk('ライオウ',0,'up','atk');atk.summonedTurn=3;
  const def=mk('ワイト',1,'up','atk');def.summonedTurn=3;
  gameState.players[0].mz=[atk];gameState.players[1].mz=[def];
  gameState.players[0].hand=Array.from({length:nHonest},()=>mk('オネスト',0,'down'));
  gameState.players[0].deck=filler(8,0);gameState.players[1].deck=filler(8,1);
  baselineA();
  const lp1=gameState.players[1].lp;
  requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive({});
  battlePickAttackerV29(atk.uid);battlePickTargetV29(def.uid);
  return {atk,def,lp1};
}

/* ===== A + C. one オネスト ===== */
{
  const {lp1}=setup(0x3060101,1);
  const r=drive({times:1});
  const s=r.snaps[0]||{};
  ok('A: activated once; right after activation the card is already in the Graveyard and not in the hand (cost paid at activation)',
    r.took===1&&s.chain===1&&!(s.hand||[]).includes('オネスト')&&(s.grave||[]).includes('オネスト'),JSON.stringify(r));
  ok('C: the activator is not offered the same オネスト again in the chain window (no responder loop)',s.offeredAgain===false&&r.offersAfter===0,JSON.stringify(r));
  ok('A: it resolved: the opposing monster is destroyed and the opponent takes 1900',
    !gameState.chain.length&&gameState.players[1].grave.some(c=>nm(c)==='ワイト')&&gameState.players[1].lp===lp1-1900&&gameState.players[0].lp===8000,
    JSON.stringify({chain:gameState.chain.length,lp:[gameState.players[0].lp,gameState.players[1].lp],g1:gameState.players[1].grave.map(nm)}));
  ok('A: exactly one オネスト in the Graveyard afterwards',gameState.players[0].grave.filter(c=>nm(c)==='オネスト').length===1);
  audit('A');
}
/* ===== B. two オネスト ===== */
{
  const {lp1}=setup(0x3060102,2);
  const r=drive({times:2});
  const s=r.snaps[1]||{};
  ok('B: both copies activated: chain of 2, hand empty, both in the Graveyard at that point',
    r.took===2&&s.chain===2&&!(s.hand||[]).includes('オネスト')&&(s.grave||[]).filter(n=>n==='オネスト').length===2,JSON.stringify(r));
  ok('B: both resolved: ATK 1900 + 300 + 300 vs 300, the opponent takes 2200',
    !gameState.chain.length&&gameState.players[1].lp===lp1-2200&&gameState.players[1].grave.some(c=>nm(c)==='ワイト'),
    JSON.stringify({chain:gameState.chain.length,lp:[gameState.players[0].lp,gameState.players[1].lp]}));
  audit('B');
}
`);
