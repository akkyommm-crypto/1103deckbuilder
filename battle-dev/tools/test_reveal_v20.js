/* System v20 — Reveal / Inspect / AtomicDeck の基盤テスト。
   カード個別の TESTED 判定の証拠にはしない。 */
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
const A='ヂェミナイ・エルフ',B='セイバーザウルス',C='ライオウ',D='クリッター',E='シャインエンジェル';
function deck5(p){gameState.players[p].deck=[mk(A,p),mk(B,p),mk(C,p),mk(D,p),mk(E,p)];}
function names(list){return list.map(h=>h.db?h.db.n:dbOf(h.card).n);}
function deckNames(p){return gameState.players[p].deck.map(c=>dbOf(c).n);}

/* ================= 1. 確認（inspect）は state を変えない ================= */
reset0();deck5(0);
let d0=JSON.stringify(gameState);
let dig0=v41StateDigest(gameState);
let top3=API.deckTop(0,3);
ok('v20 deckTop: 上から3枚のハンドルを返す',names(top3).join(',')===[A,B,C].join(','),names(top3).join(','));
let ins=API.inspect(0,top3,'テスト確認');
ok('v20 inspect: 見た枚数を返す',ins.count===3);
ok('v20 inspect: uid を返す',ins.uids.length===3&&ins.uids.every(u=>typeof u==='number'));
ok('v20 inspect: ログ以外の state を変えない',JSON.stringify(Object.assign({},gameState,{log:0}))===JSON.stringify(Object.assign({},JSON.parse(d0),{log:0})));
ok('v20 inspect: digest を変えない',v41StateDigest(gameState)===dig0);
ok('v20 inspect: 相手側の公開stateへ入れない',gameState.revealV20===undefined);
ok('v20 inspect: 相手からは見えないまま',
   isRevealedToV20(gameState,ins.uids[0],1)===false);
ok('v20 inspectFilter: 条件で絞れる',
   inspectFilterV20(ins,h=>h.db.n===B).length===1);
let logTail=((gameState.log||[])[0]||{}).msg||'';
ok('v20 inspect: ログに中身を書かない',
   /3枚を確認/.test(String(logTail))&&!String(logTail).includes(A),String(logTail));

/* ================= 2. 公開（reveal）は状態として残る ================= */
reset0();
let h1=mk(A,1),h2=mk(B,1);
gameState.players[1].hand=[h1,h2];
let digBefore=v41StateDigest(gameState);
ok('v20 digest: 公開前は revealV20 の追記が無い',
   v41StateDigestText(gameState).indexOf('RV20')<0);
let rid=API.reveal({player:1,audience:'both',zone:'hand',label:'テスト公開',until:'permanent'});
ok('v20 reveal: id を返す',rid!=null);
ok('v20 reveal: 記録が1件',revealListV20(gameState).length===1);
ok('v20 reveal: 相手（p0）から見える',isRevealedToV20(gameState,h1.uid,0)===true);
ok('v20 reveal: 本人からも見える',isRevealedToV20(gameState,h1.uid,1)===true);
ok('v20 reveal: 手札ゾーン全体が対象',
   revealedCardsV20(gameState,0).length===2);
ok('v20 digest: 公開後だけ追記される',
   v41StateDigestText(gameState).indexOf('RV20')>=0&&v41StateDigest(gameState)!==digBefore);
API.unreveal(rid);
ok('v20 unreveal: 記録が消える',gameState.revealV20===undefined);
ok('v20 digest: 公開を解けば元の digest へ戻る',v41StateDigest(gameState)===digBefore);

/* audience の分離 */
reset0();
let s1=mk(A,0);gameState.players[0].hand=[s1];
API.reveal({player:0,audience:'self',uids:[],cards:[locateCardAnyV4(s1)],label:'自分だけ',until:'permanent'});
ok('v20 audience self: 本人だけが見える',
   isRevealedToV20(gameState,s1.uid,0)===true&&isRevealedToV20(gameState,s1.uid,1)===false);
reset0();
let s2=mk(A,0);gameState.players[0].hand=[s2];
API.reveal({player:0,audience:'opponent',cards:[locateCardAnyV4(s2)],label:'相手だけ',until:'permanent'});
ok('v20 audience opponent: 相手だけが見える',
   isRevealedToV20(gameState,s2.uid,1)===true&&isRevealedToV20(gameState,s2.uid,0)===false);

/* source が場を離れたら公開は終わる */
reset0();
let src=mk('D2シールド',0,'down');gameState.players[0].sz=[src];
let held=mk(A,1);gameState.players[1].hand=[held];
API.reveal({player:1,audience:'both',zone:'hand',until:'permanent',sourceUid:src.uid,label:'継続公開'});
ok('v20 reveal: sourceが伏せのままでは無効',isRevealedToV20(gameState,held.uid,0)===false);
src.face='up';
ok('v20 reveal: sourceが表側なら有効',isRevealedToV20(gameState,held.uid,0)===true);
API.sendToGrave(locateCardAnyV4(src),'テスト');
ok('v20 reveal: sourceが場を離れたら終わる',isRevealedToV20(gameState,held.uid,0)===false);

/* draw公開も義務のaudience・sourceUidを引き継ぎ、staleにしない */
reset0();
let drawSrc=mk('D2シールド',0,'up');gameState.players[0].sz=[drawSrc];
gameState.players[1].deck=[mk(A,1)];
API.reveal({player:1,audience:'opponent',on:'draw',until:'permanent',
  sourceUid:drawSrc.uid,label:'sourceつきドロー公開'});
API.draw(1,1);
let drawHeld=gameState.players[1].hand[0];
let drawVisibleBefore=isRevealedToV20(gameState,drawHeld.uid,0)
  && !isRevealedToV20(gameState,drawHeld.uid,1);
API.sendToGrave(locateCardAnyV4(drawSrc),'テスト');
ok('v20 draw reveal: audienceとsourceUidを継承してsource離脱で失効',
  drawVisibleBefore && !isRevealedToV20(gameState,drawHeld.uid,0));

/* 期間の掃除 */
reset0();
let x1=mk(A,1);gameState.players[1].hand=[x1];
API.reveal({player:1,audience:'both',zone:'hand',until:'endPhase',label:'endPhaseまで'});
clearExpiredMods(gameState,'endBattlePhase');
ok('v20 until endPhase: バトルフェイズ終了では消えない',revealListV20(gameState).length===1);
clearExpiredMods(gameState,'endPhase');
ok('v20 until endPhase: エンドフェイズで消える',revealListV20(gameState).length===0);
reset0();
let x2=mk(A,1);gameState.players[1].hand=[x2];
API.reveal({player:1,audience:'both',zone:'hand',until:'permanent',label:'永続'});
clearExpiredMods(gameState,'endTurn');clearExpiredMods(gameState,'endPhase');
ok('v20 until permanent: 掃除で消えない',revealListV20(gameState).length===1);
/* 「相手の2回目のエンドフェイズまで」 */
reset0();
let x3=mk(A,1);gameState.players[1].hand=[x3];
API.reveal({player:1,audience:'both',zone:'hand',until:'endPhaseCount',remaining:2,endPhaseOf:1,label:'2回目まで'});
gameState.activePlayer=0;clearExpiredMods(gameState,'endPhase');
ok('v20 endPhaseCount: 自分のエンドフェイズでは数えない',revealListV20(gameState).length===1);
gameState.activePlayer=1;clearExpiredMods(gameState,'endPhase');
ok('v20 endPhaseCount: 1回目の相手エンドフェイズでは残る',
   revealListV20(gameState).length===1&&revealListV20(gameState)[0].remaining===1);
clearExpiredMods(gameState,'endPhase');
ok('v20 endPhaseCount: 2回目の相手エンドフェイズで終わる',revealListV20(gameState).length===0);

/* ================= 3. デッキの並べ替え ================= */
reset0();deck5(0);
let t3=API.deckTop(0,3),uids=t3.map(h=>h.card.uid);
API.orderToDeck(0,[uids[2],uids[0],uids[1]],false,'テスト並べ替え');
ok('v20 orderToDeck: 指定順でトップへ戻る',
   deckNames(0).join(',')===[C,A,B,D,E].join(','),deckNames(0).join(','));
ok('v20 orderToDeck: 枚数は変わらない',gameState.players[0].deck.length===5);
reset0();deck5(0);
let bt=API.deckTop(0,1)[0].card.uid;
API.orderToDeck(0,[bt],true,'テストボトム');
ok('v20 orderToDeck: ボトムへも戻せる',
   deckNames(0).join(',')===[B,C,D,E,A].join(','),deckNames(0).join(','));
reset0();deck5(0);
API.orderToDeck(0,[999999],false,'存在しないuid');
ok('v20 orderToDeck: 存在しないuidは無視する',deckNames(0).join(',')===[A,B,C,D,E].join(','));
reset0();deck5(0);
let all=API.deckTop(0,5).map(h=>h.card.uid).slice().reverse();
API.orderToDeck(0,all,false,'全部逆順');
ok('v20 orderToDeck: 全枚数でも原子的に処理する',
   deckNames(0).join(',')===[E,D,C,B,A].join(','),deckNames(0).join(','));

/* ================= 4. 裏側守備のシャッフル ================= */
reset0();
gameState.players[0].mz=[mk(A,0,'down','def'),mk(B,0,'down','def'),mk(C,0,'down','def')];
let before=gameState.players[0].mz.map(c=>c.uid);
API.shuffleFaceDown(0,'テスト');
let after=gameState.players[0].mz.map(c=>c.uid);
ok('v20 shuffleFaceDown: 枚数と顔ぶれは変わらない',
   after.slice().sort().join(',')===before.slice().sort().join(','));
ok('v20 shuffleFaceDown: 全て裏側守備のまま',
   gameState.players[0].mz.every(c=>c.face==='down'&&c.pos==='def'));
reset0();
gameState.players[0].mz=[mk(A,0,'up','atk'),mk(B,0,'down','def')];
let faceUpUid=gameState.players[0].mz[0].uid;
API.shuffleFaceDown(0,'テスト');
ok('v20 shuffleFaceDown: 表側のカードは動かさない',
   gameState.players[0].mz[0].uid===faceUpUid);
/* 決定論 */
function shuffleSeq(seed){
  reset0();gameState.rngState=seed;
  gameState.players[0].mz=[mk(A,0,'down','def'),mk(B,0,'down','def'),mk(C,0,'down','def'),mk(D,0,'down','def')];
  const idBefore=gameState.players[0].mz.map(c=>dbOf(c).n);
  API.shuffleFaceDown(0,'テスト');
  return idBefore.join('')+'->'+gameState.players[0].mz.map(c=>dbOf(c).n).join(',');
}
ok('v20 shuffleFaceDown: 同じ乱数状態なら同じ結果',shuffleSeq(12345)===shuffleSeq(12345));

/* ================= 5. Replay / SaveLoad / Undo ================= */
reset0();deck5(0);
let rh=mk(A,1);gameState.players[1].hand=[rh];
v41ResetActionJournal(gameState);
API.reveal({player:1,audience:'both',zone:'hand',until:'permanent',label:'Replayテスト'});
let ut=API.deckTop(0,2).map(h=>h.card.uid);
API.orderToDeck(0,[ut[1],ut[0]],false,'Replayテスト');
API.shuffleFaceDown(0,'Replayテスト');
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('v20 Replay: 公開とデッキ操作を含む進行が digest 一致で再生される',
   audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('v20 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('v20 直列化: record に function/Map/Set が無い',
   assertRevealSerializableV20(gameState)===null,String(assertRevealSerializableV20(gameState)));
/* Undo / Redo */
reset0();deck5(0);
let un=mk(A,1);gameState.players[1].hand=[un];
snapshot();
let digPre=v41StateDigest(gameState);
API.reveal({player:1,audience:'both',zone:'hand',until:'permanent',label:'Undoテスト'});
ok('v20 Undo: 公開後は見える',isRevealedToV20(gameState,un.uid,0)===true);
undo();
ok('v20 Undo: 公開が取り消される',
   (gameState.revealV20===undefined||revealListV20(gameState).length===0)
   &&v41StateDigest(gameState)===digPre);
redo();
ok('v20 Redo: 公開が戻る',revealListV20(gameState).length===1);

/* ================= 6. 非回帰 ================= */
reset0();deck5(0);
let base=v41StateDigest(gameState);
API.inspect(0,API.deckTop(0,5),'非回帰');
ok('v20 非回帰: 確認だけでは digest が動かない',v41StateDigest(gameState)===base);
ok('v20 非回帰: 既存のシャッフルは従来通り',(()=>{
  const n=gameState.players[0].deck.length;API.shuffle(0);
  return gameState.players[0].deck.length===n;})());
reset0();
ok('v20 非回帰: 公開を使わない局面の digest 文字列に RV20 が出ない',
   v41StateDigestText(gameState).indexOf('RV20')<0);
ok('v20 非回帰: 既存の returnToDeck は従来通り',(()=>{
  reset0();deck5(0);const c=mk(A,0);gameState.players[0].hand=[c];
  API.returnToDeck(locateCardAnyV4(c),false,'非回帰');
  return gameState.players[0].deck.length===6&&gameState.players[0].hand.length===0;})());
ok('v20 非回帰: 既存の COUNTER_ADD は従来通り',(()=>{
  reset0();const c=mk(A,0);gameState.players[0].mz=[c];
  API.addCounter(locateCardAnyV4(c),'魔力',2);
  return API.countCounter(locateCardAnyV4(c),'魔力')===2;})());

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
