/* =========================================================================
   SYSTEM CORE v2.8 — ADS-like Processor Queue / Chain / Priority / Summon Window / Events
   -------------------------------------------------------------------------
   DUELモードのシステム処理を、ADS型の1本の経路へ寄せる。
   ========================================================================= */
/* 1103後期（2011/3/19以降）の固定ルール。
   召喚・反転召喚・特殊召喚成功直後に、ターンプレイヤーがモンスターの
   起動効果を優先権で割り込ませる旧ルールは使用しない。 */
const RULING_1103_POST_20110319_IGNITION = true;
let CHAIN_AFTER_V2 = null;
/* S03-U484: EVT_AFTER（チェーン終了後の継続クロージャ）と同じ場所で作る、同じ継続の JSON 版。
   プロセッサの EVENT / EVENT_BATCH だけが設定する。startEventChainV2 が EVT_V2_STATE.resumeData へ移し、
   eventSelectionDescriptorV11 がそれを読む。クロージャを設定した場所が自分で記録するので、
   「データの継続 = そのクロージャ」が構造的に保証される（プロセッサ unit の payload からの再導出をやめた）。 */
let EVT_RESUME_DATA_V484 = null;
let EVT_V2_STATE = null;
let RESOLUTION_SUMMON_BATCH_V2 = null;

/* ADS/YGOPro系のチェーン操作をスマホ向けに再現。
   IGNORE    : 任意の応答窓を自動パス
   AVAILABLE : 発動可能な候補がある時だけ止まる（既定）
   ALWAYS    : 候補が無くても全ての優先権タイミングで止まる */
const ADS_CHAIN_MODES = Object.freeze({IGNORE:'ignore', AVAILABLE:'available', ALWAYS:'always'});
const ADS_CHAIN_MODE_KEY = 'yg1103_ads_chain_mode_v1';
const ADS_NO_DELAY_KEY = 'yg1103_ads_no_chain_delay_v1';
let ADS_CHAIN_MODE = (()=>{ try{ const v=localStorage.getItem(ADS_CHAIN_MODE_KEY); return Object.values(ADS_CHAIN_MODES).includes(v)?v:ADS_CHAIN_MODES.AVAILABLE; }catch(e){ return ADS_CHAIN_MODES.AVAILABLE; } })();
let ADS_NO_CHAIN_DELAY = (()=>{ try{ return localStorage.getItem(ADS_NO_DELAY_KEY)==='1'; }catch(e){ return false; } })();
function adsChainModeJp(m){ return m===ADS_CHAIN_MODES.IGNORE?'チェーン無視':m===ADS_CHAIN_MODES.ALWAYS?'常に確認':'発動可能時のみ'; }
function saveAdsChainSettings(){ try{ localStorage.setItem(ADS_CHAIN_MODE_KEY,ADS_CHAIN_MODE); localStorage.setItem(ADS_NO_DELAY_KEY,ADS_NO_CHAIN_DELAY?'1':'0'); }catch(e){} }
function setAdsChainMode(m){ if(!Object.values(ADS_CHAIN_MODES).includes(m)) return; ADS_CHAIN_MODE=m; saveAdsChainSettings(); openAdsChainSettings(); }
function toggleAdsNoChainDelay(){ ADS_NO_CHAIN_DELAY=!ADS_NO_CHAIN_DELAY; saveAdsChainSettings(); openAdsChainSettings(); }
function adsAutoPassDelay(){ return ADS_NO_CHAIN_DELAY?0:120; }
function openAdsChainSettings(){
  sheet.innerHTML=`<div class="grip"></div><h3 style="margin-bottom:6px">ADSチェーン設定</h3>
    <div class="meta" style="margin-bottom:10px">ADS/YGOProの Ignore / Always / Available に相当します。1人操作では「発動可能時のみ」推奨です。</div>
    <div class="act-grid wide">
      <div class="act ${ADS_CHAIN_MODE===ADS_CHAIN_MODES.IGNORE?'fx':''}" onclick="setAdsChainMode('ignore')">チェーン無視 — 自動パス</div>
      <div class="act ${ADS_CHAIN_MODE===ADS_CHAIN_MODES.AVAILABLE?'fx':''}" onclick="setAdsChainMode('available')">発動可能時のみ — 候補がある時だけ停止</div>
      <div class="act ${ADS_CHAIN_MODE===ADS_CHAIN_MODES.ALWAYS?'fx':''}" onclick="setAdsChainMode('always')">常に確認 — 全タイミングで停止</div>
      <div class="act" onclick="toggleAdsNoChainDelay()">チェーン遅延なし：${ADS_NO_CHAIN_DELAY?'ON':'OFF'}</div>
    </div><button class="close" onclick="openMenu()">戻る</button>`;
  veil.classList.add('on');
}

/* YGOProのEffect Typeに近い分類。カード個別処理ではなく、エンジンが効果の種類を認識する。 */

/* =========================================================================
   System v3.1 — ADS-like Processor Queue
   -------------------------------------------------------------------------
   YGOPro/ADS の processor 設計を参考にしたクリーン実装。
   UI コールバックが連鎖してシステム処理が前後しないよう、DUEL モードでは
   フェーズ・ターン・イベント・チェーン解決・Adjust を1本の直列キューに通す。
   キュー本体はシリアライズ可能な plain object のみを保持する。
   ========================================================================= */
const PROCESSOR_V27 = Object.freeze({
  PHASE:'PHASE', TURN:'TURN', DRAW:'DRAW', EVENT:'EVENT', EVENT_BATCH:'EVENT_BATCH', POINT:'POINT', ATTACK:'ATTACK', DAMAGE_STEP:'DAMAGE_STEP',
  BATTLE_COMMAND:'BATTLE_COMMAND', SOLVE_CHAIN:'SOLVE_CHAIN', CHAIN_END:'CHAIN_END', END_PHASE:'END_PHASE', DRAIN_EVENTS:'DRAIN_EVENTS', ADJUST:'ADJUST',
  SCHEDULE_V7:'SCHEDULE_V7'
});
const PROC_V27_DONE='done', PROC_V27_WAIT='wait', PROC_V27_CANCEL='cancel';
let PROCESSOR_PUMPING_V27=false;

function ensureProcessorStateV27(gs){
  gs=gs||gameState; if(!gs) return;
  if(!Array.isArray(gs.processorQueue)) gs.processorQueue=[];
  if(!Array.isArray(gs.processorTrace)) gs.processorTrace=[];
  if(gs.processorCurrent===undefined) gs.processorCurrent=null;
  if(gs.processorPaused===undefined) gs.processorPaused=false;
  if(gs.processorWaiting===undefined) gs.processorWaiting=null;
  if(gs.processorSeq===undefined) gs.processorSeq=0;
}
function processorTraceV27(msg,unit){
  ensureProcessorStateV27();
  const row={turn:gameState.turn,phase:gameState.phase,id:unit&&unit.id||null,type:unit&&unit.type||'',msg:String(msg||'')};
  gameState.processorTrace.push(row);
  if(gameState.processorTrace.length>120) gameState.processorTrace.splice(0,gameState.processorTrace.length-120);
}
function makeProcessorUnitV27(type,payload){
  ensureProcessorStateV27(); gameState.processorSeq++;
  return {id:gameState.processorSeq,type,payload:payload||{},turn:gameState.turn,phase:gameState.phase};
}
function enqueueProcessorV27(type,payload,front){
  const u=makeProcessorUnitV27(type,payload);
  if(front) gameState.processorQueue.unshift(u); else gameState.processorQueue.push(u);
  processorTraceV27('queued',u); return u;
}
function enqueueProcessorListFrontV27(list){
  for(let i=list.length-1;i>=0;i--){ const x=list[i]; enqueueProcessorV27(x.type,x.payload||{},true); }
}
function requestProcessorV27(type,payload){
  const childChain = !!(gameState.processorPaused && gameState.processorWaiting && type===PROCESSOR_V27.SOLVE_CHAIN);
  /* v2.8: 親processorがUI待ち中に生まれたチェーン解決は、既に並んでいる
     「親の続き」より必ず先に処理する。ADSのprocessor stackに近いLIFO優先。 */
  enqueueProcessorV27(type,payload||{},childChain);
  if(childChain) gameState.processorPaused=false;
  pumpProcessorV27();
}
function processorResumeV27(){
  ensureProcessorStateV27();
  const u=gameState.processorWaiting||gameState.processorCurrent;
  processorTraceV27('resume',u);
  gameState.processorPaused=false; gameState.processorWaiting=null; gameState.processorCurrent=null;
  closeStaleSummonTimingS03(true);   /* S03-U486: 待っていた処理が終わってキューも空なら、この時点で応答タイミングは終わっている */
  setTimeout(pumpProcessorV27,0);
}
function processorAbortV27(reason){
  ensureProcessorStateV27();
  const u=gameState.processorWaiting||gameState.processorCurrent;
  processorTraceV27('abort: '+(reason||''),u);
  gameState.processorPaused=false; gameState.processorWaiting=null; gameState.processorCurrent=null;
  setTimeout(pumpProcessorV27,0);
}
function pumpProcessorV27(){
  ensureProcessorStateV27();
  if(PROCESSOR_PUMPING_V27 || gameState.processorPaused || gameState.loser!=null) return;
  PROCESSOR_PUMPING_V27=true;
  let guard=0;
  try{
    /* A terminal result can be produced by an Action while this pump is already
       draining (CODEX-C01: a resolved upper chain link).  Do not advance a
       queued lower link after any win, LP loss, deck-out, or simultaneous draw. */
    while(!gameState.processorPaused && gameState.loser==null && gameState.processorQueue.length && guard++<100){
      const u=gameState.processorQueue.shift(); gameState.processorCurrent=u;
      processorTraceV27('start',u);
      let r=PROC_V27_DONE;
      try{ r=dispatchProcessorV27(u); }
      catch(e){
        processorTraceV27('error: '+(e.message||e),u);
        gameState.systemFault=`${u.type}：${e.message||e}`;
        logIt(gameState,`<b>Processor v3.1</b>：${gameState.systemFault}`);
        // DUELモードでは壊れた状態のまま次のprocessorへ進めない。
        if(PLAY_MODE===PLAY_MODES.DUEL){ gameState.processorQueue=[]; gameState.processorPaused=true; r=PROC_V27_WAIT; }
        else r=PROC_V27_DONE;
      }
      if(r===PROC_V27_WAIT){ gameState.processorPaused=true; gameState.processorWaiting=u; gameState.processorCurrent=null; processorTraceV27('wait',u); break; }
      processorTraceV27(r===PROC_V27_CANCEL?'cancel':'done',u); gameState.processorCurrent=null;
    }
    if(guard>=100){ logIt(gameState,'<b>Processor v3.1</b>：安全停止（100処理）'); }
  } finally { PROCESSOR_PUMPING_V27=false; }
  closeStaleSummonTimingS03(guard>0);   /* S03-U486 */
  render();
}
/* S03-U486: 召喚・反転で開いた応答タイミングの窓（runtime/50 の updateTimingWindow が立てる 'summon' / 'flip'）を、
   その応答タイミングが終わった所で閉じる。
   これまで閉じていたのは「召喚成功後のクイックエフェクト確認（summonFast / flipFast）を両者がパスした時」だけで
   （queuePointContinuationV27 の clearTimingOnPass）、その POINT が一度も作られない経路では閉じる処理が無く、
   そのフェイズの間 currentTimings() に 'summon' が残り続けていた。実測した例は《血の代償》の「通常召喚扱い」の
   特殊召喚で、以後そのメインフェイズの間ずっと 「召喚に成功した時」 のカード（グリーン・ガジェット等）がメニューに
   出て、発動すると 1103 のルールで断られる状態になる。S03-U42 が FX_SET_STATE について直したのと同じ型の欠陥。
   この窓は Journal にも digest にも入っておらず offerResumeDuel が捨てるので、保存・再開した側だけ窓が無く、
   同じ盤面でメニューが食い違っていた（S03-U483 の 4-a）。窓が残る方が誤りなので、保存するのではなく閉じる。
   閉じるのは「プロセッサが実際に 1 つ以上処理し終えて、何も待っていない開いたメインフェイズに戻った」時点だけ。
   drained=false（この pump で何も処理していない）では閉じない: 召喚の Action とそのイベント登録の間に挟まった
   空振りの pump で、これから始まる応答タイミングを先に閉じてしまわないため。 */
/* S03-U486: 召喚・反転の応答タイミングの窓を閉じる処理（summonFast / flipFast の POINT）はプロセッサのキューにある。
   復旧経路がキューを捨てる時は、この窓も引き継がない（offerResumeDuel が runtime/50 でロード時に同じ理由で捨てているのと同じ扱い）。
   閉じ手の無い窓が残ると、そのフェイズの間 currentTimings() に 'summon' が残り続ける。 */
function summonTimingWindowS03(w){ return !!w && ['summon','flip','summonFast','flipFast'].indexOf(w.kind)>=0; }
function closeStaleSummonTimingS03(drained){
  if(!drained) return;
  const w=gameState.timingWindow;
  if(!w || (w.kind!=='summon' && w.kind!=='flip')) return;
  if(gameState.phase!=='main1' && gameState.phase!=='main2') return;
  if(gameState.processorPaused || gameState.processorWaiting || (gameState.processorQueue||[]).length) return;
  if((gameState.chain||[]).length || gameState.pendingSummon || gameState.pendingChoice || gameState.battle) return;
  if((gameState.deferredEvents||[]).length) return;
  if(typeof EVT_V2_STATE!=='undefined' && EVT_V2_STATE) return;   /* 誘発の選択窓が開いている間は応答タイミングの途中 */
  gameState.timingWindow=null;
}
function dispatchProcessorV27(u){
  switch(u.type){
    case PROCESSOR_V27.PHASE: return processPhaseV27(u.payload||{});
    case PROCESSOR_V27.TURN: return processTurnV27(u.payload||{});
    case PROCESSOR_V27.DRAW: return processDrawV27(u.payload||{});
    case PROCESSOR_V27.EVENT: return processEventV27(u.payload||{});
    case PROCESSOR_V27.EVENT_BATCH: return processEventBatchV28(u.payload||{});
    case PROCESSOR_V27.POINT: return processPointV27(u.payload||{});
    case PROCESSOR_V27.ATTACK: return processAttackV27(u.payload||{});
    case PROCESSOR_V27.DAMAGE_STEP: return processDamageStepV27(u.payload||{});
    case PROCESSOR_V27.BATTLE_COMMAND: return processBattleCommandV29(u.payload||{});
    case PROCESSOR_V27.SOLVE_CHAIN: return processSolveChainV27(u.payload||{});
    case PROCESSOR_V27.CHAIN_END: return processChainEndV30(u.payload||{});
    case PROCESSOR_V27.END_PHASE: return processEndPhaseV30(u.payload||{});
    case PROCESSOR_V27.SCHEDULE_V7:
      if(typeof runDueSchedulesV7==='function') runDueSchedulesV7((u.payload||{}).at, gameState);
      return PROC_V27_DONE;
    case PROCESSOR_V27.DRAIN_EVENTS: return processDrainEventsV27();
    case PROCESSOR_V27.ADJUST: return processAdjustV27(u.payload||{});
    default: return PROC_V27_DONE;
  }
}
function firstTurnBattleForbiddenV311(gs){
  gs=gs||gameState;
  return !!(gs && gs.turn===1 && gs.activePlayer===gs.firstPlayer);
}
function battlePhaseForbiddenV340(gs){
  gs=gs||gameState;
  if(!gs) return false;
  if(firstTurnBattleForbiddenV311(gs)) return 'firstTurn';
  const P=gs.players && gs.players[gs.activePlayer];
  if(P && P.temporaryFlags && P.temporaryFlags.noBattlePhase) return 'effect';
  /* S03-U286: 「…が存在する限り、相手はバトルフェイズを行えない」 (地縛神 Chacu Challhua) — continuous.noOpponentBattlePhaseS03(card) on a source of the other player */
  if(typeof continuousSources==='function' && gs===gameState && continuousSources().some(src=>{
    const f = src && src.sc && src.sc.continuous && src.sc.continuous.noOpponentBattlePhaseS03;
    if(typeof f!=='function' || src.p===gs.activePlayer) return false;
    try{ return !!f(src.card); }catch(e){ return false; }
  })) return 'effect';
  return false;
}
/* DUELモードでは、Battle Phaseを行えない時のMain1からは直接Endへ進む。 */
function nextPhaseIdV27(){
  if(PLAY_MODE===PLAY_MODES.DUEL && gameState.phase==='main1' && battlePhaseForbiddenV340(gameState)) return 'end';
  const i=PHASES.findIndex(x=>x.id===gameState.phase);
  return i>=0&&i<PHASES.length-1?PHASES[i+1].id:null;
}
function canLeaveBattleV27(){
  if(gameState.phase!=='battle') return true;
  const must=pendingMustAttack(); if(!must.length) return true;
  const names=must.map(c=>labelOf(c)).join('、');
  return confirm(`${names} は攻撃可能な場合には攻撃しなければなりません。\nこのままバトルフェイズを終えますか？`);
}
function legalPhaseTransitionV28(from,to){
  const map={draw:['standby'],standby:['main1'],main1:['battle','end'],battle:['main2','end'],main2:['end'],end:[]};
  return !!(map[from]&&map[from].includes(to));
}
function processPhaseV27(pl){
  const to=pl.to||nextPhaseIdV27(); if(!to||to===gameState.phase) return PROC_V27_CANCEL;
  if(PLAY_MODE===PLAY_MODES.DUEL && !pl.force && !legalPhaseTransitionV28(gameState.phase,to)){
    showToast(`${phaseJp(gameState.phase)}から${phaseJp(to)}へは直接移れません`); return PROC_V27_CANCEL;
  }
  /* System v7: フェイズのスキップ予約。draw / standby / battle / main2 に効く。 */
  if(typeof phaseSkippedV7==='function' && phaseSkippedV7(gameState, gameState.activePlayer, to)){
    act({type:'PHASE_SKIP_V7',player:gameState.activePlayer,phase:to,mode:'consume'});
    const after=(function(){const i=PHASES.findIndex(x=>x.id===to);return i>=0&&i<PHASES.length-1?PHASES[i+1].id:'end';})();
    showToast(`カードの効果により ${phaseJp(to)} をスキップします`);
    enqueueProcessorListFrontV27([{type:PROCESSOR_V27.PHASE,payload:{to:after,force:true}}]);
    return PROC_V27_DONE;
  }
  if(to==='battle' && typeof battlePhaseSkippedV6==='function'
     && battlePhaseSkippedV6(gameState, gameState.activePlayer)){
    act({type:'BATTLE_PHASE_V6',player:gameState.activePlayer,mode:'consumeSkip'});
    showToast('カードの効果によりこのバトルフェイズはスキップされます');
    return PROC_V27_CANCEL;
  }
  if(to==='battle' && battlePhaseForbiddenV340(gameState)){
    showToast(firstTurnBattleForbiddenV311(gameState)?'先攻1ターン目はバトルフェイズを行えません。エンドフェイズへ進んでください':'カードの効果によりこのターンはバトルフェイズを行えません');
    return PROC_V27_CANCEL;
  }
  if(gameState.phase==='battle' && to!=='battle' && !pl.byEffectS03 && !canLeaveBattleV27()) return PROC_V27_CANCEL;   /* S03-U152: an effect ends it — no must-attack question */
  const leavingBattleV6 = (gameState.phase==='battle' && to!=='battle');
  if(leavingBattleV6){ battleCommandResetV29(); act({type:'BATTLE_PHASE_V6',player:gameState.activePlayer,mode:'finish'});
    if(typeof runDueSchedulesV7==='function') runDueSchedulesV7('battlePhaseEnd', gameState);
    /* S03-U210: 「このカードは攻撃した場合、バトルフェイズ終了時に破壊される」 (script flag destroyAfterAttackS03; a rule, not a chained effect) */
    for(let p=0;p<2;p++) (gameState.players[p].mz||[]).slice().forEach(c=>{ const sc=c&&CARD_SCRIPTS[cardName(c)];
      if(!sc||!sc.destroyAfterAttackS03||c.face!=='up'||!(Number(c.attackCount)>0)) return; const h=findCardByUid(ensureCardUid(gameState,c));
      if(h&&h.zone==='mz') act({type:'FX_TO_GRAVE',player:h.p,zone:'mz',index:h.index,byDestroy:true,reason:`${cardName(c)}（攻撃したためバトルフェイズ終了時に破壊）`}); }); }
  act({type:'SET_PHASE',phase:to});
  const seq=[{type:PROCESSOR_V27.EVENT,payload:{eventName:'onPhaseChange',evt:{phase:to}}}];
  /* System v6: バトルフェイズ終了時。「戦闘を行った」カードが参照する。 */
  if(leavingBattleV6) seq.push({type:PROCESSOR_V27.EVENT,
    payload:{eventName:'onBattlePhaseEnd',evt:{player:gameState.activePlayer,turn:gameState.turn}}});
  if(to==='standby') seq.push({type:PROCESSOR_V27.EVENT,payload:{eventName:'onStandbyPhase',evt:{phase:to}}});
  /* System v7: フェイズ到達時の予約を実行する */
  if(to==='standby'||to==='draw') seq.push({type:PROCESSOR_V27.SCHEDULE_V7,payload:{at:to==='draw'?'drawPhase':'standbyPhase'}});
  if(to==='end'){
    seq.push({type:PROCESSOR_V27.EVENT,payload:{eventName:'onEndPhase',evt:{phase:to}}});
    // エンドフェイズ固有処理は、誘発確認の後に専用processorで直列処理する。
    seq.push({type:PROCESSOR_V27.END_PHASE,payload:{turn:gameState.turn}});
  }
  seq.push({type:PROCESSOR_V27.ADJUST,payload:{reason:'phase:'+to}});
  /* S03-U170: the Start Step of the Battle Phase — both players may activate Quick Effects / Traps before the first attack
     (威嚇する咆哮 in the opponent's Battle Phase, サイクロン on a set card …). A POINT with the turn player's priority; when both pass
     (or nobody has a response) the battle command follows, as before. */
  if(to==='battle') seq.push({type:PROCESSOR_V27.POINT,payload:{kind:'battleStart',label:'バトルフェイズ開始時（スタートステップ）',
    priority:gameState.activePlayer,passes:0,action:'BATTLE_START_S03',after:{type:PROCESSOR_V27.BATTLE_COMMAND,payload:{reason:'battlePhaseStart'}}}});
  enqueueProcessorListFrontV27(seq); return PROC_V27_DONE;
}
function processTurnV27(pl){
  if(pl.stage==='commit'){
    act({type:'PASS_TURN'});
    enqueueProcessorListFrontV27([
      {type:PROCESSOR_V27.EVENT,payload:{eventName:'onTurnStart',evt:{turn:gameState.turn}}},
      {type:PROCESSOR_V27.SCHEDULE_V7,payload:{at:'turnStart'}},
      {type:PROCESSOR_V27.ADJUST,payload:{reason:'turnStart'}}
    ]);
    return PROC_V27_DONE;
  }
  if(PLAY_MODE===PLAY_MODES.DUEL && gameState.phase!=='end'){
    showToast('DUELモードではエンドフェイズからターンを終了してください'); return PROC_V27_CANCEL;
  }
  /* S03-U273: hand size limit — the turn player discards down to the limit before the turn ends (engine/1ZZJ) */
  if(!pl.handLimitDoneS03 && typeof handLimitStepS03==='function' && handLimitStepS03()){
    pl.handLimitWaitS03=true;
    enqueueProcessorListFrontV27([{type:PROCESSOR_V27.TURN,payload:{handLimitDoneS03:true}}]);
    return PROC_V27_WAIT;
  }
  /* S03-U287: the hand-size discards (S03-U273) queue onDiscardAnyS03 / onSendToGrave — resolve their triggers (魔轟神ルリー …) before the turn ends */
  enqueueProcessorListFrontV27([].concat(pl.handLimitDoneS03 ? [{type:PROCESSOR_V27.DRAIN_EVENTS,payload:{}}] : [], [
    {type:PROCESSOR_V27.EVENT,payload:{eventName:'onTurnEnd',evt:{turn:gameState.turn}}},
    {type:PROCESSOR_V27.SCHEDULE_V7,payload:{at:'turnEnd'}},
    {type:PROCESSOR_V27.TURN,payload:{stage:'commit'}}
  ]));
  return PROC_V27_DONE;
}
function processDrawV27(pl){
  const p=pl.player!=null?pl.player:gameState.activePlayer, n=pl.n||1;
  const normalDraw = pl.normal!==false;
  if(PLAY_MODE===PLAY_MODES.DUEL && normalDraw){
    if(p!==gameState.activePlayer || gameState.phase!=='draw'){
      showToast('通常ドローは手番プレイヤーのドローフェイズに行います'); return PROC_V27_CANCEL;
    }
    if(gameState.drawnThisTurn){
      showToast('このターンの通常ドローは済んでいます'); return PROC_V27_CANCEL;
    }
  }
  /* S03-U244: 「次のターンのドローフェイズのドロー前に相手は手札を全て捨てる」 (火之迦具土) and 「次の相手ターンのドローフェイズをスキップする」
     (八汰烏) — turn-stamped player flags (effectFlags, journaled PLAYER_FLAG_SET), read at this turn's normal draw. */
  if(PLAY_MODE===PLAY_MODES.DUEL && normalDraw){
    for(let q=0;q<2;q++){
      const fq = gameState.players[q].effectFlags || {};
      if(Number(fq.handDiscardBeforeDrawS03)===Number(gameState.turn)){
        for(let i=(gameState.players[q].hand||[]).length-1;i>=0;i--) act({type:'FX_DISCARD', player:q, handIndex:i, reason:fq.handDiscardByS03||'効果'});
        act({type:'PLAYER_FLAG_SET_V42', player:q, key:'handDiscardBeforeDrawS03', deleteFlag:true, temporary:false});
      }
    }
    const fp = gameState.players[p].effectFlags || {};
    if(Number(fp.skipDrawTurnS03)===Number(gameState.turn)){
      act({type:'DRAW_SKIPPED_S03', player:p, name:fp.skipDrawByS03||'効果'});
      return PROC_V27_DONE;
    }
  }
  /* S03-U33 (C-S03-26): 通常のドローの代わりに発動できる効果があれば、ドローする前に選ばせる。 */
  if(PLAY_MODE===PLAY_MODES.DUEL && normalDraw && !pl.declineReplacementS03
     && typeof offerDrawReplacementS03==='function' && offerDrawReplacementS03(p)) return PROC_V27_DONE;
  act({type:'DRAW',player:p,n});
  enqueueProcessorListFrontV27([
    {type:PROCESSOR_V27.EVENT,payload:{eventName:'onDraw',evt:{player:p,n}}},
    /* S03-U321: the per-card onDrawCard events queued by the DRAW action (System v8) were never drained after a normal draw — a card that reacts to
       the card drawn in the Draw Phase (コアキメイル・スピード, 凡骨の意地 …) only saw the event at some later drain. Drain them now. */
    {type:PROCESSOR_V27.DRAIN_EVENTS,payload:{}},
    {type:PROCESSOR_V27.ADJUST,payload:{reason:'draw'}}
  ]);
  return PROC_V27_DONE;
}
function restoreEventRefsV27(raw){
  const evt=Object.assign({},raw||{});
  if(evt.uid){
    const h=findCardByUid(evt.uid);
    evt.card=h&&h.card;
    // System v3.3.0: ダメージステップで生成したonFlip等にも発生プレイヤー/カード名を復元する。
    if(h && evt.player==null) evt.player=h.p;
    if(h && !evt.name) evt.name=cardName(h.card);
  }
  if(Array.isArray(evt.uids)) evt.cards=evt.uids.map(x=>{const h=findCardByUid(x);return h&&h.card;}).filter(Boolean);
  return evt;
}
/* v3.2.1.1: 召喚成功処理は「召喚成功タイミング」と、その後の
   SS2以上のファストエフェクト確認を分離する。
   2011/3/19以降は召喚成功直後の応答窓で起動効果を優先発動できないが、
   両者が応答を終えてオープンなMain Phaseへ戻れば起動効果を発動できる。 */
function postSummonFastPointV321(eventName,evt){
  if(eventName!=='onNormalSummon' && eventName!=='onSpecialSummon' && eventName!=='onFlip') return null;
  const flip=eventName==='onFlip';
  const name=(evt&&evt.name)||((evt&&evt.card)?cardName(evt.card):'モンスター');
  return {
    kind: flip?'flipFast':'summonFast',
    label: `${name} ${flip?'反転':'召喚'}成功後のクイックエフェクト確認`,
    priority: gameState.activePlayer,
    passes: 0,
    action: flip?'FLIP_SUCCESS_FAST':'SUMMON_SUCCESS_FAST',
    clearTimingOnPass: true
  };
}
function processEventV27(pl){
  const eventName=pl.eventName; if(!eventName) return PROC_V27_DONE;
  const evt=restoreEventRefsV27(pl.evt||{});
  if(typeof noteSummonTrapLockS03==='function') noteSummonTrapLockS03(eventName,evt);   /* S03-U213 */
  if(typeof graveRedirectedEventS03==='function' && graveRedirectedEventS03(eventName,evt)) return PROC_V27_DONE;   /* S03-U214 */
  const postPoint=postSummonFastPointV321(eventName,evt);
  EVT_AFTER=()=>{
    if(postPoint) enqueueProcessorV27(PROCESSOR_V27.POINT,postPoint,false);
    processorResumeV27();
  };
  EVT_RESUME_DATA_V484={processor:true,postPoint:postPoint||null};   /* S03-U484: 上のクロージャと同じ継続 */
  const opened=emitEvent(eventName,evt);
  if(opened) return PROC_V27_WAIT;
  EVT_AFTER=null;
  if(postPoint) enqueueProcessorV27(PROCESSOR_V27.POINT,postPoint,false);
  return PROC_V27_DONE;
}

function processEventBatchV28(pl){
  const events=Array.isArray(pl.events)?pl.events:[];
  if(!events.length) return PROC_V27_DONE;
  const all=[];
  events.forEach((item,evIdxS03)=>{
    const eventName=item&&item.eventName; if(!eventName) return;
    const evt=restoreEventRefsV27((item&&item.evt)||{});
    if(typeof noteSummonTrapLockS03==='function') noteSummonTrapLockS03(eventName,evt);   /* S03-U213 */
    if(typeof graveRedirectedEventS03==='function' && graveRedirectedEventS03(eventName,evt)) return;   /* S03-U214 */
    let cs=collectHandlers(eventName,evt);
    /* S03-U71: このタイミングのカードを、既に別の仕組み（quickEffect のクイックエフェクト確認、
       あるいは S03-U19 の activationResponseDeclaredS03）で応答候補として提示済みなら、
       ここで二重に候補へ出さない（クレボンス等、attackDeclare で quickEffect を持つカードが
       ここでも拾われてしまうと、既存の getChainResponsesV2 / POINT 窓の確認と競合する）。 */
    if(item.excludeAlreadyOfferedS03) cs=cs.filter(c=>{
      const sc=CARD_SCRIPTS[c.name];
      /* S03-U120: 強制誘発（No.39 希望皇ホープ②「X素材の無い状態で攻撃対象に選択された場合に発動する」）は、
         quickEffect のカードでも誘発として出す（POINT 窓の任意の応答では、発動しないで済ませられてしまう）。 */
      if(sc && sc.quickEffect===true && !(typeof triggerCandidateForcedS03==='function' && triggerCandidateForcedS03(Object.assign({},c,{eventName,event:evt})))) return false;
      if(typeof activationResponseDeclaredS03==='function' && activationResponseDeclaredS03(c.name)) return false;
      return true;
    });
    /* S03-U295: each group summary (engine/1ZZN, 「…度に」) is its own occurrence — a card may trigger once per summary */
    const sumKeyS03=/BatchS03$/.test(eventName)?(':'+eventName+'#'+evIdxS03):'';
    cs.forEach(c=>all.push(Object.assign({},c,{eventName,event:evt},sumKeyS03?{sumKeyS03}:{})));
  });
  // 1つのscript objectは同一タイミングで重複提示しない。より先に列挙したイベントを優先。
  const seen=new Set(), cands=[];
  all.forEach(c=>{
    const uid=c.card?ensureCardUid(gameState,c.card):`${c.p}:${c.zone}:${c.index}`;
    const k=`${uid}:${c.name}${c.sumKeyS03||''}`; if(seen.has(k)) return; seen.add(k); cands.push(c);
  });
  /* S03-U159: a batch that includes a summon success keeps the post-summon fast window after its chain (processEventV27 does the same) */
  const postS03=pl.postPointS03||null;
  if(!cands.length){ if(postS03) enqueueProcessorV27(PROCESSOR_V27.POINT,postS03,false); return PROC_V27_DONE; }
  EVT_AFTER=()=>{ if(postS03) enqueueProcessorV27(PROCESSOR_V27.POINT,postS03,false); processorResumeV27(); };
  EVT_RESUME_DATA_V484={processor:true,postPoint:postS03||null};   /* S03-U484: 上のクロージャと同じ継続 */
  startEventChainV2('batch',{label:pl.label||'同時誘発'},cands);
  return PROC_V27_WAIT;
}

function damageStepResponseLegalV28(x, step){
  if(!x || !x.db) return false;
  const sc=CARD_SCRIPTS[x.db.n];
  if(!sc) return false;
  // カウンター罠はダメージステップ中でも発動可能（当然、個別条件は別途判定）。
  if(x.db.k==='t' && x.db.sub==='カウンター') return true;
  // 「ダメージステップで発動できる」と明示したカード。Honest/クリボー等。
  if(sc.damageStepOnly){
    if(sc.dsTiming && sc.dsTiming!==step) return false;
    return ['start','before','calc'].includes(step) || sc.dsTiming===step;
  }
  // 攻守を直接変動させる速攻系はダメージ計算前まで。
  if(sc.damageStepLegal===true) return step==='start' || step==='before';
  // 「このタイミングに発動する」誘発はEVENT processor側で扱う。
  return false;
}
function pointResponsesV27(p, pl){
  let list=getChainResponsesV2(p);
  if(pl && pl.kind==='damageStep'){
    const step=(pl.step || (gameState.battle&&gameState.battle.step) || 'start');
    list=list.filter(x=>damageStepResponseLegalV28(x,step));
  }
  return list;
}
function queuePointContinuationV27(pl){
  /* v3.2.1.1: POINTを両者がパスした時点で、その応答タイミングは終了する。
     summonFast / flipFast を残したままにすると、Main Phaseへ戻っても
     モンスター起動効果が永続的に「召喚成功直後」扱いで弾かれてしまう。 */
  if(pl && pl.clearTimingOnPass) gameState.timingWindow=null;
  /* S03-U213: the post-summon response point is over — 「召喚に成功した時、罠カードを発動する事はできない」 ends with it */
  if(pl && pl.kind==='summonFast' && gameState.summonTrapLockS03) delete gameState.summonTrapLockS03;
  if(pl.after && pl.after.type) enqueueProcessorV27(pl.after.type,pl.after.payload||{},true);
}
function processPointV27(pl){
  const p=(pl.priority===0||pl.priority===1)?pl.priority:gameState.activePlayer;
  const passes=pl.passes||0;
  if(pl.kind) gameState.timingWindow={kind:pl.kind,turn:gameState.turn,action:pl.action||'POINT'};
  const list=pointResponsesV27(p,pl);
  if(ADS_CHAIN_MODE===ADS_CHAIN_MODES.IGNORE || (ADS_CHAIN_MODE===ADS_CHAIN_MODES.AVAILABLE && !list.length)){
    const np=passes+1;
    if(np>=2){ queuePointContinuationV27(pl); return PROC_V27_DONE; }
    enqueueProcessorV27(PROCESSOR_V27.POINT,Object.assign({},pl,{priority:p===0?1:0,passes:np}),true);
    return PROC_V27_DONE;
  }
  const rows=list.map(x=>`<div class="act pick-row" onclick="pointActivateV27(${p},'${x.zone}',${x.index}${x.ownerS03!=null?','+x.ownerS03:''})"><span class="pk-nm">${x.db.n}</span><span class="pk-sub">${x.ownerS03!=null?'相手の':''}${zoneJp(x.zone)} / SS${x.ss} / ${effectClassV2(CARD_SCRIPTS[x.db.n],x.db)}</span></div>`).join('');
  sheet.innerHTML=`<div class="grip"></div><h3 style="margin-bottom:6px">${pl.label||'クイックエフェクト確認'}</h3>
    <div class="meta" style="margin-bottom:10px"><b>${nameOf(p)}</b> に優先権があります。${list.length?'発動するカードを選ぶかパスしてください。':'発動可能なカードはありません。'}</div>
    ${rows?`<div class="pick-list">${rows}</div>`:''}<div class="act-grid wide"><div class="act fx" onclick="pointPassV27()">パス</div></div>`;
  veil.classList.add('on'); return PROC_V27_WAIT;
}
function pointPassV27(){
  ensureProcessorStateV27(); const w=gameState.processorWaiting;
  if(!w||w.type!==PROCESSOR_V27.POINT) return;
  const pl=w.payload||{}, p=(pl.priority===0||pl.priority===1)?pl.priority:gameState.activePlayer, np=(pl.passes||0)+1;
  closeSheet();
  if(np>=2) queuePointContinuationV27(pl);
  else enqueueProcessorV27(PROCESSOR_V27.POINT,Object.assign({},pl,{priority:p===0?1:0,passes:np}),true);
  processorResumeV27();
}
function pointActivateV27(p,zone,index,owner){
  ensureProcessorStateV27(); const w=gameState.processorWaiting;
  if(!w||w.type!==PROCESSOR_V27.POINT) return;
  const pl=w.payload||{};
  CHAIN_AFTER_V2=pointChainAfterV27(pl);
  closeSheet(); duelActivateResponseV2(p,zone,index,owner);
}
/* S03-U296: the callback after a chain that started from a POINT window, as a function of the window's payload only
   (a save / resume rebuilds it from the saved processorWaiting — engine/1ZZP) */
function pointChainAfterV27(pl){
  pl=pl||{};
  const reopen=Object.assign({},pl,{priority:gameState.activePlayer,passes:0});
  return ()=>{
    // System v3.5.0: バトルフェーダー等で攻撃宣言中にBattle Phase自体が終了したら、同じ攻撃窓を開き直さない。
    if(pl.kind==='attackDeclare' && (gameState.phase!=='battle' || (typeof battlePhaseEndedByEffectS03==='function' && battlePhaseEndedByEffectS03()))){ processorResumeV27(); return; }   /* S03-U152: ended by effect → transition queued */
    enqueueProcessorV27(PROCESSOR_V27.POINT,reopen,true);
    processorResumeV27();
  };
}
/* =========================================================================
   System v2.9 — ADS-like Battle Command
   -------------------------------------------------------------------------
   バトルステップでは「合法な攻撃モンスター → 合法な攻撃対象」の順だけを
   盤面上で選べる。カード詳細シートから攻撃対象を探す旧導線に依存しない。
   UI選択状態はルール状態ではないため gameState とは分離する。
   ========================================================================= */
let BATTLE_COMMAND_V29={mode:'idle',attackerUid:null};
function battleCommandResetV29(){ BATTLE_COMMAND_V29={mode:'idle',attackerUid:null}; }
function battleCommandReadyV29(){
  return PLAY_MODE===PLAY_MODES.DUEL && gameState.phase==='battle' && gameState.loser==null &&
    !gameState.battle && !gameState.pendingAttack && !gameState.processorPaused && !gameState.chain.length;
}
function battleAttackersV29(p){
  p=(p===0||p===1)?p:gameState.activePlayer;
  if(gameState.phase!=='battle'||p!==gameState.activePlayer) return [];
  if(gameState.turn===1 && gameState.activePlayer===gameState.firstPlayer) return [];
  const P=gameState.players[p];
  return (P.mz||[]).map((card,index)=>({p,zone:'mz',index,card,db:dbOf(card)})).filter(x=>{
    const c=x.card;
    return c && c.face==='up' && c.pos==='atk' && canDeclareAttackV48(c);
  });
}
function battleTargetsV29(attackerUid){
  const ah=findCardByUid(Number(attackerUid));
  if(!ah||ah.p!==gameState.activePlayer||ah.zone!=='mz') return {attacker:null,targets:[],direct:false};
  const foe=ah.p===0?1:0;
  const allTargets=(gameState.players[foe].mz||[]).map((card,index)=>({p:foe,zone:'mz',index,card,db:dbOf(card)})).filter(x=>!!x.card);
  /* S03-U149: an attack-all card cannot choose a monster it already attacked this turn, nor attack directly after attacking */
  const aaWhy=(t)=>(typeof attackAllTargetReasonS03==='function')?attackAllTargetReasonS03(ah.card,t):'';
  /* S03-U150: 立ちはだかる強敵 — only the selected monster may be attacked this turn */
  const ftWhy=(t)=>(typeof forcedAttackTargetReasonS03==='function')?forcedAttackTargetReasonS03(ah.p,t,ah.card):'';
  const targets=allTargets.filter(x=>!aaWhy(x.card)&&!ftWhy(x.card));
  return {attacker:ah,targets,direct:(allTargets.length===0||canDirectAttackThroughMonstersV51(ah.card))&&!cannotDirectAttackNow(ah.card)&&!aaWhy(null)&&!ftWhy(null)};
}
function processBattleCommandV29(pl){
  if(gameState.phase!=='battle'||gameState.battle||gameState.pendingAttack||gameState.loser!=null){ battleCommandResetV29(); return PROC_V27_CANCEL; }
  const list=battleAttackersV29(gameState.activePlayer);
  BATTLE_COMMAND_V29={mode:list.length?'attacker':'idle',attackerUid:null};
  gameState.timingWindow={kind:'battleStep',turn:gameState.turn,action:'BATTLE_COMMAND'};
  return PROC_V27_DONE;
}
function queueBattleCommandV29(front){
  if(gameState.phase==='battle' && gameState.loser==null)
    enqueueProcessorV27(PROCESSOR_V27.BATTLE_COMMAND,{reason:'returnToBattleCommand'},front!==false);
}
function queueBattleStepReturnV29(label,front){
  if(gameState.phase!=='battle'||gameState.loser!=null) return;
  enqueueProcessorV27(PROCESSOR_V27.POINT,{kind:'battleStep',label:label||'バトルステップ',priority:gameState.activePlayer,passes:0,action:'BATTLE_STEP',
    after:{type:PROCESSOR_V27.BATTLE_COMMAND,payload:{reason:'battleStepReturn'}}},front!==false);
}
function enterBattleCommandV29(){
  if(!battleCommandReadyV29()){ showToast('いまは攻撃モンスターを選択できません'); return; }
  const list=battleAttackersV29(gameState.activePlayer);
  if(!list.length){ battleCommandResetV29(); showToast('攻撃できるモンスターがいません'); render(); return; }
  BATTLE_COMMAND_V29={mode:'attacker',attackerUid:null}; render();
}
function battlePickAttackerV29(uid){
  if(!battleCommandReadyV29()){ showToast('いまは攻撃宣言できません'); return; }
  const h=findCardByUid(Number(uid));
  if(!h||h.p!==gameState.activePlayer||h.zone!=='mz'||!battleAttackersV29(h.p).some(x=>x.card===h.card)){
    showToast('このモンスターは攻撃宣言できません'); return;
  }
  BATTLE_COMMAND_V29={mode:'target',attackerUid:h.card.uid}; render();
}
function battlePickTargetV29(uid){
  if(BATTLE_COMMAND_V29.mode==='replayTarget'){ battleReplayPickV28(Number(uid)); return; }
  if(BATTLE_COMMAND_V29.mode!=='target') return;
  const pack=battleTargetsV29(BATTLE_COMMAND_V29.attackerUid), ah=pack.attacker;
  const th=findCardByUid(Number(uid));
  if(!ah||!th||th.p===ah.p||th.zone!=='mz'||!pack.targets.some(x=>x.card===th.card)){
    showToast('そのモンスターは攻撃対象に選べません'); return;
  }
  battleCommandResetV29();
  requestAttackS03(ah,th.card.uid);   /* S03-U302: an attack-declaration cost (engine/1ZZQ) is paid first */
}
function battleDirectV29(){
  if(BATTLE_COMMAND_V29.mode==='replayTarget'){ battleReplayPickV28('direct'); return; }
  if(BATTLE_COMMAND_V29.mode!=='target') return;
  const pack=battleTargetsV29(BATTLE_COMMAND_V29.attackerUid), ah=pack.attacker;
  if(!ah||!pack.direct){ showToast(ah&&cannotDirectAttackNow(ah.card)?'このモンスターは直接攻撃できません':'相手モンスターがいるため直接攻撃できません'); return; }
  battleCommandResetV29();
  requestAttackS03(ah,'direct');   /* S03-U302 */
}
function battleBackV29(){
  if(BATTLE_COMMAND_V29.mode==='replayTarget'){ battleReplayCancelV28(); return; }
  if(!battleCommandReadyV29()){ battleCommandResetV29(); render(); return; }
  if(BATTLE_COMMAND_V29.mode==='target') BATTLE_COMMAND_V29={mode:'attacker',attackerUid:null};
  else battleCommandResetV29();
  render();
}
function battleCardUIV29(p,zone,index,c){
  if(!c||zone!=='mz') return null;
  const mode=BATTLE_COMMAND_V29.mode;
  const replayActive=mode==='replayTarget' && !!gameState.pendingAttack && !!gameState.processorPaused &&
    !!gameState.processorWaiting && gameState.processorWaiting.type===PROCESSOR_V27.ATTACK;
  if(!battleCommandReadyV29() && !replayActive) return null;
  const uid=ensureCardUid(gameState,c);
  if(mode==='attacker' && p===gameState.activePlayer && battleAttackersV29(p).some(x=>x.card===c))
    return {cls:'battle-pick',onclick:`battlePickAttackerV29(${uid})`};
  if(mode==='target'||mode==='replayTarget'){
    if(uid===BATTLE_COMMAND_V29.attackerUid) return {cls:'battle-selected',onclick:'battleBackV29()'};
    const pack=battleTargetsV29(BATTLE_COMMAND_V29.attackerUid);
    if(pack.targets.some(x=>x.card===c)) return {cls:'battle-pick battle-target',onclick:`battlePickTargetV29(${uid})`};
  }
  return null;
}
function battleDockV29(gs,canUndo,reactN,myReactN){
  if(PLAY_MODE!==PLAY_MODES.DUEL||gs.phase!=='battle'||gs.battle||gs.chain.length) return null;
  const mode=BATTLE_COMMAND_V29.mode;
  const replayActive=mode==='replayTarget' && !!gs.pendingAttack && !!gs.processorPaused &&
    !!gs.processorWaiting && gs.processorWaiting.type===PROCESSOR_V27.ATTACK;
  if(replayActive){
    const pack=battleTargetsV29(BATTLE_COMMAND_V29.attackerUid);
    const direct=pack.direct?`<button class="d-draw pulse" onclick="battleReplayPickV28('direct')">直接攻撃</button>`:'';
    return {
      bar:`<button class="d-prev" onclick="battleReplayCancelV28()">✕</button>${direct}<button class="d-next primary" disabled>リプレイ：対象選択</button><button class="d-next" onclick="battleReplayCancelV28()">攻撃中止</button><button class="d-icon" onclick="toggleDock()">${DOCK_OPEN?'▾':'▴'}</button>`,
      actions:`<button class="d-act gold">赤く光る相手モンスターをタップ</button><button class="d-act" onclick="battleReplayCancelV28()">この攻撃をやめる</button>`
    };
  }
  if(gs.pendingAttack||gs.processorPaused) return null;
  const attackers=battleAttackersV29(gs.activePlayer);
  const pack=mode==='target'?battleTargetsV29(BATTLE_COMMAND_V29.attackerUid):null;
  let primary='';
  if(mode==='target'){
    primary=`<button class="d-next primary" disabled>攻撃対象を選択</button>`;
  }else{
    primary=`<button class="d-next primary ${attackers.length?'pulse':''}" onclick="enterBattleCommandV29()" ${attackers.length?'':'disabled'}>⚔ 攻撃${attackers.length?` (${attackers.length})`:''}</button>`;
  }
  const direct=(mode==='target'&&pack&&pack.direct)?`<button class="d-draw pulse" onclick="battleDirectV29()">直接攻撃</button>`:'';
  const back=mode==='target'?`<button class="d-prev" onclick="battleBackV29()">◂</button>`:`<button class="d-prev" disabled>◂</button>`;
  const bar=`${back}${direct}${primary}<button class="d-next" onclick="battleCommandResetV29();doPhase('main2')">Main2 ▸</button><button class="d-icon undo" onclick="undo()" ${canUndo?'':'disabled'} title="1つ戻す">↺</button><button class="d-icon" onclick="toggleDock()" id="dockToggle" title="詳細">${DOCK_OPEN?'▾':'▴'}</button>`;
  const note=mode==='target'?'赤く光る相手モンスターをタップ':mode==='attacker'?'金色に光る自分モンスターをタップ':(attackers.length?'攻撃コマンドを選択':'攻撃可能モンスターなし');
  const actions=`<button class="d-act gold" onclick="enterBattleCommandV29()">${note}</button>${reactN?`<button class="d-act react" onclick="openReact()">相手<span class="kb">${reactN}</span></button>`:''}${myReactN?`<button class="d-act myreact" onclick="openReactFor(${gs.activePlayer})">自分<b>${myReactN}</b></button>`:''}<button class="d-act" onclick="openMenu()">≡</button>`;
  return {bar,actions};
}

function defenderSnapshotV28(p){
  const foe=p===0?1:0;
  return (gameState.players[foe].mz||[]).filter(Boolean).map(c=>ensureCardUid(gameState,c)).sort((a,b)=>a-b);
}
function sameUidSetV28(a,b){
  a=(a||[]).slice().sort((x,y)=>x-y); b=(b||[]).slice().sort((x,y)=>x-y);
  return a.length===b.length && a.every((x,i)=>x===b[i]);
}
function syncBattleIndicesV28(){
  const b=gameState.battle; if(!b) return false;
  const ah=b.atkUid!=null?findCardByUid(b.atkUid):null;
  if(!ah||ah.p!==b.player||ah.zone!=='mz') return false;
  b.atkIdx=ah.index;
  if(b.targetUid!=null){
    const th=findCardByUid(b.targetUid);
    if(!th||th.p===b.player||th.zone!=='mz') return false;
    b.target=th.index;
  }else b.target='direct';
  return true;
}
function battleContextV28(){
  const b=gameState.battle;
  const lb=gameState.lastBattle||{};
  if(!b){
    const a=gameState.pendingAttack;
    if(!a) return Object.assign({},lb);
    const ah=a.attackerUid!=null?findCardByUid(a.attackerUid):null;
    const th=a.targetUid!=null?findCardByUid(a.targetUid):null;
    const atk=ah&&ah.card, def=th&&th.card;
    return Object.assign({},lb,{
      player:a.player,
      atkIdx:ah?ah.index:null,
      target:a.targetUid==null?'direct':(th?th.index:null),
      atkCard:atk||lb.atkCard||null,
      defCard:def||lb.defCard||null,
      atkName:atk?cardName(atk):(lb.atkName||''),
      defName:def?cardName(def):(lb.defName||''),
      atkOwner:a.player,
      defOwner:a.player===0?1:0,
      step:'attackDeclare',
      battled:false
    });
  }
  syncBattleIndicesV28();
  const ah=b.atkUid!=null?findCardByUid(b.atkUid):null;
  const th=b.targetUid!=null?findCardByUid(b.targetUid):null;
  const atk=ah&&ah.card, def=th&&th.card;
  return Object.assign({},lb,{
    player:b.player, atkIdx:b.atkIdx, target:b.target,
    atkCard:atk||lb.atkCard||null, defCard:def||lb.defCard||null,
    atkName:atk?cardName(atk):(lb.atkName||''), defName:def?cardName(def):(lb.defName||''),
    atkOwner:b.player, defOwner:b.player===0?1:0,
    step:b.step, battled:!!b.battled
  });
}
function battleOpponentV28(card,b){
  b=b||battleContextV28();
  if(!card||!b) return null;
  if(b.atkCard===card) return b.defCard||null;
  if(b.defCard===card) return b.atkCard||null;
  return null;
}
function attackReplayNeededV28(a){
  if(!a) return false;
  if(!sameUidSetV28(a.defenderSnapshot,defenderSnapshotV28(a.player))) return true;
  if(a.targetUid!=null){
    const th=findCardByUid(a.targetUid);
    if(!th||th.p===a.player||th.zone!=='mz') return true;
  }else if((gameState.players[a.player===0?1:0].mz||[]).length && !(a.redirectV6&&a.redirectV6.toDirect)){
    /* S03-U117: 相手モンスターがいても直接攻撃できる攻撃モンスター（ラージマウス／X・E・N・O で得たモンスター等）の直接攻撃は、
       相手モンスターの数が変わらない限りリプレイにならない。以前はこの許可を見ずに必ずリプレイになり、
       DUEL では「直接攻撃できる」効果が一度も通らなかった。 */
    const ahS03=a.attackerUid!=null?findCardByUid(a.attackerUid):null;
    if(!(ahS03 && typeof canDirectAttackThroughMonstersV51==='function' && canDirectAttackThroughMonstersV51(ahS03.card))) return true;
  }
  return false;
}
function openBattleReplayV28(a){
  if(PLAY_MODE===PLAY_MODES.DUEL){
    BATTLE_COMMAND_V29={mode:'replayTarget',attackerUid:a.attackerUid};
    closeSheet(); showToast('リプレイ：攻撃対象を選び直すか、攻撃を中止してください'); render(); return;
  }
  const foe=a.player===0?1:0, mons=(gameState.players[foe].mz||[]).filter(Boolean);
  const rows=mons.map(c=>{
    const uid=ensureCardUid(gameState,c);
    return `<div class="act pick-row" onclick="battleReplayPickV28(${uid})"><span class="pk-nm">${cardName(c)}</span><span class="pk-sub">攻撃対象に選び直す</span></div>`;
  }).join('');
  const direct=!mons.length?`<div class="act fx" onclick="battleReplayPickV28('direct')">直接攻撃を続ける</div>`:'';
  sheet.innerHTML=`<div class="grip"></div><h3 style="margin-bottom:5px">リプレイ</h3>
    <div class="meta" style="margin-bottom:10px">攻撃宣言後に相手モンスターの状況が変化しました。攻撃対象を選び直すか、攻撃を取りやめてください。<br><b>攻撃をやめても、このモンスターは攻撃宣言済みのままです。</b></div>
    ${rows?`<div class="pick-list">${rows}</div>`:''}${direct?`<div class="act-grid wide">${direct}</div>`:''}
    <button class="close" onclick="battleReplayCancelV28()">この攻撃をやめる</button>`;
  veil.classList.add('on');
}
function battleReplayPickV28(uid){
  const w=gameState.processorWaiting, a=gameState.pendingAttack;
  if(!w||w.type!==PROCESSOR_V27.ATTACK||!a) return;
  const foe=a.player===0?1:0;
  if(uid==='direct'){
    const ah=findCardByUid(a.attackerUid);
    if((gameState.players[foe].mz||[]).length && !(ah&&canDirectAttackThroughMonstersV51(ah.card))){ showToast('相手モンスターがいるため直接攻撃できません'); return; }
    if(ah&&cannotDirectAttackNow(ah.card)){showToast('このモンスターは直接攻撃できません');return;}
    act({type:'ATTACK_PENDING_RETARGET_S03',targetUid:null,defenderSnapshot:defenderSnapshotV28(a.player)});   /* S03-U39 */
  }else{
    const h=findCardByUid(Number(uid));
    if(!h||h.p!==foe||h.zone!=='mz'){ showToast('その攻撃対象はもう存在しません'); return; }
    { const ahS03=findCardByUid(a.attackerUid), whyS03=(ahS03&&typeof attackAllTargetReasonS03==='function')?attackAllTargetReasonS03(ahS03.card,h.card):'';   /* S03-U149 */
      if(whyS03){ showToast(whyS03); return; } }
    { const ftS03=(typeof forcedAttackTargetReasonS03==='function')?forcedAttackTargetReasonS03(a.player,h.card,(findCardByUid(a.attackerUid)||{}).card||null):'';   /* S03-U150 */
      if(ftS03){ showToast(ftS03); return; } }
    act(Object.assign({type:'ATTACK_PENDING_RETARGET_S03',targetUid:h.card.uid,defenderSnapshot:defenderSnapshotV28(a.player)},
      (typeof xyzTargetWithoutMaterialS03==='function'&&xyzTargetWithoutMaterialS03(h.card))?{targetNoMaterialS03:true}:{}));   /* S03-U39 / S03-U120 */
  }
  battleCommandResetV29(); closeSheet();
  enqueueProcessorV27(PROCESSOR_V27.POINT,{
    kind:'battleStep',label:'リプレイ後のクイックエフェクト確認',priority:gameState.activePlayer,passes:0,
    action:'BATTLE_REPLAY',after:{type:PROCESSOR_V27.ATTACK,payload:{stage:'commit'}}
  },true);
  processorResumeV27();
}
function battleReplayCancelV28(){
  const a=gameState.pendingAttack; if(a) logIt(gameState,`${a.name}：リプレイで攻撃を取りやめた`);
  act({type:'ATTACK_PENDING_CLEAR_S03',reason:'replayCancel'}); gameState.timingWindow=null; battleCommandResetV29(); closeSheet(); queueBattleStepReturnV29('リプレイ後のバトルステップ',true); processorResumeV27();
}
function processAttackV27(pl){
  if(pl.stage==='commit'){
    const a=gameState.pendingAttack;
    if(!a){ gameState.timingWindow=null; return PROC_V27_CANCEL; }
    if(gameState.attackNegated){
      act({type:'ATTACK_PENDING_CLEAR_S03',reason:'negated'}); gameState.timingWindow=null;   /* S03-U39 */
      logIt(gameState,`${a.name} の攻撃は無効`); queueBattleStepReturnV29('攻撃無効後のバトルステップ',true); return PROC_V27_DONE;
    }
    const ah=findCardByUid(a.attackerUid);
    if(!ah||ah.p!==a.player||ah.zone!=='mz'||ah.card.face!=='up'||ah.card.pos!=='atk'){
      act({type:'ATTACK_PENDING_CLEAR_S03',reason:'attackerGone'}); gameState.timingWindow=null;   /* S03-U39 */
      logIt(gameState,`${a.name} は攻撃を続行できない状態になった`); queueBattleStepReturnV29('攻撃終了後のバトルステップ',true); return PROC_V27_DONE;
    }
    if(attackReplayNeededV28(a)){
      openBattleReplayV28(a); return PROC_V27_WAIT;
    }
    if(a.targetUid==null && cannotDirectAttackNow(ah.card)){
      act({type:'ATTACK_PENDING_CLEAR_S03',reason:'noDirect'}); gameState.timingWindow=null;   /* S03-U39 */
      logIt(gameState,`${a.name} は直接攻撃できない`); queueBattleStepReturnV29('攻撃終了後のバトルステップ',true); return PROC_V27_DONE;
    }
    let target='direct', targetUid=null;
    if(a.targetUid!=null){
      const th=findCardByUid(a.targetUid);
      if(!th||th.p===a.player||th.zone!=='mz'){ openBattleReplayV28(a); return PROC_V27_WAIT; }
      target=th.index; targetUid=th.card.uid;
    }
    act({type:'ATTACK_PENDING_CLEAR_S03',reason:'damageStep'}); gameState.timingWindow={kind:'damageStep',turn:gameState.turn,action:'DAMAGE_STEP'};   /* S03-U39 */
    startBattle(a.player,ah.index,target);
    if(gameState.battle){ gameState.battle.atkUid=ah.card.uid; gameState.battle.targetUid=targetUid; }
    enqueueProcessorV27(PROCESSOR_V27.DAMAGE_STEP,{stage:'enter',step:'start'},true);
    return PROC_V27_DONE;
  }
  const p=pl.player, P=gameState.players[p], c=P&&P.mz[pl.atkIdx]; if(!c) return PROC_V27_CANCEL;
  if(gameState.phase!=='battle'){ showToast('バトルフェイズではありません'); return PROC_V27_CANCEL; }
  if(battlePhaseForbiddenV340(gameState)){ showToast(firstTurnBattleForbiddenV311(gameState)?'先攻1ターン目は攻撃できません':'カードの効果によりこのターンは攻撃できません'); return PROC_V27_CANCEL; }
  if(c.face!=='up'||c.pos!=='atk'||!canDeclareAttackV48(c,pl.costPaidS03===true)){ showToast('このモンスターは攻撃宣言できません'); queueBattleCommandV29(true); return PROC_V27_CANCEL; }
  const foe=p===0?1:0;
  if(pl.target!=='direct' && !gameState.players[foe].mz[pl.target]){ showToast('攻撃対象がありません'); queueBattleCommandV29(true); return PROC_V27_CANCEL; }
  if(pl.target==='direct' && gameState.players[foe].mz.length && !canDirectAttackThroughMonstersV51(c)){ showToast('相手モンスターがいるため直接攻撃できません'); queueBattleCommandV29(true); return PROC_V27_CANCEL; }
  if(pl.target==='direct' && cannotDirectAttackNow(c)){ showToast('このモンスターは直接攻撃できません'); queueBattleCommandV29(true); return PROC_V27_CANCEL; }
  /* S03-U149: 「全てのモンスターに1回ずつ」 — not the same monster twice, no direct attack after attacking */
  { const aaWhyS03=(typeof attackAllTargetReasonS03==='function')?attackAllTargetReasonS03(c, pl.target==='direct'?null:gameState.players[foe].mz[pl.target]):'';
    if(aaWhyS03){ showToast(aaWhyS03); queueBattleCommandV29(true); return PROC_V27_CANCEL; } }
  /* S03-U150: 立ちはだかる強敵 — only the selected monster may be attacked this turn */
  { const ftWhyS03=(typeof forcedAttackTargetReasonS03==='function')?forcedAttackTargetReasonS03(p, pl.target==='direct'?null:gameState.players[foe].mz[pl.target], c):'';
    if(ftWhyS03){ showToast(ftWhyS03); queueBattleCommandV29(true); return PROC_V27_CANCEL; } }
  ensureCardUid(gameState,c);
  const def=pl.target==='direct'?null:gameState.players[foe].mz[pl.target]; if(def) ensureCardUid(gameState,def);
  /* S03-U39 (C-S03-30): 攻撃中の状態は ATTACK_DECLARE_V48 の中で設定する（直接書くと、攻撃宣言時の罠などの Action が Replay で一致しない） */
  const pendingS03={player:p,attackerUid:c.uid,targetUid:def?def.uid:null,name:cardName(c),defenderSnapshot:defenderSnapshotV28(p)};
  /* S03-U120: 「X素材の無い状態で攻撃対象に選択された場合」（No.39 希望皇ホープ②）のため、選択された瞬間の状態を記録する。
     X素材の無いエクシーズモンスターが対象の時だけ付ける（それ以外の攻撃の記録は変わらない）。 */
  if(def && typeof xyzTargetWithoutMaterialS03==='function' && xyzTargetWithoutMaterialS03(def)) pendingS03.targetNoMaterialS03=true;
  /* S03-U212: the attack's LP cost (attackLpCostS03, engine/00) is paid as the attack is declared */
  { const lcS03=(typeof attackLpCostS03==='function')?attackLpCostS03(c):0; if(lcS03>0){ act({type:'LP',player:p,delta:-lcS03,cause:'cost'}); logIt(gameState,`${cardName(c)}：攻撃するために${lcS03}ライフポイントを払った`); } }
  act({type:'ATTACK_DECLARE_V48',player:p,mzIndex:pl.atkIdx,pending:pendingS03});
  /* S03-U153: a pending 「攻撃を1度だけ無効にする」 (ネクロ・ガードナー activated earlier this turn) negates this attack */
  if(typeof pendingAttackNegatorsS03==='function') pendingAttackNegatorsS03(p);
  gameState.timingWindow={kind:'attackDeclare',turn:gameState.turn,action:'ATTACK_DECLARE'};
  logIt(gameState,`${cardName(c)}：${pl.target==='direct'?'直接攻撃':'攻撃宣言'}`);
  /* S03-U71: 攻撃対象に選ばれた時の強制効果（passive.onAttackDeclare、quickEffect でも
     activationResponseDeclaredS03 でもないもの）は getChainResponsesV2 のクイックエフェクト
     候補リストには出ない（あちらは「任意で発動を選ぶ」応答専用の仕組み）。ダメージステップの
     EVENT_BATCH（queueDamageWindowV28）と同じ、collectHandlers ベースの誘発イベントとして
     POINT窓より先に解決する（例：カラクリ守衛 参壱参「攻撃対象に選択された時、表示形式を
     変更する」。強制誘発がなければ processEventBatchV28 が候補ゼロで即 DONE になるだけで、
     既存の攻撃宣言フローに実質的な変化はない）。 */
  enqueueProcessorListFrontV27([
    {type:PROCESSOR_V27.EVENT_BATCH,payload:{label:`${cardName(c)} の攻撃宣言`,
      events:[{eventName:'onAttackDeclare',evt:{player:p,attackerUid:c.uid,targetUid:def?def.uid:null},excludeAlreadyOfferedS03:true}]}},
    {type:PROCESSOR_V27.POINT,payload:{
      kind:'attackDeclare',label:`${cardName(c)} の攻撃宣言`,priority:gameState.activePlayer,passes:0,
      action:'ATTACK_DECLARE',after:{type:PROCESSOR_V27.ATTACK,payload:{stage:'commit'}}
    }}
  ]);
  return PROC_V27_DONE;
}

function makeDamageBatchEventsV28(step){
  const b=gameState.battle, out=[]; if(!b) return out;
  if(step==='after' && b.flipped && !b.flipResolved && b.flippedUid!=null){
    b.flipResolved=true;
    out.push({eventName:'onFlip',evt:{uid:b.flippedUid,treatAsField:true,step:'after'}});
  }
  out.push({eventName:'onDamageStep',evt:{step}});
  return out;
}
function queueDamageWindowV28(step,nextStage,extraEvents){
  const events=(extraEvents||makeDamageBatchEventsV28(step));
  const seq=[];
  if(events.length) seq.push({type:PROCESSOR_V27.EVENT_BATCH,payload:{label:dsInfo(step).jp,events}});
  seq.push({type:PROCESSOR_V27.POINT,payload:{kind:'damageStep',step,label:dsInfo(step).jp,priority:gameState.activePlayer,passes:0,
    action:'DAMAGE_STEP',after:{type:PROCESSOR_V27.DAMAGE_STEP,payload:nextStage}}});
  enqueueProcessorListFrontV27(seq);
}
function markBattleLoserV28(){
  if(gameState.loser!=null) return true;
  for(let p=0;p<2;p++) if(gameState.players[p].lp<=0){
    /* S03-U38 (C-S03-29): 決着は Action で記録する（直接書くと Replay の最終 digest と保存が一致しない） */
    act({type:'DUEL_LOSER_S03',player:p,reason:'lp0'});
    gameState.processorQueue=[]; return true;
  }
  return false;
}
function finishDamageStepV28(reason){
  const b=gameState.battle;
  if(b && !b.cleaned && hasPendingBattleDestroy()) act({type:'BATTLE_CLEANUP'});
  gameState.battle=null; gameState.timingWindow={kind:'battleStep',turn:gameState.turn,action:'BATTLE_STEP'};
  closeSheet();
  if(reason) processorTraceV27('damage end: '+reason,gameState.processorCurrent);
  // ADS同様、ダメージステップ終了後はバトルステップのクイックエフェクト確認へ戻る。
  enqueueProcessorV27(PROCESSOR_V27.POINT,{kind:'battleStep',label:'バトルステップ',priority:gameState.activePlayer,passes:0,action:'BATTLE_STEP',
    after:{type:PROCESSOR_V27.BATTLE_COMMAND,payload:{reason:'damageStepEnd'}}},true);
}
function processDamageStepV27(pl){
  const b=gameState.battle;
  if(!b) return PROC_V27_CANCEL;
  const stage=pl.stage||'enter', step=pl.step||b.step||'start';
  if(stage==='enter'){
    /* S03-U26: ダメージ計算を行った後の⑥ダメージステップ終了時は、戦闘で破壊されたモンスターが⑤で墓地へ送られて
       場にいなくても行う（攻撃した側の「ダメージステップ終了時」の効果：電動刃虫、アックス・ドラゴニュート、アマゾネスの賢者 など）。
       戦闘を行ったカードは lastBattle から引ける（battleContextV28）。ダメージ計算前に戦闘相手が消えた場合は従来どおり戦闘終了。 */
    const endAfterCalcS03 = (step==='end' && b.battled===true);
    if(!syncBattleIndicesV28() && !endAfterCalcS03){
      // Damage Stepに入った後に戦闘相手が消えた場合はリプレイではなく戦闘終了。
      finishDamageStepV28('combatant left field'); return PROC_V27_DONE;
    }
    b.step=step; gameState.timingWindow={kind:'damageStep',step,turn:gameState.turn,action:'DAMAGE_STEP'};
    if(step==='before' && !b.flipped && b.target!=='direct'){
      const fo=b.player===0?1:0, def=gameState.players[fo].mz[b.target];
      if(def && def.face==='down'){
        ensureCardUid(gameState,def); b.flippedUid=def.uid; b.flippedCard=def;
        act({type:'FX_SET_STATE',player:fo,zone:'mz',index:b.target,face:'up',reason:'ダメージ計算前のリバース'});
        b.flipped=true;
      }
    }
    if(step==='start') queueDamageWindowV28('start',{stage:'enter',step:'before'});
    else if(step==='before') queueDamageWindowV28('before',{stage:'enter',step:'calc'});
    else if(step==='calc') queueDamageWindowV28('calc',{stage:'calculate'});
    else if(step==='after') queueDamageWindowV28('after',{stage:'cleanup'});
    else if(step==='end') queueDamageWindowV28('end',{stage:'finish'});
    return PROC_V27_DONE;
  }
  if(stage==='calculate'){
    if(!syncBattleIndicesV28()){ finishDamageStepV28('combatant left before calculation'); return PROC_V27_DONE; }
    b.step='calc'; b.battled=true;
    if(b.target!=='direct'){
      const def=gameState.players[b.player===0?1:0].mz[b.target];
      b.defPosAtCalc=def?(def.pos||'atk'):null;
    }
    act({type:'ATTACK',player:b.player,atkIdx:b.atkIdx,target:b.target,declaredAttackCount:attackCountV48(gameState.players[b.player].mz[b.atkIdx]),
      battleCtxS03:(typeof battleContextSnapshotS03==='function')?battleContextSnapshotS03(b):null}); b.resolved=true;   /* S03-U21 */
    if(markBattleLoserV28()) return PROC_V27_DONE;
    /* S03-U50: ダメージ計算で積まれた onLPChange / onBattleDamage / onDirectBattleDamage を、ダメージ計算後の窓の前に処理する
       （戦闘ダメージを受けた時の誘発：冥府の使者ゴーズ・仮面魔道士など。2011 wiki 《冥府の使者ゴーズ》 age 37）。 */
    enqueueProcessorListFrontV27([{type:PROCESSOR_V27.DRAIN_EVENTS,payload:{}},{type:PROCESSOR_V27.DAMAGE_STEP,payload:{stage:'enter',step:'after'}}]);
    return PROC_V27_DONE;
  }
  if(stage==='cleanup'){
    /* S03-U173: optional destruction substitutes (engine/1ZV) — wait for the decisions, then run this stage again */
    if(typeof destroySubBattleS03==='function' && destroySubBattleS03(b)){
      enqueueProcessorListFrontV27([{type:PROCESSOR_V27.DAMAGE_STEP,payload:{stage:'cleanup'}}]);
      return PROC_V27_WAIT;
    }
    b.step='leave';
    const destroyed=[];
    gameState.players.forEach((P,p)=>(P.mz||[]).forEach(c=>{ if(c&&c.battleDestroyed){ ensureCardUid(gameState,c); destroyed.push({p,uid:c.uid}); }}));
    if(destroyed.length){ act({type:'BATTLE_CLEANUP'}); b.cleaned=true; }
    /* S03-U183: a monster that an equip replaced (engine/1ZZB) stayed on the field — no battle-destruction events for it */
    for(let k=destroyed.length-1;k>=0;k--){ const hS03=findCardByUid(destroyed[k].uid); if(hS03 && hS03.zone==='mz') destroyed.splice(k,1); }
    const events=[{eventName:'onDamageStep',evt:{step:'leave'}}];
    // 墓地へ送られた結果の複数イベントは同一タイミングの候補としてまとめる。
    destroyed.forEach(x=>{
      events.push({eventName:'onBattleDestroy',evt:{uid:x.uid,selfOnly:true,reason:'battle'}});
      events.push({eventName:'onDestroy',evt:{uid:x.uid,selfOnly:true,reason:'battle'}});
      events.push({eventName:'onSendToGrave',evt:{uid:x.uid,selfOnly:true,reason:'battle'}});
    });
    /* S03-U156: BATTLE_CLEANUP also queues each destroyed monster's onLeaveField (engine/18 v9). It used to stay in the deferred
       queue after the battle (nothing drains it until a later chain or phase), so 「このカードがフィールド上から墓地へ送られた時」
       (クリッター・黒き森のウィッチ・ゴブリンゾンビ②, engine/1ZT) missed battle destruction. It is the same event as the destruction:
       take it out of the queue (as an Action — deferredEvents is in the digest) and dispatch it in this batch. */
    if(destroyed.length){
      const uids=destroyed.map(x=>x.uid);
      const leave=(gameState.deferredEvents||[]).filter(it=>it&&it.eventName==='onLeaveField'&&it.evt&&uids.indexOf(it.evt.uid)>=0);
      if(leave.length){
        commitAutomaticActionV44({type:'EVENT_TAKE_S03',eventName:'onLeaveField',uids});
        leave.forEach(it=>events.push({eventName:'onLeaveField',evt:JSON.parse(JSON.stringify(it.evt))}));
      }
    }
    /* S03-U293: the monsters this battle sent to the GY, as one summary in the same batch (engine/1ZZN onFieldToGraveBatchS03) */
    if(destroyed.length && typeof fieldToGraveItemS03==='function'){
      const itemsS03=destroyed.map(x=>fieldToGraveItemS03(gameState,x.uid,x.p)).filter(Boolean);
      if(itemsS03.length) events.push({eventName:'onFieldToGraveBatchS03',evt:fieldToGraveSummaryEvtS03(itemsS03)});
    }
    enqueueProcessorListFrontV27([
      {type:PROCESSOR_V27.EVENT_BATCH,payload:{label:'戦闘破壊・墓地送り',events}},
      {type:PROCESSOR_V27.POINT,payload:{kind:'damageStep',step:'leave',label:'戦闘破壊後',priority:gameState.activePlayer,passes:0,action:'DAMAGE_STEP',after:{type:PROCESSOR_V27.DAMAGE_STEP,payload:{stage:'enter',step:'end'}}}}
    ]);
    return PROC_V27_DONE;
  }
  if(stage==='finish'){
    finishDamageStepV28('normal'); return PROC_V27_DONE;
  }
  return PROC_V27_DONE;
}

function resolveOnePreparedLinkV27(link){
  const sc=CARD_SCRIPTS[link.name], src=findCardByUid(link.uid), srcCard=src?src.card:null;
  const activationNegated = link.activationNegated===true || (link.negated && link.negateMode==='activation');
  const chainEffectNegated = link.effectNegated===true || (link.negated && link.negateMode==='effect');
  // System v3.3.0: モンスター効果の発動元が効果無効なら、発動自体は成立しても効果は適用しない。
  // ヴェーラー/聖杯等は発動時の個別無効を保持し、Skill Drain 等は解決時に場にいる時だけ判定する。
  const srcLoc = srcCard ? locateCard(srcCard) : null;
  const sourceFieldNegated = !!(srcCard && link.from==='mz' && srcLoc && srcLoc.zone==='mz' && effectNegated(srcCard));
  const sourceEffectNegated = !!(link.sourceNegatedAtActivation || sourceFieldNegated);
  /* S03-U25: 戦闘で破壊したモンスターの永続効果（漆黒の魔王 LV4 など）による、墓地から発動した効果の無効。 */
  const battleNegatedS03 = (typeof battleDestroyedLinkNegatedS03==='function') ? battleDestroyedLinkNegatedS03(link, srcCard) : false;
  /* S03-U118: 解決時に王宮のお触れ・トラップ・スタン・サイコ・ショッカーで無効になっている魔法＆罠ゾーンの罠カード。 */
  const trapNegatedS03 = (typeof trapLinkNegatedAtResolutionS03==='function') ? trapLinkNegatedAtResolutionS03(link, srcCard) : false;
  const effectNegatedNow = chainEffectNegated || sourceEffectNegated || battleNegatedS03 || trapNegatedS03;
  if(activationNegated){
    logIt(gameState,`チェーン：${link.name} は${link.negateReason||'発動を無効'}のため発動が成立しません`);
    /* S03-U29: 発動を無効にされた魔法・罠カードは墓地へ送られる（破壊ではない）。 */
    if(typeof settleNegatedCardActivationS03==='function') settleNegatedCardActivationS03(link);
    /* S03-U33: 通常のドローの代わりの効果の発動が無効 → 通常のドローを行う（2011 wiki 10/03/24）。 */
    if(link.drawReplacementS03 && typeof drawReplacementActivationNegatedS03==='function') drawReplacementActivationNegatedS03(link);
    /* S03-U34 (C-S03-27): 宣言したカードは、発動が無効なら回数制限の消費を戻す。 */
    if(typeof activationNegatedReleaseS03==='function') activationNegatedReleaseS03(link);
    return;
  }
  if(link.prepared&&sc){
    const ctx=preparedChainContext(link); RESOLUTION_SUMMON_BATCH_V2=[];
    if(link.cardActivationOnly){
      /* S03-U10: カードの発動だけが成立した。効果は適用せず、カードは場に残る。 */
      logIt(gameState,`チェーン：${link.name} の発動が成立（効果は発動していません）`);
      /* S03-U216: bookkeeping on the card itself when its card activation resolves (not an effect) — 波動キャノン records the turn it was activated */
      if(typeof sc.onCardActivationResolvedS03==='function'){ try{ sc.onCardActivationResolvedS03(ctx); }catch(e){ console.error(e); } }
    }else if(typeof sc.resolve==='function'){
      if(effectNegatedNow){
        const why = chainEffectNegated ? (link.negateReason||'無効') : trapNegatedS03 ? (srcCard && dbOf(srcCard).k==='s' ? 'フィールドの魔法カードの効果が無効化されている' : 'フィールドの罠カードの効果が無効化されている') : '発動元モンスターの効果が無効';
        logIt(gameState,`チェーン：${link.name} の効果は${why}のため適用されません`);
      }else{
        /* S03-U22: 解決中のブロック（誘発イベント／damageStepOnly）を攻守変化の判定に使う。 */
        if(typeof beginLinkResolutionS03==='function') beginLinkResolutionS03(link, sc);
        /* S03-U79: P3 由来metadata（moveProvenance／API.movedByOpponentEffect）は
           p3BeginEffectContextV3/p3EndEffectContextV3 で囲んだ区間内の FX_TO_GRAVE 等にだけ
           自動で付く（engine/12_provenance_v3.js）。これまで実DUELモードのチェーン解決
           （このresolveOnePreparedLinkV27）では一度も呼ばれておらず、cards/88_p3_provenance_recovery.js
           の各カードは自前のテストヘルパーでしか検証されていなかった —
           real DUEL 経路では movedByOpponentEffect が常に false になる ENGINE_MISSING だった。 */
        if(typeof p3BeginEffectContextV3==='function') p3BeginEffectContextV3(link.player, link.uid, link.name);
        try{ sc.resolve(ctx); }catch(e){
          gameState.systemFault=`${link.name} 解決エラー：${e.message||e}`;
          logIt(gameState,`<b>システム</b>：${gameState.systemFault}`);
        } finally {
          if(typeof p3EndEffectContextV3==='function') p3EndEffectContextV3();
        }
      }
      // 効果だけ無効でも「発動は成立して解決した」ので、通常魔法・罠の墓地送り等は行う。
      try{ afterPreparedResolve(link,ctx); }catch(e){
        gameState.systemFault=`${link.name} 後処理エラー：${e.message||e}`;
        logIt(gameState,`<b>システム</b>：${gameState.systemFault}`);
      }
    }
    // 発動無効でなければ、効果無効でも「魔法カードの発動」は成立している。
    if(typeof v350ApplySpellCounterObservers==='function' && link&&link.cardId!=null && CARD_DB[link.cardId] && CARD_DB[link.cardId].k==='s') v350ApplySpellCounterObservers(link);
    flushResolutionSummonBatchV2(); reconcileProcedureBaseStats();
  }
}
function processChainEndV30(){
  gameState.chainWindow=null;
  if(typeof endLinkResolutionS03==='function') endLinkResolutionS03();   /* S03-U22 */
  // 最終リンク解決後のAdjustを済ませてから、召喚無効窓や元処理へ戻る。
  if(gameState.pendingSummon){ finishSummonNegationChainV2(); return PROC_V27_DONE; }
  if(gameState.eventChainResumeV11){
    const resume=gameState.eventChainResumeV11;
    commitAutomaticActionV44({type:'EVENT_RESUME_V11'});CHAIN_AFTER_V2=null;resumeEventProcessorV11(resume);
    return PROC_V27_DONE;
  }
  const cb=CHAIN_AFTER_V2; CHAIN_AFTER_V2=null;
  if(cb){
    try{ cb(); }catch(e){
      gameState.systemFault=`チェーン後処理エラー：${e.message||e}`;
      logIt(gameState,`<b>System v3.1</b>：${gameState.systemFault}`);
    }
  }
  return PROC_V27_DONE;
}
function processSolveChainV27(){
  if(!gameState.chain.length){
    enqueueProcessorListFrontV27([
      {type:PROCESSOR_V27.ADJUST,payload:{reason:'chainEnd'}},
      {type:PROCESSOR_V27.CHAIN_END,payload:{}},
      {type:PROCESSOR_V27.DRAIN_EVENTS,payload:{}}
    ]);
    return PROC_V27_DONE;
  }
  const link=gameState.chain[gameState.chain.length-1];
  /* CODEX-C01: delay special-win evaluation only for this one resolving link.
     The matching end is below, or in resumeAfterResolutionChoiceS03 after its
     last resolution-time choice.  It deliberately precedes the next Adjust/link. */
  RESOLVE_START_SEQ_S296=(typeof V41_ACTION_SEQ!=='undefined')?V41_ACTION_SEQ:null;   /* S03-U296 */
  if(typeof specialWinBeginLinkResolutionS03==='function') specialWinBeginLinkResolutionS03();
  /* S03-U383: the dice of the 2003 「デーモン」 monsters are rolled when a link that targets them is about to be processed (engine/1ZZR) */
  if(typeof applyDiceDemonResolveS03==='function') applyDiceDemonResolveS03(link);
  act({type:'CHAIN_RESOLVE_TOP'}); resolveOnePreparedLinkV27(link);
  /* S03-U173: destructions deferred for an optional substitute decision (engine/1ZV) */
  if(typeof flushDestroySubS03==='function') flushDestroySubS03();
  if(gameState.chain.length){
    enqueueProcessorListFrontV27([
      {type:PROCESSOR_V27.ADJUST,payload:{reason:'chainLink'}},
      {type:PROCESSOR_V27.SOLVE_CHAIN,payload:{}}
    ]);
  }else{
    enqueueProcessorListFrontV27([
      {type:PROCESSOR_V27.ADJUST,payload:{reason:'chainEnd'}},
      {type:PROCESSOR_V27.CHAIN_END,payload:{}},
      {type:PROCESSOR_V27.DRAIN_EVENTS,payload:{}}
    ]);
  }
  /* S03-U278: the position choices of this link's Special Summons (engine/1ZZK) open once the script is done */
  if(typeof ssPositionPumpS03==='function') ssPositionPumpS03();
  /* S03-U41 (C-S03-33): 解決中に選択が開いたら、回答（とその継続）が終わるまで次の処理へ進まない */
  if(typeof resolutionChoiceWaitS03==='function' && resolutionChoiceWaitS03()) return PROC_V27_WAIT;
  if(typeof specialWinEndLinkResolutionS03==='function') specialWinEndLinkResolutionS03();
  return PROC_V27_DONE;
}
function resolveReservedEffectsV30(at){
  const due=(gameState.reserved||[]).filter(r=>r.at===at && r.turn===gameState.turn);
  if(!due.length) return 0;
  let handled=0;
  const handledKinds=new Set();
  due.forEach(r=>{
    if(r.kind==='destroyUids'){
      (r.uids||[]).forEach(uid=>{
        const h=findCardByUid(uid);
        // 一度場を離れたカードは reset() で期限フラグが消えるので、戻ってきても破壊しない。
        const flagKey=r.flagKey||'rabbitEndDestroyTurn';
        if(h && h.zone==='mz' && h.card[flagKey]===gameState.turn){
          act({type:'FX_TO_GRAVE',player:h.p,zone:'mz',index:h.index,reason:r.name||'エンドフェイズの破壊',byDestroy:true});
        }
      });
      handled++; handledKinds.add('destroyUids');
    }else if(r.kind==='levelResetUids'){
      (r.uids||[]).forEach(uid=>{
        const h=findCardByUid(uid), flagKey=r.flagKey||'v370LevelResetTurn';
        if(h && h.zone==='mz' && h.card[flagKey]===gameState.turn){
          act({type:'FX_SET_STATE',player:h.p,zone:'mz',index:h.index,lvReset:true,reason:r.name||'レベルを元に戻す'});
          const now=findCardByUid(uid); // S03-U08: 期限flagの削除もActionで行う
          if(now&&now.zone==='mz') act({type:'FX_CARD_FLAG_V46',player:now.p,zone:'mz',index:now.index,flag:flagKey,value:null,reason:r.name||'予約効果終了',silent:true});
        }
      });
      handled++; handledKinds.add('levelResetUids');
    }else if(r.kind==='destroyDamageUids'){
      let damage=0; const flagKey=r.flagKey||'v380EndDestroyTurn';
      (r.uids||[]).forEach(uid=>{
        const h=findCardByUid(uid);
        if(h && h.zone==='mz' && h.card[flagKey]===gameState.turn){
          damage+=Math.max(0,curATK(h.card));
          act({type:'FX_TO_GRAVE',player:h.p,zone:'mz',index:h.index,reason:r.name||'エンドフェイズの破壊',byDestroy:true});
        }
      });
      if(damage>0){const dp=(r.data&&r.data.damagePlayer!=null)?r.data.damagePlayer:r.player;act({type:'LP',player:dp,delta:-damage});logIt(gameState,`${r.name||'予約効果'}：${damage}ダメージ`);}
      handled++; handledKinds.add('destroyDamageUids');
      }else if(r.kind==='flipUpAttackUids'){
      const flagKey=r.flagKey||'v47ZenmaisterTurn';
      (r.uids||[]).forEach(uid=>{
        const h=findCardByUid(uid);
        if(h && h.zone==='mz' && h.card[flagKey]===gameState.turn){
          act({type:'FX_SET_STATE',player:h.p,zone:'mz',index:h.index,face:'up',pos:'atk',reason:r.name||'表側攻撃表示に戻す'});
          const now=findCardByUid(uid);
          if(now&&now.zone==='mz') act({type:'FX_CARD_FLAG_V46',player:now.p,zone:'mz',index:now.index,flag:flagKey,value:null,reason:r.name||'予約効果終了'});
        }
      });
      handled++; handledKinds.add('flipUpAttackUids');
    }
  });
  // 自動処理できた予約だけ消す。未対応の予約は従来どおり状態画面に残す。
  if(handled){
    gameState.reserved=gameState.reserved.filter(r=>!(r.at===at && r.turn===gameState.turn && handledKinds.has(r.kind)));
  }
  return handled;
}
function processEndPhaseV30(){
  // onEndPhase の誘発処理後に、チェーンを作らないエンド処理を順番に適用。
  resolveEndPhaseMills();
  resolveReservedEffectsV30('endPhase');
  /* System v7: 汎用スケジューラのエンドフェイズ分を実行する。
     既存 reserved の処理順は変えない（あとから走らせる）。 */
  if(typeof runDueSchedulesV7==='function') runDueSchedulesV7('endPhase', gameState);
  if(hasControlToReturn()) act({type:'CONTROL_RETURN'});
  /* S03-U39 (C-S03-30): 失効は Action で記録する（Replay で同じ効果が同じ時点で終わる） */
  if(typeof v4ResetRuntimeEffects==='function' && (gameState.runtimeEffects||[]).some(e=>e&&(Number(e.resetMask||0)&RESET.END)))
    act({type:'V4_EFFECT_RESET_S03',event:'endPhase',player:gameState.activePlayer});
  /* S03-U190: events queued by this End Phase processing (a 「ライトロード」 End Phase mill → ライトロード・ビースト ウォルフ, ガロス, ジェニス)
     are dispatched in this End Phase. Before, nothing drained them here: they waited for the next chain, in a later turn. */
  if(PLAY_MODE===PLAY_MODES.DUEL && (gameState.deferredEvents||[]).length)
    enqueueProcessorListFrontV27([{type:PROCESSOR_V27.DRAIN_EVENTS,payload:{}}]);
  return PROC_V27_DONE;
}

/* S03-U156: cards that left the field together (two Tributes, ブラック・ホール, …) trigger simultaneously — one SEGOC, not one chain per
   card in queue order. The head run of leave-field events (onDestroy / onSendToGrave / onRemove / onLeaveField) covering two or more
   cards is dispatched as one EVENT_BATCH (as the battle cleanup does). Before, ナチュル・クリフ Tributed together with ガスタ・ガルド was
   only checked after ガスタ・ガルド's chain had resolved (and filled the last zone). A single card's events keep the one-by-one path. */
const LEAVE_BATCH_EVENTS_S03=['onDestroy','onSendToGrave','onRemove','onLeaveField','onMillBatchS03','onFieldToGraveBatchS03'];   /* S03-U293: + the summaries (engine/1ZZN) */
/* S03-U159: a summon that Tributed monsters (Tribute Summon, or a summon whose cost sends monsters from the field) queues the
   Tributes' leave-field events and then the summon success. Both happened at the same time: the summon-success event right
   after the leave run is part of the same batch (one SEGOC: 「リリースされた時」 and 「召喚に成功した時」 triggers together).
   The post-summon fast window (summonFast) still follows the batch's chain, as on the one-event path. */
const SUMMON_BATCH_EVENTS_S03=['onNormalSummon','onSpecialSummon'];
function leaveBatchRunS03(q){
  let n=0, sumS03=false; const uids=new Set();
  while(n<q.length && q[n] && LEAVE_BATCH_EVENTS_S03.indexOf(q[n].eventName)>=0){ if(q[n].evt&&q[n].evt.uid!=null) uids.add(Number(q[n].evt.uid)); if(/BatchS03$/.test(q[n].eventName)) sumS03=true; n++; }
  if(n>0 && q[n] && SUMMON_BATCH_EVENTS_S03.indexOf(q[n].eventName)>=0) return n+1;
  /* S03-U293: a single card's events with its summary are one batch too (the summary triggers at the same time) */
  return (uids.size>=2 || (sumS03 && n>=2)) ? n : 0;
}
function processDrainEventsV27(){
  /* S03-U290: the Deck-to-GY / discard events queued together get one summary per player first (engine/1ZZN) */
  if(typeof eventSummaryPendingS03==='function' && eventSummaryPendingS03(gameState)) commitAutomaticActionV44({type:'EVENT_SUMMARY_S03'});
  const q=gameState.deferredEvents||[]; if(!q.length) return PROC_V27_DONE;
  const runS03=leaveBatchRunS03(q);
  if(runS03){
    const items=q.slice(0,runS03).map(it=>({eventName:it.eventName,evt:JSON.parse(JSON.stringify(it.evt||{}))}));
    const sumS03=items.find(it=>SUMMON_BATCH_EVENTS_S03.indexOf(it.eventName)>=0);
    const postPointS03=sumS03?postSummonFastPointV321(sumS03.eventName,restoreEventRefsV27(sumS03.evt||{})):null;
    for(let k=0;k<runS03;k++) commitAutomaticActionV44({type:'EVENT_DEQUEUE_V31'});
    enqueueProcessorListFrontV27([
      {type:PROCESSOR_V27.EVENT_BATCH,payload:{label:sumS03?'リリースと召喚成功':'同時に場を離れたカード',events:items,postPointS03}},
      {type:PROCESSOR_V27.DRAIN_EVENTS,payload:{}}
    ]);
    return PROC_V27_DONE;
  }
  const item=q[0];commitAutomaticActionV44({type:'EVENT_DEQUEUE_V31'});
  enqueueProcessorListFrontV27([
    {type:PROCESSOR_V27.EVENT,payload:{eventName:item.eventName,evt:item.evt||{}}},
    {type:PROCESSOR_V27.DRAIN_EVENTS,payload:{}}
  ]);
  return PROC_V27_DONE;
}
function adjustStateV27(){
  reconcileProcedureBaseStats();
  // タイミング窓は同一ターンに属するものだけ保持。
  if(gameState.timingWindow && gameState.timingWindow.turn!==gameState.turn) gameState.timingWindow=null;
  // チェーンが無い時に古い優先権窓を残さない。
  if(!gameState.chain.length && !gameState.pendingSummon) gameState.chainWindow=null;
  // LP0 は applyAction 経由以外のダメージ計算でも到達するため最後に再確認。
  for(let p=0;p<2;p++) if(gameState.players[p].lp<=0 && gameState.loser==null){
    act({type:'DUEL_LOSER_S03',player:p,reason:'lp0'});   /* S03-U38 (C-S03-29) */
  }
}
function processAdjustV27(){ adjustStateV27(); return PROC_V27_DONE; }
function flushDeferredEventsThroughProcessorV27(){
  if(PLAY_MODE!==PLAY_MODES.DUEL){ return false; }
  enqueueProcessorV27(PROCESSOR_V27.DRAIN_EVENTS,{},false); pumpProcessorV27(); return true;
}
function openProcessorDebugV27(){
  ensureProcessorStateV27();
  const cur=gameState.processorCurrent, waiting=gameState.processorWaiting;
  const q=gameState.processorQueue||[], tr=(gameState.processorTrace||[]).slice(-30).reverse();
  sheet.innerHTML=`<div class="grip"></div><h3>Processor Queue v4.8.0</h3>
    <div class="meta" style="margin-bottom:8px">現在：${cur?`#${cur.id} ${cur.type}`:(waiting?`WAIT #${waiting.id} ${waiting.type}`:'IDLE')} / ${gameState.processorPaused?'WAIT':'RUN'} / Queue ${q.length}</div>
    <div class="dbg-list">${q.map(x=>`<div class="dbg-entry"><div class="dbg-name">#${x.id} ${x.type}</div><div class="dbg-step">T${x.turn} ${phaseJp(x.phase)}</div></div>`).join('')||'<div class="meta">待ち処理なし</div>'}</div>
    <div class="act-label">直近の処理</div><div class="dbg-list">${tr.map(x=>`<div class="dbg-entry"><div class="dbg-name">${x.type||'-'} #${x.id||'-'}</div><div class="dbg-step">${x.msg}</div></div>`).join('')||'<div class="meta">ログなし</div>'}</div>
    <button class="close" onclick="openMenu()">戻る</button>`; veil.classList.add('on');
}

function effectClassV2(sc,db){
  if(!sc) return 'UNSCRIPTED';
  if(sc.summonProcedure||sc.normalSummonProcedure) return 'SUMMON_PROC';
  if(sc.continuous && typeof sc.resolve!=='function') return 'CONTINUOUS';
  if(sc.quickEffect===true) return 'QUICK';
  if(sc.passive && Object.keys(sc.passive).length) return sc.forced?'TRIGGER_F':'TRIGGER_O';
  if(db && (db.k==='s'||db.k==='t')) return 'ACTIVATE';
  return 'IGNITION';
}

function scriptSpellSpeed(sc, db){
  if(db && db.k==='t') return db.sub==='カウンター' ? 3 : 2;
  if(db && db.k==='s') return db.sub==='速攻' ? 2 : 1;
  if(sc && sc.quickEffect===true) return 2;
  return Math.max(1, Math.min(3, (sc&&sc.priority)||1));
}
function chainTopSpeed(){ return gameState.chain.length ? (gameState.chain[gameState.chain.length-1].ss||1) : 0; }

/* S03-U10 (C-S03-07): 永続魔法・フィールド魔法・永続罠の「カードの発動」と「効果の発動」を分ける。
   宣言したカード（legacy の fieldIgnition:true、または declareCardActivationFreeV32 の表）を手札・セット状態から発動する時は
   カードの発動だけを行う。効果の条件・回数制限・コスト・対象は使わず、解決しても効果は適用しない。
   表側で場に残った後、効果は別に発動する。
   史実：《竜の渓谷》10/07/04、《神の居城－ヴァルハラ》、《コア転送ユニット》《擬似空間》10/09/23（発動と同時に効果は使えない）。 */
const CARD_ACTIVATION_FREE_V32 = new Set();
function declareCardActivationFreeV32(names){ (names||[]).forEach(n=>CARD_ACTIVATION_FREE_V32.add(n)); }
function cardActivationOnlyV32(name,sc,db,zone,card,opts){
  if(!sc||!db||(db.k!=='s'&&db.k!=='t')||!['永続','フィールド'].includes(db.sub)) return false;
  if(!(sc.fieldIgnition||CARD_ACTIVATION_FREE_V32.has(name))) return false;
  if(opts&&opts.eventName&&opts.eventName!=='activate'&&opts.eventName!=='legalCheck') return false;
  if(opts&&opts.cardActivation) return true;
  if(zone==='hand') return true;
  return !!(card && card.face==='down' && (zone==='sz'||zone==='field'));
}

function strictScriptLegalityV2(name,p,zone,index,opts){
  const sc=CARD_SCRIPTS[name];
  const candidate=(opts&&opts.cardOverride)||zoneCard(gameState.players[p],zone,index);
  const candidateDb=candidate?dbOf(candidate):null;
  const continuousActivation=!!(sc && sc.continuous && candidateDb && (candidateDb.k==='s'||candidateDb.k==='t'));
  if(!sc || (typeof sc.resolve!=='function' && !continuousActivation)) return {ok:false,reason:'自動実行スクリプトがありません'};
  const card=candidate;
  if(!card) return {ok:false,reason:'カードが見つかりません'};
  const logicalZone=(opts&&opts.logicalZone)||zone;
  /* S03-U151: a card activated from the hand is judged at the slot it will take (prospectiveIndex, passed by the callers but
     unused): with the hand index the context pointed at another card's slot — e.g. サイクロン's 「このカード以外」 filter removed the
     card already in the first Spell & Trap slot, so its controller could not target its own only Spell/Trap. */
  const logicalIndexS03=(opts&&opts.prospectiveIndex!=null&&logicalZone!==zone)?Number(opts.prospectiveIndex):index;
  const db=dbOf(card);
  /* S03-U118: 王宮のお触れ・トラップ・スタンは効果を無効にするだけで、罠カードの発動は禁止しない（解決時に無効）。
     発動そのものを禁止するのは forbidTrapActivation（人造人間－サイコ・ショッカー）だけ。 */
  if(db.k==='t'){ const forbidS03=trapActivationForbiddenS03(p,card); if(forbidS03) return {ok:false,reason:forbidS03}; }
  /* S03-U51 (C-S03-39): 宣言した種類のカードの発動の封印（ショック・ルーラー） */
  { const lockS03=(typeof activationTypeLockReasonS03==='function')?activationTypeLockReasonS03(p,card,zone,db,opts):''; if(lockS03) return {ok:false,reason:lockS03}; }
  /* S03-U10: カードの発動だけを行う場合は、効果の回数制限・特殊召喚／サーチ封印・効果のタイミング・条件を判定しない。 */
  if(cardActivationOnlyV32(name,sc,db,zone,card,opts)) return {ok:true,reason:'',cardActivationOnly:true};
  if(sc.countLimit){
    /* S03-U02: effects 指定の回数制限は、この発動が対象の効果である時だけ判定する。 */
    const limitKey=countLimitEffectKeyV32(name,sc,makeContext(p,card,logicalZone,logicalIndexS03,(opts&&opts.eventName)||'legalCheck',Object.assign({},opts||{})));
    if(countLeft(p,name,sc,card,limitKey)<=0) return {ok:false,reason:`${countLimitJp(sc)}までです`};
  }
  /* System v4.4.0: 特殊召喚そのものが目的の効果は、特殊召喚禁止中は発動も不可。 */
  {
    const ssReason=(typeof v46GlobalSpecialSummonRestrictionReason==='function')?v46GlobalSpecialSummonRestrictionReason(p):((gameState.players[p].temporaryFlags&&gameState.players[p].temporaryFlags.noSpecialSummon)?'このターンは特殊召喚できません':'');
    if(ssReason){
      let blocksNoSS = sc.blocksIfNoSpecialSummon===true;
      if(typeof sc.blocksIfNoSpecialSummon==='function'){
        try{ blocksNoSS=!!sc.blocksIfNoSpecialSummon(makeContext(p,card,logicalZone,logicalIndexS03,(opts&&opts.eventName)||'legalCheck',Object.assign({},opts||{}))); }
        catch(e){ blocksNoSS=true; }
      }
      if(blocksNoSS) return {ok:false,reason:`${ssReason}：この効果は発動できません`};
    }
  }
  /* System v32 (S03-U01): デッキから手札に加える事が必須の任意効果は、《ライオウ》等の
     封印が適用中は発動できない。強制効果は宣言しないので発動し、加える処理だけ行わない。 */
  {
    const addLock=(typeof deckToHandLockReasonV32==='function')?deckToHandLockReasonV32(p):'';
    if(addLock){
      let blocksNoAdd = sc.blocksIfNoDeckToHand===true;
      if(typeof sc.blocksIfNoDeckToHand==='function'){
        try{ blocksNoAdd=!!sc.blocksIfNoDeckToHand(makeContext(p,card,logicalZone,logicalIndexS03,(opts&&opts.eventName)||'legalCheck',Object.assign({},opts||{}))); }
        catch(e){ blocksNoAdd=true; }
      }
      if(blocksNoAdd) return {ok:false,reason:`${addLock}：この効果は発動できません`};
    }
  }
  /* 2011/3/19以降：召喚成功直後の応答窓では、誘発・誘発即時ではない
     モンスター起動効果を優先権で発動できない。 */
  const w=gameState.timingWindow;
  const eventActivation=!!(opts&&opts.event);
  if(RULING_1103_POST_20110319_IGNITION && w && w.turn===gameState.turn &&
     ['summon','flip','summonFast','flipFast'].includes(w.kind) && db.k==='m' && sc.quickEffect!==true && !eventActivation){
    return {ok:false,reason:'1103ルール（2011/3/19以降）：召喚成功直後にモンスターの起動効果は発動できません'};
  }
  const tm=timingCheck(sc);
  if(!tm.ok && !(opts&&opts.ignoreTiming)) return {ok:false,reason:tm.why};
  /* S03-U190: the timing 'mainPhase' is 「自分のメインフェイズ」 — timingCheck only looked at the phase, so an ignition effect declared with
     timing ['mainPhase'] was legal in the opponent's Main Phase too. Monster effects only (a Trap's effect is Spell Speed 2 whatever its
     declared timing — 零式魔導粉砕機); quick effects and event activations are not affected. */
  if(!(opts&&opts.ignoreTiming) && !eventActivation && db.k==='m' && sc.quickEffect!==true && gameState.activePlayer!==p){
    const wantS03=scriptTimings(sc);
    if(wantS03.length && wantS03.every(t=>t==='mainPhase')) return {ok:false,reason:'自分のメインフェイズに発動します'};
  }
  let v4EffectKeyS03=null;
  if(sc.condition){
    const ctx=makeContext(p,card,logicalZone,logicalIndexS03,(opts&&opts.eventName)||'legalCheck',Object.assign({},opts||{}));
    let ok=false;
    try{ ok=!!sc.condition(ctx); }catch(e){ return {ok:false,reason:'発動条件の判定でエラー'}; }
    if(!ok) return {ok:false,reason:ctx.reason||'発動条件を満たしていません'};
    v4EffectKeyS03=ctx.v4EffectKey||null;
  }
  return {ok:true,reason:'',v4EffectKey:v4EffectKeyS03};
}

function dbOfByChainV350(link){
  if(link&&link.cardId!=null&&CARD_DB[link.cardId]) return CARD_DB[link.cardId];
  const h=link&&link.uid!=null?findCardByUid(link.uid):null; return h?dbOf(h.card):{};
}
function v350SpellCounterObserverUids(){
  const out=[];
  for(let p=0;p<2;p++){
    const P=gameState.players[p], list=[];
    if(P.field) list.push(P.field); (P.sz||[]).forEach(c=>list.push(c));
    list.forEach(c=>{
      if(!c||c.face!=='up'||c.activationPending||c.activationNegated||effectNegated(c)) return;
      const sc=CARD_SCRIPTS[cardName(c)];
      if(sc&&sc.continuous&&sc.continuous.spellCounterOnSpellResolve) out.push(ensureCardUid(gameState,c));
    });
  }
  return out;
}
function v350ApplySpellCounterObservers(link){
  const uids=Array.isArray(link&&link.spellCounterObserverUids)?link.spellCounterObserverUids:[];
  uids.forEach(uid=>{
    const h=findCardByUid(uid); if(!h||!['sz','field'].includes(h.zone)||h.card.face!=='up'||effectNegated(h.card)) return;
    const sc=CARD_SCRIPTS[cardName(h.card)], def=sc&&sc.continuous&&sc.continuous.spellCounterOnSpellResolve;
    if(!def) return;
    act({type:'COUNTER_ADD',player:h.p,zone:h.zone,index:h.index,kind:def.kind||'魔力',n:def.n||1});
    logIt(gameState,`${cardName(h.card)}：魔法カードの発動・解決により魔力カウンターを1つ置いた`);
  });
}

function safeActivationEventV11(evt){
  const out={};
  Object.keys(evt||{}).forEach(k=>{
    const v=evt[k];
    if(v==null||['string','number','boolean'].includes(typeof v)) out[k]=v;
  });
  if(evt&&evt.card){out.uid=ensureCardUid(gameState,evt.card);out.name=cardName(evt.card);}
  /* S03-U295: a group summary (engine/1ZZN) keeps its plain-JSON lists (uids, reasons, actingPlayers, items) — the conditions read them */
  if(evt&&evt.summaryS03===true) ['uids','reasons','actingPlayers','items'].forEach(k=>{ if(Array.isArray(evt[k])) out[k]=JSON.parse(JSON.stringify(evt[k])); });
  if(evt&&Array.isArray(evt.cards)) out.uids=evt.cards.map(c=>ensureCardUid(gameState,c)).filter(x=>x!=null);
  return out;
}

function preparedActivationDescriptorV11(name,p,zone,index,opts,ctx,card,db,sc,ss,sourceNegatedAtActivation){
  return {
    player:p,uid:ensureCardUid(gameState,card),name,from:zone,index,ss,
    event:safeActivationEventV11(opts&&opts.event||{}),eventName:opts&&opts.eventName||null,
    sourceNegatedAtActivation:!!sourceNegatedAtActivation,
    spellCounterObserverUids:db.k==='s'?v350SpellCounterObserverUids():[],
    v44CountConsume:countConsumePayloadV44(p,name,sc,card,countLimitEffectKeyV32(name,sc,ctx)),
    v44ActivationPending:(db.k==='s'||db.k==='t')&&['永続','フィールド','装備'].includes(db.sub),
    effectClass:effectClassV2(sc,db),keep:(db.k==='m'||['永続','フィールド','装備'].includes(db.sub)),
    v4EffectKey:ctx&&ctx.v4EffectKey||null,noPriority:!!(opts&&opts.noPriority),
    abortReturnToHand:!!(opts&&opts.onAbort),eventSelectionV11:opts&&opts.eventSelectionV11||null
  };
}

function commitPreparedActivationV11(desc,data){
  data=data||{}; if(!desc||desc.uid==null) return false;
  const hit=findCardByUid(desc.uid); if(!hit){abortPreparedActivationV11(desc);return false;}
  const selectedTargets=Array.isArray(data.targets)?data.targets:[];
  const dynamicRange=(typeof targetCountRangeS03==='function')?targetCountRangeS03(desc.name):null;
  let actualTargetCount=null;
  if(dynamicRange){
    actualTargetCount=Number(data.targetCount);
    if(!(typeof targetCountAllowedS03==='function'&&targetCountAllowedS03(desc.name,actualTargetCount)) || actualTargetCount!==selectedTargets.length){
      if(typeof trace==='function') trace(`${desc.name}：対象枚数の宣言と実選択が一致しません`,false);
      abortPreparedActivationV11(desc); return false;
    }
  }
  const selectionData=serializeChainSelectionV2(selectedTargets);
  const p3CostSnaps=(typeof takeCostSnapshotsV3==='function')?takeCostSnapshotsV3(gameState):[];
  act(Object.assign({type:'CHAIN_ADD',player:desc.player,cardId:hit.card.id,uid:desc.uid,name:desc.name,ss:desc.ss,
    from:desc.from,index:desc.index,costSnapshots:p3CostSnaps,prepared:true,targets:selectionData,
    event:desc.event||null,eventName:desc.eventName||null,
    v4EffectKey:data.v4EffectKey||desc.v4EffectKey||null,v44CountConsume:desc.v44CountConsume||null,
    v44ActivationPending:!!desc.v44ActivationPending,effectClass:desc.effectClass||null,
    sourceNegatedAtActivation:!!desc.sourceNegatedAtActivation,
    spellCounterObserverUids:desc.spellCounterObserverUids||[],keep:!!desc.keep,
    eventResumeV11:desc.eventSelectionV11&&desc.eventSelectionV11.resume||null},dynamicRange?{targetCount:actualTargetCount}:{},desc.cardActivationS03?{cardActivationS03:true}:{},desc.drawReplacementS03?{drawReplacementS03:true}:{}));   /* S03-U29 / S03-U33 */
  if(typeof prepTxCommitS03==='function') prepTxCommitS03(hit.card);   /* S03-U471: CHAIN_ADD が復元点を閉じた */
  if(typeof applyTargetingNegatorsS03==='function') applyTargetingNegatorsS03();   /* S03-U28: 対象にされた時の自動無効（永続効果） */
  if(typeof applyTargetingProtectorsS03==='function') applyTargetingProtectorsS03();   /* S03-U66: 他の表側表示モンスターを守る永続効果 */ if(typeof applyTargetedSelfDestroyS03==='function') applyTargetedSelfDestroyS03();   /* S03-U137: 対象になった時に自壊（魂を削る死霊） */
  if(desc.noPriority){
    render();completeEventSelectionV11(desc,true);
    /* S03-U31: DUEL 以外では processor がチェーン解決を始めないので、コミットしたリンクの解決を明示的に開始する。 */
    if(typeof PLAY_MODE!=='undefined' && typeof PLAY_MODES!=='undefined' && PLAY_MODE!==PLAY_MODES.DUEL
       && typeof resolveWholeChainV2==='function' && gameState.chain.length) resolveWholeChainV2();
  }
  else{gameState.chainWindow={priority:desc.player===0?1:0,passes:0};render();openChainPriorityV2();}
  return true;
}

function prepareDuelActivation(name,p,zone,index,opts){
  /* S03-U46 (C-S03-37): zoneOwnerS03 = 相手の場のカードの効果を使用する時のゾーンの持ち主 */
  const zoneOwnerS03=(opts&&(opts.zoneOwnerS03===0||opts.zoneOwnerS03===1)&&opts.zoneOwnerS03!==p)?opts.zoneOwnerS03:null;
  const sc=CARD_SCRIPTS[name], P=gameState.players[zoneOwnerS03!=null?zoneOwnerS03:p];
  if(!sc) return false;
  const card=zoneCard(P,zone,index);
  /* S03-U18: 発動への応答（宣言したスクリプト）は、応答先の発動イベントを opts.event として持たせる（CHAIN_ADD が保持し解決時の ctx.event になる）。 */
  if(typeof activationResponseOptsS03==='function') opts=activationResponseOptsS03(name,opts);
  if(zoneOwnerS03!=null) opts=Object.assign({},opts||{},{cardOverride:card});   /* S03-U46 */
  let L=null;
  /* S03-U57 (C-S03-32): 永続罠などが「カードの発動だけ」で先に合法化されても、攻撃宣言POINTでは
     onAttackDeclare の効果として合法ならそちらを優先する。 */
  if(typeof attackDeclareResponseOptsS03==='function'){
    const ao=attackDeclareResponseOptsS03(name,opts);
    if(ao){
      const L2=strictScriptLegalityV2(name,p,zone,index,ao);
      if(L2.ok){ L=L2; opts=ao; }
    }
  }
  if(!L) L=strictScriptLegalityV2(name,p,zone,index,opts);
  /* S03-U40 (C-S03-31): 攻撃宣言時の窓では攻撃宣言イベントで判定し直し、通ればそのイベントで発動する */
  if(!L.ok && typeof attackDeclareResponseOptsS03==='function'){ const ao=attackDeclareResponseOptsS03(name,opts); if(ao){ const L2=strictScriptLegalityV2(name,p,zone,index,ao); if(L2.ok){ L=L2; opts=ao; } } }
  if(!L.ok){
    showToast(L.reason);
    /* S03-U471: 置いた後の合法性判定が通らない発動。永続魔法・フィールド魔法を手札から置くだけ（チェーン無し: U415 デッキロック等の既存の設計）は戻さず、復元点だけ閉じる。
       それ以外（通常/速攻/装備魔法が手札の自分自身を数えて事前判定を通り、置いた後に条件を満たさなくなった形）は、置く前に戻す。 */
    if(card && typeof prepTxLiveForS03==='function' && prepTxLiveForS03(card.uid)){
      const dbRefused=dbOf(card);
      if(dbRefused.k==='s' && (dbRefused.sub==='永続'||dbRefused.sub==='フィールド')) prepTxCloseS03(card.uid); else prepTxAbortS03('refused');
    }
    if(typeof endActivationPrepS03==='function') endActivationPrepS03(); return false;
  }
  if(L.v4EffectKey && !(opts&&opts.v4EffectKey)) opts=Object.assign({},opts||{},{v4EffectKey:L.v4EffectKey});
  ensureCardUid(gameState,card);
  /* S03-U35 (C-S03-28): 最初の Action（表にする・コスト）の前の Journal 位置を控える。 */
  if(typeof beginActivationPrepS03==='function') beginActivationPrepS03(p,card,name);
  const db=dbOf(card), ss=scriptSpellSpeed(sc,db);
  /* S03-U10: 裏側から表にする前に判定する（セット状態からの発動もカードの発動）。 */
  const cardActivationOnly=cardActivationOnlyV32(name,sc,db,zone,card,opts);
  /* S03-U29: 表にする前に「カードの発動」（手札・セット状態から）かを控える。 */
  const cardActivationS03=(typeof cardActivationMarkerS03==='function')&&cardActivationMarkerS03(db,zone,card,opts);
  /* S03-U33 (C-S03-26): 通常のドローの代わりに発動した効果かを CHAIN_ADD へ載せる（true の時だけ）。 */
  const drawReplacementS03=!!(opts&&opts.drawReplacementS03);
  // System v3.3.0: コスト支払い前に、フィールドで受けている個別の効果無効を記録する。
  // Skill Drain のような継続無効は解決時に場に残っているかで判定するため、ここには含めない。
  const sourceNegatedAtActivation = zone==='mz' &&
    (card.negated===true || (card.negatedUntilTurn!=null && card.negatedUntilTurn===gameState.turn));
  /* S03-U296: monster triggers stacked in one SEGOC selection (eventSelectionV11) are not responses to each other: the Spell Speed of the
     link below does not refuse them (TG ワーウルフ's SS2 link refused TG ラッシュ・ライノ's End Phase trigger for ever). Spell / Trap cards keep the check. */
  const segocPeerS296 = !!(opts&&opts.eventSelectionV11) && db.k==='m';
  if(gameState.chain.length && ss < chainTopSpeed() && !segocPeerS296){
    showToast(`スペルスピードが足りません（SS${ss} / チェーン上 SS${chainTopSpeed()}）`);
    if(typeof prepTxAbortS03==='function' && prepTxLiveForS03(card.uid)) prepTxAbortS03('refused');   /* S03-U471 */
    return false;
  }
  /* S03-U471: 最初の状態変化（表にする）の前に発動準備トランザクションを開く（手札からの発動は呼び出し元が MOVE の前に開いている）。 */
  const txTokS471 = (!cardActivationOnly && typeof prepTxOpenS03==='function' && prepTxNeededS03(name)) ? prepTxOpenS03(p,card,name) : null;
  if(card.face==='down' && (zone==='sz'||zone==='field'))
    act({type:'FX_SET_STATE',player:(zoneOwnerS03!=null?zoneOwnerS03:p),zone,index,face:'up',reason:'発動'});

  const ctx=makeContext(p,card,zone,index,(opts&&opts.eventName)||'activate',opts||{});
  const finishPrepare=()=>{
    if(txTokS471 && !(gameState.prepTxS03 && gameState.prepTxS03.uid===card.uid)) return;   /* S03-U471: 中止済み（記録が無い）の準備には、遅れて来た継続でもチェーンリンクを作らない。Undo で記録が戻れば続けられる */
    // System v3.5.0: 《魔法都市エンディミオン》型の「魔法カードが発動する度」を正確に扱うため、
    // 魔法の発動時点ですでに表側・適用中だった監視カードだけをUIDで固定する。
    const spellCounterObserverUids = db.k==='s' ? v350SpellCounterObserverUids() : [];
    // 選択情報はカード参照だけでなく、効果モードや複数素材を含むことがある。
    const selectionData=serializeChainSelectionV2(ctx.selectedTargets||[]);
    const v44CountConsume=cardActivationOnly?null:countConsumePayloadV44(p,name,sc,card,countLimitEffectKeyV32(name,sc,ctx));
    const v44ActivationPending=(db.k==='s'||db.k==='t') && ['永続','フィールド','装備'].includes(db.sub);
    // System v4.4: 回数制限の消費と activationPending は CHAIN_ADD 自体に含める。
    // これにより Replay/Undo の1 Actionが「発動をコミットした状態」と完全に一致する。
    /* P3: コスト支払い中に記録されたスナップショットをチェーンリンクへ引き渡す。
       将来 P1.1 の activationContext.costs も同じ形式を使う。 */
    const p3CostSnaps=(typeof takeCostSnapshotsV3==='function')?takeCostSnapshotsV3(gameState):[];
    act(Object.assign({type:'CHAIN_ADD',player:p,cardId:card.id,uid:card.uid,name,ss,from:zone,index,
         costSnapshots:p3CostSnaps,
         prepared:true,targets:selectionData,event:(opts&&opts.event)||null,eventName:(opts&&opts.eventName)||null,
         v4EffectKey:ctx.v4EffectKey||null, v44CountConsume, v44ActivationPending,
         effectClass:effectClassV2(sc,db), sourceNegatedAtActivation, spellCounterObserverUids,
         keep:(db.k==='m'||['永続','フィールド','装備'].includes(db.sub))},
         /* S03-U484: 非 P1.1 の誘発も、チェーン終了後の継続を CHAIN_ADD に載せる（P1.1 の commitPreparedActivationV11 と同じ形）。
            これが無いと継続はクロージャ（EVT_V2_STATE.after）だけに残り、保存・再開で召喚成功後の応答窓が消えていた。 */
         (opts&&opts.eventSelectionV11&&opts.eventSelectionV11.resume)?{eventResumeV11:opts.eventSelectionV11.resume}:{},
         cardActivationOnly?{cardActivationOnly:true}:{},cardActivationS03?{cardActivationS03:true}:{},drawReplacementS03?{drawReplacementS03:true}:{},ctx.costCtxS03?{costCtxS03:ctx.costCtxS03}:{},zoneOwnerS03!=null?{zoneOwnerS03}:{}));
    if(typeof prepTxCommitS03==='function') prepTxCommitS03(card);   /* S03-U471: CHAIN_ADD で復元点は閉じた。ここから先の不発・無効でコストは返らない */
    if(typeof endActivationPrepS03==='function') endActivationPrepS03();   /* S03-U35: チェーンに乗った */
    if(typeof applyTargetingNegatorsS03==='function') applyTargetingNegatorsS03();   /* S03-U28: 対象にされた時の自動無効（永続効果） */
    if(typeof applyTargetingProtectorsS03==='function') applyTargetingProtectorsS03();   /* S03-U66: 他の表側表示モンスターを守る永続効果 */ if(typeof applyTargetedSelfDestroyS03==='function') applyTargetedSelfDestroyS03();   /* S03-U137: 対象になった時に自壊（魂を削る死霊） */
    if(opts&&opts.noPriority){
      render();
      if(typeof opts.afterPrepared==='function') opts.afterPrepared();
    }else{
      gameState.chainWindow={priority:p===0?1:0,passes:0};
      render(); openChainPriorityV2();
    }
  };
  /* P3: コスト支払いの直前にスナップショットバッファを初期化する */
  if(typeof beginCostSnapshotsV3==='function') beginCostSnapshotsV3(gameState);
  /* S03-U114: 「X素材を取り除いて発動」するコスト（detachCostS03）は、取り除く素材をプレイヤーが選ぶ。
     P1.1 と同じく closure を保存せず JSON descriptor＋登録ハンドラで続行する（選択中のセーブから再開できる）。 */
  const detachSpecS03=(!cardActivationOnly && typeof detachCostSpecS03==='function') ? detachCostSpecS03(sc,name,ctx) : null;
  if(detachSpecS03){
    clearActivationChoiceV11(p);
    const desc=preparedActivationDescriptorV11(name,p,zone,index,opts||{},ctx,card,db,sc,ss,sourceNegatedAtActivation);
    if(cardActivationS03) desc.cardActivationS03=true;
    if(drawReplacementS03) desc.drawReplacementS03=true;
    if(ctx.v4EffectKey && !desc.v4EffectKey) desc.v4EffectKey=ctx.v4EffectKey;
    if(typeof endActivationPrepS03==='function') endActivationPrepS03();
    const safe=choiceJsonSafetyV49(desc,'detachCostS03');
    if(!safe.ok){abortPreparedActivationV11(desc);throw new Error(`detachCostS03 descriptor is not JSON-safe: ${safe.why}`);}
    try{ beginDetachCostS03(ctx,desc,detachSpecS03); }catch(e){ abortPreparedActivationV11(desc); throw e; }
    return true;
  }
  /* P1.1カードはclosureを保存せず、handler名+JSON descriptorで発動準備を続行する。 */
  if(!cardActivationOnly && typeof sc.activationV11==='function'){
    clearActivationChoiceV11(p);
    const desc=preparedActivationDescriptorV11(name,p,zone,index,opts||{},ctx,card,db,sc,ss,sourceNegatedAtActivation);
    if(cardActivationS03) desc.cardActivationS03=true;   /* S03-U29 */
    if(drawReplacementS03) desc.drawReplacementS03=true;   /* S03-U33 */
    if(typeof endActivationPrepS03==='function') endActivationPrepS03();   /* S03-U35: P1.1 は registry 選択で復元できる */
    const safe=choiceJsonSafetyV49(desc,'activationV11');
    if(!safe.ok){abortPreparedActivationV11(desc);throw new Error(`P1.1 activation descriptor is not JSON-safe: ${safe.why}`);}
    /* S03-U471: 発動時の宣言/対象選択（activationV11）が候補不足で断られた（明示の合図）なら、発動準備を中止して発動前に戻す */
    const sigV11S471=choiceInsufficientSeqS03();
    try{sc.activationV11(ctx,desc);}catch(e){abortPreparedActivationV11(desc);throw e;}
    if(txTokS471 && choiceInsufficientSeqS03()>sigV11S471 && !gameState.pendingChoice && !(typeof PROMPT_OPEN_S03!=='undefined'&&PROMPT_OPEN_S03) && prepTxLiveForS03(desc.uid)) abortPreparedActivationV11(desc);
    return true;
  }
  /* S03-U471: 準備の失敗（コスト不可・候補不足）— 発動準備トランザクションで発動前に戻す。トランザクションが無い時だけ従来の opts.onAbort。 */
  const failPrepare=(reason)=>{
    if(txTokS471 && typeof prepTxAbortS03==='function' && prepTxAbortS03(reason,card.uid)) return;
    if(opts&&typeof opts.onAbort==='function') opts.onAbort();
  };
  const chooseTargets=()=>{
    if(sc.selectTargets){
      /* 明示の合図: 対象選択の前に印を取り、候補不足で断られた（requestChoiceV49 が合図を進めた）時だけ中止する。 */
      const sigS471=choiceInsufficientSeqS03();
      sc.selectTargets(ctx,targets=>{ ctx.selectedTargets=targets||[]; finishPrepare(); });
      prepTxCheckInsufficientS03(sigS471,card.uid);
    }
    else finishPrepare();
  };
  /* S03-U10: カードの発動だけならコスト・対象は使わない。 */
  if(cardActivationOnly){ finishPrepare(); return true; }
  /* S03-U16 COST_SELECTION_FIRST: 宣言されたスクリプトは selectTargets がコストにするカードを選ぶ。
     先に選び、コストを払い、コストで動いたカードを対象から外し、コスト中に ctx へ書かれた値を CHAIN_ADD へ載せる。 */
  if(typeof costSelectionFirstS03==='function' && costSelectionFirstS03(name,sc)){
    const sigCsfS471=choiceInsufficientSeqS03();
    /* S03-U474: ここの selectTargets は「コストにするカード」を選ぶので、選択の段階は 'cost'（対象耐性を掛けない）。cost を払い終えた後は外す。
       selectTargets の中に本当の対象選択（装備するモンスター等）がある場合は、スクリプト側で API.selectCard(…, {selection:'effect'}) と明示する。 */
    withSelectionPhaseS03('cost',()=>sc.selectTargets(ctx,targets=>{
      ctx.selectedTargets=targets||[];
      const beforeS03=costSelectionBeforeS03(ctx);
      runCostPhaseS03(done=>sc.cost(ctx,done),ok=>{
        if(ok===false){ showToast('コストを払えません'); failPrepare('cost-fail'); return; }
        costSelectionAfterS03(ctx,beforeS03);
        finishPrepare();
      });
    }));
    prepTxCheckInsufficientS03(sigCsfS471,card.uid);   /* S03-U471 */
    if(typeof settleActivationPrepS03==='function') settleActivationPrepS03();   /* S03-U35 */
    return true;
  }
  if(sc.cost){
    const sigCostS471=choiceInsufficientSeqS03();
    /* S03-U474: コストを払う間は選択の段階が 'cost'（コストの選択に対象耐性を掛けない）。払い終えた継続（done）では外れるので、chooseTargets の対象選択は従来どおり。 */
    runCostPhaseS03(done=>sc.cost(ctx,done),ok=>{ if(ok===false){ showToast('コストを払えません'); failPrepare('cost-fail'); return; } chooseTargets(); });
    prepTxCheckInsufficientS03(sigCostS471,card.uid);   /* S03-U471: コスト自体の選択が候補不足で断られた場合（捨てる手札が無い等） */
  }
  else chooseTargets();
  if(typeof settleActivationPrepS03==='function') settleActivationPrepS03();   /* S03-U35: 選択待ちが無ければ控えを消す */
  return true;
}

function duelActivateFromHand(i){
  const p=gameState.activePlayer, P=gameState.players[p], c=P.hand[i]; if(!c) return;
  const db=dbOf(c), nm=db.n||'', sc=CARD_SCRIPTS[nm];
  if(!sc){ showToast('DUELモードでは未自動化です'); return; }
  if(db.k==='s'||db.k==='t'){
    const to=db.sub==='フィールド'?'field':'sz';
    if(to==='sz'&&P.sz.length>=ZONE_LIMITS.sz){ showToast('魔法・罠ゾーンが一杯です'); return; }
    if(to==='field'&&P.field){ showToast('フィールドゾーンが埋まっています'); return; }
    const prospective=to==='field'?0:P.sz.length;
    const pre=strictScriptLegalityV2(nm,p,'hand',i,{cardOverride:c,logicalZone:to,prospectiveIndex:prospective});
    if(!pre.ok){ showToast(pre.reason); return; }
    ensureCardUid(gameState,c); const uid=c.uid;
    if(typeof beginActivationPrepS03==='function') beginActivationPrepS03(p,c,nm);   /* S03-U35: MOVE の前の位置 */
    if(typeof prepTxOpenS03==='function' && prepTxNeededS03(nm) && !cardActivationOnlyV32(nm,sc,db,'hand',c,{cardActivation:true})) prepTxOpenS03(p,c,nm);   /* S03-U471: 最初の状態変化（手札から置く）の前に復元点を作る */
    closeSheet(); act({type:'MOVE',player:p,from:'hand',fromIndex:i,to,face:'up'});
    const idx=to==='field'?0:gameState.players[p].sz.length-1;
    prepareDuelActivation(nm,p,to,idx,{cardActivation:true,onAbort:()=>{
      const h=findCardByUid(uid); if(h&&(h.zone==='sz'||h.zone==='field')) act({type:'MOVE',player:h.p,from:h.zone,fromIndex:h.index,to:'hand',face:'up'});
    }}); return;
  }
  closeSheet(); prepareDuelActivation(nm,p,'hand',i,{});
}
function duelActivateFromZone(p,zone,index,opts){
  const c=zoneCard(gameState.players[p],zone,index); if(!c) return;
  /* S03-U60: unlike duelActivateFromHand/activateFromHand (which always move the card into its zone as
     the FIRST step of a fresh activation, then call prepareDuelActivation themselves), duelActivateFromZone
     is the DUEL-mode entry point specifically for activating a card that is *already sitting* in a real
     zone — the exact call named in the S03-U59 real-duel bug report (an AI driver illegally re-activating
     an already-resolved 未来融合 via duelActivateFromZone(0,'sz',0), which would have double-sent Fusion
     Materials). getLegalZoneActions() already hides the "⚡ 効果を発動" button for this case (via
     strictScriptLegality -> fieldReactivationBlockedS03U60), but a direct/forced call must be refused here
     too, not just hidden from the menu. See fieldReactivationBlockedS03U60 (engine/40_legal_script_engine.js)
     for why this can't be modeled at the shared strictScriptLegalityV2 level: MANUAL mode's activateFromHand
     also funnels first-activations through prepareDuelActivation/strictScriptLegalityV2 without the DUEL
     path's opts.cardActivation marker, so gating there risks blocking a legitimate first activation. */
  if(typeof fieldReactivationBlockedS03U60==='function' && fieldReactivationBlockedS03U60(CARD_SCRIPTS[dbOf(c).n],dbOf(c),zone,c)){ showToast('このカードに、場に残ったまま再度発動できる効果はありません'); return; }
  closeSheet(); prepareDuelActivation(dbOf(c).n,p,zone,index,opts||{});
}
/* チェーン応答専用。手札の速攻魔法は自分ターンのみ、まずS/Tゾーンへ置いてから発動する。 */
function duelActivateResponseV2(p,zone,index,owner){
  /* S03-U46 (C-S03-37): 相手の場の「相手プレイヤーも使用できる」効果。コストとチェーンリンクは使用するプレイヤー p のもの。
     S03-U60: this branch also targets a card already sitting face-up in a real zone (the opponent's), so
     the same field-reactivation guard applies here directly (this branch calls prepareDuelActivation
     itself rather than going through duelActivateFromZone above). */
  if((owner===0||owner===1)&&owner!==p){
    const oc=zoneCard(gameState.players[owner],zone,index); if(!oc) return;
    if(typeof fieldReactivationBlockedS03U60==='function' && fieldReactivationBlockedS03U60(CARD_SCRIPTS[dbOf(oc).n],dbOf(oc),zone,oc)){ showToast('このカードに、場に残ったまま再度発動できる効果はありません'); return; }
    closeSheet(); prepareDuelActivation(dbOf(oc).n,p,zone,index,{zoneOwnerS03:owner}); return;
  }
  const P=gameState.players[p], c=zoneCard(P,zone,index); if(!c) return;
  const db=dbOf(c), nm=db.n||'';
  if(zone==='hand' && db.k==='s' && db.sub==='速攻'){
    if(p!==gameState.activePlayer){ showToast('速攻魔法を手札から発動できるのは自分ターンだけです'); return; }
    if(P.sz.length>=ZONE_LIMITS.sz){ showToast('魔法・罠ゾーンが一杯です'); return; }
    const pre=strictScriptLegalityV2(nm,p,'hand',index,{cardOverride:c,logicalZone:'sz',prospectiveIndex:P.sz.length});
    if(!pre.ok){ showToast(pre.reason); return; }
    ensureCardUid(gameState,c); const uid=c.uid;
    if(typeof beginActivationPrepS03==='function') beginActivationPrepS03(p,c,nm);   /* S03-U35: MOVE の前の位置 */
    if(typeof prepTxOpenS03==='function' && prepTxNeededS03(nm)) prepTxOpenS03(p,c,nm);   /* S03-U471 */
    closeSheet(); act({type:'MOVE',player:p,from:'hand',fromIndex:index,to:'sz',face:'up'});
    prepareDuelActivation(nm,p,'sz',gameState.players[p].sz.length-1,{onAbort:()=>{ const h=findCardByUid(uid); if(h&&h.zone==='sz') act({type:'MOVE',player:h.p,from:'sz',fromIndex:h.index,to:'hand',face:'up'}); }}); return;
  }
  duelActivateFromZone(p,zone,index,{});
}

function getChainResponsesV2(p){
  /* S03-U97: チェーンの一番上が「お互いに発動できない」を宣言したカード（超融合など）なら、応答候補は無し。 */
  if(typeof chainResponseLockedS03==='function' && chainResponseLockedS03()) return [];
  const P=gameState.players[p], out=[], top=chainTopSpeed();
  const push=(zone,index,c)=>{
    if(!c) return; const db=dbOf(c), nm=db.n||'', sc=CARD_SCRIPTS[nm];
    if(!sc||typeof sc.resolve!=='function') return;
    const ss=scriptSpellSpeed(sc,db); if(ss<top) return;
    /* S03-U12: チェーン・応答タイミングで発動できるのはスペルスピード2以上だけ。
       表側の永続・フィールド魔法の効果（SS1）は開いたゲーム状態（自分のメインフェイズの操作）でのみ発動する。 */
    if(ss<2) return;
    if(db.k==='m' && sc.quickEffect!==true && ss<2) return;
    if((zone==='grave'||zone==='banish'||zone==='hand')&&!canActivateFromZone(db,zone)) return;
    /* S03-U18: 発動への応答（宣言したスクリプト）は、一番上のリンクの発動イベントを ctx.event にして判定する。 */
    let L=strictScriptLegalityV2(nm,p,zone,index,(typeof activationResponseOptsS03==='function')?activationResponseOptsS03(nm,{}):{});
    /* S03-U40 (C-S03-31): 攻撃宣言時の窓では、攻撃宣言イベントで判定し直す */
    if(!L.ok && typeof attackDeclareResponseOptsS03==='function'){ const ao=attackDeclareResponseOptsS03(nm,{}); if(ao) L=strictScriptLegalityV2(nm,p,zone,index,ao); }
    if(!L.ok) return;
    out.push({p,zone,index,card:c,db,ss});
  };
  P.sz.forEach((c,i)=>{
    const db=dbOf(c);
    if(c.face==='down'){
      if(!(db.k==='t'||(db.k==='s'&&db.sub==='速攻'))) return;
      if(c.setTurn===gameState.turn) return;
      push('sz',i,c); return;
    }
    if(hasFieldActivatableEffect(c)) push('sz',i,c);
  });
  if(P.field&&P.field.face==='up'&&hasFieldActivatableEffect(P.field)) push('field',0,P.field);
  if(p===gameState.activePlayer) P.hand.forEach((c,i)=>{ const db=dbOf(c); if(db.k==='s'&&db.sub==='速攻') push('hand',i,c); });
  ['hand','grave','banish','mz'].forEach(z=>(P[z]||[]).forEach((c,i)=>{
    const db=dbOf(c), sc=CARD_SCRIPTS[db.n];
    /* S03-U19: 発動への応答として宣言したモンスター（S03-U18）は、quickEffect を持たなくてもチェーン応答の候補にする。
       合法性は一番上のリンクの発動イベントで判定される（S03-U18）。 */
    const activationResponderS03 = typeof activationResponseDeclaredS03==='function' && activationResponseDeclaredS03(db.n);
    if(!sc||(sc.quickEffect!==true&&!activationResponderS03)) return;
    /* S03-U70: mz 側の canActivateFromZone 免除はモンスターの効果専用（エフェクト・ヴェーラー等）。
       魔法・罠カード（db.k!=='m'）がここに来るのは本来ありえないはずの状態だが、万一 mz に紛れ込んだ
       場合でも応答候補として offer しない — 砂塵の大竜巻が自分自身へのチェーン応答を無限に繰り返す
       実戦R1のハングを発見した（gameState.chain が無限に伸び続けた）。 */
    if(z==='mz'&&db.k!=='m') return;
    if(!canActivateFromZone(db,z)&&z!=='mz') return;
    push(z,i,c);
  }));
  /* S03-U46 (C-S03-37): 相手フィールドの表側の「相手プレイヤーも使用できる」効果（王宮の弾圧） */
  if(typeof sharedUseResponseCandidatesS03==='function') sharedUseResponseCandidatesS03(p).forEach(x=>out.push(x));
  const seen=new Set();
  return out.filter(x=>{ const k=ensureCardUid(gameState,x.card); if(seen.has(k)) return false; seen.add(k); return true; });
}
function chainPassV2(){
  if(!gameState.chain.length){ gameState.chainWindow=null; closeSheet(); return; }
  if(!gameState.chainWindow) gameState.chainWindow={priority:gameState.activePlayer,passes:0};
  /* S03-U262: a forced response of the player holding priority is activated instead of passing (engine/1P) */
  { const frS03 = (typeof forcedResponseForS03==='function') ? forcedResponseForS03(gameState.chainWindow.priority) : null;
    if(frS03){ duelActivateResponseV2(gameState.chainWindow.priority, frS03.zone, frS03.index, frS03.ownerS03); return; } }
  gameState.chainWindow.passes++;
  if(gameState.chainWindow.passes>=2){ closeSheet(); requestProcessorV27(PROCESSOR_V27.SOLVE_CHAIN,{}); return; }
  gameState.chainWindow.priority=gameState.chainWindow.priority===0?1:0; openChainPriorityV2();
}
function openChainPriorityV2(){
  if(!gameState.chain.length){ gameState.chainWindow=null; closeSheet(); return; }
  const w=gameState.chainWindow||(gameState.chainWindow={priority:gameState.activePlayer,passes:0});
  const p=w.priority;
  /* S03-U262: a forced response is activated without asking (engine/1P) */
  { const frS03 = (typeof forcedResponseForS03==='function') ? forcedResponseForS03(p) : null;
    if(frS03){ closeSheet(); duelActivateResponseV2(p, frS03.zone, frS03.index, frS03.ownerS03); return; } }
  const list=getChainResponsesV2(p);
  // ADSの Ignore / Available を再現。候補がない確認ダイアログを大量に出さない。
  if(ADS_CHAIN_MODE===ADS_CHAIN_MODES.IGNORE || (ADS_CHAIN_MODE===ADS_CHAIN_MODES.AVAILABLE && !list.length)){
    closeSheet(); setTimeout(chainPassV2,adsAutoPassDelay()); return;
  }
  const rows=list.map(x=>`<div class="act pick-row" onclick="duelActivateResponseV2(${p},'${x.zone}',${x.index}${x.ownerS03!=null?','+x.ownerS03:''})"><span class="pk-nm">${x.db.n}</span><span class="pk-sub">${x.ownerS03!=null?'相手の':''}${zoneJp(x.zone)} / SS${x.ss} / ${effectClassV2(CARD_SCRIPTS[x.db.n],x.db)}</span></div>`).join('');
  const stack=gameState.chain.map((l,i)=>`<span class="cs-link${i===gameState.chain.length-1?' top':''}">C${i+1} ${l.name}<small>${nameOf(l.player)}</small></span>`).join('');
  sheet.innerHTML=`<div class="grip"></div><h3 style="margin-bottom:6px">チェーン確認</h3><div class="chainstack" style="display:flex;border:0;padding:5px 0 10px">${stack}</div><div class="meta" style="margin-bottom:10px"><b>${nameOf(p)}</b> に優先権があります。${list.length?'チェーン可能な効果を選ぶか、パスしてください。':'チェーンできる効果はありません。'}</div>${rows?`<div class="pick-list">${rows}</div>`:''}<div class="act-grid wide"><div class="act fx" onclick="chainPassV2()">パス</div></div>`;
  veil.classList.add('on');
}
function negatePreviousChainLinkV2(reason,destroySource,mode){
  if(!gameState.chain.length) return false;
  const i=gameState.chain.length-1, link=gameState.chain[i];
  act({type:'CHAIN_NEGATE_LINK',index:i,reason:reason||'無効',mode:mode||'activation'});
  if(destroySource!==false){
    const h=findCardByUid(link.uid);
    if(h && (h.zone==='sz'||h.zone==='field'||h.zone==='mz'))
      act({type:'FX_TO_GRAVE',player:h.p,zone:h.zone,index:h.index,reason:reason||'発動を無効',byDestroy:true});
  }
  return true;
}
function afterChainCompleteV2(){
  const cb=CHAIN_AFTER_V2; CHAIN_AFTER_V2=null;
  if(gameState.pendingSummon){ finishSummonNegationChainV2(); return; }
  if(cb){ try{ cb(); }catch(e){ logIt(gameState,`<b>System v2</b>：チェーン後処理エラー`); } return; }
  flushDeferredEventsV2();
}

function preparedChainContext(link){
  const src=findCardByUid(link.uid), card=src?src.card:null;
  const storedEvent=link.event||{};
  /* Prepared links intentionally store only JSON-safe event identity (uid/uids). Rehydrate a fresh
     resolution view at the final engine boundary; never mutate the journaled/saved link snapshot. */
  const resolutionEvent=restoreEventRefsV27(storedEvent);
  const extra={event:resolutionEvent,chainId:link.chainId,effectClass:link.effectClass,chainLink:link,v4EffectKey:link.v4EffectKey||null};
  if(link.eventName==='onDamageStep' || (gameState.battle && link.eventName==='onFlip')){
    extra.battle=battleContextV28();
    extra.step=(link.event&&link.event.step)||((gameState.battle&&gameState.battle.step)||null);
    extra.battleOpponent=battleOpponentV28(card,extra.battle);
  }
  const ctx=makeContext(link.player,card,link.from,link.index,link.eventName||'resolve',extra);
  /* S03-U16: コスト中に控えた値を解決時の ctx へ戻す（既存のキーは上書きしない）。 */
  if(link.costCtxS03&&typeof link.costCtxS03==='object') Object.keys(link.costCtxS03).forEach(k=>{ if(!(k in ctx)) ctx[k]=link.costCtxS03[k]; });
  const restored=deserializeChainSelectionV2(link.selection||link.targets||[]);
  ctx.selectedTargets=Array.isArray(restored)?restored:[];
  ctx.keep=!!link.keep; return ctx;
}
function afterPreparedResolve(link,ctx){
  const sc=CARD_SCRIPTS[link.name];
  if(sc&&sc.afterResolve) sc.afterResolve(ctx); else if(ctx.card) selfToGrave(ctx);
  settleResolvedSpellTrapV32(link,ctx,sc);
}
/* S03-U07 (C-S03-04): 通常・速攻・カウンターの魔法／通常・カウンター罠は、解決後に墓地へ送られる（ルール）。
   スクリプトの afterResolve が空でも、発動したゾーンに表側で残っていれば墓地へ送る。
   対象外：永続・フィールド・装備（link.keep）、装備カードになったカード、裏側にセットし直したカード、
   remainsOnFieldAfterResolve を宣言したカード（光の護封剣など「発動後フィールドに残る」カード）。 */
function settleResolvedSpellTrapV32(link,ctx,sc){
  if(!link || link.keep || !ctx || !ctx.card) return;
  const d=dbOf(ctx.card);
  if(d.k!=='s' && d.k!=='t') return;
  if(sc && sc.remainsOnFieldAfterResolve) return;
  const h=findCardByUid(ctx.card.uid);
  if(!h || (h.zone!=='sz' && h.zone!=='field') || h.card.face!=='up' || h.card.equipTo) return;
  act({type:'FX_SELF_TO_GRAVE', player:h.p, zone:h.zone, index:h.index});
}
/* System v2.3: 召喚方法による元々の数値変更は、効果無効で一度失われたら戻らない。
   Skill Drain 等の継続無効が「解決した後」にだけ判定する。 */
function reconcileProcedureBaseStats(){
  for(let p=0;p<2;p++){
    (gameState.players[p].mz||[]).forEach(card=>{
      const st=card&&card.procedureBaseStats; if(!st) return;
      if((st.loseOnFaceDown && card.face!=='up') || (st.loseOnNegate && effectNegated(card))){
        delete card.procedureBaseStats;
        logIt(gameState, `${cardName(card)}：召喚方法による元々の数値変更の適用が終了`);
      }
    });
  }
}
function resolveWholeChainV2(){
  // v2.8 compatibility wrapper: all chain solving is serialized by Processor Queue.
  requestProcessorV27(PROCESSOR_V27.SOLVE_CHAIN,{});
}

function queueDeferredEventV2(eventName,evt){
  gameState.deferredEvents=gameState.deferredEvents||[]; const safe=Object.assign({},evt||{});
  if(safe.card){ safe.uid=ensureCardUid(gameState,safe.card); delete safe.card; }
  if(Array.isArray(safe.cards)){
    safe.uids=safe.cards.map(c=>ensureCardUid(gameState,c)).filter(x=>x!=null); delete safe.cards;
  }
  const item={eventName,evt:safe};
  if(typeof APPLY_ACTION_DEPTH_V31!=='undefined'&&APPLY_ACTION_DEPTH_V31>0){gameState.deferredEvents.push(item);/* S03-U14 */if(typeof applySummonCountersS03==='function')applySummonCountersS03(gameState,item);}
  else commitAutomaticActionV44({type:'EVENT_QUEUE_V31',item});
}
function queueSpecialSummonSuccessV2(p,card,kind){
  if(!card) return;
  if(Array.isArray(RESOLUTION_SUMMON_BATCH_V2)){
    RESOLUTION_SUMMON_BATCH_V2.push({player:p,card,kind:kind||'effect'}); return;
  }
  queueDeferredEventV2('onSpecialSummon',{player:p,name:cardName(card),card,kind:kind||'effect'});
}
function flushResolutionSummonBatchV2(){
  const b=RESOLUTION_SUMMON_BATCH_V2; RESOLUTION_SUMMON_BATCH_V2=null;
  if(!b||!b.length) return;
  /* 同一効果解決中の複数特殊召喚は同時召喚イベントとして1回にまとめる。 */
  const byPlayer=new Map();
  b.forEach(x=>{ const a=byPlayer.get(x.player)||[]; a.push(x); byPlayer.set(x.player,a); });
  byPlayer.forEach((a,p)=>{
    const cards=a.map(x=>x.card), evt={player:p,cards,kind:a[0].kind||'effect'};
    if(cards.length===1){ evt.card=cards[0]; evt.name=cardName(cards[0]); }
    queueDeferredEventV2('onSpecialSummon',evt);
  });
}
function flushDeferredEventsV2(){
  if(typeof flushDeferredEventsThroughProcessorV27==='function' && flushDeferredEventsThroughProcessorV27()) return;
  const q=gameState.deferredEvents||[]; if(!q.length){ render(); return; }
  const item=q.shift(), evt=Object.assign({},item.evt||{});
  if(evt.uid){ const h=findCardByUid(evt.uid); evt.card=h&&h.card; }
  if(Array.isArray(evt.uids)) evt.cards=evt.uids.map(u=>{const h=findCardByUid(u);return h&&h.card;}).filter(Boolean);
  EVT_AFTER=()=>setTimeout(flushDeferredEventsV2,40);
  if(!emitEvent(item.eventName,evt)){ EVT_AFTER=null; setTimeout(flushDeferredEventsV2,40); }
}

function summonNegatorsV2(pending){
  const rp=pending.player===0?1:0, P=gameState.players[rp], out=[];
  const add=(zone,index,c)=>{
    if(!c) return; const db=dbOf(c), sc=CARD_SCRIPTS[db.n]; if(!sc||!sc.summonNegate) return;
    const sn=sc.summonNegate; if(sn.specialOnly&&pending.kind==='normal') return;
    if(sn.kinds&&!sn.kinds.includes(pending.kind)) return;
    if(typeof sn.condition==='function'){
      let ok=false; try{ ok=!!sn.condition(pending,c,db); }catch(e){ ok=false; }
      if(!ok) return;
    }
    if(c.face==='down'&&c.setTurn===gameState.turn) return;
    const L=strictScriptLegalityV2(db.n,rp,zone,index,{ignoreTiming:true}); if(L.ok) out.push({p:rp,zone,index,card:c,db,ss:scriptSpellSpeed(sc,db)});
  };
  P.sz.forEach((c,i)=>add('sz',i,c));
  P.mz.forEach((c,i)=>{ const sc=CARD_SCRIPTS[dbOf(c).n]; if(sc&&sc.summonNegate&&sc.quickEffect===true) add('mz',i,c); });
  if(typeof sharedUseSummonNegatorsS03==='function') sharedUseSummonNegatorsS03(pending).forEach(x=>out.push(x));   /* S03-U46 */
  return out;
}
function beginSummonWindowV2(pending){
  act({type:'SUMMON_WINDOW_OPEN_V42',pending}); const list=summonNegatorsV2(gameState.pendingSummon||pending);
  if(!list.length || ADS_CHAIN_MODE===ADS_CHAIN_MODES.IGNORE){ commitPendingSummonV2(); return; }
  showSummonWindowSheetV2(pending,list);
}
/* S03-U15: 召喚無効タイミングのシート。保存・Undo/Redo からの再表示でも使う。 */
function showSummonWindowSheetV2(pending,list){
  const rows=list.map(x=>`<div class="act pick-row" onclick="activateSummonNegatorV2(${x.p},'${x.zone}',${x.index}${x.ownerS03!=null?','+x.ownerS03:''})"><span class="pk-nm">${x.db.n}</span><span class="pk-sub">${x.ownerS03!=null?'相手の場 / ':''}召喚を無効 / SS${x.ss}</span></div>`).join('');
  sheet.innerHTML=`<div class="grip"></div><h3 style="margin-bottom:6px">召喚無効タイミング</h3><div class="meta" style="margin-bottom:10px">${pending.name} の${pending.label||'召喚'}を試みています。<br>召喚成功時の激流葬・奈落より前のタイミングです。</div><div class="pick-list">${rows}</div><div class="act-grid wide"><div class="act fx" onclick="commitPendingSummonV2()">何も発動しない — 召喚成功</div></div>`;
  veil.classList.add('on');
}
function activateSummonNegatorV2(p,zone,index,owner){
  const zp=(owner===0||owner===1)?owner:p;   /* S03-U46: 相手の場のカードの効果を使用する */
  const pending=gameState.pendingSummon, c=zoneCard(gameState.players[zp],zone,index); if(!pending||!c) return;
  closeSheet(); prepareDuelActivation(dbOf(c).n,p,zone,index,Object.assign({ignoreTiming:true,summonWindow:true},zp!==p?{zoneOwnerS03:zp}:{}));
}
function summonNegatePendingV2(reason, opts){ if(gameState.pendingSummon) act(Object.assign({type:'SUMMON_WINDOW_NEGATE_V42',reason:reason||'召喚無効'}, (opts&&opts.toHand===true)?{toHandS03:true}:{})); }   /* S03-U277: opts.toHand */
function finishSummonNegationChainV2(){ const ps=gameState.pendingSummon; if(!ps) return; if(ps.negated) cancelPendingSummonV2(); else commitPendingSummonV2(); }
function commitPendingSummonV2(){ const ps=gameState.pendingSummon; if(!ps) return; closeSheet(); act({type:'SUMMON_WINDOW_CLOSE_V42',result:'commit'}); if(typeof ps.commit==='string'&&typeof window[ps.commit]==='function') window[ps.commit](ps); }
function cancelPendingSummonV2(){ const ps=gameState.pendingSummon; if(!ps) return; closeSheet(); act({type:'SUMMON_WINDOW_CLOSE_V42',result:'cancel'}); if(typeof ps.cancel==='string'&&typeof window[ps.cancel]==='function') window[ps.cancel](ps); showToast(`${ps.name} の${ps.label||'召喚'}は無効になりました`); }

/* S03-U15 SUMMON_WINDOW_RESUME: 保存からの再開・Undo・Redo で召喚無効タイミングの途中へ戻った場合にシートを開き直す。
   自動では確定しない（Undo が同じ窓へ戻るたびに召喚し直さないように）。
   チェーン処理中・選択待ち中は既存の再開経路に任せる。 */
function reopenSummonWindowAfterLoadS03(){
  const ps=gameState&&gameState.pendingSummon;
  if(!ps || typeof PLAY_MODE==='undefined' || PLAY_MODE!==PLAY_MODES.DUEL) return null;
  if(gameState.chain&&gameState.chain.length) return 'chain';
  if(gameState.pendingChoice) return 'choice';
  showSummonWindowSheetV2(ps,summonNegatorsV2(ps));
  return 'sheet';
}

function runSystemSelfTestV2(){
  const rows=[], test=(name,fn)=>{let ok=false,detail='';try{const r=fn();ok=!!r;detail=ok?'OK':String(r||'NG');}catch(e){detail=e.message||String(e);}rows.push({name,ok,detail});};
  test('SYSTEM VERSION',()=>newGame().systemVersion==='4.8.0');
  test('カード個体UID',()=>{const g=newGame(),a={id:1},b={id:1};ensureCardUid(g,a);ensureCardUid(g,b);return a.uid!==b.uid;});
  test('Chain state',()=>{const g=newGame();return Array.isArray(g.chain)&&g.chainWindow===null;});
  test('Processor Queue',()=>{const g=newGame();return Array.isArray(g.processorQueue)&&g.processorPaused===false&&g.processorWaiting===null;});
  test('Processor dispatch',()=>typeof dispatchProcessorV27==='function'&&typeof pumpProcessorV27==='function');
  test('Processor chain solve',()=>typeof processSolveChainV27==='function');
  test('Processor event drain',()=>typeof processDrainEventsV27==='function');
  test('POINT/ATTACK processor',()=>typeof processPointV27==='function'&&typeof processAttackV27==='function');
  test('Replay engine',()=>typeof attackReplayNeededV28==='function'&&typeof battleReplayPickV28==='function');
  test('EVENT batch / nested timing',()=>typeof processEventBatchV28==='function'&&PROCESSOR_V27.EVENT_BATCH==='EVENT_BATCH');
  test('Damage Step legality',()=>typeof damageStepResponseLegalV28==='function');
  test('Strict phase route',()=>legalPhaseTransitionV28('main1','battle')&&!legalPhaseTransitionV28('draw','battle'));
  test('先攻1ターン目はMain1→Endへ自動スキップ',()=>{
    const keep=gameState, keepMode=PLAY_MODE;
    try{
      gameState=newGame(); PLAY_MODE=PLAY_MODES.DUEL;
      gameState.turn=1; gameState.firstPlayer=0; gameState.activePlayer=0; gameState.phase='main1';
      return firstTurnBattleForbiddenV311(gameState)&&nextPhaseIdV27()==='end';
    }finally{ gameState=keep; PLAY_MODE=keepMode; }
  });
  test('Damage Step processor',()=>typeof processDamageStepV27==='function'&&typeof advanceDamageStepCoreV27==='function');
  test('召喚無効窓',()=>newGame().pendingSummon===null);
  test('遅延イベントキュー',()=>Array.isArray(newGame().deferredEvents));
  test('1103起動効果ルール',()=>RULING_1103_POST_20110319_IGNITION===true);
  test('召喚成功後はFast窓を経てオープン状態へ戻る',()=>{
    const keep=gameState;
    try{
      gameState=newGame(); gameState.turn=1; gameState.activePlayer=0;
      gameState.timingWindow={kind:'summonFast',turn:1,action:'SUMMON_SUCCESS_FAST'};
      queuePointContinuationV27({kind:'summonFast',clearTimingOnPass:true});
      return gameState.timingWindow===null;
    }finally{ gameState=keep; }
  });
  test('レスキューラビットはFast窓中だけ起動不可',()=>{
    const keep=gameState;
    try{
      gameState=newGame(); gameState.turn=1; gameState.activePlayer=0; gameState.phase='main1';
      const ri=findCardIndex('レスキューラビット'), ni=findCardIndex('セイバーザウルス');
      if(ri<0||ni<0) return false;
      const rabbit={id:ri,owner:0,face:'up',pos:'atk'}; ensureCardUid(gameState,rabbit);
      gameState.players[0].mz=[rabbit];
      gameState.players[0].deck=[{id:ni,owner:0,face:'down',pos:'atk'},{id:ni,owner:0,face:'down',pos:'atk'}];
      gameState.timingWindow={kind:'summonFast',turn:1,action:'SUMMON_SUCCESS_FAST'};
      const during=strictScriptLegalityV2('レスキューラビット',0,'mz',0,{});
      gameState.timingWindow=null;
      const open=strictScriptLegalityV2('レスキューラビット',0,'mz',0,{});
      return during.ok===false && open.ok===true;
    }finally{ gameState=keep; }
  });
  test('SEGOCエンジン',()=>typeof startEventChainV2==='function'&&typeof orderSimultaneous==='function');
  test('チェーン無効化',()=>typeof negatePreviousChainLinkV2==='function');
  test('EX召喚無効窓',()=>typeof beginExSummonV2==='function');
  test('同時特殊召喚バッチ',()=>typeof queueSpecialSummonSuccessV2==='function'&&typeof flushResolutionSummonBatchV2==='function');
  test('特殊な通常召喚手順',()=>typeof normalSummonMethodsFor==='function'&&typeof chooseNormalSummonMethod==='function');
  test('妥協召喚の元々の数値状態',()=>typeof applyNormalSummonMethod==='function'&&typeof reconcileProcedureBaseStats==='function');
  test('妥協セット→反転時の数値適用',()=>typeof activatePendingProcedureBaseStats==='function');
  test('2体分リリース価値',()=>tributeValueOptionsForDb({n:'ダブルコストン'},{n:'可変機獣 ガンナードラゴン',at:'闇'}).includes(2));
  test('属性不一致は1体分',()=>!tributeValueOptionsForDb({n:'カイザー・シーホース'},{n:'可変機獣 ガンナードラゴン',at:'闇'}).includes(2));
  test('地属性2体分リリース',()=>tributeValueOptionsForDb({n:'トロイホース'},{n:'神獣王バルバロス',at:'地'}).includes(2));
  test('ガンナードラゴン共通手順',()=>{const sc=CARD_SCRIPTS['可変機獣 ガンナードラゴン'];return !!(sc&&sc.normalSummonProcedure&&sc.normalSummonProcedure.includeStandard);});
  test('永続カードは解決後に適用',()=>typeof prepareDuelActivation==='function'&&typeof continuousSources==='function');
  test('ADSチェーン3モード',()=>Object.keys(ADS_CHAIN_MODES).length===3&&typeof openAdsChainSettings==='function');
  test('ChainLink ID',()=>typeof effectClassV2==='function'&&newGame().chainSeq===0);
  test('発動無効/効果無効を分離',()=>{const g=newGame();g.chain=[{name:'x',negated:false}];applyAction(g,{type:'CHAIN_NEGATE_LINK',index:0,mode:'effect'});return g.chain[0].effectNegated===true&&g.chain[0].activationNegated===false;});
  test('ラギアはSS2',()=>{const sc=CARD_SCRIPTS['エヴォルカイザー・ラギア'];return !!(sc&&sc.quickEffect===true&&sc.priority===2&&sc.summonNegate);});
  test('Battle Command processor',()=>PROCESSOR_V27.BATTLE_COMMAND==='BATTLE_COMMAND'&&typeof processBattleCommandV29==='function');
  test('Battle attacker legality',()=>typeof battleAttackersV29==='function'&&typeof cannotAttackNow==='function');
  test('Battle target UI',()=>typeof battleTargetsV29==='function'&&typeof battleCardUIV29==='function'&&typeof battleDockV29==='function');
  test('CHAIN_END processor',()=>PROCESSOR_V27.CHAIN_END==='CHAIN_END'&&typeof processChainEndV30==='function');
  test('効果無効は発動無効と別処理',()=>{const g=newGame();g.chain=[{name:'x',negated:true,negateMode:'effect',activationNegated:false,effectNegated:true}];return g.chain[0].effectNegated&&!g.chain[0].activationNegated;});
  test('DUEL進行ロック',()=>typeof duelFlowBusyReasonV30==='function'&&typeof ensurePublicDuelFlowV30==='function');
  test('保存データ現行版移行',()=>newGame().systemVersion==='4.8.0'&&newGame().systemFault===null);
  test('複数ドローDeckout基盤',()=>{const g=newGame();g.players[0].deck=[{id:0,face:'down',pos:'atk'}];applyAction(g,{type:'DRAW',player:0,n:2});return g.loser===0&&g.duelEndedReason==='deckout'&&g.players[0].hand.length===1;});
  test('END_PHASE processor',()=>PROCESSOR_V27.END_PHASE==='END_PHASE'&&typeof processEndPhaseV30==='function');
  test('予約効果の実処理基盤',()=>typeof resolveReservedEffectsV30==='function');
  test('レスキューラビット名称ターン1',()=>{const sc=CARD_SCRIPTS['レスキューラビット'];return !!(sc&&sc.countLimit===1&&sc.nameLimit===true);});
  test('兎ラギア固定初手プリセット',()=>TEST_PRESETS.rabbitFlow&&TEST_PRESETS.rabbitFlow.p0Deck==='rabbit'&&TEST_PRESETS.rabbitFlow.p1Deck==='rabbit');
  test('v4.7.0 実機スモーク13シナリオ',()=>typeof V351_DEVICE_SMOKE==='object'&&Object.keys(V351_DEVICE_SMOKE).length===13&&typeof openDeviceSmokeV351==='function'&&typeof v351SmokePreflight==='function');
  test('X素材detachは素材の持ち主の墓地',()=>{
    const g=newGame();
    const xyz={id:0,owner:1,face:'up',pos:'atk',xyz:[{id:0,owner:0,face:'up',pos:'atk'}]};
    g.players[1].mz=[xyz];
    applyAction(g,{type:'FX_DETACH',player:1,mzIndex:0,reason:'test'});
    return g.players[0].grave.length===1&&g.players[1].grave.length===0&&xyz.xyz.length===0;
  });
  test('Xモンスター離場時も素材は各持ち主の墓地',()=>{
    const g=newGame();
    const xyz={id:0,owner:1,face:'up',pos:'atk',xyz:[{id:0,owner:0,face:'up',pos:'atk'},{id:0,owner:1,face:'up',pos:'atk'}]};
    g.players[1].mz=[xyz];
    applyAction(g,{type:'FX_TO_GRAVE',player:1,zone:'mz',index:0,reason:'test'});
    return g.players[0].grave.length===1&&g.players[1].grave.length===2;
  });
  test('EXモンスターのバウンスは持ち主EXへ',()=>{
    const g=newGame(), li=findCardIndex('エヴォルカイザー・ラギア');
    if(li<0) return false;
    const laggia={id:li,owner:0,controller:0,face:'up',pos:'atk'};
    g.players[0].mz=[laggia];
    applyAction(g,{type:'FX_BOUNCE',player:0,zone:'mz',index:0,reason:'強制脱出装置'});
    return g.players[0].hand.length===0&&g.players[0].ex.length===1&&g.players[0].ex[0]===laggia;
  });
  test('死者蘇生した相手モンスターのバウンスは持ち主手札へ',()=>{
    const g=newGame(), mi=findCardIndex('セイバーザウルス');
    if(mi<0) return false;
    const foe={id:mi,owner:1,face:'up',pos:'atk'};
    g.players[1].grave=[foe];
    applyAction(g,{type:'FX_CONTROL',player:1,zone:'grave',index:0,toPlayer:0,reason:'死者蘇生'});
    applyAction(g,{type:'FX_SPECIAL_SUMMON',player:0,from:'grave',fromIndex:0,pos:'atk',reason:'死者蘇生'});
    applyAction(g,{type:'FX_BOUNCE',player:0,zone:'mz',index:0,reason:'強制脱出装置'});
    return g.players[0].hand.length===0&&g.players[1].hand.length===1&&g.players[1].hand[0]===foe;
  });
  return rows;
}
function runDuelCompletionRegressionV30(){
  const rows=[];
  const test=(name,fn)=>{ let ok=false,detail=''; try{ const r=fn(); ok=!!r; detail=ok?'OK':String(r||'NG'); }catch(e){ detail=e.message||String(e); } rows.push({name,ok,detail}); };
  test('初手5枚＋先攻通常ドロー',()=>{
    const g=newGame();
    g.players[0].deck=Array.from({length:40},(_,i)=>({id:0,face:'down',pos:'atk',uid:i+1}));
    applyAction(g,{type:'DRAW',player:0,n:5,initial:true});
    applyAction(g,{type:'DRAW',player:0,n:1});
    return g.players[0].hand.length===6&&g.players[0].deck.length===34&&g.drawnThisTurn===true;
  });
  test('ターン移行で召喚権/攻撃済みをリセット',()=>{
    const g=newGame(); g.phase='end'; g.players[0].normalSummonUsed=true;
    g.players[0].mz=[{id:0,face:'up',pos:'atk',attacked:true}];
    applyAction(g,{type:'PASS_TURN'});
    return g.turn===2&&g.activePlayer===1&&g.phase==='draw'&&!g.players[0].normalSummonUsed&&!g.players[0].mz[0].attacked;
  });
  test('合法フェイズ経路',()=>legalPhaseTransitionV28('draw','standby')&&legalPhaseTransitionV28('standby','main1')&&legalPhaseTransitionV28('main1','end')&&!legalPhaseTransitionV28('draw','end'));
  test('LP0でデュエル終了',()=>{ const g=newGame(); applyAction(g,{type:'LP',player:1,delta:-8000}); return g.loser===1&&g.duelEndedReason==='lp0'; });
  test('不足枚数ドローでデッキアウト',()=>{ const g=newGame(); g.players[1].deck=[{id:0,face:'down',pos:'atk'}]; applyAction(g,{type:'DRAW',player:1,n:2}); return g.loser===1&&g.players[1].hand.length===1; });
  test('勝敗後processor停止条件',()=>{ const g=newGame(); g.loser=0; return g.loser!=null; });
  return rows;
}
function openDuelCompletionRegressionV30(){
  const rows=runDuelCompletionRegressionV30(),ok=rows.filter(x=>x.ok).length;
  sheet.innerHTML=`<div class="grip"></div><h3>1デュエル完走 回帰テスト v4.8.0</h3><div class="meta" style="margin-bottom:10px">${ok}/${rows.length} PASS<br>初手→通常ドロー→フェイズ→ターン移行→勝敗までの基礎ループを検査します。</div><div class="dbg-list">${rows.map(x=>`<div class="dbg-entry"><div class="dbg-name">${x.ok?'✓':'✕'} ${x.name}</div><div class="dbg-step${x.ok?'':' ng'}">${x.detail}</div></div>`).join('')}</div><button class="close" onclick="openMenu()">戻る</button>`;
  veil.classList.add('on');
}

function openSystemSelfTestV2(){
  const rows=runSystemSelfTestV2(),ok=rows.filter(x=>x.ok).length;
  sheet.innerHTML=`<div class="grip"></div><h3>System Core v4.8.0 自己診断</h3><div class="meta" style="margin-bottom:10px">${ok}/${rows.length} PASS</div><div class="dbg-list">${rows.map(x=>`<div class="dbg-entry"><div class="dbg-name">${x.ok?'✓':'✕'} ${x.name}</div><div class="dbg-step${x.ok?'':' ng'}">${x.detail}</div></div>`).join('')}</div><button class="close" onclick="openMenu()">戻る</button>`;
  veil.classList.add('on');
}
