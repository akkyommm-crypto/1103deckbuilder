/* S03-U296: monster triggers stacked in one SEGOC selection are not refused for Spell Speed against each other.
   Found by the R1 sweep (debris vs tg_skill, seed 0x5426011F): in the End Phase TG ワーウルフ and TG ラッシュ・ライノ (both destroyed this turn) are offered
   together; TG ワーウルフ is picked first and its link carries SS2 (its hand effect is a Quick-type effect, the Graveyard effect shares the script),
   then TG ラッシュ・ライノ was refused for ever with 「スペルスピードが足りません（SS1 / チェーン上 SS2）」 and the duel stalled.
   Real DUEL path (End Phase → onEndPhase selection → two picks → the chain is resolved), Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zoneOf(u){const h=findCardByUid(u);return h?h.zone:null;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
resetA();
gameState.activePlayer=1;gameState.turn=6;gameState.phase='main2';gameState.rngInitialSeed=gameState.rngState=0x5329605;
const wolf=mk('TG ワーウルフ',1,'up'),rhino=mk('TG ラッシュ・ライノ',1,'up');
for(const c of [wolf,rhino]) c.graveInfo={byDestroy:true,from:'mz',turn:6};
const striker=mk('TG ストライカー',1,'down'),halb=mk('TG ハルバード・キャノン',1,'down');
gameState.players[1].grave=[wolf,rhino];
gameState.players[1].deck=[striker,halb].concat(Array.from({length:8},()=>mk('ワイト',1)));
gameState.players[0].deck=Array.from({length:8},()=>mk('ワイト',0));
baselineA();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});
const st=EVT_V2_STATE;
const names=st?st.groups[st.rank].map(c=>c.name):[];
ok('the End Phase opens one selection offering both TG triggers (optional, turn player)',!!st&&st.rank===2&&names.includes('TG ワーウルフ')&&names.includes('TG ラッシュ・ライノ'),JSON.stringify({rank:st&&st.rank,names}));
const pickName=n=>{const s=EVT_V2_STATE;const i=s.groups[s.rank].findIndex(c=>c.name===n);eventPickV2(i);};
pickName('TG ワーウルフ');
const afterFirst=gameState.chain.length;
ok('the first pick (TG ワーウルフ) puts its link on the chain; the selection stays open for the other trigger',afterFirst===1&&!!EVT_V2_STATE&&EVT_V2_STATE.groups[EVT_V2_STATE.rank].some(c=>c.name==='TG ラッシュ・ライノ'),
  JSON.stringify({chain:gameState.chain.map(l=>l.name+'/ss'+l.ss),evt:!!EVT_V2_STATE,toasts:TOASTS.slice(-2)}));
pickName('TG ラッシュ・ライノ');
ok('the second pick (TG ラッシュ・ライノ) is accepted although the link below has a higher Spell Speed: two links, no refusal',gameState.chain.length===2&&!TOASTS.some(t=>/スペルスピード/.test(t)),
  JSON.stringify({chain:gameState.chain.map(l=>l.name+'/ss'+l.ss),toasts:TOASTS.slice(-2)}));
/* finish the selection and resolve the chain: both search a TG monster */
for(let i=0;i<300;i++){
  if(pc()){__choicePickV49(0);continue;}
  if(EVT_V2_STATE){const s=EVT_V2_STATE,g=s.groups[s.rank]||[];if(g.length&&s.rank<2)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  break;}
const inHand=gameState.players[1].hand.map(c=>cardName(c)).filter(n=>/^TG /.test(n));
ok('both Graveyard effects resolve: two TG monsters were added from the Deck, the chain is over, nothing is stuck',inHand.length===2&&gameState.chain.length===0&&!pc()&&!gameState.processorPaused,
  JSON.stringify({inHand,chain:gameState.chain.length,paused:gameState.processorPaused,phase:gameState.phase}));
audit('end');
`);
