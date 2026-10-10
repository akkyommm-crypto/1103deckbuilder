/* Auto cycle 04 — 19枚。positive / negative / ruling edge / Replay。 */
const fs=require('fs'),vm=require('vm'),path=require('path');const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[],ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function reset0(){gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;
  gameState.phase='main1';gameState.turn=6;PLAY_MODE=PLAY_MODES.DUEL;
  HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();
  v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
  API.confirm=(t,m,yes,no)=>{ if(no) no(); };
  gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function h(c){return locateCardAnyV4(c);}
function sc(n){const s=CARD_SCRIPTS[n];if(!s)throw Error('script missing '+n);return s;}
function pickFirst(){API.selectCard=(t,list,cb)=>cb(list[0]);}
function ctxDS(p,card,battle,zone,step){const loc=h(card);
  const c=makeContext(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,'onDamageStep',
    {event:{},battle:battle,step:step||'after'});
  c.battle=battle;c.step=step||'after';return c;}
function ctxEv(p,card,ev,evt,zone){const loc=h(card);
  const c=makeContext(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,ev,{event:evt});
  c.event=evt;return c;}
/* p0 の mz[ai] が p1 の mz[ti] を攻撃している状態 */
function battleAt(ai,ti,step){
  const a=gameState.players[0].mz[ai],d=(ti==='direct')?null:gameState.players[1].mz[ti];
  if(a)ensureCardUid(gameState,a); if(d)ensureCardUid(gameState,d);
  gameState.battle={player:0,atkIdx:ai,target:(ti==='direct')?'direct':ti,step:step||'calc',
    atkUid:a?a.uid:null,targetUid:d?d.uid:null};
}
/* p1 の mz[ai] が p0 の mz[ti] を攻撃している状態 */
function battleFoeAt(ai,ti,step){
  const a=gameState.players[1].mz[ai],d=gameState.players[0].mz[ti];
  if(a)ensureCardUid(gameState,a); if(d)ensureCardUid(gameState,d);
  gameState.battle={player:1,atkIdx:ai,target:ti,step:step||'calc',
    atkUid:a?a.uid:null,targetUid:d?d.uid:null};
}
function pending(){return pendingChoiceV49(gameState);}
const PLAIN='ワイト';        /* 闇 lv1 ATK300 */
const BIG='青眼の白龍';       /* 光 lv8 ATK3000 DEF2500 */
const DARKM='デーモンの召喚';  /* 闇 lv6 ATK2500 */
const WARRIOR='E・HERO スパークマン'; /* 光 戦士 ATK1600 */

const ALL=['A・O・J ガラドホルグ','A・O・J ルドラ','スチームロイド','暗黒ヴェロキ','サイファー・スカウター',
 'ダークネス・デストロイヤー','カイザー・グライダー','ワンショット・ロケット','ゴブリン暗殺部隊',
 '聖導騎士イシュザーク','ブルーサンダーT45','ファイナルサイコオーガ','ヴァンパイア・ベビー',
 '超熱血球児','終焉の精霊','寂々虫','騒々虫','A・O・J サイクルリーダー','生存本能'];
ALL.forEach(n=>ok('cycle04 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle04 枚数は19',ALL.length===19);

/* ================= T. ダメージステップ攻守変化 ================= */
reset0();
let gh=mk('A・O・J ガラドホルグ',0),lightFoe=mk(BIG,1);
gameState.players[0].mz=[gh];gameState.players[1].mz=[lightFoe];
ok('A・O・J ガラドホルグ negative: 戦闘外では上がらない',curATK(gh)===dbOf(gh).atk);
battleAt(0,0,'calc');
ok('A・O・J ガラドホルグ positive: 光属性と戦闘するDS中は+200',
   curATK(gh)===dbOf(gh).atk+200,'atk='+curATK(gh));
reset0();
let rd=mk('A・O・J ルドラ',0),lf2=mk(BIG,1);
gameState.players[0].mz=[rd];gameState.players[1].mz=[lf2];
battleAt(0,0,'calc');
ok('A・O・J ルドラ positive: 光属性と戦闘するDS中は+700',curATK(rd)===dbOf(rd).atk+700);
reset0();
let rd2=mk('A・O・J ルドラ',0),df=mk(DARKM,1);
gameState.players[0].mz=[rd2];gameState.players[1].mz=[df];
battleAt(0,0,'calc');
ok('A・O・J ルドラ negative: 光属性以外では上がらない',curATK(rd2)===dbOf(rd2).atk);

/* --- スチームロイド（攻撃で+500 / 攻撃されて-500） --- */
reset0();
let st=mk('スチームロイド',0),foeA=mk(PLAIN,1);
gameState.players[0].mz=[st];gameState.players[1].mz=[foeA];
battleAt(0,0,'calc');
ok('スチームロイド positive: 攻撃する場合は+500',curATK(st)===dbOf(st).atk+500,'atk='+curATK(st));
reset0();
let st2=mk('スチームロイド',0),foeB=mk(BIG,1);
gameState.players[0].mz=[st2];gameState.players[1].mz=[foeB];
battleFoeAt(0,0,'calc');
ok('スチームロイド ruling: 攻撃される場合は-500',curATK(st2)===dbOf(st2).atk-500,'atk='+curATK(st2));
reset0();
let st3=mk('スチームロイド',0);
gameState.players[0].mz=[st3];
battleAt(0,'direct','calc');
ok('スチームロイド ruling: 直接攻撃では増減しない',curATK(st3)===dbOf(st3).atk,'atk='+curATK(st3));

/* --- 暗黒ヴェロキ --- */
reset0();
let av=mk('暗黒ヴェロキ',0),foeC=mk(PLAIN,1);
gameState.players[0].mz=[av];gameState.players[1].mz=[foeC];
battleAt(0,0,'calc');
ok('暗黒ヴェロキ positive: 攻撃する場合は+400',curATK(av)===dbOf(av).atk+400);
reset0();
let av2=mk('暗黒ヴェロキ',0),foeD=mk(BIG,1);
gameState.players[0].mz=[av2];gameState.players[1].mz=[foeD];
battleFoeAt(0,0,'calc');
ok('暗黒ヴェロキ ruling: 攻撃された場合は-400',curATK(av2)===dbOf(av2).atk-400);

/* --- サイファー・スカウター（攻守ともに+2000） --- */
reset0();
let cs=mk('サイファー・スカウター',0),warFoe=mk(WARRIOR,1);
gameState.players[0].mz=[cs];gameState.players[1].mz=[warFoe];
battleAt(0,0,'calc');
ok('サイファー・スカウター positive: 戦士族と戦闘するDS中は攻守+2000',
   curATK(cs)===dbOf(cs).atk+2000&&curDEF(cs)===dbOf(cs).def+2000,
   'atk='+curATK(cs)+' def='+curDEF(cs));
reset0();
let cs2=mk('サイファー・スカウター',0),nonWar=mk(BIG,1);   /* ドラゴン族 */
gameState.players[0].mz=[cs2];gameState.players[1].mz=[nonWar];
battleAt(0,0,'calc');
ok('サイファー・スカウター negative: 戦士族以外では上がらない',curATK(cs2)===dbOf(cs2).atk);

/* --- ダークネス・デストロイヤー --- */
reset0();
let dd=mk('ダークネス・デストロイヤー',0),defFoe=mk(PLAIN,1,'up','def');
gameState.players[0].mz=[dd];gameState.players[1].mz=[defFoe];
ok('ダークネス・デストロイヤー ruling: 特殊召喚できない',sc('ダークネス・デストロイヤー').cannotSpecialSummon===true);
ok('ダークネス・デストロイヤー positive: 攻撃可能回数は2回',attackLimitV48(dd)===2,'limit='+attackLimitV48(dd));
battleAt(0,0,'calc');
ok('ダークネス・デストロイヤー positive: 守備表示へ貫通する',(()=>{
   const amt=applyPiercingDamage({atkCard:dd,defCard:defFoe});
   return amt===Math.max(0,curATK(dd)-curDEF(defFoe))&&amt>0;})());
ok('ダークネス・デストロイヤー negative: 攻撃表示には貫通しない',
   applyPiercingDamage({atkCard:dd,defCard:mk(PLAIN,1,'up','atk')})===0);

/* ================= U. 戦闘破壊耐性（条件付き） ================= */
reset0();
let kg=mk('カイザー・グライダー',0),same=mk('カイザー・グライダー',1);  /* 同じ攻撃力 2400 */
gameState.players[0].mz=[kg];gameState.players[1].mz=[same];
battleAt(0,0,'calc');
ok('カイザー・グライダー positive: 同じ攻撃力との戦闘では破壊されない',battleProof(kg)===true);
reset0();
let kg2=mk('カイザー・グライダー',0),diff=mk(BIG,1);   /* ATK3000 ≠ 2400 */
gameState.players[0].mz=[kg2];gameState.players[1].mz=[diff];
battleAt(0,0,'calc');
ok('カイザー・グライダー negative: 攻撃力が違えば破壊耐性は無い',battleProof(kg2)===false);
reset0();
let kg3=mk('カイザー・グライダー',0);
gameState.players[0].mz=[kg3];
ok('カイザー・グライダー ruling: 戦闘していない時は耐性を持たない（テキスト既定に頼らない）',
   battleProof(kg3)===false);
/* ②破壊され墓地へ送られた場合 */
reset0();
let kg4=mk('カイザー・グライダー',0),other=mk(BIG,1);
gameState.players[0].mz=[kg4];gameState.players[1].mz=[other];
API.destroy(h(kg4),'テスト破壊');
let ckg=ctxEv(0,kg4,'onDestroy',{card:kg4,uid:kg4.uid,reason:'effect'},'grave');
ok('カイザー・グライダー positive: 破壊されて墓地へ送られたら誘発する',
   sc('カイザー・グライダー').passive.onDestroy(ckg)===true);
sc('カイザー・グライダー').selectTargets(ckg,r=>{ckg.selectedTargets=r;});
sc('カイザー・グライダー').resolve(ckg);
ok('カイザー・グライダー positive: フィールドのモンスターが手札に戻る',
   gameState.players[1].hand.some(c=>c&&c.uid===other.uid));

/* --- ワンショット・ロケット --- */
reset0();
let wr=mk('ワンショット・ロケット',0),target=mk(BIG,1);
gameState.players[0].mz=[wr];gameState.players[1].mz=[target];
battleAt(0,0,'calc');
ok('ワンショット・ロケット positive: 攻撃する場合は戦闘では破壊されない',battleProof(wr)===true);
reset0();
let wr2=mk('ワンショット・ロケット',0),attacker=mk(BIG,1);
gameState.players[0].mz=[wr2];gameState.players[1].mz=[attacker];
battleFoeAt(0,0,'calc');
ok('ワンショット・ロケット negative: 攻撃される側では耐性を持たない',battleProof(wr2)===false);
reset0();
let wr3=mk('ワンショット・ロケット',0),tgt3=mk(BIG,1);
gameState.players[0].mz=[wr3];gameState.players[1].mz=[tgt3];
let bwr={atkCard:wr3,defCard:tgt3,destroyedAtk:false,destroyedDef:false,step:'after'};
let cwr=ctxDS(0,wr3,bwr,'mz','after');
ok('ワンショット・ロケット positive: 攻撃したら誘発する',sc('ワンショット・ロケット').passive.onDamageStep(cwr)===true);
let lpw=gameState.players[1].lp;
sc('ワンショット・ロケット').resolve(cwr);
ok('ワンショット・ロケット positive: 攻撃対象の攻撃力の半分のダメージ',
   gameState.players[1].lp===lpw-Math.floor(dbOf(tgt3).atk/2),'lp='+gameState.players[1].lp);

/* ================= W. ゴブリン暗殺部隊 ================= */
reset0();
let gb=mk('ゴブリン暗殺部隊',0);
gameState.players[0].mz=[gb];
ok('ゴブリン暗殺部隊 ruling: 直接攻撃が宣言できる',
   canDirectAttackThroughMonstersV51(gb)===true);
gb.attacked=true;
let cgb=ctxEv(0,gb,'onBattlePhaseEnd',{});
ok('ゴブリン暗殺部隊 positive: 攻撃した場合バトルフェイズ終了時に誘発する',
   sc('ゴブリン暗殺部隊').passive.onBattlePhaseEnd(cgb)===true);
sc('ゴブリン暗殺部隊').resolve(cgb);
ok('ゴブリン暗殺部隊 positive: 守備表示になる',gb.pos==='def','pos='+gb.pos);
ok('ゴブリン暗殺部隊 positive: 表示形式を変更できない',cannotChangePositionV10(gb)===true);
reset0();
let gb2=mk('ゴブリン暗殺部隊',0);
gameState.players[0].mz=[gb2];
ok('ゴブリン暗殺部隊 negative: 攻撃していなければ誘発しない',
   sc('ゴブリン暗殺部隊').passive.onBattlePhaseEnd(ctxEv(0,gb2,'onBattlePhaseEnd',{}))===false);
ok('ゴブリン暗殺部隊 negative: 攻撃前は表示形式を変更できる',cannotChangePositionV10(gb2)===false);

/* ================= Y. 戦闘破壊時の追加処理 ================= */
/* --- 聖導騎士イシュザーク --- */
reset0();
let iz=mk('聖導騎士イシュザーク',0),victim=mk(PLAIN,1);
gameState.players[0].mz=[iz];gameState.players[1].mz=[victim];
let biz={atkCard:iz,defCard:victim,destroyedDef:true,destroyedAtk:false,step:'after'};
let ciz=ctxDS(0,iz,biz,'mz','after');
ok('聖導騎士イシュザーク positive: 戦闘破壊したら誘発する',sc('聖導騎士イシュザーク').passive.onDamageStep(ciz)===true);
sc('聖導騎士イシュザーク').resolve(ciz);
ok('聖導騎士イシュザーク positive: 破壊したモンスターが除外される',
   gameState.players[1].banish.some(c=>c&&c.uid===victim.uid));
ok('聖導騎士イシュザーク ruling: 墓地には行かない',
   !gameState.players[1].grave.some(c=>c&&c.uid===victim.uid));
reset0();
let iz2=mk('聖導騎士イシュザーク',0),survivor=mk(BIG,1);
gameState.players[0].mz=[iz2];gameState.players[1].mz=[survivor];
ok('聖導騎士イシュザーク negative: 破壊していなければ誘発しない',
   sc('聖導騎士イシュザーク').passive.onDamageStep(
     ctxDS(0,iz2,{atkCard:iz2,defCard:survivor,destroyedDef:false},'mz','after'))===false);

/* --- ブルーサンダーT45 --- */
reset0();
let bt=mk('ブルーサンダーT45',0),v2=mk(PLAIN,1);
gameState.players[0].mz=[bt];gameState.players[1].mz=[v2];
let bbt={atkCard:bt,defCard:v2,destroyedDef:true,destroyedAtk:false,step:'after'};
let cbt=ctxDS(0,bt,bbt,'mz','after');
ok('ブルーサンダーT45 positive: 戦闘破壊したら誘発する',sc('ブルーサンダーT45').passive.onDamageStep(cbt)===true);
sc('ブルーサンダーT45').resolve(cbt);
ok('ブルーサンダーT45 positive: トークンが1体出る',gameState.players[0].mz.length===2);
ok('ブルーサンダーT45 ruling: トークンは機械族・光・レベル4・攻守1500',(()=>{
   const t=gameState.players[0].mz[1],d=dbOf(t);
   return d.ra==='機械'&&d.at==='光'&&Number(d.lv)===4&&Number(d.atk)===1500;})());
ok('ブルーサンダーT45 ruling: トークンはアドバンス召喚にリリースできない',
   gameState.players[0].mz[1].cannotTribute===true);

/* --- ファイナルサイコオーガ --- */
reset0();
let fo=mk('ファイナルサイコオーガ',0),v3=mk(PLAIN,1);
gameState.players[0].mz=[fo];gameState.players[1].mz=[v3];
let psyG=mk('ファイナルサイコオーガ',0);gameState.players[0].grave=[psyG];
gameState.players[0].lp=8000;
let bfo={atkCard:fo,defCard:v3,destroyedDef:true,destroyedAtk:false,step:'after'};
let cfo=ctxDS(0,fo,bfo,'mz','after');
ok('ファイナルサイコオーガ positive: 条件を満たせば誘発する',sc('ファイナルサイコオーガ').passive.onDamageStep(cfo)===true);
sc('ファイナルサイコオーガ').cost(cfo,()=>{});
ok('ファイナルサイコオーガ positive: 800ライフを払う',gameState.players[0].lp===7200);
sc('ファイナルサイコオーガ').selectTargets(cfo,r=>{cfo.selectedTargets=r;});
sc('ファイナルサイコオーガ').resolve(cfo);
ok('ファイナルサイコオーガ positive: 墓地のサイキックが手札に加わる',
   gameState.players[0].hand.some(c=>c&&c.uid===psyG.uid));
reset0();
let fo2=mk('ファイナルサイコオーガ',0),v4=mk(PLAIN,1);
gameState.players[0].mz=[fo2];gameState.players[1].mz=[v4];
gameState.players[0].grave=[];gameState.players[0].lp=8000;
ok('ファイナルサイコオーガ negative: 墓地にサイキックがいなければ発動できない',
   sc('ファイナルサイコオーガ').passive.onDamageStep(
     ctxDS(0,fo2,{atkCard:fo2,defCard:v4,destroyedDef:true},'mz','after'))===false);

/* --- ヴァンパイア・ベビー ---
   passive は盤面を書き換えず、既存の攻撃履歴＋v30 破壊記録から読み取る。 */
reset0();
gameState.phase='battle';
let vb=mk('ヴァンパイア・ベビー',0),prey=mk(PLAIN,1);
gameState.players[0].mz=[vb];gameState.players[1].mz=[prey];
ensureCardUid(gameState,vb);ensureCardUid(gameState,prey);
recordBattlePhaseAttackV6(gameState,0,vb,prey);
ok('ヴァンパイア・ベビー negative: まだ破壊していなければ誘発しない',
   sc('ヴァンパイア・ベビー').passive.onBattlePhaseEnd(ctxEv(0,vb,'onBattlePhaseEnd',{}))===false);
prey.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
let cvb2=ctxEv(0,vb,'onBattlePhaseEnd',{});
ok('ヴァンパイア・ベビー positive: バトルフェイズ終了時に誘発する',
   sc('ヴァンパイア・ベビー').passive.onBattlePhaseEnd(cvb2)===true);
ok('ヴァンパイア・ベビー ruling: passive は盤面を書き換えない（journal を汚さない）',(()=>{
   const before=v41ReplayPackage(gameState).actions.length;
   sc('ヴァンパイア・ベビー').passive.onBattlePhaseEnd(ctxEv(0,vb,'onBattlePhaseEnd',{}));
   return v41ReplayPackage(gameState).actions.length===before;})());
sc('ヴァンパイア・ベビー').selectTargets(cvb2,r=>{cvb2.selectedTargets=r;});
sc('ヴァンパイア・ベビー').resolve(cvb2);
ok('ヴァンパイア・ベビー positive: 破壊したモンスターを自分の場へ特殊召喚する',
   gameState.players[0].mz.some(c=>c&&c.uid===prey.uid),
   'p0mz='+gameState.players[0].mz.length);
reset0();
gameState.phase='battle';
let vb2=mk('ヴァンパイア・ベビー',0);
gameState.players[0].mz=[vb2];
ok('ヴァンパイア・ベビー negative: 戦闘していなければ誘発しない',
   sc('ヴァンパイア・ベビー').passive.onBattlePhaseEnd(ctxEv(0,vb2,'onBattlePhaseEnd',{}))===false);
reset0();
gameState.phase='battle';
let vb3=mk('ヴァンパイア・ベビー',0),other3=mk(BIG,0),prey3=mk(PLAIN,1);
gameState.players[0].mz=[vb3,other3];gameState.players[1].mz=[prey3];
ensureCardUid(gameState,vb3);ensureCardUid(gameState,other3);ensureCardUid(gameState,prey3);
recordBattlePhaseAttackV6(gameState,0,other3,prey3);
prey3.battleDestroyed=true;act({type:'BATTLE_CLEANUP'});
ok('ヴァンパイア・ベビー ruling: 他のモンスターが破壊した相手は対象にならない',
   sc('ヴァンパイア・ベビー').passive.onBattlePhaseEnd(ctxEv(0,vb3,'onBattlePhaseEnd',{}))===false);

/* ================= X ================= */
/* --- 超熱血球児 --- */
reset0();
let ck=mk('超熱血球児',0);
gameState.players[0].mz=[ck];
ok('超熱血球児 negative: 他の炎属性がいなければ上がらない',curATK(ck)===dbOf(ck).atk);
let fire1=mk('暴鬼',0);   /* 炎属性 */
gameState.players[0].mz=[ck,fire1];
ok('超熱血球児 positive: 他の炎属性1体につき+1000',
   curATK(ck)===dbOf(ck).atk+1000,'atk='+curATK(ck));
let cck=ctxEv(0,ck,'onSendToGrave',{card:fire1,uid:fire1.uid,reason:'effect'});
ok('超熱血球児 positive: 他の炎属性が墓地へ送られたら誘発する',
   sc('超熱血球児').passive.onSendToGrave(cck)===true);
let lpk=gameState.players[1].lp;
sc('超熱血球児').resolve(cck);
ok('超熱血球児 positive: 相手に500ダメージ',gameState.players[1].lp===lpk-500);
ok('超熱血球児 negative: 自分自身が墓地へ送られても誘発しない',
   sc('超熱血球児').passive.onSendToGrave(
     ctxEv(0,ck,'onSendToGrave',{card:ck,uid:ck.uid,reason:'effect'}))===false);

/* --- 終焉の精霊 --- */
reset0();
let se=mk('終焉の精霊',0);
gameState.players[0].mz=[se];
ok('終焉の精霊 negative: 除外に闇属性がいなければ攻守0',curATK(se)===0&&curDEF(se)===0,
   'atk='+curATK(se)+' def='+curDEF(se));
let d1=mk(DARKM,0),d2=mk(PLAIN,1);
gameState.players[0].banish=[d1];gameState.players[1].banish=[d2];
ok('終焉の精霊 positive: 除外されている闇属性の数×300 になる',
   curATK(se)===600&&curDEF(se)===600,'atk='+curATK(se));
API.destroy(h(se),'テスト破壊');
let cse=ctxEv(0,se,'onDestroy',{card:se,uid:se.uid,reason:'effect'},'grave');
ok('終焉の精霊 positive: 破壊されたら誘発する',sc('終焉の精霊').passive.onDestroy(cse)===true);
sc('終焉の精霊').resolve(cse);
ok('終焉の精霊 positive: 除外されていた闇属性が全て墓地へ戻る',
   gameState.players[0].banish.length===0&&gameState.players[1].banish.length===0,
   'b0='+gameState.players[0].banish.length+' b1='+gameState.players[1].banish.length);

/* ================= Z ================= */
/* --- 寂々虫 / 騒々虫 --- */
reset0();
let jj=mk('寂々虫',0),lvTarget=mk(BIG,0);   /* レベル8 */
gameState.players[0].hand=[jj];gameState.players[0].mz=[lvTarget];
let cjj=makeContext(0,jj,'hand',0,'activate',{});
ok('寂々虫 positive: フィールドにモンスターがいれば発動できる',sc('寂々虫').condition(cjj)===true);
let paid=false;sc('寂々虫').cost(cjj,v=>{paid=v;});
ok('寂々虫 positive: コストで手札から墓地へ送られる',
   paid===true&&gameState.players[0].grave.some(c=>c&&c.uid===jj.uid));
sc('寂々虫').selectTargets(cjj,r=>{cjj.selectedTargets=r;});
sc('寂々虫').resolve(cjj);
ok('寂々虫 positive: レベルが1つ下がる',curLV(lvTarget)===7,'lv='+curLV(lvTarget));
reset0();
let ss=mk('騒々虫',0),lvTarget2=mk(BIG,0);
gameState.players[0].hand=[ss];gameState.players[0].mz=[lvTarget2];
let css=makeContext(0,ss,'hand',0,'activate',{});
sc('騒々虫').cost(css,()=>{});
sc('騒々虫').selectTargets(css,r=>{css.selectedTargets=r;});
sc('騒々虫').resolve(css);
ok('騒々虫 positive: レベルが1つ上がる',curLV(lvTarget2)===9,'lv='+curLV(lvTarget2));
reset0();
let jj2=mk('寂々虫',0);gameState.players[0].hand=[jj2];
ok('寂々虫 negative: フィールドにモンスターがいなければ発動できない',
   sc('寂々虫').condition(makeContext(0,jj2,'hand',0,'activate',{}))===false);

/* --- A・O・J サイクルリーダー --- */
reset0();
let cl=mk('A・O・J サイクルリーダー',0);
gameState.players[0].hand=[cl];
let fl1=mk(BIG,1),fl2=mk(WARRIOR,1),fd1=mk(DARKM,1);
gameState.players[1].grave=[fl1,fl2,fd1];
let ccl=makeContext(0,cl,'hand',0,'activate',{});
ok('A・O・J サイクルリーダー positive: 相手墓地に光属性がいれば発動できる',
   sc('A・O・J サイクルリーダー').condition(ccl)===true);
sc('A・O・J サイクルリーダー').cost(ccl,()=>{});
sc('A・O・J サイクルリーダー').selectTargets(ccl,r=>{ccl.selectedTargets=r;});
ok('A・O・J サイクルリーダー positive: 光属性を2体まで選ぶ',(ccl.selectedTargets||[]).length===2);
sc('A・O・J サイクルリーダー').resolve(ccl);
ok('A・O・J サイクルリーダー positive: 選んだ光属性が除外される',
   gameState.players[1].banish.length===2,'banish='+gameState.players[1].banish.length);
ok('A・O・J サイクルリーダー ruling: 闇属性は除外されない',
   gameState.players[1].grave.some(c=>c&&c.uid===fd1.uid));
reset0();
let cl2=mk('A・O・J サイクルリーダー',0);
gameState.players[0].hand=[cl2];gameState.players[1].grave=[mk(DARKM,1)];
ok('A・O・J サイクルリーダー negative: 相手墓地に光属性がいなければ発動できない',
   sc('A・O・J サイクルリーダー').condition(makeContext(0,cl2,'hand',0,'activate',{}))===false);

/* --- 生存本能 --- */
reset0();
let sv=mk('生存本能',0,'down');
gameState.players[0].sz=[sv];
let dino=null;
for(let i=0;i<CARD_DB.length;i++){const d=CARD_DB[i];
  if(d&&d.k==='m'&&d.ra==='恐竜'&&!d.ex){dino={id:i,owner:0,controller:0,face:'up',pos:'atk'};ensureCardUid(gameState,dino);break;}}
let dino2={id:dino.id,owner:0,controller:0,face:'up',pos:'atk'};ensureCardUid(gameState,dino2);
gameState.players[0].grave=[dino,dino2];
gameState.players[0].lp=4000;
let csv=makeContext(0,sv,'sz',0,'activate',{});
ok('生存本能 positive: 墓地に恐竜族がいれば発動できる',sc('生存本能').condition(csv)===true);
sc('生存本能').resolve(csv);
let psv=pending();
ok('生存本能 ruling: 任意の枚数を選べる（min 0）',!!psv&&psv.min===0&&psv.max===2,
   'min='+(psv&&psv.min)+' max='+(psv&&psv.max));
answerChoiceV49(psv.candidates.map(x=>x.key));
ok('生存本能 positive: 除外した数×400 回復する',
   gameState.players[0].lp===4000+800,'lp='+gameState.players[0].lp);
ok('生存本能 positive: 選んだ恐竜が除外される',gameState.players[0].banish.length===2);
reset0();
let sv2=mk('生存本能',0,'down');gameState.players[0].sz=[sv2];
gameState.players[0].grave=[mk(BIG,0)];
ok('生存本能 negative: 墓地に恐竜族がいなければ発動できない',
   sc('生存本能').condition(makeContext(0,sv2,'sz',0,'activate',{}))===false);

/* ================= Replay / SaveLoad ================= */
reset0();
let rt=mk('ブルーサンダーT45',0);
gameState.players[0].mz=[rt];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.createToken(0,{key:'サンダーオプショントークン',name:'サンダーオプショントークン',atk:1500,def:1500,lv:4,ra:'機械',at:'光',pos:'atk'},1);
let a1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle04 Replay: トークン生成が digest 一致で再生される',a1.ok,a1.reason||'');
reset0();
let rl=mk('寂々虫',0),rm=mk(BIG,0);
gameState.players[0].hand=[rl];gameState.players[0].mz=[rm];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.sendHandToGrave(0,0,'寂々虫（コスト）');
API.modLevel(h(rm),-1,'endPhase','寂々虫');
let a2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle04 Replay: レベル変更が digest 一致で再生される',a2.ok,a2.reason||'');
reset0();
let rg=mk('ゴブリン暗殺部隊',0);
gameState.players[0].mz=[rg];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.setCardFlag(h(rg),'a6GoblinLockUntil',8,'ゴブリン暗殺部隊');
let a3=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle04 Replay: 表示形式ロックのフラグが digest 一致で再生される',a3.ok,a3.reason||'');
let snap=JSON.stringify(gameState);
ok('cycle04 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
