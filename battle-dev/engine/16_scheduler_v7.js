/* =========================================================================
   System v7 — Delayed / Scheduled effects primitive
   -------------------------------------------------------------------------
   「次の自分のスタンバイフェイズに」「次の相手ターンのドローフェイズを
   スキップ」「20ターン後」のような、ターンをまたぐ遅延処理を共通化する。

   既に存在するので**作り直さない**もの:
     gs.reserved / RESERVE_ADD / resolveReservedEffectsV30
        … ただし「同じターンのエンドフェイズ」限定で、kind が
          destroyUids / levelResetUids 等に固定されている。
          既存の呼び出しは一切変更せず、そのまま残す。
     onEndPhase / onStandbyPhase / onPhaseChange / onTurnStart / onTurnEnd
     MOD_ADD の until:'endTurn'|'endPhase'|'endBattlePhase'|'permanent'
     P1 ChoiceRequest の resumeToken（handler名 + JSON引数）

   今回足りないので足すもの:
     1. 任意のフェイズ・任意のターンへ予約できる汎用スケジューラ
     2. handler 名で登録する継続（closure を state に置かない）
     3. フェイズ／ターンのスキップ
     4. ラベル指定での攻守修正の解除（期限をスケジューラ側が持つため）

   ■ Replay 安全性
     - state は純JSON。function / closure / DOM / Promise / Map / Set を持たない。
     - 予約は Action 経由でのみ増減するので Journal に載り、
       Replay / Undo / Redo / SaveLoad で完全に復元される。
     - 発火ターンは予約時に**絶対ターン番号**へ解決する。相対のまま持つと
       Undo でターンが巻き戻ったときに二重発火する。
     - 予約元カードは uid で持つ。カード名・配列 index を authority にしない。
     - 発火した予約はその場で取り除くので、無制限に溜まらない。
   ========================================================================= */

/* ---- 予約できるタイミング --------------------------------------------- */
const SCHEDULE_AT_V7 = Object.freeze(
  ['drawPhase','standbyPhase','endPhase','turnStart','turnEnd','battlePhaseEnd']);
/* スキップできるフェイズ */
const SKIPPABLE_PHASE_V7 = Object.freeze(['draw','standby','main1','battle','main2']);   /* S03-U427: main1 (タイム・イーター) — the processor moves on to the Battle Phase */

/* ---- handler レジストリ（state には名前だけを置く） -------------------- */
const SCHEDULE_HANDLERS_V7 = Object.create(null);
function registerScheduleHandlerV7(name, fn){
  if(typeof name !== 'string' || typeof fn !== 'function') return false;
  SCHEDULE_HANDLERS_V7[name] = fn;
  return true;
}
function scheduleHandlerV7(name){ return SCHEDULE_HANDLERS_V7[name] || null; }

/* ---- state ------------------------------------------------------------- */
function ensureScheduleStateV7(gs){
  gs = gs || gameState;
  if(!Array.isArray(gs.scheduledV7)) gs.scheduledV7 = [];
  if(!gs.phaseSkipV7 || typeof gs.phaseSkipV7 !== 'object') gs.phaseSkipV7 = {};
  return gs;
}

/* ---- ターン計算 --------------------------------------------------------
   turns: 0 = このターン / 1 = 次のターン（相手のターン）/ 2 = 次の自分のターン
   予約時に絶対ターン番号へ直す。                                         */
function scheduleTurnAbsV7(gs, turns){
  gs = gs || gameState;
  const n = Math.max(0, Number(turns) || 0);
  return (Number(gs.turn) || 0) + n;
}
/* そのプレイヤーの次の自分のターンまで何ターンか */
function turnsUntilOwnTurnV7(gs, player){
  gs = gs || gameState;
  return (gs.activePlayer === player) ? 2 : 1;
}

/* ---- 予約の追加・取消 --------------------------------------------------- */
function scheduleEntryValidV7(e){
  if(!e || typeof e !== 'object') return false;
  if(SCHEDULE_AT_V7.indexOf(e.at) < 0) return false;
  if(typeof e.handler !== 'string' || !e.handler) return false;
  if(!Number.isFinite(Number(e.turnAbs))) return false;
  try{ JSON.parse(JSON.stringify(e)); }catch(err){ return false; }
  return true;
}
/* いま発火すべき予約（player 指定があればそのプレイヤーのターンのみ） */
function dueSchedulesV7(gs, at){
  gs = ensureScheduleStateV7(gs);
  return gs.scheduledV7.filter(e =>
    e && e.at === at && Number(e.turnAbs) <= Number(gs.turn));
}
/* 予約を実行して取り除く。Action ではなく processor から呼ぶ。 */
function runDueSchedulesV7(at, gs){
  gs = ensureScheduleStateV7(gs || gameState);
  const due = dueSchedulesV7(gs, at);
  if(!due.length) return 0;
  const ids = due.map(e => e.id);
  /* 先に取り除いてから実行する。実行中に同じ予約が再入しても二重発火しない。 */
  act({type:'SCHEDULE_REMOVE_V7', ids});
  let ran = 0;
  due.forEach(e => {
    const fn = scheduleHandlerV7(e.handler);
    if(!fn) return;
    try{ fn(Object.assign({}, e.args || {}), e); ran++; }
    catch(err){ /* スクリプトの例外で盤面を壊さない */ }
  });
  return ran;
}

/* ---- フェイズ／ターンのスキップ ---------------------------------------- */
function phaseSkipKeyV7(player, phase){ return String(player) + ':' + String(phase); }
function phaseSkippedV7(gs, player, phase){
  gs = gs || gameState;
  const s = gs.phaseSkipV7 && gs.phaseSkipV7[phaseSkipKeyV7(player, phase)];
  if(!Array.isArray(s) || !s.length) return false;
  return s.some(t => Number(t) <= Number(gs.turn));
}
/* 消費して1件だけ取り除く */
function consumePhaseSkipV7(gs, player, phase){
  gs = ensureScheduleStateV7(gs || gameState);
  const k = phaseSkipKeyV7(player, phase);
  const s = gs.phaseSkipV7[k];
  if(!Array.isArray(s) || !s.length) return false;
  const i = s.findIndex(t => Number(t) <= Number(gs.turn));
  if(i < 0) return false;
  s.splice(i, 1);
  if(!s.length) delete gs.phaseSkipV7[k];
  return true;
}

/* ---- 参照ヘルパ（テスト・カードスクリプト用） -------------------------- */
function schedulesOfV7(gs, handler){
  gs = ensureScheduleStateV7(gs || gameState);
  return gs.scheduledV7.filter(e => e && (!handler || e.handler === handler));
}
function scheduleSourceAliveV7(entry){
  if(!entry || entry.sourceUid == null) return true;
  const h = (typeof findCardByUid === 'function') ? findCardByUid(entry.sourceUid) : null;
  if(!h) return false;
  if(entry.sourceZone && h.zone !== entry.sourceZone) return false;
  return true;
}
/* 直列化検査（テスト用） */
function assertScheduleSerializableV7(gs){
  gs = ensureScheduleStateV7(gs || gameState);
  const bad = [];
  const walk = (v, path, d) => {
    if(d > 10 || v === null) return;
    const t = typeof v;
    if(t === 'function' || t === 'symbol'){ bad.push(path + ': ' + t); return; }
    if(t !== 'object') return;
    if(v instanceof Map || v instanceof Set){ bad.push(path + ': ' + v.constructor.name); return; }
    if(v.nodeType != null){ bad.push(path + ': DOM'); return; }
    if(typeof v.then === 'function'){ bad.push(path + ': thenable'); return; }
    if(Array.isArray(v)){ v.forEach((x, i) => walk(x, path + '[' + i + ']', d + 1)); return; }
    Object.keys(v).forEach(k => walk(v[k], path + '.' + k, d + 1));
  };
  walk(gs.scheduledV7, 'scheduledV7', 0);
  walk(gs.phaseSkipV7, 'phaseSkipV7', 0);
  let rt = true;
  try{ JSON.parse(JSON.stringify({s: gs.scheduledV7, p: gs.phaseSkipV7})); }
  catch(e){ rt = false; bad.push('JSON roundtrip failed'); }
  return {ok: bad.length === 0 && rt, why: bad.join(', ')};
}
