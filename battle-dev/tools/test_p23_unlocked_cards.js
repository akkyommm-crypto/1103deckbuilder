/* P23 materialFilter 解禁カード — positive / negative / ruling edge。 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[];globalThis.__R=R;const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function reset0(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
}
function db(n){ return CARD_DB[findCardIndex(n)]; }
function h(c){ return locateCardAnyV4(c); }
function eff(n,k){const e=nativeEffectsV4(n).find(x=>!k||x.key===k);if(!e)throw new Error('effect '+n+' '+k);return e;}
function ctxAt(card,zone,ev,extra){const loc=h(card);
  const c=makeContext(0,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,ev||'activate',extra||{});
  if(extra&&extra.event)c.event=extra.event; return c;}
function run(e,c){if(e.cost){let p=false;e.cost(c,v=>{p=v;});} if(e.target)e.target(c,r=>{c.selectedTargets=r;}); e.operation(c);}
function methodIds(name,p,mode){ return normalSummonMethodsFor(db(name),p,mode||'summon').map(m=>m.id); }
function pending(){ return pendingChoiceV49(gameState); }
function answerFirst(n){const pc=pending();if(!pc)throw new Error('no pending choice');
  return answerChoiceV49(pc.candidates.slice(0,n||1).map(x=>x.key));}
function inMz(p,c){ return (gameState.players[p].mz||[]).some(x=>x&&x.uid===c.uid); }
/* 自動選択は先頭を選ぶので、狙ったカードを選ばせるときはこれを使う。 */
function pickByName(n){ API.selectCard=(t,list,cb)=>{ const hit=list.find(x=>x&&x.card&&dbOf(x.card).n===n); cb(hit||list[0]); }; }
function pickFirst(){ API.selectCard=(t,list,cb)=>cb(list[0]); }
function poolNames(list){ return list.map(x=>dbOf(x.card).n).join(','); }
/* 小道具は TESTED / GENERIC_OK のみ */
const GENEX='ジェネクス・コントローラー';   /* GENERIC_OK・機械・GENEX */
const WORM_R='ワーム・オペラ';              /* TESTED・爬虫類・WORM lv2 */
const WORM_R4='ワーム・グルス';             /* TESTED・爬虫類・WORM lv4 */
const WORM_FAKE='ワームドレイク';           /* GENERIC_OK・爬虫類だが WORM 群ではない */
const PLANT='キラー・トマト';               /* TESTED・植物 atk1400 */
const PLAIN='ヂェミナイ・エルフ';            /* GENERIC_OK・魔法使い atk1900 */
const WEAK='おジャマ・イエロー';             /* GENERIC_OK・獣 atk0 */

const NAMES=['ソーラー・ジェネクス','ワーム・キング','ワーム・クィーン','凛天使クイーン・オブ・ローズ'];
NAMES.forEach(n=>ok('P23 registration '+n,!!CARD_SCRIPTS[n]));

/* ================= authority の前提 ================= */
reset0();
ok('前提: ワームドレイクは名前が「ワーム」でも WORM 群ではない',
   isSetCardV4(db(WORM_FAKE),SETCODE.WORM)===false,
   'setcode='+JSON.stringify(db(WORM_FAKE).setcode||null));
ok('前提: ワーム・オペラは WORM 群かつ爬虫類',
   isSetCardV4(db(WORM_R),SETCODE.WORM)===true&&db(WORM_R).ra==='爬虫類');
ok('前提: 小道具はジェネクス',isSetCardV4(db(GENEX),SETCODE.GENEX)===true);
ok('前提: 小道具は植物族',db(PLANT).ra==='植物');

/* =====================================================================
   1. ソーラー・ジェネクス
   ===================================================================== */
reset0();
gameState.players[0].hand=[mk('ソーラー・ジェネクス',0)];
gameState.players[0].mz=[mk(PLAIN,0)];
ok('ソーラー・ジェネクス negative: ジェネクス以外だけでは1体リリース召喚は出ない',
   methodIds('ソーラー・ジェネクス',0).indexOf('genexTribute1')<0,
   methodIds('ソーラー・ジェネクス',0).join(','));
gameState.players[0].mz.push(mk(GENEX,0));
let ids=methodIds('ソーラー・ジェネクス',0);
ok('ソーラー・ジェネクス positive: ジェネクスがいれば1体リリース召喚が出る',
   ids.indexOf('genexTribute1')>=0,ids.join(','));
ok('ソーラー・ジェネクス ruling: 通常のアドバンス召喚も併存する',ids.indexOf('standard')>=0);
ok('ソーラー・ジェネクス: 素材候補はジェネクスだけ',(()=>{
  const m=normalSummonMethodsFor(db('ソーラー・ジェネクス'),0,'summon').find(x=>x.id==='genexTribute1');
  const c=tributeCandidatesForV23(0,db('ソーラー・ジェネクス'),m,'summon');
  return c.length===1&&isSetCardV4(c[0].db,SETCODE.GENEX);})());
ok('ソーラー・ジェネクス ruling: セットでは1体リリースは選べない',
   methodIds('ソーラー・ジェネクス',0,'set').indexOf('genexTribute1')<0);
/* ② ジェネクスが墓地へ送られた時の500ダメージ */
reset0();
let solar=mk('ソーラー・ジェネクス',0),gx=mk(GENEX,0);
gameState.players[0].mz=[solar,gx];
let eSolar=eff('ソーラー・ジェネクス');
let evGx={uid:gx.uid,player:0,fromZone:'mz',fromFace:'up',toZone:'grave',byDestroy:true};
API.sendToGrave(h(gx),'テスト');
let cSolar=ctxAt(solar,'mz','onLeaveField',{event:evGx});
ok('ソーラー・ジェネクス positive: 自分の表側ジェネクスが墓地へ送られたら誘発',
   eSolar.condition(cSolar)===true);
let lp0=gameState.players[1].lp;
eSolar.operation(cSolar);
ok('ソーラー・ジェネクス positive: 相手に500ダメージ',gameState.players[1].lp===lp0-500);
reset0();
let solar2=mk('ソーラー・ジェネクス',0),other=mk(PLAIN,0);
gameState.players[0].mz=[solar2,other];
API.sendToGrave(h(other),'テスト');
ok('ソーラー・ジェネクス negative: ジェネクス以外では誘発しない',
   eSolar.condition(ctxAt(solar2,'mz','onLeaveField',
     {event:{uid:other.uid,player:0,fromZone:'mz',fromFace:'up',toZone:'grave'}}))===false);
reset0();
let solar3=mk('ソーラー・ジェネクス',0),gx3=mk(GENEX,1);
gameState.players[0].mz=[solar3];gameState.players[1].mz=[gx3];
API.sendToGrave(h(gx3),'テスト');
ok('ソーラー・ジェネクス negative: 相手のジェネクスでは誘発しない',
   eSolar.condition(ctxAt(solar3,'mz','onLeaveField',
     {event:{uid:gx3.uid,player:1,fromZone:'mz',fromFace:'up',toZone:'grave'}}))===false);
reset0();
let solar4=mk('ソーラー・ジェネクス',0),gx4=mk(GENEX,0,'down','def');
gameState.players[0].mz=[solar4,gx4];
API.sendToGrave(h(gx4),'テスト');
ok('ソーラー・ジェネクス ruling: 裏側だったジェネクスでは誘発しない',
   eSolar.condition(ctxAt(solar4,'mz','onLeaveField',
     {event:{uid:gx4.uid,player:0,fromZone:'mz',fromFace:'down',toZone:'grave'}}))===false);

/* =====================================================================
   2. ワーム・キング
   ===================================================================== */
reset0();
gameState.players[0].hand=[mk('ワーム・キング',0)];
gameState.players[0].mz=[mk(WORM_FAKE,0)];
ok('ワーム・キング negative: 名前が似ているだけの爬虫類では出ない',
   methodIds('ワーム・キング',0).indexOf('wormTribute1')<0,
   methodIds('ワーム・キング',0).join(','));
gameState.players[0].mz.push(mk(WORM_R,0));
ok('ワーム・キング positive: 「ワーム」爬虫類族がいれば1体リリース召喚が出る',
   methodIds('ワーム・キング',0).indexOf('wormTribute1')>=0);
ok('ワーム・キング: 候補はWORM群かつ爬虫類だけ',(()=>{
  const m=normalSummonMethodsFor(db('ワーム・キング'),0,'summon').find(x=>x.id==='wormTribute1');
  const c=tributeCandidatesForV23(0,db('ワーム・キング'),m,'summon');
  return c.length===1&&isSetCardV4(c[0].db,SETCODE.WORM);})());
/* ② リリースして相手のカードを破壊 */
reset0();
let wk=mk('ワーム・キング',0),fodder=mk(WORM_R,0),foe=mk(PLAIN,1);
gameState.players[0].mz=[wk,fodder];gameState.players[1].mz=[foe];
let eWk=eff('ワーム・キング');
ok('ワーム・キング positive: 素材と対象があれば発動できる',eWk.condition(ctxAt(wk,'mz'))===true);
pickByName(WORM_R);
run(eWk,ctxAt(wk,'mz'));
pickFirst();
ok('ワーム・キング positive: コストのワームが墓地へ行く',!inMz(0,fodder));
ok('ワーム・キング positive: 相手のカードを破壊する',!inMz(1,foe));
reset0();
let wk2=mk('ワーム・キング',0),fake=mk(WORM_FAKE,0),foe2=mk(PLAIN,1);
gameState.players[0].mz=[wk2,fake];gameState.players[1].mz=[foe2];
ok('ワーム・キング negative: 名前だけワームのモンスターはコスト候補に入らない',
   v23OwnWormReptiles(0).every(x=>dbOf(x.card).n!==WORM_FAKE),poolNames(v23OwnWormReptiles(0)));
ok('ワーム・キング ruling: 候補に残るのは自身だけ',v23OwnWormReptiles(0).length===1&&v23OwnWormReptiles(0)[0].card===wk2);
reset0();
let wk3=mk('ワーム・キング',0),f3=mk(WORM_R,0);
gameState.players[0].mz=[wk3,f3];
ok('ワーム・キング negative: 相手の場が空なら発動できない',
   eWk.condition(ctxAt(wk3,'mz'))===false);
reset0();
let wk4=mk('ワーム・キング',0),foe4=mk(PLAIN,1);
gameState.players[0].mz=[wk4];gameState.players[1].mz=[foe4];
ok('ワーム・キング ruling: 自身も「ワーム」爬虫類族なので自身をリリースできる',
   eWk.condition(ctxAt(wk4,'mz'))===true);

/* =====================================================================
   3. ワーム・クィーン
   ===================================================================== */
reset0();
gameState.players[0].hand=[mk('ワーム・クィーン',0)];
gameState.players[0].mz=[mk(WORM_FAKE,0)];
ok('ワーム・クィーン negative: 名前が似ているだけでは1体リリース召喚は出ない',
   methodIds('ワーム・クィーン',0).indexOf('wormTribute1')<0);
gameState.players[0].mz.push(mk(WORM_R4,0));
ok('ワーム・クィーン positive: 「ワーム」爬虫類族がいれば出る',
   methodIds('ワーム・クィーン',0).indexOf('wormTribute1')>=0);
reset0();
let wq=mk('ワーム・クィーン',0),cost4=mk(WORM_R4,0);
gameState.players[0].mz=[wq,cost4];
gameState.players[0].deck=[mk(WORM_R,0),mk(WORM_R4,0),mk(PLAIN,0)];
let eWq=eff('ワーム・クィーン');
ok('ワーム・クィーン positive: デッキに候補があれば発動できる',eWq.condition(ctxAt(wq,'mz'))===true);
let cWq=ctxAt(wq,'mz');
pickByName(WORM_R4);
run(eWq,cWq);
pickFirst();
ok('ワーム・クィーン positive: コストのレベルが控えられる',(()=>{
  const s=(API.costSnapshots(cWq)||[])[0];
  return !!s&&s.level===db(WORM_R4).lv;})(),JSON.stringify(API.costSnapshots(cWq)));
ok('ワーム・クィーン positive: レベル以下の候補だけが提示される',
   !!pending()&&pending().candidates.length===2,
   pending()?String(pending().candidates.length):'none');
answerFirst(1);
ok('ワーム・クィーン positive: デッキから特殊召喚される',
   (gameState.players[0].mz||[]).some(c=>c&&isSetCardV4(dbOf(c),SETCODE.WORM)&&dbOf(c).n!=='ワーム・クィーン'));
ok('ワーム・クィーン negative: 同じターンに2度は使えない',eWq.condition(ctxAt(wq,'mz'))===false);
reset0();
let wq2=mk('ワーム・クィーン',0),cost1=mk(WORM_R,0);
gameState.players[0].mz=[wq2,cost1];
gameState.players[0].deck=[mk(WORM_R4,0)];
ok('ワーム・クィーン negative: レベルが上のワームしか無ければ発動できない…条件は満たす',
   eWq.condition(ctxAt(wq2,'mz'))===true);
let cWq2=ctxAt(wq2,'mz');
pickByName(WORM_R);
run(eWq,cWq2);
pickFirst();
ok('ワーム・クィーン ruling: レベル超過の候補は提示されない',!pending(),
   pending()?String(pending().candidates.length):'no choice');
reset0();
let wq3=mk('ワーム・クィーン',0);
gameState.players[0].mz=[wq3];gameState.players[0].deck=[mk(WORM_R,0)];
ok('ワーム・クィーン ruling: 自身をリリースできる（自身もワーム爬虫類族）',
   eWq.condition(ctxAt(wq3,'mz'))===true);

/* =====================================================================
   4. 凛天使クイーン・オブ・ローズ
   ===================================================================== */
reset0();
gameState.players[0].hand=[mk('凛天使クイーン・オブ・ローズ',0)];
gameState.players[0].mz=[mk(PLAIN,0)];
ok('凛天使 negative: 植物族がいなければ1体リリース召喚は出ない',
   methodIds('凛天使クイーン・オブ・ローズ',0).indexOf('plantTribute1')<0);
gameState.players[0].mz.push(mk(PLANT,0));
let ids4=methodIds('凛天使クイーン・オブ・ローズ',0);
ok('凛天使 positive: 植物族がいれば1体リリース召喚が出る',ids4.indexOf('plantTribute1')>=0);
ok('凛天使 ruling: 通常のアドバンス召喚も併存する',ids4.indexOf('standard')>=0);
/* ② スタンバイに最低攻撃力を破壊 */
reset0();
let rose=mk('凛天使クイーン・オブ・ローズ',0),weak=mk(WEAK,1),strong=mk(PLAIN,1);
gameState.players[0].mz=[rose];gameState.players[1].mz=[weak,strong];
gameState.phase='standby';gameState.activePlayer=0;
let eRose=eff('凛天使クイーン・オブ・ローズ');
ok('凛天使 positive: 自分のスタンバイで誘発する',
   eRose.condition(ctxAt(rose,'mz','onStandbyPhase'))===true);
eRose.operation(ctxAt(rose,'mz','onStandbyPhase'));
ok('凛天使 positive: 攻撃力が一番低いモンスターを破壊する',
   !inMz(1,weak)&&inMz(1,strong),'weak atk='+db(WEAK).atk);
ok('凛天使 negative: 同じターンに2度は誘発しない',
   eRose.condition(ctxAt(rose,'mz','onStandbyPhase'))===false);
reset0();
let rose2=mk('凛天使クイーン・オブ・ローズ',0),w1=mk(WEAK,1),w2=mk(WEAK,0);
gameState.players[0].mz=[rose2,w2];gameState.players[1].mz=[w1];
gameState.phase='standby';gameState.activePlayer=0;
eRose.operation(ctxAt(rose2,'mz','onStandbyPhase'));
ok('凛天使 ruling: 同値で並んだ場合は選択になる',!!pending()&&pending().candidates.length===2,
   pending()?String(pending().candidates.length):'none');
answerFirst(1);
ok('凛天使 ruling: 選んだ1体だけが破壊される',
   (gameState.players[0].mz.length+gameState.players[1].mz.length)===2);
reset0();
let rose3=mk('凛天使クイーン・オブ・ローズ',0);
gameState.players[0].mz=[rose3];
gameState.phase='standby';gameState.activePlayer=1;
ok('凛天使 negative: 相手のスタンバイでは誘発しない',
   eRose.condition(ctxAt(rose3,'mz','onStandbyPhase'))===false);

/* =====================================================================
   5. P23 全体の共通確認
   ===================================================================== */
reset0();
gameState.players[0].hand=[mk('ワーム・キング',0)];
gameState.players[0].mz=[mk(WORM_FAKE,0),mk(PLAIN,0)];
ok('P23 共通: 適格素材ゼロなら特殊 method 自体が出ない',
   methodIds('ワーム・キング',0).indexOf('wormTribute1')<0);
ok('P23 共通: 標準の召喚方法は容量があるので残る',
   methodIds('ワーム・キング',0).indexOf('standard')>=0,methodIds('ワーム・キング',0).join(','));
reset0();
gameState.players[0].hand=[mk('ワーム・キング',0)];
gameState.players[0].mz=[mk(WORM_R,0)];
ok('P23 共通: 制限つき1体は出るが標準2体は容量不足で出ない',(()=>{
  const m=methodIds('ワーム・キング',0);
  return m.indexOf('wormTribute1')>=0&&m.indexOf('standard')<0;})(),
  methodIds('ワーム・キング',0).join(','));
/* filter 未宣言カードへの影響0 */
reset0();
gameState.players[0].hand=[mk('青眼の白龍',0)];
gameState.players[0].mz=[mk(PLAIN,0),mk(WEAK,0)];
ok('P23 共通: filter 未宣言カードは従来通り',
   methodIds('青眼の白龍',0).join(',')==='standard',methodIds('青眼の白龍',0).join(','));

/* =====================================================================
   6. 実際の召喚 → P3 / provenance / Replay
   ===================================================================== */
reset0();
let king=mk('ワーム・キング',0),mat=mk(WORM_R,0);
gameState.players[0].hand=[king];gameState.players[0].mz=[mat];
v41ResetActionJournal(gameState);
let method=normalSummonMethodsFor(db('ワーム・キング'),0,'summon').find(m=>m.id==='wormTribute1');
ok('P23 実召喚: 制限つき method が引ける',!!method);
let payment=null;
pickTributes(0,method.tributes,[],pm=>{payment=pm;},db('ワーム・キング'),method,'summon');
ok('P23 実召喚: 素材が支払われる',!!payment&&payment.bodies===1&&!inMz(0,mat));
ok('P23 実召喚: P3 materialSnapshots が従来通り残る',
   Array.isArray(payment.p3Materials)&&payment.p3Materials.length===1
   &&typeof payment.p3Materials[0].level==='number',JSON.stringify(payment.p3Materials));
act({type:'NORMAL_SUMMON',player:0,handIndex:0,pos:'atk',
     tributes:payment.bodies,tributeValue:payment.value,summonMethod:method.id,
     p3Materials:payment.p3Materials});
let summoned=gameState.players[0].mz[0];
ok('P23 実召喚: 表側攻撃表示で出る',
   !!summoned&&summoned.face==='up'&&summoned.pos==='atk'&&dbOf(summoned).n==='ワーム・キング');
ok('P23 実召喚: summonProvenance が tribute として残る',(()=>{
  const pv=API.summonProvenance(summoned);
  return !!pv&&pv.summonType==='tribute'&&pv.materialSnapshots.length===1;})());
ok('P23 実召喚: 素材側にも usedAsMaterial が残る',(()=>{
  const g=(gameState.players[0].grave||[]).find(c=>c&&c.uid===mat.uid);
  return !!g&&!!g.usedAsMaterial&&g.usedAsMaterial.summonType==='tribute';})());
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('P23 Replay: 制限つきアドバンス召喚が digest 一致で再生される',
   audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('P23 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('P23 直列化: materialFilter は gameState に漏れていない',snap.indexOf('materialFilter')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
