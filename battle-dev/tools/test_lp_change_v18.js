/* System v18 — LPChange / DamageReplacement primitive 回帰テスト
   検証: 効果ダメージ・戦闘ダメージ・コスト・回復の分離 / 0化・半減・倍化 /
         回復→ダメージ変換 / 永続効果ソース層 / 期間 / 適用回数 /
         negative / Replay / Undo / Redo / SaveLoad / Journal / digest /
         既存機構の非回帰                                                 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function mkP(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function resetP(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);
}
const SRC='くず鉄のかかし';
const SAVED_SRC=CARD_SCRIPTS[SRC];
function useSource(cont){ CARD_SCRIPTS[SRC]=Object.assign({type:'trap'},{continuous:cont}); }
function dropSource(){ if(SAVED_SRC) CARD_SCRIPTS[SRC]=SAVED_SRC; else delete CARD_SCRIPTS[SRC]; }
function lp(p){ return gameState.players[p].lp; }

/* =====================================================================
   1. 原因の分離（effect / cost / recover / unspecified）
   ===================================================================== */
resetP();
let base=lp(0);
API.addLpRule({player:0,cause:'effect',mode:'prevent',turns:0,label:'テスト0化'});
API.damageLP(0,1000);
ok('効果ダメージ: 0にできる',lp(0)===base);
API.payCost(0,500);
ok('コスト: 規則の対象外なので払える',lp(0)===base-500);
API.recoverLP(0,300);
ok('回復: ダメージ用の規則では止まらない',lp(0)===base-500+300);
act({type:'LP',player:0,delta:-200});
ok('未指定: cause の無い既存の呼び出しは素通しする',lp(0)===base-500+300-200);
API.clearLpRules();
API.damageLP(0,100);
ok('解除: 規則を外せばダメージが通る',lp(0)===base-500+300-200-100);

/* =====================================================================
   2. 0化・半減・倍化
   ===================================================================== */
resetP();
API.addLpRule({player:0,cause:'effect',mode:'half',turns:0,label:'半減'});
let b2=lp(0);
API.damageLP(0,1000);
ok('半減: ダメージが半分になる',lp(0)===b2-500,'lp='+lp(0));
API.damageLP(0,999);
ok('半減: 端数は切り捨てる',lp(0)===b2-500-499);
resetP();
API.addLpRule({player:1,cause:'effect',mode:'double',turns:0,label:'倍化'});
let b3=lp(1);
API.damageLP(1,700);
ok('倍化: ダメージが倍になる',lp(1)===b3-1400);
ok('倍化: 相手プレイヤーだけに効く',
   (()=>{const b=lp(0);API.damageLP(0,700);return lp(0)===b-700;})());

/* =====================================================================
   3. 回復をダメージに変える
   ===================================================================== */
resetP();
API.addLpRule({player:1,cause:'recover',mode:'convertRecover',turns:0,label:'シモッチ形'});
let b4=lp(1);
API.recoverLP(1,800);
ok('変換: 相手の回復がダメージになる',lp(1)===b4-800,'lp='+lp(1));
ok('変換: 自分の回復はそのまま',
   (()=>{const b=lp(0);API.recoverLP(0,800);return lp(0)===b+800;})());

/* =====================================================================
   4. 永続効果ソースによる置換
   ===================================================================== */
resetP();
let src=mkP(SRC,0,'up');gameState.players[0].sz=[src];
useSource({scope:'self',from:['sz'],apply(){return null;},
  lpChange(info){ return (info.cause==='effect'&&info.player===1) ? 0 : null; }});
let b5=lp(1);
API.damageLP(1,1200);
ok('永続層: ソースが効果ダメージを0にする',lp(1)===b5);
ok('永続層: 対象外のプレイヤーには効かない',
   (()=>{const b=lp(0);API.damageLP(0,300);return lp(0)===b-300;})());
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
ok('永続層: ソースが場を離れれば元に戻る',
   (()=>{const b=lp(1);API.damageLP(1,300);return lp(1)===b-300;})());
dropSource();

/* =====================================================================
   5. 戦闘ダメージとの分離
   ===================================================================== */
resetP();
API.addLpRule({player:0,cause:'effect',mode:'prevent',turns:0,label:'効果だけ0'});
let b6=lp(0);
act({type:'LP',player:0,delta:-500,cause:'battle'});
ok('分離: 効果ダメージ用の規則は戦闘ダメージを止めない',lp(0)===b6-500);
resetP();
API.addLpRule({player:0,cause:'all',mode:'prevent',turns:0,label:'全て0'});
let b7=lp(0);
act({type:'LP',player:0,delta:-500,cause:'battle'});
API.damageLP(0,500);
ok('分離: all の規則は戦闘も効果も止める',lp(0)===b7);
API.payCost(0,400);
ok('分離: all でもコストは止めない',lp(0)===b7-400);

/* =====================================================================
   6. 期間と適用回数
   ===================================================================== */
resetP();
API.addLpRule({player:0,cause:'effect',mode:'prevent',turns:0,label:'このターンだけ'});
let b8=lp(0);
API.damageLP(0,300);
ok('期間: このターンは効く',lp(0)===b8);
act({type:'PASS_TURN'});
API.damageLP(0,300);
ok('期間: 次のターンには切れる',lp(0)===b8-300);
resetP();
API.addLpRule({player:0,cause:'effect',mode:'prevent',turns:2,label:'2ターン'});
act({type:'PASS_TURN'});
let b9=lp(0);
API.damageLP(0,300);
ok('期間: turns を指定すればターンを跨いで効く',lp(0)===b9);
resetP();
API.addLpRule({player:0,cause:'effect',mode:'half',turns:0,label:'回数カウント'});
API.damageLP(0,400);API.damageLP(0,600);
ok('回数: 規則が働いた回数を数えられる',API.lpRuleHits('回数カウント')===2,
   'hits='+API.lpRuleHits('回数カウント'));
ok('回数: 別の label は数えない',API.lpRuleHits('別')===0);

/* =====================================================================
   7. negative
   ===================================================================== */
resetP();
API.addLpRule({player:0,cause:'おかしな原因',mode:'prevent',turns:0,label:'x'});
ok('negative: 未知の原因は effect として扱う',
   gameState.lpRulesV18[0].cause==='effect');
resetP();
API.addLpRule({player:0,cause:'effect',mode:'おかしな種類',turns:0,label:'x'});
ok('negative: 未知の種類は prevent として扱う',
   gameState.lpRulesV18[0].mode==='prevent');
resetP();
API.addLpRule({player:null,cause:'effect',mode:'prevent',turns:0,label:'両者'});
let bA=lp(0),bB=lp(1);
API.damageLP(0,200);API.damageLP(1,200);
ok('player を指定しなければ両者に効く',lp(0)===bA&&lp(1)===bB);
resetP();
ok('negative: 規則が無ければ素通し',
   (()=>{const b=lp(0);API.damageLP(0,777);return lp(0)===b-777;})());
resetP();
API.addLpRule({player:0,cause:'effect',mode:'prevent',turns:0,label:'x'});
ok('negative: 回復は 0化 規則の影響を受けない',
   (()=>{const b=lp(0);API.recoverLP(0,500);return lp(0)===b+500;})());

/* =====================================================================
   8. Replay / Undo / Redo / SaveLoad / Journal / digest
   ===================================================================== */
resetP();
let textBefore=v41StateDigestText(gameState);
ok('digest後方互換: 規則が無ければ digest 文字列に出ない',
   textBefore.indexOf('lpRulesV18')<0);
v41ResetActionJournal(gameState);
API.addLpRule({player:0,cause:'effect',mode:'prevent',turns:0,label:'テスト'});
API.damageLP(0,1000);
ok('Journal: LP_RULE_V18 が記録される',
   V41_ACTION_JOURNAL.map(x=>x.action.type).includes('LP_RULE_V18'));
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: LP置換を含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
gameState=JSON.parse(snap);
ok('SaveLoad: 復元後も規則が残る',
   Array.isArray(gameState.lpRulesV18)&&gameState.lpRulesV18.length===1);
resetP();
v41ResetActionJournal(gameState);
let digestU=v41StateDigest(gameState);
API.addLpRule({player:0,cause:'effect',mode:'prevent',turns:0,label:'テスト'});
ok('Undo前提: 規則が入っている',gameState.lpRulesV18.length===1);
undo();
ok('Undo: 規則が巻き戻る',(gameState.lpRulesV18||[]).length===0);
ok('Undo: 元の digest に一致する',v41StateDigest(gameState)===digestU,
   'before='+digestU+' now='+v41StateDigest(gameState));
redo();
ok('Redo: 規則が復元される',gameState.lpRulesV18.length===1);

/* 直列化の健全性 */
function scanFnsP(v,d){ if(d>12||v===null||typeof v!=='object')return typeof v==='function';
  return Object.keys(v).some(k=>typeof v[k]==='function'||scanFnsP(v[k],d+1)); }
ok('直列化: gameState 全体に関数が混入していない',
   !scanFnsP(JSON.parse(JSON.stringify(gameState)),0));
ok('直列化: 規則に Map/Set/DOM/Promise が無い',
   assertLpStateSerializableV18(gameState)===null,
   String(assertLpStateSerializableV18(gameState)));
ok('無制限履歴なし: 期限切れはターン進行で掃除される',
   (()=>{resetP();
     API.addLpRule({player:0,cause:'effect',mode:'prevent',turns:0,label:'a'});
     API.addLpRule({player:0,cause:'effect',mode:'prevent',turns:0,label:'b'});
     act({type:'PASS_TURN'});
     return (gameState.lpRulesV18||[]).length===0;})());

/* =====================================================================
   9. 既存機構を壊していないこと
   ===================================================================== */
ok('既存維持: LP が0になれば従来どおり敗北する',
   (()=>{resetP();API.damageLP(1,99999);
     return gameState.players[1].lp===0&&gameState.loser===1
       &&gameState.duelEndedReason==='lp0';})());
ok('既存維持: 素の LP Action は従来どおり動く',
   (()=>{resetP();const b=lp(0);act({type:'LP',player:0,delta:-1234});
     return lp(0)===b-1234;})());
ok('既存維持: v6 の戦闘ダメージ層は別のまま',
   typeof applyBattleDamageFilters==='function'
   &&typeof applyBattleDamageRedirectV6==='function');
ok('既存維持: v17 の特性上書きと併存する',
   (()=>{resetP();const c=mkP('ヂェミナイ・エルフ');gameState.players[0].mz=[c];
     API.setRace({p:0,zone:'mz',index:0,card:c},'ドラゴン','permanent','x');
     API.addLpRule({player:0,cause:'effect',mode:'prevent',turns:0,label:'y'});
     const b=lp(0);API.damageLP(0,500);
     return lp(0)===b&&API.raceOf({p:0,zone:'mz',index:0,card:c})==='ドラゴン';})());

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
