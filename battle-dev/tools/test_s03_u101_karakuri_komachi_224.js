/* S03-U101: カラクリ小町 弐弐四 (Karakuri Komachi mdl 224 "Ninishi") — priority #7's IMPLEMENTED-tier audit,
   continuing after U100 (one of the 5 remaining qty=3 main-deck candidates found by U97's corrected
   cross-reference). Real text (confirmed via Yugipedia): "This card must attack if able. When this face-up
   card is selected as an attack target, change its battle position. While this card is face-up on the
   field, once per turn during your Main Phase, you can Normal Summon 1 'Karakuri' monster in addition to
   your Normal Summon or Set. (You can only gain this effect once per turn.)"

   Reading the existing implementation (cards/20_control_counter.js) surfaced TWO real, previously-
   undiscovered bugs:

   1. Clause 2 ("when this face-up card is selected as an attack target, change its battle position") was
      entirely MISSING — only clause 1 (continuous.mustAttack) and clause 3 (the extra Normal Summon grant)
      existed. This is the exact same real-text clause already correctly implemented for カラクリ守衛 参壱参
      (same file, S03-U71) via a forced onAttackDeclare trigger keyed on gameState.pendingAttack.targetUid —
      reused verbatim.

   2. Clause 3's grant was COMPLETELY NON-FUNCTIONAL: resolve() set a flag (karakuriExtraSummon) that was
      read by exactly one function (karakuriExtraSummonAvailable) which nothing else in the entire codebase
      ever called — confirmed by grep. The real generic mechanism for "an effect grants 1 additional Normal
      Summon" is extraNormalSummonKeyV370 (engine/40_legal_script_engine.js), a numeric temporaryFlags
      counter consulted by getLegalHandActions to actually offer the extraNormalSummon hand action (existing
      precedent: 鬼ガエル's v370FrogExtraNormal, 極星獣-family's v380NordicExtraNormal) — カラクリ小町 弐弐四
      was never wired into it at all, so activating this card's grant had zero real effect on what the
      player could actually do.

   Fixed both: clause 2 mirrors 参壱参's forced onAttackDeclare pattern exactly (with an explicit
   timing:['mainPhase','attackDeclare'] to prevent the newly-added passive.onAttackDeclare hook from
   auto-narrowing clause 3's own manual-activation timing window to attack-declaration-only, the same trap
   already documented for 大神官デ・ザード, S03-U67). Clause 3 now increments a new karakuriExtraNormal
   counter (mirroring 鬼ガエル's exact v370FrogExtraNormal shape) and extraNormalSummonKeyV370 gained a
   matching 'カラクリ' case; getLegalHandActions's UI label ternary was also generalized to a lookup so the
   Karakuri grant gets its own correct label rather than falling through to "鬼ガエル"'s. Removed the dead
   karakuriExtraSummon/karakuriExtraSummonAvailable code. Promotes カラクリ小町 弐弐四 IMPLEMENTED->TESTED. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.phase='main1';}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){
    const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
    if(g.length) eventPickV2(0); else eventSkipGroupV2();
    continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  if(gameState.pendingSummon){commitPendingSummonV2();continue;}
  return 'idle';}return 'loop';}
function driveAll(){for(let i=0;i<20;i++){const st=drive();if(st!=='choice')return st;__choicePickV49(0);}return 'loop';}
function zoneOf(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
`;

/* ===== A/B. Clause 1 (mustAttack, unchanged pre-existing correct behavior) and clause 2 (the newly-fixed
   missing position-flip clause): a real weak opponent attacker selects the real face-up カラクリ小町 弐弐四
   as its attack target; it really flips from Attack to Defense Position (DEF 1900) before damage
   calculation, so the real ATK/DEF gap reflects real battle damage onto the real ATTACKER instead. ===== */
harness(COMMON+String.raw`
fresh();
const komachi=mk('カラクリ小町 弐弐四',0);
const foe=mk('もけもけ',1); // 300/200 ATK, far below 弐弐四's real 1900 DEF
gameState.players[0].mz=[komachi];
gameState.players[1].mz=[foe];
gameState.players[0].lp=8000;gameState.players[1].lp=8000;
gameState.activePlayer=1;gameState.phase='battle';
baselineA();
ok('A: mustAttackNow (clause 1) is true for a real face-up カラクリ小町 弐弐四',mustAttackNow(komachi)===true);
ok('A setup: starts in real Attack Position',komachi.face==='up'&&komachi.pos==='atk',JSON.stringify({face:komachi.face,pos:komachi.pos}));
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});
driveAll();
ok('B: カラクリ小町 弐弐四 really flips to real Defense Position the moment it is selected as a real attack target (the fixed missing clause)',
  komachi.pos==='def'&&komachi.face==='up'&&zoneOf(komachi.uid)==='mz',
  JSON.stringify({pos:komachi.pos,face:komachi.face,zone:zoneOf(komachi.uid)}));
ok('B: the real ATK/DEF gap (1900 DEF - 300 ATK = 1600) reflects real battle damage onto the real attacker; 弐弐四 is untouched',
  gameState.players[1].lp===6400&&gameState.players[0].lp===8000&&zoneOf(komachi.uid)==='mz'&&zoneOf(foe.uid)==='mz',
  JSON.stringify({lp0:gameState.players[0].lp,lp1:gameState.players[1].lp}));
audit('B');
`);

/* ===== C. Clause 3 (the fixed broken wiring): a real activation of カラクリ小町 弐弐四's own ignition
   ability really grants a real, FUNCTIONAL additional Normal Summon right (not just an inert flag) — a real
   second "Karakuri" monster is really Normal Summoned in the same real turn, on top of the real ordinary
   Normal Summon, and the granted right is really consumed afterward (a real third attempt is correctly no
   longer offered). ===== */
harness(COMMON+String.raw`
fresh();
const komachi=mk('カラクリ小町 弐弐四',0,'up');
const shonin=mk('カラクリ商人 壱七七',0), hei=mk('カラクリ兵 弐参六',0);
gameState.players[0].mz=[komachi];
gameState.players[0].hand=[shonin,hei];
baselineA();
duelActivateFromZone(0,'mz',0);
driveAll();
ok('C: the real ignition activation really increments the real karakuriExtraNormal counter',
  Number(gameState.players[0].temporaryFlags.karakuriExtraNormal||0)===1,
  JSON.stringify(gameState.players[0].temporaryFlags.karakuriExtraNormal));
ok('C: extraNormalSummonKeyV370 really offers the real Karakuri extra-summon key for a real "Karakuri" hand card',
  extraNormalSummonKeyV370(0,dbOf(hei))==='karakuriExtraNormal',
  JSON.stringify(extraNormalSummonKeyV370(0,dbOf(hei))));
doNormalSummon(0,'atk');
flushDeferredEventsThroughProcessorV27();
driveAll();
ok('C: the real ordinary Normal Summon really succeeds (カラクリ商人 壱七七)',
  gameState.players[0].mz.some(c=>nm(c)==='カラクリ商人 壱七七')&&gameState.players[0].normalSummonUsed,
  JSON.stringify({mz:gameState.players[0].mz.map(nm),used:gameState.players[0].normalSummonUsed}));
doExtraNormalSummonV370(0,'karakuriExtraNormal');
flushDeferredEventsThroughProcessorV27();
driveAll();
ok('C: the real GRANTED additional Normal Summon really succeeds too (カラクリ兵 弐参六) — the fixed bug (previously had zero real effect)',
  gameState.players[0].mz.some(c=>nm(c)==='カラクリ兵 弐参六'),
  JSON.stringify(gameState.players[0].mz.map(nm)));
ok('C: the real granted right is really consumed afterward (counter back to 0, no longer offered)',
  Number(gameState.players[0].temporaryFlags.karakuriExtraNormal||0)===0,
  JSON.stringify(gameState.players[0].temporaryFlags.karakuriExtraNormal));
audit('C');
`);

/* ===== D. Real negative control: with no real "Karakuri" monster in hand, the ignition ability is correctly
   illegal (unchanged pre-existing behavior). ===== */
harness(COMMON+String.raw`
fresh();
const komachi=mk('カラクリ小町 弐弐四',0,'up');
gameState.players[0].mz=[komachi];
gameState.players[0].hand=[mk('青眼の白龍',0)];
baselineA();
ok('D: illegal with no real "Karakuri" monster in the real hand',
  !strictScriptLegalityV2('カラクリ小町 弐弐四',0,'mz',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('カラクリ小町 弐弐四',0,'mz',0,{})));
`);
