/* Auto cycle 21 — 11枚。positive / negative / ruling edge / Replay。 */
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
function pending(){return pendingChoiceV49(gameState);}
const PLAIN='ワイト';        /* 闇 アンデット lv1 */
const BIG='青眼の白龍';       /* 光 ドラゴン lv8 */

const ALL=['昇天の角笛','方舟の選別','アーマーブレイク','オーバーウェルム',
 'ホワイト・ホーンズ・ドラゴン','バーニング・スカルヘッド','光神機－閃空',
 'XX－セイバー ガトムズ','光の護封陣','アヌビスの呪い','おくびょうかぜ'];
ALL.forEach(n=>ok('cycle21 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle21 枚数は11',ALL.length===11);
/* 召喚回数の制限や「デッキに戻せない」等は consumer が無いので実装しない */
['サモンリミッター','ヘル・ブランブル','G・B・ハンター',
 'ボーンクラッシャー']
  .forEach(n=>ok('cycle21 SKIP: '+n+' は未実装（対応する consumer が engine に無い）',!CARD_SCRIPTS[n]));
/* S03-U384: 《大熱波》 now has its consumer (the turn-ranged summon bans banSummonS03 / summonLockReasonS03, engine/1ZZS), tested in tools/test_s03_u384_summon_locks.js —
   the former SKIP assertion (no script) described the old build, not the card text; the count of assertions is unchanged. */
ok('cycle21: 大熱波 has a script with its consumer (S03-U384)',!!CARD_SCRIPTS['大熱波']&&typeof summonLockReasonS03==='function'&&typeof banSummonS03==='function');
/* S03-U267: カーム・マジック is scripted on the existing summon-ban flags (noSummonS03 / noSpecialSummon), tested in tools/test_s03_u267_ns38.js;
   its old SKIP check becomes this one (count unchanged). */
ok('cycle21: カーム・マジック has a script (S03-U267)',!!CARD_SCRIPTS['カーム・マジック']);
/* S03-U211: 《A・O・J D.D.チェッカー》 now has its consumer (specialSummonLockS03 read by v46SpecialSummonRestrictionReason) and a script,
   tested in tools/test_s03_u211_ns4.js — the former SKIP assertion (no script) described the old build, not the card text. */
ok('cycle21: A・O・J D.D.チェッカー has a script with its consumer (S03-U211)',!!CARD_SCRIPTS['A・O・J D.D.チェッカー']&&typeof CARD_SCRIPTS['A・O・J D.D.チェッカー'].specialSummonLockS03==='function'&&typeof scriptSpecialSummonLockS03==='function');
/* S03-U217: 《かつて神と呼ばれた亀》 uses the same consumer (specialSummonLockS03, ATK 1800 or more), tested in tools/test_s03_u217_ns9.js. */
ok('cycle21: かつて神と呼ばれた亀 has a script with its consumer (S03-U217)',!!CARD_SCRIPTS['かつて神と呼ばれた亀']&&typeof CARD_SCRIPTS['かつて神と呼ばれた亀'].specialSummonLockS03==='function');

/* ============ 昇天の角笛 ============ */
reset0();
let sk=mk('昇天の角笛',0,'down'),tribute=mk(PLAIN,0),summoned=mk(BIG,1);
gameState.players[0].sz=[sk];gameState.players[0].mz=[tribute];
gameState.players[1].mz=[summoned];ensureCardUid(gameState,summoned);
gameState.pendingSummon={player:1,name:BIG,kind:'normal',uid:summoned.uid};
let csk=C(0,sk,'sz',0);
ok('昇天の角笛 positive: リリースするモンスターがいれば発動できる',
   sc('昇天の角笛').condition(csk)===true,csk.reason||'');
ok('昇天の角笛 ruling: summonNegate 宣言を持つ',
   typeof sc('昇天の角笛').summonNegate.condition==='function');
sc('昇天の角笛').selectTargets(csk,t=>{csk.selectedTargets=t;});
sc('昇天の角笛').cost(csk,()=>{});
sc('昇天の角笛').resolve(csk);
ok('昇天の角笛 positive: リリースしたモンスターが墓地へ行く',
   gameState.players[0].grave.some(c=>c===tribute));
ok('昇天の角笛 positive: 召喚されたモンスターが破壊される',
   !gameState.players[1].mz.some(c=>c===summoned),'p1mz='+gameState.players[1].mz.length);
reset0();
let sk2=mk('昇天の角笛',0,'down');
gameState.players[0].sz=[sk2];
gameState.pendingSummon={player:1,name:BIG,kind:'normal'};
ok('昇天の角笛 negative: リリースするモンスターがいなければ発動できない',
   sc('昇天の角笛').condition(C(0,sk2,'sz',0))===false);

/* ============ 方舟の選別 ============ */
reset0();
let ar=mk('方舟の選別',0,'down'),sameRace=mk(BIG,0),newMon=mk(BIG,1);
gameState.players[0].sz=[ar];gameState.players[0].mz=[sameRace];
gameState.players[1].mz=[newMon];ensureCardUid(gameState,newMon);
gameState.pendingSummon={player:1,name:BIG,kind:'normal',uid:newMon.uid};
let car=C(0,ar,'sz',0);
ok('方舟の選別 positive: 同じ種族がフィールドにいれば発動できる',
   sc('方舟の選別').condition(car)===true,car.reason||'');
ok('方舟の選別 ruling: summonNegate 宣言も同じ条件を見る',
   sc('方舟の選別').summonNegate.condition(gameState.pendingSummon)===true);
sc('方舟の選別').cost(car,()=>{});
sc('方舟の選別').resolve(car);
ok('方舟の選別 positive: 1000払い、召喚されたモンスターが破壊される',
   gameState.players[0].lp===8000-1000&&!gameState.players[1].mz.some(c=>c===newMon),
   'lp='+gameState.players[0].lp);
reset0();
let ar2=mk('方舟の選別',0,'down'),otherRace=mk(PLAIN,0),newMon2=mk(BIG,1);
gameState.players[0].sz=[ar2];gameState.players[0].mz=[otherRace];
gameState.players[1].mz=[newMon2];ensureCardUid(gameState,newMon2);
gameState.pendingSummon={player:1,name:BIG,kind:'normal',uid:newMon2.uid};
ok('方舟の選別 negative: 同じ種族がいなければ発動できない',
   sc('方舟の選別').condition(C(0,ar2,'sz',0))===false);
ok('方舟の選別 negative: summonNegate 宣言も通さない',
   sc('方舟の選別').summonNegate.condition(gameState.pendingSummon)===false);

/* ============ アーマーブレイク ============ */
reset0();
let ab=mk('アーマーブレイク',0,'down'),foeEquip=mk('デーモンの斧',1);
gameState.players[0].sz=[ab];gameState.players[1].sz=[foeEquip];
ensureCardUid(gameState,foeEquip);
let cab=ctxEv(0,ab,'onActivateSuccess',
  {uid:foeEquip.uid,player:1,kind:'spell',cardId:foeEquip.id},'sz');
ok('アーマーブレイク positive: 相手の装備魔法の発動に反応する',
   sc('アーマーブレイク').passive.onActivateSuccess(cab)===true);
reset0();
let ab2=mk('アーマーブレイク',0,'down'),foeNormal=mk('強欲な壺',1);
gameState.players[0].sz=[ab2];gameState.players[1].sz=[foeNormal];
ensureCardUid(gameState,foeNormal);
ok('アーマーブレイク negative: 通常魔法の発動には反応しない',
   sc('アーマーブレイク').passive.onActivateSuccess(
     ctxEv(0,ab2,'onActivateSuccess',
       {uid:foeNormal.uid,player:1,kind:'spell',cardId:foeNormal.id},'sz'))===false);

/* ============ オーバーウェルム ============ */
reset0();
let ow=mk('オーバーウェルム',0,'down'),lv8=mk(BIG,0),foeTrap=mk('落とし穴',1);
gameState.players[0].sz=[ow];gameState.players[0].mz=[lv8];gameState.players[1].sz=[foeTrap];
ensureCardUid(gameState,foeTrap);
lv8.tributeCount=2;   /* アドバンス召喚された想定 */
let cow=ctxEv(0,ow,'onActivateSuccess',
  {uid:foeTrap.uid,player:1,kind:'trap',cardId:foeTrap.id},'sz');
ok('オーバーウェルム positive: レベル7以上のアドバンス召喚モンスターがいれば反応する',
   sc('オーバーウェルム').passive.onActivateSuccess(cow)===true);
reset0();
let ow2=mk('オーバーウェルム',0,'down'),lv8b=mk(BIG,0),foeTrap2=mk('落とし穴',1);
gameState.players[0].sz=[ow2];gameState.players[0].mz=[lv8b];gameState.players[1].sz=[foeTrap2];
ensureCardUid(gameState,foeTrap2);   /* tributeCount を立てない＝通常召喚 */
ok('オーバーウェルム negative: アドバンス召喚していなければ発動できない',
   sc('オーバーウェルム').passive.onActivateSuccess(
     ctxEv(0,ow2,'onActivateSuccess',
       {uid:foeTrap2.uid,player:1,kind:'trap',cardId:foeTrap2.id},'sz'))===false);

/* ============ ホワイト・ホーンズ・ドラゴン ============ */
reset0();
let wh=mk('ホワイト・ホーンズ・ドラゴン',0);
gameState.players[0].mz=[wh];ensureCardUid(gameState,wh);
gameState.players[1].grave=[mk('強欲な壺',1),mk('強欲な壺',1),mk(PLAIN,1)];
let cwh=ctxEv(0,wh,'onNormalSummon',{player:0,uids:[wh.uid]},'mz');
ok('ホワイト・ホーンズ・ドラゴン positive: 召喚成功で誘発する',
   sc('ホワイト・ホーンズ・ドラゴン').passive.onNormalSummon(cwh)===true);
let whAtk=dbOf(wh).atk;
sc('ホワイト・ホーンズ・ドラゴン').resolve(cwh);
let pwh=pending();
ok('ホワイト・ホーンズ・ドラゴン ruling: 対象は相手の墓地の魔法で最大5枚',
   !!pwh&&pwh.max===2,'max='+(pwh&&pwh.max));
answerChoiceV49(pwh.candidates.slice(0,2).map(x=>x.key));
ok('ホワイト・ホーンズ・ドラゴン positive: 対象が除外される',
   gameState.players[1].banish.length===2&&gameState.players[1].grave.length===1,
   'banish='+gameState.players[1].banish.length);
ok('ホワイト・ホーンズ・ドラゴン positive: 除外した数×300アップ',
   curATK(wh)===whAtk+600,'atk='+curATK(wh));
reset0();
let wh2=mk('ホワイト・ホーンズ・ドラゴン',0);
gameState.players[0].mz=[wh2];ensureCardUid(gameState,wh2);
gameState.players[1].grave=[mk(PLAIN,1)];   /* 魔法が無い */
ok('ホワイト・ホーンズ・ドラゴン negative: 相手の墓地に魔法が無ければ発動できない',
   sc('ホワイト・ホーンズ・ドラゴン').passive.onNormalSummon(
     ctxEv(0,wh2,'onNormalSummon',{player:0,uids:[wh2.uid]},'mz'))===false);

/* ============ バーニング・スカルヘッド ============ */
reset0();
let bs=mk('バーニング・スカルヘッド',0);
gameState.players[0].hand=[bs];ensureCardUid(gameState,bs);
API.specialSummon(0,'hand',0,'atk','テスト特殊召喚',0);
let bsOn=gameState.players[0].mz[0];
let cbs=ctxEv(0,bsOn,'onSpecialSummon',{player:0,uids:[bsOn.uid]},'mz');
ok('バーニング・スカルヘッド positive: 手札からの特殊召喚成功で誘発する',
   sc('バーニング・スカルヘッド').passive.onSpecialSummon(cbs)===true);
let lpB=gameState.players[1].lp;
sc('バーニング・スカルヘッド').resolve(cbs);
ok('バーニング・スカルヘッド positive: 相手ライフに1000ダメージ',
   gameState.players[1].lp===lpB-1000,'lp='+gameState.players[1].lp);
reset0();
let bs2=mk('バーニング・スカルヘッド',0),sf=mk('スカル・フレイム',0);
gameState.players[0].mz=[bs2];gameState.players[0].banish=[sf];
let cbs2=C(0,bs2,'mz',0);
ok('バーニング・スカルヘッド positive: 除外されている「スカル・フレイム」があれば起動効果を使える',
   sc('バーニング・スカルヘッド').condition(cbs2)===true,cbs2.reason||'');
sc('バーニング・スカルヘッド').selectTargets(cbs2,t=>{cbs2.selectedTargets=t;});
sc('バーニング・スカルヘッド').resolve(cbs2);
ok('バーニング・スカルヘッド positive: 自身が除外され「スカル・フレイム」が墓地に戻る',
   gameState.players[0].banish.some(c=>c===bs2)&&gameState.players[0].grave.some(c=>c===sf),
   'banish='+gameState.players[0].banish.length+' grave='+gameState.players[0].grave.length);
reset0();
let bs3=mk('バーニング・スカルヘッド',0);
gameState.players[0].mz=[bs3];gameState.players[0].banish=[];
ok('バーニング・スカルヘッド negative: 除外されている「スカル・フレイム」が無ければ起動できない',
   sc('バーニング・スカルヘッド').condition(C(0,bs3,'mz',0))===false);

/* ============ 光神機－閃空 ============ */
reset0();
let sn=mk('光神機－閃空',0);
gameState.players[0].mz=[sn];ensureCardUid(gameState,sn);
gameState.players[0].deck=[mk(PLAIN,0)];
let csn=ctxEv(0,sn,'onDirectBattleDamage',
  {player:1,amount:1000,attackerUid:sn.uid,defenderUid:null},'mz');
ok('光神機－閃空 positive: 直接攻撃の戦闘ダメージで誘発する',
   sc('光神機－閃空').passive.onDirectBattleDamage(csn)===true);
sc('光神機－閃空').resolve(csn);
ok('光神機－閃空 positive: 1枚ドローする',
   gameState.players[0].hand.length===1&&gameState.players[0].deck.length===0);
sn.summonedTurn=gameState.turn;
gameState.phase='end';
let csn2=ctxEv(0,sn,'onEndPhase',{player:0},'mz');
ok('光神機－閃空 positive: 召喚したターンのエンドフェイズに誘発する',
   sc('光神機－閃空').passive.onEndPhase(csn2)===true);
sc('光神機－閃空').resolve(csn2);
ok('光神機－閃空 positive: 墓地へ送られる',
   gameState.players[0].grave.some(c=>c===sn)&&gameState.players[0].mz.length===0);
reset0();
let sn2=mk('光神機－閃空',0);
gameState.players[0].mz=[sn2];sn2.summonedTurn=gameState.turn-1;
gameState.phase='end';
ok('光神機－閃空 negative: 召喚したターンでなければエンドフェイズに墓地へ送られない',
   sc('光神機－閃空').passive.onEndPhase(ctxEv(0,sn2,'onEndPhase',{player:0},'mz'))===false);

/* ============ XX－セイバー ガトムズ ============ */
reset0();
let gt=mk('XX－セイバー ガトムズ',0),xs=mk('X－セイバー エアベルン',0);
gameState.players[0].mz=[gt,xs];
gameState.players[1].hand=[mk(PLAIN,1),mk(BIG,1)];
let cgt=C(0,gt,'mz',0);
ok('XX－セイバー ガトムズ positive: 「X－セイバー」と相手の手札があれば発動できる',
   sc('XX－セイバー ガトムズ').condition(cgt)===true,cgt.reason||'');
let rngB=gameState.rngState;
/* ガトムズ自身も「X－セイバー」なので、リリース対象は明示的に選ぶ */
API.selectCard=(t,list,cb)=>cb(list.find(x=>x.card===xs)||list[0]);
sc('XX－セイバー ガトムズ').selectTargets(cgt,t=>{cgt.selectedTargets=t;});
API.selectCard=(t,list,cb)=>cb(list[0]);
sc('XX－セイバー ガトムズ').cost(cgt,()=>{});
sc('XX－セイバー ガトムズ').resolve(cgt);
ok('XX－セイバー ガトムズ positive: ランダム選択なので rngState が進む',
   gameState.rngState!==rngB);
ok('XX－セイバー ガトムズ positive: 「X－セイバー」をリリースし相手の手札が1枚捨てられる',
   gameState.players[0].grave.some(c=>c===xs)&&gameState.players[1].hand.length===1,
   'p1hand='+gameState.players[1].hand.length);
ok('XX－セイバー ガトムズ ruling: ガトムズ自身も「X－セイバー」なのでリリース候補に入る',
   isSetCardV4(dbOf(gt),SETCODE.X_SABER)===true);
reset0();
let gt2=mk('XX－セイバー ガトムズ',0);
gameState.players[0].mz=[gt2];
gameState.players[1].hand=[];               /* 相手の手札が無い */
ok('XX－セイバー ガトムズ negative: 相手の手札が無ければ発動できない',
   sc('XX－セイバー ガトムズ').condition(C(0,gt2,'mz',0))===false);

/* ============ 光の護封陣 ============ */
reset0();
let hb=mk('光の護封陣',0,'up'),dragonFoe=mk(BIG,1),otherFoe=mk(PLAIN,1);
gameState.players[0].sz=[hb];gameState.players[1].mz=[dragonFoe,otherFoe];
ensureCardUid(gameState,hb);
let chb=C(0,hb,'sz',0);
sc('光の護封陣').resolve(chb);
let phb=pending();
ok('光の護封陣 ruling: 種族を1つ宣言する',!!phb&&phb.min===1&&phb.max===1);
answerChoiceV49([phb.candidates.find(x=>x.key==='ドラゴン').key]);
ok('光の護封陣 positive: 宣言した種族が記録される',hb.d0HolyRace==='ドラゴン');
dragonFoe.summonedTurn=gameState.turn;
otherFoe.summonedTurn=gameState.turn;
ok('光の護封陣 positive: 宣言した種族は召喚したターンに攻撃できない',
   cannotAttackNow(dragonFoe)===true);
ok('光の護封陣 ruling: 宣言していない種族は攻撃できる',
   cannotAttackNow(otherFoe)===false);
dragonFoe.summonedTurn=gameState.turn-1;
ok('光の護封陣 ruling: 召喚したターンでなければ攻撃できる',
   cannotAttackNow(dragonFoe)===false);

/* ============ アヌビスの呪い ============ */
reset0();
let an=mk('アヌビスの呪い',0,'up'),effMon=mk('ラッコアラ',1),normMon=mk('ヂェミナイ・エルフ',1);
gameState.players[0].sz=[an];gameState.players[1].mz=[effMon,normMon];
let can=C(0,an,'sz',0);
ok('アヌビスの呪い positive: 表側の効果モンスターがいれば発動できる',
   sc('アヌビスの呪い').condition(can)===true,can.reason||'');
sc('アヌビスの呪い').resolve(can);
ok('アヌビスの呪い positive: 効果モンスターが守備表示になる',
   effMon.pos==='def','pos='+effMon.pos);
ok('アヌビスの呪い positive: 発動ターン、元々の守備力が0になる',
   curDEF(effMon)===0,'def='+curDEF(effMon));
ok('アヌビスの呪い positive: 表示形式を変更できない',
   cannotChangePositionV10(effMon)===true);
ok('アヌビスの呪い ruling: 通常モンスターは対象外',
   normMon.pos==='atk'&&cannotChangePositionV10(normMon)===false,
   'pos='+normMon.pos);
gameState.turn=gameState.turn+1;
ok('アヌビスの呪い ruling: 次のターンは守備力が戻り表示形式も変更できる',
   curDEF(effMon)===dbOf(effMon).def&&cannotChangePositionV10(effMon)===false,
   'def='+curDEF(effMon));

/* ============ おくびょうかぜ ============ */
reset0();
let ok2=mk('おくびょうかぜ',0,'up'),setST=mk('落とし穴',0,'down'),upST=mk('落とし穴',0,'up');
gameState.players[0].sz=[ok2,setST,upST];
const battleProt=(c)=>applyDestructionProtectionV21(gameState,c,
  {cause:'battle',opponentCard:null,byPlayer:null,targeting:false,sourceKind:null});
const effectProt=(c)=>applyDestructionProtectionV21(gameState,c,
  {cause:'effect',opponentCard:null,byPlayer:null,targeting:false,sourceKind:null});
ok('おくびょうかぜ negative: 発動前はセットカードに耐性が無い',!effectProt(setST));
let cok=C(0,ok2,'sz',0);
sc('おくびょうかぜ').resolve(cok);
ok('おくびょうかぜ positive: セットされた魔法・罠は破壊されない',!!effectProt(setST));
ok('おくびょうかぜ ruling: 表側表示の魔法・罠は守られない',!effectProt(upST));
gameState.turn=gameState.turn+2;
ok('おくびょうかぜ ruling: 次の相手ターンのエンドフェイズを過ぎれば切れる',!effectProt(setST));

/* ================= 読み取り専用 passive の検証 ================= */
reset0();
let ro1=mk('ホワイト・ホーンズ・ドラゴン',0),ro2=mk('光神機－閃空',0),ro3=mk('光の護封陣',0,'up');
gameState.players[0].mz=[ro1,ro2];gameState.players[0].sz=[ro3];
[ro1,ro2].forEach(c=>ensureCardUid(gameState,c));
gameState.players[1].grave=[mk('強欲な壺',1)];
gameState.players[0].deck=[mk(PLAIN,0)];
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
sc('ホワイト・ホーンズ・ドラゴン').passive.onNormalSummon(
  ctxEv(0,ro1,'onNormalSummon',{player:0,uids:[ro1.uid]},'mz'));
sc('光神機－閃空').passive.onEndPhase(ctxEv(0,ro2,'onEndPhase',{player:0},'mz'));
cannotAttackNow(ro2);
ok('cycle21 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('光の護封陣',0,'up');
gameState.players[0].sz=[rp1];ensureCardUid(gameState,rp1);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.setCardFlag(h(rp1),'d0HolyRace','ドラゴン','光の護封陣');
let ra1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle21 Replay: 宣言した種族が digest 一致で再生される',ra1.ok,ra1.reason||'');
reset0();
let rp2=mk('おくびょうかぜ',0,'up');
gameState.players[0].sz=[rp2];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.setFlag(0,'d0TimidWindUntil',gameState.turn+1,true);
let ra2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle21 Replay: 期限フラグが digest 一致で再生される',ra2.ok,ra2.reason||'');
let snap=JSON.stringify(gameState);
ok('cycle21 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('cycle21 直列化: 予約に関数が入っていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
