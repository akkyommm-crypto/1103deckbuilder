/* LevelModifier recovery batch — 12枚の positive / negative / ruling edge case。 */
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
function run(e,c){if(e.cost){let p=false;e.cost(c,v=>{p=v;});} if(e.target)e.target(c,r=>{c.selectedTargets=r;}); e.operation(c);}
function answerAll(keys){const pc=pendingChoiceV49(gameState);if(!pc)throw new Error('no pending choice');
  return answerChoiceV49(keys||pc.candidates.map(x=>x.key));}
function pickUid(uid){const pc=pendingChoiceV49(gameState);
  const c=pc.candidates.find(x=>x.uid===uid);if(!c)throw new Error('候補に無い uid');return answerChoiceV49([c.key]);}
function lvOf(card){const h=findCardByUid(card.uid);return h?curLV(h.card):-1;}
function findName(pred){for(let i=0;i<CARD_DB.length;i++){if(pred(CARD_DB[i]))return CARD_DB[i].n;}return null;}
/* 小道具は既に TESTED のカードだけを使う。 */
const MON='ヂェミナイ・エルフ';            /* レベル4 */
const PSYCHIC=findName(d=>d.k==='m'&&!d.ex&&d.ra==='サイキック');
const SMALL=findName(d=>d.k==='m'&&!d.ex&&(d.atk||0)<=1000&&(d.atk||0)>0);
const EQUIP='団結の力';

const NAMES=['レベル・リチューナー','スター・チェンジャー','デルタフライ','ハウリング・ウォリアー',
 '波動共鳴','鍵戦士キーマン','ミニチュアライズ','サイキックブレイク','降格処分','シンクロ・ヒーロー',
 'デビリアン・ソング','シャインナイト'];
NAMES.forEach(n=>ok('LevelModifier registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: 小道具カードがDBに揃っている',!!PSYCHIC&&!!SMALL);

/* =====================================================================
   選んだモンスターのレベルを動かすカード
   ===================================================================== */
reset0();
let ret=mk('レベル・リチューナー',0,'down'),rm=mk(MON);
gameState.players[0].sz=[ret];gameState.players[0].mz=[rm];sync();
let baseLv=dbOf(rm).lv;
let eRe=eff('レベル・リチューナー'),cRe=ctxAt(ret,'sz');
ok('レベル・リチューナー positive: 自分のモンスターがいれば発動できる',eRe.condition(cRe)===true);
eRe.operation(cRe);pickUid(rm.uid);
ok('レベル・リチューナー positive: レベルが2つ下がる',lvOf(rm)===baseLv-2,'lv='+lvOf(rm));
ok('レベル・リチューナー ruling: 元々のレベル（印刷値）は変わらない',dbOf(rm).lv===baseLv);
reset0();
let ret2=mk('レベル・リチューナー',0,'down');gameState.players[0].sz=[ret2];
gameState.players[1].mz=[mk(MON,1)];sync();
ok('レベル・リチューナー negative: 自分のモンスターがいなければ発動できない',
   eRe.condition(ctxAt(ret2,'sz'))===false);

reset0();
let sc=mk('スター・チェンジャー'),sm=mk(MON);
gameState.players[0].sz=[sc];gameState.players[0].mz=[sm];sync();
let eSc=eff('スター・チェンジャー'),cSc=ctxAt(sc,'sz');
ok('スター・チェンジャー positive: 表側モンスターがいれば発動できる',eSc.condition(cSc)===true);
eSc.operation(cSc);
let pcMode=pendingChoiceV49(gameState);
ok('スター・チェンジャー ruling: 上げるか下げるかを選ぶ',
   pcMode.candidates.map(x=>x.value).join(',')==='1,-1');
answerAll(['down']);
ok('スター・チェンジャー: モード選択の後に対象選択が開く',!!pendingChoiceV49(gameState));
pickUid(sm.uid);
ok('スター・チェンジャー positive: 選んだ通りレベルが1つ下がる',lvOf(sm)===dbOf(sm).lv-1);
reset0();
let sc2=mk('スター・チェンジャー');gameState.players[0].sz=[sc2];
gameState.players[0].mz=[mk(MON,0,'down','def')];sync();
ok('スター・チェンジャー negative: 裏側だけなら発動できない',
   eSc.condition(ctxAt(sc2,'sz'))===false);

reset0();
let delta=mk('デルタフライ'),dm=mk(MON);
gameState.players[0].mz=[delta,dm];sync();
let eDe=eff('デルタフライ'),cDe=ctxAt(delta,'mz');
ok('デルタフライ positive: 他の自分のモンスターがいれば発動できる',eDe.condition(cDe)===true);
eDe.operation(cDe);
let pcDe=pendingChoiceV49(gameState);
ok('デルタフライ ruling: 自分自身は候補に入らない',
   pcDe.candidates.every(x=>x.uid!==delta.uid));
pickUid(dm.uid);
ok('デルタフライ positive: レベルが1つ上がる',lvOf(dm)===dbOf(dm).lv+1);
reset0();
let delta2=mk('デルタフライ');gameState.players[0].mz=[delta2];sync();
ok('デルタフライ negative: 自分しかいなければ発動できない',
   eDe.condition(ctxAt(delta2,'mz'))===false);

reset0();
let howl=mk('ハウリング・ウォリアー'),hm=mk(MON);
gameState.players[0].mz=[howl,hm];sync();
let eHo=eff('ハウリング・ウォリアー');
let cHo=ctxAt(howl,'mz','onNormalSummon',{event:{card:howl}});cHo.event={card:howl};
ok('ハウリング・ウォリアー positive: 召喚成功で誘発する',eHo.condition(cHo)===true);
eHo.operation(cHo);pickUid(hm.uid);
ok('ハウリング・ウォリアー positive: 選んだモンスターのレベルが3になる',lvOf(hm)===3);
ok('ハウリング・ウォリアー negative: 他のモンスターの召喚では誘発しない',
   eHo.condition(ctxAt(howl,'mz','onNormalSummon',{event:{card:hm}}))===false);

reset0();
let wave=mk('波動共鳴'),wm=mk(MON);
gameState.players[0].sz=[wave];gameState.players[0].mz=[wm];sync();
let eWa=eff('波動共鳴'),cWa=ctxAt(wave,'sz');
ok('波動共鳴 positive: 表側モンスターがいれば発動できる',eWa.condition(cWa)===true);
eWa.operation(cWa);pickUid(wm.uid);
ok('波動共鳴 positive: レベルが4になる',lvOf(wm)===4);
act({type:'PASS_TURN'});
ok('波動共鳴 ruling: エンドフェイズを過ぎれば元に戻る',lvOf(wm)===dbOf(wm).lv,'lv='+lvOf(wm));

reset0();
let key=mk('鍵戦士キーマン');gameState.players[0].mz=[key];sync();
let eKe=eff('鍵戦士キーマン');
ok('鍵戦士キーマン positive: メインフェイズなら発動できる',eKe.condition(ctxAt(key,'mz'))===true);
eKe.operation(ctxAt(key,'mz'));
ok('鍵戦士キーマン positive: 自分のレベルが3になる',lvOf(key)===3,'lv='+lvOf(key));
act({type:'PASS_TURN'});
ok('鍵戦士キーマン ruling: ターンを跨げば元に戻る',lvOf(key)===dbOf(key).lv);
gameState.phase='battle';
ok('鍵戦士キーマン negative: バトルフェイズでは発動できない',
   eKe.condition(ctxAt(findCardByUid(key.uid).card,'mz'))===false);

reset0();
let mini=mk('ミニチュアライズ',0,'down'),big=mk(MON),small=SMALL?mk(SMALL):null;
gameState.players[0].sz=[mini];gameState.players[1].mz=[big];
if(small) gameState.players[1].mz.push(small);
sync();
let eMi=eff('ミニチュアライズ'),cMi=ctxAt(mini,'sz');
ok('ミニチュアライズ positive: 元々の攻撃力1000超がいれば発動できる',eMi.condition(cMi)===true);
let bigAtk=dbOf(big).atk,bigLv=dbOf(big).lv;
eMi.operation(cMi);
let pcMi=pendingChoiceV49(gameState);
if(small) ok('ミニチュアライズ ruling: 攻撃力1000以下は候補に入らない',
   pcMi.candidates.every(x=>x.uid!==small.uid),SMALL);
else ok('ミニチュアライズ ruling: 攻撃力1000以下は候補に入らない',true,'該当カード無し');
pickUid(big.uid);
ok('ミニチュアライズ positive: レベルが1つ下がる',lvOf(big)===bigLv-1);
ok('ミニチュアライズ positive: 攻撃力が1000下がる',
   curATK(findCardByUid(big.uid).card)===bigAtk-1000);
sync();
act({type:'FX_TO_GRAVE',player:1,zone:'mz',index:0,reason:'破壊',byDestroy:true});
if(typeof enforceLinkedLeaveV9==='function') enforceLinkedLeaveV9(gameState);
ok('ミニチュアライズ ruling: 対象が場を離れるとこのカードも破壊される',
   gameState.players[0].sz.length===0,'sz='+gameState.players[0].sz.length);

reset0();
if(PSYCHIC){
  let brk=mk('サイキックブレイク'),psy=mk(PSYCHIC);
  gameState.players[0].sz=[brk];gameState.players[0].mz=[psy];sync();
  let eBr=eff('サイキックブレイク');
  let cBr=ctxAt(brk,'sz','onNormalSummon',{event:{card:psy}});cBr.event={card:psy};
  ok('サイキックブレイク positive: サイキック族の召喚で誘発する',eBr.condition(cBr)===true,PSYCHIC);
  const lp=gameState.players[0].lp,pl=dbOf(psy).lv,pa=dbOf(psy).atk;
  run(eBr,cBr);
  ok('サイキックブレイク positive: 500払ってレベル+1・攻撃力+300',
     gameState.players[0].lp===lp-500&&lvOf(psy)===pl+1
     &&curATK(findCardByUid(psy.uid).card)===pa+300);
  ok('サイキックブレイク negative: サイキック族以外では誘発しない',
     eBr.condition(ctxAt(brk,'sz','onNormalSummon',{event:{card:mk(MON)}}))===false);
}else{
  ok('サイキックブレイク positive: サイキック族の召喚で誘発する',true,'サイキック族がDBに無い');
  ok('サイキックブレイク positive: 500払ってレベル+1・攻撃力+300',true,'スキップ');
  ok('サイキックブレイク negative: サイキック族以外では誘発しない',true,'スキップ');
}

/* =====================================================================
   永続的にレベルを動かすカード
   ===================================================================== */
reset0();
let demote=mk('降格処分'),dm2=mk(MON);
gameState.players[0].sz=[demote];gameState.players[0].mz=[dm2];sync();
API.equipSpell({p:0,zone:'sz',index:0,card:demote},{p:0,zone:'mz',index:0,card:dm2},'テスト');
ok('降格処分 positive: 装備モンスターのレベルが2つ下がる',
   lvOf(dm2)===dbOf(dm2).lv-2,'lv='+lvOf(dm2));
API.detachEquip(locateCardAnyV4(findCardByUid(demote.uid).card),'テスト');
ok('降格処分 ruling: 装備が外れれば元に戻る',lvOf(dm2)===dbOf(dm2).lv);

reset0();
let shero=mk('シンクロ・ヒーロー'),sh=mk(MON);
gameState.players[0].sz=[shero];gameState.players[0].mz=[sh];sync();
API.equipSpell({p:0,zone:'sz',index:0,card:shero},{p:0,zone:'mz',index:0,card:sh},'テスト');
ok('シンクロ・ヒーロー positive: レベル+1・攻撃力+500',
   lvOf(sh)===dbOf(sh).lv+1&&curATK(findCardByUid(sh.uid).card)===dbOf(sh).atk+500,
   'lv='+lvOf(sh)+' atk='+curATK(findCardByUid(sh.uid).card));

reset0();
let song=mk('デビリアン・ソング'),own=mk(MON),foe=mk(MON,1);
gameState.players[0].sz=[song];gameState.players[0].mz=[own];gameState.players[1].mz=[foe];sync();
ok('デビリアン・ソング positive: 相手モンスターのレベルが1つ下がる',
   lvOf(foe)===dbOf(foe).lv-1,'lv='+lvOf(foe));
ok('デビリアン・ソング negative: 自分のモンスターは下がらない',lvOf(own)===dbOf(own).lv);
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
ok('デビリアン・ソング ruling: 場を離れれば元に戻る',lvOf(foe)===dbOf(foe).lv);

reset0();
let knight=mk('シャインナイト',0,'up','def');gameState.players[0].mz=[knight];sync();
ok('シャインナイト positive: 表側守備表示ならレベルは4',lvOf(knight)===4,'lv='+lvOf(knight));
act({type:'TOGGLE_POS',player:0,zone:'mz',index:0});
ok('シャインナイト negative: 攻撃表示なら元のレベル',
   lvOf(knight)===dbOf(knight).lv,'lv='+lvOf(knight));

/* =====================================================================
   Replay / SaveLoad / 直列化
   ===================================================================== */
reset0();
let rWave=mk('波動共鳴'),rMon=mk(MON);
gameState.players[0].sz=[rWave];gameState.players[0].mz=[rMon];sync();
v41ResetActionJournal(gameState);
eWa.operation(ctxAt(rWave,'sz'));pickUid(rMon.uid);
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: レベル修整を含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('直列化: レベル修整に関数が混入していない',
   assertLevelModStateSerializableV16(gameState)===null);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
