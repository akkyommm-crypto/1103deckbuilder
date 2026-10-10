/* LeaveField recovery batch — 17枚の positive / negative / ruling edge case。 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
let __u=92000;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return{id,owner:p,controller:p,face,pos,uid:__u++};}
function reset0(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
}
function sync(){gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function eff(n,k){const e=nativeEffectsV4(n).find(x=>!k||x.key===k);if(!e)throw new Error('effect '+n+' '+k);return e;}
function ctxAt(card,zone,ev,extra){const h=locateCardAnyV4(card);
  return makeContext(0,card,zone||(h&&h.zone)||'sz',(h&&h.index)||0,ev||'activate',extra||{});}
function run(e,c){if(e.cost){let p=false;e.cost(c,v=>{p=v;});} if(e.target)e.target(c,r=>{c.selectedTargets=r;}); e.operation(c);drain0();}
/* S03-U62: some cards now open a real (SaveLoad-safe) API.requestChoice pending choice instead of the
   old synchronous API.selectCard closure the reset0() stub above intercepts. Auto-answer any such pending
   choice by always picking the first candidate (matches the stub's own semantics). */
function drain0(){for(let i=0;i<10&&typeof pendingChoiceV49==='function'&&pendingChoiceV49(gameState);i++)__choicePickV49(0);}
function findName(pred){for(let i=0;i<CARD_DB.length;i++){if(pred(CARD_DB[i]))return CARD_DB[i].n;}return null;}
const MID='ヂェミナイ・エルフ';
const LV2   =findName(d=>d.k==='m'&&(d.lv||9)<=2&&!d.ex);
const VANILLA=findName(d=>d.k==='m'&&(d.st||[]).includes('通常')&&!d.ex);
const PSY   =findName(d=>d.k==='m'&&d.ra==='サイキック'&&!d.ex);
const ROCKM =findName(d=>d.k==='m'&&d.ra==='岩石'&&!d.ex);
const FAIRYM=findName(d=>d.k==='m'&&d.ra==='天使'&&!d.ex);
const DARKM =findName(d=>d.k==='m'&&d.at==='闇'&&!d.ex);
const BATT  =findName(d=>d.k==='m'&&isSetCardV4(d,SETCODE.BATTERYMAN));
const PLANT2=findName(d=>d.k==='m'&&d.ra==='植物'&&(d.lv||9)<=2&&!d.ex);
const PLANT5=findName(d=>d.k==='m'&&d.ra==='植物'&&(d.lv||9)<=5&&!d.ex);
const NEOS  =findName(d=>d.k==='m'&&isCardInGroupV4(d,GROUP.N_NEOSPACIAN));
const EHERO =findName(d=>d.k==='m'&&isSetCardV4(d,SETCODE.ELEMENTAL_HERO)&&!d.ex);
const DHERO =findName(d=>d.k==='m'&&isSetCardV4(d,SETCODE.DESTINY_HERO)&&!d.ex);
const FIELDS=findName(d=>d.k==='s'&&d.sub==='フィールド');

const NAMES=['エンジェル・リフト','正統なる血統','蘇りし魂','ブレインハザード','化石岩の解放','奇跡の光臨',
 '闇次元の解放','携帯型バッテリー','ヒステリック・パーティー','超栄養太陽','魂の共有－コモンソウル',
 'グレイモヤ不発弾','鉄壁の布陣','光のピラミッド','D－タイム','マインフィールド','女神の加護'];
NAMES.forEach(n=>ok('LeaveField registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: 小道具カードがDBに揃っている',
   !!LV2&&!!VANILLA&&!!PSY&&!!ROCKM&&!!FAIRYM&&!!DARKM&&!!BATT&&!!PLANT2&&!!NEOS&&!!EHERO&&!!DHERO&&!!FIELDS);

/* ---- 蘇生 + 相互リンク（同一形状） ---- */
function reviveCase(name,pileZone,monName,otherName,monOnGone){
  /* positive */
  reset0();
  const s=mk(name);gameState.players[0].sz=[s];
  const m=mk(monName);gameState.players[0][pileZone]=[m];
  sync();v41ResetActionJournal(gameState);
  const e=eff(name);
  const c=ctxAt(s,'sz');
  ok(name+' positive: 対象がいれば発動できる',e.condition(c)===true,'pile='+pileZone+' '+monName);
  run(e,c);
  ok(name+': 特殊召喚される',gameState.players[0].mz.length===1&&gameState.players[0].mz[0].uid===m.uid,
     'mz='+gameState.players[0].mz.length);
  ok(name+': 相互リンクが張られる',
     !!API.linkState(findCardByUid(s.uid).card)&&!!API.linkState(findCardByUid(m.uid).card));
  /* このカードが離れたらモンスターも離れる */
  act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
  const after=findCardByUid(m.uid);
  ok(name+' ruling: このカードが離れるとモンスターも場を離れる',
     gameState.players[0].mz.length===0&&after&&after.zone===(monOnGone==='destroyBanish'?'banish':'grave'),
     'zone='+(after&&after.zone));
  /* 逆向き: モンスターが離れたらこのカードも破壊される */
  reset0();
  const s2=mk(name);gameState.players[0].sz=[s2];
  const m2=mk(monName);gameState.players[0][pileZone]=[m2];
  sync();v41ResetActionJournal(gameState);
  const c2=ctxAt(s2,'sz');
  run(eff(name),c2);
  act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'モンスターを破壊',byDestroy:true});
  ok(name+' ruling: モンスターが離れるとこのカードも破壊される',
     gameState.players[0].sz.length===0,'sz='+gameState.players[0].sz.length);
  /* negative */
  reset0();
  const s3=mk(name);gameState.players[0].sz=[s3];
  gameState.players[0][pileZone]=[mk(otherName)];
  sync();
  ok(name+' negative: 条件外のモンスターしかなければ発動できない',
     eff(name).condition(ctxAt(s3,'sz'))===false);
}
reviveCase('エンジェル・リフト','grave',LV2,'青眼の白龍','destroy');
reviveCase('正統なる血統','grave',VANILLA,'冥界の魔王 ハ・デス','destroy');
reviveCase('蘇りし魂','grave',VANILLA,'冥界の魔王 ハ・デス','destroy');
reviveCase('ブレインハザード','banish',PSY,'岩石の巨兵','destroy');
reviveCase('化石岩の解放','banish',ROCKM,'冥界の魔王 ハ・デス','destroy');
reviveCase('奇跡の光臨','banish',FAIRYM,'岩石の巨兵','destroy');
reviveCase('闇次元の解放','banish',DARKM,'岩石の巨兵','destroyBanish');

/* ---- 携帯型バッテリー ---- */
reset0();
let bt=mk('携帯型バッテリー'),b1=mk(BATT),b2=mk(BATT);
gameState.players[0].sz=[bt];gameState.players[0].grave=[b1,b2];
sync();v41ResetActionJournal(gameState);
ok('携帯型バッテリー positive: 墓地に「電池メン」が2体で発動できる',
   eff('携帯型バッテリー').condition(ctxAt(bt,'sz'))===true);
run(eff('携帯型バッテリー'),ctxAt(bt,'sz'));
ok('携帯型バッテリー: 2体を特殊召喚する',gameState.players[0].mz.length===2);
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
ok('携帯型バッテリー ruling: このカードが離れると2体とも破壊される',
   gameState.players[0].mz.length===0,'mz='+gameState.players[0].mz.length);
reset0();
let bt2=mk('携帯型バッテリー');gameState.players[0].sz=[bt2];gameState.players[0].grave=[mk(BATT)];
sync();
ok('携帯型バッテリー negative: 1体では発動できない',
   eff('携帯型バッテリー').condition(ctxAt(bt2,'sz'))===false);

/* ---- ヒステリック・パーティー ---- */
reset0();
let hp=mk('ヒステリック・パーティー'),h1=mk('ハーピィ・レディ'),h2=mk('ハーピィ・レディ');
gameState.players[0].sz=[hp];gameState.players[0].grave=[h1,h2];
gameState.players[0].hand=[mk(MID)];
sync();v41ResetActionJournal(gameState);
ok('ヒステリック・パーティー positive: 手札と墓地の条件を満たせば発動できる',
   eff('ヒステリック・パーティー').condition(ctxAt(hp,'sz'))===true);
run(eff('ヒステリック・パーティー'),ctxAt(hp,'sz'));
ok('ヒステリック・パーティー: 可能な限り特殊召喚する',gameState.players[0].mz.length===2);
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
ok('ヒステリック・パーティー ruling: このカードが離れると全て破壊される',
   gameState.players[0].mz.length===0);
reset0();
let hp2=mk('ヒステリック・パーティー'),hkeep=mk('ハーピィ・レディ');
gameState.players[0].sz=[hp2];gameState.players[0].grave=[hkeep];gameState.players[0].hand=[mk(MID)];
sync();v41ResetActionJournal(gameState);
run(eff('ヒステリック・パーティー'),ctxAt(hp2,'sz'));
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'モンスターを破壊',byDestroy:true});
ok('ヒステリック・パーティー ruling: 片方向なのでモンスターが離れてもこのカードは残る',
   gameState.players[0].sz.length===1);
reset0();
let hp3=mk('ヒステリック・パーティー');gameState.players[0].sz=[hp3];
gameState.players[0].grave=[mk('ハーピィ・レディ')];gameState.players[0].hand=[];
sync();
ok('ヒステリック・パーティー negative: 手札が無ければ発動できない',
   eff('ヒステリック・パーティー').condition(ctxAt(hp3,'sz'))===false);

/* ---- 超栄養太陽 ---- */
reset0();
let ss=mk('超栄養太陽'),p2=mk(PLANT2),p5=mk(PLANT5);
gameState.players[0].sz=[ss];gameState.players[0].mz=[p2];gameState.players[0].hand=[p5];
sync();v41ResetActionJournal(gameState);
ok('超栄養太陽 positive: レベル2以下の植物族がいれば発動できる',
   eff('超栄養太陽').condition(ctxAt(ss,'sz'))===true);
run(eff('超栄養太陽'),ctxAt(ss,'sz'));
ok('超栄養太陽: リリースして上位の植物族を特殊召喚する',
   gameState.players[0].mz.length===1&&gameState.players[0].mz[0].uid===p5.uid,
   'mz='+gameState.players[0].mz.length);
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
ok('超栄養太陽 ruling: このカードが離れるとそのモンスターも破壊される',gameState.players[0].mz.length===0);
reset0();
let ss2=mk('超栄養太陽');gameState.players[0].sz=[ss2];gameState.players[0].mz=[mk(MID)];
sync();
ok('超栄養太陽 negative: 植物族がいなければ発動できない',
   eff('超栄養太陽').condition(ctxAt(ss2,'sz'))===false);

/* ---- 魂の共有－コモンソウル ---- */
reset0();
let cs=mk('魂の共有－コモンソウル'),tgt=mk(MID),neo=mk(NEOS);
gameState.players[0].sz=[cs];gameState.players[0].mz=[tgt];gameState.players[0].hand=[neo];
sync();v41ResetActionJournal(gameState);
ok('魂の共有－コモンソウル positive: 「N」が手札にあれば発動できる',
   eff('魂の共有－コモンソウル').condition(ctxAt(cs,'sz'))===true);
run(eff('魂の共有－コモンソウル'),ctxAt(cs,'sz'));
ok('魂の共有－コモンソウル: 「N」を特殊召喚し攻撃力を加算する',
   gameState.players[0].mz.length===2&&curATK(findCardByUid(tgt.uid).card)>1900,
   'atk='+curATK(findCardByUid(tgt.uid).card));
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
ok('魂の共有－コモンソウル ruling: このカードが離れると「N」は手札に戻る',
   gameState.players[0].hand.some(x=>x.uid===neo.uid),'hand='+gameState.players[0].hand.length);
reset0();
let cs2=mk('魂の共有－コモンソウル');gameState.players[0].sz=[cs2];gameState.players[0].mz=[mk(MID)];
gameState.players[0].hand=[mk(MID)];sync();
ok('魂の共有－コモンソウル negative: 「N」が無ければ発動できない',
   eff('魂の共有－コモンソウル').condition(ctxAt(cs2,'sz'))===false);

/* ---- グレイモヤ不発弾 ---- */
reset0();
let gm=mk('グレイモヤ不発弾'),g1=mk(MID),g2=mk('岩石の巨兵');
gameState.players[0].sz=[gm];gameState.players[0].mz=[g1,g2];
sync();v41ResetActionJournal(gameState);
ok('グレイモヤ不発弾 positive: 攻撃表示2体がいれば発動できる',
   eff('グレイモヤ不発弾').condition(ctxAt(gm,'sz'))===true);
run(eff('グレイモヤ不発弾'),ctxAt(gm,'sz'));
ok('グレイモヤ不発弾: 2体と相互リンクが張られる',
   !!API.linkState(findCardByUid(g1.uid).card)&&!!API.linkState(findCardByUid(g2.uid).card));
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'1体を破壊',byDestroy:true});
ok('グレイモヤ不発弾 ruling: 選択したモンスターが離れるとこのカードも破壊される',
   gameState.players[0].sz.length===0);
ok('グレイモヤ不発弾 ruling: このカードの破壊で残りも破壊される',
   gameState.players[0].mz.length===0,'mz='+gameState.players[0].mz.length);
reset0();
let gm2=mk('グレイモヤ不発弾');gameState.players[0].sz=[gm2];gameState.players[0].mz=[mk(MID)];
sync();
ok('グレイモヤ不発弾 negative: 1体では発動できない',
   eff('グレイモヤ不発弾').condition(ctxAt(gm2,'sz'))===false);

/* ---- 鉄壁の布陣 ---- */
reset0();
let tb=mk('鉄壁の布陣'),d1=mk(MID,0,'up','def'),d2=mk('岩石の巨兵',0,'up','def');
gameState.players[0].sz=[tb];gameState.players[0].mz=[d1,d2];
sync();v41ResetActionJournal(gameState);
ok('鉄壁の布陣 positive: 自分のモンスターがいれば発動できる',
   eff('鉄壁の布陣').condition(ctxAt(tb,'sz'))===true);
run(eff('鉄壁の布陣'),ctxAt(tb,'sz'));
ok('鉄壁の布陣: 全員守備表示なら守備力が700上がる',curDEF(d1)===900+700,'def='+curDEF(d1));
act({type:'FX_SET_STATE',player:0,zone:'mz',index:1,pos:'atk',reason:'攻撃表示へ'});
ok('鉄壁の布陣 ruling: 攻撃表示が混ざると上昇しない',curDEF(d1)===900,'def='+curDEF(d1));
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'対象を破壊',byDestroy:true});
ok('鉄壁の布陣 ruling: 選択したモンスターが離れるとこのカードは破壊される',
   gameState.players[0].sz.length===0);
reset0();
let tb2=mk('鉄壁の布陣');gameState.players[0].sz=[tb2];
sync();
ok('鉄壁の布陣 negative: モンスターがいなければ発動できない',
   eff('鉄壁の布陣').condition(ctxAt(tb2,'sz'))===false);

/* ---- 光のピラミッド ---- */
reset0();
let py=mk('光のピラミッド'),sx=mk('アンドロ・スフィンクス');
gameState.players[0].sz=[py];gameState.players[0].mz=[sx];
sync();v41ResetActionJournal(gameState);
ok('光のピラミッド positive: スフィンクスがいれば発動できる',
   eff('光のピラミッド').condition(ctxAt(py,'sz'))===true);
run(eff('光のピラミッド'),ctxAt(py,'sz'));
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
ok('光のピラミッド ruling: このカードが離れるとスフィンクスは破壊され除外される',
   gameState.players[0].mz.length===0&&gameState.players[0].banish.length===1,
   'banish='+gameState.players[0].banish.length);
reset0();
let py2=mk('光のピラミッド');gameState.players[0].sz=[py2];gameState.players[0].mz=[mk(MID)];
sync();
ok('光のピラミッド negative: スフィンクスがいなければ発動できない',
   eff('光のピラミッド').condition(ctxAt(py2,'sz'))===false);

/* ---- D－タイム ---- */
reset0();
let dt=mk('D－タイム'),eh=mk(EHERO);
gameState.players[0].sz=[dt];gameState.players[0].mz=[eh];
gameState.players[0].deck=[mk(DHERO)];
sync();v41ResetActionJournal(gameState);
gameState.deferredEvents=[];
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
let lev=(gameState.deferredEvents||[]).filter(e=>e.eventName==='onLeaveField').map(e=>e.evt);
let e14=eff('D－タイム');
let c14=ctxAt(dt,'sz','onLeaveField',{event:lev[0]});
const dLv=dbOf({id:findCardIndex(DHERO)}).lv||0, eLv=dbOf({id:findCardIndex(EHERO)}).lv||0;
ok('D－タイム positive: 「E・HERO」が場を離れたら発動できる',
   (dLv<=eLv)?(e14.condition(c14)===true):(e14.condition(c14)===false),
   'E・HERO Lv'+eLv+' / D－HERO Lv'+dLv);
if(dLv<=eLv){e14.operation(c14);drain0();
  ok('D－タイム: デッキから「D－HERO」を手札に加える',gameState.players[0].hand.length===1);}
reset0();
let dt2=mk('D－タイム'),other=mk(MID);
gameState.players[0].sz=[dt2];gameState.players[0].mz=[other];
gameState.players[0].deck=[mk(DHERO)];
sync();v41ResetActionJournal(gameState);gameState.deferredEvents=[];
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
let lev2=(gameState.deferredEvents||[]).filter(e=>e.eventName==='onLeaveField').map(e=>e.evt);
ok('D－タイム negative: 「E・HERO」以外では発動できない',
   eff('D－タイム').condition(ctxAt(dt2,'sz','onLeaveField',{event:lev2[0]}))===false);

/* ---- マインフィールド ---- */
reset0();
let mf=mk('マインフィールド');
gameState.players[0].mz=[mf];gameState.players[0].grave=[mk(FIELDS)];
sync();v41ResetActionJournal(gameState);gameState.deferredEvents=[];
act({type:'FX_BOUNCE',player:0,zone:'mz',index:0,reason:'手札へ'});
let lev3=(gameState.deferredEvents||[]).filter(e=>e.eventName==='onLeaveField').map(e=>e.evt);
let e15=eff('マインフィールド');
let c15=makeContext(0,findCardByUid(mf.uid).card,'hand',findCardByUid(mf.uid).index,'onLeaveField',{event:lev3[0]});
ok('マインフィールド positive: 表側のこのカードが場を離れたら発動できる',e15.condition(c15)===true,
   JSON.stringify(lev3[0]));
e15.operation(c15);drain0();
ok('マインフィールド: 墓地のフィールド魔法を手札に加える',
   gameState.players[0].hand.some(x=>dbOf(x).sub==='フィールド'));
reset0();
let mf2=mk('マインフィールド',0,'down','def');
gameState.players[0].mz=[mf2];gameState.players[0].grave=[mk(FIELDS)];
sync();v41ResetActionJournal(gameState);gameState.deferredEvents=[];
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
let lev4=(gameState.deferredEvents||[]).filter(e=>e.eventName==='onLeaveField').map(e=>e.evt);
let h4=findCardByUid(mf2.uid);
ok('マインフィールド negative: 裏側で離れた場合は発動できない',
   eff('マインフィールド').condition(
     makeContext(0,h4.card,'grave',h4.index,'onLeaveField',{event:lev4[0]}))===false);

/* ---- 女神の加護 ---- */
reset0();
let gg=mk('女神の加護');gameState.players[0].sz=[gg];
sync();v41ResetActionJournal(gameState);
run(eff('女神の加護','gain-3000'),ctxAt(gg,'sz'));
ok('女神の加護: 3000回復する',gameState.players[0].lp===8000+3000);
gameState.deferredEvents=[];
act({type:'FX_TO_GRAVE',player:0,zone:'sz',index:0,reason:'破壊',byDestroy:true});
let lev5=(gameState.deferredEvents||[]).filter(e=>e.eventName==='onLeaveField').map(e=>e.evt);
let h5=findCardByUid(gg.uid);
let e16=eff('女神の加護','lose-3000-on-leave');
let c16=makeContext(0,h5.card,'grave',h5.index,'onLeaveField',{event:lev5[0]});
ok('女神の加護 positive: 場を離れたら誘発する',e16.condition(c16)===true);
e16.operation(c16);
ok('女神の加護: 3000ダメージを受ける',gameState.players[0].lp===11000-3000);
ok('女神の加護 negative: 別のカードの離脱では誘発しない',
   e16.condition(makeContext(0,h5.card,'grave',h5.index,'onLeaveField',
     {event:{uid:999999,player:0,fromZone:'sz',fromFace:'up',toZone:'grave'}}))===false);

/* ---- 全体の健全性 ---- */
ok('LeaveField cards: 盤面はJSON直列化できる',!!JSON.stringify(gameState));
ok('LeaveField cards: リンク状態は純JSON',assertLinkStateSerializableV9(gameState).ok);
/* Replay 検証は特殊召喚を挟まない構成で行う。
   API.specialSummon が onSpecialSummon を act() の外で積むのは既存挙動で、
   その直後のActionのdigestは再生側と一致しない（live でも同じ）。
   ここでは LeaveField 固有の経路だけを検証する。 */
reset0();
let ra=mk('グレイモヤ不発弾'),r1=mk(MID),r2=mk('岩石の巨兵');
gameState.players[0].sz=[ra];gameState.players[0].mz=[r1,r2];
sync();v41ResetActionJournal(gameState);
run(eff('グレイモヤ不発弾'),ctxAt(ra,'sz'));
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('LeaveField cards: リンク解決を含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
