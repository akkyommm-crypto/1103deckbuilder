/* Auto cycle 34 — 7枚。positive / negative / ruling edge / Replay。 */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});globalThis.__R=R;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos,summonedTurn:1};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;
  gameState.phase='main1';gameState.turn=6;PLAY_MODE=PLAY_MODES.DUEL;
  HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();
  v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
  API.confirm=(t,m,yes,no)=>{ if(no) no(); };
  gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function h(c){return locateCardAnyV4(c);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function C(p,card,zone,idx,ev,extra){const c=makeContext(p,card,zone,idx,ev||'activate',extra||{});
  if(extra&&extra.event)c.event=extra.event;return c;}
function ctxEv(p,card,ev,evt,zone){const loc=h(card);
  return C(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,ev,{event:evt});}
function ctxDS(p,card,battle,zone,step){const loc=h(card);
  const c=C(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,'onDamageStep',{event:{},battle:battle,step:step||'end'});
  c.battle=battle;c.step=step||'end';return c;}
function pending(){return pendingChoiceV49(gameState);}
function synchroSummon(p, synName, materials){
  const P=gameState.players[p];
  const ex=mk(synName,p); P.ex=[ex]; ensureCardUid(gameState,ex);
  materials.forEach(c=>ensureCardUid(gameState,c));
  const indices=materials.map(c=>P.mz.indexOf(c)).filter(i=>i>=0).sort((a,b)=>b-a);
  gameState.deferredEvents=[];
  act({type:'EX_SUMMON_PREPARE_V42',player:p,exIndex:0,materials:indices,kind:'synchro',pos:'atk'});
  act({type:'EX_SUMMON_COMMIT_V42'});
  const evts=(gameState.deferredEvents||[]).slice(); gameState.deferredEvents=[];
  return {syn:ex, evts};
}
function matEvt(pack, card){
  const e=pack.evts.find(x=>x.eventName==='onSendToGrave'&&x.evt&&x.evt.uid===card.uid);
  return e?e.evt:null;
}
const PLAIN='ワイト';        /* 闇 アンデット lv1 ATK300 */
const BIG='青眼の白龍';       /* 光 ドラゴン lv8 ATK3000 */
const TUNER='ジェネクス・コントローラー';

const ALL=['レスキューキャット','マックス・テレポーター','ヴァンパイア・ロード',
 'マジック・キャプチャー','ヒーロー・マスク','魔術の呪文書','ブレイン・ジャッカー'];
ALL.forEach(n=>ok('cycle34 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle34 枚数は7',ALL.length===7);

const BEAST3='X－セイバー エアベルン';   /* 獣 lv3 */
const PSY3='メンタルプロテクター';       /* サイキック lv3 */
const HERO='E・HERO エアーマン';         /* E・HERO */
const BM='ブラック・マジシャン';

function fireAt(at,p,phase,advance){
  gameState.turn=gameState.turn+(advance==null?0:advance);
  gameState.activePlayer=p;gameState.phase=phase;
  return runDueSchedulesV7(at,gameState);
}

/* ============ 1. レスキューキャット ============ */
reset0();
let rc=mk('レスキューキャット',0);
gameState.players[0].mz=[rc];
gameState.players[0].deck=[mk(BEAST3,0),mk(BEAST3,0),mk(BIG,0)];
let rcCtx=C(0,rc,'mz',0,'activate',{});
ok('レスキューキャット positive: デッキにレベル3以下の獣族が2体いれば発動できる',
   sc('レスキューキャット').condition(rcCtx)===true);
let rcCost=false;sc('レスキューキャット').cost(rcCtx,v=>{rcCost=v;});
ok('レスキューキャット positive: コストで自身が墓地へ送られる',
   rcCost&&gameState.players[0].mz.length===0);
sc('レスキューキャット').resolve(rcCtx);
ok('レスキューキャット card-specific: デッキから獣族2体が特殊召喚される',
   gameState.players[0].mz.length===2
   &&gameState.players[0].mz.every(c=>c&&dbOf(c).ra==='獣'),
   'mz='+gameState.players[0].mz.length);
ok('レスキューキャット card-specific: 特殊召喚したモンスターの効果は無効化される',
   gameState.players[0].mz.every(c=>API.isEffectNegated(h(c))===true));
ok('レスキューキャット card-specific: エンドフェイズの破壊が予約される',
   API.schedules('e3.destroyUids').length===1);
fireAt('endPhase',0,'end');
ok('レスキューキャット card-specific: 予約が発火して2体とも破壊される',
   gameState.players[0].mz.length===0,'mz='+gameState.players[0].mz.length);
reset0();
let rc2=mk('レスキューキャット',0);
gameState.players[0].mz=[rc2];
gameState.players[0].deck=[mk(BEAST3,0),mk(BIG,0)];
ok('レスキューキャット negative: 獣族が1体では発動できない',
   sc('レスキューキャット').condition(C(0,rc2,'mz',0,'activate',{}))===false);
ok('レスキューキャット ruling: 1ターンに1度・カード名指定（nameLimit）',
   sc('レスキューキャット').countLimit===1&&sc('レスキューキャット').nameLimit===true);

/* ============ 2. マックス・テレポーター ============ */
reset0();
let mt=mk('マックス・テレポーター',0);
gameState.players[0].mz=[mt];
gameState.players[0].deck=[mk(PSY3,0),mk(PSY3,0),mk(BIG,0)];
let mtCtx=C(0,mt,'mz',0,'activate',{});
ok('マックス・テレポーター positive: レベル3のサイキック族が2体いれば発動できる',
   sc('マックス・テレポーター').condition(mtCtx)===true);
let mtLp=gameState.players[0].lp;
sc('マックス・テレポーター').cost(mtCtx,()=>{});
ok('マックス・テレポーター positive: 2000ライフポイントを払う',
   gameState.players[0].lp===mtLp-2000);
sc('マックス・テレポーター').resolve(mtCtx);
/* マックス・テレポーター自身もサイキック族なので、レベル3で数える。 */
ok('マックス・テレポーター card-specific: デッキからレベル3のサイキック族2体が出る',
   gameState.players[0].mz.length===3
   &&gameState.players[0].mz.filter(c=>c&&dbOf(c).ra==='サイキック'
        &&Number(dbOf(c).lv)===3).length===2,
   'mz='+gameState.players[0].mz.length);
ok('マックス・テレポーター card-specific: 使用済みの印が残り再発動できない',
   Number(mt.e3MaxUsed)===1
   &&sc('マックス・テレポーター').condition(C(0,mt,'mz',0,'activate',{}))===false);
ok('マックス・テレポーター ruling: 特殊召喚できない（cannotSpecialSummon）',
   sc('マックス・テレポーター').cannotSpecialSummon===true);
reset0();
let mt2=mk('マックス・テレポーター',0);
gameState.players[0].mz=[mt2];gameState.players[0].lp=1500;
gameState.players[0].deck=[mk(PSY3,0),mk(PSY3,0)];
ok('マックス・テレポーター negative: 2000ライフを払えなければ発動できない',
   sc('マックス・テレポーター').condition(C(0,mt2,'mz',0,'activate',{}))===false);

/* ============ 3. ヴァンパイア・ロード ============ */
reset0();
let vl=mk('ヴァンパイア・ロード',0);
gameState.players[0].mz=[vl];ensureCardUid(gameState,vl);
gameState.players[1].deck=[mk('強欲な壺',1),mk(PLAIN,1),mk('落とし穴',1)];
let vlCtx=ctxEv(0,vl,'onBattleDamage',
  {player:1,amount:2000,attackerUid:vl.uid},'mz');
ok('ヴァンパイア・ロード positive: 戦闘ダメージを与えた時に誘発する',
   sc('ヴァンパイア・ロード').passive.onBattleDamage(vlCtx)===true);
sc('ヴァンパイア・ロード').resolve(vlCtx);
ok('ヴァンパイア・ロード positive: 種類の宣言要求が出る（3択）',
   !!pending()&&pending().candidates.length===3&&pending().player===0,
   'n='+(pending()&&pending().candidates.length));
let vlDeck=gameState.players[1].deck.length;
let vlSpell=pending().candidates.find(c=>c.value==='魔法');
API.answerChoice([vlSpell.key]);
ok('ヴァンパイア・ロード card-specific: 宣言した種類のカードがデッキから墓地へ送られる',
   gameState.players[1].deck.length===vlDeck-1
   &&gameState.players[1].grave.some(c=>c&&dbOf(c).k==='s'),
   'grave='+gameState.players[1].grave.map(c=>dbOf(c).n).join(','));
reset0();
let vl2=mk('ヴァンパイア・ロード',0);
gameState.players[0].grave=[vl2];ensureCardUid(gameState,vl2);
vl2.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
gameState.destroyedThisTurnV30=[{byPlayer:1,victimPlayer:0,from:'mz',
  uid:vl2.uid,turn:gameState.turn,battle:false}];
let vl2Ctx=C(0,vl2,'grave',0,'activate',{});
ok('ヴァンパイア・ロード positive: 相手の効果で破壊された場合に発動できる',
   sc('ヴァンパイア・ロード').condition(vl2Ctx)===true);
sc('ヴァンパイア・ロード').resolve(vl2Ctx);
ok('ヴァンパイア・ロード card-specific: 次の自分スタンバイの蘇生が予約される',
   API.schedules('e3.reviveUid').length===1);
fireAt('standbyPhase',0,'standby',2);
ok('ヴァンパイア・ロード card-specific: 予約が発火して墓地から特殊召喚される',
   gameState.players[0].mz.some(c=>c&&c.uid===vl2.uid));
reset0();
let vl3=mk('ヴァンパイア・ロード',0);
gameState.players[0].grave=[vl3];ensureCardUid(gameState,vl3);
vl3.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
gameState.destroyedThisTurnV30=[{byPlayer:1,victimPlayer:0,from:'mz',
  uid:vl3.uid,turn:gameState.turn,battle:true}];
ok('ヴァンパイア・ロード negative: 戦闘破壊では蘇生効果を発動できない',
   sc('ヴァンパイア・ロード').condition(C(0,vl3,'grave',0,'activate',{}))===false);

/* ============ 4. マジック・キャプチャー ============ */
reset0();
let mc=mk('マジック・キャプチャー',0,'down'),mcSp=mk('強欲な壺',0);
gameState.players[0].sz=[mc,mcSp];gameState.players[0].hand=[mk(PLAIN,0)];
ensureCardUid(gameState,mc);ensureCardUid(gameState,mcSp);
let mcCtx=ctxEv(0,mc,'onActivateSuccess',
  {uid:mcSp.uid,player:0,kind:'spell',sub:'normal',chainId:1},'sz');
ok('マジック・キャプチャー positive: 自分の魔法の発動に反応する',
   sc('マジック・キャプチャー').passive.onActivateSuccess(mcCtx)===true);
let mcCost=false;sc('マジック・キャプチャー').cost(mcCtx,v=>{mcCost=v;});
ok('マジック・キャプチャー positive: コストで手札を1枚捨てる',
   mcCost&&gameState.players[0].hand.length===0);
sc('マジック・キャプチャー').resolve(mcCtx);
ok('マジック・キャプチャー card-specific: 対象の魔法の uid が記録される',
   Number(mc.e3WatchUid)===mcSp.uid,'watch='+mc.e3WatchUid);
gameState.players[0].sz=[];gameState.players[0].grave=[mc,mcSp];
let mcCtx2=C(0,mc,'grave',0,'activate',{});
ok('マジック・キャプチャー positive: 記録した魔法が墓地へ行ったら発動できる',
   sc('マジック・キャプチャー').condition(mcCtx2)===true);
sc('マジック・キャプチャー').resolve(mcCtx2);
ok('マジック・キャプチャー card-specific: その魔法が手札に戻る',
   gameState.players[0].hand.some(c=>c&&dbOf(c).n==='強欲な壺'),
   'hand='+gameState.players[0].hand.map(c=>dbOf(c).n).join(','));
reset0();
let mc2=mk('マジック・キャプチャー',0,'down'),mc2Trap=mk('落とし穴',0);
gameState.players[0].sz=[mc2];gameState.players[0].hand=[mk(PLAIN,0)];
ensureCardUid(gameState,mc2Trap);
ok('マジック・キャプチャー negative: 罠の発動には反応しない',
   sc('マジック・キャプチャー').passive.onActivateSuccess(
     ctxEv(0,mc2,'onActivateSuccess',
       {uid:mc2Trap.uid,player:0,kind:'trap',chainId:1},'sz'))===false);
reset0();
let mc3=mk('マジック・キャプチャー',0,'down'),mc3Sp=mk('強欲な壺',1);
gameState.players[0].sz=[mc3];gameState.players[1].sz=[mc3Sp];
gameState.players[0].hand=[mk(PLAIN,0)];
ensureCardUid(gameState,mc3Sp);
ok('マジック・キャプチャー ruling: 相手の魔法の発動には反応しない',
   sc('マジック・キャプチャー').passive.onActivateSuccess(
     ctxEv(0,mc3,'onActivateSuccess',
       {uid:mc3Sp.uid,player:1,kind:'spell',chainId:1},'sz'))===false);

/* ============ 5. ヒーロー・マスク ============ */
reset0();
let hm=mk('ヒーロー・マスク',0),hmMon=mk(PLAIN,0);
gameState.players[0].sz=[hm];gameState.players[0].mz=[hmMon];
gameState.players[0].deck=[mk(HERO,0),mk(BIG,0)];
let hmCtx=C(0,hm,'sz',0,'activate',{});
ok('ヒーロー・マスク positive: 表側モンスターとデッキの「E・HERO」があれば発動できる',
   sc('ヒーロー・マスク').condition(hmCtx)===true);
hmCtx.selectedTargets=[h(hmMon)];
sc('ヒーロー・マスク').resolve(hmCtx);
ok('ヒーロー・マスク card-specific: デッキの「E・HERO」が墓地へ送られる',
   gameState.players[0].grave.some(c=>c&&dbOf(c).n===HERO),
   'grave='+gameState.players[0].grave.map(c=>dbOf(c).n).join(','));
ok('ヒーロー・マスク card-specific: 対象がそのカードと同名として扱われる',
   API.nameOf(h(hmMon))===HERO,'name='+API.nameOf(h(hmMon)));
reset0();
let hm2=mk('ヒーロー・マスク',0),hm2Mon=mk(PLAIN,0);
gameState.players[0].sz=[hm2];gameState.players[0].mz=[hm2Mon];
gameState.players[0].deck=[mk(BIG,0)];
ok('ヒーロー・マスク negative: デッキに「E・HERO」がいなければ発動できない',
   sc('ヒーロー・マスク').condition(C(0,hm2,'sz',0,'activate',{}))===false);
ok('ヒーロー・マスク ruling: SETCODE で「E・HERO」を判定している',
   isSetCardV4(dbOf(mk(HERO,0)),SETCODE.ELEMENTAL_HERO)===true);

/* ============ 6. 魔術の呪文書 ============ */
reset0();
let ms=mk('魔術の呪文書',0),msBm=mk(BM,0);
gameState.players[0].sz=[ms];gameState.players[0].mz=[msBm];
let msCtx=C(0,ms,'sz',0,'activate',{});
ok('魔術の呪文書 positive: ブラック・マジシャンがいれば発動できる',
   sc('魔術の呪文書').condition(msCtx)===true);
msCtx.selectedTargets=[h(msBm)];
sc('魔術の呪文書').resolve(msCtx);
ms.face='up';
ok('魔術の呪文書 card-specific: 装備され攻撃力が700アップ',
   !!ms.equipTo&&curATK(msBm)===dbOf(msBm).atk+700,'atk='+curATK(msBm));
reset0();
let ms2=mk('魔術の呪文書',0);
gameState.players[0].grave=[ms2];
ms2.graveInfo={turn:gameState.turn,from:'sz',byDestroy:true,byPlayer:1};
let ms2Ctx=C(0,ms2,'grave',0,'activate',{});
ok('魔術の呪文書 positive: フィールドから墓地へ送られた時に発動できる',
   sc('魔術の呪文書').condition(ms2Ctx)===true);
let ms2Lp=gameState.players[0].lp;
sc('魔術の呪文書').resolve(ms2Ctx);
ok('魔術の呪文書 card-specific: 1000ライフポイント回復する',
   gameState.players[0].lp===ms2Lp+1000,'lp='+ms2Lp+'→'+gameState.players[0].lp);
reset0();
let ms3=mk('魔術の呪文書',0),ms3Other=mk(BIG,0);
gameState.players[0].sz=[ms3];gameState.players[0].mz=[ms3Other];
ok('魔術の呪文書 negative: 指定のモンスターがいなければ発動できない',
   sc('魔術の呪文書').condition(C(0,ms3,'sz',0,'activate',{}))===false);
ok('魔術の呪文書 ruling: 指定名以外には装備できない（equipSpec）',
   equipLegalV15(ms3,h(ms3Other))===false);

/* ============ 7. ブレイン・ジャッカー ============ */
reset0();
let bj=mk('ブレイン・ジャッカー',0,'down','def'),bjFoe=mk(BIG,1);
gameState.players[0].mz=[bj];gameState.players[1].mz=[bjFoe];
ensureCardUid(gameState,bj);ensureCardUid(gameState,bjFoe);
let bjCtx=ctxEv(0,bj,'onFlip',{card:bj},'mz');
ok('ブレイン・ジャッカー positive: リバース時に相手モンスターがいれば発動できる',
   sc('ブレイン・ジャッカー').passive.onFlip(bjCtx)===true);
bjCtx.selectedTargets=[h(bjFoe)];
sc('ブレイン・ジャッカー').resolve(bjCtx);
ok('ブレイン・ジャッカー card-specific: 装備カード扱いになり相手モンスターに装備される',
   gameState.players[0].sz.length===1&&!!bj.equipTo&&bj.equipTo.uid===bjFoe.uid,
   'sz='+gameState.players[0].sz.length);
ok('ブレイン・ジャッカー card-specific: 装備モンスターのコントロールを得る',
   gameState.players[0].mz.some(c=>c&&c.uid===bjFoe.uid),
   'mine='+gameState.players[0].mz.length);
gameState.activePlayer=1;gameState.phase='standby';
let bjLp=gameState.players[1].lp;
sc('ブレイン・ジャッカー').resolve(C(0,bj,'sz',0,'activate',{}));
ok('ブレイン・ジャッカー card-specific: 相手のスタンバイに相手が500回復する',
   gameState.players[1].lp===bjLp+500,'lp='+bjLp+'→'+gameState.players[1].lp);
reset0();
let bj2=mk('ブレイン・ジャッカー',0,'down','def');
gameState.players[0].mz=[bj2];gameState.players[1].mz=[];
ok('ブレイン・ジャッカー negative: 相手モンスターがいなければ発動できない',
   sc('ブレイン・ジャッカー').condition(
     ctxEv(0,bj2,'onFlip',{card:bj2},'mz'))===false);

/* ================= passive / continuous は read-only ================= */
reset0();
let roMs=mk('魔術の呪文書',0),roBm=mk(BM,0),roVl=mk('ヴァンパイア・ロード',0);
gameState.players[0].sz=[roMs];gameState.players[0].mz=[roBm,roVl];
ensureCardUid(gameState,roMs);ensureCardUid(gameState,roBm);
roMs.equipUid=roMs.equipUid||901;roMs.equipTo={p:0,uid:roBm.uid};
roBm.equippedBy=[roMs.equipUid];roMs.face='up';
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
curATK(roBm);curATK(roVl);
ok('cycle34 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= 隠匿情報 ================= */
reset0();
let hiVl=mk('ヴァンパイア・ロード',0);
gameState.players[0].mz=[hiVl];ensureCardUid(gameState,hiVl);
gameState.players[1].deck=[mk('強欲な壺',1),mk(PLAIN,1)];
gameState.players[1].hand=[mk(BIG,1),mk(BIG,1)];
sc('ヴァンパイア・ロード').resolve(
  ctxEv(0,hiVl,'onBattleDamage',{player:1,amount:2000,attackerUid:hiVl.uid},'mz'));
ok('cycle34 隠匿情報: 宣言の候補はカードの種類3つだけで相手の手札は見えない',
   pending().candidates.length===3
   &&pending().candidates.every(c=>['モンスター','魔法','罠'].indexOf(String(c.value))>=0));
API.answerChoice([pending().candidates[0].key]);

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('レスキューキャット',0);
gameState.players[0].mz=[rp1];
gameState.players[0].deck=[mk(BEAST3,0),mk(BEAST3,0)];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let rp1Ctx=C(0,rp1,'mz',0,'activate',{});
sc('レスキューキャット').cost(rp1Ctx,()=>{});
let rq1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle34 Replay: 自身を墓地へ送るコストが digest 一致で再生される',rq1.ok,rq1.reason||'');
reset0();
let rp2=mk('ヒーロー・マスク',0),rp2Mon=mk(PLAIN,0);
gameState.players[0].sz=[rp2];gameState.players[0].mz=[rp2Mon];
gameState.players[0].deck=[mk(HERO,0)];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let rp2Ctx=C(0,rp2,'sz',0,'activate',{});
rp2Ctx.selectedTargets=[h(rp2Mon)];
sc('ヒーロー・マスク').resolve(rp2Ctx);
let rq2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle34 Replay: デッキ送り＋カード名変更が digest 一致で再生される',rq2.ok,rq2.reason||'');
let snap34=JSON.stringify(gameState);
ok('cycle34 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap34))===snap34);
ok('cycle34 直列化: 予約に関数が入っていない',snap34.indexOf('function')<0);
globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
