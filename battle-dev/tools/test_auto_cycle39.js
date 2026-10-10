/* Auto cycle 39 — 8枚。positive / negative / ruling edge / Replay。 */
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

const ALL=['レプティレス・アンガー','呪いのお札','悪魔のくちづけ','下克上の首飾り',
 'カース・サイキック','時の機械－タイム・マシーン','人造人間－サイコ・リターナー','二角獣レーム'];
ALL.forEach(n=>ok('cycle39 registration '+n,!!CARD_SCRIPTS[n]));
ok('cycle39 枚数は8',ALL.length===8);

const PSY='クレボンス';                     /* サイキック lv2 */
const SHOCKER='人造人間－サイコ・ショッカー'; /* ENGINE_GAP なので fixture に使ってよい */
const NORMAL='ワイト';                      /* 通常 lv1 */

function killedBattle(atkCard,defCard){
  return {atkCard:atkCard,defCard:defCard,destroyedDef:true,destroyedAtk:false};
}
function fireAt(at,p,phase,advance){
  gameState.turn=gameState.turn+(advance==null?0:advance);
  gameState.activePlayer=p;gameState.phase=phase;
  return runDueSchedulesV7(at,gameState);
}

/* ============ 1. レプティレス・アンガー ============ */
reset0();
let ra=mk('レプティレス・アンガー',0),raMon=mk(BIG,0);
gameState.players[0].sz=[ra];gameState.players[0].mz=[raMon];
let raCtx=C(0,ra,'sz',0,'activate',{});
ok('レプティレス・アンガー positive: 表側モンスターがいれば発動できる',
   sc('レプティレス・アンガー').condition(raCtx)===true);
raCtx.selectedTargets=[h(raMon)];
sc('レプティレス・アンガー').resolve(raCtx);
ra.face='up';
ok('レプティレス・アンガー card-specific: 装備され攻撃力が800アップ',
   !!ra.equipTo&&curATK(raMon)===dbOf(raMon).atk+800,'atk='+curATK(raMon));
ok('レプティレス・アンガー card-specific: 装備モンスターは爬虫類族になる',
   API.raceOf(h(raMon))==='爬虫類','race='+API.raceOf(h(raMon)));
ok('レプティレス・アンガー card-specific: 装備先 uid が刻まれる',
   Number(ra.e8HostUid)===raMon.uid);
reset0();
let ra2=mk('レプティレス・アンガー',0),ra2Foe=mk(BIG,1);
gameState.players[0].grave=[ra2];gameState.players[1].mz=[ra2Foe];
ra2.graveInfo={turn:gameState.turn,from:'sz',byDestroy:true,byPlayer:1};
let ra2Ctx=C(0,ra2,'grave',0,'activate',{});
ok('レプティレス・アンガー positive: 破壊され墓地へ送られた時に発動できる',
   sc('レプティレス・アンガー').condition(ra2Ctx)===true);
ra2Ctx.selectedTargets=[h(ra2Foe)];
let ra2Atk=curATK(ra2Foe);
sc('レプティレス・アンガー').resolve(ra2Ctx);
ok('レプティレス・アンガー card-specific: 相手モンスターの攻撃力が800ダウン',
   curATK(ra2Foe)===ra2Atk-800,'atk='+ra2Atk+'→'+curATK(ra2Foe));
reset0();
let ra3=mk('レプティレス・アンガー',0);
gameState.players[0].grave=[ra3];gameState.players[1].mz=[];
ra3.graveInfo={turn:gameState.turn,from:'sz',byDestroy:true,byPlayer:1};
ok('レプティレス・アンガー negative: 相手モンスターがいなければ発動できない',
   sc('レプティレス・アンガー').condition(C(0,ra3,'grave',0,'activate',{}))===false);

/* ============ 2. 呪いのお札 ============ */
reset0();
let cf=mk('呪いのお札',0),cfHost=mk(BIG,0);
gameState.players[0].grave=[cf,cfHost];
ensureCardUid(gameState,cfHost);
cf.e8HostUid=cfHost.uid;
cf.graveInfo={turn:gameState.turn,from:'sz',byDestroy:false,byPlayer:null};
cfHost.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
let cfCtx=C(0,cf,'grave',0,'activate',{});
ok('呪いのお札 positive: 装備モンスターが破壊された事で墓地へ行った時に発動できる',
   sc('呪いのお札').condition(cfCtx)===true);
let cfLp=gameState.players[0].lp;
sc('呪いのお札').resolve(cfCtx);
ok('呪いのお札 card-specific: 装備モンスターの元々の守備力分のダメージ（青眼2500）',
   gameState.players[0].lp===cfLp-Number(dbOf(cfHost).def),
   'lp='+cfLp+'→'+gameState.players[0].lp);
reset0();
let cf2=mk('呪いのお札',0),cf2Host=mk(BIG,0);
gameState.players[0].grave=[cf2,cf2Host];
ensureCardUid(gameState,cf2Host);
cf2.e8HostUid=cf2Host.uid;
cf2.graveInfo={turn:gameState.turn,from:'sz',byDestroy:false,byPlayer:null};
cf2Host.graveInfo={turn:gameState.turn,from:'mz',byDestroy:false,byPlayer:null};
ok('呪いのお札 negative: 装備モンスターが破壊以外で墓地へ行った場合は発動できない',
   sc('呪いのお札').condition(C(0,cf2,'grave',0,'activate',{}))===false);

/* ============ 3. 悪魔のくちづけ ============ */
reset0();
let dk=mk('悪魔のくちづけ',0),dkMon=mk(BIG,0);
gameState.players[0].sz=[dk];gameState.players[0].mz=[dkMon];
let dkCtx=C(0,dk,'sz',0,'activate',{});
dkCtx.selectedTargets=[h(dkMon)];
sc('悪魔のくちづけ').resolve(dkCtx);
dk.face='up';
ok('悪魔のくちづけ card-specific: 装備され攻撃力が700アップ',
   !!dk.equipTo&&curATK(dkMon)===dbOf(dkMon).atk+700,'atk='+curATK(dkMon));
reset0();
let dk2=mk('悪魔のくちづけ',0);
gameState.players[0].grave=[dk2];
dk2.graveInfo={turn:gameState.turn,from:'sz',byDestroy:true,byPlayer:1};
let dk2Ctx=C(0,dk2,'grave',0,'activate',{});
ok('悪魔のくちづけ positive: 墓地へ送られた時に発動できる',
   sc('悪魔のくちづけ').condition(dk2Ctx)===true);
let dk2Lp=gameState.players[0].lp;
sc('悪魔のくちづけ').cost(dk2Ctx,()=>{});
ok('悪魔のくちづけ positive: 500ライフポイントを払う',
   gameState.players[0].lp===dk2Lp-500);
sc('悪魔のくちづけ').resolve(dk2Ctx);
ok('悪魔のくちづけ card-specific: デッキの一番上に戻る',
   gameState.players[0].deck.length>0
   &&dbOf(gameState.players[0].deck[0]).n==='悪魔のくちづけ',
   'top='+(gameState.players[0].deck[0]&&dbOf(gameState.players[0].deck[0]).n));
reset0();
let dk3=mk('悪魔のくちづけ',0);
gameState.players[0].grave=[dk3];gameState.players[0].lp=300;
dk3.graveInfo={turn:gameState.turn,from:'sz',byDestroy:true,byPlayer:1};
ok('悪魔のくちづけ negative: 500ライフを払えなければ発動できない',
   sc('悪魔のくちづけ').condition(C(0,dk3,'grave',0,'activate',{}))===false);

/* ============ 4. 下克上の首飾り ============ */
reset0();
let gk=mk('下克上の首飾り',0),gkNormal=mk(NORMAL,0),gkFoe=mk(BIG,1);
gameState.players[0].sz=[gk];gameState.players[0].mz=[gkNormal];
gameState.players[1].mz=[gkFoe];
let gkCtx=C(0,gk,'sz',0,'activate',{});
ok('下克上の首飾り positive: 通常モンスターがいれば発動できる',
   sc('下克上の首飾り').condition(gkCtx)===true);
gkCtx.selectedTargets=[h(gkNormal)];
sc('下克上の首飾り').resolve(gkCtx);
gk.face='up';
ok('下克上の首飾り ruling: 戦闘していなければ攻撃力は上がらない',
   curATK(gkNormal)===dbOf(gkNormal).atk,'atk='+curATK(gkNormal));
gameState.battle={player:1,atkIdx:0,target:0};
let gkGap=Number(dbOf(gkFoe).lv)-Number(dbOf(gkNormal).lv);
ok('下克上の首飾り card-specific: レベル差×500アップ（8-1=7 → 3500）',
   curATK(gkNormal)===dbOf(gkNormal).atk+gkGap*500,
   'gap='+gkGap+' atk='+curATK(gkNormal));
gameState.battle=null;
reset0();
/* 青眼の白龍は通常モンスターなので、効果モンスターを使って確かめる。 */
let gk2=mk('下克上の首飾り',0),gk2Eff=mk(PSY,0);
gameState.players[0].sz=[gk2];gameState.players[0].mz=[gk2Eff];
ok('下克上の首飾り ruling: 効果モンスターには装備できない（equipSpec）',
   equipLegalV15(gk2,h(gk2Eff))===false);
let gk2Normal=mk(NORMAL,0);
gameState.players[0].mz=[gk2Eff,gk2Normal];
ok('下克上の首飾り ruling: 通常モンスターには装備できる',
   equipLegalV15(gk2,h(gk2Normal))===true);
reset0();
let gk3=mk('下克上の首飾り',0);
gameState.players[0].grave=[gk3];
gk3.graveInfo={turn:gameState.turn,from:'sz',byDestroy:true,byPlayer:1};
sc('下克上の首飾り').resolve(C(0,gk3,'grave',0,'activate',{}));
ok('下克上の首飾り card-specific: 墓地へ送られた時にデッキの一番上に戻せる',
   gameState.players[0].deck.length>0
   &&dbOf(gameState.players[0].deck[0]).n==='下克上の首飾り');

/* ============ 5. カース・サイキック ============ */
reset0();
let cp=mk('カース・サイキック',0,'down'),cpPsy=mk(PSY,0),cpFoe=mk(BIG,1);
gameState.players[0].sz=[cp];gameState.players[0].grave=[cpPsy];
gameState.players[1].mz=[cpFoe];
let cpCtx=ctxDS(0,cp,killedBattle(cpFoe,cpPsy),'sz');
ok('カース・サイキック positive: 自分のサイキック族が相手の攻撃で破壊された時に発動できる',
   sc('カース・サイキック').passive.onDamageStep(cpCtx)===true);
let cpLp=gameState.players[1].lp;
let cpLv=Number(dbOf(cpPsy).lv);
sc('カース・サイキック').resolve(cpCtx);
ok('カース・サイキック card-specific: 攻撃した相手モンスターが破壊される',
   gameState.players[1].mz.length===0);
ok('カース・サイキック card-specific: レベル×300ダメージ（2×300=600）',
   gameState.players[1].lp===cpLp-cpLv*300,
   'lv='+cpLv+' lp='+cpLp+'→'+gameState.players[1].lp);
reset0();
let cp2=mk('カース・サイキック',0,'down'),cp2NonPsy=mk(BIG,0),cp2Foe=mk(BIG,1);
gameState.players[0].sz=[cp2];gameState.players[0].grave=[cp2NonPsy];
gameState.players[1].mz=[cp2Foe];
ok('カース・サイキック negative: サイキック族以外が破壊されても発動できない',
   sc('カース・サイキック').passive.onDamageStep(
     ctxDS(0,cp2,killedBattle(cp2Foe,cp2NonPsy),'sz'))===false);

/* ============ 6. 時の機械－タイム・マシーン ============ */
reset0();
let tm=mk('時の機械－タイム・マシーン',0,'down'),tmDead=mk(BIG,0);
gameState.players[0].sz=[tm];gameState.players[0].grave=[tmDead];
ensureCardUid(gameState,tmDead);
tmDead.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1,pos:'def',face:'up'};
let tmCtx=ctxDS(0,tm,killedBattle(mk(BIG,1),tmDead),'sz');
ok('時の機械－タイム・マシーン positive: 戦闘破壊されたモンスターがいれば発動できる',
   sc('時の機械－タイム・マシーン').passive.onDamageStep(tmCtx)===true);
sc('時の機械－タイム・マシーン').resolve(tmCtx);
ok('時の機械－タイム・マシーン card-specific: 同じ表示形式（守備）で持ち主の場に戻る',
   gameState.players[0].mz.some(c=>c&&c.uid===tmDead.uid)
   &&gameState.players[0].mz[0].pos==='def',
   'pos='+(gameState.players[0].mz[0]&&gameState.players[0].mz[0].pos));
reset0();
let tm2=mk('時の機械－タイム・マシーン',0,'down'),tm2Dead=mk(BIG,0);
gameState.players[0].sz=[tm2];gameState.players[0].grave=[tm2Dead];
tm2Dead.graveInfo={turn:gameState.turn,from:'mz',byDestroy:false,byPlayer:null};
ok('時の機械－タイム・マシーン negative: 戦闘破壊でなければ発動できない',
   sc('時の機械－タイム・マシーン').passive.onDamageStep(
     ctxDS(0,tm2,{atkCard:mk(BIG,1),defCard:tm2Dead,destroyedDef:false},'sz'))===false);

/* ============ 7. 人造人間－サイコ・リターナー ============ */
reset0();
let pr=mk('人造人間－サイコ・リターナー',0),prShock=mk(SHOCKER,0);
gameState.players[0].grave=[pr,prShock];
ensureCardUid(gameState,prShock);
pr.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
let prCtx=C(0,pr,'grave',0,'activate',{});
ok('人造人間－サイコ・リターナー positive: 墓地へ送られた時に発動できる',
   sc('人造人間－サイコ・リターナー').condition(prCtx)===true);
prCtx.selectedTargets=[h(prShock)];
sc('人造人間－サイコ・リターナー').resolve(prCtx);
ok('人造人間－サイコ・リターナー card-specific: 「サイコ・ショッカー」が特殊召喚される',
   gameState.players[0].mz.some(c=>c&&c.uid===prShock.uid));
ok('人造人間－サイコ・リターナー card-specific: 自分エンドフェイズの破壊が予約される',
   API.schedules('e8.destroyUid').length===1);
fireAt('endPhase',0,'end',2);
ok('人造人間－サイコ・リターナー card-specific: 予約が発火して破壊される',
   gameState.players[0].mz.length===0);
ok('人造人間－サイコ・リターナー card-specific: 直接攻撃できる（canDirectAttack）',
   sc('人造人間－サイコ・リターナー').canDirectAttack===true);
reset0();
let pr2=mk('人造人間－サイコ・リターナー',0);
gameState.players[0].grave=[pr2];
pr2.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
ok('人造人間－サイコ・リターナー negative: 「サイコ・ショッカー」が墓地になければ発動できない',
   sc('人造人間－サイコ・リターナー').condition(C(0,pr2,'grave',0,'activate',{}))===false);

/* ============ 8. 二角獣レーム ============ */
reset0();
let nr=mk('二角獣レーム',0),nrSyn=mk('C・ドラゴン',0);
gameState.players[0].grave=[nr];gameState.players[0].mz=[nrSyn];
ensureCardUid(gameState,nr);ensureCardUid(gameState,nrSyn);
nr.graveInfo={turn:gameState.turn,from:'mz',byDestroy:false,byPlayer:null,
  reason:'synchroMaterial'};
for(let i=0;i<6;i++) gameState.players[1].deck.push(mk(PLAIN,1));
let nrDeck=gameState.players[1].deck.length;
let nrCtx=ctxEv(0,nr,'onSendToGrave',
  {uid:nr.uid,kind:'synchro',reason:'synchroMaterial',summonUid:nrSyn.uid},'grave');
ok('二角獣レーム positive: シンクロ素材として墓地へ送られた時に誘発する',
   sc('二角獣レーム').passive.onSendToGrave(nrCtx)===true);
sc('二角獣レーム').resolve(nrCtx);
ok('二角獣レーム card-specific: 相手のデッキの上から2枚墓地へ送る',
   gameState.players[1].deck.length===nrDeck-2
   &&gameState.players[1].grave.length===2,
   'deck='+nrDeck+'→'+gameState.players[1].deck.length);
reset0();
let nr2=mk('二角獣レーム',0);
gameState.players[0].grave=[nr2];ensureCardUid(gameState,nr2);
nr2.graveInfo={turn:gameState.turn,from:'mz',byDestroy:true,byPlayer:1};
for(let i=0;i<6;i++) gameState.players[1].deck.push(mk(PLAIN,1));
ok('二角獣レーム negative: 素材以外で墓地へ行っても誘発しない',
   sc('二角獣レーム').passive.onSendToGrave(
     ctxEv(0,nr2,'onSendToGrave',{uid:nr2.uid},'grave'))===false);

/* ================= passive / continuous は read-only ================= */
reset0();
let roGk=mk('下克上の首飾り',0),roN=mk(NORMAL,0),roFoe=mk(BIG,1);
gameState.players[0].sz=[roGk];gameState.players[0].mz=[roN];
gameState.players[1].mz=[roFoe];
ensureCardUid(gameState,roGk);ensureCardUid(gameState,roN);
roGk.equipUid=roGk.equipUid||1101;roGk.equipTo={p:0,uid:roN.uid};
roN.equippedBy=[roGk.equipUid];roGk.face='up';
gameState.battle={player:1,atkIdx:0,target:0};
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let jBefore=V41_ACTION_JOURNAL.length;
curATK(roN);curATK(roFoe);
ok('cycle39 passive/continuous は read-only（Journal を増やさない）',
   V41_ACTION_JOURNAL.length===jBefore,
   'before='+jBefore+' after='+V41_ACTION_JOURNAL.length);
gameState.battle=null;

/* ================= Replay / SaveLoad ================= */
reset0();
let rp1=mk('レプティレス・アンガー',0),rp1Mon=mk(BIG,0);
gameState.players[0].sz=[rp1];gameState.players[0].mz=[rp1Mon];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
let rp1Ctx=C(0,rp1,'sz',0,'activate',{});
rp1Ctx.selectedTargets=[h(rp1Mon)];
sc('レプティレス・アンガー').resolve(rp1Ctx);
let rq1=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle39 Replay: 装備＋種族変更が digest 一致で再生される',rq1.ok,rq1.reason||'');
reset0();
let rp2=mk('二角獣レーム',0);
gameState.players[0].grave=[rp2];ensureCardUid(gameState,rp2);
for(let i=0;i<6;i++) gameState.players[1].deck.push(mk(PLAIN,1));
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.millTop(1,2,'二角獣レーム');
let rq2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('cycle39 Replay: デッキ破壊が digest 一致で再生される',rq2.ok,rq2.reason||'');
let snap39=JSON.stringify(gameState);
ok('cycle39 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap39))===snap39);
ok('cycle39 直列化: 予約に関数が入っていない',snap39.indexOf('function')<0);
globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});}catch(e){console.error(e.stack||e);}
const RR=c.__R||[];console.log(RR.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join(String.fromCharCode(10)));if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);
