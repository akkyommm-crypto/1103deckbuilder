/* Activation recovery batch — 15枚の positive / negative / ruling edge case。 */
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
/* 実際に CHAIN_ADD を通して発動イベントを作る */
function fire(name,player,zone,index,card){
  clearEvts();
  act({type:'CHAIN_ADD',player,cardId:findCardIndex(name),uid:card?card.uid:null,name,from:zone,index});
  return evts('onActivateSuccess').slice(-1)[0];
}
/* イベント付きの ctx を作る */
function evCtx(card,zone,evt){const c=ctxAt(card,zone,'onActivateSuccess',{event:evt});c.event=evt;return c;}
/* 小道具は既に TESTED のカードだけを使う。IMPLEMENTED のカードを使うと
   coverage がそのカードを誤って TESTED へ昇格させてしまう。 */
const NSPELL='死者蘇生', QSPELL='サイクロン', NTRAP='D2シールド', CTRAP='天罰';
const MON='ヂェミナイ・エルフ';

const NAMES=['魔法吸収','暗黒の呪縛','連鎖炸薬','王立魔法図書館','バベル・タワー','魔法の操り人形',
 'ブラッド・マジシャン－煉獄の魔術師－','ナチュル・トライアンフ','天空聖者メルティウス','救済のレイヤード',
 '人造天使','反魔鏡','トラップ・リアクター・RR','マジック・リアクター・AID','ウィングド・ライノ'];
NAMES.forEach(n=>ok('Activation registration '+n,!!CARD_SCRIPTS[n]));

/* =====================================================================
   魔法の発動に反応する
   ===================================================================== */
reset0();
let absorb=mk('魔法吸収');gameState.players[0].sz=[absorb];
let sp1=mk(NSPELL,1);gameState.players[1].sz=[sp1];sync();
let lp0=gameState.players[0].lp;
let evA=fire(NSPELL,1,'sz',0,sp1);
let eA=eff('魔法吸収'),cA=evCtx(absorb,'sz',evA);
ok('魔法吸収 positive: 相手の魔法発動で誘発する',eA.condition(cA)===true,JSON.stringify(evA));
eA.operation(cA);
ok('魔法吸収 positive: コントローラーが500回復する',gameState.players[0].lp===lp0+500);
let evTrap=fire(NTRAP,1,'sz',0,mk(NTRAP,1));
ok('魔法吸収 negative: 罠の発動では誘発しない',eA.condition(evCtx(absorb,'sz',evTrap))===false);
let evSelf=fire('魔法吸収',0,'sz',0,absorb);
ok('魔法吸収 ruling: このカード自身の発動では誘発しない',
   eA.condition(evCtx(absorb,'sz',evSelf))===false);

reset0();
let curse=mk('暗黒の呪縛');gameState.players[0].sz=[curse];
let sp2=mk(NSPELL,1);gameState.players[1].sz=[sp2];sync();
let lp1=gameState.players[1].lp;
let evB=fire(NSPELL,1,'sz',0,sp2);
let eB=eff('暗黒の呪縛'),cB=evCtx(curse,'sz',evB);
ok('暗黒の呪縛 positive: 魔法の発動で誘発する',eB.condition(cB)===true);
eB.operation(cB);
ok('暗黒の呪縛 positive: 発動したプレイヤーが1000受ける',gameState.players[1].lp===lp1-1000);
let sp3=mk(NSPELL,0);gameState.players[0].sz.push(sp3);
let evB2=fire(NSPELL,0,'sz',1,sp3);
let lp0b=gameState.players[0].lp;
eB.operation(evCtx(curse,'sz',evB2));
ok('暗黒の呪縛 ruling: 自分が発動しても自分が受ける',gameState.players[0].lp===lp0b-1000);

reset0();
let bomb=mk('連鎖炸薬');gameState.players[0].sz=[bomb];
let tr1=mk(NTRAP,1);gameState.players[1].sz=[tr1];sync();
let lpT=gameState.players[1].lp;
let evC=fire(NTRAP,1,'sz',0,tr1);
let eCc=eff('連鎖炸薬'),cC=evCtx(bomb,'sz',evC);
ok('連鎖炸薬 positive: 罠の発動で誘発する',eCc.condition(cC)===true);
eCc.operation(cC);
ok('連鎖炸薬 positive: 発動したプレイヤーが1000受ける',gameState.players[1].lp===lpT-1000);
let evC2=fire(NSPELL,1,'sz',0,mk(NSPELL,1));
ok('連鎖炸薬 negative: 魔法の発動では誘発しない',eCc.condition(evCtx(bomb,'sz',evC2))===false);

reset0();
let lib=mk('王立魔法図書館');gameState.players[0].mz=[lib];
gameState.players[0].deck=[mk(MON),mk(MON)];sync();
let eL1=eff('王立魔法図書館','spell-activated-add-counter');
for(let i=0;i<4;i++){
  const s=mk(NSPELL,1);gameState.players[1].sz=[s];
  const ev=fire(NSPELL,1,'sz',0,s);
  const c=evCtx(lib,'mz',ev);
  if(eL1.condition(c)) eL1.operation(c);
}
ok('王立魔法図書館 ruling: 魔力カウンターは3つまで',
   API.countCounter(locateCardAnyV4(lib),'魔力')===3,
   'n='+API.countCounter(locateCardAnyV4(lib),'魔力'));
let eL2=eff('王立魔法図書館','spend-three-counters-draw');
let handBefore=gameState.players[0].hand.length;
let cL2=ctxAt(lib,'mz');
ok('王立魔法図書館 positive: 3つ乗っていれば発動できる',eL2.condition(cL2)===true);
run(eL2,cL2);
ok('王立魔法図書館 positive: 1枚ドローする',gameState.players[0].hand.length===handBefore+1);
ok('王立魔法図書館 positive: カウンターを3つ払っている',
   API.countCounter(locateCardAnyV4(lib),'魔力')===0);
ok('王立魔法図書館 negative: カウンターが足りなければ発動できない',
   eL2.condition(ctxAt(lib,'mz'))===false);

reset0();
let babel=mk('バベル・タワー');gameState.players[0].sz=[babel];sync();
let eBa=eff('バベル・タワー');
let lpBa=gameState.players[1].lp;
for(let i=0;i<3;i++){
  const s=mk(NSPELL,1);gameState.players[1].sz=[s];
  const ev=fire(NSPELL,1,'sz',0,s);
  const c=evCtx(babel,'sz',ev);
  if(eBa.condition(c)) eBa.operation(c);
}
ok('バベル・タワー ruling: 3つ目までは自壊しない',
   locateCardAnyV4(babel)&&API.countCounter(locateCardAnyV4(babel),'魔力')===3
   &&gameState.players[1].lp===lpBa);
let s4=mk(NSPELL,1);gameState.players[1].sz=[s4];
let ev4=fire(NSPELL,1,'sz',0,s4);
eBa.operation(evCtx(babel,'sz',ev4));
ok('バベル・タワー positive: 4つ目で自壊する',
   gameState.players[0].sz.length===0,'sz='+gameState.players[0].sz.length);
ok('バベル・タワー positive: 発動したプレイヤーが3000受ける',
   gameState.players[1].lp===lpBa-3000,'lp='+gameState.players[1].lp);

reset0();
let puppet=mk('魔法の操り人形');gameState.players[0].mz=[puppet];
let foeM=mk(MON,1);gameState.players[1].mz=[foeM];sync();
let eP1=eff('魔法の操り人形','spell-activated-add-counter');
let baseAtk=API.curAtk({p:0,zone:'mz',index:0,card:puppet});
for(let i=0;i<2;i++){
  const s=mk(NSPELL,1);gameState.players[1].sz=[s];
  const ev=fire(NSPELL,1,'sz',0,s);
  eP1.operation(evCtx(puppet,'mz',ev));
}
ok('魔法の操り人形 positive: カウンターが2つ乗る',
   API.countCounter(locateCardAnyV4(puppet),'魔力')===2);
ok('魔法の操り人形 positive: カウンター1つにつき攻撃力+200',
   API.curAtk({p:0,zone:'mz',index:0,card:puppet})===baseAtk+400,
   'atk='+API.curAtk({p:0,zone:'mz',index:0,card:puppet}));
let eP2=eff('魔法の操り人形','spend-two-counters-destroy');
let cP2=ctxAt(puppet,'mz');
ok('魔法の操り人形 positive: カウンター2つで発動できる',eP2.condition(cP2)===true);
eP2.operation(cP2);
answerAll([pendingChoiceV49(gameState).candidates.find(x=>x.label===MON).key]);
ok('魔法の操り人形 positive: モンスターを破壊しカウンターを2つ払う',
   gameState.players[1].mz.length===0
   &&API.countCounter(locateCardAnyV4(puppet),'魔力')===0);
ok('魔法の操り人形 negative: カウンターが無ければ発動できない',
   eP2.condition(ctxAt(puppet,'mz'))===false);

reset0();
let blood=mk('ブラッド・マジシャン－煉獄の魔術師－');gameState.players[0].mz=[blood];
let weak=mk('クリボー',1);gameState.players[1].mz=[weak];sync();
let eBl1=eff('ブラッド・マジシャン－煉獄の魔術師－','spell-activated-add-counter');
const s5=mk(NSPELL,1);gameState.players[1].sz=[s5];
eBl1.operation(evCtx(blood,'mz',fire(NSPELL,1,'sz',0,s5)));
let eBl2=eff('ブラッド・マジシャン－煉獄の魔術師－','spend-counters-destroy-by-atk');
ok('ブラッド・マジシャン positive: カウンター1つで攻700以下を狙える',
   eBl2.condition(ctxAt(blood,'mz'))===true,'atk='+API.curAtk({p:1,zone:'mz',index:0,card:weak}));
eBl2.operation(ctxAt(blood,'mz'));
let pcB=pendingChoiceV49(gameState);
ok('ブラッド・マジシャン ruling: 攻撃力の上限を超える相手は候補に入らない',
   pcB.candidates.every(x=>x.label!=='ヂェミナイ・エルフ'));
answerAll([pcB.candidates.find(x=>x.label==='クリボー').key]);
ok('ブラッド・マジシャン positive: 破壊しカウンターを払う',
   gameState.players[1].mz.length===0
   &&API.countCounter(locateCardAnyV4(blood),'魔力')===0);
reset0();
let blood2=mk('ブラッド・マジシャン－煉獄の魔術師－');gameState.players[0].mz=[blood2];
gameState.players[1].mz=[mk(MON,1)];sync();
ok('ブラッド・マジシャン negative: カウンターが無ければ発動できない',
   eBl2.condition(ctxAt(blood2,'mz'))===false);

reset0();
let natu=mk('ナチュル・トライアンフ');gameState.players[0].mz=[natu];sync();
let eN=eff('ナチュル・トライアンフ');
let natuAtk=API.curAtk({p:0,zone:'mz',index:0,card:natu});
let sN=mk(NSPELL,1);gameState.players[1].sz=[sN];
let evN=fire(NSPELL,1,'sz',0,sN);
let cN=evCtx(natu,'mz',evN);
ok('ナチュル・トライアンフ positive: 相手の魔法発動で誘発する',eN.condition(cN)===true);
eN.operation(cN);
ok('ナチュル・トライアンフ positive: 「ナチュル」の攻撃力が+500',
   API.curAtk({p:0,zone:'mz',index:0,card:natu})===natuAtk+500);
let sOwn=mk(NSPELL,0);gameState.players[0].sz=[sOwn];
let evNs=fire(NSPELL,0,'sz',0,sOwn);
ok('ナチュル・トライアンフ negative: 自分の発動では誘発しない',
   eN.condition(evCtx(natu,'mz',evNs))===false);

/* =====================================================================
   カウンター罠の発動に反応する
   ===================================================================== */
reset0();
let melt=mk('天空聖者メルティウス');gameState.players[0].mz=[melt];
let ct=mk(CTRAP,1);gameState.players[1].sz=[ct];sync();
let lpM=gameState.players[0].lp;
let evM=fire(CTRAP,1,'sz',0,ct);
let eMe=eff('天空聖者メルティウス'),cM=evCtx(melt,'mz',evM);
ok('天空聖者メルティウス positive: カウンター罠の発動で誘発する',eMe.condition(cM)===true,
   JSON.stringify(evM));
eMe.operation(cM);
ok('天空聖者メルティウス positive: 1000回復する',gameState.players[0].lp===lpM+1000);
ok('天空聖者メルティウス ruling: 天空の聖域が無ければ破壊は行わない',
   !pendingChoiceV49(gameState)&&gameState.players[1].sz.length===1);
let evM2=fire(NTRAP,1,'sz',0,mk(NTRAP,1));
ok('天空聖者メルティウス negative: 通常罠では誘発しない',
   eMe.condition(evCtx(melt,'mz',evM2))===false);
reset0();
let melt2=mk('天空聖者メルティウス');gameState.players[0].mz=[melt2];
gameState.players[0].field=mk('天空の聖域');
let ct2=mk(CTRAP,1);gameState.players[1].sz=[ct2];sync();
let evM3=fire(CTRAP,1,'sz',0,ct2);
eMe.operation(evCtx(melt2,'mz',evM3));
ok('天空聖者メルティウス positive: 天空の聖域があれば破壊も行う',
   !!pendingChoiceV49(gameState));
answerAll([pendingChoiceV49(gameState).candidates[0].key]);
ok('天空聖者メルティウス positive: 相手のカードが破壊される',
   gameState.players[1].sz.length===0);

reset0();
let layer=mk('救済のレイヤード');gameState.players[0].mz=[layer];
let f1=mk('シャインエンジェル',0),f2=mk('シャインエンジェル',0);
gameState.players[0].banish=[f1,f2];
let ct3=mk(CTRAP,1);gameState.players[1].sz=[ct3];sync();
let eLa=eff('救済のレイヤード');
let evLa=fire(CTRAP,1,'sz',0,ct3);
let cLa=evCtx(layer,'mz',evLa);
ok('救済のレイヤード positive: 除外の天使族が2体いれば誘発する',eLa.condition(cLa)===true);
eLa.operation(cLa);
let pcLa=pendingChoiceV49(gameState);
ok('救済のレイヤード ruling: ちょうど2体選ぶ',pcLa.min===2&&pcLa.max===2);
answerAll();
ok('救済のレイヤード positive: 2体が手札に加わる',
   gameState.players[0].hand.length===2&&gameState.players[0].banish.length===0);
reset0();
let layer2=mk('救済のレイヤード');gameState.players[0].mz=[layer2];
gameState.players[0].banish=[mk('シャインエンジェル',0)];
let ct4=mk(CTRAP,1);gameState.players[1].sz=[ct4];sync();
ok('救済のレイヤード negative: 1体しかいなければ誘発しない',
   eLa.condition(evCtx(layer2,'mz',fire(CTRAP,1,'sz',0,ct4)))===false);

reset0();
let angel=mk('人造天使');gameState.players[0].sz=[angel];
let ct5=mk(CTRAP,1);gameState.players[1].sz=[ct5];sync();
let eAn=eff('人造天使');
let evAn=fire(CTRAP,1,'sz',0,ct5);
let cAn=evCtx(angel,'sz',evAn);
ok('人造天使 positive: カウンター罠の発動で誘発する',eAn.condition(cAn)===true);
eAn.operation(cAn);
ok('人造天使 positive: 人造天使トークンが出る',
   gameState.players[0].mz.length===1
   &&tokenKeyV11(gameState.players[0].mz[0])==='人造天使トークン');
ok('人造天使 ruling: 攻守300・レベル1・天使族・光属性',
   (()=>{const d=dbOf(gameState.players[0].mz[0]);
     return d.atk===300&&d.def===300&&d.lv===1&&d.ra==='天使'&&d.at==='光';})());
ok('人造天使 negative: 通常罠では誘発しない',
   eAn.condition(evCtx(angel,'sz',fire(NTRAP,1,'sz',0,mk(NTRAP,1))))===false);

/* =====================================================================
   発動したカードそのものを狙う
   ===================================================================== */
reset0();
let mirror=mk('反魔鏡',0,'down');gameState.players[0].sz=[mirror];
let q=mk(QSPELL,1);gameState.players[1].sz=[q];sync();
let eMi=eff('反魔鏡');
let evQ=fire(QSPELL,1,'sz',0,q);
let cMi=evCtx(mirror,'sz',evQ);
ok('反魔鏡 positive: 相手の速攻魔法の発動で発動できる',eMi.condition(cMi)===true,JSON.stringify(evQ));
eMi.operation(cMi);
answerAll([pendingChoiceV49(gameState).candidates[0].key]);
ok('反魔鏡 positive: フィールドのカードを破壊する',
   gameState.players[0].grave.length+gameState.players[1].grave.length>=1);
reset0();
let mirror2=mk('反魔鏡',0,'down');gameState.players[0].sz=[mirror2];
let nsp=mk(NSPELL,1);gameState.players[1].sz=[nsp];sync();
ok('反魔鏡 negative: 通常魔法では発動できない',
   eMi.condition(evCtx(mirror2,'sz',fire(NSPELL,1,'sz',0,nsp)))===false);
reset0();
let mirror3=mk('反魔鏡',0,'down');gameState.players[0].sz=[mirror3];
let qOwn=mk(QSPELL,0);gameState.players[0].sz.push(qOwn);sync();
ok('反魔鏡 negative: 自分の速攻魔法では発動できない',
   eMi.condition(evCtx(mirror3,'sz',fire(QSPELL,0,'sz',1,qOwn)))===false);

reset0();
let rr=mk('トラップ・リアクター・RR');gameState.players[0].mz=[rr];
let tr2=mk(NTRAP,1);gameState.players[1].sz=[tr2];sync();
let lpRR=gameState.players[1].lp;
let eRR=eff('トラップ・リアクター・RR');
let evRR=fire(NTRAP,1,'sz',0,tr2);
let cRR=evCtx(rr,'mz',evRR);
ok('トラップ・リアクター・RR positive: 相手の罠発動で誘発する',eRR.condition(cRR)===true);
eRR.operation(cRR);
ok('トラップ・リアクター・RR positive: その罠を破壊する',
   gameState.players[1].sz.length===0&&gameState.players[1].grave.length===1);
ok('トラップ・リアクター・RR positive: 800ダメージ',gameState.players[1].lp===lpRR-800);
ok('トラップ・リアクター・RR negative: 魔法では誘発しない',
   eRR.condition(evCtx(rr,'mz',fire(NSPELL,1,'sz',0,mk(NSPELL,1))))===false);

reset0();
let aid=mk('マジック・リアクター・AID');gameState.players[0].mz=[aid];
let sp6=mk(NSPELL,1);gameState.players[1].sz=[sp6];sync();
let lpAid=gameState.players[1].lp;
let eAid=eff('マジック・リアクター・AID');
let evAid=fire(NSPELL,1,'sz',0,sp6);
let cAid=evCtx(aid,'mz',evAid);
ok('マジック・リアクター・AID positive: 相手の魔法発動で誘発する',eAid.condition(cAid)===true);
eAid.operation(cAid);
ok('マジック・リアクター・AID positive: その魔法を破壊し800ダメージ',
   gameState.players[1].sz.length===0&&gameState.players[1].lp===lpAid-800);
ok('マジック・リアクター・AID negative: 自分の魔法では誘発しない',
   (()=>{reset0();const a2=mk('マジック・リアクター・AID');gameState.players[0].mz=[a2];
     const s=mk(NSPELL,0);gameState.players[0].sz=[s];sync();
     return eAid.condition(evCtx(a2,'mz',fire(NSPELL,0,'sz',0,s)))===false;})());

reset0();
let rhino=mk('ウィングド・ライノ');gameState.players[0].mz=[rhino];
let tr3=mk(NTRAP,1);gameState.players[1].sz=[tr3];sync();
let eRh=eff('ウィングド・ライノ');
let evRh=fire(NTRAP,1,'sz',0,tr3);
let cRh=evCtx(rhino,'mz',evRh);
ok('ウィングド・ライノ positive: 罠の発動で発動できる',eRh.condition(cRh)===true);
eRh.operation(cRh);
ok('ウィングド・ライノ positive: 自身が手札に戻る',
   gameState.players[0].mz.length===0
   &&gameState.players[0].hand.some(c=>c.uid===rhino.uid));
reset0();
let rhino2=mk('ウィングド・ライノ',0,'down','def');gameState.players[0].mz=[rhino2];
let tr4=mk(NTRAP,1);gameState.players[1].sz=[tr4];sync();
ok('ウィングド・ライノ negative: 裏側では発動できない',
   eRh.condition(evCtx(rhino2,'mz',fire(NTRAP,1,'sz',0,tr4)))===false);

/* =====================================================================
   Replay / SaveLoad / 直列化
   ===================================================================== */
reset0();
let rAbs=mk('魔法吸収');gameState.players[0].sz=[rAbs];
let rSp=mk(NSPELL,1);gameState.players[1].sz=[rSp];sync();
v41ResetActionJournal(gameState);
let rEv=fire(NSPELL,1,'sz',0,rSp);
eA.operation(evCtx(rAbs,'sz',rEv));
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: 発動イベントを含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('直列化: 発動記録に関数が混入していない',
   assertActivationStateSerializableV12(gameState)===null);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
