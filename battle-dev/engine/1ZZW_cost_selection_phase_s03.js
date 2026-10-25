/* =========================================================================
   S03-U474 — コストの選択と効果の対象の選択を分ける（選択の「段階」）
   -------------------------------------------------------------------------
   欠陥: API.selectCard（legacy 互換層、呼び出し約1444箇所）は対象耐性の要否（targeting）を「スクリプト全体の targets:true」から推定していた。
   スクリプト単位の印なので、同じスクリプトの中の「コストの選択」と「効果の対象の選択」を区別できず、targets:true のカードでは
   リリース・捨てる・墓地へ送る・除外するカードの候補にまで filterTargetable（対象耐性）が掛かった
   （targets:true でコストの中に選択を開くカードは 126 ファイル 496 枚）。コストは対象ではない（対象を取るのは「選択して発動する」対象だけ）。
   既知の症状: デュアルスパークがメタルシルバー・アーマーの下でコスト候補が空になる／ゴッドバードアタックが、効果の対象にならないモンスターを
   リリースできない。
   ■ 設計（共通エンジン1か所。カード名を見ない）
     1. 選択の「段階」を実行時に持つ（SELECTION_PHASE_S03 = 'cost' | null。gameState の外）。発動準備（engine/30 prepareDuelActivation）が
        コストを払う区間だけ 'cost' にする: 通常経路の sc.cost、COST_SELECTION_FIRST の selectTargets（＝コストにするカードの選択）と cost。
        コストを払い終えた継続（done）では必ず外し（null）、その先の対象選択は従来どおりスクリプトの targets に従う。try/finally で戻すので
        中止・失敗・例外でも残らない。
     2. 選択の記録（gameState.pendingChoice）に selection:'cost'|'effect' を持つ。targeting と並べて置く。'cost' の選択は targeting を false にし、
        requestChoiceV49 は filterTargetable を掛けない。選択後のコールバック（legacy の onPick / onCancel、登録ハンドラ）は、記録の selection で
        段階を復元してから実行する（dispatchChoiceContinuationV49）— 続きの段（2体目のリリースを選ぶ・確認を挟む等）も同じ段階になる。
        記録は JSON なので保存・再開・Undo/Redo・Replay を跨いでも同じ分類になる。
     3. コスト自体の制約（リリースできない・捨てられない・素材にできない 等）は別の述語（コストの候補を作る側）で、ここは触らない。
   ■ 注意: 記録 selection の 'effect' は「コスト以外」の意味。P1.1（登録経路、activationV11）の選択は段階で印を付けず targeting を選択ごとに明示するので、
     P1.1 のコスト選択も 'effect' と記録される（P1.1 の分類には selection を使えない。決め手は targeting。挙動には影響しない）。
   ■ 将来のカードが「これはコストの選択」と示す方法（優先順）
     a. cost(ctx, done) の中で API.selectCard を呼ぶ — 何もしなくてよい（発動準備が自動で 'cost' にする）。
     b. 登録ハンドラ経路（API.requestChoice / p11cOpen）— コストには targeting:false（省略可）か selection:'cost'。
        selection:'cost' は、誤って targeting:true を書いても対象耐性を掛けない。
     c. 発動準備の外・cost の外でコストを選ぶ時、または cost/selectTargets の中で本当の対象を選ぶ時 —
        API.selectCard(title, cands, onPick, note, {selection:'cost'|'effect'}) で明示する（明示は自動の段階より優先）。
        'effect'（別名 'target'）で、COST_SELECTION_FIRST の selectTargets 内の本当の対象選択（装備するモンスター等）を戻せる。
   ========================================================================= */
let SELECTION_PHASE_S03 = null;   // 'cost' | null（実行時のみ。gameState には入れない）

/* 'cost' だけがコスト。それ以外（'effect' / 'target' / 未指定）は効果の選択。 */
function selectionKindS03(v){ return v === 'cost' ? 'cost' : 'effect'; }

function selectionPhaseS03(){ return SELECTION_PHASE_S03; }

/* phase の間だけ段階を切り替える（'cost' 以外は null＝効果の選択）。戻り値は fn の戻り値。例外でも元に戻す。 */
function withSelectionPhaseS03(phase, fn){
  const prev = SELECTION_PHASE_S03;
  SELECTION_PHASE_S03 = (phase === 'cost') ? 'cost' : null;
  try{ return fn(); }
  finally{ SELECTION_PHASE_S03 = prev; }
}

/* コストを払う区間（発動準備の sc.cost / COST_SELECTION_FIRST の selectTargets と cost）で使う。
   run(done): done は「コストを払い終えた」継続を段階 null で包んだもの — その中で開く対象選択は効果の選択になる。 */
function runCostPhaseS03(run, onDone){
  return withSelectionPhaseS03('cost', ()=>run(function(){
    const args = arguments;
    return withSelectionPhaseS03(null, ()=>onDone.apply(null, args));
  }));
}
