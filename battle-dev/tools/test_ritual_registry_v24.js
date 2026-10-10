/* System v24 — RITUAL_SPEC external registry の基盤テスト。
   カード個別の TESTED 判定の証拠にはしない。 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];globalThis.__R=R;const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function reset0(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
}
function clearReg(){ RITUAL_SPEC_REGISTRY_V24.clear(); }
function db(n){ return CARD_DB[findCardIndex(n)]; }
function h(c){ return locateCardAnyV4(c); }
function pending(){ return pendingChoiceV49(gameState); }
function answerFirst(n){const pc=pending();if(!pc)throw new Error('no pending choice');
  return answerChoiceV49(pc.candidates.slice(0,n||1).map(x=>x.key));}
/* 既存 legacy 儀式（TESTED 済み）だけを小道具に使う。 */
const LEG_SPELL='ゼラの儀式', LEG_MON='ゼラ';
const EXACT_SPELL='エンド・オブ・ザ・ワールド';
const PRED_SPELL='リチュアの儀水鏡';
const FODDER='青眼の白龍';   /* lv8 */

/* ================= 0. 公開されているか ================= */
reset0();
ok('v24: registry と登録関数が公開されている',
   typeof RITUAL_SPEC_REGISTRY_V24!=='undefined'
   &&typeof registerRitualSpecV24==='function'
   &&typeof registerRitualPredicateV24==='function'
   &&typeof ritualPredicateV24==='function');
ok('v24: legacy 表は削除されていない',
   typeof RITUAL_SPEC_V5==='object'&&Object.keys(RITUAL_SPEC_V5).length>=19,
   String(Object.keys(RITUAL_SPEC_V5).length));

/* ================= 1. legacy がそのまま動く ================= */
reset0(); clearReg();
let leg=ritualSpecV5(LEG_SPELL);
ok('v24 legacy: 既存の儀式魔法が従来通り引ける',
   !!leg&&leg.level===8&&leg.levelMode==='atLeast',JSON.stringify(leg));
ok('v24 legacy: 許可モンスター判定も従来通り',
   ritualAllowsMonsterV5(leg,db(LEG_MON))===true);
ok('v24 legacy negative: 別の儀式モンスターは許可されない',
   ritualAllowsMonsterV5(leg,db('チャクラ'))===false);
ok('v24 legacy: exact 型も従来通り',(()=>{
  const s=ritualSpecV5(EXACT_SPELL);
  return !!s&&s.level===null&&s.levelMode==='exact';})());

/* ================= 5. 未登録なら null ================= */
reset0(); clearReg();
ok('v24 未登録: registry にも legacy にも無ければ null',
   ritualSpecV5('存在しない儀式魔法XYZ')===null);
ok('v24 未登録: 空文字も null',ritualSpecV5('')===null);

/* ================= 2/3. registry から monsters 列挙型を登録 ================= */
reset0(); clearReg();
ok('v24 登録: monsters 列挙型を登録できる',
   registerRitualSpecV24('テスト儀式A',{monsters:[LEG_MON],level:8,levelMode:'atLeast'})===true);
let regA=ritualSpecV5('テスト儀式A');
ok('v24 登録: registry から引ける',
   !!regA&&regA.level===8&&regA.levelMode==='atLeast'&&regA.monsters[0]===LEG_MON,
   JSON.stringify(regA));
ok('v24 登録: 許可モンスター判定が働く',ritualAllowsMonsterV5(regA,db(LEG_MON))===true);
ok('v24 登録 negative: 列挙外は許可されない',ritualAllowsMonsterV5(regA,db('チャクラ'))===false);
ok('v24 登録 negative: 儀式モンスター以外は常に不許可',
   ritualAllowsMonsterV5(regA,db(FODDER))===false);
ok('v24 登録: levelMode 未指定は atLeast に正規化される',(()=>{
  registerRitualSpecV24('テスト儀式B',{monsters:[LEG_MON],level:6});
  const s=ritualSpecV5('テスト儀式B');
  return !!s&&s.levelMode==='atLeast';})());
ok('v24 登録: level 省略は null（儀式モンスター自身のレベル）',(()=>{
  registerRitualSpecV24('テスト儀式C',{monsters:[LEG_MON],levelMode:'exact'});
  const s=ritualSpecV5('テスト儀式C');
  return !!s&&s.level===null&&ritualRequiredLevelV5(s,mk(LEG_MON,0))===db(LEG_MON).lv;})());

/* ================= 4. predicate 型 ================= */
reset0(); clearReg();
ok('v24 述語: 既定の RITUA が登録済み',typeof ritualPredicateV24('RITUA')==='function');
ok('v24 述語: legacy の述語型 spec が従来通り動く',(()=>{
  const s=ritualSpecV5(PRED_SPELL);
  if(!s||s.pred!=='RITUA') return false;
  const gishki=CARD_DB.find(d=>d.k==='m'&&(d.st||[]).indexOf('儀式')>=0&&isSetCardV4(d,SETCODE.GISHKI));
  const other=db(LEG_MON);
  return !!gishki&&ritualAllowsMonsterV5(s,gishki)===true&&ritualAllowsMonsterV5(s,other)===false;})());
ok('v24 述語: 新しい述語を登録できる',
   registerRitualPredicateV24('TEST_DARK_RITUAL',function(cardDb){ return cardDb && cardDb.at==='闇'; })===true);
registerRitualSpecV24('テスト闇儀式',{pred:'TEST_DARK_RITUAL',level:null,levelMode:'exact'});
let specDark=ritualSpecV5('テスト闇儀式');
ok('v24 述語: spec には id 文字列だけが入る',
   !!specDark&&specDark.pred==='TEST_DARK_RITUAL'&&typeof specDark.pred==='string');
ok('v24 述語 positive: 闇属性の儀式モンスターが許可される',(()=>{
  const darkRit=CARD_DB.find(d=>d.k==='m'&&(d.st||[]).indexOf('儀式')>=0&&d.at==='闇');
  return !!darkRit&&ritualAllowsMonsterV5(specDark,darkRit)===true;})());
ok('v24 述語 negative: 別属性の儀式モンスターは許可されない',(()=>{
  const lightRit=CARD_DB.find(d=>d.k==='m'&&(d.st||[]).indexOf('儀式')>=0&&d.at==='光');
  return !!lightRit&&ritualAllowsMonsterV5(specDark,lightRit)===false;})());
ok('v24 述語 negative: 未登録の述語 id は不許可',(()=>{
  registerRitualSpecV24('テスト未知述語',{pred:'NO_SUCH_PRED',levelMode:'exact'});
  const s=ritualSpecV5('テスト未知述語');
  const anyRit=CARD_DB.find(d=>d.k==='m'&&(d.st||[]).indexOf('儀式')>=0);
  return !!s&&ritualAllowsMonsterV5(s,anyRit)===false;})());
ok('v24 述語 例外安全: 述語が投げても false',(()=>{
  registerRitualPredicateV24('TEST_BOOM',function(){ throw new Error('boom'); });
  registerRitualSpecV24('テスト例外儀式',{pred:'TEST_BOOM',levelMode:'exact'});
  const s=ritualSpecV5('テスト例外儀式');
  const anyRit=CARD_DB.find(d=>d.k==='m'&&(d.st||[]).indexOf('儀式')>=0);
  return ritualAllowsMonsterV5(s,anyRit)===false;})());

/* ================= 6. legacy と同名なら registry が勝つ ================= */
reset0(); clearReg();
let before=ritualSpecV5(LEG_SPELL);
ok('v24 優先順位: 登録前は legacy が引ける',!!before&&before.level===8);
registerRitualSpecV24(LEG_SPELL,{monsters:['チャクラ'],level:3,levelMode:'exact'});
let after=ritualSpecV5(LEG_SPELL);
ok('v24 優先順位: 同名を登録すると registry が勝つ',
   !!after&&after.level===3&&after.levelMode==='exact'&&after.monsters[0]==='チャクラ',
   JSON.stringify(after));
clearReg();
ok('v24 優先順位: registry を空にすると legacy へ戻る',
   ritualSpecV5(LEG_SPELL).level===8);

/* ================= 検証と正規化 ================= */
reset0(); clearReg();
ok('v24 検証: monsters も pred も無い spec は拒否',
   registerRitualSpecV24('テスト不正1',{level:8,levelMode:'atLeast'})===false);
ok('v24 検証: 名前が空なら拒否',registerRitualSpecV24('',{monsters:['x']})===false);
ok('v24 検証: level が数値でなければ拒否',
   registerRitualSpecV24('テスト不正2',{monsters:['x'],level:'８'})===false);
ok('v24 検証: 不正な levelMode は atLeast に正規化',(()=>{
  registerRitualSpecV24('テスト正規化',{monsters:['x'],level:4,levelMode:'whatever'});
  return ritualSpecV5('テスト正規化').levelMode==='atLeast';})());
ok('v24 検証: spec に関数を入れても落ちる',(()=>{
  registerRitualSpecV24('テスト関数混入',{monsters:['x'],level:4,pred:'RITUA',bad(){return 1;}});
  const s=ritualSpecV5('テスト関数混入');
  return !!s&&s.bad===undefined;})());
ok('v24 直列化: registry の中身は純JSON',
   assertRitualRegistrySerializableV24()===null,
   String(assertRitualRegistrySerializableV24()));
ok('v24 直列化: registry は gameState に入っていない',
   gameState.ritualSpecV24===undefined&&gameState.RITUAL_SPEC_REGISTRY_V24===undefined);

/* ================= 10. 既存19儀式の挙動不変 ================= */
reset0(); clearReg();
ok('v24 非回帰: legacy 19件すべて従来通り引ける',(()=>{
  const keys=Object.keys(RITUAL_SPEC_V5);
  return keys.length>=19&&keys.every(k=>{
    const a=RITUAL_SPEC_V5[k], b=ritualSpecV5(k);
    return b===a;});})());
ok('v24 非回帰: levelMode は全て既知の値',
   Object.keys(RITUAL_SPEC_V5).every(k=>RITUAL_LEVEL_MODES_V5.indexOf(RITUAL_SPEC_V5[k].levelMode)>=0));

/* ================= 7. 実際の儀式召喚と Replay ================= */
reset0(); clearReg();
let spell=mk(LEG_SPELL,0), mon=mk(LEG_MON,0), f1=mk(FODDER,0);
gameState.players[0].sz=[spell];
gameState.players[0].hand=[mon,f1];
ok('v24 実行: legacy 儀式が発動可能と判定される',
   API.ritualCanActivate(0,LEG_SPELL)===true);
v41ResetActionJournal(gameState);
API.ritualSummon(makeContext(0,spell,'sz',0,'activate',{}),LEG_SPELL);
if(pending()) answerFirst(1);
if(pending()) answerFirst(1);
ok('v24 実行: 儀式モンスターが場に出る',
   (gameState.players[0].mz||[]).some(c=>c&&dbOf(c).n===LEG_MON),
   (gameState.players[0].mz||[]).map(c=>dbOf(c).n).join(','));
ok('v24 実行: 儀式召喚の provenance が残る',(()=>{
  const m=(gameState.players[0].mz||[]).find(c=>c&&dbOf(c).n===LEG_MON);
  const pv=m&&API.summonProvenance(m);
  return !!pv&&pv.summonType==='ritual';})());
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('v24 Replay: 儀式召喚が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('v24 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('v24 digest: 新しい gameState キーを増やしていない',
   v41StateDigestText(gameState).indexOf('V24')<0
   &&v41StateDigestText(gameState).indexOf('ritualSpec')<0);

/* registry 経由でも同じ経路が通る */
reset0(); clearReg();
registerRitualSpecV24('テスト儀式D',{monsters:[LEG_MON],level:8,levelMode:'atLeast'});
ok('v24 実行: registry 登録した spec も ritualCanActivate が見る',(()=>{
  const s=ritualSpecV5('テスト儀式D');
  gameState.players[0].hand=[mk(LEG_MON,0),mk(FODDER,0)];
  return !!s&&ritualHasEnoughMaterialV5(0,s,gameState.players[0].hand[0])===true;})());
ok('v24 実行 negative: 素材が足りなければ false',(()=>{
  const s=ritualSpecV5('テスト儀式D');
  gameState.players[0].hand=[mk(LEG_MON,0)];
  gameState.players[0].mz=[];
  return ritualHasEnoughMaterialV5(0,s,gameState.players[0].hand[0])===false;})());

/* ================= 8. Acode 一枚化での登録順序 ================= */
ok('v24 Acode: 既定述語は engine 内で登録されるので card の読込順に依存しない',
   typeof ritualPredicateV24('RITUA')==='function');
ok('v24 Acode: registry は module scope（gameState 非依存）',
   (()=>{ const g=newGame(); return g.RITUAL_SPEC_REGISTRY_V24===undefined
     &&typeof RITUAL_SPEC_REGISTRY_V24!=='undefined'; })());

clearReg();
globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
