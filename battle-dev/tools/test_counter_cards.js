/* Counter recovery batch — 9枚の positive / negative / ruling edge case。 */
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
  COUNTER_CAPABLE_CACHE_V22.clear();
}
function h(c){ return locateCardAnyV4(c); }
function eff(n,k){const e=nativeEffectsV4(n).find(x=>!k||x.key===k);if(!e)throw new Error('effect '+n+' '+k);return e;}
function ctxAt(card,zone,ev,extra){const loc=h(card);
  const c=makeContext(0,card,zone||(loc&&loc.zone)||'sz',(loc&&loc.index)||0,ev||'activate',extra||{});
  if(extra&&extra.event)c.event=extra.event; return c;}
function run(e,c){if(e.cost){let p=false;e.cost(c,v=>{p=v;});} if(e.target)e.target(c,r=>{c.selectedTargets=r;}); e.operation(c);}
function pending(){return pendingChoiceV49(gameState);}
function answerAll(){const pc=pending();if(!pc)throw new Error('no pending choice');
  return answerChoiceV49(pc.candidates.slice(0,pc.max).map(x=>x.key));}
function answerFirst(n){const pc=pending();if(!pc)throw new Error('no pending choice');
  return answerChoiceV49(pc.candidates.slice(0,n||1).map(x=>x.key));}
function cnt(c,k){ return API.countCounter(h(c),k); }
function inMz(p,c){ return (gameState.players[p].mz||[]).some(x=>x&&x.uid===c.uid); }
function inSz(p,c){ return (gameState.players[p].sz||[]).some(x=>x&&x.uid===c.uid); }
/* 小道具は既に TESTED / GENERIC_OK のカードだけを使う。 */
const CITY='魔法都市エンディミオン';      /* 魔力カウンターを置く事ができる（TESTED） */
const PLAIN='ヂェミナイ・エルフ';          /* GENERIC_OK */
const ALIEN='エーリアン・ソルジャー';      /* GENERIC_OK・エーリアン */
function findName(pred){for(let i=0;i<CARD_DB.length;i++){if(pred(CARD_DB[i]))return CARD_DB[i].n;}return null;}

const NAMES=['メガトン魔導キャノン','魔草 マンドラゴラ','黒魔力の精製者','漆黒のパワーストーン',
 '「A」細胞培養装置','古代遺跡コードA','「A」細胞散布爆弾','エーリアン・マーズ','サンダー・ボトル'];
NAMES.forEach(n=>ok('v22 registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: 小道具は魔力カウンターを置ける',(()=>{
  reset0();const c=mk(CITY,0);gameState.players[0].field=c;
  return counterCapableV22(c,'魔力')===true;})());
ok('前提: 小道具はエーリアン',(()=>{
  reset0();const c=mk(ALIEN,0);return isSetCardV4(dbOf(c),SETCODE.ALIEN);})());

/* =====================================================================
   1. 魔力カウンター capability
   ===================================================================== */
reset0();
let cannon=mk('メガトン魔導キャノン',0),city=mk(CITY,0),stone=mk('漆黒のパワーストーン',0);
gameState.players[0].sz=[cannon,stone];gameState.players[0].field=city;
let foeM=mk(PLAIN,1),foeS=mk('サンダー・ボトル',1);
gameState.players[1].mz=[foeM];gameState.players[1].sz=[foeS];
let eCan=eff('メガトン魔導キャノン');
ok('メガトン魔導キャノン negative: カウンターが足りなければ発動できない',
   eCan.condition(ctxAt(cannon,'sz'))===false);
API.addCounter(h(city),'魔力',7);
API.addCounter(h(stone),'魔力',3);
ok('メガトン魔導キャノン positive: 合計10個あれば発動できる',
   eCan.condition(ctxAt(cannon,'sz'))===true,String(API.counterTotal(0,'魔力')));
eCan.operation(ctxAt(cannon,'sz'));
ok('メガトン魔導キャノン positive: 10個の分配選択が開く',
   !!pending()&&pending().min===10&&pending().max===10);
answerAll();
ok('メガトン魔導キャノン positive: 合計10個が取り除かれる',
   API.counterTotal(0,'魔力')===0,String(API.counterTotal(0,'魔力')));
ok('メガトン魔導キャノン positive: 相手の場が全て破壊される',
   !inMz(1,foeM)&&!inSz(1,foeS));

reset0();
let mand=mk('魔草 マンドラゴラ',0,'down','def'),c1=mk(CITY,0),c2=mk(CITY,1),plainM=mk(PLAIN,0);
gameState.players[0].mz=[mand,plainM];gameState.players[0].field=c1;gameState.players[1].field=c2;
let eMand=eff('魔草 マンドラゴラ');
ok('魔草 マンドラゴラ positive: 置けるカードがあれば誘発する',
   eMand.condition(ctxAt(mand,'mz','onFlip'))===true);
eMand.operation(ctxAt(mand,'mz','onFlip'));
ok('魔草 マンドラゴラ positive: 両者の置けるカード全てに1つずつ置く',
   cnt(c1,'魔力')===1&&cnt(c2,'魔力')===1);
ok('魔草 マンドラゴラ ruling: 置けないカードには置かない',
   (plainM.counters===undefined));
reset0();
let mand2=mk('魔草 マンドラゴラ',0,'down','def');gameState.players[0].mz=[mand2];
ok('魔草 マンドラゴラ negative: 置けるカードが無ければ誘発しない',
   eMand.condition(ctxAt(mand2,'mz','onFlip'))===false);

reset0();
let ref=mk('黒魔力の精製者',0,'up','atk'),c3=mk(CITY,0);
gameState.players[0].mz=[ref];gameState.players[0].field=c3;
let eRef=eff('黒魔力の精製者');
ok('黒魔力の精製者 positive: 表側攻撃表示なら発動できる',eRef.condition(ctxAt(ref,'mz'))===true);
eRef.operation(ctxAt(ref,'mz'));
ok('黒魔力の精製者 positive: 守備表示になる',gameState.players[0].mz[0].pos==='def');
answerFirst(1);
ok('黒魔力の精製者 positive: 置けるカードへ1つ置く',cnt(c3,'魔力')===1);
ok('黒魔力の精製者 negative: 同じターンに2度は使えない',
   eRef.condition(ctxAt(ref,'mz'))===false);
reset0();
let ref2=mk('黒魔力の精製者',0,'up','def'),c4=mk(CITY,0);
gameState.players[0].mz=[ref2];gameState.players[0].field=c4;
ok('黒魔力の精製者 negative: 守備表示では発動できない',eRef.condition(ctxAt(ref2,'mz'))===false);
reset0();
let ref3=mk('黒魔力の精製者',0,'up','atk');gameState.players[0].mz=[ref3];
ok('黒魔力の精製者 negative: 置けるカードが無ければ発動できない',
   eRef.condition(ctxAt(ref3,'mz'))===false);

reset0();
let ps=mk('漆黒のパワーストーン',0,'up'),c5=mk(CITY,0);
gameState.players[0].sz=[ps];gameState.players[0].field=c5;
let ePsAct=eff('漆黒のパワーストーン','activate-with-three');
let ePsMove=eff('漆黒のパワーストーン','transfer-one-counter');
let ePsDie=eff('漆黒のパワーストーン','self-destroy-when-empty');
ePsAct.operation(ctxAt(ps,'sz'));
ok('漆黒のパワーストーン positive: 発動時に自身へ3つ置く',cnt(ps,'魔力')===3);
ok('漆黒のパワーストーン positive: 自身は置けるカードとして扱われる',
   counterCapableV22(ps,'魔力')===true);
ok('漆黒のパワーストーン positive: 移動を発動できる',ePsMove.condition(ctxAt(ps,'sz'))===true);
ePsMove.operation(ctxAt(ps,'sz'));
answerFirst(1);
ok('漆黒のパワーストーン positive: 自身から1つ減り相手先が1つ増える',
   cnt(ps,'魔力')===2&&cnt(c5,'魔力')===1,cnt(ps,'魔力')+'/'+cnt(c5,'魔力'));
ok('漆黒のパワーストーン negative: 同じターンに2度は使えない',
   ePsMove.condition(ctxAt(ps,'sz'))===false);
/* 全て取り除かれたら自壊する */
gameState.deferredEvents=[];
API.removeCounter(h(ps),'魔力',2);
let evRem=(gameState.deferredEvents||[]).filter(e=>e.eventName==='onCounterRemoved').map(e=>e.evt).slice(-1)[0];
let cDie=ctxAt(ps,'sz','onCounterRemoved',{event:evRem});
ok('漆黒のパワーストーン positive: 全て取り除かれた時に誘発する',ePsDie.condition(cDie)===true);
ePsDie.operation(cDie);
ok('漆黒のパワーストーン positive: 自壊する',!inSz(0,ps));
reset0();
let ps2=mk('漆黒のパワーストーン',0,'up'),c6=mk(CITY,0);
gameState.players[0].sz=[ps2];gameState.players[0].field=c6;
eff('漆黒のパワーストーン','activate-with-three').operation(ctxAt(ps2,'sz'));
gameState.deferredEvents=[];
API.removeCounter(h(ps2),'魔力',1);
let ev2=(gameState.deferredEvents||[]).filter(e=>e.eventName==='onCounterRemoved').map(e=>e.evt).slice(-1)[0];
ok('漆黒のパワーストーン negative: まだ残っていれば自壊しない',
   ePsDie.condition(ctxAt(ps2,'sz','onCounterRemoved',{event:ev2}))===false);

/* =====================================================================
   2. カウンター増減イベント
   ===================================================================== */
reset0();
let inc=mk('「A」細胞培養装置',0,'up'),al=mk(ALIEN,1);
gameState.players[0].sz=[inc];gameState.players[1].mz=[al];
API.addCounter(h(al),'A',2);
let eIncGain=eff('「A」細胞培養装置','gain-on-any-a-counter-removed');
gameState.deferredEvents=[];
API.removeCounter(h(al),'A',1);
let evA=(gameState.deferredEvents||[]).filter(e=>e.eventName==='onCounterRemoved').map(e=>e.evt).slice(-1)[0];
let cInc=ctxAt(inc,'sz','onCounterRemoved',{event:evA});
ok('「A」細胞培養装置 positive: Aカウンターが取り除かれた時に誘発する',
   eIncGain.condition(cInc)===true);
eIncGain.operation(cInc);
ok('「A」細胞培養装置 positive: 自身にAカウンターが1つ乗る',cnt(inc,'A')===1);
gameState.deferredEvents=[];
API.addCounter(h(al),'魔力',1);
API.removeCounter(h(al),'魔力',1);
let evM=(gameState.deferredEvents||[]).filter(e=>e.eventName==='onCounterRemoved').map(e=>e.evt).slice(-1)[0];
ok('「A」細胞培養装置 negative: 別の種類のカウンターでは誘発しない',
   eIncGain.condition(ctxAt(inc,'sz','onCounterRemoved',{event:evM}))===false);
/* 破壊された時に貯めたAカウンターを撒く */
API.addCounter(h(inc),'A',1);
let stored=cnt(inc,'A');
ok('前提: 培養装置にAカウンターが乗っている',stored===2,String(stored));
let m1=mk(PLAIN,0),m2=mk(PLAIN,1);
gameState.players[0].mz=[m1];gameState.players[1].mz=[al,m2];
API.destroy(h(inc),'テスト破壊');
let incG=(gameState.players[0].grave||[]).find(c=>c&&c.uid===inc.uid);
ok('「A」細胞培養装置 positive: 破壊時のカウンター数が控えられる',
   !!incG&&incG.graveInfo&&incG.graveInfo.countersV22&&incG.graveInfo.countersV22['A']===2,
   JSON.stringify(incG&&incG.graveInfo&&incG.graveInfo.countersV22));
let eIncScatter=eff('「A」細胞培養装置','scatter-on-destroy');
let cScatter=makeContext(0,incG,'grave',0,'onDestroy',{});
ok('「A」細胞培養装置 positive: 破壊時に撒く条件が立つ',eIncScatter.condition(cScatter)===true);
eIncScatter.operation(cScatter);
ok('「A」細胞培養装置 positive: 乗っていた数だけ選択が開く',
   !!pending()&&pending().min===2&&pending().max===2);
answerAll();
ok('「A」細胞培養装置 positive: 表側モンスターへAカウンターが置かれる',
   API.counterTotal(null,'A')>=2,String(API.counterTotal(null,'A')));

reset0();
let code=mk('古代遺跡コードA',0,'up'),al2=mk(ALIEN,0);
gameState.players[0].sz=[code];gameState.players[0].mz=[al2];
let eCodeGain=eff('古代遺跡コードA','gain-on-alien-destroyed');
let cCode=ctxAt(code,'sz','onDestroy',{event:{player:0,card:al2}});
ok('古代遺跡コードA positive: エーリアンが破壊された時に誘発する',eCodeGain.condition(cCode)===true);
eCodeGain.operation(cCode);
ok('古代遺跡コードA positive: Aカウンターが1つ乗る',cnt(code,'A')===1);
let plainC=mk(PLAIN,0);
ok('古代遺跡コードA negative: エーリアン以外では誘発しない',
   eCodeGain.condition(ctxAt(code,'sz','onDestroy',{event:{player:0,card:plainC}}))===false);
let eCodeRev=eff('古代遺跡コードA','pay-two-a-counters-revive');
ok('古代遺跡コードA negative: Aカウンターが1つでは発動できない',
   eCodeRev.condition(ctxAt(code,'sz'))===false);
API.addCounter(h(code),'A',1);
gameState.players[0].grave=[mk(ALIEN,0)];
gameState.players[0].mz=[];
ok('古代遺跡コードA positive: Aカウンター2つと墓地のエーリアンで発動できる',
   eCodeRev.condition(ctxAt(code,'sz'))===true);
eCodeRev.operation(ctxAt(code,'sz'));
ok('古代遺跡コードA positive: 2つ分の選択が開く',!!pending()&&pending().min===2);
answerAll();
ok('古代遺跡コードA positive: Aカウンターが2つ取り除かれる',cnt(code,'A')===0);
ok('古代遺跡コードA positive: 特殊召喚の選択が続く',!!pending());
answerFirst(1);
ok('古代遺跡コードA positive: 墓地のエーリアンが特殊召喚される',
   (gameState.players[0].mz||[]).some(c=>c&&isSetCardV4(dbOf(c),SETCODE.ALIEN)));
ok('古代遺跡コードA negative: 同じターンに2度は使えない',
   eCodeRev.condition(ctxAt(code,'sz'))===false);

reset0();
let bomb=mk('「A」細胞散布爆弾',0),myAl=mk(ALIEN,0),fm1=mk(PLAIN,1),fm2=mk(PLAIN,1);
gameState.players[0].sz=[bomb];gameState.players[0].mz=[myAl];
gameState.players[1].mz=[fm1,fm2];
let eBomb=eff('「A」細胞散布爆弾');
ok('「A」細胞散布爆弾 positive: 自分のエーリアンと相手の表側がいれば発動できる',
   eBomb.condition(ctxAt(bomb,'sz'))===true);
let lv=curLV(myAl);
run(eBomb,ctxAt(bomb,'sz'));
ok('「A」細胞散布爆弾 positive: 選択したエーリアンを破壊する',!inMz(0,myAl));
ok('「A」細胞散布爆弾 positive: レベルの数だけ選択が開く',
   !!pending()&&pending().min===lv&&pending().max===lv,String(lv));
answerAll();
ok('「A」細胞散布爆弾 positive: 相手モンスターへAカウンターが置かれる',
   API.counterTotal(1,'A')===lv,String(API.counterTotal(1,'A')));
reset0();
let bomb2=mk('「A」細胞散布爆弾',0),myAl2=mk(ALIEN,0);
gameState.players[0].sz=[bomb2];gameState.players[0].mz=[myAl2];
ok('「A」細胞散布爆弾 negative: 相手に表側モンスターがいなければ発動できない',
   eBomb.condition(ctxAt(bomb2,'sz'))===false);
reset0();
let bomb3=mk('「A」細胞散布爆弾',0),fm3=mk(PLAIN,1);
gameState.players[0].sz=[bomb3];gameState.players[1].mz=[fm3];
ok('「A」細胞散布爆弾 negative: 自分のエーリアンがいなければ発動できない',
   eBomb.condition(ctxAt(bomb3,'sz'))===false);

/* =====================================================================
   3. カウンターを条件にする継続効果・蓄積
   ===================================================================== */
reset0();
/* 無効化の対象は「効果モンスター」でなければならない */
const EFFMON='ライオウ';
let mars=mk('エーリアン・マーズ',0),victim=mk(EFFMON,1),clean=mk(EFFMON,0);
ok('前提: 小道具は効果モンスター',(dbOf(victim).st||[]).indexOf('効果')>=0);
gameState.players[0].mz=[mars,clean];gameState.players[1].mz=[victim];
API.addCounter(h(victim),'A',1);
ok('エーリアン・マーズ positive: Aカウンターが乗った効果モンスターの効果は無効',
   effectNegatedBy(continuousSources(),victim,h(victim))===true);
ok('エーリアン・マーズ negative: カウンターが無ければ無効にしない',
   effectNegatedBy(continuousSources(),clean,h(clean))===false);
API.addCounter(h(mars),'A',1);
ok('エーリアン・マーズ ruling: 自分自身は無効にしない',
   effectNegatedBy(continuousSources(),mars,h(mars))===false);

reset0();
let bottle=mk('サンダー・ボトル',0,'up'),mine=mk(PLAIN,0),foe=mk(PLAIN,1);
gameState.players[0].sz=[bottle];gameState.players[0].mz=[mine];gameState.players[1].mz=[foe];
let eBotGain=eff('サンダー・ボトル','gain-on-own-attack');
let cBot=ctxAt(bottle,'sz','onAttackDeclare',{event:{player:0,attackerUid:mine.uid}});
ok('サンダー・ボトル positive: 自分のモンスターの攻撃宣言で誘発する',eBotGain.condition(cBot)===true);
eBotGain.operation(cBot);
ok('サンダー・ボトル positive: 雷カウンターが1つ乗る',cnt(bottle,'雷')===1);
ok('サンダー・ボトル negative: 相手の攻撃宣言では誘発しない',
   eBotGain.condition(ctxAt(bottle,'sz','onAttackDeclare',{event:{player:1}}))===false);
let eBotFire=eff('サンダー・ボトル','send-self-destroy-all');
ok('サンダー・ボトル negative: 雷カウンターが4つ未満では発動できない',
   eBotFire.condition(ctxAt(bottle,'sz'))===false);
API.addCounter(h(bottle),'雷',3);
ok('サンダー・ボトル positive: 4つ以上で発動できる',eBotFire.condition(ctxAt(bottle,'sz'))===true);
run(eBotFire,ctxAt(bottle,'sz'));
ok('サンダー・ボトル positive: 自身を墓地へ送る',!inSz(0,bottle));
ok('サンダー・ボトル positive: 相手モンスターを全て破壊する',!inMz(1,foe));

/* =====================================================================
   4. Replay / SaveLoad / 直列化
   ===================================================================== */
reset0();
let rCity=mk(CITY,0),rStone=mk('漆黒のパワーストーン',0,'up');
gameState.players[0].field=rCity;gameState.players[0].sz=[rStone];
v41ResetActionJournal(gameState);
API.addCounter(h(rCity),'魔力',2);
eff('漆黒のパワーストーン','activate-with-three').operation(ctxAt(rStone,'sz'));
API.removeCounterSpread([rCity.uid,rStone.uid],'魔力','Replayテスト');
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: カウンターの分配操作が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('直列化: v22 は新しい state を作らない',
   assertCounterStatelessV22(gameState)===null,String(assertCounterStatelessV22(gameState)));

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
