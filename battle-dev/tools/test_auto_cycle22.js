/* Auto cycle 22 — 9枚。positive / negative / ruling edge / Replay。
   シンクロ召喚は engine の正規経路（EX_SUMMON_PREPARE_V42 → EX_SUMMON_COMMIT_V42）で作る。 */
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
function synEvt(pack){
  const e=pack.evts.find(x=>x.eventName==='onSpecialSummon');
  return e?e.evt:null;
}
function advanceSummon(p, name, tributes){
  const P=gameState.players[p];
  const card=mk(name,p); P.hand.push(card); ensureCardUid(gameState,card);
  const mats=tributes.map(c=>{ ensureCardUid(gameState,c); return {uid:c.uid}; });
  tributes.forEach(c=>{ const hh=locateCardAnyV4(c); if(hh&&hh.zone==='mz') API.sendToGrave(hh,'アドバンス召喚のリリース'); });
  act({type:'NORMAL_SUMMON',player:p,handIndex:P.hand.indexOf(card),
       tributes:tributes.length,p3Materials:mats,p3SummonType:'tribute',prepaid:true});
  return card;
}
const PLAIN='ワイト';        /* 闇 アンデット lv1 */
const BIG='青眼の白龍';       /* 光 ドラゴン lv8 */
const TUNER='ジェネクス・コントローラー';

const ALL=['コモンメンタルワールド','シンクロ・ストライク','チューナー・キャプチャー',
 'スピリット・ドラゴン','ジュラック・プティラ','キング・もけもけ','ゼンマイマイ',
 'テーヴァ','デス・メテオ'];
ALL.forEach(n=>ok('cycle22 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle22 枚数は9',ALL.length===9);

/* ============ コモンメンタルワールド ============ */
reset0();
let cw=mk('コモンメンタルワールド',0,'up'),m1=mk(TUNER,0),m2=mk(PLAIN,0);
gameState.players[0].sz=[cw];gameState.players[0].mz=[m1,m2];
let pk=synchroSummon(0,'BF－アーマード・ウィング',[m1,m2]);
let ccw=ctxEv(0,cw,'onSpecialSummon',synEvt(pk),'sz');
ok('コモンメンタルワールド positive: 自分のシンクロ召喚成功で誘発する',
   sc('コモンメンタルワールド').passive.onSpecialSummon(ccw)===true);
let lpB=gameState.players[1].lp;
sc('コモンメンタルワールド').resolve(ccw);
ok('コモンメンタルワールド positive: 相手ライフに500ダメージ',
   gameState.players[1].lp===lpB-500,'lp='+gameState.players[1].lp);
reset0();
let cw2=mk('コモンメンタルワールド',0,'up'),f1=mk(TUNER,1),f2=mk(PLAIN,1);
gameState.players[0].sz=[cw2];gameState.players[1].mz=[f1,f2];
let pk2=synchroSummon(1,'BF－アーマード・ウィング',[f1,f2]);
ok('コモンメンタルワールド negative: 相手のシンクロ召喚では誘発しない',
   sc('コモンメンタルワールド').passive.onSpecialSummon(
     ctxEv(0,cw2,'onSpecialSummon',synEvt(pk2),'sz'))===false);

/* ============ シンクロ・ストライク ============ */
reset0();
let ss=mk('シンクロ・ストライク',0,'down'),s1=mk(TUNER,0),s2=mk(PLAIN,0);
gameState.players[0].sz=[ss];gameState.players[0].mz=[s1,s2];
let pk3=synchroSummon(0,'BF－アーマード・ウィング',[s1,s2]);
ok('前提: シンクロ側に v380SummonMaterials が2件入る',
   Array.isArray(pk3.syn.v380SummonMaterials)&&pk3.syn.v380SummonMaterials.length===2,
   'mats='+JSON.stringify(pk3.syn.v380SummonMaterials||null));
let css=C(0,ss,'sz',0);
ok('シンクロ・ストライク positive: シンクロモンスターがいれば発動できる',
   sc('シンクロ・ストライク').condition(css)===true,css.reason||'');
let synAtk=dbOf(pk3.syn).atk;
sc('シンクロ・ストライク').selectTargets(css,t=>{css.selectedTargets=t;});
sc('シンクロ・ストライク').resolve(css);
ok('シンクロ・ストライク positive: 素材の数×500アップ（2体なら+1000）',
   curATK(pk3.syn)===synAtk+1000,'atk='+curATK(pk3.syn));
reset0();
let ss2=mk('シンクロ・ストライク',0,'down');
gameState.players[0].sz=[ss2];gameState.players[0].mz=[mk(BIG,0)];
ok('シンクロ・ストライク negative: シンクロモンスターがいなければ発動できない',
   sc('シンクロ・ストライク').condition(C(0,ss2,'sz',0))===false);

/* ============ チューナー・キャプチャー ============ */
reset0();
let tc=mk('チューナー・キャプチャー',0,'down'),ft=mk(TUNER,1),fn=mk(PLAIN,1);
gameState.players[0].sz=[tc];gameState.players[1].mz=[ft,fn];
let pk4=synchroSummon(1,'BF－アーマード・ウィング',[ft,fn]);
let ctc=ctxEv(0,tc,'onSpecialSummon',synEvt(pk4),'sz');
ok('チューナー・キャプチャー positive: 相手のシンクロ召喚成功で誘発する',
   sc('チューナー・キャプチャー').passive.onSpecialSummon(ctc)===true);
sc('チューナー・キャプチャー').selectTargets(ctc,t=>{ctc.selectedTargets=t;});
sc('チューナー・キャプチャー').resolve(ctc);
ok('チューナー・キャプチャー positive: 素材にしたチューナーを自分フィールドに特殊召喚する',
   gameState.players[0].mz.some(c=>c===ft),
   'p0mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
reset0();
let tc2=mk('チューナー・キャプチャー',0,'down'),my1=mk(TUNER,0),my2=mk(PLAIN,0);
gameState.players[0].sz=[tc2];gameState.players[0].mz=[my1,my2];
let pk5=synchroSummon(0,'BF－アーマード・ウィング',[my1,my2]);
ok('チューナー・キャプチャー negative: 自分のシンクロ召喚では誘発しない',
   sc('チューナー・キャプチャー').passive.onSpecialSummon(
     ctxEv(0,tc2,'onSpecialSummon',synEvt(pk5),'sz'))===false);

/* ============ スピリット・ドラゴン ============ */
reset0();
let sd=mk('スピリット・ドラゴン',0),sdFoe=mk(BIG,1);
gameState.players[0].mz=[sd];gameState.players[1].mz=[sdFoe];
gameState.players[0].hand=[mk(BIG,0)];   /* ドラゴン族 */
gameState.battle={player:0,atkIdx:0,target:0,step:'start'};
let csd=ctxDS(0,sd,{atkCard:sd,defCard:sdFoe,step:'start'},'mz','start');
ok('スピリット・ドラゴン positive: 自分が戦闘するバトルステップで誘発する',
   sc('スピリット・ドラゴン').passive.onDamageStep(csd)===true);
sc('スピリット・ドラゴン').cost(csd,()=>{});
sc('スピリット・ドラゴン').resolve(csd);
ok('スピリット・ドラゴン positive: 手札のドラゴン族を捨てて攻守が1000アップ',
   gameState.players[0].hand.length===0&&curATK(sd)===2000&&curDEF(sd)===2000,
   'atk='+curATK(sd)+' def='+curDEF(sd));
reset0();
let sd2=mk('スピリット・ドラゴン',0),sdFoe2=mk(BIG,1);
gameState.players[0].mz=[sd2];gameState.players[1].mz=[sdFoe2];
gameState.players[0].hand=[mk(PLAIN,0)];   /* アンデット族 */
gameState.battle={player:0,atkIdx:0,target:0,step:'start'};
ok('スピリット・ドラゴン negative: 手札にドラゴン族がいなければ発動できない',
   sc('スピリット・ドラゴン').passive.onDamageStep(
     ctxDS(0,sd2,{atkCard:sd2,defCard:sdFoe2,step:'start'},'mz','start'))===false);

/* ============ ジュラック・プティラ ============ */
reset0();
let jp=mk('ジュラック・プティラ',0,'up','def'),jpAtk=mk(BIG,1);
gameState.players[0].mz=[jp];gameState.players[1].mz=[jpAtk];
let cjp=ctxDS(0,jp,{atkCard:jpAtk,defCard:jp,step:'after'},'mz','after');
ok('ジュラック・プティラ positive: 攻撃されたダメージ計算後に誘発する',
   sc('ジュラック・プティラ').passive.onDamageStep(cjp)===true);
sc('ジュラック・プティラ').resolve(cjp);
ok('ジュラック・プティラ positive: 攻撃モンスターが持ち主の手札に戻る',
   gameState.players[1].hand.some(c=>c===jpAtk)&&gameState.players[1].mz.length===0,
   'p1hand='+gameState.players[1].hand.length);
ok('ジュラック・プティラ positive: 守備力が戻したモンスターのレベル×100アップ（青眼lv8→+800）',
   curDEF(jp)===1500+800,'def='+curDEF(jp));
reset0();
let jp2=mk('ジュラック・プティラ',0),jpFoe2=mk(BIG,1);
gameState.players[0].mz=[jp2];gameState.players[1].mz=[jpFoe2];
ok('ジュラック・プティラ negative: 自分が攻撃した場合は発動しない',
   sc('ジュラック・プティラ').passive.onDamageStep(
     ctxDS(0,jp2,{atkCard:jp2,defCard:jpFoe2,step:'after'},'mz','after'))===false);

/* ============ キング・もけもけ ============ */
reset0();
let km=mk('キング・もけもけ',0);
gameState.players[0].mz=[km];
gameState.players[0].grave=[mk('もけもけ',0),mk('もけもけ',0),mk('もけもけ',0)];
API.sendToGrave(h(km),'テスト：フィールドから離れる');
let ckm=ctxEv(0,km,'onSendToGrave',{},'grave');
ok('キング・もけもけ positive: フィールドから離れて誘発する',
   sc('キング・もけもけ').passive.onSendToGrave(ckm)===true);
sc('キング・もけもけ').resolve(ckm);
ok('キング・もけもけ positive: 墓地の「もけもけ」が可能な限り特殊召喚される',
   gameState.players[0].mz.filter(c=>dbOf(c).n==='もけもけ').length===3,
   'p0mz='+gameState.players[0].mz.map(c=>dbOf(c).n).join(','));
reset0();
let km2=mk('キング・もけもけ',0);
gameState.players[0].mz=[km2];gameState.players[0].grave=[];
API.sendToGrave(h(km2),'テスト：フィールドから離れる');
ok('キング・もけもけ negative: 墓地に「もけもけ」がいなければ発動できない',
   sc('キング・もけもけ').passive.onSendToGrave(ctxEv(0,km2,'onSendToGrave',{},'grave'))===false);
reset0();
/* ゾーンが埋まっている場合は「可能な限り」で止まる */
let km3=mk('キング・もけもけ',0);
gameState.players[0].mz=[km3,mk(PLAIN,0),mk(PLAIN,0),mk(PLAIN,0)];
gameState.players[0].grave=[mk('もけもけ',0),mk('もけもけ',0),mk('もけもけ',0)];
API.sendToGrave(h(km3),'テスト：フィールドから離れる');
let ckm3=ctxEv(0,km3,'onSendToGrave',{},'grave');
sc('キング・もけもけ').resolve(ckm3);
ok('キング・もけもけ ruling: モンスターゾーンの上限で止まる',
   gameState.players[0].mz.length===ZONE_LIMITS.mz
   &&gameState.players[0].grave.filter(c=>dbOf(c).n==='もけもけ').length===1,
   'p0mz='+gameState.players[0].mz.length+' grave='+gameState.players[0].grave.length);

/* ============ ゼンマイマイ ============ */
reset0();
let zm=mk('ゼンマイマイ',0),setCard=mk('落とし穴',1,'down');
gameState.players[0].mz=[zm];gameState.players[1].sz=[setCard];
let czm=C(0,zm,'mz',0);
ok('ゼンマイマイ positive: セットカードがあれば発動できる',
   sc('ゼンマイマイ').condition(czm)===true,czm.reason||'');
sc('ゼンマイマイ').selectTargets(czm,t=>{czm.selectedTargets=t;});
sc('ゼンマイマイ').resolve(czm);
ok('ゼンマイマイ positive: セットカードが持ち主の手札に戻る',
   gameState.players[1].sz.length===0&&gameState.players[1].hand.some(c=>c===setCard),
   'p1sz='+gameState.players[1].sz.length);
gameState.players[1].sz=[mk('落とし穴',1,'down')];
ok('ゼンマイマイ ruling: 表側で存在する限り1度しか使えない',
   sc('ゼンマイマイ').condition(C(0,zm,'mz',0))===false);
zm.summonedTurn=gameState.turn+1;
ok('ゼンマイマイ ruling: 出し直せば再び使える',
   sc('ゼンマイマイ').condition(C(0,zm,'mz',0))===true);
reset0();
let zm2=mk('ゼンマイマイ',0);
gameState.players[0].mz=[zm2];gameState.players[1].sz=[mk('落とし穴',1,'up')];
ok('ゼンマイマイ negative: 表側表示のカードは対象にできない',
   sc('ゼンマイマイ').condition(C(0,zm2,'mz',0))===false);

/* ============ テーヴァ ============ */
reset0();
let tb1=mk(PLAIN,0),tb2=mk(PLAIN,0);
gameState.players[0].mz=[tb1,tb2];
let teva=advanceSummon(0,'テーヴァ',[tb1,tb2]);
let foeMon=mk(BIG,1);gameState.players[1].mz=[foeMon];
ensureCardUid(gameState,teva);
let cte=ctxEv(0,teva,'onNormalSummon',{player:0,uids:[teva.uid]},'mz');
ok('テーヴァ positive: アドバンス召喚成功で誘発する',
   sc('テーヴァ').passive.onNormalSummon(cte)===true);
sc('テーヴァ').resolve(cte);
ok('テーヴァ ruling: 発動したターンはまだ相手を縛らない',
   cannotAttackNow(foeMon)===false);
gameState.turn=gameState.turn+1;
ok('テーヴァ positive: 次の相手ターンは攻撃宣言できない',
   cannotAttackNow(foeMon)===true);
gameState.turn=gameState.turn+1;
ok('テーヴァ ruling: その次のターンには解ける',
   cannotAttackNow(foeMon)===false);
reset0();
let teva2=mk('テーヴァ',0);
gameState.players[0].mz=[teva2];teva2.summonedTurn=gameState.turn;
ensureCardUid(gameState,teva2);   /* tributeCount を立てない＝通常召喚 */
ok('テーヴァ negative: アドバンス召喚でなければ発動できない',
   sc('テーヴァ').passive.onNormalSummon(
     ctxEv(0,teva2,'onNormalSummon',{player:0,uids:[teva2.uid]},'mz'))===false);

/* ============ デス・メテオ ============ */
reset0();
let dm=mk('デス・メテオ',0);
gameState.players[0].sz=[dm];
let cdm=C(0,dm,'sz',0);
ok('デス・メテオ positive: 相手ライフが3000より多ければ発動できる',
   sc('デス・メテオ').condition(cdm)===true,cdm.reason||'');
let lpD=gameState.players[1].lp;
sc('デス・メテオ').resolve(cdm);
ok('デス・メテオ positive: 相手ライフに1000ダメージ',
   gameState.players[1].lp===lpD-1000,'lp='+gameState.players[1].lp);
reset0();
let dm2=mk('デス・メテオ',0);
gameState.players[0].sz=[dm2];gameState.players[1].lp=3000;
ok('デス・メテオ negative: 相手ライフが3000以下では発動できない',
   sc('デス・メテオ').condition(C(0,dm2,'sz',0))===false);
gameState.players[1].lp=3001;
ok('デス・メテオ ruling: 3001なら発動できる（境界）',
   sc('デス・メテオ').condition(C(0,dm2,'sz',0))===true);

/* ================= 読み取り専用 passive の検証 ================= */
reset0();
let ro1=mk('コモンメンタルワールド',0,'up'),ro2=mk('テーヴァ',0),ro3=mk('ジュラック・プティラ',0);
gameState.players[0].sz=[ro1];gameState.players[0].mz=[ro2,ro3];
[ro2,ro3].forEach(c=>ensureCardUid(gameState,c));
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
sc('コモンメンタルワールド').passive.onSpecialSummon(
  ctxEv(0,ro1,'onSpecialSummon',{player:0,kind:'effect'},'sz'));
sc('テーヴァ').passive.onNormalSummon(ctxEv(0,ro2,'onNormalSummon',{player:0,uids:[ro2.uid]},'mz'));
sc('ジュラック・プティラ').passive.onDamageStep(
  ctxDS(0,ro3,{atkCard:null,defCard:ro3,step:'after'},'mz','after'));
ok('cycle22 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('テーヴァ',0);
gameState.players[0].mz=[rp1];ensureCardUid(gameState,rp1);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.setFlag(0,'d1TevaLockTurn',gameState.turn+1,true);
let ra1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle22 Replay: 次ターンの攻撃制限フラグが digest 一致で再生される',ra1.ok,ra1.reason||'');
reset0();
let rp2=mk('ゼンマイマイ',0);
gameState.players[0].mz=[rp2];ensureCardUid(gameState,rp2);
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
b0MarkFieldOnce(h(rp2),'d1MaimaiUsed','ゼンマイマイ');
let ra2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle22 Replay: 1度制限フラグが digest 一致で再生される',ra2.ok,ra2.reason||'');
let snap=JSON.stringify(gameState);
ok('cycle22 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('cycle22 直列化: 予約に関数が入っていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
