/* Ritual recovery batch — 儀式魔法19枚と儀式モンスター3枚の positive/negative。
   各カードについて 正しい儀式魔法 / 正しい儀式モンスター / 素材Lv条件 /
   exact・atLeast / 手札素材 / フィールド素材 / 不足時negative / 過剰Lv /
   Replay を確認する。                                                    */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
let __u=96000;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return{id,owner:p,controller:p,face,pos,uid:__u++};}
function reset0(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=3;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
}
function pickUid(uid){const p=pendingChoiceV49(gameState);if(!p)throw new Error('no pending choice');
  const c=p.candidates.find(x=>x.uid===uid);if(!c)throw new Error('uid not candidate');return answerChoiceV49([c.key]);}
function fire(spellCard,name){nativeEffectsV4(name)[0].operation(makeContext(0,spellCard,'sz',0,'activate',{}));}
/* レベル別の素材。coverage を動かさないよう GENERIC_OK / NOT_STARTED のカードだけを使う。 */
const MAT={3:'岩石の巨兵',4:'ヂェミナイ・エルフ',6:'冥界の魔王 ハ・デス',8:'青眼の白龍'};
/* 必要レベル need をちょうど満たす最小構成（過剰リリースにならない組み合わせ） */
function matPlan(need){
  if(need===3) return [3];
  if(need===4) return [4];
  if(need===6) return [3,3];
  if(need===7) return [4,3];
  if(need===8) return [4,4];
  throw new Error('no plan for '+need);
}

/* ---- 対象カード表（levelMode はカードテキストから個別に決めたもの） ---- */
const SPELLS=[
 ['カオス－黒魔術の儀式','マジシャン・オブ・ブラックカオス',8,'atLeast'],
 ['ジャベリンビートルの契約','ジャベリンビートル',8,'atLeast'],
 ['スカルライダーの復活','スカルライダー',6,'atLeast'],
 ['ゼラの儀式','ゼラ',8,'atLeast'],
 ['チャクラの復活','チャクラ',7,'atLeast'],
 ['ドリアードの祈り','精霊術師 ドリアード',3,'atLeast'],
 ['ライオンの儀式','スーパー・ウォー・ライオン',7,'atLeast'],
 ['ローの祈り','ローガーディアン',7,'atLeast'],
 ['合成魔術','ライカン・スロープ',6,'atLeast'],
 ['大邪神の儀式','大邪神 レシェフ',8,'atLeast'],
 ['奇跡の方舟','天界王 シナト',8,'atLeast'],
 ['悪魔鏡の儀式','デビルズ・ミラー',6,'atLeast'],
 ['灼熱の試練','伝説の爆炎使い',7,'atLeast'],
 ['白竜降臨','白竜の聖騎士',4,'atLeast'],
 ['要塞クジラの誓い','要塞クジラ',7,'atLeast'],
 ['覚醒の証','覚醒戦士 クーフーリン',4,'atLeast'],
 ['闇の支配者との契約','闇の支配者－ゾーク',8,'atLeast'],
 ['エンド・オブ・ザ・ワールド','終焉の王デミス',8,'exact'],
 ['リチュアの儀水鏡','イビリチュア・ソウルオーガ',8,'exact'],
];
SPELLS.forEach(row=>ok('Ritual registration '+row[0],!!CARD_SCRIPTS[row[0]]));

SPELLS.forEach(function(row){
  const spellName=row[0], monName=row[1], need=row[2], mode=row[3];
  const spec=ritualSpecV5(spellName);
  ok(spellName+': levelMode='+mode+' がメタデータに明示されている',!!spec&&spec.levelMode===mode);
  ok(spellName+': 正しい儀式モンスターを指定している',
     ritualAllowsMonsterV5(spec,CARD_DB[findCardIndex(monName)]));
  ok(spellName+': 必要レベル '+need+' が解決される',
     ritualRequiredLevelV5(spec,{id:findCardIndex(monName)})===need,
     'spec.level='+spec.level);

  /* positive: 手札素材だけで儀式召喚できる */
  reset0();
  const sp=mk(spellName),mon=mk(monName);
  const plan=matPlan(need);
  const mats=plan.map(function(lv){return mk(MAT[lv]);});
  gameState.players[0].sz=[sp];gameState.players[0].hand=[mon].concat(mats);
  v41ResetActionJournal(gameState);
  ok(spellName+': 手札素材で発動できる',API.ritualCanActivate(0,spellName)===true,
     'need='+need+' plan='+plan.join('+'));
  fire(sp,spellName);
  mats.forEach(function(m){ if(pendingChoiceV49(gameState)) pickUid(m.uid); });
  ok(spellName+': 儀式召喚に成功する',
     gameState.players[0].mz.length===1&&gameState.players[0].mz[0].uid===mon.uid,
     'mz='+gameState.players[0].mz.length);
  ok(spellName+': provenance が ritual',!!API.ritualProvenance(gameState.players[0].mz[0]));
  ok(spellName+': 素材が全て墓地へ送られる',gameState.players[0].grave.length===plan.length);
  const au=v44ReplayAuditPackage(v41ReplayPackage(gameState));
  ok(spellName+': Replay が digest 一致で再生される',au.ok,au.reason||au.finalDigest);

  /* positive: フィールド素材でも儀式召喚できる */
  reset0();
  const sp2=mk(spellName),mon2=mk(monName);
  const mats2=plan.map(function(lv){return mk(MAT[lv]);});
  gameState.players[0].sz=[sp2];gameState.players[0].hand=[mon2];
  gameState.players[0].mz=mats2.slice();
  v41ResetActionJournal(gameState);
  ok(spellName+': フィールド素材でも発動できる',API.ritualCanActivate(0,spellName)===true);
  fire(sp2,spellName);
  mats2.forEach(function(m){ if(pendingChoiceV49(gameState)) pickUid(m.uid); });
  ok(spellName+': フィールド素材で儀式召喚に成功する',
     gameState.players[0].mz.length===1&&gameState.players[0].mz[0].uid===mon2.uid);

  /* negative: 素材Lv不足（Lv3が1体だけ） */
  reset0();
  const sp3=mk(spellName),mon3=mk(monName);
  gameState.players[0].sz=[sp3];gameState.players[0].hand=[mon3,mk(MAT[3])];
  const lv3Enough=(mode==='atLeast'&&need<=3);
  ok(spellName+': 素材Lv不足では発動できない',
     API.ritualCanActivate(0,spellName)===lv3Enough,
     'need='+need+' mode='+mode);

  /* negative: 儀式モンスターが手札に無い */
  reset0();
  const sp4=mk(spellName);
  gameState.players[0].sz=[sp4];
  gameState.players[0].hand=plan.map(function(lv){return mk(MAT[lv]);});
  ok(spellName+': 儀式モンスターが無ければ発動できない',API.ritualCanActivate(0,spellName)===false);

  /* 過剰レベル単体: exact は need===8 のときだけ可、atLeast は常に可 */
  reset0();
  const sp5=mk(spellName),mon5=mk(monName);
  gameState.players[0].sz=[sp5];gameState.players[0].hand=[mon5,mk(MAT[8])];
  const expectBig=(mode==='exact')?(need===8):true;
  ok(spellName+': 過剰Lv単体(Lv8)の扱いが '+mode+' に従う',
     API.ritualCanActivate(0,spellName)===expectBig,
     'need='+need+' expect='+expectBig);
});

/* ---- 儀式魔法どうしの取り違えができないこと ---- */
reset0();
let wrongSpell=mk('ゼラの儀式'),wrongMon=mk('チャクラ');
gameState.players[0].sz=[wrongSpell];
gameState.players[0].hand=[wrongMon,mk(MAT[4]),mk(MAT[4])];
ok('取り違え禁止: ゼラの儀式でチャクラは降臨できない',API.ritualCanActivate(0,'ゼラの儀式')===false);
reset0();
wrongSpell=mk('チャクラの復活');wrongMon=mk('ゼラ');
gameState.players[0].sz=[wrongSpell];
gameState.players[0].hand=[wrongMon,mk(MAT[4]),mk(MAT[3])];
ok('取り違え禁止: チャクラの復活でゼラは降臨できない',API.ritualCanActivate(0,'チャクラの復活')===false);

/* ---- 儀式モンスター本体の効果 ---- */
reset0();
let eow=mk('エンド・オブ・ザ・ワールド'),demis=mk('終焉の王デミス');
gameState.players[0].sz=[eow];gameState.players[0].hand=[demis,mk(MAT[4]),mk(MAT[4])];
let foeMon=mk('岩石の巨兵',1),foeSt=mk('サイクロン',1,'down');
gameState.players[1].mz=[foeMon];gameState.players[1].sz=[foeSt];
v41ResetActionJournal(gameState);
fire(eow,'エンド・オブ・ザ・ワールド');
while(pendingChoiceV49(gameState)) pickUid(pendingChoiceV49(gameState).candidates[0].uid);
ok('終焉の王デミス: 儀式召喚できる',gameState.players[0].mz.length===1);
let dEff=nativeEffectsV4('終焉の王デミス')[0];
let dCtx=makeContext(0,gameState.players[0].mz[0],'mz',0,'activate',{});
ok('終焉の王デミス: LPが2000超なら発動できる',dEff.condition(dCtx)===true);
let lpBefore=gameState.players[0].lp;
let paid=false;dEff.cost(dCtx,function(v){paid=v;});
ok('終焉の王デミス: 2000LPを払う',paid&&gameState.players[0].lp===lpBefore-2000);
dEff.operation(dCtx);
ok('終焉の王デミス: 自分以外のカードを全て破壊する',
   gameState.players[1].mz.length===0&&gameState.players[1].sz.length===0&&
   gameState.players[0].mz.length===1&&gameState.players[0].mz[0].uid===demis.uid,
   'foeMz='+gameState.players[1].mz.length+' selfMz='+gameState.players[0].mz.length);
reset0();
demis=mk('終焉の王デミス');gameState.players[0].mz=[demis];gameState.players[0].lp=1500;
ok('終焉の王デミス negative: LPが足りなければ発動できない',
   nativeEffectsV4('終焉の王デミス')[0].condition(makeContext(0,demis,'mz',0,'activate',{}))===false);

reset0();
let pact=mk('闇の支配者との契約'),zork=mk('闇の支配者－ゾーク');
gameState.players[0].sz=[pact];gameState.players[0].hand=[zork,mk(MAT[4]),mk(MAT[4])];
gameState.players[1].mz=[mk('岩石の巨兵',1),mk('岩石の巨兵',1)];
v41ResetActionJournal(gameState);
fire(pact,'闇の支配者との契約');
while(pendingChoiceV49(gameState)) pickUid(pendingChoiceV49(gameState).candidates[0].uid);
ok('闇の支配者－ゾーク: 儀式召喚できる',
   gameState.players[0].mz.length===1&&gameState.players[0].mz[0].uid===zork.uid);
let zEff=nativeEffectsV4('闇の支配者－ゾーク')[0];
let foeBefore=gameState.players[1].mz.length, selfBefore=gameState.players[0].mz.length;
zEff.operation(makeContext(0,gameState.players[0].mz[0],'mz',0,'activate',{}));
/* S03-U62: a roll of 3-5 now opens a real (SaveLoad-safe) API.requestChoice instead of resolving
   synchronously via the old legacy API.selectCard. */
while(pendingChoiceV49(gameState)) __choicePickV49(0);
let foeAfter=gameState.players[1].mz.length, selfAfter=gameState.players[0].mz.length;
ok('闇の支配者－ゾーク: サイコロの目に応じて破壊が起きる',
   (foeAfter===0&&selfAfter===selfBefore) ||
   (foeAfter===foeBefore-1&&selfAfter===selfBefore) ||
   (selfAfter===0&&foeAfter===foeBefore),
   'foe '+foeBefore+'->'+foeAfter+'  self '+selfBefore+'->'+selfAfter);
ok('闇の支配者－ゾーク: RNGは決定的（同じ状態なら同じ目）',
   (function(){var s=JSON.stringify(gameState);var a=duelRandomInt(6);
               gameState=JSON.parse(s);var b=duelRandomInt(6);return a===b;})());

reset0();
let mirror=mk('リチュアの儀水鏡'),ogre=mk('イビリチュア・ソウルオーガ');
gameState.players[0].sz=[mirror];gameState.players[0].hand=[ogre,mk(MAT[4]),mk(MAT[4])];
v41ResetActionJournal(gameState);
ok('イビリチュア・ソウルオーガ: リチュアの儀水鏡で降臨できる',
   API.ritualCanActivate(0,'リチュアの儀水鏡')===true);
fire(mirror,'リチュアの儀水鏡');
while(pendingChoiceV49(gameState)) pickUid(pendingChoiceV49(gameState).candidates[0].uid);
ok('イビリチュア・ソウルオーガ: 儀式召喚に成功する',
   gameState.players[0].mz.length===1&&gameState.players[0].mz[0].uid===ogre.uid,
   'mz='+gameState.players[0].mz.length);
let oEff=nativeEffectsV4('イビリチュア・ソウルオーガ')[0];
let ogreOnField=gameState.players[0].mz[0];
let gishkiHand=mk('イビリチュア・ソウルオーガ');
gameState.players[0].hand=[gishkiHand];
let foeCard=mk('岩石の巨兵',1);gameState.players[1].mz=[foeCard];
let oCtx=makeContext(0,ogreOnField,'mz',0,'activate',{});
ok('イビリチュア・ソウルオーガ: 手札にリチュアがあれば発動できる',oEff.condition(oCtx)===true);
paid=false;oEff.cost(oCtx,function(v){paid=v;});
ok('イビリチュア・ソウルオーガ: コストでリチュアを捨てる',
   paid&&gameState.players[0].grave.some(function(x){return x.uid===gishkiHand.uid;}));
oEff.target(oCtx,function(t){oCtx.selectedTargets=t;});
oEff.operation(oCtx);
ok('イビリチュア・ソウルオーガ: 相手のカードをデッキに戻す',
   gameState.players[1].mz.length===0&&gameState.players[1].deck.some(function(x){return x.uid===foeCard.uid;}),
   'foeMz='+gameState.players[1].mz.length+' deck='+gameState.players[1].deck.length);
reset0();
ogre=mk('イビリチュア・ソウルオーガ');gameState.players[0].mz=[ogre];
gameState.players[0].hand=[mk(MAT[4])];gameState.players[1].mz=[mk('岩石の巨兵',1)];
ok('イビリチュア・ソウルオーガ negative: 手札にリチュアが無ければ発動できない',
   nativeEffectsV4('イビリチュア・ソウルオーガ')[0].condition(makeContext(0,ogre,'mz',0,'activate',{}))===false);

ok('Ritual cards: 盤面はJSON直列化できる',!!JSON.stringify(gameState));
globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}

