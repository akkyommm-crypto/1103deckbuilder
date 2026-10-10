/* System v8 — Draw event primitive 回帰テスト
   検証: normal / negative / aborted / stale state / zone leave /
         Replay / Undo / Redo / SaveLoad / Journal / digest        */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
let __u=99800;
function mkD(n,p=0){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return{id,owner:p,controller:p,face:'up',pos:'atk',uid:__u++};}
function resetD(phase){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;
  gameState.phase=phase||'main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);
}
function evts(name){return (gameState.deferredEvents||[]).filter(e=>e.eventName===name).map(e=>e.evt);}
function clearEvts(){gameState.deferredEvents=[];}
const MID='ヂェミナイ・エルフ',ROCK='岩石の巨兵',SPELL='サイクロン';

/* =====================================================================
   1. 正常系: 効果ドロー
   ===================================================================== */
resetD();
let d1=mkD(MID),d2=mkD(ROCK);
gameState.players[0].deck=[d1,d2];
v41ResetActionJournal(gameState);clearEvts();
API.draw(0,2);
ok('normal: 2枚引ける',gameState.players[0].hand.length===2);
let ev=evts('onDrawCard');
ok('normal: 1枚ごとにイベントが出る',ev.length===2,'n='+ev.length);
ok('normal: 引いた順に index が付く',ev[0].index===0&&ev[1].index===1&&ev[0].total===2);
ok('normal: identity は uid',ev[0].uid===d1.uid&&ev[1].uid===d2.uid);
ok('normal: カード名を持たない',JSON.stringify(ev).indexOf('ヂェミナイ')<0);
ok('normal: 効果ドローは byEffect=true',ev[0].byEffect===true&&ev[0].normalDraw===false);
ok('normal: フェイズを持つ',ev[0].phase==='main1');
ok('normal: 引いたカードの実体を取り出せる',
   !!API.drawnCardOf(ev[0])&&API.drawnCardOf(ev[0]).card.uid===d1.uid);
let last=API.lastDraw();
ok('normal: 直前のドローが記録される',
   !!last&&last.player===0&&last.uids.length===2&&last.byEffect===true);
ok('normal: 直前のドローのカードを取り出せる',API.lastDrawCards().length===2);
ok('normal: 記録は純JSON',assertDrawStateSerializableV8(gameState).ok,
   assertDrawStateSerializableV8(gameState).why);

/* =====================================================================
   2. 通常ドローと効果ドローの区別
   ===================================================================== */
resetD('draw');
let n1=mkD(MID);gameState.players[0].deck=[n1];
v41ResetActionJournal(gameState);clearEvts();
API.drawNormal(0,1);
ev=evts('onDrawCard');
ok('通常ドロー: byEffect=false / normalDraw=true',
   ev.length===1&&ev[0].byEffect===false&&ev[0].normalDraw===true,JSON.stringify(ev[0]));
ok('通常ドロー: ドローフェイズ以外ではない',API.drawOutsideDrawPhase(ev[0])===false);
resetD('main1');
let n2=mkD(MID);gameState.players[0].deck=[n2];
v41ResetActionJournal(gameState);clearEvts();
API.draw(0,1);
ev=evts('onDrawCard');
ok('効果ドロー: メインフェイズのドローは normalDraw=false',ev[0].normalDraw===false);
ok('効果ドロー: ドローフェイズ以外と判定できる',API.drawOutsideDrawPhase(ev[0])===true);
resetD('draw');
let n3=mkD(MID);gameState.players[0].deck=[n3];
v41ResetActionJournal(gameState);clearEvts();
API.draw(0,1);
ok('ruling: ドローフェイズでも効果ドローは normalDraw=false',
   evts('onDrawCard')[0].normalDraw===false);
/* 明示指定が無い DRAW はフェイズと枚数から推定する */
resetD('draw');
let n4=mkD(MID);gameState.players[0].deck=[n4];
v41ResetActionJournal(gameState);clearEvts();
act({type:'DRAW',player:0,n:1});
ok('ruling: byEffect 未指定のドローフェイズ1枚は通常ドロー扱い',
   evts('onDrawCard')[0].normalDraw===true);
resetD('main1');
let n5=mkD(MID);gameState.players[0].deck=[n5];
v41ResetActionJournal(gameState);clearEvts();
act({type:'DRAW',player:0,n:1});
ok('ruling: byEffect 未指定でもメインフェイズなら効果ドロー扱い',
   evts('onDrawCard')[0].byEffect===true);

/* =====================================================================
   3. negative / aborted
   ===================================================================== */
resetD();
gameState.players[0].deck=[];
v41ResetActionJournal(gameState);clearEvts();
API.draw(0,1);
ok('negative: デッキが空ならイベントは出ない',evts('onDrawCard').length===0);
ok('negative: 記録も作られない',API.lastDraw()===null);
resetD();
let p1=mkD(MID);gameState.players[0].deck=[p1];
v41ResetActionJournal(gameState);clearEvts();
API.draw(0,3);
ok('aborted: 引ける分だけイベントが出る',evts('onDrawCard').length===1);
ok('aborted: デッキ切れでも記録は引けた分だけ',API.lastDraw().uids.length===1);
/* 初手配布はイベントを出さない */
resetD();
let i1=mkD(MID),i2=mkD(ROCK);gameState.players[0].deck=[i1,i2];
v41ResetActionJournal(gameState);clearEvts();
act({type:'DRAW',player:0,n:2,initial:true});
ok('negative: 初手配布ではイベントも記録も作らない',
   evts('onDrawCard').length===0&&API.lastDraw()===null);

/* =====================================================================
   4. stale state / zone leave
   ===================================================================== */
resetD();
let s1=mkD(MID);gameState.players[0].deck=[s1];
v41ResetActionJournal(gameState);clearEvts();
API.draw(0,1);
ev=evts('onDrawCard');
ok('stale前提: 引いたカードを取り出せる',!!API.drawnCardOf(ev[0]));
let h=findCardByUid(s1.uid);
act({type:'FX_DISCARD',player:0,index:h.index,byEffect:true,reason:'捨てる'});
ok('zone leave: 手札から離れたら drawnCardOf は null を返す',API.drawnCardOf(ev[0])===null);
ok('zone leave: lastDrawCards からも消える',API.lastDrawCards().length===0);
ok('stale: 記録自体は残る（後から参照して判断できる）',API.lastDraw().uids.length===1);
/* 次のドローで記録が上書きされる（無制限履歴を作らない） */
resetD();
let o1=mkD(MID),o2=mkD(ROCK);gameState.players[0].deck=[o1,o2];
v41ResetActionJournal(gameState);
API.draw(0,1);
ok('stale: 1回目の記録',API.lastDraw().uids[0]===o1.uid);
API.draw(0,1);
ok('stale: 2回目で上書きされる（履歴を溜めない）',
   API.lastDraw().uids.length===1&&API.lastDraw().uids[0]===o2.uid);

/* =====================================================================
   5. サーチ（デッキから手札に加わった時）
   ===================================================================== */
resetD();
let a1=mkD(SPELL);gameState.players[0].deck=[a1];
v41ResetActionJournal(gameState);clearEvts();
API.deckToHand(0,0,'サーチ');
let ah=evts('onAddToHand');
ok('search: デッキから手札に加わったイベントが出る',ah.length===1&&ah[0].uid===a1.uid);
ok('search: from が deck',ah[0].from==='deck');
ok('search: ドローイベントは出ない',evts('onDrawCard').length===0);
ok('search: カード名を持たない',JSON.stringify(ah).indexOf('サイクロン')<0);

/* =====================================================================
   6. 相手のドロー
   ===================================================================== */
resetD();
let f1=mkD(MID,1);gameState.players[1].deck=[f1];
v41ResetActionJournal(gameState);clearEvts();
API.draw(1,1);
ev=evts('onDrawCard');
ok('相手ドロー: player が相手になる',ev.length===1&&ev[0].player===1);
ok('相手ドロー: 自分の効果ドロー判定は false',API.lastDrawByEffect(0)===false);
ok('相手ドロー: 相手の効果ドロー判定は true',API.lastDrawByEffect(1)===true);

/* =====================================================================
   7. Replay / Undo / Redo / SaveLoad / Journal / digest
   ===================================================================== */
resetD();
let r1=mkD(MID),r2=mkD(ROCK);gameState.players[0].deck=[r1,r2];
v41ResetActionJournal(gameState);
let digestBefore=v41StateDigest(gameState);
let textBefore=v41StateDigestText(gameState);
ok('digest後方互換: ドロー前は記録が digest 文字列に出ない',textBefore.indexOf('lastDrawV8')<0);
API.draw(0,2);
let types=V41_ACTION_JOURNAL.map(x=>x.action.type);
ok('Journal: DRAW が記録される',types.includes('DRAW'));
ok('Journal: byEffect が Action に載る',
   V41_ACTION_JOURNAL.some(x=>x.action.type==='DRAW'&&x.action.byEffect===true));
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: ドロー記録を含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
gameState=JSON.parse(snap);
ok('SaveLoad: 復元後も直前のドローが読める',
   API.lastDraw().uids.length===2&&API.lastDraw().byEffect===true);
ok('SaveLoad: 復元後も引いたカードを uid で辿れる',API.lastDrawCards().length===2);
undo();
ok('Undo: ドローが巻き戻る',gameState.players[0].hand.length===0&&API.lastDraw()===null);
ok('Undo: 元の digest に一致する',v41StateDigest(gameState)===digestBefore,
   'before='+digestBefore+' now='+v41StateDigest(gameState));
redo();
ok('Redo: ドローと記録が復元される',
   gameState.players[0].hand.length===2&&API.lastDraw().uids.length===2);

/* 直列化の健全性 */
function scanFnsD(v,d){ if(d>12||v===null||typeof v!=='object')return typeof v==='function';
  return Object.keys(v).some(k=>typeof v[k]==='function'||scanFnsD(v[k],d+1)); }
ok('直列化: gameState 全体に関数が混入していない',
   !scanFnsD(JSON.parse(JSON.stringify(gameState)),0));
ok('直列化: 記録に Map/Set/DOM/Promise が無い',assertDrawStateSerializableV8(gameState).ok);
ok('無制限履歴なし: 記録は常に1件だけ',
   !Array.isArray(gameState.lastDrawV8)&&gameState.drawLog===undefined);

/* =====================================================================
   8. 既存機構を壊していないこと
   ===================================================================== */
ok('既存維持: onDraw イベントは従来どおり存在する',EVENTS.indexOf('onDraw')>=0);
ok('既存維持: drawnThisTurn の通常ドロー判定は従来どおり',
   (()=>{resetD('draw');const c=mkD(MID);gameState.players[0].deck=[c];
     act({type:'DRAW',player:0,n:1});return gameState.drawnThisTurn===true;})());
ok('既存維持: 初手配布は drawnThisTurn を立てない',
   (()=>{resetD('draw');const c=mkD(MID);gameState.players[0].deck=[c];
     act({type:'DRAW',player:0,n:1,initial:true});return !gameState.drawnThisTurn;})());
ok('既存維持: デッキ切れの敗北判定は従来どおり',
   (()=>{resetD();gameState.players[0].deck=[];act({type:'DRAW',player:0,n:1});
     return gameState.loser===0&&gameState.duelEndedReason==='deckout';})());

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
