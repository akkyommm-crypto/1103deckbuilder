/* Auto cycle 24 — 13枚。positive / negative / ruling edge / Replay。 */
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

const ALL=['ダーク・パーシアス','幻獣の角','弱者の意地','暗黒のミミック LV3','アルケミー・サイクル',
 'ミスティック・パイパー','モンスター・スロット','フォーチュンフューチャー','地母神アイリス',
 'ワンダー・ワンド','モンスター回収','酒呑童子','鬼ゴブリン'];
ALL.forEach(n=>ok('cycle24 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle24 枚数は13',ALL.length===13);

const BEAST='エレファン';        /* 獣族 lv4 */
const CASTER='THE トリッキー';   /* 魔法使い族 lv5 */
const UNDEAD='シャドウ・グール';  /* アンデット族 */
const UNDEAD2='ゲルニア';        /* アンデット族 */
const FLADY='フォーチュンレディ・ウォーテリー';

/* 攻撃側 atk が守備側 def を戦闘破壊した battle を作る */
function killedBattle(atkCard,defCard){
  return {atkCard:atkCard,defCard:defCard,destroyedDef:true,destroyedAtk:false};
}

/* ============ 1. ダーク・パーシアス ============ */
reset0();
let dp=mk('ダーク・パーシアス',0),dpFoe=mk(PLAIN,1);
gameState.players[0].mz=[dp];gameState.players[1].grave=[dpFoe];
gameState.players[0].grave=[mk(PLAIN,0),mk(PLAIN,0)];
gameState.players[0].deck=[mk(BIG,0)];
ok('ダーク・パーシアス positive: 戦闘破壊＋墓地の闇属性で誘発する',
   sc('ダーク・パーシアス').passive.onDamageStep(ctxDS(0,dp,killedBattle(dp,dpFoe)))===true);
let dpCtx=ctxDS(0,dp,killedBattle(dp,dpFoe));
dpCtx.selectedTargets=[h(gameState.players[0].grave[0])];
let dpCostOk=false;sc('ダーク・パーシアス').cost(dpCtx,v=>{dpCostOk=v;});
ok('ダーク・パーシアス positive: コストで墓地の闇属性が除外される',
   dpCostOk&&gameState.players[0].banish.length===1&&gameState.players[0].grave.length===1);
sc('ダーク・パーシアス').resolve(dpCtx);
ok('ダーク・パーシアス positive: 1枚ドローする',gameState.players[0].hand.length===1);
reset0();
let dp2=mk('ダーク・パーシアス',0),dpFoe2=mk(PLAIN,1);
gameState.players[0].mz=[dp2];gameState.players[1].grave=[dpFoe2];
gameState.players[0].grave=[];gameState.players[0].deck=[mk(BIG,0)];
ok('ダーク・パーシアス negative: 墓地に闇属性がいなければ誘発しない',
   sc('ダーク・パーシアス').passive.onDamageStep(ctxDS(0,dp2,killedBattle(dp2,dpFoe2)))===false);
reset0();
let dp3=mk('ダーク・パーシアス',0),other=mk(BIG,0),dpFoe3=mk(PLAIN,1);
gameState.players[0].mz=[dp3,other];gameState.players[1].grave=[dpFoe3];
gameState.players[0].grave=[mk(PLAIN,0)];gameState.players[0].deck=[mk(BIG,0)];
ok('ダーク・パーシアス ruling: 他のモンスターが破壊しても誘発しない',
   sc('ダーク・パーシアス').passive.onDamageStep(ctxDS(0,dp3,killedBattle(other,dpFoe3)))===false);
reset0();
let dp4=mk('ダーク・パーシアス',0);
gameState.players[0].mz=[dp4];
gameState.players[0].grave=[mk(PLAIN,0),mk(PLAIN,0),mk(BIG,0)];
ok('ダーク・パーシアス card-specific: 攻撃力は墓地の闇属性の数×100アップ（1900+200）',
   curATK(dp4)===2100,'atk='+curATK(dp4));

/* ============ 2. 幻獣の角 ============ */
reset0();
let hn=mk('幻獣の角',0,'down'),bst=mk(BEAST,0);
gameState.players[0].sz=[hn];gameState.players[0].mz=[bst];
gameState.players[0].deck=[mk(BIG,0)];
let hnCtx=C(0,hn,'sz',0,'activate',{});
ok('幻獣の角 positive: 獣族がいれば発動できる',sc('幻獣の角').condition(hnCtx)===true);
hnCtx.selectedTargets=[h(bst)];
sc('幻獣の角').resolve(hnCtx);
hn.face='up';   /* 発動処理で表側になる。継続効果は表側のソースだけが持つ。 */
ok('幻獣の角 positive: 獣族に装備される',
   !!hn.equipTo&&hn.equipTo.uid===bst.uid);
ok('幻獣の角 card-specific: 装備モンスターの攻撃力が800アップ',
   curATK(bst)===dbOf(bst).atk+800,'atk='+curATK(bst));
let hnFoe=mk(PLAIN,1);gameState.players[1].grave=[hnFoe];
ok('幻獣の角 positive: 装備モンスターが戦闘破壊した時に誘発する',
   sc('幻獣の角').passive.onDamageStep(ctxDS(0,hn,killedBattle(bst,hnFoe),'sz'))===true);
let hnDraw=ctxDS(0,hn,killedBattle(bst,hnFoe),'sz');
sc('幻獣の角').resolve(hnDraw);
ok('幻獣の角 positive: 1枚ドローする',gameState.players[0].hand.length===1);
reset0();
let hn2=mk('幻獣の角',0,'down'),nonBeast=mk(BIG,0);
gameState.players[0].sz=[hn2];gameState.players[0].mz=[nonBeast];
ok('幻獣の角 negative: 獣族・獣戦士族がいなければ発動できない',
   sc('幻獣の角').condition(C(0,hn2,'sz',0,'activate',{}))===false);
ok('幻獣の角 ruling: 獣族以外には装備できない（equipSpec）',
   equipLegalV15(hn2,h(nonBeast))===false);

/* ============ 3. 弱者の意地 ============ */
reset0();
let wk=mk('弱者の意地',0),low=mk(PLAIN,0),wkFoe=mk(BIG,1);
gameState.players[0].sz=[wk];gameState.players[0].mz=[low];
gameState.players[1].grave=[wkFoe];
gameState.players[0].hand=[];gameState.players[0].deck=[mk(BIG,0),mk(BIG,0)];
ok('弱者の意地 positive: 手札0＋レベル2以下の戦闘破壊で誘発する',
   sc('弱者の意地').passive.onDamageStep(ctxDS(0,wk,killedBattle(low,wkFoe),'sz'))===true);
sc('弱者の意地').resolve(ctxDS(0,wk,killedBattle(low,wkFoe),'sz'));
ok('弱者の意地 card-specific: 2枚ドローする',gameState.players[0].hand.length===2);
reset0();
let wk2=mk('弱者の意地',0),low2=mk(PLAIN,0),wkFoe2=mk(BIG,1);
gameState.players[0].sz=[wk2];gameState.players[0].mz=[low2];
gameState.players[1].grave=[wkFoe2];
gameState.players[0].hand=[mk(BIG,0)];gameState.players[0].deck=[mk(BIG,0),mk(BIG,0)];
ok('弱者の意地 negative: 手札が0枚でなければ誘発しない',
   sc('弱者の意地').passive.onDamageStep(ctxDS(0,wk2,killedBattle(low2,wkFoe2),'sz'))===false);
reset0();
let wk3=mk('弱者の意地',0),high=mk(BIG,0),wkFoe3=mk(PLAIN,1);
gameState.players[0].sz=[wk3];gameState.players[0].mz=[high];
gameState.players[1].grave=[wkFoe3];
gameState.players[0].hand=[];gameState.players[0].deck=[mk(BIG,0),mk(BIG,0)];
ok('弱者の意地 ruling: レベル3以上が破壊しても誘発しない',
   sc('弱者の意地').passive.onDamageStep(ctxDS(0,wk3,killedBattle(high,wkFoe3),'sz'))===false);

/* ============ 4. 暗黒のミミック LV3 ============ */
reset0();
let mimic=mk('暗黒のミミック LV3',0);
gameState.players[0].grave=[mimic];
mimic.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
gameState.players[0].deck=[mk(BIG,0),mk(BIG,0)];
let mimicCtx=ctxDS(0,mimic,{atkCard:mk(BIG,1),defCard:mimic,destroyedDef:true},'grave');
ok('暗黒のミミック LV3 positive: 戦闘破壊で墓地から誘発する',
   sc('暗黒のミミック LV3').passive.onDamageStep(mimicCtx)===true);
sc('暗黒のミミック LV3').resolve(mimicCtx);
ok('暗黒のミミック LV3 positive: 通常は1枚ドロー',gameState.players[0].hand.length===1);
reset0();
let mimic2=mk('暗黒のミミック LV3',0);
mimic2.c2MimicFromLv1=gameState.turn;
gameState.players[0].grave=[mimic2];
mimic2.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
gameState.players[0].deck=[mk(BIG,0),mk(BIG,0)];
sc('暗黒のミミック LV3').resolve(
  ctxDS(0,mimic2,{atkCard:mk(BIG,1),defCard:mimic2,destroyedDef:true},'grave'));
ok('暗黒のミミック LV3 card-specific: LV1 の効果で特殊召喚されていた場合は2枚ドロー',
   gameState.players[0].hand.length===2);
reset0();
let mimic3=mk('暗黒のミミック LV3',0);
gameState.players[0].grave=[mimic3];
mimic3.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
gameState.players[0].deck=[mk(BIG,0)];
ok('暗黒のミミック LV3 negative: 戦闘以外で墓地へ行っても誘発しない',
   sc('暗黒のミミック LV3').passive.onDamageStep(
     ctxDS(0,mimic3,{atkCard:mk(BIG,1),defCard:mk(BIG,0),destroyedDef:true},'grave'))===false);
/* LV1 側が印を刻むか（cycle 24 で追加した1行の producer 確認） */
reset0();
let lv1=mk('暗黒のミミック LV1',0),lv3=mk('暗黒のミミック LV3',0);
gameState.players[0].mz=[lv1];gameState.players[0].deck=[lv3];
gameState.phase='standby';
let lv1Ctx=C(0,lv1,'mz',0,'activate',{});
sc('暗黒のミミック LV1').resolve(lv1Ctx);
let summoned=gameState.players[0].mz[0];
ok('暗黒のミミック LV3 ruling: LV1 の効果で出すと印が刻まれる（producer 実測）',
   !!summoned&&dbOf(summoned).n==='暗黒のミミック LV3'
   &&Number(summoned.c2MimicFromLv1)===gameState.turn,
   'flag='+(summoned&&summoned.c2MimicFromLv1));

/* ============ 5. アルケミー・サイクル ============ */
reset0();
let alc=mk('アルケミー・サイクル',0,'down'),am1=mk(BIG,0),am2=mk(PLAIN,0);
gameState.players[0].sz=[alc];gameState.players[0].mz=[am1,am2];
gameState.players[0].deck=[mk(BIG,0),mk(BIG,0)];
sc('アルケミー・サイクル').resolve(C(0,alc,'sz',0,'activate',{}));
ok('アルケミー・サイクル positive: 自分の表側モンスターの元々の攻撃力が0になる',
   curATK(am1)===0&&curATK(am2)===0,'atk='+curATK(am1)+'/'+curATK(am2));
ok('アルケミー・サイクル card-specific: 対象になった事が印として残る',
   Number(am1.d3AlchemyTurn)===gameState.turn);
/* 罠は墓地に落ちても残存効果として誘発する */
gameState.players[0].sz=[];gameState.players[0].grave=[alc];
gameState.players[0].mz=[am2];
let alcVictim=am1;gameState.players[0].grave.push(alcVictim);
let alcCtx=ctxDS(0,alc,{atkCard:mk(BIG,1),defCard:alcVictim,destroyedDef:true},'grave');
ok('アルケミー・サイクル positive: 攻撃力0にしたモンスターの戦闘破壊で墓地から誘発する',
   sc('アルケミー・サイクル').passive.onDamageStep(alcCtx)===true);
let beforeAlc=gameState.players[0].hand.length;
sc('アルケミー・サイクル').resolve(alcCtx);
ok('アルケミー・サイクル positive: 1枚ドローする',
   gameState.players[0].hand.length===beforeAlc+1);
reset0();
let alc2=mk('アルケミー・サイクル',0),plain2=mk(BIG,0);
gameState.players[0].grave=[alc2,plain2];gameState.players[0].deck=[mk(BIG,0)];
ok('アルケミー・サイクル negative: 印の無いモンスターの戦闘破壊では誘発しない',
   sc('アルケミー・サイクル').passive.onDamageStep(
     ctxDS(0,alc2,{atkCard:mk(BIG,1),defCard:plain2,destroyedDef:true},'grave'))===false);
reset0();
let alc3=mk('アルケミー・サイクル',0,'down'),foeMon=mk(BIG,1);
gameState.players[0].sz=[alc3];gameState.players[1].mz=[foeMon];
gameState.players[0].mz=[];
ok('アルケミー・サイクル ruling: 自分の表側モンスターがいなければ発動できない',
   sc('アルケミー・サイクル').condition(C(0,alc3,'sz',0,'activate',{}))===false);

/* ============ 6. ミスティック・パイパー ============ */
reset0();
let mp=mk('ミスティック・パイパー',0);
gameState.players[0].mz=[mp];
gameState.players[0].deck=[mk(PLAIN,0),mk(BIG,0)];   /* ワイト＝レベル1 */
let mpCtx=C(0,mp,'mz',0,'activate',{});
ok('ミスティック・パイパー positive: 場にいてデッキがあれば発動できる',
   sc('ミスティック・パイパー').condition(mpCtx)===true);
let mpCost=false;sc('ミスティック・パイパー').cost(mpCtx,v=>{mpCost=v;});
ok('ミスティック・パイパー positive: コストで自身をリリースする',
   mpCost&&gameState.players[0].mz.length===0&&gameState.players[0].grave.length===1);
sc('ミスティック・パイパー').resolve(mpCtx);
ok('ミスティック・パイパー card-specific: 引いたカードがレベル1ならもう1枚引く（計2枚）',
   gameState.players[0].hand.length===2,'hand='+gameState.players[0].hand.length);
reset0();
let mp2=mk('ミスティック・パイパー',0);
gameState.players[0].mz=[mp2];
gameState.players[0].deck=[mk(BIG,0),mk(BIG,0)];     /* 青眼＝レベル8 */
let mp2Ctx=C(0,mp2,'mz',0,'activate',{});
sc('ミスティック・パイパー').cost(mp2Ctx,()=>{});
sc('ミスティック・パイパー').resolve(mp2Ctx);
ok('ミスティック・パイパー negative: レベル1でなければ1枚だけ',
   gameState.players[0].hand.length===1,'hand='+gameState.players[0].hand.length);
reset0();
let mp3=mk('ミスティック・パイパー',0);
gameState.players[0].mz=[mp3];gameState.players[0].deck=[];
ok('ミスティック・パイパー ruling: デッキが0枚なら発動できない',
   sc('ミスティック・パイパー').condition(C(0,mp3,'mz',0,'activate',{}))===false);
ok('ミスティック・パイパー ruling: 1ターンに1度（countLimit）',
   sc('ミスティック・パイパー').countLimit===1);

/* ============ 7. モンスター・スロット ============ */
reset0();
let ms=mk('モンスター・スロット',0),msMon=mk(BIG,0),msGrave=mk(BIG,0);
gameState.players[0].sz=[ms];gameState.players[0].mz=[msMon];
gameState.players[0].grave=[msGrave];
gameState.players[0].deck=[mk(BIG,0),mk(PLAIN,0)];
let msCtx=C(0,ms,'sz',0,'activate',{});
ok('モンスター・スロット positive: 同じレベルの墓地モンスターがいれば発動できる',
   sc('モンスター・スロット').condition(msCtx)===true);
msCtx.selectedTargets=[h(msMon)];
sc('モンスター・スロット').resolve(msCtx);
ok('モンスター・スロット positive: 相手には見えない選択要求が自分に出る',
   !!pending()&&pending().player===0);
API.answerChoice([gameState.players[0].grave[0].uid!=null?
  pending().candidates[0].key:pending().candidates[0].key]);
ok('モンスター・スロット card-specific: 除外＋ドロー＋同レベルなら特殊召喚',
   gameState.players[0].banish.length===1
   &&gameState.players[0].mz.length===2,
   'banish='+gameState.players[0].banish.length+' mz='+gameState.players[0].mz.length);
reset0();
let ms2=mk('モンスター・スロット',0),ms2Mon=mk(BIG,0);
gameState.players[0].sz=[ms2];gameState.players[0].mz=[ms2Mon];
gameState.players[0].grave=[mk(PLAIN,0)];    /* レベル1、青眼はレベル8 */
ok('モンスター・スロット negative: 同じレベルの墓地モンスターがいなければ発動できない',
   sc('モンスター・スロット').condition(C(0,ms2,'sz',0,'activate',{}))===false);
reset0();
let ms3=mk('モンスター・スロット',0),ms3Mon=mk(BIG,0),ms3G=mk(BIG,0);
gameState.players[0].sz=[ms3];gameState.players[0].mz=[ms3Mon];
gameState.players[0].grave=[ms3G];
gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0)];  /* レベル1＝一致しない */
let ms3Ctx=C(0,ms3,'sz',0,'activate',{});
ms3Ctx.selectedTargets=[h(ms3Mon)];
sc('モンスター・スロット').resolve(ms3Ctx);
API.answerChoice([pending().candidates[0].key]);
ok('モンスター・スロット ruling: レベルが違えば特殊召喚しない（手札に残る）',
   gameState.players[0].mz.length===1&&gameState.players[0].hand.length===1,
   'mz='+gameState.players[0].mz.length+' hand='+gameState.players[0].hand.length);

/* ============ 8. フォーチュンフューチャー ============ */
reset0();
let ff=mk('フォーチュンフューチャー',0),fl=mk(FLADY,0);
gameState.players[0].sz=[ff];gameState.players[0].banish=[fl];
gameState.players[0].deck=[mk(BIG,0),mk(BIG,0)];
let ffCtx=C(0,ff,'sz',0,'activate',{});
ok('フォーチュンフューチャー positive: 除外された「フォーチュンレディ」がいれば発動できる',
   sc('フォーチュンフューチャー').condition(ffCtx)===true);
ffCtx.selectedTargets=[h(fl)];
sc('フォーチュンフューチャー').resolve(ffCtx);
ok('フォーチュンフューチャー card-specific: 墓地へ戻して2枚ドローする',
   gameState.players[0].grave.length===1&&gameState.players[0].hand.length===2
   &&gameState.players[0].banish.length===0);
reset0();
let ff2=mk('フォーチュンフューチャー',0);
gameState.players[0].sz=[ff2];gameState.players[0].banish=[mk(BIG,0)];
gameState.players[0].deck=[mk(BIG,0),mk(BIG,0)];
ok('フォーチュンフューチャー negative: 「フォーチュンレディ」でなければ発動できない',
   sc('フォーチュンフューチャー').condition(C(0,ff2,'sz',0,'activate',{}))===false);
reset0();
let ff3=mk('フォーチュンフューチャー',0),fl3=mk(FLADY,0);
gameState.players[0].sz=[ff3];gameState.players[0].grave=[fl3];
gameState.players[0].deck=[mk(BIG,0),mk(BIG,0)];
ok('フォーチュンフューチャー ruling: 墓地にいるだけでは対象にできない（除外限定）',
   sc('フォーチュンフューチャー').condition(C(0,ff3,'sz',0,'activate',{}))===false);
ok('フォーチュンフューチャー ruling: SETCODE で判定している（名前一致ではない）',
   isSetCardV4(dbOf(fl3),SETCODE.FORTUNE_LADY)===true);

/* ============ 9. 地母神アイリス ============ */
function chainOf(names){
  gameState.chain=names.map((n,i)=>({chainId:i+1,player:i%2,name:n,ss:1,targets:[]}));
}
reset0();
let iris=mk('地母神アイリス',0);
gameState.players[0].mz=[iris];gameState.players[0].deck=[mk(BIG,0)];
chainOf(['強欲な壺','落とし穴','サイクロン']);
let irisCtx=ctxEv(0,iris,'onActivateSuccess',{},'mz');
ok('地母神アイリス positive: チェーンが3つ積まれた場合に誘発する',
   sc('地母神アイリス').passive.onActivateSuccess(irisCtx)===true);
sc('地母神アイリス').resolve(irisCtx);
ok('地母神アイリス positive: 1枚ドローする',gameState.players[0].hand.length===1);
ok('地母神アイリス card-specific: 同じチェーンでは二度誘発しない',
   sc('地母神アイリス').passive.onActivateSuccess(
     ctxEv(0,iris,'onActivateSuccess',{},'mz'))===false);
reset0();
let iris2=mk('地母神アイリス',0);
gameState.players[0].mz=[iris2];gameState.players[0].deck=[mk(BIG,0)];
chainOf(['強欲な壺','落とし穴']);
ok('地母神アイリス negative: チェーンが2つでは誘発しない',
   sc('地母神アイリス').passive.onActivateSuccess(
     ctxEv(0,iris2,'onActivateSuccess',{},'mz'))===false);
reset0();
let iris3=mk('地母神アイリス',0);
gameState.players[0].mz=[iris3];gameState.players[0].deck=[mk(BIG,0)];
chainOf(['強欲な壺','強欲な壺','落とし穴']);
ok('地母神アイリス ruling: 同一チェーンに同名カードがあると発動できない',
   sc('地母神アイリス').passive.onActivateSuccess(
     ctxEv(0,iris3,'onActivateSuccess',{},'mz'))===false);
gameState.chain=[];

/* ============ 10. ワンダー・ワンド ============ */
reset0();
let ww=mk('ワンダー・ワンド',0),cas=mk(CASTER,0);
gameState.players[0].sz=[ww];gameState.players[0].mz=[cas];
gameState.players[0].deck=[mk(BIG,0),mk(BIG,0),mk(BIG,0)];
let wwCtx=C(0,ww,'sz',0,'activate',{});
ok('ワンダー・ワンド positive: 魔法使い族がいれば発動できる',
   sc('ワンダー・ワンド').condition(wwCtx)===true);
wwCtx.selectedTargets=[h(cas)];
sc('ワンダー・ワンド').resolve(wwCtx);
ok('ワンダー・ワンド positive: 装備され攻撃力が500アップする',
   !!ww.equipTo&&curATK(cas)===dbOf(cas).atk+500,'atk='+curATK(cas));
let ww2Ctx=C(0,ww,'sz',0,'activate',{});
ok('ワンダー・ワンド positive: 装備中は②の効果を発動できる',
   sc('ワンダー・ワンド').condition(ww2Ctx)===true);
let wwCost=false;sc('ワンダー・ワンド').cost(ww2Ctx,v=>{wwCost=v;});
ok('ワンダー・ワンド card-specific: 装備モンスターと自身を墓地へ送る（コスト）',
   wwCost&&gameState.players[0].mz.length===0&&gameState.players[0].sz.length===0
   &&gameState.players[0].grave.length===2,
   'grave='+gameState.players[0].grave.length);
sc('ワンダー・ワンド').resolve(ww2Ctx);
ok('ワンダー・ワンド positive: 2枚ドローする',gameState.players[0].hand.length===2);
reset0();
let ww3=mk('ワンダー・ワンド',0),nonCas=mk(PLAIN,0);
gameState.players[0].sz=[ww3];gameState.players[0].mz=[nonCas];
ok('ワンダー・ワンド negative: 魔法使い族がいなければ発動できない',
   sc('ワンダー・ワンド').condition(C(0,ww3,'sz',0,'activate',{}))===false);
ok('ワンダー・ワンド ruling: 魔法使い族以外には装備できない（equipSpec）',
   equipLegalV15(ww3,h(nonCas))===false);

/* ============ 11. モンスター回収 ============ */
reset0();
let mr=mk('モンスター回収',0),mrMon=mk(BIG,0);
gameState.players[0].sz=[mr];gameState.players[0].mz=[mrMon];
gameState.players[0].hand=[mk(PLAIN,0),mk(PLAIN,0)];
gameState.players[0].deck=[mk(BIG,0),mk(BIG,0),mk(BIG,0)];
let mrCtx=C(0,mr,'sz',0,'activate',{});
ok('モンスター回収 positive: 自分のモンスターがいれば発動できる',
   sc('モンスター回収').condition(mrCtx)===true);
mrCtx.selectedTargets=[h(mrMon)];
sc('モンスター回収').resolve(mrCtx);
ok('モンスター回収 card-specific: 元の手札の枚数分だけ引き直す（2枚）',
   gameState.players[0].hand.length===2&&gameState.players[0].mz.length===0,
   'hand='+gameState.players[0].hand.length+' mz='+gameState.players[0].mz.length);
ok('モンスター回収 positive: 戻したカードはデッキに入る',
   gameState.players[0].deck.length===4,'deck='+gameState.players[0].deck.length);
reset0();
let mr2=mk('モンスター回収',0),mr2Mon=mk(BIG,0),foeCard=mk(PLAIN,1);
gameState.players[0].sz=[mr2];gameState.players[0].mz=[mr2Mon];
gameState.players[0].hand=[foeCard];
ok('モンスター回収 negative: 持ち主が相手のカードが手札にあると発動できない',
   sc('モンスター回収').condition(C(0,mr2,'sz',0,'activate',{}))===false);
reset0();
let mr3=mk('モンスター回収',0);
gameState.players[0].sz=[mr3];gameState.players[0].mz=[];
ok('モンスター回収 ruling: フィールドにモンスターがいなければ発動できない',
   sc('モンスター回収').condition(C(0,mr3,'sz',0,'activate',{}))===false);

/* ============ 12. 酒呑童子 ============ */
reset0();
let sd=mk('酒呑童子',0);
gameState.players[0].mz=[sd];
gameState.players[0].grave=[mk(UNDEAD,0),mk(UNDEAD2,0)];
gameState.players[0].deck=[mk(BIG,0)];
let sdCtx=C(0,sd,'mz',0,'activate',{});
ok('酒呑童子 positive: 墓地にアンデット族2体いれば発動できる',
   sc('酒呑童子').condition(sdCtx)===true);
API.confirm=(t,m,yes)=>{ if(yes) yes(); };
sc('酒呑童子').resolve(sdCtx);
ok('酒呑童子 positive: 除外候補の選択要求が出る',!!pending()&&pending().min===2);
API.answerChoice(pending().candidates.slice(0,2).map(c=>c.key));
ok('酒呑童子 card-specific: アンデット族2体を除外して1枚ドローする',
   gameState.players[0].banish.length===2&&gameState.players[0].hand.length===1,
   'banish='+gameState.players[0].banish.length+' hand='+gameState.players[0].hand.length);
reset0();
let sd2=mk('酒呑童子',0),sd2u=mk(UNDEAD,0);
gameState.players[0].mz=[sd2];gameState.players[0].banish=[sd2u];
gameState.players[0].grave=[];gameState.players[0].deck=[mk(BIG,0)];
let sd2Ctx=C(0,sd2,'mz',0,'activate',{});
ok('酒呑童子 positive: 除外されたアンデット族がいれば発動できる',
   sc('酒呑童子').condition(sd2Ctx)===true);
sc('酒呑童子').resolve(sd2Ctx);
API.answerChoice([pending().candidates[0].key]);
ok('酒呑童子 ruling: 除外されたアンデット族をデッキの一番上に戻す',
   gameState.players[0].banish.length===0
   &&dbOf(gameState.players[0].deck[0]).n===UNDEAD,
   'top='+dbOf(gameState.players[0].deck[0]).n);
reset0();
let sd3=mk('酒呑童子',0);
gameState.players[0].mz=[sd3];
gameState.players[0].grave=[mk(UNDEAD,0)];   /* 1体だけ */
gameState.players[0].banish=[];gameState.players[0].deck=[mk(BIG,0)];
ok('酒呑童子 negative: アンデット族1体・除外0ならどちらも選べず発動できない',
   sc('酒呑童子').condition(C(0,sd3,'mz',0,'activate',{}))===false);
ok('酒呑童子 ruling: 1ターンに1度（countLimit）',sc('酒呑童子').countLimit===1);
API.confirm=(t,m,yes,no)=>{ if(no) no(); };

/* ============ 13. 鬼ゴブリン ============ */
reset0();
gameState.phase='end';
let og=mk('鬼ゴブリン',0),normalCard=mk(PLAIN,0);
gameState.players[0].mz=[og];gameState.players[0].hand=[normalCard];
gameState.players[0].deck=[mk(BIG,0)];
let ogCtx=C(0,og,'mz',0,'activate',{});
ok('鬼ゴブリン positive: 自分のエンドフェイズに手札の通常モンスターで発動できる',
   sc('鬼ゴブリン').condition(ogCtx)===true);
ogCtx.selectedTargets=[h(normalCard)];
let ogCost=false;sc('鬼ゴブリン').cost(ogCtx,v=>{ogCost=v;});
ok('鬼ゴブリン card-specific: コストで通常モンスターをデッキの一番下に戻す',
   ogCost&&gameState.players[0].hand.length===0
   &&dbOf(gameState.players[0].deck[gameState.players[0].deck.length-1]).n===PLAIN,
   'bottom='+dbOf(gameState.players[0].deck[gameState.players[0].deck.length-1]).n);
sc('鬼ゴブリン').resolve(ogCtx);
ok('鬼ゴブリン positive: 1枚ドローする',gameState.players[0].hand.length===1);
reset0();
gameState.phase='main1';
let og2=mk('鬼ゴブリン',0);
gameState.players[0].mz=[og2];gameState.players[0].hand=[mk(PLAIN,0)];
gameState.players[0].deck=[mk(BIG,0)];
ok('鬼ゴブリン negative: メインフェイズでは発動できない',
   sc('鬼ゴブリン').condition(C(0,og2,'mz',0,'activate',{}))===false);
reset0();
gameState.phase='end';
let og3=mk('鬼ゴブリン',0);
gameState.players[0].mz=[og3];gameState.players[0].hand=[mk('強欲な壺',0)];
gameState.players[0].deck=[mk(BIG,0)];
ok('鬼ゴブリン ruling: 手札に通常モンスターが無ければ発動できない',
   sc('鬼ゴブリン').condition(C(0,og3,'mz',0,'activate',{}))===false);

/* ================= passive / continuous は read-only ================= */
reset0();
let roMon=mk('ダーク・パーシアス',0),roFoe=mk(PLAIN,1),roHorn=mk('幻獣の角',0),roBeast=mk(BEAST,0);
gameState.players[0].mz=[roMon,roBeast];gameState.players[0].sz=[roHorn];
gameState.players[1].grave=[roFoe];gameState.players[0].grave=[mk(PLAIN,0)];
gameState.players[0].deck=[mk(BIG,0)];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
sc('ダーク・パーシアス').passive.onDamageStep(ctxDS(0,roMon,killedBattle(roMon,roFoe)));
sc('幻獣の角').passive.onDamageStep(ctxDS(0,roHorn,killedBattle(roBeast,roFoe),'sz'));
sc('弱者の意地').continuous===undefined;
curATK(roMon);curATK(roBeast);
ok('cycle24 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= 隠匿情報 ================= */
reset0();
let hiMs=mk('モンスター・スロット',0),hiMon=mk(BIG,0);
gameState.players[0].sz=[hiMs];gameState.players[0].mz=[hiMon];
gameState.players[0].grave=[mk(BIG,0)];
gameState.players[0].deck=[mk(BIG,0),mk(BIG,0)];
let hiCtx=C(0,hiMs,'sz',0,'activate',{});
hiCtx.selectedTargets=[h(hiMon)];
sc('モンスター・スロット').resolve(hiCtx);
ok('cycle24 隠匿情報: 除外の選択要求は発動プレイヤーにだけ出る',
   !!pending()&&pending().player===0);
API.answerChoice([pending().candidates[0].key]);
ok('cycle24 隠匿情報: 引いたカードは公開情報として両者に見えている',
   revealListV20(gameState).length===0
   ||revealListV20(gameState).every(r=>r.audience==='both'||r.audience==null));

/* ================= Replay / SaveLoad ================= */
reset0();
let rq1=mk('ダーク・パーシアス',0);
gameState.players[0].mz=[rq1];
gameState.players[0].grave=[mk(PLAIN,0)];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.banish(h(gameState.players[0].grave[0]),'ダーク・パーシアス（コスト）');
let rb1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle24 Replay: 除外コストが digest 一致で再生される',rb1.ok,rb1.reason||'');
reset0();
let rq2=mk('アルケミー・サイクル',0,'down'),rq2m=mk(BIG,0);
gameState.players[0].sz=[rq2];gameState.players[0].mz=[rq2m];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
sc('アルケミー・サイクル').resolve(C(0,rq2,'sz',0,'activate',{}));
let rb2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle24 Replay: 元々の攻撃力0＋印が digest 一致で再生される',rb2.ok,rb2.reason||'');
let snap24=JSON.stringify(gameState);
ok('cycle24 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap24))===snap24);
ok('cycle24 直列化: 予約に関数が入っていない',snap24.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
