/* S03-U100: ジュラック・グアイバ (Jurrac Guaiba) — priority #7's IMPLEMENTED-tier audit, continuing after
   U99 (one of the 6 remaining qty=3 main-deck candidates found by U97's corrected cross-reference). Real
   text (confirmed via Yugipedia): "If this card destroys an opponent's monster by battle: You can Special
   Summon 1 'Jurrac' monster with 1700 or less ATK from your Deck, but it cannot declare an attack this
   turn." The battle-destroy trigger condition (checking gameState.lastBattle.atkCard===ctx.card &&
   destroyedDef, where "destroyedDef" means the DEFENDING side of the battle was destroyed — not "Defense
   Position," confirmed by reading engine/00_state_actions.js's battle-resolution code), the optional
   Special-Summon-from-Deck target search (guaibaTargets: main-deck "Jurrac" monsters with ATK<=1700), and
   the Special Summon itself were already correctly implemented in cards/30_themes_b.js. But the "cannot
   declare an attack this turn" restriction on the newly Special Summoned monster was implemented via the
   raw, PERMANENT card.cannotAttack=true flag (engine/00_state_actions.js), which only clears when a card
   leaves the field — never automatically at a turn boundary. This is the exact same bug class already found
   once this session (S03-U93, カオス・ソーサラー), but here the restricted card is NOT the effect's own
   source (it's whichever different-named "Jurrac" monster was Special Summoned), so the established
   self-scoped continuous.cannotAttack(card) hook fix (which requires the restricted card's OWN script to
   declare the hook) cannot express it directly. Fixed with a new, small, fully generic engine primitive
   instead — a turn-number-stamped card.cannotAttackTurn field, checked directly inside the single shared
   cannotAttackNow(card) function (engine/00_state_actions.js), mirroring the exact existing pattern already
   used for card.attackLimitTurn in the same function family (attackLimitV48) — no per-card continuous
   declaration needed at all, so it works for ANY target card regardless of which script it has. Also added
   to ZONE_LOCAL_KEYS for zone-leave hygiene, matching cannotAttack/attackLimitTurn. Promotes ジュラック・
   グアイバ IMPLEMENTED->TESTED. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.phase='main1';}
function drive(){for(let i=0;i<600;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){
    const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
    if(g.length) eventPickV2(0); else eventSkipGroupV2();
    continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  if(gameState.pendingSummon){commitPendingSummonV2();continue;}
  return 'idle';}
  return 'loop';}
function driveAll(){for(let i=0;i<20;i++){const st=drive();if(st!=='choice')return st;__choicePickV49(0);}return 'loop';}
function zoneOf(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
`;

/* ===== A/B. Real battle destroy really offers the real optional trigger; the real named "Jurrac" Deck
   target (ジュラック・イグアノン, ATK 1700) is really Special Summoned. The newly summoned monster really
   CANNOT attack the same real turn (the fixed bug — before this unit this restriction was permanent-flag
   based but, being untested, its actual turn-scoping had never been verified end to end); on a real LATER
   turn it really CAN attack (confirming the restriction is correctly turn-scoped, not permanent). ===== */
harness(COMMON+String.raw`
fresh();
gameState.activePlayer=0;gameState.phase='battle';
const guaiba=mk('ジュラック・グアイバ',0);
gameState.players[0].mz=[guaiba];
gameState.players[0].deck=[mk('ジュラック・イグアノン',0)];
const foe=mk('もけもけ',1);
gameState.players[1].mz=[foe];
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});
driveAll();
ok('A: the real opponent monster is really destroyed by the real battle',
  zoneOf(foe.uid)==='grave',JSON.stringify({foe:zoneOf(foe.uid)}));
ok('A: the real named "Jurrac" Deck target (ATK<=1700) is really Special Summoned',
  gameState.players[0].mz.some(c=>nm(c)==='ジュラック・イグアノン')&&!gameState.players[0].deck.length,
  JSON.stringify({mz:gameState.players[0].mz.map(nm),deck:gameState.players[0].deck.map(nm)}));
const summoned=gameState.players[0].mz.find(c=>nm(c)==='ジュラック・イグアノン');
const foe2=mk('バット',1);
gameState.players[1].mz=[foe2];
baselineA();
const sIdx=gameState.players[0].mz.indexOf(summoned);
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:sIdx,target:0});
driveAll();
ok('B: the real newly Special Summoned monster really CANNOT attack the same real turn (the fixed bug)',
  zoneOf(foe2.uid)==='mz'&&zoneOf(summoned.uid)==='mz',
  JSON.stringify({foe2:zoneOf(foe2.uid),summoned:zoneOf(summoned.uid)}));
gameState.turn=gameState.turn+1;
gameState.activePlayer=0;gameState.phase='battle';
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:sIdx,target:0});
driveAll();
ok('B: on a real LATER turn, the same monster really CAN attack again (turn-scoped, not permanent)',
  zoneOf(foe2.uid)==='grave',JSON.stringify({foe2:zoneOf(foe2.uid)}));
audit('B');
`);

/* ===== C. Real negative control: with no real qualifying "Jurrac" monster (ATK<=1700) anywhere in the real
   Deck, the trigger's own condition is correctly false — no Special Summon happens even though the real
   battle destroy itself still occurs. ===== */
harness(COMMON+String.raw`
fresh();
gameState.activePlayer=0;gameState.phase='battle';
const guaiba=mk('ジュラック・グアイバ',0);
gameState.players[0].mz=[guaiba];
gameState.players[0].deck=[mk('ジュラック・スピノス',0)];
const foe=mk('もけもけ',1);
gameState.players[1].mz=[foe];
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});
driveAll();
ok('C: the real battle destroy still happens even with no real qualifying Deck target',
  zoneOf(foe.uid)==='grave',JSON.stringify({foe:zoneOf(foe.uid)}));
ok('C: no real Special Summon happens (ジュラック・スピノス has real ATK 2600 > 1700, does not qualify)',
  !gameState.players[0].mz.some(c=>nm(c)==='ジュラック・スピノス')&&gameState.players[0].deck.some(c=>nm(c)==='ジュラック・スピノス'),
  JSON.stringify({mz:gameState.players[0].mz.map(nm),deck:gameState.players[0].deck.map(nm)}));
`);

/* ===== D. Real negative control: with no chain of a real battle destroy by this card, activation is
   correctly illegal. ===== */
harness(COMMON+String.raw`
fresh();
const guaiba=mk('ジュラック・グアイバ',0);
gameState.players[0].mz=[guaiba];
gameState.players[0].deck=[mk('ジュラック・イグアノン',0)];
baselineA();
ok('D: illegal with no real battle-destroy-by-this-card context',
  !strictScriptLegalityV2('ジュラック・グアイバ',0,'mz',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('ジュラック・グアイバ',0,'mz',0,{})));
`);
