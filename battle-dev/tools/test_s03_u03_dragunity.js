/* S03-U03: Dragunity Synchro line recovery through real DUEL paths.
   ヴァジュランダ: Dux → Phalanx → Synchro → equip trigger → cost → ATK double → real End Phase expiry.
   ガジャルグ: search then discard, 1/turn, ライオウ lock (illegal / restored in chain), second-VM resume mid-resolution.
   バルーチャ: multi-target grave equip, partial resolution when a target leaves the GY in chain, +300 per Dragunity equip.
   Rulings: 2009-2010 wiki snapshots (see cards/H1_claude_s03_dragunity.js). Helper cards are TESTED or GENERIC_OK. */
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
function pickMany(cards){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing');cards.forEach(c=>{const i=pc.candidates.findIndex(x=>x.uid===c.uid);if(i<0)throw Error('candidate missing '+cardName(c));__choicePickV49(i);});__choiceCommitV49();}
function replay(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+' Replay nonempty and consistent',pkg.actions.length>0&&a.ok,JSON.stringify(a));}
function zoneOf(uid){const x=findCardByUid(uid);return x?x.zone:null;}
function cardOf(uid){const x=findCardByUid(uid);return x?x.card:null;}
function atkOf(uid){return curATK(cardOf(uid));}
function legalAt(uid){const x=findCardByUid(uid);return strictScriptLegalityV2(cardName(x.card),x.p,x.zone,x.index,{});}
function activateAt(uid){const x=findCardByUid(uid);return prepareDuelActivation(cardName(x.card),x.p,x.zone,x.index,{});}
function links(name){return V41_ACTION_JOURNAL.filter(x=>x.action.type==='CHAIN_ADD'&&x.action.name===name);}
function kinds(){return V41_ACTION_JOURNAL.map(x=>x.action.type);}
const VAJ='ドラグニティナイト－ヴァジュランダ',GAJ='ドラグニティナイト－ガジャルグ',BAL='ドラグニティナイト－バルーチャ';
`;

const first=harness(COMMON+String.raw`
/* ===== ヴァジュランダ: real Dragunity line ===== */
fresh();let dux=mk('ドラグニティ－ドゥクス'),pha=mk('ドラグニティ－ファランクス'),vaj=mk(VAJ);
gameState.players[0].hand=[dux];gameState.players[0].grave=[pha];gameState.players[0].ex=[vaj];baselineA();
doNormalSummon(0,'atk');pass();eventPickV2(0);pick(pha);pass();
ok('Dux equips Phalanx from GY',zoneOf(pha.uid)==='sz');
activateAt(pha.uid);pass();
ok('equipped Phalanx Special Summons itself',zoneOf(pha.uid)==='mz');
let combos=exCombos(0,dbOf(vaj)).combos;
ok('Vajrayana materials: Dragon Tuner + non-Tuner Winged Beast',combos.length===1,JSON.stringify(combos.map(c=>c.label)));
doExSummon(0,0,combos[0].materials,'synchro','atk');pass();
ok('Vajrayana Synchro Summoned and its equip trigger is offered',zoneOf(vaj.uid)==='mz'&&cardOf(vaj.uid).specialSummonKind==='synchro'&&!!EVT_V2_STATE);
eventPickV2(0);let pc=pendingChoiceV49(gameState);
ok('equip trigger targets only Lv3-or-lower Dragon Dragunity in own GY',!!pc&&pc.targeting&&pc.candidates.length===1&&pc.candidates[0].uid===pha.uid,JSON.stringify(pc&&pc.candidates.map(x=>x.label)));
pick(pha);pass();
ok('Vajrayana equips Phalanx as an Equip Card',zoneOf(pha.uid)==='sz'&&cardOf(pha.uid).equipTo.uid===vaj.uid&&atkOf(vaj.uid)===1900,atkOf(vaj.uid));
ok('equip trigger consumed no count',links(VAJ).length===1&&!links(VAJ)[0].action.v44CountConsume);
replay('Vajrayana Synchro equip');
let L=legalAt(vaj.uid);ok('Vajrayana double is legal with an equip',L.ok,JSON.stringify(L));
activateAt(vaj.uid);pc=pendingChoiceV49(gameState);
ok('double asks for the equip card to send as cost',!!pc&&!pc.targeting&&pc.candidates.some(x=>x.uid===pha.uid));
pick(pha);
ok('cost is paid before the chain resolves',zoneOf(pha.uid)==='grave'&&gameState.chain.length===1&&gameState.chain[0].v4EffectKey==='double');
pass();
ok('Vajrayana ATK doubles',atkOf(vaj.uid)===3800,atkOf(vaj.uid));
ok('double consumed its own count only',countLeft(0,VAJ,CARD_SCRIPTS[VAJ],cardOf(vaj.uid),'double')<=0&&!!links(VAJ)[1].action.v44CountConsume);
ok('double is not legal again without an equip',!legalAt(vaj.uid).ok);
replay('Vajrayana double');
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});pass();
requestProcessorV27(PROCESSOR_V27.TURN,{});pass();
ok('doubling lasts until the end of the turn (real End Phase and turn change)',gameState.turn===6&&atkOf(vaj.uid)===1900,JSON.stringify({turn:gameState.turn,atk:atkOf(vaj.uid)}));
replay('Vajrayana end of turn');

/* Current ATK (not original) is doubled: a +300 WIND source is included at resolution. */
fresh();pha=mk('ドラグニティ－ファランクス');dux=mk('ドラグニティ－ドゥクス');vaj=mk(VAJ);let harpy=mk('ハーピィ・レディ1'),spear=mk('ドラグニティ－ブラックスピア');
gameState.players[0].mz=[pha,dux,harpy];gameState.players[0].ex=[vaj];baselineA();
combos=exCombos(0,dbOf(vaj)).combos.filter(c=>c.materials.includes(0)&&c.materials.includes(1)&&c.materials.length===2);
doExSummon(0,0,combos[0].materials,'synchro','atk');pass();eventPickV2(0);pick(pha);pass();
ok('Vajrayana with Harpie Lady 1 aura',atkOf(vaj.uid)===2200,atkOf(vaj.uid));
activateAt(vaj.uid);pick(pha);pass();
ok('double uses current ATK including the aura',atkOf(vaj.uid)===4400,atkOf(vaj.uid));

/* ===== ガジャルグ ===== */
fresh();let gaj=mk(GAJ),legion=mk('ドラグニティ－レギオン'),bspear=mk('ドラグニティ－ブラックスピア'),angus=mk('ドラグニティ－アングス'),cyc=mk('サイクロン');
gameState.players[0].mz=[gaj];gameState.players[0].deck=[legion,bspear,angus,cyc];baselineA();
ok('Gajalg ignition legal',legalAt(gaj.uid).ok);
activateAt(gaj.uid);ok('Gajalg activation opens no activation-time choice',gameState.chain.length===1&&!pendingChoiceV49(gameState));
pass();pc=pendingChoiceV49(gameState);
ok('resolution asks for a Lv4-or-lower Dragon or Winged Beast from Deck',!!pc&&pc.candidates.length===2&&pc.candidates.some(x=>x.uid===legion.uid)&&pc.candidates.some(x=>x.uid===bspear.uid),JSON.stringify(pc&&pc.candidates.map(x=>x.label)));
pick(legion);pc=pendingChoiceV49(gameState);
ok('after adding, asks for a Dragon or Winged Beast to discard',zoneOf(legion.uid)==='hand'&&!!pc&&pc.candidates.length===1&&pc.candidates[0].uid===legion.uid&&!pc.cancelable);
pick(legion);pass();
const order=kinds();
ok('search happens before discard',zoneOf(legion.uid)==='grave'&&gameState.players[0].hand.length===0&&order.indexOf('FX_SEARCH')>=0&&order.indexOf('FX_DISCARD')>order.indexOf('FX_SEARCH'),JSON.stringify(order.filter(k=>/FX_/.test(k))));
ok('Gajalg is once per turn',!legalAt(gaj.uid).ok);
replay('Gajalg search and discard');

fresh();gaj=mk(GAJ);gameState.players[0].mz=[gaj];gameState.players[0].deck=[mk('ドラグニティ－レギオン')];gameState.players[1].mz=[mk('ライオウ',1)];baselineA();
L=legalAt(gaj.uid);ok('Gajalg cannot be activated under face-up ライオウ',!L.ok&&/ライオウ/.test(L.reason),JSON.stringify(L));

fresh();gaj=mk(GAJ);legion=mk('ドラグニティ－レギオン');let drain=mk('スキルドレイン',1),setc=mk('サイクロン',1,'down');setc.setTurn=gameState.turn-1;
gameState.players[0].mz=[gaj];gameState.players[0].hand=[mk('ドラグニティ－ブラックスピア')];gameState.players[0].deck=[legion];gameState.players[1].mz=[mk('ライオウ',1)];gameState.players[1].sz=[drain,setc];baselineA();
L=legalAt(gaj.uid);ok('Gajalg activation legal while スキルドレイン suppresses the lock',L.ok,JSON.stringify(L));
activateAt(gaj.uid);duelActivateResponseV2(1,'sz',1);pick(drain);pass();
ok('lock restored in chain: Gajalg neither adds nor discards',zoneOf(drain.uid)==='grave'&&zoneOf(legion.uid)==='deck'&&gameState.players[0].hand.length===1&&!pendingChoiceV49(gameState)&&!kinds().includes('FX_SEARCH')&&!kinds().includes('FX_DISCARD')&&!gameState.systemFault);
replay('Gajalg chain-restored lock');

/* Save while the resolution-time Deck choice is pending; VM2 continues. */
fresh();gaj=mk(GAJ);legion=mk('ドラグニティ－レギオン');bspear=mk('ドラグニティ－ブラックスピア');
gameState.players[0].mz=[gaj];gameState.players[0].deck=[legion,bspear];baselineA();
activateAt(gaj.uid);pass();
globalThis.__GSAVE=JSON.stringify({state:gameState});globalThis.__GUIDS=JSON.stringify({gaj:gaj.uid,legion:legion.uid,bspear:bspear.uid});
pick(bspear);pick(bspear);pass();
globalThis.__GFINAL=v41StateDigest(gameState);
ok('VM1 continuation discards the searched Blackspear',zoneOf(bspear.uid)==='grave'&&zoneOf(legion.uid)==='deck');

/* ===== バルーチャ ===== */
fresh();pha=mk('ドラグニティ－ファランクス');let bird=mk('巨大な怪鳥'),bal=mk(BAL);bspear=mk('ドラグニティ－ブラックスピア');let corse=mk('ドラグニティ－コルセスカ'),brand=mk('ドラグニティ－ブランディストック');legion=mk('ドラグニティ－レギオン');
gameState.players[0].mz=[pha,bird];gameState.players[0].grave=[bspear,corse,brand,legion];gameState.players[0].ex=[bal];baselineA();
combos=exCombos(0,dbOf(bal)).combos;
ok('Balucha materials: Dragon Tuner + Lv6 Winged Beast',combos.length===1,JSON.stringify(combos.map(c=>c.label)));
doExSummon(0,0,combos[0].materials,'synchro','atk');pass();
ok('Balucha Synchro Summoned and trigger offered',zoneOf(bal.uid)==='mz'&&!!EVT_V2_STATE);
eventPickV2(0);pc=pendingChoiceV49(gameState);
ok('Balucha targets any number of Dragon Dragunity in GY (Winged Beast excluded)',!!pc&&pc.targeting&&pc.min===1&&pc.max===4&&!pc.candidates.some(x=>x.uid===legion.uid),JSON.stringify(pc&&{min:pc.min,max:pc.max,c:pc.candidates.map(x=>x.label)}));
pickMany([bspear,corse,brand]);
ok('three targets on one chain link',gameState.chain.length===1&&API.chainLinkTargets(gameState.chain[0].chainId).length===3);
pass();
ok('Balucha equips all three targets',[bspear,corse,brand].every(c=>zoneOf(c.uid)==='sz'&&cardOf(c.uid).equipTo.uid===bal.uid));
ok('Balucha gains 300 per equipped Dragunity card',atkOf(bal.uid)===2900,atkOf(bal.uid));
replay('Balucha three equips');

/* A target leaving the GY in chain does not stop the others (2010-06-17). */
fresh();pha=mk('ドラグニティ－ファランクス');bird=mk('巨大な怪鳥');bal=mk(BAL);bspear=mk('ドラグニティ－ブラックスピア');corse=mk('ドラグニティ－コルセスカ');brand=mk('ドラグニティ－ブランディストック');
let rev=mk('エンジェル・リフト',0,'down');rev.setTurn=gameState.turn-1;
gameState.players[0].mz=[pha,bird];gameState.players[0].grave=[bspear,corse,brand];gameState.players[0].sz=[rev];gameState.players[0].ex=[bal];baselineA();
doExSummon(0,0,exCombos(0,dbOf(bal)).combos[0].materials,'synchro','atk');pass();eventPickV2(0);pickMany([bspear,corse,brand]);
ok('opponent passes first, then Balucha controller may respond',!!gameState.chainWindow);
chainPassV2();
ok('エンジェル・リフト is a legal response for the Balucha controller',getChainResponsesV2(0).some(x=>x.card.uid===rev.uid));
duelActivateResponseV2(0,'sz',0);pick(corse);pass();
ok('one target was Special Summoned in chain; the other two are still equipped',zoneOf(corse.uid)==='mz'&&zoneOf(bspear.uid)==='sz'&&zoneOf(brand.uid)==='sz'&&atkOf(bal.uid)===2600,JSON.stringify({corse:zoneOf(corse.uid),atk:atkOf(bal.uid)}));
replay('Balucha partial resolution');

/* ===== ラヴァルバル・ドラグーン: same search-then-hand contract, Laval theme ===== */
fresh();let galim=mk('ジュラック・ガリム'),magma=mk('ラヴァルのマグマ砲兵'),drg=mk('ラヴァルバル・ドラグーン'),cannon=mk('ラヴァル・キャノン');
gameState.players[0].mz=[galim,magma];gameState.players[0].ex=[drg];gameState.players[0].deck=[cannon,mk('サイクロン')];baselineA();
combos=exCombos(0,dbOf(drg)).combos;
ok('Lavalval Dragoon materials: Tuner + non-Tuner FIRE',combos.length===1,JSON.stringify(combos.map(c=>c.label)));
doExSummon(0,0,combos[0].materials,'synchro','atk');pass();
ok('Lavalval Dragoon Synchro Summoned',zoneOf(drg.uid)==='mz'&&cardOf(drg.uid).specialSummonKind==='synchro');
L=legalAt(drg.uid);ok('Dragoon ignition legal after its Synchro Summon',L.ok,JSON.stringify(L));
activateAt(drg.uid);pass();pc=pendingChoiceV49(gameState);
ok('Dragoon searches only Laval monsters',!!pc&&pc.candidates.length===1&&pc.candidates[0].uid===cannon.uid,JSON.stringify(pc&&pc.candidates.map(x=>x.label)));
pick(cannon);pc=pendingChoiceV49(gameState);
ok('then asks for a Laval monster in hand to send to GY',zoneOf(cannon.uid)==='hand'&&!!pc&&pc.candidates.length===1&&!pc.cancelable);
pick(cannon);pass();
ok('Dragoon sends from hand to GY, not a discard',zoneOf(cannon.uid)==='grave'&&kinds().includes('FX_HAND_SEND_GRAVE')&&!kinds().includes('FX_DISCARD'));
ok('Dragoon is once per turn',!legalAt(drg.uid).ok);
replay('Lavalval Dragoon search then send');

fresh();drg=mk('ラヴァルバル・ドラグーン');gameState.players[0].mz=[drg];gameState.players[0].deck=[mk('ラヴァル・キャノン')];gameState.players[1].mz=[mk('ライオウ',1)];baselineA();
L=legalAt(drg.uid);ok('Dragoon cannot be activated under face-up ライオウ',!L.ok&&/ライオウ/.test(L.reason),JSON.stringify(L));

fresh();drg=mk('ラヴァルバル・ドラグーン');cannon=mk('ラヴァル・キャノン');drain=mk('スキルドレイン',1);setc=mk('サイクロン',1,'down');setc.setTurn=gameState.turn-1;
gameState.players[0].mz=[drg];gameState.players[0].deck=[cannon];gameState.players[1].mz=[mk('ライオウ',1)];gameState.players[1].sz=[drain,setc];baselineA();
activateAt(drg.uid);duelActivateResponseV2(1,'sz',1);pick(drain);pass();
ok('lock restored in chain: Dragoon neither searches nor sends (2011-05-10)',zoneOf(cannon.uid)==='deck'&&!kinds().includes('FX_SEARCH')&&!kinds().includes('FX_HAND_SEND_GRAVE')&&!pendingChoiceV49(gameState)&&!gameState.systemFault);
replay('Dragoon chain-restored lock');
`);

if(first.__GSAVE){
 harness('const SAVED='+JSON.stringify(first.__GSAVE)+';const U=JSON.parse('+JSON.stringify(first.__GUIDS)+');const FINAL='+JSON.stringify(first.__GFINAL)+';'+COMMON+String.raw`
 resetA();gameState=JSON.parse(SAVED).state;EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
 if(typeof v41EnsureReplayState==='function')v41EnsureReplayState(gameState);
 if(typeof v41SyncJournalToState==='function')v41SyncJournalToState(gameState);
 reconcileChoiceAfterLoadV49(gameState);
 const pc=pendingChoiceV49(gameState);
 ok('VM2 restores the pending Gajalg Deck choice',!!pc&&pc.resume&&pc.resume.handler==='claudeS03.search-then-hand'&&pc.candidates.length===2);
 pick(cardOf(U.bspear));pick(cardOf(U.bspear));pass();
 ok('VM2 continuation searches then discards',zoneOf(U.bspear)==='grave'&&zoneOf(U.legion)==='deck'&&!gameState.systemFault);
 ok('VM2 final digest equals VM1 continuation',v41StateDigest(gameState)===FINAL,v41StateDigest(gameState)+' vs '+FINAL);
 replay('VM2 Gajalg continuation');
 `);
}else{console.log('FAIL VM2 save missing');process.exitCode=2;}
