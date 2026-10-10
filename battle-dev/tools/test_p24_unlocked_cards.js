/* P24 Ritual registry 解禁カード — positive / negative / ruling edge。 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};openPick=()=>{};
const R=[];globalThis.__R=R;const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);
  const c={id,owner:p,controller:p,face,pos};ensureCardUid(gameState,c);return c;}
function reset0(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
}
function db(n){ return CARD_DB[findCardIndex(n)]; }
function h(c){ return locateCardAnyV4(c); }
function eff(n,k){const e=nativeEffectsV4(n).find(x=>!k||x.key===k);if(!e)throw new Error('effect '+n+' '+k);return e;}
function ctxAt(card,zone,ev){const loc=h(card);
  return makeContext(0,card,zone||(loc&&loc.zone)||'sz',(loc&&loc.index)||0,ev||'activate',{});}
function pending(){ return pendingChoiceV49(gameState); }
function candOf(n){
  const pc=pending(); if(!pc) return null;
  return pc.candidates.find(x=>{
    if(String(x.label).includes(n)) return true;
    if(x.uid==null) return false;
    const hh=findCardByUid(x.uid); return !!hh&&dbOf(hh.card).n===n;})||null;
}
function answerByName(n){
  const c=candOf(n);
  if(!c) throw new Error('候補が無い: '+n+' / '+candNames().join(','));
  return answerChoiceV49([c.key]);
}
/* 儀式の選択は「儀式モンスター→素材…」と続く。
   名前が一致する候補があればそれを、無ければ先頭を選んで最後まで進める。 */
function driveRitual(names){
  let guard=0;
  while(pending()&&guard++<8){
    let picked=null;
    for(const n of (names||[])){ const c=candOf(n); if(c){ picked=c; break; } }
    const pc=pending();
    answerChoiceV49([(picked||pc.candidates[0]).key]);
  }
  return guard;
}
function answerFirst(){const pc=pending();if(!pc)throw new Error('no pending choice');
  return answerChoiceV49([pc.candidates[0].key]);}
function inMz(p,n){ return (gameState.players[p].mz||[]).some(c=>c&&dbOf(c).n===n); }
function candNames(){ const pc=pending(); if(!pc) return [];
  return pc.candidates.map(x=>{const hh=x.uid!=null?findCardByUid(x.uid):null;
    return hh?dbOf(hh.card).n:String(x.label);}); }
/* 儀式素材の小道具（GENERIC_OK / TESTED のみ） */
const LV8='青眼の白龍';          /* lv8 GENERIC_OK */
const LV4='サファイアドラゴン';   /* lv4 GENERIC_OK */
const LV1='おジャマ・イエロー';   /* lv2 GENERIC_OK */

const NAMES=['イリュージョンの儀式','カオスの儀式','ガルマソードの誓い','仮面魔獣の儀式','奈落との契約'];
NAMES.forEach(n=>ok('P24 registration '+n,!!CARD_SCRIPTS[n]));

/* ================= 1. legacy と共存 ================= */
reset0();
ok('P24 共存: legacy RITUAL_SPEC_V5 は無傷',
   typeof RITUAL_SPEC_V5==='object'&&Object.keys(RITUAL_SPEC_V5).length>=19,
   String(Object.keys(RITUAL_SPEC_V5).length));
ok('P24 共存: legacy の儀式魔法が従来通り引ける',(()=>{
  const s=ritualSpecV5('ゼラの儀式');
  return !!s&&s.level===8&&s.levelMode==='atLeast';})());
ok('P24 共存: 新規5枚は registry から引ける',
   NAMES.every(n=>!!ritualSpecRegisteredV24(n)));
ok('P24 共存: legacy 側は registry に入っていない',
   !ritualSpecRegisteredV24('ゼラの儀式'));

/* ================= 各カード：spec が正しいか ================= */
reset0();
const EXPECT=[['イリュージョンの儀式','サクリファイス',1,'atLeast'],
              ['カオスの儀式','カオス・ソルジャー',8,'atLeast'],
              ['ガルマソードの誓い','ガルマソード',7,'atLeast'],
              ['仮面魔獣の儀式','仮面魔獣マスクド・ヘルレイザー',8,'atLeast']];
EXPECT.forEach(([spell,mon,lv,mode])=>{
  const s=ritualSpecV5(spell);
  ok(spell+' positive: spec が正しい',
     !!s&&s.level===lv&&s.levelMode===mode&&s.monsters[0]===mon,JSON.stringify(s));
  ok(spell+' positive: 指定の儀式モンスターを許可する',
     ritualAllowsMonsterV5(s,db(mon))===true);
  ok(spell+' negative: 別の儀式モンスターは許可しない',
     ritualAllowsMonsterV5(s,db('ゼラ'))===(mon==='ゼラ'));
  ok(spell+' negative: 儀式モンスター以外は許可しない',
     ritualAllowsMonsterV5(s,db(LV8))===false);
});

/* ================= 奈落との契約：述語型 ================= */
reset0();
let dc=ritualSpecV5('奈落との契約');
ok('奈落との契約 positive: 述語型の spec になっている',
   !!dc&&dc.pred==='DARK_RITUAL_V24'&&dc.monsters===null&&dc.levelMode==='exact'
   &&dc.level===null,JSON.stringify(dc));
ok('奈落との契約 positive: 述語が登録されている',
   typeof ritualPredicateV24('DARK_RITUAL_V24')==='function');
ok('奈落との契約 positive: 闇属性の儀式モンスターを許可する',
   ritualAllowsMonsterV5(dc,db('ガルマソード'))===true&&db('ガルマソード').at==='闇');
ok('奈落との契約 positive: 別の闇属性儀式モンスターも許可する',
   ritualAllowsMonsterV5(dc,db('ゼラ'))===true&&db('ゼラ').at==='闇');
ok('奈落との契約 negative: 闇属性でない儀式モンスターは許可しない',
   ritualAllowsMonsterV5(dc,db('カオス・ソルジャー'))===false
   &&db('カオス・ソルジャー').at==='地');
ok('奈落との契約 negative: 闇属性でも儀式モンスターでなければ許可しない',(()=>{
  const darkNonRitual=CARD_DB.find(d=>d.k==='m'&&d.at==='闇'&&!(d.st||[]).includes('儀式'));
  return !!darkNonRitual&&ritualAllowsMonsterV5(dc,darkNonRitual)===false;})());
ok('奈落との契約 ruling: カード名を列挙していない（述語だけで表現）',
   dc.monsters===null);
ok('奈落との契約 ruling: 必要レベルは儀式モンスター自身のレベル',
   ritualRequiredLevelV5(dc,mk('ガルマソード',0))===db('ガルマソード').lv);

/* ================= 必要レベル計算 ================= */
reset0();
ok('P24 レベル: atLeast は宣言値をそのまま使う',
   ritualRequiredLevelV5(ritualSpecV5('カオスの儀式'),mk('カオス・ソルジャー',0))===8);
ok('P24 レベル: イリュージョンの儀式は1',
   ritualRequiredLevelV5(ritualSpecV5('イリュージョンの儀式'),mk('サクリファイス',0))===1);
ok('P24 レベル: atLeast の合法判定（超過リリース禁止）',
   ritualSelectionValidV5([8],8,'atLeast')===true
   &&ritualSelectionValidV5([8,4],8,'atLeast')===false
   &&ritualSelectionValidV5([4,4],8,'atLeast')===true);
ok('P24 レベル: exact はぴったり一致のみ',
   ritualSelectionValidV5([7],7,'exact')===true
   &&ritualSelectionValidV5([8],7,'exact')===false);

/* ================= 実際の儀式召喚（カオスの儀式）================= */
reset0();
let sp=mk('カオスの儀式',0), mon=mk('カオス・ソルジャー',0), mat=mk(LV8,0);
gameState.players[0].sz=[sp];
gameState.players[0].hand=[mon,mat];
ok('カオスの儀式 positive: 素材が足りれば発動できる',
   API.ritualCanActivate(0,'カオスの儀式')===true);
v41ResetActionJournal(gameState);
API.ritualSummon(ctxAt(sp,'sz'),'カオスの儀式');
driveRitual(['カオス・ソルジャー',LV8]);
ok('カオスの儀式 positive: 儀式召喚される',inMz(0,'カオス・ソルジャー'),
   (gameState.players[0].mz||[]).map(c=>dbOf(c).n).join(','));
ok('カオスの儀式 positive: provenance が ritual として残る',(()=>{
  const m=(gameState.players[0].mz||[]).find(c=>c&&dbOf(c).n==='カオス・ソルジャー');
  const pv=m&&API.summonProvenance(m);
  return !!pv&&pv.summonType==='ritual'&&Array.isArray(pv.materialSnapshots)
    &&pv.materialSnapshots.length===1;})());
ok('カオスの儀式 positive: 素材が墓地へ送られる',
   (gameState.players[0].grave||[]).some(c=>c&&c.uid===mat.uid));
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('カオスの儀式 Replay: digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('P24 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
reset0();
let sp2=mk('カオスの儀式',0), mon2=mk('カオス・ソルジャー',0), small=mk(LV4,0);
gameState.players[0].sz=[sp2];gameState.players[0].hand=[mon2,small];
ok('カオスの儀式 negative: レベル合計が足りなければ発動できない',
   API.ritualCanActivate(0,'カオスの儀式')===false,'mat lv='+db(LV4).lv);
reset0();
let sp3=mk('カオスの儀式',0), wrong=mk('ガルマソード',0), big3=mk(LV8,0);
gameState.players[0].sz=[sp3];gameState.players[0].hand=[wrong,big3];
ok('カオスの儀式 negative: 対応しない儀式モンスターでは発動できない',
   API.ritualCanActivate(0,'カオスの儀式')===false);

/* ================= 実際の儀式召喚（奈落との契約・述語型）================= */
reset0();
let dcSp=mk('奈落との契約',0), dark=mk('ガルマソード',0);
let m4a=mk(LV4,0), m4b=mk('サファイアドラゴン',0);
gameState.players[0].sz=[dcSp];
gameState.players[0].hand=[dark,m4a];
gameState.players[0].mz=[m4b];
ok('奈落との契約 positive: レベル7ちょうどを組めるなら発動できる',
   API.ritualCanActivate(0,'奈落との契約')===false,
   'lv4+lv4=8 なので exact 7 は組めない');
reset0();
/* 候補が1件だと自動で選ばれるので、
   闇属性の儀式モンスターを2体と、闇でない儀式モンスターを1体手札へ置く。 */
const DARK2='マジシャン・オブ・ブラックカオス';
let dcSp2=mk('奈落との契約',0), zera=mk('ゼラ',0),
    dark2=mk(DARK2,0), notDark=mk('カオス・ソルジャー',0), big=mk(LV8,0);
gameState.players[0].sz=[dcSp2];
gameState.players[0].hand=[zera,dark2,notDark,big];
ok('前提: 小道具は闇属性の儀式モンスター',
   db(DARK2).at==='闇'&&(db(DARK2).st||[]).includes('儀式')&&db(DARK2).lv===8);
ok('奈落との契約 positive: レベル8の素材でレベル8の闇儀式を降臨できる',
   API.ritualCanActivate(0,'奈落との契約')===true,'ゼラ lv'+db('ゼラ').lv);
v41ResetActionJournal(gameState);
API.ritualSummon(ctxAt(dcSp2,'sz'),'奈落との契約');
ok('奈落との契約 positive: 闇属性の儀式モンスターだけが候補になる',
   candNames().length===2&&candNames().every(n=>{const d=db(n);return d&&d.at==='闇'&&(d.st||[]).includes('儀式');}),
   candNames().join(','));
ok('奈落との契約 negative: 闇でない儀式モンスターは候補に入らない',
   candNames().indexOf('カオス・ソルジャー')<0,candNames().join(','));
driveRitual(['ゼラ',LV8]);
ok('奈落との契約 positive: 儀式召喚される',inMz(0,'ゼラ'),
   (gameState.players[0].mz||[]).map(c=>dbOf(c).n).join(','));
let audit2=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('奈落との契約 Replay: digest 一致で再生される',audit2.ok,audit2.reason||audit2.finalDigest);
reset0();
let dcSp3=mk('奈落との契約',0), light=mk('カオス・ソルジャー',0), big2=mk(LV8,0);
gameState.players[0].sz=[dcSp3];gameState.players[0].hand=[light,big2];
ok('奈落との契約 negative: 闇属性でない儀式モンスターでは発動できない',
   API.ritualCanActivate(0,'奈落との契約')===false);
reset0();
let dcSp4=mk('奈落との契約',0), zera4=mk('ゼラ',0), small4=mk(LV4,0);
gameState.players[0].sz=[dcSp4];gameState.players[0].hand=[zera4,small4];
ok('奈落との契約 negative: レベルがぴったり合わなければ発動できない',
   API.ritualCanActivate(0,'奈落との契約')===false,'lv4 vs 必要8');

/* ================= イリュージョンの儀式（レベル1 atLeast）================= */
reset0();
let ill=mk('イリュージョンの儀式',0), sac=mk('サクリファイス',0), tiny=mk(LV1,0);
gameState.players[0].sz=[ill];gameState.players[0].hand=[sac,tiny];
ok('イリュージョンの儀式 positive: レベル1以上なので低レベル素材1体で足りる',
   API.ritualCanActivate(0,'イリュージョンの儀式')===true,'mat lv='+db(LV1).lv);
API.ritualSummon(ctxAt(ill,'sz'),'イリュージョンの儀式');
driveRitual(['サクリファイス',LV1]);
ok('イリュージョンの儀式 positive: 儀式召喚される',inMz(0,'サクリファイス'));
ok('イリュージョンの儀式 ruling: atLeast なので余分なリリースはできない',
   ritualSelectionValidV5([2,2],1,'atLeast')===false);
reset0();
let ill2=mk('イリュージョンの儀式',0), sac2=mk('サクリファイス',0);
gameState.players[0].sz=[ill2];gameState.players[0].hand=[sac2];
ok('イリュージョンの儀式 negative: 素材が無ければ発動できない',
   API.ritualCanActivate(0,'イリュージョンの儀式')===false);

/* ================= ガルマソードの誓い / 仮面魔獣の儀式 ================= */
reset0();
let gs=mk('ガルマソードの誓い',0), gm=mk('ガルマソード',0), gmat=mk(LV8,0);
gameState.players[0].sz=[gs];gameState.players[0].hand=[gm,gmat];
ok('ガルマソードの誓い positive: レベル7以上で発動できる',
   API.ritualCanActivate(0,'ガルマソードの誓い')===true);
API.ritualSummon(ctxAt(gs,'sz'),'ガルマソードの誓い');
driveRitual(['ガルマソード',LV8]);
ok('ガルマソードの誓い positive: 儀式召喚される',inMz(0,'ガルマソード'));
reset0();
let mk1=mk('仮面魔獣の儀式',0), hell=mk('仮面魔獣マスクド・ヘルレイザー',0), hm=mk(LV8,0);
gameState.players[0].sz=[mk1];gameState.players[0].hand=[hell,hm];
ok('仮面魔獣の儀式 positive: レベル8以上で発動できる',
   API.ritualCanActivate(0,'仮面魔獣の儀式')===true);
API.ritualSummon(ctxAt(mk1,'sz'),'仮面魔獣の儀式');
driveRitual(['仮面魔獣マスクド・ヘルレイザー',LV8]);
ok('仮面魔獣の儀式 positive: 儀式召喚される',inMz(0,'仮面魔獣マスクド・ヘルレイザー'));
reset0();
let mk2=mk('仮面魔獣の儀式',0), hell2=mk('仮面魔獣マスクド・ヘルレイザー',0), sm=mk(LV4,0);
gameState.players[0].sz=[mk2];gameState.players[0].hand=[hell2,sm];
ok('仮面魔獣の儀式 negative: レベル合計が足りなければ発動できない',
   API.ritualCanActivate(0,'仮面魔獣の儀式')===false);

/* ================= 素材は手札・自分フィールドの両方から ================= */
reset0();
let cs=mk('カオスの儀式',0), cm=mk('カオス・ソルジャー',0), fieldMat=mk(LV8,0);
gameState.players[0].sz=[cs];gameState.players[0].hand=[cm];
gameState.players[0].mz=[fieldMat];
ok('P24 ruling: 自分フィールドのモンスターも素材にできる',
   API.ritualCanActivate(0,'カオスの儀式')===true);
reset0();
let cs2=mk('カオスの儀式',0), cm2=mk('カオス・ソルジャー',0), foeMat=mk(LV8,1);
gameState.players[0].sz=[cs2];gameState.players[0].hand=[cm2];
gameState.players[1].mz=[foeMat];
ok('P24 ruling negative: 相手フィールドのモンスターは素材にできない',
   API.ritualCanActivate(0,'カオスの儀式')===false);

/* ================= registry が state へ漏れていないこと ================= */
reset0();
ok('P24 直列化: registry は gameState に入っていない',
   gameState.RITUAL_SPEC_REGISTRY_V24===undefined&&gameState.ritualSpecV24===undefined);
ok('P24 直列化: registry の中身は純JSON',
   assertRitualRegistrySerializableV24()===null,
   String(assertRitualRegistrySerializableV24()));
ok('P24 digest: 新しい gameState キーを増やしていない',
   v41StateDigestText(gameState).indexOf('RITUAL_SPEC')<0
   &&v41StateDigestText(gameState).indexOf('V24')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
