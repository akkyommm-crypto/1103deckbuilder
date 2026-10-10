/* S03-U38 C-S03-29 DUEL_LIFECYCLE_JOURNAL — the duel start (first player) and the duel end (loser) go through Actions.
   Requirement: Replay and SaveLoad must reproduce a real duel from its first Action to its result. Found by the R1 real-duel run
   (Dragunity / レダメ provisional vs 1103兎ラギア):
   - every start path wrote activePlayer / firstPlayer / turn / phase directly after the journaled LOAD_DECK / DRAW, so a duel where
     Player 2 goes first failed the Replay audit at the first draw;
   - battle damage lowers LP inside the ATTACK Action, but the loser was then written directly by the processor, so every duel won
     in battle ended with a Replay finalDigest mismatch (only loser / duelEndedReason differed).
   Cards named here: サイバー・ドラゴン (TESTED). The 1103兎ラギア and test decks are built at runtime. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest including the final one',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));return pkg;}
function types(){return V41_ACTION_JOURNAL.map(x=>x.action.type);}
function firstDraw(){requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();}
const USER_TEXT=TEST_DECK.cards.map(e=>e.n+' x'+e.q).join('\n')+'\n■エクストラ\n'+TEST_DECK.ex.map(e=>e.n+' x'+e.q).join('\n');

/* ===== A. startTestDuel with Player 2 first ===== */
resetA();startTestDuel(true,1,'rabbit');
ok('A: startTestDuel(Player 2 first) records the first player as an Action',types().includes('SET_FIRST_PLAYER')&&gameState.firstPlayer===1&&gameState.activePlayer===1&&gameState.turn===1&&gameState.phase==='draw',
  JSON.stringify({types:types(),fp:gameState.firstPlayer,ap:gameState.activePlayer}));
audit('A after the start');
firstDraw();
ok('A: Player 2 draws first',gameState.players[1].hand.length===6&&gameState.players[0].hand.length===5,JSON.stringify([gameState.players[0].hand.length,gameState.players[1].hand.length]));
audit('A after the first draw');

/* ===== B. startPresetDuel with Player 2 first ===== */
resetA();startPresetDuel('rabbitFlow',1);firstDraw();
ok('B: startPresetDuel(Player 2 first) starts with Player 2 active',gameState.firstPlayer===1&&gameState.activePlayer===1&&types().includes('SET_FIRST_PLAYER'));
audit('B after the first draw');

/* ===== C. 兎ラギアと対戦開始 (user deck for Player 1) with Player 2 first ===== */
resetA();resetForTestDuel();gameState.rngInitialSeed=1395762661;gameState.rngState=1395762661;v41ResetActionJournal(gameState);/* S03-U151: fixed RNG seed (was Date.now()) */
applyLoad(0,parseDeckText(USER_TEXT),true);
const startedC=startRabbitOpponentDuel(1);
firstDraw();
ok('C: startRabbitOpponentDuel(Player 2 first) starts and records the first player',startedC===true&&gameState.firstPlayer===1&&gameState.activePlayer===1&&types().includes('SET_FIRST_PLAYER'),
  JSON.stringify({startedC,fp:gameState.firstPlayer,toasts:TOASTS.slice(-2)}));
audit('C after the first draw');

/* ===== D. a user deck loaded with autostart for Player 2 ===== */
resetA();resetForTestDuel();gameState.rngInitialSeed=1395762661;gameState.rngState=1395762661;v41ResetActionJournal(gameState);/* S03-U151: fixed RNG seed (was Date.now()) */
applyLoad(1,parseDeckText(USER_TEXT),true);
ok('D: applyLoad autostart for Player 2 makes Player 2 first through an Action',gameState.firstPlayer===1&&gameState.activePlayer===1&&types().includes('SET_FIRST_PLAYER'));
audit('D after the autostart');

/* ===== E. the duel ends in battle: the loser is journaled ===== */
resetA();
const cd=mk('サイバー・ドラゴン',0);gameState.players[0].mz=[cd];gameState.players[1].lp=1000;
gameState.activePlayer=0;gameState.turn=5;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('E: a direct attack for 2100 ends the duel — Player 2 loses by LP 0',gameState.loser===1&&gameState.duelEndedReason==='lp0'&&gameState.players[1].lp===0,
  JSON.stringify({loser:gameState.loser,reason:gameState.duelEndedReason,lp:gameState.players[1].lp,toasts:TOASTS.slice(-2)}));
ok('E: the result is recorded by a DUEL_LOSER_S03 Action after the attack',types().includes('DUEL_LOSER_S03')&&types().lastIndexOf('DUEL_LOSER_S03')>types().indexOf('ATTACK'),JSON.stringify(types().slice(-6)));
audit('E after the battle');
const pkgE=v41ReplayPackage(gameState);
ok('E: the save carries the result and a resume keeps it',(()=>{saveDuel();const raw=JSON.parse(localStorage.getItem(DUEL_SAVE_KEY));return raw.state.loser===1&&raw.state.duelEndedReason==='lp0';})());
`);
