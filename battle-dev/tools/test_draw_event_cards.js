/* DrawEvent recovery batch — 13枚の positive / negative / ruling edge case。 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
let __u=99900;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return{id,owner:p,controller:p,face,pos,uid:__u++};}
function reset0(phase){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;
  gameState.phase=phase||'main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
}
function eff(n,k){const e=nativeEffectsV4(n).find(x=>!k||x.key===k);if(!e)throw new Error('effect '+n+' '+k);return e;}
function ctxAt(card,zone,ev,extra){const h=locateCardAnyV4(card);
  return makeContext(0,card,zone||(h&&h.zone)||'sz',(h&&h.index)||0,ev||'activate',extra||{});}
function lastDrawEvt(){const q=(gameState.deferredEvents||[]).filter(e=>e.eventName==='onDrawCard');
  return q.length?q[q.length-1].evt:null;}
function lastAddEvt(){const q=(gameState.deferredEvents||[]).filter(e=>e.eventName==='onAddToHand');
  return q.length?q[q.length-1].evt:null;}
const MID='ヂェミナイ・エルフ',SPELL='サイクロン';
function findName(pred){for(let i=0;i<CARD_DB.length;i++){if(pred(CARD_DB[i]))return CARD_DB[i].n;}return null;}
const VANILLA=findName(d=>d.k==='m'&&(d.st||[]).includes('通常')&&(d.lv||0)<=4);
const DARKMON=findName(d=>d.k==='m'&&d.at==='闇'&&!d.ex);
const FAIRY  =findName(d=>d.k==='m'&&d.ra==='天使'&&!d.ex);
const SIXSAM =findName(d=>d.k==='m'&&isCardInGroupV4(d,GROUP.SIX_SAMURAI_NAMED));
const PLANT  =findName(d=>d.k==='m'&&d.ra==='植物'&&!d.ex);
const GENEXM =findName(d=>d.k==='m'&&isCardInGroupV4(d,GROUP.GENEX)&&!d.ex);
const INFER  =findName(d=>d.k==='m'&&isSetCardV4(d,SETCODE.INFERNITY));

const NAMES=['凡骨の意地','漆黒のトバリ','神速の具足','光神テテュス','インフェルニティ・デーモン',
 'インフェルニティ・リローダー','フレグランス・ストーム','悪魔の偵察者','はたき落とし',
 'ナチュル・ラグウィード','便乗','神の恵み','レアル・ジェネクス・アクセラレーター'];
NAMES.forEach(n=>ok('DrawEvent registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: 小道具カードがDBに揃っている',
   !!VANILLA&&!!DARKMON&&!!FAIRY&&!!SIXSAM&&!!PLANT&&!!GENEXM&&!!INFER,
   [VANILLA,DARKMON,FAIRY,SIXSAM,PLANT,GENEXM,INFER].join(' / '));

/* ---- ドローフェイズの通常ドローで誘発する3枚 ---- */
function drawPhaseCase(name,drawName,otherName,check){
  reset0('draw');
  const s=mk(name);gameState.players[0].sz=[s];
  gameState.players[0].deck=[mk(drawName),mk(MID)];
  v41ResetActionJournal(gameState);
  API.drawNormal(0,1);
  const e=eff(name);
  const c=ctxAt(s,'sz','onDrawCard',{event:lastDrawEvt()});
  ok(name+' positive: 通常ドローで条件を満たす',e.condition(c)===true,JSON.stringify(lastDrawEvt()));
  if(check){e.operation(c);check();}
  reset0('draw');
  const s2=mk(name);gameState.players[0].sz=[s2];
  gameState.players[0].deck=[mk(otherName),mk(MID)];
  v41ResetActionJournal(gameState);
  API.drawNormal(0,1);
  ok(name+' negative: 条件外のカードでは誘発しない',
     eff(name).condition(ctxAt(s2,'sz','onDrawCard',{event:lastDrawEvt()}))===false);
  reset0('main1');
  const s3=mk(name);gameState.players[0].sz=[s3];
  gameState.players[0].deck=[mk(drawName),mk(MID)];
  v41ResetActionJournal(gameState);
  API.draw(0,1);
  ok(name+' ruling: 効果ドローでは誘発しない（テキストは「ドローフェイズに」）',
     eff(name).condition(ctxAt(s3,'sz','onDrawCard',{event:lastDrawEvt()}))===false);
}
drawPhaseCase('凡骨の意地',VANILLA,SPELL,()=>{
  ok('凡骨の意地: もう1枚ドローする',gameState.players[0].hand.length===2,
     'hand='+gameState.players[0].hand.length);});
drawPhaseCase('漆黒のトバリ',DARKMON,SPELL,()=>{
  ok('漆黒のトバリ: 引いたカードを墓地へ送り1枚ドローする',
     gameState.players[0].grave.length===1&&gameState.players[0].hand.length===1,
     'grave='+gameState.players[0].grave.length+' hand='+gameState.players[0].hand.length);});
drawPhaseCase('神速の具足',SIXSAM,SPELL,()=>{
  ok('神速の具足: 引いた「六武衆」を特殊召喚する',gameState.players[0].mz.length===1);});

/* ---- 光神テテュス ---- */
reset0('main1');
let tt=mk('光神テテュス');gameState.players[0].mz=[tt];
gameState.players[0].deck=[mk(FAIRY),mk(MID)];
v41ResetActionJournal(gameState);
API.draw(0,1);
let e4=eff('光神テテュス');
let c4=ctxAt(tt,'mz','onDrawCard',{event:lastDrawEvt()});
ok('光神テテュス positive: 天使族を引いたら誘発する',e4.condition(c4)===true);
e4.operation(c4);
ok('光神テテュス: もう1枚ドローする',gameState.players[0].hand.length===2);
reset0('main1');
tt=mk('光神テテュス');gameState.players[0].mz=[tt];
gameState.players[0].deck=[mk(SPELL),mk(MID)];
v41ResetActionJournal(gameState);API.draw(0,1);
ok('光神テテュス negative: 天使族以外では誘発しない',
   eff('光神テテュス').condition(ctxAt(tt,'mz','onDrawCard',{event:lastDrawEvt()}))===false);
ok('光神テテュス ruling: 通常ドローでも誘発する（テキストに限定が無い）',
   (()=>{reset0('draw');const t=mk('光神テテュス');gameState.players[0].mz=[t];
     gameState.players[0].deck=[mk(FAIRY),mk(MID)];v41ResetActionJournal(gameState);
     API.drawNormal(0,1);
     return eff('光神テテュス').condition(ctxAt(t,'mz','onDrawCard',{event:lastDrawEvt()}))===true;})());

/* ---- インフェルニティ・デーモン ---- */
reset0('main1');
let idm=mk('インフェルニティ・デーモン');
gameState.players[0].deck=[idm];gameState.players[0].hand=[];
v41ResetActionJournal(gameState);
API.draw(0,1);
let e5=eff('インフェルニティ・デーモン','drawn-with-empty-hand-special-summon');
let c5=ctxAt(idm,'hand','onDrawCard',{event:lastDrawEvt()});
ok('インフェルニティ・デーモン positive: 手札0枚で自身をドローしたら誘発する',e5.condition(c5)===true);
e5.operation(c5);
ok('インフェルニティ・デーモン: 手札から特殊召喚される',
   gameState.players[0].mz.length===1&&gameState.players[0].mz[0].uid===idm.uid);
reset0('main1');
let idm2=mk('インフェルニティ・デーモン');
gameState.players[0].deck=[idm2];gameState.players[0].hand=[mk(MID)];
v41ResetActionJournal(gameState);API.draw(0,1);
ok('インフェルニティ・デーモン negative: 手札が残っていれば誘発しない',
   eff('インフェルニティ・デーモン','drawn-with-empty-hand-special-summon')
     .condition(ctxAt(idm2,'hand','onDrawCard',{event:lastDrawEvt()}))===false);
reset0('main1');
let idm3=mk('インフェルニティ・デーモン'),other=mk(MID);
gameState.players[0].deck=[other];gameState.players[0].hand=[idm3];
v41ResetActionJournal(gameState);API.draw(0,1);
ok('インフェルニティ・デーモン ruling: 別のカードを引いても誘発しない',
   eff('インフェルニティ・デーモン','drawn-with-empty-hand-special-summon')
     .condition(ctxAt(idm3,'hand','onDrawCard',{event:lastDrawEvt()}))===false);

/* ---- インフェルニティ・リローダー ---- */
reset0('main1');
let irl=mk('インフェルニティ・リローダー');gameState.players[0].mz=[irl];
gameState.players[0].hand=[];gameState.players[0].deck=[mk(MID)];
v41ResetActionJournal(gameState);
let e6=eff('インフェルニティ・リローダー');
ok('インフェルニティ・リローダー positive: 手札0枚なら発動できる',e6.condition(ctxAt(irl,'mz'))===true);
e6.operation(ctxAt(irl,'mz'));
ok('インフェルニティ・リローダー: モンスターを引いたらレベル×200のダメージ',
   gameState.players[1].lp===8000-((dbOf({id:findCardIndex(MID)}).lv||0)*200),
   'lp='+gameState.players[1].lp);
reset0('main1');
let irl2=mk('インフェルニティ・リローダー');gameState.players[0].mz=[irl2];
gameState.players[0].hand=[];gameState.players[0].deck=[mk(SPELL)];
v41ResetActionJournal(gameState);
eff('インフェルニティ・リローダー').operation(ctxAt(irl2,'mz'));
ok('インフェルニティ・リローダー ruling: 魔法・罠を引いたら自分が500ダメージ',
   gameState.players[0].lp===8000-500,'lp='+gameState.players[0].lp);
reset0('main1');
let irl3=mk('インフェルニティ・リローダー');gameState.players[0].mz=[irl3];
gameState.players[0].hand=[mk(MID)];gameState.players[0].deck=[mk(MID)];
ok('インフェルニティ・リローダー negative: 手札があれば発動できない',
   eff('インフェルニティ・リローダー').condition(ctxAt(irl3,'mz'))===false);

/* ---- フレグランス・ストーム ---- */
reset0('main1');
let fs2=mk('フレグランス・ストーム'),plant=mk(PLANT);
gameState.players[0].sz=[fs2];gameState.players[0].mz=[plant];
gameState.players[0].deck=[mk(PLANT),mk(MID),mk(MID)];
v41ResetActionJournal(gameState);
let e7=eff('フレグランス・ストーム');
let c7=ctxAt(fs2,'sz');
ok('フレグランス・ストーム positive: 植物族がいれば発動できる',e7.condition(c7)===true);
e7.target(c7,r=>{c7.selectedTargets=r;});e7.operation(c7);
ok('フレグランス・ストーム: 破壊して2枚ドローする（引いたのが植物族）',
   gameState.players[0].mz.length===0&&gameState.players[0].hand.length===2,
   'hand='+gameState.players[0].hand.length);
reset0('main1');
let fs3=mk('フレグランス・ストーム'),plant2=mk(PLANT);
gameState.players[0].sz=[fs3];gameState.players[0].mz=[plant2];
gameState.players[0].deck=[mk(SPELL),mk(MID)];
v41ResetActionJournal(gameState);
let c7b=ctxAt(fs3,'sz');
eff('フレグランス・ストーム').target(c7b,r=>{c7b.selectedTargets=r;});
eff('フレグランス・ストーム').operation(c7b);
ok('フレグランス・ストーム ruling: 引いたのが植物族でなければ1枚だけ',
   gameState.players[0].hand.length===1,'hand='+gameState.players[0].hand.length);
reset0('main1');
let fs4=mk('フレグランス・ストーム');gameState.players[0].sz=[fs4];
gameState.players[0].deck=[mk(MID)];
ok('フレグランス・ストーム negative: 植物族がいなければ発動できない',
   eff('フレグランス・ストーム').condition(ctxAt(fs4,'sz'))===false);

/* ---- 悪魔の偵察者 ---- */
reset0('main1');
let scout=mk('悪魔の偵察者');gameState.players[0].mz=[scout];
gameState.players[1].deck=[mk(SPELL,1),mk(MID,1),mk(SPELL,1),mk(MID,1)];
v41ResetActionJournal(gameState);
let e8=eff('悪魔の偵察者');
let c8=ctxAt(scout,'mz','onFlip',{event:{card:scout,player:0}});
ok('悪魔の偵察者 positive: リバースで誘発する',e8.condition(c8)===true);
e8.operation(c8);
ok('悪魔の偵察者: 相手が3枚引き、その中の魔法だけ捨てる',
   gameState.players[1].hand.length===1&&gameState.players[1].grave.length===2,
   'hand='+gameState.players[1].hand.length+' grave='+gameState.players[1].grave.length);
reset0('main1');
let scout2=mk('悪魔の偵察者');gameState.players[0].mz=[scout2];
gameState.players[1].deck=[];
ok('悪魔の偵察者 negative: 相手のデッキが空なら誘発しない',
   eff('悪魔の偵察者').condition(ctxAt(scout2,'mz','onFlip',{event:{card:scout2,player:0}}))===false);

/* ---- はたき落とし ---- */
reset0('draw');
gameState.activePlayer=1;
let hk=mk('はたき落とし');gameState.players[0].sz=[hk];
gameState.players[1].deck=[mk(MID,1)];
v41ResetActionJournal(gameState);
API.drawNormal(1,1);
let e9=eff('はたき落とし');
let c9=ctxAt(hk,'sz','onDrawCard',{event:lastDrawEvt()});
ok('はたき落とし positive: 相手の通常ドローで発動できる',e9.condition(c9)===true);
e9.operation(c9);
ok('はたき落とし: 引いたカードを捨てさせる',
   gameState.players[1].hand.length===0&&gameState.players[1].grave.length===1);
reset0('main1');
gameState.activePlayer=1;
let hk2=mk('はたき落とし');gameState.players[0].sz=[hk2];
gameState.players[1].deck=[mk(MID,1)];
v41ResetActionJournal(gameState);API.draw(1,1);
ok('はたき落とし negative: 効果ドローでは発動できない',
   eff('はたき落とし').condition(ctxAt(hk2,'sz','onDrawCard',{event:lastDrawEvt()}))===false);
reset0('draw');
let hk3=mk('はたき落とし');gameState.players[0].sz=[hk3];
gameState.players[0].deck=[mk(MID)];
v41ResetActionJournal(gameState);API.drawNormal(0,1);
ok('はたき落とし negative: 自分のドローでは発動できない',
   eff('はたき落とし').condition(ctxAt(hk3,'sz','onDrawCard',{event:lastDrawEvt()}))===false);

/* ---- ナチュル・ラグウィード ---- */
reset0('main1');
gameState.activePlayer=1;
let rag=mk('ナチュル・ラグウィード');gameState.players[0].mz=[rag];
gameState.players[0].deck=[mk(MID),mk(MID)];gameState.players[1].deck=[mk(MID,1)];
v41ResetActionJournal(gameState);
API.draw(1,1);
let e10=eff('ナチュル・ラグウィード');
let c10=ctxAt(rag,'mz','onDrawCard',{event:lastDrawEvt()});
ok('ナチュル・ラグウィード positive: 相手のドローフェイズ以外のドローで誘発する',e10.condition(c10)===true);
let paid=false;e10.cost(c10,v=>{paid=v;});
ok('ナチュル・ラグウィード: 自身を墓地へ送るコストを払う',paid&&gameState.players[0].mz.length===0);
e10.operation(c10);
ok('ナチュル・ラグウィード: 2枚ドローする',gameState.players[0].hand.length===2);
reset0('draw');
gameState.activePlayer=1;
let rag2=mk('ナチュル・ラグウィード');gameState.players[0].mz=[rag2];
gameState.players[0].deck=[mk(MID),mk(MID)];gameState.players[1].deck=[mk(MID,1)];
v41ResetActionJournal(gameState);API.drawNormal(1,1);
ok('ナチュル・ラグウィード negative: ドローフェイズの通常ドローでは誘発しない',
   eff('ナチュル・ラグウィード').condition(ctxAt(rag2,'mz','onDrawCard',{event:lastDrawEvt()}))===false);

/* ---- 便乗 ---- */
reset0('main1');
gameState.activePlayer=1;
let bj=mk('便乗');gameState.players[0].sz=[bj];
gameState.players[0].deck=[mk(MID),mk(MID)];gameState.players[1].deck=[mk(MID,1)];
v41ResetActionJournal(gameState);
API.draw(1,1);
let e11=eff('便乗');
let c11=ctxAt(bj,'sz','onDrawCard',{event:lastDrawEvt()});
ok('便乗 positive: 相手のドローフェイズ以外のドローで誘発する',e11.condition(c11)===true);
e11.operation(c11);
ok('便乗: 2枚ドローする',gameState.players[0].hand.length===2);
reset0('draw');
gameState.activePlayer=1;
let bj2=mk('便乗');gameState.players[0].sz=[bj2];
gameState.players[0].deck=[mk(MID),mk(MID)];gameState.players[1].deck=[mk(MID,1)];
v41ResetActionJournal(gameState);API.drawNormal(1,1);
ok('便乗 negative: 通常ドローでは誘発しない',
   eff('便乗').condition(ctxAt(bj2,'sz','onDrawCard',{event:lastDrawEvt()}))===false);

/* ---- 神の恵み ---- */
reset0('main1');
let bless=mk('神の恵み');gameState.players[0].sz=[bless];
gameState.players[0].deck=[mk(MID),mk(MID)];
v41ResetActionJournal(gameState);
API.draw(0,1);
let e12=eff('神の恵み');
let c12=ctxAt(bless,'sz','onDrawCard',{event:lastDrawEvt()});
ok('神の恵み positive: 自分のドローで誘発する',e12.condition(c12)===true);
e12.operation(c12);
ok('神の恵み: 500回復する',gameState.players[0].lp===8000+500);
reset0('main1');
let bless2=mk('神の恵み');gameState.players[0].sz=[bless2];
gameState.players[1].deck=[mk(MID,1)];
v41ResetActionJournal(gameState);API.draw(1,1);
ok('神の恵み negative: 相手のドローでは誘発しない',
   eff('神の恵み').condition(ctxAt(bless2,'sz','onDrawCard',{event:lastDrawEvt()}))===false);

/* ---- レアル・ジェネクス・アクセラレーター ---- */
reset0('main1');
let acc=mk('レアル・ジェネクス・アクセラレーター');gameState.players[0].mz=[acc];
gameState.players[0].deck=[mk(GENEXM)];
v41ResetActionJournal(gameState);
API.deckToHand(0,0,'サーチ');
let e13=eff('レアル・ジェネクス・アクセラレーター');
let c13=ctxAt(acc,'mz','onAddToHand',{event:lastAddEvt()});
ok('レアル・ジェネクス・アクセラレーター positive: 「ジェネクス」が手札に加わったら誘発する',
   e13.condition(c13)===true,JSON.stringify(lastAddEvt()));
e13.operation(c13);
ok('レアル・ジェネクス・アクセラレーター: 手札から特殊召喚する',gameState.players[0].mz.length===2);
reset0('main1');
let acc2=mk('レアル・ジェネクス・アクセラレーター');gameState.players[0].mz=[acc2];
gameState.players[0].deck=[mk(MID)];
v41ResetActionJournal(gameState);API.deckToHand(0,0,'サーチ');
ok('レアル・ジェネクス・アクセラレーター negative: 「ジェネクス」以外では誘発しない',
   eff('レアル・ジェネクス・アクセラレーター')
     .condition(ctxAt(acc2,'mz','onAddToHand',{event:lastAddEvt()}))===false);
ok('レアル・ジェネクス・アクセラレーター ruling: ドローでは誘発しない（サーチ限定）',
   (()=>{reset0('main1');const a=mk('レアル・ジェネクス・アクセラレーター');
     gameState.players[0].mz=[a];gameState.players[0].deck=[mk(GENEXM)];
     v41ResetActionJournal(gameState);API.draw(0,1);
     return (gameState.deferredEvents||[]).filter(e=>e.eventName==='onAddToHand').length===0;})());

/* ---- 全体の健全性 ---- */
ok('DrawEvent cards: 盤面はJSON直列化できる',!!JSON.stringify(gameState));
reset0('main1');
let rc=mk('神の恵み');gameState.players[0].sz=[rc];gameState.players[0].deck=[mk(MID),mk(MID)];
v41ResetActionJournal(gameState);
API.draw(0,1);
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('DrawEvent cards: ドロー記録を含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
