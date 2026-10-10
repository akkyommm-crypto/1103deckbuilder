/* S03-U04: C-S03-01 DECK_TO_HAND_LOCK recovery — trigger offering, mode consumers and mandatory excavation.
   - An optional trigger that must add from the Deck is not offered while ライオウ applies (R1103-RAIOH-004).
   - Mode / "Deck or GY" consumers keep the non-Deck choice (R1103-SIXGATE-009, アームズ・ホール 08/06/15 by analogy).
   - Mandatory excavators send the card that would be added to the GY (魔導雑貨商人 / 水晶の占い師, 2009-03-02 wiki).
   Every scenario checks the unlocked path as well. Helper cards are TESTED or GENERIC_OK. */
const harness=require('./astra_harness');
const COMMON=String.raw`
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;}
function pass(){for(let i=0;i<120;i++){
 if(EVT_V2_STATE||pendingChoiceV49(gameState))return;
 if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
 if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
 if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
 return;
 }throw Error('pass loop');}
function pick(c){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing');const i=pc.candidates.findIndex(x=>x.uid===c.uid);if(i<0)throw Error('candidate missing '+cardName(c));__choicePickV49(i);}
function replay(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+' Replay nonempty and consistent',pkg.actions.length>0&&a.ok,JSON.stringify(a));}
function zoneOf(uid){const x=findCardByUid(uid);return x?x.zone:null;}
function kinds(){return V41_ACTION_JOURNAL.map(x=>x.action.type);}
function added(name){return V41_ACTION_JOURNAL.filter(x=>x.action.type==='CHAIN_ADD'&&x.action.name===name).length;}
function offered(name){return !!EVT_V2_STATE&&EVT_V2_STATE.groups.some(g=>g.some(c=>c.name===name));}
`;

const first=harness(COMMON+String.raw`
/* ===== optional summon-search triggers are not offered under the lock ===== */
function summonSearch(name,copyName,withLock){
 fresh();const m=mk(name),copy=mk(copyName);
 gameState.players[0].hand=[m];gameState.players[0].deck=[copy,mk('サイクロン')];
 if(withLock)gameState.players[1].mz=[mk('ライオウ',1)];
 baselineA();doNormalSummon(0,'atk');pass();return {m,copy};
}
for(const [name,copy] of [['ポケ・ドラ','ポケ・ドラ'],['グリーン・ガジェット','レッド・ガジェット'],['神秘の代行者 アース','裁きの代行者 サターン']]){
 let s=summonSearch(name,copy,true);
 ok(name+' search trigger is not offered under ライオウ',!offered(name)&&added(name)===0&&zoneOf(s.copy.uid)==='deck'&&!gameState.systemFault);
 s=summonSearch(name,copy,false);
 ok(name+' search trigger is offered without the lock',offered(name));
 eventPickV2(0);if(pendingChoiceV49(gameState))pick(s.copy);pass();
 /* S03-U63: 神秘の代行者 アース は対象を取らない効果なので、選択が活動時ではなく解決時（S03-U58パターン）
    に開くようになった。pass() が解決時の選択待ちで止まるので、もう一段 pick+pass する。 */
 if(pendingChoiceV49(gameState)){pick(s.copy);pass();}
 ok(name+' adds '+copy+' without the lock',zoneOf(s.copy.uid)==='hand'&&added(name)===1,JSON.stringify({z:zoneOf(s.copy.uid)}));
 replay(name+' unlocked search');
}

/* ===== ドラグニティ－コルセスカ: real Dux equip, battle destruction, lock on offering ===== */
function corsesca(withLock){
 fresh();const dux=mk('ドラグニティ－ドゥクス'),corse=mk('ドラグニティ－コルセスカ'),legion=mk('ドラグニティ－レギオン'),clay=mk('E・HERO クレイマン',1);
 gameState.players[0].hand=[dux];gameState.players[0].grave=[corse];gameState.players[0].deck=[legion];
 gameState.players[1].mz=withLock?[clay,mk('ライオウ',1)]:[clay];baselineA();
 doNormalSummon(0,'atk');pass();eventPickV2(0);pick(corse);pass();
 requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});pass();
 const at=findCardByUid(dux.uid),def=findCardByUid(clay.uid);
 requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:at.index,target:def.index});pass();
 return {dux,corse,legion,clay};
}
let c=corsesca(true);
ok('Corsesca host destroys by battle under the lock',zoneOf(c.clay.uid)==='grave'&&zoneOf(c.corse.uid)==='sz');
ok('Corsesca search trigger is not offered under ライオウ',!offered('ドラグニティ－コルセスカ')&&zoneOf(c.legion.uid)==='deck');
replay('Corsesca locked');
c=corsesca(false);
ok('Corsesca search trigger is offered without the lock',offered('ドラグニティ－コルセスカ'));
eventPickV2(0);pick(c.legion);pass();
ok('Corsesca adds a same Type/Attribute Lv4-or-lower monster without the lock',zoneOf(c.legion.uid)==='hand');
replay('Corsesca unlocked');

/* ===== 竜の渓谷: only the mill mode under the lock ===== */
fresh();let valley=mk('竜の渓谷'),discard=mk('サイクロン'),spear=mk('ドラグニティ－ブラックスピア'),bomber=mk('ボマー・ドラゴン');
gameState.players[0].hand=[valley,discard];gameState.players[0].deck=[spear,bomber];gameState.players[1].mz=[mk('ライオウ',1)];baselineA();
/* S03-U10: activating the card is separate from its effect (2011 wiki 10/07/04). Place it first, then activate the effect from the field. */
duelActivateFromHand(0);pass();
ok('竜の渓谷 card activation under the lock opens no effect choice and stays face-up in the Field Zone',!pendingChoiceV49(gameState)&&zoneOf(valley.uid)==='field');
duelActivateFromZone(0,'field',0);let pc=pendingChoiceV49(gameState);
ok('竜の渓谷 under the lock offers only the mill mode',!!pc&&pc.candidates.length===1&&pc.candidates[0].key==='dragon',JSON.stringify(pc&&pc.candidates.map(x=>x.key)));
__choicePickV49(0);pick(discard);pass();pc=pendingChoiceV49(gameState);
ok('mill mode resolves to a Dragon choice',!!pc);pick(bomber);pass();
ok('竜の渓谷 mill mode works under the lock and adds nothing',zoneOf(bomber.uid)==='grave'&&zoneOf(spear.uid)==='deck'&&zoneOf(discard.uid)==='grave'&&!kinds().includes('FX_SEARCH'));
replay('竜の渓谷 locked mill');
fresh();valley=mk('竜の渓谷');discard=mk('サイクロン');gameState.players[0].hand=[valley,discard];gameState.players[0].deck=[mk('ドラグニティ－ブラックスピア')];baselineA();
duelActivateFromHand(0);pass();duelActivateFromZone(0,'field',0);pc=pendingChoiceV49(gameState);
ok('竜の渓谷 without the lock still offers both modes',!!pc&&pc.candidates.length===2);

/* ===== E・HERO フォレストマン: Deck or GY -> only GY under the lock ===== */
function forestman(withGrave){
 fresh();const fm=mk('E・HERO フォレストマン'),deckFusion=mk('融合'),graveFusion=mk('融合');
 gameState.phase='draw';gameState.players[0].mz=[fm];gameState.players[0].deck=[deckFusion];gameState.players[0].grave=withGrave?[graveFusion]:[];
 gameState.players[1].mz=[mk('ライオウ',1)];baselineA();
 requestProcessorV27(PROCESSOR_V27.PHASE,{to:'standby'});pass();return {fm,deckFusion,graveFusion};
}
let f=forestman(true);
ok('Forestman trigger offered under the lock when a GY 融合 exists',offered('E・HERO フォレストマン'));
eventPickV2(0);pc=pendingChoiceV49(gameState);
ok('under the lock only the GY 融合 is a candidate',!!pc&&pc.candidates.length===1&&pc.candidates[0].uid===f.graveFusion.uid,JSON.stringify(pc&&pc.candidates.map(x=>x.uid)));
pick(f.graveFusion);pass();
ok('Forestman returns the GY 融合 and leaves the Deck copy',zoneOf(f.graveFusion.uid)==='hand'&&zoneOf(f.deckFusion.uid)==='deck');
replay('Forestman locked GY');
f=forestman(false);
ok('Forestman is not offered under the lock with only a Deck 融合',!offered('E・HERO フォレストマン')&&zoneOf(f.deckFusion.uid)==='deck');

/* ===== 魔導雑貨商人: mandatory; under the lock the Spell/Trap goes to GY too ===== */
fresh();let merchant=mk('魔導雑貨商人',0,'down','def');merchant.setTurn=gameState.turn-1;let goblin=mk('ゴブリン突撃部隊'),spell=mk('サイクロン'),rest=mk('E・HERO クレイマン');
gameState.players[0].mz=[merchant];gameState.players[0].deck=[goblin,spell,rest];gameState.players[1].mz=[mk('ライオウ',1)];baselineA();
doFlipUp(0,'mz',0,'atk');pass();if(EVT_V2_STATE){eventPickV2(0);pass();}
ok('魔導雑貨商人 activates under the lock (mandatory)',added('魔導雑貨商人')===1);
ok('under the lock the excavated Spell is sent to GY with the monster',zoneOf(goblin.uid)==='grave'&&zoneOf(spell.uid)==='grave'&&zoneOf(rest.uid)==='deck'&&gameState.players[0].hand.length===0&&!kinds().includes('FX_DECK_TO_HAND'));
replay('魔導雑貨商人 locked');

/* ===== 水晶の占い師: mandatory; under the lock the chosen card goes to GY, the other to the bottom ===== */
fresh();let teller=mk('水晶の占い師',0,'down','def');teller.setTurn=gameState.turn-1;let a=mk('ゴブリン突撃部隊'),b=mk('サイクロン'),z=mk('E・HERO クレイマン');
gameState.players[0].mz=[teller];gameState.players[0].deck=[a,b,z];gameState.players[1].mz=[mk('ライオウ',1)];baselineA();
doFlipUp(0,'mz',0,'atk');pass();if(EVT_V2_STATE){eventPickV2(0);pass();}
pc=pendingChoiceV49(gameState);
ok('水晶の占い師 activates under the lock and asks for one of the top two',added('水晶の占い師')===1&&!!pc&&pc.candidates.length===2);
globalThis.__TSAVE=JSON.stringify({state:gameState});globalThis.__TUIDS=JSON.stringify({a:a.uid,b:b.uid,z:z.uid});
pick(a);pass();
const deckOrder=gameState.players[0].deck.map(x=>x.uid);
ok('under the lock the chosen card goes to GY and the other goes to the bottom',zoneOf(a.uid)==='grave'&&deckOrder.length===2&&deckOrder[0]===z.uid&&deckOrder[1]===b.uid&&gameState.players[0].hand.length===0,JSON.stringify(deckOrder));
globalThis.__TFINAL=v41StateDigest(gameState);
replay('水晶の占い師 locked');
`);

if(first.__TSAVE){
 harness('const SAVED='+JSON.stringify(first.__TSAVE)+';const U=JSON.parse('+JSON.stringify(first.__TUIDS)+');const FINAL='+JSON.stringify(first.__TFINAL)+';'+COMMON+String.raw`
 resetA();gameState=JSON.parse(SAVED).state;EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
 if(typeof v41EnsureReplayState==='function')v41EnsureReplayState(gameState);
 if(typeof v41SyncJournalToState==='function')v41SyncJournalToState(gameState);
 reconcileChoiceAfterLoadV49(gameState);
 const pc=pendingChoiceV49(gameState);
 ok('VM2 restores the pending 水晶の占い師 choice with its lock flag',!!pc&&pc.resume&&pc.resume.args&&pc.resume.args.lockToGrave===true);
 pick(findCardByUid(U.a).card);pass();
 ok('VM2 continuation sends the chosen card to GY under the lock',zoneOf(U.a)==='grave'&&zoneOf(U.b)==='deck');
 ok('VM2 final digest equals VM1 continuation',v41StateDigest(gameState)===FINAL,v41StateDigest(gameState)+' vs '+FINAL);
 replay('VM2 水晶の占い師 continuation');
 `);
}else{console.log('FAIL VM2 save missing');process.exitCode=2;}
