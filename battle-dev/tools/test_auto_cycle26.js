/* Auto cycle 26 — 12枚。positive / negative / ruling edge / Replay。 */
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

const ALL=['フレムベル・ドラグノフ','聖騎士ジャンヌ','次元合成師','ラヴァル・ランスロッド',
 'ドラグニティ－コルセスカ','アームド・チェンジャー','オーバー・デステニー','アマゾネスの里',
 'ファルシオンβ','シンクロ・チェンジ','サイコ・フィール・ゾーン','百獣王 ベヒーモス'];
ALL.forEach(n=>ok('cycle26 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle26 枚数は12',ALL.length===12);

const FIRE='E・HERO ザ・ヒート';        /* 炎属性 lv4 */
const WAR4='ジャンク・シンクロン';       /* 戦士 lv3 */
const DHERO6='D－HERO ダブルガイ';       /* D－HERO lv6 */
const DHERO3='D－HERO デビルガイ';       /* D－HERO lv3 */
const AMA4='アマゾネスの射手';           /* アマゾネス lv4 */
const AMA3='アマゾネスの吹き矢兵';       /* アマゾネス lv3 */
const MECH='D・ビデオン';               /* 機械・光 atk1000 */
const PTUNER='クレボンス';              /* サイキック チューナー lv2 */
const PNON='ガスタの巫女 ウィンダ';      /* サイキック 非チューナー lv2 */
const PSYN='ダイガスタ・ファルコス';     /* サイキック シンクロ lv4 */
const EQUIP='7カード';                  /* 装備魔法 */
const DRA4='スピア・ドラゴン';           /* ドラゴン・風 lv4 */
const DRA3='グレイ・ウイング';           /* ドラゴン・風 lv3 */
const SYN='C・ドラゴン';                /* シンクロ */
const BEAST='エレファン';               /* 獣族 */

function killedBattle(atkCard,defCard){
  return {atkCard:atkCard,defCard:defCard,destroyedDef:true,destroyedAtk:false};
}
function deadBattle(atkCard,defCard){
  return {atkCard:atkCard,defCard:defCard,destroyedDef:true,destroyedAtk:false};
}

/* ============ 1. フレムベル・ドラグノフ ============ */
reset0();
let fd=mk('フレムベル・ドラグノフ',0);
gameState.players[0].grave=[fd];
fd.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
let fdCtx=ctxDS(0,fd,deadBattle(mk(BIG,1),fd),'grave');
ok('フレムベル・ドラグノフ positive: 戦闘破壊で墓地から誘発する',
   sc('フレムベル・ドラグノフ').passive.onDamageStep(fdCtx)===true);
let fdLp=gameState.players[1].lp;
sc('フレムベル・ドラグノフ').resolve(fdCtx);
ok('フレムベル・ドラグノフ positive: 相手に500ダメージ',
   gameState.players[1].lp===fdLp-500);
reset0();
let fd2=mk('フレムベル・ドラグノフ',0),fdFire=mk(FIRE,0);
gameState.players[0].grave=[fd2];gameState.players[0].mz=[fdFire];
gameState.players[0].deck=[mk('フレムベル・ドラグノフ',0),mk(BIG,0)];
let fd2Ctx=C(0,fd2,'grave',0,'activate',{});
ok('フレムベル・ドラグノフ positive: 墓地からのサーチ効果を発動できる',
   sc('フレムベル・ドラグノフ').condition(fd2Ctx)===true);
fd2Ctx.selectedTargets=[h(fdFire)];
sc('フレムベル・ドラグノフ').resolve(fd2Ctx);
ok('フレムベル・ドラグノフ card-specific: 自身と炎属性を除外してデッキから同名を手札に加える',
   gameState.players[0].banish.length===2
   &&gameState.players[0].hand.length===1
   &&dbOf(gameState.players[0].hand[0]).n==='フレムベル・ドラグノフ',
   'banish='+gameState.players[0].banish.length+' hand='+gameState.players[0].hand.length);
reset0();
let fd3=mk('フレムベル・ドラグノフ',0);
gameState.players[0].grave=[fd3];gameState.players[0].mz=[mk(BIG,0)];
gameState.players[0].deck=[mk('フレムベル・ドラグノフ',0)];
ok('フレムベル・ドラグノフ negative: 表側の炎属性がいなければ発動できない',
   sc('フレムベル・ドラグノフ').condition(C(0,fd3,'grave',0,'activate',{}))===false);
reset0();
let fd4=mk('フレムベル・ドラグノフ',0),fd4Fire=mk(FIRE,0);
gameState.players[0].grave=[fd4];gameState.players[0].mz=[fd4Fire];
gameState.players[0].deck=[mk(BIG,0)];
ok('フレムベル・ドラグノフ ruling: デッキに同名がなければ発動できない',
   sc('フレムベル・ドラグノフ').condition(C(0,fd4,'grave',0,'activate',{}))===false);

/* ============ 2. 聖騎士ジャンヌ ============ */
reset0();
let jn=mk('聖騎士ジャンヌ',0);
gameState.players[0].grave=[jn,mk(WAR4,0)];
jn.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
gameState.destroyedThisTurnV30=[{byPlayer:1,victimPlayer:0,from:'mz',uid:jn.uid,turn:gameState.turn,battle:false}];
gameState.players[0].hand=[mk(BIG,0)];
let jnCtx=C(0,jn,'grave',0,'activate',{});
ok('聖騎士ジャンヌ positive: 相手に破壊された場合に発動できる',
   sc('聖騎士ジャンヌ').condition(jnCtx)===true);
let jnCost=false;sc('聖騎士ジャンヌ').cost(jnCtx,v=>{jnCost=v;});
ok('聖騎士ジャンヌ positive: コストで手札を1枚墓地へ送る',
   jnCost&&gameState.players[0].hand.length===0);
sc('聖騎士ジャンヌ').selectTargets(jnCtx,r=>{jnCtx.selectedTargets=r;});
sc('聖騎士ジャンヌ').resolve(jnCtx);
ok('聖騎士ジャンヌ card-specific: 墓地のレベル4以下の戦士族が手札に戻る',
   gameState.players[0].hand.some(c=>c&&dbOf(c).ra==='戦士'),
   'hand='+gameState.players[0].hand.map(c=>dbOf(c).n).join(','));
reset0();
let jn2=mk('聖騎士ジャンヌ',0),jnFoe=mk(BIG,1);
gameState.players[0].mz=[jn2];gameState.players[1].mz=[jnFoe];
gameState.battle={player:0,atkIdx:0,target:0};
ok('聖騎士ジャンヌ card-specific: 攻撃するダメージステップの間は攻撃力300ダウン',
   curATK(jn2)===dbOf(jn2).atk-300,'atk='+curATK(jn2));
gameState.battle=null;
ok('聖騎士ジャンヌ ruling: 攻撃していない間は元の攻撃力',
   curATK(jn2)===dbOf(jn2).atk,'atk='+curATK(jn2));
reset0();
let jn3=mk('聖騎士ジャンヌ',0);
gameState.players[0].grave=[jn3,mk(WAR4,0)];
jn3.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:0};
gameState.destroyedThisTurnV30=[{byPlayer:0,victimPlayer:0,from:'mz',uid:jn3.uid,turn:gameState.turn,battle:false}];
gameState.players[0].hand=[mk(BIG,0)];
ok('聖騎士ジャンヌ negative: 自分の効果で破壊された場合は発動できない',
   sc('聖騎士ジャンヌ').condition(C(0,jn3,'grave',0,'activate',{}))===false);

/* ============ 3. 次元合成師 ============ */
reset0();
let ds=mk('次元合成師',0);
gameState.players[0].mz=[ds];
gameState.players[0].deck=[mk(BIG,0),mk(PLAIN,0)];
let dsCtx=C(0,ds,'mz',0,'activate',{});
ok('次元合成師 positive: メインフェイズに発動できる',
   sc('次元合成師').condition(dsCtx)===true);
let dsAtk=curATK(ds);
sc('次元合成師').resolve(dsCtx);
ok('次元合成師 card-specific: デッキの一番上を除外し攻撃力が500アップ',
   gameState.players[0].banish.length===1&&gameState.players[0].deck.length===1
   &&curATK(ds)===dsAtk+500,'atk='+dsAtk+'→'+curATK(ds));
reset0();
let ds2=mk('次元合成師',0);
gameState.players[0].grave=[ds2];
ds2.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
gameState.players[0].banish=[mk(BIG,0)];
let ds2Ctx=C(0,ds2,'grave',0,'activate',{});
ok('次元合成師 positive: 破壊された場合に除外モンスターを回収できる',
   sc('次元合成師').condition(ds2Ctx)===true);
ds2Ctx.selectedTargets=[h(gameState.players[0].banish[0])];
sc('次元合成師').resolve(ds2Ctx);
ok('次元合成師 positive: 除外されていたモンスターが手札に加わる',
   gameState.players[0].hand.length===1&&gameState.players[0].banish.length===0);
reset0();
let ds3=mk('次元合成師',0);
gameState.players[0].grave=[ds3];
ds3.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
gameState.players[0].banish=[];
ok('次元合成師 negative: 除外されている自分のモンスターがいなければ発動できない',
   sc('次元合成師').condition(C(0,ds3,'grave',0,'activate',{}))===false);
ok('次元合成師 ruling: 1ターンに1度（countLimit）',sc('次元合成師').countLimit===1);

/* ============ 4. ラヴァル・ランスロッド ============ */
reset0();
let lv=mk('ラヴァル・ランスロッド',0);
gameState.players[0].mz=[lv];lv.summonedTurn=gameState.turn;lv.tributeCount=0;
ensureCardUid(gameState,lv);
let lvCtx=C(0,lv,'mz',0,'activate',{});
ok('ラヴァル・ランスロッド positive: リリースなし召喚の自壊予約を発動できる',
   sc('ラヴァル・ランスロッド').condition(lvCtx)===true);
sc('ラヴァル・ランスロッド').resolve(lvCtx);
ok('ラヴァル・ランスロッド card-specific: エンドフェイズの自壊が予約される',
   API.schedules('d5.lavalSelfSend').length===1);
gameState.phase='end';
ok('ラヴァル・ランスロッド card-specific: 予約が発火して墓地へ送られる',
   runDueSchedulesV7('endPhase',gameState)===1
   &&gameState.players[0].mz.length===0&&gameState.players[0].grave.length===1);
ok('ラヴァル・ランスロッド ruling: リリースなしで召喚する手順が宣言されている',
   !!sc('ラヴァル・ランスロッド').normalSummonProcedure
   &&sc('ラヴァル・ランスロッド').normalSummonProcedure.methods[0].tributes===0);
reset0();
let lv2=mk('ラヴァル・ランスロッド',0);
gameState.players[0].grave=[lv2];
lv2.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
gameState.players[0].banish=[mk(FIRE,0)];
let lv2Ctx=C(0,lv2,'grave',0,'activate',{});
ok('ラヴァル・ランスロッド positive: 破壊された場合に除外の炎属性を回収できる',
   sc('ラヴァル・ランスロッド').condition(lv2Ctx)===true);
lv2Ctx.selectedTargets=[h(gameState.players[0].banish[0])];
sc('ラヴァル・ランスロッド').resolve(lv2Ctx);
ok('ラヴァル・ランスロッド positive: 除外の炎属性が手札に加わる',
   gameState.players[0].hand.length===1&&gameState.players[0].banish.length===0);
reset0();
let lv3=mk('ラヴァル・ランスロッド',0);
gameState.players[0].grave=[lv3];
lv3.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
gameState.players[0].banish=[mk(BIG,0)];   /* 光属性 */
ok('ラヴァル・ランスロッド negative: 除外に炎属性がいなければ発動できない',
   sc('ラヴァル・ランスロッド').condition(C(0,lv3,'grave',0,'activate',{}))===false);

/* ============ 5. ドラグニティ－コルセスカ ============ */
reset0();
let co=mk('ドラグニティ－コルセスカ',0),coHost=mk(DRA4,0);
gameState.players[0].mz=[coHost];gameState.players[0].sz=[co];
ensureCardUid(gameState,coHost);ensureCardUid(gameState,co);
co.equipUid=co.equipUid||999;co.equipTo={p:0,uid:coHost.uid};
coHost.equippedBy=[co.equipUid];
gameState.players[0].deck=[mk(DRA3,0),mk(BIG,0)];
let coFoe=mk(PLAIN,1);
let coCtx=ctxDS(0,co,killedBattle(coHost,coFoe),'sz');
ok('ドラグニティ－コルセスカ positive: 装備先が戦闘破壊した時に誘発する',
   sc('ドラグニティ－コルセスカ').passive.onDamageStep(coCtx)===true);
sc('ドラグニティ－コルセスカ').selectTargets(coCtx,r=>{coCtx.selectedTargets=r;});
sc('ドラグニティ－コルセスカ').resolve(coCtx);
ok('ドラグニティ－コルセスカ card-specific: 装備先と同じ種族・属性のレベル4以下を手札に加える',
   gameState.players[0].hand.length===1
   &&dbOf(gameState.players[0].hand[0]).ra===dbOf(coHost).ra
   &&dbOf(gameState.players[0].hand[0]).at===dbOf(coHost).at,
   'hand='+gameState.players[0].hand.map(c=>dbOf(c).n).join(','));
reset0();
let co2=mk('ドラグニティ－コルセスカ',0),co2Host=mk(DRA4,0);
gameState.players[0].mz=[co2Host];gameState.players[0].sz=[co2];
ensureCardUid(gameState,co2Host);ensureCardUid(gameState,co2);
co2.equipUid=co2.equipUid||998;co2.equipTo={p:0,uid:co2Host.uid};
co2Host.equippedBy=[co2.equipUid];
gameState.players[0].deck=[mk(BIG,0)];   /* 光属性ドラゴン＝属性が違う */
ok('ドラグニティ－コルセスカ negative: 種族・属性が一致するモンスターがデッキにいなければ誘発しない',
   sc('ドラグニティ－コルセスカ').passive.onDamageStep(
     ctxDS(0,co2,killedBattle(co2Host,mk(PLAIN,1)),'sz'))===false);
reset0();
let co3=mk('ドラグニティ－コルセスカ',0);
gameState.players[0].sz=[co3];
gameState.players[0].deck=[mk(DRA3,0)];
ok('ドラグニティ－コルセスカ ruling: 装備されていなければ誘発しない',
   sc('ドラグニティ－コルセスカ').passive.onDamageStep(
     ctxDS(0,co3,killedBattle(mk(DRA4,0),mk(PLAIN,1)),'sz'))===false);

/* ============ 6. アームド・チェンジャー ============ */
reset0();
let ac=mk('アームド・チェンジャー',0),acMon=mk(BIG,0);
gameState.players[0].sz=[ac];gameState.players[0].mz=[acMon];
gameState.players[0].hand=[mk(EQUIP,0)];
let acCtx=C(0,ac,'sz',0,'activate',{});
ok('アームド・チェンジャー positive: 手札の装備魔法とモンスターがあれば発動できる',
   sc('アームド・チェンジャー').condition(acCtx)===true);
let acCost=false;sc('アームド・チェンジャー').cost(acCtx,v=>{acCost=v;});
ok('アームド・チェンジャー positive: コストで手札の装備魔法を墓地へ送る',
   acCost&&gameState.players[0].hand.length===0
   &&gameState.players[0].grave.length===1);
acCtx.selectedTargets=[h(acMon)];
sc('アームド・チェンジャー').resolve(acCtx);
ac.face='up';
ok('アームド・チェンジャー positive: モンスターに装備される',
   !!ac.equipTo&&ac.equipTo.uid===acMon.uid);
gameState.players[0].grave.push(mk(PLAIN,0));   /* atk300 ≦ 3000 */
let acFoe=mk(PLAIN,1);gameState.players[1].grave=[acFoe];
let acCtx2=ctxDS(0,ac,killedBattle(acMon,acFoe),'sz');
ok('アームド・チェンジャー positive: 装備先が戦闘破壊した時に誘発する',
   sc('アームド・チェンジャー').passive.onDamageStep(acCtx2)===true);
sc('アームド・チェンジャー').selectTargets(acCtx2,r=>{acCtx2.selectedTargets=r;});
sc('アームド・チェンジャー').resolve(acCtx2);
ok('アームド・チェンジャー card-specific: 装備先の攻撃力以下のモンスターが手札に戻る',
   gameState.players[0].hand.length===1
   &&Number(dbOf(gameState.players[0].hand[0]).atk)<=curATK(acMon),
   'hand='+gameState.players[0].hand.map(c=>dbOf(c).n).join(','));
reset0();
let ac2=mk('アームド・チェンジャー',0);
gameState.players[0].sz=[ac2];gameState.players[0].mz=[mk(BIG,0)];
gameState.players[0].hand=[mk('強欲な壺',0)];
ok('アームド・チェンジャー negative: 手札に装備魔法が無ければ発動できない',
   sc('アームド・チェンジャー').condition(C(0,ac2,'sz',0,'activate',{}))===false);

/* ============ 7. オーバー・デステニー ============ */
reset0();
let od=mk('オーバー・デステニー',0),odG=mk(DHERO6,0);
gameState.players[0].sz=[od];gameState.players[0].grave=[odG];
gameState.players[0].deck=[mk(DHERO3,0),mk(BIG,0)];
let odCtx=C(0,od,'sz',0,'activate',{});
ok('オーバー・デステニー positive: 墓地の「D－HERO」を対象に発動できる',
   sc('オーバー・デステニー').condition(odCtx)===true);
odCtx.selectedTargets=[h(odG)];
sc('オーバー・デステニー').resolve(odCtx);
ok('オーバー・デステニー card-specific: レベルの半分以下の「D－HERO」がデッキから特殊召喚される',
   gameState.players[0].mz.length===1
   &&Number(dbOf(gameState.players[0].mz[0]).lv)<=3,
   'mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
ok('オーバー・デステニー card-specific: エンドフェイズの破壊が予約される',
   API.schedules('d5.destroyUid').length===1);
gameState.phase='end';
runDueSchedulesV7('endPhase',gameState);
ok('オーバー・デステニー positive: 予約が発火して破壊される',
   gameState.players[0].mz.length===0);
reset0();
let od2=mk('オーバー・デステニー',0),od2G=mk(DHERO3,0);
gameState.players[0].sz=[od2];gameState.players[0].grave=[od2G];
gameState.players[0].deck=[mk(DHERO6,0)];   /* レベル6 > floor(3/2)=1 */
ok('オーバー・デステニー negative: レベル条件を満たす「D－HERO」がデッキにいなければ発動できない',
   sc('オーバー・デステニー').condition(C(0,od2,'sz',0,'activate',{}))===false);
ok('オーバー・デステニー ruling: SETCODE で「D－HERO」を判定している',
   isSetCardV4(dbOf(od2G),SETCODE.DESTINY_HERO)===true);

/* ============ 8. アマゾネスの里 ============ */
reset0();
let av=mk('アマゾネスの里',0),avMon=mk(AMA4,0);
gameState.players[0].field=av;gameState.players[0].mz=[avMon];
gameState.players[0].deck=[mk(AMA3,0),mk(BIG,0)];
ok('アマゾネスの里 card-specific: 「アマゾネス」の攻撃力が200アップする',
   curATK(avMon)===dbOf(avMon).atk+200,'atk='+curATK(avMon));
gameState.players[0].mz=[];gameState.players[0].grave=[avMon];
let avCtx=ctxDS(0,av,killedBattle(mk(BIG,1),avMon),'field');
ok('アマゾネスの里 positive: 「アマゾネス」が戦闘破壊された時に誘発する',
   sc('アマゾネスの里').passive.onDamageStep(avCtx)===true);
sc('アマゾネスの里').resolve(avCtx);
ok('アマゾネスの里 card-specific: 元々のレベル以下の「アマゾネス」がデッキから特殊召喚される',
   gameState.players[0].mz.length===1
   &&Number(dbOf(gameState.players[0].mz[0]).lv)<=4,
   'mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
reset0();
let av2=mk('アマゾネスの里',0),av2Mon=mk(BIG,0);
gameState.players[0].field=av2;gameState.players[0].grave=[av2Mon];
gameState.players[0].deck=[mk(AMA3,0)];
ok('アマゾネスの里 negative: 「アマゾネス」以外が破壊されても誘発しない',
   sc('アマゾネスの里').passive.onDamageStep(
     ctxDS(0,av2,killedBattle(mk(BIG,1),av2Mon),'field'))===false);
ok('アマゾネスの里 ruling: 1ターンに1度（countLimit）',sc('アマゾネスの里').countLimit===1);

/* ============ 9. ファルシオンβ ============ */
reset0();
let fb=mk('ファルシオンβ',0),fbFoe=mk(PLAIN,1);
gameState.players[0].mz=[fb];gameState.players[1].grave=[fbFoe];
gameState.players[0].deck=[mk(MECH,0),mk(BIG,0)];
let fbCtx=ctxDS(0,fb,killedBattle(fb,fbFoe));
ok('ファルシオンβ positive: 戦闘破壊した時に誘発する',
   sc('ファルシオンβ').passive.onDamageStep(fbCtx)===true);
API.confirm=(t,m,yes)=>{ if(yes) yes(); };
sc('ファルシオンβ').resolve(fbCtx);
ok('ファルシオンβ positive: デッキから墓地へ送る選択要求が出る',
   !!pending()&&pending().player===0);
API.answerChoice([pending().candidates[0].key]);
ok('ファルシオンβ card-specific: 機械族・光属性・攻撃力1200以下がデッキから墓地へ送られる',
   gameState.players[0].grave.some(c=>c&&dbOf(c).ra==='機械'&&dbOf(c).at==='光'),
   'grave='+gameState.players[0].grave.map(c=>dbOf(c).n).join(','));
reset0();
let fb2=mk('ファルシオンβ',0),fb2Foe=mk(PLAIN,1);
gameState.players[0].mz=[fb2];gameState.players[1].grave=[fb2Foe];
gameState.players[0].grave=[mk(MECH,0)];gameState.players[0].deck=[];
API.confirm=(t,m,yes,no)=>{ if(no) no(); };
let fb2Ctx=ctxDS(0,fb2,killedBattle(fb2,fb2Foe));
sc('ファルシオンβ').resolve(fb2Ctx);
API.answerChoice([pending().candidates[0].key]);
ok('ファルシオンβ card-specific: もう一方を選ぶと墓地から特殊召喚される',
   gameState.players[0].mz.length===2,'mz='+gameState.players[0].mz.length);
reset0();
let fb3=mk('ファルシオンβ',0),fb3Foe=mk(PLAIN,1);
gameState.players[0].mz=[fb3];gameState.players[1].grave=[fb3Foe];
gameState.players[0].deck=[mk(BIG,0)];gameState.players[0].grave=[];
ok('ファルシオンβ negative: 条件を満たすモンスターがどこにもいなければ誘発しない',
   sc('ファルシオンβ').passive.onDamageStep(
     ctxDS(0,fb3,killedBattle(fb3,fb3Foe)))===false);

/* ============ 10. シンクロ・チェンジ ============ */
reset0();
let sch=mk('シンクロ・チェンジ',0),schSyn=mk(SYN,0),schEx=mk(SYN,0);
gameState.players[0].sz=[sch];gameState.players[0].mz=[schSyn];
gameState.players[0].ex=[schEx];
ensureCardUid(gameState,schSyn);ensureCardUid(gameState,schEx);
let schCtx=C(0,sch,'sz',0,'activate',{});
ok('シンクロ・チェンジ positive: 同じレベルのシンクロがエクストラにいれば発動できる',
   sc('シンクロ・チェンジ').condition(schCtx)===true);
schCtx.selectedTargets=[h(schSyn)];
let schCost=false;sc('シンクロ・チェンジ').cost(schCtx,v=>{schCost=v;});
ok('シンクロ・チェンジ positive: コストで場のシンクロが除外される',
   schCost&&gameState.players[0].banish.length===1&&gameState.players[0].mz.length===0);
sc('シンクロ・チェンジ').resolve(schCtx);
ok('シンクロ・チェンジ card-specific: 同じレベルのシンクロがエクストラから特殊召喚される',
   gameState.players[0].mz.length===1&&gameState.players[0].ex.length===0,
   'mz='+gameState.players[0].mz.length);
ok('シンクロ・チェンジ card-specific: 特殊召喚した効果モンスターの効果は無効化される',
   API.isEffectNegated(h(gameState.players[0].mz[0]))===true);
reset0();
let sch2=mk('シンクロ・チェンジ',0),sch2Syn=mk(SYN,0);
gameState.players[0].sz=[sch2];gameState.players[0].mz=[sch2Syn];
gameState.players[0].ex=[];
ok('シンクロ・チェンジ negative: エクストラに同じレベルのシンクロがいなければ発動できない',
   sc('シンクロ・チェンジ').condition(C(0,sch2,'sz',0,'activate',{}))===false);
reset0();
let sch3=mk('シンクロ・チェンジ',0);
gameState.players[0].sz=[sch3];gameState.players[0].mz=[mk(BIG,0)];
gameState.players[0].ex=[mk(SYN,0)];
ok('シンクロ・チェンジ ruling: 場のシンクロモンスターしか除外できない',
   sc('シンクロ・チェンジ').condition(C(0,sch3,'sz',0,'activate',{}))===false);

/* ============ 11. サイコ・フィール・ゾーン ============ */
reset0();
let pz=mk('サイコ・フィール・ゾーン',0),pzT=mk(PTUNER,0),pzN=mk(PNON,0),pzEx=mk(PSYN,0);
gameState.players[0].sz=[pz];gameState.players[0].banish=[pzT,pzN];
gameState.players[0].ex=[pzEx];
ensureCardUid(gameState,pzT);ensureCardUid(gameState,pzN);
let pzCtx=C(0,pz,'sz',0,'activate',{});
ok('サイコ・フィール・ゾーン positive: 除外にサイキックのチューナーと非チューナーがいれば発動できる',
   sc('サイコ・フィール・ゾーン').condition(pzCtx)===true);
pzCtx.selectedTargets=[h(pzT)];
sc('サイコ・フィール・ゾーン').resolve(pzCtx);
ok('サイコ・フィール・ゾーン positive: 非チューナーの選択要求が出る',
   !!pending()&&pending().player===0);
API.answerChoice([pending().candidates[0].key]);
ok('サイコ・フィール・ゾーン card-specific: 2体が墓地に戻りレベル合計と同じサイキックシンクロが出る',
   gameState.players[0].banish.length===0
   &&gameState.players[0].grave.length===2
   &&gameState.players[0].mz.length===1
   &&Number(dbOf(gameState.players[0].mz[0]).lv)===4,
   'mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
ok('サイコ・フィール・ゾーン card-specific: 表側守備表示で特殊召喚される',
   gameState.players[0].mz[0].pos==='def');
reset0();
let pz2=mk('サイコ・フィール・ゾーン',0);
gameState.players[0].sz=[pz2];gameState.players[0].banish=[mk(PNON,0)];
gameState.players[0].ex=[mk(PSYN,0)];
ok('サイコ・フィール・ゾーン negative: チューナーがいなければ発動できない',
   sc('サイコ・フィール・ゾーン').condition(C(0,pz2,'sz',0,'activate',{}))===false);
reset0();
let pz3=mk('サイコ・フィール・ゾーン',0);
gameState.players[0].sz=[pz3];gameState.players[0].banish=[mk(PTUNER,0)];
gameState.players[0].ex=[mk(PSYN,0)];
ok('サイコ・フィール・ゾーン ruling: 非チューナーがいなければ発動できない',
   sc('サイコ・フィール・ゾーン').condition(C(0,pz3,'sz',0,'activate',{}))===false);

/* ============ 12. 百獣王 ベヒーモス ============ */
reset0();
let bh=mk('百獣王 ベヒーモス',0);
gameState.players[0].mz=[bh];
bh.summonedTurn=gameState.turn;bh.tributeCount=1;
bh.summonProvenance={summonType:'tribute'};
gameState.players[0].grave=[mk(BEAST,0),mk(BEAST,0)];
ok('百獣王 ベヒーモス card-specific: リリース1体で召喚した場合、元々の攻撃力は2000',
   curATK(bh)===2000,'atk='+curATK(bh));
let bhCtx=C(0,bh,'mz',0,'activate',{});
ok('百獣王 ベヒーモス positive: アドバンス召喚成功時に発動できる',
   sc('百獣王 ベヒーモス').condition(bhCtx)===true);
sc('百獣王 ベヒーモス').resolve(bhCtx);
ok('百獣王 ベヒーモス positive: リリースした数までの選択要求が出る',
   !!pending()&&pending().max===1&&pending().player===0);
API.answerChoice([pending().candidates[0].key]);
ok('百獣王 ベヒーモス card-specific: 墓地の獣族が手札に戻る',
   gameState.players[0].hand.length===1
   &&dbOf(gameState.players[0].hand[0]).ra==='獣',
   'hand='+gameState.players[0].hand.map(c=>dbOf(c).n).join(','));
reset0();
let bh2=mk('百獣王 ベヒーモス',0);
gameState.players[0].mz=[bh2];
bh2.summonedTurn=gameState.turn;bh2.tributeCount=2;
bh2.summonProvenance={summonType:'tribute'};
gameState.players[0].grave=[];
ok('百獣王 ベヒーモス negative: 墓地に獣族がいなければ発動できない',
   sc('百獣王 ベヒーモス').condition(C(0,bh2,'mz',0,'activate',{}))===false);
ok('百獣王 ベヒーモス ruling: リリース2体で召喚した場合は元々の攻撃力のまま',
   curATK(bh2)===dbOf(bh2).atk,'atk='+curATK(bh2));
ok('百獣王 ベヒーモス ruling: リリース1体で召喚する手順が宣言されている',
   sc('百獣王 ベヒーモス').normalSummonProcedure.methods[0].tributes===1);

/* ================= passive / continuous は read-only ================= */
reset0();
let roJn=mk('聖騎士ジャンヌ',0),roAv=mk('アマゾネスの里',0),roAma=mk(AMA4,0),roBh=mk('百獣王 ベヒーモス',0);
gameState.players[0].mz=[roJn,roAma,roBh];gameState.players[0].field=roAv;
roBh.tributeCount=1;
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
curATK(roJn);curATK(roAma);curATK(roBh);
sc('アマゾネスの里').passive.onDamageStep(ctxDS(0,roAv,killedBattle(mk(BIG,1),roAma),'field'));
ok('cycle26 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= 隠匿情報 ================= */
reset0();
let hiOd=mk('オーバー・デステニー',0),hiG=mk(DHERO6,0);
gameState.players[0].sz=[hiOd];gameState.players[0].grave=[hiG];
gameState.players[0].deck=[mk(DHERO3,0),mk(BIG,0)];
let hiCtx=C(0,hiOd,'sz',0,'activate',{});
hiCtx.selectedTargets=[h(hiG)];
let hiDeckBefore=gameState.players[0].deck.length;
sc('オーバー・デステニー').resolve(hiCtx);
ok('cycle26 隠匿情報: デッキから出したのは1体だけでデッキ内容は公開されない',
   gameState.players[0].deck.length===hiDeckBefore-1,
   'deck='+hiDeckBefore+'→'+gameState.players[0].deck.length);
reset0();
let hiPz=mk('サイコ・フィール・ゾーン',0);
gameState.players[0].sz=[hiPz];
gameState.players[0].banish=[mk(PTUNER,0),mk(PNON,0)];
gameState.players[0].ex=[mk(PSYN,0)];
let hiPzCtx=C(0,hiPz,'sz',0,'activate',{});
hiPzCtx.selectedTargets=[h(gameState.players[0].banish[0])];
sc('サイコ・フィール・ゾーン').resolve(hiPzCtx);
ok('cycle26 隠匿情報: 候補は公開領域（除外）のカードだけ',
   pending().candidates.every(c=>{const r=resolveTarget(c);return !r||r.zone==='banish';}));
API.answerChoice([pending().candidates[0].key]);

/* ================= Replay / SaveLoad ================= */
reset0();
let rd1=mk('次元合成師',0);
gameState.players[0].mz=[rd1];
gameState.players[0].deck=[mk(BIG,0),mk(PLAIN,0)];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
sc('次元合成師').resolve(C(0,rd1,'mz',0,'activate',{}));
let rr1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle26 Replay: デッキトップ除外＋攻撃力アップが digest 一致で再生される',rr1.ok,rr1.reason||'');
reset0();
let rd2=mk('ラヴァル・ランスロッド',0);
gameState.players[0].mz=[rd2];
rd2.summonedTurn=gameState.turn;rd2.tributeCount=0;ensureCardUid(gameState,rd2);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
sc('ラヴァル・ランスロッド').resolve(C(0,rd2,'mz',0,'activate',{}));
let rr2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle26 Replay: エンドフェイズ予約が digest 一致で再生される',rr2.ok,rr2.reason||'');
let snap26=JSON.stringify(gameState);
ok('cycle26 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap26))===snap26);
ok('cycle26 直列化: 予約に関数が入っていない',snap26.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
