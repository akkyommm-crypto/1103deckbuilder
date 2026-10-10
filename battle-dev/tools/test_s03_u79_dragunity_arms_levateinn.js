/* S03-U79: ドラグニティアームズ－レヴァテイン — a NOT_STARTED main-deck Dragunity monster found via priority #7
   (auditing the fixed major-deck lists directly). Real text (this project's own card database, printed
   2010-06-19, within cutoff):
   ①: banish 1 face-up monster you control equipped with a card named "Dragunity"; Special Summon this card
      from your hand or GY.
   ②: when this card is Normal or Special Summoned, you can select 1 Dragon-type monster in your GY (other
      than this card by name) and treat it as an Equip Card equipped to this card.
   ③: when this card is sent to the GY by an opponent's card effect, you can Special Summon 1 monster that
      was equipped to this card as an Equip Card.
   Every piece reuses existing primitives (summonProcedure with from:['hand','grave'], the exact grave-equip
   primitive already used by 3 other Dragunity Synchros in this codebase, API.movedByOpponentEffect) — see
   cards/HM_claude_s03u79_dragunity_arms_levateinn.js's own header comment for the full breakdown. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
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
function driveAll(){for(let i=0;i<30;i++){const st=drive();if(st!=='choice')return st;__choicePickV49(0);}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function zoneOf(uid){const h=findCardByUid(uid);return h?h.zone:null;}
`;

/* ===== A. Real setup (reusing ドラグニティ－アキュリス's own S03-U43 mechanic): Normal Summon アキュリス with
   ファランクス in hand -> real trigger Special-Summons ファランクス and equips アキュリス onto it as an Equip
   Card. This makes ファランクス a real "monster equipped with a card named 'Dragunity'" — the exact real cost
   target for レヴァテイン's own ①. Then レヴァテイン's real summonProcedure from hand: banishes ファランクス
   (cost), Special Summons レヴァテイン, and its real ② trigger equips a real Dragon-type GY monster
   (青眼の白龍) onto itself. ===== */
harness(COMMON+String.raw`
fresh();
const aklys=mk('ドラグニティ－アキュリス',0), phal=mk('ドラグニティ－ファランクス',0), leva=mk('ドラグニティアームズ－レヴァテイン',0);
const dragon=mk('青眼の白龍',0);
gameState.players[0].hand=[aklys,phal,leva];
gameState.players[0].grave=[dragon];
baselineA();
doNormalSummon(gameState.players[0].hand.indexOf(aklys),'atk');
driveAll();
ok('A setup: ドラグニティ－アキュリス Normal Summon really Special Summons ファランクス from hand and equips itself onto it',
  zoneOf(phal.uid)==='mz'&&zoneOf(aklys.uid)==='sz'&&aklys.v46MonsterEquip===true&&aklys.equipTo&&aklys.equipTo.uid===phal.uid,
  JSON.stringify({phal:zoneOf(phal.uid),aklys:zoneOf(aklys.uid),equipTo:aklys.equipTo}));
audit('A setup: アキュリス equips onto ファランクス');
const legA=strictSummonProcedureLegality('ドラグニティアームズ－レヴァテイン',0,'hand',gameState.players[0].hand.indexOf(leva));
ok('A: レヴァテイン really sees ファランクス as a legal banish-cost host (real equipsOnV15 + SETCODE.DRAGUNITY check)',legA.ok,JSON.stringify(legA));
finishSummonProcedure('ドラグニティアームズ－レヴァテイン',0,'hand',gameState.players[0].hand.indexOf(leva),'atk');
driveAll();
ok('A: ①: ファランクス is really banished as the cost',zoneOf(phal.uid)==='banish',JSON.stringify({phal:zoneOf(phal.uid)}));
ok('A: the orphaned アキュリス (its equip) is really sent to the grave by rule',
  zoneOf(aklys.uid)==='grave'&&aklys.graveInfo&&aklys.graveInfo.rule==='equip',JSON.stringify({aklys:zoneOf(aklys.uid),info:aklys.graveInfo}));
ok('A: レヴァテイン is really Special Summoned from hand',zoneOf(leva.uid)==='mz',JSON.stringify({leva:zoneOf(leva.uid)}));
driveAll();
audit('A full ① + ② real chain');
ok('A: ②: 青眼の白龍 is really equipped onto レヴァテイン as an Equip Card, and the card-local tracking field records it',
  zoneOf(dragon.uid)==='sz'&&dragon.v46MonsterEquip===true&&dragon.equipTo&&dragon.equipTo.uid===leva.uid&&leva.u79LevaEquipUid===dragon.uid,
  JSON.stringify({dragonZone:zoneOf(dragon.uid),equipTo:dragon.equipTo,tracked:leva.u79LevaEquipUid}));
`);

/* ===== B. ③: レヴァテイン (with a real equipped Dragon monster) destroyed by a real opponent card effect
   (サンダー・ブレイク, a real Trap with a real hand-discard cost, precedent: S03-U76) -> its real trigger
   Special Summons back the real monster that was equipped to it. Directly wiring the equip + tracking field
   here (rather than re-driving A's full ①/② setup) is a deliberate, documented test-harness shortcut
   isolating ③ — ① and ② already have full real-path, Replay-audited coverage in segment A above. ===== */
harness(COMMON+String.raw`
fresh();
const leva=mk('ドラグニティアームズ－レヴァテイン',0), dragon=mk('青眼の白龍',0);
gameState.players[0].mz=[leva];
gameState.players[0].grave=[dragon];
const brk=mk('サンダー・ブレイク',1,'down');brk.setTurn=gameState.turn-1;
gameState.players[1].sz=[brk];
gameState.players[1].hand=[mk('もけもけ',1)];
baselineA();
API.equipFromGrave(0,{card:dragon},{card:leva},'ドラグニティアームズ－レヴァテイン',leva.uid,null);
leva.u79LevaEquipUid=dragon.uid;
baselineA();
ok('B setup: 青眼の白龍 is really equipped onto レヴァテイン',dragon.equipTo&&dragon.equipTo.uid===leva.uid&&zoneOf(dragon.uid)==='sz',
  JSON.stringify({zone:zoneOf(dragon.uid),equipTo:dragon.equipTo}));
duelActivateFromZone(1,'sz',0,{});
driveAll();
audit('B real opponent destroy + real equip-monster revive');
ok('B: ③: サンダー・ブレイク really destroys レヴァテイン, and its own trigger really Special Summons back 青眼の白龍 (the real monster that was equipped to it)',
  zoneOf(leva.uid)==='grave'&&zoneOf(dragon.uid)==='mz',
  JSON.stringify({leva:zoneOf(leva.uid),dragon:zoneOf(dragon.uid)}));
`);

/* ===== C. ③ correctly does NOT trigger when レヴァテイン is destroyed by battle (real text: "相手のカードの
   効果によって" — a card effect specifically, not battle). ===== */
harness(COMMON+String.raw`
fresh();
const leva=mk('ドラグニティアームズ－レヴァテイン',0,'up','def'), dragon=mk('青眼の白龍',0);
gameState.players[0].mz=[leva];
gameState.players[0].grave=[dragon];
API.equipFromGrave(0,{card:dragon},{card:leva},'ドラグニティアームズ－レヴァテイン',leva.uid,null);
leva.u79LevaEquipUid=dragon.uid;
const atk=mk('青眼の究極竜',1);
gameState.players[1].mz=[atk];
gameState.activePlayer=1;gameState.phase='battle';
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});
driveAll();
audit('C real battle destroy: no ③ revive');
ok('C: レヴァテイン destroyed by real battle damage does NOT trigger ③ (no card effect involved) — the orphaned 青眼の白龍 stays in the grave',
  zoneOf(leva.uid)==='grave'&&zoneOf(dragon.uid)==='grave',
  JSON.stringify({leva:zoneOf(leva.uid),dragon:zoneOf(dragon.uid)}));
`);

/* ===== D. ①'s other source zone: レヴァテイン itself resting in the GY, a real Dragunity-equipped host already
   on the field -> a real summonProcedure from the GY. ===== */
harness(COMMON+String.raw`
fresh();
const leva=mk('ドラグニティアームズ－レヴァテイン',0);
const phal=mk('ドラグニティ－ファランクス',0), aklys=mk('ドラグニティ－アキュリス',0);
gameState.players[0].mz=[phal,aklys];
gameState.players[0].grave=[leva];
baselineA();
ok('D setup: real API.equipMonster attaches アキュリス onto ファランクス as an Equip Card',
  API.equipMonster(0,{card:aklys},{card:phal},'setup'),'');
driveAll();
ok('D setup: アキュリス is really an Equip Card on ファランクス',
  zoneOf(aklys.uid)==='sz'&&aklys.v46MonsterEquip===true&&aklys.equipTo&&aklys.equipTo.uid===phal.uid,
  JSON.stringify({aklys:zoneOf(aklys.uid),equipTo:aklys.equipTo}));
const legD=strictSummonProcedureLegality('ドラグニティアームズ－レヴァテイン',0,'grave',gameState.players[0].grave.indexOf(leva));
ok('D: レヴァテイン really sees ファランクス as a legal banish-cost host while resting in the GY',legD.ok,JSON.stringify(legD));
finishSummonProcedure('ドラグニティアームズ－レヴァテイン',0,'grave',gameState.players[0].grave.indexOf(leva),'atk');
driveAll();
audit('D real Special Summon from the GY');
ok('D: レヴァテイン is really Special Summoned from the GY, banishing ファランクス as the real cost',
  zoneOf(leva.uid)==='mz'&&zoneOf(phal.uid)==='banish',
  JSON.stringify({leva:zoneOf(leva.uid),phal:zoneOf(phal.uid)}));
`);
