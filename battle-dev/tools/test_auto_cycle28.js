/* Auto cycle 28 — 11枚。positive / negative / ruling edge / Replay。 */
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

const ALL=['ジャンク・アーチャー','パスト・イメージ','ジャンク・ガードナー','サーチ・ストライカー',
 'サブマリンロイド','レプティレス・ナージャ','ミドル・シールド・ガードナー','妨害電波',
 'ロスト・スター・ディセント','サイコジャンパー','D・チャッカン'];
ALL.forEach(n=>ok('cycle28 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle28 枚数は11',ALL.length===11);

const PSY='クレボンス';        /* サイキック lv2 */
const SYN='C・ドラゴン';       /* シンクロ */

function fireAt(at,p,phase,advance){
  gameState.turn=gameState.turn+(advance==null?0:advance);
  gameState.activePlayer=p;gameState.phase=phase;
  return runDueSchedulesV7(at,gameState);
}

/* ============ 1. ジャンク・アーチャー ============ */
reset0();
let ja=mk('ジャンク・アーチャー',0),jaFoe=mk(BIG,1,'up','def');
gameState.players[0].mz=[ja];gameState.players[1].mz=[jaFoe];
ensureCardUid(gameState,jaFoe);
let jaCtx=C(0,ja,'mz',0,'activate',{});
ok('ジャンク・アーチャー positive: 相手モンスターがいれば発動できる',
   sc('ジャンク・アーチャー').condition(jaCtx)===true);
jaCtx.selectedTargets=[h(jaFoe)];
sc('ジャンク・アーチャー').resolve(jaCtx);
ok('ジャンク・アーチャー positive: 相手モンスターが除外され戻りが予約される',
   gameState.players[1].banish.length===1
   &&API.schedules('d7.returnSamePos').length===1);
fireAt('endPhase',0,'end');
ok('ジャンク・アーチャー card-specific: エンドフェイズに同じ表示形式（守備）で戻る',
   gameState.players[1].mz.length===1
   &&gameState.players[1].mz[0].uid===jaFoe.uid
   &&gameState.players[1].mz[0].pos==='def',
   'pos='+(gameState.players[1].mz[0]&&gameState.players[1].mz[0].pos));
reset0();
let ja2=mk('ジャンク・アーチャー',0);
gameState.players[0].mz=[ja2];gameState.players[1].mz=[];
ok('ジャンク・アーチャー negative: 相手モンスターがいなければ発動できない',
   sc('ジャンク・アーチャー').condition(C(0,ja2,'mz',0,'activate',{}))===false);
ok('ジャンク・アーチャー ruling: 1ターンに1度（countLimit）',
   sc('ジャンク・アーチャー').countLimit===1);

/* ============ 2. パスト・イメージ ============ */
reset0();
let pi=mk('パスト・イメージ',0,'down'),piPsy=mk(PSY,0),piFoe=mk(BIG,1);
gameState.players[0].sz=[pi];gameState.players[0].mz=[piPsy];
gameState.players[1].mz=[piFoe];ensureCardUid(gameState,piFoe);
let piCtx=C(0,pi,'sz',0,'activate',{});
ok('パスト・イメージ positive: 自分のサイキック族がいれば発動できる',
   sc('パスト・イメージ').condition(piCtx)===true);
piCtx.selectedTargets=[h(piFoe)];
sc('パスト・イメージ').resolve(piCtx);
ok('パスト・イメージ positive: 相手モンスターが除外される',
   gameState.players[1].banish.length===1);
fireAt('standbyPhase',1,'standby',1);
ok('パスト・イメージ card-specific: 次のスタンバイに同じ表示形式（攻撃）で戻る',
   gameState.players[1].mz.length===1&&gameState.players[1].mz[0].pos==='atk');
reset0();
let pi2=mk('パスト・イメージ',0,'down'),pi2Foe=mk(BIG,1);
gameState.players[0].sz=[pi2];gameState.players[0].mz=[mk(BIG,0)];
gameState.players[1].mz=[pi2Foe];
ok('パスト・イメージ negative: サイキック族がいなければ発動できない',
   sc('パスト・イメージ').condition(C(0,pi2,'sz',0,'activate',{}))===false);

/* ============ 3. ジャンク・ガードナー ============ */
reset0();
let jg=mk('ジャンク・ガードナー',0),jgFoe=mk(BIG,1,'up','atk');
gameState.players[0].mz=[jg];gameState.players[1].mz=[jgFoe];
let jgCtx=C(0,jg,'mz',0,'activate',{});
ok('ジャンク・ガードナー positive: 相手の表側モンスターがいれば発動できる',
   sc('ジャンク・ガードナー').condition(jgCtx)===true);
jgCtx.selectedTargets=[h(jgFoe)];
sc('ジャンク・ガードナー').resolve(jgCtx);
ok('ジャンク・ガードナー card-specific: 攻撃表示から守備表示に変わる',
   gameState.players[1].mz[0].pos==='def');
reset0();
let jg2=mk('ジャンク・ガードナー',0),jg2Other=mk(BIG,0,'up','atk');
gameState.players[0].grave=[jg2];gameState.players[0].mz=[jg2Other];
jg2.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
let jg2Ctx=C(0,jg2,'grave',0,'activate',{});
ok('ジャンク・ガードナー positive: フィールドから墓地へ送られた場合も発動できる',
   sc('ジャンク・ガードナー').condition(jg2Ctx)===true);
jg2Ctx.selectedTargets=[h(jg2Other)];
sc('ジャンク・ガードナー').resolve(jg2Ctx);
ok('ジャンク・ガードナー card-specific: 墓地からは自分のモンスターも選べる',
   gameState.players[0].mz[0].pos==='def');
reset0();
let jg3=mk('ジャンク・ガードナー',0);
gameState.players[0].mz=[jg3];gameState.players[1].mz=[];
ok('ジャンク・ガードナー negative: 相手の表側モンスターがいなければ発動できない',
   sc('ジャンク・ガードナー').condition(C(0,jg3,'mz',0,'activate',{}))===false);

/* ============ 4. サーチ・ストライカー ============ */
reset0();
gameState.phase='battle';
let ss=mk('サーチ・ストライカー',0),ssFoe=mk(BIG,1,'down','def');
gameState.players[0].mz=[ss];gameState.players[1].mz=[ssFoe];
ensureCardUid(gameState,ss);
gameState.battle={player:0,atkIdx:0,target:0};
let ssCtx=ctxDS(0,ss,{atkCard:ss,defCard:ssFoe},'mz','start');
ok('サーチ・ストライカー positive: 裏側守備表示を攻撃した時に誘発する',
   sc('サーチ・ストライカー').passive.onDamageStep(ssCtx)===true);
sc('サーチ・ストライカー').resolve(ssCtx);
ok('サーチ・ストライカー card-specific: ダメージ計算を行わず裏側のまま破壊される',
   gameState.players[1].mz.length===0&&gameState.players[1].grave.length===1);
ok('サーチ・ストライカー card-specific: 表示形式変更の禁止と守備表示化が予約される',
   Number(ss.d7PosLockThrough)===gameState.turn+2
   &&API.schedules('d7.toDefenseUid').length===1);
ok('サーチ・ストライカー card-specific: 表示形式を変更できない',
   cannotChangePositionV10(ss)===true);
fireAt('battlePhaseEnd',0,'battle');
ok('サーチ・ストライカー positive: バトルフェイズ終了時に守備表示になる',
   gameState.players[0].mz[0].pos==='def');
gameState.turn=gameState.turn+3;
ok('サーチ・ストライカー ruling: 期限を過ぎれば表示形式を変更できる',
   cannotChangePositionV10(ss)===false);
reset0();
gameState.phase='battle';
let ss2=mk('サーチ・ストライカー',0),ss2Foe=mk(BIG,1,'up','atk');
gameState.players[0].mz=[ss2];gameState.players[1].mz=[ss2Foe];
gameState.battle={player:0,atkIdx:0,target:0};
ok('サーチ・ストライカー negative: 表側表示のモンスターを攻撃した場合は誘発しない',
   sc('サーチ・ストライカー').passive.onDamageStep(
     ctxDS(0,ss2,{atkCard:ss2,defCard:ss2Foe},'mz','start'))===false);

/* ============ 5. サブマリンロイド ============ */
reset0();
let sr=mk('サブマリンロイド',0),srFoe=mk(BIG,1);
gameState.players[0].mz=[sr];gameState.players[1].mz=[srFoe];
ok('サブマリンロイド card-specific: 直接攻撃できる（canDirectAttack）',
   sc('サブマリンロイド').canDirectAttack===true);
API.modAtk(h(sr),1000,0,'endTurn','テスト');
ok('サブマリンロイド ruling: 通常時は増減が乗る',
   curATK(sr)===dbOf(sr).atk+1000,'atk='+curATK(sr));
gameState.battle={player:0,atkIdx:0,target:'direct'};
ok('サブマリンロイド card-specific: 直接攻撃時は元々の攻撃力に固定される',
   curATK(sr)===dbOf(sr).atk,'atk='+curATK(sr));
gameState.battle=null;
let srCtx=ctxDS(0,sr,{atkCard:sr,defCard:srFoe},'mz');
ok('サブマリンロイド positive: 戦闘を行ったダメージステップ終了時に誘発する',
   sc('サブマリンロイド').passive.onDamageStep(srCtx)===true);
sc('サブマリンロイド').resolve(srCtx);
ok('サブマリンロイド positive: 守備表示になる',gameState.players[0].mz[0].pos==='def');
ok('サブマリンロイド negative: 既に守備表示なら発動しない',
   sc('サブマリンロイド').passive.onDamageStep(
     ctxDS(0,sr,{atkCard:sr,defCard:srFoe},'mz'))===false);

/* ============ 6. レプティレス・ナージャ ============ */
reset0();
let nj=mk('レプティレス・ナージャ',0,'up','def');
gameState.players[0].mz=[nj];
ok('レプティレス・ナージャ card-specific: 戦闘では破壊されない（protectV21）',
   (protectionRecordV21(gameState,nj,{cause:'battle'})||{}).battle===true);
ok('レプティレス・ナージャ ruling: 効果破壊は防がない',
   protectionRecordV21(gameState,nj,{cause:'effect'})===null);
gameState.phase='end';gameState.activePlayer=0;
let njCtx=C(0,nj,'mz',0,'activate',{});
ok('レプティレス・ナージャ positive: 守備表示なら自分エンドフェイズに誘発する',
   sc('レプティレス・ナージャ').condition(njCtx)===true);
sc('レプティレス・ナージャ').resolve(njCtx);
ok('レプティレス・ナージャ card-specific: 表側攻撃表示になる',
   gameState.players[0].mz[0].pos==='atk');
reset0();
gameState.phase='battle';
let nj2=mk('レプティレス・ナージャ',0),nj2Foe=mk(BIG,1);
gameState.players[0].mz=[nj2];gameState.players[1].mz=[nj2Foe];
ensureCardUid(gameState,nj2);ensureCardUid(gameState,nj2Foe);
gameState.battlePhaseV6={attacks:[{player:0,attackerUid:nj2.uid,targetUid:nj2Foe.uid}]};
let nj2Ctx=C(0,nj2,'mz',0,'activate',{});
ok('レプティレス・ナージャ positive: 戦闘を行ったバトルフェイズ終了時に誘発する',
   sc('レプティレス・ナージャ').condition(nj2Ctx)===true);
sc('レプティレス・ナージャ').resolve(nj2Ctx);
ok('レプティレス・ナージャ card-specific: 戦闘したモンスターの攻撃力が0になる',
   curATK(nj2Foe)===0,'atk='+curATK(nj2Foe));
reset0();
gameState.phase='battle';
let nj3=mk('レプティレス・ナージャ',0);
gameState.players[0].mz=[nj3];gameState.battlePhaseV6={attacks:[]};
ok('レプティレス・ナージャ negative: 戦闘していなければ発動しない',
   sc('レプティレス・ナージャ').condition(C(0,nj3,'mz',0,'activate',{}))===false);

/* ============ 7. ミドル・シールド・ガードナー ============ */
reset0();
let mg=mk('ミドル・シールド・ガードナー',0);
gameState.players[0].mz=[mg];
let mgCtx=C(0,mg,'mz',0,'activate',{});
ok('ミドル・シールド・ガードナー positive: 自分のメインフェイズに発動できる',
   sc('ミドル・シールド・ガードナー').condition(mgCtx)===true);
sc('ミドル・シールド・ガードナー').resolve(mgCtx);
ok('ミドル・シールド・ガードナー card-specific: 裏側守備表示になる',
   gameState.players[0].mz[0].face==='down'&&gameState.players[0].mz[0].pos==='def');
let mgSpell=mk('サイクロン',1);gameState.players[1].sz=[mgSpell];
ensureCardUid(gameState,mgSpell);ensureCardUid(gameState,mg);
gameState.chain=[{chainId:1,player:1,name:'サイクロン',ss:1,
  targets:[{uid:mg.uid}],selection:[{uid:mg.uid}]}];
let mgCtx2=ctxEv(0,mg,'onActivateSuccess',
  {uid:mgSpell.uid,player:1,kind:'spell',chainId:1},'mz');
ok('ミドル・シールド・ガードナー positive: 裏側の自身を対象にした相手の魔法に反応する',
   sc('ミドル・シールド・ガードナー').passive.onActivateSuccess(mgCtx2)===true);
sc('ミドル・シールド・ガードナー').resolve(mgCtx2);
ok('ミドル・シールド・ガードナー card-specific: 発動を無効にし表側守備表示になる',
   API.chainLinkNegated(1)===true
   &&gameState.players[0].mz[0].face==='up'
   &&gameState.players[0].mz[0].pos==='def');
gameState.chain=[];
reset0();
let mg2=mk('ミドル・シールド・ガードナー',0,'down','def'),mg2Sp=mk('サイクロン',1);
gameState.players[0].mz=[mg2];gameState.players[1].sz=[mg2Sp];
ensureCardUid(gameState,mg2);ensureCardUid(gameState,mg2Sp);
gameState.chain=[{chainId:1,player:1,name:'サイクロン',ss:1,targets:[],selection:[]}];
ok('ミドル・シールド・ガードナー negative: 自身を対象にしていない魔法には反応しない',
   sc('ミドル・シールド・ガードナー').passive.onActivateSuccess(
     ctxEv(0,mg2,'onActivateSuccess',
       {uid:mg2Sp.uid,player:1,kind:'spell',chainId:1},'mz'))===false);
gameState.chain=[];
ok('ミドル・シールド・ガードナー ruling: 1ターンに1度（countLimit）',
   sc('ミドル・シールド・ガードナー').countLimit===1);

/* ============ 8. 妨害電波 ============ */
reset0();
let jd=mk('妨害電波',0),jdSyn=mk(SYN,0,'up','atk'),jdSyn2=mk(SYN,1,'up','atk');
gameState.players[0].sz=[jd];gameState.players[0].mz=[jdSyn];gameState.players[1].mz=[jdSyn2];
let jdCtx=C(0,jd,'sz',0,'activate',{});
ok('妨害電波 positive: 表側攻撃表示のシンクロがいれば発動できる',
   sc('妨害電波').condition(jdCtx)===true);
sc('妨害電波').resolve(jdCtx);
ok('妨害電波 card-specific: フィールドのシンクロが全て表側守備表示になる',
   gameState.players[0].mz[0].pos==='def'&&gameState.players[1].mz[0].pos==='def');
ok('妨害電波 card-specific: エンドフェイズのエクストラ戻しが予約される',
   API.schedules('d7.synchroToEx').length===1);
fireAt('endPhase',0,'end');
ok('妨害電波 card-specific: 予約が発火してシンクロがエクストラに戻る',
   gameState.players[0].mz.length===0&&gameState.players[1].mz.length===0
   &&gameState.players[0].ex.length===1&&gameState.players[1].ex.length===1,
   'ex0='+gameState.players[0].ex.length+' ex1='+gameState.players[1].ex.length);
reset0();
let jd2=mk('妨害電波',0),jd2Syn=mk(SYN,0,'up','def');
gameState.players[0].sz=[jd2];gameState.players[0].mz=[jd2Syn];
ok('妨害電波 negative: 表側攻撃表示のシンクロがいなければ発動できない',
   sc('妨害電波').condition(C(0,jd2,'sz',0,'activate',{}))===false);

/* ============ 9. ロスト・スター・ディセント ============ */
reset0();
let ls=mk('ロスト・スター・ディセント',0,'down'),lsSyn=mk(SYN,0);
lsSyn.properlySummonedS03=true;/* S03-U127: a Synchro Monster can be revived only after a proper summon — this setup card stands for one that was properly Synchro Summoned earlier */
gameState.players[0].sz=[ls];gameState.players[0].grave=[lsSyn];
ensureCardUid(gameState,lsSyn);
let lsLv=Number(dbOf(lsSyn).lv);
let lsCtx=C(0,ls,'sz',0,'activate',{});
ok('ロスト・スター・ディセント positive: 墓地のSモンスターがいれば発動できる',
   sc('ロスト・スター・ディセント').condition(lsCtx)===true);
lsCtx.selectedTargets=[h(lsSyn)];
sc('ロスト・スター・ディセント').resolve(lsCtx);
ok('ロスト・スター・ディセント card-specific: 守備表示で特殊召喚されレベルが1下がる',
   gameState.players[0].mz.length===1&&gameState.players[0].mz[0].pos==='def'
   &&Number(API.levelOf(h(lsSyn)))===lsLv-1,
   'lv='+API.levelOf(h(lsSyn)));
ok('ロスト・スター・ディセント card-specific: 守備力0かつ効果が無効化される',
   curDEF(lsSyn)===0&&API.isEffectNegated(h(lsSyn))===true,
   'def='+curDEF(lsSyn));
/* 通常罠なので墓地に落ちても、この印は継続効果で読まれる */
ls.face='up';
gameState.players[0].sz=[];gameState.players[0].grave=[ls];
ok('ロスト・スター・ディセント card-specific: 墓地ソースとして表示形式変更を禁止する',
   cannotChangePositionV10(lsSyn)===true);
reset0();
let ls2=mk('ロスト・スター・ディセント',0,'down');
gameState.players[0].sz=[ls2];gameState.players[0].grave=[mk(BIG,0)];
ok('ロスト・スター・ディセント negative: 墓地にSモンスターがいなければ発動できない',
   sc('ロスト・スター・ディセント').condition(C(0,ls2,'sz',0,'activate',{}))===false);

/* ============ 10. サイコジャンパー ============ */
reset0();
let pj=mk('サイコジャンパー',0),pjMine=mk(PSY,0),pjFoe=mk(BIG,1,'up','atk');
gameState.players[0].mz=[pj,pjMine];gameState.players[1].mz=[pjFoe];
ensureCardUid(gameState,pjFoe);
let pjCtx=C(0,pj,'mz',0,'activate',{});
ok('サイコジャンパー positive: 相手の表側と自分の他のサイキック族がいれば発動できる',
   sc('サイコジャンパー').condition(pjCtx)===true);
let pjLp=gameState.players[0].lp;
sc('サイコジャンパー').cost(pjCtx,()=>{});
ok('サイコジャンパー positive: 1000ライフを払う',gameState.players[0].lp===pjLp-1000);
pjCtx.selectedTargets=[h(pjFoe),h(pjMine)];
sc('サイコジャンパー').resolve(pjCtx);
ok('サイコジャンパー card-specific: コントロールが入れ替わる',
   gameState.players[0].mz.some(c=>c&&c.uid===pjFoe.uid)
   &&gameState.players[1].mz.some(c=>c&&dbOf(c).n===PSY),
   'mine='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
ok('サイコジャンパー card-specific: 選択した相手モンスターはこのターン表示形式を変更できない',
   cannotChangePositionV10(pjFoe)===true);
gameState.turn=gameState.turn+1;
ok('サイコジャンパー ruling: 次のターンには表示形式を変更できる',
   cannotChangePositionV10(pjFoe)===false);
reset0();
let pj2=mk('サイコジャンパー',0),pj2Foe=mk(BIG,1);
gameState.players[0].mz=[pj2];gameState.players[1].mz=[pj2Foe];
ok('サイコジャンパー negative: 他のサイキック族がいなければ発動できない',
   sc('サイコジャンパー').condition(C(0,pj2,'mz',0,'activate',{}))===false);

/* ============ 11. D・チャッカン ============ */
reset0();
let dc=mk('D・チャッカン',0,'up','atk'),dcTrib=mk(PLAIN,0);
gameState.players[0].mz=[dc,dcTrib];
let dcCtx=C(0,dc,'mz',0,'activate',{});
ok('D・チャッカン positive: 攻撃表示ならリリースして発動できる',
   sc('D・チャッカン').condition(dcCtx)===true);
dcCtx.selectedTargets=[h(dcTrib)];
sc('D・チャッカン').cost(dcCtx,()=>{});
let dcLp=gameState.players[1].lp;
sc('D・チャッカン').resolve(dcCtx);
ok('D・チャッカン card-specific: 攻撃表示なら600ダメージ',
   gameState.players[1].lp===dcLp-600,'lp='+dcLp+'→'+gameState.players[1].lp);
reset0();
let dc2=mk('D・チャッカン',0,'up','def');
gameState.players[0].mz=[dc2];
let dc2Ctx=C(0,dc2,'mz',0,'activate',{});
ok('D・チャッカン positive: 守備表示ならリリースなしで発動できる',
   sc('D・チャッカン').condition(dc2Ctx)===true);
let dc2Lp=gameState.players[1].lp;
sc('D・チャッカン').cost(dc2Ctx,()=>{});
sc('D・チャッカン').resolve(dc2Ctx);
ok('D・チャッカン card-specific: 守備表示なら300ダメージ',
   gameState.players[1].lp===dc2Lp-300,'lp='+dc2Lp+'→'+gameState.players[1].lp);
reset0();
let dc3=mk('D・チャッカン',0,'down','def');
gameState.players[0].mz=[dc3];
ok('D・チャッカン negative: 裏側表示では発動できない',
   sc('D・チャッカン').condition(C(0,dc3,'mz',0,'activate',{}))===false);
ok('D・チャッカン ruling: 1ターンに1度（countLimit）',sc('D・チャッカン').countLimit===1);

/* ================= passive / continuous は read-only ================= */
reset0();
let roSr=mk('サブマリンロイド',0),roNj=mk('レプティレス・ナージャ',0),roSs=mk('サーチ・ストライカー',0);
gameState.players[0].mz=[roSr,roNj,roSs];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
curATK(roSr);curATK(roNj);curATK(roSs);
cannotChangePositionV10(roSs);
protectionRecordV21(gameState,roNj,{cause:'battle'});
ok('cycle28 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= 隠匿情報 ================= */
reset0();
let hiJa=mk('ジャンク・アーチャー',0),hiFoe=mk(BIG,1,'down','def');
gameState.players[0].mz=[hiJa];gameState.players[1].mz=[hiFoe];
ensureCardUid(gameState,hiFoe);
let hiCtx=C(0,hiJa,'mz',0,'activate',{});
hiCtx.selectedTargets=[h(hiFoe)];
sc('ジャンク・アーチャー').resolve(hiCtx);
fireAt('endPhase',0,'end');
ok('cycle28 隠匿情報: 裏側だったモンスターは裏側のまま戻る',
   gameState.players[1].mz.length===1
   &&gameState.players[1].mz[0].face==='down'
   &&gameState.players[1].mz[0].pos==='def',
   'face='+(gameState.players[1].mz[0]&&gameState.players[1].mz[0].face));

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('ジャンク・アーチャー',0),rp1Foe=mk(BIG,1,'up','def');
gameState.players[0].mz=[rp1];gameState.players[1].mz=[rp1Foe];
ensureCardUid(gameState,rp1Foe);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let rp1Ctx=C(0,rp1,'mz',0,'activate',{});
rp1Ctx.selectedTargets=[h(rp1Foe)];
sc('ジャンク・アーチャー').resolve(rp1Ctx);
let rq1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle28 Replay: 除外＋エンドフェイズ予約が digest 一致で再生される',rq1.ok,rq1.reason||'');
reset0();
let rp2=mk('ジャンク・ガードナー',0),rp2Foe=mk(BIG,1,'up','atk');
gameState.players[0].mz=[rp2];gameState.players[1].mz=[rp2Foe];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let rp2Ctx=C(0,rp2,'mz',0,'activate',{});
rp2Ctx.selectedTargets=[h(rp2Foe)];
sc('ジャンク・ガードナー').resolve(rp2Ctx);
let rq2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle28 Replay: 表示形式変更が digest 一致で再生される',rq2.ok,rq2.reason||'');
let snap28=JSON.stringify(gameState);
ok('cycle28 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap28))===snap28);
ok('cycle28 直列化: 予約に関数が入っていない',snap28.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
