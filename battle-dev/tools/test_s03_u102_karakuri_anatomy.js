/* S03-U102: カラクリ解体新書 (Karakuri Anatomy) — priority #7's IMPLEMENTED-tier audit, continuing after
   U101 (one of the 4 remaining qty=3 main-deck candidates found by U97's corrected cross-reference). Real
   text (confirmed via Yugipedia, Japanese/OCG original): "「カラクリ」と名のついたモンスターの表示形式が
   変更される度に、このカードにカラクリカウンターを１つ置く(最大２つまで)。また、フィールド上に存在する
   このカードを墓地へ送る事で、このカードに乗っているカラクリカウンターの数だけ自分のデッキからカードを
   ドローする。" ("Each time a monster named 'Karakuri' has its battle position changed, place 1 Karakuri
   Counter on this card (max. 2). Also, by sending this card, which is on the field, to the GY, you can draw
   from your Deck a number of cards equal to the number of Karakuri Counters on this card.") Notably, the
   counter-placement clause has NO "you control" restriction — ANY "Karakuri" monster's position change
   counts, including the OPPONENT's, matching the real Japanese text exactly. The counter cap at 2
   (onKarakuriPositionChange passive) and the emission wiring (notifyKarakuriPositionChangeV350, called from
   both API.changePosition and togglePosition with the changed monster's own real controller, broadcasting
   generically rather than being scoped to "self only" — correctly matching the missing "you control"
   restriction in the real text) were already correct in cards/20_control_counter.js.

   But building the real DUEL-path test surfaced a real, previously-undiscovered bug: cost() captured the
   counter count into a custom ctx.bookCount property, and resolve() read it back the same way — but in the
   REAL activation pipeline (duelActivateFromZone -> chain add -> chain resolve), resolve() receives an
   INDEPENDENTLY RECONSTRUCTED ctx object, not the same one cost() wrote to; any custom property set on
   cost()'s ctx is silently lost by the time resolve() runs. This card's real counters are also themselves
   zone-local (engine/00_state_actions.js's ZONE_LOCAL_KEYS strips 'counters' the instant the card leaves sz
   as the cost), so simply re-reading them in resolve() isn't an option either — the draw was always 0
   regardless of how many real counters had accumulated. (A parallel-shaped card, シンクロ・チェンジ, uses
   the identical ctx.xxx cost->resolve pattern, but its own only existing test calls cost()/resolve()
   directly on one shared ctx object rather than through the real pipeline, so the same gap there was never
   exercised — out of this unit's scope, but worth flagging.) Fixed by persisting the captured count onto the
   real card object itself via API.setCardFlag (a real game object that survives cost() intact, unlike ctx,
   and is NOT zone-local since it's a fresh custom flag name), read back in resolve() via ctx.card's own
   field. Promotes カラクリ解体新書 IMPLEMENTED->TESTED. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
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
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
`;

/* ===== A/B. Real counter accumulation: two real Karakuri monsters (カラクリ守衛 参壱参, カラクリ小町
   弐弐四) on P0's own field each really have their battle position changed by a real opponent attack
   declaration targeting them; カラクリ解体新書 really gains 1 real counter for each (capped at 2). Then a
   real activation sends it from the real field to the real Graveyard, drawing 2 real cards — matching the 2
   real counters. ===== */
harness(COMMON+String.raw`
fresh();
gameState.activePlayer=1;gameState.phase='battle';
const saizan=mk('カラクリ守衛 参壱参',0), komachi=mk('カラクリ小町 弐弐四',0);
const book=mk('カラクリ解体新書',0,'up');
gameState.players[0].mz=[saizan,komachi];
gameState.players[0].sz=[book];
gameState.players[0].deck=[mk('もけもけ',0),mk('バット',0)];
const atk1=mk('ワイト',1),atk2=mk('もけもけ',1); // weak real attackers so both real Karakuri defenders survive (board stays stable for the second attack's index)
gameState.players[1].mz=[atk1,atk2];
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});
driveAll();
ok('A: the real attack targeting 参壱参 really flips its real battle position, placing 1 real Karakuri Counter',
  API.countCounter({p:0,zone:'sz',index:0},'カラクリ')===1,
  JSON.stringify(API.countCounter({p:0,zone:'sz',index:0},'カラクリ')));
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:1,target:1});
driveAll();
ok('B: a real SECOND attack targeting 弐弐四 really places a real SECOND Karakuri Counter (now capped at 2)',
  API.countCounter({p:0,zone:'sz',index:0},'カラクリ')===2,
  JSON.stringify(API.countCounter({p:0,zone:'sz',index:0},'カラクリ')));
gameState.activePlayer=0;gameState.phase='main1';
baselineA();
duelActivateFromZone(0,'sz',0);
driveAll();
ok('B: カラクリ解体新書 really sends itself from the real field to the real Graveyard as the cost',
  gameState.players[0].grave.some(c=>nm(c)==='カラクリ解体新書')&&!gameState.players[0].sz.length,
  JSON.stringify({grave:gameState.players[0].grave.map(nm),sz:gameState.players[0].sz.map(nm)}));
ok('B: the controller really draws 2 real cards, one for each real Karakuri Counter',
  gameState.players[0].hand.length===2&&!gameState.players[0].deck.length,
  JSON.stringify({hand:gameState.players[0].hand.map(nm),deck:gameState.players[0].deck.map(nm)}));
audit('B');
`);

/* ===== C. Real cross-player confirmation: the real Japanese text has no "you control" restriction on the
   counter-placement clause — even the OPPONENT's real Karakuri monster having its real battle position
   changed correctly places a real counter on the controller's own カラクリ解体新書. ===== */
harness(COMMON+String.raw`
fresh();
gameState.activePlayer=1;gameState.phase='battle';
const foeSaizan=mk('カラクリ守衛 参壱参',1);
const book=mk('カラクリ解体新書',0,'up');
gameState.players[0].sz=[book];
gameState.players[1].mz=[foeSaizan];
const myAtk=mk('青眼の白龍',0,'up');
gameState.players[0].mz=[myAtk];
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});
driveAll();
ok('C: the real OPPONENTs Karakuri monster (参壱参) having its real battle position changed still really places a real counter on my カラクリ解体新書',
  API.countCounter({p:0,zone:'sz',index:0},'カラクリ')===1,
  JSON.stringify(API.countCounter({p:0,zone:'sz',index:0},'カラクリ')));
audit('C');
`);

/* ===== D. Real negative control: with zero real Karakuri Counters (no real position change has ever
   happened), sending カラクリ解体新書 to the Graveyard is correctly illegal. ===== */
harness(COMMON+String.raw`
fresh();gameState.activePlayer=0;gameState.phase='main1';
const book=mk('カラクリ解体新書',0,'up');
gameState.players[0].sz=[book];
baselineA();
ok('D: illegal with zero real Karakuri Counters',
  !strictScriptLegalityV2('カラクリ解体新書',0,'sz',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('カラクリ解体新書',0,'sz',0,{})));
`);
