# S03-U500 報告：デュアル再召喚にも召喚無効の窓を開き、S03-U498 の記述を 1 つ訂正した

S03-U498 で入れた召喚無効の窓（`engine/1ZZY_summon_negation_window_s03.js`）の **3 件目の呼び出し元**。
《デュアル・サモナー》のもう一方の枝＝効果によるデュアル再召喚（「もう1度召喚」、`GEMINI_SUMMON_S03`）。
あわせて、**S03-U498 が書いた記述の誤りを実測で訂正した**（下の 3 節）。

## 1. 残っていたのは「取り消しの形」だけだった

S03-U499 でこの枝の**処理順は手札の枝と同じ**（`onNormalSummon` を `procStepS03` 2・chain 0 で積み、
排出時も 2）と実測済みで、未対応に残していた理由は順ではなく**取り消しの形**だった。

| 枝 | 取り消し | 理由 |
|---|---|---|
| 手札からの召喚（S03-U498）| `MOVE`（墓地へ）| そのモンスターは**場に届いていない** |
| デュアル再召喚（本単位）| `FX_TO_GRAVE byDestroy`（破壊）| そのモンスターは召喚の**前から場に居る**。UI 起点の窓（`geminiSummonResumeS03`、`engine/1ZI`）と同じ形に揃えた |

実測した違い: 破壊の側は `onDestroy` と `onSendToGrave` が積まれ、墓地の `graveInfo.byDestroy` も立つ。
`MOVE` の側はどちらも積まれず `graveInfo` も残らない。

根拠は `WIKI-2CF23AA42E79`（**回答日 2011-08-25**）の「この効果による通常召喚」。
再度召喚が通常召喚扱いであること自体は `WIKI-5B32D377CFE9`（**回答日なし**）。
**再度召喚に対する召喚無効そのものの裁定は裁定 DB に無く**、エンジンが UI 起点のデュアル召喚に
**すでに窓を開いていた**扱いへ、効果経由の枝を揃えたものである。UI 起点の窓は変えていない。

## 2. S03-U498 の記述の訂正（実測）

S03-U498 は設計書と報告書に「召喚は成立していないので**破壊された時でもフィールドから離れた時でもない**」と
書いていた。**後半は誤りだった。**

- 「破壊された時」は正しい。`MOVE` では `onDestroy` も `onSendToGrave` も積まれず、`graveInfo` も残らない。
- **「フィールドから離れた時」は積まれる。** 場からの離脱は `v9DetectLeaveField`（`engine/18`）が
  **盤面の差分**から検出するルール処理なので、どの Action で取り除いても `onLeaveField` が積まれる。
  しかもそのイベントの `byDestroy` は**行き先が墓地かどうか**で決まるため真になる。

S03-U498 のテスト（D4）は `emitEvent` で見ていたため、**応答できるカードが盤面に無ければ呼ばれない**ことを
「起きていない」と読んでいた。判定を**積まれたイベント**（`queueDeferredEventV2`）に直し、
D4（破壊ではない）と D4b（離脱は積まれる）に分けた。設計書 5-a に **#1-i** として記録し、
案 (b) の近似の 3 つ目に挙げてある。`v9DetectLeaveField` は公開済みのルール処理なので触っていない。

## 3. 公開対象の対応範囲と未対応範囲

### 対応した範囲

- 《デュアル・サモナー》の効果によるデュアル再召喚に対する召喚無効の窓。無効なら破壊で取り消し、
  通せば再召喚が成立する（`dualUp` のまま場に残る）。
- 窓を跨ぐ Save/Load（別 VM。再開データの `geminiS03` も戻る）と Replay 監査。
- S03-U498 の記述の訂正（設計書 (D)・5-a #1-i、報告書、テスト D4／D4b）。

### 未対応範囲

- **解決中の特殊召喚**には窓が開かない（5-a #1-d）。`sc.summonNegate` の `kinds` に効果による特殊召喚の
  種別が無く、足すとカードスクリプト（公開済み）を全件直すことになる。根拠も `R1103-ROACH-003`
  （**回答日なし**）しかない。
- 窓の中身の 2 点（5-a #1-e ターンプレイヤー、#1-f 1 召喚 1 チェーンブロック）。どちらも**回答日なし**。
- 案 (b) の近似 3 点（設計書 (D)）。#1-i を含む。
- **タイミングを逃す判定は確認済み 44 枚 / 65 組に限られ、全カード・全タイミング規則が完成したわけではない。**

## 4. テスト

| テスト | 結果 |
|---|---|
| `tools/test_s03_u500_gemini_resummon_negation_window.js`（新規）| **35 PASS / 0 FAIL** |
| `tools/test_s03_u499_dual_summoner_negation_window.js` | 34 PASS / 0 FAIL（D2・G2・G3 を 3 件目に合わせて書き直し）|
| `tools/test_s03_u498_summon_negation_window.js` | 74 PASS / 0 FAIL（**D4 を実測に合わせて訂正し D4b を追加**、K1・K11 を更新）|
| `tools/test_s03_u497_summon_negation_window_order.js` | 32 PASS / 0 FAIL |
| `tools/test_s03_u496_missed_timing_published_scope.js` | 35 PASS / 0 FAIL |
| `tools/test_s03_u495_missed_timing_evidence.js` | 33 PASS / 0 FAIL |
| `tools/test_s03_u494_missed_timing_era_mixing.js` | 51 PASS / 0 FAIL |
| 周辺 26 本（《血の代償》・召喚無効・デュアル・離脱）| **780 PASS / 0 FAIL** |

専用テストの内訳: A 窓が開く（ラベルと再開データ）、B **取り消しが破壊であること**と手札の枝（`MOVE`）との
違いを並べて固定、C 通せば再召喚が成立する、D **negative control**（召喚無効が場に無ければ Action が増えない）、
E **negative control**（UI 起点のデュアル召喚の窓は変えていない＝召喚の前に開き `resolvedSummonS03` が無い）、
F Save/Load を別 VM で跨ぐ＋ Replay 監査、G 文書・登録。

| 全体ゲート `tools/check.py` | 最終状態で 1 回 |
