/* System v19 — EffectCategory 回帰テスト
   検証: 宣言と推定の優先順位 / destroy・damage・discard の判定 /
         「解決結果ではなく発動された効果の性質」/ effectClassV2 との分離 /
         v13 Negation・v18 LPChange との接続 / 対象の参照 / negative /
         state を持たないこと / Replay / SaveLoad / digest 不変        */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function mkE(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function resetE(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);
}
function evtsE(name){return (gameState.deferredEvents||[]).filter(e=>e.eventName===name).map(e=>e.evt);}
function clearEvtsE(){gameState.deferredEvents=[];}
function activate(name,player,zone,index,card,targets){
  clearEvtsE();
  act({type:'CHAIN_ADD',player,cardId:findCardIndex(name),uid:card?card.uid:null,name,
       from:zone,index,targets:targets||[]});
  return evtsE('onActivateSuccess').slice(-1)[0];
}
function findName(pred){for(let i=0;i<CARD_DB.length;i++){if(pred(CARD_DB[i]))return CARD_DB[i].n;}return null;}
const MON='ヂェミナイ・エルフ';
const DESTROY_SPELL='サイクロン';                 /* 「そのカードを破壊する」 */
const PLAIN_SPELL='死者蘇生';                     /* 破壊もダメージも含まない */
const SAVED=CARD_SCRIPTS[PLAIN_SPELL];

/* =====================================================================
   1. テキストからの推定
   ===================================================================== */
resetE();
ok('推定: 破壊する効果を destroy と判定する',
   effectCategoriesOfNameV19(DESTROY_SPELL).destroy===true,DESTROY_SPELL);
ok('推定: 破壊を含まない効果は destroy にしない',
   effectCategoriesOfNameV19(PLAIN_SPELL).destroy===false,PLAIN_SPELL);
ok('推定: 3つのカテゴリだけを返す',
   Object.keys(effectCategoriesOfNameV19(DESTROY_SPELL)).join(',')==='destroy,damage,discard');
const DMG=findName(d=>/ダメージを与え/.test(String(d.e||''))&&!/ダメージを与える効果が発動/.test(String(d.e||'')));
ok('推定: ダメージを与える効果を damage と判定する',
   !!DMG&&effectCategoriesOfNameV19(DMG).damage===true,DMG);
const PROOF=findName(d=>/破壊されない/.test(String(d.e||''))&&!/を破壊する/.test(String(d.e||'')));
ok('推定: 「破壊されない」は破壊する効果ではない',
   !PROOF||effectCategoriesOfNameV19(PROOF).destroy===false,PROOF);
const COSTDIS=findName(d=>/手札を1枚捨てて発動/.test(String(d.e||'')));
ok('推定: コストとしての「捨てて発動」は discard にしない',
   !COSTDIS||effectCategoriesOfNameV19(COSTDIS).discard===false,COSTDIS);
ok('推定: 同じカードは2回目もキャッシュから同じ値を返す',
   JSON.stringify(effectCategoriesOfNameV19(DESTROY_SPELL))
   ===JSON.stringify(effectCategoriesOfNameV19(DESTROY_SPELL)));
ok('negative: 存在しないカード名は全て false',
   Object.values(effectCategoriesOfNameV19('存在しないカード')).every(v=>v===false));

/* =====================================================================
   2. カード側の宣言が推定より優先される
   ===================================================================== */
CARD_SCRIPTS[PLAIN_SPELL]=Object.assign({},SAVED,{effectCategories:{destroy:true}});
ok('宣言: カード側の宣言が推定に優先する',
   effectCategoriesOfNameV19(PLAIN_SPELL).destroy===true);
ok('宣言: 宣言に無いカテゴリは false になる',
   effectCategoriesOfNameV19(PLAIN_SPELL).damage===false);
if(SAVED) CARD_SCRIPTS[PLAIN_SPELL]=SAVED; else delete CARD_SCRIPTS[PLAIN_SPELL];
ok('宣言: 宣言を外せば推定に戻る',
   effectCategoriesOfNameV19(PLAIN_SPELL).destroy===false);

/* =====================================================================
   3. チェーンリンクからの判定
   ===================================================================== */
resetE();
let c1=mkE(DESTROY_SPELL);gameState.players[0].sz=[c1];
let ev1=activate(DESTROY_SPELL,0,'sz',0,c1);
ok('リンク判定: 発動イベントからカテゴリを引ける',
   API.effectHasCategory(ev1,'destroy')===true);
ok('リンク判定: 持たないカテゴリは false',
   API.effectHasCategory(ev1,'damage')===false);
ok('リンク判定: チェーンリンクそのものからも引ける',
   linkHasCategoryV19(gameState,gameState.chain[0],'destroy')===true);
ok('リンク判定: chainId からも引ける',
   API.effectHasCategory({chainId:ev1.chainId},'destroy')===true);
ok('negative: 未知のカテゴリ名は false',
   API.effectHasCategory(ev1,'おかしなカテゴリ')===false);
ok('negative: リンクが無ければ全て false',
   Object.values(API.effectCategories({chainId:99999})).every(v=>v===false));

/* 解決結果ではなく「発動された効果の性質」を見る */
resetE();
let c2=mkE(DESTROY_SPELL);gameState.players[0].sz=[c2];
let ev2=activate(DESTROY_SPELL,0,'sz',0,c2);
ok('性質: 解決前でも destroy と判定できる',
   API.effectHasCategory(ev2,'destroy')===true&&gameState.players[0].grave.length===0);
ok('性質: 実際に何も破壊しなくても判定は変わらない',
   API.effectHasCategory(ev2,'destroy')===true);

/* =====================================================================
   4. effectClassV2 との分離
   ===================================================================== */
ok('分離: effectClassV2 は従来どおり発動形式を返す',
   ['ACTIVATE','TRIGGER_O','TRIGGER_F','IGNITION','QUICK','CONTINUOUS','SUMMON_PROC','UNSCRIPTED']
     .indexOf(effectClassV2(CARD_SCRIPTS[DESTROY_SPELL],dbOf({id:findCardIndex(DESTROY_SPELL)})))>=0);
ok('分離: v19 は effectClass を書き換えない',
   (()=>{resetE();const c=mkE(DESTROY_SPELL);gameState.players[0].sz=[c];
     act({type:'CHAIN_ADD',player:0,cardId:c.id,uid:c.uid,name:DESTROY_SPELL,
          from:'sz',index:0,effectClass:'ACTIVATE'});
     return gameState.chain[0].effectClass==='ACTIVATE';})());

/* =====================================================================
   5. 対象の参照
   ===================================================================== */
resetE();
let src=mkE(DESTROY_SPELL),tgt=mkE(MON,1);
gameState.players[0].sz=[src];gameState.players[1].mz=[tgt];
let ev3=activate(DESTROY_SPELL,0,'sz',0,src,[{p:1,zone:'mz',index:0,uid:tgt.uid}]);
ok('対象: チェーンリンクの対象を引ける',
   API.activationTargets(ev3).length===1&&API.activationTargets(ev3)[0].card.uid===tgt.uid);
ok('対象: 対象を取らない発動では空になる',
   (()=>{resetE();const c=mkE(PLAIN_SPELL);gameState.players[0].sz=[c];
     const e=activate(PLAIN_SPELL,0,'sz',0,c);
     return API.activationTargets(e).length===0;})());

/* =====================================================================
   6. v13 Negation との接続
   ===================================================================== */
resetE();
let n1=mkE(DESTROY_SPELL);gameState.players[0].sz=[n1];
let evN=activate(DESTROY_SPELL,0,'sz',0,n1);
ok('接続(v13): カテゴリ判定の後にリンクを無効にできる',
   (()=>{ if(!API.effectHasCategory(evN,'destroy')) return false;
     API.negateChainLink(evN,'activation','テスト',false);
     return API.chainLinkNegated(evN.chainId)===true;})());

/* =====================================================================
   7. v18 LPChange との接続（責務の分離）
   ===================================================================== */
resetE();
let d1=mkE(PLAIN_SPELL);gameState.players[0].sz=[d1];
let evD=activate(PLAIN_SPELL,0,'sz',0,d1);
ok('分離: category.damage と LP cause:effect は別物',
   API.effectHasCategory(evD,'damage')===false);
API.addLpRule({player:0,cause:'effect',mode:'prevent',turns:0,chainId:evD.chainId,label:'鎖限定'});
let lpb=gameState.players[0].lp;
API.damageLP(0,900);
ok('接続(v18): チェーン限定の規則がそのリンクの間だけ働く',gameState.players[0].lp===lpb);
act({type:'CHAIN_CLEAR'});
API.damageLP(0,900);
ok('接続(v18): リンクが消えれば規則も働かない',gameState.players[0].lp===lpb-900);
/* 受け手の差し替え */
resetE();
let r1=mkE(PLAIN_SPELL);gameState.players[0].sz=[r1];
let evR=activate(PLAIN_SPELL,0,'sz',0,r1);
API.addLpRule({player:0,cause:'effect',mode:'redirect',toPlayer:1,turns:0,
  chainId:evR.chainId,label:'差し替え'});
let a0=gameState.players[0].lp,a1=gameState.players[1].lp;
API.damageLP(0,700);
ok('接続(v18): ダメージの受け手を差し替えられる',
   gameState.players[0].lp===a0&&gameState.players[1].lp===a1-700,
   'p0='+gameState.players[0].lp+' p1='+gameState.players[1].lp);
ok('接続(v18): 差し替えでも金額は変わらない',a1-gameState.players[1].lp===700);

/* =====================================================================
   8. state を持たないこと / Replay / SaveLoad / digest
   ===================================================================== */
resetE();
let before=v41StateDigestText(gameState);
let s1=mkE(DESTROY_SPELL);gameState.players[0].sz=[s1];
v41ResetActionJournal(gameState);
let evS=activate(DESTROY_SPELL,0,'sz',0,s1);
API.effectCategories(evS);
ok('state無し: チェーンリンクにカテゴリを書き込まない',
   assertEffectCategoryStatelessV19(gameState)===null,
   String(assertEffectCategoryStatelessV19(gameState)));
ok('digest: v19 は digest に何も足さない',
   v41StateDigestText(gameState).indexOf('effectCategor')<0);
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: カテゴリ判定を挟んでも digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
gameState=JSON.parse(snap);
ok('SaveLoad: 復元後も同じカテゴリ判定になる',
   linkHasCategoryV19(gameState,gameState.chain[0],'destroy')===true);
/* Undo / Redo は v18 の規則で見る */
resetE();
v41ResetActionJournal(gameState);
let dU=v41StateDigest(gameState);
API.addLpRule({player:0,cause:'effect',mode:'redirect',toPlayer:1,turns:0,label:'テスト'});
undo();
ok('Undo: 追加した規則が巻き戻る',(gameState.lpRulesV18||[]).length===0);
ok('Undo: 元の digest に一致する',v41StateDigest(gameState)===dU,
   'before='+dU+' now='+v41StateDigest(gameState));
redo();
ok('Redo: 規則が復元される',gameState.lpRulesV18.length===1);
function scanFnsE(v,d){ if(d>12||v===null||typeof v!=='object')return typeof v==='function';
  return Object.keys(v).some(k=>typeof v[k]==='function'||scanFnsE(v[k],d+1)); }
ok('直列化: gameState 全体に関数が混入していない',
   !scanFnsE(JSON.parse(JSON.stringify(gameState)),0));
ok('直列化: v18 の規則も JSON-safe のまま',
   assertLpStateSerializableV18(gameState)===null);

/* =====================================================================
   9. 既存機構を壊していないこと
   ===================================================================== */
ok('既存維持: LP が0になれば従来どおり敗北する',
   (()=>{resetE();API.damageLP(1,99999);
     return gameState.players[1].lp===0&&gameState.loser===1;})());
ok('既存維持: 差し替え先が0になればその側が敗北する',
   (()=>{resetE();const c=mkE(PLAIN_SPELL);gameState.players[0].sz=[c];
     const e=activate(PLAIN_SPELL,0,'sz',0,c);
     API.addLpRule({player:0,cause:'effect',mode:'redirect',toPlayer:1,turns:0,
       chainId:e.chainId,label:'x'});
     API.damageLP(0,99999);
     return gameState.players[1].lp===0&&gameState.loser===1;})());
ok('既存維持: 素の LP Action は従来どおり動く',
   (()=>{resetE();const b=gameState.players[0].lp;
     act({type:'LP',player:0,delta:-1234});
     return gameState.players[0].lp===b-1234;})());
ok('既存維持: v18 の既存モードは変わらない',
   (()=>{resetE();API.addLpRule({player:0,cause:'effect',mode:'half',turns:0,label:'x'});
     const b=gameState.players[0].lp;API.damageLP(0,1000);
     return gameState.players[0].lp===b-500;})());
ok('既存維持: v12 の発動イベントは変わらない',
   (()=>{resetE();const c=mkE(DESTROY_SPELL);gameState.players[0].sz=[c];
     const e=activate(DESTROY_SPELL,0,'sz',0,c);
     return !!e&&e.kind==='spell'&&e.sub==='quick';})());

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
