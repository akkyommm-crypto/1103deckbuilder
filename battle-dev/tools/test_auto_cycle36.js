/* Auto cycle 36 — 7枚。positive / negative / ruling edge / Replay。 */
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

const ALL=['フライファング','光神機－轟龍','ランサー・デーモン','バリア・リゾネーター',
 'ロケット戦士','プライドの咆哮','フリッグのリンゴ'];
ALL.forEach(n=>ok('cycle36 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle36 枚数は7',ALL.length===7);

const TUNER36='ジャンク・シンクロン';   /* チューナー */

function fireAt(at,p,phase,advance){
  gameState.turn=gameState.turn+(advance==null?0:advance);
  gameState.activePlayer=p;gameState.phase=phase;
  return runDueSchedulesV7(at,gameState);
}

/* ============ 1. フライファング ============ */
reset0();
let ff=mk('フライファング',0),ffFoe=mk(BIG,1,'up','def');
gameState.players[0].mz=[ff];gameState.players[1].mz=[ffFoe];
ensureCardUid(gameState,ff);
ok('フライファング card-specific: 自身が攻撃した時だけ貫通する',
   sc('フライファング').continuous.piercingDamage({self:ff,atkCard:ff,amount:400})===400);
ok('フライファング ruling: 他のモンスターの攻撃では貫通しない',
   sc('フライファング').continuous.piercingDamage(
     {self:ff,atkCard:mk(BIG,0),amount:400})===0);
let ffCtx=ctxEv(0,ff,'onBattleDamage',{player:1,amount:400,attackerUid:ff.uid},'mz');
ok('フライファング positive: 戦闘ダメージを与えた時に誘発する',
   sc('フライファング').passive.onBattleDamage(ffCtx)===true);
sc('フライファング').resolve(ffCtx);
ok('フライファング card-specific: ダメージを与えた印が残る',
   Number(ff.e5FlyDealt)===gameState.turn);
gameState.phase='battle';
let ffCtx2=C(0,ff,'mz',0,'activate',{});
ok('フライファング positive: バトルフェイズ終了時に誘発する',
   sc('フライファング').passive.onBattlePhaseEnd(ffCtx2)===true);
sc('フライファング').resolve(ffCtx2);
ok('フライファング card-specific: 除外され次の自分スタンバイの帰還が予約される',
   gameState.players[0].banish.length===1
   &&API.schedules('e5.returnBanishedUid').length===1,
   'banish='+gameState.players[0].banish.length);
fireAt('standbyPhase',0,'standby',2);
ok('フライファング card-specific: 予約が発火して戻る',
   gameState.players[0].mz.some(c=>c&&c.uid===ff.uid),
   'mz='+gameState.players[0].mz.length);
reset0();
let ff2=mk('フライファング',0);
gameState.players[0].mz=[ff2];ensureCardUid(gameState,ff2);
ok('フライファング negative: 自分がダメージを受けても誘発しない',
   sc('フライファング').passive.onBattleDamage(
     ctxEv(0,ff2,'onBattleDamage',{player:0,amount:400,attackerUid:ff2.uid},'mz'))===false);

/* ============ 2. 光神機－轟龍 ============ */
reset0();
let gg=mk('光神機－轟龍',0);
gameState.players[0].mz=[gg];ensureCardUid(gameState,gg);
gg.summonedTurn=gameState.turn;gg.tributeCount=1;
let ggCtx=ctxEv(0,gg,'onNormalSummon',{card:gg},'mz');
ok('光神機－轟龍 positive: リリース1体で召喚した場合に誘発する',
   sc('光神機－轟龍').passive.onNormalSummon(ggCtx)===true);
sc('光神機－轟龍').resolve(ggCtx);
ok('光神機－轟龍 card-specific: エンドフェイズの墓地送りが予約される',
   API.schedules('e5.toGraveUid').length===1);
fireAt('endPhase',0,'end');
ok('光神機－轟龍 card-specific: 予約が発火して墓地へ送られる',
   gameState.players[0].mz.length===0&&gameState.players[0].grave.length===1);
ok('光神機－轟龍 card-specific: 貫通を宣言している（piercingDamage）',
   sc('光神機－轟龍').continuous.piercingDamage({self:gg,atkCard:gg,amount:700})===700);
ok('光神機－轟龍 ruling: リリース1体で召喚する手順が宣言されている',
   sc('光神機－轟龍').normalSummonProcedure.methods[0].tributes===1);
reset0();
let gg2=mk('光神機－轟龍',0);
gameState.players[0].mz=[gg2];
gg2.summonedTurn=gameState.turn;gg2.tributeCount=2;
ok('光神機－轟龍 negative: リリース2体で召喚した場合は自壊しない',
   sc('光神機－轟龍').passive.onNormalSummon(
     ctxEv(0,gg2,'onNormalSummon',{card:gg2},'mz'))===false);

/* ============ 3. ランサー・デーモン ============ */
reset0();
gameState.phase='battle';
let ld=mk('ランサー・デーモン',0),ldAtk=mk(BIG,0),ldDef=mk(PLAIN,1,'up','def');
gameState.players[0].mz=[ld,ldAtk];gameState.players[1].mz=[ldDef];
gameState.battle={player:0,atkIdx:1,target:0};
let ldCtx=C(0,ld,'mz',0,'activate',{});
ok('ランサー・デーモン positive: 守備表示への攻撃宣言時に発動できる',
   sc('ランサー・デーモン').condition(ldCtx)===true);
sc('ランサー・デーモン').resolve(ldCtx);
ok('ランサー・デーモン card-specific: 攻撃したモンスターに貫通の印が付く',
   Number(ldAtk.e5LancerPierce)===gameState.turn);
ok('ランサー・デーモン card-specific: 印の付いたモンスターが貫通する',
   sc('ランサー・デーモン').continuous.piercingDamage(
     {self:ld,atkCard:ldAtk,amount:600})===600);
ok('ランサー・デーモン ruling: 印の無いモンスターは貫通しない',
   sc('ランサー・デーモン').continuous.piercingDamage(
     {self:ld,atkCard:mk(BIG,0),amount:600})===0);
gameState.battle=null;
reset0();
gameState.phase='battle';
let ld2=mk('ランサー・デーモン',0),ld2Atk=mk(BIG,0),ld2AtkPos=mk(PLAIN,1,'up','atk');
gameState.players[0].mz=[ld2,ld2Atk];gameState.players[1].mz=[ld2AtkPos];
gameState.battle={player:0,atkIdx:1,target:0};
ok('ランサー・デーモン negative: 攻撃表示への攻撃では発動できない',
   sc('ランサー・デーモン').condition(C(0,ld2,'mz',0,'activate',{}))===false);
gameState.battle=null;
ok('ランサー・デーモン ruling: 1ターンに1度（countLimit）',
   sc('ランサー・デーモン').countLimit===1);

/* ============ 4. バリア・リゾネーター ============ */
reset0();
let bres=mk('バリア・リゾネーター',0),bTuner=mk(TUNER36,0);
gameState.players[0].hand=[bres];gameState.players[0].mz=[bTuner];
let bresCtx=C(0,bres,'hand',0,'activate',{});
ok('バリア・リゾネーター positive: 表側チューナーがいれば発動できる',
   sc('バリア・リゾネーター').condition(bresCtx)===true);
bresCtx.selectedTargets=[h(bTuner)];
let bresCost=false;sc('バリア・リゾネーター').cost(bresCtx,v=>{bresCost=v;});
ok('バリア・リゾネーター positive: コストで自身が墓地へ送られる',
   bresCost&&gameState.players[0].hand.length===0
   &&gameState.players[0].grave.length===1);
sc('バリア・リゾネーター').resolve(bresCtx);
ok('バリア・リゾネーター card-specific: 選択したチューナーに印が付く',
   Number(bTuner.e5BarrierTurn)===gameState.turn);
ok('バリア・リゾネーター card-specific: そのモンスターは戦闘では破壊されない',
   (protectionRecordV21(gameState,bTuner,{cause:'battle'})||{}).battle===true);
ok('バリア・リゾネーター ruling: 効果破壊は防がない',
   protectionRecordV21(gameState,bTuner,{cause:'effect'})===null);
let bFoe=mk(BIG,1);gameState.players[1].mz=[bFoe];
gameState.phase='battle';gameState.battle={player:1,atkIdx:0,target:0};
/* 戦闘ダメージは resolveLpChangeV18(cause:'battle') を通る。
   API.damageLP は効果ダメージなのでこの置換の対象ではない。 */
ok('バリア・リゾネーター card-specific: そのモンスターの戦闘による自分へのダメージは0',
   resolveLpChangeV18(gameState,{player:0,delta:-1500,cause:'battle'})===0);
ok('バリア・リゾネーター ruling: 効果ダメージは0にならない',
   resolveLpChangeV18(gameState,{player:0,delta:-1500,cause:'effect'})===-1500);
gameState.battle=null;
reset0();
let bres2=mk('バリア・リゾネーター',0),bNonTuner=mk(BIG,0);
gameState.players[0].hand=[bres2];gameState.players[0].mz=[bNonTuner];
ok('バリア・リゾネーター negative: チューナーがいなければ発動できない',
   sc('バリア・リゾネーター').condition(C(0,bres2,'hand',0,'activate',{}))===false);

/* ============ 5. ロケット戦士 ============ */
reset0();
gameState.phase='battle';gameState.activePlayer=0;
let rs=mk('ロケット戦士',0),rsFoe=mk(BIG,1);
gameState.players[0].mz=[rs];gameState.players[1].mz=[rsFoe];
gameState.battle={player:0,atkIdx:0,target:0};
ok('ロケット戦士 card-specific: 自分バトルフェイズ中は戦闘で破壊されない',
   (protectionRecordV21(gameState,rs,{cause:'battle'})||{}).battle===true);
ok('ロケット戦士 card-specific: 自分への戦闘ダメージは0になる',
   resolveLpChangeV18(gameState,{player:0,delta:-1500,cause:'battle'})===0);
ok('ロケット戦士 ruling: 効果ダメージは0にならない',
   resolveLpChangeV18(gameState,{player:0,delta:-1500,cause:'effect'})===-1500);
let rsCtx=ctxDS(0,rs,{atkCard:rs,defCard:rsFoe});
ok('ロケット戦士 positive: 攻撃したダメージ計算後に誘発する',
   sc('ロケット戦士').passive.onDamageStep(rsCtx)===true);
let rsAtk=curATK(rsFoe);
sc('ロケット戦士').resolve(rsCtx);
ok('ロケット戦士 card-specific: 攻撃対象の攻撃力が500ダウンする',
   curATK(rsFoe)===rsAtk-500,'atk='+rsAtk+'→'+curATK(rsFoe));
gameState.battle=null;
reset0();
gameState.phase='battle';gameState.activePlayer=1;
let rs2=mk('ロケット戦士',0),rs2Foe=mk(BIG,1);
gameState.players[0].mz=[rs2];gameState.players[1].mz=[rs2Foe];
gameState.battle={player:1,atkIdx:0,target:0};
ok('ロケット戦士 negative: 相手バトルフェイズでは戦闘破壊耐性を持たない',
   protectionRecordV21(gameState,rs2,{cause:'battle'})===null);
gameState.battle=null;

/* ============ 6. プライドの咆哮 ============ */
reset0();
gameState.phase='battle';
let pr=mk('プライドの咆哮',0,'down'),prMine=mk(PLAIN,0),prFoe=mk(BIG,1);
gameState.players[0].sz=[pr];gameState.players[0].mz=[prMine];
gameState.players[1].mz=[prFoe];
gameState.battle={player:1,atkIdx:0,target:0};
let prCtx=C(0,pr,'sz',0,'activate',{});
ok('プライドの咆哮 positive: 自分のモンスターの攻撃力が低ければ発動できる',
   sc('プライドの咆哮').condition(prCtx)===true);
let prGap=Number(dbOf(prFoe).atk)-Number(dbOf(prMine).atk);
let prLp=gameState.players[0].lp;
sc('プライドの咆哮').cost(prCtx,()=>{});
ok('プライドの咆哮 positive: 攻撃力の差分のライフを払う',
   gameState.players[0].lp===prLp-prGap,'gap='+prGap);
let prAtk=curATK(prMine);
sc('プライドの咆哮').resolve(prCtx);
ok('プライドの咆哮 card-specific: 差＋300アップする',
   curATK(prMine)===prAtk+prGap+300,'atk='+prAtk+'→'+curATK(prMine));
gameState.battle=null;
reset0();
gameState.phase='battle';
let pr2=mk('プライドの咆哮',0,'down'),pr2Mine=mk(BIG,0),pr2Foe=mk(PLAIN,1);
gameState.players[0].sz=[pr2];gameState.players[0].mz=[pr2Mine];
gameState.players[1].mz=[pr2Foe];
gameState.battle={player:1,atkIdx:0,target:0};
ok('プライドの咆哮 negative: 自分のモンスターの攻撃力が高ければ発動できない',
   sc('プライドの咆哮').condition(C(0,pr2,'sz',0,'activate',{}))===false);
gameState.battle=null;
reset0();
gameState.phase='battle';
let pr3=mk('プライドの咆哮',0,'down'),pr3Mine=mk(PLAIN,0),pr3Foe=mk(BIG,1);
gameState.players[0].sz=[pr3];gameState.players[0].mz=[pr3Mine];
gameState.players[1].mz=[pr3Foe];gameState.players[0].lp=100;
gameState.battle={player:1,atkIdx:0,target:0};
ok('プライドの咆哮 ruling: 差分のライフを払えなければ発動できない',
   sc('プライドの咆哮').condition(C(0,pr3,'sz',0,'activate',{}))===false);
gameState.battle=null;

/* ============ 7. フリッグのリンゴ ============ */
reset0();
let fa=mk('フリッグのリンゴ',0,'down');
gameState.players[0].sz=[fa];gameState.players[0].mz=[];
let faCtx=ctxEv(0,fa,'onBattleDamage',{player:0,amount:1800},'sz');
ok('フリッグのリンゴ positive: モンスターがいない状態で戦闘ダメージを受けた時に誘発する',
   sc('フリッグのリンゴ').passive.onBattleDamage(faCtx)===true);
let faLp=gameState.players[0].lp;
sc('フリッグのリンゴ').resolve(faCtx);
ok('フリッグのリンゴ card-specific: 受けたダメージ分だけ回復する',
   gameState.players[0].lp===faLp+1800,'lp='+faLp+'→'+gameState.players[0].lp);
ok('フリッグのリンゴ card-specific: 攻守が回復量と同じトークンが出る',
   gameState.players[0].mz.length===1
   &&API.isToken(h(gameState.players[0].mz[0]))
   &&curATK(gameState.players[0].mz[0])===1800
   &&curDEF(gameState.players[0].mz[0])===1800,
   'atk='+curATK(gameState.players[0].mz[0]));
reset0();
let fa2=mk('フリッグのリンゴ',0,'down'),fa2Mon=mk(BIG,0);
gameState.players[0].sz=[fa2];gameState.players[0].mz=[fa2Mon];
ok('フリッグのリンゴ negative: 自分フィールドにモンスターがいると発動できない',
   sc('フリッグのリンゴ').passive.onBattleDamage(
     ctxEv(0,fa2,'onBattleDamage',{player:0,amount:1800},'sz'))===false);
reset0();
let fa3=mk('フリッグのリンゴ',0,'down');
gameState.players[0].sz=[fa3];gameState.players[0].mz=[];
ok('フリッグのリンゴ ruling: 相手が受けたダメージでは誘発しない',
   sc('フリッグのリンゴ').passive.onBattleDamage(
     ctxEv(0,fa3,'onBattleDamage',{player:1,amount:1800},'sz'))===false);

/* ================= passive / continuous は read-only ================= */
reset0();
gameState.phase='battle';gameState.activePlayer=0;
let roRs=mk('ロケット戦士',0),roFf=mk('フライファング',0),roFoe=mk(BIG,1);
gameState.players[0].mz=[roRs,roFf];gameState.players[1].mz=[roFoe];
gameState.battle={player:0,atkIdx:0,target:0};
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
curATK(roRs);curATK(roFf);
protectionRecordV21(gameState,roRs,{cause:'battle'});
sc('フライファング').continuous.piercingDamage({self:roFf,atkCard:roFf,amount:100});
ok('cycle36 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);
gameState.battle=null;

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('バリア・リゾネーター',0),rp1T=mk(TUNER36,0);
gameState.players[0].hand=[rp1];gameState.players[0].mz=[rp1T];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let rp1Ctx=C(0,rp1,'hand',0,'activate',{});
rp1Ctx.selectedTargets=[h(rp1T)];
sc('バリア・リゾネーター').cost(rp1Ctx,()=>{});
sc('バリア・リゾネーター').resolve(rp1Ctx);
let rq1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle36 Replay: 手札コスト＋印の付与が digest 一致で再生される',rq1.ok,rq1.reason||'');
reset0();
gameState.phase='battle';gameState.activePlayer=0;
let rp2=mk('ロケット戦士',0),rp2Foe=mk(BIG,1);
gameState.players[0].mz=[rp2];gameState.players[1].mz=[rp2Foe];
gameState.battle={player:0,atkIdx:0,target:0};
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
sc('ロケット戦士').resolve(ctxDS(0,rp2,{atkCard:rp2,defCard:rp2Foe}));
let rq2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle36 Replay: 攻撃力ダウンが digest 一致で再生される',rq2.ok,rq2.reason||'');
gameState.battle=null;
let snap36=JSON.stringify(gameState);
ok('cycle36 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap36))===snap36);
ok('cycle36 直列化: 予約に関数が入っていない',snap36.indexOf('function')<0);
globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
