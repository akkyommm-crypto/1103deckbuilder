/* S03-U500: 効果によるデュアル再召喚（「もう1度召喚」、GEMINI_SUMMON_S03）にも召喚無効の窓を開く単位。
   S03-U498 で入れた機構（`engine/1ZZY_summon_negation_window_s03.js`、許可リスト）の 3 件目の呼び出し元で、
   《デュアル・サモナー》のもう一方の枝。設計は docs/S03_MISSED_TIMING_DESIGN.md の (D) と 5-a #1-h。

   S03-U499 でこの枝の**処理順は手札の枝と同じ**（`onNormalSummon` を `procStepS03` 2・chain 0 で積む）と
   実測済みで、残っていたのは**取り消しの形**だけだった:
     ・手札からの召喚 … そのモンスターは場に届いていないので `MOVE` で墓地へ送る（S03-U498）
     ・デュアル再召喚 … そのモンスターは召喚の**前から場に居る**ので、UI 起点の窓（`geminiSummonResumeS03`、
       `engine/1ZI`）と同じく `FX_TO_GRAVE byDestroy` で破壊する
   この単位はその違いを入れて固定する。

   根拠:
     ・`WIKI-2CF23AA42E79`（**回答日 2011-08-25**）の「この効果による通常召喚」。
     ・デュアル再召喚が通常召喚扱いであること自体は `WIKI-5B32D377CFE9`（**回答日なし**、
       《E・HERO アナザー・ネオス》）「再度召喚は通常召喚扱いのため…」。
     ・**再度召喚に対する召喚無効そのものの裁定は裁定 DB に無い。** ただしエンジンは UI 起点の
       デュアル召喚に対して**すでに窓を開いており**（`doGeminiSummonS03`、S03-U119）、この単位は
       その既存の扱いに効果経由の枝を揃えるものである。

   固定するもの:
     A 窓が開く（ラベルと再開データ）
     B 無効にしたときは**破壊**で取り消す（手札の枝の `MOVE` との違い）
     C 通したときは再召喚が成立する
     D **negative control**: 召喚無効が場に無ければ Action は増えない
     E **negative control**: UI 起点のデュアル召喚の窓は変えていない
     F Save/Load を別 VM で跨ぐ ＋ Replay
     G 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S500 = pathA.resolve(__dirname, '..');
const rdS500 = p => fsA.readFileSync(pathA.join(ROOT_S500, p), 'utf8');
const SRC_S500 = {
  'docs/S03_MISSED_TIMING_DESIGN.md': rdS500('docs/S03_MISSED_TIMING_DESIGN.md'),
  'engine/1ZZY_summon_negation_window_s03.js': rdS500('engine/1ZZY_summon_negation_window_s03.js'),
  'engine/1ZI_gemini_s03.js': rdS500('engine/1ZI_gemini_s03.js'),
  'cards/HZK_claude_s03_u164_dual_summoner.js': rdS500('cards/HZK_claude_s03_u164_dual_summoner.js'),
  'tools/check.py': rdS500('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function s(){return gameState.procStepS03|0;}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function cardOf(uid){const h=findCardByUid(uid);return h?h.card:null;}
function graveCard(p,uid){return (gameState.players[p].grave||[]).find(c=>c&&c.uid===uid)||null;}
let STEPS=[], OPENS=[], QLOG=[], WINS=[];
(function(){
  const so=summonNegWindowOpenS03;summonNegWindowOpenS03=function(q,n){
    const r=so.apply(this,arguments);OPENS.push({opened:r,step:s()});return r;};
  const bw=beginSummonWindowV2;beginSummonWindowV2=function(pending){
    WINS.push({label:pending&&pending.label,gemini:!!(pending&&pending.geminiS03),
      resolved:!!(pending&&pending.resolvedSummonS03)});return bw.apply(this,arguments);};
  const h=applyAction;applyAction=function(gs,a){const d=APPLY_ACTION_DEPTH_V31;
    try{return h.apply(this,arguments);}finally{
      if(d===0)STEPS.push({t:(a&&a.type)||'?',byDestroy:!!(a&&a.byDestroy),reason:(a&&a.reason)||''});}};
  /* 応答できるカードが無いと emitEvent は呼ばれないので、「何が起きたか」は積まれた方で見る */
  const qd=queueDeferredEventV2;queueDeferredEventV2=function(name,evt){
    QLOG.push({name,uid:(evt&&evt.uid)!=null?evt.uid:((evt&&evt.card&&evt.card.uid)!=null?evt.card.uid:null)});
    return qd.apply(this,arguments);};
})();
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}}
function fresh(){resetA();resetVolatile();STEPS=[];OPENS=[];QLOG=[];WINS=[];TOASTS.length=0;resetMissedTimingDropsS03();
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function setTrap(nm,p){const c=mk(nm,p,'down');c.setTurn=gameState.turn-1;return c;}
function actTypes(){return STEPS.map(x=>x.t);}
function savedRaw(){localStorage.removeItem(DUEL_SAVE_KEY);saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
function loadInto(raw){resetA();resetVolatile();STEPS=[];OPENS=[];QLOG=[];WINS=[];resetMissedTimingDropsS03();
  localStorage.setItem(DUEL_SAVE_KEY,raw);return offerResumeDuel();}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,160));}
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summon';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();return 'flush';}
  return null;}
function drive(){for(let i=0;i<900;i++){if(pc()){__choicePickV49(0);continue;}if(!step())return 'idle';}return 'loop';}
function driveToWindow(){for(let i=0;i<900;i++){
  if(gameState.pendingSummon&&!gameState.chain.length&&gameState.pendingSummon.resolvedSummonS03) return 'window';
  if(pc()){__choicePickV49(0);continue;}
  if(!step()) return 'idle';}
  return 'loop';}
function negateInWindow(name){const ps=gameState.pendingSummon;if(!ps)return 'no-window';
  const list=summonNegatorsV2(ps),hit=list.find(x=>x.db.n===name);
  if(!hit)return 'not-offered:'+JSON.stringify(list.map(x=>x.db.n));
  activateSummonNegatorV2(hit.p,hit.zone,hit.index);drive();return 'done';}
/* 盤面: p0 のエンドフェイズに p1 が《デュアル・サモナー》を発動し、場の《デュアル・ソルジャー》を
   もう1度召喚する（手札は空にしておくので、候補はこの 1 体だけ）。 */
function gemBoard(o){
  fresh();
  const opt=o||{};
  gameState.phase='end';
  gameState.activePlayer=0;
  const src=mk('デュアル・サモナー',1,'up'), dual=mk('デュアル・ソルジャー',1,'up');
  gameState.players[1].mz=[src,dual];
  gameState.players[1].hand=[];
  const ids={src:src.uid,dual:dual.uid};
  gameState.players[0].sz=(opt.negators||[]).map(nm=>{const c=setTrap(nm,0);ids[nm]=c.uid;return c;});
  baselineA();
  return ids;}
/* 手札からの召喚の盤面（取り消しの形を並べて比べるため） */
function handBoard(o){
  fresh();
  const opt=o||{};
  gameState.phase='end';
  gameState.activePlayer=0;
  const src=mk('デュアル・サモナー',1,'up');
  gameState.players[1].mz=[src];
  const mon=mk('デュアル・ソルジャー',1);
  gameState.players[1].hand=[mon];
  const ids={src:src.uid,mon:mon.uid};
  gameState.players[0].sz=(opt.negators||[]).map(nm=>{const c=setTrap(nm,0);ids[nm]=c.uid;return c;});
  baselineA();
  return ids;}
`;

/* ===== A. 窓が開く ===== */
harness(COMMON + String.raw`
const ids=gemBoard({negators:['神の宣告']});
duelActivateFromZone(1,'mz',0);
const to=driveToWindow();
ok('A1 ★ 効果によるデュアル再召喚でも窓が開き、対象は再召喚するモンスターである',
   to==='window' && gameState.pendingSummon.uid===ids.dual
   && gameState.pendingSummon.resolvedSummonS03===true,
   JSON.stringify({to,ps:gameState.pendingSummon}));
ok('A2 ★ 窓のラベルは「もう1度召喚（デュアル）」で、再開データが再召喚の枝だと分かる',
   gameState.pendingSummon.label==='もう1度召喚（デュアル）'
   && gameState.pendingSummon.resumeS03.geminiS03===true,
   JSON.stringify(gameState.pendingSummon));
ok('A3 窓に出るのは p0 の《神の宣告》だけ',
   summonNegatorsV2(gameState.pendingSummon).map(x=>x.db.n).join('/')==='神の宣告',
   JSON.stringify(summonNegatorsV2(gameState.pendingSummon).map(x=>x.db.n)));
ok('A4 ★ 窓は召喚成功のイベントを出す前に開く（この枝でも GEMINI_SUMMON_S03 は適用済み）',
   actTypes().includes('GEMINI_SUMMON_S03') && (cardOf(ids.dual)||{}).dualUp===true
   && (gameState.deferredEvents||[]).some(x=>x.eventName==='onNormalSummon'),
   JSON.stringify({types:actTypes(),def:(gameState.deferredEvents||[]).map(x=>x.eventName)}));
`, {expect:4});

/* ===== B. 無効にしたときは破壊で取り消す ===== */
harness(COMMON + String.raw`
const ids=gemBoard({negators:['神の宣告']});
duelActivateFromZone(1,'mz',0);
ok('B0 前提: 窓が開く', driveToWindow()==='window', 'x');
const r=negateInWindow('神の宣告');
ok('B1 ★ 再召喚は無効になり、モンスターは墓地へ（《デュアル・サモナー》自身は場に残る）',
   r==='done' && zu(ids.dual)==='grave' && zu(ids.src)==='mz',
   JSON.stringify({r,dual:zu(ids.dual),src:zu(ids.src)}));
ok('B2 ★ 取り消しは FX_TO_GRAVE byDestroy（UI 起点の geminiSummonResumeS03 と同じ形）で、MOVE ではない',
   STEPS.some(x=>x.t==='FX_TO_GRAVE' && x.byDestroy===true && x.reason==='もう1度召喚を無効')
   && !actTypes().includes('MOVE'),
   JSON.stringify(STEPS.filter(x=>x.t==='FX_TO_GRAVE'||x.t==='MOVE')));
ok('B3 ★ 破壊なので onDestroy と onSendToGrave が積まれ、墓地の graveInfo にも byDestroy が残る',
   QLOG.some(x=>x.name==='onDestroy'&&x.uid===ids.dual)
   && QLOG.some(x=>x.name==='onSendToGrave')
   && ((graveCard(1,ids.dual)||{}).graveInfo||{}).byDestroy===true,
   JSON.stringify({q:QLOG.map(x=>x.name),g:(graveCard(1,ids.dual)||{}).graveInfo}));
ok('B4 積んであった召喚成功のイベントは落ちている',
   !QLOG.some(x=>x.name==='onNormalSummon'&&x.uid===ids.dual&&false)
   && (gameState.deferredEvents||[]).every(x=>x.eventName!=='onNormalSummon'),
   JSON.stringify((gameState.deferredEvents||[]).map(x=>x.eventName)));
audit('B');
`, {expect:6});

/* 手札の枝との違いを並べて固定する */
harness(COMMON + String.raw`
const ids=handBoard({negators:['神の宣告']});
duelActivateFromZone(1,'mz',0);
ok('B5 前提: 手札からの召喚でも窓が開く', driveToWindow()==='window', 'x');
negateInWindow('神の宣告');
ok('B6 ★ 手札からの召喚の取り消しは MOVE で、onDestroy も onSendToGrave も積まれず graveInfo も残らない'
   +'（デュアル再召喚との違い。そのモンスターは場に届いていない）',
   actTypes().includes('MOVE') && !actTypes().includes('FX_TO_GRAVE')
   && !QLOG.some(x=>x.name==='onDestroy') && !QLOG.some(x=>x.name==='onSendToGrave')
   && !((graveCard(1,ids.mon)||{}).graveInfo),
   JSON.stringify({types:actTypes().filter(t=>t==='MOVE'||t==='FX_TO_GRAVE'),q:QLOG.map(x=>x.name)}));
ok('B7 ★ ただし onLeaveField はどちらの枝でも積まれる（v9DetectLeaveField は盤面の差分で検出する。5-a #1-i）',
   QLOG.some(x=>x.name==='onLeaveField'&&x.uid===ids.mon),
   JSON.stringify(QLOG));
audit('B6');
`, {expect:4});

/* ===== C. 通したときは再召喚が成立する ===== */
harness(COMMON + String.raw`
const ids=gemBoard({negators:['神の宣告']});
duelActivateFromZone(1,'mz',0);
ok('C0 前提: 窓が開く', driveToWindow()==='window', 'x');
commitPendingSummonV2(); drive();
ok('C1 何も発動しなければ再召喚は成立する（dualUp のまま場に残る）',
   zu(ids.dual)==='mz' && (cardOf(ids.dual)||{}).dualUp===true && !gameState.pendingSummon,
   JSON.stringify({dual:zu(ids.dual),card:cardOf(ids.dual)}));
ok('C2 ★ 窓を通しても処理番号は進まない（2 のまま）', s()===2, 'step='+s());
audit('C');
`, {expect:4});

/* ===== D. negative control: 召喚無効が場に無い ===== */
harness(COMMON + String.raw`
const ids=gemBoard({});
duelActivateFromZone(1,'mz',0);
const to=drive();
ok('D1 ★ negative control: 召喚無効のカードが無ければ窓は開かず、Action も増えない',
   to==='idle' && !OPENS.some(x=>x.opened===true)
   && !actTypes().includes('SUMMON_WINDOW_OPEN_V42')
   && !actTypes().includes('EVENT_SUMMON_NEG_WINDOW_S03')
   && (cardOf(ids.dual)||{}).dualUp===true,
   JSON.stringify({to,types:actTypes().filter(t=>/SUMMON_WINDOW|SUMMON_NEG/.test(t))}));
audit('D');
`, {expect:2});

/* ===== E. negative control: UI 起点のデュアル召喚は変えていない ===== */
harness(COMMON + String.raw`
fresh();
const dual=mk('デュアル・ソルジャー',0,'up');
gameState.players[0].mz=[dual];
gameState.players[1].sz=[setTrap('神の宣告',1)];
baselineA();
doGeminiSummonS03(0,'mz',0);
ok('E1 ★ negative control: UI 起点のデュアル召喚は今までどおり beginSummonWindowV2 を通り、'
   +'召喚の**前**に窓が開く（resolvedSummonS03 は付かない）',
   WINS.length===1 && WINS[0].gemini===true && WINS[0].resolved===false
   && !actTypes().includes('GEMINI_SUMMON_S03')
   && !OPENS.some(x=>x.opened===true),
   JSON.stringify({WINS,types:actTypes()}));
ok('E2 その窓の pendingSummon は geminiS03 を持ち、resumeS03 に resolvedS03 は無い',
   !!gameState.pendingSummon && gameState.pendingSummon.geminiS03===true
   && gameState.pendingSummon.resumeS03.resolvedS03===undefined,
   JSON.stringify(gameState.pendingSummon));
commitPendingSummonV2(); drive();
ok('E3 UI 起点のデュアル召喚は窓を通すと成立する',
   (cardOf(dual.uid)||{}).dualUp===true, JSON.stringify(cardOf(dual.uid)));
`, {expect:3});

/* ===== F. Save/Load ===== */
const ctxF = harness(COMMON + String.raw`
const ids=gemBoard({negators:['神の宣告']});
duelActivateFromZone(1,'mz',0);
ok('F1 前提: 窓が開いたところで保存する', driveToWindow()==='window', 'x');
globalThis.__SAVED_S500=savedRaw();
globalThis.__AT_S500=JSON.stringify({step:s(),uid:gameState.pendingSummon.uid,
  gemini:gameState.pendingSummon.resumeS03.geminiS03===true,
  waiting:(gameState.processorWaiting||{}).type});
negateInWindow('神の宣告');
globalThis.__WANT_S500=JSON.stringify({dual:zu(ids.dual),step:s(),digest:v41StateDigest(gameState)});
audit('F1');
`, {expect:2});

harness('const AT=' + (ctxF.__AT_S500 || 'null') + ';'
      + 'const WANT=' + (ctxF.__WANT_S500 || 'null') + ';'
      + 'const SAVED=' + JSON.stringify(ctxF.__SAVED_S500 || '') + ';' + COMMON + String.raw`
const okLoad=loadInto(SAVED);
ok('F2 ★ 別の VM で再開しても、デュアル再召喚の窓として戻る（再開データの geminiS03 も残っている）',
   okLoad===true && !!gameState.pendingSummon && gameState.pendingSummon.uid===AT.uid
   && gameState.pendingSummon.resumeS03.geminiS03===AT.gemini && s()===AT.step
   && gameState.processorPaused===true && (gameState.processorWaiting||{}).type===AT.waiting,
   JSON.stringify({okLoad,ps:gameState.pendingSummon,step:s()}));
const dual=gameState.pendingSummon.uid;
negateInWindow('神の宣告');
const got={dual:zu(dual),step:s(),digest:v41StateDigest(gameState)};
ok('F3 ★ 再開した窓から無効にしても、保存しなかった場合と同じ盤面・同じ処理番号・同じ digest になる',
   JSON.stringify(got)===JSON.stringify(WANT), JSON.stringify({got,WANT}));
audit('F3');
`, {expect:3});

/* ===== G. 文書・登録 ===== */
harness('const SRC=' + JSON.stringify(SRC_S500) + ';' + COMMON + String.raw`
const DOC=SRC['docs/S03_MISSED_TIMING_DESIGN.md'], ENG=SRC['engine/1ZZY_summon_negation_window_s03.js'];
ok('G1 ★ engine は枝ごとに取り消しを分けている（デュアル再召喚だけ FX_TO_GRAVE byDestroy）',
   /ps\.resumeS03\.geminiS03\) act\(\{type:'FX_TO_GRAVE'/.test(ENG)
   && /else act\(\{type:'MOVE'/.test(ENG),
   'x');
ok('G2 ★ その形が UI 起点の geminiSummonResumeS03 と同じ理由（破壊で取り消す）だと engine に書いてある',
   /geminiSummonResumeS03/.test(ENG) && /S03-U500/.test(ENG), 'x');
ok('G3 ★ 設計書 5-a #1-h が S03-U500 で実装したことに書き直されている',
   DOC.indexOf('| 1-h |')>=0 && DOC.indexOf('S03-U500')>=0, 'x');
ok('G4 ★ S03-U498 の誤り（「フィールドから離れた時も発動しない」）が #1-i として訂正されている',
   DOC.indexOf('| 1-i |')>=0 && DOC.indexOf('v9DetectLeaveField')>=0, 'x');
ok('G5 カードの両方の枝に印があり、再召喚の枝だけ geminiS03 を併せ持つ',
   SRC['cards/HZK_claude_s03_u164_dual_summoner.js']
     .indexOf("card:now.card, geminiS03:true, byEffectS03:'デュアル・サモナー', summonNegWindowS03:true}")>=0
   && (SRC['cards/HZK_claude_s03_u164_dual_summoner.js'].split('summonNegWindowS03:true}').length-1)===2,
   'x');
ok('G6 UI 起点の窓（engine/1ZI）は変えていない',
   /beginSummonWindowV2\(\{player:p, name:nm, kind:'normal', geminiS03:true/.test(SRC['engine/1ZI_gemini_s03.js'])
   && !/S03-U500/.test(SRC['engine/1ZI_gemini_s03.js']), 'x');
ok('G7 専用テストが tools/check.py に登録されている',
   /test_s03_u500_gemini_resummon_negation_window\.js/.test(SRC['tools/check.py']), 'x');
`, {expect:7});
