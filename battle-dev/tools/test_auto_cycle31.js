/* Auto cycle 31 — 9枚。positive / negative / ruling edge / Replay。 */
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

const ALL=['アサルト・アーマー','エレキューブ','サイクロンレーザー','サイクロン・ブーメラン',
 'D－チェーン','アサルト・スピリッツ','C・スネーク','D・クリーナン','サイバー・レイダー'];
ALL.forEach(n=>ok('cycle31 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle31 枚数は9',ALL.length===9);

const WARR='D.D.アサイラント';        /* 戦士 lv4 */
const THUN='でんきトカゲ';            /* 雷 atk850 */
const VIPER='超時空戦闘機ビック・バイパー';
const WILD='E・HERO ワイルドマン';
const DHERO='D－HERO ダンクガイ';
const WEAK='ADチェンジャー';          /* atk100 */
const EQUIP='7カード';                /* 装備魔法 */

function killedBattle(atkCard,defCard){
  return {atkCard:atkCard,defCard:defCard,destroyedDef:true,destroyedAtk:false};
}
/* 装備カードを手で結ぶ（発動処理を通さずに装備状態を作る） */
function linkEquip(eq,host,uidSeed){
  ensureCardUid(gameState,eq);ensureCardUid(gameState,host);
  eq.equipUid=eq.equipUid||uidSeed;
  eq.equipTo={p:0,uid:host.uid};
  host.equippedBy=(host.equippedBy||[]).concat([eq.equipUid]);
  eq.face='up';
}

/* ============ 1. アサルト・アーマー ============ */
reset0();
let aa=mk('アサルト・アーマー',0),aaWar=mk(WARR,0);
gameState.players[0].sz=[aa];gameState.players[0].mz=[aaWar];
let aaCtx=C(0,aa,'sz',0,'activate',{});
ok('アサルト・アーマー positive: 戦士族1体のみなら発動できる',
   sc('アサルト・アーマー').condition(aaCtx)===true);
sc('アサルト・アーマー').selectTargets(aaCtx,r=>{aaCtx.selectedTargets=r;});
sc('アサルト・アーマー').resolve(aaCtx);
aa.face='up';
ok('アサルト・アーマー card-specific: 装備され攻撃力が300アップ',
   !!aa.equipTo&&curATK(aaWar)===dbOf(aaWar).atk+300,'atk='+curATK(aaWar));
let aaCtx2=C(0,aa,'sz',0,'activate',{});
ok('アサルト・アーマー positive: 装備中は②を発動できる',
   sc('アサルト・アーマー').condition(aaCtx2)===true);
let aaCost=false;sc('アサルト・アーマー').cost(aaCtx2,v=>{aaCost=v;});
ok('アサルト・アーマー positive: コストで自身が墓地へ送られる',
   aaCost&&gameState.players[0].sz.length===0);
sc('アサルト・アーマー').resolve(aaCtx2);
ok('アサルト・アーマー card-specific: 2回攻撃できるようになる',
   Number(aaWar.attackLimit)===2&&Number(aaWar.attackLimitTurn)===gameState.turn,
   'limit='+aaWar.attackLimit);
reset0();
let aa2=mk('アサルト・アーマー',0),aa2War=mk(WARR,0),aa2Other=mk(BIG,0);
gameState.players[0].sz=[aa2];gameState.players[0].mz=[aa2War,aa2Other];
ok('アサルト・アーマー negative: モンスターが2体いると装備できない',
   sc('アサルト・アーマー').condition(C(0,aa2,'sz',0,'activate',{}))===false);
reset0();
let aa3=mk('アサルト・アーマー',0),aa3NonWar=mk(BIG,0);
gameState.players[0].sz=[aa3];gameState.players[0].mz=[aa3NonWar];
ok('アサルト・アーマー ruling: 戦士族以外1体では装備できない',
   sc('アサルト・アーマー').condition(C(0,aa3,'sz',0,'activate',{}))===false);

/* ============ 2. エレキューブ ============ */
reset0();
let ec=mk('エレキューブ',0),ecTh=mk(THUN,0);
gameState.players[0].sz=[ec];gameState.players[0].mz=[ecTh];
gameState.players[0].grave=[mk(THUN,0),mk(THUN,0)];
let ecCtx=C(0,ec,'sz',0,'activate',{});
ok('エレキューブ positive: 雷族がいれば発動できる',
   sc('エレキューブ').condition(ecCtx)===true);
ecCtx.selectedTargets=[h(ecTh)];
sc('エレキューブ').resolve(ecCtx);
ec.face='up';
ok('エレキューブ card-specific: 墓地の雷族の数×100アップ（2体＝200）',
   curATK(ecTh)===dbOf(ecTh).atk+200,'atk='+curATK(ecTh));
let ecCtx2=C(0,ec,'sz',0,'activate',{});
sc('エレキューブ').selectTargets(ecCtx2,r=>{ecCtx2.selectedTargets=r;});
let ecCost=false;sc('エレキューブ').cost(ecCtx2,v=>{ecCost=v;});
ok('エレキューブ positive: コストで自身が墓地へ送られる',
   ecCost&&gameState.players[0].sz.length===0);
let ecAtk=curATK(ecTh);
sc('エレキューブ').resolve(ecCtx2);
ok('エレキューブ card-specific: 雷族1体の攻撃力が1000アップ',
   curATK(ecTh)===ecAtk+1000,'atk='+ecAtk+'→'+curATK(ecTh));
reset0();
let ec2=mk('エレキューブ',0),ec2NonTh=mk(BIG,0);
gameState.players[0].sz=[ec2];gameState.players[0].mz=[ec2NonTh];
ok('エレキューブ negative: 雷族がいなければ発動できない',
   sc('エレキューブ').condition(C(0,ec2,'sz',0,'activate',{}))===false);
ok('エレキューブ ruling: 雷族以外には装備できない（equipSpec）',
   equipLegalV15(ec2,h(ec2NonTh))===false);

/* ============ 3. サイクロンレーザー ============ */
reset0();
let cl=mk('サイクロンレーザー',0),clVi=mk(VIPER,0);
gameState.players[0].sz=[cl];gameState.players[0].mz=[clVi];
let clCtx=C(0,cl,'sz',0,'activate',{});
ok('サイクロンレーザー positive: ビック・バイパーがいれば発動できる',
   sc('サイクロンレーザー').condition(clCtx)===true);
clCtx.selectedTargets=[h(clVi)];
sc('サイクロンレーザー').resolve(clCtx);
cl.face='up';
ok('サイクロンレーザー card-specific: 装備され攻撃力が300アップ',
   !!cl.equipTo&&curATK(clVi)===dbOf(clVi).atk+300,'atk='+curATK(clVi));
ok('サイクロンレーザー card-specific: 貫通を宣言している（piercingDamage）',
   sc('サイクロンレーザー').continuous.piercingDamage(
     {self:cl,atkCard:clVi,amount:400})===400);
ok('サイクロンレーザー ruling: 装備先以外が攻撃しても貫通しない',
   sc('サイクロンレーザー').continuous.piercingDamage(
     {self:cl,atkCard:mk(BIG,0),amount:400})===0);
reset0();
let cl2=mk('サイクロンレーザー',0),cl2Other=mk(BIG,0);
gameState.players[0].sz=[cl2];gameState.players[0].mz=[cl2Other];
ok('サイクロンレーザー negative: ビック・バイパーがいなければ発動できない',
   sc('サイクロンレーザー').condition(C(0,cl2,'sz',0,'activate',{}))===false);

/* ============ 4. サイクロン・ブーメラン ============ */
reset0();
let cb=mk('サイクロン・ブーメラン',0),cbWild=mk(WILD,0);
gameState.players[0].sz=[cb];gameState.players[0].mz=[cbWild];
let cbCtx=C(0,cb,'sz',0,'activate',{});
ok('サイクロン・ブーメラン positive: ワイルドマンがいれば発動できる',
   sc('サイクロン・ブーメラン').condition(cbCtx)===true);
cbCtx.selectedTargets=[h(cbWild)];
sc('サイクロン・ブーメラン').resolve(cbCtx);
cb.face='up';
ok('サイクロン・ブーメラン card-specific: 装備され攻撃力が500アップ',
   !!cb.equipTo&&curATK(cbWild)===dbOf(cbWild).atk+500,'atk='+curATK(cbWild));
/* 装備先が効果で破壊された状況を作る */
gameState.players[0].mz=[];gameState.players[0].grave=[cbWild];
cbWild.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
gameState.destroyedThisTurnV30=[{byPlayer:1,victimPlayer:0,from:'mz',
  uid:cbWild.uid,turn:gameState.turn,battle:false}];
gameState.players[1].sz=[mk('強欲な壺',1),mk('落とし穴',1)];
let cbCtx2=C(0,cb,'sz',0,'activate',{});
ok('サイクロン・ブーメラン positive: 効果で破壊された時に誘発する',
   sc('サイクロン・ブーメラン').condition(cbCtx2)===true);
let cbLp=gameState.players[1].lp;
sc('サイクロン・ブーメラン').resolve(cbCtx2);
ok('サイクロン・ブーメラン card-specific: 魔法・罠を全て破壊し枚数×100ダメージ',
   gameState.players[1].sz.length===0
   &&gameState.players[1].lp<cbLp,
   'lp='+cbLp+'→'+gameState.players[1].lp);
reset0();
let cb2=mk('サイクロン・ブーメラン',0),cb2Wild=mk(WILD,0);
gameState.players[0].sz=[cb2];gameState.players[0].grave=[cb2Wild];
linkEquip(cb2,cb2Wild,701);
cb2Wild.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
gameState.destroyedThisTurnV30=[{byPlayer:1,victimPlayer:0,from:'mz',
  uid:cb2Wild.uid,turn:gameState.turn,battle:true}];
ok('サイクロン・ブーメラン negative: 戦闘破壊では誘発しない',
   sc('サイクロン・ブーメラン').condition(C(0,cb2,'sz',0,'activate',{}))===false);

/* ============ 5. D－チェーン ============ */
reset0();
let dc=mk('D－チェーン',0,'down'),dcHero=mk(DHERO,0);
gameState.players[0].sz=[dc];gameState.players[0].mz=[dcHero];
let dcCtx=C(0,dc,'sz',0,'activate',{});
ok('D－チェーン positive: 自分の「D－HERO」がいれば発動できる',
   sc('D－チェーン').condition(dcCtx)===true);
dcCtx.selectedTargets=[h(dcHero)];
sc('D－チェーン').resolve(dcCtx);
dc.face='up';
ok('D－チェーン card-specific: 装備され攻撃力が500アップ',
   !!dc.equipTo&&curATK(dcHero)===dbOf(dcHero).atk+500,'atk='+curATK(dcHero));
let dcFoe=mk(PLAIN,1);gameState.players[1].grave=[dcFoe];
let dcCtx2=ctxDS(0,dc,killedBattle(dcHero,dcFoe),'sz');
ok('D－チェーン positive: 装備先が戦闘破壊した時に誘発する',
   sc('D－チェーン').passive.onDamageStep(dcCtx2)===true);
let dcLp=gameState.players[1].lp;
sc('D－チェーン').resolve(dcCtx2);
ok('D－チェーン card-specific: 相手に500ダメージ',
   gameState.players[1].lp===dcLp-500);
reset0();
let dc2=mk('D－チェーン',0,'down'),dc2Other=mk(BIG,0);
gameState.players[0].sz=[dc2];gameState.players[0].mz=[dc2Other];
ok('D－チェーン negative: 「D－HERO」がいなければ発動できない',
   sc('D－チェーン').condition(C(0,dc2,'sz',0,'activate',{}))===false);
ok('D－チェーン ruling: SETCODE で「D－HERO」を判定している',
   isSetCardV4(dbOf(dcHero),SETCODE.DESTINY_HERO)===true);

/* ============ 6. アサルト・スピリッツ ============ */
reset0();
let as=mk('アサルト・スピリッツ',0,'down'),asMon=mk(BIG,0);
gameState.players[0].sz=[as];gameState.players[0].mz=[asMon];
let asCtx=C(0,as,'sz',0,'activate',{});
ok('アサルト・スピリッツ positive: 自分のモンスターがいれば発動できる',
   sc('アサルト・スピリッツ').condition(asCtx)===true);
asCtx.selectedTargets=[h(asMon)];
sc('アサルト・スピリッツ').resolve(asCtx);
as.face='up';
ok('アサルト・スピリッツ positive: モンスターに装備される',
   !!as.equipTo&&as.equipTo.uid===asMon.uid);
gameState.phase='battle';
let asFoe=mk(PLAIN,1);gameState.players[1].mz=[asFoe];
gameState.battle={player:0,atkIdx:0,target:0};
gameState.players[0].hand=[mk(WEAK,0)];
let asCtx2=C(0,as,'sz',0,'activate',{});
ok('アサルト・スピリッツ positive: 装備先の攻撃時に発動できる',
   sc('アサルト・スピリッツ').condition(asCtx2)===true);
sc('アサルト・スピリッツ').selectTargets(asCtx2,r=>{asCtx2.selectedTargets=r;});
let asCost=false;sc('アサルト・スピリッツ').cost(asCtx2,v=>{asCost=v;});
ok('アサルト・スピリッツ positive: コストで手札のモンスターを墓地へ送る',
   asCost&&gameState.players[0].hand.length===0);
let asAtk=curATK(asMon);
sc('アサルト・スピリッツ').resolve(asCtx2);
ok('アサルト・スピリッツ card-specific: 墓地へ送ったモンスターの攻撃力分アップ（100）',
   curATK(asMon)===asAtk+100,'atk='+asAtk+'→'+curATK(asMon));
ok('アサルト・スピリッツ ruling: 1ターンに1度（countLimit）',
   sc('アサルト・スピリッツ').countLimit===1);
gameState.battle=null;
reset0();
let as2=mk('アサルト・スピリッツ',0),as2Mon=mk(BIG,0);
gameState.players[0].sz=[as2];gameState.players[0].mz=[as2Mon];
linkEquip(as2,as2Mon,702);
gameState.players[0].hand=[mk(BIG,0)];   /* 攻撃力3000 */
gameState.phase='battle';
gameState.battle={player:0,atkIdx:0,target:0};
gameState.players[1].mz=[mk(PLAIN,1)];
ok('アサルト・スピリッツ negative: 攻撃力1000以下が手札になければ発動できない',
   sc('アサルト・スピリッツ').condition(C(0,as2,'sz',0,'activate',{}))===false);
gameState.battle=null;

/* ============ 7. C・スネーク ============ */
reset0();
let cs=mk('C・スネーク',0),csFoe=mk(BIG,1);
gameState.players[0].mz=[cs];gameState.players[1].mz=[csFoe];
ensureCardUid(gameState,cs);ensureCardUid(gameState,csFoe);
let csCtx=C(0,cs,'mz',0,'activate',{});
ok('C・スネーク positive: 相手の表側モンスターがいれば発動できる',
   sc('C・スネーク').condition(csCtx)===true);
csCtx.selectedTargets=[h(csFoe)];
let csAtk=curATK(csFoe);
sc('C・スネーク').resolve(csCtx);
ok('C・スネーク positive: 装備カード扱いとして相手モンスターに装備される',
   gameState.players[0].sz.length===1&&!!cs.equipTo&&cs.equipTo.uid===csFoe.uid,
   'sz='+gameState.players[0].sz.length);
ok('C・スネーク card-specific: 装備モンスターの攻守が800ダウン',
   curATK(csFoe)===csAtk-800&&curDEF(csFoe)===dbOf(csFoe).def-800,
   'atk='+csAtk+'→'+curATK(csFoe));
gameState.players[1].mz=[];gameState.players[1].grave=[csFoe];
for(let i=0;i<10;i++) gameState.players[1].deck.push(mk(PLAIN,1));
let csDeck=gameState.players[1].deck.length;
let csCtx2=ctxDS(0,cs,{atkCard:mk(BIG,0),defCard:csFoe,destroyedDef:true},'sz');
ok('C・スネーク positive: 装備先が戦闘破壊された時に誘発する',
   sc('C・スネーク').passive.onDamageStep(csCtx2)===true);
sc('C・スネーク').resolve(csCtx2);
ok('C・スネーク card-specific: そのレベル分だけデッキの上から墓地へ送る（青眼レベル8）',
   gameState.players[1].deck.length===csDeck-8,
   'deck='+csDeck+'→'+gameState.players[1].deck.length);
reset0();
let cs2=mk('C・スネーク',0);
gameState.players[0].mz=[cs2];gameState.players[1].mz=[];
ok('C・スネーク negative: 相手の表側モンスターがいなければ発動できない',
   sc('C・スネーク').condition(C(0,cs2,'mz',0,'activate',{}))===false);

/* ============ 8. D・クリーナン ============ */
reset0();
let dk=mk('D・クリーナン',0,'up','def'),dkFoe=mk(BIG,1,'up','atk');
gameState.players[0].mz=[dk];gameState.players[1].mz=[dkFoe];
ensureCardUid(gameState,dk);ensureCardUid(gameState,dkFoe);
let dkCtx=C(0,dk,'mz',0,'activate',{});
ok('D・クリーナン positive: 守備表示なら相手の攻撃表示モンスターを装備できる',
   sc('D・クリーナン').condition(dkCtx)===true);
dkCtx.selectedTargets=[h(dkFoe)];
sc('D・クリーナン').resolve(dkCtx);
ok('D・クリーナン card-specific: 相手モンスターが装備カード扱いになる',
   gameState.players[0].sz.length===1&&gameState.players[1].mz.length===0,
   'sz='+gameState.players[0].sz.length);
ok('D・クリーナン ruling: 既に1体装備していれば再度は装備できない',
   sc('D・クリーナン').condition(C(0,dk,'mz',0,'activate',{}))===false);
reset0();
let dk2=mk('D・クリーナン',0,'up','atk'),dk2Eq=mk(EQUIP,0);
gameState.players[0].mz=[dk2];gameState.players[0].sz=[dk2Eq];
linkEquip(dk2Eq,dk2,703);
let dk2Ctx=C(0,dk2,'mz',0,'activate',{});
ok('D・クリーナン positive: 攻撃表示なら装備カードを墓地へ送って発動できる',
   sc('D・クリーナン').condition(dk2Ctx)===true);
sc('D・クリーナン').selectTargets(dk2Ctx,r=>{dk2Ctx.selectedTargets=r;});
sc('D・クリーナン').cost(dk2Ctx,()=>{});
let dk2Lp=gameState.players[1].lp;
sc('D・クリーナン').resolve(dk2Ctx);
ok('D・クリーナン card-specific: 装備カードを墓地へ送って500ダメージ',
   gameState.players[0].sz.length===0&&gameState.players[1].lp===dk2Lp-500,
   'lp='+dk2Lp+'→'+gameState.players[1].lp);
reset0();
let dk3=mk('D・クリーナン',0,'up','atk');
gameState.players[0].mz=[dk3];gameState.players[0].sz=[];
ok('D・クリーナン negative: 攻撃表示で装備カードが無ければ発動できない',
   sc('D・クリーナン').condition(C(0,dk3,'mz',0,'activate',{}))===false);
ok('D・クリーナン ruling: 1ターンに1度（countLimit）',sc('D・クリーナン').countLimit===1);

/* ============ 9. サイバー・レイダー ============ */
reset0();
let cr=mk('サイバー・レイダー',0),crHost=mk(BIG,1),crEq=mk(EQUIP,1);
gameState.players[0].mz=[cr];gameState.players[1].mz=[crHost];
gameState.players[1].sz=[crEq];
ensureCardUid(gameState,cr);ensureCardUid(gameState,crHost);ensureCardUid(gameState,crEq);
crEq.equipUid=crEq.equipUid||704;crEq.equipTo={p:1,uid:crHost.uid};
crHost.equippedBy=[crEq.equipUid];crEq.face='up';
let crCtx=ctxEv(0,cr,'onNormalSummon',{card:cr},'mz');
ok('サイバー・レイダー positive: 召喚成功時にフィールドの装備カードへ反応する',
   sc('サイバー・レイダー').passive.onNormalSummon(crCtx)===true);
sc('サイバー・レイダー').resolve(crCtx);
/* S03-U62: resolve() は先にSaveLoad安全な yes/no 選択（破壊する／装備する）を発行するようになった。
   「はい（破壊する）」を選ぶと、続けて実際に破壊するカードの選択要求が出る。 */
ok('サイバー・レイダー positive: 破壊/装備の確認選択が出る',!!pending()&&pending().kind==='yesno');
API.answerChoice(['yes']);
ok('サイバー・レイダー positive: 装備カードの選択要求が出る',
   !!pending()&&pending().player===0);
API.answerChoice([pending().candidates[0].key]);
ok('サイバー・レイダー card-specific: 選んだ装備カードが破壊される',
   gameState.players[1].sz.length===0,'sz='+gameState.players[1].sz.length);
reset0();
let cr2=mk('サイバー・レイダー',0);
gameState.players[0].mz=[cr2];
ok('サイバー・レイダー negative: 装備カードが無ければ発動できない',
   sc('サイバー・レイダー').condition(
     ctxEv(0,cr2,'onNormalSummon',{card:cr2},'mz'))===false);

/* ================= passive / continuous は read-only ================= */
reset0();
let roCl=mk('サイクロンレーザー',0),roVi=mk(VIPER,0),roCs=mk('C・スネーク',0);
gameState.players[0].sz=[roCl];gameState.players[0].mz=[roVi,roCs];
linkEquip(roCl,roVi,705);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
curATK(roVi);curATK(roCs);curDEF(roVi);
ok('cycle31 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('D－チェーン',0,'down'),rp1Hero=mk(DHERO,0);
gameState.players[0].sz=[rp1];gameState.players[0].mz=[rp1Hero];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let rp1Ctx=C(0,rp1,'sz',0,'activate',{});
rp1Ctx.selectedTargets=[h(rp1Hero)];
sc('D－チェーン').resolve(rp1Ctx);
let rq1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle31 Replay: 罠の装備が digest 一致で再生される',rq1.ok,rq1.reason||'');
reset0();
let rp2=mk('C・スネーク',0),rp2Foe=mk(BIG,1);
gameState.players[0].mz=[rp2];gameState.players[1].mz=[rp2Foe];
ensureCardUid(gameState,rp2);ensureCardUid(gameState,rp2Foe);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let rp2Ctx=C(0,rp2,'mz',0,'activate',{});
rp2Ctx.selectedTargets=[h(rp2Foe)];
sc('C・スネーク').resolve(rp2Ctx);
let rq2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle31 Replay: モンスターの装備カード化が digest 一致で再生される',rq2.ok,rq2.reason||'');
let snap31=JSON.stringify(gameState);
ok('cycle31 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap31))===snap31);
ok('cycle31 直列化: 予約に関数が入っていない',snap31.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
