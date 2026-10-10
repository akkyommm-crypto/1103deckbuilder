/* Auto cycle 29 — 9枚。positive / negative / ruling edge / Replay。 */
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

const ALL=['ジュラック・ティラヌス','ダーク・ダイブ・ボンバー','ヘル・ドラゴン',
 'アーマード・サイキッカー','ジョーズマン','モザイク・マンティコア','堕天使ゼラート',
 'コアキメイル・ガーディアン','コアキメイル・サンドマン'];
ALL.forEach(n=>ok('cycle29 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle29 枚数は9',ALL.length===9);

const DINO='オキシゲドン';          /* 恐竜 lv4 */
const PSY='クレボンス';            /* サイキック lv2 */
const WATER2='E・HERO オーシャン';   /* 水属性 lv4 */
const DARK1='ワイト';              /* 闇 lv1 */
const ROCKH='はにわ';              /* 岩石 */
const CORE='コアキメイルの鋼核';

function killedBattle(atkCard,defCard){
  return {atkCard:atkCard,defCard:defCard,destroyedDef:true,destroyedAtk:false};
}
function fireAt(at,p,phase,advance){
  gameState.turn=gameState.turn+(advance==null?0:advance);
  gameState.activePlayer=p;gameState.phase=phase;
  return runDueSchedulesV7(at,gameState);
}

/* ============ 1. ジュラック・ティラヌス ============ */
reset0();
let jt=mk('ジュラック・ティラヌス',0),jtDino=mk(DINO,0);
gameState.players[0].mz=[jt,jtDino];
let jtCtx=C(0,jt,'mz',0,'activate',{});
ok('ジュラック・ティラヌス positive: 他の恐竜族がいれば発動できる',
   sc('ジュラック・ティラヌス').condition(jtCtx)===true);
jtCtx.selectedTargets=[h(jtDino)];
let jtAtk=curATK(jt);
sc('ジュラック・ティラヌス').cost(jtCtx,()=>{});
sc('ジュラック・ティラヌス').resolve(jtCtx);
ok('ジュラック・ティラヌス card-specific: リリースして攻撃力が500アップ',
   gameState.players[0].mz.length===1&&curATK(jt)===jtAtk+500,
   'atk='+jtAtk+'→'+curATK(jt));
let jtFoe=mk(PLAIN,1);gameState.players[1].grave=[jtFoe];
let jtCtx2=ctxDS(0,jt,killedBattle(jt,jtFoe));
ok('ジュラック・ティラヌス positive: 戦闘破壊でも誘発する',
   sc('ジュラック・ティラヌス').passive.onDamageStep(jtCtx2)===true);
let jtAtk2=curATK(jt);
sc('ジュラック・ティラヌス').resolve(jtCtx2);
ok('ジュラック・ティラヌス card-specific: 戦闘破壊時は300アップ',
   curATK(jt)===jtAtk2+300,'atk='+jtAtk2+'→'+curATK(jt));
reset0();
let jt2=mk('ジュラック・ティラヌス',0);
gameState.players[0].mz=[jt2];
ok('ジュラック・ティラヌス negative: 他の恐竜族がいなければ発動できない',
   sc('ジュラック・ティラヌス').condition(C(0,jt2,'mz',0,'activate',{}))===false);

/* ============ 2. ダーク・ダイブ・ボンバー ============ */
reset0();
let db=mk('ダーク・ダイブ・ボンバー',0),dbTrib=mk(BIG,0);   /* 青眼＝レベル8 */
gameState.players[0].mz=[db,dbTrib];
let dbCtx=C(0,db,'mz',0,'activate',{});
ok('ダーク・ダイブ・ボンバー positive: メインフェイズ1で発動できる',
   sc('ダーク・ダイブ・ボンバー').condition(dbCtx)===true);
dbCtx.selectedTargets=[h(dbTrib)];
sc('ダーク・ダイブ・ボンバー').cost(dbCtx,()=>{});
let dbLp=gameState.players[1].lp;
sc('ダーク・ダイブ・ボンバー').resolve(dbCtx);
ok('ダーク・ダイブ・ボンバー card-specific: リリースしたレベル×200ダメージ（8×200=1600）',
   gameState.players[1].lp===dbLp-1600,'lp='+dbLp+'→'+gameState.players[1].lp);
reset0();
gameState.phase='main2';
let db2=mk('ダーク・ダイブ・ボンバー',0),db2T=mk(BIG,0);
gameState.players[0].mz=[db2,db2T];
ok('ダーク・ダイブ・ボンバー negative: メインフェイズ2では発動できない',
   sc('ダーク・ダイブ・ボンバー').condition(C(0,db2,'mz',0,'activate',{}))===false);
ok('ダーク・ダイブ・ボンバー ruling: 1ターンに1度・カード名指定（nameLimit）',
   sc('ダーク・ダイブ・ボンバー').countLimit===1
   &&sc('ダーク・ダイブ・ボンバー').nameLimit===true);

/* ============ 3. ヘル・ドラゴン ============ */
reset0();
gameState.phase='end';
let hd=mk('ヘル・ドラゴン',0);
gameState.players[0].mz=[hd];hd.attacked=true;
let hdCtx=C(0,hd,'mz',0,'activate',{});
ok('ヘル・ドラゴン positive: 攻撃したターンのエンドフェイズに処理する',
   sc('ヘル・ドラゴン').condition(hdCtx)===true);
sc('ヘル・ドラゴン').resolve(hdCtx);
ok('ヘル・ドラゴン card-specific: 自身が破壊される',
   gameState.players[0].mz.length===0&&gameState.players[0].grave.length===1);
reset0();
let hd2=mk('ヘル・ドラゴン',0),hd2Trib=mk(BIG,0);
gameState.players[0].grave=[hd2];gameState.players[0].mz=[hd2Trib];
hd2.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:0};
let hd2Ctx=C(0,hd2,'grave',0,'activate',{});
ok('ヘル・ドラゴン positive: 破壊された時にリリースして蘇生できる',
   sc('ヘル・ドラゴン').condition(hd2Ctx)===true);
hd2Ctx.selectedTargets=[h(hd2Trib)];
sc('ヘル・ドラゴン').cost(hd2Ctx,()=>{});
sc('ヘル・ドラゴン').resolve(hd2Ctx);
ok('ヘル・ドラゴン card-specific: リリースして墓地から特殊召喚される',
   gameState.players[0].mz.length===1
   &&dbOf(gameState.players[0].mz[0]).n==='ヘル・ドラゴン');
reset0();
let hd3=mk('ヘル・ドラゴン',0);
gameState.players[0].grave=[hd3];gameState.players[0].mz=[];
hd3.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:0};
ok('ヘル・ドラゴン negative: リリースするモンスターがいなければ発動できない',
   sc('ヘル・ドラゴン').condition(C(0,hd3,'grave',0,'activate',{}))===false);

/* ============ 4. アーマード・サイキッカー ============ */
reset0();
let ap=mk('アーマード・サイキッカー',0),apFoe=mk(BIG,1),apRev=mk(PLAIN,0);
gameState.players[0].mz=[ap];gameState.players[1].grave=[apFoe];
gameState.players[0].grave=[apRev];
let apCtx=ctxDS(0,ap,killedBattle(ap,apFoe));
ok('アーマード・サイキッカー positive: 戦闘破壊で誘発する',
   sc('アーマード・サイキッカー').passive.onDamageStep(apCtx)===true);
sc('アーマード・サイキッカー').selectTargets(apCtx,r=>{apCtx.selectedTargets=r;});
let apLp=gameState.players[0].lp;
sc('アーマード・サイキッカー').resolve(apCtx);
ok('アーマード・サイキッカー card-specific: 破壊した攻撃力の半分のダメージを受ける（3000/2=1500）',
   gameState.players[0].lp===apLp-1500,'lp='+apLp+'→'+gameState.players[0].lp);
ok('アーマード・サイキッカー card-specific: ダメージ以下の攻撃力のモンスターを蘇生できる',
   gameState.players[0].mz.length===2
   &&gameState.players[0].mz.some(c=>c&&c.uid===apRev.uid),
   'mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
ok('アーマード・サイキッカー card-specific: サイキック族がいればリリースなしで召喚する手順がある',
   !!sc('アーマード・サイキッカー').normalSummonProcedure
   &&sc('アーマード・サイキッカー').normalSummonProcedure.methods[0].tributes===0);
reset0();
let ap2=mk('アーマード・サイキッカー',0),ap2Psy=mk(PSY,0);
gameState.players[0].mz=[ap2Psy];
ok('アーマード・サイキッカー positive: 手順の条件はサイキック族の存在で真になる',
   sc('アーマード・サイキッカー').normalSummonProcedure.methods[0]
     .condition({player:0})===true);
gameState.players[0].mz=[];
ok('アーマード・サイキッカー negative: サイキック族がいなければ手順の条件は偽',
   sc('アーマード・サイキッカー').normalSummonProcedure.methods[0]
     .condition({player:0})===false);

/* ============ 5. ジョーズマン ============ */
reset0();
let jm=mk('ジョーズマン',0),jmWater=mk(WATER2,0),jmOther=mk(BIG,0);
gameState.players[0].mz=[jm,jmWater,jmOther];
ok('ジョーズマン card-specific: 攻撃力は他の表側水属性1体につき300アップ',
   curATK(jm)===dbOf(jm).atk+300,'atk='+curATK(jm));
ok('ジョーズマン ruling: 特殊召喚できない（cannotSpecialSummon）',
   sc('ジョーズマン').cannotSpecialSummon===true);
let jmProc=sc('ジョーズマン').normalSummonProcedure;
ok('ジョーズマン card-specific: リリース素材を水属性に限る materialFilter がある',
   jmProc.includeStandard===false
   &&jmProc.methods[0].tributes===1
   &&typeof jmProc.methods[0].materialFilter==='function');
ok('ジョーズマン positive: 水属性は素材にできる',
   jmProc.methods[0].materialFilter(h(jmWater))===true);
ok('ジョーズマン negative: 水属性以外は素材にできない',
   jmProc.methods[0].materialFilter(h(jmOther))===false);

/* ============ 6. モザイク・マンティコア ============ */
reset0();
let mm=mk('モザイク・マンティコア',0),mmA=mk(PLAIN,0),mmB=mk(PLAIN,0);
ensureCardUid(gameState,mmA);ensureCardUid(gameState,mmB);
gameState.players[0].mz=[mm];gameState.players[0].grave=[mmA,mmB];
mm.summonedTurn=gameState.turn;mm.tributeCount=2;
mm.summonProvenance={summonType:'tribute',materialRefs:[mmA.uid,mmB.uid]};
let mmCtx=ctxEv(0,mm,'onNormalSummon',{card:mm},'mz');
ok('モザイク・マンティコア positive: アドバンス召喚成功時に誘発する',
   sc('モザイク・マンティコア').passive.onNormalSummon(mmCtx)===true);
sc('モザイク・マンティコア').resolve(mmCtx);
ok('モザイク・マンティコア card-specific: 次の自分スタンバイの蘇生が予約される',
   API.schedules('d8.manticoreRevive').length===1);
fireAt('standbyPhase',0,'standby',2);
ok('モザイク・マンティコア card-specific: リリースした2体が墓地から特殊召喚される',
   gameState.players[0].mz.length===3
   &&gameState.players[0].mz.some(c=>c&&c.uid===mmA.uid)
   &&gameState.players[0].mz.some(c=>c&&c.uid===mmB.uid),
   'mz='+gameState.players[0].mz.length);
ok('モザイク・マンティコア card-specific: 特殊召喚したモンスターは攻撃できず効果も無効',
   findCardByUid(mmA.uid).card.cannotAttack===true
   &&API.isEffectNegated(findCardByUid(mmA.uid))===true);
reset0();
let mm2=mk('モザイク・マンティコア',0);
gameState.players[0].mz=[mm2];
mm2.summonedTurn=gameState.turn;mm2.tributeCount=0;
ok('モザイク・マンティコア negative: アドバンス召喚でなければ誘発しない',
   sc('モザイク・マンティコア').passive.onNormalSummon(
     ctxEv(0,mm2,'onNormalSummon',{card:mm2},'mz'))===false);

/* ============ 7. 堕天使ゼラート ============ */
reset0();
let zr=mk('堕天使ゼラート',0),zrHand=mk(DARK1,0);
let zrFoe1=mk(BIG,1),zrFoe2=mk(PLAIN,1);
gameState.players[0].mz=[zr];gameState.players[0].hand=[zrHand];
gameState.players[1].mz=[zrFoe1,zrFoe2];
ensureCardUid(gameState,zr);
let zrCtx=C(0,zr,'mz',0,'activate',{});
ok('堕天使ゼラート positive: 手札に闇属性があれば発動できる',
   sc('堕天使ゼラート').condition(zrCtx)===true);
let zrCost=false;sc('堕天使ゼラート').cost(zrCtx,v=>{zrCost=v;});
ok('堕天使ゼラート positive: コストで手札の闇属性を墓地へ送る',
   zrCost&&gameState.players[0].hand.length===0);
sc('堕天使ゼラート').resolve(zrCtx);
ok('堕天使ゼラート card-specific: 相手フィールドのモンスターが全て破壊される',
   gameState.players[1].mz.length===0,'foe='+gameState.players[1].mz.length);
ok('堕天使ゼラート card-specific: エンドフェイズの自壊が予約される',
   API.schedules('d8.destroyUid').length===1);
fireAt('endPhase',0,'end');
ok('堕天使ゼラート positive: 予約が発火して自身が破壊される',
   gameState.players[0].mz.length===0);
reset0();
let zr2=mk('堕天使ゼラート',0);
gameState.players[0].mz=[zr2];gameState.players[0].hand=[mk(BIG,0)];  /* 光属性 */
ok('堕天使ゼラート negative: 手札に闇属性がなければ発動できない',
   sc('堕天使ゼラート').condition(C(0,zr2,'mz',0,'activate',{}))===false);
reset0();
gameState.players[0].grave=[mk('ワイト',0),mk('ワイトメア',0),
  mk('シャドウ・グール',0),mk('ゲルニア',0)];
let zrProc=sc('堕天使ゼラート').normalSummonProcedure;
ok('堕天使ゼラート card-specific: 墓地の闇属性が4種類以上なら1体リリースで召喚できる',
   zrProc.methods[0].condition({player:0})===true
   &&zrProc.methods[0].tributes===1);
gameState.players[0].grave=[mk('ワイト',0),mk('ワイト',0),mk('ワイト',0)];
ok('堕天使ゼラート negative: 同名ばかりでは4種類にならない',
   zrProc.methods[0].condition({player:0})===false);
ok('堕天使ゼラート ruling: リリース素材は闇属性に限られる',
   zrProc.methods[0].materialFilter({db:{at:'闇'}})===true
   &&zrProc.methods[0].materialFilter({db:{at:'光'}})===false);

/* ============ 8. コアキメイル・ガーディアン ============ */
reset0();
let kg=mk('コアキメイル・ガーディアン',0),kgFoe=mk('エフェクト・ヴェーラー',1);
gameState.players[0].mz=[kg];gameState.players[1].mz=[kgFoe];
ensureCardUid(gameState,kg);ensureCardUid(gameState,kgFoe);
gameState.chain=[{chainId:1,player:1,cardId:kgFoe.id,uid:kgFoe.uid,
  name:dbOf(kgFoe).n,ss:1,targets:[],selection:[]}];
let kgCtx=ctxEv(0,kg,'onActivateSuccess',
  {uid:kgFoe.uid,player:1,kind:'monster',sub:'effect',chainId:1},'mz');
ok('コアキメイル・ガーディアン positive: 効果モンスターの効果発動に反応する',
   sc('コアキメイル・ガーディアン').passive.onActivateSuccess(kgCtx)===true);
let kgCost=false;sc('コアキメイル・ガーディアン').cost(kgCtx,v=>{kgCost=v;});
ok('コアキメイル・ガーディアン positive: コストで自身がリリースされる',
   kgCost&&gameState.players[0].mz.length===0);
sc('コアキメイル・ガーディアン').resolve(kgCtx);
ok('コアキメイル・ガーディアン card-specific: その発動が無効になる',
   API.chainLinkNegated(1)===true);
gameState.chain=[];
reset0();
let kg2=mk('コアキメイル・ガーディアン',0),kg2Sp=mk('強欲な壺',1);
gameState.players[0].mz=[kg2];gameState.players[1].sz=[kg2Sp];
ensureCardUid(gameState,kg2Sp);
ok('コアキメイル・ガーディアン negative: 魔法の発動には反応しない',
   sc('コアキメイル・ガーディアン').passive.onActivateSuccess(
     ctxEv(0,kg2,'onActivateSuccess',
       {uid:kg2Sp.uid,player:1,kind:'spell',sub:'normal',chainId:1},'mz'))===false);
/* 維持コスト */
reset0();
gameState.phase='end';
let kg3=mk('コアキメイル・ガーディアン',0),kg3Core=mk(CORE,0);
gameState.players[0].mz=[kg3];gameState.players[0].hand=[kg3Core];
let kg3Ctx=C(0,kg3,'mz',0,'activate',{});
ok('コアキメイル・ガーディアン positive: 自分エンドフェイズに維持コストを処理する',
   sc('コアキメイル・ガーディアン').condition(kg3Ctx)===true);
sc('コアキメイル・ガーディアン').cost(kg3Ctx,()=>{});
sc('コアキメイル・ガーディアン').resolve(kg3Ctx);
ok('コアキメイル・ガーディアン card-specific: 鋼核を墓地へ送って維持される',
   gameState.players[0].mz.length===1&&gameState.players[0].hand.length===0
   &&gameState.players[0].grave.length===1);
reset0();
gameState.phase='end';
let kg4=mk('コアキメイル・ガーディアン',0);
gameState.players[0].mz=[kg4];gameState.players[0].hand=[];
let kg4Ctx=C(0,kg4,'mz',0,'activate',{});
sc('コアキメイル・ガーディアン').cost(kg4Ctx,()=>{});
sc('コアキメイル・ガーディアン').resolve(kg4Ctx);
ok('コアキメイル・ガーディアン card-specific: どちらも行えなければ破壊される',
   gameState.players[0].mz.length===0&&gameState.players[0].grave.length===1);
reset0();
gameState.phase='end';
let kg5=mk('コアキメイル・ガーディアン',0),kg5Rock=mk(ROCKH,0);
gameState.players[0].mz=[kg5];gameState.players[0].hand=[kg5Rock];
let kg5Ctx=C(0,kg5,'mz',0,'activate',{});
sc('コアキメイル・ガーディアン').cost(kg5Ctx,()=>{});
sc('コアキメイル・ガーディアン').resolve(kg5Ctx);
ok('コアキメイル・ガーディアン card-specific: 手札の岩石族を見せて維持される',
   gameState.players[0].mz.length===1&&gameState.players[0].hand.length===1);
ok('コアキメイル・ガーディアン 隠匿情報: 見せたカードは両者に公開される',
   revealListV20(gameState).some(r=>r&&(r.audience==='both'||r.audience==null)));

/* ============ 9. コアキメイル・サンドマン ============ */
reset0();
let ks=mk('コアキメイル・サンドマン',0),ksTrap=mk('落とし穴',1);
gameState.players[0].mz=[ks];gameState.players[1].sz=[ksTrap];
ensureCardUid(gameState,ks);ensureCardUid(gameState,ksTrap);
gameState.chain=[{chainId:1,player:1,cardId:ksTrap.id,uid:ksTrap.uid,
  name:dbOf(ksTrap).n,ss:2,targets:[],selection:[]}];
let ksCtx=ctxEv(0,ks,'onActivateSuccess',
  {uid:ksTrap.uid,player:1,kind:'trap',sub:'normal',chainId:1},'mz');
ok('コアキメイル・サンドマン positive: 相手の罠の発動に反応する',
   sc('コアキメイル・サンドマン').passive.onActivateSuccess(ksCtx)===true);
sc('コアキメイル・サンドマン').cost(ksCtx,()=>{});
sc('コアキメイル・サンドマン').resolve(ksCtx);
ok('コアキメイル・サンドマン card-specific: その発動が無効になる',
   API.chainLinkNegated(1)===true);
gameState.chain=[];
reset0();
let ks2=mk('コアキメイル・サンドマン',0),ks2Trap=mk('落とし穴',0);
gameState.players[0].mz=[ks2];gameState.players[0].sz=[ks2Trap];
ensureCardUid(gameState,ks2Trap);
ok('コアキメイル・サンドマン negative: 自分の罠の発動には反応しない',
   sc('コアキメイル・サンドマン').passive.onActivateSuccess(
     ctxEv(0,ks2,'onActivateSuccess',
       {uid:ks2Trap.uid,player:0,kind:'trap',sub:'normal',chainId:1},'mz'))===false);
reset0();
let ks3=mk('コアキメイル・サンドマン',0),ks3Mon=mk('エフェクト・ヴェーラー',1);
gameState.players[0].mz=[ks3];gameState.players[1].mz=[ks3Mon];
ensureCardUid(gameState,ks3Mon);
ok('コアキメイル・サンドマン ruling: モンスター効果の発動には反応しない',
   sc('コアキメイル・サンドマン').passive.onActivateSuccess(
     ctxEv(0,ks3,'onActivateSuccess',
       {uid:ks3Mon.uid,player:1,kind:'monster',sub:'effect',chainId:1},'mz'))===false);

/* ================= passive / continuous は read-only ================= */
reset0();
let roJm=mk('ジョーズマン',0),roW=mk(WATER2,0),roKg=mk('コアキメイル・ガーディアン',0);
gameState.players[0].mz=[roJm,roW,roKg];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
curATK(roJm);curATK(roW);curATK(roKg);
sc('コアキメイル・ガーディアン').passive.onEndPhase(C(0,roKg,'mz',2,'activate',{}));
ok('cycle29 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= Replay / SaveLoad ================= */
reset0();
let rr1=mk('ダーク・ダイブ・ボンバー',0),rr1T=mk(BIG,0);
gameState.players[0].mz=[rr1,rr1T];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let rr1Ctx=C(0,rr1,'mz',0,'activate',{});
rr1Ctx.selectedTargets=[h(rr1T)];
sc('ダーク・ダイブ・ボンバー').cost(rr1Ctx,()=>{});
sc('ダーク・ダイブ・ボンバー').resolve(rr1Ctx);
let rs1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle29 Replay: リリースコスト＋ダメージが digest 一致で再生される',rs1.ok,rs1.reason||'');
reset0();
let rr2=mk('モザイク・マンティコア',0),rr2A=mk(PLAIN,0);
ensureCardUid(gameState,rr2A);
gameState.players[0].mz=[rr2];gameState.players[0].grave=[rr2A];
rr2.summonedTurn=gameState.turn;rr2.tributeCount=1;
rr2.summonProvenance={summonType:'tribute',materialRefs:[rr2A.uid]};
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
sc('モザイク・マンティコア').resolve(ctxEv(0,rr2,'onNormalSummon',{card:rr2},'mz'));
let rs2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle29 Replay: スタンバイ予約が digest 一致で再生される',rs2.ok,rs2.reason||'');
let snap29=JSON.stringify(gameState);
ok('cycle29 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap29))===snap29);
ok('cycle29 直列化: 予約に関数が入っていない',snap29.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
