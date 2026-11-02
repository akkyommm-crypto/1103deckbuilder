/* S03-U499: 《デュアル・サモナー》の効果による通常召喚にも召喚無効の窓を開く単位。
   S03-U498 で入れた機構（`engine/1ZZY_summon_negation_window_s03.js`、許可リスト）の 2 件目の呼び出し元。
   設計は docs/S03_MISSED_TIMING_DESIGN.md の (D) と 5-a #1-g。

   根拠:
     ・`WIKI-2CF23AA42E79`（**回答日 2011-08-25**、掲載ページ《血の代償》）
       「この効果による通常召喚に対し…召喚を無効にするカードを発動できますか？」
       →「チェーン１で行われているならば、発動可能です。…」
       この答えは「効果による通常召喚」一般の形で書かれている。
     ・このカード自身の召喚無効についての裁定は**無い**（裁定 DB の《デュアル・サモナー》2 件は
       `WIKI-A16DF4FA6D7D` 07/12/22 のリリースの要否と `WIKI-C73F488783A0` 08/06/24 のセットで、
       どちらも召喚無効の話ではない）。S03-U498 が #1-g として「処理順を実測していない」ことを
       理由に印を付けなかったので、**この単位で先に実測してから**印を付けた。

   固定するもの:
     A 実測した処理順（《血の代償》チェーン1 と同じ 2→2 であること）
     B 窓が開き、無効にできる
     C **negative control**: 召喚無効が場に無ければ Action は増えない
     D **negative control**: デュアル再召喚（`GEMINI_SUMMON_S03`）の枝には窓が開かないまま（未対応）
     E リリースを伴う召喚（上級デュアルモンスター）
     F Save/Load を別 VM で跨ぐ ＋ Replay
     G cards/ の**全ファイル**を見て、印の付いた呼び出し元が 2 件だけであることの監査と、文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S499 = pathA.resolve(__dirname, '..');
const rdS499 = p => fsA.readFileSync(pathA.join(ROOT_S499, p), 'utf8');
const DESIGN_S499 = rdS499('docs/S03_MISSED_TIMING_DESIGN.md');
/* cards/ の全ファイル（印の全件監査に使う） */
const CARD_FILES_S499 = fsA.readdirSync(pathA.join(ROOT_S499, 'cards')).filter(f => /\.js$/.test(f)).sort();
const CARD_SRC_S499 = {};
CARD_FILES_S499.forEach(f => { CARD_SRC_S499[f] = rdS499('cards/' + f); });
const SRC_S499 = {
  'cards/HZK_claude_s03_u164_dual_summoner.js': rdS499('cards/HZK_claude_s03_u164_dual_summoner.js'),
  'tools/check.py': rdS499('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function s(){return gameState.procStepS03|0;}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
let STEPS=[], OPENS=[], QUEUED=[], EVLOG=[];
(function(){
  const so=summonNegWindowOpenS03;summonNegWindowOpenS03=function(q,n){
    const before=(q||[]).map(x=>x.eventName+':'+(x.evt&&x.evt.stepS03));
    const r=so.apply(this,arguments);
    OPENS.push({opened:r,step:s(),queue:before});
    return r;};
  const h=applyAction;applyAction=function(gs,a){const d=APPLY_ACTION_DEPTH_V31,b=s();
    try{return h.apply(this,arguments);}finally{
      if(d===0)STEPS.push({t:(a&&a.type)||'?',before:b,after:s(),chain:(gameState.chain||[]).length});}};
  const qd=queueDeferredEventV2;queueDeferredEventV2=function(name,evt){
    QUEUED.push({name,step:s(),chain:(gameState.chain||[]).length,
      mark:!!(evt&&evt.summonNegWindowS03)});
    return qd.apply(this,arguments);};
  const ee=emitEvent;emitEvent=function(name,evt){EVLOG.push(name);return ee.apply(this,arguments);};
})();
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}}
function fresh(){resetA();resetVolatile();STEPS=[];OPENS=[];QUEUED=[];EVLOG=[];TOASTS.length=0;resetMissedTimingDropsS03();
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function setTrap(nm,p){const c=mk(nm,p,'down');c.setTurn=gameState.turn-1;return c;}
function actTypes(){return STEPS.map(x=>x.t);}
function savedRaw(){localStorage.removeItem(DUEL_SAVE_KEY);saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
function loadInto(raw){resetA();resetVolatile();STEPS=[];OPENS=[];QUEUED=[];EVLOG=[];resetMissedTimingDropsS03();
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
/* 盤面: p0 のエンドフェイズに p1 が《デュアル・サモナー》を発動する。
   negators は p0（召喚する p1 の相手）の伏せ札。 */
function dsBoard(o){
  fresh();
  const opt=o||{};
  gameState.phase='end';
  gameState.activePlayer=0;
  const src=mk('デュアル・サモナー',1,'up');
  gameState.players[1].mz=[src].concat((opt.extraMz||[]).map(nm=>mk(nm,1,'up')));
  const ids={src:src.uid};
  if(opt.handGemini!==false){
    const mon=mk(opt.gemini||'デュアル・ソルジャー',1);
    gameState.players[1].hand=[mon];
    ids.mon=mon.uid;
  }
  gameState.players[0].sz=(opt.negators||[]).map(nm=>{const c=setTrap(nm,0);ids[nm]=c.uid;return c;});
  baselineA();
  if((opt.extraMz||[]).length) ids.extra=gameState.players[1].mz[1].uid;
  return ids;}
function dsRun(o){const ids=dsBoard(o);duelActivateFromZone(1,'mz',0);return ids;}
`;

/* ===== A. 実測した処理順 ===== */
harness(COMMON + String.raw`
const ids=dsRun({negators:['神の宣告']});
const to=driveToWindow();
const q=QUEUED.find(x=>x.name==='onNormalSummon')||null;
const sum=STEPS.find(x=>x.t==='NORMAL_SUMMON')||null;
ok('A1 ★ この効果の onNormalSummon は procStepS03 2・chain 0 で積まれ、印が付いている',
   !!q && q.step===2 && q.chain===0 && q.mark===true,
   JSON.stringify({q,queued:QUEUED}));
ok('A2 ★ NORMAL_SUMMON の前後は 1→2 で、《血の代償》チェーン1 と同じ刻み方',
   !!sum && sum.before===1 && sum.after===2 && sum.chain===0,
   JSON.stringify({sum,types:actTypes()}));
ok('A3 ★ 排出時の処理番号も 2 のままなので窓が開く（R4 と同じ比較）',
   to==='window' && OPENS.some(x=>x.opened===true && x.step===2),
   JSON.stringify({to,OPENS}));
ok('A4 解決中の選択（どのデュアルモンスターを召喚するか）は処理番号を進めない',
   (STEPS.filter(x=>/^CHOICE_/.test(x.t)).every(x=>x.before===x.after)),
   JSON.stringify(STEPS.filter(x=>/^CHOICE_/.test(x.t))));
`, {expect:4});

/* ===== B. 窓が開き、無効にできる ===== */
harness(COMMON + String.raw`
const ids=dsRun({negators:['神の宣告']});
ok('B1 ★ 窓が開き、召喚するモンスターが対象になっている',
   driveToWindow()==='window' && gameState.pendingSummon.uid===ids.mon
   && gameState.pendingSummon.player===1 && gameState.pendingSummon.kind==='normal',
   JSON.stringify(gameState.pendingSummon));
ok('B2 窓に出るのは p0 の《神の宣告》だけ',
   summonNegatorsV2(gameState.pendingSummon).map(x=>x.db.n).join('/')==='神の宣告',
   JSON.stringify(summonNegatorsV2(gameState.pendingSummon).map(x=>x.db.n)));
const r=negateInWindow('神の宣告');
ok('B3 ★ 召喚は無効になり、モンスターは墓地へ（《デュアル・サモナー》自身は場に残る）',
   r==='done' && zu(ids.mon)==='grave' && zu(ids.src)==='mz',
   JSON.stringify({r,mon:zu(ids.mon),src:zu(ids.src)}));
ok('B4 ★ 召喚成功のイベントは落ち、破壊でも「フィールドから離れた時」でもない',
   !EVLOG.includes('onNormalSummon') && !EVLOG.includes('onDestroy') && !EVLOG.includes('onLeaveField')
   && actTypes().includes('MOVE'),
   JSON.stringify({ev:EVLOG,types:actTypes()}));
ok('B5 p0 はライフを半分払った', gameState.players[0].lp===4000, String(gameState.players[0].lp));
audit('B');
`, {expect:6});

/* 通した場合 */
harness(COMMON + String.raw`
const ids=dsRun({negators:['神の宣告']});
ok('B6 前提: 窓が開く', driveToWindow()==='window', 'x');
commitPendingSummonV2(); drive();
ok('B7 窓で何も発動しなければ召喚は成立し、召喚成功のイベントが出る',
   zu(ids.mon)==='mz' && EVLOG.includes('onNormalSummon') && !gameState.pendingSummon,
   JSON.stringify({mon:zu(ids.mon),ev:EVLOG}));
ok('B8 ★ 窓を通しても処理番号は進まない（2 のまま）', s()===2,
   JSON.stringify(STEPS.filter(x=>x.before!==x.after)));
audit('B7');
`, {expect:4});

/* ===== C. negative control: 召喚無効が無い盤面 ===== */
harness(COMMON + String.raw`
const ids=dsRun({});
const to=drive();
ok('C1 ★ negative control: 召喚無効のカードが無ければ窓は開かず、Action も増えない',
   to==='idle' && !OPENS.some(x=>x.opened===true)
   && !actTypes().includes('SUMMON_WINDOW_OPEN_V42')
   && !actTypes().includes('EVENT_SUMMON_NEG_WINDOW_S03')
   && zu(ids.mon)==='mz',
   JSON.stringify({to,types:actTypes().filter(t=>/SUMMON_WINDOW|SUMMON_NEG/.test(t)),mon:zu(ids.mon)}));
audit('C');
`, {expect:2});

/* ===== D. negative control: デュアル再召喚の枝（未対応のまま） ===== */
harness(COMMON + String.raw`
/* 手札を空にし、場の表側デュアルモンスターを「もう1度召喚」する枝だけを通す */
const ids=dsBoard({handGemini:false,extraMz:['デュアル・ソルジャー'],negators:['神の宣告']});
duelActivateFromZone(1,'mz',0);
const to=drive();
ok('D1 前提: デュアル召喚（GEMINI_SUMMON_S03）が行われた',
   actTypes().includes('GEMINI_SUMMON_S03'), JSON.stringify({to,types:actTypes()}));
/* D2 は S03-U500 で書き替えた。S03-U499 の時点ではこの枝に印が無く「窓が開かない」ことの negative control
   だったが、S03-U500 で印を付けた。ここで固定するのは**実測した処理順が手札の枝と同じ**ことで、
   窓の挙動そのものは tools/test_s03_u500_* が持つ。 */
ok('D2 ★ デュアル再召喚の枝も onNormalSummon を procStepS03 2 で積み、手札の枝と同じ順である'
   +'（S03-U500 でこの枝にも印を付けた）',
   QUEUED.filter(x=>x.name==='onNormalSummon').every(x=>x.step===2 && x.chain===0)
   && QUEUED.some(x=>x.name==='onNormalSummon'&&x.mark===true),
   JSON.stringify({queued:QUEUED,opens:OPENS}));
ok('D3 ★ 理由（実測）: この枝の処理順自体は手札の枝と同じなので、印を付けなかったのは順ではなく'
   +'取り消しの形が違うため。geminiSummonResumeS03 は commit で GEMINI_SUMMON_S03 を**適用し**、'
   +'cancel で破壊する（案 (b) は召喚を適用済みにするので、そのままでは二重適用になる）',
   QUEUED.some(x=>x.name==='onNormalSummon'&&x.step===2)
   && typeof geminiSummonResumeS03==='function',
   JSON.stringify(QUEUED.filter(x=>x.name==='onNormalSummon')));
audit('D');
`, {expect:4});

/* ===== E. リリースを伴う召喚 ===== */
harness(COMMON + String.raw`
const ids=dsRun({gemini:'ギガプラント',extraMz:['ワイト'],negators:['神の宣告']});
const to=driveToWindow();
ok('E1 上級デュアルモンスター（リリースあり）でも窓が開く',
   to==='window' && gameState.pendingSummon.uid===ids.mon,
   JSON.stringify({to,ps:gameState.pendingSummon,def:(gameState.deferredEvents||[]).map(x=>x.eventName)}));
const r=negateInWindow('神の宣告');
ok('E2 無効にすると召喚したモンスターは墓地へ行き、リリースしたモンスターは墓地に残る',
   r==='done' && zu(ids.mon)==='grave',
   JSON.stringify({r,mon:zu(ids.mon),mz:gameState.players[1].mz.map(c=>c&&cardName(c))}));
audit('E');
`, {expect:3});

/* ===== F. Save/Load ===== */
const ctxF = harness(COMMON + String.raw`
const ids=dsRun({negators:['神の宣告']});
ok('F1 前提: 窓が開いたところで保存する', driveToWindow()==='window', 'x');
globalThis.__SAVED_S499=savedRaw();
globalThis.__AT_S499=JSON.stringify({step:s(),uid:gameState.pendingSummon.uid,
  waiting:(gameState.processorWaiting||{}).type});
negateInWindow('神の宣告');
globalThis.__WANT_S499=JSON.stringify({mon:zu(ids.mon),step:s(),digest:v41StateDigest(gameState)});
audit('F1');
`, {expect:2});

harness('const AT=' + (ctxF.__AT_S499 || 'null') + ';'
      + 'const WANT=' + (ctxF.__WANT_S499 || 'null') + ';'
      + 'const SAVED=' + JSON.stringify(ctxF.__SAVED_S499 || '') + ';' + COMMON + String.raw`
const okLoad=loadInto(SAVED);
ok('F2 ★ 別の VM で窓が開いたままの保存から再開でき、窓と待ち状態が戻る',
   okLoad===true && !!gameState.pendingSummon && gameState.pendingSummon.resolvedSummonS03===true
   && gameState.pendingSummon.uid===AT.uid && s()===AT.step
   && gameState.processorPaused===true && (gameState.processorWaiting||{}).type===AT.waiting,
   JSON.stringify({okLoad,ps:gameState.pendingSummon,step:s(),
     paused:gameState.processorPaused,w:(gameState.processorWaiting||{}).type}));
const mon=gameState.pendingSummon.uid;
negateInWindow('神の宣告');
const got={mon:zu(mon),step:s(),digest:v41StateDigest(gameState)};
ok('F3 ★ 再開した窓から無効にしても、保存しなかった場合と同じ盤面・同じ処理番号・同じ digest になる',
   JSON.stringify(got)===JSON.stringify(WANT), JSON.stringify({got,WANT}));
audit('F3');
`, {expect:3});

/* ===== G. 印の全件監査と文書・登録 ===== */
harness('const CARDS=' + JSON.stringify(CARD_SRC_S499) + ';const DOC=' + JSON.stringify(DESIGN_S499) + ';'
      + 'const SRC=' + JSON.stringify(SRC_S499) + ';' + COMMON + String.raw`
const files=Object.keys(CARDS).sort();
const marked=files.filter(f=>CARDS[f].indexOf('summonNegWindowS03:true}')>=0);
ok('G1 ★ cards/ の全ファイル（' + files.length + ' 件）を見て、印を付けている呼び出し元は 2 件だけ',
   marked.join(' ')==='00_generic_core.js HZK_claude_s03_u164_dual_summoner.js'
   && files.length>100,
   JSON.stringify({files:files.length,marked}));
ok('G2 ★ 《血の代償》は 1 箇所、《デュアル・サモナー》は 2 箇所（手札の枝とデュアル再召喚の枝）',
   (CARDS['00_generic_core.js'].split('summonNegWindowS03:true}').length-1)===1
   && (CARDS['HZK_claude_s03_u164_dual_summoner.js'].split('summonNegWindowS03:true}').length-1)===2,
   JSON.stringify(marked.map(f=>f+':'+(CARDS[f].split('summonNegWindowS03:true}').length-1))));
ok('G3 ★ 手札の枝とデュアル再召喚の枝の両方に印があり、再召喚の枝は geminiS03 を併せ持つ（S03-U500）',
   SRC['cards/HZK_claude_s03_u164_dual_summoner.js']
     .indexOf("card:summoned, byEffectS03:'デュアル・サモナー', summonNegWindowS03:true}")>=0
   && SRC['cards/HZK_claude_s03_u164_dual_summoner.js']
     .indexOf("card:now.card, geminiS03:true, byEffectS03:'デュアル・サモナー', summonNegWindowS03:true}")>=0,
   'x');
ok('G4 カードのコメントに当時裁定の ID と回答日、実測した処理順が書かれている',
   /WIKI-2CF23AA42E79/.test(SRC['cards/HZK_claude_s03_u164_dual_summoner.js'])
   && /2011-08-25/.test(SRC['cards/HZK_claude_s03_u164_dual_summoner.js'])
   && /procStepS03 2/.test(SRC['cards/HZK_claude_s03_u164_dual_summoner.js']),
   'x');
ok('G5 ★ 設計書 5-a #1-g が「S03-U499 で実装した」に書き直され、#1-h の行がある（S03-U500 でその枝も実装）',
   DOC.indexOf('S03-U499')>=0 && DOC.indexOf('| 1-h |')>=0,
   'x');
ok('G6 専用テストが tools/check.py に登録されている',
   /test_s03_u499_dual_summoner_negation_window\.js/.test(SRC['tools/check.py']), 'x');
`, {expect:6});
