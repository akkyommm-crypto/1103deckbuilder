/* System v11 — Token identity / creation primitive 回帰テスト
   検証: identity / owner・controller / 定義registry / 生成数 /
         イベント / 数値の写し / negative / Replay / Undo / Redo /
         SaveLoad / Journal / digest / 既存機構の非回帰                 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
/* uid は engine の採番に任せる（手振りの uid はトークンと衝突する）。 */
function mkT(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function resetT(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);
}
function evtsT(name){return (gameState.deferredEvents||[]).filter(e=>e.eventName===name).map(e=>e.evt);}
function clearEvtsT(){gameState.deferredEvents=[];}
const MON='ヂェミナイ・エルフ';
/* テスト専用の定義。カード側 registry の使い方をそのまま検査する。 */
defineTokenSpecV11('__テストトークン',{name:'__テストトークン',atk:800,def:500,lv:1,ra:'植物',at:'地',pos:'def'});
defineTokenSpecV11('__別トークン',{name:'__別トークン',atk:0,def:0,lv:1,ra:'悪魔',at:'闇',pos:'atk'});

/* =====================================================================
   1. identity（uid / owner / controller / 世代）
   ===================================================================== */
resetT();
let uids=API.createTokens(0,'__テストトークン',2);
ok('identity: 要求した数だけ出る',gameState.players[0].mz.length===2);
ok('identity: uid が付く',gameState.players[0].mz.every(c=>typeof c.uid==='number'));
ok('identity: 2体が別の uid を持つ',
   gameState.players[0].mz[0].uid!==gameState.players[0].mz[1].uid);
ok('identity: 生成した uid が返る',
   uids.length===2&&uids[0]===gameState.players[0].mz[0].uid);
ok('identity: uid でトークンを引ける',
   !!findCardByUid(uids[1])&&findCardByUid(uids[1]).card.token.n==='__テストトークン');
ok('identity: 世代（seq）が単調に増える',
   gameState.players[0].mz[0].tokenV11.seq<gameState.players[0].mz[1].tokenV11.seq);
ok('identity: 持ち主とコントローラーが入る',
   gameState.players[0].mz[0].owner===0&&gameState.players[0].mz[0].controller===0);
ok('identity: 定義した数値が入る',
   (()=>{const d=dbOf(gameState.players[0].mz[0]);
     return d.atk===800&&d.def===500&&d.lv===1&&d.ra==='植物'&&d.at==='地';})(),
   JSON.stringify(dbOf(gameState.players[0].mz[0])));
ok('identity: 定義した表示形式で出る',gameState.players[0].mz[0].pos==='def');
ok('identity: トークン判定',isTokenV11(gameState.players[0].mz[0])===true);
ok('identity: key を引ける',tokenKeyV11(gameState.players[0].mz[0])==='__テストトークン');
ok('identity: 同名判定',sameTokenV11(gameState.players[0].mz[0],'__テストトークン')===true
   &&sameTokenV11(gameState.players[0].mz[0],'__別トークン')===false);

/* 相手フィールドに出す（持ち主も相手になる） */
resetT();
API.createTokens(1,'__テストトークン',1);
ok('相手フィールド: 相手のモンスターゾーンに出る',
   gameState.players[1].mz.length===1&&gameState.players[0].mz.length===0);
ok('相手フィールド: 持ち主・コントローラーが相手になる',
   gameState.players[1].mz[0].owner===1&&gameState.players[1].mz[0].controller===1);
ok('相手フィールド: コントローラーを uid から引ける',
   API.tokenControllerOf(gameState.players[1].mz[0].uid)===1);

/* 生成元のカードを記録する */
resetT();
let src=mkT(MON);gameState.players[0].sz=[];gameState.players[0].mz=[src];
API.createTokens(1,'__テストトークン',1,{p:0,zone:'mz',index:0,card:src});
ok('生成元: sourceUid が残る',
   tokenSourceUidV11(gameState.players[1].mz[0])===src.uid);
ok('生成元: API から引ける',
   API.tokenSourceUid({p:1,zone:'mz',index:0,card:gameState.players[1].mz[0]})===src.uid);

/* =====================================================================
   2. 実際に出せた数（ゾーンの空き）
   ===================================================================== */
resetT();
for(let i=0;i<4;i++) gameState.players[0].mz.push(mkT(MON));
let made=API.createTokens(0,'__テストトークン',3);
ok('生成数: 空きの分しか出ない',gameState.players[0].mz.length===ZONE_LIMITS.mz,
   'mz='+gameState.players[0].mz.length+' limit='+ZONE_LIMITS.mz);
ok('生成数: 実際に出せた数が返る',made.length===ZONE_LIMITS.mz-4,'made='+made.length);
ok('生成数: 要求数と実数の両方が記録される',
   API.lastTokenCreated().requested===3&&API.lastTokenCreated().created===made.length);
resetT();
for(let i=0;i<ZONE_LIMITS.mz;i++) gameState.players[0].mz.push(mkT(MON));
clearEvtsT();
let none=API.createTokens(0,'__テストトークン',2);
ok('negative: 空きが無ければ1体も出ない',none.length===0&&API.lastTokenCreated().created===0);
ok('negative: 1体も出なければイベントも出さない',evtsT('onTokenSummon').length===0);

/* =====================================================================
   3. トークン特殊召喚イベント
   ===================================================================== */
resetT();clearEvtsT();
API.createTokens(0,'__テストトークン',2);
let te=evtsT('onTokenSummon');
ok('イベント: 1回の生成で1件出る',te.length===1,JSON.stringify(te));
ok('イベント: 出た数と uid を持つ',te[0].count===2&&te[0].uids.length===2);
ok('イベント: どの種類かを持つ',te[0].key==='__テストトークン');
ok('イベント: identity は uid（カード名以外の実体を持たない）',
   te[0].uids.every(u=>typeof u==='number'));
ok('イベント: 出したプレイヤーを持つ',te[0].player===0);
ok('既存維持: EVENTS に登録されている',EVENTS.indexOf('onTokenSummon')>=0);
ok('既存維持: 日本語名が引ける',eventJp('onTokenSummon')==='トークンが特殊召喚された時');

/* =====================================================================
   4. 数値を写したトークン
   ===================================================================== */
resetT();
let orig=mkT(MON);gameState.players[0].mz=[orig];
API.modAtk({p:0,zone:'mz',index:0,card:orig},300,0,'endTurn','テスト');
let copyUid=API.createTokenFrom(0,{p:0,zone:'mz',index:0,card:orig},'__写しトークン',1)[0];
let copy=findCardByUid(copyUid).card;
ok('写し: 現在の攻撃力を写す',dbOf(copy).atk===curATK(orig),
   'token='+dbOf(copy).atk+' src='+curATK(orig));
ok('写し: 種族・属性・レベルも写す',
   dbOf(copy).ra===dbOf(orig).ra&&dbOf(copy).at===dbOf(orig).at&&dbOf(copy).lv===curLV(orig));
ok('写し: 写し元の uid を残す',copy.tokenV11.copiedFromUid===orig.uid);
ok('写し: 写した後に元が変わっても数値は動かない',
   (()=>{const before=dbOf(copy).atk;
     API.modAtk({p:0,zone:'mz',index:0,card:orig},1000,0,'endTurn','テスト2');
     return dbOf(copy).atk===before;})());
ok('写し: Action に数値が literal で載る（再生で同じになる）',
   V41_ACTION_JOURNAL.some(x=>x.action.type==='TOKEN_CREATE'&&typeof x.action.atk==='number'));

/* =====================================================================
   5. 場からの収集と negative
   ===================================================================== */
resetT();
API.createTokens(0,'__テストトークン',2);
API.createTokens(0,'__別トークン',1);
gameState.players[0].mz.push(mkT(MON));
API.createTokens(1,'__テストトークン',1);
ok('収集: key で絞れる',API.tokensOf('__テストトークン').length===3);
ok('収集: プレイヤーでも絞れる',API.tokensOf('__テストトークン',0).length===2);
ok('収集: 種類が違えば拾わない',API.tokensOf('__別トークン').length===1);
ok('negative: 通常のモンスターはトークンではない',
   isTokenV11(gameState.players[0].mz[3])===false&&tokenKeyV11(gameState.players[0].mz[3])===null);
ok('negative: 未登録の定義では生成しない',
   API.createTokens(0,'__存在しない定義',1).length===0);

/* トークンは場を離れると消滅する（既存挙動） */
resetT();
let vUid=API.createTokens(0,'__テストトークン',1)[0];
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
ok('既存維持: トークンは墓地に残らない',
   gameState.players[0].mz.length===0&&gameState.players[0].grave.length===0);
resetT();
API.createTokens(0,'__テストトークン',1);
act({type:'FX_BOUNCE',player:0,zone:'mz',index:0,reason:'バウンス'});
ok('既存維持: トークンは手札に戻らない',
   gameState.players[0].mz.length===0&&gameState.players[0].hand.length===0);

/* v9 の離脱イベントと組み合わせられる */
resetT();
let wUid=API.createTokens(0,'__テストトークン',1)[0];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);clearEvtsT();
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
let lv=evtsT('onLeaveField');
ok('v9連携: トークンの消滅も離脱イベントで拾える',
   lv.length===1&&lv[0].uid===wUid,JSON.stringify(lv));
ok('v9連携: トークンは墓地へ行かないので行き先からは破壊と判定できない',
   lv[0].byDestroy===false&&lv[0].toZone===null);
ok('破壊判定: 消滅したトークンでも破壊されたか分かる',
   API.tokenWasDestroyed(lv[0])===true,JSON.stringify(lv[0]));
ok('破壊判定: 種類とコントローラーもイベントに載る',
   API.goneTokenKey(lv[0])==='__テストトークン'&&API.goneTokenController(lv[0])===0);
ok('破壊判定: 戦闘破壊ではない',API.tokenDestroyedByBattle(lv[0])===false);
ok('破壊判定: 記録は Action ごとに空になる（履歴を溜めない）',
   Array.isArray(gameState.tokensGoneV11)&&gameState.tokensGoneV11.length===0);
ok('破壊判定 negative: トークンでないイベントでは真にならない',
   API.tokenWasDestroyed({uid:wUid+999})===false);
resetT();
API.createTokens(0,'__テストトークン',1);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);clearEvtsT();
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'コスト',byDestroy:false});
ok('破壊判定 negative: 破壊以外の消滅では真にならない',
   API.tokenWasDestroyed(evtsT('onLeaveField')[0])===false
   &&evtsT('onLeaveField')[0].tokenGone===true);
/* 戦闘破壊のトークンは byBattle が立つ */
resetT();
API.createTokens(0,'__テストトークン',1);
gameState.players[0].mz[0].battleDestroyed=true;
gameState.fieldSnapV9=fieldSnapshotV9(gameState);clearEvtsT();
act({type:'BATTLE_CLEANUP'});
let blv=evtsT('onLeaveField');
ok('破壊判定: 戦闘破壊されたトークンを区別できる',
   blv.length===1&&API.tokenWasDestroyed(blv[0])===true
   &&API.tokenDestroyedByBattle(blv[0])===true,JSON.stringify(blv));
/* 同時に複数消えても1体ずつ判定できる */
resetT();
let mu=API.createTokens(0,'__テストトークン',3);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);clearEvtsT();
act({type:'FX_WIPE_ZONE',player:0,zone:'mz',reason:'全体破壊'});
let mlv=evtsT('onLeaveField');
ok('破壊判定: 同時に消えた3体を1体ずつ判定できる',
   mlv.length===3&&mlv.every(e=>API.tokenWasDestroyed(e)===true)
   &&new Set(mlv.map(e=>e.uid)).size===3,JSON.stringify(mlv.map(e=>e.uid)));

/* =====================================================================
   6. Replay / Undo / Redo / SaveLoad / Journal / digest
   ===================================================================== */
resetT();
let textBefore=v41StateDigestText(gameState);
ok('digest後方互換: トークンが無ければ digest 文字列に出ない',
   textBefore.indexOf('tokenV11')<0&&textBefore.indexOf('lastTokenV11')<0);
API.createTokens(0,'__テストトークン',2);
ok('Journal: TOKEN_CREATE が記録される',
   V41_ACTION_JOURNAL.map(x=>x.action.type).includes('TOKEN_CREATE'));
ok('digest: 2体のトークンが別物として現れる',
   (()=>{const t=v41StateDigestText(gameState);
     const u=gameState.players[0].mz.map(c=>c.uid);
     return t.indexOf(String(u[0]))>=0&&t.indexOf(String(u[1]))>=0&&u[0]!==u[1];})());
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: トークン生成が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
gameState=JSON.parse(snap);
ok('SaveLoad: 復元後もトークンの identity が残る',
   gameState.players[0].mz.every(c=>c.uid!=null&&c.tokenV11&&c.tokenV11.key==='__テストトークン'));
ok('SaveLoad: 生成結果も復元される',
   !!gameState.lastTokenV11&&gameState.lastTokenV11.created===2);
/* Undo / Redo */
resetT();
let digestU=v41StateDigest(gameState);
API.createTokens(0,'__テストトークン',1);
ok('Undo前提: トークンが出ている',gameState.players[0].mz.length===1);
undo();
ok('Undo: トークンが巻き戻る',gameState.players[0].mz.length===0);
ok('Undo: 元の digest に一致する',v41StateDigest(gameState)===digestU,
   'before='+digestU+' now='+v41StateDigest(gameState));
redo();
ok('Redo: トークンが復元される',
   gameState.players[0].mz.length===1&&gameState.players[0].mz[0].uid!=null);

/* 直列化の健全性 */
function scanFnsT(v,d){ if(d>12||v===null||typeof v!=='object')return typeof v==='function';
  return Object.keys(v).some(k=>typeof v[k]==='function'||scanFnsT(v[k],d+1)); }
ok('直列化: gameState 全体に関数が混入していない',
   !scanFnsT(JSON.parse(JSON.stringify(gameState)),0));
ok('直列化: トークン state に Map/Set/DOM/Promise が無い',
   assertTokenStateSerializableV11(gameState)===null,
   String(assertTokenStateSerializableV11(gameState)));
ok('無制限履歴なし: 生成結果は1件だけ',
   !Array.isArray(gameState.lastTokenV11)&&gameState.tokenLog===undefined);

/* =====================================================================
   7. 既存機構を壊していないこと
   ===================================================================== */
ok('既存維持: 旧 API.createToken も動く',
   (()=>{resetT();API.createToken(0,{name:'旧トークン',atk:100,def:200,lv:2},2);
     return gameState.players[0].mz.length===2
       &&dbOf(gameState.players[0].mz[0]).atk===100;})());
ok('既存維持: 旧 API 経由でも uid が付く',
   gameState.players[0].mz.every(c=>c.uid!=null));
ok('既存維持: トークンはエクシーズ素材にできない',
   (()=>{resetT();gameState.players[0].mz=[mkT(MON)];
     API.createTokens(0,'__テストトークン',1);
     act({type:'FX_OVERLAY',player:0,targetMz:0,from:'mz',fromIndex:1});
     return (gameState.players[0].mz[0].xyz||[]).length===0;})());
ok('既存維持: P4 述語はトークンに属さない',
   (()=>{resetT();API.createTokens(0,'__テストトークン',1);
     return cardCodeOfV4(gameState.players[0].mz[0])===0;})());
ok('既存維持: v10 の表示形式イベントもトークンで動く',
   (()=>{resetT();API.createTokens(0,'__テストトークン',1);
     gameState.posSnapV10=positionSnapshotV10(gameState);clearEvtsT();
     act({type:'TOGGLE_POS',player:0,zone:'mz',index:0});
     return evtsT('onPositionChange').length===1;})());

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
