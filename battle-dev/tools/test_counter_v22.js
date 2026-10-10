/* System v22 — Counter の基盤テスト。
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
const SAVED={};
function withScript(name, patch){
  if(!(name in SAVED)) SAVED[name]=CARD_SCRIPTS[name];
  CARD_SCRIPTS[name]=Object.assign({}, CARD_SCRIPTS[name]||{}, patch);
}
function reset0(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
  COUNTER_CAPABLE_CACHE_V22.clear();
  Object.keys(SAVED).forEach(k=>{ if(SAVED[k]===undefined) delete CARD_SCRIPTS[k]; else CARD_SCRIPTS[k]=SAVED[k]; });
}
function h(c){ return locateCardAnyV4(c); }
const PLAIN='ヂェミナイ・エルフ';
const CITY='魔法都市エンディミオン';   /* 魔力カウンターを置く事ができる代表 */
function evts(name){return (gameState.deferredEvents||[]).filter(e=>e.eventName===name).map(e=>e.evt);}
function clearEvts(){gameState.deferredEvents=[];}

/* ================= 1. capability metadata ================= */
reset0();
let city=mk(CITY,0),plain=mk(PLAIN,0);
gameState.players[0].field=city;gameState.players[0].mz=[plain];
ok('v22 capability: 「置く事ができる」と書かれたカードは置ける',
   counterCapableV22(city,'魔力')===true);
ok('v22 capability negative: 何も書かれていないカードには置けない',
   counterCapableV22(plain,'魔力')===false);
ok('v22 capability: API からも引ける',API.counterCapable(h(city),'魔力')===true);
ok('v22 capability: 別の種類のカウンターには広がらない',
   counterCapableV22(city,'A')===false);
withScript(PLAIN,{counterCapableV22:{'魔力':true}});
COUNTER_CAPABLE_CACHE_V22.clear();
ok('v22 capability: カード側の宣言が推定より優先される',
   counterCapableV22(plain,'魔力')===true);
withScript(PLAIN,{counterCapableV22:{'魔力':false}});
COUNTER_CAPABLE_CACHE_V22.clear();
ok('v22 capability: 宣言で明示的に否定もできる',
   counterCapableV22(plain,'魔力')===false);
reset0();
let city2=mk(CITY,0),plain2=mk(PLAIN,0);
gameState.players[0].field=city2;gameState.players[0].mz=[plain2];
let caps=API.counterCapableCards(0,'魔力');
ok('v22 capability: 場から置けるカードだけを集める',
   caps.length===1&&caps[0].card===city2,String(caps.length));
city2.face='down';
ok('v22 capability: 裏側のカードは既定で除く',API.counterCapableCards(0,'魔力').length===0);
ok('v22 capability: 裏側も含めたい場合は指定できる',
   API.counterCapableCards(0,'魔力',false).length===1);

/* ================= 2. 変化イベント ================= */
reset0();
let ev1=mk(CITY,0);gameState.players[0].field=ev1;
clearEvts();
API.addCounter(h(ev1),'魔力',2);
let placed=evts('onCounterPlaced');
ok('v22 event: 置いた時に onCounterPlaced が出る',placed.length===1);
ok('v22 event: 枚数と合計を運ぶ',
   placed[0].n===2&&placed[0].total===2&&placed[0].kind==='魔力',JSON.stringify(placed[0]));
ok('v22 event: uid で identity を運ぶ',placed[0].uid===ev1.uid);
clearEvts();
API.removeCounter(h(ev1),'魔力',1);
let removed=evts('onCounterRemoved');
ok('v22 event: 取り除いた時に onCounterRemoved が出る',removed.length===1);
ok('v22 event: 残数を運ぶ',removed[0].n===1&&removed[0].total===1,JSON.stringify(removed[0]));
clearEvts();
API.removeCounter(h(ev1),'魔力',5);
ok('v22 event: 実際に取り除けた数だけを運ぶ',evts('onCounterRemoved')[0].n===1);
clearEvts();
API.removeCounter(h(ev1),'魔力',1);
ok('v22 event negative: 0個しか無ければイベントは出ない',evts('onCounterRemoved').length===0);
ok('v22 event: イベント名が登録されている',
   EVENTS.indexOf('onCounterPlaced')>=0&&EVENTS.indexOf('onCounterRemoved')>=0);

/* ================= 3. 設置上限 ================= */
reset0();
let lim=mk(CITY,0);gameState.players[0].field=lim;
withScript(CITY,{counterMaxV22:{'魔力':3}});
ok('v22 上限: 宣言を引ける',API.counterLimit(h(lim),'魔力')===3);
API.addCounter(h(lim),'魔力',2);
API.addCounter(h(lim),'魔力',5);
ok('v22 上限: 上限までしか置かれない',API.countCounter(h(lim),'魔力')===3,
   String(API.countCounter(h(lim),'魔力')));
API.addCounter(h(lim),'魔力',1);
ok('v22 上限: 満杯なら増えない',API.countCounter(h(lim),'魔力')===3);
reset0();
let nolim=mk(CITY,0);gameState.players[0].field=nolim;
API.addCounter(h(nolim),'魔力',20);
ok('v22 上限 negative: 宣言が無ければ上限なし（従来通り）',
   API.countCounter(h(nolim),'魔力')===20);

/* ================= 4. 分配（複数カードにまたがる）================= */
reset0();
let a1=mk(CITY,0),a2=mk(CITY,0),a3=mk(CITY,1);
gameState.players[0].field=a1;gameState.players[0].sz=[a2];gameState.players[1].field=a3;
API.addCounter(h(a1),'魔力',3);
API.addCounter(h(a2),'魔力',2);
API.addCounter(h(a3),'魔力',4);
let units0=API.counterUnits(0,'魔力');
ok('v22 分配: 自分の場のカウンターを1個ずつ候補にする',units0.length===5,String(units0.length));
ok('v22 分配: 候補は純JSONのキーを持つ',
   units0.every(u=>typeof u.key==='string'&&u.key.length>0));
ok('v22 分配: 合計を数えられる',API.counterTotal(0,'魔力')===5&&API.counterTotal(null,'魔力')===9);
ok('v22 分配: 絞り込みできる',
   API.counterUnits(null,'魔力',u=>u.p===1).length===4);
/* 3個を「1枚目から2個・2枚目から1個」取り除く */
API.removeCounterSpread([a1.uid,a1.uid,a2.uid],'魔力','分配テスト');
ok('v22 分配: 同じカードから複数個も取り除ける',
   API.countCounter(h(a1),'魔力')===1&&API.countCounter(h(a2),'魔力')===1,
   API.countCounter(h(a1),'魔力')+'/'+API.countCounter(h(a2),'魔力'));
ok('v22 分配: 相手の場は動かない',API.countCounter(h(a3),'魔力')===4);
clearEvts();
API.removeCounterSpread([a1.uid],'魔力','分配テスト');
ok('v22 分配: 取り除きでもイベントが出る',evts('onCounterRemoved').length===1);
/* 設置の分配 */
reset0();
let b1=mk(CITY,0),b2=mk(CITY,0);
gameState.players[0].field=b1;gameState.players[0].sz=[b2];
clearEvts();
API.placeCounterSpread([b1.uid,b1.uid,b2.uid],'魔力','分配設置');
ok('v22 分配設置: 指定した並びの通りに置かれる',
   API.countCounter(h(b1),'魔力')===2&&API.countCounter(h(b2),'魔力')===1);
ok('v22 分配設置: 1個ごとにイベントが出る',evts('onCounterPlaced').length===3);
reset0();
let c1=mk(CITY,0);gameState.players[0].field=c1;
withScript(CITY,{counterMaxV22:{'魔力':1}});
API.placeCounterSpread([c1.uid,c1.uid,c1.uid],'魔力','分配設置');
ok('v22 分配設置: 上限を超えない',API.countCounter(h(c1),'魔力')===1);
reset0();
API.removeCounterSpread([999999],'魔力','存在しない');
ok('v22 分配: 存在しない uid は無視する',true);

/* ================= 5. 既存機構の非回帰 ================= */
reset0();
let n1=mk(CITY,0);gameState.players[0].field=n1;
API.addCounter(h(n1),'魔力',1);
ok('v22 非回帰: addCounter / countCounter は従来通り',API.countCounter(h(n1),'魔力')===1);
API.removeCounter(h(n1),'魔力',1);
ok('v22 非回帰: removeCounter は従来通り',API.countCounter(h(n1),'魔力')===0);
reset0();
let n2=mk(CITY,0);gameState.players[0].field=n2;
API.addCounter(h(n2),'A',2);
ok('v22 非回帰: capability を宣言していない種類でも addCounter 自体は動く',
   API.countCounter(h(n2),'A')===2);
ok('v22 責務分離: capability は「置けるか」の判定であって addCounter を止めない',
   counterCapableV22(n2,'A')===false);
reset0();
let n3=mk(CITY,0);gameState.players[0].field=n3;
API.addCounter(h(n3),'A',2);
API.sendToGrave(h(n3),'破壊ではない墓地送り');
let n3g=(gameState.players[0].grave||[]).find(c=>c&&c.uid===n3.uid);
ok('v22 破壊時snapshot negative: 通常墓地送りでは countersV22 を残さない',
   !!n3g&&!!n3g.graveInfo&&!n3g.graveInfo.countersV22);
reset0();
ok('v22 非回帰: v21 の破壊耐性は従来通り',(()=>{
  const c=mk(PLAIN,1);gameState.players[1].mz=[c];
  API.destroy(h(c),'テスト');
  return !(gameState.players[1].mz||[]).some(x=>x&&x.uid===c.uid);})());

/* ================= 6. Replay / SaveLoad / 直列化 ================= */
reset0();
let r1=mk(CITY,0),r2=mk(CITY,0);
gameState.players[0].field=r1;gameState.players[0].sz=[r2];
v41ResetActionJournal(gameState);
API.addCounter(h(r1),'魔力',3);
API.placeCounterSpread([r2.uid,r2.uid],'魔力','Replayテスト');
API.removeCounterSpread([r1.uid,r2.uid],'魔力','Replayテスト');
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('v22 Replay: 分配操作を含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('v22 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('v22 直列化: 新しい state を作っていない',
   assertCounterStatelessV22(gameState)===null,String(assertCounterStatelessV22(gameState)));
ok('v22 digest: counters は従来通り載る',
   v41StateDigestText(gameState).indexOf('counters')>=0);
/* Undo / Redo */
reset0();
let u1=mk(CITY,0);gameState.players[0].field=u1;
snapshot();
let digPre=v41StateDigest(gameState);
API.addCounter(h(u1),'魔力',2);
undo();
ok('v22 Undo: カウンターが元に戻る',
   API.countCounter(h(u1),'魔力')===0&&v41StateDigest(gameState)===digPre);
redo();
ok('v22 Redo: カウンターが戻る',API.countCounter(h(u1),'魔力')===2);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
