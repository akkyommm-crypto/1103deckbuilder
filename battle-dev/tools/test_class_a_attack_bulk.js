/* Class A bulk 攻撃対象トリガー4枚＋2回攻撃付与1枚 — positive / negative / ruling edge。 */
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
function reset0(){gameState=newGame();gameState.activePlayer=1;gameState.firstPlayer=0;
  gameState.phase='battle';gameState.turn=9;PLAY_MODE=PLAY_MODES.DUEL;
  HISTORY.length=0;REDO.length=0;turnActions=[];resetChoiceStatsV49();
  v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
  gameState.fieldSnapV9=fieldSnapshotV9(gameState);}
function h(c){return locateCardAnyV4(c);}
function effOf(n,k){const e=nativeEffectsV4(n).find(x=>!k||x.key===k);if(!e)throw Error('effect '+n+' '+k);return e;}
function ctxA(p,card,evname,evt){const loc=h(card);
  const c=makeContext(p,card,(loc&&loc.zone)||'mz',(loc&&loc.index)||0,evname,{event:evt});
  if(evt)c.event=evt;return c;}
/* 攻撃宣言中の状態を作る（attacker は相手、target は自分のカード） */
function declare(attacker,target){
  gameState.pendingAttack={player:1,attackerUid:attacker.uid,targetUid:target?target.uid:null};
}
/* 実戦と同じ2段（宣言→戦闘）で攻撃する。宣言側が attackCount を増やす。 */
function realAttack(p,mzIndex,target){
  act({type:'ATTACK_DECLARE_V48',player:p,mzIndex:mzIndex});
  act({type:'ATTACK',player:p,atkIdx:mzIndex,target:target});
}
const FOE='青眼の白龍';        /* GENERIC_OK */
const HERO='E・HERO スパークマン'; /* GENERIC_OK・ELEMENTAL_HERO */
const NOTHERO='ヂェミナイ・エルフ'; /* GENERIC_OK・E・HERO ではない */
const KARA='カラクリ蜘蛛';   /* S03-U243: カラクリ忍者 参参九 got its own script (mustAttack), so the filler is カラクリ蜘蛛 — a KARAKURI monster without a must-attack rule */   /* NOT_STARTED・KARAKURI — was カラクリ守衛 参壱参 until S03-U71
  declared it for real (continuous.mustAttack:true, among other clauses); this fixture specifically needs a
  KARAKURI-archetype monster with NO script of its own, so mustAttackNow(kk) stays a genuine negative check. */
const PLAIN='ワイト';           /* GENERIC_OK */

const NAMES=['暗黒ステゴ','悪シノビ','マッド・デーモン','カラクリ武者 六参壱八','ヒーローハート','ミョルニルの魔槌'];
NAMES.forEach(n=>ok('ClassA-attack registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: E・HERO スパークマンは ELEMENTAL_HERO',
   isSetCardV4(dbOf({id:findCardIndex(HERO)}),SETCODE.ELEMENTAL_HERO)===true);
ok('前提: カラクリ守衛 参壱参は KARAKURI',
   isSetCardV4(dbOf({id:findCardIndex(KARA)}),SETCODE.KARAKURI)===true);

/* ---- 攻撃対象→守備表示の3枚 ---- */
for(const NAME of ['暗黒ステゴ','マッド・デーモン','カラクリ武者 六参壱八']){
  reset0();
  const me=mk(NAME,0),foe=mk(FOE,1),other=mk(PLAIN,0);
  gameState.players[0].mz=[me,other];gameState.players[1].mz=[foe];
  const e=effOf(NAME,'attack-target-to-defense');
  declare(foe,me);
  ok(NAME+' positive: 自身が攻撃対象に選択されたら条件成立',e.condition(ctxA(0,me,'onAttackDeclare'))===true);
  e.operation(ctxA(0,me,'onAttackDeclare'));
  ok(NAME+' positive: 守備表示になる',me.pos==='def',me.pos);
  declare(foe,other);
  ok(NAME+' negative: 別のモンスターが攻撃対象なら誘発しない',
     e.condition(ctxA(0,me,'onAttackDeclare'))===false);
  gameState.pendingAttack=null;
  ok(NAME+' negative: 攻撃宣言が無ければ誘発しない',
     e.condition(ctxA(0,me,'onAttackDeclare'))===false);
  /* 守備表示・裏側では誘発しない */
  reset0();
  const m2=mk(NAME,0,'up','def'),f2=mk(FOE,1);
  gameState.players[0].mz=[m2];gameState.players[1].mz=[f2];
  declare(f2,m2);
  ok(NAME+' negative: 既に守備表示なら誘発しない',
     effOf(NAME,'attack-target-to-defense').condition(ctxA(0,m2,'onAttackDeclare'))===false);
  reset0();
  const m3=mk(NAME,0,'down','def'),f3=mk(FOE,1);
  gameState.players[0].mz=[m3];gameState.players[1].mz=[f3];
  declare(f3,m3);
  ok(NAME+' negative: 裏側表示なら誘発しない',
     effOf(NAME,'attack-target-to-defense').condition(ctxA(0,m3,'onAttackDeclare'))===false);
}
/* マッド・デーモン は貫通も持つ */
reset0();
let md=mk('マッド・デーモン',0),dfd=mk(PLAIN,1,'up','def');
gameState.players[0].mz=[md];gameState.players[1].mz=[dfd];
let mdp=CARD_SCRIPTS['マッド・デーモン'].continuous.piercingDamage;
ok('マッド・デーモン positive: 守備表示相手に貫通する',
   mdp({self:md,srcPlayer:0,atkCard:md,defCard:dfd})===Math.max(0,curATK(md)-curDEF(dfd)));
ok('マッド・デーモン negative: 攻撃表示相手には貫通しない',(()=>{
   dfd.pos='atk';const r=mdp({self:md,srcPlayer:0,atkCard:md,defCard:dfd});dfd.pos='def';return r===0;})());

/* ---- 悪シノビ ---- */
reset0();
let ns=mk('悪シノビ',0),nf=mk(FOE,1);
gameState.players[0].mz=[ns];gameState.players[1].mz=[nf];
gameState.players[0].deck=[mk(PLAIN,0),mk(PLAIN,0)];
let ne=effOf('悪シノビ');
declare(nf,ns);
ok('悪シノビ positive: 攻撃対象に選択されたら条件成立',ne.condition(ctxA(0,ns,'onAttackDeclare'))===true);
let hb=gameState.players[0].hand.length;
ne.operation(ctxA(0,ns,'onAttackDeclare'));
ok('悪シノビ positive: デッキから1枚ドローする',gameState.players[0].hand.length===hb+1);
ok('悪シノビ ruling: 表示形式は変わらない',ns.pos==='atk');
gameState.players[0].deck=[];
ok('悪シノビ negative: デッキが0枚なら発動しない',ne.condition(ctxA(0,ns,'onAttackDeclare'))===false);

/* ---- カラクリ武者 六参壱八 固有 ---- */
reset0();
let kb=mk('カラクリ武者 六参壱八',0),kk=mk(KARA,0),kf=mk(FOE,1);
gameState.players[0].mz=[kb,kk];gameState.players[1].mz=[kf];
ok('カラクリ武者 六参壱八 positive: 攻撃可能なら攻撃しなければならない',
   mustAttackNow(kb)===true);
ok('カラクリ武者 六参壱八 negative: 他のモンスターに攻撃強制は掛からない',
   mustAttackNow(kk)===false);
let ke=effOf('カラクリ武者 六参壱八','karakuri-destroyed-atk-up');
let baseAtk=curATK(kb);
ok('カラクリ武者 六参壱八 positive: 「カラクリ」破壊で条件成立',
   ke.condition(ctxA(0,kb,'onDestroy',{player:0,card:kk,reason:'effect'}))===true);
ke.operation(ctxA(0,kb,'onDestroy',{player:0,card:kk,reason:'effect'}));
ok('カラクリ武者 六参壱八 positive: 攻撃力が400アップする',
   curATK(kb)===baseAtk+400,baseAtk+'→'+curATK(kb));
ke.operation(ctxA(0,kb,'onDestroy',{player:0,card:kk,reason:'effect'}));
ok('カラクリ武者 六参壱八 ruling: 累積して上がる',curATK(kb)===baseAtk+800,String(curATK(kb)));
ok('カラクリ武者 六参壱八 ruling: ターンをまたいでも戻らない（permanent）',(()=>{
   clearExpiredMods(gameState,'endTurn');return curATK(kb)===baseAtk+800;})());
ok('カラクリ武者 六参壱八 negative: 「カラクリ」以外の破壊では上がらない',
   ke.condition(ctxA(0,kb,'onDestroy',{player:0,card:mk(PLAIN,0),reason:'effect'}))===false);
ok('カラクリ武者 六参壱八 ruling: 相手フィールドの「カラクリ」破壊でも上がる',
   ke.condition(ctxA(0,kb,'onDestroy',{player:1,card:mk(KARA,1),reason:'effect'}))===true);
ok('カラクリ武者 六参壱八 negative: 自身が場を離れていれば誘発しない',(()=>{
   const saved=gameState.players[0].mz;gameState.players[0].mz=[kk];
   const r=ke.condition(ctxA(0,kb,'onDestroy',{player:0,card:kk,reason:'effect'}));
   gameState.players[0].mz=saved;return r===false;})());

/* ---- ヒーローハート ---- */
reset0();
gameState.activePlayer=0;
let hh=mk('ヒーローハート',0,'down'),hero=mk(HERO,0),nonhero=mk(NOTHERO,0);
gameState.players[0].sz=[hh];gameState.players[0].mz=[hero,nonhero];
let he=effOf('ヒーローハート');
ok('ヒーローハート positive: 「E・HERO」がいれば発動できる',
   he.condition(ctxA(0,hh,'activate'))===true);
ok('ヒーローハート positive: 候補は「E・HERO」だけ',(()=>{
   const p=API.fieldCards({player:0,zone:'mz',filter:x=>x.card.face==='up'&&isSetCardV4(x.db,SETCODE.ELEMENTAL_HERO)});
   return p.length===1&&dbOf(p[0].card).n===HERO;})());
let hbase=curATK(hero);
let hc=ctxA(0,hh,'activate');
if(he.target) he.target(hc,r=>{hc.selectedTargets=r;});
he.operation(hc);
ok('ヒーローハート positive: 攻撃力が半分になる',
   curATK(hero)===Math.floor(hbase/2),hbase+'→'+curATK(hero));
ok('ヒーローハート positive: このターンの攻撃可能回数が2回になる',
   hero.attackLimit===2&&hero.attackLimitTurn===gameState.turn,
   'attackLimit='+hero.attackLimit);
ok('ヒーローハート ruling: 攻撃力の半減はこのターンだけ',(()=>{
   clearExpiredMods(gameState,'endTurn');return curATK(hero)===hbase;})());
ok('ヒーローハート negative: 「E・HERO」がいなければ発動できない',(()=>{
   reset0();gameState.activePlayer=0;
   const h2=mk('ヒーローハート',0,'down');gameState.players[0].sz=[h2];
   gameState.players[0].mz=[mk(NOTHERO,0)];
   return effOf('ヒーローハート').condition(ctxA(0,h2,'activate'))===false;})());
ok('ヒーローハート negative: 相手の「E・HERO」は選べない',(()=>{
   reset0();gameState.activePlayer=0;
   const h3=mk('ヒーローハート',0,'down');gameState.players[0].sz=[h3];
   gameState.players[1].mz=[mk(HERO,1)];
   return effOf('ヒーローハート').condition(ctxA(0,h3,'activate'))===false;})());
ok('ヒーローハート negative: 裏側の「E・HERO」は選べない',(()=>{
   reset0();gameState.activePlayer=0;
   const h4=mk('ヒーローハート',0,'down');gameState.players[0].sz=[h4];
   gameState.players[0].mz=[mk(HERO,0,'down','def')];
   return effOf('ヒーローハート').condition(ctxA(0,h4,'activate'))===false;})());

/* ---- ミョルニルの魔槌（AESIR authority）---- */
const AESIR1='極神皇トール';        /* NOT_STARTED・AESIR */
/* S03-U230: 極星將テュール now has its script (it destroys itself without another face-up 「極星」), so the plain 「極星」 filler is 極星獣ガルム. */
const NORDIC1='極星獣ガルム';        /* NORDIC だが極神ではない（「極星」フィラー） */
reset0();
gameState.activePlayer=0;
let mj=mk('ミョルニルの魔槌',0,'down'),thor=mk(AESIR1,0),garm=mk(NORDIC1,0);
gameState.players[0].sz=[mj];gameState.players[0].mz=[thor,garm];
let mje=effOf('ミョルニルの魔槌');
ok('ミョルニルの魔槌 positive: 「極神」がいれば発動できる',
   mje.condition(ctxA(0,mj,'activate'))===true);
ok('ミョルニルの魔槌 positive: 候補は「極神」だけ（極星は入らない）',(()=>{
   const pool=API.fieldCards({player:0,zone:'mz',filter:x=>x.card.face==='up'&&isCardInGroupV4(x.db,GROUP.AESIR)});
   return pool.length===1&&dbOf(pool[0].card).n===AESIR1;})());
let mc=ctxA(0,mj,'activate');
if(mje.target) mje.target(mc,r=>{mc.selectedTargets=r;});
mje.operation(mc);
ok('ミョルニルの魔槌 positive: このターンの攻撃可能回数が2回になる',
   thor.attackLimit===2&&thor.attackLimitTurn===gameState.turn,'attackLimit='+thor.attackLimit);
/* 本物の ATTACK を1回通してから、まだ攻撃できることを確認する */
let foeA=mk(PLAIN,1),foeB=mk(PLAIN,1);gameState.players[1].mz=[foeA,foeB];
ok('ミョルニルの魔槌 ruling: 1回攻撃する前は当然攻撃できる',canDeclareAttackV48(thor)===true);
realAttack(0,0,0);
ok('ミョルニルの魔槌 positive: 実際に1回攻撃した後も attackCount=1',
   Number(thor.attackCount)===1,'attackCount='+thor.attackCount);
ok('ミョルニルの魔槌 positive: 1回攻撃した後でも2回目を宣言できる',
   canDeclareAttackV48(thor)===true);
realAttack(0,0,0);
ok('ミョルニルの魔槌 ruling: 2回攻撃した後は3回目を宣言できない',
   Number(thor.attackCount)===2&&canDeclareAttackV48(thor)===false,
   'attackCount='+thor.attackCount);
ok('ミョルニルの魔槌 negative: 効果を受けていない極星は2回攻撃できない',(()=>{
   const g=locateCardAnyV4(garm);
   if(!g) return false;
   realAttack(0,g.index,0);
   return canDeclareAttackV48(garm)===false;})());
ok('ミョルニルの魔槌 negative: 「極神」がいなければ発動できない',(()=>{
   reset0();gameState.activePlayer=0;
   const m2=mk('ミョルニルの魔槌',0,'down');gameState.players[0].sz=[m2];
   gameState.players[0].mz=[mk(NORDIC1,0)];
   return effOf('ミョルニルの魔槌').condition(ctxA(0,m2,'activate'))===false;})());
ok('ミョルニルの魔槌 negative: 相手の「極神」は選べない',(()=>{
   reset0();gameState.activePlayer=0;
   const m3=mk('ミョルニルの魔槌',0,'down');gameState.players[0].sz=[m3];
   gameState.players[1].mz=[mk(AESIR1,0+1)];
   return effOf('ミョルニルの魔槌').condition(ctxA(0,m3,'activate'))===false;})());
ok('ミョルニルの魔槌 negative: 裏側の「極神」は選べない',(()=>{
   reset0();gameState.activePlayer=0;
   const m4=mk('ミョルニルの魔槌',0,'down');gameState.players[0].sz=[m4];
   gameState.players[0].mz=[mk(AESIR1,0,'down','def')];
   return effOf('ミョルニルの魔槌').condition(ctxA(0,m4,'activate'))===false;})());
ok('ミョルニルの魔槌 ruling: 極神聖帝オーディン（setcodeなし）も対象になる',(()=>{
   reset0();gameState.activePlayer=0;
   const m5=mk('ミョルニルの魔槌',0,'down');gameState.players[0].sz=[m5];
   const odin=mk('極神聖帝オーディン',0);gameState.players[0].mz=[odin];
   return effOf('ミョルニルの魔槌').condition(ctxA(0,m5,'activate'))===true
     && dbOf(odin).setcode==null;})());

/* ---- ヒーローハート: 実戦でも2回攻撃できる ---- */
reset0();
gameState.activePlayer=0;
let hh2=mk('ヒーローハート',0,'down'),hero2=mk(HERO,0);
gameState.players[0].sz=[hh2];gameState.players[0].mz=[hero2];
gameState.players[1].mz=[mk(PLAIN,1)];
let he2=effOf('ヒーローハート'),hc2=ctxA(0,hh2,'activate');
if(he2.target) he2.target(hc2,r=>{hc2.selectedTargets=r;});
he2.operation(hc2);
realAttack(0,0,0);
ok('ヒーローハート positive: 実戦で1回攻撃した後も2回目を宣言できる',
   Number(hero2.attackCount)===1&&canDeclareAttackV48(hero2)===true,
   'attackCount='+hero2.attackCount+' limit='+hero2.attackLimit);
realAttack(0,0,0);
ok('ヒーローハート ruling: 3回目は宣言できない',
   Number(hero2.attackCount)===2&&canDeclareAttackV48(hero2)===false,
   'attackCount='+hero2.attackCount);

/* ================= Replay / SaveLoad / 直列化 ================= */
reset0();
let za=mk('暗黒ステゴ',0),zf=mk(FOE,1);
gameState.players[0].mz=[za];gameState.players[1].mz=[zf];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
declare(zf,za);
v41ResetActionJournal(gameState);
effOf('暗黒ステゴ','attack-target-to-defense').operation(ctxA(0,za,'onAttackDeclare'));
if(typeof flushDeferredEventsV2==='function') flushDeferredEventsV2();
ok('ClassA-attack positive: Replay検証用の表示形式変更が成立',za.pos==='def');
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('ClassA-attack Replay: 表示形式変更が digest 一致で再生される',audit.ok,audit.reason||'');
let snap=JSON.stringify(gameState);
ok('ClassA-attack SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('ClassA-attack 直列化: mustAttack は gameState に漏れていない',snap.indexOf('mustAttack')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
