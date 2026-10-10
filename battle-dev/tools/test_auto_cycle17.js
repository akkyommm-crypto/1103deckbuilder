/* Auto cycle 17 — 15枚。positive / negative / ruling edge / Replay。 */
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
function battleAt(ai,ti,step){
  const a=gameState.players[0].mz[ai],d=(ti==='direct')?null:gameState.players[1].mz[ti];
  if(a)ensureCardUid(gameState,a); if(d)ensureCardUid(gameState,d);
  gameState.battle={player:0,atkIdx:ai,target:(ti==='direct')?'direct':ti,step:step||'calc',
    atkUid:a?a.uid:null,targetUid:d?d.uid:null};}
function battleKill(card,foe){
  card.battleDestroyed=true; act({type:'BATTLE_CLEANUP'});
  return {defCard:card,atkCard:foe,destroyedDef:true,destroyedAtk:false,step:'leave'};
}
function pending(){return pendingChoiceV49(gameState);}
const PLAIN='ワイト';        /* 闇 アンデット lv1 ATK300 DEF200 */
const BIG='青眼の白龍';       /* 光 ドラゴン lv8 ATK3000 DEF2500 */

const ALL=['コアラッコアラ','ガード・ヘッジ','イージーチューニング','キング・オブ・ビースト',
 'ガーディアン・オブ・オーダー','シャーク・サッカー','ウイングトータス','アンデット・スカル・デーモン',
 '六芒星の呪縛','ビッグホーン・マンモス','無力の証明','デーモン・カオス・キング',
 'アリの増殖','ジュラック・スピノス','クルーエル'];
ALL.forEach(n=>ok('cycle17 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle17 枚数は15',ALL.length===15);
const battleProt=(c)=>applyDestructionProtectionV21(gameState,c,
  {cause:'battle',opponentCard:null,byPlayer:null,targeting:false,sourceKind:null});
const effectProt=(c)=>applyDestructionProtectionV21(gameState,c,
  {cause:'effect',opponentCard:null,byPlayer:null,targeting:false,sourceKind:null});

/* ============ コアラッコアラ ============ */
reset0();
let ka=mk('コアラッコアラ',0),beastHand=mk('N・ブラック・パンサー',0),kfoe=mk(BIG,1);
gameState.players[0].mz=[ka];gameState.players[0].hand=[beastHand];gameState.players[1].mz=[kfoe];
let cka=C(0,ka,'mz',0);
ok('コアラッコアラ positive: 手札に獣族と相手モンスターがあれば発動できる',
   sc('コアラッコアラ').condition(cka)===true,cka.reason||'');
sc('コアラッコアラ').selectTargets(cka,t=>{cka.selectedTargets=t;});
sc('コアラッコアラ').resolve(cka);
ok('コアラッコアラ positive: 獣族を墓地へ送り相手モンスターを破壊する',
   gameState.players[1].mz.length===0&&gameState.players[0].hand.length===0
   &&gameState.players[0].grave.some(c=>c===beastHand),
   'p1mz='+gameState.players[1].mz.length);
reset0();
let ka2=mk('コアラッコアラ',0);
gameState.players[0].mz=[ka2];gameState.players[0].hand=[mk(BIG,0)];  /* ドラゴン族 */
gameState.players[1].mz=[mk(PLAIN,1)];
ok('コアラッコアラ negative: 手札に獣族がいなければ発動できない',
   sc('コアラッコアラ').condition(C(0,ka2,'mz',0))===false);

/* ============ ガード・ヘッジ ============ */
reset0();
let gh=mk('ガード・ヘッジ',0),myMon=mk(BIG,0),gfoe=mk(BIG,1);
gameState.players[0].hand=[gh];gameState.players[0].mz=[myMon];gameState.players[1].mz=[gfoe];
battleAt(0,0,'calc');
let cgh=ctxDS(0,gh,{atkCard:myMon,defCard:gfoe,step:'calc'},'hand','calc');
ok('ガード・ヘッジ positive: 自分のモンスターの戦闘のダメージ計算時に誘発する',
   sc('ガード・ヘッジ').passive.onDamageStep(cgh)===true);
ok('ガード・ヘッジ negative: 発動前は戦闘破壊耐性が無い',!battleProt(myMon));
ACTIVE_SCRIPT=sc('ガード・ヘッジ');
sc('ガード・ヘッジ').cost(cgh,()=>{});
sc('ガード・ヘッジ').resolve(cgh);
ACTIVE_SCRIPT=null;
ok('ガード・ヘッジ positive: そのモンスターは戦闘では破壊されない',!!battleProt(myMon));
ok('ガード・ヘッジ positive: 攻撃力が半分になる',
   curATK(myMon)===3000-1500,'atk='+curATK(myMon));
ok('ガード・ヘッジ ruling: カードの効果では守られない',!effectProt(myMon));
reset0();
let gh2=mk('ガード・ヘッジ',0),foeOnly=mk(BIG,1),foeOnly2=mk(PLAIN,1);
gameState.players[0].hand=[gh2];gameState.players[1].mz=[foeOnly,foeOnly2];
gameState.battle={player:1,atkIdx:0,target:1,step:'calc'};
ok('ガード・ヘッジ negative: 自分のモンスターが戦闘していなければ発動できない',
   sc('ガード・ヘッジ').passive.onDamageStep(
     ctxDS(0,gh2,{atkCard:foeOnly,defCard:foeOnly2,step:'calc'},'hand','calc'))===false);

/* ============ イージーチューニング ============ */
reset0();
let et=mk('イージーチューニング',0),tuner=mk('ジェネクス・コントローラー',0),boost=mk(PLAIN,0);
gameState.players[0].sz=[et];gameState.players[0].grave=[tuner];gameState.players[0].mz=[boost];
let cet=C(0,et,'sz',0);
ok('イージーチューニング positive: 墓地にチューナーと自分のモンスターがあれば発動できる',
   sc('イージーチューニング').condition(cet)===true,cet.reason||'');
sc('イージーチューニング').selectTargets(cet,t=>{cet.selectedTargets=t;});
sc('イージーチューニング').resolve(cet);
ok('イージーチューニング positive: 除外したチューナーの攻撃力分アップする',
   gameState.players[0].banish.length===1&&curATK(boost)===300+1400,
   'atk='+curATK(boost)+' banish='+gameState.players[0].banish.length);
reset0();
let et2=mk('イージーチューニング',0);
gameState.players[0].sz=[et2];gameState.players[0].grave=[mk(BIG,0)];  /* チューナーではない */
gameState.players[0].mz=[mk(PLAIN,0)];
ok('イージーチューニング negative: 墓地にチューナーがいなければ発動できない',
   sc('イージーチューニング').condition(C(0,et2,'sz',0))===false);

/* ============ キング・オブ・ビースト ============ */
reset0();
let kb=mk('キング・オブ・ビースト',0),moja=mk('モジャ',0);
gameState.players[0].hand=[kb];gameState.players[0].mz=[moja];
let ckb=C(0,kb,'hand',0);
ok('キング・オブ・ビースト positive: 表側の「モジャ」がいれば発動できる',
   sc('キング・オブ・ビースト').condition(ckb)===true,ckb.reason||'');
sc('キング・オブ・ビースト').selectTargets(ckb,t=>{ckb.selectedTargets=t;});
sc('キング・オブ・ビースト').cost(ckb,()=>{});
sc('キング・オブ・ビースト').resolve(ckb);
ok('キング・オブ・ビースト positive: 「モジャ」をリリースして特殊召喚される',
   gameState.players[0].mz.some(c=>c===kb)&&gameState.players[0].grave.some(c=>c===moja),
   'p0mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
let kb2=mk('キング・オブ・ビースト',0),moja2=mk('モジャ',0);
gameState.players[0].hand=[kb2];gameState.players[0].mz.push(moja2);
ok('キング・オブ・ビースト ruling: 表側表示で1体しか存在できない',
   sc('キング・オブ・ビースト').condition(C(0,kb2,'hand',0))===false);
reset0();
let kb3=mk('キング・オブ・ビースト',0);
gameState.players[0].hand=[kb3];gameState.players[0].mz=[mk(PLAIN,0)];
ok('キング・オブ・ビースト negative: 「モジャ」がいなければ発動できない',
   sc('キング・オブ・ビースト').condition(C(0,kb3,'hand',0))===false);

/* ============ ガーディアン・オブ・オーダー ============ */
reset0();
let go=mk('ガーディアン・オブ・オーダー',0),l1=mk(BIG,0),l2=mk(BIG,0);
gameState.players[0].hand=[go];gameState.players[0].mz=[l1,l2];
let cgo=C(0,go,'hand',0);
ok('ガーディアン・オブ・オーダー positive: 光属性が2体以上いれば発動できる',
   sc('ガーディアン・オブ・オーダー').condition(cgo)===true,cgo.reason||'');
sc('ガーディアン・オブ・オーダー').resolve(cgo);
ok('ガーディアン・オブ・オーダー positive: 手札から特殊召喚される',
   gameState.players[0].mz.some(c=>c===go));
reset0();
let go2=mk('ガーディアン・オブ・オーダー',0);
gameState.players[0].hand=[go2];gameState.players[0].mz=[mk(BIG,0)];  /* 光属性1体 */
ok('ガーディアン・オブ・オーダー negative: 光属性が1体では発動できない',
   sc('ガーディアン・オブ・オーダー').condition(C(0,go2,'hand',0))===false);

/* ============ シャーク・サッカー ============ */
reset0();
let ss=mk('シャーク・サッカー',0),fish=mk('サウザンド・アイズ・フィッシュ',0);
gameState.players[0].hand=[ss];gameState.players[0].mz=[fish];
ensureCardUid(gameState,fish);
ok('シャーク・サッカー ruling: シンクロ素材にできない宣言を持つ',
   sc('シャーク・サッカー').cannotSynchroMaterial===true);
let css=ctxEv(0,ss,'onNormalSummon',{player:0,uids:[fish.uid]},'hand');
ok('シャーク・サッカー positive: 自分の魚族が召喚された時に誘発する',
   sc('シャーク・サッカー').passive.onNormalSummon(css)===true);
sc('シャーク・サッカー').resolve(css);
ok('シャーク・サッカー positive: 手札から特殊召喚される',
   gameState.players[0].mz.some(c=>c===ss));
reset0();
let ss2=mk('シャーク・サッカー',0),nonWater=mk(BIG,0);
gameState.players[0].hand=[ss2];gameState.players[0].mz=[nonWater];
ensureCardUid(gameState,nonWater);
ok('シャーク・サッカー negative: 魚族・海竜族・水族以外の召喚では誘発しない',
   sc('シャーク・サッカー').passive.onNormalSummon(
     ctxEv(0,ss2,'onNormalSummon',{player:0,uids:[nonWater.uid]},'hand'))===false);
reset0();
let ss3=mk('シャーク・サッカー',0),foeFish=mk('サウザンド・アイズ・フィッシュ',1);
gameState.players[0].hand=[ss3];gameState.players[1].mz=[foeFish];
ensureCardUid(gameState,foeFish);
ok('シャーク・サッカー negative: 相手フィールドへの召喚では誘発しない',
   sc('シャーク・サッカー').passive.onNormalSummon(
     ctxEv(0,ss3,'onNormalSummon',{player:1,uids:[foeFish.uid]},'hand'))===false);

/* ============ ウイングトータス ============ */
reset0();
let wt=mk('ウイングトータス',0),fish2=mk('サウザンド・アイズ・フィッシュ',0);
gameState.players[0].hand=[wt];gameState.players[0].mz=[fish2];
ensureCardUid(gameState,fish2);
API.banish(h(fish2),'テスト除外');
let cwt=ctxEv(0,wt,'onRemove',{player:0,uids:[fish2.uid]},'hand');
ok('ウイングトータス positive: 自分の魚族が除外された時に誘発する',
   sc('ウイングトータス').passive.onRemove(cwt)===true);
sc('ウイングトータス').resolve(cwt);
ok('ウイングトータス positive: 手札から特殊召喚される',
   gameState.players[0].mz.some(c=>c===wt));
reset0();
let wt2=mk('ウイングトータス',0),nonWater2=mk(BIG,0);
gameState.players[0].hand=[wt2];gameState.players[0].mz=[nonWater2];
ensureCardUid(gameState,nonWater2);
API.banish(h(nonWater2),'テスト除外');
ok('ウイングトータス negative: 魚族・海竜族・水族以外の除外では誘発しない',
   sc('ウイングトータス').passive.onRemove(
     ctxEv(0,wt2,'onRemove',{player:0,uids:[nonWater2.uid]},'hand'))===false);

/* ============ アンデット・スカル・デーモン ============ */
reset0();
let asd=mk('アンデット・スカル・デーモン',0),zombie=mk(PLAIN,0),nonZombie=mk(BIG,0);
gameState.players[0].mz=[asd,zombie,nonZombie];
ok('アンデット・スカル・デーモン positive: 自分のアンデット族は効果では破壊されない',
   !!effectProt(zombie));
ok('アンデット・スカル・デーモン ruling: 戦闘では守られない',!battleProt(zombie));
ok('アンデット・スカル・デーモン ruling: アンデット族以外は守られない',!effectProt(nonZombie));
reset0();
let asd2=mk('アンデット・スカル・デーモン',0),foeZombie=mk(PLAIN,1);
gameState.players[0].mz=[asd2];gameState.players[1].mz=[foeZombie];
ok('アンデット・スカル・デーモン negative: 相手のアンデット族は守られない',!effectProt(foeZombie));

/* ============ 六芒星の呪縛 ============ */
reset0();
let hx=mk('六芒星の呪縛',0,'up'),locked=mk(BIG,1);
gameState.players[0].sz=[hx];gameState.players[1].mz=[locked];
ensureCardUid(gameState,locked);ensureCardUid(gameState,hx);
let chx=C(0,hx,'sz',0);
ok('六芒星の呪縛 positive: 相手モンスターがいれば発動できる',
   sc('六芒星の呪縛').condition(chx)===true,chx.reason||'');
sc('六芒星の呪縛').selectTargets(chx,t=>{chx.selectedTargets=t;});
sc('六芒星の呪縛').resolve(chx);
ok('六芒星の呪縛 positive: 選択したモンスターは攻撃できない',cannotAttackNow(locked)===true);
ok('六芒星の呪縛 positive: 表示形式も変更できない',cannotChangePositionV10(locked)===true);
ok('六芒星の呪縛 ruling: 選択したモンスターに生存リンクが張られる',
   !!hx.linkV9&&Array.isArray(hx.linkV9.watch)&&hx.linkV9.watch.some(w=>w.onGone==='destroy'),
   'link='+JSON.stringify(hx.linkV9||null));
API.destroy(h(locked),'テスト破壊',0);
ok('六芒星の呪縛 ruling: 選択したモンスターが破壊されるとこのカードも破壊される',
   gameState.players[0].sz.length===0,'p0sz='+gameState.players[0].sz.length);

/* ============ ビッグホーン・マンモス ============ */
reset0();
let bh=mk('ビッグホーン・マンモス',0),justSummoned=mk(BIG,1),oldMon=mk(PLAIN,1);
gameState.players[0].mz=[bh];gameState.players[1].mz=[justSummoned,oldMon];
justSummoned.summonedTurn=gameState.turn;
oldMon.summonedTurn=gameState.turn-1;
ok('ビッグホーン・マンモス positive: 召喚したターンの相手モンスターは攻撃できない',
   cannotAttackNow(justSummoned)===true);
ok('ビッグホーン・マンモス ruling: 前のターンから居るモンスターは攻撃できる',
   cannotAttackNow(oldMon)===false);
reset0();
let myJust=mk(BIG,0),bh2=mk('ビッグホーン・マンモス',0);
gameState.players[0].mz=[bh2,myJust];
myJust.summonedTurn=gameState.turn;
ok('ビッグホーン・マンモス ruling: 自分のモンスターは制限されない',
   cannotAttackNow(myJust)===false);

/* ============ 無力の証明 ============ */
reset0();
let pw=mk('無力の証明',0,'up'),big7=mk(BIG,0),low1=mk(PLAIN,1),low2=mk(PLAIN,1),high=mk(BIG,1);
gameState.players[0].sz=[pw];gameState.players[0].mz=[big7];
gameState.players[1].mz=[low1,low2,high];
let cpw=C(0,pw,'sz',0);
ok('無力の証明 positive: レベル7以上がいれば発動できる',
   sc('無力の証明').condition(cpw)===true,cpw.reason||'');
sc('無力の証明').resolve(cpw);
ok('無力の証明 positive: 相手のレベル5以下を全て破壊する',
   gameState.players[1].mz.length===1&&gameState.players[1].mz[0]===high,
   'p1mz='+gameState.players[1].mz.map(c=>dbOf(c).n).join(','));
ok('無力の証明 ruling: 発動ターン、自分のモンスターは攻撃できない',
   cannotAttackNow(big7)===true);
gameState.turn=gameState.turn+1;
ok('無力の証明 ruling: 次のターンは攻撃できる',cannotAttackNow(big7)===false);
reset0();
let pw2=mk('無力の証明',0,'up');
gameState.players[0].sz=[pw2];gameState.players[0].mz=[mk(PLAIN,0)];  /* レベル1 */
ok('無力の証明 negative: レベル7以上がいなければ発動できない',
   sc('無力の証明').condition(C(0,pw2,'sz',0))===false);

/* ============ デーモン・カオス・キング ============ */
reset0();
let dck=mk('デーモン・カオス・キング',0),swapFoe=mk(BIG,1);
gameState.players[0].mz=[dck];gameState.players[1].mz=[swapFoe];
ensureCardUid(gameState,dck);
let cdck=ctxEv(0,dck,'onAttackDeclare',{player:0,atkIdx:0,target:0,name:'デーモン・カオス・キング'},'mz');
ok('デーモン・カオス・キング positive: 自分の攻撃宣言時に誘発する',
   sc('デーモン・カオス・キング').passive.onAttackDeclare(cdck)===true);
sc('デーモン・カオス・キング').resolve(cdck);
ok('デーモン・カオス・キング positive: 相手モンスターの攻守が入れ替わる',
   curATK(swapFoe)===2500&&curDEF(swapFoe)===3000,
   'atk='+curATK(swapFoe)+' def='+curDEF(swapFoe));
reset0();
let dck2=mk('デーモン・カオス・キング',0),other=mk(BIG,0),swapFoe2=mk(BIG,1);
gameState.players[0].mz=[other,dck2];gameState.players[1].mz=[swapFoe2];
ensureCardUid(gameState,dck2);
ok('デーモン・カオス・キング negative: 他のモンスターの攻撃宣言では誘発しない',
   sc('デーモン・カオス・キング').passive.onAttackDeclare(
     ctxEv(0,dck2,'onAttackDeclare',{player:0,atkIdx:0,target:0},'mz'))===false);

/* ============ アリの増殖 ============ */
reset0();
let ap=mk('アリの増殖',0),insect=mk('電磁ミノ虫',0);
gameState.players[0].sz=[ap];gameState.players[0].mz=[insect];
let cap=C(0,ap,'sz',0);
ok('アリの増殖 positive: 自分フィールドに昆虫族がいれば発動できる',
   sc('アリの増殖').condition(cap)===true,cap.reason||'');
sc('アリの増殖').selectTargets(cap,t=>{cap.selectedTargets=t;});
sc('アリの増殖').resolve(cap);
ok('アリの増殖 positive: 昆虫族をリリースしてトークン2体を特殊召喚する',
   gameState.players[0].mz.length===2
   &&gameState.players[0].mz.every(c=>cardName(c)==='兵隊アリトークン'),
   'p0mz='+gameState.players[0].mz.map(c=>cardName(c)).join(','));
ok('アリの増殖 ruling: トークンはアドバンス召喚のためにリリースできない',
   gameState.players[0].mz.every(c=>c.cannotTribute===true));
reset0();
let ap2=mk('アリの増殖',0);
gameState.players[0].sz=[ap2];gameState.players[0].mz=[mk(BIG,0)];  /* ドラゴン族 */
ok('アリの増殖 negative: 昆虫族がいなければ発動できない',
   sc('アリの増殖').condition(C(0,ap2,'sz',0))===false);

/* ============ ジュラック・スピノス ============ */
reset0();
let jsp=mk('ジュラック・スピノス',0),jvic=mk(PLAIN,1);
gameState.players[0].mz=[jsp];gameState.players[1].mz=[jvic];
jvic.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let cjsp=ctxDS(0,jsp,{atkCard:jsp,defCard:jvic,destroyedDef:true,destroyedAtk:false,step:'after'},'mz','after');
ok('ジュラック・スピノス positive: 戦闘破壊して誘発する',
   sc('ジュラック・スピノス').passive.onDamageStep(cjsp)===true);
sc('ジュラック・スピノス').resolve(cjsp);
ok('ジュラック・スピノス positive: 相手フィールドにトークンが特殊召喚される',
   gameState.players[1].mz.length===1&&cardName(gameState.players[1].mz[0])==='スピノストークン',
   'p1mz='+gameState.players[1].mz.map(c=>cardName(c)).join(','));
ok('ジュラック・スピノス ruling: トークンは攻撃表示',
   gameState.players[1].mz[0].pos==='atk');

/* ============ クルーエル ============ */
reset0();
let cr=mk('クルーエル',0),crFoe=mk(BIG,1),crk=mk(BIG,1);
gameState.players[0].mz=[cr];gameState.players[1].mz=[crFoe,crk];
ensureCardUid(gameState,crFoe);
let bcr=battleKill(cr,crk);
let ccr=ctxDS(0,cr,bcr,'grave','leave');
ok('クルーエル positive: 戦闘破壊されて誘発する',
   sc('クルーエル').passive.onDamageStep(ccr)===true);
sc('クルーエル').selectTargets(ccr,t=>{ccr.selectedTargets=t;});
sc('クルーエル').resolve(ccr);
let pcr=pending();
ok('クルーエル ruling: 裏表を宣言する選択肢が出る',
   !!pcr&&pcr.candidates.length===2&&pcr.player===0);
ok('クルーエル ruling: 対象 uid はフラグ経由で渡される（choice の args を後から書き換えない）',
   Number(gameState.players[0].temporaryFlags.c6CruelTargetUid)===crFoe.uid);
let rngB=gameState.rngState;
let foeBefore=gameState.players[1].mz.length;
answerChoiceV49([pcr.candidates[0].key]);
ok('クルーエル positive: コイントスで rngState が進む',gameState.rngState!==rngB);
let coin=gameState.players[0].temporaryFlags.c6CruelCoin;
ok('クルーエル positive: 当たった場合だけ破壊される',
   (coin==='heads')===(gameState.players[1].mz.length===foeBefore-1),
   'coin='+coin+' p1mz='+gameState.players[1].mz.length);
reset0();
let cr2=mk('クルーエル',0),crk2=mk(BIG,1);
gameState.players[0].mz=[cr2];gameState.players[1].mz=[crk2];
let bcr2=battleKill(cr2,crk2);
gameState.players[1].mz=[];
ok('クルーエル negative: 相手モンスターがいなければ発動できない',
   sc('クルーエル').passive.onDamageStep(ctxDS(0,cr2,bcr2,'grave','leave'))===false);

/* ================= 読み取り専用 passive の検証 ================= */
reset0();
let ro1=mk('シャーク・サッカー',0),ro2=mk('ビッグホーン・マンモス',0),ro3=mk('ジュラック・スピノス',0);
gameState.players[0].hand=[ro1];gameState.players[0].mz=[ro2,ro3];
let roFoe=mk(BIG,1);gameState.players[1].mz=[roFoe];
[ro2,ro3,roFoe].forEach(c=>ensureCardUid(gameState,c));
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
sc('シャーク・サッカー').passive.onNormalSummon(ctxEv(0,ro1,'onNormalSummon',{player:0,uids:[]},'hand'));
cannotAttackNow(roFoe);
sc('ジュラック・スピノス').passive.onDamageStep(
  ctxDS(0,ro3,{atkCard:ro3,defCard:null,destroyedDef:false,step:'after'},'mz','after'));
ok('cycle17 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('六芒星の呪縛',0,'up'),rl=mk(BIG,1);
gameState.players[0].sz=[rp1];gameState.players[1].mz=[rl];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.setCardFlag(h(rl),'c6HexLocked',true,'六芒星の呪縛');
let ra1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle17 Replay: ロックフラグが digest 一致で再生される',ra1.ok,ra1.reason||'');
reset0();
let rp2=mk('クルーエル',0),rf=mk(BIG,1);
gameState.players[0].grave=[rp2];gameState.players[1].mz=[rf];
ensureCardUid(gameState,rf);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.setFlag(0,'c6CruelTargetUid',rf.uid,true);
let ra2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle17 Replay: 対象 uid のフラグが digest 一致で再生される',ra2.ok,ra2.reason||'');
let snap=JSON.stringify(gameState);
ok('cycle17 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('cycle17 直列化: 予約に関数が入っていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
