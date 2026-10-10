/* =========================================================================
   UI アクション → applyAction → render のラッパ
   ========================================================================= */
/* ---- Undo（複数段階）＆ このターンにやったこと ---- */
const HISTORY = [];              // 直前スナップショットのスタック
const HISTORY_MAX = 40;
let turnActions = [];            // このターンの短い履歴チップ

/* SET_PHASE / PASS_TURN / SHUFFLE / LOAD_DECK はチップに出さない（ノイズ削減） */
const CHIP_SKIP = new Set(["SET_PHASE","PASS_TURN","SHUFFLE","LOAD_DECK","CHAIN_CLEAR","SET_FIRST_PLAYER","COIN_TOSS"]);

function snapshot(){
  // 構造が単純なので JSON でディープコピー（DBは別なので安全）
  HISTORY.push(JSON.stringify(gameState));
  if(HISTORY.length>HISTORY_MAX) HISTORY.shift();
  REDO.length = 0;                 // 新しい操作をしたらRedoは破棄
}
/* Redo：Undoで戻した操作をやり直す */
function redo(){
  if(gameState&&gameState.__v44ReplayPreview){showToast("Replay再生中はRunnerの操作を使ってください");return;}
  if(!REDO.length) return;
  HISTORY.push(JSON.stringify(gameState));
  gameState = JSON.parse(REDO.pop());
  if(typeof v41EnsureReplayState==='function') v41EnsureReplayState(gameState);
  if(typeof v41SyncJournalToState==='function') v41SyncJournalToState(gameState);
  /* v4.9 P1: Undoと対称に選択待ちを追従させる */
  if(typeof reconcileChoiceAfterLoadV49==='function') reconcileChoiceAfterLoadV49(gameState);
  render();
  if(typeof refreshChoiceSheetV49==='function') refreshChoiceSheetV49();
  else if(!gameState.pendingChoice && typeof closeSheet==='function') closeSheet();
  if(typeof reopenSummonWindowAfterLoadS03==='function') reopenSummonWindowAfterLoadS03();  /* S03-U15 */
}
/* 召喚・リバースなど、誘発の起点になったアクションの窓を開く */
function updateTimingWindow(gs, a){
  const open = k => { gs.timingWindow = {kind:k, turn:gs.turn, action:a.type}; };
  switch(a.type){
    case "NORMAL_SUMMON":
    case "FX_SPECIAL_SUMMON":
    case "FX_EX_SUMMON":
    case "FX_RITUAL_SUMMON":
      open('summon'); break;
    case "FLIP":
      open('flip'); break;
    case "FX_SET_STATE":
      /* S03-U42 (C-S03-34): 窓を開くのは反転召喚だけ。セットした魔法・罠の発動や効果による表側化は召喚ではなく、
         その窓は閉じる処理が無いため、そのフェイズの間モンスターの起動効果を誤って禁止していた。 */
      if(a.face === 'up' && a.zone === 'mz' && (a.flipSummon === true || a.reason === '反転召喚成功' || a.reason === '反転召喚')) open('flip');
      break;
    case "SET_PHASE":
    case "PASS_TURN":
      gs.timingWindow = null; break;   // フェイズが変われば窓は閉じる
  }
}

/* =========================================================================
   デュエルの自動保存と復帰
   ブラウザの戻る操作や、うっかりタブを閉じた場合に盤面が消えないよう、
   操作のたびに保存し、次に開いたときに続きから再開できるようにする。
   ========================================================================= */
const DUEL_SAVE_KEY = 'yg1103_duel_autosave';
let SAVE_TIMER = null;

function saveDuel(){
  if(gameState&&gameState.__v44ReplayPreview) return; // Replay閲覧中の盤面で本番autosaveを上書きしない
  const st = LS(); if(!st) return;
  try{
    st.setItem(DUEL_SAVE_KEY, JSON.stringify({
      at: Date.now(),
      turn: gameState.turn,
      state: gameState,
      replay: (typeof v41ReplayPackage==='function') ? v41ReplayPackage(gameState) : null,
      /* S03-U37: MANUAL の確認シートが開いたままの保存（gameState の外。digest に入らない） */
      interruptedPromptS03: (typeof interruptedPromptSaveMetaS03==='function') ? interruptedPromptSaveMetaS03() : null,
      /* S03-U296: 開いたままのトリガー選択（gameState の外）。再開時に選択を開き直す */
      evtSelectionS296: (typeof eventSelectionSaveMetaS296==='function') ? eventSelectionSaveMetaS296() : null,
    }));
  }catch(e){ /* 容量超過などは無視する */ }
}
/* 連続操作でも重くならないよう、少し待ってから書き出す */
function saveDuelSoon(){
  clearTimeout(SAVE_TIMER);
  SAVE_TIMER = setTimeout(saveDuel, 400);
}
function loadSavedDuel(){
  const st = LS(); if(!st) return null;
  try{
    const raw = st.getItem(DUEL_SAVE_KEY);
    if(!raw) return null;
    const d = JSON.parse(raw);
    return (d && d.state) ? d : null;
  }catch(e){ return null; }
}
function clearSavedDuel(){
  const st = LS(); if(!st) return;
  try{ st.removeItem(DUEL_SAVE_KEY); }catch(e){}
}

/* 保存されたデュエルがあれば、続きから始めるか尋ねる */
function offerResumeDuel(){
  const d = loadSavedDuel();
  if(!d) return false;
  const mins = Math.round((Date.now() - (d.at||0)) / 60000);
  const when = mins < 1 ? "さきほど" : (mins < 60 ? `${mins}分前` : `${Math.round(mins/60)}時間前`);
  if(!confirm(`${when}のデュエル（${d.turn||1}ターン目）が保存されています。\n続きから再開しますか？`)){
    clearSavedDuel();
    return false;
  }
  gameState = d.state;
  const savedSystemVersion=gameState.systemVersion||'';
  /* S03-U296: 待ち状態の processor を捨てる前に控える（restoreProcessorAfterLoadS296 で積み直す） */
  const procSavedS296 = (typeof captureProcessorSaveS296==='function') ? captureProcessorSaveS296(gameState) : null;
  // 古い保存データは状態を引き継ぎつつ、実行エンジンだけ現行版へ移行する。
  gameState.systemVersion="4.8.0";
  gameState.replayVersion=4;
  /* v3.2以前は召喚成功タイミングがMain Phase中に残る不具合があった。
     再開時はprocessorを捨ててオープン状態へ戻すため、その古い窓も破棄する。 */
  if(gameState.timingWindow && ['summon','flip','summonFast','flipFast'].includes(gameState.timingWindow.kind)){
    gameState.timingWindow=null;
  }
  // systemFault は実行時エラーのラッチであり盤面ルール状態ではない。新版で再開する時は解除する。
  gameState.systemFault=null;
  if(gameState.duelEndedReason===undefined) gameState.duelEndedReason=null;
  if(gameState.chainSeq===undefined) gameState.chainSeq=0;
  gameState.processorQueue=[]; gameState.processorCurrent=null; gameState.processorWaiting=null; gameState.processorPaused=false;   /* S03-U296: pendingAttack is cleared below as an Action (the Journal must show it) */
  if(gameState.processorSeq===undefined) gameState.processorSeq=0;
  if(!Array.isArray(gameState.processorTrace)) gameState.processorTrace=[];
  if(!Array.isArray(gameState.deferredEvents)) gameState.deferredEvents=[];
  if(gameState.chainWindow===undefined) gameState.chainWindow=null;
  if(gameState.pendingSummon===undefined) gameState.pendingSummon=null;
  if(!Array.isArray(gameState.runtimeEffects)) gameState.runtimeEffects=[];
  if(!Number.isFinite(Number(gameState.runtimeEffectSeq))) gameState.runtimeEffectSeq=0;
  if(typeof v41EnsureReplayState==='function') v41EnsureReplayState(gameState);
  if(typeof v41RestoreJournalPackage==='function') v41RestoreJournalPackage(d.replay,gameState);
  ensureAllCardUids(gameState);
  /* v4.9 P1: 選択待ちのまま保存された局面の復帰。
     registry経路は resume がデータなので復元できる。
     legacy経路はクロージャが失われているのでここで安全に解除する。 */
  /* S03-U35 (C-S03-28): 発動の準備中（コスト・対象の legacy 選択待ち）に保存された局面は、発動前へ戻す。 */
  if(typeof recoverInterruptedActivationAfterLoadS03==='function') recoverInterruptedActivationAfterLoadS03(d.interruptedPromptS03||null);
  /* S03-U296: a legacy choice that was open while a chain link resolved → resolve the link again from its start */
  if(typeof recoverInterruptedResolutionAfterLoadS296==='function') recoverInterruptedResolutionAfterLoadS296(procSavedS296);
  if(typeof reconcileChoiceAfterLoadV49==='function') reconcileChoiceAfterLoadV49(gameState);
  /* S03-U41 (C-S03-33): 効果解決中の選択のまま保存された局面は、チェーンの続きを待ちの状態で積み直す */
  if(typeof restoreResolutionChoiceWaitAfterLoadS03==='function') restoreResolutionChoiceWaitAfterLoadS03();
  /* S03-U173: a pending destruction-substitute decision (battle cleanup / effect resolution) */
  if(typeof restoreDestroySubWaitAfterLoadS03==='function') restoreDestroySubWaitAfterLoadS03();
  /* S03-U296: lastBattle's card references are copies after the JSON round trip — link them to the live cards again */
  if(typeof relinkLastBattleAfterLoadS296==='function') relinkLastBattleAfterLoadS296(gameState);
  /* S03-U296: UI の窓（トリガー選択・POINT）を持つ待ち状態のまま保存された局面は、processor を積み直して窓を開き直す */
  if(typeof restoreProcessorAfterLoadS296==='function') restoreProcessorAfterLoadS296(procSavedS296, d.evtSelectionS296||null);
  /* S03-U296: an attack in progress whose processor was not restored ends here; the clear is an Action so the Replay agrees */
  if(gameState.pendingAttack && !gameState.processorWaiting && !(gameState.processorQueue||[]).length && typeof commitAutomaticActionV44==='function'){
    commitAutomaticActionV44({type:'ATTACK_PENDING_CLEAR_S03', reason:'resume'});
  }
  HISTORY.length = 0; REDO.length = 0;
  render();
  if(typeof refreshChoiceSheetV49==='function') refreshChoiceSheetV49();
  if(typeof reopenSummonWindowAfterLoadS03==='function') reopenSummonWindowAfterLoadS03();  /* S03-U15 */
  showToast("保存されていたデュエルを再開しました");
  return true;
}

/* 戻る操作でページを離れないようにする。
   1台のスマホで対戦するため、誤操作でデュエルが消えるのを防ぐ。 */
function guardBackButton(){
  try{ history.pushState({duel:1}, ""); }catch(e){ return; }
  window.addEventListener('popstate', ()=>{
    // シートが開いていれば、まずシートを閉じるだけにする
    if(veil.classList.contains("on")){
      history.pushState({duel:1}, "");
      dismissSheet();
      return;
    }
    if(peekBar.classList.contains("on")){
      history.pushState({duel:1}, "");
      peekReturn();
      return;
    }
    if(confirm("デュエルを中断してページを離れますか？\n（盤面は保存されるので、次に開いたとき再開できます）")){
      saveDuel();
      history.back();
      return;
    }
    history.pushState({duel:1}, "");
  });
  window.addEventListener('beforeunload', saveDuel);
}

function act(a){
  if(gameState&&gameState.__v44ReplayPreview){
    showToast("Replay再生中は盤面を直接操作できません。『ここから分岐』を選んでください");
    return;
  }
  /* P3: 効果解決中の移動には「誰の効果か」を Action 自体へ焼き込む。
     Journal へ入る前に付けるので Replay は Action だけで再現できる。 */
  if(typeof p3StampMoveProvenanceV3==='function') p3StampMoveProvenanceV3(a);
  /* S03-U115: 解決中の効果の発生源（魔法・罠の効果を受けない判定用）を Action へ焼き込む */
  if(typeof s03StampEffectSourceU115==='function') s03StampEffectSourceU115(a);
  /* S03-U190: the resolving 「ライトロード」 source of a Deck mill (engine/1ZZE) */
  if(typeof lswStampMillS03==='function') lswStampMillS03(a);
  /* P1.1: 発動時宣言とactivationCostもCHAIN_ADD Actionへ焼き込む。 */
  if(typeof p11StampChainAddV11==='function') p11StampChainAddV11(a,gameState);
  const rngBefore=(typeof v41EnsureReplayState==='function' && gameState) ? (Number(v41EnsureReplayState(gameState).rngState)>>>0) : (Number(gameState&&gameState.rngState)||0);
  snapshot();
  const beforeTurn = gameState.turn;
  applyAction(gameState, a);
  updateTimingWindow(gameState, a);
  // Replay Journalは「このActionそのもの」の直後で確定する。
  // Sin自壊などの自動後処理は別Actionとして後から記録する。
  if(typeof v41RecordCommittedAction==='function') v41RecordCommittedAction(a,rngBefore);
  // ターンが変わったらチップ履歴をリセット
  if(gameState.turn !== beforeTurn) turnActions = [];
  const chip = chipFor(a);
  if(chip) turnActions.push(chip);
  render();
  saveDuelSoon();                 // 盤面が動くたびに自動保存する
  // 御前試合・群雄割拠は永続効果なので、盤面が動いたら即座に適用する。
  // ダメージステップ中は⑤で処理するため、そこでは動かさない。
  if(!gameState.battle) enforceExclusions();
  /* System v9: フィールド離脱の検出と生存リンクの解決。
     Sin の自壊と同じ「盤面が動いたら走るルール処理」の位置に置く。 */
  if(typeof enforceLinkedLeaveV9==='function') enforceLinkedLeaveV9(gameState);
  /* System v10: 「〜は全て守備表示になる」の永続強制も同じ位置で適用する。 */
  if(typeof enforceForcedPositionV10==='function') enforceForcedPositionV10(gameState);
  enforceSinUpkeep();
  /* S03-U196: 「フィールドに「X」が存在しない場合にこのカードは破壊される」 (engine/1ZZF) */
  if(typeof enforceFieldDependentS03==='function') enforceFieldDependentS03();
}

/* Replayに残す必要がある自動ルール処理用。
   Undoスナップショットは増やさず、Action Journalには独立した1手として記録する。 */
function commitAutomaticActionV44(a){
  const rngBefore=(typeof v41EnsureReplayState==='function'&&gameState)?(Number(v41EnsureReplayState(gameState).rngState)>>>0):(Number(gameState&&gameState.rngState)||0);
  applyAction(gameState,a);
  updateTimingWindow(gameState,a);
  if(typeof v41RecordCommittedAction==='function') v41RecordCommittedAction(a,rngBefore);
}

/* 「Sin」モンスターはフィールド魔法がなければ破壊される。
   永続効果なので、盤面が動いたら自動で処理する。 */
let SIN_RESOLVING = false;
function enforceSinUpkeep(){
  if(SIN_RESOLVING) return;
  const dead = sinNeedsField();
  if(!dead.length) return;
  SIN_RESOLVING = true;
  try{
    dead.slice().reverse().forEach(x=>{
      const loc = locateCard(x.card);
      if(!loc) return;
      commitAutomaticActionV44({type:"FX_TO_GRAVE", player:loc.p, zone:loc.zone,
        index:loc.index, reason:"フィールド魔法が存在しないため破壊"});
    });
    showToast("フィールド魔法が無いため「Sin」モンスターが破壊されました");
    render();
  } finally { SIN_RESOLVING = false; }
}
const REDO = [];
function undo(){
  if(gameState&&gameState.__v44ReplayPreview){showToast("Replay再生中はRunnerの『1手戻す』を使ってください");return;}
  if(!HISTORY.length) return;
  REDO.push(JSON.stringify(gameState));
  if(REDO.length>HISTORY_MAX) REDO.shift();
  gameState = JSON.parse(HISTORY.pop());
  if(typeof v41EnsureReplayState==='function') v41EnsureReplayState(gameState);
  if(typeof v41SyncJournalToState==='function') v41SyncJournalToState(gameState);
  // チップは厳密復元が難しいので直近1つを削るだけ（実用上これで十分）
  turnActions.pop();
  /* v4.9 P1: 選択待ちへ戻った／選択待ちから抜けた場合にシートを追従させる */
  if(typeof reconcileChoiceAfterLoadV49==='function') reconcileChoiceAfterLoadV49(gameState);
  render();
  if(typeof refreshChoiceSheetV49==='function') refreshChoiceSheetV49();
  else if(!gameState.pendingChoice && typeof closeSheet==='function') closeSheet();
  if(typeof reopenSummonWindowAfterLoadS03==='function') reopenSummonWindowAfterLoadS03();  /* S03-U15 */
}
/* action を短い日本語チップに変換（このターンにやったこと用） */
function chipFor(a){
  if(CHIP_SKIP.has(a.type)) return null;
  const P = gameState.players[a.player ?? gameState.activePlayer];
  const nm = (c)=> c ? cardName(c) : "カード";
  switch(a.type){
    case "DRAW": return `ドロー${(a.n??1)>1?`×${a.n}`:""}`;
    case "LP":   return `LP${a.delta>0?"+":""}${a.delta}`;
    case "MOVE": {
      const to = a.to;
      const label = {mz:"召喚/特殊",sz:"魔法罠",field:"フィールド",grave:"墓地",banish:"除外",hand:"手札戻し",deck:"デッキ戻し",ex:"EX"}[to]||to;
      const faceTag = a.face==='down' ? "セット" : label;
      return faceTag;
    }
    case "FLIP": return "反転";
    case "TOGGLE_POS": return "表示形式変更";
    case "ATTACK": return a.target==='direct' ? "直接攻撃" : "攻撃宣言";
    case "CHAIN_ADD": return `${a.name}発動`;
    case "CHAIN_RESOLVE_TOP": return "チェーン解決";
    default: return null;
  }
}

/* =========================================================================
   エンドフェイズの自動処理
   ライトロードのデッキ削りは強制効果なので、確認を挟まず自動で処理する。
   スクリプトに endPhaseMill を宣言したカードが対象。
   ========================================================================= */
function resolveEndPhaseMills(){
  const p = gameState.activePlayer;
  const P = gameState.players[p];
  const jobs = [];
  const scan = (arr, zone)=>{
    (arr||[]).forEach((c,i)=>{
      if(!c || c.face !== 'up') return;
      if(effectNegated(c)) return;              // スキルドレイン等で無効なら削らない
      const sc = CARD_SCRIPTS[dbOf(c).n];
      if(!sc || !sc.endPhaseMill) return;
      jobs.push({name:dbOf(c).n, n:sc.endPhaseMill, uid:(c.uid!=null?c.uid:null)});
    });
  };
  scan(P.mz, 'mz');
  scan(P.sz, 'sz');
  if(P.field) scan([P.field], 'field');
  if(!jobs.length) return false;
  jobs.forEach(j=>{
    const a = {type:"FX_MILL_TOP", player:p, n:j.n, reason:`${j.name}（エンドフェイズ）`};
    /* S03-U190: a 「ライトロード」 card's End Phase mill is that card's effect (engine/1ZZE) */
    if(typeof lswNamedS03==='function' && lswNamedS03(j.name)) a.lswSrcS03 = {name:j.name, uid:j.uid};
    act(a);
  });
  const total = jobs.reduce((a,b)=>a+b.n, 0);
  showToast(`ライトロード：デッキから${total}枚を墓地へ`);
  return true;
}

/* 一時的にコントロールが移ったモンスターが残っているか */
function hasControlToReturn(){
  return gameState.players.some(P=>(P.mz||[]).some(c=>c && c.controlReturnTo != null));
}

/* 「破壊され墓地へ送られたターンのエンドフェイズ」に該当するか */
function destroyedThisTurn(card){
  const g = card && card.graveInfo;
  return !!(g && g.byDestroy && g.turn === gameState.turn);
}

/* 攻撃しなければならないモンスターが攻撃していないか調べる */
function pendingMustAttack(){
  const p = gameState.activePlayer;
  return (gameState.players[p].mz||[]).filter(c=>
    c && c.face==='up' && c.pos==='atk' && canDeclareAttackV48(c) &&
    mustAttackNow(c) && !c.cannotAttack);
}

function duelFlowBusyReasonV30(kind){
  if(!gameState) return 'デュエルが開始されていません';
  if(gameState.loser!=null) return 'デュエルは終了しています';
  if(gameState.systemFault) return `システムエラー：${gameState.systemFault}`;
  if(gameState.chain.length) return 'チェーン処理中です';
  if(gameState.pendingSummon) return '召喚無効タイミングの処理中です';
  if(gameState.pendingAttack) return '攻撃宣言の処理中です';
  if(gameState.battle) return 'ダメージステップの処理中です';
  if(gameState.pendingChoice) return '効果解決中の選択待ちです';   /* v4.9 P1 */
  if(gameState.processorPaused) return '効果・優先権の選択待ちです';
  return '';
}
function ensurePublicDuelFlowV30(kind){
  if(PLAY_MODE!==PLAY_MODES.DUEL) return true;
  const why=duelFlowBusyReasonV30(kind);
  if(!why) return true;
  showToast(why); return false;
}

function doPhase(id){
  /* バトルフェイズを抜けるとき、攻撃可能なら攻撃しなければならない
     モンスター（カラクリなど）が残っていれば確認する。 */
  const leavingBattle = gameState.phase === 'battle' && id !== 'battle';
  if(leavingBattle){
    const must = pendingMustAttack();
    if(must.length){
      const names = must.map(c=>labelOf(c)).join('、');
      if(!confirm(`${names} は攻撃可能な場合には攻撃しなければなりません。\nこのままバトルフェイズを終えますか？`)) return;
    }
  }
  if(PLAY_MODE===PLAY_MODES.DUEL){ if(!ensurePublicDuelFlowV30('phase')) return; requestProcessorV27(PROCESSOR_V27.PHASE,{to:id}); return; }
  act({type:"SET_PHASE", phase:id});
}
function doPhaseNext(){
  if(PLAY_MODE===PLAY_MODES.DUEL){ if(!ensurePublicDuelFlowV30('phase')) return; requestProcessorV27(PROCESSOR_V27.PHASE,{to:nextPhaseIdV27()}); return; }
  const i = PHASES.findIndex(x=>x.id===gameState.phase);
  if(i < PHASES.length-1){
    act({type:"SET_PHASE", phase:PHASES[i+1].id});
    const ph = gameState.phase;
    if(ph === "end"){
      resolveEndPhaseMills();
      if(hasControlToReturn()) act({type:"CONTROL_RETURN"});
    }
    emitEvent("onPhaseChange", {phase:ph}) ||
      (ph==="standby" && emitEvent("onStandbyPhase", {phase:ph})) ||
      (ph==="end" && emitEvent("onEndPhase", {phase:ph}));
  }
}
function doPhasePrev(){
  const i = PHASES.findIndex(x=>x.id===gameState.phase);
  if(i > 0) act({type:"SET_PHASE", phase:PHASES[i-1].id});
}
function doPass(){
  if(PLAY_MODE===PLAY_MODES.DUEL){ if(!ensurePublicDuelFlowV30('turn')) return; requestProcessorV27(PROCESSOR_V27.TURN,{}); return; }
  emitEvent("onTurnEnd", {turn:gameState.turn});
  act({type:"PASS_TURN"});
  emitEvent("onTurnStart", {turn:gameState.turn});
}
function doDraw(){
  if(PLAY_MODE===PLAY_MODES.DUEL){ if(!ensurePublicDuelFlowV30('draw')) return; requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer,n:1,normal:true}); return; }
  act({type:"DRAW", n:1});
}
function doShuffle(){ act({type:"SHUFFLE"}); }
function doLP(d){ act({type:"LP", player:gameState.activePlayer, delta:d}); }
function lpAdj(p,d){ act({type:"LP", player:p, delta:d}); }

/* ================= ライフ計算機 =================
   LP値をタップして開く。数値入力＋よく使う値、半分/倍（1103は「LPを半分払って」が多い）。 */
let LP_TARGET = 0;
let LP_INPUT  = "";
function openLP(p){
  LP_TARGET = p; LP_INPUT = "";
  renderLP();
}
function renderLP(){
  const p = LP_TARGET;
  const P = gameState.players[p];
  const cur = P.lp;
  const val = parseInt(LP_INPUT||"0",10);
  const after刻 = (d)=> Math.max(0, cur + d);
  const keys = ["7","8","9","4","5","6","1","2","3","00","0","←"];
  const keyHTML = keys.map(k=>
    `<button class="lp-key" onclick="lpKey('${k}')">${k}</button>`
  ).join("");
  const quick = [100,200,300,500,800,1000,1500,2000,2500,3000]
    .map(n=>`<button class="lp-quick" onclick="lpSet(${n})">${n}</button>`).join("");

  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:4px">${nameOf(p)} のライフ</h3>
    <div class="lp-now">現在 <b>${cur}</b>${LP_INPUT?` → <span class="lp-prev">${after刻(-val)}</span> / <span class="lp-prev up">${after刻(val)}</span>`:""}</div>

    <div class="lp-display">${LP_INPUT||"0"}</div>

    <div class="lp-quickrow">${quick}</div>

    <div class="lp-pad">${keyHTML}</div>

    <div class="lp-ops">
      <button class="lp-op dmg" onclick="lpApply(-1)">− ダメージ</button>
      <button class="lp-op heal" onclick="lpApply(1)">＋ 回復</button>
    </div>
    <div class="act-label">よく使う</div>
    <div class="act-grid">
      <div class="act" onclick="lpHalf()">LPを半分にする</div>
      <div class="act" onclick="lpSetExact()">この値ちょうどにする</div>
    </div>
    <button class="close" onclick="closeSheet()">閉じる</button>`;
  veil.classList.add("on");
}
function lpKey(k){
  if(k==="←"){ LP_INPUT = LP_INPUT.slice(0,-1); }
  else if(LP_INPUT.length < 5){ LP_INPUT = (LP_INPUT==="0"?"":LP_INPUT) + k; }
  renderLP();
}
function lpSet(n){ LP_INPUT = String(n); renderLP(); }
function lpApply(sign){
  const v = parseInt(LP_INPUT||"0",10);
  if(!v){ showToast("数値を入力してください"); return; }
  act({type:"LP", player:LP_TARGET, delta: sign*v});
  LP_INPUT = "";
  closeSheet();
}
function lpHalf(){
  const P = gameState.players[LP_TARGET];
  const half = Math.floor(P.lp/2);      // 端数切り捨て（払う側）
  act({type:"LP", player:LP_TARGET, delta: -(P.lp-half)});
  closeSheet();
}
function lpSetExact(){
  const v = parseInt(LP_INPUT||"",10);
  if(isNaN(v)){ showToast("数値を入力してください"); return; }
  const P = gameState.players[LP_TARGET];
  act({type:"LP", player:LP_TARGET, delta: v - P.lp});
  LP_INPUT = "";
  closeSheet();
}

/* 手札へ視線誘導（軽いフラッシュ） */
function focusHandHint(){
  const el = document.getElementById("hand");
  if(!el) return;
  el.scrollIntoView({behavior:"smooth", block:"nearest"});
  el.animate?.([{boxShadow:"inset 0 0 0 2px var(--gold-hi)"},{boxShadow:"inset 0 0 0 0 transparent"}],{duration:700});
}

/* ログ折りたたみ */
let LOG_OPEN = false;
function toggleLog(){
  LOG_OPEN = !LOG_OPEN;
  document.getElementById("log").hidden = !LOG_OPEN;
  document.getElementById("logToggle").textContent = LOG_OPEN ? "ログを閉じる ▴" : "ログを開く ▾";
}

/* 先攻を指定してターン1のドローフェイズからやり直す */
function setFirstPlayer(p){
  turnActions = [];
  act({type:"SET_FIRST_PLAYER",player:p===1?1:0});
  closeSheet();
  showToast(`${nameOf(p===1?1:0)}の先攻で開始`);
}
/* コイントスで先攻を決める。乱数消費もAction内に閉じてReplay可能にする。 */
function coinToss(){
  turnActions = [];
  act({type:"COIN_TOSS"});
  closeSheet();
  showToast(`コイントス → ${nameOf(gameState.firstPlayer)}の先攻`);
}

/* =========================================================================
   状態インスペクタ
   ルール処理はプレイヤーが判断するので、アプリが保持している状態を
   いつでも確認・手動修正できるようにする。
   ========================================================================= */
function openState(){
  const gs = gameState;
  const p  = gs.activePlayer;
  const P  = gs.players[p], O = gs.players[p===0?1:0];
  const cell=(k,v,off)=>`<div class="state-cell"><span class="k">${k}</span><span class="v ${off?'off':''}">${v}</span></div>`;
  const atkDone = P.mz.filter(c=>c.attacked).length;
  const pend = gs.pending.length
    ? gs.pending.map((x,i)=>`<div class="act" onclick="act({type:'PENDING_RESOLVE',index:${i}});openState()">${x.name}（${nameOf(x.player)}）を処理</div>`).join("")
    : `<div class="meta">なし</div>`;
  const resv = gs.reserved.length
    ? gs.reserved.map((x,i)=>`<div class="act" onclick="act({type:'RESERVE_REMOVE',index:${i}});openState()">${x.name}（T${x.turn}${x.at==='endPhase'?'エンド':''}）を解除</div>`).join("")
    : `<div class="meta">なし</div>`;
  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:8px">状態</h3>
    <div class="state-grid">
      ${cell("ターン", `T${gs.turn}`)}
      ${cell("フェーズ", phaseJp(gs.phase))}
      ${cell("手番", nameOf(gs.activePlayer))}
      ${cell("優先権", nameOf(gs.priority??gs.activePlayer))}
      ${cell("通常召喚権", P.normalSummonUsed?"使用済":"未使用", P.normalSummonUsed)}
      ${cell("ドロー", gs.drawnThisTurn?"済":"未", gs.drawnThisTurn)}
      ${cell("攻撃済み", `${atkDone} / ${P.mz.length}体`)}
      ${cell("チェーン", `${gs.chain.length}`)}
      ${cell("特殊召喚(今T)", `${P.ssHistory.length}回`, !P.ssHistory.length)}
      ${cell("墓地送り(今T)", `${P.graveHistory.length}枚`, !P.graveHistory.length)}
    </div>
    <div class="act-label">手動で切り替え</div>
    <div class="act-grid">
      <div class="act" onclick="act({type:'SET_PRIORITY',to:${gs.priority===0?1:0}});openState()">優先権を渡す</div>
      <div class="act" onclick="toggleNormalRight()">召喚権を${P.normalSummonUsed?'戻す':'使用済にする'}</div>
      <div class="act" onclick="clearAttacked()">攻撃済みをリセット</div>
      <div class="act" onclick="addPending()">発動待ちを登録</div>
    </div>
    <div class="act-label">発動待ち効果</div>
    <div class="act-grid wide">${pend}</div>
    <div class="act-label">予約効果</div>
    <div class="act-grid wide">${resv}</div>
    <div class="act-label">このターンの履歴</div>
    <div class="meta">
      特殊召喚：${P.ssHistory.map(h=>h.name).join("、")||"なし"}<br>
      墓地送り：${P.graveHistory.map(h=>h.name).join("、")||"なし"}
    </div>
    <button class="close" onclick="closeSheet()">閉じる</button>`;
  veil.classList.add("on");
}
function toggleNormalRight(){
  const p = gameState.activePlayer;
  act({type:"MANUAL_TOGGLE_NORMAL_RIGHT_V43",player:p});
  openState();
}
function clearAttacked(){
  const p = gameState.activePlayer;
  act({type:"MANUAL_CLEAR_ATTACKED_V43",player:p});
  openState();
}
function addPending(){
  const nm = prompt("発動待ちの効果名を入力","");
  if(!nm) return;
  act({type:"PENDING_ADD", player:gameState.activePlayer, name:nm});
  openState();
}

/* =========================================================================
   汎用プリミティブ・パレット
   カード固有処理を持たないカードも、ここから手動で効果を組み立てられる。
   「対象を選ぶ → 処理を選ぶ」の2タップで完了する。
   ========================================================================= */
function openPrimitives(srcP, srcZone, srcIdx, srcName){
  const label = srcName ? `${srcName} の効果` : "効果処理";
  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:4px">${label}</h3>
    <div class="meta" style="margin-bottom:10px">処理を選ぶと対象を指定できます。裁定はプレイヤーが判断してください。</div>
    <div class="act-label">場のカードに</div>
    <div class="act-grid">
      <div class="act" onclick="primPick('destroy')">破壊</div>
      <div class="act" onclick="primPick('tograve')">墓地へ送る</div>
      <div class="act" onclick="primPick('banish')">除外</div>
      <div class="act" onclick="primPick('bounce')">手札に戻す</div>
      <div class="act" onclick="primPick('todeck')">デッキに戻す</div>
      <div class="act" onclick="primPick('position')">表示形式変更</div>
      <div class="act" onclick="primPick('flip')">反転</div>
      <div class="act" onclick="primPick('negate')">効果を無効化</div>
      <div class="act" onclick="primPick('overlay')">素材として重ねる</div>
    </div>
    <div class="act-label">デッキ・墓地から</div>
    <div class="act-grid">
      <div class="act" onclick="primPick('search')">サーチ</div>
      <div class="act" onclick="primPick('mill')">デッキから墓地へ</div>
      <div class="act" onclick="closeSheet();openDeckTop(${srcP},1)">トップをめくる</div>
      <div class="act" onclick="primPick('revive')">墓地から特殊召喚</div>
      <div class="act" onclick="primPick('graveBanish')">墓地から除外</div>
    </div>
    <div class="act-label">その他</div>
    <div class="act-grid">
      <div class="act" onclick="closeSheet();act({type:'DRAW',player:${srcP},n:1})">1枚ドロー</div>
      <div class="act" onclick="primPick('discard')">手札を捨てる</div>
      <div class="act" onclick="closeSheet();openLP(${srcP})">LPを増減</div>
      <div class="act" onclick="closeSheet();act({type:'SHUFFLE',player:${srcP}})">シャッフル</div>
    </div>
    ${srcZone ? `<div class="act-label">このカード自身（コスト処理）</div>
    <div class="act-grid">
      <div class="act" onclick="primSelf('banish')">自身を除外</div>
      <div class="act" onclick="primSelf('grave')">自身を墓地へ</div>
    </div>` : ""}
    <button class="close" onclick="closeSheet()">閉じる</button>`;
  PRIM_SRC = {p:srcP, zone:srcZone, index:srcIdx, name:srcName};
  veil.classList.add("on");
}
let PRIM_SRC = null;
/* 発動元カード自身を処理する（墓地から除外する等のコスト） */
function primSelf(op){
  const src = PRIM_SRC;
  if(!src || !src.zone){ showToast("対象が特定できません"); return; }
  closeSheet();
  const t = {p:src.p, zone:src.zone, index:src.index, card:{}};
  if(op==='banish') act({type:"FX_BANISH", player:src.p, zone:src.zone, index:src.index, reason:src.name||"コスト"});
  else              act({type:"FX_TO_GRAVE", player:src.p, zone:src.zone, index:src.index, reason:src.name||"コスト"});
}

/* 処理を選んだあと、対象を選ばせて実行する */
function primPick(op){
  const src = PRIM_SRC || {p:gameState.activePlayer};
  const p = src.p;
  const fieldTargets = ()=>{
    const out=[];
    [0,1].forEach(pl=>{
      const P=gameState.players[pl];
      P.mz.forEach((c,i)=>out.push({pl,zone:'mz',i,c}));
      P.sz.forEach((c,i)=>out.push({pl,zone:'sz',i,c}));
      if(P.field) out.push({pl,zone:'field',i:0,c:P.field});
    });
    return out;
  };
  const listOf = (arr, pl, zone)=>arr.map((c,i)=>({
    label: labelOf(c), sub: `${nameOf(pl)}の${zoneJp(zone)}`, pl, zone, i, c
  }));

  const runOnField = (title, fn)=>{
    const t = fieldTargets();
    openPick(title, "場のカードから選ぶ", t.map(x=>({
      label: x.c.face==='down' ? "裏側のカード" : labelOf(x.c),
      sub: `${nameOf(x.pl)}・${zoneJp(x.zone)}`,
      onPick: ()=>fn(x)
    })));
  };

  switch(op){
    case 'destroy':
      runOnField("破壊するカード", x=>{
        act({type:"FX_TO_GRAVE", player:x.pl, zone:x.zone, index:x.i, reason:(src.name||"効果")+"で破壊"});
        afterSentToGrave("破壊");
      });
      break;
    case 'banish':
      runOnField("除外するカード", x=>act({type:"FX_BANISH", player:x.pl, zone:x.zone, index:x.i, reason:src.name||"効果"}));
      break;
    case 'bounce':
      runOnField("手札に戻すカード", x=>act({type:"FX_BOUNCE", player:x.pl, zone:x.zone, index:x.i, reason:src.name||"効果"}));
      break;
    case 'todeck':
      runOnField("デッキに戻すカード", x=>act({type:"FX_RETURN_DECK", player:x.pl, zone:x.zone, index:x.i, reason:src.name||"効果"}));
      break;
    case 'negate':
      runOnField("無効化するカード", x=>act({type:"FX_NEGATE", player:x.pl, zone:x.zone, index:x.i, reason:src.name||"効果"}));
      break;
    case 'position':
      runOnField("表示形式を変えるカード", x=>{
        const cur = x.c.pos==='atk'?'def':'atk';
        act({type:"FX_SET_STATE", player:x.pl, zone:x.zone, index:x.i, pos:cur, reason:src.name||"効果"});
      });
      break;
    case 'flip':
      runOnField("反転するカード", x=>act({type:"FX_SET_STATE", player:x.pl, zone:x.zone, index:x.i,
        face: x.c.face==='up'?'down':'up', reason:src.name||"効果"}));
      break;
    case 'overlay': {
      const P = gameState.players[p];
      const xyzMons = P.mz.map((c,i)=>({c,i})).filter(x=>x.c.xyz);
      if(!xyzMons.length){ showToast("素材を持てるモンスターがいません"); return; }
      openPick("素材を重ねる先", "", xyzMons.map(x=>({
        label: labelOf(x.c), sub:`素材${x.c.xyz.length}`,
        onPick: ()=>{
          const others = P.mz.map((c,i)=>({c,i})).filter(y=>y.i!==x.i);
          openPick("素材にするモンスター", "", others.map(y=>({
            label: labelOf(y.c), sub: subOf(y.c),
            onPick: ()=>act({type:"FX_OVERLAY", player:p, targetMz:x.i, from:"mz", fromIndex:y.i})
          })));
        }
      })));
      break;
    }
    case 'search': {
      const P = gameState.players[p];
      openPick("デッキから手札に加える", `デッキ${P.deck.length}枚`,
        P.deck.map((c,i)=>({label:labelOf(c), sub:subOf(c),
          onPick: ()=>act({type:"FX_SEARCH", player:p, deckIndex:i, reason:src.name||"効果"})})));
      break;
    }
    case 'mill': {
      const P = gameState.players[p];
      openPick("デッキから墓地へ送る", `デッキ${P.deck.length}枚`,
        P.deck.map((c,i)=>({label:labelOf(c), sub:subOf(c),
          onPick: ()=>act({type:"FX_MILL", player:p, deckIndex:i, reason:src.name||"効果"})})));
      break;
    }
    case 'revive': {
      const P = gameState.players[p];
      const mons = P.grave.map((c,i)=>({c,i})).filter(x=>dbOf(x.c).k==='m');
      openPick("墓地から特殊召喚", "", mons.map(x=>({label:labelOf(x.c), sub:subOf(x.c),
        onPick: ()=>act({type:"FX_SPECIAL_SUMMON", player:p, from:"grave", fromIndex:x.i, pos:"atk", reason:src.name||"効果"})})));
      break;
    }
    case 'tograve': {
      const t = fieldTargets();
      openPick("墓地へ送るカード", "場のカードから選ぶ", t.map(x=>({
        label: x.c.face==='down' ? "裏側のカード" : labelOf(x.c),
        sub: `${nameOf(x.pl)}・${zoneJp(x.zone)}`,
        onPick: ()=>{
          act({type:"FX_TO_GRAVE", player:x.pl, zone:x.zone, index:x.i, reason:src.name||"効果"});
          afterSentToGrave("");
        }
      })));
      break;
    }
    case 'graveBanish': {
      const P = gameState.players[p];
      openPick("墓地から除外", "", P.grave.map((c,i)=>({label:labelOf(c), sub:subOf(c),
        onPick: ()=>act({type:"FX_BANISH", player:p, zone:"grave", index:i, reason:src.name||"効果"})})));
      break;
    }
    case 'discard': {
      const P = gameState.players[p];
      openPick("捨てる手札", "", P.hand.map((c,i)=>({label:labelOf(c), sub:subOf(c),
        onPick: ()=>act({type:"FX_DISCARD", player:p, handIndex:i, reason:src.name||"コスト"})})));
      break;
    }
  }
}

/* =========================================================================
   Step13: カードスクリプト デバッガー
   直近のスクリプト実行の各段階（条件→対象→解決→後処理）を追える。
   ========================================================================= */
function openScriptDebug(){
  const logs = gameState.scriptLog || [];
  const body = logs.length
    ? logs.map(l=>`
        <div class="dbg-entry">
          <div class="dbg-name">【${l.name}】</div>
          ${l.steps.map(st=>`<div class="dbg-step ${st.ok?'':'ng'}">${st.ok?'✓':'✗'} ${st.msg}</div>`).join("")}
        </div>`).join("")
    : `<div class="meta">まだスクリプトが実行されていません。<br>
        効果を発動すると、条件判定・対象選択・解決の流れがここに記録されます。</div>`;
  const impl = Object.keys(CARD_SCRIPTS).length;
  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:4px">スクリプト デバッガー</h3>
    <div class="meta" style="margin-bottom:10px">実装済みスクリプト：<b style="color:var(--gold-hi)">${impl}枚</b></div>
    <div class="dbg-list">${body}</div>
    <div class="act-grid">
      <div class="act" onclick="openScriptList()">実装済み一覧</div>
      <div class="act" onclick="clearScriptLog()">記録を消去</div>
    </div>
    <button class="close" onclick="closeSheet()">閉じる</button>`;
  veil.classList.add("on");
}
function clearScriptLog(){ gameState.scriptLog = []; openScriptDebug(); }
function openScriptList(){
  const names = Object.keys(CARD_SCRIPTS).sort();
  const rows = names.map(n=>{
    const sc = CARD_SCRIPTS[n];
    const ev = sc.passive ? Object.keys(sc.passive).map(e=>eventJp(e)).join("・") : "";
    const tags=[];
    if(sc.countLimit) tags.push(countLimitJp(sc));
    if(sc.cost) tags.push('コスト');
    if(sc.forced) tags.push('強制');
    if(sc.activateFrom) tags.push(sc.activateFrom.map(z=>zoneJp(z)).join('/')+'から');
    return `<div class="act pick-row">
      <span class="pk-nm">${n}</span>
      <span class="pk-sub">${sc.type||''}${ev?' / '+ev:''}${tags.length?' ['+tags.join('・')+']':''}</span>
    </div>`;
  }).join("");
  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:4px">実装済みスクリプト（${names.length}）</h3>
    <div class="meta" style="margin-bottom:10px">これらは共通APIのみで記述されています。</div>
    <div class="pick-list">${rows}</div>
    <button class="close" onclick="openScriptDebug()">戻る</button>`;
  veil.classList.add("on");
}

/* =========================================================================
   カウンター / トークン のUI
   ========================================================================= */
const COUNTER_KINDS = ["魔力","デュアル","ボム","呪縛","氷結","風","聖","カウンター"];
function openCounterMenu(p, zone, idx){
  const P = gameState.players[p];
  const c = zoneCard(P, zone, idx);
  const cur = c && c.counters ? c.counters : {};
  const rows = COUNTER_KINDS.map(k=>{
    const n = cur[k]||0;
    return `<div class="ct-row">
      <span class="ct-name">${k}<b>${n}</b></span>
      <button class="ct-btn" onclick="act({type:'COUNTER_REMOVE',player:${p},zone:'${zone}',index:${idx},kind:${jsStr(k)},n:1});openCounterMenu(${p},'${zone}',${idx})">−</button>
      <button class="ct-btn add" onclick="act({type:'COUNTER_ADD',player:${p},zone:'${zone}',index:${idx},kind:${jsStr(k)},n:1});openCounterMenu(${p},'${zone}',${idx})">＋</button>
    </div>`;
  }).join("");
  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:4px">${c?cardName(c):"カード"} のカウンター</h3>
    <div class="meta" style="margin-bottom:10px">乗せる／取り除くカウンターを選んでください。</div>
    <div class="ct-list">${rows}</div>
    <div class="act-grid">
      <div class="act warn" onclick="act({type:'COUNTER_CLEAR',player:${p},zone:'${zone}',index:${idx}});closeSheet()">全て取り除く</div>
    </div>
    <button class="close" onclick="closeSheet()">閉じる</button>`;
  veil.classList.add("on");
}

/* ---- トークン生成 ---- */
const TOKEN_PRESETS = [
  {name:"羊トークン",       atk:0,    def:0,    lv:1, ra:"獣",   at:"地", note:"スケープ・ゴート"},
  {name:"ゴーズトークン",   atk:0,    def:0,    lv:1, ra:"悪魔", at:"闇", note:"受けたダメージ分の攻守"},
  {name:"闇トークン",       atk:1000, def:1000, lv:3, ra:"悪魔", at:"闇", note:"終焉の焔など"},
  {name:"おジャマトークン", atk:0,    def:1000, lv:2, ra:"獣族", at:"光", note:"おジャマトリオ"},
  {name:"植物トークン",     atk:800,  def:800,  lv:2, ra:"植物", at:"地", note:"スポーアなど"},
];
function openTokenMenu(){
  const p = gameState.activePlayer;
  const rows = TOKEN_PRESETS.map((t,i)=>
    `<div class="act pick-row" onclick="createToken(${i})">
       <span class="pk-nm">${t.name}</span>
       <span class="pk-sub">攻${t.atk}/守${t.def} Lv${t.lv} ${t.note}</span>
     </div>`).join("");
  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:4px">トークンを出す</h3>
    <div class="meta" style="margin-bottom:10px">${nameOf(p)} のモンスターゾーンに特殊召喚します。</div>
    <div class="pick-list">${rows}</div>
    <div class="act-grid">
      <div class="act" onclick="createTokenCustom()">自由に設定して出す…</div>
      <div class="act" onclick="createToken(0,4)">羊トークン ×4</div>
    </div>
    <button class="close" onclick="closeSheet()">閉じる</button>`;
  veil.classList.add("on");
}
function createToken(i, n){
  const t = TOKEN_PRESETS[i]; if(!t) return;
  const p = gameState.activePlayer;
  closeSheet();
  act({type:"TOKEN_CREATE", player:p, name:t.name, atk:t.atk, def:t.def, lv:t.lv, ra:t.ra, at:t.at, pos:'def', n:n||1});
}
function createTokenCustom(){
  const p = gameState.activePlayer;
  const name = prompt("トークン名","トークン"); if(name===null) return;
  const atk = parseInt(prompt("攻撃力","0")||"0",10);
  const def = parseInt(prompt("守備力","0")||"0",10);
  const lv  = parseInt(prompt("レベル","1")||"1",10);
  closeSheet();
  act({type:"TOKEN_CREATE", player:p, name:name||"トークン", atk, def, lv, pos:'atk', n:1});
}


/* =========================================================================
   デッキトップをめくる
   「デッキの上からN枚めくり、その中から選ぶ」系の処理に使う。
   選んだ後、残りをデッキに戻す（順番はトップ/ボトムを選べる）。
   ========================================================================= */
function openDeckTop(p, n, opts){
  const P = gameState.players[p];
  const want = Math.max(1, n||1);
  const count = Math.min(want, P.deck.length);
  if(!count){ showToast("デッキにカードがありません"); return; }
  const o = opts||{};
  DECKTOP_OPTS = {p, mode:o.mode||'hand', reason:o.reason||''};
  const top = P.deck.slice(0, count);
  const rows = top.map((c,i)=>{
    const db = dbOf(c);
    return `<div class="act pick-row" onclick="deckTopPick(${p},${count},${i},${jsStr(o.mode||'hand')},${jsStr(o.reason||'')})">
      <span class="pk-idx">${i+1}</span>
      <span class="pk-nm">${db.n||'カード'}</span>
      <span class="pk-sub">${subOf(c)}</span>
    </div>`;
  }).join("");

  // 枚数をその場で変えられるようにする（1枚から）
  const maxN = Math.min(10, P.deck.length);
  let btns = '';
  for(let k=1;k<=maxN;k++){
    btns += `<button class="dt-n ${k===count?'on':''}" onclick="openDeckTop(${p},${k},${jsVal(o)})">${k}</button>`;
  }

  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:4px">デッキトップ ${count}枚</h3>
    <div class="meta" style="margin-bottom:8px">
      ${o.note || `上から${count}枚をめくりました。1枚タップで${modeJp(o.mode||'hand')}。`}</div>
    <div class="dt-ctl">
      <span class="odds-note">めくる枚数</span>
      <div class="dt-nums">${btns}</div>
    </div>
    <div class="pick-list">${rows}</div>
    <div class="act-label">選んだカードの行き先</div>
    <div class="act-grid">
      <div class="act ${(o.mode||'hand')==='hand'?'fx':''}" onclick="openDeckTop(${p},${count},{mode:'hand'})">手札に加える</div>
      <div class="act ${o.mode==='grave'?'fx':''}" onclick="openDeckTop(${p},${count},{mode:'grave'})">墓地へ送る</div>
      <div class="act ${o.mode==='summon'?'fx':''}" onclick="openDeckTop(${p},${count},{mode:'summon'})">特殊召喚</div>
      <div class="act ${o.mode==='bottom'?'fx':''}" onclick="openDeckTop(${p},${count},{mode:'bottom'})">デッキ下へ</div>
    </div>
    <div class="act-label">選ばずに</div>
    <div class="act-grid">
      <div class="act" onclick="closeSheet()">見ただけで戻す</div>
      <div class="act" onclick="deckTopShuffle(${p},${count})">戻してシャッフル</div>
      <div class="act" onclick="deckTopAll(${p},${count},'grave')">全部墓地へ</div>
      <div class="act" onclick="deckTopAll(${p},${count},'bottom')">全部デッキ下へ</div>
    </div>
    <button class="close" onclick="closeSheet()">閉じる</button>`;
  veil.classList.add("on");
}
let DECKTOP_OPTS = null;
function modeJp(m){
  return ({hand:"手札に加える", grave:"墓地へ送る", summon:"特殊召喚", bottom:"デッキ下へ"})[m] || "手札に加える";
}
/* めくった中から複数枚まとめて処理する */
function deckTopAll(p, count, mode){
  closeSheet();
  const rs = "デッキトップ";
  // 後ろから処理して添字ズレを防ぐ
  for(let i=count-1;i>=0;i--){
    if(mode==='grave')  act({type:"FX_MILL", player:p, deckIndex:i, reason:rs});
    else                act({type:"FX_RETURN_DECK", player:p, zone:"deck", index:i, toBottom:true, reason:rs});
  }
}
/* めくった中から1枚を選ぶ。mode: 'hand'=手札に加える / 'grave'=墓地へ / 'summon'=特殊召喚 */
function deckTopPick(p, count, idx, mode, reason){
  closeSheet();
  const rs = reason || "デッキトップ";
  if(mode==='bottom')      act({type:"FX_RETURN_DECK", player:p, zone:"deck", index:idx, toBottom:true, reason:rs});
  else if(mode==='grave')  act({type:"FX_MILL",   player:p, deckIndex:idx, reason:rs});
  else if(mode==='summon') act({type:"FX_SPECIAL_SUMMON", player:p, from:"deck", fromIndex:idx, pos:"atk", reason:rs});
  else                     act({type:"FX_SEARCH", player:p, deckIndex:idx, reason:rs});
  // 残りはデッキに戻る扱い（FX_SEARCH/FX_MILL が内部でシャッフルする）
  logIt(gameState, `残りのカードをデッキに戻した`);
  render();
}
function deckTopShuffle(p, count){
  closeSheet();
  act({type:"SHUFFLE", player:p});
}


/* めくったカードを「表側で」見せて選ばせる。
   強欲で謙虚な壺のように公開して選ぶ効果で使う。 */
function revealPick(title, note, cards, onPick, onCancel){
  if(!cards.length){ showToast("対象がありません"); if(onCancel) onCancel(); return; }
  REVEAL_ITEMS = cards; REVEAL_CB = onPick; REVEAL_CANCEL = onCancel||null;
  const cells = cards.map((it,i)=>{
    const db = dbOf(it.card);
    return `<button class="rv-card" onclick="__revealPick(${i})">
      <img src="${IMG_BASE}${db.c}.webp" onerror="this.style.display='none'">
      <span class="rv-nm">${db.n||'カード'}</span>
    </button>`;
  }).join("");
  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:4px">${title}</h3>
    ${note?`<div class="meta" style="margin-bottom:10px">${note}</div>`:""}
    <div class="rv-grid">${cells}</div>
    <button class="close" onclick="__revealCancel()">やめる</button>`;
  veil.classList.add("on");
}
let REVEAL_ITEMS=[], REVEAL_CB=null, REVEAL_CANCEL=null;
function __revealPick(i){
  const it=REVEAL_ITEMS[i], cb=REVEAL_CB;
  REVEAL_ITEMS=[]; REVEAL_CB=null; REVEAL_CANCEL=null;
  closeSheet();
  if(cb) cb(it);
}
function __revealCancel(){
  const cb=REVEAL_CANCEL;
  REVEAL_ITEMS=[]; REVEAL_CB=null; REVEAL_CANCEL=null;
  closeSheet(); if(cb) cb();
}


/* カードが墓地へ送られた直後に、誘発しそうなカードを提示する。
   act() の後に呼ぶ（applyAction 内からは UI を触らないため）。 */
function afterSentToGrave(reason){
  const isDestroy = /破壊/.test(String(reason||""));
  offerDetectedTriggers(isDestroy ? 'onDestroy' : 'onSendToGrave', {});
}


/* 裏側から表側にする。リバース誘発をテキストから推定して提示する。 */
function doFlipUp(p, zone, idx, pos){
  const P=gameState.players[p], c=zoneCard(P,zone,idx); if(!c) return;
  if(pos==='atk' && PLAY_MODE===PLAY_MODES.DUEL){const why=v46FaceUpSummonRestrictionReason(p,dbOf(c));if(why){showToast(why);return;}}
  const nm=cardName(c);
  // 「表側守備にする」は効果/手動処理であり、反転召喚ではない。従来処理を維持する。
  if(pos!=='atk' || PLAY_MODE!==PLAY_MODES.DUEL){
    act({type:'FX_SET_STATE',player:p,zone,index:idx,face:'up',pos,reason:pos==='atk'?'反転召喚':'表側守備に',flipSummon:pos==='atk'});   /* S03-U42 */
    const now=zoneCard(gameState.players[p],zone,idx);
    const sc=CARD_SCRIPTS[nm];
    if(sc&&sc.passive&&sc.passive.onFlip) emitEvent('onFlip',{player:p,name:nm,card:now,flipSummon:pos==='atk'});
    else offerDetectedTriggers('onFlip',{});
    return;
  }
  ensureCardUid(gameState,c);
  /* S03-U15: 続きは pendingSummon.resumeS03 から runSummonWindowResumeS03 が実行する（保存・Undo を跨げる）。 */
  PENDING_SUMMON_COMMIT=PENDING_SUMMON_CANCEL=null;
  beginSummonWindowV2({player:p,name:nm,kind:'flip',label:'反転召喚',uid:c.uid,commit:'__pendingSummonCommit',cancel:'__pendingSummonCancel',resumeS03:{uid:c.uid}});
}


/* 攻守の増減を入力する画面。よく使う値をワンタップで。 */
function openModMenu(p, zone, idx){
  const P = gameState.players[p];
  const c = zoneCard(P, zone, idx);
  if(!c) return;
  const db = dbOf(c);
  const quick = [300,400,500,600,700,800,1000,1500,2000];
  const plus  = quick.map(n=>`<button class="mod-b up" onclick="applyMod(${p},'${zone}',${idx},${n},0)">+${n}</button>`).join("");
  const minus = quick.map(n=>`<button class="mod-b dn" onclick="applyMod(${p},'${zone}',${idx},${-n},0)">-${n}</button>`).join("");
  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:4px">${db.n} の攻守</h3>
    <div class="mod-now">基本 攻${db.atk??'-'}/守${db.def??'-'}
      ${hasMod(c)?` → <b>攻${curATK(c)}/守${curDEF(c)}</b>`:""}</div>
    ${hasMod(c)?`<div class="mod-list">${c.mods.map(m=>
        `<span class="mod-chip">${m.label} ${m.atk?`攻${m.atk>0?'+':''}${m.atk}`:''}${m.def?` 守${m.def>0?'+':''}${m.def}`:''}<small>${modUntilJp(m.until)}</small></span>`
      ).join("")}</div>`:""}
    <div class="act-label">攻撃力を上げる</div>
    <div class="mod-grid">${plus}</div>
    <div class="act-label">攻撃力を下げる</div>
    <div class="mod-grid">${minus}</div>
    <div class="act-label">よく使う処理</div>
    <div class="act-grid">
      <div class="act" onclick="applyMod(${p},'${zone}',${idx},${(db.atk||0)},0,'倍化')">攻撃力を倍に</div>
      <div class="act" onclick="applyMod(${p},'${zone}',${idx},${-Math.floor((db.atk||0)/2)},0,'半減')">攻撃力を半分に</div>
      <div class="act" onclick="modSetZero(${p},'${zone}',${idx})">攻守を0にする</div>
      <div class="act" onclick="modCustom(${p},'${zone}',${idx})">自由に入力…</div>
    </div>
    ${hasMod(c)?`<div class="act-grid"><div class="act warn" onclick="closeSheet();act({type:'MOD_CLEAR',player:${p},zone:'${zone}',index:${idx}})">修正を全て解除</div></div>`:""}
    <button class="close" onclick="closeSheet()">閉じる</button>`;
  veil.classList.add("on");
}
function applyMod(p, zone, idx, atk, def, label){
  // ダメージ計算時以降は攻守を増減できない（公式ルール）
  if(!canModifyNow()){
    showToast("ダメージ計算時以降は攻守を変更できません");
    return;
  }
  act({type:"MOD_ADD", player:p, zone, index:idx, atk, def, until:'endTurn', label:label||'効果'});
  openModMenu(p, zone, idx);
}
function modSetZero(p, zone, idx){
  act({type:"MOD_SET", player:p, zone, index:idx, atk:0, def:0, until:'endTurn', label:'0にする'});
  openModMenu(p, zone, idx);
}
function modCustom(p, zone, idx){
  const a = parseInt(prompt("攻撃力の増減（例 800 / -500）","0")||"0",10);
  const d = parseInt(prompt("守備力の増減","0")||"0",10);
  if(!a && !d) return;
  act({type:"MOD_ADD", player:p, zone, index:idx, atk:a, def:d, until:'endTurn', label:'手動'});
  openModMenu(p, zone, idx);
}
