/* LPChange recovery batch — 7枚の positive / negative / ruling edge case。 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function reset0(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
}
function sync(){gameState.fieldSnapV9=fieldSnapshotV9(gameState);
  gameState.posSnapV10=positionSnapshotV10(gameState);}
function eff(n,k){const e=nativeEffectsV4(n).find(x=>!k||x.key===k);if(!e)throw new Error('effect '+n+' '+k);return e;}
function ctxAt(card,zone,ev,extra){const h=locateCardAnyV4(card);
  return makeContext(0,card,zone||(h&&h.zone)||'sz',(h&&h.index)||0,ev||'activate',extra||{});}
function run(e,c){if(e.cost){let p=false;e.cost(c,v=>{p=v;});} if(e.target)e.target(c,r=>{c.selectedTargets=r;}); e.operation(c);}
function lp(p){ return gameState.players[p].lp; }
const MON='ヂェミナイ・エルフ';

const NAMES=['ハネワタ','ピケルの魔法陣','サイバー・ジラフ','一時休戦',
 'ダメージ・トランスレーション','シモッチによる副作用','堕天使ナース－レフィキュル'];
NAMES.forEach(n=>ok('LPChange registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: ゴースト・トークンの定義が登録されている',!!tokenSpecV11('ゴースト・トークン'));

/* =====================================================================
   効果ダメージを止める
   ===================================================================== */
reset0();
let hane=mk('ハネワタ');gameState.players[0].hand=[hane];sync();
let eHa=eff('ハネワタ'),cHa=ctxAt(hane,'hand');
ok('ハネワタ positive: 手札にあれば発動できる',eHa.condition(cHa)===true);
run(eHa,cHa);
ok('ハネワタ: コストで手札から捨てている',
   gameState.players[0].hand.length===0&&gameState.players[0].grave.some(c=>c.uid===hane.uid));
let b1=lp(0);
API.damageLP(0,1500);
ok('ハネワタ positive: 自分が受ける効果ダメージが0になる',lp(0)===b1);
ok('ハネワタ negative: 相手へのダメージは止めない',
   (()=>{const b=lp(1);API.damageLP(1,500);return lp(1)===b-500;})());
ok('ハネワタ ruling: コストの支払いは止めない',
   (()=>{const b=lp(0);API.payCost(0,400);return lp(0)===b-400;})());
act({type:'PASS_TURN'});
ok('ハネワタ ruling: 次のターンには効果が切れる',
   (()=>{const b=lp(0);API.damageLP(0,300);return lp(0)===b-300;})());
reset0();
let hane2=mk('ハネワタ');gameState.players[0].mz=[hane2];sync();
ok('ハネワタ negative: 手札に無ければ発動できない',
   eHa.condition(ctxAt(hane2,'mz'))===false);

reset0();
let pikeru=mk('ピケルの魔法陣',0,'down');gameState.players[0].sz=[pikeru];sync();
let ePi=eff('ピケルの魔法陣');
ePi.operation(ctxAt(pikeru,'sz'));
let b2=lp(0);
API.damageLP(0,2000);
ok('ピケルの魔法陣 positive: 効果ダメージが0になる',lp(0)===b2);
ok('ピケルの魔法陣 negative: 相手は守られない',
   (()=>{const b=lp(1);API.damageLP(1,2000);return lp(1)===b-2000;})());

reset0();
let giraffe=mk('サイバー・ジラフ');gameState.players[0].mz=[giraffe];sync();
let eGi=eff('サイバー・ジラフ'),cGi=ctxAt(giraffe,'mz');
ok('サイバー・ジラフ positive: 場にいれば発動できる',eGi.condition(cGi)===true);
run(eGi,cGi);
ok('サイバー・ジラフ: コストで自身をリリースしている',
   gameState.players[0].mz.length===0);
let b3=lp(0);
API.damageLP(0,900);
ok('サイバー・ジラフ positive: 効果ダメージが0になる',lp(0)===b3);
reset0();
let giraffe2=mk('サイバー・ジラフ');gameState.players[0].hand=[giraffe2];sync();
ok('サイバー・ジラフ negative: 場にいなければ発動できない',
   eGi.condition(ctxAt(giraffe2,'hand'))===false);

reset0();
let truce=mk('一時休戦');gameState.players[0].sz=[truce];
gameState.players[0].deck=[mk(MON)];gameState.players[1].deck=[mk(MON,1)];sync();
let eTr=eff('一時休戦'),cTr=ctxAt(truce,'sz');
ok('一時休戦 positive: 双方のデッキがあれば発動できる',eTr.condition(cTr)===true);
const h0=gameState.players[0].hand.length,h1=gameState.players[1].hand.length;
eTr.operation(cTr);
ok('一時休戦 positive: お互いが1枚ドローする',
   gameState.players[0].hand.length===h0+1&&gameState.players[1].hand.length===h1+1);
let t0=lp(0),t1=lp(1);
API.damageLP(0,1000);API.damageLP(1,1000);
ok('一時休戦 positive: お互いの効果ダメージが0になる',lp(0)===t0&&lp(1)===t1);
act({type:'LP',player:0,delta:-800,cause:'battle'});
ok('一時休戦 ruling: 戦闘ダメージも0になる',lp(0)===t0);
ok('一時休戦 ruling: コストの支払いは止めない',
   (()=>{const b=lp(0);API.payCost(0,300);return lp(0)===b-300;})());
act({type:'PASS_TURN'});
API.damageLP(0,500);
ok('一時休戦 ruling: 次の相手ターンまでは続く',lp(0)===t0-300);
act({type:'PASS_TURN'});
ok('一時休戦 ruling: その後は切れる',
   (()=>{const b=lp(0);API.damageLP(0,500);return lp(0)===b-500;})());
reset0();
let truce2=mk('一時休戦');gameState.players[0].sz=[truce2];sync();
ok('一時休戦 negative: デッキが無ければ発動できない',
   eTr.condition(ctxAt(truce2,'sz'))===false);

reset0();
let trans=mk('ダメージ・トランスレーション',0,'down');gameState.players[0].sz=[trans];sync();
let eDt=eff('ダメージ・トランスレーション');
eDt.operation(ctxAt(trans,'sz'));
let b4=lp(0);
API.damageLP(0,1000);
ok('ダメージ・トランスレーション positive: 効果ダメージが半分になる',lp(0)===b4-500);
API.damageLP(0,600);
ok('ダメージ・トランスレーション positive: 2回目も半分になる',lp(0)===b4-500-300);
ok('ダメージ・トランスレーション: 受けた回数を数えている',
   API.lpRuleHits('ダメージ・トランスレーション')===2);
ok('ダメージ・トランスレーション positive: エンドフェイズの予約が入る',
   (gameState.scheduledV7||[]).some(s=>s.note==='ダメージ・トランスレーション'));
scheduleHandlerV7('v18.ghostTokens')({player:0,label:'ダメージ・トランスレーション'});
ok('ダメージ・トランスレーション positive: 受けた回数だけトークンが出る',
   gameState.players[0].mz.length===2
   &&gameState.players[0].mz.every(c=>tokenKeyV11(c)==='ゴースト・トークン'),
   'mz='+gameState.players[0].mz.length);
ok('ダメージ・トランスレーション ruling: トークンは守備表示',
   gameState.players[0].mz.every(c=>c.pos==='def'));

/* =====================================================================
   回復をダメージに変える
   ===================================================================== */
reset0();
let simo=mk('シモッチによる副作用');gameState.players[0].sz=[simo];sync();
let s1=lp(1);
API.recoverLP(1,800);
ok('シモッチによる副作用 positive: 相手の回復がダメージになる',lp(1)===s1-800,'lp='+lp(1));
ok('シモッチによる副作用 negative: 自分の回復はそのまま',
   (()=>{const b=lp(0);API.recoverLP(0,800);return lp(0)===b+800;})());
ok('シモッチによる副作用 negative: 相手へのダメージは変えない',
   (()=>{const b=lp(1);API.damageLP(1,300);return lp(1)===b-300;})());
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
ok('シモッチによる副作用 ruling: 場を離れれば元に戻る',
   (()=>{const b=lp(1);API.recoverLP(1,400);return lp(1)===b+400;})());

reset0();
let nurse=mk('堕天使ナース－レフィキュル');gameState.players[0].mz=[nurse];sync();
let n1=lp(1);
API.recoverLP(1,600);
ok('堕天使ナース positive: 相手の回復がダメージになる',lp(1)===n1-600);
act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,face:'down',pos:'def',reason:'裏側に'});
ok('堕天使ナース negative: 裏側では働かない',
   (()=>{const b=lp(1);API.recoverLP(1,600);return lp(1)===b+600;})());

/* =====================================================================
   Replay / SaveLoad / 直列化
   ===================================================================== */
reset0();
let rPi=mk('ピケルの魔法陣',0,'down');gameState.players[0].sz=[rPi];sync();
v41ResetActionJournal(gameState);
ePi.operation(ctxAt(rPi,'sz'));
API.damageLP(0,1000);
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: LP置換を含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('直列化: 規則に関数が混入していない',
   assertLpStateSerializableV18(gameState)===null);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
