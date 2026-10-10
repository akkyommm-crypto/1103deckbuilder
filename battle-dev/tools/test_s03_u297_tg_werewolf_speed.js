/* S03-U297: TG ワーウルフ / TG ストライカー — both effects are monster effects that are not Quick Effects, so their chain links have Spell Speed 1
   (Opus ruling 2026-10-09: the Special Summon from the hand and the End Phase search from the Graveyard are monster trigger effects of Spell Speed 1).
   They were registered with priority 2 (Spell Speed 2): the link carried SS2 and a Spell Speed 1 effect stacked in the same SEGOC selection was refused
   (the R1 End Phase loop that S03-U296 patched on the receiving side). Real DUEL path, Replay-audited.
   A: the Graveyard effect (End Phase, destroyed this turn) is activated: its link is SS1.
   B: the hand effect (a Level 4 or lower monster was Special Summoned this turn): its link is SS1.
   C: TG ストライカー's Graveyard effect: its link is SS1.
   D: the End Phase selection with TG ワーウルフ + TG ラッシュ・ライノ: both links are SS1 (nothing is refused, nothing is stuck). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function finish(){
  for(let i=0;i<400;i++){
    if(pc()){__choicePickV49(0);continue;}
    if(EVT_V2_STATE){const s=EVT_V2_STATE,g=s.groups[s.rank]||[];if(g.length&&s.rank<2)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    break;}
}
const links=()=>gameState.chain.map(l=>l.name+'/ss'+l.ss);
ok('the scripts carry Spell Speed 1 (not a Quick Effect)',
  scriptSpellSpeed(CARD_SCRIPTS['TG ワーウルフ'],dbOf({id:findCardIndex('TG ワーウルフ')}))===1&&scriptSpellSpeed(CARD_SCRIPTS['TG ストライカー'],dbOf({id:findCardIndex('TG ストライカー')}))===1,
  JSON.stringify({wolf:CARD_SCRIPTS['TG ワーウルフ'].priority,striker:CARD_SCRIPTS['TG ストライカー'].priority}));

/* ===== A. Graveyard effect of TG ワーウルフ ===== */
resetA();
gameState.activePlayer=0;gameState.turn=6;gameState.phase='main2';gameState.rngInitialSeed=gameState.rngState=0x2970001;
{
  const wolf=mk('TG ワーウルフ',0,'up');wolf.graveInfo={byDestroy:true,from:'mz',turn:6};
  gameState.players[0].grave=[wolf];
  gameState.players[0].deck=[mk('TG ストライカー',0,'down')].concat(Array.from({length:8},()=>mk('ワイト',0)));
  gameState.players[1].deck=Array.from({length:8},()=>mk('ワイト',1));
  baselineA();
  requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});
  const st=EVT_V2_STATE;
  ok('A: the End Phase offers the Graveyard effect (optional trigger)',!!st&&st.groups[st.rank].some(c=>c.name==='TG ワーウルフ'),JSON.stringify({rank:st&&st.rank}));
  const s=EVT_V2_STATE;if(s)eventPickV2(s.groups[s.rank].findIndex(c=>c.name==='TG ワーウルフ'));
  ok('A: its chain link is Spell Speed 1',gameState.chain.length===1&&gameState.chain[0].ss===1,JSON.stringify(links()));
  finish();
  ok('A: the effect resolves: TG ストライカー is added to the hand, the chain is over',gameState.players[0].hand.some(c=>cardName(c)==='TG ストライカー')&&gameState.chain.length===0&&!pc(),JSON.stringify(gameState.players[0].hand.map(c=>cardName(c))));
  audit('A');
}

/* ===== B. Hand effect of TG ワーウルフ ===== */
resetA();
gameState.activePlayer=0;gameState.turn=6;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x2970002;
{
  const wolf=mk('TG ワーウルフ',0,'down');
  gameState.players[0].hand=[wolf];
  gameState.players[1].hand=[mk('もけもけ',1)];
  gameState.players[0].deck=Array.from({length:8},()=>mk('ワイト',0));
  gameState.players[1].deck=Array.from({length:8},()=>mk('ワイト',1));
  baselineA();
  API.specialSummon(1,'hand',0,'atk','test');
  /* S03-U299 (Opus ruling): the hand effect is a trigger at the Special Summon only — it is taken from the SEGOC selection of that event */
  flushDeferredEventsThroughProcessorV27();
  const bs=EVT_V2_STATE,bi=bs?bs.groups[bs.rank].findIndex(c=>c.name==='TG ワーウルフ'):-1;
  ok('B: after a Level 4 or lower Special Summon the hand effect is offered in the SEGOC selection',bi>=0,JSON.stringify({rank:bs&&bs.rank}));
  if(bi>=0)eventPickV2(bi);
  ok('B: its chain link is Spell Speed 1',gameState.chain.length===1&&gameState.chain[0].ss===1,JSON.stringify(links()));
  finish();
  ok('B: the effect resolves: TG ワーウルフ is Special Summoned',gameState.players[0].mz.some(c=>cardName(c)==='TG ワーウルフ')&&gameState.chain.length===0,JSON.stringify(gameState.players[0].mz.map(c=>cardName(c))));
  audit('B');
}

/* ===== C. Graveyard effect of TG ストライカー ===== */
resetA();
gameState.activePlayer=0;gameState.turn=6;gameState.phase='main2';gameState.rngInitialSeed=gameState.rngState=0x2970003;
{
  const st0=mk('TG ストライカー',0,'up');st0.graveInfo={byDestroy:true,from:'mz',turn:6};
  gameState.players[0].grave=[st0];
  gameState.players[0].deck=[mk('TG ワーウルフ',0,'down')].concat(Array.from({length:8},()=>mk('ワイト',0)));
  gameState.players[1].deck=Array.from({length:8},()=>mk('ワイト',1));
  baselineA();
  requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});
  const s=EVT_V2_STATE;if(s)eventPickV2(s.groups[s.rank].findIndex(c=>c.name==='TG ストライカー'));
  ok('C: TG ストライカー: the Graveyard effect link is Spell Speed 1',gameState.chain.length===1&&gameState.chain[0].ss===1,JSON.stringify(links()));
  finish();
  ok('C: the effect resolves: TG ワーウルフ is added to the hand',gameState.players[0].hand.some(c=>cardName(c)==='TG ワーウルフ')&&gameState.chain.length===0&&!pc(),JSON.stringify(gameState.players[0].hand.map(c=>cardName(c))));
  audit('C');
}

/* ===== D. One End Phase selection with TG ワーウルフ and TG ラッシュ・ライノ ===== */
resetA();
gameState.activePlayer=1;gameState.turn=6;gameState.phase='main2';gameState.rngInitialSeed=gameState.rngState=0x2970004;
{
  const wolf=mk('TG ワーウルフ',1,'up'),rhino=mk('TG ラッシュ・ライノ',1,'up');
  for(const c of [wolf,rhino]) c.graveInfo={byDestroy:true,from:'mz',turn:6};
  gameState.players[1].grave=[wolf,rhino];
  gameState.players[1].deck=[mk('TG ストライカー',1,'down'),mk('TG ハルバード・キャノン',1,'down')].concat(Array.from({length:8},()=>mk('ワイト',1)));
  gameState.players[0].deck=Array.from({length:8},()=>mk('ワイト',0));
  baselineA();
  requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});
  const pickName=n=>{const s=EVT_V2_STATE;eventPickV2(s.groups[s.rank].findIndex(c=>c.name===n));};
  pickName('TG ラッシュ・ライノ');
  pickName('TG ワーウルフ');
  ok('D: both links are on the chain, both Spell Speed 1, nothing refused',gameState.chain.length===2&&gameState.chain.every(l=>l.ss===1)&&!TOASTS.some(t=>/スペルスピード/.test(t)),JSON.stringify({chain:links(),toasts:TOASTS.slice(-2)}));
  finish();
  const inHand=gameState.players[1].hand.map(c=>cardName(c)).filter(n=>/^TG /.test(n));
  ok('D: both effects resolve (two TG monsters added), nothing is stuck',inHand.length===2&&gameState.chain.length===0&&!pc()&&!gameState.processorPaused,JSON.stringify({inHand,paused:gameState.processorPaused}));
  audit('D');
}
`);
