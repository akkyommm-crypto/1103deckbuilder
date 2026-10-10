/* Scheduler recovery batch — 11枚の positive / negative / ruling edge case。 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
let __u=99500;
function mk(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return{id,owner:p,controller:p,face,pos,uid:__u++};}
function reset0(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);API.selectCard=(t,list,cb)=>cb(list[0]);
}
function eff(n,k){const e=nativeEffectsV4(n).find(x=>!k||x.key===k);if(!e)throw new Error('effect '+n+' '+k);return e;}
function ctxAt(card,zone,ev,extra){const h=locateCardAnyV4(card);
  return makeContext(0,card,zone||(h&&h.zone)||'sz',(h&&h.index)||0,ev||'activate',extra||{});}
function run(e,c){if(e.target)e.target(c,r=>{c.selectedTargets=r;});e.operation(c);}
const MID='ヂェミナイ・エルフ',ROCK='岩石の巨兵',BEAST='吸血コアラ';

const NAMES=['ソロモンの律法書','刻の封印','死者への供物','無謀な欲張り','無の煉獄','野性解放',
 'フォース・リリース','メサイアの蟻地獄','宝札雲','破天荒な風','運命のドラ'];
NAMES.forEach(n=>ok('Scheduler registration '+n,!!CARD_SCRIPTS[n]));

/* ---- ソロモンの律法書 ---- */
reset0();
let s1=mk('ソロモンの律法書');gameState.players[0].sz=[s1];
v41ResetActionJournal(gameState);
ok('ソロモンの律法書 positive: 発動できる',eff('ソロモンの律法書').condition(ctxAt(s1))===true);
run(eff('ソロモンの律法書'),ctxAt(s1));
ok('ソロモンの律法書: 次の自分のスタンバイをスキップ予約する',
   gameState.phaseSkipV7['0:standby'][0]===7,JSON.stringify(gameState.phaseSkipV7));
ok('ソロモンの律法書 negative: 今のターンにはまだ効かない',API.phaseSkipped(0,'standby')===false);
gameState.turn=7;
ok('ソロモンの律法書 ruling: 次の自分のターンで有効になる',API.phaseSkipped(0,'standby')===true);
ok('ソロモンの律法書 negative: 相手のスタンバイには効かない',API.phaseSkipped(1,'standby')===false);

/* ---- 刻の封印 ---- */
reset0();
let s2=mk('刻の封印');gameState.players[0].sz=[s2];
v41ResetActionJournal(gameState);
run(eff('刻の封印'),ctxAt(s2));
ok('刻の封印: 次の相手ターンのドローをスキップ予約する',
   gameState.phaseSkipV7['1:draw'][0]===6,JSON.stringify(gameState.phaseSkipV7));
ok('刻の封印 negative: 自分のドローには効かない',API.phaseSkipped(0,'draw')===false);
gameState.turn=6;
ok('刻の封印 ruling: 次の相手ターンで有効になる',API.phaseSkipped(1,'draw')===true);

/* ---- 死者への供物 ---- */
reset0();
let s3=mk('死者への供物'),victim=mk(MID,1);
gameState.players[0].sz=[s3];gameState.players[1].mz=[victim];
v41ResetActionJournal(gameState);
ok('死者への供物 positive: 表側モンスターがいれば発動できる',eff('死者への供物').condition(ctxAt(s3))===true);
run(eff('死者への供物'),ctxAt(s3));
ok('死者への供物: 対象を破壊する',gameState.players[1].mz.length===0);
ok('死者への供物: 次の自分ドローフェイズをスキップ予約する',gameState.phaseSkipV7['0:draw'][0]===7);
reset0();
let s3b=mk('死者への供物');gameState.players[0].sz=[s3b];
ok('死者への供物 negative: 表側モンスターがいなければ発動できない',
   eff('死者への供物').condition(ctxAt(s3b))===false);

/* ---- 無謀な欲張り ---- */
reset0();
let s4=mk('無謀な欲張り');gameState.players[0].sz=[s4];
gameState.players[0].deck=[mk(MID),mk(MID),mk(MID)];
v41ResetActionJournal(gameState);
ok('無謀な欲張り positive: デッキが2枚以上なら発動できる',eff('無謀な欲張り').condition(ctxAt(s4))===true);
run(eff('無謀な欲張り'),ctxAt(s4));
ok('無謀な欲張り: 2枚ドローする',gameState.players[0].hand.length===2);
ok('無謀な欲張り ruling: 別々の自分ターンを2回スキップする',
   gameState.phaseSkipV7['0:draw'].length===2
   &&gameState.phaseSkipV7['0:draw'][0]===7&&gameState.phaseSkipV7['0:draw'][1]===9,
   JSON.stringify(gameState.phaseSkipV7['0:draw']));
gameState.turn=7;
ok('無謀な欲張り: 1回目の自分ターンでスキップされる',API.phaseSkipped(0,'draw')===true);
act({type:'PHASE_SKIP_V7',player:0,phase:'draw',mode:'consume'});
ok('無謀な欲張り: 消費後、同じターンにはもう効かない',API.phaseSkipped(0,'draw')===false);
gameState.turn=9;
ok('無謀な欲張り: 2回目の自分ターンでもスキップされる',API.phaseSkipped(0,'draw')===true);
reset0();
let s4b=mk('無謀な欲張り');gameState.players[0].sz=[s4b];gameState.players[0].deck=[mk(MID)];
ok('無謀な欲張り negative: デッキが1枚では発動できない',eff('無謀な欲張り').condition(ctxAt(s4b))===false);

/* ---- 無の煉獄 ---- */
reset0();
let s5=mk('無の煉獄');gameState.players[0].sz=[s5];
gameState.players[0].hand=[mk(MID),mk(MID),mk(MID)];gameState.players[0].deck=[mk(ROCK)];
v41ResetActionJournal(gameState);
ok('無の煉獄 positive: 手札3枚以上で発動できる',eff('無の煉獄').condition(ctxAt(s5))===true);
run(eff('無の煉獄'),ctxAt(s5));
ok('無の煉獄: 1枚ドローする',gameState.players[0].hand.length===4);
ok('無の煉獄: エンドフェイズの予約が入る',gameState.scheduledV7.length===1
   &&gameState.scheduledV7[0].handler==='v7.discardHand');
runDueSchedulesV7('endPhase',gameState);
ok('無の煉獄: エンドフェイズに手札を全て捨てる',gameState.players[0].hand.length===0
   &&gameState.players[0].grave.length===4,'hand='+gameState.players[0].hand.length);
reset0();
let s5b=mk('無の煉獄');gameState.players[0].sz=[s5b];gameState.players[0].hand=[mk(MID)];
ok('無の煉獄 negative: 手札が2枚以下では発動できない',eff('無の煉獄').condition(ctxAt(s5b))===false);

/* ---- 野性解放 ---- */
reset0();
let s6=mk('野性解放'),koala=mk(BEAST);
gameState.players[0].sz=[s6];gameState.players[0].mz=[koala];
v41ResetActionJournal(gameState);
ok('野性解放 positive: 獣族がいれば発動できる',eff('野性解放').condition(ctxAt(s6))===true);
let baseAtk=curATK(koala),baseDef=curDEF(koala);
run(eff('野性解放'),ctxAt(s6));
ok('野性解放: 守備力分だけ攻撃力が上がる',curATK(koala)===baseAtk+baseDef,
   'atk='+curATK(koala)+' base='+baseAtk+'+'+baseDef);
ok('野性解放: エンドフェイズの破壊予約が入る',gameState.scheduledV7.length===1
   &&gameState.scheduledV7[0].args.uid===koala.uid);
runDueSchedulesV7('endPhase',gameState);
ok('野性解放: エンドフェイズに破壊される',gameState.players[0].mz.length===0);
reset0();
let s6b=mk('野性解放');gameState.players[0].sz=[s6b];gameState.players[0].mz=[mk(MID)];
ok('野性解放 negative: 獣族・獣戦士族がいなければ発動できない',
   eff('野性解放').condition(ctxAt(s6b))===false);
/* ruling: 対象が先に場を離れていたらエンドフェイズに何も起きない */
reset0();
let s6c=mk('野性解放'),k2=mk(BEAST);
gameState.players[0].sz=[s6c];gameState.players[0].mz=[k2];
v41ResetActionJournal(gameState);
run(eff('野性解放'),ctxAt(s6c));
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'先に除去',byDestroy:true});
let graveBefore=gameState.players[0].grave.length;
runDueSchedulesV7('endPhase',gameState);
ok('野性解放 ruling: 対象が既に場にいなければ何も起きない',
   gameState.players[0].grave.length===graveBefore&&gameState.scheduledV7.length===0);

/* ---- フォース・リリース ---- */
reset0();
let s7=mk('フォース・リリース');
/* デュアルモンスターを探す */
let dualName=(function(){for(let i=0;i<CARD_DB.length;i++){const d=CARD_DB[i];
  if(d.k==='m'&&(d.st||[]).includes('デュアル')) return d.n;} return null;})();
ok('フォース・リリース 前提: デュアルモンスターがDBに存在する',!!dualName,'name='+dualName);
reset0();
s7=mk('フォース・リリース');let dm=mk(dualName);
gameState.players[0].sz=[s7];gameState.players[0].mz=[dm];
v41ResetActionJournal(gameState);
ok('フォース・リリース positive: デュアルがいれば発動できる',eff('フォース・リリース').condition(ctxAt(s7))===true);
run(eff('フォース・リリース'),ctxAt(s7));
ok('フォース・リリース: 再度召喚した状態になる',dm.dualUp===true);
ok('フォース・リリース: エンドフェイズの予約が入る',gameState.scheduledV7.length===1
   &&gameState.scheduledV7[0].handler==='v7.faceDownDefUid');
runDueSchedulesV7('endPhase',gameState);
ok('フォース・リリース: エンドフェイズに裏側守備表示になる',
   dm.face==='down'&&dm.pos==='def','face='+dm.face+' pos='+dm.pos);
reset0();
let s7b=mk('フォース・リリース');gameState.players[0].sz=[s7b];gameState.players[0].mz=[mk(MID)];
ok('フォース・リリース negative: デュアルがいなければ発動できない',
   eff('フォース・リリース').condition(ctxAt(s7b))===false);

/* ---- メサイアの蟻地獄 ---- */
reset0();
let s8=mk('メサイアの蟻地獄'),low=mk(ROCK);
gameState.players[0].sz=[s8];gameState.players[0].mz=[low];
v41ResetActionJournal(gameState);
let e8=eff('メサイアの蟻地獄');
let c8=ctxAt(s8,'sz','onNormalSummon',{event:{card:low,player:0}});
ok('メサイアの蟻地獄 positive: レベル3以下の召喚に反応する',e8.condition(c8)===true,
   'lv='+dbOf(low).lv);
e8.operation(c8);
ok('メサイアの蟻地獄: エンドフェイズの破壊予約が入る',gameState.scheduledV7.length===1);
runDueSchedulesV7('endPhase',gameState);
ok('メサイアの蟻地獄: エンドフェイズに破壊される',gameState.players[0].mz.length===0);
let high=mk(MID);gameState.players[0].mz=[high];
ok('メサイアの蟻地獄 negative: レベル4以上には反応しない',
   e8.condition(ctxAt(s8,'sz','onNormalSummon',{event:{card:high,player:0}}))===false);
ok('メサイアの蟻地獄 ruling: 相手のレベル3以下にも反応する',
   (()=>{const foeLow=mk(ROCK,1);gameState.players[1].mz=[foeLow];
     return e8.condition(ctxAt(s8,'sz','onNormalSummon',{event:{card:foeLow,player:1}}))===true;})());

/* ---- 宝札雲 ---- */
reset0();
let cloudName=(function(){for(let i=0;i<CARD_DB.length;i++){const d=CARD_DB[i];
  if(d.k==='m'&&isCardInGroupV4(d,GROUP.CLOUDIAN)) return d.n;} return null;})();
ok('宝札雲 前提: 「雲魔物」がDBに存在する',!!cloudName,'name='+cloudName);
reset0();
let s9=mk('宝札雲');gameState.players[0].sz=[s9];
gameState.players[0].deck=[mk(MID),mk(MID),mk(MID)];
v41ResetActionJournal(gameState);
run(eff('宝札雲','cloudian-double-summon-draw'),ctxAt(s9));
ok('宝札雲: エンドフェイズの条件付きドロー予約が入る',gameState.scheduledV7.length===1
   &&gameState.scheduledV7[0].handler==='v7.drawIf');
let e9b=eff('宝札雲','count-cloudian-summons');
let cl1=mk(cloudName),cl2=mk(cloudName);
gameState.players[0].mz=[cl1,cl2];
let cc1=ctxAt(s9,'sz','onNormalSummon',{event:{card:cl1,player:0}});
ok('宝札雲 positive: 「雲魔物」の召喚を数える',e9b.condition(cc1)===true);
e9b.operation(cc1);
ok('宝札雲: 1体目ではまだ条件を満たさない',API.getFlag(0,'v7CloudianReady')==null);
let cc2=ctxAt(s9,'sz','onNormalSummon',{event:{card:cl2,player:0}});
e9b.operation(cc2);
ok('宝札雲: 2体目で条件を満たす',API.getFlag(0,'v7CloudianReady')===true);
let handBefore=gameState.players[0].hand.length;
runDueSchedulesV7('endPhase',gameState);
ok('宝札雲: エンドフェイズに2枚ドローする',gameState.players[0].hand.length===handBefore+2);
reset0();
let s9b=mk('宝札雲');gameState.players[0].sz=[s9b];gameState.players[0].deck=[mk(MID),mk(MID)];
v41ResetActionJournal(gameState);
run(eff('宝札雲','cloudian-double-summon-draw'),ctxAt(s9b));
let hb2=gameState.players[0].hand.length;
runDueSchedulesV7('endPhase',gameState);
ok('宝札雲 negative: 「雲魔物」を2体召喚していなければドローしない',
   gameState.players[0].hand.length===hb2);
ok('宝札雲 negative: 「雲魔物」以外の召喚は数えない',
   (()=>{reset0();const s=mk('宝札雲');gameState.players[0].sz=[s];
     API.setFlag(0,'v7CloudianCount',0,true);
     const other=mk(MID);gameState.players[0].mz=[other];
     return eff('宝札雲','count-cloudian-summons')
       .condition(ctxAt(s,'sz','onNormalSummon',{event:{card:other,player:0}}))===false;})());

/* ---- 破天荒な風 ---- */
reset0();
let s10=mk('破天荒な風'),boost=mk(MID);
gameState.players[0].sz=[s10];gameState.players[0].mz=[boost];
v41ResetActionJournal(gameState);
ok('破天荒な風 positive: 表側モンスターがいれば発動できる',eff('破天荒な風').condition(ctxAt(s10))===true);
run(eff('破天荒な風'),ctxAt(s10));
ok('破天荒な風: 攻守が1000上がる',curATK(boost)===1900+1000&&curDEF(boost)===900+1000);
ok('破天荒な風: 次の自分のスタンバイまでの予約が入る',
   gameState.scheduledV7.length===1&&gameState.scheduledV7[0].at==='standbyPhase'
   &&gameState.scheduledV7[0].turnAbs===7);
runDueSchedulesV7('standbyPhase',gameState);
ok('破天荒な風 ruling: まだ到達していないので効果は続く',curATK(boost)===1900+1000);
gameState.turn=7;
runDueSchedulesV7('standbyPhase',gameState);
ok('破天荒な風: 次の自分のスタンバイで元に戻る',curATK(boost)===1900&&curDEF(boost)===900,
   'atk='+curATK(boost));
reset0();
let s10b=mk('破天荒な風');gameState.players[0].sz=[s10b];
ok('破天荒な風 negative: 表側モンスターがいなければ発動できない',
   eff('破天荒な風').condition(ctxAt(s10b))===false);

/* ---- 運命のドラ ---- */
reset0();
gameState.activePlayer=1;
let s11=mk('運命のドラ'),foeMon=mk(MID,1);
gameState.players[0].sz=[s11];gameState.players[1].mz=[foeMon];
v41ResetActionJournal(gameState);
ok('運命のドラ positive: 相手ターンに発動できる',
   eff('運命のドラ','mark-level-for-next-own-turn').condition(ctxAt(s11))===true);
run(eff('運命のドラ','mark-level-for-next-own-turn'),ctxAt(s11));
ok('運命のドラ: 次の自分ターン開始時の予約が入る',
   gameState.scheduledV7.length===1&&gameState.scheduledV7[0].at==='turnStart'
   &&gameState.scheduledV7[0].args.value===4,JSON.stringify(gameState.scheduledV7[0].args));
gameState.turn=6;gameState.activePlayer=0;
runDueSchedulesV7('turnStart',gameState);
ok('運命のドラ: 次の自分ターンにレベルが記憶される',API.getFlag(0,'v7DoraLevel')===4);
let lv3=mk(ROCK);gameState.players[0].mz=[lv3];
let e11b=eff('運命のドラ','dora-damage-on-summon');
let c11=ctxAt(s11,'sz','onNormalSummon',{event:{card:lv3,player:0}});
ok('運命のドラ positive: 1つ低いレベルの召喚に反応する',e11b.condition(c11)===true,'lv='+curLV(lv3));
e11b.operation(c11);
ok('運命のドラ: 対象のレベル×500のダメージ',gameState.players[1].lp===8000-2000,
   'lp='+gameState.players[1].lp);
ok('運命のドラ: 1度使ったら記憶は消える',API.getFlag(0,'v7DoraLevel')==null);
reset0();
gameState.activePlayer=0;
let s11b=mk('運命のドラ');gameState.players[0].sz=[s11b];gameState.players[1].mz=[mk(MID,1)];
ok('運命のドラ negative: 自分のターンには発動できない',
   eff('運命のドラ','mark-level-for-next-own-turn').condition(ctxAt(s11b))===false);
reset0();
let s11c=mk('運命のドラ');gameState.players[0].sz=[s11c];
API.setFlag(0,'v7DoraLevel',4,true);
let wrongLv=mk(MID);gameState.players[0].mz=[wrongLv];
ok('運命のドラ negative: レベルが一致しなければ誘発しない',
   eff('運命のドラ','dora-damage-on-summon')
     .condition(ctxAt(s11c,'sz','onNormalSummon',{event:{card:wrongLv,player:0}}))===false,
   'lv='+curLV(wrongLv));

/* ---- 全体の健全性 ---- */
ok('Scheduler cards: 盤面はJSON直列化できる',!!JSON.stringify(gameState));
ok('Scheduler cards: 予約は純JSON',assertScheduleSerializableV7(gameState).ok);
reset0();
let rs=mk('野性解放'),rk=mk(BEAST);
gameState.players[0].sz=[rs];gameState.players[0].mz=[rk];
v41ResetActionJournal(gameState);
run(eff('野性解放'),ctxAt(rs));
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Scheduler cards: 予約を含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
