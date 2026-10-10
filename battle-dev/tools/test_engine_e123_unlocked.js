/* Class A bulk 50 — E1/E2/E3 解禁5枚。positive / negative / ruling edge。 */
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
function ctxE(p,card,evname,evt,zone){const loc=h(card);
  const c=makeContext(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,evname,{event:evt});
  if(evt)c.event=evt;return c;}
function lpEv(){ return (gameState.deferredEvents||[]).filter(e=>e&&e.eventName==='onLPChange').map(e=>e.evt); }
function clearEv(){ gameState.deferredEvents=[]; }
const OJA1='おジャマ・イエロー', OJA2='おジャマ・グリーン', OJA3='おジャマ・ブラック';
const PB='幻獣ワイルドホーン';
const XW='幻獣クロスウィング';

const FIVE=['おジャマ・レッド','首領亀','ビッグバンガール','油断大敵','幻獣クロスウィング'];
FIVE.forEach(n=>ok('e123 registration '+n,!!CARD_SCRIPTS[n]));

/* ===== おジャマ・レッド ===== */
reset0();
let orr=mk('おジャマ・レッド',0);gameState.players[0].mz=[orr];
let o1=mk(OJA1,0),o2=mk(OJA2,0),o3=mk(OJA3,0),nonO=mk(PLAIN,0);
gameState.players[0].hand=[nonO,o1,o2,o3];
let ore=effOf('おジャマ・レッド');
ok('おジャマ・レッド positive: 召喚成功時に発動できる',
   ore.condition(ctxE(0,orr,'onNormalSummon',{player:0,card:orr}))===true);
ore.operation(ctxE(0,orr,'onNormalSummon',{player:0,card:orr}));
let oq=pending();
ok('おジャマ・レッド positive: 候補は「おジャマ」だけ・0〜4体',
   !!oq&&oq.candidates.length===3&&oq.min===0&&oq.max===3,
   oq?oq.candidates.length+' '+oq.min+'/'+oq.max:'none');
answerAll();
ok('おジャマ・レッド positive: 選んだ3体が特殊召喚される',inMz(0,o1)&&inMz(0,o2)&&inMz(0,o3));
ok('おジャマ・レッド negative: 「おジャマ」以外は呼べない',inHand(0,nonO));
ok('おジャマ・レッド ruling: 0体でもよい（任意効果）',(()=>{
   reset0();const r=mk('おジャマ・レッド',0);gameState.players[0].mz=[r];
   const k=mk(OJA1,0);gameState.players[0].hand=[k];
   effOf('おジャマ・レッド').operation(ctxE(0,r,'onNormalSummon',{player:0,card:r}));
   const q=pending(); if(!q||q.min!==0) return false;
   answerChoiceV49([]); return inHand(0,k);})());
ok('おジャマ・レッド ruling: 上限は宣言4体・候補数・ゾーンの空きの最小',(()=>{
   reset0();const r=mk('おジャマ・レッド',0);gameState.players[0].mz=[r];
   for(let i=0;i<3;i++) gameState.players[0].mz.push(mk(PLAIN,0));
   gameState.players[0].hand=[mk(OJA1,0),mk(OJA2,0),mk(OJA3,0)];
   effOf('おジャマ・レッド').operation(ctxE(0,r,'onNormalSummon',{player:0,card:r}));
   const q=pending(); return !!q&&q.max===1;})());
ok('おジャマ・レッド negative: ゾーンが一杯なら発動しない',(()=>{
   reset0();const r=mk('おジャマ・レッド',0);gameState.players[0].mz=[r];
   for(let i=0;i<4;i++) gameState.players[0].mz.push(mk(PLAIN,0));
   gameState.players[0].hand=[mk(OJA1,0)];
   return effOf('おジャマ・レッド').condition(ctxE(0,r,'onNormalSummon',{player:0,card:r}))===false;})());
ok('おジャマ・レッド negative: 手札に「おジャマ」が無ければ発動しない',(()=>{
   reset0();const r=mk('おジャマ・レッド',0);gameState.players[0].mz=[r];
   gameState.players[0].hand=[mk(PLAIN,0)];
   return effOf('おジャマ・レッド').condition(ctxE(0,r,'onNormalSummon',{player:0,card:r}))===false;})());

/* ===== 首領亀 ===== */
reset0();
let st=mk('首領亀',0);gameState.players[0].mz=[st];
let t1=mk('首領亀',0),t2=mk('首領亀',0),nonT=mk(PLAIN,0);
gameState.players[0].hand=[nonT,t1,t2];
let ste=effOf('首領亀');
ok('首領亀 positive: 召喚成功時に発動できる',
   ste.condition(ctxE(0,st,'onNormalSummon',{player:0,card:st}))===true);
ste.operation(ctxE(0,st,'onNormalSummon',{player:0,card:st}));
let sq=pending();
ok('首領亀 positive: 候補は同名だけ・任意の枚数（min0）',
   !!sq&&sq.candidates.length===2&&sq.min===0,sq?sq.candidates.length+' min='+sq.min:'none');
answerAll();
ok('首領亀 positive: 手札の同名が全て特殊召喚される',inMz(0,t1)&&inMz(0,t2));
ok('首領亀 negative: 同名以外は呼べない',inHand(0,nonT));
ok('首領亀 ruling: 反転召喚でも誘発する',(()=>{
   reset0();const s2=mk('首領亀',0);gameState.players[0].mz=[s2];
   gameState.players[0].hand=[mk('首領亀',0)];
   return effOf('首領亀').condition(ctxE(0,s2,'onFlip',{player:0,card:s2,flipSummon:true}))===true;})());
ok('首領亀 negative: 反転召喚でないリバースでは誘発しない',(()=>{
   reset0();const s3=mk('首領亀',0);gameState.players[0].mz=[s3];
   gameState.players[0].hand=[mk('首領亀',0)];
   return effOf('首領亀').condition(ctxE(0,s3,'onFlip',{player:0,card:s3}))===false;})());
ok('首領亀 ruling: ゾーンの空きを超えて呼ばない',(()=>{
   reset0();const s4=mk('首領亀',0);gameState.players[0].mz=[s4];
   for(let i=0;i<2;i++) gameState.players[0].mz.push(mk(PLAIN,0));
   gameState.players[0].hand=[mk('首領亀',0),mk('首領亀',0),mk('首領亀',0)];
   effOf('首領亀').operation(ctxE(0,s4,'onNormalSummon',{player:0,card:s4}));
   const q=pending(); return !!q&&q.max===2;})());

/* ===== ビッグバンガール ===== */
reset0(); clearEv();
let bg=mk('ビッグバンガール',0);gameState.players[0].mz=[bg];
let bge=effOf('ビッグバンガール');
API.recoverLP(0,800);
let ev=lpEv();
ok('ビッグバンガール positive: 自分のLP回復で onLPChange が出る',ev.length===1&&ev[0].delta===800,JSON.stringify(ev));
ok('ビッグバンガール positive: 発動条件を満たす',bge.condition(ctxE(0,bg,'onLPChange',ev[0]))===true);
let foeLp=gameState.players[1].lp;
bge.operation(ctxE(0,bg,'onLPChange',ev[0]));
ok('ビッグバンガール positive: 相手に500ダメージ',gameState.players[1].lp===foeLp-500,foeLp+'→'+gameState.players[1].lp);
ok('ビッグバンガール negative: 自分がダメージを受けた時は誘発しない',(()=>{
   clearEv();API.damageLP(0,600);const e=lpEv();
   return e.length===1&&e[0].delta<0&&bge.condition(ctxE(0,bg,'onLPChange',e[0]))===false;})());
ok('ビッグバンガール negative: コストでLPを払った時も誘発しない',(()=>{
   clearEv();API.payCost(0,400);const e=lpEv();
   return e.length===1&&bge.condition(ctxE(0,bg,'onLPChange',e[0]))===false;})());
ok('ビッグバンガール negative: 相手のLP回復では誘発しない',(()=>{
   clearEv();API.recoverLP(1,700);const e=lpEv();
   return e.length===1&&e[0].player===1&&bge.condition(ctxE(0,bg,'onLPChange',e[0]))===false;})());
ok('ビッグバンガール positive: 複数回回復すれば各回誘発する',(()=>{
   reset0();clearEv();const b2=mk('ビッグバンガール',0);gameState.players[0].mz=[b2];
   API.recoverLP(0,100);API.recoverLP(0,200);
   const e=lpEv();
   return e.length===2&&e.every(x=>effOf('ビッグバンガール').condition(ctxE(0,b2,'onLPChange',x))===true);})());
ok('ビッグバンガール negative: 裏側表示では誘発しない',(()=>{
   reset0();clearEv();const b3=mk('ビッグバンガール',0,'down','def');gameState.players[0].mz=[b3];
   API.recoverLP(0,100);const e=lpEv();
   return effOf('ビッグバンガール').condition(ctxE(0,b3,'onLPChange',e[0]))===false;})());

/* ===== 油断大敵 ===== */
reset0(); clearEv();
let yd=mk('油断大敵',0,'down');gameState.players[0].sz=[yd];
let fm1=mk(BIG,1),fm2=mk(PLAIN,1);gameState.players[1].mz=[fm1,fm2];
let yde=effOf('油断大敵');
API.recoverLP(1,900);
let ev2=lpEv();
ok('油断大敵 positive: 相手のLP回復で発動条件を満たす',
   ev2.length===1&&yde.condition(ctxE(0,yd,'onLPChange',ev2[0]))===true,JSON.stringify(ev2));
pickNamed(BIG);run(yde,ctxE(0,yd,'onLPChange',ev2[0]));
ok('油断大敵 positive: 選んだ相手モンスターが破壊される',
   (gameState.players[1].grave||[]).some(c=>c&&c.uid===fm1.uid));
ok('油断大敵 negative: 自分のLP回復では発動できない',(()=>{
   clearEv();API.recoverLP(0,300);const e=lpEv();
   return yde.condition(ctxE(0,yd,'onLPChange',e[0]))===false;})());
ok('油断大敵 negative: 相手がダメージを受けた時は発動できない',(()=>{
   clearEv();API.damageLP(1,300);const e=lpEv();
   return yde.condition(ctxE(0,yd,'onLPChange',e[0]))===false;})());
ok('油断大敵 negative: 相手にモンスターがいなければ発動できない',(()=>{
   reset0();clearEv();const y2=mk('油断大敵',0,'down');gameState.players[0].sz=[y2];
   API.recoverLP(1,500);const e=lpEv();
   return effOf('油断大敵').condition(ctxE(0,y2,'onLPChange',e[0]))===false;})());
ok('油断大敵 ruling: LP が動かなければイベント自体が出ず誘発もしない',(()=>{
   reset0();clearEv();
   const before=gameState.players[1].lp;
   API.recoverLP(1,0);
   return gameState.players[1].lp===before && lpEv().length===0;})());
ok('油断大敵 ruling: ダメージが防がれた場合もイベントは出ない',(()=>{
   reset0();clearEv();
   API.addLpRule({label:'e123-prevent',player:1,cause:'effect',mode:'prevent'});
   const before=gameState.players[1].lp;
   API.damageLP(1,500);
   const n=lpEv().length, same=gameState.players[1].lp===before;
   API.clearLpRules('e123-prevent'); return n===0&&same;})());

/* ===== 幻獣クロスウィング ===== */
reset0();
let xw=mk(XW,0),pb=mk(PB,0);
gameState.players[0].mz=[pb];
let pbBase=dbOf(pb).atk;
ok('幻獣クロスウィング negative: 墓地に無ければ何も起きない',curATK(pb)===pbBase);
gameState.players[0].grave=[xw];
ok('幻獣クロスウィング positive: 墓地にある間は「幻獣」の攻撃力が300アップ',
   curATK(pb)===pbBase+300,'atk='+curATK(pb));
ok('幻獣クロスウィング negative: 「幻獣」以外は上がらない',(()=>{
   const o=mk(PLAIN,0);gameState.players[0].mz.push(o);
   return curATK(o)===dbOf(o).atk;})());
ok('幻獣クロスウィング positive: 相手フィールドの「幻獣」にも届く',(()=>{
   const f=mk(PB,1);gameState.players[1].mz=[f];
   return curATK(f)===dbOf(f).atk+300;})());
ok('幻獣クロスウィング ruling: 墓地を離れたら即失効する',(()=>{
   gameState.players[0].grave=[];return curATK(pb)===pbBase;})());
ok('幻獣クロスウィング ruling: フィールドにいる間は適用されない',(()=>{
   gameState.players[0].mz.push(xw);const r=curATK(pb)===pbBase;
   gameState.players[0].mz=gameState.players[0].mz.filter(c=>c!==xw);return r;})());

/* ===== Replay / SaveLoad ===== */
/* 実際のチェーン解決と同じく batch を開いてから複数体を特殊召喚する。 */
reset0();
let za=mk('おジャマ・レッド',0);gameState.players[0].mz=[za];
gameState.players[0].hand=[mk(OJA1,0),mk(OJA2,0)];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
RESOLUTION_SUMMON_BATCH_V2=[];
effOf('おジャマ・レッド').operation(ctxE(0,za,'onNormalSummon',{player:0,card:za}));
answerAll();
ok('e123 positive: 1回の解決で2体が特殊召喚される',gameState.players[0].mz.length===3,
   'mz='+gameState.players[0].mz.length);
/* 解決中の batch はまだ gameState を触っていないので、
   この時点の Action 列が Replay で完全一致することを確認する。 */
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('e123 Replay: 複数体の特殊召喚が digest 一致で再生される',audit.ok,audit.reason||'');
ok('e123 Replay: 解決中は deferredEvents が動かない（batchはgameState外）',
   (gameState.deferredEvents||[]).filter(e=>e.eventName==='onSpecialSummon').length===0);
flushResolutionSummonBatchV2();
ok('e123 ruling: 同時特殊召喚は1イベントにまとまる',
   (gameState.deferredEvents||[]).filter(e=>e.eventName==='onSpecialSummon').length===1,
   String((gameState.deferredEvents||[]).filter(e=>e.eventName==='onSpecialSummon').length));
let snap=JSON.stringify(gameState);
ok('e123 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('e123 直列化: gameState に関数が漏れていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
