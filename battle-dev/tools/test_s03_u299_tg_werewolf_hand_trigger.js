/* S03-U299 (Opus ruling): TG ワーウルフ ① 「レベル4以下のモンスターが特殊召喚された時に発動できる。このカードを手札から特殊召喚する」 is an optional trigger effect
   (Spell Speed 1) activated from the hand at that timing only — like ドッペル・ウォリアー ①. Before: after the Special Summon of a Level 4 or lower monster the
   hand effect was offered neither in the SEGOC selection nor in the POINT window; only a later main-phase activation from the hand was legal.
   Real DUEL path (the SEGOC selection of the event), Replay-audited.
   A: a card effect (API) Special Summons a Level 4 or lower monster: TG ワーウルフ in the turn player's hand is offered in the SEGOC selection, resolves.
   B: the opponent's real ワン・フォー・ワン Special Summons a Level 1 monster: TG ワーウルフ in the other player's hand is offered, resolves.
   C: not offered for a Level 8 Special Summon, for a Rank 4 Xyz Summon, nor with a full Monster Zone.
   D: declined at the Special Summon, it is no longer legal later in the main phase (neither by the legality check nor by the activation).
   E: not legal in the main phase without a Special Summon. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
const nm=c=>c?cardName(c):null;
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function finish(){
  for(let i=0;i<400;i++){
    if(pc()){__choicePickV49(0);continue;}
    if(EVT_V2_STATE){const s=EVT_V2_STATE,g=s.groups[s.rank]||[];if(g.length&&s.rank<2)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    if(gameState.pendingSummon){commitPendingSummonV2();continue;}
    break;}
}
/* run the real flow until the SEGOC selection offers TG ワーウルフ (index into the open group) or nothing is left to do; returns the index or -1 */
function runToOffer(){
  for(let i=0;i<600;i++){
    if(pc()){__choicePickV49(0);continue;}
    if(EVT_V2_STATE){const s=EVT_V2_STATE,g=s.groups[s.rank]||[];const k=g.findIndex(c=>c.name==='TG ワーウルフ');if(k>=0)return k;if(g.length&&s.rank<2)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    if(gameState.pendingSummon){commitPendingSummonV2();continue;}
    break;}
  return -1;
}
const filler=(n,p)=>Array.from({length:n},()=>mk('ワイト',p));
const wolfIn=(p)=>gameState.players[p].mz.some(c=>nm(c)==='TG ワーウルフ');

/* ===== A. API Special Summon of a Level 4 or lower monster; TG ワーウルフ in the turn player's hand ===== */
resetA();
gameState.activePlayer=0;gameState.turn=6;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x2990001;
{
  gameState.players[0].hand=[mk('TG ワーウルフ',0,'down')];
  gameState.players[1].hand=[mk('もけもけ',1)];
  gameState.players[0].deck=filler(8,0);gameState.players[1].deck=filler(8,1);
  baselineA();
  API.specialSummon(1,'hand',0,'atk','test');
  flushDeferredEventsThroughProcessorV27();
  const st=EVT_V2_STATE,k=st?st.groups[st.rank].findIndex(c=>c.name==='TG ワーウルフ'):-1;
  ok('A: after the Special Summon of a Level 4 or lower monster TG ワーウルフ is offered in the SEGOC selection (optional trigger)',k>=0&&st.rank===2,JSON.stringify({rank:st&&st.rank,names:st&&st.groups[st.rank].map(c=>c.name)}));
  if(k>=0)eventPickV2(k);
  ok('A: its chain link is on the chain with Spell Speed 1',gameState.chain.length===1&&gameState.chain[0].name==='TG ワーウルフ'&&gameState.chain[0].ss===1,JSON.stringify(gameState.chain.map(l=>l.name+'/ss'+l.ss)));
  finish();
  ok('A: it resolves: TG ワーウルフ is Special Summoned, nothing is left pending',wolfIn(0)&&!gameState.players[0].hand.length&&!gameState.chain.length&&!EVT_V2_STATE&&!pc(),JSON.stringify({mz:gameState.players[0].mz.map(nm),hand:gameState.players[0].hand.map(nm)}));
  audit('A');
}

/* ===== B. The opponent's real ワン・フォー・ワン (Level 1 from the Deck); TG ワーウルフ in the other player's hand ===== */
resetA();
gameState.activePlayer=1;gameState.turn=6;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x2990002;
{
  gameState.players[0].hand=[mk('TG ワーウルフ',0,'down')];
  gameState.players[1].hand=[mk('ワン・フォー・ワン',1),mk('もけもけ',1)];
  gameState.players[1].deck=[mk('バット',1)].concat(filler(7,1));gameState.players[0].deck=filler(8,0);
  baselineA();
  duelActivateFromHand(0);
  const k=runToOffer();
  ok('B: after the real Special Summon of a Level 1 monster TG ワーウルフ is offered in the SEGOC selection of the non-turn player',k>=0&&gameState.players[1].mz.some(c=>nm(c)==='バット'),JSON.stringify({k,mz:gameState.players[1].mz.map(nm)}));
  if(k>=0)eventPickV2(k);
  finish();
  ok('B: it resolves: TG ワーウルフ is Special Summoned',wolfIn(0)&&!gameState.chain.length&&!EVT_V2_STATE&&!pc(),JSON.stringify({mz:gameState.players[0].mz.map(nm)}));
  audit('B');
}

/* ===== C. Not offered: Level 8 Special Summon, Rank 4 Xyz Summon, full Monster Zone ===== */
resetA();
gameState.activePlayer=0;gameState.turn=6;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x2990003;
{
  gameState.players[0].hand=[mk('TG ワーウルフ',0,'down')];
  gameState.players[1].hand=[mk('青眼の白龍',1)];
  gameState.players[0].deck=filler(8,0);gameState.players[1].deck=filler(8,1);
  baselineA();
  API.specialSummon(1,'hand',0,'atk','test');
  flushDeferredEventsThroughProcessorV27();
  const k=runToOffer();
  ok('C: a Special Summon of a Level 8 monster does not offer TG ワーウルフ',k<0&&gameState.players[0].hand.some(c=>nm(c)==='TG ワーウルフ')&&!wolfIn(0),JSON.stringify({k,hand:gameState.players[0].hand.map(nm)}));
}
resetA();
gameState.activePlayer=1;gameState.turn=6;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x2990004;
{
  gameState.players[0].hand=[mk('TG ワーウルフ',0,'down')];
  const hope=mk('No.39 希望皇ホープ',1);
  gameState.players[1].mz=[mk('アックス・レイダー',1),mk('アンモ・ナイト',1)];
  gameState.players[1].ex=[hope];
  gameState.players[0].deck=filler(8,0);gameState.players[1].deck=filler(8,1);
  baselineA();
  const combos=exCombos(1,dbOf(hope)).combos;
  if(combos.length)doExSummon(1,0,combos[0].materials,'xyz','atk');
  flushDeferredEventsThroughProcessorV27();
  const k=runToOffer();
  ok('C: a Rank 4 Xyz Summon does not offer TG ワーウルフ (Xyz Monsters have no Level)',combos.length>0&&gameState.players[1].mz.some(c=>nm(c)==='No.39 希望皇ホープ')&&k<0&&!wolfIn(0),JSON.stringify({combos:combos.length,k}));
}
resetA();
gameState.activePlayer=0;gameState.turn=6;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x2990005;
{
  gameState.players[0].hand=[mk('TG ワーウルフ',0,'down')];
  gameState.players[0].mz=[mk('ワイト',0),mk('ワイト',0),mk('ワイト',0),mk('ワイト',0),mk('ワイト',0)];
  gameState.players[1].hand=[mk('もけもけ',1)];
  gameState.players[0].deck=filler(8,0);gameState.players[1].deck=filler(8,1);
  baselineA();
  API.specialSummon(1,'hand',0,'atk','test');
  flushDeferredEventsThroughProcessorV27();
  const k=runToOffer();
  ok('C: with a full Monster Zone TG ワーウルフ is not offered',k<0&&gameState.players[0].hand.some(c=>nm(c)==='TG ワーウルフ'),JSON.stringify({k,mz:gameState.players[0].mz.length}));
}

/* ===== D. Declined at the Special Summon: no later main-phase activation ===== */
resetA();
gameState.activePlayer=0;gameState.turn=6;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x2990006;
{
  gameState.players[0].hand=[mk('TG ワーウルフ',0,'down')];
  gameState.players[1].hand=[mk('もけもけ',1)];
  gameState.players[0].deck=filler(8,0);gameState.players[1].deck=filler(8,1);
  baselineA();
  API.specialSummon(1,'hand',0,'atk','test');
  flushDeferredEventsThroughProcessorV27();
  const k=runToOffer();
  /* decline: pass the optional selection without taking TG ワーウルフ */
  for(let i=0;i<400&&EVT_V2_STATE;i++)eventSkipGroupV2();
  finish();
  gameState.timingWindow=null;
  const L=strictScriptLegalityV2('TG ワーウルフ',0,'hand',0,{});
  ok('D: it was offered and declined; later in the main phase the legality check refuses it',k>=0&&!L.ok&&gameState.players[0].hand.some(c=>nm(c)==='TG ワーウルフ'),JSON.stringify({k,L}));
  duelActivateFromZone(0,'hand',0);
  finish();
  ok('D: a later main-phase activation from the hand puts nothing on the chain and TG ワーウルフ stays in the hand',!wolfIn(0)&&gameState.players[0].hand.some(c=>nm(c)==='TG ワーウルフ')&&!gameState.chain.length,JSON.stringify({mz:gameState.players[0].mz.map(nm),hand:gameState.players[0].hand.map(nm)}));
  audit('D');
}

/* ===== E. No Special Summon: not legal ===== */
resetA();
gameState.activePlayer=0;gameState.turn=6;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x2990007;
{
  gameState.players[0].hand=[mk('TG ワーウルフ',0,'down')];
  gameState.players[0].deck=filler(8,0);gameState.players[1].deck=filler(8,1);
  baselineA();
  const L=strictScriptLegalityV2('TG ワーウルフ',0,'hand',0,{});
  ok('E: without a Special Summon the hand effect is not legal in the main phase',!L.ok,JSON.stringify(L));
}
`);
