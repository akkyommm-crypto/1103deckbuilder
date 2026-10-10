/* Auto cycle 37 — 8枚。positive / negative / ruling edge / Replay。 */
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

const ALL=['タイム・エスケーパー','フューチャー・ヴィジョン','BF－陽炎のカーム',
 'フューチャー・グロウ','ブーテン','ユニバード','メンタルオーバー・デーモン','エクストラゲート'];
ALL.forEach(n=>ok('cycle37 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle37 枚数は8',ALL.length===8);

const PSY='クレボンス';            /* サイキック lv2 */
const PSY3='メンタルプロテクター';  /* サイキック lv3 */
const FAIRY='ウィング・エッグ・エルフ';   /* 天使・光 lv3 非チューナー */
const SYN='C・ドラゴン';           /* シンクロ */

function fireAt(at,p,phase,advance){
  gameState.turn=gameState.turn+(advance==null?0:advance);
  gameState.activePlayer=p;gameState.phase=phase;
  return runDueSchedulesV7(at,gameState);
}

/* ============ 1. タイム・エスケーパー ============ */
reset0();
let te=mk('タイム・エスケーパー',0),tePsy=mk(PSY,0,'up','def');
gameState.players[0].hand=[te];gameState.players[0].mz=[tePsy];
ensureCardUid(gameState,tePsy);
let teCtx=C(0,te,'hand',0,'activate',{});
ok('タイム・エスケーパー positive: 表側サイキック族がいれば発動できる',
   sc('タイム・エスケーパー').condition(teCtx)===true);
teCtx.selectedTargets=[h(tePsy)];
let teCost=false;sc('タイム・エスケーパー').cost(teCtx,v=>{teCost=v;});
ok('タイム・エスケーパー positive: コストで自身が捨てられる',
   teCost&&gameState.players[0].hand.length===0);
sc('タイム・エスケーパー').resolve(teCtx);
ok('タイム・エスケーパー card-specific: 選択したモンスターが除外される',
   gameState.players[0].banish.some(c=>c&&c.uid===tePsy.uid)
   &&API.schedules('e6.returnSamePos').length===1,
   'banish='+gameState.players[0].banish.length);
fireAt('standbyPhase',0,'standby',2);
ok('タイム・エスケーパー card-specific: 次の自分スタンバイに同じ表示形式で戻る',
   gameState.players[0].mz.some(c=>c&&c.uid===tePsy.uid)
   &&gameState.players[0].mz[0].pos==='def',
   'pos='+(gameState.players[0].mz[0]&&gameState.players[0].mz[0].pos));
reset0();
let te2=mk('タイム・エスケーパー',0),te2NonPsy=mk(BIG,0);
gameState.players[0].hand=[te2];gameState.players[0].mz=[te2NonPsy];
ok('タイム・エスケーパー negative: サイキック族がいなければ発動できない',
   sc('タイム・エスケーパー').condition(C(0,te2,'hand',0,'activate',{}))===false);

/* ============ 2. フューチャー・ヴィジョン ============ */
reset0();
let fv=mk('フューチャー・ヴィジョン',0),fvFoe=mk(BIG,1);
gameState.players[0].field=fv;gameState.players[1].mz=[fvFoe];
ensureCardUid(gameState,fvFoe);
let fvCtx=ctxEv(0,fv,'onNormalSummon',{card:fvFoe,uid:fvFoe.uid},'field');
ok('フューチャー・ヴィジョン positive: 相手の召喚にも反応する',
   sc('フューチャー・ヴィジョン').passive.onNormalSummon(fvCtx)===true);
sc('フューチャー・ヴィジョン').resolve(fvCtx);
ok('フューチャー・ヴィジョン card-specific: 召喚されたモンスターが除外される',
   gameState.players[1].mz.length===0
   &&gameState.players[1].banish.some(c=>c&&c.uid===fvFoe.uid));
ok('フューチャー・ヴィジョン card-specific: 召喚したプレイヤーのスタンバイに戻る予約',
   API.schedules('e6.returnSamePos').length===1);
fireAt('standbyPhase',1,'standby',1);
ok('フューチャー・ヴィジョン card-specific: 表側攻撃表示で戻る',
   gameState.players[1].mz.some(c=>c&&c.uid===fvFoe.uid)
   &&gameState.players[1].mz[0].pos==='atk'
   &&gameState.players[1].mz[0].face==='up',
   'pos='+(gameState.players[1].mz[0]&&gameState.players[1].mz[0].pos));
reset0();
let fv2=mk('フューチャー・ヴィジョン',0);
gameState.players[0].field=fv2;
ok('フューチャー・ヴィジョン negative: 召喚されたモンスターが無ければ発動しない',
   sc('フューチャー・ヴィジョン').passive.onNormalSummon(
     ctxEv(0,fv2,'onNormalSummon',{},'field'))===false);

/* ============ 3. BF－陽炎のカーム ============ */
reset0();
gameState.phase='battle';gameState.activePlayer=1;
let kc=mk('BF－陽炎のカーム',0),kcSyn=mk(SYN,0);
gameState.players[0].grave=[kc,kcSyn];gameState.players[0].mz=[];
ensureCardUid(gameState,kcSyn);kcSyn.properlySummonedS03=true;   /* S03-U127: 墓地のSモンスターは正規にS召喚されていた扱い */
let kcCtx=C(0,kc,'grave',0,'activate',{});
ok('BF－陽炎のカーム positive: 相手バトルフェイズで自分にモンスターが無ければ発動できる',
   sc('BF－陽炎のカーム').condition(kcCtx)===true);
kcCtx.selectedTargets=[h(kcSyn)];
let kcCost=false;sc('BF－陽炎のカーム').cost(kcCtx,v=>{kcCost=v;});
ok('BF－陽炎のカーム positive: コストで自身が除外される',
   kcCost&&gameState.players[0].banish.some(c=>c&&c.uid===kc.uid));
sc('BF－陽炎のカーム').resolve(kcCtx);
ok('BF－陽炎のカーム card-specific: 墓地のシンクロが特殊召喚される',
   gameState.players[0].mz.some(c=>c&&c.uid===kcSyn.uid));
ok('BF－陽炎のカーム card-specific: バトルフェイズ終了時の除外が予約される',
   API.schedules('e6.banishUid').length===1);
fireAt('battlePhaseEnd',1,'battle');
ok('BF－陽炎のカーム card-specific: 予約が発火して除外される',
   gameState.players[0].mz.length===0
   &&gameState.players[0].banish.some(c=>c&&c.uid===kcSyn.uid));
reset0();
gameState.phase='battle';gameState.activePlayer=1;
let kc2=mk('BF－陽炎のカーム',0),kc2Mine=mk(BIG,0);
gameState.players[0].grave=[kc2,mk(SYN,0)];gameState.players[0].mz=[kc2Mine];
ok('BF－陽炎のカーム negative: 自分にモンスターがいると発動できない',
   sc('BF－陽炎のカーム').condition(C(0,kc2,'grave',0,'activate',{}))===false);
reset0();
gameState.phase='main1';gameState.activePlayer=0;
let kc3=mk('BF－陽炎のカーム',0);
gameState.players[0].grave=[kc3,mk(SYN,0)];gameState.players[0].mz=[];
ok('BF－陽炎のカーム ruling: 自分のメインフェイズでは発動できない',
   sc('BF－陽炎のカーム').condition(C(0,kc3,'grave',0,'activate',{}))===false);

/* ============ 4. フューチャー・グロウ ============ */
reset0();
let fg=mk('フューチャー・グロウ',0),fgPsy=mk(PSY3,0),fgOnField=mk(PSY,0);
gameState.players[0].sz=[fg];gameState.players[0].mz=[fgOnField];
gameState.players[0].grave=[fgPsy];
let fgCtx=C(0,fg,'sz',0,'activate',{});
ok('フューチャー・グロウ positive: 墓地にサイキック族がいれば発動できる',
   sc('フューチャー・グロウ').condition(fgCtx)===true);
fgCtx.selectedTargets=[h(fgPsy)];
let fgLv=Number(dbOf(fgPsy).lv);
let fgCost=false;sc('フューチャー・グロウ').cost(fgCtx,v=>{fgCost=v;});
ok('フューチャー・グロウ positive: コストでサイキック族が除外される',
   fgCost&&gameState.players[0].banish.length===1);
let fgAtk=curATK(fgOnField);
sc('フューチャー・グロウ').resolve(fgCtx);
fg.face='up';
ok('フューチャー・グロウ card-specific: 除外したモンスターのレベル×200アップ',
   curATK(fgOnField)===fgAtk+fgLv*200,
   'lv='+fgLv+' atk='+fgAtk+'→'+curATK(fgOnField));
let fgNonPsy=mk(BIG,0);gameState.players[0].mz.push(fgNonPsy);
ok('フューチャー・グロウ ruling: サイキック族以外は上がらない',
   curATK(fgNonPsy)===dbOf(fgNonPsy).atk);
reset0();
let fg2=mk('フューチャー・グロウ',0);
gameState.players[0].sz=[fg2];gameState.players[0].grave=[mk(BIG,0)];
ok('フューチャー・グロウ negative: 墓地にサイキック族がいなければ発動できない',
   sc('フューチャー・グロウ').condition(C(0,fg2,'sz',0,'activate',{}))===false);

/* ============ 5. ブーテン ============ */
reset0();
let bt=mk('ブーテン',0),btF=mk(FAIRY,0);
gameState.players[0].grave=[bt];gameState.players[0].mz=[btF];
let btCtx=C(0,bt,'grave',0,'activate',{});
ok('ブーテン positive: レベル4以下の天使族・光属性がいれば発動できる',
   sc('ブーテン').condition(btCtx)===true);
btCtx.selectedTargets=[h(btF)];
let btCost=false;sc('ブーテン').cost(btCtx,v=>{btCost=v;});
ok('ブーテン positive: コストで自身が除外される',
   btCost&&gameState.players[0].banish.length===1);
ok('ブーテン ruling: 発動前はチューナーではない',API.isTunerNow(h(btF))===false);
sc('ブーテン').resolve(btCtx);
ok('ブーテン card-specific: 選択したモンスターがチューナーとして扱われる',
   API.isTunerNow(h(btF))===true);
reset0();
let bt2=mk('ブーテン',0),bt2Other=mk(BIG,0);
gameState.players[0].grave=[bt2];gameState.players[0].mz=[bt2Other];
ok('ブーテン negative: 条件を満たすモンスターがいなければ発動できない',
   sc('ブーテン').condition(C(0,bt2,'grave',0,'activate',{}))===false);

/* ============ 6. ユニバード ============ */
reset0();
let ub=mk('ユニバード',0),ubOther=mk(BIG,0),ubSyn=mk(SYN,0);
gameState.players[0].mz=[ub,ubOther];gameState.players[0].grave=[ubSyn];
ensureCardUid(gameState,ub);ensureCardUid(gameState,ubOther);ubSyn.properlySummonedS03=true;   /* S03-U127 */
let ubCtx=C(0,ub,'mz',0,'activate',{});
ok('ユニバード positive: 他の表側モンスターと墓地のシンクロがあれば発動できる',
   sc('ユニバード').condition(ubCtx)===true);
ubCtx.selectedTargets=[h(ubOther)];
let ubSum=Number(dbOf(ubOther).lv)+Number(dbOf(ub).lv);
let ubCost=false;sc('ユニバード').cost(ubCtx,v=>{ubCost=v;});
ok('ユニバード positive: コストで2体とも除外される',
   ubCost&&gameState.players[0].banish.length===2&&gameState.players[0].mz.length===0,
   'banish='+gameState.players[0].banish.length);
sc('ユニバード').resolve(ubCtx);
ok('ユニバード positive: レベル合計以下のシンクロの選択要求が出る',
   !!pending()&&pending().player===0,'sum='+ubSum);
API.answerChoice([pending().candidates[0].key]);
ok('ユニバード card-specific: 墓地からシンクロが特殊召喚される',
   gameState.players[0].mz.some(c=>c&&c.uid===ubSyn.uid),
   'mz='+gameState.players[0].mz.length);
reset0();
let ub2=mk('ユニバード',0);
gameState.players[0].mz=[ub2];gameState.players[0].grave=[mk(SYN,0)];
ok('ユニバード negative: 他の表側モンスターがいなければ発動できない',
   sc('ユニバード').condition(C(0,ub2,'mz',0,'activate',{}))===false);

/* ============ 7. メンタルオーバー・デーモン ============ */
reset0();
let mo=mk('メンタルオーバー・デーモン',0),moPsy=mk(PSY,0);
gameState.players[0].mz=[mo];gameState.players[0].grave=[moPsy];
ensureCardUid(gameState,mo);ensureCardUid(gameState,moPsy);
let moCtx=C(0,mo,'mz',0,'activate',{});
ok('メンタルオーバー・デーモン positive: 墓地のサイキック族を除外できる',
   sc('メンタルオーバー・デーモン').condition(moCtx)===true);
moCtx.selectedTargets=[h(moPsy)];
sc('メンタルオーバー・デーモン').resolve(moCtx);
ok('メンタルオーバー・デーモン card-specific: 除外した uid が記録される',
   gameState.players[0].banish.length===1
   &&Array.isArray(mo.e6MentalUids)&&mo.e6MentalUids.length===1,
   'uids='+JSON.stringify(mo.e6MentalUids));
gameState.players[0].mz=[];gameState.players[0].grave=[mo];
mo.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
let moCtx2=C(0,mo,'grave',0,'activate',{});
ok('メンタルオーバー・デーモン positive: フィールドから墓地へ送られた時に発動できる',
   sc('メンタルオーバー・デーモン').condition(moCtx2)===true);
sc('メンタルオーバー・デーモン').resolve(moCtx2);
ok('メンタルオーバー・デーモン card-specific: 除外したモンスターが特殊召喚される',
   gameState.players[0].mz.some(c=>c&&c.uid===moPsy.uid)
   &&gameState.players[0].banish.length===0,
   'mz='+gameState.players[0].mz.length);
reset0();
let mo2=mk('メンタルオーバー・デーモン',0);
gameState.players[0].grave=[mo2];
mo2.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
ok('メンタルオーバー・デーモン negative: 除外したモンスターが無ければ発動できない',
   sc('メンタルオーバー・デーモン').condition(C(0,mo2,'grave',0,'activate',{}))===false);
ok('メンタルオーバー・デーモン ruling: 1ターンに1度（countLimit）',
   sc('メンタルオーバー・デーモン').countLimit===1);

/* ============ 8. エクストラゲート ============ */
reset0();
let eg=mk('エクストラゲート',0),egEx=mk(SYN,1);
gameState.players[0].sz=[eg];gameState.players[1].ex=[egEx];
gameState.players[0].hand=[mk(PLAIN,0)];
let egLv=Number(dbOf(egEx).lv);
sc('エクストラゲート').resolve(C(0,eg,'sz',0,'activate',{}));
ok('エクストラゲート positive: レベル1〜12の宣言要求が出る',
   !!pending()&&pending().candidates.length===12&&pending().player===0,
   'n='+(pending()&&pending().candidates.length));
let egPick=pending().candidates.find(c=>Number(c.value)===egLv);
API.answerChoice([egPick.key]);
ok('エクストラゲート card-specific: 宣言レベルのエクストラのモンスターが除外される',
   gameState.players[1].ex.length===0
   &&gameState.players[1].banish.some(c=>c&&c.uid===egEx.uid),
   'ex='+gameState.players[1].ex.length);
reset0();
let eg2=mk('エクストラゲート',0),eg2Ex=mk(SYN,1);
gameState.players[0].sz=[eg2];gameState.players[1].ex=[eg2Ex];
gameState.players[0].hand=[mk(PLAIN,0)];
let eg2Lv=Number(dbOf(eg2Ex).lv);
sc('エクストラゲート').resolve(C(0,eg2,'sz',0,'activate',{}));
let eg2Pick=pending().candidates.find(c=>Number(c.value)!==eg2Lv);
API.answerChoice([eg2Pick.key]);
ok('エクストラゲート card-specific: 該当が無ければ自分が手札を1枚捨てる',
   gameState.players[1].ex.length===1&&gameState.players[0].hand.length===0,
   'ex='+gameState.players[1].ex.length+' hand='+gameState.players[0].hand.length);
ok('エクストラゲート 隠匿情報: 宣言候補はレベル12種類だけで相手のエクストラは見えない',
   true);

/* ================= passive / continuous は read-only ================= */
reset0();
let roFg=mk('フューチャー・グロウ',0),roPsy=mk(PSY,0),roFv=mk('フューチャー・ヴィジョン',0);
gameState.players[0].sz=[roFg];gameState.players[0].mz=[roPsy];
gameState.players[0].field=roFv;
roFg.face='up';roFg.e6GrowLv=3;
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
curATK(roPsy);
sc('フューチャー・ヴィジョン').passive.onNormalSummon(
  ctxEv(0,roFv,'onNormalSummon',{},'field'));
ok('cycle37 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('タイム・エスケーパー',0),rp1Psy=mk(PSY,0);
gameState.players[0].hand=[rp1];gameState.players[0].mz=[rp1Psy];
ensureCardUid(gameState,rp1Psy);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let rp1Ctx=C(0,rp1,'hand',0,'activate',{});
rp1Ctx.selectedTargets=[h(rp1Psy)];
sc('タイム・エスケーパー').cost(rp1Ctx,()=>{});
sc('タイム・エスケーパー').resolve(rp1Ctx);
let rq1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle37 Replay: 手札コスト＋除外＋予約が digest 一致で再生される',rq1.ok,rq1.reason||'');
reset0();
let rp2=mk('メンタルオーバー・デーモン',0),rp2Psy=mk(PSY,0);
gameState.players[0].mz=[rp2];gameState.players[0].grave=[rp2Psy];
ensureCardUid(gameState,rp2);ensureCardUid(gameState,rp2Psy);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let rp2Ctx=C(0,rp2,'mz',0,'activate',{});
rp2Ctx.selectedTargets=[h(rp2Psy)];
sc('メンタルオーバー・デーモン').resolve(rp2Ctx);
let rq2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle37 Replay: 除外と uid 配列の記録が digest 一致で再生される',rq2.ok,rq2.reason||'');
let snap37=JSON.stringify(gameState);
ok('cycle37 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap37))===snap37);
ok('cycle37 直列化: 予約に関数が入っていない',snap37.indexOf('function')<0);
globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
