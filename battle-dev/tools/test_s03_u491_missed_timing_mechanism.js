/* S03-U491: 「タイミングを逃す」の共通機構（engine/1ZZX_missed_timing_s03.js）。
   設計と当時裁定の根拠は docs/S03_MISSED_TIMING_DESIGN.md、裁定の抽出は docs/S03_MISSED_TIMING_RULINGS.md（123 件）。
   機構は 3 つ:
     (A) gameState.procStepS03 — 最上位の applyAction 1 回を 1 ステップ。帳簿・提示・掃除の Action は進めない
     (B) MISSED_TIMING_DECL_S03 — カードごとの宣言。**本単位では 0 件**なので対局の挙動は変わらない
     (C) filterMissedTimingS03 — 判定は collectHandlers（engine/40）の 1 箇所だけ
   当時裁定の対応:
     R1 強制誘発は逃さない / R2 任意誘発は後に別の処理があると逃す / R3 チェーン2以上は逃す（R2・R4 の帰結）
     R4 判定軸は「最後に行われた処理か」。同時に行われた処理は互いを逃させない / R5 例外カードは逃さない
   実対局の経路は《光帝クライス》（破壊 → その後ドロー）で作る。
   当時裁定 WIKI-378544C74049《砂塵の大竜巻》08/05/30「破壊が条件の任意効果はタイミングを逃す」と同じ形で、
   破壊された《闇・道化師のペーテン》の「墓地へ送られた時…できる」が、ドローの処理のあとでは逃す。
   宣言は**試験の中だけ**で入れる（出荷する宣言は 0 件のまま）。 */
const harness = require('./astra_harness');

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
let COLLECT=[];
const COLLECT_ORIG_S491=collectHandlers;
(function(){const f=collectHandlers;collectHandlers=function(n,e){const r=f.apply(this,arguments);
  COLLECT.push({ev:n,stamp:e&&e.stepS03,now:gameState.procStepS03|0,names:r.map(x=>x.name)});return r;};})();
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}}
function fresh(){resetA();resetVolatile();COLLECT=[];resetMissedTimingDropsS03();
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4910011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summon';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();return 'flush';}
  return null;}
function drive(until){for(let i=0;i<800;i++){
  if(until&&!pc()&&until())return 'until';
  if(pc()){__choicePickV49(0);continue;}
  if(!step())return 'idle';}return 'loop';}
function driveToChoice(){for(let i=0;i<800;i++){if(pc())return 'choice';if(!step())return 'idle';}return 'loop';}
/* 刻みの付いた遅延イベントが積まれた瞬間（＝判定がまだ残っている解決の途中）で止める */
function driveToStamped(){for(let i=0;i<800;i++){
  if((gameState.deferredEvents||[]).some(x=>x&&x.evt&&x.evt.stepS03!=null))return 'stamped';
  if(pc()){__choicePickV49(0);continue;}
  if(!step())return 'idle';}return 'loop';}
function savedRaw(){localStorage.removeItem(DUEL_SAVE_KEY);saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
function loadInto(raw){resetA();resetVolatile();COLLECT=[];resetMissedTimingDropsS03();
  localStorage.setItem(DUEL_SAVE_KEY,raw);return offerResumeDuel();}
/* 《光帝クライス》を特殊召喚し、その誘発で相手の《闇・道化師のペーテン》を破壊する盤面 */
function kraisBoard(){fresh();
  const kr=mk('光帝クライス',0);gameState.players[0].hand=[kr];
  const pe=mk('闇・道化師のペーテン',1);gameState.players[1].mz=[pe];
  const spare=mk('闇・道化師のペーテン',1);gameState.players[1].hand=[spare];
  baselineA();
  return {kr:kr.uid,pe:pe.uid,spare:spare.uid};}
function kraisSummon(){
  act({type:'FX_SPECIAL_SUMMON',player:0,from:'hand',fromIndex:0,pos:'atk',reason:'S03-U491 fixture'});
  const h=findCardByUid(gameState.players[0].mz[0]&&gameState.players[0].mz[0].uid);
  queueSpecialSummonSuccessV2(0,(h&&h.card)||gameState.players[0].mz[0],'effect');
  flushDeferredEventsV2();}
function declarePeten(){MISSED_TIMING_DECL_S03['闇・道化師のペーテン']={mode:'miss',ruling:'WIKI-378544C74049'};}
function collectOf(ev,name){return COLLECT.filter(c=>c.ev===ev&&c.names.indexOf(name)>=0);}
function petenCollect(){return COLLECT.filter(c=>c.ev==='onSendToGrave'&&c.stamp!=null&&c.stamp!==c.now);}
`;

/* ===== A. 処理番号 =====
   S03-U492 で (A) を拒否リストから**許可リスト**に作り直した（漏れが「誤って逃す」側に落ちていた）。
   ここはその新しい機構を固定する。詳細は tools/test_s03_u492_missed_timing_summon_success.js。 */
harness(COMMON + String.raw`
fresh();
const m=mk('ワイト',0);gameState.players[0].hand=[m];baselineA();
const s0=gameState.procStepS03|0;
act({type:'NORMAL_SUMMON',player:0,handIndex:0,pos:'atk'});
ok('A ★ 処理の act() 1 回で番号が 1 だけ進む（入れ子の Action では進まない）',
   (gameState.procStepS03|0)===s0+1,JSON.stringify({before:s0,after:gameState.procStepS03|0}));
const s1=gameState.procStepS03|0;
act({type:'EVENT_QUEUE_V31',item:{eventName:'onDummyS491',evt:{}}});
ok('A ★ 帳簿の Action（EVENT_QUEUE_V31）は番号を進めない',
   (gameState.procStepS03|0)===s1,JSON.stringify({before:s1,after:gameState.procStepS03|0}));
act({type:'SET_PRIORITY',player:0});
ok('A: 優先権の設定も番号を進めない',(gameState.procStepS03|0)===s1,String(gameState.procStepS03|0));
act({type:'DRAW',player:0,n:1});
ok('A: 次の処理でまた 1 だけ進む',(gameState.procStepS03|0)===s1+1,String(gameState.procStepS03|0));
ok('A ★ 許可表には盤面を変える Action が入っている',
   ['NORMAL_SUMMON','FX_SPECIAL_SUMMON','DRAW','FX_TO_GRAVE','FX_BANISH','LP','ATTACK','MOVE']
   .every(t=>missedTimingIsProcessingS03({type:t})),'');
ok('A ★ 帳簿・提示・進行・掃除の Action は許可表に無い（表に無いものは進めない＝逃さない）',
   ['EVENT_QUEUE_V31','EVENT_DEQUEUE_V31','CHAIN_ADD','CHAIN_RESOLVE_TOP','CHOICE_OPEN_V49',
    'PREP_TX_BEGIN_S03','SUMMON_WINDOW_OPEN_V42','MOD_CLEAR','SET_PRIORITY','SET_PHASE',
    'SPECIAL_WIN_DEFER_S03','NORMAL_SUMMON_ATTEMPT','SHUFFLE']
   .every(t=>!missedTimingIsProcessingS03({type:t})),'');
ok('A: applyAction は最上位の適用でだけ番号を進める（engine/00 の配線）',
   /APPLY_ACTION_DEPTH_V31===1 && typeof missedTimingBeginS03==='function'/.test(String(applyAction)),'');
`, {expect:7});

/* ===== B. 判定（宣言・強制・同一ステップ・刻みなし） ===== */
harness(COMMON + String.raw`
fresh();
const pe=mk('闇・道化師のペーテン',1);gameState.players[1].grave=[pe];baselineA();
gameState.procStepS03=10;
const cand={name:'闇・道化師のペーテン',p:1,zone:'grave',index:0,card:pe,eventName:'onSendToGrave',event:{}};
ok('B ★ 宣言も種別も無い発動は、処理が進んでいても落とさない（召喚成功以外のイベント）',
   missedTimingModeS03('闇・道化師のペーテン')===null
   && missedTimingClassS03(cand,{stepS03:4})===null
   && missedTimingDropS03(cand,{stepS03:4})===false,'');
declarePeten();
ok('B ★ 宣言したカードの任意誘発は、後に別の処理があると落とす（R2）',
   missedTimingDropS03(cand,{stepS03:4})===true,'');
ok('B ★ 同じステップのままなら落とさない（R4「最後に行われた処理」）',
   missedTimingDropS03(cand,{stepS03:10})===false,'');
ok('B ★ 刻みの無いイベント（emitEvent の直接呼び出し・古い保存）は判定しない',
   missedTimingDropS03(cand,{})===false && missedTimingDropS03(cand,{stepS03:null})===false,'');
MISSED_TIMING_DECL_S03['闇・道化師のペーテン']={mode:'never',ruling:'test'};
ok('B ★ never と宣言した例外カードは落とさない（R5）',
   missedTimingDropS03(cand,{stepS03:4})===false,'');
delete MISSED_TIMING_DECL_S03['闇・道化師のペーテン'];
/* R1: 強制誘発は落とさない。強制かどうかは既存の triggerCandidateForcedS03（S03-U44）で決める */
declarePeten();
const f=triggerCandidateForcedS03;
triggerCandidateForcedS03=function(){return true;};
ok('B ★ 強制誘発は宣言があっても落とさない（R1）',
   missedTimingDropS03(cand,{stepS03:4})===false,'');
triggerCandidateForcedS03=f;
ok('B 前提: 強制判定は既存の共通処理を使っている（自前で持っていない）',
   /triggerCandidateForcedS03/.test(String(missedTimingDropS03)),'');
ok('B: 判定は collectHandlers の戻り値で行われている（engine/40 の 1 箇所）',
   /filterMissedTimingS03\(out, *evt\|\|\{\}\)/.test(String(COLLECT_ORIG_S491)),'');
const kept=filterMissedTimingS03([cand,{name:'ワイト',p:0,eventName:'onSendToGrave',event:{}}],{stepS03:4});
ok('B: 落とすのは該当候補だけで、ほかの候補は残る',
   kept.length===1 && kept[0].name==='ワイト' && MISSED_TIMING_DROPS_S03.length===1,
   JSON.stringify({kept:kept.map(x=>x.name),drops:MISSED_TIMING_DROPS_S03.length}));
`, {expect:9});

/* ===== C. 刻み（queueDeferredEventV2）と digest ===== */
harness(COMMON + String.raw`
fresh();
const m=mk('ワイト',0);gameState.players[0].hand=[m];baselineA();
act({type:'NORMAL_SUMMON',player:0,handIndex:0,pos:'atk'});
const stepNow=gameState.procStepS03|0;
gameState.deferredEvents=[];
queueDeferredEventV2('onTestS491',{player:0});
ok('C ★ 積んだ遅延イベントに、そのときの処理ステップが刻まれる',
   gameState.deferredEvents.length===1 && gameState.deferredEvents[0].evt.stepS03===stepNow,
   JSON.stringify(gameState.deferredEvents));
act({type:'DRAW',player:0,n:1});
queueDeferredEventV2('onTestS491',{player:0});
ok('C ★ 別の act() で積んだものは別のステップ、同じ act() で積んだものは同じステップになる（R4）',
   gameState.deferredEvents[1].evt.stepS03===stepNow+1,
   JSON.stringify(gameState.deferredEvents.map(x=>x.evt.stepS03)));
/* digest: deferredEvents は v41StateDigest に入っているので、刻みの違いは digest に出る */
const d1=v41StateDigest(gameState);
gameState.deferredEvents[0].evt.stepS03=stepNow+99;
const d2=v41StateDigest(gameState);
ok('C ★ 刻みが違えば digest も違う（保存・再開・Replay で判定が食い違わない）',
   d1!==d2,JSON.stringify({d1,d2}));
ok('C: 刻みは EVENT_QUEUE_V31 の payload にも入るので Journal 再生で再現される',
   /safe\.stepS03=\(typeof missedTimingStampS03==='function'\)/.test(String(queueDeferredEventV2)),'');
`, {expect:4});

/* ===== D. 実対局の経路（宣言なし＝現状維持 / 宣言あり＝逃す）と保存 ===== */
const first = harness(COMMON + String.raw`
/* D1: 宣言なし — 今までどおり《闇・道化師のペーテン》の誘発が働く */
let U=kraisBoard();
kraisSummon();
drive();
ok('D1 前提: 《光帝クライス》の誘発で相手の《闇・道化師のペーテン》が破壊され、その後にドローの処理がある',
   petenCollect().length>0,JSON.stringify(COLLECT.filter(c=>c.ev==='onSendToGrave').map(c=>[c.stamp,c.now])));
ok('D1 ★ 宣言が無いので誘発は落とされず、ペーテンは自身を除外して控えを特殊召喚する（現状維持）',
   zu(U.pe)==='banish' && zu(U.spare)==='mz' && MISSED_TIMING_DROPS_S03.length===0,
   JSON.stringify({pe:zu(U.pe),spare:zu(U.spare),drops:MISSED_TIMING_DROPS_S03.length}));
ok('D1: 《光帝クライス》自身の召喚成功誘発は、同じステップなので落ちない（R4）',
   collectOf('onSpecialSummon','光帝クライス').some(c=>c.stamp===c.now),
   JSON.stringify(collectOf('onSpecialSummon','光帝クライス').map(c=>[c.stamp,c.now])));

/* D2: 宣言あり — 当時裁定どおり逃す */
declarePeten();
U=kraisBoard();
kraisSummon();
drive();
ok('D2 ★ 宣言すると誘発が落ち、ペーテンは墓地に残り控えも出てこない（WIKI-378544C74049 と同じ形）',
   zu(U.pe)==='grave' && zu(U.spare)==='hand',JSON.stringify({pe:zu(U.pe),spare:zu(U.spare)}));
ok('D2 ★ 落とした記録に、条件が満たされたステップと判定時のステップが残る',
   MISSED_TIMING_DROPS_S03.length===1
   && MISSED_TIMING_DROPS_S03[0].name==='闇・道化師のペーテン'
   && MISSED_TIMING_DROPS_S03[0].stepS03 < MISSED_TIMING_DROPS_S03[0].nowS03,
   JSON.stringify(MISSED_TIMING_DROPS_S03));
const AUDIT=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('D2: Replay 監査が全 digest と最終状態を再現する',
   AUDIT.ok && AUDIT.finalDigest===v41StateDigest(gameState),JSON.stringify(AUDIT).slice(0,160));

/* D3: 同じ盤面で、ドローの問いかけが開いた時点まで進めて保存する */
U=kraisBoard();
kraisSummon();
const atStop=driveToStamped();
globalThis.__U491={U, save:savedRaw(), stop:(gameState.deferredEvents||[]).some(x=>x&&x.evt&&x.evt.stepS03!=null),
  stepAtSave:gameState.procStepS03|0, digestAtSave:v41StateDigest(gameState),
  deferred:JSON.parse(JSON.stringify(gameState.deferredEvents||[]))};
ok('D3 前提: 保存した時点で、刻みの付いた遅延イベントがまだ残っている（解決の途中で止めている）',
   globalThis.__U491.stop && atStop==='stamped',
   JSON.stringify({atStop,deferred:globalThis.__U491.deferred.map(x=>[x.eventName,x.evt&&x.evt.stepS03])}));
drive();
globalThis.__U491.finalNoSave={pe:zu(U.pe),spare:zu(U.spare),
  step:gameState.procStepS03|0, digest:v41StateDigest(gameState),
  drops:JSON.parse(JSON.stringify(MISSED_TIMING_DROPS_S03))};
ok('D3 ★ 保存せず最後まで進めた側でも、宣言どおり誘発は落ちている',
   globalThis.__U491.finalNoSave.pe==='grave' && globalThis.__U491.finalNoSave.drops.length===1,
   JSON.stringify(globalThis.__U491.finalNoSave));
`, {expect:8});

/* ===== E. 新しい VM で再開しても同じ判定・同じ digest（保存・再開・Replay の回帰） ===== */
const H = first.__U491;
harness('const SAVED=' + JSON.stringify(H.save) + ';const REF=' + JSON.stringify(H.finalNoSave)
  + ';const U=' + JSON.stringify(H.U) + ';const DEFERRED=' + JSON.stringify(H.deferred)
  + ';const STEP_AT_SAVE=' + H.stepAtSave + ';const DIGEST_AT_SAVE=' + JSON.stringify(H.digestAtSave) + ';'
  + COMMON + String.raw`
declarePeten();
ok('E 前提: 保存に、条件が満たされたステップを刻んだ遅延イベントが入っている',
   DEFERRED.some(x=>x.evt&&x.evt.stepS03!=null),JSON.stringify(DEFERRED).slice(0,200));
loadInto(SAVED);
ok('E ★ 再開した直後の処理ステップが、保存した時点と一致する',
   (gameState.procStepS03|0)===STEP_AT_SAVE,JSON.stringify({now:gameState.procStepS03|0,saved:STEP_AT_SAVE}));
ok('E ★ 再開した直後の遅延イベントの刻みが、保存した時点と一致する（判定の材料が失われていない）',
   JSON.stringify((gameState.deferredEvents||[]).map(x=>[x.eventName,x.evt&&x.evt.stepS03]))
   ===JSON.stringify(DEFERRED.map(x=>[x.eventName,x.evt&&x.evt.stepS03])),
   JSON.stringify({now:(gameState.deferredEvents||[]).map(x=>[x.eventName,x.evt&&x.evt.stepS03]),
                   saved:DEFERRED.map(x=>[x.eventName,x.evt&&x.evt.stepS03])}));
drive();
ok('E ★ 再開して進めても、保存なしの側と同じ判定になる（誘発が落ちる）',
   zu(U.pe)===REF.pe && zu(U.spare)===REF.spare && MISSED_TIMING_DROPS_S03.length===REF.drops.length,
   JSON.stringify({pe:zu(U.pe),spare:zu(U.spare),drops:MISSED_TIMING_DROPS_S03.length,ref:REF}));
ok('E ★ 最終の処理ステップも保存なしの側と一致する',
   (gameState.procStepS03|0)===REF.step,JSON.stringify({now:gameState.procStepS03|0,ref:REF.step}));
ok('E ★ 最終の digest も保存なしの側と一致する',
   v41StateDigest(gameState)===REF.digest,
   JSON.stringify({now:v41StateDigest(gameState),ref:REF.digest}));
const A=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('E: 再開後の Replay 監査も全 digest と最終状態を再現する',
   A.ok && A.finalDigest===v41StateDigest(gameState),JSON.stringify(A).slice(0,160));
`, {expect:7});

/* ===== F. negative control ===== */
harness(COMMON + String.raw`
/* F1: 判定を素通りにすると、宣言していても誘発が落ちない（＝本単位より前の挙動） */
declarePeten();
filterMissedTimingS03=function(c){return c;};
let U=kraisBoard();
kraisSummon();
drive();
ok('F negative control: 判定を素通りにすると、宣言していても誘発は落ちない（修正前の挙動）',
   zu(U.pe)==='banish' && zu(U.spare)==='mz',JSON.stringify({pe:zu(U.pe),spare:zu(U.spare)}));
`, {expect:1});

harness(COMMON + String.raw`
/* F2: 刻みを外すと判定そのものが働かない（刻みが必要であることの確認） */
declarePeten();
const q=queueDeferredEventV2;
queueDeferredEventV2=function(n,e){const r=q.apply(this,arguments);
  (gameState.deferredEvents||[]).forEach(x=>{if(x&&x.evt)delete x.evt.stepS03;});return r;};
let U=kraisBoard();
kraisSummon();
drive();
ok('F negative control: 刻みが無いと判定は働かない（誘発は落ちない）',
   zu(U.pe)==='banish' && MISSED_TIMING_DROPS_S03.length===0,
   JSON.stringify({pe:zu(U.pe),drops:MISSED_TIMING_DROPS_S03.length}));
`, {expect:1});

/* ===== G. 本単位であわせて直した集計の誤り（「タイミングを逃す」とは別件） =====
   scripts/finish-work.ps1 は PASS / FAIL を大文字小文字を区別せず行のどこでも拾う正規表現で数えていたため、
   日本語の判定文の中にある英単語 "FAIL" を失敗として数えていた（S03-U490 の試験でこの偽の件数が 6 になった。
   ゲート本体の行頭 FAIL は 0）。ゲートの規約と同じ「行頭・大文字小文字を区別」で数えるようにし、
   緩い件数は別の数字として残した（隠さない）。
   VM の中には require が無いので、ファイルは node 側で読んで判定結果だけ渡す。 */
const FW = require('fs').readFileSync(
  require('path').resolve(__dirname, '..', '..', 'scripts', 'finish-work.ps1'), 'utf8');
/* PowerShell 側の文字列には \b が literal で入っているので、正規表現では \\b と書く */
const G_ANCHORED = /Pattern '\^PASS\\b' -CaseSensitive/.test(FW) && /Pattern '\^FAIL\\b' -CaseSensitive/.test(FW);
const G_LOOSE_KEPT = /\$failAnywhere/.test(FW) && /in-line mentions, not failures/.test(FW);
const G_OLD_GONE = !/Pattern '\\bPASS\\b'\)/.test(FW) && !/Pattern '\\bFAIL\\b'\)/.test(FW);
harness('const G=' + JSON.stringify([G_ANCHORED, G_LOOSE_KEPT, G_OLD_GONE]) + ';' + String.raw`
ok('G: finish-work.ps1 は PASS / FAIL を行頭・大文字小文字を区別して数える',G[0],'');
ok('G: 緩い件数（行のどこでも）は別の数字として残っている',G[1],'');
ok('G: 以前の行のどこでも拾う数え方は残っていない',G[2],'');
`, {expect:3});
