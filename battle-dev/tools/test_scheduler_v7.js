/* System v7 — Delayed / Scheduled effects primitive 回帰テスト
   検証: normal / negative / aborted / stale state / zone leave /
         generation change / Replay / Undo / Redo / SaveLoad /
         Journal / digest                                                */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(ROOT,'dist','battle.html'),'utf8');
let js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\bboot\(\);\s*\/\* System v3\.1:/,'/* boot skipped */\n/* System v3.1:');
js+=String.raw`
CARD_DB=globalThis.__TEST_CARD_DB__;NAME_INDEX=null;MAT_SPEC_CACHE.clear();buildMaterialNameSet();
render=()=>{};showToast=()=>{};saveDuelSoon=()=>{};clearSavedDuel=()=>{};closeSheet=()=>{};
openChainPriorityV2=()=>{};enforceExclusions=()=>{};enforceSinUpkeep=()=>{};
const R=[];const ok=(n,v,d='')=>R.push({name:n,ok:!!v,detail:d});
let __u=99000;
function mkS(n,p=0,face='up',pos='atk'){const id=findCardIndex(n);if(id<0)throw new Error('missing '+n);return{id,owner:p,controller:p,face,pos,uid:__u++};}
function resetS(){
  gameState=newGame();gameState.activePlayer=0;gameState.firstPlayer=0;gameState.phase='main1';gameState.turn=5;
  PLAY_MODE=PLAY_MODES.DUEL;HISTORY.length=0;REDO.length=0;turnActions=[];V44_REPLAY_SESSION=null;
  resetChoiceStatsV49();v41ResetActionJournal(gameState);__ran=[];
}
let __ran=[];
registerScheduleHandlerV7('sched.test.mark',(args,entry)=>{__ran.push(args.tag);});
registerScheduleHandlerV7('sched.test.damage',(args)=>{API.damageLP(args.player,args.amount||100);});
registerScheduleHandlerV7('sched.test.needSource',(args,entry)=>{
  if(!API.scheduleSourceAlive(entry)) return;   /* 場を離れていたら何もしない */
  __ran.push('source-alive');
});
const MID='ヂェミナイ・エルフ';

/* =====================================================================
   1. 正常系: 予約 → 到達で実行 → 消える
   ===================================================================== */
resetS();
ok('normal: 初期状態では予約が無い',gameState.scheduledV7.length===0);
API.schedule({at:'endPhase',turns:0,handler:'sched.test.mark',args:{tag:'now'},note:'テスト'});
ok('normal: 予約が1件入る',gameState.scheduledV7.length===1,JSON.stringify(gameState.scheduledV7));
let e0=gameState.scheduledV7[0];
ok('normal: turnAbs は絶対ターン番号へ解決される',e0.turnAbs===5,'turnAbs='+e0.turnAbs);
ok('normal: handler は名前で保持する（closure を state に置かない）',
   e0.handler==='sched.test.mark'&&typeof e0.handler==='string');
ok('normal: id が振られる（同一handlerの再予約を区別できる）',typeof e0.id==='number');
ok('normal: 予約は純JSON',assertScheduleSerializableV7(gameState).ok,assertScheduleSerializableV7(gameState).why);
runDueSchedulesV7('endPhase',gameState);
ok('normal: 到達したら実行される',__ran.join(',')==='now',__ran.join(','));
ok('normal: 実行後は予約が消える（無制限に溜まらない）',gameState.scheduledV7.length===0);

/* 同じ handler を2件予約しても id で区別される */
resetS();
API.schedule({at:'endPhase',turns:0,handler:'sched.test.mark',args:{tag:'a'}});
API.schedule({at:'endPhase',turns:0,handler:'sched.test.mark',args:{tag:'b'}});
ok('normal: 同一handlerを複数予約できる',gameState.scheduledV7.length===2
   &&gameState.scheduledV7[0].id!==gameState.scheduledV7[1].id);
runDueSchedulesV7('endPhase',gameState);
ok('normal: 両方とも実行される',__ran.sort().join(',')==='a,b',__ran.join(','));

/* =====================================================================
   2. negative: まだ到達していない / タイミング違い
   ===================================================================== */
resetS();
API.schedule({at:'endPhase',turns:2,handler:'sched.test.mark',args:{tag:'later'}});
runDueSchedulesV7('endPhase',gameState);
ok('negative: 未来の予約はまだ実行されない',__ran.length===0&&gameState.scheduledV7.length===1);
gameState.turn=6;
runDueSchedulesV7('endPhase',gameState);
ok('negative: 1ターン後でもまだ実行されない',__ran.length===0);
gameState.turn=7;
runDueSchedulesV7('endPhase',gameState);
ok('normal: 指定ターンに到達したら実行される',__ran.join(',')==='later');
resetS();
API.schedule({at:'standbyPhase',turns:0,handler:'sched.test.mark',args:{tag:'sb'}});
runDueSchedulesV7('endPhase',gameState);
ok('negative: 別のタイミングでは実行されない',__ran.length===0&&gameState.scheduledV7.length===1);
runDueSchedulesV7('standbyPhase',gameState);
ok('normal: 正しいタイミングで実行される',__ran.join(',')==='sb');
/* 不正な予約は作られない */
resetS();
ok('negative: 未知のタイミングは予約できない',API.schedule({at:'nowhere',handler:'sched.test.mark'})===true
   &&gameState.scheduledV7.length===0,'len='+gameState.scheduledV7.length);
resetS();
API.schedule({at:'endPhase',turns:0,handler:''});
ok('negative: handler名が無ければ予約できない',gameState.scheduledV7.length===0);

/* =====================================================================
   3. aborted: 予約の取消
   ===================================================================== */
resetS();
API.schedule({at:'endPhase',turns:0,handler:'sched.test.mark',args:{tag:'x'}});
API.schedule({at:'endPhase',turns:0,handler:'sched.test.mark',args:{tag:'y'}});
let ids=gameState.scheduledV7.map(e=>e.id);
API.cancelSchedule(ids[0]);
ok('aborted: 指定した予約だけ取り消せる',gameState.scheduledV7.length===1&&gameState.scheduledV7[0].id===ids[1]);
runDueSchedulesV7('endPhase',gameState);
ok('aborted: 取り消した予約は実行されない',__ran.join(',')==='y',__ran.join(','));

/* =====================================================================
   4. stale state / zone leave / generation change
   ===================================================================== */
resetS();
let src=mkS(MID);gameState.players[0].mz=[src];
v41ResetActionJournal(gameState);
API.schedule({at:'endPhase',turns:0,handler:'sched.test.needSource',
  source:{p:0,zone:'mz',index:0,card:src},sourceZone:'mz'});
ok('stale: 予約元は uid で保持される',gameState.scheduledV7[0].sourceUid===src.uid
   &&JSON.stringify(gameState.scheduledV7[0]).indexOf('ヂェミナイ')<0);
runDueSchedulesV7('endPhase',gameState);
ok('stale: 予約元が場にいれば実行される',__ran.join(',')==='source-alive');
resetS();
src=mkS(MID);gameState.players[0].mz=[src];
v41ResetActionJournal(gameState);
API.schedule({at:'endPhase',turns:0,handler:'sched.test.needSource',
  source:{p:0,zone:'mz',index:0,card:src},sourceZone:'mz'});
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
runDueSchedulesV7('endPhase',gameState);
ok('zone leave: 予約元が場を離れていたら handler 側で弾ける',__ran.length===0);
ok('zone leave: 予約自体は実行されて取り除かれる',gameState.scheduledV7.length===0);
/* 世代: 同じ uid が別の場所へ戻っても sourceZone で判別できる */
resetS();
src=mkS(MID);gameState.players[0].mz=[src];
v41ResetActionJournal(gameState);
API.schedule({at:'endPhase',turns:0,handler:'sched.test.needSource',
  source:{p:0,zone:'mz',index:0,card:src},sourceZone:'mz'});
act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:0,reason:'破壊',byDestroy:true});
let g=findCardByUid(src.uid);
act({type:'FX_SPECIAL_SUMMON',player:0,from:'grave',fromIndex:g.index,pos:'atk',reason:'蘇生'});
runDueSchedulesV7('endPhase',gameState);
ok('generation: 同じuidで場に戻れば sourceZone 判定は通る（uidは世代を持たない）',
   __ran.join(',')==='source-alive',
   '※世代を区別したいカードは P3 の summonInstance を handler 側で照合する');

/* =====================================================================
   5. フェイズのスキップ
   ===================================================================== */
resetS();
ok('skip: 既定ではスキップされない',API.phaseSkipped(0,'draw')===false);
API.skipPhase(0,'draw',0);
ok('skip: スキップを予約できる',API.phaseSkipped(0,'draw')===true);
ok('skip: 別のプレイヤーには波及しない',API.phaseSkipped(1,'draw')===false);
ok('skip: 別のフェイズには波及しない',API.phaseSkipped(0,'standby')===false);
act({type:'PHASE_SKIP_V7',player:0,phase:'draw',mode:'consume'});
ok('skip: 1回で消費される',API.phaseSkipped(0,'draw')===false);
resetS();
API.skipPhase(0,'draw',0,2);
ok('skip: 複数回まとめて予約できる',gameState.phaseSkipV7['0:draw'].length===2);
act({type:'PHASE_SKIP_V7',player:0,phase:'draw',mode:'consume'});
ok('skip: 1回消費しても残りは有効',API.phaseSkipped(0,'draw')===true);
resetS();
API.skipPhase(1,'draw',1);
ok('skip: 未来ターンのスキップはまだ有効にならない',API.phaseSkipped(1,'draw')===false);
gameState.turn=6;
ok('skip: 指定ターンに到達したら有効になる',API.phaseSkipped(1,'draw')===true);
resetS();
API.skipPhase(0,'nosuchphase',0);
ok('skip negative: 未知のフェイズは予約できない',Object.keys(gameState.phaseSkipV7).length===0);
resetS();
API.skipOwnPhase(0,'standby');
ok('skip: 次の自分のターンは turnAbs+2 に解決される',
   gameState.phaseSkipV7['0:standby'][0]===7,'turnAbs='+gameState.phaseSkipV7['0:standby'][0]);
resetS();
gameState.activePlayer=1;
API.skipOwnPhase(0,'standby');
ok('skip: 相手ターン中なら次の自分のターンは turnAbs+1',
   gameState.phaseSkipV7['0:standby'][0]===6);

/* =====================================================================
   6. ラベル指定での攻守修正解除
   ===================================================================== */
resetS();
let mc=mkS(MID);gameState.players[0].mz=[mc];
v41ResetActionJournal(gameState);
API.modAtk({p:0,zone:'mz',index:0,card:mc},1000,0,'permanent','テスト強化');
ok('mod: 攻撃力が上がる',curATK(mc)===1900+1000);
API.clearModsByLabel({p:0,zone:'mz',index:0,card:mc},'別のラベル');
ok('mod negative: 別ラベルでは外れない',curATK(mc)===1900+1000);
API.clearModsByLabel({p:0,zone:'mz',index:0,card:mc},'テスト強化');
ok('mod: ラベル指定で外せる',curATK(mc)===1900,'atk='+curATK(mc));

/* =====================================================================
   7. 既存の reserved を壊していないこと
   ===================================================================== */
ok('既存維持: reserved 配列は従来どおり存在する',Array.isArray(gameState.reserved));
ok('既存維持: RESERVE_ADD / resolveReservedEffectsV30 は残っている',
   typeof resolveReservedEffectsV30==='function');
resetS();
act({type:'RESERVE_ADD',player:0,name:'旧予約',at:'endPhase'});
ok('既存維持: 旧予約は scheduledV7 とは別に積まれる',
   gameState.reserved.length===1&&gameState.scheduledV7.length===0);

/* =====================================================================
   8. Replay / Undo / Redo / SaveLoad / Journal / digest
   ===================================================================== */
resetS();
let pc=mkS(MID);gameState.players[0].mz=[pc];
v41ResetActionJournal(gameState);
let digestBefore=v41StateDigest(gameState);
let textBefore=v41StateDigestText(gameState);
ok('digest後方互換: 予約が無ければ digest 文字列に予約が出ない',
   textBefore.indexOf('scheduledV7')<0&&textBefore.indexOf('phaseSkipV7')<0);
API.schedule({at:'standbyPhase',turns:2,handler:'sched.test.damage',args:{player:1,amount:500},note:'遅延ダメージ'});
API.skipPhase(1,'draw',1);
let types=V41_ACTION_JOURNAL.map(x=>x.action.type);
ok('Journal: SCHEDULE_ADD_V7 が記録される',types.includes('SCHEDULE_ADD_V7'));
ok('Journal: PHASE_SKIP_V7 が記録される',types.includes('PHASE_SKIP_V7'));
let audit=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('Replay: 予約を含む進行が digest 一致で再生される',audit.ok,audit.reason||audit.finalDigest);
let snap=JSON.stringify(gameState);
ok('SaveLoad: gameState は JSON 往復で完全一致',JSON.stringify(JSON.parse(snap))===snap);
gameState=JSON.parse(snap);
ok('SaveLoad: 復元後も予約が残る',gameState.scheduledV7.length===1
   &&gameState.scheduledV7[0].handler==='sched.test.damage');
ok('SaveLoad: 復元後もフェイズスキップが残る',API.phaseSkipped(1,'draw')===false);
gameState.turn=6;
ok('SaveLoad: 復元後にターンが進めばスキップが有効になる',API.phaseSkipped(1,'draw')===true);
gameState.turn=5;
gameState.turn=7;
runDueSchedulesV7('standbyPhase',gameState);
ok('SaveLoad: 復元した予約がそのまま発火する',gameState.players[1].lp===8000-500,
   'lp='+gameState.players[1].lp);
/* Undo/Redo は SaveLoad で盤面を差し替えていない別シナリオで検証する
   （runDueSchedulesV7 が SCHEDULE_REMOVE_V7 を積むため履歴が混ざる） */
resetS();
let uc=mkS(MID);gameState.players[0].mz=[uc];
v41ResetActionJournal(gameState);
let digestU=v41StateDigest(gameState);
API.schedule({at:'standbyPhase',turns:2,handler:'sched.test.damage',args:{player:1,amount:500}});
API.skipPhase(1,'draw',1);
ok('Undo前提: 予約とスキップが入っている',
   gameState.scheduledV7.length===1&&Object.keys(gameState.phaseSkipV7).length===1);
undo();
ok('Undo: フェイズスキップが巻き戻る',Object.keys(gameState.phaseSkipV7).length===0);
undo();
ok('Undo: 予約が巻き戻る',gameState.scheduledV7.length===0);
ok('Undo: 全て巻き戻すと元の digest に一致する',v41StateDigest(gameState)===digestU,
   'before='+digestU+' now='+v41StateDigest(gameState));
redo();
ok('Redo: 予約が復元される',gameState.scheduledV7.length===1);
redo();
ok('Redo: フェイズスキップも復元される',Object.keys(gameState.phaseSkipV7).length===1);
/* Undo でターンが巻き戻っても二重発火しない（絶対ターン番号で持つため） */
resetS();
API.schedule({at:'endPhase',turns:0,handler:'sched.test.mark',args:{tag:'once'}});
runDueSchedulesV7('endPhase',gameState);
ok('二重発火防止: 1回目で実行される',__ran.join(',')==='once');
runDueSchedulesV7('endPhase',gameState);
ok('二重発火防止: 同じタイミングを再度回しても2回目は走らない',__ran.join(',')==='once');

/* 直列化の健全性 */
function scanFnsS(v,d){ if(d>12||v===null||typeof v!=='object')return typeof v==='function';
  return Object.keys(v).some(k=>typeof v[k]==='function'||scanFnsS(v[k],d+1)); }
resetS();
API.schedule({at:'turnEnd',turns:1,handler:'sched.test.mark',args:{tag:'z',nested:{a:[1,2,3]}}});
ok('直列化: gameState 全体に関数が混入していない',
   !scanFnsS(JSON.parse(JSON.stringify(gameState)),0));
ok('直列化: 予約に Map/Set/DOM/Promise が無い',assertScheduleSerializableV7(gameState).ok);
ok('直列化: handler レジストリは state の外にある',
   JSON.stringify(gameState).indexOf('sched.test.mark')>=0
   &&typeof SCHEDULE_HANDLERS_V7['sched.test.mark']==='function');

globalThis.__R=R;`;
function stub(){return new Proxy({style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},appendChild(){},remove(){},querySelector(){return stub()},querySelectorAll(){return[]}},{get:(t,p)=>p in t?t[p]:()=>{}})}
const nodes=new Map(),document={getElementById(id){if(!nodes.has(id))nodes.set(id,stub());return nodes.get(id)},querySelector(){return stub()},querySelectorAll(){return[]},createElement(){return stub()},addEventListener(){},body:stub(),documentElement:stub()},store=new Map(),localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const c={console,__TEST_CARD_DB__:JSON.parse(fs.readFileSync(path.join(ROOT,'data','carddata.json'),'utf8')),document,localStorage,sessionStorage:localStorage,history:{pushState(){}},location:{reload(){}},navigator:{userAgent:'node'},addEventListener(){},removeEventListener(){},requestAnimationFrame:f=>f(),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},confirm:()=>true,prompt:()=>null,alert(){},Blob,structuredClone:global.structuredClone};c.window=c;c.globalThis=c;
try{vm.runInNewContext(js,c,{timeout:60000});console.log(c.__R.map(x=>(x.ok?'PASS ':'FAIL ')+x.name+(x.detail?' — '+x.detail:'')).join('\n'));if(c.__R.some(x=>!x.ok))process.exit(2);}catch(e){console.error(e.stack||e);process.exit(1);}
