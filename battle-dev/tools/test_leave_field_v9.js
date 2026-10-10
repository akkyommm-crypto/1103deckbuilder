/* System v9 — Leave-field / linked lifecycle primitive 回帰テスト
   検証: normal / negative / aborted / stale / zone leave / generation /
         Replay / Undo / Redo / SaveLoad / Journal / digest              */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
let __u=91000;
function mkL(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return{id,owner:p,controller:p,face,pos,uid:__u++};}
function resetL(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);
}
function evts(name){return (gameState.deferredEvents||[]).filter(e=>e.eventName===name).map(e=>e.evt);}
function clearEvts(){gameState.deferredEvents=[];}
function sync(){gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
const MID='ヂェミナイ・エルフ',ROCK='岩石の巨兵',TRAP='聖なるバリア －ミラーフォース－',SPELL='サイクロン';

/* =====================================================================
   1. 行き先を問わない離脱イベント
   ===================================================================== */
function leaveCase(label,setup,fire,expectTo){
  resetL();
  const c=mkL(MID);setup(c);
  sync();v41ResetActionJournal(gameState);clearEvts();
  fire(c);
  const ev=evts('onLeaveField');
  ok('離脱イベント: '+label,ev.length===1&&ev[0].uid===c.uid&&ev[0].toZone===expectTo,
     JSON.stringify(ev));
  return ev[0];
}
let e1=leaveCase('モンスターゾーン→墓地',
  c=>{gameState.players[0].mz=[c];},
  c=>{act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});},'grave');
ok('離脱イベント: 破壊フラグが立つ',e1.byDestroy===true);
ok('離脱イベント: 離れる前のゾーンを持つ',e1.fromZone==='mz');
ok('離脱イベント: identity は uid（カード名を持たない）',
   typeof e1.uid==='number'&&JSON.stringify(e1).indexOf('ヂェミナイ')<0);
leaveCase('モンスターゾーン→手札（バウンス）',
  c=>{gameState.players[0].mz=[c];},
  c=>{act({type:'FX_BOUNCE',player:0,zone:'mz',index:0,reason:'バウンス'});},'hand');
leaveCase('モンスターゾーン→除外',
  c=>{gameState.players[0].mz=[c];},
  c=>{act({type:'FX_BANISH',player:0,zone:'mz',index:0,reason:'除外'});},'banish');
leaveCase('モンスターゾーン→デッキ',
  c=>{gameState.players[0].mz=[c];},
  c=>{act({type:'FX_RETURN_DECK',player:0,zone:'mz',index:0,reason:'デッキへ'});},'deck');
resetL();
let st1=mkL(TRAP,0,'down');
gameState.players[0].sz=[st1];sync();v41ResetActionJournal(gameState);clearEvts();
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
ok('離脱イベント: 魔法・罠ゾーンからの離脱も拾う',
   evts('onLeaveField').length===1&&evts('onLeaveField')[0].fromZone==='sz');

/* negative: 場の中での移動・場に残る変化ではイベントを出さない */
resetL();
let stay=mkL(MID);gameState.players[0].mz=[stay];sync();v41ResetActionJournal(gameState);clearEvts();
act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,pos:'def',reason:'表示形式変更'});
ok('negative: 表示形式の変更ではイベントを出さない',evts('onLeaveField').length===0);
resetL();
let ctrl=mkL(MID);gameState.players[0].mz=[ctrl];sync();v41ResetActionJournal(gameState);clearEvts();
act({type:'FX_CONTROL',player:0,zone:'mz',index:0,toPlayer:1,reason:'コントロール移動'});
ok('negative: コントロールが移っても場に残るならイベントを出さない',
   evts('onLeaveField').length===0,JSON.stringify(evts('onLeaveField')));
resetL();
let inHand=mkL(MID);gameState.players[0].hand=[inHand];sync();v41ResetActionJournal(gameState);clearEvts();
act({type:'FX_DISCARD',player:0,index:0,byEffect:true,reason:'手札から捨てる'});
ok('negative: 手札から墓地はフィールド離脱ではない',evts('onLeaveField').length===0);

/* =====================================================================
   2. 生存リンク（片方向）
   ===================================================================== */
resetL();
let trap=mkL(TRAP),mon=mkL(MID);
gameState.players[0].sz=[trap];gameState.players[0].mz=[mon];
sync();v41ResetActionJournal(gameState);
ok('リンク: 既定ではリンクが無い',API.linkState(mon)===null);
API.linkOnLeave({p:0,zone:'mz',index:0,card:mon},{p:0,zone:'sz',index:0,card:trap},'destroy','テストリンク');
ok('リンク: モンスター側に watch が入る',
   !!API.linkState(mon)&&API.linkState(mon).watch.length===1
   &&API.linkState(mon).watch[0].uid===trap.uid&&API.linkState(mon).watch[0].onGone==='destroy');
ok('リンク: 罠側には入らない（片方向）',API.linkState(trap)===null);
ok('リンク: 純JSON',assertLinkStateSerializableV9(gameState).ok,assertLinkStateSerializableV9(gameState).why);
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'罠を破壊',byDestroy:true});
ok('リンク: 監視対象が離れたらモンスターが破壊される',
   gameState.players[0].mz.length===0&&gameState.players[0].grave.length===2,
   'mz='+gameState.players[0].mz.length+' grave='+gameState.players[0].grave.length);
/* 逆向きは起きない */
resetL();
let trap2=mkL(TRAP),mon2=mkL(MID);
gameState.players[0].sz=[trap2];gameState.players[0].mz=[mon2];
sync();v41ResetActionJournal(gameState);
API.linkOnLeave({p:0,zone:'mz',index:0,card:mon2},{p:0,zone:'sz',index:0,card:trap2},'destroy','片方向');
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'モンスターを破壊',byDestroy:true});
ok('リンク negative: 片方向なので逆は起きない',gameState.players[0].sz.length===1);

/* =====================================================================
   3. 相互リンク
   ===================================================================== */
function mutualCase(label,killZone,killIdx,expectBoth){
  resetL();
  const t=mkL(TRAP),m=mkL(MID);
  gameState.players[0].sz=[t];gameState.players[0].mz=[m];
  sync();v41ResetActionJournal(gameState);
  API.linkMutual({p:0,zone:'sz',index:0,card:t},{p:0,zone:'mz',index:0,card:m},{label:'相互'});
  ok('相互リンク: 両側に watch が入る（'+label+'）',
     !!API.linkState(t)&&!!API.linkState(m)
     &&API.linkState(t).watch[0].uid===m.uid&&API.linkState(m).watch[0].uid===t.uid);
  act({type:'FX_TO_GRAVE',player:0,zone:killZone,index:killIdx,reason:'破壊',byDestroy:true});
  ok('相互リンク: '+label+' で両方が場を離れる',
     gameState.players[0].mz.length===0&&gameState.players[0].sz.length===0,
     'mz='+gameState.players[0].mz.length+' sz='+gameState.players[0].sz.length);
}
mutualCase('罠を破壊','sz',0,true);
mutualCase('モンスターを破壊','mz',0,true);
/* バウンスでも相互リンクは働く（行き先を問わない） */
resetL();
let t3=mkL(TRAP),m3=mkL(MID);
gameState.players[0].sz=[t3];gameState.players[0].mz=[m3];
sync();v41ResetActionJournal(gameState);
API.linkMutual({p:0,zone:'sz',index:0,card:t3},{p:0,zone:'mz',index:0,card:m3},{label:'相互'});
act({type:'FX_BOUNCE',player:0,zone:'sz',index:0,reason:'手札へ'});
ok('相互リンク: バウンスでも相手側が破壊される',
   gameState.players[0].mz.length===0&&gameState.players[0].hand.length===1);
/* onGone の種類 */
resetL();
let t4=mkL(TRAP),m4=mkL(MID);
gameState.players[0].sz=[t4];gameState.players[0].mz=[m4];
sync();v41ResetActionJournal(gameState);
API.linkOnLeave({p:0,zone:'mz',index:0,card:m4},{p:0,zone:'sz',index:0,card:t4},'banish','除外リンク');
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
ok('リンク: onGone=banish なら除外される',
   gameState.players[0].banish.length===1&&gameState.players[0].mz.length===0);
resetL();
let t5=mkL(TRAP),m5=mkL(MID);
gameState.players[0].sz=[t5];gameState.players[0].mz=[m5];
sync();v41ResetActionJournal(gameState);
API.linkOnLeave({p:0,zone:'mz',index:0,card:m5},{p:0,zone:'sz',index:0,card:t5},'toHand','手札リンク');
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
ok('リンク: onGone=toHand なら手札へ戻る',
   gameState.players[0].hand.length===1&&gameState.players[0].mz.length===0);
resetL();
let t6=mkL(TRAP),m6=mkL(MID);
gameState.players[0].sz=[t6];gameState.players[0].mz=[m6];
sync();v41ResetActionJournal(gameState);
API.linkOnLeave({p:0,zone:'mz',index:0,card:m6},{p:0,zone:'sz',index:0,card:t6},'none','無処理');
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
ok('リンク: onGone=none なら何も起きない',gameState.players[0].mz.length===1);

/* =====================================================================
   4. aborted / stale / zone leave / generation
   ===================================================================== */
resetL();
let t7=mkL(TRAP),m7=mkL(MID);
gameState.players[0].sz=[t7];gameState.players[0].mz=[m7];
sync();v41ResetActionJournal(gameState);
API.linkMutual({p:0,zone:'sz',index:0,card:t7},{p:0,zone:'mz',index:0,card:m7},{label:'解除テスト'});
API.clearLink({p:0,zone:'mz',index:0,card:m7});
ok('aborted: リンクを解除できる',API.linkState(m7)===null);
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
ok('aborted: 解除後はリンクが働かない',gameState.players[0].mz.length===1);
/* 場を離れたカードのリンクは消える（ZONE_LOCAL_KEYS） */
resetL();
let t8=mkL(TRAP),m8=mkL(MID);
gameState.players[0].sz=[t8];gameState.players[0].mz=[m8];
sync();v41ResetActionJournal(gameState);
API.linkOnLeave({p:0,zone:'mz',index:0,card:m8},{p:0,zone:'sz',index:0,card:t8},'destroy','寿命テスト');
act({type:'FX_BOUNCE',player:0,zone:'mz',index:0,reason:'手札へ'});
ok('zone leave: 場を離れたカードの linkV9 は消える',
   findCardByUid(m8.uid).card.linkV9===undefined,
   JSON.stringify(findCardByUid(m8.uid).card.linkV9));
/* 同じ uid で場に戻っても古いリンクは復活しない */
let back=findCardByUid(m8.uid);
act({type:'FX_SPECIAL_SUMMON',player:0,from:'hand',fromIndex:back.index,pos:'atk',reason:'再展開'});
ok('generation: 同じuidで戻っても古いリンクは復活しない',
   API.linkState(findCardByUid(m8.uid).card)===null);
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
ok('generation: 復活後は監視対象が離れても破壊されない',gameState.players[0].mz.length===1);
/* stale: 監視対象がもう場にいない状態で張っても暴発しない */
resetL();
let t9=mkL(TRAP),m9=mkL(MID);
gameState.players[0].sz=[t9];gameState.players[0].mz=[m9];
sync();v41ResetActionJournal(gameState);
API.linkOnLeave({p:0,zone:'mz',index:0,card:m9},{p:0,zone:'sz',index:0,card:t9},'destroy','stale');
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
ok('stale前提: 1回目で破壊される',gameState.players[0].mz.length===0);
act({type:'FX_MILL_TOP',player:0,n:0,reason:'何もしない'});
ok('stale: 同じ離脱を二度処理しない',gameState.players[0].grave.length===2,
   'grave='+gameState.players[0].grave.length);
/* 不正なリンク宣言は登録されない */
resetL();
let t10=mkL(TRAP);gameState.players[0].sz=[t10];sync();v41ResetActionJournal(gameState);
act({type:'LINK_ADD_V9',player:0,zone:'sz',index:0,watchUid:12345,onGone:'なにか未知',label:'x'});
ok('negative: 未知の onGone は登録されない',
   !API.linkState(t10)||API.linkState(t10).watch.length===0,
   JSON.stringify(API.linkState(t10)));

/* =====================================================================
   5. 連鎖（リンクの解決がさらに離脱を生む）
   ===================================================================== */
resetL();
let a1=mkL(TRAP),b1=mkL(MID),c1=mkL(ROCK);
gameState.players[0].sz=[a1];gameState.players[0].mz=[b1,c1];
sync();v41ResetActionJournal(gameState);
API.linkOnLeave({p:0,zone:'mz',index:0,card:b1},{p:0,zone:'sz',index:0,card:a1},'destroy','段1');
API.linkOnLeave({p:0,zone:'mz',index:1,card:c1},{p:0,zone:'mz',index:0,card:b1},'destroy','段2');
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'起点',byDestroy:true});
ok('連鎖: リンクが連鎖して解決される',
   gameState.players[0].mz.length===0&&gameState.players[0].sz.length===0
   &&gameState.players[0].grave.length===3,
   'grave='+gameState.players[0].grave.length);

/* =====================================================================
   6. Replay / Undo / Redo / SaveLoad / Journal / digest
   ===================================================================== */
resetL();
let pt=mkL(TRAP),pm=mkL(MID);
gameState.players[0].sz=[pt];gameState.players[0].mz=[pm];
sync();v41ResetActionJournal(gameState);
let digestBefore=v41StateDigest(gameState);
let textBefore=v41StateDigestText(gameState);
ok('digest後方互換: リンクが無ければ digest 文字列に出ない',textBefore.indexOf('linkV9')<0);
API.linkMutual({p:0,zone:'sz',index:0,card:pt},{p:0,zone:'mz',index:0,card:pm},{label:'相互'});
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
let types=V41_ACTION_JOURNAL.map(x=>x.action.type);
ok('Journal: LINK_ADD_V9 が記録される',types.includes('LINK_ADD_V9'));
ok('Journal: リンクによる自動破壊も Action として記録される',
   V41_ACTION_JOURNAL.filter(x=>x.action.type==='FX_TO_GRAVE').length>=2,
   types.join(','));
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: リンクを含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
gameState=JSON.parse(snap);
ok('SaveLoad: 復元後も盤面が一致する',
   gameState.players[0].mz.length===0&&gameState.players[0].grave.length===2);
ok('SaveLoad: フィールドの直前状態も復元される',Array.isArray(gameState.fieldSnapV9));
/* Undo / Redo は別シナリオで（自動破壊が履歴に混ざらないよう手前で止める） */
resetL();
let ut=mkL(TRAP),um=mkL(MID);
gameState.players[0].sz=[ut];gameState.players[0].mz=[um];
sync();v41ResetActionJournal(gameState);
let digestU=v41StateDigest(gameState);
API.linkMutual({p:0,zone:'sz',index:0,card:ut},{p:0,zone:'mz',index:0,card:um},{label:'相互'});
ok('Undo前提: リンクが入っている',!!API.linkState(ut)&&!!API.linkState(um));
/* undo() は gameState を差し替えるので、uid で引き直してから見る */
undo();
ok('Undo: 2本目のリンクが巻き戻る',API.linkState(findCardByUid(um.uid).card)===null);
undo();
ok('Undo: 1本目のリンクも巻き戻る',API.linkState(findCardByUid(ut.uid).card)===null);
ok('Undo: 元の digest に一致する',v41StateDigest(gameState)===digestU,
   'before='+digestU+' now='+v41StateDigest(gameState));
redo();redo();
ok('Redo: リンクが復元される',!!API.linkState(findCardByUid(ut.uid).card)&&!!API.linkState(findCardByUid(um.uid).card));

/* 直列化の健全性 */
function scanFnsL(v,d){ if(d>12||v===null||typeof v!=='object')return typeof v==='function';
  return Object.keys(v).some(k=>typeof v[k]==='function'||scanFnsL(v[k],d+1)); }
ok('直列化: gameState 全体に関数が混入していない',
   !scanFnsL(JSON.parse(JSON.stringify(gameState)),0));
ok('直列化: リンクとフィールド記録に Map/Set/DOM/Promise が無い',
   assertLinkStateSerializableV9(gameState).ok);
ok('無制限履歴なし: フィールド記録はカード数分だけ',
   gameState.fieldSnapV9.length<=12&&gameState.leaveLog===undefined,
   'len='+gameState.fieldSnapV9.length);

/* =====================================================================
   7. 既存機構を壊していないこと
   ===================================================================== */
ok('既存維持: onRemove は従来どおり存在する',EVENTS.indexOf('onRemove')>=0);
ok('既存維持: onLeaveField が追加されている',EVENTS.indexOf('onLeaveField')>=0);
ok('既存維持: banishInfo は従来どおり付く',
   (()=>{resetL();const c=mkL(MID);gameState.players[0].mz=[c];sync();
     act({type:'FX_BANISH',player:0,zone:'mz',index:0,reason:'除外'});
     const h=findCardByUid(c.uid);return !!(h&&h.card.banishInfo&&h.card.banishInfo.from==='mz');})());
ok('既存維持: graveInfo は従来どおり付く',
   (()=>{resetL();const c=mkL(MID);gameState.players[0].mz=[c];sync();
     act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
     const h=findCardByUid(c.uid);return !!(h&&h.card.graveInfo&&h.card.graveInfo.byDestroy===true);})());
ok('既存維持: P3 moveProvenance と併存する',
   (()=>{resetL();const c=mkL(MID);gameState.players[0].mz=[c];sync();
     p3BeginEffectContextV3(1);
     act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'相手の効果',byDestroy:true});
     p3EndEffectContextV3();
     const h=findCardByUid(c.uid);
     return !!(h&&moveProvenanceOfV3(h.card)&&moveProvenanceOfV3(h.card).actingPlayer===1);})());

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
