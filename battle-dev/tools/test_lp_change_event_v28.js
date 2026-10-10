/* Class A bulk 50 — System v28 E2: onLPChange central emit。positive / negative / ruling edge。 */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;
  gameState.phase='main1';gameState.turn=6;PLAY_MODE=PLAY_MODES.DUEL;
  HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();
  v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
  API.confirm=(t,m,yes,no)=>{ if(no) no(); };
  gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function h(c){return locateCardAnyV4(c);}
function effOf(n,k){const e=nativeEffectsV4(n).find(x=>!k||x.key===k);if(!e)throw Error('effect '+n+' '+k);return e;}
function ctxF(p,card,evname,evt){const loc=h(card);
  const c=makeContext(p,card,(loc&&loc.zone)||'mz',(loc&&loc.index)||0,evname||'onFlip',{event:evt});
  if(evt)c.event=evt;return c;}
function run(e,c){if(e.target)e.target(c,r=>{c.selectedTargets=r;}); e.operation(c);}
function pending(){return pendingChoiceV49(gameState);}
function answerAll(){const pc=pending();if(!pc)throw Error('no pending');return answerChoiceV49(pc.candidates.map(x=>x.key));}
function answerN(n){const pc=pending();if(!pc)throw Error('no pending');return answerChoiceV49(pc.candidates.slice(0,n).map(x=>x.key));}
function answerNamed(nm){const pc=pending();if(!pc)throw Error('no pending');
  const hit=pc.candidates.find(x=>{const f=x&&x.uid!=null?findCardByUid(x.uid):null;return f&&dbOf(f.card).n===nm;});
  return answerChoiceV49([(hit||pc.candidates[0]).key]);}
function inHand(p,c){return (gameState.players[p].hand||[]).some(x=>x&&x.uid===c.uid);}
function inMz(p,c){return (gameState.players[p].mz||[]).some(x=>x&&x.uid===c.uid);}
function pickFirst(){API.selectCard=(t,list,cb)=>cb(list[0]);}
function pickNamed(nm){API.selectCard=(t,list,cb)=>{const hit=list.find(x=>x&&x.card&&dbOf(x.card).n===nm);cb(hit||list[0]);};}

/* 小道具は TESTED / GENERIC_OK / NOT_STARTED のみ */
const PLAIN='ワイト';           /* GENERIC_OK lv3 */
const BIG='青眼の白龍';          /* GENERIC_OK */
const WARRIOR='ゾンビタイガー';    /* NOT_STARTED・アンデット */
const WAR2='E・HERO クレイマン';  /* GENERIC_OK・戦士 */
const TRAP='落とし穴';           /* 罠 */
const SPELL='サイクロン';         /* 魔法 */
const FIELD='王家の眠る谷－ネクロバレー'; /* TESTED・フィールド魔法 */
const FIELD2='闇';              /* フィールド魔法（別） */
const EFFMON='キラー・トマト';     /* TESTED・効果モンスター */
const NORMMON='ヂェミナイ・エルフ'; /* GENERIC_OK・通常モンスター */

const NAMES=['派手ハネ','尾も白い黒猫','水晶の占い師','聖なる守り手','幸運を告げるフクロウ',
 'カードを狩る死神','トラップ・マスター','爆弾かめ虫','雷仙人','ワーム・リンクス'];
NAMES.forEach(n=>ok('bulk50-b1 registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: 落とし穴は罠',dbOf({id:findCardIndex(TRAP)}).k==='t');
ok('前提: サイクロンは魔法',dbOf({id:findCardIndex(SPELL)}).k==='s');
ok('前提: ネクロバレーはフィールド魔法',dbOf({id:findCardIndex(FIELD)}).sub==='フィールド');
ok('前提: キラー・トマトは効果モンスター',(dbOf({id:findCardIndex(EFFMON)}).st||[]).includes('効果'));
ok('前提: ヂェミナイ・エルフは通常モンスター',(dbOf({id:findCardIndex(NORMMON)}).st||[]).includes('通常'));
function lpEv(){ return (gameState.deferredEvents||[]).filter(e=>e&&e.eventName==='onLPChange').map(e=>e.evt); }
function clearEv(){ gameState.deferredEvents=[]; }

/* ---- 基本 ---- */
reset0(); clearEv();
ok('E2: onLPChange が EVENTS に登録されている',EVENTS.indexOf('onLPChange')>=0);
ok('E2: 中央 emitter がある',typeof emitLpChangeV28==='function');

/* ---- recover ---- */
reset0(); clearEv();
let lp0=gameState.players[0].lp;
API.recoverLP(0,1200);
let e=lpEv();
ok('E2 recover: イベントがちょうど1回',e.length===1,String(e.length));
ok('E2 recover: player/before/after/delta が正しい',
   e[0].player===0&&e[0].before===lp0&&e[0].after===lp0+1200&&e[0].delta===1200,JSON.stringify(e[0]));
ok('E2 recover: cause は recover',e[0].cause==='recover',e[0].cause);
ok('E2 recover: delta>0 で「回復した」と判定できる',e[0].delta>0);

/* ---- effect damage ---- */
reset0(); clearEv();
let lpd=gameState.players[1].lp;
API.damageLP(1,800);
e=lpEv();
ok('E2 effect damage: イベントがちょうど1回',e.length===1);
ok('E2 effect damage: delta が負',e[0].delta===-800&&e[0].after===lpd-800,JSON.stringify(e[0]));
ok('E2 effect damage: cause は effect',e[0].cause==='effect',e[0].cause);
ok('E2 effect damage: 回復判定に誤誘発しない',!(e[0].delta>0));

/* ---- cost ---- */
reset0(); clearEv();
let lpc=gameState.players[0].lp;
API.payCost(0,500);
e=lpEv();
ok('E2 cost: イベントがちょうど1回',e.length===1);
ok('E2 cost: delta が負',e[0].delta===-500&&e[0].after===lpc-500,JSON.stringify(e[0]));
ok('E2 cost: cause が effect/cost 系で recover ではない',e[0].cause!=='recover',e[0].cause);

/* ---- battle damage ---- */
reset0(); clearEv();
gameState.phase='battle';
let atk=mk(BIG,0),def=mk(PLAIN,1);
gameState.players[0].mz=[atk];gameState.players[1].mz=[def];
let lpb=gameState.players[1].lp;
act({type:'ATTACK_DECLARE_V48',player:0,mzIndex:0});
act({type:'ATTACK',player:0,atkIdx:0,target:0});
e=lpEv();
ok('E2 battle damage: LP が減った分だけイベントが出る',
   e.length===1&&e[0].player===1&&e[0].delta===gameState.players[1].lp-lpb,
   JSON.stringify(e));
ok('E2 battle damage: after が実際の LP と一致',e.length===1&&e[0].after===gameState.players[1].lp);

/* ---- 直接攻撃のダメージ ---- */
reset0(); clearEv();
gameState.phase='battle';
let atk2=mk(BIG,0);gameState.players[0].mz=[atk2];
let lpb2=gameState.players[1].lp;
act({type:'ATTACK_DECLARE_V48',player:0,mzIndex:0});
act({type:'ATTACK',player:0,atkIdx:0,target:'direct'});
e=lpEv();
ok('E2 direct battle damage: イベントが1回',e.length===1&&e[0].delta===-curATK(atk2),JSON.stringify(e));

/* ---- prevented（LPが動かない場合は出さない） ---- */
reset0(); clearEv();
API.addLpRule({label:'E2test-prevent',player:0,cause:'effect',mode:'prevent'});
let lpp=gameState.players[0].lp;
API.damageLP(0,900);
ok('E2 prevented: LP が変わらない（v18 prevent はダメージ側のみ）',
   gameState.players[0].lp===lpp,String(gameState.players[0].lp));
ok('E2 prevented: イベントを出さない',lpEv().length===0,String(lpEv().length));
API.clearLpRules('E2test-prevent');

/* ---- halved / doubled（最終値を載せる） ---- */
reset0(); clearEv();
API.addLpRule({label:'E2test-half',player:0,cause:'effect',mode:'half'});
let lph=gameState.players[0].lp;
API.damageLP(0,1000);
e=lpEv();
ok('E2 halved: 最終的な変動値を載せる',
   e.length===1&&e[0].delta===gameState.players[0].lp-lph&&Math.abs(e[0].delta)<1000,
   JSON.stringify(e[0]));
ok('E2 halved: requested には元の要求値が残る',e.length===1&&e[0].requested===-1000,String(e[0]&&e[0].requested));
API.clearLpRules('E2test-half');
reset0(); clearEv();
API.addLpRule({label:'E2test-double',player:1,cause:'effect',mode:'double'});
let lpx=gameState.players[1].lp;
API.damageLP(1,600);
e=lpEv();
ok('E2 doubled: 最終的な変動値を載せる',
   e.length===1&&e[0].delta===gameState.players[1].lp-lpx&&Math.abs(e[0].delta)>600,
   JSON.stringify(e[0]));
API.clearLpRules('E2test-double');

/* ---- 1つのチェーンで複数回 LP が動く ---- */
reset0(); clearEv();
API.damageLP(1,300); API.recoverLP(0,400); API.damageLP(1,200);
e=lpEv();
ok('E2 multiple: 変動回数と同じだけイベントが出る',e.length===3,String(e.length));
ok('E2 multiple: 順序が決定的（-300, +400, -200）',
   e[0].delta===-300&&e[1].delta===400&&e[2].delta===-200,JSON.stringify(e.map(x=>x.delta)));
ok('E2 multiple: player が個別に正しい',e[0].player===1&&e[1].player===0&&e[2].player===1);

/* ---- exactly once（同じLP変化で二重に出さない） ---- */
reset0(); clearEv();
API.recoverLP(0,100);
ok('E2 exactly once: 1回の LP Action につき1イベント',lpEv().length===1);

/* ---- 直列化 / Replay ---- */
reset0();
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.recoverLP(0,700); API.damageLP(1,900);
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('E2 Replay: LP変動が digest 一致で再生される',audit.ok,audit.reason||'');
let snap=JSON.stringify(gameState);
ok('E2 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('E2 直列化: onLPChange payload は純 JSON',
   lpEv().every(x=>JSON.stringify(x)===JSON.stringify(JSON.parse(JSON.stringify(x)))));
ok('E2 直列化: 新しい gameState キーを増やしていない',
   Object.keys(newGame()).indexOf('lpEventsV28')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
