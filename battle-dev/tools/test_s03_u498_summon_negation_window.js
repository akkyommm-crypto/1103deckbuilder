/* S03-U498: 解決中に行われた通常召喚に対する「召喚そのものの無効」の窓を**入れる**単位。
   設計は docs/S03_MISSED_TIMING_DESIGN.md の (D)（S03-U497 で処理順を実測して確定した）。
   当時裁定 WIKI-2CF23AA42E79（**回答日 2011-08-25**、掲載ページ《血の代償》）:
     「この効果による通常召喚に対し《神の宣告》や《キックバック》・《昇天の角笛》などの召喚を無効にする
       カードを発動できますか？」
     →「チェーン１で行われているならば、発動可能です。
        チェーン２以上で行われ、召喚の後に別の処理がある場合はタイミングを逃す事になり発動できません。」

   S03-U497 の実測（この単位の前提。あちらのテストが固定している）:
     ・既存の窓 5 か所はすべて UI 起点で chain 0・procStepS03 0 で開くので、そこへ処理番号の比較を
       入れても一度も成立しない（死んだコード）。
     ・解決中に行われる召喚には窓が 1 つも開かず、チェーン1 では当時できる発動を潰していた。

   固定するもの:
     A 機構の形（許可リスト。印の付いた召喚だけが対象で、印は呼び出し元が付ける）
     B チェーン1 では窓が開き、召喚成功のイベントより前に開く
     C チェーン2 では開かない（R4 の比較。**negative control**）
     D 無効にした時の結果（墓地へ、召喚成功のイベントは落ちる、破壊でも場からの離脱でもない）
     E 《キックバック》の「手札に戻す」
     F **非回帰**: 窓を通した後も《奈落の落とし穴》と召喚誘発は逃さない（窓は処理番号を進めない）
     G アドバンス召喚（リリースあり）
     H **negative control**: 召喚無効のカードがどちらの場にも無ければ Action を 1 つも増やさない
     I Save/Load（窓が開いたまま保存 → 別 VM で再開）と Replay
     J 未対応のまま残すもの（解決中の特殊召喚、強制誘発）
     K 文書・登録
     L 召喚側が p1 の場合（《神の警告》）と Undo */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S498 = pathA.resolve(__dirname, '..');
const rdS498 = p => fsA.readFileSync(pathA.join(ROOT_S498, p), 'utf8');
const DESIGN_S498 = rdS498('docs/S03_MISSED_TIMING_DESIGN.md');
const RULINGS_S498 = rdS498('docs/S03_MISSED_TIMING_RULINGS.md');
const SRC_S498 = {
  'engine/1ZZY_summon_negation_window_s03.js': rdS498('engine/1ZZY_summon_negation_window_s03.js'),
  'engine/30_processor_chain_battle.js': rdS498('engine/30_processor_chain_battle.js'),
  'engine/40_legal_script_engine.js': rdS498('engine/40_legal_script_engine.js'),
  'engine/00_state_actions.js': rdS498('engine/00_state_actions.js'),
  'engine/1ZZP_resume_processor_s03.js': rdS498('engine/1ZZP_resume_processor_s03.js'),
  'cards/00_generic_core.js': rdS498('cards/00_generic_core.js'),
  'cards/HZK_claude_s03_u164_dual_summoner.js': rdS498('cards/HZK_claude_s03_u164_dual_summoner.js'),
  'tools/check.py': rdS498('tools/check.py'),
  'build_manifest.json': rdS498('build_manifest.json')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function s(){return gameState.procStepS03|0;}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
let STEPS=[], OPENS=[], EVLOG_S498=[], QLOG_S498=[];
(function(){
  const so=summonNegWindowOpenS03;summonNegWindowOpenS03=function(q,n){
    const before=(q||[]).map(x=>x.eventName), r=so.apply(this,arguments);
    OPENS.push({opened:r,step:s(),queue:before,n:n|0});
    return r;};
  const h=applyAction;applyAction=function(gs,a){const d=APPLY_ACTION_DEPTH_V31,b=s();
    try{return h.apply(this,arguments);}finally{
      if(d===0)STEPS.push({t:(a&&a.type)||'?',before:b,after:s()});}};
  const ee=emitEvent;emitEvent=function(name,evt){EVLOG_S498.push({name,uid:evt&&evt.uid});return ee.apply(this,arguments);};
  /* S03-U500: emitEvent は応答できるカードが無ければ呼ばれないので、「何が起きたか」は**積まれた**方で見る。 */
  const qd=queueDeferredEventV2;queueDeferredEventV2=function(name,evt){
    QLOG_S498.push({name,uid:(evt&&evt.uid)!=null?evt.uid:((evt&&evt.card&&evt.card.uid)!=null?evt.card.uid:null)});
    return qd.apply(this,arguments);};
})();
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}}
function fresh(){resetA();resetVolatile();STEPS=[];OPENS=[];EVLOG_S498=[];QLOG_S498=[];TOASTS.length=0;resetMissedTimingDropsS03();
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function setTrap(nm,p){const c=mk(nm,p,'down');c.setTurn=gameState.turn-1;return c;}
function actTypes(){return STEPS.map(x=>x.t);}
function savedRaw(){localStorage.removeItem(DUEL_SAVE_KEY);saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
function loadInto(raw){resetA();resetVolatile();STEPS=[];OPENS=[];EVLOG_S498=[];QLOG_S498=[];resetMissedTimingDropsS03();
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
/* 窓が開いたところで止める。止まったら 'window'、最後まで進んだら 'idle'。 */
function driveToWindow(){
  for(let i=0;i<900;i++){
    if(gameState.pendingSummon&&!gameState.chain.length&&gameState.pendingSummon.resolvedSummonS03) return 'window';
    if(pc()){__choicePickV49(0);continue;}
    if(!step()) return 'idle';
  }
  return 'loop';}
function drive(){for(let i=0;i<900;i++){if(pc()){__choicePickV49(0);continue;}if(!step())return 'idle';}return 'loop';}
/* 窓で名前の一致する召喚無効を発動する */
function negateInWindow(name){
  const ps=gameState.pendingSummon; if(!ps) return 'no-window';
  const list=summonNegatorsV2(ps), hit=list.find(x=>x.db.n===name);
  if(!hit) return 'not-offered:'+JSON.stringify(list.map(x=>x.db.n));
  activateSummonNegatorV2(hit.p,hit.zone,hit.index);
  drive();
  return 'done';}
/* 《血の代償》の盤面。negators は p1 の伏せ札、extra は p1 の追加の伏せ札。 */
function bloodBoard(o){
  fresh();
  const opt=o||{};
  gameState.players[0].sz=[mk('血の代償',0,'up')];
  if(opt.chain2) gameState.players[0].sz.push(setTrap('成金ゴブリン',0));
  const ids={};
  gameState.players[1].sz=(opt.negators||[]).concat(opt.extra||[]).map((nm,i)=>{
    const c=setTrap(nm,1); ids[nm]=c.uid; return c;});
  const mon=mk(opt.summon||'ワイト',0);
  gameState.players[0].hand=[mon];
  if(opt.tribute) gameState.players[0].mz=[mk('クリボー',0,'up')];
  if(opt.deckOcean){const o2=mk('E・HERO オーシャン',0);gameState.players[0].deck.splice(1,0,o2);ids.ocean=o2.uid;}
  baselineA();
  ids.mon=mon.uid;
  if(opt.tribute) ids.trib=gameState.players[0].mz[0].uid;
  return ids;}
function bloodRun(o){
  const ids=bloodBoard(o);
  if(o&&o.chain2){
    duelActivateFromZone(0,'sz',1);
    let g=0;while(pc()&&(gameState.chain||[]).length<1&&g++<8)__choicePickV49(0);
    const r=(getChainResponsesV2(0)||[]).find(x=>x.db.n==='血の代償');
    if(r) duelActivateResponseV2(0,r.zone,r.index);
    g=0;while(pc()&&(gameState.chain||[]).length<2&&g++<8)__choicePickV49(0);
  }else{
    duelActivateFromZone(0,'sz',0);
  }
  return ids;}
`;

/* ===== A. 機構の形（許可リスト） ===== */
harness(COMMON + String.raw`
ok('A1 機構の 5 つの関数が engine にある（判定・対象・開く・続き・前検査）',
   typeof summonNegWindowItemS03==='function' && typeof summonNegWindowDueS03==='function'
   && typeof summonNegWindowOpenS03==='function' && typeof summonNegWindowResumeS03==='function'
   && typeof summonNegWindowAnyCandidateS03==='function',
   'x');
/* 許可リスト: 印の無いイベントは対象外（列挙の漏れは「何もしない」側に落ちる） */
ok('A2 ★ 許可リスト: 印（summonNegWindowS03:true）の付いた onNormalSummon だけが窓の対象',
   summonNegWindowItemS03({eventName:'onNormalSummon',evt:{uid:1,summonNegWindowS03:true}})===true
   && summonNegWindowItemS03({eventName:'onNormalSummon',evt:{uid:1}})===false
   && summonNegWindowItemS03({eventName:'onNormalSummon',evt:{uid:1,summonNegWindowS03:'offered'}})===false
   && summonNegWindowItemS03({eventName:'onSpecialSummon',evt:{uid:1,summonNegWindowS03:true}})===false
   && summonNegWindowItemS03(null)===false,
   'x');
/* R4 と同じ比較。刻んだ番号と今の番号が同じ時だけ窓を開ける。 */
fresh(); baselineA();
gameState.procStepS03=7;
const q7=[{eventName:'onNormalSummon',evt:{uid:9,summonNegWindowS03:true,stepS03:7}}];
const q8=[{eventName:'onNormalSummon',evt:{uid:9,summonNegWindowS03:true,stepS03:6}}];
ok('A3 ★ 判定は R4 と同じ「最後に行われた処理か」の比較だけ（番号が動いていれば対象外）',
   summonNegWindowDueS03(q7,1)===q7[0] && summonNegWindowDueS03(q8,1)===null
   && summonNegWindowDueS03([],1)===null,
   'x');
ok('A4 ★ 召喚無効のカードがどちらの場にも無ければ前検査で止まる（Action を 1 つも増やさない位置）',
   summonNegWindowAnyCandidateS03()===false,
   JSON.stringify({sz0:gameState.players[0].sz.length,sz1:gameState.players[1].sz.length}));
gameState.players[1].sz=[setTrap('神の宣告',1)];
ok('A5 伏せた《神の宣告》は前検査で候補として数える',
   summonNegWindowAnyCandidateS03()===true, 'x');
`, {expect:5});

/* ===== B. チェーン1 ─ 窓が開く ===== */
harness(COMMON + String.raw`
const ids=bloodRun({negators:['神の宣告']});
const to=driveToWindow();
ok('B1 ★ チェーン1 の解決中の通常召喚で窓が開き、その時点で止まる（当時裁定 WIKI-2CF23AA42E79）',
   to==='window' && !!gameState.pendingSummon && gameState.pendingSummon.kind==='normal'
   && gameState.pendingSummon.resolvedSummonS03===true && gameState.pendingSummon.uid===ids.mon,
   JSON.stringify({to,ps:gameState.pendingSummon}));
const op=OPENS.find(x=>x.opened===true)||null;
ok('B2 ★ 窓は召喚成功のイベントを出す**前**に開く（保留列に onNormalSummon が残っている）',
   !!op && op.queue.indexOf('onNormalSummon')>=0
   && !EVLOG_S498.some(e=>e.name==='onNormalSummon'),
   JSON.stringify({op,events:EVLOG_S498.map(e=>e.name)}));
ok('B3 ★ 窓を開いた時点の処理番号は召喚した時のまま（2）＝「召喚の後に別の処理が無い」',
   !!op && op.step===2 && (STEPS.find(x=>x.t==='NORMAL_SUMMON')||{}).after===2,
   JSON.stringify({op,sum:STEPS.find(x=>x.t==='NORMAL_SUMMON')}));
ok('B4 窓は遅延イベントの排出で止まっている（DRAIN_EVENTS が待ち、続きがキューにある）',
   gameState.processorPaused===true && (gameState.processorWaiting||{}).type==='DRAIN_EVENTS'
   && (gameState.processorQueue||[]).some(u=>u.type==='DRAIN_EVENTS'),
   JSON.stringify({paused:gameState.processorPaused,w:(gameState.processorWaiting||{}).type,
     q:(gameState.processorQueue||[]).map(u=>u.type)}));
ok('B5 窓に出るのは p1 の《神の宣告》だけ',
   summonNegatorsV2(gameState.pendingSummon).map(x=>x.db.n).join('/')==='神の宣告',
   JSON.stringify(summonNegatorsV2(gameState.pendingSummon).map(x=>x.db.n)));
/* 何も発動しなければ召喚は成立する */
commitPendingSummonV2(); drive();
ok('B6 何も発動しなければ召喚は成立し、召喚成功のイベントが出る',
   zu(ids.mon)==='mz' && EVLOG_S498.some(e=>e.name==='onNormalSummon')
   && !gameState.pendingSummon && (gameState.deferredEvents||[]).length===0,
   JSON.stringify({mon:zu(ids.mon),events:EVLOG_S498.map(e=>e.name)}));
ok('B7 ★ 窓を通しても処理番号は進まない（SUMMON_WINDOW_* と EVENT_* は (A) の許可リストに無い）',
   s()===2, JSON.stringify(STEPS.filter(x=>x.before!==x.after)));
audit('B');
`, {expect:8});

/* ===== C. チェーン2 ─ 開かない（negative control） ===== */
harness(COMMON + String.raw`
const ids=bloodRun({negators:['神の宣告'],chain2:true});
const to=drive();
ok('C1 ★ negative control: チェーン2 では窓が開かない（召喚の後に別の処理がある ＝ 当時裁定どおり逃す）',
   to==='idle' && !OPENS.some(x=>x.opened===true)
   && !actTypes().includes('SUMMON_WINDOW_OPEN_V42'),
   JSON.stringify({to,opens:OPENS.map(x=>[x.opened,x.step])}));
ok('C2 ★ 窓を開けなかった理由は処理番号の差（刻み 2 に対して排出時は 5）',
   OPENS.length>0 && OPENS.every(x=>x.step===5),
   JSON.stringify(OPENS.map(x=>x.step)));
ok('C3 召喚は成立し、p1 の《神の宣告》は伏せたまま残る（S03-U497 と同じ結果）',
   zu(ids.mon)==='mz' && zu(ids['神の宣告'])==='sz',
   JSON.stringify({mon:zu(ids.mon),neg:zu(ids['神の宣告'])}));
audit('C');
`, {expect:4});

/* ===== D. 無効にした時 ===== */
harness(COMMON + String.raw`
const ids=bloodRun({negators:['神の宣告']});
ok('D0 前提: 窓が開く', driveToWindow()==='window', JSON.stringify(gameState.pendingSummon));
const r=negateInWindow('神の宣告');
ok('D1 ★ 《神の宣告》を発動できる（当時裁定 WIKI-2CF23AA42E79 のチェーン1）', r==='done', r);
ok('D2 ★ 召喚は無効になり、モンスターは墓地へ（モンスターゾーンは空）',
   zu(ids.mon)==='grave' && gameState.players[0].mz.filter(Boolean).length===0,
   JSON.stringify({mon:zu(ids.mon),mz:gameState.players[0].mz.map(c=>c&&cardName(c))}));
ok('D3 ★ 積んであった召喚成功のイベントは落ち、召喚誘発も相手の応答も起きない',
   !EVLOG_S498.some(e=>e.name==='onNormalSummon')
   && (gameState.deferredEvents||[]).every(x=>x.eventName!=='onNormalSummon'),
   JSON.stringify(EVLOG_S498.map(e=>e.name)));
/* 設計 (D) の「破壊された時」の答え。S03-U500 で実測し直して書き直した:
   「破壊された時」は発動しない（onDestroy も onSendToGrave も積まれず graveInfo も残らない）が、
   **「フィールドから離れた時」は積まれる**。場からの離脱は v9DetectLeaveField（engine/18）が盤面の差分から
   検出するルール処理なので、MOVE で取り除いても避けられない（5-a #1-i）。
   S03-U498 はここを「どちらも発動しない」と書いていたが、それは emitEvent が応答者のいない場面では
   呼ばれないことを見ていただけだった。判定は**積まれた**イベントで行う。 */
ok('D4 ★ 取り除きは MOVE で、onDestroy も onSendToGrave も積まれず graveInfo も残らない（＝「破壊された時」は発動しない）',
   actTypes().includes('MOVE') && !actTypes().includes('FX_TO_GRAVE')
   && !QLOG_S498.some(e=>e.name==='onDestroy') && !QLOG_S498.some(e=>e.name==='onSendToGrave')
   && !((gameState.players[0].grave.find(c=>c&&c.uid===ids.mon)||{}).graveInfo),
   JSON.stringify({types:actTypes().filter(t=>t==='MOVE'||t==='FX_TO_GRAVE'),queued:QLOG_S498.map(e=>e.name)}));
/* D4b は S03-U502 で書き直した。S03-U498 の時点では onLeaveField が積まれてしまっていた（5-a #1-i）。
   S03-U502 で取り除きの Action に申告（summonNegatedS03）を付け、v9DetectLeaveField が場からの離脱に
   数えないようにした。当時裁定では「モンスターはフィールドに出なかった」扱いである。 */
ok('D4b ★ onLeaveField もそのモンスターの分は積まれない（S03-U502 で「フィールドに出なかった」扱いにした）',
   !QLOG_S498.some(e=>e.name==='onLeaveField' && e.uid===ids.mon),
   JSON.stringify(QLOG_S498));
ok('D5 《神の宣告》は墓地へ行き、p1 はライフを半分払った',
   zu(ids['神の宣告'])==='grave' && gameState.players[1].lp===4000,
   JSON.stringify({neg:zu(ids['神の宣告']),lp:gameState.players[1].lp}));
ok('D6 窓は閉じ、遅延イベントの排出も終わっている',
   !gameState.pendingSummon && (gameState.deferredEvents||[]).length===0
   && !gameState.processorPaused,
   JSON.stringify({ps:gameState.pendingSummon,q:(gameState.deferredEvents||[]).length}));
ok('D7 無効になったことが伝わる', TOASTS.some(t=>/無効になりました/.test(t)), JSON.stringify(TOASTS));
audit('D');
`, {expect:10});

/* ===== E. 《キックバック》─ 手札に戻す ===== */
harness(COMMON + String.raw`
const ids=bloodRun({negators:['キックバック']});
ok('E0 前提: 窓が開き《キックバック》が出る',
   driveToWindow()==='window'
   && summonNegatorsV2(gameState.pendingSummon).map(x=>x.db.n).join('/')==='キックバック',
   JSON.stringify(gameState.pendingSummon));
const r=negateInWindow('キックバック');
ok('E1 ★ S03-U277 の「召喚を無効にし、そのモンスターを持ち主の手札に戻す」が解決中の召喚でも働く',
   r==='done' && zu(ids.mon)==='hand' && gameState.players[0].mz.filter(Boolean).length===0,
   JSON.stringify({r,mon:zu(ids.mon)}));
ok('E2 召喚成功のイベントは落ちている',
   !EVLOG_S498.some(e=>e.name==='onNormalSummon'), JSON.stringify(EVLOG_S498.map(e=>e.name)));
audit('E');
`, {expect:4});

/* ===== F. 非回帰: 窓の後も召喚成功の応答は逃さない ===== */
harness(COMMON + String.raw`
/* p1 は《神の宣告》と《奈落の落とし穴》を伏せている。窓で何も発動しなければ、
   当時裁定（WIKI-2B88D7C8D921、S03-U492）どおり《奈落の落とし穴》は発動できる。 */
const ids=bloodRun({negators:['神の宣告'],extra:['奈落の落とし穴'],summon:'E・HERO エアーマン',deckOcean:true});
ok('F0 前提: 窓が開く', driveToWindow()==='window', JSON.stringify(gameState.pendingSummon));
ok('F1 窓に出るのは召喚無効の《神の宣告》だけで、《奈落の落とし穴》は出ない（別のタイミング）',
   summonNegatorsV2(gameState.pendingSummon).map(x=>x.db.n).join('/')==='神の宣告',
   JSON.stringify(summonNegatorsV2(gameState.pendingSummon).map(x=>x.db.n)));
commitPendingSummonV2(); drive();
ok('F2 ★ 非回帰: 窓を通した後も相手の《奈落の落とし穴》は発動でき、召喚したモンスターは除外される',
   zu(ids.mon)==='banish', JSON.stringify({mon:zu(ids.mon)}));
ok('F3 ★ 非回帰: 召喚したモンスター自身の召喚誘発も働く（デッキの《E・HERO オーシャン》が手札へ）',
   zu(ids.ocean)==='hand', JSON.stringify({ocean:zu(ids.ocean)}));
ok('F4 ★ 何も落としていない（MISSED_TIMING_DROPS_S03 が空）',
   MISSED_TIMING_DROPS_S03.length===0, JSON.stringify(MISSED_TIMING_DROPS_S03));
audit('F');
`, {expect:6});

/* ===== G. アドバンス召喚（リリースあり） ===== */
harness(COMMON + String.raw`
const ids=bloodRun({negators:['神の宣告'],summon:'デーモンの召喚',tribute:true});
const to=driveToWindow();
ok('G1 リリースを伴う召喚でも窓が開く（リリースと召喚成功は同じ組なので、その組の前で開く）',
   to==='window' && gameState.pendingSummon.uid===ids.mon,
   JSON.stringify({to,ps:gameState.pendingSummon,q:(gameState.deferredEvents||[]).map(x=>x.eventName)}));
const r=negateInWindow('神の宣告');
ok('G2 無効にするとモンスターは墓地へ行き、リリースしたモンスターはそのまま墓地に残る',
   r==='done' && zu(ids.mon)==='grave' && zu(ids.trib)==='grave',
   JSON.stringify({r,mon:zu(ids.mon),trib:zu(ids.trib)}));
audit('G');
`, {expect:3});

/* ===== H. negative control: 召喚無効が無ければ公開済みの経路はそのまま ===== */
harness(COMMON + String.raw`
const ids=bloodRun({});                         /* p1 の場は空 */
const to=drive();
ok('H1 ★ negative control: 召喚無効のカードが無ければ窓は開かず、Action も 1 つも増えない',
   to==='idle' && !OPENS.some(x=>x.opened===true)
   && !actTypes().includes('SUMMON_WINDOW_OPEN_V42')
   && !actTypes().includes('SUMMON_WINDOW_CLOSE_V42')
   && !actTypes().includes('EVENT_SUMMON_NEG_WINDOW_S03'),
   JSON.stringify({to,types:actTypes().filter(t=>/SUMMON_WINDOW|SUMMON_NEG/.test(t))}));
ok('H2 召喚はこれまでどおり成立する', zu(ids.mon)==='mz', zu(ids.mon));
/* 奈落だけを伏せている盤面も同じ（S03-U492 の C と同じ経路） */
const ids2=bloodRun({extra:['奈落の落とし穴'],summon:'E・HERO エアーマン'});
drive();
ok('H3 ★ negative control: 《奈落の落とし穴》は召喚無効ではないので前検査で止まり、窓は開かない',
   !OPENS.some(x=>x.opened===true) && !actTypes().includes('SUMMON_WINDOW_OPEN_V42')
   && zu(ids2.mon)==='banish',
   JSON.stringify({opens:OPENS.map(x=>x.opened),mon:zu(ids2.mon)}));
audit('H');
`, {expect:4});

/* ===== I. Save/Load ===== */
const ctxI = harness(COMMON + String.raw`
const ids=bloodRun({negators:['神の宣告']});
ok('I1 前提: 窓が開いたところで保存する', driveToWindow()==='window', 'x');
globalThis.__SAVED_S498=savedRaw();
globalThis.__AT_S498=JSON.stringify({step:s(),uid:gameState.pendingSummon.uid,
  waiting:(gameState.processorWaiting||{}).type});
commitPendingSummonV2(); drive();
globalThis.__WANT_S498=JSON.stringify({mon:zu(ids.mon),step:s(),digest:v41StateDigest(gameState)});
ok('I2 保存に窓（pendingSummon）が入っている',
   (globalThis.__SAVED_S498||'').indexOf('pendingSummon')>=0
   && JSON.parse(globalThis.__SAVED_S498).state.pendingSummon.resolvedSummonS03===true,
   JSON.stringify(JSON.parse(globalThis.__SAVED_S498).state.pendingSummon));
audit('I2');
`, {expect:3});

harness('const AT=' + (ctxI.__AT_S498 || 'null') + ';'
      + 'const WANT=' + (ctxI.__WANT_S498 || 'null') + ';'
      + 'const SAVED=' + JSON.stringify(ctxI.__SAVED_S498 || '') + ';' + COMMON + String.raw`
const okLoad=loadInto(SAVED);
ok('I3 ★ 別の VM で窓が開いたままの保存から再開でき、窓と待ち状態が戻る',
   okLoad===true && !!gameState.pendingSummon && gameState.pendingSummon.resolvedSummonS03===true
   && gameState.pendingSummon.uid===AT.uid && s()===AT.step
   && gameState.processorPaused===true && (gameState.processorWaiting||{}).type===AT.waiting,
   JSON.stringify({okLoad,ps:gameState.pendingSummon,step:s(),
     paused:gameState.processorPaused,w:(gameState.processorWaiting||{}).type}));
ok('I4 再開した窓にも《神の宣告》が出る',
   summonNegatorsV2(gameState.pendingSummon).map(x=>x.db.n).join('/')==='神の宣告',
   JSON.stringify(summonNegatorsV2(gameState.pendingSummon).map(x=>x.db.n)));
const mon=gameState.pendingSummon.uid;
commitPendingSummonV2(); drive();
const got={mon:zu(mon),step:s(),digest:v41StateDigest(gameState)};
ok('I5 ★ 再開して通した結果が、保存しなかった場合と同じ盤面・同じ処理番号・同じ digest になる',
   JSON.stringify(got)===JSON.stringify(WANT), JSON.stringify({got,WANT}));
audit('I5');
`, {expect:4});

/* 窓から無効にする側も保存を跨げる */
const ctxJ = harness(COMMON + String.raw`
bloodRun({negators:['神の宣告']});
ok('I6 前提: 窓が開く', driveToWindow()==='window', 'x');
globalThis.__SAVED2_S498=savedRaw();
negateInWindow('神の宣告');
globalThis.__WANT2_S498=JSON.stringify({mz:gameState.players[0].mz.filter(Boolean).length,
  grave:gameState.players[0].grave.length,digest:v41StateDigest(gameState)});
`, {expect:1});

harness('const WANT=' + (ctxJ.__WANT2_S498 || 'null') + ';'
      + 'const SAVED=' + JSON.stringify(ctxJ.__SAVED2_S498 || '') + ';' + COMMON + String.raw`
ok('I7 前提: 別の VM で再開できる', loadInto(SAVED)===true, 'x');
negateInWindow('神の宣告');
const got={mz:gameState.players[0].mz.filter(Boolean).length,
  grave:gameState.players[0].grave.length,digest:v41StateDigest(gameState)};
ok('I8 ★ 再開した窓から無効にしても、保存しなかった場合と同じ結果・同じ digest になる',
   JSON.stringify(got)===JSON.stringify(WANT), JSON.stringify({got,WANT}));
audit('I8');
`, {expect:3});

/* ===== J. 未対応のまま残すもの（negative control） ===== */
harness(COMMON + String.raw`
/* J1 解決中の特殊召喚（5-a #1-d、R1103-ROACH-003 は回答日なし） */
fresh();
gameState.players[0].hand=[mk('死者蘇生',0)];
gameState.players[0].grave=[mk('ワイト',0)];
gameState.players[1].sz=[setTrap('神の警告',1)];
baselineA();
duelActivateFromZone(0,'hand',0);
drive();
ok('J1 ★ negative control: 解決中の特殊召喚には窓が開かないまま（5-a #1-d。本単位の対象は通常召喚だけ）',
   !OPENS.some(x=>x.opened===true) && gameState.players[0].mz.filter(Boolean).length===1,
   JSON.stringify({opens:OPENS.map(x=>x.opened),mz:gameState.players[0].mz.length}));
/* J2 召喚無効は召喚成功より前の別タイミングなので、(B) の落とし方には入らない（S03-U492 以降の約束） */
ok('J2 召喚無効のカードはいまも missedTimingSummonNegatorS03 で真',
   Object.keys(CARD_SCRIPTS).filter(n=>CARD_SCRIPTS[n]&&CARD_SCRIPTS[n].summonNegate)
     .every(n=>missedTimingSummonNegatorS03(n)===true),
   'x');
`, {expect:2});

/* ===== K. 文書・登録 ===== */
harness('const DOC=' + JSON.stringify(DESIGN_S498) + ';const RUL=' + JSON.stringify(RULINGS_S498) + ';'
      + 'const SRC=' + JSON.stringify(SRC_S498) + ';' + COMMON + String.raw`
const ENG=SRC['engine/1ZZY_summon_negation_window_s03.js'];
/* K1 は S03-U499・S03-U500 で書き替えた（印を付けた呼び出し元が 1 → 2 → 3 箇所になった）。
   全件監査であることは変えない: 全体の全件監査（cards/ 全ファイル）は tools/test_s03_u499_* の G1 が持つ。 */
ok('K1 ★ 印を付けているのは《血の代償》1 箇所と《デュアル・サモナー》2 箇所（手札の枝とデュアル再召喚の枝）',
   Object.keys(SRC).filter(k=>/^cards\//.test(k) && SRC[k].indexOf('summonNegWindowS03:true}')>=0).sort().join(' ')
     ==='cards/00_generic_core.js cards/HZK_claude_s03_u164_dual_summoner.js'
   && (SRC['cards/00_generic_core.js'].split('summonNegWindowS03:true}').length-1)===1
   && (SRC['cards/HZK_claude_s03_u164_dual_summoner.js'].split('summonNegWindowS03:true}').length-1)===2,
   JSON.stringify(Object.keys(SRC).filter(k=>SRC[k].indexOf('summonNegWindowS03:true}')>=0)));
ok('K2 窓を開く呼び出しは engine/30 の遅延イベントの排出 1 箇所だけ',
   (SRC['engine/30_processor_chain_battle.js'].match(/summonNegWindowOpenS03\(/g)||[]).length===1,
   'x');
ok('K3 続きは engine/40 の runSummonWindowResumeS03 から resumeS03.resolvedS03 の時だけ呼ばれる',
   /r\.resolvedS03===true && typeof summonNegWindowResumeS03/.test(SRC['engine/40_legal_script_engine.js']),
   'x');
ok('K4 新しい Action は engine/00 に 1 つだけで、(A) の許可リストには入っていない',
   /case "EVENT_SUMMON_NEG_WINDOW_S03"/.test(SRC['engine/00_state_actions.js'])
   && MISSED_TIMING_PROCESSING_S03.get('EVENT_SUMMON_NEG_WINDOW_S03')===undefined
   && MISSED_TIMING_PROCESSING_S03.get('SUMMON_WINDOW_OPEN_V42')===undefined,
   'x');
ok('K5 保存からの復帰（engine/1ZZP）に DRAIN_EVENTS の待ちが入っている',
   /S03-U498/.test(SRC['engine/1ZZP_resume_processor_s03.js'])
   && /DRAIN_EVENTS && gameState\.pendingSummon/.test(SRC['engine/1ZZP_resume_processor_s03.js']),
   'x');
ok('K6 engine の新ファイルが build_manifest.json に登録されている',
   /engine\/1ZZY_summon_negation_window_s03\.js/.test(SRC['build_manifest.json']),
   'x');
ok('K7 専用テストが tools/check.py に登録されている',
   /test_s03_u498_summon_negation_window\.js/.test(SRC['tools/check.py']), 'x');
ok('K8 ★ engine の新ファイルに当時裁定の ID と回答日が書かれている',
   /WIKI-2CF23AA42E79/.test(ENG) && /2011-08-25/.test(ENG), 'x');
ok('K9 ★ 設計書 (D) に S03-U498 で実装したことと、残した近似が書かれている',
   /S03-U498/.test(DOC) && /\(D\)/.test(DOC), 'x');
ok('K10 ★ 裁定記録に WIKI-2CF23AA42E79 の本文と回答日が残っている',
   /WIKI-2CF23AA42E79/.test(RUL) && /2011-08-25/.test(RUL), 'x');
/* K11 も S03-U499・S03-U500 で書き替えた。S03-U498 では「印を付けていない」、S03-U499 では「手札の枝だけ」、
   S03-U500 でデュアル再召喚の枝にも付いた（取り消しの形だけが違うので、そこを分けて固定する）。 */
ok('K11 ★ デュアル・サモナーは両方の枝に印が付いていて、デュアル再召喚の枝だけ geminiS03 を併せ持つ',
   SRC['cards/HZK_claude_s03_u164_dual_summoner.js']
     .indexOf("card:summoned, byEffectS03:'デュアル・サモナー', summonNegWindowS03:true}")>=0
   && SRC['cards/HZK_claude_s03_u164_dual_summoner.js']
     .indexOf("card:now.card, geminiS03:true, byEffectS03:'デュアル・サモナー', summonNegWindowS03:true}")>=0,
   'x');
`, {expect:11});
/* ===== L. 召喚側が p1 の場合と Undo ===== */
harness(COMMON + String.raw`
/* L1 p1 が《血の代償》を使い、p0 の《神の警告》が窓に出る（どちらの側でも同じに働く） */
fresh();
gameState.activePlayer=1;
gameState.players[1].sz=[mk('血の代償',1,'up')];
const dec=setTrap('神の警告',0);gameState.players[0].sz=[dec];
const mon=mk('ワイト',1);gameState.players[1].hand=[mon];
baselineA();
duelActivateFromZone(1,'sz',0);
const to=driveToWindow();
ok('L1 ★ 召喚側が p1 でも窓は開き、相手（p0）の《神の警告》が候補に出る',
   to==='window' && gameState.pendingSummon.player===1
   && summonNegatorsV2(gameState.pendingSummon).map(x=>x.db.n).join('/')==='神の警告',
   JSON.stringify({to,ps:gameState.pendingSummon}));
const r=negateInWindow('神の警告');
ok('L2 無効になり、モンスターは墓地、p0 は 2000 払う（《神の警告》のコスト）',
   r==='done' && zu(mon.uid)==='grave' && gameState.players[0].lp===6000,
   JSON.stringify({r,mon:zu(mon.uid),lp:gameState.players[0].lp}));
audit('L2');
`, {expect:3});

harness(COMMON + String.raw`
/* L3 Undo: 窓を開く Action は自動処理（スナップショットを作らない）なので、Undo は窓の前後へ戻る。
   戻した先から進行できること・systemFault が出ないことを固定する（S03-U15 の窓と同じ約束）。 */
const ids=bloodRun({negators:['神の宣告']});
ok('L3 前提: 窓が開き、DRAIN_EVENTS が待っている',
   driveToWindow()==='window' && (gameState.processorWaiting||{}).type==='DRAIN_EVENTS', 'x');
negateInWindow('神の宣告');
const states=[];
for(let i=0;i<4;i++){
  undo();
  states.push({ps:!!gameState.pendingSummon,zone:zu(ids.mon),fault:gameState.systemFault||null});
}
ok('L4 ★ Undo を 4 回戻しても systemFault は出ず、途中で窓（pendingSummon）が戻る状態がある',
   states.every(x=>x.fault===null) && states.some(x=>x.ps===true),
   JSON.stringify(states));
ok('L5 ★ 戻した状態からそのまま進行できる（止まらない）',
   drive()==='idle' && !gameState.pendingSummon
   && (gameState.deferredEvents||[]).length===0 && !gameState.systemFault,
   JSON.stringify({ps:!!gameState.pendingSummon,def:(gameState.deferredEvents||[]).length,
     fault:gameState.systemFault||null}));
`, {expect:3});
