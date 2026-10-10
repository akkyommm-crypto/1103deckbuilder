/* S03-U05: C-S03-01 DECK_TO_HAND_LOCK recovery part B — spell / hand-cost searchers.
   Each card: unlocked real path adds from Deck; locked (face-up ライオウ) activation is illegal (R1103-RAIOH-004).
   調律: mill only after a successful search (KONAMI Q&A); chain-restored lock skips both.
   光の援軍: 3-card mill is an activation cost (reviewed ruling), Deck of 4+ required, search at resolution via registry choice.
   神の居城－ヴァルハラ (helper for ヘカテリス, recovered here): activation does not Special Summon (10/05/16);
   field ignition 1/turn Special Summons a Fairy from hand when you control no monsters. */
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
function legalAt(uid,logical){const x=findCardByUid(uid);return strictScriptLegalityV2(cardName(x.card),x.p,x.zone,x.index,logical?{cardOverride:x.card,logicalZone:logical,prospectiveIndex:gameState.players[x.p].sz.length}:{});}
function activateAt(uid){const x=findCardByUid(uid);return prepareDuelActivation(cardName(x.card),x.p,x.zone,x.index,{});}
function lockFoe(){gameState.players[1].mz=[mk('ライオウ',1)];}
`;

const first=harness(COMMON+String.raw`
/* ===== normal spells: E－エマージェンシーコール, スクラップ・エリア, 化石調査 ===== */
for(const [spell,target] of [['E－エマージェンシーコール','E・HERO クレイマン'],['スクラップ・エリア','スクラップ・ゴブリン'],['化石調査','ジュラック・ガリム']]){
 fresh();let s=mk(spell),t=mk(target);gameState.players[0].hand=[s];gameState.players[0].deck=[t,mk('サイクロン')];baselineA();
 ok(spell+' legal without the lock',legalAt(s.uid,'sz').ok);
 duelActivateFromHand(0);if(!pendingChoiceV49(gameState))pass();pick(t);pass();
 /* S03-U64: スクラップ・エリア's Deck choice moved to resolution time; the others stay at activation. */
 /* S03-U07 closed C-S03-04: 化石調査 (unified, empty effect afterResolve) now goes to the GY like the others. */
 ok(spell+' adds '+target,zoneOf(t.uid)==='hand'&&zoneOf(s.uid)==='grave'&&!gameState.systemFault,JSON.stringify({t:zoneOf(t.uid),s:zoneOf(s.uid)}));
 replay(spell+' unlocked');
 fresh();s=mk(spell);gameState.players[0].hand=[s];gameState.players[0].deck=[mk(target)];lockFoe();baselineA();
 const L=legalAt(s.uid,'sz');ok(spell+' illegal under ライオウ',!L.ok&&/ライオウ/.test(L.reason),JSON.stringify(L));
}

/* ===== trap: 神の桎梏グレイプニル (set earlier) ===== */
fresh();let g=mk('神の桎梏グレイプニル',0,'down');g.setTurn=gameState.turn-1;let tyr=mk('極星將テュール');
gameState.players[0].sz=[g];gameState.players[0].deck=[tyr];baselineA();
ok('グレイプニル legal without the lock',legalAt(g.uid).ok,JSON.stringify(legalAt(g.uid)));
activateAt(g.uid);if(!pendingChoiceV49(gameState))pass();pick(tyr);pass();
ok('グレイプニル adds a 極星 monster',zoneOf(tyr.uid)==='hand'&&zoneOf(g.uid)==='grave');
replay('グレイプニル unlocked');
fresh();g=mk('神の桎梏グレイプニル',0,'down');g.setTurn=gameState.turn-1;gameState.players[0].sz=[g];gameState.players[0].deck=[mk('極星將テュール')];lockFoe();baselineA();
ok('グレイプニル illegal under ライオウ',!legalAt(g.uid).ok);

/* ===== hand-cost searchers: 墓守の司令官, ヘカテリス, 魔轟神グリムロ ===== */
fresh();let cmd=mk('墓守の司令官'),nv=mk('王家の眠る谷－ネクロバレー');gameState.players[0].hand=[cmd];gameState.players[0].deck=[nv];baselineA();
ok('墓守の司令官 legal without the lock',legalAt(cmd.uid).ok);
activateAt(cmd.uid);pass();
ok('墓守の司令官 discards itself as cost and adds ネクロバレー',zoneOf(cmd.uid)==='grave'&&zoneOf(nv.uid)==='hand');
replay('墓守の司令官 unlocked');
fresh();cmd=mk('墓守の司令官');gameState.players[0].hand=[cmd];gameState.players[0].deck=[mk('王家の眠る谷－ネクロバレー')];lockFoe();baselineA();
ok('墓守の司令官 illegal under ライオウ',!legalAt(cmd.uid).ok);

fresh();let hec=mk('ヘカテリス'),val=mk('神の居城－ヴァルハラ');gameState.players[0].hand=[hec];gameState.players[0].deck=[val];baselineA();
ok('ヘカテリス legal without the lock',legalAt(hec.uid).ok);
activateAt(hec.uid);pass();
ok('ヘカテリス discards itself and adds ヴァルハラ',zoneOf(hec.uid)==='grave'&&zoneOf(val.uid)==='hand');
replay('ヘカテリス unlocked');
fresh();hec=mk('ヘカテリス');gameState.players[0].hand=[hec];gameState.players[0].deck=[mk('神の居城－ヴァルハラ')];lockFoe();baselineA();
ok('ヘカテリス illegal under ライオウ',!legalAt(hec.uid).ok);

fresh();let ash=mk('魔轟神アシェンヴェイル'),grim=mk('魔轟神グリムロ'),sol=mk('魔轟神ソルキウス');
gameState.players[0].mz=[ash];gameState.players[0].hand=[grim];gameState.players[0].deck=[sol];baselineA();
ok('魔轟神グリムロ legal without the lock',legalAt(grim.uid).ok,JSON.stringify(legalAt(grim.uid)));
activateAt(grim.uid);if(!pendingChoiceV49(gameState))pass();if(pendingChoiceV49(gameState))pick(sol);pass();
ok('魔轟神グリムロ sends itself and adds a 魔轟神',zoneOf(grim.uid)==='grave'&&zoneOf(sol.uid)==='hand');
replay('魔轟神グリムロ unlocked');
fresh();grim=mk('魔轟神グリムロ');gameState.players[0].mz=[mk('魔轟神アシェンヴェイル')];gameState.players[0].hand=[grim];gameState.players[0].deck=[mk('魔轟神ソルキウス')];lockFoe();baselineA();
ok('魔轟神グリムロ illegal under ライオウ',!legalAt(grim.uid).ok);

/* ===== 調律 ===== */
fresh();let tune=mk('調律'),junk=mk('ジャンク・シンクロン');gameState.players[0].hand=[tune];gameState.players[0].deck=[junk,mk('サイクロン'),mk('サイクロン')];baselineA();
duelActivateFromHand(0);pick(junk);pass();
const k1=kinds();
ok('調律 adds a Synchron Tuner then mills the Deck top',zoneOf(junk.uid)==='hand'&&gameState.players[0].deck.length===1&&k1.indexOf('FX_SEARCH')>=0&&k1.lastIndexOf('FX_MILL_TOP')>k1.indexOf('FX_SEARCH'));
replay('調律 unlocked');
fresh();tune=mk('調律');gameState.players[0].hand=[tune];gameState.players[0].deck=[mk('ジャンク・シンクロン')];baselineA();
ok('調律 illegal with a Deck of 1',!legalAt(tune.uid,'sz').ok);
fresh();tune=mk('調律');gameState.players[0].hand=[tune];gameState.players[0].deck=[mk('ジャンク・シンクロン'),mk('サイクロン')];lockFoe();baselineA();
ok('調律 illegal under ライオウ',!legalAt(tune.uid,'sz').ok);
fresh();tune=mk('調律');junk=mk('ジャンク・シンクロン');let drain=mk('スキルドレイン',1),setc=mk('サイクロン',1,'down');setc.setTurn=gameState.turn-1;
gameState.players[0].hand=[tune];gameState.players[0].deck=[junk,mk('サイクロン'),mk('サイクロン')];lockFoe();gameState.players[1].sz=[drain,setc];baselineA();
duelActivateFromHand(0);pick(junk);duelActivateResponseV2(1,'sz',1);pick(drain);pass();
ok('chain-restored lock: 調律 neither adds nor mills',zoneOf(junk.uid)==='deck'&&gameState.players[0].deck.length===3&&!kinds().includes('FX_SEARCH')&&!kinds().includes('FX_MILL_TOP'));
replay('調律 chain-restored lock');

/* ===== 光の援軍 ===== */
fresh();let lr=mk('光の援軍'),ehren=mk('ライトロード・モンク エイリン');let top=[mk('サイクロン'),mk('サイクロン'),mk('E・HERO クレイマン')];
gameState.players[0].hand=[lr];gameState.players[0].deck=top.concat([ehren]);baselineA();
ok('光の援軍 legal with a Deck of 4',legalAt(lr.uid,'sz').ok);
duelActivateFromHand(0);
ok('光の援軍 mills 3 as activation cost before the chain resolves',top.every(c=>zoneOf(c.uid)==='grave')&&gameState.chain.length===1);
pass();pick(ehren);pass();
ok('光の援軍 adds a Lv4-or-lower Lightsworn at resolution',zoneOf(ehren.uid)==='hand');
replay('光の援軍 unlocked');
fresh();lr=mk('光の援軍');gameState.players[0].hand=[lr];gameState.players[0].deck=[mk('サイクロン'),mk('サイクロン'),mk('ライトロード・モンク エイリン')];baselineA();
ok('光の援軍 illegal with a Deck of 3',!legalAt(lr.uid,'sz').ok);
fresh();lr=mk('光の援軍');gameState.players[0].hand=[lr];gameState.players[0].deck=[mk('サイクロン'),mk('サイクロン'),mk('サイクロン'),mk('ライトロード・モンク エイリン')];lockFoe();baselineA();
ok('光の援軍 illegal under ライオウ',!legalAt(lr.uid,'sz').ok);
fresh();lr=mk('光の援軍');ehren=mk('ライトロード・モンク エイリン');gameState.players[0].hand=[lr];gameState.players[0].deck=[ehren,mk('サイクロン'),mk('サイクロン'),mk('サイクロン')];baselineA();
duelActivateFromHand(0);pass();
ok('if the cost mills the only Lightsworn, resolution adds nothing',zoneOf(ehren.uid)==='grave'&&!pendingChoiceV49(gameState)&&gameState.players[0].hand.length===0);

/* ===== 神の居城－ヴァルハラ (helper recovered for ヘカテリス) ===== */
fresh();val=mk('神の居城－ヴァルハラ');let fairy=mk('もけもけ');gameState.players[0].hand=[val,fairy];baselineA();
duelActivateFromHand(0);pass();
ok('ヴァルハラ activation does not Special Summon (10/05/16)',zoneOf(val.uid)==='sz'&&zoneOf(fairy.uid)==='hand'&&!pendingChoiceV49(gameState)&&!gameState.chain.length&&!gameState.systemFault);
ok('ヴァルハラ field effect legal with no monsters and a Fairy in hand',legalAt(val.uid).ok,JSON.stringify(legalAt(val.uid)));
activateAt(val.uid);if(pendingChoiceV49(gameState))pick(fairy);pass();
ok('ヴァルハラ Special Summons the Fairy',zoneOf(fairy.uid)==='mz');
ok('ヴァルハラ effect is once per turn / needs no monsters',!legalAt(val.uid).ok);
replay('ヴァルハラ');
`);
