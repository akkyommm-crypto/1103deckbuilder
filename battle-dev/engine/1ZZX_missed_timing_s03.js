/* S03-U491: 「タイミングを逃す」の共通機構。設計と当時裁定の根拠は docs/S03_MISSED_TIMING_DESIGN.md
   （裁定の抽出は docs/S03_MISSED_TIMING_RULINGS.md、123 件）。

   当時裁定から読み取れる規則:
     R1 強制誘発は逃さない（手段を問わない）              — 《D・バリア》09/09/27 ほか
     R2 任意誘発（「〜した時…できる」）は、条件が満たされた後に別の処理があると逃す — 《光神テテュス》08/05/29 ほか
     R3 チェーン2以上で条件が満たされ、残りのリンクの解決が続く場合は逃す — 《血の代償》11/08/25 ほか
     R4 判定軸は「最後に行われた処理か」。同時に行われた処理は互いを逃させない — 《魔轟神獣ノズチ》09/10/13 ほか
     R5 例外カードは任意でも逃さない                      — 《ダーク・スプロケッター》08/04/19 ほか
     R6 当時「調整中」のものがある                        — 《カオスポッド》11/08/03（RULING_UNRESOLVED）

   機構は 3 つ:
     (A) gameState.procStepS03 — 最上位の applyAction 1 回を 1 ステップとする単調増加カウンタ。
         1 回の act() の中で起きたことは「同時」なので、そこで積まれた誘発は互いを逃させない（R4）。
         チェーンの残りリンクの解決は多数の act() を伴うので R3 は自動的に満たされる。
         帳簿・提示・掃除の Action はステップを進めない（下の除外表）。
     (B) MISSED_TIMING_DECL_S03 — カードごとの宣言。**宣言の無いカードは逃さない**（現在の挙動）。
         カードテキストからの自動推定は行わない（DB のテキストは時代が混在しており、推定の誤りが静かに対局を変える）。
     (C) filterMissedTimingS03 — 判定は collectHandlers（engine/40）の 1 箇所だけで行う。

   S03-U491 の時点では (B) の宣言が 0 件なので、**対局の挙動は変わらない**。
   除外表を実対局で計測してから、S03-U492 以降で裁定を持つカードを数枚ずつ宣言していく。 */

/* 盤面を変えない帳簿・提示・掃除の Action。ここに挙げたものはステップを進めない。
   迷ったものは「進めない」側に置く（進めないほうが「逃さない」＝現状維持に倒れるため安全）。 */
const MISSED_TIMING_BOOKKEEPING_S03 = new Set([
  /* 遅延イベントの出入り */
  'EVENT_QUEUE_V31', 'EVENT_DEQUEUE_V31', 'EVENT_RESUME_V11', 'EVENT_SUMMARY_S03', 'EVENT_TAKE_S03',
  /* チェーンの積み下ろし（解決そのものは各効果の Action が行う） */
  'CHAIN_ADD', 'CHAIN_CLEAR', 'CHAIN_NEGATE_LINK', 'CHAIN_RESOLVE_TOP', 'CHAIN_RETARGET_S03',
  /* 選択の提示と回答 */
  'CHOICE_OPEN_V49', 'CHOICE_ANSWER_V49', 'CHOICE_CANCEL_V49',
  /* 発動準備トランザクション（engine/1ZZV） */
  'PREP_TX_BEGIN_S03', 'PREP_TX_ABORT_S03', 'PREP_TX_COMMIT_S03',
  /* 召喚無効タイミングの開閉（無効そのものも、逃させない側に倒す） */
  'SUMMON_WINDOW_OPEN_V42', 'SUMMON_WINDOW_CLOSE_V42', 'SUMMON_WINDOW_NEGATE_V42',
  /* エクシーズ・シンクロの準備（実際に場が変わるのは COMMIT 側） */
  'EX_SUMMON_PREPARE_V42', 'EX_SUMMON_CANCEL_V42',
  /* 掃除 */
  'COUNTER_CLEAR', 'MOD_CLEAR', 'MOD_CLEAR_LABEL_V7', 'LINK_CLEAR_V9',
  /* 攻撃宣言の保留状態 */
  'ATTACK_PENDING_CLEAR_S03', 'ATTACK_PENDING_RETARGET_S03',
  /* 優先権・フェイズ（効果処理ではない） */
  'SET_PRIORITY', 'SET_PHASE',
  /* 永続効果の登録と回数制限の計上 */
  'V4_EFFECT_REGISTER', 'V4_EFFECT_REMOVE', 'V4_EFFECT_RESET_S03',
  'EFFECT_COUNT_CONSUME_V44', 'COUNT_REFUND_S03',
  /* 予約と残存情報 */
  'SCHEDULE_ADD_V7', 'SCHEDULE_REMOVE_V7', 'LINGER_ADD_S03',
  /* 召喚の試行（成立は NORMAL_SUMMON 側） */
  'NORMAL_SUMMON_ATTEMPT', 'PENDING_RESOLVE',
]);

/* (A) 最上位の applyAction から呼ぶ。Journal 再生でも同じ Action 列を通るので同じ値に再構成される。 */
function bumpProcStepS03(gs, a){
  if(!gs || !a || !a.type) return;
  if(MISSED_TIMING_BOOKKEEPING_S03.has(a.type)) return;
  gs.procStepS03 = (gs.procStepS03 | 0) + 1;
}

/* (B) カードごとの宣言。'miss' = 時の任意効果としてタイミングを逃す、'never' = 逃さない（例外カード等）。
   宣言が無いカードは 'never' と同じに扱う。各件に当時裁定の ID を必ず添える。 */
const MISSED_TIMING_DECL_S03 = {
  /* S03-U492 以降で、docs/S03_MISSED_TIMING_RULINGS.md の裁定を持つカードを数枚ずつ宣言する。
     例: '血の代償': {mode:'miss', ruling:'WIKI-2CF23AA42E79'} */
};
function missedTimingModeS03(name){
  const d = MISSED_TIMING_DECL_S03[name];
  return (d && d.mode) || 'never';
}

/* 診断用。digest にも保存にも入れない（collectHandlers は盤面を変えてはいけないため gameState には書かない）。 */
let MISSED_TIMING_DROPS_S03 = [];
function resetMissedTimingDropsS03(){ MISSED_TIMING_DROPS_S03 = []; }

/* (C) 誘発候補 1 件が、タイミングを逃しているか。 */
function missedTimingDropS03(cand, evt){
  if(!cand || !evt) return false;
  /* 刻みの無いイベント（emitEvent の直接呼び出しなど）と、古い保存データは判定しない */
  if(evt.stepS03 == null) return false;
  /* R4: 条件が満たされたステップのままなら、まだ「最後に行われた処理」である */
  if(((typeof gameState !== 'undefined' && gameState ? gameState.procStepS03 : 0) | 0) === (evt.stepS03 | 0)) return false;
  /* R2 / R5: 宣言の無いカードは逃さない */
  if(missedTimingModeS03(cand.name) !== 'miss') return false;
  /* R1: 強制誘発は逃さない */
  if(typeof triggerCandidateForcedS03 === 'function' && triggerCandidateForcedS03(cand)) return false;
  return true;
}
function filterMissedTimingS03(cands, evt){
  if(!Array.isArray(cands) || !cands.length) return cands;
  const kept = [];
  cands.forEach(c=>{
    if(missedTimingDropS03(c, evt)){
      MISSED_TIMING_DROPS_S03.push({name:c.name, p:c.p, eventName:c.eventName,
        stepS03:evt.stepS03, nowS03:(typeof gameState!=='undefined'&&gameState)?(gameState.procStepS03|0):0});
      return;
    }
    kept.push(c);
  });
  return kept;
}
