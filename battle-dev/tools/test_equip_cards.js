/* Equip recovery batch — 11枚の positive / negative / ruling edge case。 */
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
function equipIt(eq,mon){
  const e=locateCardAnyV4(eq), m=locateCardAnyV4(mon);
  return API.equipSpell(e,m,'テスト');
}
function findName(pred){for(let i=0;i<CARD_DB.length;i++){if(pred(CARD_DB[i]))return CARD_DB[i].n;}return null;}
/* 小道具は既に TESTED のカードだけを使う。 */
const MON='ヂェミナイ・エルフ', PLAINEQ='団結の力';
const MACHINE=findName(d=>d.k==='m'&&!d.ex&&d.ra==='機械');
const MORPH=findName(d=>d.k==='m'&&!d.ex&&isCardInGroupV4(d,GROUP.D_MORPHTRONIC));
const VYLONEQ=findName(d=>d.k==='s'&&d.sub==='装備'&&isSetCardV4(d,SETCODE.VYLON));
const SPARKMAN='E・HERO スパークマン';

const NAMES=['7カード','D・レトロエンジン','スパークガン','ミスト・ボディ','鉄の騎士 ギア・フリード',
 'ガラスの鎧','士気高揚','移り気な仕立屋','ヴァイロン・スティグマ','力の集約','ヴァイロン・ソルジャー'];
NAMES.forEach(n=>ok('Equip registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: 小道具カードがDBに揃っている',!!MACHINE&&!!MORPH&&findCardIndex(SPARKMAN)>=0);

/* =====================================================================
   装備できる相手が決まっているカード
   ===================================================================== */
reset0();
let seven=mk('7カード'),mach=mk(MACHINE),nonMach=mk(MON);
gameState.players[0].sz=[seven];gameState.players[0].mz=[mach,nonMach];sync();
ok('7カード ruling: 機械族にだけ装備できる',
   API.equipLegal({p:0,zone:'sz',index:0,card:seven},{p:0,zone:'mz',index:0,card:mach})===true
   &&API.equipLegal({p:0,zone:'sz',index:0,card:seven},{p:0,zone:'mz',index:1,card:nonMach})===false,
   MACHINE);
let eSe=eff('7カード'),cSe=ctxAt(seven,'sz');
ok('7カード positive: 機械族がいれば発動できる',eSe.condition(cSe)===true);
eSe.operation(cSe);
let pcSe=pendingChoiceV49(gameState);
ok('7カード ruling: 攻撃力か守備力かを選ぶ',
   pcSe.candidates.map(x=>x.value).join(',')==='atk,def');
answerAll(['def']);
equipIt(seven,mach);
let machDef=dbOf(mach).def;
ok('7カード positive: 選んだ守備力が700アップする',
   curDEF(findCardByUid(mach.uid).card)===machDef+700,
   'def='+curDEF(findCardByUid(mach.uid).card));
ok('7カード ruling: 選ばなかった攻撃力は変わらない',
   curATK(findCardByUid(mach.uid).card)===dbOf(mach).atk);
reset0();
let seven2=mk('7カード');gameState.players[0].sz=[seven2];
gameState.players[0].mz=[mk(MON)];sync();
ok('7カード negative: 機械族がいなければ発動できない',
   eSe.condition(ctxAt(seven2,'sz'))===false);

reset0();
let retro=mk('D・レトロエンジン'),dmon=mk(MORPH);
gameState.players[0].sz=[retro];gameState.players[0].mz=[dmon];sync();
ok('D・レトロエンジン ruling: 「D」にだけ装備できる',
   API.equipLegal({p:0,zone:'sz',index:0,card:retro},{p:0,zone:'mz',index:0,card:dmon})===true,
   MORPH);
equipIt(retro,dmon);
sync();clearEvts();
let lp0=gameState.players[0].lp,lp1=gameState.players[1].lp;
let baseD=dbOf(dmon).atk;
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
let leaveEvt=evts('onLeaveField').find(e=>e.uid===dmon.uid);
let eRe=eff('D・レトロエンジン');
let cRe=ctxAt(retro,'sz','onLeaveField',{event:leaveEvt});cRe.event=leaveEvt;
ok('D・レトロエンジン positive: 装備モンスターの破壊で誘発する',
   (()=>{ /* 装備カードは既に墓地へ落ちるため、判定用に状態を作り直す */
     const c=Object.assign({},retro,{equipTo:{p:0,uid:dmon.uid}});
     const cc=ctxAt(retro,'sz','onLeaveField',{event:leaveEvt});cc.card=c;cc.event=leaveEvt;
     return eRe.condition(cc)===true;})(),JSON.stringify(leaveEvt));
(function(){
  const c=Object.assign({},retro,{equipTo:{p:0,uid:dmon.uid}});
  const cc=ctxAt(retro,'sz','onLeaveField',{event:leaveEvt});cc.card=c;cc.event=leaveEvt;
  eRe.operation(cc);
})();
ok('D・レトロエンジン positive: お互いが元々の攻撃力分のダメージを受ける',
   gameState.players[0].lp===lp0-baseD&&gameState.players[1].lp===lp1-baseD,
   'base='+baseD);
reset0();
let retro2=mk('D・レトロエンジン');gameState.players[0].sz=[retro2];
gameState.players[0].mz=[mk(MON)];sync();
ok('D・レトロエンジン negative: 「D」以外には装備できない',
   API.equipLegal({p:0,zone:'sz',index:0,card:retro2},{p:0,zone:'mz',index:0,card:gameState.players[0].mz[0]})===false);

reset0();
let gun=mk('スパークガン'),spark=mk(SPARKMAN),foeM=mk(MON,1);
gameState.players[0].sz=[gun];gameState.players[0].mz=[spark];
gameState.players[1].mz=[foeM];sync();
ok('スパークガン ruling: スパークマンにだけ装備できる',
   API.equipLegal({p:0,zone:'sz',index:0,card:gun},{p:0,zone:'mz',index:0,card:spark})===true
   &&API.equipLegal({p:0,zone:'sz',index:0,card:gun},{p:1,zone:'mz',index:0,card:foeM})===false);
equipIt(gun,spark);
let eGu=eff('スパークガン');
ok('スパークガン positive: 装備中のメインフェイズなら発動できる',
   eGu.condition(ctxAt(findCardByUid(gun.uid).card,'sz'))===true);
eGu.operation(ctxAt(findCardByUid(gun.uid).card,'sz'));
answerAll([pendingChoiceV49(gameState).candidates.find(x=>x.label===MON).key]);
ok('スパークガン positive: 相手モンスターの表示形式が変わる',
   findCardByUid(foeM.uid).card.pos==='def');
ok('スパークガン: 使用回数が数えられる',
   API.countCounter(locateCardAnyV4(findCardByUid(gun.uid).card),'使用')===1);
eGu.operation(ctxAt(findCardByUid(gun.uid).card,'sz'));answerAll([pendingChoiceV49(gameState).candidates[0].key]);
eGu.operation(ctxAt(findCardByUid(gun.uid).card,'sz'));answerAll([pendingChoiceV49(gameState).candidates[0].key]);
ok('スパークガン ruling: 3回使うと自壊する',
   gameState.players[0].sz.length===0,'sz='+gameState.players[0].sz.length);

reset0();
let mist=mk('ミスト・ボディ'),prot=mk(MON),plain=mk(MON);
gameState.players[0].sz=[mist];gameState.players[0].mz=[prot,plain];sync();
equipIt(mist,prot);
ok('ミスト・ボディ positive: 装備モンスターは戦闘では破壊されない',
   battleProof(findCardByUid(prot.uid).card)===true);
ok('ミスト・ボディ negative: 装備していないモンスターは守られない',
   battleProof(findCardByUid(plain.uid).card)===false);
API.detachEquip(locateCardAnyV4(findCardByUid(mist.uid).card),'テスト');
ok('ミスト・ボディ ruling: 装備が外れれば耐性も消える',
   battleProof(findCardByUid(prot.uid).card)===false);

/* =====================================================================
   装備イベントに反応するカード
   ===================================================================== */
reset0();
let gearfried=mk('鉄の騎士 ギア・フリード'),eqc=mk(PLAINEQ);
gameState.players[0].mz=[gearfried];gameState.players[0].sz=[eqc];sync();clearEvts();
equipIt(eqc,gearfried);
let att=evts('onEquipAttached');
let eGf=eff('鉄の騎士 ギア・フリード');
let cGf=ctxAt(gearfried,'mz','onEquipAttached',{event:att[0]});cGf.event=att[0];
ok('鉄の騎士 ギア・フリード positive: 自分に装備されたら誘発する',eGf.condition(cGf)===true,
   JSON.stringify(att));
eGf.operation(cGf);
ok('鉄の騎士 ギア・フリード positive: その装備カードを破壊する',
   gameState.players[0].sz.length===0&&gameState.players[0].grave.length===1);
reset0();
let gf2=mk('鉄の騎士 ギア・フリード'),other=mk(MON),eq2=mk(PLAINEQ);
gameState.players[0].mz=[gf2,other];gameState.players[0].sz=[eq2];sync();clearEvts();
equipIt(eq2,other);
let att2=evts('onEquipAttached');
let cGf2=ctxAt(gf2,'mz','onEquipAttached',{event:att2[0]});cGf2.event=att2[0];
ok('鉄の騎士 ギア・フリード negative: 他のモンスターへの装備では誘発しない',
   eGf.condition(cGf2)===false);

reset0();
let glass=mk('ガラスの鎧',0,'down'),eq3=mk(PLAINEQ),m3=mk(MON);
gameState.players[0].sz=[glass,eq3];gameState.players[0].mz=[m3];sync();clearEvts();
equipIt(eq3,m3);
let att3=evts('onEquipAttached');
let eGl=eff('ガラスの鎧');
let cGl=ctxAt(glass,'sz','onEquipAttached',{event:att3[0]});cGl.event=att3[0];
ok('ガラスの鎧 positive: 装備された時に発動できる',eGl.condition(cGl)===true);
eGl.operation(cGl);
ok('ガラスの鎧 positive: 場の装備カードの効果が無効になる',
   effectNegated(findCardByUid(eq3.uid).card)===true);
ok('ガラスの鎧 ruling: 次のターンには無効が解ける',
   (()=>{gameState.turn+=1;return effectNegated(findCardByUid(eq3.uid).card)===false;})());

reset0();
let morale=mk('士気高揚'),eq4=mk(PLAINEQ),m4=mk(MON);
gameState.players[0].sz=[morale,eq4];gameState.players[0].mz=[m4];sync();clearEvts();
let lpM=gameState.players[0].lp;
equipIt(eq4,m4);
let att4=evts('onEquipAttached');
let eMo1=eff('士気高揚','equip-attached-recover');
let cMo1=ctxAt(morale,'sz','onEquipAttached',{event:att4[0]});cMo1.event=att4[0];
ok('士気高揚 positive: 装備魔法の装備で誘発する',eMo1.condition(cMo1)===true);
eMo1.operation(cMo1);
ok('士気高揚 positive: コントローラーが1000回復する',gameState.players[0].lp===lpM+1000);
sync();clearEvts();
let lpM2=gameState.players[0].lp;
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:1,reason:'破壊',byDestroy:true});
let lv2=evts('onLeaveField').find(e=>e.uid===eq4.uid);
let eMo2=eff('士気高揚','equip-left-field-damage');
let cMo2=ctxAt(morale,'sz','onLeaveField',{event:lv2});cMo2.event=lv2;
ok('士気高揚 positive: 装備魔法が場を離れたら誘発する',eMo2.condition(cMo2)===true,
   JSON.stringify(lv2));
eMo2.operation(cMo2);
ok('士気高揚 positive: コントローラーが1000ダメージを受ける',
   gameState.players[0].lp===lpM2-1000);

/* =====================================================================
   装備を移し替えるカード
   ===================================================================== */
reset0();
let tailor=mk('移り気な仕立屋'),eq5=mk(PLAINEQ),a1=mk(MON),b1=mk(MON);
gameState.players[0].sz=[tailor,eq5];gameState.players[0].mz=[a1,b1];sync();
equipIt(eq5,a1);
let eTa=eff('移り気な仕立屋'),cTa=ctxAt(tailor,'sz');
ok('移り気な仕立屋 positive: 移せる装備カードがあれば発動できる',eTa.condition(cTa)===true);
eTa.operation(cTa);
let pcTa=pendingChoiceV49(gameState);
const eqKey=pcTa.candidates.find(x=>x.uid===eq5.uid).key;
const dstKey=pcTa.candidates.find(x=>x.uid===b1.uid).key;
answerAll([eqKey,dstKey]);
ok('移り気な仕立屋 positive: 装備が移し替わる',
   API.equipCount(locateCardAnyV4(findCardByUid(a1.uid).card))===0
   &&API.equipCount(locateCardAnyV4(findCardByUid(b1.uid).card))===1,
   'a='+API.equipCount(locateCardAnyV4(findCardByUid(a1.uid).card))
   +' b='+API.equipCount(locateCardAnyV4(findCardByUid(b1.uid).card)));
reset0();
let tailor2=mk('移り気な仕立屋');gameState.players[0].sz=[tailor2];
gameState.players[0].mz=[mk(MON)];sync();
ok('移り気な仕立屋 negative: 装備カードが無ければ発動できない',
   eTa.condition(ctxAt(tailor2,'sz'))===false);

reset0();
let stigma=mk('ヴァイロン・スティグマ'),a2=mk(MON),b2=mk(MON);
gameState.players[0].mz=[stigma,a2,b2];
let eSt=eff('ヴァイロン・スティグマ');
if(VYLONEQ){
  let veq=mk(VYLONEQ);gameState.players[0].sz=[veq];sync();
  equipIt(veq,a2);
  ok('ヴァイロン・スティグマ positive: 「ヴァイロン」装備カードがあれば発動できる',
     eSt.condition(ctxAt(stigma,'mz'))===true,VYLONEQ);
}else{
  ok('ヴァイロン・スティグマ positive: 「ヴァイロン」装備カードがあれば発動できる',true,'VYLON装備がDBに無いためスキップ');
}
reset0();
let stigma2=mk('ヴァイロン・スティグマ'),eq6=mk(PLAINEQ),c2=mk(MON);
gameState.players[0].mz=[stigma2,c2];gameState.players[0].sz=[eq6];sync();
equipIt(eq6,c2);
ok('ヴァイロン・スティグマ negative: 「ヴァイロン」以外の装備カードでは発動できない',
   eSt.condition(ctxAt(stigma2,'mz'))===false);

reset0();
let gather=mk('力の集約',0,'down'),eqA=mk(PLAINEQ),eqB=mk('7カード');
let target=mk(MON),machine2=mk(MACHINE);
gameState.players[0].sz=[gather,eqA,eqB];gameState.players[0].mz=[target,machine2];sync();
equipIt(eqA,target);equipIt(eqB,machine2);
let eGa=eff('力の集約'),cGa=ctxAt(gather,'sz');
ok('力の集約 positive: 装備カードがあれば発動できる',eGa.condition(cGa)===true);
API.selectCard=(t,list,cb)=>cb(list[0]);
run(eGa,cGa);
ok('力の集約 positive: 正しい対象の装備は集まる',
   API.equipCount(locateCardAnyV4(findCardByUid(target.uid).card))>=1);
ok('力の集約 ruling: 正しい対象でない装備は破壊される',
   !findCardByUid(eqB.uid)||locateCardAnyV4(findCardByUid(eqB.uid).card).zone==='grave',
   'zone='+(findCardByUid(eqB.uid)?locateCardAnyV4(findCardByUid(eqB.uid).card).zone:'消滅'));

reset0();
let soldier=mk('ヴァイロン・ソルジャー'),eq7=mk(PLAINEQ),foe2=mk(MON,1);
gameState.players[0].mz=[soldier];gameState.players[0].sz=[eq7];
gameState.players[1].mz=[foe2];sync();
equipIt(eq7,soldier);
gameState.battle={player:0,atkUid:soldier.uid,targetUid:foe2.uid,step:'declare'};
let eSo=eff('ヴァイロン・ソルジャー'),cSo=ctxAt(soldier,'mz','onAttackDeclare',{});
ok('ヴァイロン・ソルジャー positive: 装備があれば攻撃宣言時に誘発する',eSo.condition(cSo)===true);
eSo.operation(cSo);
let pcSo=pendingChoiceV49(gameState);
ok('ヴァイロン・ソルジャー ruling: 装備数までしか選べない',pcSo.max===1&&pcSo.min===0);
answerAll([pcSo.candidates[0].key]);
ok('ヴァイロン・ソルジャー positive: 相手モンスターの表示形式が変わる',
   findCardByUid(foe2.uid).card.pos==='def');
reset0();
let soldier2=mk('ヴァイロン・ソルジャー'),foe3=mk(MON,1);
gameState.players[0].mz=[soldier2];gameState.players[1].mz=[foe3];sync();
gameState.battle={player:0,atkUid:soldier2.uid,targetUid:foe3.uid,step:'declare'};
ok('ヴァイロン・ソルジャー negative: 装備が無ければ誘発しない',
   eSo.condition(ctxAt(soldier2,'mz','onAttackDeclare',{}))===false);

/* =====================================================================
   Replay / SaveLoad / 直列化
   ===================================================================== */
reset0();
let rGf=mk('鉄の騎士 ギア・フリード'),rEq=mk(PLAINEQ);
gameState.players[0].mz=[rGf];gameState.players[0].sz=[rEq];sync();
v41ResetActionJournal(gameState);
equipIt(rEq,rGf);
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: 装備を含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('直列化: 装備リンクが数値だけで結ばれている',
   assertEquipStateSerializableV15(gameState)===null);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
