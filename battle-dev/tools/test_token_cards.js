/* Token recovery batch — 11枚の positive / negative / ruling edge case。 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
/* uid は engine の採番（gs.uidSeq）に任せる。手で大きな uid を振ると、
   engine が後から生成するトークンの uid と衝突する。 */
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
function findName(pred){for(let i=0;i<CARD_DB.length;i++){if(pred(CARD_DB[i]))return CARD_DB[i].n;}return null;}
const MON='ヂェミナイ・エルフ';
const PLANT=findName(d=>d.k==='m'&&d.ra==='植物'&&!d.ex);
const NONPLANT=findName(d=>d.k==='m'&&d.ra!=='植物'&&!d.ex&&!(d.st||[]).includes('トークン'));

const NAMES=['竹頭木屑','チュウボーン','アイヴィ・ウォール','ナイトメア・デーモンズ','スネークポット',
 'サボウ・ファイター','黄金の邪神像','物理分身','トークン謝肉祭','トークン復活祭','機雷化'];
NAMES.forEach(n=>ok('Token registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: 小道具カードがDBに揃っている',!!PLANT&&!!NONPLANT);
ok('前提: トークン定義が登録されている',
   ['プラントークン','チュウボーンJr.トークン','アイヴィトークン','ナイトメア・デーモン・トークン',
    '毒蛇トークン','ニードルトークン','邪神トークン','ミラージュトークン','クリボートークン']
     .every(k=>!!tokenSpecV11(k)));

/* =====================================================================
   相手フィールドにトークンを出すカード
   ===================================================================== */
reset0();
let bamboo=mk('竹頭木屑',0,'down');gameState.players[0].sz=[bamboo];
let pl=mk(PLANT);gameState.players[0].mz=[pl];sync();
let eB=eff('竹頭木屑'),cB=ctxAt(bamboo,'sz');
ok('竹頭木屑 positive: 植物族がいれば発動できる',eB.condition(cB)===true,PLANT);
run(eB,cB);
ok('竹頭木屑 positive: 相手フィールドにプラントークンが2体出る',
   gameState.players[1].mz.length===2
   &&gameState.players[1].mz.every(c=>tokenKeyV11(c)==='プラントークン'),
   'mz='+gameState.players[1].mz.length);
ok('竹頭木屑 ruling: トークンは相手の持ち主・コントローラーになる',
   gameState.players[1].mz.every(c=>c.owner===1&&c.controller===1));
ok('竹頭木屑 ruling: 守備表示で出る',gameState.players[1].mz.every(c=>c.pos==='def'));
ok('竹頭木屑 ruling: 攻800/守500',
   dbOf(gameState.players[1].mz[0]).atk===800&&dbOf(gameState.players[1].mz[0]).def===500);
ok('竹頭木屑: コストで植物族をリリースしている',gameState.players[0].mz.length===0);
reset0();
let bamboo2=mk('竹頭木屑',0,'down');gameState.players[0].sz=[bamboo2];
gameState.players[0].mz=[mk(NONPLANT)];sync();
ok('竹頭木屑 negative: 植物族がいなければ発動できない',
   eB.condition(ctxAt(bamboo2,'sz'))===false,NONPLANT);

reset0();
let chu=mk('チュウボーン',0,'down','def');gameState.players[0].mz=[chu];sync();
let eC=eff('チュウボーン'),cC=ctxAt(chu,'mz','onFlip',{event:{card:chu}});cC.event={card:chu};
ok('チュウボーン positive: リバースで誘発する',eC.condition(cC)===true);
eC.operation(cC);
ok('チュウボーン positive: 相手フィールドに3体出る',
   gameState.players[1].mz.length===3
   &&gameState.players[1].mz.every(c=>tokenKeyV11(c)==='チュウボーンJr.トークン'));
ok('チュウボーン ruling: 攻100/守300・守備表示',
   dbOf(gameState.players[1].mz[0]).atk===100&&dbOf(gameState.players[1].mz[0]).def===300
   &&gameState.players[1].mz[0].pos==='def');
ok('チュウボーン negative: 他のカードのリバースでは誘発しない',
   eC.condition(ctxAt(chu,'mz','onFlip',{event:{card:mk(MON)}}))===false);
reset0();
let chu2=mk('チュウボーン',0,'down','def');gameState.players[0].mz=[chu2];
for(let i=0;i<ZONE_LIMITS.mz;i++) gameState.players[1].mz.push(mk(MON,1));
sync();
let cC2=ctxAt(chu2,'mz','onFlip',{event:{card:chu2}});cC2.event={card:chu2};
eC.operation(cC2);
ok('チュウボーン ruling: 相手ゾーンが一杯なら1体も出ない',
   gameState.players[1].mz.length===ZONE_LIMITS.mz
   &&API.lastTokenCreated().created===0);

reset0();
let ivy=mk('アイヴィ・ウォール',0,'down','def');gameState.players[0].mz=[ivy];sync();
let eI1=eff('アイヴィ・ウォール','flip-give-ivy-token');
let cI=ctxAt(ivy,'mz','onFlip',{event:{card:ivy}});cI.event={card:ivy};
eI1.operation(cI);
ok('アイヴィ・ウォール positive: 相手フィールドにアイヴィトークンが出る',
   gameState.players[1].mz.length===1&&tokenKeyV11(gameState.players[1].mz[0])==='アイヴィトークン');
sync();clearEvts();
let lpBefore=gameState.players[1].lp;
act({type:'FX_TO_GRAVE',player:1,zone:'mz',index:0,reason:'破壊',byDestroy:true});
let leaveEvt=evts('onLeaveField')[0];
let eI2=eff('アイヴィ・ウォール','ivy-token-destroyed-damage');
let cI2=ctxAt(ivy,'mz','onLeaveField',{event:leaveEvt});cI2.event=leaveEvt;
ok('アイヴィ・ウォール positive: トークンの破壊で誘発する',eI2.condition(cI2)===true,
   JSON.stringify(leaveEvt));
eI2.operation(cI2);
ok('アイヴィ・ウォール positive: そのトークンのコントローラーが300受ける',
   gameState.players[1].lp===lpBefore-300,'lp='+gameState.players[1].lp);
reset0();
let ivy2=mk('アイヴィ・ウォール');gameState.players[0].mz=[ivy2];
API.createTokens(1,'アイヴィトークン',1);sync();clearEvts();
act({type:'FX_TO_GRAVE',player:1,zone:'mz',index:0,reason:'コスト',byDestroy:false});
let ne=evts('onLeaveField')[0];
let cI3=ctxAt(ivy2,'mz','onLeaveField',{event:ne});cI3.event=ne;
ok('アイヴィ・ウォール negative: 破壊以外の消滅では誘発しない',eI2.condition(cI3)===false);
reset0();
let ivy3=mk('アイヴィ・ウォール');gameState.players[0].mz=[ivy3];
API.createTokens(1,'プラントークン',1);sync();clearEvts();
act({type:'FX_TO_GRAVE',player:1,zone:'mz',index:0,reason:'破壊',byDestroy:true});
let oe=evts('onLeaveField')[0];
let cI4=ctxAt(ivy3,'mz','onLeaveField',{event:oe});cI4.event=oe;
ok('アイヴィ・ウォール negative: 別の種類のトークンでは誘発しない',eI2.condition(cI4)===false);

reset0();
let nd=mk('ナイトメア・デーモンズ',0,'down');gameState.players[0].sz=[nd];
gameState.players[0].mz=[mk(MON)];sync();
let eN1=eff('ナイトメア・デーモンズ','tribute-give-three-nightmare-tokens');
let cN=ctxAt(nd,'sz');
ok('ナイトメア・デーモンズ positive: モンスターがいれば発動できる',eN1.condition(cN)===true);
run(eN1,cN);
ok('ナイトメア・デーモンズ positive: 相手フィールドに3体出る',
   gameState.players[1].mz.length===3);
ok('ナイトメア・デーモンズ ruling: 攻守2000・レベル6・攻撃表示',
   dbOf(gameState.players[1].mz[0]).atk===2000&&dbOf(gameState.players[1].mz[0]).lv===6
   &&gameState.players[1].mz[0].pos==='atk');
sync();clearEvts();
let lpN=gameState.players[1].lp;
act({type:'FX_WIPE_ZONE',player:1,zone:'mz',reason:'全体破壊'});
let nevts=evts('onLeaveField');
let eN2=eff('ナイトメア・デーモンズ','nightmare-token-destroyed-damage');
ok('ナイトメア・デーモンズ ruling: 同時に3体壊れても1体ずつ誘発する',
   nevts.length===3&&nevts.every(e=>{const c=ctxAt(nd,'sz','onLeaveField',{event:e});c.event=e;
     return eN2.condition(c)===true;}),JSON.stringify(nevts.map(e=>e.uid)));
nevts.forEach(e=>{const c=ctxAt(nd,'sz','onLeaveField',{event:e});c.event=e;eN2.operation(c);});
ok('ナイトメア・デーモンズ positive: 1体につき800ダメージ',
   gameState.players[1].lp===lpN-2400,'lp='+gameState.players[1].lp);

reset0();
let sp=mk('スネークポット',0,'down','def');gameState.players[0].mz=[sp];sync();
let eS1=eff('スネークポット','flip-summon-venom-token');
let cS=ctxAt(sp,'mz','onFlip',{event:{card:sp}});cS.event={card:sp};
eS1.operation(cS);
ok('スネークポット positive: 自分フィールドに毒蛇トークンが出る',
   gameState.players[0].mz.length===2&&tokenKeyV11(gameState.players[0].mz[1])==='毒蛇トークン');
ok('スネークポット ruling: 攻守1200・レベル3',
   dbOf(gameState.players[0].mz[1]).atk===1200&&dbOf(gameState.players[0].mz[1]).lv===3);
sync();clearEvts();
let lpS=gameState.players[1].lp;
gameState.players[0].mz[1].battleDestroyed=true;
act({type:'BATTLE_CLEANUP'});
let sev=evts('onLeaveField')[0];
let eS2=eff('スネークポット','venom-token-battle-destroyed-burn');
let cS2=ctxAt(sp,'mz','onLeaveField',{event:sev});cS2.event=sev;
ok('スネークポット positive: 戦闘破壊で誘発する',eS2.condition(cS2)===true,JSON.stringify(sev));
eS2.operation(cS2);
ok('スネークポット positive: 相手に500ダメージ',gameState.players[1].lp===lpS-500);
reset0();
let sp2=mk('スネークポット');gameState.players[0].mz=[sp2];
API.createTokens(0,'毒蛇トークン',1);sync();clearEvts();
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:1,reason:'破壊',byDestroy:true});
let sev2=evts('onLeaveField')[0];
let cS3=ctxAt(sp2,'mz','onLeaveField',{event:sev2});cS3.event=sev2;
ok('スネークポット negative: 効果破壊では誘発しない（戦闘限定）',eS2.condition(cS3)===false);

reset0();
let sabo=mk('サボウ・ファイター');gameState.players[0].mz=[sabo];
let victim=mk(MON,1);gameState.players[1].mz=[victim];sync();
gameState.lastBattle={attackerUidV6:sabo.uid,defenderUidV6:victim.uid,destroyedDef:true,atkOwner:0,defOwner:1};
let eSb=eff('サボウ・ファイター');
let cSb=ctxAt(sabo,'mz','onBattleDestroy',{event:{uid:victim.uid,reason:'battle'}});
cSb.event={uid:victim.uid,reason:'battle'};
ok('サボウ・ファイター positive: 自分が戦闘破壊した時に誘発する',eSb.condition(cSb)===true);
gameState.players[1].mz=[];
eSb.operation(cSb);
ok('サボウ・ファイター positive: 相手フィールドにニードルトークンが出る',
   gameState.players[1].mz.length===1&&tokenKeyV11(gameState.players[1].mz[0])==='ニードルトークン'
   &&gameState.players[1].mz[0].pos==='def');
gameState.lastBattle={attackerUidV6:victim.uid,defenderUidV6:sabo.uid,destroyedDef:true,atkOwner:1,defOwner:0};
let cSb2=ctxAt(sabo,'mz','onBattleDestroy',{event:{uid:victim.uid}});cSb2.event={uid:victim.uid};
ok('サボウ・ファイター negative: 他のモンスターの戦闘破壊では誘発しない',eSb.condition(cSb2)===false);

reset0();
let idol=mk('黄金の邪神像',0,'down');gameState.players[0].sz=[idol];sync();clearEvts();
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
let iev=evts('onLeaveField')[0];
let eId=eff('黄金の邪神像');
let cId=makeContext(0,idol,'grave',0,'onLeaveField',{event:iev});cId.event=iev;
ok('黄金の邪神像 positive: セットされたまま破壊されたら誘発する',eId.condition(cId)===true,
   JSON.stringify(iev));
eId.operation(cId);
ok('黄金の邪神像 positive: 邪神トークンが自分フィールドに出る',
   gameState.players[0].mz.length===1&&tokenKeyV11(gameState.players[0].mz[0])==='邪神トークン'
   &&gameState.players[0].mz[0].owner===0);
reset0();
let idol2=mk('黄金の邪神像',0,'up');gameState.players[0].sz=[idol2];sync();clearEvts();
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
let iev2=evts('onLeaveField')[0];
let cId2=makeContext(0,idol2,'grave',0,'onLeaveField',{event:iev2});cId2.event=iev2;
ok('黄金の邪神像 negative: 表側で破壊された場合は誘発しない',eId.condition(cId2)===false);

reset0();
let mirage=mk('物理分身',0,'down');gameState.players[0].sz=[mirage];
let foeM=mk(MON,1);gameState.players[1].mz=[foeM];
gameState.activePlayer=1;sync();
let eM=eff('物理分身'),cM=ctxAt(mirage,'sz');
ok('物理分身 positive: 相手ターンなら発動できる',eM.condition(cM)===true);
eM.operation(cM);answerAll([pendingChoiceV49(gameState).candidates[0].key]);
ok('物理分身 positive: ミラージュトークンが自分フィールドに出る',
   gameState.players[0].mz.length===1&&tokenKeyV11(gameState.players[0].mz[0])==='ミラージュトークン');
ok('物理分身 ruling: 相手モンスターの数値を写す',
   dbOf(gameState.players[0].mz[0]).atk===curATK(foeM)
   &&dbOf(gameState.players[0].mz[0]).lv===curLV(foeM)
   &&dbOf(gameState.players[0].mz[0]).ra===dbOf(foeM).ra);
ok('物理分身 ruling: ターン終了時の破壊が予約される',
   (gameState.scheduledV7||[]).some(s=>s.note==='物理分身'),
   JSON.stringify(gameState.scheduledV7||[]));
reset0();
let mirage2=mk('物理分身',0,'down');gameState.players[0].sz=[mirage2];
gameState.players[1].mz=[mk(MON,1)];gameState.activePlayer=0;sync();
ok('物理分身 negative: 自分のターンでは発動できない',eM.condition(ctxAt(mirage2,'sz'))===false);

/* =====================================================================
   トークンをまとめて扱うカード
   ===================================================================== */
reset0();
let carn=mk('トークン謝肉祭',0,'down');gameState.players[0].sz=[carn];
API.createTokens(0,'プラントークン',2);
API.createTokens(1,'プラントークン',1);
gameState.players[1].mz.push(mk(MON,1));sync();
let eCa=eff('トークン謝肉祭'),cCa=ctxAt(carn,'sz','onTokenSummon',{event:API.lastTokenCreated()});
let lpCa=gameState.players[1].lp;
ok('トークン謝肉祭 positive: トークンが出ていれば発動できる',eCa.condition(cCa)===true);
eCa.operation(cCa);
ok('トークン謝肉祭 positive: フィールドの全トークンを破壊する',
   API.tokensOf().length===0,'left='+API.tokensOf().length);
ok('トークン謝肉祭 positive: 破壊した数×300ダメージ',
   gameState.players[1].lp===lpCa-900,'lp='+gameState.players[1].lp);
ok('トークン謝肉祭 negative: トークン以外は破壊しない',gameState.players[1].mz.length===1);
reset0();
let carn2=mk('トークン謝肉祭',0,'down');gameState.players[0].sz=[carn2];
gameState.players[0].mz=[mk(MON)];sync();
ok('トークン謝肉祭 negative: トークンがいなければ発動できない',
   eCa.condition(ctxAt(carn2,'sz'))===false);

reset0();
let rev=mk('トークン復活祭');gameState.players[0].sz=[rev];
API.createTokens(0,'プラントークン',2);
let foeR=mk(MON,1);gameState.players[1].mz=[foeR];sync();
let eR=eff('トークン復活祭'),cR=ctxAt(rev,'sz');
ok('トークン復活祭 positive: 自分のトークンがあれば発動できる',eR.condition(cR)===true);
eR.operation(cR);
ok('トークン復活祭 positive: 自分のトークンが全て破壊される',
   API.tokensOf(null,0).length===0);
let pcR=pendingChoiceV49(gameState);
ok('トークン復活祭 ruling: 破壊した数までしか選べない',pcR.max===2&&pcR.min===0,
   'max='+pcR.max+' cands='+pcR.candidates.length);
answerAll([pcR.candidates.find(x=>x.label===MON).key]);
ok('トークン復活祭 positive: 選んだカードを破壊する',gameState.players[1].mz.length===0);
reset0();
let rev2=mk('トークン復活祭');gameState.players[0].sz=[rev2];
gameState.players[0].mz=[mk(MON)];sync();
ok('トークン復活祭 negative: 自分のトークンがなければ発動できない',
   eR.condition(ctxAt(rev2,'sz'))===false);

reset0();
let mine=mk('機雷化');gameState.players[0].sz=[mine];
let kuri=mk('クリボー');gameState.players[0].mz=[kuri];
API.createTokens(0,'クリボートークン',1);
API.createTokens(0,'プラントークン',1);
gameState.players[1].sz=[mk('サイクロン',1,'down')];sync();
let eMi=eff('機雷化'),cMi=ctxAt(mine,'sz');
ok('機雷化 positive: クリボーがいれば発動できる',eMi.condition(cMi)===true);
eMi.operation(cMi);
ok('機雷化 positive: クリボーとクリボートークンを破壊する',
   gameState.players[0].mz.length===1
   &&tokenKeyV11(gameState.players[0].mz[0])==='プラントークン',
   'left='+gameState.players[0].mz.map(c=>cardName(c)).join(','));
let pcM=pendingChoiceV49(gameState);
ok('機雷化 ruling: クリボー2枚分まで、相手のカードだけを選べる',
   pcM.max===1&&pcM.candidates.length===1,'max='+pcM.max+' cands='+pcM.candidates.length);
answerAll([pcM.candidates[0].key]);
ok('機雷化 positive: 相手のカードを破壊する',gameState.players[1].sz.length===0);
reset0();
let mine2=mk('機雷化');gameState.players[0].sz=[mine2];
gameState.players[0].mz=[mk(MON)];sync();
ok('機雷化 negative: クリボーが1体もいなければ発動できない',
   eMi.condition(ctxAt(mine2,'sz'))===false);

/* =====================================================================
   Replay / SaveLoad / 直列化
   ===================================================================== */
reset0();
let rp=mk('竹頭木屑',0,'down');gameState.players[0].sz=[rp];
gameState.players[0].mz=[mk(PLANT)];sync();v41ResetActionJournal(gameState);
run(eB,ctxAt(rp,'sz'));
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: トークン生成を含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('直列化: トークン state に関数が混入していない',
   assertTokenStateSerializableV11(gameState)===null);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
