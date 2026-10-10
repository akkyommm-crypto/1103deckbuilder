/* System v10 — Position event / forced-position primitive 回帰テスト
   検証: 変更イベント / 強制表示形式 / 変更ロック / 追加ウィンドウ /
         negative / zone-local / Replay / Undo / Redo / SaveLoad /
         Journal / digest / 既存機構の非回帰                            */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
let __u=93000;
function mkP(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return{id,owner:p,controller:p,face,pos,uid:__u++};}
function resetP(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);
}
function evtsP(name){return (gameState.deferredEvents||[]).filter(e=>e.eventName===name).map(e=>e.evt);}
function clearEvtsP(){gameState.deferredEvents=[];}
function syncP(){gameState.posSnapV10=positionSnapshotV10(gameState);
  gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
/* 素材カードは「実装済みだと誤認されない」よう、既に TESTED のカードだけ使う。
   このファイルは script_coverage の NON_CARD_TEST_FILES に入れてあるので
   ここにカード名が出ても TESTED へ昇格しない。 */
const MON='ヂェミナイ・エルフ',MON2='岩石の巨兵',SRC='くず鉄のかかし';
/* 合成の永続効果ソース。カード個別実装ではなく共通機構の検査用。 */
const SAVED_SRC=CARD_SCRIPTS[SRC];
function useSource(cont){ CARD_SCRIPTS[SRC]=Object.assign({type:'trap'},{continuous:cont}); }
function dropSource(){ if(SAVED_SRC) CARD_SCRIPTS[SRC]=SAVED_SRC; else delete CARD_SCRIPTS[SRC]; }

/* =====================================================================
   1. 表示形式変更イベント
   ===================================================================== */
function posCase(label,setup,fire,expect){
  resetP();
  const c=mkP(MON);setup(c);
  syncP();v41ResetActionJournal(gameState);clearEvtsP();
  fire(c);
  const ev=evtsP('onPositionChange');
  const e=ev[0]||{};
  ok('変更イベント: '+label,
     ev.length===1&&e.uid===c.uid&&e.fromFace===expect.fromFace&&e.fromPos===expect.fromPos
     &&e.toFace===expect.toFace&&e.toPos===expect.toPos,JSON.stringify(ev));
  return e;
}
let ev1=posCase('攻撃表示→表側守備表示',
  c=>{gameState.players[0].mz=[c];},
  ()=>{act({type:'TOGGLE_POS',player:0,zone:'mz',index:0});},
  {fromFace:'up',fromPos:'atk',toFace:'up',toPos:'def'});
ok('変更イベント: identity は uid（カード名を持たない）',
   typeof ev1.uid==='number'&&JSON.stringify(ev1).indexOf('ヂェミナイ')<0);
ok('変更イベント: 攻撃表示→表側守備の判定ヘルパ',turnedToFaceUpDefenseV10(ev1)===true);
posCase('表側守備表示→攻撃表示',
  c=>{c.pos='def';gameState.players[0].mz=[c];},
  ()=>{act({type:'TOGGLE_POS',player:0,zone:'mz',index:0});},
  {fromFace:'up',fromPos:'def',toFace:'up',toPos:'atk'});
let ev3=posCase('裏側守備→表側攻撃（反転召喚の経路）',
  c=>{c.face='down';c.pos='def';gameState.players[0].mz=[c];},
  ()=>{act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,face:'up',pos:'atk',reason:'反転召喚成功'});},
  {fromFace:'down',fromPos:'def',toFace:'up',toPos:'atk'});
ok('変更イベント: 裏→表の判定ヘルパ',turnedFaceUpV10(ev3)===true);
ok('変更イベント: 反転召喚の経路では v10 は onFlip を出さない（二重発火の防止）',
   evtsP('onFlip').length===0,JSON.stringify(evtsP('onFlip')));
let ev4=posCase('表側攻撃→裏側守備',
  c=>{gameState.players[0].mz=[c];},
  ()=>{act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,face:'down',pos:'def',reason:'裏側守備に'});},
  {fromFace:'up',fromPos:'atk',toFace:'down',toPos:'def'});
ok('変更イベント: 表→裏は「裏→表」ではない',turnedFaceUpV10(ev4)===false);

/* 効果で裏側から表側にした場合だけ onFlip も出す */
resetP();
let fc=mkP(MON,0,'down','def');gameState.players[0].mz=[fc];
syncP();v41ResetActionJournal(gameState);clearEvtsP();
API.flipFaceUpByEffect({p:0,zone:'mz',index:0,card:fc},'atk','効果で表側表示に');
ok('効果反転: onPositionChange が出る',evtsP('onPositionChange').length===1);
ok('効果反転: リバース効果のため onFlip も出る',
   evtsP('onFlip').length===1&&evtsP('onFlip')[0].byEffect===true,JSON.stringify(evtsP('onFlip')));
ok('効果反転: フィールド上で発動した扱いになる',evtsP('onFlip')[0].treatAsField===true);
resetP();
let fu=mkP(MON,0,'up','atk');gameState.players[0].mz=[fu];syncP();clearEvtsP();
ok('効果反転: 既に表側なら何もしない',
   API.flipFaceUpByEffect({p:0,zone:'mz',index:0,card:fu})===false&&evtsP('onPositionChange').length===0);

/* negative */
resetP();
let nc=mkP(MON);gameState.players[0].mz=[nc];syncP();v41ResetActionJournal(gameState);clearEvtsP();
act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,pos:'atk',reason:'同じ表示形式'});
ok('negative: 変化が無ければイベントを出さない',evtsP('onPositionChange').length===0);
resetP();
let lc=mkP(MON);gameState.players[0].mz=[lc];syncP();v41ResetActionJournal(gameState);clearEvtsP();
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
ok('negative: 場を離れた時は表示形式イベントを出さない（v9の担当）',
   evtsP('onPositionChange').length===0&&evtsP('onLeaveField').length===1);
resetP();
gameState.players[0].mz=[];syncP();clearEvtsP();
let inc=mkP(MON2);gameState.players[0].mz=[inc];
v10DetectPositionChange(gameState,null);
ok('negative: 場に出てきたカードは変更ではない',evtsP('onPositionChange').length===0);
resetP();
let hc=mkP(MON);gameState.players[0].hand=[hc];syncP();clearEvtsP();
act({type:'FX_DISCARD',player:0,index:0,byEffect:true,reason:'手札から捨てる'});
ok('negative: 手札のカードは表示形式の対象外',evtsP('onPositionChange').length===0);
resetP();
let sc2=mkP(MON,0,'down','def');gameState.players[0].sz=[sc2];syncP();clearEvtsP();
act({type:'FX_SET_STATE',player:0,zone:'sz',index:0,face:'up',reason:'セットを表に'});
ok('negative: 魔法・罠ゾーンは表示形式イベントの対象外',evtsP('onPositionChange').length===0);

/* =====================================================================
   2. 永続の強制表示形式
   ===================================================================== */
function forcedScene(cont,setup){
  resetP();
  const src=mkP(SRC,0,'up');gameState.players[0].sz=[src];
  useSource(cont);
  setup&&setup();
  syncP();v41ResetActionJournal(gameState);clearEvtsP();
  enforceForcedPositionV10(gameState);
  return src;
}
/* レベル4以上は守備表示になる（レベル制限B地区の形） */
const lvDef={scope:'allMonsters',forcedPosition:(c)=>curLV(c)>=4?'def':null};
let a1=mkP(MON),a2=mkP(MON,1);
forcedScene(lvDef,()=>{gameState.players[0].mz=[a1];gameState.players[1].mz=[a2];});
ok('強制表示形式: 自分のモンスターが守備表示になる',gameState.players[0].mz[0].pos==='def');
ok('強制表示形式: 相手のモンスターも守備表示になる',gameState.players[1].mz[0].pos==='def');
ok('強制表示形式: Journal に Action として残る',
   V41_ACTION_JOURNAL.filter(x=>x.action.type==='FX_SET_STATE').length===2,
   JSON.stringify(V41_ACTION_JOURNAL.map(x=>x.action.type)));
ok('強制表示形式: イベントも出る',evtsP('onPositionChange').length===2);
let b1=mkP(MON);b1.pos='def';
forcedScene(lvDef,()=>{gameState.players[0].mz=[b1];});
ok('negative: 既に守備表示なら Action を出さない',V41_ACTION_JOURNAL.length===0);
let b2=mkP(MON,0,'down','def');
forcedScene(lvDef,()=>{gameState.players[0].mz=[b2];});
ok('negative: 裏側表示のモンスターは対象外',V41_ACTION_JOURNAL.length===0&&gameState.players[0].mz[0].face==='down');
/* レベル3以下は攻撃表示になる（レベル制限A地区の形） */
let c1=mkP('魂を削る死霊');
forcedScene({scope:'allMonsters',forcedPosition:(c)=>curLV(c)<=3?'atk':null},()=>{
  c1.pos='def';gameState.players[0].mz=[c1];});
ok('強制表示形式: 低レベルを攻撃表示に固定する形も同じ機構で書ける',gameState.players[0].mz[0].pos==='atk');
/* 相手だけを対象にする */
let d1=mkP(MON),d2=mkP(MON,1);
forcedScene({scope:'oppMonsters',forcedPosition:()=>'def'},()=>{
  gameState.players[0].mz=[d1];gameState.players[1].mz=[d2];});
ok('強制表示形式: scope で相手のモンスターだけに掛けられる',
   gameState.players[0].mz[0].pos==='atk'&&gameState.players[1].mz[0].pos==='def');
/* ソースが場を離れたら強制は終わる */
let e1b=mkP(MON);
forcedScene(lvDef,()=>{gameState.players[0].mz=[e1b];});
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
act({type:'TOGGLE_POS',player:0,zone:'mz',index:0});
enforceForcedPositionV10(gameState);
ok('強制表示形式: ソースが場を離れたら固定は解ける',gameState.players[0].mz[0].pos==='atk');
/* 裏側のソースは効かない */
let f1=mkP(MON);
resetP();
let fsrc=mkP(SRC,0,'down');gameState.players[0].sz=[fsrc];useSource(lvDef);
gameState.players[0].mz=[f1];syncP();v41ResetActionJournal(gameState);
enforceForcedPositionV10(gameState);
ok('negative: 裏側のソースでは強制が働かない',gameState.players[0].mz[0].pos==='atk');
/* 無限ループしない */
let g1=mkP(MON);
resetP();
let gsrc=mkP(SRC,0,'up');gameState.players[0].sz=[gsrc];
useSource({scope:'allMonsters',forcedPosition:(c)=>c.pos==='atk'?'def':'atk'});
gameState.players[0].mz=[g1];syncP();v41ResetActionJournal(gameState);
let loops=enforceForcedPositionV10(gameState);
ok('安全弁: 矛盾した強制でも有限回で止まる',loops<=16&&loops>0,'loops='+loops);

/* =====================================================================
   3. 表示形式変更のロック
   ===================================================================== */
resetP();
let lsrc=mkP(SRC,0,'up');gameState.players[0].sz=[lsrc];
useSource({scope:'oppMonsters',cannotChangePosition:()=>true});
let lm0=mkP(MON),lm1=mkP(MON,1);
gameState.players[0].mz=[lm0];gameState.players[1].mz=[lm1];syncP();
ok('ロック: 対象のモンスターは手動で変更できない',canManualPositionChange(lm1)===false);
ok('ロック: API から問い合わせられる',API.cannotChangePosition({p:1,zone:'mz',index:0,card:lm1})===true);
ok('negative: 範囲外のモンスターは従来どおり変更できる',canManualPositionChange(lm0)===true);
resetP();
let ksrc=mkP(SRC,0,'up');gameState.players[0].sz=[ksrc];
useSource(lvDef);
let km=mkP(MON);km.pos='def';gameState.players[0].mz=[km];syncP();
ok('ロック: 強制表示形式が掛かっている間も手動変更できない',canManualPositionChange(km)===false);

/* =====================================================================
   4. 追加の変更ウィンドウ
   ===================================================================== */
resetP();
let wsrc=mkP(SRC,0,'up');gameState.players[0].sz=[wsrc];
useSource({scope:'allMonsters',positionWindow:()=>['end']});
let wm=mkP(MON);gameState.players[0].mz=[wm];syncP();
gameState.phase='main1';
act({type:'TOGGLE_POS',player:0,zone:'mz',index:0});
ok('追加ウィンドウ: メインで1回変更した後は通常どおり変更できない',
   canManualPositionChange(gameState.players[0].mz[0])===false);
gameState.phase='end';
ok('追加ウィンドウ: エンドフェイズには追加で変更できる',
   canManualPositionChange(gameState.players[0].mz[0])===true);
act({type:'TOGGLE_POS',player:0,zone:'mz',index:0});
ok('追加ウィンドウ: 使うと同じターンには再度使えない',
   canManualPositionChange(gameState.players[0].mz[0])===false&&
   gameState.players[0].mz[0].posWindowUsedTurnV10===gameState.turn);
gameState.turn+=2;
ok('追加ウィンドウ: 次の自分のターンには戻る',
   canManualPositionChange(gameState.players[0].mz[0])===true);
/* 領域ローカル: 場を離れたら使用済み記録も消える */
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
ok('領域ローカル: 場を離れたら使用済み記録が消える',
   gameState.players[0].grave[0].posWindowUsedTurnV10===undefined);
ok('領域ローカル: ZONE_LOCAL_KEYS に登録されている',
   ZONE_LOCAL_KEYS.indexOf('posWindowUsedTurnV10')>=0);
/* negative: ウィンドウが無ければエンドフェイズには変更できない */
resetP();
let nw=mkP(MON);gameState.players[0].mz=[nw];syncP();gameState.phase='end';
ok('negative: 追加ウィンドウが無ければメイン以外では変更できない',canManualPositionChange(nw)===false);
dropSource();

/* =====================================================================
   5. Replay / Undo / Redo / SaveLoad / Journal / digest
   ===================================================================== */
resetP();
let rm=mkP(MON),rm2=mkP(MON2);
gameState.players[0].mz=[rm,rm2];syncP();v41ResetActionJournal(gameState);
let textBefore=v41StateDigestText(gameState);
ok('digest後方互換: 追加ウィンドウ未使用なら digest 文字列に出ない',
   textBefore.indexOf('posWindowUsedTurnV10')<0);
act({type:'TOGGLE_POS',player:0,zone:'mz',index:0});
act({type:'FX_SET_STATE',player:0,zone:'mz',index:1,face:'down',pos:'def',reason:'裏側守備に'});
let types=V41_ACTION_JOURNAL.map(x=>x.action.type);
ok('Journal: 表示形式の変更が Action として残る',
   types.includes('TOGGLE_POS')&&types.includes('FX_SET_STATE'),JSON.stringify(types));
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: 表示形式の変更が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
gameState=JSON.parse(snap);
ok('SaveLoad: 復元後も表示形式が一致する',
   gameState.players[0].mz[0].pos==='def'&&gameState.players[0].mz[1].face==='down');
ok('SaveLoad: 直前状態も復元される',Array.isArray(gameState.posSnapV10));
/* 強制表示形式を含む進行も再生できる */
resetP();
let rsrc=mkP(SRC,0,'up');gameState.players[0].sz=[rsrc];
useSource(lvDef);
let rfm=mkP(MON);gameState.players[0].mz=[rfm];syncP();v41ResetActionJournal(gameState);
enforceForcedPositionV10(gameState);
let audit2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: 永続強制による自動変更も digest 一致で再生される',audit2.ok,audit2.reason||audit2.finalDigest);
dropSource();
/* Undo / Redo は自動処理が混ざらない単独シナリオで見る */
resetP();
let um=mkP(MON);gameState.players[0].mz=[um];syncP();v41ResetActionJournal(gameState);
let digestU=v41StateDigest(gameState);
act({type:'TOGGLE_POS',player:0,zone:'mz',index:0});
ok('Undo前提: 表示形式が変わっている',findCardByUid(um.uid).card.pos==='def');
undo();
ok('Undo: 表示形式が巻き戻る',findCardByUid(um.uid).card.pos==='atk');
ok('Undo: 元の digest に一致する',v41StateDigest(gameState)===digestU,
   'before='+digestU+' now='+v41StateDigest(gameState));
redo();
ok('Redo: 表示形式が復元される',findCardByUid(um.uid).card.pos==='def');

/* 直列化の健全性 */
function scanFnsP(v,d){ if(d>12||v===null||typeof v!=='object')return typeof v==='function';
  return Object.keys(v).some(k=>typeof v[k]==='function'||scanFnsP(v[k],d+1)); }
ok('直列化: gameState 全体に関数が混入していない',
   !scanFnsP(JSON.parse(JSON.stringify(gameState)),0));
ok('直列化: 表示形式の記録に Map/Set/DOM/Promise が無い',
   assertPositionStateSerializableV10(gameState)===null,
   String(assertPositionStateSerializableV10(gameState)));
ok('無制限履歴なし: 直前状態はモンスター数分だけ',
   gameState.posSnapV10.length<=10&&gameState.positionLog===undefined,
   'len='+gameState.posSnapV10.length);

/* =====================================================================
   6. 既存機構を壊していないこと
   ===================================================================== */
ok('既存維持: onFlip は従来どおり存在する',EVENTS.indexOf('onFlip')>=0);
ok('既存維持: onLeaveField は従来どおり存在する',EVENTS.indexOf('onLeaveField')>=0);
ok('既存維持: onPositionChange が追加されている',EVENTS.indexOf('onPositionChange')>=0);
ok('既存維持: 日本語名が引ける',eventJp('onPositionChange')==='表示形式が変わった時');
resetP();
let xm=mkP(MON);gameState.players[0].mz=[xm];syncP();
ok('既存維持: 召喚したターンは表示形式を変更できない',
   (()=>{xm.summonedTurn=gameState.turn;const r=canManualPositionChange(xm);delete xm.summonedTurn;return r===false;})());
ok('既存維持: 攻撃したモンスターは変更できない',
   (()=>{xm.attacked=true;const r=canManualPositionChange(xm);delete xm.attacked;return r===false;})());
ok('既存維持: 1ターンに2回は変更できない',
   (()=>{xm.positionChangedTurn=gameState.turn;const r=canManualPositionChange(xm);
         delete xm.positionChangedTurn;return r===false;})());
ok('既存維持: 通常の条件では変更できる',canManualPositionChange(xm)===true);
ok('既存維持: 裏側のカードは表示形式変更の対象外',
   (()=>{xm.face='down';const r=canManualPositionChange(xm);xm.face='up';return r===false;})());
resetP();
let ym=mkP(MON,0,'down','def');gameState.players[0].mz=[ym];syncP();clearEvtsP();
act({type:'FLIP',player:0,zone:'mz',index:0});
ok('既存維持: FLIP Action も変更として拾える',
   evtsP('onPositionChange').length===1&&evtsP('onPositionChange')[0].toFace==='up');
ok('既存維持: v9 のフィールド記録と併存する',Array.isArray(gameState.fieldSnapV9));

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
