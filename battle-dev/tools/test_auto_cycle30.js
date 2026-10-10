/* Auto cycle 30 — 11枚。positive / negative / ruling edge / Replay。 */
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

const ALL=['コアキメイル・グラヴィローズ','コアキメイル・ビートル',
 'コアキメイル・ベルグザーク','ドル・ドラ','サテライト・キャノン','エレキジ',
 'エーリアンモナイト','ネオス・フォース','サディスティック・ポーション','シンクロ・コントロール'];
ALL.forEach(n=>ok('cycle30 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle30 枚数は10',ALL.length===10);

const CORE='コアキメイルの鋼核';
const PLANT='アイヴィ・ウォール';    /* 植物 lv2 */
const INSECT='N・フレア・スカラベ';  /* 昆虫 lv3 */
const WARR='D.D.アサイラント';       /* 戦士 lv4 */
const ALIEN='エーリアン・グレイ';    /* エーリアン lv2 */
const NEOS='E・HERO ネオス';
const SYN='C・ドラゴン';
const LV3D='2人3脚ゾンビ';          /* 闇 lv3 */

function killedBattle(atkCard,defCard){
  return {atkCard:atkCard,defCard:defCard,destroyedDef:true,destroyedAtk:false};
}
function fireAt(at,p,phase,advance){
  gameState.turn=gameState.turn+(advance==null?0:advance);
  gameState.activePlayer=p;gameState.phase=phase;
  return runDueSchedulesV7(at,gameState);
}
function upkeepEnd(){ gameState.phase='end';gameState.activePlayer=0; }

/* ============ 維持コストの共通挙動（グラヴィローズで代表） ============ */
reset0();
upkeepEnd();
let gv=mk('コアキメイル・グラヴィローズ',0),gvCore=mk(CORE,0);
gameState.players[0].mz=[gv];gameState.players[0].hand=[gvCore];
let gvCtx=C(0,gv,'mz',0,'activate',{});
ok('コアキメイル・グラヴィローズ positive: 自分エンドフェイズに維持コストを処理する',
   sc('コアキメイル・グラヴィローズ').condition(gvCtx)===true);
sc('コアキメイル・グラヴィローズ').resolve(gvCtx);
ok('コアキメイル・グラヴィローズ card-specific: 鋼核を墓地へ送って維持される',
   gameState.players[0].mz.length===1&&gameState.players[0].hand.length===0
   &&gameState.players[0].grave.length===1);
reset0();
upkeepEnd();
let gv2=mk('コアキメイル・グラヴィローズ',0),gv2Pl=mk(PLANT,0);
gameState.players[0].mz=[gv2];gameState.players[0].hand=[gv2Pl];
sc('コアキメイル・グラヴィローズ').resolve(C(0,gv2,'mz',0,'activate',{}));
ok('コアキメイル・グラヴィローズ card-specific: 手札の植物族を見せて維持される',
   gameState.players[0].mz.length===1&&gameState.players[0].hand.length===1);
ok('コアキメイル・グラヴィローズ 隠匿情報: 見せたカードは両者に公開される',
   revealListV20(gameState).some(r=>r&&(r.audience==='both'||r.audience==null)));
reset0();
upkeepEnd();
let gv3=mk('コアキメイル・グラヴィローズ',0);
gameState.players[0].mz=[gv3];gameState.players[0].hand=[mk(BIG,0)];
sc('コアキメイル・グラヴィローズ').resolve(C(0,gv3,'mz',0,'activate',{}));
ok('コアキメイル・グラヴィローズ card-specific: どちらも行えなければ破壊される',
   gameState.players[0].mz.length===0&&gameState.players[0].grave.length===1);
reset0();
gameState.phase='standby';gameState.activePlayer=0;
let gv4=mk('コアキメイル・グラヴィローズ',0);
gameState.players[0].mz=[gv4];
gameState.players[0].deck=[mk(PLANT,0),mk(BIG,0)];
let gv4Ctx=C(0,gv4,'mz',0,'activate',{});
ok('コアキメイル・グラヴィローズ positive: スタンバイにデッキのレベル3以下を落とせる',
   sc('コアキメイル・グラヴィローズ').condition(gv4Ctx)===true);
gv4Ctx.selectedTargets=[h(gameState.players[0].deck[0])];
sc('コアキメイル・グラヴィローズ').resolve(gv4Ctx);
ok('コアキメイル・グラヴィローズ card-specific: レベル3以下が墓地へ送られる',
   gameState.players[0].grave.length===1
   &&Number(dbOf(gameState.players[0].grave[0]).lv)<=3,
   'grave='+gameState.players[0].grave.map(c=>dbOf(c).n).join(','));
ok('コアキメイル・グラヴィローズ ruling: 1ターンに1度（countLimit）',
   sc('コアキメイル・グラヴィローズ').countLimit===1);

/* ============ コアキメイル・ビートル ============ */
reset0();
let bt=mk('コアキメイル・ビートル',0),btFoe=mk(BIG,1,'up','atk');
gameState.players[0].mz=[bt];gameState.players[1].mz=[btFoe];
ensureCardUid(gameState,btFoe);
let btCtx=ctxEv(0,bt,'onSpecialSummon',{card:btFoe,uid:btFoe.uid},'mz');
ok('コアキメイル・ビートル positive: 光属性が表側攻撃表示で特殊召喚された時に誘発する',
   sc('コアキメイル・ビートル').passive.onSpecialSummon(btCtx)===true);
sc('コアキメイル・ビートル').resolve(btCtx);
ok('コアキメイル・ビートル card-specific: そのモンスターが守備表示になる',
   gameState.players[1].mz[0].pos==='def');
reset0();
let bt2=mk('コアキメイル・ビートル',0),bt2Foe=mk('エレファン',1,'up','atk');
gameState.players[0].mz=[bt2];gameState.players[1].mz=[bt2Foe];
ensureCardUid(gameState,bt2Foe);
ok('コアキメイル・ビートル negative: 光・闇属性以外では誘発しない',
   sc('コアキメイル・ビートル').passive.onSpecialSummon(
     ctxEv(0,bt2,'onSpecialSummon',{card:bt2Foe,uid:bt2Foe.uid},'mz'))===false);
reset0();
upkeepEnd();
let bt3=mk('コアキメイル・ビートル',0),bt3Ins=mk(INSECT,0);
gameState.players[0].mz=[bt3];gameState.players[0].hand=[bt3Ins];
sc('コアキメイル・ビートル').resolve(C(0,bt3,'mz',0,'activate',{}));
ok('コアキメイル・ビートル card-specific: 手札の昆虫族を見せて維持される',
   gameState.players[0].mz.length===1&&gameState.players[0].hand.length===1);

/* ============ コアキメイル・ベルグザーク ============ */
reset0();
let bz=mk('コアキメイル・ベルグザーク',0),bzFoe=mk(PLAIN,1);
gameState.players[0].mz=[bz];gameState.players[1].grave=[bzFoe];
bz.attacked=true;bz.attackCount=1;   /* 1回攻撃した直後のダメージステップ */
let bzCtx=ctxDS(0,bz,killedBattle(bz,bzFoe));
ok('コアキメイル・ベルグザーク positive: 戦闘破壊で誘発する',
   sc('コアキメイル・ベルグザーク').passive.onDamageStep(bzCtx)===true);
sc('コアキメイル・ベルグザーク').resolve(bzCtx);
ok('コアキメイル・ベルグザーク card-specific: もう1度攻撃できる（attackLimit が増える）',
   Number(bz.attackLimit)>=2&&Number(bz.attackLimitTurn)===gameState.turn,
   'limit='+bz.attackLimit);
reset0();
upkeepEnd();
let bz2=mk('コアキメイル・ベルグザーク',0),bz2War=mk(WARR,0);
gameState.players[0].mz=[bz2];gameState.players[0].hand=[bz2War];
sc('コアキメイル・ベルグザーク').resolve(C(0,bz2,'mz',0,'activate',{}));
ok('コアキメイル・ベルグザーク card-specific: 手札の戦士族を見せて維持される',
   gameState.players[0].mz.length===1&&gameState.players[0].hand.length===1);

/* ============ ドル・ドラ ============ */
reset0();
gameState.phase='end';
let dd=mk('ドル・ドラ',0);
gameState.players[0].grave=[dd];
dd.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
ensureCardUid(gameState,dd);
let ddCtx=C(0,dd,'grave',0,'activate',{});
ok('ドル・ドラ positive: 破壊されたターンのエンドフェイズに発動できる',
   sc('ドル・ドラ').condition(ddCtx)===true);
sc('ドル・ドラ').resolve(ddCtx);
ok('ドル・ドラ card-specific: 墓地から特殊召喚され攻守が1000になる',
   gameState.players[0].mz.length===1
   &&curATK(dd)===1000&&curDEF(dd)===1000,
   'atk='+curATK(dd)+' def='+curDEF(dd));
ok('ドル・ドラ card-specific: デュエル中に1度（countLimit scope=duel）',
   sc('ドル・ドラ').countLimit.scope==='duel');
reset0();
gameState.phase='main1';
let dd2=mk('ドル・ドラ',0);
gameState.players[0].grave=[dd2];
dd2.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
ok('ドル・ドラ negative: エンドフェイズ以外では発動できない',
   sc('ドル・ドラ').condition(C(0,dd2,'grave',0,'activate',{}))===false);

/* ============ サテライト・キャノン ============ */
reset0();
upkeepEnd();
let sk=mk('サテライト・キャノン',0);
gameState.players[0].mz=[sk];
let skCtx=C(0,sk,'mz',0,'activate',{});
ok('サテライト・キャノン positive: 自分エンドフェイズに発動する',
   sc('サテライト・キャノン').condition(skCtx)===true);
sc('サテライト・キャノン').resolve(skCtx);
ok('サテライト・キャノン card-specific: 攻撃力が1000アップする',
   curATK(sk)===1000,'atk='+curATK(sk));
sc('サテライト・キャノン').resolve(C(0,sk,'mz',0,'activate',{}));
ok('サテライト・キャノン card-specific: エンドフェイズ毎に累積する',
   curATK(sk)===2000,'atk='+curATK(sk));
gameState.phase='battle';
let skFoe=mk(BIG,1);gameState.players[1].mz=[skFoe];
let skCtx2=ctxDS(0,sk,{atkCard:sk,defCard:skFoe});
ok('サテライト・キャノン positive: 攻撃したダメージ計算後に誘発する',
   sc('サテライト・キャノン').passive.onDamageStep(skCtx2)===true);
sc('サテライト・キャノン').resolve(skCtx2);
ok('サテライト・キャノン card-specific: 攻撃後は0に戻る',
   curATK(sk)===0,'atk='+curATK(sk));
reset0();
gameState.phase='battle';
let sk2=mk('サテライト・キャノン',0),sk2Low=mk(LV3D,1);
gameState.players[0].mz=[sk2];gameState.players[1].mz=[sk2Low];
gameState.battle={player:1,atkIdx:0,target:0};
ok('サテライト・キャノン card-specific: レベル7以下との戦闘では破壊されない',
   (protectionRecordV21(gameState,sk2,{cause:'battle'})||{}).battle===true);
reset0();
gameState.phase='battle';
let sk3=mk('サテライト・キャノン',0),sk3High=mk(BIG,1);  /* レベル8 */
gameState.players[0].mz=[sk3];gameState.players[1].mz=[sk3High];
gameState.battle={player:1,atkIdx:0,target:0};
ok('サテライト・キャノン negative: レベル8との戦闘では守られない',
   protectionRecordV21(gameState,sk3,{cause:'battle'})===null);
gameState.battle=null;

/* ============ エレキジ ============ */
reset0();
let ek=mk('エレキジ',0),ekFoe=mk(BIG,1);
gameState.players[0].mz=[ek];gameState.players[1].mz=[ekFoe];
ensureCardUid(gameState,ek);ensureCardUid(gameState,ekFoe);
ok('エレキジ card-specific: 直接攻撃できる（canDirectAttack）',
   sc('エレキジ').canDirectAttack===true);
let ekCtx=ctxEv(0,ek,'onDirectBattleDamage',
  {player:1,amount:1000,direct:true,attackerUid:ek.uid},'mz');
ok('エレキジ positive: 直接攻撃の戦闘ダメージで誘発する',
   sc('エレキジ').passive.onDirectBattleDamage(ekCtx)===true);
ekCtx.selectedTargets=[h(ekFoe)];
sc('エレキジ').resolve(ekCtx);
ok('エレキジ card-specific: 対象がエンドフェイズまで除外される',
   gameState.players[1].banish.length===1
   &&API.schedules('d9.returnBanishedUid').length===1);
fireAt('endPhase',0,'end');
ok('エレキジ card-specific: エンドフェイズに戻る',
   gameState.players[1].mz.length===1&&gameState.players[1].banish.length===0);
reset0();
let ek2=mk('エレキジ',0);
gameState.players[0].mz=[ek2];ensureCardUid(gameState,ek2);
ok('エレキジ negative: 直接攻撃でなければ誘発しない',
   sc('エレキジ').passive.onDirectBattleDamage(
     ctxEv(0,ek2,'onDirectBattleDamage',
       {player:1,amount:1000,direct:false,attackerUid:ek2.uid},'mz'))===false);

/* ============ エーリアンモナイト ============ */
reset0();
let am=mk('エーリアンモナイト',0),amAlien=mk(ALIEN,0);
gameState.players[0].mz=[am];gameState.players[0].grave=[amAlien];
ensureCardUid(gameState,amAlien);
let amCtx=ctxEv(0,am,'onNormalSummon',{card:am},'mz');
ok('エーリアンモナイト positive: 召喚成功時に墓地の「エーリアン」を蘇生できる',
   sc('エーリアンモナイト').passive.onNormalSummon(amCtx)===true);
amCtx.selectedTargets=[h(amAlien)];
sc('エーリアンモナイト').resolve(amCtx);
ok('エーリアンモナイト card-specific: レベル4以下の「エーリアン」が特殊召喚される',
   gameState.players[0].mz.length===2
   &&isSetCardV4(dbOf(gameState.players[0].mz[1]),SETCODE.ALIEN)===true);
ok('エーリアンモナイト card-specific: エンドフェイズの破壊が予約される',
   API.schedules('d9.destroyUid').length===1);
fireAt('endPhase',0,'end');
ok('エーリアンモナイト card-specific: 予約が発火して破壊される',
   gameState.players[0].mz.length===1);
reset0();
let am2=mk('エーリアンモナイト',0);
gameState.players[0].mz=[am2];gameState.players[0].grave=[mk(BIG,0)];
ok('エーリアンモナイト negative: 墓地に「エーリアン」がいなければ発動できない',
   sc('エーリアンモナイト').condition(
     ctxEv(0,am2,'onNormalSummon',{card:am2},'mz'))===false);

/* ============ ネオス・フォース ============ */
reset0();
let nf=mk('ネオス・フォース',0),nfNeos=mk(NEOS,0),nfOther=mk(BIG,0);
gameState.players[0].sz=[nf];gameState.players[0].mz=[nfNeos,nfOther];
let nfCtx=C(0,nf,'sz',0,'activate',{});
ok('ネオス・フォース positive: 「E・HERO ネオス」がいれば発動できる',
   sc('ネオス・フォース').condition(nfCtx)===true);
ok('ネオス・フォース ruling: ネオス以外には装備できない（equipSpec）',
   equipLegalV15(nf,h(nfOther))===false);
nfCtx.selectedTargets=[h(nfNeos)];
sc('ネオス・フォース').resolve(nfCtx);
nf.face='up';
ok('ネオス・フォース card-specific: 装備され攻撃力が800アップ',
   !!nf.equipTo&&curATK(nfNeos)===dbOf(nfNeos).atk+800,'atk='+curATK(nfNeos));
let nfFoe=mk(PLAIN,1);gameState.players[1].grave=[nfFoe];
let nfCtx2=ctxDS(0,nf,killedBattle(nfNeos,nfFoe),'sz');
ok('ネオス・フォース positive: 装備先が戦闘破壊した時に誘発する',
   sc('ネオス・フォース').passive.onDamageStep(nfCtx2)===true);
let nfLp=gameState.players[1].lp;
sc('ネオス・フォース').resolve(nfCtx2);
ok('ネオス・フォース card-specific: 破壊したモンスターの元々の攻撃力分のダメージ',
   gameState.players[1].lp===nfLp-Number(dbOf(nfFoe).atk),
   'lp='+nfLp+'→'+gameState.players[1].lp);
upkeepEnd();
sc('ネオス・フォース').resolve(C(0,nf,'sz',0,'activate',{}));
ok('ネオス・フォース card-specific: エンドフェイズにデッキへ戻る',
   gameState.players[0].sz.length===0
   &&gameState.players[0].deck.some(c=>c&&dbOf(c).n==='ネオス・フォース'),
   'sz='+gameState.players[0].sz.length);

/* ============ サディスティック・ポーション ============ */
reset0();
let sp=mk('サディスティック・ポーション',0,'down'),spMon=mk(BIG,0);
gameState.players[0].sz=[sp];gameState.players[0].mz=[spMon];
let spCtx=C(0,sp,'sz',0,'activate',{});
ok('サディスティック・ポーション positive: 自分のモンスターがいれば発動できる',
   sc('サディスティック・ポーション').condition(spCtx)===true);
spCtx.selectedTargets=[h(spMon)];
sc('サディスティック・ポーション').resolve(spCtx);
sp.face='up';
ok('サディスティック・ポーション positive: モンスターに装備される',
   !!sp.equipTo&&sp.equipTo.uid===spMon.uid);
let spCtx2=ctxEv(0,sp,'onLPChange',
  {player:1,delta:-800,cause:'effect',byPlayer:0},'sz');
ok('サディスティック・ポーション positive: 効果ダメージを与えた時に誘発する',
   sc('サディスティック・ポーション').passive.onLPChange(spCtx2)===true);
let spAtk=curATK(spMon);
sc('サディスティック・ポーション').resolve(spCtx2);
ok('サディスティック・ポーション card-specific: 装備モンスターの攻撃力が1000アップ',
   curATK(spMon)===spAtk+1000,'atk='+spAtk+'→'+curATK(spMon));
reset0();
let sp2=mk('サディスティック・ポーション',0),sp2Mon=mk(BIG,0);
gameState.players[0].sz=[sp2];gameState.players[0].mz=[sp2Mon];
ensureCardUid(gameState,sp2);ensureCardUid(gameState,sp2Mon);
sp2.equipUid=sp2.equipUid||775;sp2.equipTo={p:0,uid:sp2Mon.uid};
sp2Mon.equippedBy=[sp2.equipUid];
ok('サディスティック・ポーション negative: 戦闘ダメージでは誘発しない',
   sc('サディスティック・ポーション').passive.onLPChange(
     ctxEv(0,sp2,'onLPChange',{player:1,delta:-800,cause:'battle',byPlayer:0},'sz'))===false);
ok('サディスティック・ポーション ruling: 自分が受けたダメージでは誘発しない',
   sc('サディスティック・ポーション').passive.onLPChange(
     ctxEv(0,sp2,'onLPChange',{player:0,delta:-800,cause:'effect',byPlayer:1},'sz'))===false);

/* ============ シンクロ・コントロール ============ */
reset0();
let scn=mk('シンクロ・コントロール',0),scnFoe=mk(SYN,1);
gameState.players[0].sz=[scn];gameState.players[1].mz=[scnFoe];
ensureCardUid(gameState,scnFoe);
let scnCtx=C(0,scn,'sz',0,'activate',{});
ok('シンクロ・コントロール positive: 自分にシンクロがいなければ発動できる',
   sc('シンクロ・コントロール').condition(scnCtx)===true);
let scnLp=gameState.players[0].lp;
sc('シンクロ・コントロール').cost(scnCtx,()=>{});
ok('シンクロ・コントロール positive: 1000ライフを払う',
   gameState.players[0].lp===scnLp-1000);
scnCtx.selectedTargets=[h(scnFoe)];
sc('シンクロ・コントロール').resolve(scnCtx);
ok('シンクロ・コントロール card-specific: コントロールを得る',
   gameState.players[0].mz.some(c=>c&&c.uid===scnFoe.uid),
   'mine='+gameState.players[0].mz.length);
ok('シンクロ・コントロール card-specific: エンドフェイズに戻る予約が state に残る',
   findCardByUid(scnFoe.uid).card.controlReturnTo===1);
reset0();
let scn2=mk('シンクロ・コントロール',0),scn2Mine=mk(SYN,0),scn2Foe=mk(SYN,1);
gameState.players[0].sz=[scn2];gameState.players[0].mz=[scn2Mine];
gameState.players[1].mz=[scn2Foe];
ok('シンクロ・コントロール negative: 自分フィールドにシンクロがいると発動できない',
   sc('シンクロ・コントロール').condition(C(0,scn2,'sz',0,'activate',{}))===false);
reset0();
let scn3=mk('シンクロ・コントロール',0),scn3Foe=mk(SYN,1);
gameState.players[0].sz=[scn3];gameState.players[0].grave=[mk(SYN,0)];
gameState.players[1].mz=[scn3Foe];
ok('シンクロ・コントロール ruling: 自分の墓地にシンクロがいても発動できない',
   sc('シンクロ・コントロール').condition(C(0,scn3,'sz',0,'activate',{}))===false);

/* ================= passive / continuous は read-only ================= */
reset0();
gameState.phase='battle';
let roBt=mk('コアキメイル・ビートル',0),roSk=mk('サテライト・キャノン',0),roFoe=mk(BIG,1);
gameState.players[0].mz=[roBt,roSk];gameState.players[1].mz=[roFoe];
gameState.battle={player:0,atkIdx:0,target:0};
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
curATK(roBt);curATK(roSk);
protectionRecordV21(gameState,roSk,{cause:'battle'});
ok('cycle30 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);
gameState.battle=null;

/* ================= Replay / SaveLoad ================= */
reset0();
upkeepEnd();
let rp1=mk('サテライト・キャノン',0);
gameState.players[0].mz=[rp1];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
sc('サテライト・キャノン').resolve(C(0,rp1,'mz',0,'activate',{}));
let rq1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle30 Replay: エンドフェイズの攻撃力アップが digest 一致で再生される',rq1.ok,rq1.reason||'');
reset0();
let rp2=mk('エレキジ',0),rp2Foe=mk(BIG,1);
gameState.players[0].mz=[rp2];gameState.players[1].mz=[rp2Foe];
ensureCardUid(gameState,rp2);ensureCardUid(gameState,rp2Foe);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let rp2Ctx=ctxEv(0,rp2,'onDirectBattleDamage',
  {player:1,amount:1000,direct:true,attackerUid:rp2.uid},'mz');
rp2Ctx.selectedTargets=[h(rp2Foe)];
sc('エレキジ').resolve(rp2Ctx);
let rq2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle30 Replay: 除外＋エンドフェイズ予約が digest 一致で再生される',rq2.ok,rq2.reason||'');
let snap30=JSON.stringify(gameState);
ok('cycle30 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap30))===snap30);
ok('cycle30 直列化: 予約に関数が入っていない',snap30.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
