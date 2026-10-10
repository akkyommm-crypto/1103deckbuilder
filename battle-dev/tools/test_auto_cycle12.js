/* Auto cycle 12 — 24枚。positive / negative / ruling edge / Replay。 */
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
function pending(){return pendingChoiceV49(gameState);}
/* このカードが「戦闘破壊されて墓地にいる」状態を engine の正規経路で作る */
function battleKill(card,foe,p){
  card.battleDestroyed=true; act({type:'BATTLE_CLEANUP'});
  return {defCard:card,atkCard:foe,destroyedDef:true,destroyedAtk:false,step:'leave'};
}
const PLAIN='ワイト';        /* 闇 アンデット lv1 ATK300 DEF200 */
const BIG='青眼の白龍';       /* 光 ドラゴン lv8 ATK3000 DEF2500 */
const PLANT='ロードポイズン';  /* 水 植物 lv4 */

const ALL=['ロードポイズン','機械犬マロン','雲魔物－ポイズン・クラウド','ネオフレムベル・ヘッジホッグ',
 'ワイトキング','ホワイトポータン','森の狩人イエロー・バブーン','カース・オブ・ヴァンパイア',
 'インフェルニティ・リベンジャー','ジュラック・ガリム','漆黒の魔王 LV4','ミスティック・ソードマン LV2',
 'レスキュー・ウォリアー','オーシャンズ・オーパー','エレメント・デビル','ドミノ','リグレット・リボーン',
 '自由解放','復活の墓穴','ゼンマイジャグラー','ゴブリン陽動部隊','ナチュル・ストロベリー',
 'X－セイバー ウルベルム','ドラゴン・アイス'];
ALL.forEach(n=>ok('cycle12 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle12 枚数は24',ALL.length===24);
/* 5点プリフライトで落としたカードは実装しない（半実装禁止） */
/* S03-U266: the premise is gone — noAdvanceTributeS03 accepts a function (face-up only); TESTED in tools/test_s03_u266_unlocks2.js */
ok('cycle12 SKIP lifted (S03-U266): きつね火 declares a face-up-only Tribute ban',
   !!CARD_SCRIPTS['きつね火'] && typeof CARD_SCRIPTS['きつね火'].noAdvanceTributeS03==='function');
/* S03-U251: the premise (no consumer for control-change immunity) is gone — engine controlLockS03; the card is TESTED in tools/test_s03_u251_lv.js */
ok('cycle12 SKIP lifted (S03-U251): ホルスの黒炎竜 LV4 uses the control-change lock',
   !!CARD_SCRIPTS['ホルスの黒炎竜 LV4'] && typeof CARD_SCRIPTS['ホルスの黒炎竜 LV4'].controlLockS03==='function');
/* S03-U264: the premise (no consumer for control-change immunity) is gone — controlLockS03 (S03-U251); TESTED in tools/test_s03_u264_hooks.js */
ok('cycle12 SKIP lifted (S03-U264): エレメント・ソルジャー uses the control-change lock',
   !!CARD_SCRIPTS['エレメント・ソルジャー'] && typeof CARD_SCRIPTS['エレメント・ソルジャー'].controlLockS03==='function');
ok('cycle12 SKIP: 与奪の首飾りは未実装（装備先の provenance が墓地に残らない）',
   !CARD_SCRIPTS['与奪の首飾り']);

/* ============ 1. ロードポイズン ============ */
reset0();
let lp1=mk('ロードポイズン',0),lk1=mk(BIG,1);
gameState.players[0].mz=[lp1];gameState.players[1].mz=[lk1];
gameState.players[0].grave=[mk('ホワイトポータン',0),mk('ツクシー',0)];
let blp=battleKill(lp1,lk1,0);
let clp=ctxDS(0,lp1,blp,'grave','leave');
ok('ロードポイズン positive: 墓地に他の植物族がいれば誘発する',
   sc('ロードポイズン').passive.onDamageStep(clp)===true);
sc('ロードポイズン').selectTargets(clp,t=>{clp.selectedTargets=t;});
sc('ロードポイズン').resolve(clp);
ok('ロードポイズン positive: 墓地の植物族が特殊召喚される',
   gameState.players[0].mz.length===1&&dbOf(gameState.players[0].mz[0]).ra==='植物',
   'mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
ok('ロードポイズン ruling: 自身は蘇生対象に選べない（「ロードポイズン」以外）',
   dbOf(gameState.players[0].mz[0]).n!=='ロードポイズン');
reset0();
let lp2=mk('ロードポイズン',0),lk2=mk(BIG,1);
gameState.players[0].mz=[lp2];gameState.players[1].mz=[lk2];
gameState.players[0].grave=[mk(BIG,0)];   /* ドラゴン族しかいない */
let blp2=battleKill(lp2,lk2,0);
ok('ロードポイズン negative: 墓地に植物族がいなければ発動できない',
   sc('ロードポイズン').passive.onDamageStep(ctxDS(0,lp2,blp2,'grave','leave'))===false);

/* ============ 2. 機械犬マロン ============ */
reset0();
let mr1=mk('機械犬マロン',0),mk1=mk(BIG,1);
gameState.players[0].mz=[mr1];gameState.players[1].mz=[mk1];
let bmr=battleKill(mr1,mk1,0);
let cmr=ctxDS(0,mr1,bmr,'grave','leave');
ok('機械犬マロン positive: 戦闘破壊で誘発する',sc('機械犬マロン').passive.onDamageStep(cmr)===true);
let lpA=gameState.players[0].lp,lpB=gameState.players[1].lp;
sc('機械犬マロン').resolve(cmr);
ok('機械犬マロン positive: 戦闘破壊ならお互いに1000ダメージ',
   gameState.players[0].lp===lpA-1000&&gameState.players[1].lp===lpB-1000,
   'p0='+gameState.players[0].lp+' p1='+gameState.players[1].lp);
reset0();
let mr2=mk('機械犬マロン',0);
gameState.players[0].mz=[mr2];
API.destroy(h(mr2),'テスト効果破壊',1);
let cmr2=ctxEv(0,mr2,'onDestroy',{},'grave');
ok('機械犬マロン positive: 効果破壊でも誘発する（v30 destroy log で戦闘と区別）',
   sc('機械犬マロン').passive.onDestroy(cmr2)===true);
let lpA2=gameState.players[0].lp,lpB2=gameState.players[1].lp;
sc('機械犬マロン').resolve(cmr2);
ok('機械犬マロン ruling: 効果破壊なら相手だけが1000ダメージを受ける',
   gameState.players[0].lp===lpA2&&gameState.players[1].lp===lpB2-1000,
   'p0='+gameState.players[0].lp+' p1='+gameState.players[1].lp);

/* ============ 3. 雲魔物－ポイズン・クラウド ============ */
reset0();
let pc1=mk('雲魔物－ポイズン・クラウド',0),pk1=mk(BIG,1);
gameState.players[0].mz=[pc1];gameState.players[1].mz=[pk1];
let bpc=battleKill(pc1,pk1,0);
let cpc=ctxDS(0,pc1,bpc,'grave','leave');
ok('雲魔物－ポイズン・クラウド positive: 表側で戦闘破壊されて誘発する',
   sc('雲魔物－ポイズン・クラウド').passive.onDamageStep(cpc)===true);
let lpC=gameState.players[1].lp;
sc('雲魔物－ポイズン・クラウド').resolve(cpc);
ok('雲魔物－ポイズン・クラウド positive: 破壊したモンスターを破壊する',
   gameState.players[1].mz.length===0);
ok('雲魔物－ポイズン・クラウド positive: 相手に800ダメージ',
   gameState.players[1].lp===lpC-800,'lp='+gameState.players[1].lp);
reset0();
let pc2=mk('雲魔物－ポイズン・クラウド',0,'down','def'),pk2=mk(BIG,1);
gameState.players[0].mz=[pc2];gameState.players[1].mz=[pk2];
let bpc2=battleKill(pc2,pk2,0);
ok('雲魔物－ポイズン・クラウド negative: 裏側表示で破壊された場合は発動しない',
   sc('雲魔物－ポイズン・クラウド').passive.onDamageStep(ctxDS(0,pc2,bpc2,'grave','leave'))===false);

/* ============ 4. ネオフレムベル・ヘッジホッグ ============ */
reset0();
let nh1=mk('ネオフレムベル・ヘッジホッグ',0),nk1=mk(BIG,1);
gameState.players[0].mz=[nh1];gameState.players[1].mz=[nk1];
gameState.players[1].grave=[mk(PLAIN,1),mk(BIG,1)];
let bnh=battleKill(nh1,nk1,0);
let cnh=ctxDS(0,nh1,bnh,'grave','leave');
ok('ネオフレムベル・ヘッジホッグ positive: 戦闘破壊なら相手の墓地を除外する側が誘発',
   sc('ネオフレムベル・ヘッジホッグ').passive.onDamageStep(cnh)===true);
sc('ネオフレムベル・ヘッジホッグ').selectTargets(cnh,t=>{cnh.selectedTargets=t;});
sc('ネオフレムベル・ヘッジホッグ').resolve(cnh);
ok('ネオフレムベル・ヘッジホッグ positive: 相手の墓地のカードが除外される',
   gameState.players[1].banish.length===1&&gameState.players[1].grave.length===1,
   'banish='+gameState.players[1].banish.length);
reset0();
let nh2=mk('ネオフレムベル・ヘッジホッグ',0);
gameState.players[0].mz=[nh2];
gameState.players[0].grave=[mk('フレムベル・ドラグノフ',0)];  /* 炎属性 DEF200 */
API.destroy(h(nh2),'テスト効果破壊',1);
let cnh2=ctxEv(0,nh2,'onDestroy',{},'grave');
ok('ネオフレムベル・ヘッジホッグ positive: 効果破壊なら回収側が誘発する',
   sc('ネオフレムベル・ヘッジホッグ').passive.onDestroy(cnh2)===true);
sc('ネオフレムベル・ヘッジホッグ').selectTargets(cnh2,t=>{cnh2.selectedTargets=t;});
sc('ネオフレムベル・ヘッジホッグ').resolve(cnh2);
ok('ネオフレムベル・ヘッジホッグ ruling: 効果破壊では守備力200以下の炎属性を手札に加える',
   gameState.players[0].hand.length===1&&dbOf(gameState.players[0].hand[0]).at==='炎',
   'hand='+gameState.players[0].hand.map(c=>dbOf(c).n).join(','));
reset0();
let nh3=mk('ネオフレムベル・ヘッジホッグ',0);
gameState.players[0].mz=[nh3];
gameState.players[0].grave=[mk(BIG,0)];   /* 光属性しかいない */
API.destroy(h(nh3),'テスト効果破壊',1);
ok('ネオフレムベル・ヘッジホッグ negative: 該当する炎属性がいなければ効果破壊側は発動しない',
   sc('ネオフレムベル・ヘッジホッグ').passive.onDestroy(ctxEv(0,nh3,'onDestroy',{},'grave'))===false);

/* ============ 5. ワイトキング ============ */
reset0();
let wk1=mk('ワイトキング',0);
gameState.players[0].mz=[wk1];
gameState.players[0].grave=[mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0)];
ok('ワイトキング positive: 元々の攻撃力は墓地の「ワイト」の数×1000',
   curATK(wk1)===3000,'atk='+curATK(wk1));
gameState.players[0].grave=[mk(PLAIN,0)];
ok('ワイトキング ruling: 墓地の枚数が変われば攻撃力も追従する',
   curATK(wk1)===1000,'atk='+curATK(wk1));
reset0();
let wk2=mk('ワイトキング',0),wkk=mk(BIG,1);
gameState.players[0].mz=[wk2];gameState.players[1].mz=[wkk];
gameState.players[0].grave=[mk(PLAIN,0)];
let bwk=battleKill(wk2,wkk,0);
let cwk=ctxDS(0,wk2,bwk,'grave','leave');
ok('ワイトキング positive: 墓地に「ワイト」がいれば蘇生効果が誘発する',
   sc('ワイトキング').passive.onDamageStep(cwk)===true);
sc('ワイトキング').selectTargets(cwk,t=>{cwk.selectedTargets=t;});
sc('ワイトキング').resolve(cwk);
ok('ワイトキング positive: 「ワイト」を除外して自身が特殊召喚される',
   gameState.players[0].banish.length===1&&gameState.players[0].mz.length===1
   &&dbOf(gameState.players[0].mz[0]).n==='ワイトキング',
   'mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
reset0();
let wk3=mk('ワイトキング',0),wkk3=mk(BIG,1);
gameState.players[0].mz=[wk3];gameState.players[1].mz=[wkk3];
gameState.players[0].grave=[];
let bwk3=battleKill(wk3,wkk3,0);
ok('ワイトキング negative: 墓地に除外できる「ワイト」がいなければ発動できない',
   sc('ワイトキング').passive.onDamageStep(ctxDS(0,wk3,bwk3,'grave','leave'))===false);

/* ============ 6. ホワイトポータン ============ */
reset0();
let wp1=mk('ホワイトポータン',0),tuner=mk('ジェネクス・コントローラー',0);
gameState.players[0].mz=[wp1,tuner];
const battleProt=(c)=>applyDestructionProtectionV21(gameState,c,
  {cause:'battle',opponentCard:null,byPlayer:null,targeting:false,sourceKind:null});
ok('ホワイトポータン positive: 自分の場に表側チューナーがいれば戦闘破壊されない',
   !!battleProt(wp1));
reset0();
let wp2=mk('ホワイトポータン',0);
gameState.players[0].mz=[wp2];
ok('ホワイトポータン negative: チューナーがいなければ耐性はない',!battleProt(wp2));
reset0();
let wp3=mk('ホワイトポータン',0),tn3=mk('ジェネクス・コントローラー',0),foe3=mk(BIG,1);
gameState.players[0].mz=[wp3,tn3];gameState.players[1].mz=[foe3];
let btn=battleKill(tn3,foe3,0);
let ctn=ctxDS(0,wp3,btn,'mz','leave');
ok('ホワイトポータン positive: 自分の表側チューナーが戦闘破壊されると誘発する',
   sc('ホワイトポータン').passive.onDamageStep(ctn)===true);
let lpW=gameState.players[1].lp;
sc('ホワイトポータン').resolve(ctn);
ok('ホワイトポータン positive: 相手ライフに500ダメージ',
   gameState.players[1].lp===lpW-500,'lp='+gameState.players[1].lp);
reset0();
let wp4=mk('ホワイトポータン',0),nont=mk(PLAIN,0),foe4=mk(BIG,1);
gameState.players[0].mz=[wp4,nont];gameState.players[1].mz=[foe4];
let bnt=battleKill(nont,foe4,0);
ok('ホワイトポータン negative: 破壊されたのがチューナーでなければ誘発しない',
   sc('ホワイトポータン').passive.onDamageStep(ctxDS(0,wp4,bnt,'mz','leave'))===false);

/* ============ 7. 森の狩人イエロー・バブーン ============ */
reset0();
let bb1=mk('森の狩人イエロー・バブーン',0),beast=mk('N・ブラック・パンサー',0),bf=mk(BIG,1);
gameState.players[0].hand=[bb1];
gameState.players[0].mz=[beast];gameState.players[1].mz=[bf];
gameState.players[0].grave=[mk('N・ブラック・パンサー',0),mk('N・ブラック・パンサー',0)];
let bbb=battleKill(beast,bf,0);
let cbb=ctxDS(0,bb1,bbb,'hand','leave');
ok('森の狩人イエロー・バブーン positive: 自分の獣族が戦闘破壊され、墓地に獣族2体で誘発',
   sc('森の狩人イエロー・バブーン').passive.onDamageStep(cbb)===true);
sc('森の狩人イエロー・バブーン').selectTargets(cbb,t=>{cbb.selectedTargets=t;});
sc('森の狩人イエロー・バブーン').resolve(cbb);
ok('森の狩人イエロー・バブーン positive: 獣族2体を除外して手札から特殊召喚される',
   gameState.players[0].banish.length===2
   &&gameState.players[0].mz.some(c=>dbOf(c).n==='森の狩人イエロー・バブーン'),
   'banish='+gameState.players[0].banish.length+' mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
ok('森の狩人イエロー・バブーン ruling: 手札から出るので手札から消える',
   gameState.players[0].hand.length===0);
reset0();
let bb2=mk('森の狩人イエロー・バブーン',0),beast2=mk('N・ブラック・パンサー',0),bf2=mk(BIG,1);
gameState.players[0].hand=[bb2];
gameState.players[0].mz=[beast2];gameState.players[1].mz=[bf2];
gameState.players[0].grave=[];   /* 戦闘破壊された1体しか墓地に来ない */
let bbb2=battleKill(beast2,bf2,0);
ok('森の狩人イエロー・バブーン negative: 墓地の獣族が1体では発動できない',
   sc('森の狩人イエロー・バブーン').passive.onDamageStep(ctxDS(0,bb2,bbb2,'hand','leave'))===false,
   'beastGrave='+API.pileCards(0,'grave',x=>x.db.ra==='獣').length);
ok('森の狩人イエロー・バブーン ruling: 戦闘破壊された獣族自身も除外コストに数える',
   API.pileCards(0,'grave',x=>x.db.ra==='獣').length===1);

/* ============ 8. カース・オブ・ヴァンパイア ============ */
reset0();
let cv1=mk('カース・オブ・ヴァンパイア',0),cvk=mk(BIG,1);
gameState.players[0].mz=[cv1];gameState.players[1].mz=[cvk];
let bcv=battleKill(cv1,cvk,0);
let ccv=ctxDS(0,cv1,bcv,'grave','leave');
ok('カース・オブ・ヴァンパイア positive: 戦闘破壊され、ライフが500超なら誘発する',
   sc('カース・オブ・ヴァンパイア').passive.onDamageStep(ccv)===true);
sc('カース・オブ・ヴァンパイア').cost(ccv,()=>{});
sc('カース・オブ・ヴァンパイア').resolve(ccv);
ok('カース・オブ・ヴァンパイア positive: 500ライフを払って次のスタンバイに予約する',
   gameState.players[0].lp===8000-500&&(gameState.scheduledV7||[]).length===1,
   'lp='+gameState.players[0].lp+' sch='+(gameState.scheduledV7||[]).length);
let cvSch=(gameState.scheduledV7||[])[0];
ok('カース・オブ・ヴァンパイア ruling: 予約は自分のスタンバイフェイズ',
   cvSch&&cvSch.at==='standbyPhase'&&cvSch.handler==='c1.curseVampire');
scheduleHandlerV7(cvSch.handler)(cvSch.args||{}, cvSch);
ok('カース・オブ・ヴァンパイア positive: 予約が解決すると墓地から特殊召喚される',
   gameState.players[0].mz.length===1&&dbOf(gameState.players[0].mz[0]).n==='カース・オブ・ヴァンパイア');
let cv2=gameState.players[0].mz[0];
let ccv2=ctxEv(0,cv2,'onSpecialSummon',{},'mz');
ok('カース・オブ・ヴァンパイア positive: この効果での特殊召喚成功時に攻撃力アップが誘発する',
   sc('カース・オブ・ヴァンパイア').passive.onSpecialSummon(ccv2)===true);
sc('カース・オブ・ヴァンパイア').resolve(ccv2);
ok('カース・オブ・ヴァンパイア positive: 攻撃力が500アップする',
   curATK(cv2)===2500,'atk='+curATK(cv2));
ok('カース・オブ・ヴァンパイア ruling: 攻撃力アップは1度だけ（二重発動しない）',
   sc('カース・オブ・ヴァンパイア').passive.onSpecialSummon(ctxEv(0,cv2,'onSpecialSummon',{},'mz'))===false);
reset0();
let cv3=mk('カース・オブ・ヴァンパイア',0),cvk3=mk(BIG,1);
gameState.players[0].mz=[cv3];gameState.players[1].mz=[cvk3];
gameState.players[0].lp=500;
let bcv3=battleKill(cv3,cvk3,0);
ok('カース・オブ・ヴァンパイア negative: ライフが500以下では発動できない',
   sc('カース・オブ・ヴァンパイア').passive.onDamageStep(ctxDS(0,cv3,bcv3,'grave','leave'))===false);

/* ============ 9. インフェルニティ・リベンジャー ============ */
reset0();
let ir1=mk('インフェルニティ・リベンジャー',0),vic=mk(BIG,0),ifoe=mk(BIG,1);
gameState.players[0].grave=[ir1];
gameState.players[0].mz=[vic];gameState.players[1].mz=[ifoe];
gameState.players[0].hand=[];
let bir=battleKill(vic,ifoe,0);
let cir=ctxDS(0,ir1,bir,'grave','leave');
ok('インフェルニティ・リベンジャー positive: 手札0で自分の他モンスターが戦闘破壊され誘発',
   sc('インフェルニティ・リベンジャー').passive.onDamageStep(cir)===true);
sc('インフェルニティ・リベンジャー').resolve(cir);
let irOn=gameState.players[0].mz.find(c=>dbOf(c).n==='インフェルニティ・リベンジャー');
ok('インフェルニティ・リベンジャー positive: 墓地から特殊召喚される',!!irOn);
ok('インフェルニティ・リベンジャー ruling: 破壊されたモンスターの元々のレベルになる（青眼=8）',
   irOn&&curLV(irOn)===8,'lv='+(irOn?curLV(irOn):'-'));
reset0();
let ir2=mk('インフェルニティ・リベンジャー',0),vic2=mk(BIG,0),ifoe2=mk(BIG,1);
gameState.players[0].grave=[ir2];
gameState.players[0].mz=[vic2];gameState.players[1].mz=[ifoe2];
gameState.players[0].hand=[mk(PLAIN,0)];   /* 手札が1枚ある */
let bir2=battleKill(vic2,ifoe2,0);
ok('インフェルニティ・リベンジャー negative: 手札が0枚でなければ発動できない',
   sc('インフェルニティ・リベンジャー').passive.onDamageStep(ctxDS(0,ir2,bir2,'grave','leave'))===false);

/* ============ 10. ジュラック・ガリム ============ */
reset0();
let jg1=mk('ジュラック・ガリム',0),jk1=mk(BIG,1);
gameState.players[0].mz=[jg1];gameState.players[1].mz=[jk1];
gameState.players[1].hand=[mk(PLAIN,1),mk(PLAIN,1)];
let bjg=battleKill(jg1,jk1,0);
let cjg=ctxDS(0,jg1,bjg,'grave','leave');
ok('ジュラック・ガリム positive: 戦闘破壊で誘発する',
   sc('ジュラック・ガリム').passive.onDamageStep(cjg)===true);
sc('ジュラック・ガリム').resolve(cjg);
let pjg=pending();
ok('ジュラック・ガリム ruling: 選択権は相手にある',!!pjg&&pjg.player===1&&pjg.min===0);
answerChoiceV49([]);                       /* 捨てなかった */
ok('ジュラック・ガリム positive: 捨てなければ破壊したモンスターが破壊される',
   gameState.players[1].mz.length===0);
reset0();
let jg2=mk('ジュラック・ガリム',0),jk2=mk(BIG,1);
gameState.players[0].mz=[jg2];gameState.players[1].mz=[jk2];
gameState.players[1].hand=[mk(PLAIN,1)];
let bjg2=battleKill(jg2,jk2,0);
let cjg2=ctxDS(0,jg2,bjg2,'grave','leave');
sc('ジュラック・ガリム').resolve(cjg2);
let pjg2=pending();
ok('ジュラック・ガリム ruling: 相手の手札が選択肢になる',!!pjg2&&pjg2.candidates.length===1,'pjg2='+JSON.stringify(pjg2&&{p:pjg2.player,n:pjg2.candidates.length}));
answerChoiceV49([pjg2.candidates[0].key]);  /* 手札を1枚捨てた */
ok('ジュラック・ガリム negative: 相手が手札を捨てれば破壊されない',
   gameState.players[1].mz.length===1&&gameState.players[1].hand.length===0,
   'mz='+gameState.players[1].mz.length+' hand='+gameState.players[1].hand.length);

/* ============ 11. 漆黒の魔王 LV4 ============ */
reset0();
let dl1=mk('漆黒の魔王 LV4',0),dfoe=mk('ワイト',1);
gameState.players[0].mz=[dl1];gameState.players[1].mz=[dfoe];
gameState.players[0].deck=[mk('漆黒の魔王 LV6',0)];
let cdl=ctxDS(0,dl1,{atkCard:dl1,defCard:dfoe,destroyedDef:true,destroyedAtk:false,step:'after'},'mz','after');
ok('漆黒の魔王 LV4 positive: 戦闘破壊した相手モンスターがいれば誘発する',
   sc('漆黒の魔王 LV4').passive.onDamageStep(cdl)===true);
sc('漆黒の魔王 LV4').resolve(cdl);
ok('漆黒の魔王 LV4 positive: 破壊した相手モンスターの効果が無効化される',
   dfoe.negated===true||dfoe.effectNegated===true,'flags='+JSON.stringify({n:dfoe.negated,e:dfoe.effectNegated}));
ok('漆黒の魔王 LV4 positive: 戦闘破壊したターンが記録される',
   Number(dl1.c1DarkLordKillTurn)===gameState.turn);
gameState.turn=gameState.turn+2;gameState.phase='standby';gameState.activePlayer=0;
let cdl2=ctxEv(0,dl1,'onStandbyPhase',{},'mz');
ok('漆黒の魔王 LV4 positive: 次の自分ターンのスタンバイでレベルアップが誘発する',
   sc('漆黒の魔王 LV4').passive.onStandbyPhase(cdl2)===true);
sc('漆黒の魔王 LV4').resolve(cdl2);
ok('漆黒の魔王 LV4 positive: 自身を墓地へ送り LV6 が特殊召喚される',
   gameState.players[0].mz.length===1&&dbOf(gameState.players[0].mz[0]).n==='漆黒の魔王 LV6'
   &&gameState.players[0].grave.some(c=>dbOf(c).n==='漆黒の魔王 LV4'),
   'mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
reset0();
let dl3=mk('漆黒の魔王 LV4',0);
gameState.players[0].mz=[dl3];gameState.players[0].deck=[mk('漆黒の魔王 LV6',0)];
gameState.phase='standby';
ok('漆黒の魔王 LV4 negative: 戦闘破壊していなければスタンバイでレベルアップできない',
   sc('漆黒の魔王 LV4').passive.onStandbyPhase(ctxEv(0,dl3,'onStandbyPhase',{},'mz'))===false);

/* ============ 12. ミスティック・ソードマン LV2 ============ */
reset0();
let ms1=mk('ミスティック・ソードマン LV2',0),fd=mk(BIG,1,'down','def');
gameState.players[0].mz=[ms1];gameState.players[1].mz=[fd];
battleAt(0,0,'start');
let cms=ctxDS(0,ms1,{atkCard:ms1,defCard:fd,step:'start'},'mz','start');
ok('ミスティック・ソードマン LV2 positive: 裏側守備表示を攻撃した時に誘発する',
   sc('ミスティック・ソードマン LV2').passive.onDamageStep(cms)===true);
sc('ミスティック・ソードマン LV2').resolve(cms);
ok('ミスティック・ソードマン LV2 positive: ダメージ計算前に破壊される',
   gameState.players[1].mz.length===0);
ok('ミスティック・ソードマン LV2 ruling: 戦闘破壊したターンが記録される',
   Number(ms1.c1MysticKillTurn)===gameState.turn);
reset0();
let ms2=mk('ミスティック・ソードマン LV2',0),fu=mk(BIG,1,'up','def');
gameState.players[0].mz=[ms2];gameState.players[1].mz=[fu];
battleAt(0,0,'start');
ok('ミスティック・ソードマン LV2 negative: 表側守備表示には適用されない',
   sc('ミスティック・ソードマン LV2').passive.onDamageStep(
     ctxDS(0,ms2,{atkCard:ms2,defCard:fu,step:'start'},'mz','start'))===false);

/* ============ 13. レスキュー・ウォリアー ============ */
reset0();
let rw1=mk('レスキュー・ウォリアー',0),stolen=mk(PLAIN,0),rk=mk(BIG,1);
stolen.controller=1;                    /* 元々の持ち主は自分（owner=0） */
gameState.players[0].mz=[rw1];gameState.players[1].mz=[rk,stolen];
let brw=battleKill(rw1,rk,0);
let crw=ctxDS(0,rw1,brw,'grave','leave');
ok('レスキュー・ウォリアー positive: 相手の場に元々の持ち主が自分のモンスターがいれば誘発',
   sc('レスキュー・ウォリアー').passive.onDamageStep(crw)===true);
API.selectCard=(t,list,cb)=>cb(list.find(x=>x.card===stolen)||list[0]);
sc('レスキュー・ウォリアー').selectTargets(crw,t=>{crw.selectedTargets=t;});
sc('レスキュー・ウォリアー').resolve(crw);
API.selectCard=(t,list,cb)=>cb(list[0]);
ok('レスキュー・ウォリアー positive: そのモンスターのコントロールを得る',
   gameState.players[0].mz.some(c=>c===stolen),
   'p0mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
reset0();
let rw2=mk('レスキュー・ウォリアー',0),theirs=mk(PLAIN,1),rk2=mk(BIG,1);
gameState.players[0].mz=[rw2];gameState.players[1].mz=[rk2,theirs];
let brw2=battleKill(rw2,rk2,0);
ok('レスキュー・ウォリアー negative: 元々の持ち主が相手のモンスターしかいなければ発動できない',
   sc('レスキュー・ウォリアー').passive.onDamageStep(ctxDS(0,rw2,brw2,'grave','leave'))===false);
reset0();
let rw3=mk('レスキュー・ウォリアー',0),rf3=mk(BIG,1);
gameState.players[0].mz=[rw3];gameState.players[1].mz=[rf3];
ensureCardUid(gameState,rw3);ensureCardUid(gameState,rf3);
ok('レスキュー・ウォリアー ruling: このカードの戦闘で自分が受ける戦闘ダメージは0',
   applyBattleDamageFilters({to:0,amount:1200,atkCard:rf3,defCard:rw3,atkOwner:1,defOwner:0})===0);
ok('レスキュー・ウォリアー ruling: 相手が受ける戦闘ダメージは減らさない',
   applyBattleDamageFilters({to:1,amount:1200,atkCard:rw3,defCard:rf3,atkOwner:0,defOwner:1})===1200);

/* ============ 14. オーシャンズ・オーパー ============ */
reset0();
let oo1=mk('オーシャンズ・オーパー',0),odef=mk(PLAIN,1,'up','def');
gameState.players[0].mz=[oo1];gameState.players[1].mz=[odef];
ok('オーシャンズ・オーパー positive: 守備表示への貫通ダメージは攻撃力−守備力',
   applyPiercingDamage({atkCard:oo1,defCard:odef})===1500-200,
   'pierce='+applyPiercingDamage({atkCard:oo1,defCard:odef}));
let oatk=mk(PLAIN,1,'up','atk');
gameState.players[1].mz=[oatk];
ok('オーシャンズ・オーパー negative: 攻撃表示には貫通しない',
   applyPiercingDamage({atkCard:oo1,defCard:oatk})===0);
reset0();
let oo2=mk('オーシャンズ・オーパー',0),ok2=mk(BIG,1);
gameState.players[0].mz=[oo2];gameState.players[1].mz=[ok2];
gameState.players[0].deck=[mk('マザー・ブレイン',0),mk(PLAIN,0)];
let boo=battleKill(oo2,ok2,0);
let coo=ctxDS(0,oo2,boo,'grave','leave');
ok('オーシャンズ・オーパー positive: デッキに該当モンスターがいれば誘発する',
   sc('オーシャンズ・オーパー').passive.onDamageStep(coo)===true);
sc('オーシャンズ・オーパー').selectTargets(coo,t=>{coo.selectedTargets=t;});
sc('オーシャンズ・オーパー').resolve(coo);
ok('オーシャンズ・オーパー positive: そのモンスターが手札に加わる',
   gameState.players[0].hand.length===1&&dbOf(gameState.players[0].hand[0]).n==='マザー・ブレイン',
   'hand='+gameState.players[0].hand.map(c=>dbOf(c).n).join(','));
reset0();
let oo3=mk('オーシャンズ・オーパー',0),ok3=mk(BIG,1);
gameState.players[0].mz=[oo3];gameState.players[1].mz=[ok3];
gameState.players[0].deck=[mk(PLAIN,0)];
let boo3=battleKill(oo3,ok3,0);
ok('オーシャンズ・オーパー negative: デッキに該当モンスターがいなければ発動できない',
   sc('オーシャンズ・オーパー').passive.onDamageStep(ctxDS(0,oo3,boo3,'grave','leave'))===false);

/* ============ 15. エレメント・デビル ============ */
reset0();
let ed1=mk('エレメント・デビル',0),earth=mk('7つの武器を持つハンター',0),efoe=mk('ラッコアラ',1);
gameState.players[0].mz=[ed1,earth];gameState.players[1].mz=[efoe];
let ced=ctxDS(0,ed1,{atkCard:ed1,defCard:efoe,destroyedDef:true,destroyedAtk:false,step:'after'},'mz','after');
ok('エレメント・デビル positive: 地属性がいれば破壊した効果モンスターを無効化できる',
   sc('エレメント・デビル').passive.onDamageStep(ced)===true);
sc('エレメント・デビル').resolve(ced);
ok('エレメント・デビル positive: 相手モンスターの効果が無効化される',
   efoe.negated===true||efoe.effectNegated===true);
reset0();
let ed2=mk('エレメント・デビル',0),wind=mk('ジェネクス・コントローラー',0),efoe2=mk('ワイト',1);
wind.id=findCardIndex('ガスタ・ガルド');       /* 風属性を場に用意する */
gameState.players[0].mz=[ed2,wind];gameState.players[1].mz=[efoe2];
let ced2=ctxDS(0,ed2,{atkCard:ed2,defCard:efoe2,destroyedDef:true,destroyedAtk:false,step:'after'},'mz','after');
ok('エレメント・デビル positive: 風属性がいれば誘発する',
   sc('エレメント・デビル').passive.onDamageStep(ced2)===true);
sc('エレメント・デビル').resolve(ced2);
/* grantAdditionalAttack が実際に書くのは card.attackLimit / attackLimitTurn
   （GRANT_EXTRA_ATTACK_V48 @ 00_state_actions.js:470）。
   以前は存在しないフィールドを見ていたので実フィールドで検証する。 */
ok('エレメント・デビル positive: 風属性ならもう一度攻撃できる（grantAdditionalAttack）',
   Number(ed2.attackLimit)>=2&&Number(ed2.attackLimitTurn)===gameState.turn,
   'attackLimit='+ed2.attackLimit+' turn='+ed2.attackLimitTurn);
reset0();
let ed3=mk('エレメント・デビル',0),efoe3=mk('ワイト',1);
gameState.players[0].mz=[ed3];gameState.players[1].mz=[efoe3];
ok('エレメント・デビル negative: 地属性も風属性もいなければ発動できない',
   sc('エレメント・デビル').passive.onDamageStep(
     ctxDS(0,ed3,{atkCard:ed3,defCard:efoe3,destroyedDef:true,step:'after'},'mz','after'))===false);

/* ============ 16. ドミノ ============ */
reset0();
let dm1=mk('ドミノ',0),mine=mk(PLAIN,0),theirsD=mk(BIG,1),dead=mk(PLAIN,1);
gameState.players[0].sz=[dm1];
gameState.players[0].mz=[mine];gameState.players[1].mz=[theirsD,dead];
let bdm=battleKill(dead,mine,1);
let cdm=ctxDS(0,dm1,bdm,'sz','leave');
ok('ドミノ positive: 相手のモンスターが戦闘破壊されて誘発する',
   sc('ドミノ').passive.onDamageStep(cdm)===true);
sc('ドミノ').selectTargets(cdm,t=>{cdm.selectedTargets=t;});
sc('ドミノ').resolve(cdm);
ok('ドミノ positive: 自分のモンスターを墓地へ送り相手のモンスターを破壊する',
   gameState.players[0].mz.length===0&&gameState.players[1].mz.length===0,
   'p0='+gameState.players[0].mz.length+' p1='+gameState.players[1].mz.length);
reset0();
let dm2=mk('ドミノ',0),mine2=mk(PLAIN,0),ok2b=mk(BIG,1),deadMine=mk(PLAIN,0);
gameState.players[0].sz=[dm2];
gameState.players[0].mz=[mine2,deadMine];gameState.players[1].mz=[ok2b];
let bdm2=battleKill(deadMine,ok2b,0);
ok('ドミノ negative: 自分のモンスターが戦闘破壊されただけでは発動できない',
   sc('ドミノ').passive.onDamageStep(ctxDS(0,dm2,bdm2,'sz','leave'))===false);

/* ============ 17. リグレット・リボーン ============ */
reset0();
let rr1=mk('リグレット・リボーン',0,'down'),rvic=mk(BIG,0),rfoe=mk(BIG,1);
gameState.players[0].sz=[rr1];
gameState.players[0].mz=[rvic];gameState.players[1].mz=[rfoe];
let brr=battleKill(rvic,rfoe,0);
let crr=ctxDS(0,rr1,brr,'sz','leave');
ok('リグレット・リボーン positive: 自分のモンスターが戦闘破壊されて誘発する',
   sc('リグレット・リボーン').passive.onDamageStep(crr)===true);
sc('リグレット・リボーン').selectTargets(crr,t=>{crr.selectedTargets=t;});
sc('リグレット・リボーン').resolve(crr);
ok('リグレット・リボーン positive: そのモンスターが表側守備表示で特殊召喚される',
   gameState.players[0].mz.length===1&&gameState.players[0].mz[0].pos==='def'
   &&gameState.players[0].mz[0].face==='up',
   'pos='+(gameState.players[0].mz[0]||{}).pos);
ok('リグレット・リボーン ruling: 自分のエンドフェイズ破壊が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c1.regret'&&s.at==='endPhase'));
let rSch=(gameState.scheduledV7||[]).find(s=>s.handler==='c1.regret');
scheduleHandlerV7(rSch.handler)(rSch.args||{}, rSch);
ok('リグレット・リボーン ruling: エンドフェイズに破壊される',
   gameState.players[0].mz.length===0);
reset0();
let rr2=mk('リグレット・リボーン',0,'down');
gameState.players[0].sz=[rr2];
ok('リグレット・リボーン negative: 戦闘破壊されたモンスターがいなければ発動できない',
   sc('リグレット・リボーン').passive.onDamageStep(
     ctxDS(0,rr2,{step:'leave'},'sz','leave'))===false);

/* ============ 18. 自由解放 ============ */
reset0();
let fr1=mk('自由解放',0,'down'),fvic=mk(BIG,0),ffoe=mk(BIG,1),fother=mk(PLAIN,0);
gameState.players[0].sz=[fr1];
gameState.players[0].mz=[fvic,fother];gameState.players[1].mz=[ffoe];
let bfr=battleKill(fvic,ffoe,0);
let cfr=ctxDS(0,fr1,bfr,'sz','leave');
ok('自由解放 positive: 自分のモンスターが戦闘破壊され、表側が2体いれば誘発する',
   sc('自由解放').passive.onDamageStep(cfr)===true);
let deckBefore=gameState.players[0].deck.length+gameState.players[1].deck.length;
sc('自由解放').selectTargets(cfr,t=>{cfr.selectedTargets=t;});
sc('自由解放').resolve(cfr);
ok('自由解放 positive: 表側モンスター2体が持ち主のデッキへ戻る',
   gameState.players[0].deck.length+gameState.players[1].deck.length===deckBefore+2,
   'deck='+(gameState.players[0].deck.length+gameState.players[1].deck.length));
reset0();
let fr2=mk('自由解放',0,'down'),fvic2=mk(BIG,0),ffoe2=mk(BIG,1);
gameState.players[0].sz=[fr2];
gameState.players[0].mz=[fvic2];gameState.players[1].mz=[ffoe2];
let bfr2=battleKill(fvic2,ffoe2,0);
gameState.players[1].mz=[];             /* 表側モンスターが1体未満になる */
ok('自由解放 negative: 表側モンスターが2体いなければ発動できない',
   sc('自由解放').passive.onDamageStep(ctxDS(0,fr2,bfr2,'sz','leave'))===false);

/* ============ 19. 復活の墓穴 ============ */
reset0();
let gh1=mk('復活の墓穴',0,'down'),gvic=mk(BIG,0),gfoe=mk(BIG,1);
gameState.players[0].sz=[gh1];
gameState.players[0].mz=[gvic];gameState.players[1].mz=[gfoe];
gameState.players[1].grave=[mk(PLAIN,1)];
let bgh=battleKill(gvic,gfoe,0);
let cgh=ctxDS(0,gh1,bgh,'sz','leave');
ok('復活の墓穴 positive: 自分のモンスターが戦闘破壊されて誘発する',
   sc('復活の墓穴').passive.onDamageStep(cgh)===true);
sc('復活の墓穴').selectTargets(cgh,t=>{cgh.selectedTargets=t;});
gh1.face='up'; /* direct resolve fixture: the Trap is face-up while its activation resolves */
sc('復活の墓穴').resolve(cgh);
let ghMine=gameState.players[0].mz.length,ghFoe=gameState.players[1].mz.length;
ok('復活の墓穴 positive: お互いが墓地から守備表示で特殊召喚する',
   ghMine>=1&&ghFoe>=2,'p0='+ghMine+' p1='+ghFoe);
let revived=gameState.players[0].mz[0];
ok('復活の墓穴 ruling: 特殊召喚したモンスターは守備表示',revived&&revived.pos==='def');
ok('復活の墓穴 ruling: 表示形式を変更できない',
   cannotChangePositionV10(revived)===true);
let plainCard=mk(PLAIN,0);gameState.players[0].mz.push(plainCard);
ok('復活の墓穴 negative: この効果で出していないモンスターは表示形式を変更できる',
   cannotChangePositionV10(plainCard)===false);

/* ============ 20. ゼンマイジャグラー ============ */
reset0();
let zj1=mk('ゼンマイジャグラー',0),zfoe=mk(BIG,1);
gameState.players[0].mz=[zj1];gameState.players[1].mz=[zfoe];
let czj=ctxDS(0,zj1,{atkCard:zj1,defCard:zfoe,step:'after'},'mz','after');
ok('ゼンマイジャグラー positive: 相手モンスターと戦闘を行えば誘発する',
   sc('ゼンマイジャグラー').passive.onDamageStep(czj)===true);
sc('ゼンマイジャグラー').resolve(czj);
ok('ゼンマイジャグラー positive: ダメージ計算後に相手モンスターを破壊する',
   gameState.players[1].mz.length===0);
let zfoe2=mk(BIG,1);gameState.players[1].mz=[zfoe2];
ok('ゼンマイジャグラー ruling: 表側で存在する限り1度しか使えない',
   sc('ゼンマイジャグラー').passive.onDamageStep(
     ctxDS(0,zj1,{atkCard:zj1,defCard:zfoe2,step:'after'},'mz','after'))===false);
zj1.summonedTurn=gameState.turn+1;     /* 場を離れて出し直した想定 */
ok('ゼンマイジャグラー ruling: 場を離れて再度出れば使用回数はリセットされる',
   sc('ゼンマイジャグラー').passive.onDamageStep(
     ctxDS(0,zj1,{atkCard:zj1,defCard:zfoe2,step:'after'},'mz','after'))===true);

/* ============ 21. ゴブリン陽動部隊 ============ */
reset0();
let gb1=mk('ゴブリン陽動部隊',0);
gameState.players[0].mz=[gb1];
gameState.players[0].deck=[mk(PLAIN,0)];
ensureCardUid(gameState,gb1);
let cgb=ctxEv(0,gb1,'onBattleDamage',{player:1,amount:1000,attackerUid:gb1.uid},'mz');
ok('ゴブリン陽動部隊 positive: 相手ライフに戦闘ダメージを与えて誘発する',
   sc('ゴブリン陽動部隊').passive.onBattleDamage(cgb)===true);
sc('ゴブリン陽動部隊').resolve(cgb);
ok('ゴブリン陽動部隊 positive: カードを1枚ドローする',
   gameState.players[0].hand.length===1&&gameState.players[0].deck.length===0);
reset0();
let gb2=mk('ゴブリン陽動部隊',0);
gameState.players[0].mz=[gb2];ensureCardUid(gameState,gb2);
gameState.phase='battle';
gameState.battlePhaseV6={attacks:[{attackerUid:gb2.uid,defenderUid:null,player:0}]};
let cgb2=ctxEv(0,gb2,'onBattlePhaseEnd',{player:0,turn:gameState.turn},'mz');
ok('ゴブリン陽動部隊 positive: 攻撃したバトルフェイズ終了時に誘発する',
   sc('ゴブリン陽動部隊').passive.onBattlePhaseEnd(cgb2)===true);
sc('ゴブリン陽動部隊').resolve(cgb2);
ok('ゴブリン陽動部隊 positive: 守備表示になる',gb2.pos==='def','pos='+gb2.pos);
ok('ゴブリン陽動部隊 ruling: 次の自分ターンのエンドフェイズまで表示形式を変更できない',
   cannotChangePositionV10(gb2)===true);
gameState.turn=gameState.turn+2;
ok('ゴブリン陽動部隊 ruling: 次の自分ターンを過ぎれば変更できる',
   cannotChangePositionV10(gb2)===false);
reset0();
let gb3=mk('ゴブリン陽動部隊',0);
gameState.players[0].mz=[gb3];ensureCardUid(gameState,gb3);
gameState.phase='battle';gameState.battlePhaseV6={attacks:[]};
ok('ゴブリン陽動部隊 negative: 攻撃していなければバトルフェイズ終了時に誘発しない',
   sc('ゴブリン陽動部隊').passive.onBattlePhaseEnd(
     ctxEv(0,gb3,'onBattlePhaseEnd',{player:0,turn:gameState.turn},'mz'))===false);

/* ============ 22. ナチュル・ストロベリー ============ */
reset0();
let ns1=mk('ナチュル・ストロベリー',0),summoned=mk(BIG,1);
gameState.players[0].mz=[ns1];gameState.players[1].mz=[summoned];
ensureCardUid(gameState,summoned);
let evNS={player:1,uids:[summoned.uid]};
let cns=ctxEv(0,ns1,'onNormalSummon',evNS,'mz');
ok('ナチュル・ストロベリー positive: 相手の召喚に反応する',
   sc('ナチュル・ストロベリー').passive.onNormalSummon(cns)===true);
sc('ナチュル・ストロベリー').selectTargets(cns,t=>{cns.selectedTargets=t;});
sc('ナチュル・ストロベリー').resolve(cns);
ok('ナチュル・ストロベリー positive: 攻撃力がレベル×100アップする（青眼=lv8 → +800）',
   curATK(ns1)===1600+800,'atk='+curATK(ns1));
reset0();
let ns2=mk('ナチュル・ストロベリー',0),mySummon=mk(BIG,0);
gameState.players[0].mz=[ns2,mySummon];ensureCardUid(gameState,mySummon);
ok('ナチュル・ストロベリー negative: 自分の召喚には反応しない',
   sc('ナチュル・ストロベリー').passive.onNormalSummon(
     ctxEv(0,ns2,'onNormalSummon',{player:0,uids:[mySummon.uid]},'mz'))===false);
ok('ナチュル・ストロベリー ruling: 1ターンに1度の宣言がある',sc('ナチュル・ストロベリー').countLimit===1);

/* ============ 23. X－セイバー ウルベルム ============ */
reset0();
let xs1=mk('X－セイバー ウルベルム',0);
gameState.players[0].mz=[xs1];ensureCardUid(gameState,xs1);
gameState.players[1].hand=[mk(PLAIN,1),mk(PLAIN,1),mk(PLAIN,1),mk(BIG,1)];
let cxs=ctxEv(0,xs1,'onBattleDamage',{player:1,amount:2200,attackerUid:xs1.uid},'mz');
ok('X－セイバー ウルベルム positive: 相手の手札が4枚以上で戦闘ダメージを与えて誘発',
   sc('X－セイバー ウルベルム').passive.onBattleDamage(cxs)===true);
let deckTopBefore=gameState.players[1].deck.length;
sc('X－セイバー ウルベルム').resolve(cxs);
ok('X－セイバー ウルベルム positive: 手札1枚がデッキの一番上に戻る',
   gameState.players[1].hand.length===3&&gameState.players[1].deck.length===deckTopBefore+1,
   'hand='+gameState.players[1].hand.length+' deck='+gameState.players[1].deck.length);
reset0();
let xs2=mk('X－セイバー ウルベルム',0);
gameState.players[0].mz=[xs2];ensureCardUid(gameState,xs2);
gameState.players[1].hand=[mk(PLAIN,1),mk(PLAIN,1),mk(PLAIN,1)];
ok('X－セイバー ウルベルム negative: 相手の手札が3枚では発動できない',
   sc('X－セイバー ウルベルム').passive.onBattleDamage(
     ctxEv(0,xs2,'onBattleDamage',{player:1,amount:2200,attackerUid:xs2.uid},'mz'))===false);

/* ============ 24. ドラゴン・アイス ============ */
reset0();
let di1=mk('ドラゴン・アイス',0),diFoe=mk(BIG,1);
gameState.players[0].hand=[di1,mk(PLAIN,0)];
gameState.players[1].mz=[diFoe];ensureCardUid(gameState,diFoe);
let evDI={player:1,uids:[diFoe.uid]};
let cdi=ctxEv(0,di1,'onSpecialSummon',evDI,'hand');
ok('ドラゴン・アイス positive: 相手の特殊召喚に反応する',
   sc('ドラゴン・アイス').passive.onSpecialSummon(cdi)===true);
sc('ドラゴン・アイス').cost(cdi,()=>{});
sc('ドラゴン・アイス').resolve(cdi);
ok('ドラゴン・アイス positive: 手札を1枚捨てて手札から特殊召喚される',
   gameState.players[0].mz.some(c=>dbOf(c).n==='ドラゴン・アイス')
   &&gameState.players[0].grave.length===1,
   'mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(',')+' grave='+gameState.players[0].grave.length);
let di2=mk('ドラゴン・アイス',0);
gameState.players[0].hand=[di2,mk(PLAIN,0)];
ok('ドラゴン・アイス ruling: 表側表示で1枚しか存在できない',
   sc('ドラゴン・アイス').passive.onSpecialSummon(
     ctxEv(0,di2,'onSpecialSummon',evDI,'hand'))===false);
reset0();
let di3=mk('ドラゴン・アイス',0),myS=mk(BIG,0);
gameState.players[0].hand=[di3,mk(PLAIN,0)];
gameState.players[0].mz=[myS];ensureCardUid(gameState,myS);
ok('ドラゴン・アイス negative: 自分の特殊召喚には反応しない',
   sc('ドラゴン・アイス').passive.onSpecialSummon(
     ctxEv(0,di3,'onSpecialSummon',{player:0,uids:[myS.uid]},'hand'))===false);
reset0();
let di4=mk('ドラゴン・アイス',0),diFoe4=mk(BIG,1);
gameState.players[0].grave=[di4];gameState.players[0].hand=[];
gameState.players[1].mz=[diFoe4];ensureCardUid(gameState,diFoe4);
ok('ドラゴン・アイス negative: 捨てる手札が無ければ発動できない',
   sc('ドラゴン・アイス').passive.onSpecialSummon(
     ctxEv(0,di4,'onSpecialSummon',{player:1,uids:[diFoe4.uid]},'grave'))===false);

/* ================= 読み取り専用 passive の検証 ================= */
reset0();
let ro=mk('ゴブリン陽動部隊',0),ro2=mk('ゼンマイジャグラー',0),ro3=mk('ワイトキング',0);
gameState.players[0].mz=[ro,ro2,ro3];
gameState.players[0].deck=[mk(PLAIN,0)];
gameState.players[0].grave=[mk(PLAIN,0)];
[ro,ro2,ro3].forEach(c=>ensureCardUid(gameState,c));
gameState.battlePhaseV6={attacks:[{attackerUid:ro.uid,defenderUid:null,player:0}]};
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
sc('ゴブリン陽動部隊').passive.onBattlePhaseEnd(ctxEv(0,ro,'onBattlePhaseEnd',{player:0},'mz'));
sc('ゼンマイジャグラー').passive.onDamageStep(ctxDS(0,ro2,{atkCard:ro2,defCard:mk(BIG,1),step:'after'},'mz','after'));
curATK(ro3);
ok('cycle12 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('ゼンマイジャグラー',0);
gameState.players[0].mz=[rp1];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
b0MarkFieldOnce(h(rp1),'c1JugglerUsed','ゼンマイジャグラー');
let ra1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle12 Replay: 1度制限フラグが digest 一致で再生される',ra1.ok,ra1.reason||'');
reset0();
let rp2=mk('カース・オブ・ヴァンパイア',0);
gameState.players[0].grave=[rp2];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.schedule({at:'standbyPhase',ownTurn:true,player:0,handler:'c1.curseVampire',
  args:{uid:rp2.uid,player:0},source:{card:rp2},note:'カース・オブ・ヴァンパイア'});
let ra2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle12 Replay: スタンバイ蘇生予約が digest 一致で再生される',ra2.ok,ra2.reason||'');
reset0();
let rp3=mk('X－セイバー ウルベルム',0);
gameState.players[0].mz=[rp3];ensureCardUid(gameState,rp3);
gameState.players[1].hand=[mk(PLAIN,1),mk(PLAIN,1),mk(PLAIN,1),mk(BIG,1)];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let seedBefore=gameState.rngState;
sc('X－セイバー ウルベルム').resolve(ctxEv(0,rp3,'onBattleDamage',{player:1,amount:2200,attackerUid:rp3.uid},'mz'));
ok('cycle12 Replay: ランダム選択は duelRandomInt を使い rngState が進む',
   gameState.rngState!==seedBefore);
let ra3=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle12 Replay: ランダム手札戻しが digest 一致で再生される',ra3.ok,ra3.reason||'');
let snap=JSON.stringify(gameState);
ok('cycle12 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('cycle12 直列化: 予約に関数が入っていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
let thrown=false;try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){thrown=true;console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' \u2014 '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
if(thrown)process.exit(1);
