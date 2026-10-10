/* Auto cycle 35 — 8枚。positive / negative / ruling edge / Replay。 */
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

const ALL=['バスターランチャー','ダーク・シティ','ビーストライザー','ドラグニティナイト－ゲイボルグ',
 'ウィンドファーム・ジェネクス','デス・ヴォルストガルフ','ビッグバン・シュート','ネクロフェイス'];
ALL.forEach(n=>ok('cycle35 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle35 枚数は8',ALL.length===8);

const WEAK='ADチェンジャー';        /* atk100 */
const BEAST='エレファン';           /* 獣 */
const BEAST2='X－セイバー エアベルン'; /* 獣 lv3 */
const WING='BF－疾風のゲイル';       /* 鳥獣 */
const DHERO='D－HERO ダンクガイ';    /* D－HERO atk1200 */

function killedBattle(atkCard,defCard){
  return {atkCard:atkCard,defCard:defCard,destroyedDef:true,destroyedAtk:false};
}

/* ============ 1. バスターランチャー ============ */
reset0();
let bl=mk('バスターランチャー',0),blMon=mk(WEAK,0),blFoe=mk(BIG,1);
gameState.players[0].sz=[bl];gameState.players[0].mz=[blMon];
gameState.players[1].mz=[blFoe];
let blCtx=C(0,bl,'sz',0,'activate',{});
ok('バスターランチャー positive: 攻撃力1000以下がいれば発動できる',
   sc('バスターランチャー').condition(blCtx)===true);
blCtx.selectedTargets=[h(blMon)];
sc('バスターランチャー').resolve(blCtx);
bl.face='up';
ok('バスターランチャー positive: 装備される',
   !!bl.equipTo&&bl.equipTo.uid===blMon.uid);
ok('バスターランチャー ruling: 戦闘中でなければ攻撃力は上がらない',
   curATK(blMon)===dbOf(blMon).atk,'atk='+curATK(blMon));
gameState.battle={player:0,atkIdx:0,target:0};
ok('バスターランチャー card-specific: 攻撃表示で攻撃力2500以上の相手と戦闘すると2500アップ',
   curATK(blMon)===dbOf(blMon).atk+2500,'atk='+curATK(blMon));
gameState.battle=null;
reset0();
let bl2=mk('バスターランチャー',0),bl2Mon=mk(WEAK,0),bl2Foe=mk(PLAIN,1);
gameState.players[0].sz=[bl2];gameState.players[0].mz=[bl2Mon];
gameState.players[1].mz=[bl2Foe];
ensureCardUid(gameState,bl2);ensureCardUid(gameState,bl2Mon);
bl2.equipUid=bl2.equipUid||1001;bl2.equipTo={p:0,uid:bl2Mon.uid};
bl2Mon.equippedBy=[bl2.equipUid];bl2.face='up';
gameState.battle={player:0,atkIdx:0,target:0};
ok('バスターランチャー negative: 相手の数値が2500未満なら上がらない',
   curATK(bl2Mon)===dbOf(bl2Mon).atk,'atk='+curATK(bl2Mon));
gameState.battle=null;
reset0();
let bl3=mk('バスターランチャー',0),bl3Big=mk(BIG,0);
gameState.players[0].sz=[bl3];gameState.players[0].mz=[bl3Big];
ok('バスターランチャー ruling: 攻撃力1001以上には装備できない（equipSpec）',
   equipLegalV15(bl3,h(bl3Big))===false);

/* ============ 2. ダーク・シティ ============ */
reset0();
let dc=mk('ダーク・シティ',0),dcHero=mk(DHERO,0),dcFoe=mk(BIG,1);
gameState.players[0].field=dc;gameState.players[0].mz=[dcHero];
gameState.players[1].mz=[dcFoe];
gameState.battle={player:0,atkIdx:0,target:0};
ok('ダーク・シティ card-specific: 攻撃力の高い相手を攻撃した「D－HERO」は1000アップ',
   curATK(dcHero)===dbOf(dcHero).atk+1000,'atk='+curATK(dcHero));
gameState.battle=null;
ok('ダーク・シティ ruling: 戦闘中でなければ上がらない',
   curATK(dcHero)===dbOf(dcHero).atk);
reset0();
let dc2=mk('ダーク・シティ',0),dc2Hero=mk(DHERO,0),dc2Weak=mk(WEAK,1);
gameState.players[0].field=dc2;gameState.players[0].mz=[dc2Hero];
gameState.players[1].mz=[dc2Weak];
gameState.battle={player:0,atkIdx:0,target:0};
ok('ダーク・シティ negative: 相手の攻撃力が低ければ上がらない',
   curATK(dc2Hero)===dbOf(dc2Hero).atk,'atk='+curATK(dc2Hero));
gameState.battle=null;
reset0();
let dc3=mk('ダーク・シティ',0),dc3NonHero=mk(WEAK,0),dc3Foe=mk(BIG,1);
gameState.players[0].field=dc3;gameState.players[0].mz=[dc3NonHero];
gameState.players[1].mz=[dc3Foe];
gameState.battle={player:0,atkIdx:0,target:0};
ok('ダーク・シティ ruling: 「D－HERO」以外は対象にならない',
   curATK(dc3NonHero)===dbOf(dc3NonHero).atk);
gameState.battle=null;

/* ============ 3. ビーストライザー ============ */
reset0();
let br=mk('ビーストライザー',0,'down'),brA=mk(BEAST,0),brB=mk(BEAST2,0);
gameState.players[0].sz=[br];gameState.players[0].mz=[brA,brB];
let brCtx=C(0,br,'sz',0,'activate',{});
ok('ビーストライザー positive: 獣族が2体いれば発動できる',
   sc('ビーストライザー').condition(brCtx)===true);
brCtx.selectedTargets=[h(brA)];
let brCost=false;sc('ビーストライザー').cost(brCtx,v=>{brCost=v;});
ok('ビーストライザー positive: コストで獣族が除外される',
   brCost&&gameState.players[0].banish.length===1&&gameState.players[0].mz.length===1);
let brAtk=curATK(brB);
sc('ビーストライザー').resolve(brCtx);
ok('ビーストライザー positive: 対象選択の要求が出る',!!pending()&&pending().player===0);
API.answerChoice([pending().candidates[0].key]);
ok('ビーストライザー card-specific: 除外したモンスターの元々の攻撃力分アップ',
   curATK(brB)===brAtk+Number(dbOf(brA).atk),
   'atk='+brAtk+'→'+curATK(brB)+' (+'+dbOf(brA).atk+')');
reset0();
let br2=mk('ビーストライザー',0,'down'),br2One=mk(BEAST,0);
gameState.players[0].sz=[br2];gameState.players[0].mz=[br2One];
ok('ビーストライザー negative: 獣族が1体では発動できない',
   sc('ビーストライザー').condition(C(0,br2,'sz',0,'activate',{}))===false);
ok('ビーストライザー ruling: 1ターンに1度（countLimit）',
   sc('ビーストライザー').countLimit===1);

/* ============ 4. ドラグニティナイト－ゲイボルグ ============ */
reset0();
gameState.phase='battle';
let gb=mk('ドラグニティナイト－ゲイボルグ',0),gbFoe=mk(BIG,1);
gameState.players[0].mz=[gb];gameState.players[1].mz=[gbFoe];
gameState.players[0].grave=[mk(WING,0)];
gameState.battle={player:0,atkIdx:0,target:0};
let gbCtx=C(0,gb,'mz',0,'activate',{});
ok('ドラグニティナイト－ゲイボルグ positive: 戦闘中で墓地に鳥獣族がいれば発動できる',
   sc('ドラグニティナイト－ゲイボルグ').condition(gbCtx)===true);
gbCtx.selectedTargets=[h(gameState.players[0].grave[0])];
let gbWing=gameState.players[0].grave[0];
let gbAdd=Number(dbOf(gbWing).atk);
let gbCost=false;sc('ドラグニティナイト－ゲイボルグ').cost(gbCtx,v=>{gbCost=v;});
ok('ドラグニティナイト－ゲイボルグ positive: コストで鳥獣族が除外される',
   gbCost&&gameState.players[0].banish.length===1);
let gbAtk=curATK(gb);
sc('ドラグニティナイト－ゲイボルグ').resolve(gbCtx);
ok('ドラグニティナイト－ゲイボルグ card-specific: 除外した鳥獣族の元々の攻撃力分アップ',
   curATK(gb)===gbAtk+gbAdd,'atk='+gbAtk+'→'+curATK(gb));
gameState.battle=null;
reset0();
gameState.phase='battle';
let gb2=mk('ドラグニティナイト－ゲイボルグ',0),gb2Foe=mk(BIG,1);
gameState.players[0].mz=[gb2];gameState.players[1].mz=[gb2Foe];
gameState.players[0].grave=[mk(BIG,0)];
gameState.battle={player:0,atkIdx:0,target:0};
ok('ドラグニティナイト－ゲイボルグ negative: 墓地に鳥獣族がいなければ発動できない',
   sc('ドラグニティナイト－ゲイボルグ').condition(C(0,gb2,'mz',0,'activate',{}))===false);
gameState.battle=null;
reset0();
let gb3=mk('ドラグニティナイト－ゲイボルグ',0);
gameState.players[0].mz=[gb3];gameState.players[0].grave=[mk(WING,0)];
ok('ドラグニティナイト－ゲイボルグ ruling: 戦闘していなければ発動できない',
   sc('ドラグニティナイト－ゲイボルグ').condition(C(0,gb3,'mz',0,'activate',{}))===false);

/* ============ 5. ウィンドファーム・ジェネクス ============ */
reset0();
let wg=mk('ウィンドファーム・ジェネクス',0);
gameState.players[0].mz=[wg];
gameState.players[1].sz=[mk('落とし穴',1,'down'),mk('落とし穴',1,'down')];
gameState.players[0].hand=[mk(PLAIN,0)];
ok('ウィンドファーム・ジェネクス card-specific: セットされた魔法・罠の数×300アップ（2枚＝600）',
   curATK(wg)===dbOf(wg).atk+600,'atk='+curATK(wg));
let wgCtx=C(0,wg,'mz',0,'activate',{});
ok('ウィンドファーム・ジェネクス positive: 手札とセットカードがあれば発動できる',
   sc('ウィンドファーム・ジェネクス').condition(wgCtx)===true);
let wgCost=false;sc('ウィンドファーム・ジェネクス').cost(wgCtx,v=>{wgCost=v;});
ok('ウィンドファーム・ジェネクス positive: コストで手札を1枚墓地へ送る',
   wgCost&&gameState.players[0].hand.length===0);
sc('ウィンドファーム・ジェネクス').selectTargets(wgCtx,r=>{wgCtx.selectedTargets=r;});
sc('ウィンドファーム・ジェネクス').resolve(wgCtx);
ok('ウィンドファーム・ジェネクス card-specific: セットされた魔法・罠が破壊され攻撃力も下がる',
   gameState.players[1].sz.length===1&&curATK(wg)===dbOf(wg).atk+300,
   'sz='+gameState.players[1].sz.length+' atk='+curATK(wg));
reset0();
let wg2=mk('ウィンドファーム・ジェネクス',0);
gameState.players[0].mz=[wg2];gameState.players[0].hand=[mk(PLAIN,0)];
gameState.players[1].sz=[];
ok('ウィンドファーム・ジェネクス negative: セットカードが無ければ発動できない',
   sc('ウィンドファーム・ジェネクス').condition(C(0,wg2,'mz',0,'activate',{}))===false);

/* ============ 6. デス・ヴォルストガルフ ============ */
reset0();
let dv=mk('デス・ヴォルストガルフ',0),dvFoe=mk(PLAIN,1);
gameState.players[0].mz=[dv];gameState.players[1].grave=[dvFoe];
let dvCtx=ctxDS(0,dv,killedBattle(dv,dvFoe));
ok('デス・ヴォルストガルフ positive: 戦闘破壊で誘発する',
   sc('デス・ヴォルストガルフ').passive.onDamageStep(dvCtx)===true);
let dvLp=gameState.players[1].lp;
sc('デス・ヴォルストガルフ').resolve(dvCtx);
ok('デス・ヴォルストガルフ card-specific: 相手に500ダメージ',
   gameState.players[1].lp===dvLp-500);
reset0();
let dv2=mk('デス・ヴォルストガルフ',0),dv2Sp=mk('強欲な壺',1);
gameState.players[0].mz=[dv2];gameState.players[1].sz=[dv2Sp];
ensureCardUid(gameState,dv2Sp);
let dv2Ctx=ctxEv(0,dv2,'onActivateSuccess',
  {uid:dv2Sp.uid,player:1,kind:'spell',sub:'normal',chainId:1},'mz');
ok('デス・ヴォルストガルフ positive: 相手の通常魔法の発動でも誘発する',
   sc('デス・ヴォルストガルフ').passive.onActivateSuccess(dv2Ctx)===true);
let dv2Atk=curATK(dv2);
sc('デス・ヴォルストガルフ').resolve(dv2Ctx);
ok('デス・ヴォルストガルフ card-specific: 攻撃力が200アップする',
   curATK(dv2)===dv2Atk+200,'atk='+dv2Atk+'→'+curATK(dv2));
sc('デス・ヴォルストガルフ').resolve(dv2Ctx);
ok('デス・ヴォルストガルフ card-specific: 発動の度に累積する（+400）',
   curATK(dv2)===dv2Atk+400,'atk='+curATK(dv2));
reset0();
let dv3=mk('デス・ヴォルストガルフ',0),dv3Tr=mk('落とし穴',1);
gameState.players[0].mz=[dv3];gameState.players[1].sz=[dv3Tr];
ensureCardUid(gameState,dv3Tr);
ok('デス・ヴォルストガルフ negative: 罠の発動では誘発しない',
   sc('デス・ヴォルストガルフ').passive.onActivateSuccess(
     ctxEv(0,dv3,'onActivateSuccess',
       {uid:dv3Tr.uid,player:1,kind:'trap',sub:'normal',chainId:1},'mz'))===false);

/* ============ 7. ビッグバン・シュート ============ */
reset0();
let bs=mk('ビッグバン・シュート',0),bsMon=mk(PLAIN,0);
gameState.players[0].sz=[bs];gameState.players[0].mz=[bsMon];
ensureCardUid(gameState,bs);ensureCardUid(gameState,bsMon);
let bsCtx=C(0,bs,'sz',0,'activate',{});
ok('ビッグバン・シュート positive: 表側モンスターがいれば発動できる',
   sc('ビッグバン・シュート').condition(bsCtx)===true);
bsCtx.selectedTargets=[h(bsMon)];
sc('ビッグバン・シュート').resolve(bsCtx);
bs.face='up';
ok('ビッグバン・シュート card-specific: 装備され攻撃力が400アップ',
   !!bs.equipTo&&curATK(bsMon)===dbOf(bsMon).atk+400,'atk='+curATK(bsMon));
ok('ビッグバン・シュート card-specific: 貫通を宣言している（piercingDamage）',
   sc('ビッグバン・シュート').continuous.piercingDamage(
     {self:bs,atkCard:bsMon,amount:500})===500);
ok('ビッグバン・シュート card-specific: 離れた時に装備モンスターを除外する連結が張られる',
   !!API.linkState(h(bsMon)),'link='+JSON.stringify(API.linkState(h(bsMon))));
reset0();
let bs2=mk('ビッグバン・シュート',0);
gameState.players[0].sz=[bs2];gameState.players[0].mz=[];gameState.players[1].mz=[];
ok('ビッグバン・シュート negative: 表側モンスターがいなければ発動できない',
   sc('ビッグバン・シュート').condition(C(0,bs2,'sz',0,'activate',{}))===false);

/* ============ 8. ネクロフェイス ============ */
reset0();
let nf=mk('ネクロフェイス',0);
gameState.players[0].mz=[nf];
gameState.players[0].banish=[mk(PLAIN,0),mk(BIG,0)];
gameState.players[1].banish=[mk(PLAIN,1)];
let nfCtx=ctxEv(0,nf,'onNormalSummon',{card:nf},'mz');
ok('ネクロフェイス positive: 除外されているカードがあれば召喚時に誘発する',
   sc('ネクロフェイス').passive.onNormalSummon(nfCtx)===true);
let nfAtk=curATK(nf);
sc('ネクロフェイス').resolve(nfCtx);
ok('ネクロフェイス card-specific: 除外を全てデッキに戻す',
   gameState.players[0].banish.length===0&&gameState.players[1].banish.length===0,
   'b0='+gameState.players[0].banish.length+' b1='+gameState.players[1].banish.length);
ok('ネクロフェイス card-specific: 戻した枚数×100アップ（3枚＝300）',
   curATK(nf)===nfAtk+300,'atk='+nfAtk+'→'+curATK(nf));
reset0();
let nf2=mk('ネクロフェイス',0);
gameState.players[0].banish=[nf2];ensureCardUid(gameState,nf2);
for(let i=0;i<8;i++){gameState.players[0].deck.push(mk(PLAIN,0));
  gameState.players[1].deck.push(mk(PLAIN,1));}
let nf2D0=gameState.players[0].deck.length,nf2D1=gameState.players[1].deck.length;
let nf2Ctx=ctxEv(0,nf2,'onLeaveField',{uid:nf2.uid,toZone:'banish'},'banish');
ok('ネクロフェイス positive: 除外された時に誘発する',
   sc('ネクロフェイス').passive.onLeaveField(nf2Ctx)===true);
sc('ネクロフェイス').resolve(nf2Ctx);
ok('ネクロフェイス card-specific: お互いがデッキの上から5枚除外する',
   gameState.players[0].deck.length===nf2D0-5
   &&gameState.players[1].deck.length===nf2D1-5,
   'd0='+nf2D0+'→'+gameState.players[0].deck.length
   +' d1='+nf2D1+'→'+gameState.players[1].deck.length);
reset0();
let nf3=mk('ネクロフェイス',0);
gameState.players[0].mz=[nf3];
gameState.players[0].banish=[];gameState.players[1].banish=[];
ok('ネクロフェイス negative: 除外されているカードが無ければ召喚時効果は発動できない',
   sc('ネクロフェイス').condition(
     ctxEv(0,nf3,'onNormalSummon',{card:nf3},'mz'))===false);

/* ================= passive / continuous は read-only ================= */
reset0();
let roWg=mk('ウィンドファーム・ジェネクス',0),roDc=mk('ダーク・シティ',0),roHero=mk(DHERO,0);
gameState.players[0].mz=[roWg,roHero];gameState.players[0].field=roDc;
gameState.players[1].sz=[mk('落とし穴',1,'down')];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
curATK(roWg);curATK(roHero);
ok('cycle35 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('ビーストライザー',0,'down'),rp1A=mk(BEAST,0),rp1B=mk(BEAST2,0);
gameState.players[0].sz=[rp1];gameState.players[0].mz=[rp1A,rp1B];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let rp1Ctx=C(0,rp1,'sz',0,'activate',{});
rp1Ctx.selectedTargets=[h(rp1A)];
sc('ビーストライザー').cost(rp1Ctx,()=>{});
let rq1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle35 Replay: 除外コストが digest 一致で再生される',rq1.ok,rq1.reason||'');
reset0();
let rp2=mk('ビッグバン・シュート',0),rp2Mon=mk(PLAIN,0);
gameState.players[0].sz=[rp2];gameState.players[0].mz=[rp2Mon];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let rp2Ctx=C(0,rp2,'sz',0,'activate',{});
rp2Ctx.selectedTargets=[h(rp2Mon)];
sc('ビッグバン・シュート').resolve(rp2Ctx);
let rq2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle35 Replay: 装備＋離脱時の連結が digest 一致で再生される',rq2.ok,rq2.reason||'');
let snap35=JSON.stringify(gameState);
ok('cycle35 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap35))===snap35);
ok('cycle35 直列化: 予約に関数が入っていない',snap35.indexOf('function')<0);
globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
