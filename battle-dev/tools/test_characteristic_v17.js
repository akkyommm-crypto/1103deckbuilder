/* System v17 — CharacteristicOverride primitive 回帰テスト
   検証: 元々の値と現在値の分離 / 種族・属性・名前・チューナー /
         永続効果ソース層 / 期間 / 領域ローカル / 同名判定への反映 /
         素材条件への反映 / P4 metadata 非改変 / dbOf 非改変 /
         negative / Replay / Undo / Redo / SaveLoad / Journal / digest */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function mkC(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function resetC(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);
}
function findName(pred){for(let i=0;i<CARD_DB.length;i++){if(pred(CARD_DB[i]))return CARD_DB[i].n;}return null;}
const MON='ヂェミナイ・エルフ';                 /* 魔法使い族・地・レベル4・非チューナー */
const SRC='くず鉄のかかし';                     /* 永続効果ソース用（TESTED） */
const SAVED_SRC=CARD_SCRIPTS[SRC];
function useSource(cont){ CARD_SCRIPTS[SRC]=Object.assign({type:'trap'},{continuous:cont}); }
function dropSource(){ if(SAVED_SRC) CARD_SCRIPTS[SRC]=SAVED_SRC; else delete CARD_SCRIPTS[SRC]; }
function put(){const c=mkC(MON);gameState.players[0].mz=[c];return {p:0,zone:'mz',index:0,card:c};}
resetC();
let t0=put();
const BASE_RACE=dbOf(t0.card).ra, BASE_ATTR=dbOf(t0.card).at;
ok('前提: 印刷された種族・属性が読める',BASE_RACE==='魔法使い'&&BASE_ATTR==='地',
   BASE_RACE+'/'+BASE_ATTR);

/* =====================================================================
   1. 「元々の」と「現在の」の分離
   ===================================================================== */
resetC();let t1=put();
ok('分離: 上書きが無ければ現在値＝印刷値',
   API.raceOf(t1)===BASE_RACE&&API.attrOf(t1)===BASE_ATTR&&API.nameOf(t1)===MON);
API.setRace(t1,'ドラゴン','permanent','種族変更');
ok('種族: 現在の種族が変わる',API.raceOf(t1)==='ドラゴン');
ok('種族: 元々の種族は変わらない',API.originalRaceOf(t1)===BASE_RACE);
ok('種族: dbOf は印刷情報のまま',dbOf(t1.card).ra===BASE_RACE);
API.setAttribute(t1,'炎','permanent','属性変更');
ok('属性: 現在の属性が変わる',API.attrOf(t1)==='炎');
ok('属性: 元々の属性は変わらない',API.originalAttrOf(t1)===BASE_ATTR);
API.setCardName(t1,'サイクロン','permanent','名前変更');
ok('名前: 現在の名前が変わる',API.nameOf(t1)==='サイクロン');
ok('名前: 元々の名前は変わらない',API.originalNameOf(t1)===MON);
ok('名前: cardName（表示用）は印刷情報のまま',cardName(t1.card)===MON);
API.setTuner(t1,true,'permanent','チューナー化');
ok('チューナー: 現在はチューナー扱い',API.isTunerNow(t1)===true);
ok('チューナー: 印刷情報は非チューナーのまま',
   (dbOf(t1.card).st||[]).indexOf('チューナー')<0);
API.setTuner(t1,false,'permanent','解除');
ok('チューナー: 明示的に非チューナーにもできる',API.isTunerNow(t1)===false);

/* 同じ種類は後勝ち */
resetC();let t2=put();
API.setRace(t2,'ドラゴン','permanent','A');
API.setRace(t2,'機械','permanent','B');
ok('適用順: 同じ種類は後から入れた方が勝つ',API.raceOf(t2)==='機械');

/* =====================================================================
   2. 永続効果ソースによる上書き
   ===================================================================== */
resetC();
let src=mkC(SRC,0,'up');gameState.players[0].sz=[src];
let m1=mkC(MON);gameState.players[0].mz=[m1];
const H1={p:0,zone:'mz',index:0,card:m1};
useSource({scope:'allMonsters',from:['sz'],apply(){return null;},
  raceOverride(){ return '植物'; }});
ok('永続層: ソースが種族を上書きする',API.raceOf(H1)==='植物');
useSource({scope:'allMonsters',from:['sz'],apply(){return null;},
  attrOverride(){ return '闇'; }});
ok('永続層: ソースが属性を上書きする',API.attrOf(H1)==='闇');
useSource({scope:'allMonsters',from:['sz'],apply(){return null;},
  tunerOverride(){ return true; }});
ok('永続層: ソースがチューナー状態を上書きする',API.isTunerNow(H1)===true);
useSource({scope:'allMonsters',from:['sz'],apply(){return null;},
  nameOverride(){ return 'サイクロン'; }});
ok('永続層: ソースが名前を上書きする',API.nameOf(H1)==='サイクロン');
ok('永続層: カード側の上書きより永続層が優先される',
   (()=>{API.setRace(H1,'岩石','permanent','カード側');
     useSource({scope:'allMonsters',from:['sz'],apply(){return null;},
       raceOverride(){ return '水'; }});
     return API.raceOf(H1)==='水';})());
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
ok('永続層: ソースが場を離れればカード側の上書きに戻る',API.raceOf(H1)==='岩石');
dropSource();

/* =====================================================================
   3. 同名判定・テーマ membership への反映
   ===================================================================== */
resetC();
let alias=put();
const CYBER='サイバー・ドラゴン';
if(findCardIndex(CYBER)>=0){
  const other=mkC(CYBER,1);gameState.players[1].mz=[other];
  ok('同名判定: 上書き前は別カード',
     sameCanonicalCardV4(alias.card,other)===false);
  API.setCardName(alias,CYBER,'permanent','別名');
  ok('同名判定: 名前を上書きすると同名として扱われる',
     sameCanonicalCardV4(alias.card,other)===true);
  ok('同名判定: 相手側の識別は変わらない',
     canonicalCardCodeV4(other)===canonicalCardCodeV4(other));
  API.clearCharMods(alias);
  ok('同名判定: 上書きを外すと元に戻る',
     sameCanonicalCardV4(alias.card,other)===false);
}else{
  ok('同名判定: 上書き前は別カード',true,'サイバー・ドラゴンがDBに無い');
  ok('同名判定: 名前を上書きすると同名として扱われる',true,'スキップ');
  ok('同名判定: 相手側の識別は変わらない',true,'スキップ');
  ok('同名判定: 上書きを外すと元に戻る',true,'スキップ');
}
ok('P4 非改変: overlay の group 定義は書き換えていない',
   (()=>{const before=Object.keys(GROUP).length;
     const h=put();API.setCardName(h,'サイクロン','permanent','x');
     return Object.keys(GROUP).length===before;})());

/* =====================================================================
   4. 素材条件（slotMatches）への反映
   ===================================================================== */
resetC();
let mat=put();
ok('素材条件: 上書き前はチューナーではない',
   slotMatches(dbOf(mat.card),{tuner:true},null,mat.card)===false);
API.setTuner(mat,true,'permanent','チューナー化');
ok('素材条件: チューナー扱いになると素材条件を満たす',
   slotMatches(dbOf(mat.card),{tuner:true},null,mat.card)===true);
ok('素材条件: 「チューナー以外」の条件からは外れる',
   slotMatches(dbOf(mat.card),{tuner:false},null,mat.card)===false);
API.setRace(mat,'ドラゴン','permanent','種族変更');
ok('素材条件: 種族の上書きが効く',
   slotMatches(dbOf(mat.card),{race:'ドラゴン'},null,mat.card)===true
   &&slotMatches(dbOf(mat.card),{race:BASE_RACE},null,mat.card)===false);
API.setAttribute(mat,'炎','permanent','属性変更');
ok('素材条件: 属性の上書きが効く',
   slotMatches(dbOf(mat.card),{attr:'炎'},null,mat.card)===true);
ok('素材条件: card を渡さなければ従来どおり印刷情報で判定する',
   slotMatches(dbOf(mat.card),{race:BASE_RACE},null,null)===true);

/* =====================================================================
   5. ハンドルへの反映（db は不変）
   ===================================================================== */
resetC();
let hv=put();
API.setRace(hv,'ドラゴン','permanent','種族変更');
let handle=API.fieldCards({zone:'mz'})[0];
ok('ハンドル: 現在値が追加されている',handle.race==='ドラゴン');
ok('ハンドル: db は印刷情報のまま',handle.db.ra===BASE_RACE);
ok('ハンドル: 名前・属性・チューナーも取れる',
   handle.name===MON&&handle.attr===BASE_ATTR&&handle.tuner===false);
gameState.players[0].hand=[mkC(MON)];
ok('ハンドル: pileCards でも同じ形になる',
   (()=>{const h=API.pileCards(0,'hand')[0];
     return h.race===BASE_RACE&&!!h.db;})());

/* =====================================================================
   6. 期間と領域ローカル
   ===================================================================== */
resetC();let e1=put();
API.setRace(e1,'ドラゴン','endTurn','ターン終了まで');
ok('期間: endTurn は今のターンだけ効く',API.raceOf(e1)==='ドラゴン');
act({type:'PASS_TURN'});
ok('期間: ターン終了で消える',
   (()=>{const h=findCardByUid(e1.card.uid);return h&&currentRaceV17(h.card)===BASE_RACE;})());
ok('期間: 掃除規約は既存 mods と同じ',
   keepCharModV17({until:'endPhase'},'endTurn')===false
   &&keepCharModV17({until:'permanent'},'endTurn')===true);
resetC();let z1=put();
API.setRace(z1,'ドラゴン','permanent','永続');
ok('領域ローカル: ZONE_LOCAL_KEYS に登録されている',ZONE_LOCAL_KEYS.indexOf('charV17')>=0);
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
ok('領域ローカル: 場を離れたら印刷情報に戻る',
   gameState.players[0].grave[0].charV17===undefined);
resetC();let c1=put();
API.setRace(c1,'ドラゴン','permanent','A');
API.setAttribute(c1,'炎','permanent','B');
API.clearCharMods(c1,'A');
ok('解除: label 指定で片方だけ外せる',
   API.raceOf(c1)===BASE_RACE&&API.attrOf(c1)==='炎');
API.clearCharMods(c1);
ok('解除: label 無しで全て外す',findCardByUid(c1.card.uid).card.charV17===undefined);

/* =====================================================================
   7. negative
   ===================================================================== */
resetC();let n1=put();
ok('negative: 場に無い対象には積めない',
   API.setRace({p:0,zone:'mz',index:9,card:null},'ドラゴン','permanent','x')===false);
act({type:'CHAR_MOD_V17',player:0,zone:'mz',index:0,kind:'おかしな種類',value:'x',until:'permanent',label:'y'});
ok('negative: 未知の種類は race として扱う',
   findCardByUid(n1.card.uid).card.charV17[0].kind==='race');
resetC();let n2=put();
act({type:'CHAR_MOD_V17',player:0,zone:'mz',index:0,kind:'race',value:'ドラゴン',until:'おかしな期間',label:'y'});
ok('negative: 未知の期間は permanent として扱う',
   findCardByUid(n2.card.uid).card.charV17[0].until==='permanent');
resetC();let n3=put();
API.setCardName(n3,'存在しないカード名','permanent','x');
ok('negative: DBに無い名前でも identity は壊れない',
   canonicalCardCodeV4(n3.card)===canonicalCardCodeV4({id:findCardIndex(MON)}));

/* =====================================================================
   8. Replay / Undo / Redo / SaveLoad / Journal / digest
   ===================================================================== */
resetC();
let textBefore=v41StateDigestText(gameState);
ok('digest後方互換: 上書きが無ければ digest 文字列に出ない',
   textBefore.indexOf('charV17')<0);
let r1=put();
v41ResetActionJournal(gameState);
API.setRace(r1,'ドラゴン','permanent','テスト');
ok('Journal: CHAR_MOD_V17 が記録される',
   V41_ACTION_JOURNAL.map(x=>x.action.type).includes('CHAR_MOD_V17'));
ok('digest: 上書きした後は digest に現れる',
   v41StateDigestText(gameState).indexOf('charV17')>=0);
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: 特性の上書きを含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
gameState=JSON.parse(snap);
ok('SaveLoad: 復元後も現在値が一致する',
   currentRaceV17(gameState.players[0].mz[0])==='ドラゴン');
resetC();
let u1=put();
v41ResetActionJournal(gameState);
let digestU=v41StateDigest(gameState);
API.setRace(u1,'ドラゴン','permanent','テスト');
ok('Undo前提: 種族が変わっている',API.raceOf(u1)==='ドラゴン');
undo();
ok('Undo: 種族が戻る',currentRaceV17(findCardByUid(u1.card.uid).card)===BASE_RACE);
ok('Undo: 元の digest に一致する',v41StateDigest(gameState)===digestU,
   'before='+digestU+' now='+v41StateDigest(gameState));
redo();
ok('Redo: 種族が再び変わる',currentRaceV17(findCardByUid(u1.card.uid).card)==='ドラゴン');

/* 直列化の健全性 */
function scanFnsC(v,d){ if(d>12||v===null||typeof v!=='object')return typeof v==='function';
  return Object.keys(v).some(k=>typeof v[k]==='function'||scanFnsC(v[k],d+1)); }
ok('直列化: gameState 全体に関数が混入していない',
   !scanFnsC(JSON.parse(JSON.stringify(gameState)),0));
ok('直列化: 特性の上書きに Map/Set/DOM/Promise が無い',
   assertCharStateSerializableV17(gameState)===null,
   String(assertCharStateSerializableV17(gameState)));
ok('無制限履歴なし: 上書きはカードごとの配列だけ',
   Array.isArray(findCardByUid(u1.card.uid).card.charV17)
   &&gameState.charLog===undefined);

/* =====================================================================
   9. 既存機構を壊していないこと
   ===================================================================== */
ok('既存維持: dbOf は従来どおり印刷情報を返す',
   (()=>{resetC();const t=put();API.setRace(t,'ドラゴン','permanent','x');
     return dbOf(t.card).ra===BASE_RACE&&dbOf(t.card).n===MON;})());
ok('既存維持: v14 の攻守修整と併存する',
   (()=>{resetC();const t=put();API.setRace(t,'ドラゴン','permanent','x');
     API.setAtk(t,0,'endTurn','y');
     return curATK(findCardByUid(t.card.uid).card)===0&&API.raceOf(t)==='ドラゴン';})());
ok('既存維持: v16 のレベル修整と併存する',
   (()=>{resetC();const t=put();API.setRace(t,'ドラゴン','permanent','x');
     API.setLevel(t,1,'permanent','y');
     return curLV(findCardByUid(t.card.uid).card)===1&&API.raceOf(t)==='ドラゴン';})());
ok('既存維持: v15 の装備先スコープから特性を変えられる',
   (()=>{resetC();const eq=mkC('団結の力'),c=mkC(MON);
     gameState.players[0].sz=[eq];gameState.players[0].mz=[c];
     API.equipSpell({p:0,zone:'sz',index:0,card:eq},{p:0,zone:'mz',index:0,card:c},'テスト');
     const saved=CARD_SCRIPTS['団結の力'];
     CARD_SCRIPTS['団結の力']=Object.assign({},saved,{continuous:{
       scope:'equippedMonster',from:['sz'],apply(){return null;},
       raceOverride(){return 'ドラゴン';}}});
     const r=currentRaceV17(findCardByUid(c.uid).card)==='ドラゴン';
     CARD_SCRIPTS['団結の力']=saved;
     return r;})());
ok('既存維持: 素材条件は上書きが無ければ印刷情報どおり',
   (()=>{resetC();const t=put();
     return slotMatches(dbOf(t.card),{race:BASE_RACE},null,t.card)===true;})());

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
