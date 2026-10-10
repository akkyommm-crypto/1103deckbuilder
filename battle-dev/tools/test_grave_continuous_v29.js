/* Class A bulk 50 — System v29 E3: Graveyard Continuous Source。positive / negative / ruling edge。 */
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
const PB1='幻獣ワイルドホーン';   /* TESTED・PHANTOM_BEAST */
const PB2='幻獣王ガゼル';        /* PHANTOM_BEAST */
const XW='幻獣クロスウィング';
const NONPB='ヂェミナイ・エルフ'; /* GENERIC_OK・幻獣ではない */

ok('E3: 墓地ソース宣言の集合関数がある',typeof graveContinuousNamesV29==='function');
/* opt-in を保つための上限。v29 当時は 1 枚だったが、
   「解決後も墓地から効果が続く」カードを実装するたびに正当に増えている。
     cycle06 ハネクリボー
     cycle07 ガード・ブロック / ミスフォーチュン / 催眠術
     cycle11 海竜神の加護 / ダメージ・ダイエット
     cycle12 復活の墓穴
     cycle13-14 エヴォリューション・バースト
     cycle15 チューナーズ・バリア（次のターンのエンドフェイズ時まで破壊されない）
     cycle16 スピリット・フォース（その戦闘の自分への戦闘ダメージを0にする）
     cycle17 ガード・ヘッジ（手札から墓地へ送って発動し、その戦闘で破壊されない）
     cycle17 無力の証明（発動するターン、自分のモンスターは攻撃できない）
   いずれも「発動後に自身が墓地へ行っても効果が続く」テキストで、
   墓地ソース以外に宣言できる場所が無い。
   本当の防波堤は下の performance assertion（空墓地との相対比較）であって、
   ここは「無制限に増えていない」ことを見るための緩い上限。
   上げる時は必ず、増えた分がテキスト上も墓地ソースを要求している事を確認する。 */
ok('E3: opt-in なので宣言はごく少数にとどまる',graveContinuousNamesV29().size<=20,
   String(graveContinuousNamesV29().size));
ok('E3: 幻獣クロスウィングが宣言に入っている',graveContinuousNamesV29().has(XW));
ok('前提: 幻獣ワイルドホーンは PHANTOM_BEAST',
   isCardInGroupV4(dbOf({id:findCardIndex(PB1)}),GROUP.PHANTOM_BEAST)===true);
ok('前提: ヂェミナイ・エルフは PHANTOM_BEAST ではない',
   isCardInGroupV4(dbOf({id:findCardIndex(NONPB)}),GROUP.PHANTOM_BEAST)===false);

/* ---- 墓地にいる間だけ有効 ---- */
reset0();
let src=mk(XW,0),pb=mk(PB1,0),other=mk(NONPB,0);
gameState.players[0].mz=[pb,other];
let pbBase=dbOf(pb).atk, otBase=dbOf(other).atk;
ok('E3 negative: 墓地に無い間は何も起きない',curATK(pb)===pbBase,'atk='+curATK(pb));
gameState.players[0].grave=[src];
ok('E3 positive: 墓地にある間は「幻獣」の攻撃力が300アップ',
   curATK(pb)===pbBase+300,'atk='+curATK(pb));
ok('E3 negative: 「幻獣」以外は上がらない',curATK(other)===otBase);
ok('E3 positive: 相手フィールドの「幻獣」にも届く（allMonsters）',(()=>{
   const fpb=mk(PB2,1);gameState.players[1].mz=[fpb];
   return curATK(fpb)===dbOf(fpb).atk+300;})());

/* ---- 墓地を離れた瞬間に失効 ---- */
gameState.players[0].grave=[];
ok('E3 positive: 墓地を離れた瞬間に失効する',curATK(pb)===pbBase,'atk='+curATK(pb));
gameState.players[0].hand=[src];
ok('E3 negative: 手札に移っても適用されない',curATK(pb)===pbBase);
gameState.players[0].mz.push(src);
ok('E3 negative: フィールドに出しても（from:grave なので）適用されない',
   curATK(pb)===pbBase,'atk='+curATK(pb));

/* ---- 墓地へ戻ったら再評価 ---- */
gameState.players[0].hand=[];
gameState.players[0].mz=[pb,other];
gameState.players[0].grave=[src];
ok('E3 positive: 墓地へ戻れば再び適用される（新generation）',
   curATK(pb)===pbBase+300,'atk='+curATK(pb));

/* ---- 二重適用なし ---- */
reset0();
let s1=mk(XW,0),s2=mk(XW,0),tgt=mk(PB1,0);
gameState.players[0].mz=[tgt];gameState.players[0].grave=[s1];
ok('E3 positive: 1枚なら+300',curATK(tgt)===dbOf(tgt).atk+300);
gameState.players[0].grave=[s1,s2];
ok('E3 ruling: 墓地に2枚なら+600（ソースごとに1回・二重適用ではない）',
   curATK(tgt)===dbOf(tgt).atk+600,'atk='+curATK(tgt));
gameState.players[0].grave=[s1];
gameState.players[0].mz=[tgt,s2];
ok('E3 positive: フィールドの同名は加算しない（from:grave のみ）',
   curATK(tgt)===dbOf(tgt).atk+300,'atk='+curATK(tgt));

/* ---- 相手の墓地 / owner-controller ---- */
reset0();
let foeSrc=mk(XW,1),myPb=mk(PB1,0);
gameState.players[0].mz=[myPb];gameState.players[1].grave=[foeSrc];
ok('E3 positive: 相手の墓地のソースも allMonsters なら自分の「幻獣」へ届く',
   curATK(myPb)===dbOf(myPb).atk+300,'atk='+curATK(myPb));
ok('E3 ruling: owner は変わらない',foeSrc.owner===1&&foeSrc.controller===1);

/* ---- 実際に破壊して墓地へ送る経路 ---- */
reset0();
let live=mk(XW,0),bene=mk(PB1,0);
gameState.players[0].mz=[live,bene];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
ok('E3 negative: フィールドにいる間は適用されない',curATK(bene)===dbOf(bene).atk);
API.destroy(h(live),'E3テスト');
ok('E3 positive: 破壊されて墓地へ行くと適用が始まる',
   curATK(bene)===dbOf(bene).atk+300,'atk='+curATK(bene));
API.banish(findCardByUid(live.uid),'E3テスト');
ok('E3 positive: 墓地から除外されると失効する',curATK(bene)===dbOf(bene).atk);

/* ---- 宣言していないカードは墓地ソースにならない ---- */
reset0();
let noDecl=mk(PB1,0),tgt2=mk(PB2,0);
gameState.players[0].mz=[tgt2];gameState.players[0].grave=[noDecl];
ok('E3 negative: continuous.from に grave を書いていないカードは墓地ソースにならない',
   curATK(tgt2)===dbOf(tgt2).atk,'atk='+curATK(tgt2));

/* ---- performance: 宣言外の墓地カードは走査で弾かれる ---- */
reset0();
let big=[];
for(let i=0;i<200;i++) big.push(mk(NONPB,0));
gameState.players[0].grave=big;
/* このガードの目的は「宣言外の墓地カードが走査から弾かれている」事の検出であって、
   このマシンが何ミリ秒で動くかではない。壁時計の絶対値だけを見ると、他の処理と
   同時に走った時に負荷で跳ねて偽陽性になる（実際 cycle 13 の検証中に一度発生した）。
   そこで「墓地が空のときの評価時間」を基準にした相対比較へ置き換える。
   墓地走査が絞り込まれていれば墓地200枚でも基準とほぼ変わらず、
   絞り込みが壊れて O(墓地枚数) になれば比が跳ね上がる。
   絶対値は「桁違いの暴走」を捕まえる保険としてだけ残す。 */
let mon=mk(PB1,0);gameState.players[0].mz=[mon];
gameState.players[0].grave=[];
let b0=Date.now();
for(let i=0;i<200;i++) curATK(mon);
let base=Math.max(1,Date.now()-b0);
gameState.players[0].grave=big;
let t0=Date.now();
for(let i=0;i<200;i++) curATK(mon);
let dt=Date.now()-t0;
ok('E3 performance: 墓地200枚でも継続評価は空墓地の25倍以内（走査が絞り込まれている）',
   dt<=base*25,'base='+base+'ms grave200='+dt+'ms');
ok('E3 performance: 絶対値でも桁違いの暴走をしていない',dt<3000,dt+'ms');

/* ---- Replay / SaveLoad / 直列化 ---- */
reset0();
let rs=mk(XW,0),rb=mk(PB1,0);
gameState.players[0].mz=[rs,rb];
gameState.fieldSnapV9=fieldSnapshotV9(gameState);
v41ResetActionJournal(gameState);
API.destroy(h(rs),'E3 Replay');
/* 破壊系のイベントは Action の中で積まれる。Replay 側も同じ順序で積み直すので、
   digest を取る前に流し切ってはいけない（live 側だけ空になって不一致になる）。 */
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('E3 Replay: 墓地ソース発生後も digest 一致で再生される',audit.ok,audit.reason||'');
let snap=JSON.stringify(gameState);
ok('E3 SaveLoad: JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
ok('E3 直列化: 墓地ソース用の新しい gameState キーを増やしていない',
   Object.keys(newGame()).indexOf('graveContinuousV29')<0);
ok('E3 直列化: continuous 宣言は gameState に漏れていない',snap.indexOf('continuousSourceZones')<0);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error("完了:",(c.__R||[]).length,(c.__R||[]).slice(-2).map(x=>x.name).join(' | '));console.error(e.stack||e);process.exit(1);}
