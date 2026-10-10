/* S03-U64 resolution-time Deck choice expansion, part 3 — finishes S03-U58's own explicitly-flagged
   "beyond the representative set" scope.
   Requirement: S03-U63 fixed the 7 of 21 script_coverage-audited cards sharing the "non-targeting
   Deck search/mill/Special-Summon choice made at ACTIVATION time instead of RESOLUTION time" anti-pattern
   that are reachable from a 1103_MAJOR_DECKS_v1 fixed-list deck, and explicitly left the remaining 14
   (not reachable from a fixed-list deck) for a later, similarly-scoped unit. This unit closes that list:
   終末の騎士, ダーク・グレファー, ゴブリンゾンビ, 極星獣タングニョースト, 封印の黄金櫃, コーリング・ノヴァ,
   鬼ガエル, XX－セイバー エマーズブレイド, マシンナーズ・ギアフレーム, スクラップ・エリア, ヒーローアライブ,
   神の桎梏グレイプニル, ピラミッド・タートル, 魔轟神グリムロ.
   Reused U58's own generic registered handlers (s03u58.deck-search / s03u58.deck-mill / s03u58.deck-special)
   for every card whose candidate pool is Deck-only. 鬼ガエル's ①効果 pool spans Deck AND the player's own
   field (mz), so it got one small dedicated handler (s03u63.oni-gaeru-to-grave) reproducing the original
   mill-vs-sendToGrave branch by the resolved target's zone.
   For cards whose real trigger is a battle-destruction event (コーリング・ノヴァ, XX－セイバー エマーズブレイド,
   ピラミッド・タートル), reproducing a full attack/damage-step sequence just to reach the trigger would test
   the (already-covered-elsewhere) battle pipeline rather than this fix; instead each is driven through its
   own real, unmodified condition()/resolve() against a synthetic onBattleDestroy(card=self) event — still
   the card's actual scripted functions, matching the precedent set for カラクリ大将軍 無零怒 in S03-U63. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function nm(c){return c?cardName(c):null;}
function zoneOf(c){const h=findCardByUid(c.uid);return h&&h.zone;}
function fresh(){
  resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.phase='main1';
}
function drive(){
  for(let i=0;i<600;i++){
    if(pendingChoiceV49(gameState)) return 'choice';
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){
      const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
      if(g.length) eventPickV2(0); else eventSkipGroupV2();
      continue;
    }
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    if(gameState.pendingSummon){commitPendingSummonV2();continue;}
    return 'idle';
  }
  return 'loop';
}
function pickUid(uid){
  const q=pendingChoiceV49(gameState);
  if(!q) return false;
  const i=q.candidates.findIndex(c=>c.uid===uid);
  if(i<0) return false;
  __choicePickV49(i);
  return true;
}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function isRegistry(){return pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume&&pendingChoiceV49(gameState).resume.mode==='registry';}
`;

/* ===== A. 終末の騎士: mz field trigger via a real Normal Summon. ===== */
harness(COMMON+String.raw`
fresh();
const kishi=mk('終末の騎士',0);
gameState.players[0].hand=[kishi];
gameState.players[0].deck=[mk('13人目の埋葬者',0)];
baselineA();
doNormalSummon(0,'atk');
flushDeferredEventsThroughProcessorV27();
drive();
ok('A: 終末の騎士 opens a resolution-time mill choice (registry resume)',isRegistry(),JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
__choicePickV49(0);
drive();
ok('A: the mill completes for real',gameState.players[0].grave.some(c=>nm(c)==='13人目の埋葬者'));
audit('A 終末の騎士 full cycle');
`);

/* ===== B. ダーク・グレファー: hand activation. The discard cost's target stays at activation
   (a real legacy pending choice); the mill target moves to resolution. ===== */
harness(COMMON+String.raw`
fresh();
const grepher=mk('ダーク・グレファー',0);
const fodder=mk('2人3脚ゾンビ',0);
gameState.players[0].hand=[grepher,fodder];
gameState.players[0].deck=[mk('13人目の埋葬者',0)];
baselineA();
duelActivateFromHand(0);
drive();
ok('B: the discard-cost target choice opens first (still activation-time, unaffected by this unit)',
  pendingChoiceV49(gameState)&&!isRegistry(),JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
pickUid(fodder.uid);
drive();
ok('B: グレファー opens a resolution-time mill choice after the discard cost',isRegistry(),JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
__choicePickV49(0);
drive();
ok('B: the discard and the mill both happened for real',zoneOf(fodder)==='grave'&&gameState.players[0].grave.some(c=>nm(c)==='13人目の埋葬者'));
audit('B ダーク・グレファー full cycle');
`);

/* ===== C. ゴブリンゾンビ: its ② trigger after it is sent from the field to the Graveyard (destroyed by an attack).
   S03-U156: ② is 「このカードがフィールド上から墓地へ送られた時」 — a trigger, not activated from the GY at will (engine/1ZT event). ===== */
harness(COMMON+String.raw`
fresh();
const zombie=mk('ゴブリンゾンビ',0);
gameState.players[0].mz=[zombie];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1)];
gameState.players[0].deck=[mk('さまよえる亡者',0)];
gameState.activePlayer=1;gameState.phase='battle';
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});
drive();
ok('C: ゴブリンゾンビ opens a resolution-time search choice (registry resume)',isRegistry(),JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
__choicePickV49(0);
drive();
ok('C: the search completes for real',gameState.players[0].hand.some(c=>nm(c)==='さまよえる亡者'));
audit('C ゴブリンゾンビ full cycle');
`);

/* ===== D. 極星獣タングニョースト: real field-ignition activation from mz. ===== */
harness(COMMON+String.raw`
fresh();
const tang=mk('極星獣タングニョースト',0);
gameState.players[0].mz=[tang];
gameState.players[0].deck=[mk('極星獣タングリスニ',0)];
baselineA();
duelActivateFromZone(0,'mz',0);
drive();
ok('D: タングニョースト opens a resolution-time special-summon choice (registry resume)',isRegistry(),JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
__choicePickV49(0);
drive();
ok('D: the Special Summon completes for real',gameState.players[0].mz.some(c=>nm(c)==='極星獣タングリスニ'));
audit('D タングニョースト full cycle');
`);

/* ===== E. 封印の黄金櫃: real activation from hand. ===== */
harness(COMMON+String.raw`
fresh();
const gold=mk('封印の黄金櫃',0);
gameState.players[0].hand=[gold];
gameState.players[0].deck=[mk('もけもけ',0)];
baselineA();
duelActivateFromHand(0);
drive();
ok('E: 封印の黄金櫃 opens a resolution-time banish choice (registry resume)',isRegistry(),JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
__choicePickV49(0);
drive();
ok('E: the banish completes for real',gameState.players[0].banish.some(c=>nm(c)==='もけもけ'));
audit('E 封印の黄金櫃 full cycle');
`);

/* ===== F. コーリング・ノヴァ: driven through its own real condition()/resolve() against a synthetic
   onBattleDestroy(card=self) event (see file header). ===== */
harness(COMMON+String.raw`
fresh();
const nova=mk('コーリング・ノヴァ',0);
gameState.players[0].grave=[nova];
gameState.players[0].deck=[mk('もけもけ',0)];
baselineA();
const nh=findCardByUid(nova.uid);
const scNova=CARD_SCRIPTS['コーリング・ノヴァ'];
const ctxNova=makeContext(0,nh.card,'grave',nh.index,'onBattleDestroy',{event:{card:nh.card}});
ok('F: コーリング・ノヴァ condition() accepts its own battle-destruction event',scNova.condition(ctxNova),ctxNova.reason||'');
scNova.resolve(ctxNova);
drive();
ok('F: コーリング・ノヴァ opens a resolution-time special-summon choice (registry resume)',isRegistry(),JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
__choicePickV49(0);
drive();
ok('F: the Special Summon completes for real',gameState.players[0].mz.some(c=>nm(c)==='もけもけ'));
audit('F コーリング・ノヴァ full cycle');
`);

/* ===== G. 鬼ガエル ①: real trigger via a real Normal Summon; candidate pool spans Deck and mz. ===== */
harness(COMMON+String.raw`
fresh();
const frog=mk('鬼ガエル',0);
gameState.players[0].hand=[frog];
gameState.players[0].deck=[mk('アメーバ',0)];
baselineA();
doNormalSummon(0,'atk');
flushDeferredEventsThroughProcessorV27();
drive();
ok('G: 鬼ガエル ① opens a resolution-time choice (registry resume)',isRegistry(),JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
__choicePickV49(0);
drive();
ok('G: the mill-to-grave completes for real',gameState.players[0].grave.some(c=>nm(c)==='アメーバ'));
audit('G 鬼ガエル full cycle');
`);

/* ===== H. XX－セイバー エマーズブレイド: driven through its own real condition()/resolve() against a
   synthetic onBattleDestroy(card=self) event (see file header). ===== */
harness(COMMON+String.raw`
fresh();
const em=mk('XX－セイバー エマーズブレイド',0);
gameState.players[0].grave=[em];
gameState.players[0].deck=[mk('X－セイバー エアベルン',0)];
baselineA();
const eh=findCardByUid(em.uid);
const scEm=CARD_SCRIPTS['XX－セイバー エマーズブレイド'];
const ctxEm=makeContext(0,eh.card,'grave',eh.index,'onBattleDestroy',{event:{card:eh.card}});
ok('H: エマーズブレイド condition() accepts its own battle-destruction event',scEm.condition(ctxEm),ctxEm.reason||'');
scEm.resolve(ctxEm);
drive();
ok('H: エマーズブレイド opens a resolution-time special-summon choice (registry resume)',isRegistry(),JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
__choicePickV49(0);
drive();
ok('H: the Special Summon completes for real',gameState.players[0].mz.some(c=>nm(c)==='X－セイバー エアベルン'));
audit('H エマーズブレイド full cycle');
`);

/* ===== I. マシンナーズ・ギアフレーム: real trigger via a real Normal Summon. ===== */
harness(COMMON+String.raw`
fresh();
const gear=mk('マシンナーズ・ギアフレーム',0);
gameState.players[0].hand=[gear];
gameState.players[0].deck=[mk('マシンナーズ・フォートレス',0)];
baselineA();
doNormalSummon(0,'atk');
flushDeferredEventsThroughProcessorV27();
drive();
ok('I: ギアフレーム opens a resolution-time search choice (registry resume)',isRegistry(),JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
__choicePickV49(0);
drive();
ok('I: the search completes for real',gameState.players[0].hand.some(c=>nm(c)==='マシンナーズ・フォートレス'));
audit('I ギアフレーム full cycle');
`);

/* ===== J. スクラップ・エリア: real activation from hand. ===== */
harness(COMMON+String.raw`
fresh();
const area=mk('スクラップ・エリア',0);
gameState.players[0].hand=[area];
gameState.players[0].deck=[mk('スクラップ・ゴブリン',0)];
baselineA();
duelActivateFromHand(0);
drive();
ok('J: スクラップ・エリア opens a resolution-time search choice (registry resume)',isRegistry(),JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
__choicePickV49(0);
drive();
ok('J: the search completes for real',gameState.players[0].hand.some(c=>nm(c)==='スクラップ・ゴブリン'));
audit('J スクラップ・エリア full cycle');
`);

/* ===== K. ヒーローアライブ: real activation from hand, including the LP-half cost. ===== */
harness(COMMON+String.raw`
fresh();
const alive=mk('ヒーローアライブ',0);
gameState.players[0].hand=[alive];
gameState.players[0].deck=[mk('E・HERO エアーマン',0)];
gameState.players[0].lp=8000;
baselineA();
duelActivateFromHand(0);
drive();
ok('K: ヒーローアライブ opens a resolution-time special-summon choice (registry resume)',isRegistry(),JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
__choicePickV49(0);
drive();
ok('K: LP halved and the Special Summon completes for real',gameState.players[0].lp===4000&&gameState.players[0].mz.some(c=>nm(c)==='E・HERO エアーマン'));
audit('K ヒーローアライブ full cycle');
`);

/* ===== L. 神の桎梏グレイプニル: real activation from a face-down Set trap in sz. ===== */
harness(COMMON+String.raw`
fresh();
const grape=mk('神の桎梏グレイプニル',0,'down');
grape.setTurn=gameState.turn-1;
gameState.players[0].sz=[grape];
gameState.players[0].deck=[mk('極星將テュール',0)];
baselineA();
duelActivateFromZone(0,'sz',0);
drive();
ok('L: 神の桎梏グレイプニル opens a resolution-time search choice (registry resume)',isRegistry(),JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
__choicePickV49(0);
drive();
ok('L: the search completes for real',gameState.players[0].hand.some(c=>nm(c)==='極星將テュール'));
audit('L 神の桎梏グレイプニル full cycle');
`);

/* ===== M. ピラミッド・タートル: driven through its own real condition()/resolve() against a synthetic
   onBattleDestroy(card=self) event (see file header). ===== */
harness(COMMON+String.raw`
fresh();
const turtle=mk('ピラミッド・タートル',0);
gameState.players[0].grave=[turtle];
gameState.players[0].deck=[mk('さまようミイラ',0)];
baselineA();
const th=findCardByUid(turtle.uid);
const scTurtle=CARD_SCRIPTS['ピラミッド・タートル'];
const ctxTurtle=makeContext(0,th.card,'grave',th.index,'onBattleDestroy',{event:{card:th.card}});
ok('M: ピラミッド・タートル condition() accepts its own battle-destruction event',scTurtle.condition(ctxTurtle),ctxTurtle.reason||'');
scTurtle.resolve(ctxTurtle);
drive();
ok('M: ピラミッド・タートル opens a resolution-time special-summon choice (registry resume)',isRegistry(),JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
__choicePickV49(0);
drive();
ok('M: the Special Summon completes for real',gameState.players[0].mz.some(c=>nm(c)==='さまようミイラ'));
audit('M ピラミッド・タートル full cycle');
`);

/* ===== N. 魔轟神グリムロ: real activation from hand (needs a face-up 魔轟神 already on the field). ===== */
harness(COMMON+String.raw`
fresh();
const grim=mk('魔轟神グリムロ',0);
const ashen=mk('魔轟神アシェンヴェイル',0);
gameState.players[0].mz=[ashen];
gameState.players[0].hand=[grim];
gameState.players[0].deck=[mk('魔轟神ソルキウス',0)];
baselineA();
duelActivateFromHand(0);
drive();
ok('N: 魔轟神グリムロ opens a resolution-time search choice (registry resume)',isRegistry(),JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
__choicePickV49(0);
drive();
ok('N: it sends itself to the grave and the search completes for real',zoneOf(grim)==='grave'&&gameState.players[0].hand.some(c=>nm(c)==='魔轟神ソルキウス'));
audit('N 魔轟神グリムロ full cycle');
`);
