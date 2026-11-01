/* S03-U489: 保存・再開したあと、召喚成功タイミングの窓が開いたまま残らないようにする。
   S03-U483 の 4-a の残り（ユーザー優先順位③）。S03-U486 は「開いたメインフェイズに戻った時点で閉じる」処理を入れたが、
   保存・再開を毎停止点で往復させるモードでは違反が残っていた（R1 seed 0x52311015 の turn 6 で 6 件）。
   原因（計測で特定）: `offerResumeDuel`（runtime/50_actions_save.js）は読み込み直後に召喚・反転の窓を破棄するが、
   そのあとの Journal 再生（`v41RestoreJournalPackage` / 中断の復旧 `recoverInterruptedResolutionAfterLoadS296`）が
   Action を適用し直すため、`NORMAL_SUMMON` 等で `updateTimingWindow` が窓を開き直す。
   再生中はプロセッサが動かないので、窓を閉じる処理（`summonFast` の POINT、あるいは engine/30 の
   `closeStaleSummonTimingS03`）が一度も走らず、再開した側だけ「召喚成功タイミング」が開いたまま
   メインフェイズに戻っていた。実測トレースでは、再開の内側で NORMAL_SUMMON が再生されて窓が開き、
   `offerResumeDuel` を抜けた直後の `getLegalZoneActions` がその窓を見ていた。
   修正: `offerResumeDuel` の末尾（待ち状態の積み直しより後、`render()` より前）で同じ閉じ手を呼ぶ。
   待ち状態を積み直した場合は `closeStaleSummonTimingS03` のガード（paused / processorWaiting / キュー /
   遅延イベント / チェーン / 選択待ち）が閉じるのを防ぐので、《魔導戦士 ブレイカー》の誘発のために
   窓を戻す経路（`restoreProcessorAfterLoadS296`）は壊れない。
   計測: 同 seed で 保存なし 0 件 / `R1_SAVELOAD=1` 6 件 → **どちらも 0 件**。 */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function tw(){return gameState.timingWindow?JSON.stringify(gameState.timingWindow):'null';}
function twKind(){return gameState.timingWindow?gameState.timingWindow.kind:null;}
function gadgetOffered(){const t=timingCheck(CARD_SCRIPTS['グリーン・ガジェット']);return !!(t&&t.ok);}
let OPENED=[];
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}}
function fresh(){resetA();resetVolatile();OPENED=[];
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4890011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function savedRaw(){localStorage.removeItem(DUEL_SAVE_KEY);saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
function loadInto(raw){resetA();resetVolatile();OPENED=[];localStorage.setItem(DUEL_SAVE_KEY,raw);return offerResumeDuel();}
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summon';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){OPENED.push((w.payload&&w.payload.kind)||'?');pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  return null;}
function drive(until){for(let i=0;i<800;i++){
  if(until&&!pc()&&until())return 'until';
  if(pc()){__choicePickV49(0);continue;}
  if(!step())return 'idle';}return 'loop';}
/* 「Journal 再生が窓を開き直す」状況を、再生と同じ場所（待ち状態の積み直しの直後）で再現する。
   実機では v41RestoreJournalPackage / recoverInterruptedResolutionAfterLoadS296 が Action を適用し直して
   updateTimingWindow を走らせるが、試験では同じ時点で窓を開くことで同じ状態を作る。 */
function simulateReplayReopen(){
  const f=restoreProcessorAfterLoadS296;
  restoreProcessorAfterLoadS296=function(){ const r=f.apply(this,arguments); updateTimingWindow(gameState,{type:'NORMAL_SUMMON'}); return r; };
  return ()=>{ restoreProcessorAfterLoadS296=f; };
}
/* 普通の通常召喚を済ませて、開いたメインフェイズで落ち着いた状態を作る */
function settledAfterSummon(){
  fresh();
  const m=mk('ワイト',0);gameState.players[0].hand=[m,mk('グリーン・ガジェット',0)];
  baselineA();
  doNormalSummon(0,'atk');
  drive();
  return m;
}
`;

/* ================= VM1: 召喚後に落ち着いた局面を保存する ================= */
const first=harness(COMMON+String.raw`
const m=settledAfterSummon();
ok('VM1 前提: 通常召喚が成立している',z(m)==='mz',z(m));
ok('VM1 前提: 開いたメインフェイズで窓は閉じている（S03-U486）',twKind()===null&&gameState.phase==='main1',tw());
ok('VM1 前提: 「召喚に成功した時」のカードは発動できない',!gadgetOffered(),JSON.stringify(timingCheck(CARD_SCRIPTS['グリーン・ガジェット'])));
globalThis.__SAVE=JSON.stringify({raw:savedRaw(),digest:v41StateDigest(gameState),uid:m.uid});
`);

const SAVE=first.__SAVE;
if(!SAVE){ console.log('FAIL S03-U489 VM1 の保存が作れなかった'); process.exitCode=2; }
else {

/* ===== A. 再開: Journal 再生で窓が開き直っても、再開を抜けた時には閉じている ===== */
harness('const SAVE='+JSON.stringify(SAVE)+';'+COMMON+String.raw`
const S=JSON.parse(SAVE);
const undoPatchS489=simulateReplayReopen();
const loaded=loadInto(S.raw);
undoPatchS489();
ok('A 前提: 保存した局面を再開できた',loaded===true&&gameState.phase==='main1',JSON.stringify({loaded:loaded,phase:gameState.phase}));
ok('A 前提: 再開直後は何も待っていない（開いたメインフェイズ）',
   !gameState.processorPaused&&!gameState.processorWaiting&&!(gameState.processorQueue||[]).length&&!(gameState.chain||[]).length,
   JSON.stringify({paused:gameState.processorPaused,wait:!!gameState.processorWaiting,q:(gameState.processorQueue||[]).length}));
ok('A ★ 再開を抜けた時点で召喚の窓は閉じている（修正前はここが summon のまま残っていた）',twKind()===null,tw());
ok('A ★ したがって「召喚に成功した時」のカードはメニューに出ない',!gadgetOffered(),
   JSON.stringify(timingCheck(CARD_SCRIPTS['グリーン・ガジェット'])));
ok('A: 再開した盤面は保存した盤面と一致する（窓は digest に含まれないので影響しない）',
   v41StateDigest(gameState)===S.digest,v41StateDigest(gameState)+' vs '+S.digest);
`);

/* ===== B. Negative control: 閉じ手を外すと、再開した側だけ窓が残る ===== */
harness('const SAVE='+JSON.stringify(SAVE)+';'+COMMON+String.raw`
const S=JSON.parse(SAVE);
closeStaleSummonTimingS03=function(){};   /* S03-U486 / S03-U489 の閉じ手が無い状態 */
const undoPatchS489=simulateReplayReopen();
loadInto(S.raw);
undoPatchS489();
ok('B negative control: 閉じ手が無いと、再開を抜けた時に召喚の窓が残る（これが直した欠陥）',
   twKind()==='summon',tw());
ok('B negative control: その結果「召喚に成功した時」のカードがメニューに出てしまう（保存していない側では出ない）',
   gadgetOffered(),JSON.stringify(timingCheck(CARD_SCRIPTS['グリーン・ガジェット'])));
`);

/* ===== C. 配線の固定 ===== */
harness(COMMON+String.raw`
const src=String(offerResumeDuel);
ok('C: offerResumeDuel が閉じ手を呼んでいる',/closeStaleSummonTimingS03\s*\(\s*true\s*\)/.test(src),'');
ok('C: 呼ぶ位置は「待ち状態の積み直し」より後、render() より前',
   src.indexOf('restoreProcessorAfterLoadS296') < src.indexOf('closeStaleSummonTimingS03')
   && src.indexOf('closeStaleSummonTimingS03') < src.lastIndexOf('render()'),
   JSON.stringify({restore:src.indexOf('restoreProcessorAfterLoadS296'),closer:src.indexOf('closeStaleSummonTimingS03'),render:src.lastIndexOf('render()')}));
ok('C: 読み込み直後の破棄（v3.2 以前の古い窓）も残っている（二重の防御）',
   /\['summon','flip','summonFast','flipFast'\]\.includes\(gameState\.timingWindow\.kind\)/.test(src),'');
`);

}

/* ===== D. 非回帰: 誘発の窓で保存した場合は、戻した窓を閉じない ===== */
const second=harness(COMMON+String.raw`
/* 《魔導戦士 ブレイカー》の召喚誘発は召喚の窓を読む。その窓が開いている状態で保存する */
fresh();
const br=mk('魔導戦士 ブレイカー',0);gameState.players[0].hand=[br];
gameState.players[1].sz=[mk('聖なるバリア －ミラーフォース－',1,'down')];
baselineA();
doNormalSummon(0,'atk');
/* 誘発の選択窓（SEGOC）が開くまで進める */
let guard=0;
while(guard++<200){ if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE) break; if(pc()){__choicePickV49(0);continue;} if(!step())break; }
ok('D 前提: 召喚誘発の選択窓が開いている',(typeof EVT_V2_STATE!=='undefined'&&!!EVT_V2_STATE),String(!!EVT_V2_STATE));
ok('D 前提: その時点で召喚の窓は開いている（ブレイカーの誘発が読む）',twKind()==='summon',tw());
globalThis.__SAVE2=JSON.stringify({raw:savedRaw(),uid:br.uid});
`);

const SAVE2=second.__SAVE2;
if(!SAVE2){ console.log('FAIL S03-U489 VM1(D) の保存が作れなかった'); process.exitCode=2; }
else harness('const SAVE2='+JSON.stringify(SAVE2)+';'+COMMON+String.raw`
const S=JSON.parse(SAVE2);
const loaded=loadInto(S.raw);
ok('D 前提: 誘発の窓ごと再開できた',loaded===true,String(loaded));
ok('D ★ 待ち状態を積み直した場合は、戻した召喚の窓を閉じない（ガードが働く）',
   twKind()==='summon'||(typeof EVT_V2_STATE!=='undefined'&&!!EVT_V2_STATE),
   JSON.stringify({tw:tw(),paused:gameState.processorPaused,wait:gameState.processorWaiting&&gameState.processorWaiting.type,evt:(typeof EVT_V2_STATE!=='undefined'&&!!EVT_V2_STATE)}));
drive();
ok('D: 誘発は解決し、ブレイカーは場にいる',z({uid:S.uid})==='mz',z({uid:S.uid}));
ok('D: 解決後は窓が閉じている',twKind()===null,tw());
`);
