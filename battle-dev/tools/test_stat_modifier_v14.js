/* System v14 — StatModifier primitive 回帰テスト
   検証: 加算/SET/SWAP/元々の数値の区別 / 適用順 / 期間（endTurn・
         endPhase・endBattlePhase・permanent）/ 領域ローカル / negative /
         Replay / Undo / Redo / SaveLoad / Journal / digest / 非回帰    */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function mkS(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function resetS(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);
}
/* 攻1900/守800 の通常モンスターを土台にする */
const MON='ヂェミナイ・エルフ';
function put(){const c=mkS(MON);gameState.players[0].mz=[c];return {p:0,zone:'mz',index:0,card:c};}
function atk(){return curATK(gameState.players[0].mz[0]);}
function def(){return curDEF(gameState.players[0].mz[0]);}
resetS();
let t0=put();
const BASE_ATK=dbOf(t0.card).atk, BASE_DEF=dbOf(t0.card).def;
ok('前提: 素の攻守が読める',atk()===BASE_ATK&&def()===BASE_DEF,BASE_ATK+'/'+BASE_DEF);

/* =====================================================================
   1. 4種類の修整の区別
   ===================================================================== */
resetS();let t1=put();
API.modAtk(t1,500,0,'endTurn','加算');
ok('区別1: 加算は既存の mods で行われる',atk()===BASE_ATK+500&&!!t1.card.mods);
resetS();let t2=put();
API.setAtk(t2,0,'endTurn','SET');
ok('区別2: SET は指定した値になる',atk()===0);
API.modAtk(t2,800,0,'endTurn','加算');
ok('適用順: SET の後の加算は効く（0→800）',atk()===800,'atk='+atk());
resetS();let t3=put();
API.setBaseStats(t3,100,200,'permanent','元々の数値');
ok('区別3: 元々の数値のSETは base 層に入る',
   API.baseAtk(t3)===100&&API.baseDef(t3)===200&&atk()===100&&def()===200);
resetS();let t4=put();
API.swapBaseStats(t4,'endTurn','入れ替え');
ok('区別4: SWAP は元々の攻守を入れ替える',
   atk()===BASE_DEF&&def()===BASE_ATK,'atk='+atk()+' def='+def());
ok('区別4: 元々の数値の読み出しも入れ替わる',
   API.baseAtk(t4)===BASE_DEF&&API.baseDef(t4)===BASE_ATK);
resetS();let t5=put();
API.addBaseStats(t5,1000,1000,'endTurn','元々の数値へ加算');
ok('区別5: 元々の数値への加算',
   API.baseAtk(t5)===BASE_ATK+1000&&atk()===BASE_ATK+1000);

/* 元々の数値と現在の数値は別 */
resetS();let t6=put();
API.modAtk(t6,700,0,'endTurn','加算');
ok('元々と現在: 加算は元々の数値を変えない',
   API.baseAtk(t6)===BASE_ATK&&atk()===BASE_ATK+700);
API.setAtk(t6,1000,'endTurn','SET');
ok('元々と現在: 現在値SETも元々の数値を変えない',
   API.baseAtk(t6)===BASE_ATK&&atk()===1700,'atk='+atk());

/* 同じ層に複数入ったら後から入れた方が勝つ */
resetS();let t7=put();
API.setAtk(t7,100,'endTurn','1回目');
API.setAtk(t7,300,'endTurn','2回目');
ok('適用順: 同じ層は後勝ち',atk()===300);

/* =====================================================================
   2. 期間
   ===================================================================== */
resetS();let e1=put();
API.setAtk(e1,0,'endTurn','ターン終了まで');
act({type:'PASS_TURN'});
ok('期間: endTurn はターン終了で消える',
   (()=>{const h=findCardByUid(e1.card.uid);return h&&curATK(h.card)===BASE_ATK;})(),
   'atk='+(findCardByUid(e1.card.uid)?curATK(findCardByUid(e1.card.uid).card):'?'));
resetS();let e2=put();
API.setAtk(e2,0,'permanent','永続');
act({type:'PASS_TURN'});
ok('期間: permanent はターンをまたぐ',
   (()=>{const h=findCardByUid(e2.card.uid);return h&&curATK(h.card)===0;})());
resetS();let e3=put();
API.setAtk(e3,0,'endBattlePhase','バトルフェイズ終了まで');
ok('期間: endBattlePhase は掃除規約に載っている',
   keepStatModV14({until:'endBattlePhase'},'endBattlePhase')===false
   &&keepStatModV14({until:'endBattlePhase'},'endPhase')===true);
ok('期間: permanent はどの掃除でも残る',
   keepStatModV14({until:'permanent'},'endTurn')===true);
ok('期間: endPhase は endTurn の掃除でも消える',
   keepStatModV14({until:'endPhase'},'endTurn')===false);

/* 領域ローカル */
resetS();let z1=put();
API.setAtk(z1,0,'permanent','永続');
ok('領域ローカル: ZONE_LOCAL_KEYS に登録されている',ZONE_LOCAL_KEYS.indexOf('statModsV14')>=0);
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
ok('領域ローカル: 場を離れたら修整が消える',
   gameState.players[0].grave[0].statModsV14===undefined);

/* 明示的な解除 */
resetS();let c1=put();
API.setAtk(c1,0,'endTurn','A');
API.modAtk(c1,300,0,'endTurn','B');
API.clearStatMods(c1,'A');
ok('解除: label 指定で v14 の修整だけ外せる',
   atk()===BASE_ATK+300,'atk='+atk());
API.clearStatMods(c1);
ok('解除: label 無しで v14 の修整を全て外す',
   findCardByUid(c1.card.uid).card.statModsV14===undefined);

/* =====================================================================
   3. negative
   ===================================================================== */
resetS();let n1=put();
ok('negative: 場に無い対象には積めない',
   API.setAtk({p:0,zone:'mz',index:9,card:null},0,'endTurn','x')===false);
act({type:'STAT_MOD_V14',player:0,zone:'mz',index:0,kind:'おかしな種類',atk:5,until:'endTurn',label:'x'});
ok('negative: 未知の種類は setAtk として扱う',
   findCardByUid(n1.card.uid).card.statModsV14[0].kind==='setAtk');
resetS();let n2=put();
act({type:'STAT_MOD_V14',player:0,zone:'mz',index:0,kind:'setAtk',atk:5,until:'おかしな期間',label:'x'});
ok('negative: 未知の期間は endTurn として扱う',
   findCardByUid(n2.card.uid).card.statModsV14[0].until==='endTurn');
resetS();let n3=put();
ok('negative: 修整が無ければ元々の数値は印刷値のまま',API.baseAtk(n3)===BASE_ATK);
ok('negative: 攻撃力は 0 未満にならない',
   (()=>{API.setAtk(n3,-500,'endTurn','マイナス');return atk()===0;})());

/* =====================================================================
   4. Replay / Undo / Redo / SaveLoad / Journal / digest
   ===================================================================== */
resetS();
let textBefore=v41StateDigestText(gameState);
ok('digest後方互換: 修整が無ければ digest 文字列に出ない',
   textBefore.indexOf('statModsV14')<0);
let r1=put();
v41ResetActionJournal(gameState);
API.setBaseStats(r1,100,200,'permanent','テスト');
ok('Journal: STAT_MOD_V14 が記録される',
   V41_ACTION_JOURNAL.map(x=>x.action.type).includes('STAT_MOD_V14'));
ok('digest: 修整した後は digest に現れる',
   v41StateDigestText(gameState).indexOf('statModsV14')>=0);
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: 攻守修整を含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
gameState=JSON.parse(snap);
ok('SaveLoad: 復元後も数値が一致する',curATK(gameState.players[0].mz[0])===100);
resetS();
let u1=put();
v41ResetActionJournal(gameState);
let digestU=v41StateDigest(gameState);
API.setAtk(u1,0,'endTurn','テスト');
ok('Undo前提: 攻撃力が変わっている',atk()===0);
undo();
ok('Undo: 攻撃力が戻る',curATK(findCardByUid(u1.card.uid).card)===BASE_ATK);
ok('Undo: 元の digest に一致する',v41StateDigest(gameState)===digestU,
   'before='+digestU+' now='+v41StateDigest(gameState));
redo();
ok('Redo: 攻撃力が再び変わる',curATK(findCardByUid(u1.card.uid).card)===0);

/* 直列化の健全性 */
function scanFnsS(v,d){ if(d>12||v===null||typeof v!=='object')return typeof v==='function';
  return Object.keys(v).some(k=>typeof v[k]==='function'||scanFnsS(v[k],d+1)); }
ok('直列化: gameState 全体に関数が混入していない',
   !scanFnsS(JSON.parse(JSON.stringify(gameState)),0));
ok('直列化: 攻守修整に Map/Set/DOM/Promise が無い',
   assertStatModStateSerializableV14(gameState)===null,
   String(assertStatModStateSerializableV14(gameState)));
ok('無制限履歴なし: 修整はカードごとの配列だけ',
   Array.isArray(findCardByUid(u1.card.uid).card.statModsV14)
   &&gameState.statLog===undefined);

/* =====================================================================
   5. 既存機構を壊していないこと
   ===================================================================== */
ok('既存維持: MOD_ADD の加算は従来どおり',
   (()=>{resetS();const t=put();API.modAtk(t,300,100,'endTurn','既存');
     return atk()===BASE_ATK+300&&def()===BASE_DEF+100;})());
ok('既存維持: 期間切れの掃除は既存 mods にも効く',
   (()=>{resetS();const t=put();API.modAtk(t,300,0,'endTurn','既存');
     act({type:'PASS_TURN'});
     const h=findCardByUid(t.card.uid);return h&&curATK(h.card)===BASE_ATK;})());
ok('既存維持: clearModsByLabel は v14 を触らない',
   (()=>{resetS();const t=put();API.modAtk(t,300,0,'endTurn','L');
     API.setAtk(t,50,'endTurn','L');API.clearModsByLabel(t,'L');
     return atk()===50;})());
ok('既存維持: procedureBaseStats が優先される層は変わらない',
   (()=>{resetS();const t=put();t.card.procedureBaseStats={atk:1000,def:1000};
     return API.baseAtk(t)===1000;})());
ok('既存維持: procedureBaseStats の上に v14 base 層が乗る',
   (()=>{resetS();const t=put();t.card.procedureBaseStats={atk:1000,def:1000};
     API.addBaseStats(t,500,0,'endTurn','上乗せ');
     return API.baseAtk(t)===1500;})());
ok('既存維持: curLV は影響を受けない',
   (()=>{resetS();const t=put();const lv=curLV(t.card);
     API.setAtk(t,0,'endTurn','x');return curLV(findCardByUid(t.card.uid).card)===lv;})());
ok('既存維持: v13 の効果無効と併存する',
   (()=>{resetS();const t=put();
     API.setAtk(t,0,'endTurn','x');
     API.negateEffectUntil(t,'endTurn','y');
     const h=findCardByUid(t.card.uid);
     return curATK(h.card)===0&&effectNegated(h.card)===true;})());

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
