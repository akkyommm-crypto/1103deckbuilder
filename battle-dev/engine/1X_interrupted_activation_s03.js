/* =========================================================================
   S03-U35 — C-S03-28 INTERRUPTED_ACTIVATION_RECOVERY 発動の途中で保存された局面の再開
   -------------------------------------------------------------------------
   手札から魔法・罠を発動すると MOVE（手札→魔法・罠ゾーン）、セット状態からは FX_SET_STATE（表にする）が先に Journal に載り、
   その後にコスト・対象を legacy 選択（API.selectCard などのクロージャ）で選ぶ。自動保存（Action ごと）がこの間に入ると、
   再開時に legacy 選択は復元できないため解除され（reconcileChoiceAfterLoadV49）、カードはチェーンに乗らないまま
   表側で魔法・罠ゾーンに残っていた（S03-U35 の計測：サイクロン、セットしたサイクロン、マジック・ジャマーのコスト、増援）。
   ■ 記録
     発動の入口（duelActivateFromHand / duelActivateResponseV2 の手札経路 / prepareDuelActivation）が、最初の Action の前の
     Journal seq を beginActivationPrepS03 で控える。準備中に開いた legacy 選択は choice.meta.activationPrepS03 にそれを持つ
     （JSON。CHOICE_OPEN_V49 と一緒に保存・Replay される）。CHAIN_ADD・中止・選択待ちが無くなった時点で控えを消す。
   ■ 再開
     offerResumeDuel が reconcileChoiceAfterLoadV49 の前に recoverInterruptedActivationAfterLoadS03 を呼ぶ。
     復元できない legacy 選択に控えがあれば、Replay Runner で「その seq まで」の Journal を初期盤面から適用し直し、
     その局面と Journal を採用する（途中で払ったコストも戻る）。Journal が切り詰め済み・不一致なら何もしない（従来どおり）。
     新しい gameState キーは作らない。
   ========================================================================= */
let ACTIVATION_PREP_S03 = null;

function beginActivationPrepS03(p, card, name, afterSeq){
  if(typeof gameState === 'undefined' || !gameState || gameState.__v41ReplayApplying) return;
  const uid = card && card.uid != null ? card.uid : null;
  /* 手札からの発動は MOVE の前に控えている。同じカードの prepareDuelActivation はそれを残す。 */
  if(ACTIVATION_PREP_S03 && ACTIVATION_PREP_S03.uid === uid) return;
  const seq = (afterSeq != null) ? Number(afterSeq) : ((typeof V41_ACTION_SEQ !== 'undefined') ? Number(V41_ACTION_SEQ) : 0);
  ACTIVATION_PREP_S03 = {player:p, uid, name:String(name || ''), afterSeq:seq || 0};
}
function endActivationPrepS03(){ ACTIVATION_PREP_S03 = null; }
function settleActivationPrepS03(){
  /* S03-U37: MANUAL の確認シート（askChain / confirmTargets / askForce）が開いている間も控えを残す */
  if(typeof PROMPT_OPEN_S03 !== 'undefined' && PROMPT_OPEN_S03) return;
  if(ACTIVATION_PREP_S03 && !(typeof gameState !== 'undefined' && gameState && gameState.pendingChoice)) ACTIVATION_PREP_S03 = null;
}
function activationPrepMetaS03(){
  const m = ACTIVATION_PREP_S03;
  return m ? {afterSeq:m.afterSeq, uid:m.uid, name:m.name, player:m.player} : null;
}

/* A mandatory trigger is not a player-cancellable activation.  Some legacy
   forced triggers still expose the compatibility cancel button and re-open
   their required target choice after it is pressed; they must not be confused
   with an optional activation the player started by mistake. */
function choiceCancelsActivationS03(choice){
  const m=choice&&choice.meta&&choice.meta.activationPrepS03;
  if(!m) return false;
  const sc=(typeof CARD_SCRIPTS!=='undefined')?CARD_SCRIPTS[m.name]:null;
  return !(sc&&sc.forced===true);
}

/* CODEX-C12: live counterpart of save/resume recovery.  The activation-time
   ChoiceRequest already stores the Journal sequence from before the card was
   moved/flipped and before any cost was paid.  Walk the normal Undo snapshots
   back to that exact sequence so state, Journal, Replay, processor state, and
   the original card position are restored together. */
function rollbackLiveActivationPrepS03(meta){
  if(!meta || meta.afterSeq==null || typeof HISTORY==='undefined' || typeof undo!=='function') return false;
  const target=Math.max(0,Number(meta.afterSeq)||0);
  let guard=(HISTORY.length||0)+1;
  while(currentSeqS03()>target && HISTORY.length && guard-->0) undo();
  if(currentSeqS03()!==target) return false;
  ACTIVATION_PREP_S03=null;
  PROMPT_OPEN_S03=null; MANUAL_PROMPT_PREP_S03=null;
  /* A cancelled preparation is one atomic user decision.  Do not allow Redo
     to resurrect an orphaned target-choice closure without its prep marker. */
  if(typeof REDO!=='undefined') REDO.length=0;
  if(typeof closeSheet==='function') closeSheet();
  if(typeof render==='function') render();
  if(typeof showToast==='function') showToast(`「${String(meta.name||'カード')}」の発動を取り消して元に戻しました`);
  return true;
}

function recoverInterruptedActivationAfterLoadS03(savedPromptS03){
  const pc = gameState && gameState.pendingChoice;
  let m = null;
  if(pc){
    if(pc.resume && pc.resume.mode === 'registry' && typeof CHOICE_HANDLERS_V49 !== 'undefined' && CHOICE_HANDLERS_V49[pc.resume.handler]) return false;
    if(typeof CHOICE_LEGACY_CB_V49 !== 'undefined' && CHOICE_LEGACY_CB_V49.has(pc.cid)) return false;
    m = pc.meta && pc.meta.activationPrepS03;
  }else if(savedPromptS03 && savedPromptS03.afterSeq != null){
    m = savedPromptS03;   /* S03-U37: MANUAL の確認シートが開いたまま保存された（保存データ側の控え） */
  }
  if(!m) return false;
  const pkg = v41ReplayPackage(gameState);
  if(!v44ReplayReady(pkg).ok) return false;
  const cut = pkg.actions.findIndex(e => Number(e.seq) > Number(m.afterSeq));
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
  /* offerResumeDuel が読み込んだ局面に行うのと同じ正規化（processor は再開時に捨てる） */
  gameState.systemFault = null;
  gameState.processorQueue = []; gameState.processorCurrent = null; gameState.processorWaiting = null; gameState.processorPaused = false;
  /* チェーンへの応答の途中だった場合：優先権の窓（Action ではなく直接書かれる）は Journal から戻らないので、保存されていた窓を使う。 */
  if((gameState.chain || []).length && !gameState.chainWindow && live.chainWindow
     && JSON.stringify((live.chain || []).map(l => l.chainId)) === JSON.stringify(gameState.chain.map(l => l.chainId))){
    gameState.chainWindow = JSON.parse(JSON.stringify(live.chainWindow));
  }
  ACTIVATION_PREP_S03 = null;
  /* S03-U296: state that no Action writes (the battle step, the timing window — set by the processor) is not in the Journal: the interrupted
     activation began in the same waiting window, so the saved values are still the right ones (the Velo battle trigger read gameState.battle) */
  ['battle', 'timingWindow'].forEach(k => { if(live[k] && !gameState[k]) gameState[k] = JSON.parse(JSON.stringify(live[k])); });
  if(typeof showToast === 'function') showToast(`保存時に途中だった「${m.name}」の発動を取り消し、発動前の状態に戻しました`);
  return true;
}

/* -------------------------------------------------------------------------
   S03-U37 — MANUAL の確認シート（UI のクロージャで待ち、選択待ちを作らない）
   askChain / confirmTargets / askForce が開いた時点の Journal seq を控え、応答で消す。
   保存時、シートが開いたままで、その後に Action が1つも無く、選択待ちも無く、発動の控えがあれば、
   保存データ（gameState の外）に控えを書く。相手がチェーンした（Action が起きた）後は書かない。
   ------------------------------------------------------------------------- */
let PROMPT_OPEN_S03 = null;
let MANUAL_PROMPT_PREP_S03 = null;
function currentSeqS03(){ return (typeof V41_ACTION_SEQ !== 'undefined') ? Number(V41_ACTION_SEQ) || 0 : 0; }
function notePromptOpenS03(){
  if(typeof gameState === 'undefined' || !gameState || gameState.__v41ReplayApplying) return;
  PROMPT_OPEN_S03 = {seq:currentSeqS03()};
}
function notePromptClosedS03(){ PROMPT_OPEN_S03 = null; }
function noteManualActivationPromptS03(p, card, name, afterSeq){
  MANUAL_PROMPT_PREP_S03 = {player:p, uid:card && card.uid != null ? card.uid : null, name:String(name || ''), afterSeq:Number(afterSeq) || 0, promptSeq:currentSeqS03()};
}
function clearManualActivationPromptS03(){ MANUAL_PROMPT_PREP_S03 = null; }
function interruptedPromptSaveMetaS03(){
  if(!PROMPT_OPEN_S03) return null;
  if(typeof gameState === 'undefined' || !gameState || gameState.pendingChoice) return null;
  if(currentSeqS03() !== PROMPT_OPEN_S03.seq) return null;   /* シートの後に何か起きていれば取り消さない */
  let m = ACTIVATION_PREP_S03;
  if(!m && MANUAL_PROMPT_PREP_S03 && MANUAL_PROMPT_PREP_S03.promptSeq === PROMPT_OPEN_S03.seq) m = MANUAL_PROMPT_PREP_S03;
  return m ? {afterSeq:m.afterSeq, uid:m.uid, name:m.name, player:m.player} : null;
}
