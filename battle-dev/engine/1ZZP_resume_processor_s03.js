/* =========================================================================
   S03-U296 — C-S03-35 PROCESSOR_WAIT_RESUME 保存からの再開で、待ち状態の processor を積み直す
   -------------------------------------------------------------------------
   offerResumeDuel は processor（キュー・待ち）を捨てて「開いた状態」へ戻す。UI の窓を持つ待ち状態のまま保存された局面では、
   これで続きの処理が消えていた（R1 の保存・再開の往復で発見）：
   - トリガー選択（EVENT / EVENT_BATCH の待ち＋ EVT_V2_STATE）：選択シートが消え、誘発効果を発動する機会を失った。
   - POINT の窓（攻撃宣言時・ダメージステップ・召喚成功後など）：窓が消え、pendingAttack だけが Journal に残らずに消えて Replay が食い違った。
   ■ 保存
     saveDuel が gameState の外にあるトリガー選択の記述（eventSelectionDescriptorV11、UID / JSON のみ）を evtSelectionS296 に書く。
     新しい gameState キーは作らない。processor の待ち・キューは既存の保存対象（gameState.processorWaiting / processorQueue）。
   ■ 再開
     offerResumeDuel が processor を捨てる前に captureProcessorSaveS296 で待ち・キュー・pendingAttack を控え、
     他の復元（発動の巻き戻し・選択待ち）の後に restoreProcessorAfterLoadS296 で積み直す。
     - EVENT / EVENT_BATCH：待ち状態の processor とキューを戻し、記述からトリガー選択を開き直す。
     - POINT：その窓の unit を先頭に積み直して processor を動かす（窓はデータ payload から開き直される）。
       その窓から始めたチェーンが残っている場合は、窓を待ちのまま戻し、チェーン終了後の処理（pointChainAfterV27）を payload から作り直す。
   ========================================================================= */
let RESOLVE_START_SEQ_S296 = null;
/* gameState.lastBattle keeps the two battling cards as object references (atkCard / defCard); scripts compare them with ===
   (u52WasFaceUpAttackInBattle, battleOpponentV28 …). The JSON round trip of a save makes them copies, so the comparison failed after a resume
   (ジュラック・ヴェロー's 「戦闘によって破壊され墓地へ送られた時」 trigger was refused for ever). Link them to the live cards again by uid. */
function relinkLastBattleAfterLoadS296(gs){
  gs = gs || gameState;
  const lb = gs && gs.lastBattle;
  if(!lb) return false;
  let changed = false;
  [['atkCard','attackerUidV6'], ['defCard','defenderUidV6']].forEach(([k, u]) => {
    if(!lb[k] || lb[u] == null) return;
    const h = findCardByUid(lb[u]);
    if(h && h.card && lb[k] !== h.card){ lb[k] = h.card; changed = true; }
  });
  return changed;
}
/* A legacy choice (a closure) that was open while a chain link resolved cannot be restored. The link's resolution began at the Journal
   seq meta.resolutionWaitS03.startSeq: rebuild the state at that point (Replay Runner) and resolve the link again, so the choice opens again.
   The queue below the resolving unit (the saved queue after its own follow-up items) is kept. */
function recoverInterruptedResolutionAfterLoadS296(saved){
  const pc = gameState && gameState.pendingChoice;
  if(!pc || !pc.meta || !pc.meta.resolutionWaitS03 || pc.meta.resolutionWaitS03.startSeq == null) return false;
  if(pc.resume && pc.resume.mode === 'registry' && typeof CHOICE_HANDLERS_V49 !== 'undefined' && CHOICE_HANDLERS_V49[pc.resume.handler]) return false;
  if(typeof CHOICE_LEGACY_CB_V49 !== 'undefined' && CHOICE_LEGACY_CB_V49.has(pc.cid)) return false;
  if(!saved || !saved.waiting || saved.waiting.type !== PROCESSOR_V27.SOLVE_CHAIN) return false;
  const startSeq = Number(pc.meta.resolutionWaitS03.startSeq);
  const pkg = v41ReplayPackage(gameState);
  if(!v44ReplayReady(pkg).ok) return false;
  const cut = pkg.actions.findIndex(e => Number(e.seq) > startSeq);
  if(cut < 0) return false;
  const rebuilt = v44ReplayStateFromPackage(pkg);
  if(!rebuilt) return false;
  const live = gameState, oldMode = v44ReplaySetMode(pkg);
  let ok = true;
  try{
    gameState = rebuilt;
    for(let i = 0; i < cut; i++){ const r = v44ApplyReplayEntry(pkg.actions[i]); if(!r.ok){ ok = false; break; } }
  }catch(e){ ok = false; }
  if(oldMode != null) PLAY_MODE = oldMode;
  if(!ok){ gameState = live; return false; }
  delete gameState.__v41ReplayApplying; delete gameState.__v44ReplayPreview;
  v44ReplayAdoptPrefix(pkg, cut, gameState);
  gameState.systemFault = null;
  gameState.processorQueue = []; gameState.processorCurrent = null; gameState.processorWaiting = null; gameState.processorPaused = false;
  gameState.pendingAttack = saved.pendingAttack || gameState.pendingAttack || null;
  if(live.chainWindow) gameState.chainWindow = JSON.parse(JSON.stringify(live.chainWindow));
  ['battle', 'timingWindow'].forEach(k => { if(live[k] && !gameState[k] &&
    !(k === 'timingWindow' && typeof summonTimingWindowS03 === 'function' && summonTimingWindowS03(live[k]))) gameState[k] = JSON.parse(JSON.stringify(live[k])); });   /* S03-U486: 閉じ手（POINT）を捨てた召喚・反転の窓は引き継がない */   /* not in the Journal (see engine/1X) */
  /* the queue under the resolving link: after the follow-up items the unit queued itself (chain left: ADJUST + SOLVE_CHAIN; else ADJUST + CHAIN_END + DRAIN_EVENTS) */
  const q = saved.queue || [], types = q.map(u => u.type);
  const pat = (live.chain || []).length
    ? [PROCESSOR_V27.ADJUST, PROCESSOR_V27.SOLVE_CHAIN]
    : [PROCESSOR_V27.ADJUST, PROCESSOR_V27.CHAIN_END, PROCESSOR_V27.DRAIN_EVENTS];
  let at = -1;
  for(let i = 0; i + pat.length <= types.length; i++){ if(pat.every((t, k) => types[i + k] === t)){ at = i; break; } }
  const rest = at >= 0 ? q.slice(at + pat.length) : [];
  ensureProcessorStateV27();
  gameState.processorQueue = [{id:++gameState.processorSeq, type:PROCESSOR_V27.SOLVE_CHAIN, payload:{}, turn:gameState.turn, phase:gameState.phase}].concat(rest);
  if(typeof showToast === 'function') showToast('保存時に途中だった効果の解決をやり直します');
  RESUME_PUMP_S296 = true;
  return true;
}
let RESUME_PUMP_S296 = false;
function eventSelectionSaveMetaS296(){
  if(typeof EVT_V2_STATE === 'undefined' || !EVT_V2_STATE) return null;
  if(typeof eventSelectionDescriptorV11 !== 'function') return null;
  try{ return eventSelectionDescriptorV11(null); }catch(e){ return null; }
}
function captureProcessorSaveS296(gs){
  if(!gs) return null;
  const w = gs.processorWaiting || null;
  if(!w || !gs.processorPaused) return null;   /* processorWaiting without the pause is a finished parent of a child chain, not a window */
  const clone = x => JSON.parse(JSON.stringify(x));
  return {waiting:clone(w), queue:clone(gs.processorQueue || []), pendingAttack:gs.pendingAttack ? clone(gs.pendingAttack) : null,
          timingWindow:gs.timingWindow ? clone(gs.timingWindow) : null};
}
function restoreProcessorAfterLoadS296(saved, evtMeta){
  if(RESUME_PUMP_S296){ RESUME_PUMP_S296 = false; pumpProcessorV27(); return true; }
  if(typeof PLAY_MODE === 'undefined' || PLAY_MODE !== PLAY_MODES.DUEL || !gameState) return false;
  if(!saved || !saved.waiting) return false;
  if(gameState.processorPaused || gameState.processorWaiting || (gameState.processorQueue || []).length) return false;
  ensureProcessorStateV27();
  const w = saved.waiting, t = w.type;
  if(t === PROCESSOR_V27.EVENT || t === PROCESSOR_V27.EVENT_BATCH){
    /* the unit keeps waiting (its continuation is the selection's end, or the chain's end through gameState.eventChainResumeV11) */
    gameState.processorQueue = saved.queue || [];
    gameState.processorWaiting = w; gameState.processorCurrent = null; gameState.processorPaused = true;
    if(saved.pendingAttack) gameState.pendingAttack = saved.pendingAttack;
    /* the summon / flip timing window (which offerResumeDuel clears together with the processor) belongs to this waiting event: 魔導戦士 ブレイカー's trigger reads it */
    if(!gameState.timingWindow && saved.timingWindow) gameState.timingWindow = saved.timingWindow;
    /* an open selection is reopened here; with an activation choice pending, the choice's own continuation reopens it (completeEventSelectionV11) */
    if(evtMeta && !gameState.pendingChoice){
      EVT_V2_STATE = restoreEventSelectionV11(evtMeta);
      processEventGroupV2();
    }
    return true;
  }
  /* S03-U297: the hand-size discard of the End Phase (engine/1ZZJ) — the TURN unit waits for the choice; its answer resumes the processor only while the
     unit is waiting. Without the unit the answer discarded the cards and the turn did not end (found by the R1 random sweep with save / resume). */
  if(t === PROCESSOR_V27.TURN && w.payload && w.payload.handLimitWaitS03){
    gameState.processorQueue = saved.queue || [];
    gameState.processorCurrent = null;
    if(gameState.pendingChoice){ gameState.processorWaiting = w; gameState.processorPaused = true; }
    else pumpProcessorV27();   /* the choice is gone: the turn goes on */
    return true;
  }
  if(t === PROCESSOR_V27.POINT){
    if(saved.pendingAttack) gameState.pendingAttack = saved.pendingAttack;
    if((gameState.chain || []).length || gameState.chainWindow || gameState.pendingChoice){
      /* a chain (or an activation choice) that started from this window: keep the window waiting; the chain's end resumes it (the callback is a function of the payload) */
      gameState.processorQueue = saved.queue || [];
      gameState.processorWaiting = w; gameState.processorCurrent = null; gameState.processorPaused = true;
      CHAIN_AFTER_V2 = pointChainAfterV27(w.payload || {});
      return true;
    }
    gameState.processorQueue = [w].concat(saved.queue || []);
    pumpProcessorV27();
    return true;
  }
  return false;
}
