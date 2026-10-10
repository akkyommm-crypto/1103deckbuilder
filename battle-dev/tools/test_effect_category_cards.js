/* EffectCategory recovery batch — 7枚の positive / negative / ruling edge case。 */
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
function answerAll(keys){const pc=pendingChoiceV49(gameState);if(!pc)throw new Error('no pending choice');
  return answerChoiceV49(keys||pc.candidates.map(x=>x.key));}
function evts(name){return (gameState.deferredEvents||[]).filter(e=>e.eventName===name).map(e=>e.evt);}
function clearEvts(){gameState.deferredEvents=[];}
function fire(name,player,zone,index,card,targets){
  clearEvts();
  act({type:'CHAIN_ADD',player,cardId:findCardIndex(name),uid:card?card.uid:null,name,
       from:zone,index,targets:targets||[]});
  return evts('onActivateSuccess').slice(-1)[0];
}
function evCtx(card,zone,evt){const c=ctxAt(card,zone,'onActivateSuccess',{event:evt});c.event=evt;return c;}
function lp(p){ return gameState.players[p].lp; }
function findName(pred){for(let i=0;i<CARD_DB.length;i++){if(pred(CARD_DB[i]))return CARD_DB[i].n;}return null;}
/* 小道具は既に TESTED のカードだけを使う。 */
const MON='ヂェミナイ・エルフ';
const DESTROY_SPELL='サイクロン';        /* 破壊する効果 */
const PLAIN_SPELL='死者蘇生';            /* 破壊もダメージも含まない */
const DMG=findName(d=>/ダメージを与え/.test(String(d.e||''))
  &&!/ダメージを与える効果が発動/.test(String(d.e||''))&&(d.k==='s'||d.k==='t'));
const DIS=findName(d=>/手札を[^。]{0,12}捨て(る|させ)/.test(String(d.e||''))
  &&!/捨てて発動|捨てる事で/.test(String(d.e||''))&&(d.k==='s'||d.k==='t'));
const FUSION=findName(d=>d.k==='m'&&(d.st||[]).indexOf('融合')>=0);

const NAMES=['スターダスト・ドラゴン','ネイビィロイド','ヂェミナイ・デビル',
 'ダメージ・ポラリライザー','フュージョン・ガード','黒板消しの罠','地獄の扉越し銃'];
NAMES.forEach(n=>ok('EffectCategory registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: 小道具カードがDBに揃っている',!!DMG&&!!DIS&&!!FUSION,
   [DMG,DIS,FUSION].join(' / '));

/* =====================================================================
   破壊する効果に応答する
   ===================================================================== */
/* スターダスト・ドラゴン は cards/46_v46_native.js の既存実装。
   カード名の直書き一覧を v19 の効果カテゴリへ差し替えた後の振る舞いを見る。 */
const SEL_DESTROY='ツイスター';   /* 「〜を選択して破壊する」の言い回し */
function sdCtx(card){ return makeContext(0,card,'mz',0,'activate',{}); }
function chainOf(name,player,zone,index,card,sel){
  ensureCardUid(gameState,card);
  gameState.chain=[{name,player,uid:card.uid,cardId:card.id,ss:2,from:zone,index,
    selection:sel?serializeChainSelectionV2(sel):[],targets:[]}];
  return gameState.chain[0];
}
let eSd=eff('スターダスト・ドラゴン','negate-destruction');
let eSdRet=eff('スターダスト・ドラゴン','end-return');
reset0();
let sd=mk('スターダスト・ドラゴン'),foeSp=mk(DESTROY_SPELL,1);
gameState.players[0].mz=[sd];gameState.players[1].sz=[foeSp];sync();
chainOf(DESTROY_SPELL,1,'sz',0,foeSp);
let cSd=sdCtx(sd);
ok('スターダスト・ドラゴン positive: 破壊する効果の発動にチェーンできる',
   eSd.condition(cSd)===true,cSd.reason||'');
run(eSd,cSd);
ok('スターダスト・ドラゴン: コストで自身をリリースしている',
   gameState.players[0].mz.length===0&&gameState.players[0].grave.some(c=>c.uid===sd.uid));
ok('スターダスト・ドラゴン positive: その発動を無効にする',
   gameState.chain[0].activationNegated===true);
let cRet=makeContext(0,sd,'grave',0,'onEndPhase',{event:{phase:'end'}});
ok('スターダスト・ドラゴン ruling: エンドフェイズに墓地から戻る条件が立つ',
   eSdRet.condition(cRet)===true,cRet.reason||'');
eSdRet.operation(cRet);
ok('スターダスト・ドラゴン ruling: 自身が戻る',
   gameState.players[0].mz.some(c=>c.uid===sd.uid));
reset0();
let sdSel=mk('スターダスト・ドラゴン'),foeSel=mk(SEL_DESTROY,1);
gameState.players[0].mz=[sdSel];gameState.players[1].sz=[foeSel];sync();
chainOf(SEL_DESTROY,1,'sz',0,foeSel);
ok('スターダスト・ドラゴン positive: 「選択して破壊する」形の効果にもチェーンできる',
   eSd.condition(sdCtx(sdSel))===true,SEL_DESTROY);
ok('スターダスト・ドラゴン: 判定はカード名一覧ではなく v19 カテゴリ',
   linkHasCategoryV19(gameState,gameState.chain[0],'destroy')===true);
reset0();
let sd2=mk('スターダスト・ドラゴン'),plain=mk(PLAIN_SPELL,1);
gameState.players[0].mz=[sd2];gameState.players[1].sz=[plain];sync();
chainOf(PLAIN_SPELL,1,'sz',0,plain);
ok('スターダスト・ドラゴン negative: 破壊しない効果にはチェーンできない',
   eSd.condition(sdCtx(sd2))===false);
reset0();
let sd3=mk('スターダスト・ドラゴン',0,'down');
gameState.players[0].mz=[sd3];gameState.players[1].sz=[mk(DESTROY_SPELL,1)];sync();
chainOf(DESTROY_SPELL,1,'sz',0,gameState.players[1].sz[0]);
ok('スターダスト・ドラゴン negative: 裏側表示では発動できない',
   eSd.condition(sdCtx(sd3))===false);

reset0();
let navy=mk('ネイビィロイド'),myTrap=mk('D2シールド',0,'down'),foeCyc=mk(DESTROY_SPELL,1);
gameState.players[0].mz=[navy];gameState.players[0].sz=[myTrap];
gameState.players[1].sz=[foeCyc];
gameState.players[0].hand=[mk(MON)];sync();
let eNv=eff('ネイビィロイド');
let evNv=fire(DESTROY_SPELL,1,'sz',0,foeCyc,[{p:0,zone:'sz',index:0,uid:myTrap.uid}]);
let cNv=evCtx(navy,'mz',evNv);
ok('ネイビィロイド positive: 自分の魔法・罠を対象にした破壊効果で誘発する',
   eNv.condition(cNv)===true,JSON.stringify(API.activationTargets(evNv).map(h=>h.zone)));
run(eNv,cNv);
ok('ネイビィロイド: コストで手札を1枚捨てている',gameState.players[0].hand.length===0);
ok('ネイビィロイド positive: 発動を無効にし破壊する',
   API.chainLinkNegated(evNv.chainId)===true&&gameState.players[1].sz.length===0);
reset0();
let navy2=mk('ネイビィロイド'),foeMon=mk(MON,1),foeCyc2=mk(DESTROY_SPELL,1);
gameState.players[0].mz=[navy2];gameState.players[1].mz=[foeMon];
gameState.players[1].sz=[foeCyc2];gameState.players[0].hand=[mk(MON)];sync();
ok('ネイビィロイド negative: 自分の魔法・罠を対象にしていなければ誘発しない',
   eNv.condition(evCtx(navy2,'mz',
     fire(DESTROY_SPELL,1,'sz',0,foeCyc2,[{p:1,zone:'mz',index:0,uid:foeMon.uid}])))===false);
reset0();
let navy3=mk('ネイビィロイド'),myTrap3=mk('D2シールド',0,'down'),foeCyc3=mk(DESTROY_SPELL,1);
gameState.players[0].mz=[navy3];gameState.players[0].sz=[myTrap3];
gameState.players[1].sz=[foeCyc3];sync();
ok('ネイビィロイド negative: 手札が無ければ誘発しない',
   eNv.condition(evCtx(navy3,'mz',
     fire(DESTROY_SPELL,1,'sz',0,foeCyc3,[{p:0,zone:'sz',index:0,uid:myTrap3.uid}])))===false);

/* =====================================================================
   手札を捨てる効果に応答する
   ===================================================================== */
reset0();
let gd=mk('ヂェミナイ・デビル'),foeDis=mk(DIS,1);
gameState.players[0].hand=[gd];gameState.players[1].sz=[foeDis];
gameState.players[0].deck=[mk(MON)];sync();
let eGd=eff('ヂェミナイ・デビル');
let evGd=fire(DIS,1,'sz',0,foeDis);
let cGd=evCtx(gd,'hand',evGd);
ok('ヂェミナイ・デビル positive: 手札を捨てる効果の発動で誘発する',eGd.condition(cGd)===true,DIS);
const handBefore=gameState.players[0].hand.length;
run(eGd,cGd);
ok('ヂェミナイ・デビル: コストで自身を墓地へ送っている',
   gameState.players[0].grave.some(c=>c.uid===gd.uid));
ok('ヂェミナイ・デビル positive: 発動を無効にし破壊する',
   API.chainLinkNegated(evGd.chainId)===true&&gameState.players[1].sz.length===0);
ok('ヂェミナイ・デビル positive: 1枚ドローする',
   gameState.players[0].hand.length===handBefore-1+1);
reset0();
let gd2=mk('ヂェミナイ・デビル'),foePlain=mk(PLAIN_SPELL,1);
gameState.players[0].hand=[gd2];gameState.players[1].sz=[foePlain];sync();
ok('ヂェミナイ・デビル negative: 捨てない効果では誘発しない',
   eGd.condition(evCtx(gd2,'hand',fire(PLAIN_SPELL,1,'sz',0,foePlain)))===false);
reset0();
let gd3=mk('ヂェミナイ・デビル'),ownDis=mk(DIS,0);
gameState.players[0].hand=[gd3];gameState.players[0].sz=[ownDis];sync();
ok('ヂェミナイ・デビル negative: 自分の発動では誘発しない',
   eGd.condition(evCtx(gd3,'hand',fire(DIS,0,'sz',0,ownDis)))===false);

/* =====================================================================
   ダメージを与える効果に応答する
   ===================================================================== */
reset0();
let pol=mk('ダメージ・ポラリライザー',0,'down'),foeDmg=mk(DMG,1);
gameState.players[0].sz=[pol];gameState.players[1].sz=[foeDmg];
gameState.players[0].deck=[mk(MON)];gameState.players[1].deck=[mk(MON,1)];sync();
let ePo=eff('ダメージ・ポラリライザー');
let evPo=fire(DMG,1,'sz',0,foeDmg);
let cPo=evCtx(pol,'sz',evPo);
ok('ダメージ・ポラリライザー positive: ダメージを与える効果で誘発する',ePo.condition(cPo)===true,DMG);
const h0=gameState.players[0].hand.length,h1=gameState.players[1].hand.length;
ePo.operation(cPo);
ok('ダメージ・ポラリライザー positive: 発動を無効にする',
   API.chainLinkNegated(evPo.chainId)===true);
ok('ダメージ・ポラリライザー positive: お互いが1枚ドローする',
   gameState.players[0].hand.length===h0+1&&gameState.players[1].hand.length===h1+1);
ok('ダメージ・ポラリライザー ruling: 発動元は破壊しない',gameState.players[1].sz.length===1);
reset0();
let pol2=mk('ダメージ・ポラリライザー',0,'down'),foePl=mk(PLAIN_SPELL,1);
gameState.players[0].sz=[pol2];gameState.players[1].sz=[foePl];sync();
ok('ダメージ・ポラリライザー negative: ダメージを与えない効果では誘発しない',
   ePo.condition(evCtx(pol2,'sz',fire(PLAIN_SPELL,1,'sz',0,foePl)))===false);

reset0();
let fg=mk('フュージョン・ガード',0,'down'),foeDmg2=mk(DMG,1),fus=mk(FUSION,0);
gameState.players[0].sz=[fg];gameState.players[1].sz=[foeDmg2];
gameState.players[0].ex=[fus];sync();
let eFg=eff('フュージョン・ガード');
let evFg=fire(DMG,1,'sz',0,foeDmg2);
let cFg=evCtx(fg,'sz',evFg);
ok('フュージョン・ガード positive: 融合デッキがあれば誘発する',eFg.condition(cFg)===true,FUSION);
eFg.operation(cFg);
ok('フュージョン・ガード positive: 発動を無効にする',
   API.chainLinkNegated(evFg.chainId)===true);
ok('フュージョン・ガード positive: 融合モンスターが墓地へ送られる',
   gameState.players[0].ex.length===0&&gameState.players[0].grave.some(c=>c.uid===fus.uid));
reset0();
let fg2=mk('フュージョン・ガード',0,'down'),foeDmg3=mk(DMG,1);
gameState.players[0].sz=[fg2];gameState.players[1].sz=[foeDmg3];sync();
ok('フュージョン・ガード negative: 融合デッキが空なら誘発しない',
   eFg.condition(evCtx(fg2,'sz',fire(DMG,1,'sz',0,foeDmg3)))===false);

reset0();
let era=mk('黒板消しの罠',0,'down'),foeDmg4=mk(DMG,1);
gameState.players[0].sz=[era];gameState.players[1].sz=[foeDmg4];
gameState.players[1].hand=[mk(MON,1)];sync();
let eEr=eff('黒板消しの罠');
let evEr=fire(DMG,1,'sz',0,foeDmg4);
let cEr=evCtx(era,'sz',evEr);
ok('黒板消しの罠 positive: ダメージを与える効果で誘発する',eEr.condition(cEr)===true);
eEr.operation(cEr);
let b0=lp(0);
API.damageLP(0,1500);
ok('黒板消しの罠 positive: そのチェーンのダメージだけを0にする',lp(0)===b0);
answerAll();
ok('黒板消しの罠 positive: 相手が手札を1枚捨てる',gameState.players[1].hand.length===0);
act({type:'CHAIN_CLEAR'});
API.damageLP(0,1500);
ok('黒板消しの罠 ruling: チェーンが終われば以後のダメージは通る',lp(0)===b0-1500);

reset0();
let gun=mk('地獄の扉越し銃',0,'down'),foeDmg5=mk(DMG,1);
gameState.players[0].sz=[gun];gameState.players[1].sz=[foeDmg5];sync();
let eGu=eff('地獄の扉越し銃');
let evGu=fire(DMG,1,'sz',0,foeDmg5);
let cGu=evCtx(gun,'sz',evGu);
ok('地獄の扉越し銃 positive: ダメージを与える効果で誘発する',eGu.condition(cGu)===true);
eGu.operation(cGu);
let g0=lp(0),g1=lp(1);
API.damageLP(0,1200);
ok('地獄の扉越し銃 positive: 自分が受けるダメージを相手に与える',
   lp(0)===g0&&lp(1)===g1-1200,'p0='+lp(0)+' p1='+lp(1));
ok('地獄の扉越し銃 ruling: 金額は変わらない',g1-lp(1)===1200);
act({type:'CHAIN_CLEAR'});
API.damageLP(0,500);
ok('地獄の扉越し銃 ruling: チェーンが終われば差し替えは終わる',lp(0)===g0-500);

/* =====================================================================
   Replay / SaveLoad / 直列化
   ===================================================================== */
reset0();
let rPo=mk('ダメージ・ポラリライザー',0,'down'),rDmg=mk(DMG,1);
gameState.players[0].sz=[rPo];gameState.players[1].sz=[rDmg];
gameState.players[0].deck=[mk(MON)];gameState.players[1].deck=[mk(MON,1)];sync();
v41ResetActionJournal(gameState);
ePo.operation(evCtx(rPo,'sz',fire(DMG,1,'sz',0,rDmg)));
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: カテゴリ応答を含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('直列化: v19 は state を持たない',
   assertEffectCategoryStatelessV19(gameState)===null);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
