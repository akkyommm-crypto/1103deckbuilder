/* S03-U15 C-S03-12 SUMMON_WINDOW_RESUME
   Requirement: a duel saved (autosave runs after every Action) or undone/redone while a summon is waiting in the summon-negation
   window can continue: the window is shown again, and committing or negating completes the summon exactly as it would have live.
   Before the fix: the continuation of a Normal Summon, a hand summon procedure and a Flip Summon was a module closure
   (PENDING_SUMMON_COMMIT/CANCEL). After a reload the resumed duel kept pendingSummon, showed no window and refused every action
   ('召喚無効タイミングの処理中です'); even a programmatic commit closed the window without summoning, with the Normal Summon spent.
   Every card named here is TESTED or GENERIC_OK. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function settle(){for(let k=0;k<12;k++){const r=drive();if(r==='evt'){if(EVT_V2_STATE.rank>=2)eventSkipGroupV2();else eventPickV2(0);continue;}return r;}return 'loop';}
function mzNames(p){return gameState.players[p].mz.map(nm);}
function busy(){return duelFlowBusyReasonV30('test');}
function replay(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));}
function hornBoard(){fresh();const horn=mk('昇天の角笛',1,'down');horn.setTurn=3;gameState.players[1].sz=[horn];gameState.players[1].mz=[mk('セイバーザウルス',1)];return horn;}
function captureSave(){saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
`;

const first=harness(COMMON+String.raw`
/* ===== A. live control: the window opens with its continuation as data, and committing summons ===== */
hornBoard();let elf=mk('ヂェミナイ・エルフ');gameState.players[0].hand=[elf];baselineA();
doNormalSummon(0,'atk');
const psA=gameState.pendingSummon;
ok('A: a Normal Summon into a set 昇天の角笛 waits in the summon-negation window, with its continuation stored as JSON',
  !!psA&&psA.kind==='normal'&&psA.resumeS03&&psA.resumeS03.uid===elf.uid&&typeof PENDING_SUMMON_COMMIT!=='function'&&busy()==='召喚無効タイミングの処理中です',JSON.stringify(psA));
commitPendingSummonV2();settle();
ok('A: committing from the window summons ヂェミナイ・エルフ',mzNames(0).includes('ヂェミナイ・エルフ')&&!gameState.pendingSummon&&busy()==='',JSON.stringify({mz:mzNames(0),busy:busy()}));
replay('A live Normal Summon');

/* ===== save points for the second VM ===== */
hornBoard();elf=mk('ヂェミナイ・エルフ');gameState.players[0].hand=[elf];baselineA();
doNormalSummon(0,'atk');
globalThis.__SAVE_NORMAL=captureSave();

/* ===== G. Undo back into the window after the summon was committed ===== */
commitPendingSummonV2();settle();
const summonedLive=mzNames(0).includes('ヂェミナイ・エルフ');
for(let k=0;k<8&&!gameState.pendingSummon&&HISTORY.length;k++)undo();
ok('G: Undo returns to the summon-negation window with the monster still in the hand',summonedLive&&!!gameState.pendingSummon&&gameState.players[0].hand.some(c=>nm(c)==='ヂェミナイ・エルフ'),JSON.stringify({summonedLive,pending:gameState.pendingSummon,hand:gameState.players[0].hand.map(nm)}));
commitPendingSummonV2();settle();
ok('G: committing again after Undo summons it (the continuation is not a lost closure)',mzNames(0).includes('ヂェミナイ・エルフ')&&!gameState.pendingSummon,JSON.stringify({mz:mzNames(0),hand:gameState.players[0].hand.map(nm)}));

/* hand summon procedure */
hornBoard();gameState.players[0].mz=[mk('六武衆－ザンジ')];let kizan=mk('真六武衆－キザン');gameState.players[0].hand=[kizan];baselineA();
runSummonProcedure('真六武衆－キザン',0,'hand',0);
if(!gameState.pendingSummon&&!mzNames(0).includes('真六武衆－キザン'))finishSummonProcedure('真六武衆－キザン',0,'hand',0,'atk');
ok('save point: the 真六武衆－キザン hand procedure waits in the window',!!gameState.pendingSummon&&gameState.pendingSummon.kind==='procedure',JSON.stringify(gameState.pendingSummon));
globalThis.__SAVE_PROC=captureSave();

/* hand procedure with a face-up ライオウ (a Special Summon negator) for the negation-after-resume case */
fresh();gameState.players[1].mz=[mk('ライオウ',1)];gameState.players[0].mz=[mk('六武衆－ザンジ')];kizan=mk('真六武衆－キザン');gameState.players[0].hand=[kizan];baselineA();
runSummonProcedure('真六武衆－キザン',0,'hand',0);
if(!gameState.pendingSummon&&!mzNames(0).includes('真六武衆－キザン'))finishSummonProcedure('真六武衆－キザン',0,'hand',0,'atk');
ok('save point: with a face-up ライオウ on the opponent field the キザン procedure waits in the window',!!gameState.pendingSummon&&summonNegatorsV2(gameState.pendingSummon).some(x=>x.db.n==='ライオウ'),JSON.stringify(gameState.pendingSummon));
globalThis.__SAVE_RAIOH=captureSave();

/* Flip Summon */
hornBoard();const setElf=mk('ヂェミナイ・エルフ',0,'down','def');setElf.setTurn=3;gameState.players[0].mz=[setElf];baselineA();
doFlipUp(0,'mz',0,'atk');
ok('save point: the Flip Summon of the set ヂェミナイ・エルフ waits in the window',!!gameState.pendingSummon&&gameState.pendingSummon.kind==='flip',JSON.stringify(gameState.pendingSummon));
globalThis.__SAVE_FLIP=captureSave();
`);

if(first.__SAVE_NORMAL&&first.__SAVE_PROC&&first.__SAVE_FLIP&&first.__SAVE_RAIOH){
  harness('const SAVE_NORMAL='+JSON.stringify(first.__SAVE_NORMAL)+';const SAVE_PROC='+JSON.stringify(first.__SAVE_PROC)+';const SAVE_FLIP='+JSON.stringify(first.__SAVE_FLIP)+';const SAVE_RAIOH='+JSON.stringify(first.__SAVE_RAIOH)+';'+COMMON+String.raw`
  function resumeFrom(raw){fresh();localStorage.setItem(DUEL_SAVE_KEY,raw);return offerResumeDuel();}

  /* ===== B. resume a Normal Summon waiting in the window, then commit ===== */
  ok('B: the save taken inside the window resumes with the summon still waiting',resumeFrom(SAVE_NORMAL)&&!!gameState.pendingSummon&&gameState.players[0].hand.some(c=>nm(c)==='ヂェミナイ・エルフ'));
  ok('B: the window sheet is shown again after the resume',reopenSummonWindowAfterLoadS03()==='sheet');
  commitPendingSummonV2();settle();
  ok('B: committing after the reload summons ヂェミナイ・エルフ and the duel flow is free again',mzNames(0).includes('ヂェミナイ・エルフ')&&!gameState.pendingSummon&&busy()==='',JSON.stringify({mz:mzNames(0),hand:gameState.players[0].hand.map(nm),busy:busy()}));
  ok('B: the Normal Summon was used once',gameState.players[0].normalSummonUsed===true);
  replay('B resumed Normal Summon');

  /* ===== D. resume, then the opponent negates the Special Summon with ライオウ ===== */
  ok('D: the save with ライオウ resumes waiting in the window',resumeFrom(SAVE_RAIOH)&&!!gameState.pendingSummon&&reopenSummonWindowAfterLoadS03()==='sheet');
  activateSummonNegatorV2(1,'mz',0);
  for(let k=0;k<12;k++){const r=drive();if(r==='choice'){__choicePickV49(0);continue;}if(r==='evt'){if(EVT_V2_STATE.rank>=2)eventSkipGroupV2();else eventPickV2(0);continue;}break;}
  ok('D: after the reload ライオウ negates the procedure: 真六武衆－キザン goes to the GY, ライオウ was sent as cost, the window closes',
    gameState.players[0].grave.some(c=>nm(c)==='真六武衆－キザン')&&!mzNames(0).includes('真六武衆－キザン')&&!gameState.pendingSummon&&gameState.players[1].grave.some(c=>nm(c)==='ライオウ')&&busy()==='',
    JSON.stringify({p0grave:gameState.players[0].grave.map(nm),p0mz:mzNames(0),p1grave:gameState.players[1].grave.map(nm),pending:gameState.pendingSummon,busy:busy()}));
  replay('D negation after resume');

  /* ===== C. resume a hand summon procedure ===== */
  ok('C: the procedure save resumes waiting in the window',resumeFrom(SAVE_PROC)&&!!gameState.pendingSummon&&gameState.pendingSummon.kind==='procedure');
  commitPendingSummonV2();settle();
  ok('C: committing after the reload Special Summons 真六武衆－キザン',mzNames(0).includes('真六武衆－キザン')&&!gameState.pendingSummon,JSON.stringify({mz:mzNames(0),hand:gameState.players[0].hand.map(nm)}));
  replay('C resumed procedure');

  /* ===== F. resume a Flip Summon ===== */
  ok('F: the Flip Summon save resumes waiting in the window',resumeFrom(SAVE_FLIP)&&!!gameState.pendingSummon&&gameState.pendingSummon.kind==='flip');
  commitPendingSummonV2();settle();
  const flipped=gameState.players[0].mz.find(c=>nm(c)==='ヂェミナイ・エルフ');
  ok('F: committing after the reload flips ヂェミナイ・エルフ face-up in Attack Position',!!flipped&&flipped.face==='up'&&flipped.pos==='atk'&&!gameState.pendingSummon,JSON.stringify(flipped));
  replay('F resumed Flip Summon');

  /* ===== H. a save from before the fix (no continuation data) no longer blocks the duel ===== */
  const old=JSON.parse(SAVE_NORMAL);delete old.state.pendingSummon.resumeS03;
  resumeFrom(JSON.stringify(old));
  ok('H: an old save without continuation data still shows the window',!!gameState.pendingSummon&&reopenSummonWindowAfterLoadS03()==='sheet');
  commitPendingSummonV2();settle();
  ok('H: committing closes the window and frees the duel flow (the summon itself cannot be restored and the log says so)',
    !gameState.pendingSummon&&busy()===''&&(gameState.log||[]).some(x=>String(x.msg||x).includes('召喚の続きを復元できない')),JSON.stringify({busy:busy(),log:(gameState.log||[]).slice(0,3).map(x=>x.msg||x)}));
  `);
}else{console.log('FAIL VM1 did not capture all save points');process.exitCode=2;}
