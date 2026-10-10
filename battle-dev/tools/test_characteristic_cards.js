/* CharacteristicOverride recovery batch — 12枚の positive / negative / ruling edge case。 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function reset0(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
}
function sync(){gameState.fieldSnapV9=fieldSnapshotV9(gameState);
  gameState.posSnapV10=positionSnapshotV10(gameState);}
function eff(n,k){const e=nativeEffectsV4(n).find(x=>!k||x.key===k);if(!e)throw new Error('effect '+n+' '+k);return e;}
function ctxAt(card,zone,ev,extra){const h=locateCardAnyV4(card);
  return makeContext(0,card,zone||(h&&h.zone)||'sz',(h&&h.index)||0,ev||'activate',extra||{});}
function answerAll(keys){const pc=pendingChoiceV49(gameState);if(!pc)throw new Error('no pending choice');
  return answerChoiceV49(keys||pc.candidates.map(x=>x.key));}
function pickUid(uid){const pc=pendingChoiceV49(gameState);
  const c=pc.candidates.find(x=>x.uid===uid);if(!c)throw new Error('候補に無い uid');return answerChoiceV49([c.key]);}
function pickLabel(l){const pc=pendingChoiceV49(gameState);
  const c=pc.candidates.find(x=>x.label===l);if(!c)throw new Error('候補に無い label '+l);return answerChoiceV49([c.key]);}
function evts(name){return (gameState.deferredEvents||[]).filter(e=>e.eventName===name).map(e=>e.evt);}
function clearEvts(){gameState.deferredEvents=[];}
function H(card){return locateCardAnyV4(findCardByUid(card.uid).card);}
function findName(pred){for(let i=0;i<CARD_DB.length;i++){if(pred(CARD_DB[i]))return CARD_DB[i].n;}return null;}
/* 小道具は既に TESTED のカードだけを使う。 */
const MON='ヂェミナイ・エルフ';                     /* 魔法使い族・地・レベル4 */
const NORMAL4=findName(d=>d.k==='m'&&!d.ex&&(d.st||[]).indexOf('通常')>=0&&(d.lv||9)<=4);
const LIGHT4=findName(d=>d.k==='m'&&!d.ex&&d.at==='光'&&d.lv===4);
const WARRIOR=findName(d=>d.k==='m'&&!d.ex&&d.ra==='戦士');
const TUNER=findName(d=>d.k==='m'&&!d.ex&&(d.st||[]).indexOf('チューナー')>=0);
const GENEX=findName(d=>d.k==='m'&&!d.ex&&String(d.n).indexOf('ジェネクス')>=0
  &&String(d.n)!=='スペア・ジェネクス');
/* ヂェミナイ・エルフは通常モンスターなので、通常モンスター判定の negative には使えない */
const EFFMON=findName(d=>d.k==='m'&&!d.ex&&(d.st||[]).indexOf('効果')>=0&&(d.st||[]).indexOf('通常')<0);

const NAMES=['ナチュラル・チューン','ライトニング・チューン','プロト・サイバー・ドラゴン',
 'スペア・ジェネクス','A・ジェネクス・リモート','A・ジェネクス・チェンジャー','DNA移植手術',
 '幻惑の巻物','DNA改造手術','竜の血族','アイヴィ・シャックル','竜魂の力'];
NAMES.forEach(n=>ok('Characteristic registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: 小道具カードがDBに揃っている',
   !!NORMAL4&&!!LIGHT4&&!!WARRIOR&&!!TUNER&&!!GENEX&&!!EFFMON);

/* =====================================================================
   チューナーとして扱う
   ===================================================================== */
reset0();
let nt=mk('ナチュラル・チューン'),nm=mk(NORMAL4),eff4=mk(EFFMON);
gameState.players[0].sz=[nt];gameState.players[0].mz=[nm,eff4];sync();
let eNt=eff('ナチュラル・チューン'),cNt=ctxAt(nt,'sz');
ok('ナチュラル・チューン positive: レベル4以下の通常モンスターがいれば発動できる',
   eNt.condition(cNt)===true,NORMAL4);
eNt.operation(cNt);
let pcNt=pendingChoiceV49(gameState);
ok('ナチュラル・チューン ruling: 通常モンスター以外は候補に入らない',
   pcNt.candidates.every(x=>x.uid!==eff4.uid));
pickUid(nm.uid);
ok('ナチュラル・チューン positive: チューナーとして扱われる',API.isTunerNow(H(nm))===true);
ok('ナチュラル・チューン ruling: 印刷情報は非チューナーのまま',
   (dbOf(nm).st||[]).indexOf('チューナー')<0);
ok('ナチュラル・チューン ruling: シンクロ素材条件を満たすようになる',
   slotMatches(dbOf(nm),{tuner:true},null,findCardByUid(nm.uid).card)===true);
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
ok('ナチュラル・チューン ruling: 場を離れれば扱いも消える',
   gameState.players[0].grave[0].charV17===undefined);
reset0();
let nt2=mk('ナチュラル・チューン');gameState.players[0].sz=[nt2];
gameState.players[0].mz=[mk(EFFMON)];sync();
ok('ナチュラル・チューン negative: 通常モンスターがいなければ発動できない',
   eNt.condition(ctxAt(nt2,'sz'))===false);

reset0();
let lt=mk('ライトニング・チューン'),lm=mk(LIGHT4);
gameState.players[0].sz=[lt];gameState.players[0].mz=[lm];sync();
let eLt=eff('ライトニング・チューン');
ok('ライトニング・チューン positive: レベル4の光属性がいれば発動できる',
   eLt.condition(ctxAt(lt,'sz'))===true,LIGHT4);
eLt.operation(ctxAt(lt,'sz'));pickUid(lm.uid);
ok('ライトニング・チューン positive: チューナーとして扱われる',API.isTunerNow(H(lm))===true);
reset0();
let lt2=mk('ライトニング・チューン');gameState.players[0].sz=[lt2];
gameState.players[0].mz=[mk(EFFMON)];sync();
ok('ライトニング・チューン negative: 光属性でなければ発動できない',
   eLt.condition(ctxAt(lt2,'sz'))===false);

/* =====================================================================
   カード名を別のカードとして扱う
   ===================================================================== */
reset0();
let proto=mk('プロト・サイバー・ドラゴン');gameState.players[0].mz=[proto];sync();
const CYBER='サイバー・ドラゴン';
if(findCardIndex(CYBER)>=0){
  ok('プロト・サイバー・ドラゴン positive: 表側なら「サイバー・ドラゴン」として扱う',
     API.nameOf(H(proto))===CYBER);
  ok('プロト・サイバー・ドラゴン positive: 同名判定にも反映される',
     sameCanonicalCardV4(findCardByUid(proto.uid).card,{id:findCardIndex(CYBER)})===true);
  act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,face:'down',pos:'def',reason:'裏側に'});
  ok('プロト・サイバー・ドラゴン negative: 裏側では元の名前のまま',
     API.nameOf(H(proto))==='プロト・サイバー・ドラゴン');
}else{
  ok('プロト・サイバー・ドラゴン positive: 表側なら「サイバー・ドラゴン」として扱う',true,'DBに無い');
  ok('プロト・サイバー・ドラゴン positive: 同名判定にも反映される',true,'スキップ');
  ok('プロト・サイバー・ドラゴン negative: 裏側では元の名前のまま',true,'スキップ');
}

reset0();
let spare=mk('スペア・ジェネクス'),gx=mk(GENEX);
gameState.players[0].mz=[spare,gx];sync();
let eSp=eff('スペア・ジェネクス');
ok('スペア・ジェネクス positive: 他の「ジェネクス」がいれば発動できる',
   eSp.condition(ctxAt(spare,'mz'))===true,GENEX);
eSp.operation(ctxAt(spare,'mz'));
ok('スペア・ジェネクス positive: 名前が「ジェネクス・コントローラー」になる',
   API.nameOf(H(spare))==='ジェネクス・コントローラー');
act({type:'PASS_TURN'});
ok('スペア・ジェネクス ruling: エンドフェイズを過ぎれば元の名前に戻る',
   API.nameOf(H(spare))==='スペア・ジェネクス');
reset0();
let spare2=mk('スペア・ジェネクス');gameState.players[0].mz=[spare2];sync();
ok('スペア・ジェネクス negative: 他の「ジェネクス」がいなければ発動できない',
   eSp.condition(ctxAt(spare2,'mz'))===false);

reset0();
let remote=mk('A・ジェネクス・リモート'),tn=mk(TUNER),nonTn=mk(MON);
gameState.players[0].mz=[remote,tn,nonTn];sync();
let eRm=eff('A・ジェネクス・リモート');
ok('A・ジェネクス・リモート positive: チューナーがいれば発動できる',
   eRm.condition(ctxAt(remote,'mz'))===true,TUNER);
eRm.operation(ctxAt(remote,'mz'));
let pcRm=pendingChoiceV49(gameState);
ok('A・ジェネクス・リモート ruling: チューナー以外は候補に入らない',
   pcRm.candidates.every(x=>x.uid!==nonTn.uid));
pickUid(tn.uid);
ok('A・ジェネクス・リモート positive: 名前が変わる',
   API.nameOf(H(tn))==='ジェネクス・コントローラー');
reset0();
let remote2=mk('A・ジェネクス・リモート',0,'down','def');
gameState.players[0].mz=[remote2,mk(EFFMON)];sync();
ok('A・ジェネクス・リモート negative: 表側のチューナーがいなければ発動できない',
   eRm.condition(ctxAt(remote2,'mz'))===false,'候補='+v17TunersOnField().length);

/* =====================================================================
   属性・種族を変える
   ===================================================================== */
reset0();
let changer=mk('A・ジェネクス・チェンジャー'),tgt=mk(MON);
gameState.players[0].mz=[changer,tgt];sync();
let eCh=eff('A・ジェネクス・チェンジャー');
ok('A・ジェネクス・チェンジャー positive: 表側モンスターがいれば発動できる',
   eCh.condition(ctxAt(changer,'mz'))===true);
eCh.operation(ctxAt(changer,'mz'));
let pcCh=pendingChoiceV49(gameState);
ok('A・ジェネクス・チェンジャー ruling: 属性を宣言する',
   pcCh.candidates.map(x=>x.label).join(',')==='闇,光,地,水,炎,風,神');
pickLabel('炎');
ok('A・ジェネクス・チェンジャー: 宣言の後に対象選択が開く',!!pendingChoiceV49(gameState));
pickUid(tgt.uid);
ok('A・ジェネクス・チェンジャー positive: 属性が宣言した属性になる',
   API.attrOf(H(tgt))==='炎');
ok('A・ジェネクス・チェンジャー ruling: 元々の属性は変わらない',
   API.originalAttrOf(H(tgt))===dbOf(tgt).at);
act({type:'PASS_TURN'});
ok('A・ジェネクス・チェンジャー ruling: エンドフェイズを過ぎれば戻る',
   API.attrOf(H(tgt))===dbOf(tgt).at);

reset0();
/* 永続罠は表側で存在して初めて永続効果ソースになる */
let dna=mk('DNA改造手術'),m1=mk(MON),m2=mk(MON,1);
gameState.players[0].sz=[dna];gameState.players[0].mz=[m1];gameState.players[1].mz=[m2];sync();
API.persistDeclaration(locateCardAnyV4(dna),'race','ドラゴン');
ok('DNA改造手術 positive: 自分のモンスターが宣言した種族になる',API.raceOf(H(m1))==='ドラゴン');
ok('DNA改造手術 positive: 相手のモンスターも宣言した種族になる',API.raceOf(H(m2))==='ドラゴン');
ok('DNA改造手術 ruling: 元々の種族は変わらない',API.originalRaceOf(H(m1))===dbOf(m1).ra);
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
ok('DNA改造手術 ruling: 場を離れれば元の種族に戻る',API.raceOf(H(m1))===dbOf(m1).ra);

reset0();
let dna2=mk('DNA移植手術'),m3=mk(MON);
gameState.players[0].sz=[dna2];gameState.players[0].mz=[m3];sync();
API.persistDeclaration(locateCardAnyV4(dna2),'attribute','闇');
ok('DNA移植手術 positive: 宣言した属性になる',API.attrOf(H(m3))==='闇');
ok('DNA移植手術 negative: 宣言が無ければ何も起きない',
   (()=>{reset0();const d=mk('DNA移植手術'),c=mk(MON);
     gameState.players[0].sz=[d];gameState.players[0].mz=[c];sync();
     return API.attrOf(locateCardAnyV4(c))===dbOf(c).at;})());

reset0();
let blood=mk('竜の血族',0,'down'),b1=mk(MON),b2=mk(MON,1);
gameState.players[0].sz=[blood];gameState.players[0].mz=[b1];gameState.players[1].mz=[b2];sync();
let eBl=eff('竜の血族'),cBl=ctxAt(blood,'sz');
ok('竜の血族 positive: 自分のモンスターがいれば発動できる',eBl.condition(cBl)===true);
eBl.operation(cBl);
ok('竜の血族 positive: 自分のモンスターがドラゴン族になる',API.raceOf(H(b1))==='ドラゴン');
ok('竜の血族 negative: 相手のモンスターは変わらない',API.raceOf(H(b2))===dbOf(b2).ra);
act({type:'PASS_TURN'});
ok('竜の血族 ruling: エンドフェイズを過ぎれば元に戻る',API.raceOf(H(b1))===dbOf(b1).ra);

reset0();
let ivy=mk('アイヴィ・シャックル'),i1=mk(MON,1);
gameState.players[0].sz=[ivy];gameState.players[1].mz=[i1];
gameState.activePlayer=0;sync();
ok('アイヴィ・シャックル positive: 自分のターンは相手モンスターが植物族になる',
   API.raceOf(H(i1))==='植物');
gameState.activePlayer=1;
ok('アイヴィ・シャックル negative: 相手のターンには元の種族に戻る',
   API.raceOf(H(i1))===dbOf(i1).ra);
gameState.activePlayer=0;
gameState.players[0].deck=[mk(MON)];sync();clearEvts();
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true,byPlayer:1});
let ivEvt=evts('onLeaveField').find(e=>e.uid===ivy.uid);
let eIv=eff('アイヴィ・シャックル');
let cIv=makeContext(0,ivy,'grave',0,'onLeaveField',{event:ivEvt});cIv.event=ivEvt;
ok('アイヴィ・シャックル positive: 破壊されたらドローできる',eIv.condition(cIv)===true,
   JSON.stringify(ivEvt));
const handBefore=gameState.players[0].hand.length;
eIv.operation(cIv);
ok('アイヴィ・シャックル positive: 1枚ドローする',gameState.players[0].hand.length===handBefore+1);

/* =====================================================================
   装備由来の特性変更
   ===================================================================== */
reset0();
let dsoul=mk('竜魂の力'),war=mk(WARRIOR),nonWar=mk(MON);
gameState.players[0].sz=[dsoul];gameState.players[0].mz=[war,nonWar];sync();
ok('竜魂の力 ruling: 戦士族にだけ装備できる',
   API.equipLegal(locateCardAnyV4(dsoul),locateCardAnyV4(war))===true
   &&API.equipLegal(locateCardAnyV4(dsoul),locateCardAnyV4(nonWar))===false,WARRIOR);
API.equipSpell(locateCardAnyV4(dsoul),locateCardAnyV4(war),'テスト');
ok('竜魂の力 positive: 装備モンスターがドラゴン族になる',API.raceOf(H(war))==='ドラゴン');
ok('竜魂の力 positive: 攻守が500アップする',
   curATK(findCardByUid(war.uid).card)===dbOf(war).atk+500
   &&curDEF(findCardByUid(war.uid).card)===dbOf(war).def+500);
ok('竜魂の力 negative: 装備していないモンスターは変わらない',API.raceOf(H(nonWar))===dbOf(nonWar).ra);
API.detachEquip(locateCardAnyV4(findCardByUid(dsoul.uid).card),'テスト');
ok('竜魂の力 ruling: 装備が外れれば種族も戻る',API.raceOf(H(war))===dbOf(war).ra);

reset0();
let scroll=mk('幻惑の巻物'),sm=mk(MON);
gameState.players[0].sz=[scroll];gameState.players[0].mz=[sm];sync();
API.equipSpell(locateCardAnyV4(scroll),locateCardAnyV4(sm),'テスト');
API.persistDeclaration(locateCardAnyV4(findCardByUid(scroll.uid).card),'attribute','水');
ok('幻惑の巻物 positive: 装備モンスターの属性が宣言した属性になる',API.attrOf(H(sm))==='水');
ok('幻惑の巻物 ruling: 元々の属性は変わらない',API.originalAttrOf(H(sm))===dbOf(sm).at);

/* =====================================================================
   Replay / SaveLoad / 直列化
   ===================================================================== */
reset0();
let rNt=mk('ナチュラル・チューン'),rNm=mk(NORMAL4);
gameState.players[0].sz=[rNt];gameState.players[0].mz=[rNm];sync();
v41ResetActionJournal(gameState);
eNt.operation(ctxAt(rNt,'sz'));pickUid(rNm.uid);
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: 特性の上書きを含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('直列化: 特性の上書きに関数が混入していない',
   assertCharStateSerializableV17(gameState)===null);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
