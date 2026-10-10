/* Auto cycle 25 — 13枚。positive / negative / ruling edge / Replay。 */
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

const ALL=['D－HERO ダブルガイ','グラッジ','おとぼけオポッサム','サクリファイス・ロータス',
 'シンクロ・ガンナー','テレポンD.D.','ダーク・ネフティス','異次元の精霊',
 'X－セイバー パシウル','ウェポンチェンジ','愚鈍の斧','疫病','バトルマニア'];
ALL.forEach(n=>ok('cycle25 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle25 枚数は13',ALL.length===13);

const WARRIOR='ジャンク・シンクロン';   /* 戦士族 */
const PSYCHIC='クレボンス';            /* サイキック族 ATK1200 */

/* 予約を「次の自分のスタンバイフェイズ」まで進めて実行する */
function fireStandby(p,advance){
  gameState.turn=gameState.turn+(advance==null?2:advance);
  gameState.activePlayer=p;gameState.phase='standby';
  return runDueSchedulesV7('standbyPhase',gameState);
}

/* ============ 1. D－HERO ダブルガイ ============ */
reset0();
let dg=mk('D－HERO ダブルガイ',0);
gameState.players[0].grave=[dg];
dg.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
/* S03-U146: ダブルガイ now listens to onDestroy only (one destruction raised onDestroy + onSendToGrave and activated it twice) */
let dgCtx=ctxEv(0,dg,'onDestroy',{},'grave');
ok('D－HERO ダブルガイ positive: 破壊され墓地へ送られた場合に誘発する',
   sc('D－HERO ダブルガイ').passive.onDestroy(dgCtx)===true);
sc('D－HERO ダブルガイ').resolve(dgCtx);
ok('D－HERO ダブルガイ positive: 次の自分のスタンバイに予約される',
   API.schedules('d4.tokens').length===1);
ok('D－HERO ダブルガイ card-specific: 予約が発火してトークン2体が出る',
   fireStandby(0)===1&&gameState.players[0].mz.length===2
   &&API.isToken(h(gameState.players[0].mz[0])),
   'mz='+gameState.players[0].mz.length);
ok('D－HERO ダブルガイ ruling: 特殊召喚できない（cannotSpecialSummon）',
   sc('D－HERO ダブルガイ').cannotSpecialSummon===true);
ok('D－HERO ダブルガイ card-specific: 1度のバトルフェイズ中に2回攻撃できる',
   attackLimitV48(dg)===2,'limit='+attackLimitV48(dg));
reset0();
let dg2=mk('D－HERO ダブルガイ',0);
gameState.players[0].grave=[dg2];
dg2.graveInfo={turn:gameState.turn,from:'hand',byDestroy:false,byPlayer:null};
ok('D－HERO ダブルガイ negative: 破壊以外で墓地へ行っても誘発しない',
   sc('D－HERO ダブルガイ').passive.onDestroy(
     ctxEv(0,dg2,'onDestroy',{},'grave'))===false);

/* ============ 2. グラッジ ============ */
reset0();
let gr=mk('グラッジ',0);
gameState.players[0].mz=[gr];ensureCardUid(gameState,gr);
let grCtx=ctxEv(0,gr,'onBattleDamage',{player:1,amount:800,attackerUid:gr.uid},'mz');
ok('グラッジ positive: 相手に戦闘ダメージを与えた場合に誘発する',
   sc('グラッジ').passive.onBattleDamage(grCtx)===true);
sc('グラッジ').resolve(grCtx);
ok('グラッジ positive: 次の自分のスタンバイに予約される',
   API.schedules('d4.pumpUid').length===1);
let grBefore=curATK(gr);
fireStandby(0);
ok('グラッジ card-specific: 予約が発火して攻撃力が1000アップする',
   curATK(gr)===grBefore+1000,'atk='+grBefore+'→'+curATK(gr));
ok('グラッジ card-specific: 直接攻撃できる（canDirectAttack）',
   sc('グラッジ').canDirectAttack===true);
reset0();
let gr2=mk('グラッジ',0);
gameState.players[0].mz=[gr2];ensureCardUid(gameState,gr2);
ok('グラッジ negative: 自分がダメージを受けても誘発しない',
   sc('グラッジ').passive.onBattleDamage(
     ctxEv(0,gr2,'onBattleDamage',{player:0,amount:800,attackerUid:gr2.uid},'mz'))===false);

/* ============ 3. おとぼけオポッサム ============ */
reset0();
let op=mk('おとぼけオポッサム',0),opFoe=mk(BIG,1);
gameState.players[0].mz=[op];gameState.players[1].mz=[opFoe];
let opCtx=C(0,op,'mz',0,'activate',{});
ok('おとぼけオポッサム positive: 攻撃力の高い相手モンスターがいれば発動できる',
   sc('おとぼけオポッサム').condition(opCtx)===true);
sc('おとぼけオポッサム').resolve(opCtx);
ok('おとぼけオポッサム positive: 自身が破壊され墓地へ行く',
   gameState.players[0].mz.length===0&&gameState.players[0].grave.length===1);
gameState.phase='standby';gameState.activePlayer=0;
let opGrave=gameState.players[0].grave[0];
let opCtx2=C(0,opGrave,'grave',0,'activate',{});
ok('おとぼけオポッサム card-specific: この効果で破壊された印が墓地でも読める',
   Number(opGrave.d4OpossumSelfKill)===gameState.turn
   &&sc('おとぼけオポッサム').condition(opCtx2)===true);
sc('おとぼけオポッサム').resolve(opCtx2);
ok('おとぼけオポッサム positive: 自分のスタンバイに墓地から特殊召喚できる',
   gameState.players[0].mz.length===1);
reset0();
let op2=mk('おとぼけオポッサム',0),opSmall=mk(PLAIN,1);
gameState.players[0].mz=[op2];gameState.players[1].mz=[opSmall];
ok('おとぼけオポッサム negative: 攻撃力の高い相手モンスターがいなければ発動できない',
   sc('おとぼけオポッサム').condition(C(0,op2,'mz',0,'activate',{}))===false);
reset0();
gameState.phase='standby';
let op3=mk('おとぼけオポッサム',0);
gameState.players[0].grave=[op3];
op3.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
ok('おとぼけオポッサム ruling: 他の理由で破壊された場合は特殊召喚できない',
   sc('おとぼけオポッサム').condition(C(0,op3,'grave',0,'activate',{}))===false);

/* ============ 4. サクリファイス・ロータス ============ */
reset0();
gameState.phase='end';
let sl=mk('サクリファイス・ロータス',0);
gameState.players[0].grave=[sl];gameState.players[0].sz=[];
let slCtx=C(0,sl,'grave',0,'activate',{});
ok('サクリファイス・ロータス positive: エンドフェイズに魔法・罠が無ければ発動できる',
   sc('サクリファイス・ロータス').condition(slCtx)===true);
sc('サクリファイス・ロータス').resolve(slCtx);
ok('サクリファイス・ロータス positive: 墓地から特殊召喚される',
   gameState.players[0].mz.length===1);
gameState.phase='standby';gameState.activePlayer=0;
let slOn=gameState.players[0].mz[0];
let slCtx2=C(0,slOn,'mz',0,'activate',{});
ok('サクリファイス・ロータス card-specific: 自分のスタンバイに誘発する',
   sc('サクリファイス・ロータス').passive.onStandbyPhase(
     ctxEv(0,slOn,'onStandbyPhase',{},'mz'))===true);
let slLp=gameState.players[0].lp;
sc('サクリファイス・ロータス').resolve(slCtx2);
ok('サクリファイス・ロータス card-specific: コントローラーが1000ダメージを受ける',
   gameState.players[0].lp===slLp-1000,'lp='+slLp+'→'+gameState.players[0].lp);
reset0();
gameState.phase='end';
let sl2=mk('サクリファイス・ロータス',0);
gameState.players[0].grave=[sl2];gameState.players[0].sz=[mk('強欲な壺',0)];
ok('サクリファイス・ロータス negative: 自分の魔法・罠があると特殊召喚できない',
   sc('サクリファイス・ロータス').condition(C(0,sl2,'grave',0,'activate',{}))===false);

/* ============ 5. シンクロ・ガンナー ============ */
reset0();
let sg=mk('シンクロ・ガンナー',0);
let syn=mk('C・ドラゴン',0);syn.properlySummonedS03=true;/* S03-U127: a Synchro Monster can be Special Summoned from the GY / banishment only after a proper summon — this setup card stands for one that was properly Synchro Summoned earlier */
gameState.players[0].mz=[sg,syn];ensureCardUid(gameState,syn);
let sgCtx=C(0,sg,'mz',0,'activate',{});
ok('シンクロ・ガンナー positive: メインフェイズ1でシンクロがいれば発動できる',
   sc('シンクロ・ガンナー').condition(sgCtx)===true);
sgCtx.selectedTargets=[h(syn)];
let sgLp=gameState.players[1].lp;
sc('シンクロ・ガンナー').resolve(sgCtx);
ok('シンクロ・ガンナー positive: シンクロが除外され600ダメージ',
   gameState.players[0].banish.length===1&&gameState.players[1].lp===sgLp-600);
ok('シンクロ・ガンナー positive: 次の自分のスタンバイに戻る予約が入る',
   API.schedules('d4.returnBanishedUid').length===1);
fireStandby(0);
ok('シンクロ・ガンナー card-specific: 予約が発火して除外したシンクロが戻る',
   gameState.players[0].banish.length===0
   &&gameState.players[0].mz.some(c=>c&&c.uid===syn.uid),
   'mz='+gameState.players[0].mz.length);
reset0();
gameState.phase='main2';
let sg2=mk('シンクロ・ガンナー',0),syn2=mk('C・ドラゴン',0);
gameState.players[0].mz=[sg2,syn2];
ok('シンクロ・ガンナー negative: メインフェイズ2では発動できない',
   sc('シンクロ・ガンナー').condition(C(0,sg2,'mz',0,'activate',{}))===false);
ok('シンクロ・ガンナー ruling: 1ターンに1度（countLimit）',
   sc('シンクロ・ガンナー').countLimit===1);

/* ============ 6. テレポンD.D. ============ */
reset0();
let tp=mk('テレポンD.D.',0);
gameState.players[0].banish=[tp];ensureCardUid(gameState,tp);
gameState.players[0].deck=[mk(PSYCHIC,0),mk(BIG,0)];
let tpCtx=ctxEv(0,tp,'onLeaveField',{uid:tp.uid,toZone:'banish'},'banish');
ok('テレポンD.D. positive: 表側のこのカードが除外された場合に誘発する',
   sc('テレポンD.D.').passive.onLeaveField(tpCtx)===true);
sc('テレポンD.D.').selectTargets(tpCtx,r=>{tpCtx.selectedTargets=r;});
sc('テレポンD.D.').resolve(tpCtx);
ok('テレポンD.D. positive: デッキのサイキック族が除外される',
   gameState.players[0].banish.length===2&&gameState.players[0].deck.length===1);
ok('テレポンD.D. positive: 次の自分のスタンバイに特殊召喚が予約される',
   API.schedules('d4.returnBanishedUid').length===1);
fireStandby(0);
ok('テレポンD.D. card-specific: 予約が発火して除外したサイキック族が出る',
   gameState.players[0].mz.length===1
   &&dbOf(gameState.players[0].mz[0]).ra==='サイキック',
   'mz='+gameState.players[0].mz.length);
reset0();
let tp2=mk('テレポンD.D.',0);
gameState.players[0].banish=[tp2];ensureCardUid(gameState,tp2);
gameState.players[0].deck=[mk(BIG,0)];
ok('テレポンD.D. negative: デッキにサイキック族がいなければ誘発しない',
   sc('テレポンD.D.').passive.onLeaveField(
     ctxEv(0,tp2,'onLeaveField',{uid:tp2.uid,toZone:'banish'},'banish'))===false);
reset0();
let tp3=mk('テレポンD.D.',0);
gameState.players[0].grave=[tp3];ensureCardUid(gameState,tp3);
gameState.players[0].deck=[mk(PSYCHIC,0)];
ok('テレポンD.D. ruling: 墓地へ送られた場合は誘発しない（除外限定）',
   sc('テレポンD.D.').passive.onLeaveField(
     ctxEv(0,tp3,'onLeaveField',{uid:tp3.uid,toZone:'grave'},'grave'))===false);

/* ============ 7. ダーク・ネフティス ============ */
reset0();
let dn=mk('ダーク・ネフティス',0);
gameState.players[0].hand=[dn];ensureCardUid(gameState,dn);
gameState.players[0].grave=[mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0)];
let dnCtx=C(0,dn,'hand',0,'activate',{});
ok('ダーク・ネフティス positive: 墓地の闇属性が3体以上なら発動できる',
   sc('ダーク・ネフティス').condition(dnCtx)===true);
sc('ダーク・ネフティス').resolve(dnCtx);
ok('ダーク・ネフティス positive: 除外する2体の選択要求が出る',
   !!pending()&&pending().min===2&&pending().player===0);
API.answerChoice(pending().candidates.slice(0,2).map(c=>c.key));
ok('ダーク・ネフティス card-specific: 2体を除外し自身が手札から墓地へ行く',
   gameState.players[0].banish.length===2
   &&gameState.players[0].hand.length===0
   &&gameState.players[0].grave.some(c=>c&&c.uid===dn.uid),
   'banish='+gameState.players[0].banish.length);
ok('ダーク・ネフティス positive: 次の自分のスタンバイに蘇生が予約される',
   API.schedules('d4.reviveUid').length===1);
fireStandby(0);
ok('ダーク・ネフティス card-specific: 予約が発火して墓地から特殊召喚される',
   gameState.players[0].mz.some(c=>c&&c.uid===dn.uid));
reset0();
let dn2=mk('ダーク・ネフティス',0),dnFoeSt=mk('強欲な壺',1);
gameState.players[0].mz=[dn2];gameState.players[1].sz=[dnFoeSt];
ensureCardUid(gameState,dn2);
ok('ダーク・ネフティス positive: 特殊召喚成功時に魔法・罠破壊が誘発する',
   sc('ダーク・ネフティス').passive.onSpecialSummon(
     ctxEv(0,dn2,'onSpecialSummon',{uid:dn2.uid,kind:'effect'},'mz'))===true);
let dnCtx2=ctxEv(0,dn2,'onSpecialSummon',{uid:dn2.uid,kind:'effect'},'mz');
sc('ダーク・ネフティス').selectTargets(dnCtx2,r=>{dnCtx2.selectedTargets=r;});
sc('ダーク・ネフティス').resolve(dnCtx2);
ok('ダーク・ネフティス positive: フィールドの魔法・罠が破壊される',
   gameState.players[1].sz.length===0);
reset0();
let dn3=mk('ダーク・ネフティス',0);
gameState.players[0].hand=[dn3];
gameState.players[0].grave=[mk(PLAIN,0),mk(PLAIN,0)];
ok('ダーク・ネフティス negative: 墓地の闇属性が2体では発動できない',
   sc('ダーク・ネフティス').condition(C(0,dn3,'hand',0,'activate',{}))===false);

/* ============ 8. 異次元の精霊 ============ */
reset0();
let ij=mk('異次元の精霊',0),ijMon=mk(BIG,0);
gameState.players[0].hand=[ij];gameState.players[0].mz=[ijMon];
ensureCardUid(gameState,ijMon);
/* S03-U17: ①はチェーンを作らない特殊召喚手順（召喚ルール効果）。除外は手順の一部。 */
let ijCtx=C(0,ij,'hand',0,'summonProcedure',{});
ok('異次元の精霊 positive: 自分の表側モンスターがいれば特殊召喚手順を使える（発動する効果は持たない）',
   sc('異次元の精霊').summonProcedure.condition(ijCtx)===true&&typeof sc('異次元の精霊').resolve!=='function');
let ijCost=false;sc('異次元の精霊').summonProcedure.cost(ijCtx,v=>{ijCost=v;});
ok('異次元の精霊 positive: 手順で自分のモンスターが除外され、そのuidが記録される',
   ijCost&&gameState.players[0].banish.length===1&&gameState.players[0].mz.length===0&&!!ijCtx.procedureDataS03&&ijCtx.procedureDataS03.uid===ijMon.uid);
API.specialSummon(0,'hand',gameState.players[0].hand.indexOf(ij),'atk','異次元の精霊');
sc('異次元の精霊').summonProcedure.afterSummonS03(h(ij),ijCtx.procedureDataS03);
ok('異次元の精霊 positive: 手札から特殊召喚される',
   gameState.players[0].mz.some(c=>c&&dbOf(c).n==='異次元の精霊'));
ok('異次元の精霊 positive: 次のスタンバイに戻す予約が入る',
   API.schedules('d4.returnBanishedUid').length===1);
fireStandby(1,1);
ok('異次元の精霊 card-specific: 予約が発火して除外したモンスターが戻る',
   gameState.players[0].banish.length===0
   &&gameState.players[0].mz.some(c=>c&&c.uid===ijMon.uid),
   'mz='+gameState.players[0].mz.length);
reset0();
let ij2=mk('異次元の精霊',0);
gameState.players[0].hand=[ij2];gameState.players[0].mz=[];
ok('異次元の精霊 negative: 除外できる自分のモンスターがいなければ特殊召喚手順を使えない',
   sc('異次元の精霊').summonProcedure.condition(C(0,ij2,'hand',0,'summonProcedure',{}))===false);
reset0();
let ij3=mk('異次元の精霊',0),ij3Down=mk(BIG,0,'down','def');
gameState.players[0].hand=[ij3];gameState.players[0].mz=[ij3Down];
ok('異次元の精霊 ruling: 裏側表示のモンスターは除外対象にならない',
   sc('異次元の精霊').summonProcedure.condition(C(0,ij3,'hand',0,'summonProcedure',{}))===false);

/* ============ 9. X－セイバー パシウル ============ */
reset0();
let px=mk('X－セイバー パシウル',0,'up','def');
gameState.players[0].mz=[px];
gameState.activePlayer=1;gameState.phase='standby';
let pxCtx=C(0,px,'mz',0,'activate',{});
ok('X－セイバー パシウル positive: 相手スタンバイに表側守備なら発動する',
   sc('X－セイバー パシウル').condition(pxCtx)===true);
let pxLp=gameState.players[0].lp;
sc('X－セイバー パシウル').resolve(pxCtx);
ok('X－セイバー パシウル card-specific: 自分が1000ダメージを受ける',
   gameState.players[0].lp===pxLp-1000);
let pxProt=protectionRecordV21(gameState,px,{cause:'battle'});
ok('X－セイバー パシウル card-specific: 戦闘では破壊されない（protectV21）',
   !!pxProt&&pxProt.battle===true,'rec='+JSON.stringify(pxProt));
ok('X－セイバー パシウル ruling: 効果破壊は防がない',
   protectionRecordV21(gameState,px,{cause:'effect'})===null);
reset0();
let px2=mk('X－セイバー パシウル',0,'up','atk');
gameState.players[0].mz=[px2];
gameState.activePlayer=1;gameState.phase='standby';
ok('X－セイバー パシウル negative: 攻撃表示では発動しない',
   sc('X－セイバー パシウル').condition(C(0,px2,'mz',0,'activate',{}))===false);
reset0();
let px3=mk('X－セイバー パシウル',0,'up','def');
gameState.players[0].mz=[px3];
gameState.activePlayer=0;gameState.phase='standby';
ok('X－セイバー パシウル ruling: 自分のスタンバイでは発動しない',
   sc('X－セイバー パシウル').condition(C(0,px3,'mz',0,'activate',{}))===false);

/* ============ 10. ウェポンチェンジ ============ */
reset0();
gameState.phase='standby';
let wc=mk('ウェポンチェンジ',0),wcMon=mk(WARRIOR,0);
gameState.players[0].sz=[wc];gameState.players[0].mz=[wcMon];
let wcCtx=C(0,wc,'sz',0,'activate',{});
ok('ウェポンチェンジ positive: 自分のスタンバイに戦士族がいれば発動できる',
   sc('ウェポンチェンジ').condition(wcCtx)===true);
let wcLp=gameState.players[0].lp;
sc('ウェポンチェンジ').cost(wcCtx,()=>{});
ok('ウェポンチェンジ positive: 700ライフを払う',
   gameState.players[0].lp===wcLp-700);
let wcAtk=curATK(wcMon),wcDef=curDEF(wcMon);
wcCtx.selectedTargets=[h(wcMon)];
sc('ウェポンチェンジ').resolve(wcCtx);
ok('ウェポンチェンジ card-specific: 攻撃力と守備力が入れ替わる',
   curATK(wcMon)===wcDef&&curDEF(wcMon)===wcAtk,
   'atk='+wcAtk+'→'+curATK(wcMon)+' def='+wcDef+'→'+curDEF(wcMon));
reset0();
gameState.phase='main1';
let wc2=mk('ウェポンチェンジ',0),wc2Mon=mk(WARRIOR,0);
gameState.players[0].sz=[wc2];gameState.players[0].mz=[wc2Mon];
ok('ウェポンチェンジ negative: メインフェイズでは発動できない',
   sc('ウェポンチェンジ').condition(C(0,wc2,'sz',0,'activate',{}))===false);
reset0();
gameState.phase='standby';
let wc3=mk('ウェポンチェンジ',0);
gameState.players[0].sz=[wc3];gameState.players[0].mz=[mk(PLAIN,0)];
ok('ウェポンチェンジ ruling: 戦士族・機械族以外は対象にできない',
   sc('ウェポンチェンジ').condition(C(0,wc3,'sz',0,'activate',{}))===false);
ok('ウェポンチェンジ ruling: 1ターンに1度（countLimit）',
   sc('ウェポンチェンジ').countLimit===1);

/* ============ 11. 愚鈍の斧 ============ */
reset0();
let ax=mk('愚鈍の斧',0),axMon=mk('エフェクト・ヴェーラー',1);
gameState.players[0].sz=[ax];gameState.players[1].mz=[axMon];
let axCtx=C(0,ax,'sz',0,'activate',{});
ok('愚鈍の斧 positive: 表側モンスターがいれば発動できる',
   sc('愚鈍の斧').condition(axCtx)===true);
axCtx.selectedTargets=[h(axMon)];
sc('愚鈍の斧').resolve(axCtx);
ax.face='up';
ok('愚鈍の斧 positive: 装備され攻撃力が1000アップする',
   !!ax.equipTo&&curATK(axMon)===dbOf(axMon).atk+1000,'atk='+curATK(axMon));
ok('愚鈍の斧 card-specific: 装備モンスターの効果が無効化される（negateEffect）',
   effectNegated(axMon)===true);
gameState.phase='standby';gameState.activePlayer=0;
let axLp=gameState.players[1].lp;
sc('愚鈍の斧').resolve(C(0,ax,'sz',0,'activate',{}));
ok('愚鈍の斧 card-specific: 装備モンスターのコントローラーに500ダメージ',
   gameState.players[1].lp===axLp-500,'lp='+axLp+'→'+gameState.players[1].lp);
reset0();
let ax2=mk('愚鈍の斧',0);
gameState.players[0].sz=[ax2];gameState.players[0].mz=[];gameState.players[1].mz=[];
ok('愚鈍の斧 negative: 表側モンスターがいなければ発動できない',
   sc('愚鈍の斧').condition(C(0,ax2,'sz',0,'activate',{}))===false);

/* ============ 12. 疫病 ============ */
reset0();
let pl=mk('疫病',0),plMon=mk(WARRIOR,0);
gameState.players[0].sz=[pl];gameState.players[0].mz=[plMon];
let plCtx=C(0,pl,'sz',0,'activate',{});
ok('疫病 positive: 戦士族がいれば発動できる',sc('疫病').condition(plCtx)===true);
plCtx.selectedTargets=[h(plMon)];
sc('疫病').resolve(plCtx);
pl.face='up';
ok('疫病 card-specific: 装備モンスターの攻撃力が0になる',
   curATK(plMon)===0,'atk='+curATK(plMon));
gameState.phase='standby';gameState.activePlayer=0;
let plLp=gameState.players[0].lp;
sc('疫病').resolve(C(0,pl,'sz',0,'activate',{}));
ok('疫病 card-specific: 装備モンスターのコントローラーに500ダメージ',
   gameState.players[0].lp===plLp-500);
reset0();
let pl2=mk('疫病',0),plDragon=mk(BIG,0);
gameState.players[0].sz=[pl2];gameState.players[0].mz=[plDragon];
ok('疫病 negative: 戦士・獣戦士・魔法使い以外しかいなければ発動できない',
   sc('疫病').condition(C(0,pl2,'sz',0,'activate',{}))===false);
ok('疫病 ruling: ドラゴン族には装備できない（equipSpec）',
   equipLegalV15(pl2,h(plDragon))===false);

/* ============ 13. バトルマニア ============ */
reset0();
let bm=mk('バトルマニア',0,'down');
let bmFoe=mk(BIG,1,'up','def');
gameState.players[0].sz=[bm];gameState.players[1].mz=[bmFoe];
gameState.activePlayer=1;gameState.phase='standby';
let bmCtx=C(0,bm,'sz',0,'activate',{});
ok('バトルマニア positive: 相手スタンバイに表側モンスターがいれば発動できる',
   sc('バトルマニア').condition(bmCtx)===true);
sc('バトルマニア').resolve(bmCtx);
ok('バトルマニア positive: 相手モンスターが攻撃表示になる',
   gameState.players[1].mz[0].pos==='atk');
/* 通常罠は墓地へ行くが、発動ターン中は墓地ソースとして効果が続く。
   発動処理で表側になってから墓地へ行くので、テストでも表側にしてから移す。 */
bm.face='up';
gameState.players[0].sz=[];gameState.players[0].grave=[bm];
ok('バトルマニア card-specific: 墓地からでも攻撃が強制される（mustAttack）',
   mustAttackNow(bmFoe)===true);
ok('バトルマニア card-specific: このターン表示形式を変更できない',
   cannotChangePositionV10(bmFoe)===true);
gameState.turn=gameState.turn+1;
ok('バトルマニア ruling: 次のターンには効果が残らない',
   mustAttackNow(bmFoe)===false&&cannotChangePositionV10(bmFoe)===false);
reset0();
let bm2=mk('バトルマニア',0,'down');
gameState.players[0].sz=[bm2];gameState.players[1].mz=[];
gameState.activePlayer=1;gameState.phase='standby';
ok('バトルマニア negative: 相手モンスターがいなければ発動できない',
   sc('バトルマニア').condition(C(0,bm2,'sz',0,'activate',{}))===false);
reset0();
let bm3=mk('バトルマニア',0,'down'),bm3Foe=mk(BIG,1);
gameState.players[0].sz=[bm3];gameState.players[1].mz=[bm3Foe];
gameState.activePlayer=0;gameState.phase='standby';
ok('バトルマニア ruling: 自分のスタンバイでは発動できない',
   sc('バトルマニア').condition(C(0,bm3,'sz',0,'activate',{}))===false);

/* ================= passive / continuous は read-only ================= */
reset0();
let roPx=mk('X－セイバー パシウル',0,'up','def'),roAx=mk('愚鈍の斧',0),roMon2=mk(WARRIOR,0);
gameState.players[0].mz=[roPx,roMon2];gameState.players[0].sz=[roAx];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
curATK(roPx);curATK(roMon2);
mustAttackNow(roMon2);cannotChangePositionV10(roMon2);
effectNegated(roMon2);
sc('サクリファイス・ロータス').passive.onStandbyPhase(
  ctxEv(0,roPx,'onStandbyPhase',{},'mz'));
ok('cycle25 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= 隠匿情報 ================= */
reset0();
let hiDn=mk('ダーク・ネフティス',0);
gameState.players[0].hand=[hiDn];ensureCardUid(gameState,hiDn);
gameState.players[0].grave=[mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0)];
sc('ダーク・ネフティス').resolve(C(0,hiDn,'hand',0,'activate',{}));
ok('cycle25 隠匿情報: 除外の選択要求は発動プレイヤーにだけ出る',
   !!pending()&&pending().player===0);
ok('cycle25 隠匿情報: 候補は公開領域（墓地）のカードだけ',
   pending().candidates.every(c=>{const r=resolveTarget(c);return !r||r.zone==='grave';}));
API.answerChoice(pending().candidates.slice(0,2).map(c=>c.key));

/* ================= Replay / SaveLoad ================= */
reset0();
let rs1=mk('シンクロ・ガンナー',0),rs1Syn=mk('C・ドラゴン',0);
gameState.players[0].mz=[rs1,rs1Syn];ensureCardUid(gameState,rs1Syn);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let rs1Ctx=C(0,rs1,'mz',0,'activate',{});
rs1Ctx.selectedTargets=[h(rs1Syn)];
sc('シンクロ・ガンナー').resolve(rs1Ctx);
let rc1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle25 Replay: 除外＋スタンバイ予約が digest 一致で再生される',rc1.ok,rc1.reason||'');
reset0();
let rs2=mk('おとぼけオポッサム',0),rs2Foe=mk(BIG,1);
gameState.players[0].mz=[rs2];gameState.players[1].mz=[rs2Foe];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
sc('おとぼけオポッサム').resolve(C(0,rs2,'mz',0,'activate',{}));
let rc2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle25 Replay: 自壊の印が digest 一致で再生される',rc2.ok,rc2.reason||'');
let snap25=JSON.stringify(gameState);
ok('cycle25 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap25))===snap25);
ok('cycle25 直列化: 予約に関数が入っていない',snap25.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
