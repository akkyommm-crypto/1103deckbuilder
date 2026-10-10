/* S03-U01: ライオウ deck-to-hand lock through real DUEL activation, chain, choice and battle paths.
   Rulings: 1103裁定DB R1103-RAIOH-004/005, KONAMI Q&A（増援・テラ・フォーミング・強欲で謙虚な壺）.
   Fixtures are placed only at scenario start. Helper cards are already TESTED or GENERIC_OK. */
const harness=require('./astra_harness');
const COMMON=String.raw`
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;}
function pick(c){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing');const i=pc.candidates.findIndex(x=>x.uid===c.uid);if(i<0)throw Error('candidate missing '+cardName(c));__choicePickV49(i);}
function pass(){for(let i=0;i<100;i++){
 if(EVT_V2_STATE||pendingChoiceV49(gameState))return;
 if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
 if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
 if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
 return;
 }throw Error('pass loop');}
function replay(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+' Replay nonempty and consistent',pkg.actions.length>0&&a.ok,JSON.stringify(a));}
function zoneOf(uid){const x=findCardByUid(uid);return x?x.zone:null;}
function handIndex(uid){return gameState.players[0].hand.findIndex(c=>c.uid===uid);}
function legal(name,uid,zone='sz'){const i=handIndex(uid),c=gameState.players[0].hand[i];return strictScriptLegalityV2(name,0,'hand',i,{cardOverride:c,logicalZone:zone,prospectiveIndex:gameState.players[0].sz.length});}
`;

const first=harness(COMMON+String.raw`
/* 1. 増援: no lock -> real search. */
fresh();let rein=mk('増援'),clay=mk('E・HERO クレイマン'),ocean=mk('E・HERO オーシャン');
gameState.players[0].hand=[rein];gameState.players[0].deck=[clay,ocean];baselineA();
ok('増援 legal without lock',legal('増援',rein.uid).ok,JSON.stringify(legal('増援',rein.uid)));
duelActivateFromHand(0);pass();pick(clay);pass();
ok('増援 adds the chosen Lv4 Warrior',zoneOf(clay.uid)==='hand'&&zoneOf(rein.uid)==='grave'&&!gameState.systemFault,JSON.stringify({clay:zoneOf(clay.uid),rein:zoneOf(rein.uid)}));
ok('増援 journals FX_SEARCH',V41_ACTION_JOURNAL.some(x=>x.action.type==='FX_SEARCH'));
replay('増援 no lock');

/* 2. opponent face-up ライオウ blocks activation for both players. */
fresh();rein=mk('増援');clay=mk('E・HERO クレイマン');let raioh=mk('ライオウ',1);
gameState.players[0].hand=[rein];gameState.players[0].deck=[clay];gameState.players[1].mz=[raioh];baselineA();
let L=legal('増援',rein.uid);
ok('増援 illegal under opponent face-up ライオウ',!L.ok&&/ライオウ/.test(L.reason),JSON.stringify(L));
ok('lock applies to both players',!!deckToHandLockReasonV32(0)&&!!deckToHandLockReasonV32(1));
let jl=V41_ACTION_JOURNAL.length;duelActivateFromHand(0);
ok('blocked 増援 stays in hand without chain, choice or journal',zoneOf(rein.uid)==='hand'&&gameState.chain.length===0&&!pendingChoiceV49(gameState)&&V41_ACTION_JOURNAL.length===jl);
ok('blocked 増援 is absent from hand activation actions',!(typeof pileDuelActionsV370==='function'&&pileDuelActionsV370(0,'hand',0).some(a=>a.id==='effect')));

/* 3. own ライオウ also locks; face-down ライオウ does not. */
fresh();rein=mk('増援');clay=mk('E・HERO クレイマン');gameState.players[0].hand=[rein];gameState.players[0].deck=[clay];gameState.players[0].mz=[mk('ライオウ')];baselineA();
ok('own face-up ライオウ locks own search',!legal('増援',rein.uid).ok);
fresh();rein=mk('増援');clay=mk('E・HERO クレイマン');gameState.players[0].hand=[rein];gameState.players[0].deck=[clay];gameState.players[1].mz=[mk('ライオウ',1,'down','def')];baselineA();
ok('face-down ライオウ applies no lock',legal('増援',rein.uid).ok&&!deckToHandLockReasonV32(0));

/* 4. スキルドレイン negates the lock on the field. */
fresh();rein=mk('増援');clay=mk('E・HERO クレイマン');raioh=mk('ライオウ',1);
gameState.players[0].hand=[rein];gameState.players[0].deck=[clay];gameState.players[1].mz=[raioh];gameState.players[1].sz=[mk('スキルドレイン',1)];baselineA();
ok('スキルドレイン suppresses ライオウ lock',legal('増援',rein.uid).ok&&!deckToHandLockReasonV32(0));
duelActivateFromHand(0);pass();pick(clay);pass();
ok('増援 resolves normally under スキルドレイン',zoneOf(clay.uid)==='hand');
replay('増援 under スキルドレイン');

/* 5. Lock restored in chain: サイクロン destroys スキルドレイン before 増援 resolves.
      The state is saved with two chain links and continued in a second VM below. */
fresh();rein=mk('増援');clay=mk('E・HERO クレイマン');raioh=mk('ライオウ',1);let drain=mk('スキルドレイン',1),cyc=mk('サイクロン',1,'down');cyc.setTurn=gameState.turn-1;
gameState.players[0].hand=[rein];gameState.players[0].deck=[clay];gameState.players[1].mz=[raioh];gameState.players[1].sz=[drain,cyc];baselineA();
duelActivateFromHand(0);
ok('増援 chain link created while the lock is suppressed',gameState.chain.length===1);
ok('opponent receives priority after activation',!!gameState.chainWindow&&gameState.chainWindow.priority===1,JSON.stringify(gameState.chainWindow));
ok('set サイクロン is a legal response',getChainResponsesV2(1).some(x=>x.card.uid===cyc.uid));
duelActivateResponseV2(1,'sz',1);pick(drain);
ok('サイクロン chained on スキルドレイン',gameState.chain.length===2);
globalThis.__S5SAVE=JSON.stringify({state:gameState});
globalThis.__S5UIDS=JSON.stringify({rein:rein.uid,clay:clay.uid,drain:drain.uid,cyc:cyc.uid});
pass();
ok('サイクロン resolved first and ライオウ lock is active',zoneOf(drain.uid)==='grave'&&!!deckToHandLockReasonV32(0));
ok('増援 resolves under restored lock without adding',zoneOf(clay.uid)==='deck'&&zoneOf(rein.uid)==='grave'&&gameState.players[0].hand.length===0&&!gameState.systemFault,JSON.stringify({clay:zoneOf(clay.uid),hand:gameState.players[0].hand.length}));
ok('no FX_SEARCH journaled under lock',!V41_ACTION_JOURNAL.some(x=>x.action.type==='FX_SEARCH'));
replay('増援 chain-restored lock');
globalThis.__S5FINAL=v41StateDigest(gameState);

/* 6. 強欲で謙虚な壺: normal, illegal under lock, chain-restored lock sends the choice to GY. */
fresh();let pot=mk('強欲で謙虚な壺'),a=mk('E・HERO クレイマン'),b=mk('E・HERO オーシャン'),c=mk('サイクロン'),d=mk('ゴブリン突撃部隊');
gameState.players[0].hand=[pot];gameState.players[0].deck=[a,b,c,d];baselineA();
ok('強欲で謙虚な壺 legal without lock',legal('強欲で謙虚な壺',pot.uid).ok);
/* S03-U34: the top three are revealed and chosen at resolution (a V49 choice), not at activation. */
duelActivateFromHand(0);pass();ok('強欲で謙虚な壺 reveals top three at resolution',!!pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).candidates.length===3);pick(b);pass();
ok('強欲で謙虚な壺 adds chosen card and returns the rest',zoneOf(b.uid)==='hand'&&gameState.players[0].deck.length===3&&zoneOf(pot.uid)==='grave');
ok('強欲で謙虚な壺 forbids Special Summon this turn',!!v46GlobalSpecialSummonRestrictionReason(0));
replay('強欲で謙虚な壺 no lock');
fresh();pot=mk('強欲で謙虚な壺');gameState.players[0].hand=[pot];gameState.players[0].deck=[mk('E・HERO クレイマン'),mk('E・HERO オーシャン'),mk('サイクロン')];gameState.players[1].mz=[mk('ライオウ',1)];baselineA();
ok('強欲で謙虚な壺 illegal under ライオウ',!legal('強欲で謙虚な壺',pot.uid).ok);
fresh();pot=mk('強欲で謙虚な壺');a=mk('E・HERO クレイマン');b=mk('E・HERO オーシャン');c=mk('サイクロン');d=mk('ゴブリン突撃部隊');drain=mk('スキルドレイン',1);cyc=mk('サイクロン',1,'down');cyc.setTurn=gameState.turn-1;
gameState.players[0].hand=[pot];gameState.players[0].deck=[a,b,c,d];gameState.players[1].mz=[mk('ライオウ',1)];gameState.players[1].sz=[drain,cyc];baselineA();
duelActivateFromHand(0);
ok('強欲で謙虚な壺 gives opponent priority',!!gameState.chainWindow&&gameState.chainWindow.priority===1);
duelActivateResponseV2(1,'sz',1);pick(drain);pass();pick(a);pass();
ok('chain-restored lock sends 強欲で謙虚な壺 choice to GY',zoneOf(a.uid)==='grave'&&gameState.players[0].hand.length===0&&gameState.players[0].deck.length===3,JSON.stringify({a:zoneOf(a.uid),hand:gameState.players[0].hand.length,deck:gameState.players[0].deck.length}));
ok('強欲で謙虚な壺 GY branch is a Deck-to-GY move',V41_ACTION_JOURNAL.some(x=>x.action.type==='FX_MILL')&&!V41_ACTION_JOURNAL.some(x=>x.action.type==='FX_SEARCH'));
replay('強欲で謙虚な壺 chain-restored lock');

/* 7. テラ・フォーミング and 紫炎の狼煙. */
fresh();let terra=mk('テラ・フォーミング'),valley=mk('竜の渓谷');gameState.players[0].hand=[terra];gameState.players[0].deck=[valley];baselineA();
ok('テラ・フォーミング legal without lock',legal('テラ・フォーミング',terra.uid).ok);
duelActivateFromHand(0);pass();pick(valley);pass();ok('テラ・フォーミング adds a Field Spell',zoneOf(valley.uid)==='hand'&&zoneOf(terra.uid)==='grave');replay('テラ・フォーミング');
fresh();terra=mk('テラ・フォーミング');gameState.players[0].hand=[terra];gameState.players[0].deck=[mk('竜の渓谷')];gameState.players[1].mz=[mk('ライオウ',1)];baselineA();
ok('テラ・フォーミング illegal under ライオウ',!legal('テラ・フォーミング',terra.uid).ok);
fresh();let smoke=mk('紫炎の狼煙');gameState.players[0].hand=[smoke];gameState.players[0].deck=[mk('六武衆の侍従')];gameState.players[1].mz=[mk('ライオウ',1)];baselineA();
ok('紫炎の狼煙 illegal under ライオウ',!legal('紫炎の狼煙',smoke.uid).ok);

/* 8. エアーマン: under lock the search mode is not offered; destroy mode still works. */
fresh();let air=mk('E・HERO エアーマン'),setc=mk('サイクロン',1,'down');ocean=mk('E・HERO オーシャン');
gameState.players[0].hand=[air];gameState.players[0].mz=[mk('E・HERO クレイマン')];gameState.players[0].deck=[ocean];gameState.players[1].sz=[setc];gameState.players[1].mz=[mk('ライオウ',1)];baselineA();
doNormalSummon(0,'atk');pass();
ok('エアーマン summon trigger is offered under lock',!!EVT_V2_STATE);
eventPickV2(0);let pc=pendingChoiceV49(gameState);
ok('under lock エアーマン goes straight to destroy selection',!!pc&&pc.kind==='card'&&pc.candidates.some(x=>x.uid===setc.uid)&&!pc.candidates.some(x=>x.uid===ocean.uid),JSON.stringify(pc&&{kind:pc.kind,n:pc.candidates.length}));
pick(setc);pass();
ok('エアーマン destroy mode resolves and no HERO is added',zoneOf(setc.uid)==='grave'&&zoneOf(ocean.uid)==='deck'&&!gameState.systemFault);
replay('エアーマン destroy under lock');
fresh();air=mk('E・HERO エアーマン');gameState.players[0].hand=[air];gameState.players[0].mz=[mk('E・HERO クレイマン')];gameState.players[0].deck=[mk('E・HERO オーシャン')];gameState.players[1].sz=[mk('サイクロン',1,'down')];baselineA();
doNormalSummon(0,'atk');pass();eventPickV2(0);pc=pendingChoiceV49(gameState);
ok('without lock エアーマン still asks search or destroy',!!pc&&pc.kind==='yesno',JSON.stringify(pc&&pc.kind));

/* 9. Mandatory search trigger activates but adds nothing (クリッター destroyed by battle). */
fresh();let crit=mk('クリッター'),tgt=mk('E・HERO クレイマン');
gameState.players[0].mz=[crit];gameState.players[0].deck=[tgt];gameState.players[1].mz=[mk('ライオウ',1)];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});pass();
ok('クリッター battle destruction reaches its trigger under lock',zoneOf(crit.uid)==='grave'&&!!EVT_V2_STATE);
if(EVT_V2_STATE){eventPickV2(0);if(pendingChoiceV49(gameState))pick(tgt);pass();}
ok('クリッター trigger resolves without adding from Deck',zoneOf(tgt.uid)==='deck'&&!gameState.systemFault);
replay('クリッター under lock');

/* 10. Draw is not a deck-to-hand add. */
fresh();let greed=mk('強欲な壺');gameState.players[0].hand=[greed];gameState.players[0].deck=[mk('E・HERO クレイマン'),mk('E・HERO オーシャン'),mk('サイクロン')];gameState.players[1].mz=[mk('ライオウ',1)];baselineA();
ok('強欲な壺 draw legal under ライオウ',legal('強欲な壺',greed.uid).ok);
duelActivateFromHand(0);pass();ok('強欲な壺 draws two under ライオウ',gameState.players[0].hand.length===2&&gameState.players[0].deck.length===1);

/* 11. Undo / Redo / branch. The lock has no stored state; it follows the restored board. */
fresh();raioh=mk('ライオウ');rein=mk('増援');clay=mk('E・HERO クレイマン');
gameState.players[0].hand=[raioh,rein];gameState.players[0].deck=[clay];baselineA();
const h0=HISTORY.length;doNormalSummon(0,'atk');pass();
ok('own ライオウ summoned and 増援 becomes illegal',zoneOf(raioh.uid)==='mz'&&!legal('増援',rein.uid).ok);
ok('summon produced Undo history',HISTORY.length>h0,HISTORY.length+'/'+h0);
for(let i=0;i<10&&zoneOf(raioh.uid)!=='hand'&&HISTORY.length;i++)undo();
ok('Undo restores ライオウ to hand and 増援 is legal again',zoneOf(raioh.uid)==='hand'&&legal('増援',rein.uid).ok);
for(let i=0;i<10&&zoneOf(raioh.uid)!=='mz'&&REDO.length;i++)redo();
ok('Redo restores the lock',zoneOf(raioh.uid)==='mz'&&!legal('増援',rein.uid).ok);
for(let i=0;i<10&&zoneOf(raioh.uid)!=='hand'&&HISTORY.length;i++)undo();
duelActivateFromHand(handIndex(rein.uid));pass();pick(findCardByUid(clay.uid).card);pass();
ok('branch after Undo: 増援 resolves and Redo is discarded',zoneOf(clay.uid)==='hand'&&REDO.length===0,JSON.stringify({clay:zoneOf(clay.uid),redo:REDO.length}));
replay('Undo branch 増援');
`);

/* Second VM: continue scenario 5 from its JSON save with both chain links pending. */
if(first.__S5SAVE){
 harness('const SAVED='+JSON.stringify(first.__S5SAVE)+';const UIDS=JSON.parse('+JSON.stringify(first.__S5UIDS)+');const FINAL='+JSON.stringify(first.__S5FINAL)+';'+COMMON+String.raw`
 resetA();gameState=JSON.parse(SAVED).state;EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
 if(typeof v41EnsureReplayState==='function')v41EnsureReplayState(gameState);
 if(typeof v41SyncJournalToState==='function')v41SyncJournalToState(gameState);
 reconcileChoiceAfterLoadV49(gameState);
 ok('VM2 loaded the mid-chain save',gameState.chain.length===2&&!deckToHandLockReasonV32(0));
 pass();
 ok('VM2 continuation: スキルドレイン destroyed and 増援 adds nothing',zoneOf(UIDS.drain)==='grave'&&zoneOf(UIDS.clay)==='deck'&&zoneOf(UIDS.rein)==='grave'&&!gameState.systemFault);
 ok('VM2 final digest equals VM1 continuation',v41StateDigest(gameState)===FINAL,v41StateDigest(gameState)+' vs '+FINAL);
 replay('VM2 continuation');
 `);
}else{console.log('FAIL VM2 save missing');process.exitCode=2;}
