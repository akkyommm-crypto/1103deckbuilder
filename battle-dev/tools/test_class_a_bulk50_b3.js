/* Class A bulk 50 — batch 3 / 継続ステータス・誘発バーン7枚。positive / negative / ruling edge。 */
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
function effOf(n,k){const e=nativeEffectsV4(n).find(x=>!k||x.key===k);if(!e)throw Error('effect '+n+' '+k);return e;}
function ctxF(p,card,evname,evt){const loc=h(card);
  const c=makeContext(p,card,(loc&&loc.zone)||'mz',(loc&&loc.index)||0,evname||'onFlip',{event:evt});
  if(evt)c.event=evt;return c;}
function run(e,c){if(e.target)e.target(c,r=>{c.selectedTargets=r;}); e.operation(c);}
function pending(){return pendingChoiceV49(gameState);}
function answerAll(){const pc=pending();if(!pc)throw Error('no pending');return answerChoiceV49(pc.candidates.map(x=>x.key));}
function answerN(n){const pc=pending();if(!pc)throw Error('no pending');return answerChoiceV49(pc.candidates.slice(0,n).map(x=>x.key));}
function answerNamed(nm){const pc=pending();if(!pc)throw Error('no pending');
  const hit=pc.candidates.find(x=>{const f=x&&x.uid!=null?findCardByUid(x.uid):null;return f&&dbOf(f.card).n===nm;});
  return answerChoiceV49([(hit||pc.candidates[0]).key]);}
function inHand(p,c){return (gameState.players[p].hand||[]).some(x=>x&&x.uid===c.uid);}
function inMz(p,c){return (gameState.players[p].mz||[]).some(x=>x&&x.uid===c.uid);}
function pickFirst(){API.selectCard=(t,list,cb)=>cb(list[0]);}
function pickNamed(nm){API.selectCard=(t,list,cb)=>{const hit=list.find(x=>x&&x.card&&dbOf(x.card).n===nm);cb(hit||list[0]);};}

/* 小道具は TESTED / GENERIC_OK / NOT_STARTED のみ */
const PLAIN='ワイト';           /* GENERIC_OK lv3 */
const BIG='青眼の白龍';          /* GENERIC_OK */
const WARRIOR='ゾンビタイガー';    /* NOT_STARTED・アンデット */
const WAR2='E・HERO クレイマン';  /* GENERIC_OK・戦士 */
const TRAP='落とし穴';           /* 罠 */
const SPELL='サイクロン';         /* 魔法 */
const FIELD='王家の眠る谷－ネクロバレー'; /* TESTED・フィールド魔法 */
const FIELD2='闇';              /* フィールド魔法（別） */
const EFFMON='キラー・トマト';     /* TESTED・効果モンスター */
const NORMMON='ヂェミナイ・エルフ'; /* GENERIC_OK・通常モンスター */

const NAMES=['派手ハネ','尾も白い黒猫','水晶の占い師','聖なる守り手','幸運を告げるフクロウ',
 'カードを狩る死神','トラップ・マスター','爆弾かめ虫','雷仙人','ワーム・リンクス'];
NAMES.forEach(n=>ok('bulk50-b1 registration '+n,!!CARD_SCRIPTS[n]));
ok('前提: 落とし穴は罠',dbOf({id:findCardIndex(TRAP)}).k==='t');
ok('前提: サイクロンは魔法',dbOf({id:findCardIndex(SPELL)}).k==='s');
ok('前提: ネクロバレーはフィールド魔法',dbOf({id:findCardIndex(FIELD)}).sub==='フィールド');
ok('前提: キラー・トマトは効果モンスター',(dbOf({id:findCardIndex(EFFMON)}).st||[]).includes('効果'));
ok('前提: ヂェミナイ・エルフは通常モンスター',(dbOf({id:findCardIndex(NORMMON)}).st||[]).includes('通常'));
function ctxE(p,card,evname,evt,zone){const loc=h(card);
  const c=makeContext(p,card,zone||(loc&&loc.zone)||'mz',(loc&&loc.index)||0,evname,{event:evt});
  if(evt)c.event=evt;return c;}
const BIRD='ハーピィ・レディ';      /* 鳥獣 */
const BEAST2='グレート・アンガス';   /* GENERIC_OK・獣 */
const MACHINE='X－ヘッド・キャノン'; /* GENERIC_OK・機械 */
const BATT='電池メン－単二型';
const NSPELL='強欲な壺';           /* TESTED・通常魔法 */

const NAMES3=['火炎鳥','本気ギレパンダ','パワー・サプライヤー','電池メン－単二型',
 '女邪神ヌヴィア','エレメントの泉','連弾の魔術師'];
NAMES3.forEach(n=>ok('bulk50-b3 registration '+n,!!CARD_SCRIPTS[n]));
/* 幻獣クロスウィングは System v29（墓地continuousソース）で解禁され、
   engine repair batch で実装済み。残り3枚は未実装のまま。 */
/* 4枚とも engine repair batch（E1調査 / v28 onLPChange / v29 墓地continuous）で解禁され、
   実装・テスト済み。当時 ENGINE_GAP だった記録として残す。 */
['首領亀','ビッグバンガール','油断大敵','幻獣クロスウィング'].forEach(n=>
  ok('bulk50-b3: '+n+' は engine repair batch で解禁され登録済み',!!CARD_SCRIPTS[n]));
ok('前提: ハーピィ・レディは鳥獣族',dbOf({id:findCardIndex(BIRD)}).ra==='鳥獣');
ok('前提: グレート・アンガスは獣族',dbOf({id:findCardIndex(BEAST2)}).ra==='獣');
ok('前提: X－ヘッド・キャノンは機械族',dbOf({id:findCardIndex(MACHINE)}).ra==='機械');
ok('前提: 強欲な壺は通常魔法（v12 sub は normal）',
   dbOf({id:findCardIndex(NSPELL)}).sub===''&&activationSubKindV12(dbOf({id:findCardIndex(NSPELL)}))==='normal');

/* ===== 火炎鳥 ===== */
reset0();
let fb=mk('火炎鳥',0),bird=mk(BIRD,0),foeBird=mk(BIRD,1);
gameState.players[0].mz=[fb,bird];gameState.players[1].mz=[foeBird];
let fbe=effOf('火炎鳥');
let base=curATK(fb);
ok('火炎鳥 positive: 自分の鳥獣族の破壊で条件成立',
   fbe.condition(ctxE(0,fb,'onDestroy',{player:0,card:bird}))===true);
fbe.operation(ctxE(0,fb,'onDestroy',{player:0,card:bird}));
ok('火炎鳥 positive: 攻撃力が500アップする',curATK(fb)===base+500,base+'→'+curATK(fb));
fbe.operation(ctxE(0,fb,'onDestroy',{player:0,card:bird}));
ok('火炎鳥 ruling: 累積する',curATK(fb)===base+1000);
ok('火炎鳥 ruling: ターンをまたいでも戻らない',(()=>{
   clearExpiredMods(gameState,'endTurn'); return curATK(fb)===base+1000;})());
ok('火炎鳥 negative: 相手の鳥獣族の破壊では上がらない',
   fbe.condition(ctxE(0,fb,'onDestroy',{player:1,card:foeBird}))===false);
ok('火炎鳥 negative: 鳥獣族以外の破壊では上がらない',
   fbe.condition(ctxE(0,fb,'onDestroy',{player:0,card:mk(BEAST2,0)}))===false);
ok('火炎鳥 negative: 自身が裏側なら誘発しない',(()=>{
   fb.face='down';const r=fbe.condition(ctxE(0,fb,'onDestroy',{player:0,card:bird}));fb.face='up';return r===false;})());

/* ===== 本気ギレパンダ ===== */
reset0();
let gp=mk('本気ギレパンダ',0),ownB=mk(BEAST2,0),foeB=mk(BEAST2,1);
gameState.players[0].mz=[gp,ownB];gameState.players[1].mz=[foeB];
let gpe=effOf('本気ギレパンダ');
let gbase=curATK(gp);
ok('本気ギレパンダ positive: 自分の獣族の破壊で条件成立',
   gpe.condition(ctxE(0,gp,'onDestroy',{player:0,card:ownB}))===true);
ok('本気ギレパンダ ruling: 相手の獣族の破壊でも条件成立（フィールド上の獣族）',
   gpe.condition(ctxE(0,gp,'onDestroy',{player:1,card:foeB}))===true);
gpe.operation(ctxE(0,gp,'onDestroy',{player:1,card:foeB}));
ok('本気ギレパンダ positive: 攻撃力が500アップする',curATK(gp)===gbase+500);
ok('本気ギレパンダ negative: 獣族以外の破壊では上がらない',
   gpe.condition(ctxE(0,gp,'onDestroy',{player:0,card:mk(BIRD,0)}))===false);
ok('本気ギレパンダ negative: 魔法・罠の破壊では上がらない',
   gpe.condition(ctxE(0,gp,'onDestroy',{player:0,card:mk(NSPELL,0)}))===false);

/* ===== パワー・サプライヤー ===== */
reset0();
let ps=mk('パワー・サプライヤー',0),tgt=mk(BIG,0),oth=mk(PLAIN,0);
gameState.players[0].mz=[ps,tgt,oth];
let pse=effOf('パワー・サプライヤー');
let tbase=curATK(tgt), obase=curATK(oth);
ok('パワー・サプライヤー positive: 自分の表側モンスターがいれば発動できる',
   pse.condition(ctxF(0,ps,'activate'))===true);
pickNamed(BIG);run(pse,ctxF(0,ps,'activate'));
ok('パワー・サプライヤー positive: 選んだモンスターの攻撃力が400アップ',
   curATK(tgt)===tbase+400,tbase+'→'+curATK(tgt));
ok('パワー・サプライヤー negative: 他のモンスターは上がらない',curATK(oth)===obase);
ok('パワー・サプライヤー ruling: 1ターンに1度',
   pse.condition(ctxF(0,ps,'activate'))===false,ctxF(0,ps,'activate').reason||'');
ok('パワー・サプライヤー ruling: 自身が裏側になると修整が消える',(()=>{
   ps.face='down';const a=curATK(tgt);ps.face='up';return a===tbase;})());
ok('パワー・サプライヤー ruling: 自身が場を離れると修整が消える',(()=>{
   API.destroy(h(ps),'テスト');return curATK(tgt)===tbase;})());
ok('パワー・サプライヤー negative: 自分の表側モンスターがいなければ発動できない',(()=>{
   reset0();const p2=mk('パワー・サプライヤー',0,'down','def');gameState.players[0].mz=[p2];
   return effOf('パワー・サプライヤー').condition(ctxF(0,p2,'activate'))===false;})());

/* ===== 電池メン－単二型 ===== */
reset0();
let ba=mk(BATT,0),bb=mk(BATT,0),mach=mk(MACHINE,0),nonM=mk(PLAIN,0);
gameState.players[0].mz=[ba,bb,mach,nonM];
let mbase=curATK(mach), mdbase=curDEF(mach), nbase=curATK(nonM);
ba.pos='atk';bb.pos='atk';
ok('電池メン－単二型 positive: 全て攻撃表示なら機械族の攻撃力が体数×500アップ',
   curATK(mach)===dbOf(mach).atk+1000,'atk='+curATK(mach));
ok('電池メン－単二型 negative: 機械族以外は上がらない',curATK(nonM)===dbOf(nonM).atk);
ok('電池メン－単二型 positive: 全て守備表示なら守備力が体数×500アップ',(()=>{
   ba.pos='def';bb.pos='def';
   return curDEF(mach)===dbOf(mach).def+1000&&curATK(mach)===dbOf(mach).atk;})(),
   'def='+curDEF(mach));
ok('電池メン－単二型 negative: 攻守が混在していれば何も起きない',(()=>{
   ba.pos='atk';bb.pos='def';
   return curATK(mach)===dbOf(mach).atk&&curDEF(mach)===dbOf(mach).def;})());
ok('電池メン－単二型 negative: 相手の機械族には効かない',(()=>{
   ba.pos='atk';bb.pos='atk';
   const fm=mk(MACHINE,1);gameState.players[1].mz=[fm];
   return curATK(fm)===dbOf(fm).atk;})());
ok('電池メン－単二型 ruling: 1体だけなら500アップ',(()=>{
   reset0();const s=mk(BATT,0),m2=mk(MACHINE,0);gameState.players[0].mz=[s,m2];
   return curATK(m2)===dbOf(m2).atk+500;})());

/* ===== 女邪神ヌヴィア ===== */
reset0();
let nv=mk('女邪神ヌヴィア',0);gameState.players[0].mz=[nv];
ok('女邪神ヌヴィア negative: 相手にモンスターがいなければ攻撃力は下がらない',
   curATK(nv)===dbOf(nv).atk,'atk='+curATK(nv));
gameState.players[1].mz=[mk(PLAIN,1),mk(PLAIN,1)];
ok('女邪神ヌヴィア positive: 相手モンスター1体につき攻撃力200ダウン',
   curATK(nv)===dbOf(nv).atk-400,'atk='+curATK(nv));
let nve=effOf('女邪神ヌヴィア','destroy-self-on-summon');
ok('女邪神ヌヴィア positive: 召喚された場合に自壊の条件成立',
   nve.condition(ctxE(0,nv,'onNormalSummon',{player:0,card:nv}))===true);
nve.operation(ctxE(0,nv,'onNormalSummon',{player:0,card:nv}));
ok('女邪神ヌヴィア positive: 自分自身が破壊される',
   (gameState.players[0].grave||[]).some(c=>c&&c.uid===nv.uid));
ok('女邪神ヌヴィア negative: 他のモンスターの召喚では自壊しない',(()=>{
   reset0();const n2=mk('女邪神ヌヴィア',0),o2=mk(PLAIN,0);
   gameState.players[0].mz=[n2,o2];
   return effOf('女邪神ヌヴィア','destroy-self-on-summon')
     .condition(ctxE(0,n2,'onNormalSummon',{player:0,card:o2}))===false;})());

/* ===== エレメントの泉 ===== */
reset0();
let ef=mk('エレメントの泉',0,'up');gameState.players[0].sz=[ef];
let efe=effOf('エレメントの泉');
let lpE=gameState.players[0].lp;
let evH={player:1,uid:12345,fromZone:'mz',toZone:'hand'};
ok('エレメントの泉 positive: モンスターが手札に戻った時に条件成立',
   efe.condition(ctxE(0,ef,'onLeaveField',evH,'sz'))===true);
efe.operation(ctxE(0,ef,'onLeaveField',evH,'sz'));
ok('エレメントの泉 positive: 500LP回復する',gameState.players[0].lp===lpE+500,lpE+'→'+gameState.players[0].lp);
ok('エレメントの泉 ruling: 相手のモンスターが戻った場合も回復する',
   efe.condition(ctxE(0,ef,'onLeaveField',{player:1,fromZone:'mz',toZone:'hand'},'sz'))===true);
ok('エレメントの泉 negative: 墓地へ送られた場合は回復しない',
   efe.condition(ctxE(0,ef,'onLeaveField',{player:0,fromZone:'mz',toZone:'grave'},'sz'))===false);
ok('エレメントの泉 negative: 魔法・罠が手札に戻っても回復しない',
   efe.condition(ctxE(0,ef,'onLeaveField',{player:0,fromZone:'sz',toZone:'hand'},'sz'))===false);
ok('エレメントの泉 negative: 裏側のままでは働かない',(()=>{
   ef.face='down';const r=efe.condition(ctxE(0,ef,'onLeaveField',evH,'sz'));ef.face='up';return r===false;})());

/* ===== 連弾の魔術師 ===== */
reset0();
let rm=mk('連弾の魔術師',0);gameState.players[0].mz=[rm];
let rme=effOf('連弾の魔術師');
let lpR=gameState.players[1].lp;
let evS={player:0,kind:'spell',sub:'normal',uid:999};
ok('連弾の魔術師 positive: 自分の通常魔法発動で条件成立',
   rme.condition(ctxE(0,rm,'onActivateSuccess',evS))===true);
rme.operation(ctxE(0,rm,'onActivateSuccess',evS));
ok('連弾の魔術師 positive: 相手に400ダメージ',gameState.players[1].lp===lpR-400,lpR+'→'+gameState.players[1].lp);
ok('連弾の魔術師 negative: 速攻魔法では誘発しない',
   rme.condition(ctxE(0,rm,'onActivateSuccess',{player:0,kind:'spell',sub:'quick'}))===false);
ok('連弾の魔術師 negative: 罠では誘発しない',
   rme.condition(ctxE(0,rm,'onActivateSuccess',{player:0,kind:'trap',sub:'normal'}))===false);
ok('連弾の魔術師 negative: 相手の通常魔法では誘発しない',
   rme.condition(ctxE(0,rm,'onActivateSuccess',{player:1,kind:'spell',sub:'normal'}))===false);
ok('連弾の魔術師 negative: 裏側では誘発しない',(()=>{
   rm.face='down';const r=rme.condition(ctxE(0,rm,'onActivateSuccess',evS));rm.face='up';return r===false;})());

/* ================= Replay / SaveLoad ================= */
reset0();
let za=mk('火炎鳥',0),zb=mk(BIRD,0);
gameState.players[0].mz=[za,zb];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
effOf('火炎鳥').operation(ctxE(0,za,'onDestroy',{player:0,card:zb}));
if(typeof flushDeferredEventsV2==='function') flushDeferredEventsV2();
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('bulk50-b3 Replay: 永続ステータス変化が digest 一致で再生される',audit.ok,audit.reason||'');
let snap=JSON.stringify(gameState);
ok('bulk50-b3 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('bulk50-b3 直列化: gameState に関数が漏れていない',snap.indexOf('function')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
