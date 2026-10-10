/* System v12 — Activation event / ChainSource identity primitive 回帰テスト
   検証: 種類と細分類 / 発動プレイヤー / チェーンリンク identity /
         発動元の解決 / negative / Replay / Undo / Redo / SaveLoad /
         Journal / digest / 既存機構の非回帰                             */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
/* uid は engine の採番に任せる。 */
function mkA(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function resetA(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);
}
function evtsA(name){return (gameState.deferredEvents||[]).filter(e=>e.eventName===name).map(e=>e.evt);}
function clearEvtsA(){gameState.deferredEvents=[];}
/* 実際に CHAIN_ADD を通す（イベントは Action の中で積まれる） */
function activate(name,player,zone,index,card){
  const id=findCardIndex(name);
  act({type:'CHAIN_ADD',player,cardId:id,uid:card?card.uid:null,name,from:zone,index});
  return evtsA('onActivateSuccess').slice(-1)[0];
}
const NORMAL_SPELL='死者蘇生', QUICK_SPELL='サイクロン', CONT_SPELL='王宮の勅命';
const EQUIP_SPELL='団結の力', FIELD_SPELL='伝説の都 アトランティス';
const COUNTER_TRAP='天罰', NORMAL_TRAP='D2シールド';
const MON='ヂェミナイ・エルフ';

/* =====================================================================
   1. 種類と細分類
   ===================================================================== */
function kindCase(label,name,kind,sub){
  resetA();clearEvtsA();
  const c=mkA(name);gameState.players[0].sz=[c];
  const e=activate(name,0,'sz',0,c);
  ok('発動イベント: '+label,!!e&&e.kind===kind&&e.sub===sub,JSON.stringify(e));
  return e;
}
let e1=kindCase('通常魔法',NORMAL_SPELL,'spell','normal');
kindCase('速攻魔法',QUICK_SPELL,'spell','quick');
kindCase('永続魔法',CONT_SPELL==='王宮の勅命'?'魔法吸収':CONT_SPELL,'spell','continuous');
kindCase('装備魔法',EQUIP_SPELL,'spell','equip');
kindCase('フィールド魔法',FIELD_SPELL,'spell','field');
kindCase('通常罠',NORMAL_TRAP,'trap','normal');
kindCase('永続罠',CONT_SPELL,'trap','continuous');
let eC=kindCase('カウンター罠',COUNTER_TRAP,'trap','counter');
ok('判定ヘルパ: カウンター罠',isCounterTrapActivationV12(eC)===true);
ok('判定ヘルパ: 魔法ではない',isSpellActivationV12(eC)===false);
ok('判定ヘルパ: 罠である',isTrapActivationV12(eC)===true);
ok('判定ヘルパ: 細分類も指定できる',
   isTrapActivationV12(eC,'counter')===true&&isTrapActivationV12(eC,'normal')===false);
ok('判定ヘルパ: 通常魔法の判定',
   isSpellActivationV12(e1,'normal')===true&&isSpellActivationV12(e1,'quick')===false);

resetA();clearEvtsA();
let mon=mkA(MON);gameState.players[0].mz=[mon];
let eM=activate(MON,0,'mz',0,mon);
ok('発動イベント: モンスター効果',!!eM&&eM.kind==='monster'&&eM.sub==='effect',JSON.stringify(eM));
ok('判定ヘルパ: モンスター効果は魔法でも罠でもない',
   isSpellActivationV12(eM)===false&&isTrapActivationV12(eM)===false);

/* =====================================================================
   2. 発動プレイヤーと identity
   ===================================================================== */
resetA();clearEvtsA();
let foeCard=mkA(NORMAL_SPELL,1);gameState.players[1].sz=[foeCard];
let eF=activate(NORMAL_SPELL,1,'sz',0,foeCard);
ok('identity: 発動したプレイヤーを持つ',eF.player===1);
ok('identity: 発動元 uid を持つ',eF.uid===foeCard.uid);
ok('identity: 発動元カードを引ける',
   (()=>{const h=activationSourceV12(eF);return !!h&&h.card.uid===foeCard.uid;})());
ok('identity: チェーンリンク番号を持つ',eF.chainLink===1);
ok('identity: チェーンリンクを引ける',
   (()=>{const l=activationLinkV12(gameState,eF);return !!l&&l.chainId===eF.chainId;})());
ok('identity: カード名を payload に持たない',JSON.stringify(eF).indexOf('死者蘇生')<0);

/* 2連鎖 */
resetA();clearEvtsA();
let a1=mkA(NORMAL_SPELL,0),a2=mkA(QUICK_SPELL,1);
gameState.players[0].sz=[a1];gameState.players[1].sz=[a2];
activate(NORMAL_SPELL,0,'sz',0,a1);
activate(QUICK_SPELL,1,'sz',0,a2);
let all=evtsA('onActivateSuccess');
ok('チェーン: 2件とも発火する',all.length===2);
ok('チェーン: リンク番号が増える',all[0].chainLink===1&&all[1].chainLink===2);
ok('チェーン: chainId が別々',all[0].chainId!==all[1].chainId);
ok('直近の発動: 最後の1件だけ保持する',
   lastActivationV12(gameState).chainId===all[1].chainId);

/* =====================================================================
   3. negative
   ===================================================================== */
resetA();clearEvtsA();
act({type:'DRAW',player:0,n:1,byEffect:true});
ok('negative: 発動でない Action ではイベントを出さない',evtsA('onActivateSuccess').length===0);
resetA();clearEvtsA();
let tk=mkA(MON);gameState.players[0].mz=[tk];
act({type:'TOGGLE_POS',player:0,zone:'mz',index:0});
ok('negative: 表示形式の変更では発火しない',evtsA('onActivateSuccess').length===0);
resetA();clearEvtsA();
act({type:'CHAIN_ADD',player:0,cardId:-1,uid:null,name:'不明',from:'sz',index:0});
ok('negative: DBに無いカードでは発火しない',evtsA('onActivateSuccess').length===0);
ok('negative: 直近の発動も更新されない',lastActivationV12(gameState)===null);

/* =====================================================================
   4. Replay / Undo / Redo / SaveLoad / Journal / digest
   ===================================================================== */
resetA();
let textBefore=v41StateDigestText(gameState);
ok('digest後方互換: 発動が無ければ digest 文字列に出ない',
   textBefore.indexOf('lastActivationV12')<0);
let rc=mkA(NORMAL_SPELL);gameState.players[0].sz=[rc];
v41ResetActionJournal(gameState);
activate(NORMAL_SPELL,0,'sz',0,rc);
ok('Journal: CHAIN_ADD が記録される',
   V41_ACTION_JOURNAL.map(x=>x.action.type).includes('CHAIN_ADD'));
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: 発動イベントを含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
gameState=JSON.parse(snap);
ok('SaveLoad: 直近の発動も復元される',
   !!gameState.lastActivationV12&&gameState.lastActivationV12.kind==='spell');
resetA();
let uc=mkA(NORMAL_SPELL);gameState.players[0].sz=[uc];
v41ResetActionJournal(gameState);
let digestU=v41StateDigest(gameState);
activate(NORMAL_SPELL,0,'sz',0,uc);
ok('Undo前提: チェーンリンクが積まれている',gameState.chain.length===1);
undo();
ok('Undo: チェーンリンクが巻き戻る',gameState.chain.length===0);
ok('Undo: 元の digest に一致する',v41StateDigest(gameState)===digestU,
   'before='+digestU+' now='+v41StateDigest(gameState));
redo();
ok('Redo: チェーンリンクが復元される',
   gameState.chain.length===1&&!!gameState.lastActivationV12);

/* 直列化の健全性 */
function scanFnsA(v,d){ if(d>12||v===null||typeof v!=='object')return typeof v==='function';
  return Object.keys(v).some(k=>typeof v[k]==='function'||scanFnsA(v[k],d+1)); }
ok('直列化: gameState 全体に関数が混入していない',
   !scanFnsA(JSON.parse(JSON.stringify(gameState)),0));
ok('直列化: 発動記録に Map/Set/DOM/Promise が無い',
   assertActivationStateSerializableV12(gameState)===null,
   String(assertActivationStateSerializableV12(gameState)));
ok('無制限履歴なし: 発動記録は1件だけ',
   !Array.isArray(gameState.lastActivationV12)&&gameState.activationLog===undefined);

/* =====================================================================
   5. 既存機構を壊していないこと
   ===================================================================== */
ok('既存維持: onCardActivate は宣言のまま残す（発火経路を変えない）',
   EVENTS.indexOf('onCardActivate')>=0);
ok('既存維持: onCardActivate は v12 からは発火しない',
   (()=>{resetA();clearEvtsA();const c=mkA(NORMAL_SPELL);gameState.players[0].sz=[c];
     activate(NORMAL_SPELL,0,'sz',0,c);
     return evtsA('onCardActivate').length===0;})());
ok('既存維持: onActivateSuccess が追加されている',EVENTS.indexOf('onActivateSuccess')>=0);
ok('既存維持: 日本語名が引ける',eventJp('onActivateSuccess')==='カードが発動した時');
ok('既存維持: チェーンリンクの既存フィールドは変わらない',
   (()=>{resetA();const c=mkA(NORMAL_SPELL);gameState.players[0].sz=[c];
     activate(NORMAL_SPELL,0,'sz',0,c);
     const l=gameState.chain[0];
     return l.negated===false&&l.activationNegated===false&&l.effectNegated===false
       &&l.activationTurn===gameState.turn&&l.activationPhase==='main1';})());
ok('既存維持: v11 のトークン記録と併存する',
   (()=>{resetA();API.createToken(0,{name:'テスト',atk:0,def:0,lv:1},1);
     const c=mkA(NORMAL_SPELL);gameState.players[0].sz=[c];
     activate(NORMAL_SPELL,0,'sz',0,c);
     return !!gameState.lastTokenV11&&!!gameState.lastActivationV12;})());

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
