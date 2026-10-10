/* Auto cycle 15 — 23枚。positive / negative / ruling edge / Replay。 */
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
function foeAttacks(ai,ti,step){
  const a=gameState.players[1].mz[ai],d=gameState.players[0].mz[ti];
  if(a)ensureCardUid(gameState,a); if(d)ensureCardUid(gameState,d);
  gameState.battle={player:1,atkIdx:ai,target:ti,step:step||'calc',
    atkUid:a?a.uid:null,targetUid:d?d.uid:null};}
function endCtx(p,card,zone){gameState.phase='end';gameState.activePlayer=p;
  return ctxEv(p,card,'onEndPhase',{player:p,turn:gameState.turn},zone);}
function pending(){return pendingChoiceV49(gameState);}
const PLAIN='ワイト';        /* 闇 アンデット lv1 ATK300 DEF200 */
const BIG='青眼の白龍';       /* 光 ドラゴン lv8 ATK3000 DEF2500 */
const NORMEARTH='ヂェミナイ・エルフ'; /* 地属性 通常モンスター */

const ALL=['ゼンマイソルジャー','ゼンマイドッグ','ラッコアラ','ミラクル・キッズ','ハーフ・カウンター',
 'ジェム・マーチャント','ディスクライダー','ライトロード・パラディン ジェイン','ライトロード・モンク エイリン',
 'ヴァイロン・デルタ','キラー・スネーク','チューナーズ・バリア','ブリザード・ドラゴン','スパイダー・ウェブ',
 'デプス・アミュレット','ブレイク・ドロー','オーバー・デッド・ライン','スナップドラゴン','ヴァイパー・リボーン',
 'ボーン・テンプル・ブロック','カオス・インフィニティ','フェデライザー','レベル変換実験室'];
ALL.forEach(n=>ok('cycle15 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle15 枚数は23',ALL.length===23);
/* S03-U164: デュアル・サモナー は実装済み（S03-U119 のデュアル機構＋効果による通常召喚）。当時 SKIP だった記録として残す。 */
ok('cycle15 (was SKIP): デュアル・サモナー implemented in S03-U164 (real-path test tools/test_s03_u164_dual_summoner.js)',
   !!CARD_SCRIPTS['デュアル・サモナー']);

/* ============ ゼンマイソルジャー / ゼンマイドッグ ============ */
reset0();
let zs=mk('ゼンマイソルジャー',0);
gameState.players[0].mz=[zs];
let czs=C(0,zs,'mz',0);
ok('ゼンマイソルジャー positive: 表側なら発動できる',sc('ゼンマイソルジャー').condition(czs)===true,czs.reason||'');
sc('ゼンマイソルジャー').resolve(czs);
ok('ゼンマイソルジャー positive: レベル+1・攻撃力+400',
   curLV(zs)===5&&curATK(zs)===1800+400,'lv='+curLV(zs)+' atk='+curATK(zs));
ok('ゼンマイソルジャー ruling: 表側で存在する限り1度しか使えない',
   sc('ゼンマイソルジャー').condition(C(0,zs,'mz',0))===false);
zs.summonedTurn=gameState.turn+1;
ok('ゼンマイソルジャー ruling: 出し直せば再び使える',
   sc('ゼンマイソルジャー').condition(C(0,zs,'mz',0))===true);
reset0();
let zd=mk('ゼンマイドッグ',0);
gameState.players[0].mz=[zd];
let czd=C(0,zd,'mz',0);
sc('ゼンマイドッグ').resolve(czd);
ok('ゼンマイドッグ positive: レベル+2・攻撃力+600',
   curLV(zd)===5&&curATK(zd)===1200+600,'lv='+curLV(zd)+' atk='+curATK(zd));

/* ============ ラッコアラ ============ */
reset0();
let rk=mk('ラッコアラ',0),beast=mk('N・ブラック・パンサー',0);
gameState.players[0].mz=[rk,beast];
let crk=C(0,rk,'mz',0);
ok('ラッコアラ positive: 他の獣族がいれば発動できる',sc('ラッコアラ').condition(crk)===true,crk.reason||'');
sc('ラッコアラ').selectTargets(crk,t=>{crk.selectedTargets=t;});
sc('ラッコアラ').resolve(crk);
ok('ラッコアラ positive: 攻撃力が1000アップする',curATK(rk)===1200+1000,'atk='+curATK(rk));
reset0();
let rk2=mk('ラッコアラ',0);
gameState.players[0].mz=[rk2];
ok('ラッコアラ negative: 他の獣族がいなければ発動できない',
   sc('ラッコアラ').condition(C(0,rk2,'mz',0))===false);

/* ============ ミラクル・キッズ ============ */
reset0();
let mkd=mk('ミラクル・キッズ',0,'down'),mfoe=mk(BIG,1);
gameState.players[0].sz=[mkd];gameState.players[1].mz=[mfoe];
gameState.players[0].grave=[mk('ヒーロー・キッズ',0),mk('ヒーロー・キッズ',0)];
let cmk=C(0,mkd,'sz',0);
sc('ミラクル・キッズ').selectTargets(cmk,t=>{cmk.selectedTargets=t;});
sc('ミラクル・キッズ').resolve(cmk);
ok('ミラクル・キッズ positive: 墓地の「ヒーロー・キッズ」の数×400ダウン',
   curATK(mfoe)===3000-800,'atk='+curATK(mfoe));
reset0();
let mkd2=mk('ミラクル・キッズ',0,'down');
gameState.players[0].sz=[mkd2];
ok('ミラクル・キッズ negative: 相手の表側モンスターがいなければ発動できない',
   sc('ミラクル・キッズ').condition(C(0,mkd2,'sz',0))===false);

/* ============ ハーフ・カウンター ============ */
reset0();
let hc=mk('ハーフ・カウンター',0,'down'),mine=mk(PLAIN,0),atkr=mk(BIG,1);
gameState.players[0].sz=[hc];gameState.players[0].mz=[mine];gameState.players[1].mz=[atkr];
foeAttacks(0,0,'calc');
let chc=ctxDS(0,hc,{atkCard:atkr,defCard:mine,step:'calc'},'sz','calc');
ok('ハーフ・カウンター positive: 自分のモンスターが攻撃されたダメージ計算時に誘発する',
   sc('ハーフ・カウンター').passive.onDamageStep(chc)===true);
ACTIVE_SCRIPT=sc('ハーフ・カウンター');
sc('ハーフ・カウンター').resolve(chc);
ACTIVE_SCRIPT=null;
ok('ハーフ・カウンター positive: 攻撃モンスターの元々の攻撃力の半分だけアップ',
   curATK(mine)===300+1500,'atk='+curATK(mine));
reset0();
let hc2=mk('ハーフ・カウンター',0,'down'),myAtk=mk(BIG,0),foeDef=mk(PLAIN,1);
gameState.players[0].sz=[hc2];gameState.players[0].mz=[myAtk];gameState.players[1].mz=[foeDef];
battleAt(0,0,'calc');
ok('ハーフ・カウンター negative: 自分が攻撃している場合は発動できない',
   sc('ハーフ・カウンター').passive.onDamageStep(
     ctxDS(0,hc2,{atkCard:myAtk,defCard:foeDef,step:'calc'},'sz','calc'))===false);

/* ============ ジェム・マーチャント ============ */
reset0();
let gm=mk('ジェム・マーチャント',0),earth=mk(NORMEARTH,0),gfoe=mk(BIG,1);
gameState.players[0].hand=[gm];gameState.players[0].mz=[earth];gameState.players[1].mz=[gfoe];
battleAt(0,0,'calc');
let cgm=ctxDS(0,gm,{atkCard:earth,defCard:gfoe,step:'calc'},'hand','calc');
ok('ジェム・マーチャント positive: 自分の地属性通常モンスターの戦闘で誘発する',
   sc('ジェム・マーチャント').passive.onDamageStep(cgm)===true);
ACTIVE_SCRIPT=sc('ジェム・マーチャント');
sc('ジェム・マーチャント').cost(cgm,()=>{});
sc('ジェム・マーチャント').resolve(cgm);
ACTIVE_SCRIPT=null;
ok('ジェム・マーチャント positive: 手札から墓地へ送られ、攻守が1000アップ',
   gameState.players[0].hand.length===0&&curATK(earth)===1900+1000&&curDEF(earth)===900+1000,
   'atk='+curATK(earth)+' def='+curDEF(earth));
reset0();
let gm2=mk('ジェム・マーチャント',0),effMon=mk('ラッコアラ',0),gfoe2=mk(BIG,1);
gameState.players[0].hand=[gm2];gameState.players[0].mz=[effMon];gameState.players[1].mz=[gfoe2];
battleAt(0,0,'calc');
ok('ジェム・マーチャント negative: 効果モンスターの戦闘では発動できない',
   sc('ジェム・マーチャント').passive.onDamageStep(
     ctxDS(0,gm2,{atkCard:effMon,defCard:gfoe2,step:'calc'},'hand','calc'))===false);

/* ============ ディスクライダー ============ */
reset0();
let dr=mk('ディスクライダー',0);
gameState.players[0].mz=[dr];
gameState.players[0].grave=[mk('落とし穴',0)];   /* 通常罠 */
let cdr=C(0,dr,'mz',0);
ok('ディスクライダー positive: 墓地に通常罠があれば発動できる',
   sc('ディスクライダー').condition(cdr)===true,cdr.reason||'');
sc('ディスクライダー').selectTargets(cdr,t=>{cdr.selectedTargets=t;});
sc('ディスクライダー').resolve(cdr);
ok('ディスクライダー positive: 通常罠を除外して攻撃力500アップ',
   gameState.players[0].banish.length===1&&curATK(dr)===1700+500,
   'atk='+curATK(dr)+' banish='+gameState.players[0].banish.length);
ok('ディスクライダー ruling: 相手のエンドフェイズに解除が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c4.riderBoost'&&s.at==='endPhase'));
let drSch=(gameState.scheduledV7||[]).find(s=>s.handler==='c4.riderBoost');
scheduleHandlerV7('c4.riderBoost')(drSch.args||{}, drSch);
ok('ディスクライダー ruling: 予約が解決すると攻撃力が元に戻る',
   curATK(dr)===1700,'atk='+curATK(dr));
reset0();
let dr2=mk('ディスクライダー',0);
gameState.players[0].mz=[dr2];gameState.players[0].grave=[mk('アヌビスの裁き',0)];  /* カウンター罠 */
ok('ディスクライダー negative: 墓地に通常罠が無ければ発動できない',
   sc('ディスクライダー').condition(C(0,dr2,'mz',0))===false);

/* ============ ライトロード・パラディン ジェイン ============ */
reset0();
let jain=mk('ライトロード・パラディン ジェイン',0),jfoe=mk(BIG,1);
gameState.players[0].mz=[jain];gameState.players[1].mz=[jfoe];
battleAt(0,0,'calc');
ok('ライトロード・パラディン ジェイン positive: 相手モンスターに攻撃する間は攻撃力300アップ',
   curATK(jain)===1800+300,'atk='+curATK(jain));
gameState.battle=null;
ok('ライトロード・パラディン ジェイン ruling: 戦闘外では上がらない',
   curATK(jain)===1800,'atk='+curATK(jain));
gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0)];
let cjain=endCtx(0,jain,'mz');
ok('ライトロード・パラディン ジェイン positive: 自分エンドフェイズに誘発する',
   sc('ライトロード・パラディン ジェイン').passive.onEndPhase(cjain)===true);
sc('ライトロード・パラディン ジェイン').resolve(cjain);
ok('ライトロード・パラディン ジェイン positive: デッキの上から2枚墓地へ送る',
   gameState.players[0].deck.length===1&&gameState.players[0].grave.length===2,
   'deck='+gameState.players[0].deck.length+' grave='+gameState.players[0].grave.length);
reset0();
let jain2=mk('ライトロード・パラディン ジェイン',0);
gameState.players[0].mz=[jain2];gameState.players[0].deck=[mk(PLAIN,0)];
gameState.phase='end';gameState.activePlayer=1;
ok('ライトロード・パラディン ジェイン negative: 相手のエンドフェイズでは誘発しない',
   sc('ライトロード・パラディン ジェイン').passive.onEndPhase(
     ctxEv(0,jain2,'onEndPhase',{player:1},'mz'))===false);

/* ============ ライトロード・モンク エイリン ============ */
reset0();
let ehren=mk('ライトロード・モンク エイリン',0),defFoe=mk(BIG,1,'up','def');
gameState.players[0].mz=[ehren];gameState.players[1].mz=[defFoe];
battleAt(0,0,'start');
let ceh=ctxDS(0,ehren,{atkCard:ehren,defCard:defFoe,step:'start'},'mz','start');
ok('ライトロード・モンク エイリン positive: 守備表示を攻撃したダメージ計算前に誘発する',
   sc('ライトロード・モンク エイリン').passive.onDamageStep(ceh)===true);
let deckB=gameState.players[1].deck.length;
sc('ライトロード・モンク エイリン').resolve(ceh);
ok('ライトロード・モンク エイリン positive: そのモンスターを持ち主のデッキに戻す',
   gameState.players[1].mz.length===0&&gameState.players[1].deck.length===deckB+1,
   'p1mz='+gameState.players[1].mz.length);
reset0();
let ehren2=mk('ライトロード・モンク エイリン',0),atkFoe=mk(BIG,1,'up','atk');
gameState.players[0].mz=[ehren2];gameState.players[1].mz=[atkFoe];
battleAt(0,0,'start');
ok('ライトロード・モンク エイリン negative: 攻撃表示には適用されない',
   sc('ライトロード・モンク エイリン').passive.onDamageStep(
     ctxDS(0,ehren2,{atkCard:ehren2,defCard:atkFoe,step:'start'},'mz','start'))===false);
reset0();
let ehren3=mk('ライトロード・モンク エイリン',0);
gameState.players[0].mz=[ehren3];
gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0)];
let ceh3=endCtx(0,ehren3,'mz');
sc('ライトロード・モンク エイリン').resolve(ceh3);
ok('ライトロード・モンク エイリン positive: 自分エンドフェイズに3枚墓地へ送る',
   gameState.players[0].grave.length===3,'grave='+gameState.players[0].grave.length);

/* ============ ヴァイロン・デルタ ============ */
reset0();
let vd=mk('ヴァイロン・デルタ',0,'up','def');
gameState.players[0].mz=[vd];
gameState.players[0].deck=[mk('デーモンの斧',0),mk(PLAIN,0)];
let cvd=endCtx(0,vd,'mz');
ok('ヴァイロン・デルタ positive: 表側守備表示なら自分エンドフェイズに誘発する',
   sc('ヴァイロン・デルタ').passive.onEndPhase(cvd)===true);
sc('ヴァイロン・デルタ').selectTargets(cvd,t=>{cvd.selectedTargets=t;});
sc('ヴァイロン・デルタ').resolve(cvd);
ok('ヴァイロン・デルタ positive: デッキの装備魔法が手札に加わる',
   gameState.players[0].hand.length===1&&dbOf(gameState.players[0].hand[0]).sub==='装備',
   'hand='+gameState.players[0].hand.map(c=>dbOf(c).n).join(','));
reset0();
let vd2=mk('ヴァイロン・デルタ',0,'up','atk');
gameState.players[0].mz=[vd2];gameState.players[0].deck=[mk('デーモンの斧',0)];
ok('ヴァイロン・デルタ negative: 攻撃表示では発動できない',
   sc('ヴァイロン・デルタ').passive.onEndPhase(endCtx(0,vd2,'mz'))===false);

/* ============ キラー・スネーク ============ */
reset0();
let ks=mk('キラー・スネーク',0);
gameState.players[0].grave=[ks];
gameState.phase='standby';gameState.activePlayer=0;
let cks=ctxEv(0,ks,'onStandbyPhase',{},'grave');
ok('キラー・スネーク positive: 自分のスタンバイフェイズに誘発する',
   sc('キラー・スネーク').passive.onStandbyPhase(cks)===true);
sc('キラー・スネーク').resolve(cks);
ok('キラー・スネーク positive: 手札に戻る',
   gameState.players[0].hand.some(c=>c===ks)&&gameState.players[0].grave.length===0);
ok('キラー・スネーク ruling: 次の相手エンドフェイズに除外が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c4.killerSnake'&&s.at==='endPhase'));
gameState.players[0].grave=[mk('キラー・スネーク',0)];
let ksSch=(gameState.scheduledV7||[]).find(s=>s.handler==='c4.killerSnake');
scheduleHandlerV7('c4.killerSnake')(ksSch.args||{}, ksSch);
ok('キラー・スネーク ruling: 予約が解決すると墓地の「キラー・スネーク」が除外される',
   gameState.players[0].banish.length===1&&gameState.players[0].grave.length===0);
ok('キラー・スネーク ruling: 1ターンに1度の宣言がある',sc('キラー・スネーク').countLimit===1);

/* ============ チューナーズ・バリア ============ */
reset0();
let tb=mk('チューナーズ・バリア',0,'up'),tuner=mk('ジェネクス・コントローラー',0),nontuner=mk(PLAIN,0);
gameState.players[0].sz=[tb];gameState.players[0].mz=[tuner,nontuner];
const battleProt=(c)=>applyDestructionProtectionV21(gameState,c,
  {cause:'battle',opponentCard:null,byPlayer:null,targeting:false,sourceKind:null});
const effectProt=(c)=>applyDestructionProtectionV21(gameState,c,
  {cause:'effect',opponentCard:null,byPlayer:null,targeting:false,sourceKind:null});
ok('チューナーズ・バリア negative: 発動前は耐性が無い',!battleProt(tuner));
let ctb=C(0,tb,'sz',0);
ok('チューナーズ・バリア positive: 表側チューナーがいれば発動できる',
   sc('チューナーズ・バリア').condition(ctb)===true,ctb.reason||'');
sc('チューナーズ・バリア').selectTargets(ctb,t=>{ctb.selectedTargets=t;});
sc('チューナーズ・バリア').resolve(ctb);
ok('チューナーズ・バリア positive: 選択したチューナーは戦闘で破壊されない',!!battleProt(tuner));
ok('チューナーズ・バリア positive: カードの効果でも破壊されない',!!effectProt(tuner));
ok('チューナーズ・バリア ruling: 選択していないモンスターは守られない',!battleProt(nontuner));
gameState.turn=gameState.turn+2;
ok('チューナーズ・バリア ruling: 次のターンのエンドフェイズを過ぎれば切れる',!battleProt(tuner));
reset0();
let tb2=mk('チューナーズ・バリア',0,'down');
gameState.players[0].sz=[tb2];gameState.players[0].mz=[mk(PLAIN,0)];
ok('チューナーズ・バリア negative: チューナーがいなければ発動できない',
   sc('チューナーズ・バリア').condition(C(0,tb2,'sz',0))===false);

/* ============ ブリザード・ドラゴン ============ */
reset0();
let bd=mk('ブリザード・ドラゴン',0),bfoe=mk(BIG,1);
gameState.players[0].mz=[bd];gameState.players[1].mz=[bfoe];
ensureCardUid(gameState,bfoe);
let cbd=C(0,bd,'mz',0);
ok('ブリザード・ドラゴン positive: 相手モンスターがいれば発動できる',
   sc('ブリザード・ドラゴン').condition(cbd)===true,cbd.reason||'');
sc('ブリザード・ドラゴン').selectTargets(cbd,t=>{cbd.selectedTargets=t;});
sc('ブリザード・ドラゴン').resolve(cbd);
ok('ブリザード・ドラゴン positive: 選択したモンスターは攻撃宣言できない',
   cannotAttackNow(bfoe)===true);
ok('ブリザード・ドラゴン positive: 表示形式も変更できない',
   cannotChangePositionV10(bfoe)===true);
gameState.turn=gameState.turn+2;
ok('ブリザード・ドラゴン ruling: 次の相手のエンドフェイズを過ぎれば解ける',
   cannotAttackNow(bfoe)===false&&cannotChangePositionV10(bfoe)===false);
ok('ブリザード・ドラゴン ruling: 1ターンに1度の宣言がある',sc('ブリザード・ドラゴン').countLimit===1);

/* ============ スパイダー・ウェブ ============ */
reset0();
let sw=mk('スパイダー・ウェブ',0,'up'),swAtk=mk(BIG,1);
gameState.players[0].sz=[sw];gameState.players[1].mz=[swAtk];
gameState.players[0].mz=[mk(PLAIN,0)];
foeAttacks(0,0,'end');
ensureCardUid(gameState,swAtk);
let csw=ctxDS(0,sw,{atkCard:swAtk,defCard:gameState.players[0].mz[0],step:'end'},'sz','end');
ok('スパイダー・ウェブ positive: 攻撃宣言したモンスターがいれば誘発する',
   sc('スパイダー・ウェブ').passive.onDamageStep(csw)===true);
sc('スパイダー・ウェブ').resolve(csw);
ok('スパイダー・ウェブ positive: 攻撃したモンスターが守備表示になる',
   swAtk.pos==='def','pos='+swAtk.pos);
ok('スパイダー・ウェブ positive: 表示形式を変更できない',
   cannotChangePositionV10(swAtk)===true);
gameState.turn=gameState.turn+2;
ok('スパイダー・ウェブ ruling: そのコントローラーの次の自分ターンのエンドフェイズを過ぎれば解ける',
   cannotChangePositionV10(swAtk)===false);

/* ============ デプス・アミュレット ============ */
reset0();
let da=mk('デプス・アミュレット',0,'down');
gameState.players[0].sz=[da];gameState.players[0].hand=[mk(PLAIN,0)];
gameState.pendingAttack={player:1,atkIdx:0,target:0};
let cda=C(0,da,'sz',0);
ok('デプス・アミュレット positive: 攻撃宣言時に手札があれば発動できる',
   sc('デプス・アミュレット').condition(cda)===true,cda.reason||'');
sc('デプス・アミュレット').cost(cda,()=>{});
sc('デプス・アミュレット').resolve(cda);
ok('デプス・アミュレット positive: 手札を1枚捨てて攻撃が無効になる',
   gameState.players[0].hand.length===0&&gameState.attackNegated===true,
   'hand='+gameState.players[0].hand.length+' negated='+gameState.attackNegated);
ok('デプス・アミュレット ruling: 3回目の相手エンドフェイズの破壊が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c4.depthAmulet'));
reset0();
let da2=mk('デプス・アミュレット',0,'down');
gameState.players[0].sz=[da2];gameState.players[0].hand=[];
gameState.pendingAttack={player:1,atkIdx:0,target:0};
ok('デプス・アミュレット negative: 手札が無ければ発動できない',
   sc('デプス・アミュレット').condition(C(0,da2,'sz',0))===false);

/* ============ ブレイク・ドロー ============ */
reset0();
let bkd=mk('ブレイク・ドロー',0,'up'),mach=mk('ジェネクス・コントローラー',0),bfoe2=mk(PLAIN,1);
gameState.players[0].sz=[bkd];gameState.players[0].mz=[mach];gameState.players[1].mz=[bfoe2];
gameState.players[0].deck=[mk(PLAIN,0)];
ensureCardUid(gameState,mach);
bkd.equipTo={uid:mach.uid};
ok('ブレイク・ドロー ruling: 機械族にのみ装備可能',
   sc('ブレイク・ドロー').equipSpec.canEquip({db:dbOf(mach)})===true
   &&sc('ブレイク・ドロー').equipSpec.canEquip({db:dbOf(bfoe2)})===false);
bfoe2.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let cbkd=ctxDS(0,bkd,{atkCard:mach,defCard:bfoe2,destroyedDef:true,destroyedAtk:false,step:'after'},'sz','after');
ok('ブレイク・ドロー positive: 装備モンスターが戦闘破壊して誘発する',
   sc('ブレイク・ドロー').passive.onDamageStep(cbkd)===true);
sc('ブレイク・ドロー').resolve(cbkd);
ok('ブレイク・ドロー positive: 1枚ドローする',
   gameState.players[0].hand.length===1&&gameState.players[0].deck.length===0);
ok('ブレイク・ドロー ruling: 3回目の自分エンドフェイズの破壊が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c4.breakDraw'));

/* ============ オーバー・デッド・ライン ============ */
reset0();
let odl=mk('オーバー・デッド・ライン',0,'up'),plant=mk('ロードポイズン',0);
gameState.players[0].sz=[odl];
gameState.players[0].grave=[plant];
ensureCardUid(gameState,plant);
API.specialSummon(0,'grave',0,'atk','テスト蘇生',0);
let plantOn=gameState.players[0].mz[0];
ok('オーバー・デッド・ライン positive: 墓地から特殊召喚した植物族の攻撃力が1000アップ',
   curATK(plantOn)===1500+1000,'atk='+curATK(plantOn));
let odlC=C(0,odl,'sz',0);
sc('オーバー・デッド・ライン').resolve(odlC);
ok('オーバー・デッド・ライン ruling: 2回目の自分エンドフェイズの破壊が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c4.overDeadLine'));
reset0();
let odl2=mk('オーバー・デッド・ライン',0,'up'),plant2=mk('ロードポイズン',0);
gameState.players[0].sz=[odl2];gameState.players[0].mz=[plant2];   /* 蘇生していない */
ok('オーバー・デッド・ライン negative: 墓地からの特殊召喚でなければ上がらない',
   curATK(plant2)===1500,'atk='+curATK(plant2));

/* ============ スナップドラゴン ============ */
reset0();
let sd=mk('スナップドラゴン',0);
gameState.players[0].mz=[sd];
gameState.players[1].hand=[mk(BIG,1),mk(PLAIN,1)];
API.sendToGrave(h(sd),'テスト：墓地へ送る');
let csd=ctxEv(0,sd,'onSendToGrave',{},'grave');
ok('スナップドラゴン positive: 墓地へ送られた時に誘発する',
   sc('スナップドラゴン').passive.onSendToGrave(csd)===true);
let rngB=gameState.rngState;
sc('スナップドラゴン').resolve(csd);
ok('スナップドラゴン positive: ランダム選択なので rngState が進む',gameState.rngState!==rngB);
ok('スナップドラゴン positive: 相手の手札1枚が除外される',
   gameState.players[1].banish.length===1&&gameState.players[1].hand.length===1,
   'banish='+gameState.players[1].banish.length);
ok('スナップドラゴン ruling: エンドフェイズの帰還が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c4.snapDragon'));
let sdSch=(gameState.scheduledV7||[]).find(s=>s.handler==='c4.snapDragon');
scheduleHandlerV7('c4.snapDragon')(sdSch.args||{}, sdSch);
ok('スナップドラゴン ruling: 予約が解決すると手札に戻る',
   gameState.players[1].hand.length===2&&gameState.players[1].banish.length===0);
ok('スナップドラゴン ruling: 1ターンに1度の宣言がある',sc('スナップドラゴン').countLimit===1);

/* ============ ヴァイパー・リボーン ============ */
reset0();
let vr=mk('ヴァイパー・リボーン',0),rep=mk('エアジャチ',0);   /* 海竜族なので不可 */
gameState.players[0].sz=[vr];gameState.players[0].grave=[rep];
ok('ヴァイパー・リボーン negative: 墓地に爬虫類以外がいれば発動できない',
   sc('ヴァイパー・リボーン').condition(C(0,vr,'sz',0))===false);
reset0();
let vr2=mk('ヴァイパー・リボーン',0),rep2=mk('くちばしヘビ',0);
gameState.players[0].sz=[vr2];gameState.players[0].grave=[rep2];
ensureCardUid(gameState,rep2);
let cvr=C(0,vr2,'sz',0);
ok('ヴァイパー・リボーン positive: 墓地が爬虫類族のみなら発動できる',
   sc('ヴァイパー・リボーン').condition(cvr)===true,cvr.reason||'');
sc('ヴァイパー・リボーン').selectTargets(cvr,t=>{cvr.selectedTargets=t;});
sc('ヴァイパー・リボーン').resolve(cvr);
ok('ヴァイパー・リボーン positive: 墓地のモンスターが特殊召喚される',
   gameState.players[0].mz.some(c=>c===rep2));
ok('ヴァイパー・リボーン ruling: このターンのエンドフェイズ破壊が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c4.viperReborn'));
let vrSch=(gameState.scheduledV7||[]).find(s=>s.handler==='c4.viperReborn');
scheduleHandlerV7('c4.viperReborn')(vrSch.args||{}, vrSch);
ok('ヴァイパー・リボーン ruling: 予約が解決すると破壊される',
   gameState.players[0].mz.length===0);

/* ============ ボーン・テンプル・ブロック ============ */
reset0();
let bt=mk('ボーン・テンプル・ブロック',0,'down');
gameState.players[0].sz=[bt];gameState.players[0].hand=[mk(PLAIN,0)];
gameState.players[0].grave=[mk(PLAIN,0)];
gameState.players[1].grave=[mk(PLAIN,1)];
let cbt=C(0,bt,'sz',0);
ok('ボーン・テンプル・ブロック positive: 手札とお互いの墓地があれば発動できる',
   sc('ボーン・テンプル・ブロック').condition(cbt)===true,cbt.reason||'');
sc('ボーン・テンプル・ブロック').cost(cbt,()=>{});
sc('ボーン・テンプル・ブロック').selectTargets(cbt,t=>{cbt.selectedTargets=t;});
sc('ボーン・テンプル・ブロック').resolve(cbt);
ok('ボーン・テンプル・ブロック positive: 相手の墓地から自分フィールドへ特殊召喚する',
   gameState.players[0].mz.length===1&&gameState.players[0].mz[0].owner===1,
   'p0mz='+gameState.players[0].mz.length);
ok('ボーン・テンプル・ブロック positive: 相手も自分の墓地から特殊召喚する',
   gameState.players[1].mz.length===1&&gameState.players[1].mz[0].owner===0,
   'p1mz='+gameState.players[1].mz.length);
ok('ボーン・テンプル・ブロック ruling: 次のターンのエンドフェイズ破壊が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c4.boneTemple'));

/* ============ カオス・インフィニティ ============ */
reset0();
let ci=mk('カオス・インフィニティ',0,'down'),defMon=mk(PLAIN,1,'up','def');
gameState.players[0].sz=[ci];gameState.players[1].mz=[defMon];
gameState.players[0].deck=[mk('機皇兵ワイゼル・アイン',0)];
let cci=C(0,ci,'sz',0);
ok('カオス・インフィニティ positive: デッキに「機皇」がいれば発動できる',
   sc('カオス・インフィニティ').condition(cci)===true,cci.reason||'');
sc('カオス・インフィニティ').selectTargets(cci,t=>{cci.selectedTargets=t;});
sc('カオス・インフィニティ').resolve(cci);
ok('カオス・インフィニティ positive: 守備表示モンスターが表側攻撃表示になる',
   defMon.pos==='atk'&&defMon.face==='up','pos='+defMon.pos);
ok('カオス・インフィニティ positive: 「機皇」モンスターが特殊召喚される',
   gameState.players[0].mz.some(c=>dbOf(c).n==='機皇兵ワイゼル・アイン'),
   'p0mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
let meklord=gameState.players[0].mz.find(c=>dbOf(c).n==='機皇兵ワイゼル・アイン');
ok('カオス・インフィニティ ruling: 特殊召喚したモンスターの効果は無効化される',
   !!meklord&&(meklord.negated===true||meklord.effectNegated===true));
ok('カオス・インフィニティ ruling: エンドフェイズ破壊が予約される',
   (gameState.scheduledV7||[]).some(s=>s.handler==='c4.chaosInfinity'));
reset0();
let ci2=mk('カオス・インフィニティ',0,'down');
gameState.players[0].sz=[ci2];gameState.players[0].deck=[mk(PLAIN,0)];
ok('カオス・インフィニティ negative: 「機皇」がいなければ発動できない',
   sc('カオス・インフィニティ').condition(C(0,ci2,'sz',0))===false);

/* ============ フェデライザー ============ */
reset0();
let fd=mk('フェデライザー',0),fk=mk(BIG,1);
gameState.players[0].mz=[fd];gameState.players[1].mz=[fk];
gameState.players[0].deck=[mk('インフィニティ・ダーク',0),mk(PLAIN,0)];
fd.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let cfd=ctxDS(0,fd,{defCard:fd,atkCard:fk,destroyedDef:true,destroyedAtk:false,step:'leave'},'grave','leave');
ok('フェデライザー positive: 戦闘破壊され、デッキにデュアルがいれば誘発する',
   sc('フェデライザー').passive.onDamageStep(cfd)===true);
sc('フェデライザー').selectTargets(cfd,t=>{cfd.selectedTargets=t;});
sc('フェデライザー').resolve(cfd);
ok('フェデライザー positive: デュアルモンスターを墓地へ送り1枚ドローする',
   gameState.players[0].hand.length===1
   &&gameState.players[0].grave.some(c=>(dbOf(c).st||[]).includes('デュアル')),
   'hand='+gameState.players[0].hand.length+' grave='+gameState.players[0].grave.map(c=>dbOf(c).n).join(','));
reset0();
let fd2=mk('フェデライザー',0),fk2=mk(BIG,1);
gameState.players[0].mz=[fd2];gameState.players[1].mz=[fk2];
gameState.players[0].deck=[mk(PLAIN,0)];
fd2.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
ok('フェデライザー negative: デッキにデュアルモンスターがいなければ発動できない',
   sc('フェデライザー').passive.onDamageStep(
     ctxDS(0,fd2,{defCard:fd2,atkCard:fk2,destroyedDef:true,step:'leave'},'grave','leave'))===false);

/* ============ レベル変換実験室 ============ */
reset0();
let ll=mk('レベル変換実験室',0,'down'),handMon=mk(BIG,0);
gameState.players[0].sz=[ll];gameState.players[0].hand=[handMon];
let cll=C(0,ll,'sz',0);
ok('レベル変換実験室 positive: 手札にモンスターがあれば発動できる',
   sc('レベル変換実験室').condition(cll)===true,cll.reason||'');
let rngL=gameState.rngState;
sc('レベル変換実験室').selectTargets(cll,t=>{cll.selectedTargets=t;});
sc('レベル変換実験室').resolve(cll);
ok('レベル変換実験室 positive: サイコロで rngState が進む',gameState.rngState!==rngL);
let roll=Number(gameState.players[0].temporaryFlags.c4LevelLabRoll);
ok('レベル変換実験室 ruling: 出目は1〜6',roll>=1&&roll<=6,'roll='+roll);
ok('レベル変換実験室 positive: 1なら墓地へ、2〜6ならそのレベルになる',
   roll===1
     ? (gameState.players[0].grave.some(c=>c===handMon)&&gameState.players[0].hand.length===0)
     : (gameState.players[0].hand.some(c=>c===handMon)&&curLV(handMon)===roll),
   'roll='+roll+' lv='+curLV(handMon)+' hand='+gameState.players[0].hand.length);
reset0();
let ll2=mk('レベル変換実験室',0,'down');
gameState.players[0].sz=[ll2];gameState.players[0].hand=[mk('落とし穴',0)];
ok('レベル変換実験室 negative: 手札にモンスターがなければ発動できない',
   sc('レベル変換実験室').condition(C(0,ll2,'sz',0))===false);

/* ================= 読み取り専用 passive の検証 ================= */
reset0();
let ro1=mk('ライトロード・パラディン ジェイン',0),ro2=mk('スパイダー・ウェブ',0,'up'),ro3=mk('キラー・スネーク',0);
gameState.players[0].mz=[ro1];gameState.players[0].sz=[ro2];gameState.players[0].grave=[ro3];
gameState.players[0].deck=[mk(PLAIN,0)];
gameState.phase='end';gameState.activePlayer=0;
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
sc('ライトロード・パラディン ジェイン').passive.onEndPhase(ctxEv(0,ro1,'onEndPhase',{player:0},'mz'));
sc('スパイダー・ウェブ').passive.onDamageStep(ctxDS(0,ro2,{step:'end'},'sz','end'));
sc('キラー・スネーク').passive.onStandbyPhase(ctxEv(0,ro3,'onStandbyPhase',{},'grave'));
curATK(ro1);
ok('cycle15 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('チューナーズ・バリア',0,'down'),rt=mk('ジェネクス・コントローラー',0);
gameState.players[0].sz=[rp1];gameState.players[0].mz=[rt];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.setCardFlag(h(rt),'c4BarrierUntil',gameState.turn+1,'チューナーズ・バリア');
let ra1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle15 Replay: 期限付き耐性フラグが digest 一致で再生される',ra1.ok,ra1.reason||'');
reset0();
let rp2=mk('ディスクライダー',0);
gameState.players[0].mz=[rp2];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.modAtk(h(rp2),500,0,'permanent','ディスクライダー');
API.schedule({at:'endPhase',turns:1,player:0,handler:'c4.riderBoost',
  args:{uid:rp2.uid},source:{card:rp2},note:'ディスクライダー'});
let ra2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle15 Replay: 攻撃力修正と解除予約が digest 一致で再生される',ra2.ok,ra2.reason||'');
reset0();
let rp3=mk('レベル変換実験室',0,'down'),rm=mk(BIG,0);
gameState.players[0].sz=[rp3];gameState.players[0].hand=[rm];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let seedB=gameState.rngState;
let crp3=C(0,rp3,'sz',0);
sc('レベル変換実験室').selectTargets(crp3,t=>{crp3.selectedTargets=t;});
sc('レベル変換実験室').resolve(crp3);
ok('cycle15 Replay: サイコロで rngState が進む',gameState.rngState!==seedB);
let ra3=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle15 Replay: サイコロ結果が digest 一致で再生される',ra3.ok,ra3.reason||'');
let snap=JSON.stringify(gameState);
ok('cycle15 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('cycle15 直列化: 予約に関数が入っていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
