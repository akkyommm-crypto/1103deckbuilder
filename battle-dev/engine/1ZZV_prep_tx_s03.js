/* =========================================================================
   S03-U471 (part B) — 発動準備トランザクション（PREP_TX）
   -------------------------------------------------------------------------
   欠陥（U468 で発見、U470 で計測）: 発動準備は 表にする/手札から置く → コスト → 対象選択 の順に進む。対象選択が
   「選択できるカードが足りません」で失敗しても（requestChoiceV49 は false を返すだけで、API.selectCard はその戻り値を捨てる）、
   継続（finishPrepare / opts.onAbort）が呼ばれず、コストは払われたまま、カードは魔法・罠ゾーンに表で残る。
   手動キャンセル（選択を閉じる）も同じ停止状態になる。
   ■ 設計（単一の復元点を gameState に持ち、Action で開閉する）
     1. 開く: 準備の最初の状態変化（表にする / 手札から置く）の前に PREP_TX_BEGIN_S03 を Journal へ載せる。reducer は gs.prepTxS03 に
        その時点の gameState（下の除外キーを除く）の複製を1つだけ置く。gameState の中にあるので Save/Load・Undo/Redo・Replay が自動で運ぶ。
     2. 失敗の合図は推測しない: 候補が足りず requestChoiceV49 が断った時だけ CHOICE_INSUFFICIENT_SEQ_S03 が進む。
        コールバックが来ない・選択待ちが無い、というだけでは中止しない。手動キャンセルは別の理由 'cancel' で区別する。
     3. 中止: PREP_TX_ABORT_S03 が復元点から盤面を戻して記録を消す（冪等。同じ準備では1回しか走らない）。
     4. 閉じる: CHAIN_ADD の reducer が記録を消す（チェーンリンクができた時点で境界）。以後の無効・不発でコストは返らない。
   ■ 復元範囲: players（カードの位置・表裏・フラグ・LP・各山）、乱数列、予約/遅延イベント、発動途中バッファ、選択待ち、回数制限などの gs キー全部。
     除外（復元しない）: prepTxS03 自身・log（追記のみ）・Journal の連番・チェーンとその窓・processor・戦闘/召喚の進行・手番/フェイズ。
     復元できないもの: すでに公開された情報（見せた/めくったカードを見たプレイヤーの記憶）、トースト、UI。
   ========================================================================= */
const PREP_TX_EXCLUDE_S03 = new Set([
  'prepTxS03', 'log', 'scriptLog', 'processorTrace',
  'chain', 'chainSeq', 'chainWindow',
  'processorQueue', 'processorCurrent', 'processorWaiting', 'processorPaused', 'processorSeq',
  'battle', 'lastBattle', 'battlePhaseV6', 'pendingAttack', 'attackNegated', 'pendingSummon', 'pendingExV2', 'timingWindow',
  'resolvingLinkS03', 'eventChainResumeV11',
  'turn', 'phase', 'activePlayer', 'firstPlayer', 'priority',
  'systemFault', 'systemVersion', 'replayVersion', 'rngInitialSeed', 'choiceSeq'
]);
/* 実行時の対応表（gameState の外）: いま開いている準備。Undo/Redo/読込では v41SyncJournalToState が消す。 */
let PREP_TX_LIVE_S03 = null;
const PREP_TX_STATS_S03 = {begin:0, commit:0, abort:0, abortRefused:0, byReason:{}};
function prepTxStatsS03(){ return JSON.parse(JSON.stringify(PREP_TX_STATS_S03)); }
function prepTxResetStatsS03(){ PREP_TX_STATS_S03.begin = 0; PREP_TX_STATS_S03.commit = 0; PREP_TX_STATS_S03.abort = 0; PREP_TX_STATS_S03.abortRefused = 0; PREP_TX_STATS_S03.byReason = {}; }

function prepTxSnapshotS03(gs){
  const out = {};
  Object.keys(gs).forEach(k => { if(PREP_TX_EXCLUDE_S03.has(k) || k.indexOf('__') === 0) return; out[k] = gs[k]; });
  return JSON.parse(JSON.stringify(out));
}

/* ---- reducer（純粋。Replay はこれだけを適用する）---- */

/* players を戻す。プレイヤーの入れ物とカードのオブジェクトは（同じ uid なら）同一のまま中身だけを書き戻す:
   イベント選択（EVT_V2_STATE）などの実行時の表がカードの参照を持っているため、別オブジェクトに差し替えると参照が古くなる。 */
const PREP_TX_CARD_ZONES_S03 = ['hand', 'deck', 'mz', 'sz', 'grave', 'banish', 'ex'];
function prepTxCollectCardsS03(card, byUid){
  if(!card || typeof card !== 'object') return;
  if(card.uid != null && !byUid.has(card.uid)) byUid.set(card.uid, card);
  (card.xyz || []).forEach(m => prepTxCollectCardsS03(m, byUid));
}
function prepTxRestoreCardS03(sc, byUid, used){
  if(!sc || typeof sc !== 'object') return sc;
  const live = (sc.uid != null && !used.has(sc.uid)) ? byUid.get(sc.uid) : null;
  const obj = live || {};
  if(sc.uid != null) used.add(sc.uid);
  Object.keys(obj).forEach(k => { delete obj[k]; });
  Object.keys(sc).forEach(k => { obj[k] = (k === 'xyz' && Array.isArray(sc.xyz)) ? sc.xyz.map(m => prepTxRestoreCardS03(m, byUid, used)) : sc[k]; });
  return obj;
}
function prepTxRestorePlayersS03(gs, snapPlayers){
  const byUid = new Map();
  gs.players.forEach(P => { PREP_TX_CARD_ZONES_S03.forEach(z => (P[z] || []).forEach(c => prepTxCollectCardsS03(c, byUid))); prepTxCollectCardsS03(P.field, byUid); });
  const used = new Set();
  snapPlayers.forEach((sp, i) => {
    const P = gs.players[i];
    PREP_TX_CARD_ZONES_S03.forEach(z => {
      const arr = Array.isArray(P[z]) ? P[z] : (P[z] = []);
      const restored = (sp[z] || []).map(c => prepTxRestoreCardS03(c, byUid, used));
      arr.length = 0; restored.forEach(c => arr.push(c));
    });
    P.field = sp.field ? prepTxRestoreCardS03(sp.field, byUid, used) : (sp.field === undefined ? undefined : null);
    if(P.field === undefined) delete P.field;
    Object.keys(sp).forEach(k => { if(PREP_TX_CARD_ZONES_S03.indexOf(k) >= 0 || k === 'field') return; P[k] = sp[k]; });
    Object.keys(P).forEach(k => { if(!(k in sp)) delete P[k]; });
  });
}

function prepTxBeginReduceS03(gs, a){
  const dBegin = (typeof v41StateDigest === 'function') ? v41StateDigest(gs) : '';   /* 復元点を取った時点の標準 digest（Replay の照合に使う） */
  gs.prepTxS03 = {
    d:dBegin,
    v:1, uid:(a.uid != null ? a.uid : null), name:String(a.name || ''), player:(a.player != null ? a.player : gs.activePlayer),
    turn:gs.turn, phase:gs.phase, chainLen:(gs.chain || []).length,
    snap:prepTxSnapshotS03(gs)
  };
}
function prepTxAbortReduceS03(gs, a){
  const rec = gs.prepTxS03;
  if(!rec) return;                                                /* 冪等: 記録が無ければ何もしない */
  if(a.uid != null && rec.uid !== a.uid) return;                  /* 別の準備の記録には触らない */
  if((gs.chain || []).length !== rec.chainLen){ delete gs.prepTxS03; return; }   /* チェーンが動いた＝すでにコミット後。巻き戻さず記録だけ閉じる */
  const snap = JSON.parse(JSON.stringify(rec.snap));
  Object.keys(gs).forEach(k => { if(PREP_TX_EXCLUDE_S03.has(k) || k.indexOf('__') === 0) return; if(!(k in snap)) delete gs[k]; });
  Object.keys(snap).forEach(k => {
    if(k === 'players' && Array.isArray(gs.players) && gs.players.length === snap.players.length) prepTxRestorePlayersS03(gs, snap.players);
    else gs[k] = snap[k];
  });
  delete gs.prepTxS03;
  if(typeof logIt === 'function') logIt(gs, `発動準備を取り消し：${rec.name}（${({insufficient:'選択できるカードが足りない', cancel:'選択をやめた', 'cost-fail':'コストを払えない', refused:'発動できない', 'p11-abort':'発動中止', load:'読込で選択を復元できない'})[a.reason] || a.reason || '中止'}）— 準備中の変化を発動前に戻した`);
}
function prepTxCommitReduceS03(gs, a){
  const rec = gs.prepTxS03;
  if(!rec) return;
  if(a.uid != null && rec.uid !== a.uid) return;
  delete gs.prepTxS03;
}

/* ---- 実行側 ---- */
/* Undo / Redo / 読込の後: 状態に記録があり、その発動の準備中の選択待ちが開いているなら、実行時の対応表を状態から作り直す
   （Undo で「選択をやめた」前に戻った時、もう一度やめても発動前に戻せるように）。 */
function prepTxRebuildLiveS03(gs){
  PREP_TX_LIVE_S03 = null;
  const rec = gs && gs.prepTxS03, pc = gs && gs.pendingChoice;
  const m = pc && pc.meta && pc.meta.activationPrepS03;
  if(rec && m && m.uid != null && m.uid === rec.uid) PREP_TX_LIVE_S03 = {uid:rec.uid, name:rec.name, player:rec.player, closed:false};
}
/* 実行時の対応表と gameState の記録が両方そろっている時だけ「開いている」（古い対応表が残っていても誤って開いたままとみなさない） */
function prepTxLiveForS03(uid){
  return !!(PREP_TX_LIVE_S03 && PREP_TX_LIVE_S03.uid === uid && !PREP_TX_LIVE_S03.closed
    && typeof gameState !== 'undefined' && gameState && gameState.prepTxS03 && gameState.prepTxS03.uid === uid);
}
/* 準備の途中で失敗しうる（コスト・対象選択・発動時の宣言）スクリプトだけ復元点を作る。失敗点が無いカードは Journal を増やさない。 */
function prepTxNeededS03(name){
  const sc = (typeof CARD_SCRIPTS !== 'undefined') ? CARD_SCRIPTS[name] : null;
  if(!sc) return false;
  return typeof sc.cost === 'function' || typeof sc.selectTargets === 'function' || typeof sc.activationV11 === 'function' || !!sc.detachCostS03
    || (typeof nativeEffectsV4 === 'function' && nativeEffectsV4(name).length > 0);
}
function prepTxOpenS03(p, card, name){
  if(typeof gameState === 'undefined' || !gameState || gameState.__v41ReplayApplying || gameState.__v44ReplayPreview) return null;
  if(!card) return null;
  const uid = ensureCardUid(gameState, card);
  if(prepTxLiveForS03(uid)) return PREP_TX_LIVE_S03;                /* 呼び出し元（手札からの発動）が先に開いた */
  PREP_TX_LIVE_S03 = null;                                          /* 古い対応表は捨てる */
  if(typeof commitAutomaticActionV44 !== 'function') return null;
  commitAutomaticActionV44({type:'PREP_TX_BEGIN_S03', player:p, uid, name:String(name || '')});
  PREP_TX_STATS_S03.begin++;
  PREP_TX_LIVE_S03 = {uid, name:String(name || ''), player:p, closed:false};
  return PREP_TX_LIVE_S03;
}
/* 中止。戻り値 true = 実際に巻き戻した。同じ準備では2回目以降は false（冪等）。 */
function prepTxAbortS03(reason, uid){
  const live = PREP_TX_LIVE_S03, rec = (typeof gameState !== 'undefined' && gameState) ? gameState.prepTxS03 : null;
  if(!live || live.closed || !rec || rec.uid !== live.uid){ PREP_TX_STATS_S03.abortRefused++; return false; }
  if(uid != null && uid !== live.uid){ PREP_TX_STATS_S03.abortRefused++; return false; }    /* 呼び出し元の準備が開いているものと違う（別の準備の記録には触らない） */
  if((gameState.chain || []).length !== rec.chainLen){ PREP_TX_STATS_S03.abortRefused++; return false; }   /* コミット後（チェーンが動いた）は戻さない */
  live.closed = true; live.aborted = true;
  PREP_TX_LIVE_S03 = null;
  commitAutomaticActionV44({type:'PREP_TX_ABORT_S03', player:rec.player, uid:rec.uid, name:rec.name, reason:String(reason || 'abort')});
  PREP_TX_STATS_S03.abort++; PREP_TX_STATS_S03.byReason[reason] = (PREP_TX_STATS_S03.byReason[reason] || 0) + 1;
  if(typeof endActivationPrepS03 === 'function') endActivationPrepS03();
  if(typeof closeSheet === 'function') closeSheet();
  if(typeof showToast === 'function' && reason === 'cancel') showToast('発動をやめました');
  if(typeof render === 'function') render();
  return true;
}
/* 閉じる（正常）: CHAIN_ADD の reducer が記録を消した後に呼ぶ。 */
function prepTxCommitS03(card){
  const live = PREP_TX_LIVE_S03;
  if(live && (!card || card.uid == null || live.uid === card.uid)){ live.closed = true; PREP_TX_LIVE_S03 = null; PREP_TX_STATS_S03.commit++; }
  if(gameState && gameState.prepTxS03 && card && gameState.prepTxS03.uid === card.uid && typeof commitAutomaticActionV44 === 'function'){
    commitAutomaticActionV44({type:'PREP_TX_COMMIT_S03', player:gameState.prepTxS03.player, uid:card.uid});   /* 防御: CHAIN_ADD が閉じなかった経路 */
  }
}
/* 巻き戻さずに記録だけ閉じる（準備が「チェーン無しの設置」で終わる既存の設計、または発動が成立しなかった場合）。 */
function prepTxCloseS03(uid){
  if(!prepTxLiveForS03(uid)){ return false; }
  const live = PREP_TX_LIVE_S03; live.closed = true; PREP_TX_LIVE_S03 = null;
  commitAutomaticActionV44({type:'PREP_TX_COMMIT_S03', player:gameState.prepTxS03.player, uid, reason:'close'});
  PREP_TX_STATS_S03.closed = (PREP_TX_STATS_S03.closed || 0) + 1;
  return true;
}
/* 失敗の明示的な合図（requestChoiceV49 が候補不足で断った）を見て中止する。
   合図が無い場合・選択待ちが残っている場合・確認シートが開いている場合は何もしない（推測しない）。 */
function prepTxCheckInsufficientS03(sigBefore, uid){
  if(!PREP_TX_LIVE_S03 || PREP_TX_LIVE_S03.closed) return false;
  if(uid == null || !prepTxLiveForS03(uid)) return false;      /* この準備（uid）の窓の中の合図だけを見る。別の処理の候補不足では巻き戻さない */
  if(typeof CHOICE_INSUFFICIENT_SEQ_S03 === 'undefined' || !(CHOICE_INSUFFICIENT_SEQ_S03 > sigBefore)) return false;
  if(gameState.pendingChoice) return false;
  if(typeof PROMPT_OPEN_S03 !== 'undefined' && PROMPT_OPEN_S03) return false;
  return prepTxAbortS03('insufficient', uid);
}
function choiceInsufficientSeqS03(){ return (typeof CHOICE_INSUFFICIENT_SEQ_S03 !== 'undefined') ? CHOICE_INSUFFICIENT_SEQ_S03 : 0; }
