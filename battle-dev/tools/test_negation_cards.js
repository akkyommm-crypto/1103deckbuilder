/* Negation recovery batch — 16枚の positive / negative / ruling edge case。 */
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
function fire(name,player,zone,index,card){
  clearEvts();
  act({type:'CHAIN_ADD',player,cardId:findCardIndex(name),uid:card?card.uid:null,name,from:zone,index});
  return evts('onActivateSuccess').slice(-1)[0];
}
function evCtx(card,zone,evt){const c=ctxAt(card,zone,'onActivateSuccess',{event:evt});c.event=evt;return c;}
function findName(pred){for(let i=0;i<CARD_DB.length;i++){if(pred(CARD_DB[i]))return CARD_DB[i].n;}return null;}
/* 小道具は既に TESTED のカードだけを使う（IMPLEMENTED を使うと誤昇格する）。 */
const MON='ヂェミナイ・エルフ', NTRAP='D2シールド';
const CONT_TRAP=findName(d=>d.k==='t'&&d.sub==='永続');
const CONT_SPELL=findName(d=>d.k==='s'&&d.sub==='永続');
const FIELD_SPELL=findName(d=>d.k==='s'&&d.sub==='フィールド');
const LV4MACH=findName(d=>d.k==='m'&&d.ra==='機械'&&d.lv===4&&!d.ex);
const DARKMACH=findName(d=>d.k==='m'&&d.ra==='機械'&&d.at==='闇'&&d.lv===4&&!d.ex);
const LV1BEAST=findName(d=>d.k==='m'&&d.ra==='獣'&&d.lv===1&&!d.ex);
const TUNER=findName(d=>d.k==='m'&&!d.ex&&/チューナー/.test(String(d.e||'')+String((d.st||[]).join(''))));
const KARAKURI=findName(d=>d.k==='m'&&!d.ex&&String(d.n).indexOf('カラクリ')>=0);
const VENOM=findName(d=>d.k==='m'&&!d.ex&&isCardInGroupV4(d,GROUP.VENOM));

const NAMES=['ギアギアーノ','ブラック・ボンバー','ロックキャット','リバイバル・ギフト','金属探知器',
 '魔法探査の石版','世界の平定','ディフェンダーズ・クロス','カラクリ大暴走','王宮の陥落','魔力終了宣告',
 '蛇神の勅命','威風堂々','壺盗み','墓場からの呼び声','グリフォンの翼'];
NAMES.forEach(n=>ok('Negation registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: 小道具カードがDBに揃っている',
   !!CONT_TRAP&&!!CONT_SPELL&&!!FIELD_SPELL&&!!LV4MACH&&!!DARKMACH&&!!LV1BEAST&&!!TUNER&&!!KARAKURI&&!!VENOM);

/* =====================================================================
   蘇生したモンスターの効果を無効にする
   ===================================================================== */
reset0();
let gear=mk('ギアギアーノ');gameState.players[0].mz=[gear];
let mach=mk(LV4MACH);gameState.players[0].grave=[mach];sync();
let eG=eff('ギアギアーノ'),cG=ctxAt(gear,'mz');
ok('ギアギアーノ positive: 墓地に機械族レベル4がいれば発動できる',eG.condition(cG)===true,LV4MACH);
run(eG,cG);answerAll([pendingChoiceV49(gameState).candidates[0].key]);
ok('ギアギアーノ positive: 特殊召喚される',
   gameState.players[0].mz.some(c=>c.uid===mach.uid));
ok('ギアギアーノ positive: そのモンスターの効果が無効になる',
   effectNegated(findCardByUid(mach.uid).card)===true);
ok('ギアギアーノ ruling: 無効はターンをまたいでも続く',
   (()=>{gameState.turn+=2;return effectNegated(findCardByUid(mach.uid).card)===true;})());
ok('ギアギアーノ ruling: 場を離れれば無効も消える',
   (()=>{const h=locateCardAnyV4(findCardByUid(mach.uid).card);
     act({type:'FX_TO_GRAVE',player:h.p,zone:h.zone,index:h.index,reason:'破壊',byDestroy:true});
     return findCardByUid(mach.uid).card.negV13===undefined;})());
reset0();
let gear2=mk('ギアギアーノ');gameState.players[0].mz=[gear2];sync();
ok('ギアギアーノ negative: 墓地に対象がいなければ発動できない',
   eG.condition(ctxAt(gear2,'mz'))===false);

reset0();
let bb=mk('ブラック・ボンバー');gameState.players[0].mz=[bb];
let dm=mk(DARKMACH);gameState.players[0].grave=[dm];sync();
let eBb=eff('ブラック・ボンバー');
let cBb=ctxAt(bb,'mz','onNormalSummon',{event:{card:bb}});cBb.event={card:bb};
ok('ブラック・ボンバー positive: 召喚成功で誘発する',eBb.condition(cBb)===true,DARKMACH);
run(eBb,cBb);
ok('ブラック・ボンバー positive: 表側守備表示で特殊召喚する',
   (()=>{const h=findCardByUid(dm.uid);
     return !!h&&h.zone==='mz'&&h.card.pos==='def'&&h.card.face==='up';})());
ok('ブラック・ボンバー positive: 効果は無効化される',
   effectNegated(findCardByUid(dm.uid).card)===true);
ok('ブラック・ボンバー negative: 他のモンスターの召喚では誘発しない',
   eBb.condition(ctxAt(bb,'mz','onNormalSummon',{event:{card:mk(MON)}}))===false);

reset0();
let rc=mk('ロックキャット');gameState.players[0].mz=[rc];
let beast=mk(LV1BEAST);gameState.players[0].grave=[beast];sync();
let eRc=eff('ロックキャット');
let cRc=ctxAt(rc,'mz','onNormalSummon',{event:{card:rc}});cRc.event={card:rc};
ok('ロックキャット positive: 召喚成功で誘発する',eRc.condition(cRc)===true,LV1BEAST);
run(eRc,cRc);
ok('ロックキャット positive: 表側守備表示で特殊召喚し効果を無効にする',
   (()=>{const h=findCardByUid(beast.uid);
     return !!h&&h.zone==='mz'&&h.card.pos==='def'&&effectNegated(h.card)===true;})());
reset0();
let rc2=mk('ロックキャット');gameState.players[0].mz=[rc2];sync();
ok('ロックキャット negative: 墓地にレベル1獣族がいなければ誘発しない',
   eRc.condition(ctxAt(rc2,'mz','onNormalSummon',{event:{card:rc2}}))===false);

reset0();
let gift=mk('リバイバル・ギフト',0,'down');gameState.players[0].sz=[gift];
let tuner=mk(TUNER);gameState.players[0].grave=[tuner];sync();
let eGi=eff('リバイバル・ギフト'),cGi=ctxAt(gift,'sz');
ok('リバイバル・ギフト positive: 墓地にチューナーがいれば発動できる',eGi.condition(cGi)===true,TUNER);
eGi.operation(cGi);answerAll([pendingChoiceV49(gameState).candidates[0].key]);
ok('リバイバル・ギフト positive: チューナーが効果無効で特殊召喚される',
   (()=>{const h=findCardByUid(tuner.uid);
     return !!h&&h.zone==='mz'&&effectNegated(h.card)===true;})());
ok('リバイバル・ギフト positive: 相手にギフト・デモン・トークン2体',
   gameState.players[1].mz.length===2
   &&gameState.players[1].mz.every(c=>tokenKeyV11(c)==='ギフト・デモン・トークン'));
ok('リバイバル・ギフト ruling: トークンは攻守1500・レベル3',
   (()=>{const d=dbOf(gameState.players[1].mz[0]);
     return d.atk===1500&&d.def===1500&&d.lv===3;})());

/* =====================================================================
   ターン終了時までの一括無効
   ===================================================================== */
reset0();
let det=mk('金属探知器',0,'down');gameState.players[0].sz=[det];
let ct1=mk(CONT_TRAP,1),ct2=mk(CONT_TRAP,0);
gameState.players[1].sz=[ct1];gameState.players[0].sz.push(ct2);
let plainTrap=mk(NTRAP,1);gameState.players[1].sz.push(plainTrap);sync();
let eDet=eff('金属探知器');
let evDet=fire(CONT_TRAP,1,'sz',0,ct1);
let cDet=evCtx(det,'sz',evDet);
ok('金属探知器 positive: 永続罠の発動で発動できる',eDet.condition(cDet)===true,JSON.stringify(evDet));
eDet.operation(cDet);
ok('金属探知器 positive: 場の永続罠が全て無効になる',
   effectNegated(findCardByUid(ct1.uid).card)===true
   &&effectNegated(findCardByUid(ct2.uid).card)===true);
ok('金属探知器 negative: 通常罠は無効にならない',
   effectNegated(findCardByUid(plainTrap.uid).card)===false);
ok('金属探知器 ruling: 次のターンには無効が解ける',
   (()=>{gameState.turn+=1;return effectNegated(findCardByUid(ct1.uid).card)===false;})());
let evPlain=fire(NTRAP,1,'sz',1,plainTrap);
ok('金属探知器 negative: 通常罠の発動では発動できない',
   eDet.condition(evCtx(det,'sz',evPlain))===false);

reset0();
let stone=mk('魔法探査の石版',0,'down');gameState.players[0].sz=[stone];
let cs1=mk(CONT_SPELL,1);gameState.players[1].sz=[cs1];sync();
let eSt=eff('魔法探査の石版');
let evSt=fire(CONT_SPELL,1,'sz',0,cs1);
let cSt=evCtx(stone,'sz',evSt);
ok('魔法探査の石版 positive: 永続魔法の発動で発動できる',eSt.condition(cSt)===true);
eSt.operation(cSt);
ok('魔法探査の石版 positive: 場の永続魔法が無効になる',
   effectNegated(findCardByUid(cs1.uid).card)===true);
ok('魔法探査の石版 negative: 永続罠の発動では発動できない',
   eSt.condition(evCtx(stone,'sz',fire(CONT_TRAP,1,'sz',0,mk(CONT_TRAP,1))))===false);

reset0();
let peace=mk('世界の平定',0,'down');gameState.players[0].sz=[peace];
let fs=mk(FIELD_SPELL,1);gameState.players[1].field=fs;sync();
let ePe=eff('世界の平定');
let evPe=fire(FIELD_SPELL,1,'field',0,fs);
let cPe=evCtx(peace,'sz',evPe);
ok('世界の平定 positive: フィールドカードの発動で発動できる',ePe.condition(cPe)===true);
ePe.operation(cPe);
ok('世界の平定 positive: フィールドカードの効果が無効になる',
   effectNegated(findCardByUid(fs.uid).card)===true);
ok('世界の平定 negative: 通常魔法の発動では発動できない',
   ePe.condition(evCtx(peace,'sz',fire('死者蘇生',1,'sz',0,mk('死者蘇生',1))))===false);

reset0();
let cross=mk('ディフェンダーズ・クロス',0,'down');gameState.players[0].sz=[cross];
let d1=mk(MON,1,'up','def'),d2=mk(MON,1,'down','def'),d3=mk(MON,1,'up','atk');
gameState.players[1].mz=[d1,d2,d3];sync();
gameState.phase='battle';
let eCr=eff('ディフェンダーズ・クロス'),cCr=ctxAt(cross,'sz');
ok('ディフェンダーズ・クロス positive: バトルフェイズなら発動できる',eCr.condition(cCr)===true);
eCr.operation(cCr);
ok('ディフェンダーズ・クロス positive: 守備表示が表側攻撃表示になる',
   findCardByUid(d1.uid).card.pos==='atk'
   &&findCardByUid(d2.uid).card.pos==='atk'&&findCardByUid(d2.uid).card.face==='up');
ok('ディフェンダーズ・クロス positive: そのモンスターの効果が無効になる',
   effectNegated(findCardByUid(d1.uid).card)===true
   &&effectNegated(findCardByUid(d2.uid).card)===true);
ok('ディフェンダーズ・クロス negative: 元から攻撃表示のモンスターは対象外',
   effectNegated(findCardByUid(d3.uid).card)===false);
gameState.phase='main1';
ok('ディフェンダーズ・クロス negative: メインフェイズでは発動できない',
   eCr.condition(ctxAt(cross,'sz'))===false);

reset0();
let rampage=mk('カラクリ大暴走');gameState.players[0].sz=[rampage];
let kara=mk(KARAKURI);gameState.players[0].mz=[kara];
let nonKara=mk(MON);gameState.players[0].mz.push(nonKara);sync();
let eRa=eff('カラクリ大暴走'),cRa=ctxAt(rampage,'sz');
let karaAtk=API.curAtk({p:0,zone:'mz',index:0,card:kara});
ok('カラクリ大暴走 positive: 「カラクリ」がいれば発動できる',eRa.condition(cRa)===true,KARAKURI);
eRa.operation(cRa);
let pcRa=pendingChoiceV49(gameState);
ok('カラクリ大暴走 ruling: 「カラクリ」だけが候補',
   pcRa.candidates.length===1&&pcRa.candidates[0].label===KARAKURI,
   pcRa.candidates.map(x=>x.label).join(','));
answerAll([pcRa.candidates[0].key]);
ok('カラクリ大暴走 positive: 攻撃力が1000アップする',
   API.curAtk({p:0,zone:'mz',index:0,card:findCardByUid(kara.uid).card})===karaAtk+1000);
ok('カラクリ大暴走 positive: 効果が無効になる',
   effectNegated(findCardByUid(kara.uid).card)===true);
ok('カラクリ大暴走 ruling: 次のターンには無効が解ける',
   (()=>{gameState.turn+=1;return effectNegated(findCardByUid(kara.uid).card)===false;})());
reset0();
let rampage2=mk('カラクリ大暴走');gameState.players[0].sz=[rampage2];
gameState.players[0].mz=[mk(MON)];sync();
ok('カラクリ大暴走 negative: 「カラクリ」がいなければ発動できない',
   eRa.condition(ctxAt(rampage2,'sz'))===false);

/* =====================================================================
   チェーンリンクを指定して無効にする
   ===================================================================== */
reset0();
let fall=mk('王宮の陥落',0,'down');gameState.players[0].sz=[fall];
let oct=mk(CONT_TRAP,1);gameState.players[1].sz=[oct];sync();
let eFa=eff('王宮の陥落');
let evFa=fire(CONT_TRAP,1,'sz',0,oct);
let cFa=evCtx(fall,'sz',evFa);
ok('王宮の陥落 positive: 相手の永続罠の発動で発動できる',eFa.condition(cFa)===true);
eFa.operation(cFa);
ok('王宮の陥落 positive: そのチェーンリンクの発動が無効になる',
   API.chainLinkNegated(evFa.chainId)===true);
ok('王宮の陥落 positive: 発動元が破壊される',
   gameState.players[1].sz.length===0&&gameState.players[1].grave.length===1);
ok('王宮の陥落 negative: 自分の永続罠では発動できない',
   (()=>{reset0();const f2=mk('王宮の陥落',0,'down');gameState.players[0].sz=[f2];
     const own=mk(CONT_TRAP,0);gameState.players[0].sz.push(own);sync();
     return eFa.condition(evCtx(f2,'sz',fire(CONT_TRAP,0,'sz',1,own)))===false;})());
ok('王宮の陥落 negative: 通常罠では発動できない',
   (()=>{reset0();const f3=mk('王宮の陥落',0,'down');gameState.players[0].sz=[f3];
     const nt=mk(NTRAP,1);gameState.players[1].sz=[nt];sync();
     return eFa.condition(evCtx(f3,'sz',fire(NTRAP,1,'sz',0,nt)))===false;})());

reset0();
let decl=mk('魔力終了宣告',0,'down');gameState.players[0].sz=[decl];
let ocs=mk(CONT_SPELL,1);gameState.players[1].sz=[ocs];sync();
let eDe=eff('魔力終了宣告');
let evDe=fire(CONT_SPELL,1,'sz',0,ocs);
let cDe=evCtx(decl,'sz',evDe);
ok('魔力終了宣告 positive: 相手の永続魔法の発動で発動できる',eDe.condition(cDe)===true);
eDe.operation(cDe);
ok('魔力終了宣告 positive: 発動を無効にし破壊する',
   API.chainLinkNegated(evDe.chainId)===true&&gameState.players[1].sz.length===0);

reset0();
let snake=mk('蛇神の勅命',0,'down');gameState.players[0].sz=[snake];
gameState.players[0].hand=[mk(VENOM)];
let osp=mk('死者蘇生',1);gameState.players[1].sz=[osp];sync();
let eSn=eff('蛇神の勅命');
let evSn=fire('死者蘇生',1,'sz',0,osp);
let cSn=evCtx(snake,'sz',evSn);
ok('蛇神の勅命 positive: 手札に「ヴェノム」があれば発動できる',eSn.condition(cSn)===true,VENOM);
eSn.operation(cSn);
ok('蛇神の勅命 positive: 発動を無効にし破壊する',
   API.chainLinkNegated(evSn.chainId)===true&&gameState.players[1].sz.length===0);
reset0();
let snake2=mk('蛇神の勅命',0,'down');gameState.players[0].sz=[snake2];
let osp2=mk('死者蘇生',1);gameState.players[1].sz=[osp2];sync();
ok('蛇神の勅命 negative: 手札に「ヴェノム」が無ければ発動できない',
   eSn.condition(evCtx(snake2,'sz',fire('死者蘇生',1,'sz',0,osp2)))===false);

reset0();
let dignity=mk('威風堂々',0,'down');gameState.players[0].sz=[dignity];
let om=mk(MON,1);gameState.players[1].mz=[om];sync();
gameState.phase='battle';
let eDi=eff('威風堂々');
let evDi=fire(MON,1,'mz',0,om);
let cDi=evCtx(dignity,'sz',evDi);
ok('威風堂々 positive: バトルフェイズ中の相手モンスター効果に発動できる',eDi.condition(cDi)===true);
eDi.operation(cDi);
ok('威風堂々 positive: 効果を無効にし発動元を破壊する',
   API.chainLinkNegated(evDi.chainId)===true&&gameState.players[1].mz.length===0);
gameState.phase='main1';
ok('威風堂々 negative: メインフェイズでは発動できない',
   (()=>{reset0();const d2=mk('威風堂々',0,'down');gameState.players[0].sz=[d2];
     const om2=mk(MON,1);gameState.players[1].mz=[om2];sync();gameState.phase='main1';
     return eDi.condition(evCtx(d2,'sz',fire(MON,1,'mz',0,om2)))===false;})());

reset0();
let thief=mk('壺盗み');gameState.players[0].sz=[thief];
gameState.players[0].deck=[mk(MON)];
let pot=mk('強欲な壺',1);gameState.players[1].sz=[pot];sync();
let eTh=eff('壺盗み');
let evTh=fire('強欲な壺',1,'sz',0,pot);
let cTh=evCtx(thief,'sz',evTh);
ok('壺盗み positive: 「強欲な壺」の発動で発動できる',eTh.condition(cTh)===true);
let handTh=gameState.players[0].hand.length;
eTh.operation(cTh);
ok('壺盗み positive: 効果だけを無効にする',
   gameState.chain.find(x=>x.chainId===evTh.chainId).effectNegated===true
   &&gameState.chain.find(x=>x.chainId===evTh.chainId).activationNegated===false);
ok('壺盗み positive: 1枚ドローする',gameState.players[0].hand.length===handTh+1);
ok('壺盗み ruling: 発動元は破壊しない',gameState.players[1].sz.length===1);
ok('壺盗み negative: 別の魔法では発動できない',
   (()=>{reset0();const t2=mk('壺盗み');gameState.players[0].sz=[t2];
     const other=mk('死者蘇生',1);gameState.players[1].sz=[other];sync();
     return eTh.condition(evCtx(t2,'sz',fire('死者蘇生',1,'sz',0,other)))===false;})());

reset0();
let call=mk('墓場からの呼び声',0,'down');gameState.players[0].sz=[call];
let reborn=mk('死者蘇生',1);gameState.players[1].sz=[reborn];sync();
let eCa=eff('墓場からの呼び声');
let evCa=fire('死者蘇生',1,'sz',0,reborn);
let cCa=evCtx(call,'sz',evCa);
ok('墓場からの呼び声 positive: 相手の「死者蘇生」に発動できる',eCa.condition(cCa)===true);
eCa.operation(cCa);
ok('墓場からの呼び声 positive: 効果が無効になる',
   API.chainLinkNegated(evCa.chainId)===true);
ok('墓場からの呼び声 negative: 自分の「死者蘇生」には発動できない',
   (()=>{reset0();const c2=mk('墓場からの呼び声',0,'down');gameState.players[0].sz=[c2];
     const own=mk('死者蘇生',0);gameState.players[0].sz.push(own);sync();
     return eCa.condition(evCtx(c2,'sz',fire('死者蘇生',0,'sz',1,own)))===false;})());

reset0();
let griff=mk('グリフォンの翼',0,'down');gameState.players[0].sz=[griff];
let duster=mk('ハーピィの羽根帚',1);gameState.players[1].sz=[duster];
let extra=mk(NTRAP,1);gameState.players[1].sz.push(extra);sync();
let eGr=eff('グリフォンの翼');
let evGr=fire('ハーピィの羽根帚',1,'sz',0,duster);
let cGr=evCtx(griff,'sz',evGr);
ok('グリフォンの翼 positive: 相手の「ハーピィの羽根帚」に発動できる',eGr.condition(cGr)===true);
eGr.operation(cGr);
ok('グリフォンの翼 positive: 効果を無効にする',API.chainLinkNegated(evGr.chainId)===true);
ok('グリフォンの翼 positive: 相手の魔法・罠を全て破壊する',
   gameState.players[1].sz.length===0,'sz='+gameState.players[1].sz.length);
ok('グリフォンの翼 negative: 別の魔法では発動できない',
   (()=>{reset0();const g2=mk('グリフォンの翼',0,'down');gameState.players[0].sz=[g2];
     const other=mk('死者蘇生',1);gameState.players[1].sz=[other];sync();
     return eGr.condition(evCtx(g2,'sz',fire('死者蘇生',1,'sz',0,other)))===false;})());

/* =====================================================================
   Replay / SaveLoad / 直列化
   ===================================================================== */
/* 再生の確認は特殊召喚を挟まない進行で行う。
   API.specialSummon は act() から戻った後に onSpecialSummon を積むため、
   次の Action に記録される digest を再生側が再現できない。これは v13 で
   持ち込んだものではなく、未改変の live でも同じ結果になる既知の制限。 */
reset0();
let rDet=mk('金属探知器',0,'down');gameState.players[0].sz=[rDet];
let rCt=mk(CONT_TRAP,1);gameState.players[1].sz=[rCt];sync();
v41ResetActionJournal(gameState);
let rEv=fire(CONT_TRAP,1,'sz',0,rCt);
eDet.operation(evCtx(rDet,'sz',rEv));
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: 効果無効を含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('直列化: 無効化の記録に関数が混入していない',
   assertNegationStateSerializableV13(gameState)===null);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
