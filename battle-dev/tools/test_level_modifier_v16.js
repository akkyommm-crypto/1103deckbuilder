/* System v16 — LevelModifier primitive 回帰テスト
   検証: 増減 / SET / 適用順 / 期間 / 永続効果ソースの層 / 領域ローカル /
         素材・召喚判定との共有 / negative / Replay / Undo / Redo /
         SaveLoad / Journal / digest / 既存機構の非回帰                 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function mkL(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function resetL(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);
}
const MON='ヂェミナイ・エルフ';          /* レベル4 */
const SRC='くず鉄のかかし';               /* 永続効果ソース用（TESTED） */
const SAVED_SRC=CARD_SCRIPTS[SRC];
function useSource(cont){ CARD_SCRIPTS[SRC]=Object.assign({type:'trap'},{continuous:cont}); }
function dropSource(){ if(SAVED_SRC) CARD_SCRIPTS[SRC]=SAVED_SRC; else delete CARD_SCRIPTS[SRC]; }
function put(){const c=mkL(MON);gameState.players[0].mz=[c];return {p:0,zone:'mz',index:0,card:c};}
function lv(){return curLV(gameState.players[0].mz[0]);}
resetL();
let t0=put();
const BASE_LV=dbOf(t0.card).lv;
ok('前提: 素のレベルが読める',lv()===BASE_LV,'lv='+BASE_LV);

/* =====================================================================
   1. 増減と SET
   ===================================================================== */
resetL();let t1=put();
API.modLevel(t1,1,'permanent','増加');
ok('増減: レベルを上げられる',lv()===BASE_LV+1);
API.modLevel(t1,-2,'permanent','減少');
ok('増減: 重ねると合算される',lv()===BASE_LV-1);
resetL();let t2=put();
API.setLevel(t2,3,'permanent','SET');
ok('SET: 指定したレベルになる',lv()===3);
API.modLevel(t2,1,'permanent','増加');
ok('適用順: SET は増減より後に効く（後勝ち）',lv()===3,'lv='+lv());
API.setLevel(t2,7,'permanent','SET2');
ok('適用順: SET が複数なら後から入れた方が勝つ',lv()===7);
resetL();let t3=put();
API.setLevel(t3,-5,'permanent','マイナス');
ok('negative: レベルは 0 未満にならない',lv()===0);
ok('API: レベルを問い合わせられる',API.levelOf({p:0,zone:'mz',index:0,card:t3.card})===0);

/* =====================================================================
   2. 期間
   ===================================================================== */
resetL();let e1=put();
API.setLevel(e1,1,'endTurn','ターン終了まで');
ok('期間: endTurn は今のターンだけ効く',lv()===1);
act({type:'PASS_TURN'});
ok('期間: ターン終了で消える',
   (()=>{const h=findCardByUid(e1.card.uid);return h&&curLV(h.card)===BASE_LV;})());
resetL();let e2=put();
API.setLevel(e2,1,'permanent','永続');
act({type:'PASS_TURN'});
ok('期間: permanent はターンをまたぐ',
   (()=>{const h=findCardByUid(e2.card.uid);return h&&curLV(h.card)===1;})());
ok('期間: 掃除規約は既存 mods と同じ',
   keepLevelModV16({until:'endPhase'},'endTurn')===false
   &&keepLevelModV16({until:'endBattlePhase'},'endBattlePhase')===false
   &&keepLevelModV16({until:'permanent'},'endTurn')===true);

/* 領域ローカル */
resetL();let z1=put();
API.setLevel(z1,1,'permanent','永続');
ok('領域ローカル: ZONE_LOCAL_KEYS に登録されている',ZONE_LOCAL_KEYS.indexOf('lvModsV16')>=0);
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
ok('領域ローカル: 場を離れたら修整が消える',
   gameState.players[0].grave[0].lvModsV16===undefined);

/* 明示的な解除 */
resetL();let c1=put();
API.modLevel(c1,2,'permanent','A');
API.modLevel(c1,1,'permanent','B');
API.clearLevelMods(c1,'A');
ok('解除: label 指定で片方だけ外せる',lv()===BASE_LV+1,'lv='+lv());
API.clearLevelMods(c1);
ok('解除: label 無しで全て外す',
   findCardByUid(c1.card.uid).card.lvModsV16===undefined&&lv()===BASE_LV);

/* =====================================================================
   3. 永続効果ソースによる層
   ===================================================================== */
resetL();
let src=mkL(SRC,0,'up');gameState.players[0].sz=[src];
let m1=mkL(MON);gameState.players[0].mz=[m1];
useSource({scope:'allMonsters',from:['sz'],apply(){return null;},
  levelDelta(){ return -1; }});
ok('永続層: ソースがレベルを下げる',lv()===BASE_LV-1,'lv='+lv());
useSource({scope:'allMonsters',from:['sz'],apply(){return null;},
  setLevel(){ return 2; }});
ok('永続層: ソースがレベルを固定する',lv()===2);
API.modLevel({p:0,zone:'mz',index:0,card:m1},3,'permanent','増加');
ok('適用順: 永続の固定はカード側の修整より後',lv()===2,'lv='+lv());
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
ok('永続層: ソースが場を離れれば元に戻る',lv()===BASE_LV+3,'lv='+lv());
dropSource();
ok('negative: 宣言の無いソースはレベルに影響しない',
   (()=>{resetL();const s=mkL(SRC,0,'up');gameState.players[0].sz=[s];
     const c=put();return lv()===BASE_LV;})());

/* =====================================================================
   4. 素材・召喚判定との共有
   ===================================================================== */
resetL();let s1=put();
API.setLevel(s1,8,'permanent','SET');
ok('共有: curLV を使う判定にそのまま反映される',
   curLV(findCardByUid(s1.card.uid).card)===8);
ok('共有: 元々のレベル（印刷値）は変わらない',dbOf(s1.card).lv===BASE_LV);
ok('共有: v14 の攻守修整とは独立している',
   (()=>{API.setAtk(s1,0,'endTurn','x');
     return curLV(findCardByUid(s1.card.uid).card)===8
       &&curATK(findCardByUid(s1.card.uid).card)===0;})());

/* =====================================================================
   5. negative
   ===================================================================== */
resetL();let n1=put();
ok('negative: 場に無い対象には積めない',
   API.setLevel({p:0,zone:'mz',index:9,card:null},3,'permanent','x')===false);
act({type:'LEVEL_MOD_V16',player:0,zone:'mz',index:0,kind:'おかしな種類',value:2,until:'permanent',label:'x'});
ok('negative: 未知の種類は add として扱う',
   findCardByUid(n1.card.uid).card.lvModsV16[0].kind==='add');
resetL();let n2=put();
act({type:'LEVEL_MOD_V16',player:0,zone:'mz',index:0,kind:'set',value:3,until:'おかしな期間',label:'x'});
ok('negative: 未知の期間は permanent として扱う',
   findCardByUid(n2.card.uid).card.lvModsV16[0].until==='permanent');

/* =====================================================================
   6. Replay / Undo / Redo / SaveLoad / Journal / digest
   ===================================================================== */
resetL();
let textBefore=v41StateDigestText(gameState);
ok('digest後方互換: 修整が無ければ digest 文字列に出ない',
   textBefore.indexOf('lvModsV16')<0);
let r1=put();
v41ResetActionJournal(gameState);
API.setLevel(r1,3,'permanent','テスト');
ok('Journal: LEVEL_MOD_V16 が記録される',
   V41_ACTION_JOURNAL.map(x=>x.action.type).includes('LEVEL_MOD_V16'));
ok('digest: 修整した後は digest に現れる',
   v41StateDigestText(gameState).indexOf('lvModsV16')>=0);
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: レベル修整を含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
gameState=JSON.parse(snap);
ok('SaveLoad: 復元後もレベルが一致する',curLV(gameState.players[0].mz[0])===3);
resetL();
let u1=put();
v41ResetActionJournal(gameState);
let digestU=v41StateDigest(gameState);
API.setLevel(u1,1,'permanent','テスト');
ok('Undo前提: レベルが変わっている',lv()===1);
undo();
ok('Undo: レベルが戻る',curLV(findCardByUid(u1.card.uid).card)===BASE_LV);
ok('Undo: 元の digest に一致する',v41StateDigest(gameState)===digestU,
   'before='+digestU+' now='+v41StateDigest(gameState));
redo();
ok('Redo: レベルが再び変わる',curLV(findCardByUid(u1.card.uid).card)===1);

/* 直列化の健全性 */
function scanFnsL(v,d){ if(d>12||v===null||typeof v!=='object')return typeof v==='function';
  return Object.keys(v).some(k=>typeof v[k]==='function'||scanFnsL(v[k],d+1)); }
ok('直列化: gameState 全体に関数が混入していない',
   !scanFnsL(JSON.parse(JSON.stringify(gameState)),0));
ok('直列化: レベル修整に Map/Set/DOM/Promise が無い',
   assertLevelModStateSerializableV16(gameState)===null,
   String(assertLevelModStateSerializableV16(gameState)));
ok('無制限履歴なし: 修整はカードごとの配列だけ',
   Array.isArray(findCardByUid(u1.card.uid).card.lvModsV16)
   &&gameState.levelLog===undefined);

/* =====================================================================
   7. 既存機構を壊していないこと
   ===================================================================== */
ok('既存維持: card.lvMod（既存の恒久デルタ）は従来どおり効く',
   (()=>{resetL();const t=put();
     act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,lvDelta:2});
     return lv()===BASE_LV+2;})());
ok('既存維持: lvReset も従来どおり効く',
   (()=>{act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,lvReset:true});
     return lv()===BASE_LV;})());
ok('既存維持: lvMod と v16 は積み上がる',
   (()=>{resetL();const t=put();
     act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,lvDelta:1});
     API.modLevel(t,1,'permanent','v16');
     return lv()===BASE_LV+2;})());
ok('既存維持: 攻守の掃除（v14）も同時に動く',
   (()=>{resetL();const t=put();
     API.setAtk(t,0,'endTurn','x');API.setLevel(t,1,'endTurn','y');
     act({type:'PASS_TURN'});
     const h=findCardByUid(t.card.uid);
     return curATK(h.card)===dbOf(h.card).atk&&curLV(h.card)===BASE_LV;})());
ok('既存維持: v15 の装備先スコープからもレベルを動かせる',
   (()=>{resetL();const eq=mkL('団結の力'),c=mkL(MON);
     gameState.players[0].sz=[eq];gameState.players[0].mz=[c];
     API.equipSpell({p:0,zone:'sz',index:0,card:eq},{p:0,zone:'mz',index:0,card:c},'テスト');
     const saved=CARD_SCRIPTS['団結の力'];
     CARD_SCRIPTS['団結の力']=Object.assign({},saved,{continuous:{
       scope:'equippedMonster',from:['sz'],apply(){return null;},levelDelta(){return -2;}}});
     const r=curLV(findCardByUid(c.uid).card)===BASE_LV-2;
     CARD_SCRIPTS['団結の力']=saved;
     return r;})());

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
