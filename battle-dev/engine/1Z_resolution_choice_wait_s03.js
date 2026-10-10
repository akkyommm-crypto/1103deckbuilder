/* =========================================================================
   S03-U41 — C-S03-33 RESOLUTION_CHOICE_SUMMON_EVENT 効果解決中の選択と処理の順序
   -------------------------------------------------------------------------
   DUEL でチェーンのリンクを解決した時、効果が選択（requestChoice / legacy 選択）を開くと、
   processor は選択の回答を待たずにチェーンの終了・イベントの処理まで進めていた。
   回答で行った特殊召喚などのイベントは、処理し終わった後に積まれて放置され、
   召喚成功のタイミング（応答の窓）が来ず、「召喚成功直後」の窓も閉じなかった（R1 で発見）。
   ■ 解決中に選択が開いたら、SOLVE_CHAIN はその場で待つ（続きの処理は先に積んでおく）。
   ■ 選択の回答・取りやめの継続が終わり、次の選択が開いていなければ、待っていた processor を再開する。
   新しい gameState キーや Action は作らない（processorWaiting は既存の保存対象）。
   ========================================================================= */
function resolutionChoiceWaitS03(){
  if(typeof PLAY_MODE === 'undefined' || PLAY_MODE !== PLAY_MODES.DUEL) return false;
  return !!(gameState && gameState.pendingChoice);
}
function resumeAfterResolutionChoiceS03(){
  if(typeof PLAY_MODE === 'undefined' || PLAY_MODE !== PLAY_MODES.DUEL) return false;
  if(!gameState || gameState.pendingChoice) return false;
  /* S03-U173: destructions deferred during this resolution open their substitute decision first (engine/1ZV) */
  if(typeof flushDestroySubS03==='function' && flushDestroySubS03()) return false;
  /* S03-U278: queued Special Summon position choices next (engine/1ZZK) */
  if(typeof ssPositionPumpS03==='function' && ssPositionPumpS03()) return false;
  const w = gameState.processorWaiting;
  if(!gameState.processorPaused || !w || w.type !== PROCESSOR_V27.SOLVE_CHAIN) return false;
  /* CODEX-C01: all choices belonging to this link have now completed.  Close
     the journaled special-win bracket before the queued Adjust / lower link.
     This guard also leaves a synchronous answer inside processSolveChainV27 to
     that function, rather than closing the bracket while its script is live. */
  if(typeof specialWinEndLinkResolutionS03==='function') specialWinEndLinkResolutionS03();
  processorResumeV27();
  return true;
}
/* 選択を開いた時に、チェーンの解決中だったかを選択の meta に控える（CHOICE_OPEN_V49 の中身なので Replay と一致する） */
function resolutionWaitMetaS03(){
  if(typeof PLAY_MODE === 'undefined' || PLAY_MODE !== PLAY_MODES.DUEL || !gameState) return null;
  /* S03-U296: a choice opened by the answer of an earlier choice of the same resolution (the unit is waiting, not current) belongs to it too */
  const u = gameState.processorCurrent || gameState.processorWaiting;
  if(!u || u.type !== PROCESSOR_V27.SOLVE_CHAIN) return null;
  /* S03-U296: startSeq = the Journal seq before this link's resolution began (a save / resume with a legacy choice re-resolves from there, engine/1ZZP) */
  return {chainLeft:(gameState.chain || []).length, startSeq:(typeof RESOLVE_START_SEQ_S296 !== 'undefined') ? RESOLVE_START_SEQ_S296 : null};
}
/* 保存からの再開は processor を捨てる。解決中の選択（registry 経路）のまま保存された局面では、
   チェーンの続き（残りのリンクの解決、またはチェーンの終了とイベントの処理）を待ちの状態で積み直す。 */
function restoreResolutionChoiceWaitAfterLoadS03(){
  if(typeof PLAY_MODE === 'undefined' || PLAY_MODE !== PLAY_MODES.DUEL || !gameState) return false;
  const pc = gameState.pendingChoice;
  if(!pc || !pc.meta || !pc.meta.resolutionWaitS03) return false;
  if(!(pc.resume && pc.resume.mode === 'registry' && typeof CHOICE_HANDLERS_V49 !== 'undefined' && CHOICE_HANDLERS_V49[pc.resume.handler])) return false;
  if(gameState.processorPaused || (gameState.processorQueue || []).length) return false;
  ensureProcessorStateV27();
  const rest = (gameState.chain || []).length
    ? [{type:PROCESSOR_V27.ADJUST, payload:{reason:'chainLink'}}, {type:PROCESSOR_V27.SOLVE_CHAIN, payload:{}}]
    : [{type:PROCESSOR_V27.ADJUST, payload:{reason:'chainEnd'}}, {type:PROCESSOR_V27.CHAIN_END, payload:{}}, {type:PROCESSOR_V27.DRAIN_EVENTS, payload:{}}];
  enqueueProcessorListFrontV27(rest);
  gameState.processorPaused = true;
  gameState.processorWaiting = {id:++gameState.processorSeq, type:PROCESSOR_V27.SOLVE_CHAIN, payload:{}, turn:gameState.turn, phase:gameState.phase};
  return true;
}
