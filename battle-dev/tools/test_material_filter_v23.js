/* System v23 — Advance Summon materialFilter の基盤テスト。
   カード個別の TESTED 判定の証拠にはしない。 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
openPick=()=>{};
const R=[];globalThis.__R=R;const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
const SAVED={};
function withScript(name, patch){
  if(!(name in SAVED)) SAVED[name]=CARD_SCRIPTS[name];
  CARD_SCRIPTS[name]=Object.assign({}, CARD_SCRIPTS[name]||{}, patch);
}
function reset0(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
  Object.keys(SAVED).forEach(k=>{ if(SAVED[k]===undefined) delete CARD_SCRIPTS[k]; else CARD_SCRIPTS[k]=SAVED[k]; });
}
function db(n){ return CARD_DB[findCardIndex(n)]; }
function methodIds(name,p,mode){ return normalSummonMethodsFor(db(name),p,mode||'summon').map(m=>m.id); }
/* 小道具は既に TESTED / GENERIC_OK のカードだけを使う。 */
const LV7='青眼の白龍';           /* lv8・アドバンス2体 */
const WARRIOR='D.D.アサイラント';  /* 戦士・地・lv4（TESTED） */
const BEAST='おジャマ・イエロー';   /* 獣・光・lv2（GENERIC_OK） */
const DRAGON='サファイアドラゴン';  /* ドラゴン・風・lv4（GENERIC_OK） */
const WORM='ワーム・オペラ';        /* 爬虫類・WORM 群（TESTED） */
function inMz(p,c){ return (gameState.players[p].mz||[]).some(x=>x&&x.uid===c.uid); }

/* ================= 0. 前提 ================= */
reset0();
ok('前提: 小道具が DB にある',!!db(LV7)&&!!db(WARRIOR)&&!!db(BEAST)&&!!db(DRAGON),
   [db(LV7).lv,db(WARRIOR).ra,db(BEAST).ra,db(DRAGON).ra].join('/'));
ok('v23: ヘルパが公開されている',
   typeof materialFilterOfV23==='function'&&typeof passesMaterialFilterV23==='function'
   &&typeof tributeCandidatesForV23==='function');

/* ================= 10. filter 未宣言なら挙動不変 ================= */
reset0();
gameState.players[0].mz=[mk(WARRIOR,0),mk(BEAST,0)];
gameState.players[0].hand=[mk(LV7,0)];
ok('v23 非回帰: 宣言が無ければ標準の召喚方法が出る',
   methodIds(LV7,0).indexOf('standard')>=0,methodIds(LV7,0).join(','));
ok('v23 非回帰: 宣言が無ければ候補は絞られない',
   tributeCandidatesForV23(0,db(LV7),null,'summon').length===2);
ok('v23 非回帰: maxTributeCapacity は従来通り数える',
   maxTributeCapacity(0,db(LV7))===2,String(maxTributeCapacity(0,db(LV7))));
ok('v23 非回帰: method を渡さなくても同じ値',
   maxTributeCapacity(0,db(LV7),null,'summon')===2);

/* ================= 1. 種族限定 ================= */
reset0();
withScript(LV7,{normalSummonProcedure:{methods:[
  {id:'warriorOnly',tributes:2,modes:['summon'],summonLabel:'戦士族2体',
   materialFilter(c){ return c.db.ra==='戦士'; }}]}});
gameState.players[0].mz=[mk(WARRIOR,0),mk(BEAST,0)];
gameState.players[0].hand=[mk(LV7,0)];
ok('v23 種族限定: 条件を満たす候補だけが残る',
   tributeCandidatesForV23(0,db(LV7),
     CARD_SCRIPTS[LV7].normalSummonProcedure.methods[0],'summon').length===1);
ok('v23 種族限定 negative: 足りないので召喚方法が出ない',
   methodIds(LV7,0).length===0,methodIds(LV7,0).join(','));
gameState.players[0].mz.push(mk(WARRIOR,0));
ok('v23 種族限定 positive: 戦士族が2体そろえば出る',
   methodIds(LV7,0).indexOf('warriorOnly')>=0,methodIds(LV7,0).join(','));

/* ================= 2. 属性限定 ================= */
reset0();
withScript(LV7,{normalSummonProcedure:{methods:[
  {id:'lightOnly',tributes:1,modes:['summon'],summonLabel:'光属性1体',
   materialFilter(c){ return c.db.at==='光'; }}]}});
gameState.players[0].mz=[mk(WARRIOR,0)];
gameState.players[0].hand=[mk(LV7,0)];
ok('v23 属性限定 negative: 地属性しかいないので出ない',methodIds(LV7,0).length===0);
gameState.players[0].mz.push(mk(BEAST,0));
ok('v23 属性限定 positive: 光属性がいれば出る',methodIds(LV7,0).indexOf('lightOnly')>=0);
ok('v23 属性限定: 候補は光属性だけ',(()=>{
  const m=CARD_SCRIPTS[LV7].normalSummonProcedure.methods[0];
  const c=tributeCandidatesForV23(0,db(LV7),m,'summon');
  return c.length===1&&c[0].db.at==='光';})());

/* ================= 3. setcode / group 限定 ================= */
reset0();
withScript(LV7,{normalSummonProcedure:{methods:[
  {id:'wormOnly',tributes:1,modes:['summon'],summonLabel:'ワーム1体',
   materialFilter(c){ return isSetCardV4(c.db, SETCODE.WORM); }}]}});
gameState.players[0].mz=[mk(WARRIOR,0)];
gameState.players[0].hand=[mk(LV7,0)];
ok('v23 setcode限定 negative: 非ワームでは出ない',methodIds(LV7,0).length===0);
gameState.players[0].mz.push(mk(WORM,0));
ok('前提: 小道具はワーム',isSetCardV4(db(WORM),SETCODE.WORM));
ok('v23 setcode限定 positive: ワームがいれば出る',methodIds(LV7,0).indexOf('wormOnly')>=0);

/* ================= 4. canonical card 限定 ================= */
reset0();
withScript(LV7,{normalSummonProcedure:{methods:[
  {id:'namedOnly',tributes:1,modes:['summon'],summonLabel:'特定カード1体',
   materialFilter(c){ return sameCanonicalCardV4(c.db, db(DRAGON)); }}]}});
gameState.players[0].mz=[mk(WARRIOR,0)];
gameState.players[0].hand=[mk(LV7,0)];
ok('v23 canonical限定 negative: 別カードでは出ない',methodIds(LV7,0).length===0);
gameState.players[0].mz.push(mk(DRAGON,0));
ok('v23 canonical限定 positive: 同名カードがあれば出る',methodIds(LV7,0).indexOf('namedOnly')>=0);
ok('v23 canonical限定: カード名文字列比較を使わずに判定できる',
   sameCanonicalCardV4(db(DRAGON),db(DRAGON))===true&&sameCanonicalCardV4(db(DRAGON),db(WARRIOR))===false);

/* ================= 5. AND 複合条件 ================= */
reset0();
withScript(LV7,{normalSummonProcedure:{methods:[
  {id:'andCond',tributes:1,modes:['summon'],summonLabel:'風属性のドラゴン族1体',
   materialFilter(c){ return c.db.at==='風' && c.db.ra==='ドラゴン'; }}]}});
gameState.players[0].mz=[mk(BEAST,0)];   /* ドラゴンでも風でもない */
gameState.players[0].hand=[mk(LV7,0)];
ok('v23 AND複合 negative: 片方だけ満たしても出ない',methodIds(LV7,0).length===0,'beast at='+db(BEAST).at+' ra='+db(BEAST).ra);
gameState.players[0].mz.push(mk(DRAGON,0));
ok('v23 AND複合 positive: 両方満たす素材があれば出る',methodIds(LV7,0).indexOf('andCond')>=0,'dragon at='+db(DRAGON).at+' ra='+db(DRAGON).ra);
ok('v23 AND複合: 候補は両方満たすものだけ',(()=>{
  const m=CARD_SCRIPTS[LV7].normalSummonProcedure.methods[0];
  const c=tributeCandidatesForV23(0,db(LV7),m,'summon');
  return c.length===1&&c[0].db.ra==='ドラゴン';})());

/* ================= 6. 条件素材不足なら method 非表示 ================= */
reset0();
withScript(LV7,{normalSummonProcedure:{methods:[
  {id:'needTwoWarriors',tributes:2,modes:['summon'],summonLabel:'戦士族2体',
   materialFilter(c){ return c.db.ra==='戦士'; }}]}});
gameState.players[0].mz=[mk(WARRIOR,0),mk(BEAST,0),mk(DRAGON,0)];
gameState.players[0].hand=[mk(LV7,0)];
ok('v23 容量: 総数3体でも条件を満たすのは1体なので出ない',
   methodIds(LV7,0).length===0,'cap='+maxTributeCapacity(0,db(LV7),
     CARD_SCRIPTS[LV7].normalSummonProcedure.methods[0],'summon'));
ok('v23 容量: 制限つき容量は1',
   maxTributeCapacity(0,db(LV7),CARD_SCRIPTS[LV7].normalSummonProcedure.methods[0],'summon')===1);
ok('v23 容量: 制限なしなら容量3',maxTributeCapacity(0,db(LV7))===3);
ok('v23 非回帰: canPayNormalTribute も同じ判定になる',
   canPayNormalTribute(db(LV7),0)===false);

/* ================= 7. includeStandard との共存 ================= */
reset0();
withScript(LV7,{normalSummonProcedure:{includeStandard:true,methods:[
  {id:'warriorOnly',tributes:1,modes:['summon'],summonLabel:'戦士族1体',
   materialFilter(c){ return c.db.ra==='戦士'; }}]}});
gameState.players[0].mz=[mk(BEAST,0),mk(DRAGON,0)];
gameState.players[0].hand=[mk(LV7,0)];
let ids7=methodIds(LV7,0);
ok('v23 includeStandard: 標準は残る',ids7.indexOf('standard')>=0,ids7.join(','));
ok('v23 includeStandard: 制限つき method は素材不足で出ない',ids7.indexOf('warriorOnly')<0);
gameState.players[0].mz.push(mk(WARRIOR,0));
ids7=methodIds(LV7,0);
ok('v23 includeStandard: 条件が揃えば両方出る',
   ids7.indexOf('standard')>=0&&ids7.indexOf('warriorOnly')>=0,ids7.join(','));

/* ================= 8. tributeValue（2体分）との共存 ================= */
reset0();
withScript(BEAST,{tributeValue:{value:2,target:{ra:'ドラゴン'}}});
withScript(LV7,{normalSummonProcedure:{methods:[
  {id:'beastOnly',tributes:2,modes:['summon'],summonLabel:'獣族で2体分',
   materialFilter(c){ return c.db.ra==='獣'; }}]}});
gameState.players[0].mz=[mk(BEAST,0)];
gameState.players[0].hand=[mk(LV7,0)];
ok('前提: 小道具はドラゴン族向けに2体分になる',
   tributeValueOptionsForDb(db(BEAST),db(LV7),null).indexOf(2)>=0,
   'targetRa='+db(LV7).ra);
ok('v23 tributeValue: 1体でも2体分として容量に数える',
   maxTributeCapacity(0,db(LV7),CARD_SCRIPTS[LV7].normalSummonProcedure.methods[0],'summon')===2);
ok('v23 tributeValue: 制限を満たす1体だけで method が出る',
   methodIds(LV7,0).indexOf('beastOnly')>=0,methodIds(LV7,0).join(','));
reset0();
withScript(BEAST,{tributeValue:{value:2,target:{ra:'ドラゴン'}}});
withScript(LV7,{normalSummonProcedure:{methods:[
  {id:'warriorOnly2',tributes:2,modes:['summon'],summonLabel:'戦士族で2体分',
   materialFilter(c){ return c.db.ra==='戦士'; }}]}});
gameState.players[0].mz=[mk(BEAST,0)];
gameState.players[0].hand=[mk(LV7,0)];
ok('v23 tributeValue negative: 2体分になる素材が条件外なら数えない',
   methodIds(LV7,0).length===0);

/* ================= 9. セット（mode='set'）との共存 ================= */
reset0();
withScript(LV7,{normalSummonProcedure:{methods:[
  {id:'summonOnly',tributes:1,modes:['summon'],summonLabel:'召喚のみ',
   materialFilter(c){ return c.db.ra==='戦士'; }}]}});
gameState.players[0].mz=[mk(WARRIOR,0)];
gameState.players[0].hand=[mk(LV7,0)];
ok('v23 mode: summon では出る',methodIds(LV7,0,'summon').indexOf('summonOnly')>=0);
ok('v23 mode: set では出ない（modes 宣言どおり）',methodIds(LV7,0,'set').length===0);
ok('v23 非回帰: canPaySetTribute も同じ判定',canPaySetTribute(db(LV7),0)===false);

/* ================= 11. 例外安全 ================= */
reset0();
withScript(LV7,{normalSummonProcedure:{includeStandard:true,methods:[
  {id:'boom',tributes:1,modes:['summon'],summonLabel:'例外を投げる',
   materialFilter(){ throw new Error('boom'); }}]}});
gameState.players[0].mz=[mk(WARRIOR,0),mk(BEAST,0)];
gameState.players[0].hand=[mk(LV7,0)];
let ids11=methodIds(LV7,0);
ok('v23 例外安全: filter が投げても召喚自体は壊れない',Array.isArray(ids11));
ok('v23 例外安全: 投げた method は候補にならない',ids11.indexOf('boom')<0,ids11.join(','));
ok('v23 例外安全: 標準の召喚方法は残る',ids11.indexOf('standard')>=0);

/* ================= 12. Replay / 直列化 ================= */
reset0();
withScript(LV7,{normalSummonProcedure:{methods:[
  {id:'warriorOnly',tributes:1,modes:['summon'],summonLabel:'戦士族1体',
   materialFilter(c){ return c.db.ra==='戦士'; }}]}});
let w12=mk(WARRIOR,0),h12=mk(LV7,0);
gameState.players[0].mz=[w12];gameState.players[0].hand=[h12];
v41ResetActionJournal(gameState);
let digBefore=v41StateDigest(gameState);
/* 素材選択→支払い→召喚 を Action 経路で通す */
let paid=null;
pickTributes(0,1,[],pm=>{paid=pm;},db(LV7),
  CARD_SCRIPTS[LV7].normalSummonProcedure.methods[0],'summon');
ok('v23 Replay: 素材が支払われる',!!paid&&paid.bodies===1&&!inMz(0,w12));
ok('v23 Replay: P3 スナップショットが載る',
   Array.isArray(paid.p3Materials)&&paid.p3Materials.length===1
   &&typeof paid.p3Materials[0].atk==='number',JSON.stringify(paid.p3Materials));
act({type:'NORMAL_SUMMON',player:0,handIndex:0,pos:'atk',
     tributes:paid.bodies,tributeValue:paid.value,summonMethod:'warriorOnly',
     p3Materials:paid.p3Materials});
let sum12=gameState.players[0].mz[0];
ok('v23 Replay: summonProvenance が tribute として残る',
   !!sum12.summonProvenance&&sum12.summonProvenance.summonType==='tribute'
   &&sum12.summonProvenance.materialSnapshots.length===1);
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('v23 Replay: 制限つきアドバンス召喚が digest 一致で再生される',
   audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('v23 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('v23 直列化: gameState に materialFilter が漏れていない',
   snap.indexOf('materialFilter')<0);
ok('v23 直列化: Action payload の形は従来通り',(()=>{
  const j=v41ReplayPackage(gameState);
  const ns=(j.actions||j.journal||[]).map(e=>e.action||e).filter(a=>a&&a.type==='NORMAL_SUMMON');
  if(!ns.length) return false;
  const keys=Object.keys(ns[0]).sort().join(',');
  return keys.indexOf('materialFilter')<0&&keys.indexOf('p3Materials')>=0;})());
ok('v23 digest: 新しい gameState キーを増やしていない',
   v41StateDigestText(gameState).indexOf('materialFilter')<0
   &&v41StateDigestText(gameState).indexOf('V23')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
