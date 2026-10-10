/* S03-U107: TG1－EM1 — priority #7's IMPLEMENTED-tier audit, continuing after U106 (the last of the qty=3
   main-deck candidates found by U97's corrected cross-reference). Real text (this project's own
   authoritative data/carddata.json 'e' field; no Yugipedia page found): "相手フィールド上に存在するモンスター
   1体と、自分フィールド上に表側表示で存在する『TG』と名のついたモンスター1体を選択して発動する。選択した
   モンスターのコントロールを入れ替える。" ("Target 1 monster on the opponent's field and 1 face-up monster
   named 'TG' on your own field; swap control of the two.") A Normal Trap.

   The existing implementation (cards/20_control_counter.js) was already fully correct: it reuses the
   established, shared defineControlSwap/swapCandidates/changeControl infrastructure (already proven by the
   sibling card 強制転移) with a mine() filter matching exactly "face-up, name starts with 'TG'" for the
   controller's own side, and no face restriction at all for the opponent's side (matching the real text,
   which does not require the opponent's monster to be face-up). This unit's entire scope was the missing
   dedicated test. Promotes TG1－EM1 IMPLEMENTED->TESTED. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.phase='main1';}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function driveAll(){for(let i=0;i<20;i++){const st=drive();if(st!=='choice')return st;__choicePickV49(0);}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
`;

/* ===== A. Real activation: a real face-up "TG"-named monster on the controller's own field and a real
   face-up opponent monster are really selected; control is really swapped both ways. ===== */
harness(COMMON+String.raw`
fresh();
const trap=mk('TG1－EM1',0,'down');
gameState.players[0].sz=[trap];
const mine=mk('TG ワーウルフ',0,'up');
gameState.players[0].mz=[mine];
const theirs=mk('もけもけ',1,'up');
gameState.players[1].mz=[theirs];
baselineA();
duelActivateFromZone(0,'sz',0);
driveAll();
ok('A: the real "TG" monster really changes control to the real opponent (still face-up, same card)',
  gameState.players[1].mz.some(c=>nm(c)==='TG ワーウルフ')&&!gameState.players[0].mz.some(c=>nm(c)==='TG ワーウルフ'),
  JSON.stringify({p0mz:gameState.players[0].mz.map(nm),p1mz:gameState.players[1].mz.map(nm)}));
ok('A: the real opponent monster really changes control to the real controller',
  gameState.players[0].mz.some(c=>nm(c)==='もけもけ')&&!gameState.players[1].mz.some(c=>nm(c)==='もけもけ'),
  JSON.stringify({p0mz:gameState.players[0].mz.map(nm),p1mz:gameState.players[1].mz.map(nm)}));
audit('A');
`);

/* ===== B. Real check: the real opponent's monster does NOT need to be face-up — a real face-down opponent
   monster is also a legal target and control really swaps correctly. ===== */
harness(COMMON+String.raw`
fresh();
const trap=mk('TG1－EM1',0,'down');
gameState.players[0].sz=[trap];
const mine=mk('TG ストライカー',0,'up');
gameState.players[0].mz=[mine];
const theirs=mk('もけもけ',1,'down');
gameState.players[1].mz=[theirs];
baselineA();
ok('B: legal even with a real face-down opponent monster as the only opponent-side candidate',
  strictScriptLegalityV2('TG1－EM1',0,'sz',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('TG1－EM1',0,'sz',0,{})));
duelActivateFromZone(0,'sz',0);
driveAll();
ok('B: control really swaps correctly even with the real face-down opponent monster',
  gameState.players[1].mz.some(c=>nm(c)==='TG ストライカー')&&gameState.players[0].mz.some(c=>nm(c)==='もけもけ'),
  JSON.stringify({p0mz:gameState.players[0].mz.map(nm),p1mz:gameState.players[1].mz.map(nm)}));
audit('B');
`);

/* ===== C. Real negative control: illegal with no real face-up "TG"-named monster on the controller's own
   field (a non-TG monster, and a face-down TG monster, both correctly excluded). ===== */
harness(COMMON+String.raw`
fresh();
const trap=mk('TG1－EM1',0,'down');
gameState.players[0].sz=[trap];
gameState.players[0].mz=[mk('もけもけ',0,'up'),mk('TG ワーウルフ',0,'down')];
gameState.players[1].mz=[mk('もけもけ',1,'up')];
baselineA();
ok('C: illegal with no real face-up "TG" monster on the controller\'s own field',
  !strictScriptLegalityV2('TG1－EM1',0,'sz',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('TG1－EM1',0,'sz',0,{})));
`);

/* ===== D. Real negative control: illegal with no real monster at all on the real opponent's field. ===== */
harness(COMMON+String.raw`
fresh();
const trap=mk('TG1－EM1',0,'down');
gameState.players[0].sz=[trap];
gameState.players[0].mz=[mk('TG ワーウルフ',0,'up')];
baselineA();
ok('D: illegal with no real monster on the real opponents field',
  !strictScriptLegalityV2('TG1－EM1',0,'sz',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('TG1－EM1',0,'sz',0,{})));
`);
