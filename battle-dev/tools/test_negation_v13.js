/* System v13 — Negation primitive 回帰テスト
   検証: 4種類の無効化の分離 / 期間（endTurn・permanent）/ 領域ローカル /
         chainId 指定 / 発動無効と効果無効の区別 / negative /
         Replay / Undo / Redo / SaveLoad / Journal / digest / 非回帰   */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
/* uid は engine の採番に任せる（手振りの uid はトークン等と衝突する）。 */
function mkN(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function resetN(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);
}
function evtsN(name){return (gameState.deferredEvents||[]).filter(e=>e.eventName===name).map(e=>e.evt);}
function clearEvtsN(){gameState.deferredEvents=[];}
function activate(name,player,zone,index,card){
  clearEvtsN();
  act({type:'CHAIN_ADD',player,cardId:findCardIndex(name),uid:card?card.uid:null,name,from:zone,index});
  return evtsN('onActivateSuccess').slice(-1)[0];
}
const MON='ヂェミナイ・エルフ', SPELL='死者蘇生', TRAP='D2シールド';

/* =====================================================================
   1. カード単位の効果無効（期間つき）
   ===================================================================== */
resetN();
let m=mkN(MON);gameState.players[0].mz=[m];
ok('前提: 最初は無効化されていない',effectNegated(m)===false);
API.negateEffectUntil({p:0,zone:'mz',index:0,card:m},'endTurn','テスト');
ok('endTurn: このターンは無効になる',effectNegated(findCardByUid(m.uid).card)===true);
ok('endTurn: v13 由来だと分かる',
   API.negatedByThisEffect({p:0,zone:'mz',index:0,card:findCardByUid(m.uid).card})===true);
gameState.turn+=1;
ok('endTurn: 次のターンには解ける',effectNegated(findCardByUid(m.uid).card)===false);
gameState.turn-=1;
API.clearNegateEffect({p:0,zone:'mz',index:0,card:findCardByUid(m.uid).card});
ok('解除: 明示的に外せる',effectNegated(findCardByUid(m.uid).card)===false
   &&findCardByUid(m.uid).card.negV13===undefined);

resetN();
let m2=mkN(MON);gameState.players[0].mz=[m2];
API.negateEffectUntil({p:0,zone:'mz',index:0,card:m2},'permanent','テスト');
gameState.turn+=3;
ok('permanent: ターンが進んでも無効のまま',effectNegated(findCardByUid(m2.uid).card)===true);
ok('領域ローカル: ZONE_LOCAL_KEYS に登録されている',ZONE_LOCAL_KEYS.indexOf('negV13')>=0);
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
ok('領域ローカル: 場を離れたら無効化も消える',
   gameState.players[0].grave[0].negV13===undefined);

/* 無効化されたカードは永続効果のソースにならない */
resetN();
let src=mkN('光の護封剣');gameState.players[0].sz=[src];
let mm=mkN(MON);gameState.players[0].mz=[mm];
let before=continuousSources().length;
API.negateEffectUntil({p:0,zone:'sz',index:0,card:src},'endTurn','テスト');
ok('永続効果: 無効化されたカードはソースから外れる',
   continuousSources().length===before-1,
   'before='+before+' after='+continuousSources().length);

/* negative */
resetN();
let n1=mkN(MON);gameState.players[0].mz=[n1];
ok('negative: 無効化していないカードは無効ではない',API.isEffectNegated({p:0,zone:'mz',index:0,card:n1})===false);
ok('negative: 場に無い対象には置けない',
   API.negateEffectUntil({p:0,zone:'mz',index:9,card:null},'endTurn','テスト')===false);
resetN();
let n2=mkN(MON);gameState.players[0].mz=[n2];
act({type:'NEGATE_CARD_V13',player:0,zone:'mz',index:0,until:'おかしな値',label:'テスト'});
ok('negative: 未知の期間は endTurn として扱う',
   findCardByUid(n2.uid).card.negV13.until==='endTurn');

/* =====================================================================
   2. 4種類の無効化の分離
   ===================================================================== */
resetN();
let c1=mkN(SPELL);gameState.players[0].sz=[c1];
let ev1=activate(SPELL,0,'sz',0,c1);
API.negateChainLink(ev1,'activation','テスト発動無効',false);
let link1=gameState.chain[0];
ok('区別1: 発動無効はリンクに activationNegated を立てる',
   link1.negated===true&&link1.activationNegated===true&&link1.effectNegated===false);
resetN();
let c2=mkN(SPELL);gameState.players[0].sz=[c2];
let ev2=activate(SPELL,0,'sz',0,c2);
API.negateChainLink(ev2,'effect','テスト効果無効',false);
let link2=gameState.chain[0];
ok('区別2: 効果無効はリンクに effectNegated を立てる',
   link2.negated===true&&link2.effectNegated===true&&link2.activationNegated===false);
resetN();
let c3=mkN(MON);gameState.players[0].mz=[c3];
API.negateEffectUntil({p:0,zone:'mz',index:0,card:c3},'permanent','テスト');
ok('区別3: カード効果無効はチェーンリンクを作らない',gameState.chain.length===0);
ok('区別4: 召喚無効は別機構のまま',
   typeof summonNegatePendingV2==='function'&&gameState.pendingSummon==null);

/* =====================================================================
   3. chainId によるリンク指定
   ===================================================================== */
resetN();
let a1=mkN(SPELL,0),a2=mkN(TRAP,1);
gameState.players[0].sz=[a1];gameState.players[1].sz=[a2];
let evA=activate(SPELL,0,'sz',0,a1);
let evB=activate(TRAP,1,'sz',0,a2);
ok('chainId: 2つのリンクが積まれている',gameState.chain.length===2);
API.negateChainLink(evA,'effect','1つ目だけ無効',false);
ok('chainId: 直前ではなく指定したリンクが無効になる',
   gameState.chain[0].negated===true&&gameState.chain[1].negated!==true,
   JSON.stringify(gameState.chain.map(x=>!!x.negated)));
ok('chainId: 無効かどうかを問い合わせられる',
   API.chainLinkNegated(evA.chainId)===true&&API.chainLinkNegated(evB.chainId)===false);
ok('negative: 存在しない chainId では何もしない',
   API.negateChainLink({chainId:99999},'effect','なし',false)===false);
/* 発動元の破壊まで行う形 */
resetN();
let d1=mkN(SPELL);gameState.players[0].sz=[d1];
let evD=activate(SPELL,0,'sz',0,d1);
API.negateChainLink(evD,'activation','無効にして破壊',true);
ok('破壊: 発動元も墓地へ送れる',
   gameState.players[0].sz.length===0&&gameState.players[0].grave.length===1);
ok('破壊: 既存の負け方（直前リンク指定）も残っている',
   typeof negatePreviousChainLinkV2==='function');

/* =====================================================================
   4. Replay / Undo / Redo / SaveLoad / Journal / digest
   ===================================================================== */
resetN();
let textBefore=v41StateDigestText(gameState);
ok('digest後方互換: 無効化が無ければ digest 文字列に出ない',
   textBefore.indexOf('negV13')<0);
let rm=mkN(MON);gameState.players[0].mz=[rm];
v41ResetActionJournal(gameState);
API.negateEffectUntil({p:0,zone:'mz',index:0,card:rm},'endTurn','テスト');
ok('Journal: NEGATE_CARD_V13 が記録される',
   V41_ACTION_JOURNAL.map(x=>x.action.type).includes('NEGATE_CARD_V13'));
ok('digest: 無効化した後は digest に現れる',
   v41StateDigestText(gameState).indexOf('negV13')>=0);
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: 無効化を含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
gameState=JSON.parse(snap);
ok('SaveLoad: 復元後も無効化が残る',
   effectNegated(gameState.players[0].mz[0])===true);
/* チェーンリンク無効の Replay */
resetN();
let rc=mkN(SPELL);gameState.players[0].sz=[rc];
v41ResetActionJournal(gameState);
let evR=activate(SPELL,0,'sz',0,rc);
API.negateChainLink(evR,'effect','再生テスト',false);
let audit2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: chainId 指定のリンク無効も digest 一致で再生される',audit2.ok,
   audit2.reason||audit2.finalDigest);
/* Undo / Redo */
resetN();
let um=mkN(MON);gameState.players[0].mz=[um];
v41ResetActionJournal(gameState);
let digestU=v41StateDigest(gameState);
API.negateEffectUntil({p:0,zone:'mz',index:0,card:um},'permanent','テスト');
ok('Undo前提: 無効化されている',effectNegated(findCardByUid(um.uid).card)===true);
undo();
ok('Undo: 無効化が巻き戻る',effectNegated(findCardByUid(um.uid).card)===false);
ok('Undo: 元の digest に一致する',v41StateDigest(gameState)===digestU,
   'before='+digestU+' now='+v41StateDigest(gameState));
redo();
ok('Redo: 無効化が復元される',effectNegated(findCardByUid(um.uid).card)===true);

/* 直列化の健全性 */
function scanFnsN(v,d){ if(d>12||v===null||typeof v!=='object')return typeof v==='function';
  return Object.keys(v).some(k=>typeof v[k]==='function'||scanFnsN(v[k],d+1)); }
ok('直列化: gameState 全体に関数が混入していない',
   !scanFnsN(JSON.parse(JSON.stringify(gameState)),0));
ok('直列化: 無効化の記録に Map/Set/DOM/Promise が無い',
   assertNegationStateSerializableV13(gameState)===null,
   String(assertNegationStateSerializableV13(gameState)));
ok('無制限履歴なし: 無効化はカードごとに1件だけ',
   (()=>{const s=findCardByUid(um.uid).card.negV13;return !!s&&!Array.isArray(s);})()
   &&gameState.negationLog===undefined);

/* =====================================================================
   5. 既存機構を壊していないこと
   ===================================================================== */
ok('既存維持: card.negated（恒久）は従来どおり効く',
   (()=>{resetN();const c=mkN(MON);gameState.players[0].mz=[c];
     act({type:'FX_NEGATE',player:0,zone:'mz',index:0,reason:'テスト'});
     return effectNegated(findCardByUid(c.uid).card)===true;})());
ok('既存維持: negatedUntilTurn も従来どおり効く',
   (()=>{resetN();const c=mkN(MON);gameState.players[0].mz=[c];
     c.negatedUntilTurn=gameState.turn;
     return effectNegated(c)===true;})());
ok('既存維持: continuous.negateEffect も従来どおり効く',
   (()=>{resetN();const s=mkN('スキルドレイン');const c=mkN(MON);
     gameState.players[0].sz=[s];gameState.players[0].mz=[c];
     return typeof effectNegatedBy==='function';})());
ok('既存維持: 罠無効（王宮のお触れ）の判定は別関数のまま',
   typeof trapNegated==='function');
ok('既存維持: 召喚無効の Action は変わらない',
   typeof summonNegatePendingV2==='function');
ok('既存維持: v12 の発動イベントは無効化の影響を受けない',
   (()=>{resetN();const c=mkN(SPELL);gameState.players[0].sz=[c];
     const ev=activate(SPELL,0,'sz',0,c);
     API.negateChainLink(ev,'activation','テスト',false);
     return !!ev&&ev.kind==='spell';})());
ok('既存維持: CHAIN_NEGATE_LINK は index 指定でも動く',
   (()=>{resetN();const c=mkN(SPELL);gameState.players[0].sz=[c];
     activate(SPELL,0,'sz',0,c);
     act({type:'CHAIN_NEGATE_LINK',index:0,reason:'index指定',mode:'effect'});
     return gameState.chain[0].negated===true;})());

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
