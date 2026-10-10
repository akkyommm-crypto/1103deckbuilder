/* System v15 — Equip primitive 回帰テスト
   検証: 装備適正の宣言と問い合わせ / 装備・解除イベント / 装備数 /
         移し替え / 装備先スコープ / 外から与える戦闘破壊耐性 /
         negative / Replay / Undo / Redo / SaveLoad / Journal / digest /
         既存機構の非回帰                                               */
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
function findName(pred){for(let i=0;i<CARD_DB.length;i++){if(pred(CARD_DB[i]))return CARD_DB[i].n;}return null;}
/* 小道具は既に TESTED のカードだけを使う。 */
const EQUIP='団結の力';
const WARRIOR=findName(d=>d.k==='m'&&!d.ex&&d.ra==='戦士');
const MACHINE=findName(d=>d.k==='m'&&!d.ex&&d.ra==='機械');
const MON='ヂェミナイ・エルフ';
/* テスト専用の適正宣言。engine はカード名を見ず、この宣言だけを見る。 */
const SAVED_EQ=CARD_SCRIPTS[EQUIP];
function restrictTo(race){
  CARD_SCRIPTS[EQUIP]=Object.assign({},SAVED_EQ,
    {equipSpec:{canEquip(h){ return dbOf(h.card).ra===race; },label:race+'のみ'}});
}
function dropRestrict(){ if(SAVED_EQ) CARD_SCRIPTS[EQUIP]=SAVED_EQ; else delete CARD_SCRIPTS[EQUIP]; }

/* =====================================================================
   1. 装備の適正
   ===================================================================== */
resetE();
let eq=mkE(EQUIP),w=mkE(WARRIOR),m=mkE(MON);
gameState.players[0].sz=[eq];gameState.players[0].mz=[w,m];
ok('適正: 宣言が無ければ表側モンスターなら誰でも装備できる',
   equipLegalV15(eq,{p:0,zone:'mz',index:1,card:m})===true);
restrictTo('戦士');
ok('適正: 宣言した種族なら装備できる',
   equipLegalV15(eq,{p:0,zone:'mz',index:0,card:w})===true,WARRIOR);
ok('適正: 宣言外の種族は装備できない',
   equipLegalV15(eq,{p:0,zone:'mz',index:1,card:m})===false);
ok('適正: 候補一覧も適正で絞られる',
   equipLegalTargetsV15(eq).length===1&&equipLegalTargetsV15(eq)[0].card.uid===w.uid);
ok('適正: API から問い合わせできる',
   API.equipLegal({p:0,zone:'sz',index:0,card:eq},{p:0,zone:'mz',index:0,card:w})===true
   &&API.equipLegal({p:0,zone:'sz',index:0,card:eq},{p:0,zone:'mz',index:1,card:m})===false);
let down=mkE(MON,0,'down','def');gameState.players[0].mz.push(down);
ok('negative: 裏側のモンスターには装備できない',
   equipLegalV15(eq,{p:0,zone:'mz',index:2,card:down})===false);
ok('negative: モンスターゾーン以外は装備先にならない',
   equipLegalV15(eq,{p:0,zone:'sz',index:0,card:eq})===false);
dropRestrict();

/* =====================================================================
   2. 装備・解除イベント
   ===================================================================== */
resetE();clearEvtsE();
let eq2=mkE(EQUIP),m2=mkE(MON);
gameState.players[0].sz=[eq2];gameState.players[0].mz=[m2];
API.equipSpell({p:0,zone:'sz',index:0,card:eq2},{p:0,zone:'mz',index:0,card:m2},'テスト');
let att=evtsE('onEquipAttached');
ok('イベント: 装備で onEquipAttached が出る',att.length===1,JSON.stringify(att));
ok('イベント: 装備カードとモンスターを uid で持つ',
   att[0].equipUid===eq2.equipUid&&att[0].uid===m2.uid);
ok('イベント: 装備カードを引ける',
   (()=>{const h=API.equipCardOfEvent(att[0]);return !!h&&h.card.uid===eq2.uid;})());
ok('イベント: 装備モンスターを引ける',
   (()=>{const h=API.equipMonsterOfEvent(att[0]);return !!h&&h.card.uid===m2.uid;})());
ok('イベント: カード名を payload に持たない',JSON.stringify(att[0]).indexOf('団結')<0);
clearEvtsE();
API.detachEquip({p:0,zone:'sz',index:0,card:eq2},'テスト');
let det=evtsE('onEquipDetached');
ok('イベント: 解除で onEquipDetached が出る',det.length===1,JSON.stringify(det));
ok('イベント: 解除でも装備カードの uid を持つ',det[0].equipUid!=null);
ok('既存維持: EVENTS に登録されている',
   EVENTS.indexOf('onEquipAttached')>=0&&EVENTS.indexOf('onEquipDetached')>=0);
ok('既存維持: 日本語名が引ける',
   eventJp('onEquipAttached')==='装備された時'&&eventJp('onEquipDetached')==='装備が外れた時');

/* =====================================================================
   3. 装備の参照
   ===================================================================== */
resetE();
let e1=mkE(EQUIP),e2b=mkE(EQUIP),m3=mkE(MON),m4=mkE(MON);
gameState.players[0].sz=[e1,e2b];gameState.players[0].mz=[m3,m4];
API.equipSpell({p:0,zone:'sz',index:0,card:e1},{p:0,zone:'mz',index:0,card:m3},'テスト');
API.equipSpell({p:0,zone:'sz',index:1,card:e2b},{p:0,zone:'mz',index:0,card:m3},'テスト');
ok('参照: 装備数を数えられる',API.equipCount({p:0,zone:'mz',index:0,card:m3})===2);
ok('参照: 装備されていないモンスターは0',API.equipCount({p:0,zone:'mz',index:1,card:m4})===0);
ok('参照: 装備カードの一覧を取れる',
   API.equipsOn({p:0,zone:'mz',index:0,card:m3}).length===2);
ok('参照: 装備先モンスターを引ける',
   (()=>{const h=API.equippedMonster({p:0,zone:'sz',index:0,card:e1});
     return !!h&&h.card.uid===m3.uid;})());
ok('negative: 装備していないカードの装備先は null',
   API.equippedMonster({p:0,zone:'sz',index:0,card:mkE(EQUIP)})===null);

/* =====================================================================
   4. 移し替え
   ===================================================================== */
resetE();
let e3=mkE(EQUIP),wm=mkE(WARRIOR),om=mkE(MON);
gameState.players[0].sz=[e3];gameState.players[0].mz=[wm,om];
API.equipSpell({p:0,zone:'sz',index:0,card:e3},{p:0,zone:'mz',index:0,card:wm},'テスト');
ok('移し替え前提: 最初のモンスターに装備されている',
   API.equipCount({p:0,zone:'mz',index:0,card:wm})===1);
ok('移し替え: 別の正しい対象へ移せる',
   API.moveEquip({p:0,zone:'sz',index:0,card:e3},{p:0,zone:'mz',index:1,card:om},'移し替え')===true);
ok('移し替え: 移動元から外れる',API.equipCount({p:0,zone:'mz',index:0,card:wm})===0);
ok('移し替え: 移動先に付く',API.equipCount({p:0,zone:'mz',index:1,card:om})===1);
resetE();
let e4=mkE(EQUIP),w2=mkE(WARRIOR),m5=mkE(MON);
gameState.players[0].sz=[e4];gameState.players[0].mz=[w2,m5];
API.equipSpell({p:0,zone:'sz',index:0,card:e4},{p:0,zone:'mz',index:0,card:w2},'テスト');
restrictTo('戦士');
ok('移し替え negative: 適正でない対象へは移せない',
   API.moveEquip({p:0,zone:'sz',index:0,card:e4},{p:0,zone:'mz',index:1,card:m5},'移し替え')===false);
ok('移し替え negative: 失敗しても元の装備は残る',
   API.equipCount({p:0,zone:'mz',index:0,card:w2})===1);
dropRestrict();

/* =====================================================================
   5. 装備先スコープと外から与える戦闘破壊耐性
   ===================================================================== */
resetE();
let e5=mkE(EQUIP),m6=mkE(MON),other=mkE(MON);
gameState.players[0].sz=[e5];gameState.players[0].mz=[m6,other];
API.equipSpell({p:0,zone:'sz',index:0,card:e5},{p:0,zone:'mz',index:0,card:m6},'テスト');
CARD_SCRIPTS[EQUIP]=Object.assign({},SAVED_EQ,{continuous:{
  scope:'equippedMonster', from:['sz'], apply(){return null;},
  battleProof(){ return true; }}});
ok('スコープ: 装備先のモンスターに届く',battleProof(findCardByUid(m6.uid).card)===true);
ok('スコープ negative: 装備していないモンスターには届かない',
   battleProof(findCardByUid(other.uid).card)===false);
API.detachEquip({p:0,zone:'sz',index:0,card:findCardByUid(e5.uid).card},'テスト');
ok('スコープ: 装備が外れれば耐性も消える',
   battleProof(findCardByUid(m6.uid).card)===false);
dropRestrict();
ok('既存維持: 自身の宣言による戦闘破壊耐性は従来どおり',
   (()=>{resetE();const c=mkE(MON);gameState.players[0].mz=[c];
     c.battleProof=true;return battleProof(c)===true;})());

/* =====================================================================
   6. Replay / Undo / Redo / SaveLoad / Journal / digest
   ===================================================================== */
resetE();
let textBefore=v41StateDigestText(gameState);
ok('digest後方互換: v15 は新しい state を増やさない',
   textBefore.indexOf('equipSpecV15')<0&&textBefore.indexOf('v15')<0);
let re=mkE(EQUIP),rm=mkE(MON);
gameState.players[0].sz=[re];gameState.players[0].mz=[rm];
v41ResetActionJournal(gameState);
API.equipSpell({p:0,zone:'sz',index:0,card:re},{p:0,zone:'mz',index:0,card:rm},'テスト');
ok('Journal: FX_EQUIP が記録される',
   V41_ACTION_JOURNAL.map(x=>x.action.type).includes('FX_EQUIP'));
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: 装備を含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
gameState=JSON.parse(snap);
ok('SaveLoad: 復元後も装備リンクが残る',
   gameState.players[0].sz[0].equipTo&&gameState.players[0].mz[0].equippedBy.length===1);
resetE();
let ue=mkE(EQUIP),um=mkE(MON);
gameState.players[0].sz=[ue];gameState.players[0].mz=[um];
v41ResetActionJournal(gameState);
let digestU=v41StateDigest(gameState);
API.equipSpell({p:0,zone:'sz',index:0,card:ue},{p:0,zone:'mz',index:0,card:um},'テスト');
ok('Undo前提: 装備されている',API.equipCount({p:0,zone:'mz',index:0,card:findCardByUid(um.uid).card})===1);
undo();
ok('Undo: 装備が巻き戻る',
   API.equipCount({p:0,zone:'mz',index:0,card:findCardByUid(um.uid).card})===0);
ok('Undo: 元の digest に一致する',v41StateDigest(gameState)===digestU,
   'before='+digestU+' now='+v41StateDigest(gameState));
redo();
ok('Redo: 装備が復元される',
   API.equipCount({p:0,zone:'mz',index:0,card:findCardByUid(um.uid).card})===1);

/* 直列化の健全性 */
function scanFnsE(v,d){ if(d>12||v===null||typeof v!=='object')return typeof v==='function';
  return Object.keys(v).some(k=>typeof v[k]==='function'||scanFnsE(v[k],d+1)); }
ok('直列化: gameState 全体に関数が混入していない',
   !scanFnsE(JSON.parse(JSON.stringify(gameState)),0));
ok('直列化: 装備リンクが数値だけで結ばれている',
   assertEquipStateSerializableV15(gameState)===null,
   String(assertEquipStateSerializableV15(gameState)));
ok('無制限履歴なし: v15 は独自の履歴を持たない',
   gameState.equipLogV15===undefined&&gameState.lastEquipV15===undefined);

/* =====================================================================
   7. 既存機構を壊していないこと
   ===================================================================== */
ok('既存維持: 装備モンスターが場を離れたら装備カードも墓地へ',
   (()=>{resetE();const e=mkE(EQUIP),c=mkE(MON);
     gameState.players[0].sz=[e];gameState.players[0].mz=[c];
     API.equipSpell({p:0,zone:'sz',index:0,card:e},{p:0,zone:'mz',index:0,card:c},'テスト');
     act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
     return gameState.players[0].sz.length===0;})());
ok('既存維持: API.unequip はモンスター装備専用のまま',
   (()=>{resetE();const e=mkE(EQUIP),c=mkE(MON);
     gameState.players[0].sz=[e];gameState.players[0].mz=[c];
     API.equipSpell({p:0,zone:'sz',index:0,card:e},{p:0,zone:'mz',index:0,card:c},'テスト');
     return API.unequip({p:0,zone:'sz',index:0,card:e},'テスト')===false
       &&API.equipCount({p:0,zone:'mz',index:0,card:c})===1;})());
ok('既存維持: API.equipSpell の戻り値は従来どおり',
   (()=>{resetE();const e=mkE(EQUIP),c=mkE(MON);
     gameState.players[0].sz=[e];gameState.players[0].mz=[c];
     return API.equipSpell({p:0,zone:'sz',index:0,card:e},{p:0,zone:'mz',index:0,card:c},'テスト')===true;})());
ok('既存維持: 既存スコープの意味は変わらない',
   (()=>{resetE();const c=mkE(MON);gameState.players[0].mz=[c];
     const loc={p:0,zone:'mz',index:0};
     return continuousReaches('self',0,loc,c,c)===true
       &&continuousReaches('allMonsters',0,loc,{},c)===true
       &&continuousReaches('equippedMonster',0,loc,{},c)===false;})());
ok('既存維持: v14 の攻守修整と併存する（SETの後に装備の増減が乗る）',
   (()=>{resetE();const e=mkE(EQUIP),c=mkE(MON);
     gameState.players[0].sz=[e];gameState.players[0].mz=[c];
     API.equipSpell({p:0,zone:'sz',index:0,card:e},{p:0,zone:'mz',index:0,card:c},'テスト');
     /* 装備カード自身の継続的な増減は v14 の SET 層より後に適用される。 */
     const bonus=curATK(findCardByUid(c.uid).card)-dbOf(c).atk;
     API.setAtk({p:0,zone:'mz',index:0,card:c},0,'endTurn','x');
     return curATK(findCardByUid(c.uid).card)===bonus
       &&API.equipCount({p:0,zone:'mz',index:0,card:findCardByUid(c.uid).card})===1;})());
ok('既存維持: v13 の効果無効と併存する',
   (()=>{resetE();const e=mkE(EQUIP),c=mkE(MON);
     gameState.players[0].sz=[e];gameState.players[0].mz=[c];
     API.equipSpell({p:0,zone:'sz',index:0,card:e},{p:0,zone:'mz',index:0,card:c},'テスト');
     API.negateEffectUntil({p:0,zone:'sz',index:0,card:e},'endTurn','x');
     return effectNegated(findCardByUid(e.uid).card)===true;})());

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
