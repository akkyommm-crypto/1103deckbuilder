# S03-U489 — 保存・再開したあと、召喚成功タイミングの窓が残らないようにする

S03-U483 の 4-a の残り。**ユーザー優先順位③の完了**。

## 1. 症状

`R1_SAVELOAD=1`（毎停止点で保存・再開を往復させるモード）で、再開した側だけ
`gameState.timingWindow` の `{kind:'summon'}` が開いたままメインフェイズに戻っていた。
その間 `currentTimings()` に `'summon'` が含まれるので、`timing:['summon']` のカード（《グリーン・ガジェット》等）が
ゾーンのメニューに出て、発動すると断られる。**保存していない側では出ない**ので、同じ盤面で選択肢が食い違う。

実測: R1 seed `0x52311015`（`tg_gadget × tg_skill`、`R1_POLICY=random`、`R1_RESPOND=1`）turn 6 で、
再開直後の `getLegalZoneActions` **6 回**がこの窓を見ていた。

## 2. 原因

`offerResumeDuel`（`runtime/50_actions_save.js`）は、読み込み直後に召喚・反転の窓を破棄している
（`['summon','flip','summonFast','flipFast']` を `null` にする。v3.2 以前の古い保存への対処）。

ところが**そのあとの Journal 再生**が Action を適用し直す
（`v41RestoreJournalPackage`、および中断の復旧 `recoverInterruptedActivationAfterLoadS03` /
`recoverInterruptedResolutionAfterLoadS296` の `v44ReplayAdoptPrefix`）。
再生される `NORMAL_SUMMON` 等で `updateTimingWindow` が走り、**窓が開き直る**。
再生中はプロセッサが動かないので、窓を閉じる処理（`summonFast` の POINT、あるいは S03-U486 の
`closeStaleSummonTimingS03`）が一度も走らない。

計測トレース（turn 6、再開の内側）:

```
offerResume:in
  …
  updateTW act:NORMAL_SUMMON         tw:summon      ← 再生で開き直る
  updateTW act:EVENT_QUEUE_V31       tw:summon
  updateTW act:CHAIN_ADD             tw:summon
  updateTW act:CHAIN_RESOLVE_TOP     tw:summon
  updateTW act:EVENT_DEQUEUE_V31     tw:summon
offerResume:out                      tw:summon      ← 閉じ手は一度も呼ばれない
VIOLATION  (getLegalZoneActions)     tw:summon
```

比較のため、同じ試合の別の再開では `pump → closer → pump:out → offerResume:out` と進んで窓が閉じている。
つまり「プロセッサが動く再開」では閉じるが、「Journal 再生だけで終わる再開」では閉じ手が走らない。

## 3. 修正

`offerResumeDuel` の末尾、**待ち状態の積み直しより後・`render()` より前**で同じ閉じ手を呼ぶ。

```js
if(typeof closeStaleSummonTimingS03==='function') closeStaleSummonTimingS03(true);
```

- 置く位置が重要で、`restoreProcessorAfterLoadS296` の**後**にする。
  同関数は「待っている EVENT の窓」を意図的に戻す（《魔導戦士 ブレイカー》の召喚誘発がこの窓を読む）ので、
  その場合は `closeStaleSummonTimingS03` のガード（`processorPaused` / `processorWaiting` / キュー /
  遅延イベント / チェーン / 選択待ち）が閉じるのを防ぐ
- 読み込み直後の破棄はそのまま残す（**二重の防御**。古い保存データ対策としての意味も変わらない）
- `timingWindow` は `engine/06` の digest に含まれないので、Journal 化せず直接閉じている（S03-U486 と同じ）

変更は `runtime/50_actions_save.js` の 1 箇所だけ。エンジンとカードには手を入れていない。

## 4. 計測

R1 seed `0x52311015`、開いたメインフェイズで召喚系の窓を見た `getLegalZoneActions` の回数:

| モード | U483 の報告時 | U486 後 | **U489 後** |
|---|---|---|---|
| 保存なし | 14 | 0 | **0** |
| `R1_SAVELOAD=1` | 6 | 6 | **0** |

さらに seed 4 種（`0x52311015` / `0x52311012` / `0x52311007` / `0x52310007`）× デッキ 2 組
（`tg_gadget × tg_skill` / `karakuri × worm`）の **8 通りすべてで `R1_SAVELOAD=1` の違反 0 件**を確認した。

## 5. 試験

`tools/test_s03_u489_resume_summon_timing_window.js`（**19 PASS / 0 FAIL**）。`tools/check.py` と `tools/script_coverage.py` に配線済み。

- **VM1**: 通常召喚を済ませて開いたメインフェイズで落ち着いた局面を作り（窓は閉じている）、保存する
- **A**: 新しい VM で再開する。**Journal 再生が窓を開き直す状況を、再生と同じ時点
  （待ち状態の積み直しの直後）で再現**したうえで、`offerResumeDuel` を抜けた時点で窓が `null` であり、
  《グリーン・ガジェット》が発動できないことを確認。盤面 digest も保存時と一致する
- **B（negative control）**: 閉じ手を無効化すると、同じ再開で窓が `summon` のまま残り、
  《グリーン・ガジェット》が発動可能になる — これが修正前の挙動
- **C（配線の固定）**: `offerResumeDuel` が閉じ手を呼んでいること、呼ぶ位置が
  `restoreProcessorAfterLoadS296` より後・`render()` より前であること、
  読み込み直後の破棄も残っていること（二重の防御）
- **D（非回帰）**: 《魔導戦士 ブレイカー》の召喚誘発の選択窓が開いた状態で保存し、新しい VM で再開する。
  **戻した召喚の窓は閉じない**（`processorPaused` / `processorWaiting` のガードが働く）ことを確認し、
  そのまま進めて誘発が解決し、解決後には窓が閉じることまで確認する

### 試験の作りについての注意

A・B は当初 `const undo = …` という変数を使っていたが、`runtime/50_actions_save.js` に
グローバル関数 `undo()` があるため `SyntaxError: Identifier 'undo' has already been declared` で
**そのブロックだけが落ち、PASS 件数が静かに減っていた**（`FAIL` は出ない）。
変数名を変えて解消した。このような取りこぼしは、全体ゲートの PASS 総数の算術でしか気づけないので、
基準との差分を必ず確認する。

### 関連テスト（期待値の変更なし）

U486 25/0、U488 20/0、U487 32/0、U484 56/0、U483 361/0、U42 13/0。

## 6. ユーザー優先順位③の完了

> ③は、古い召喚窓をそのまま保存するだけでは不適切です。保存なし側にも不要な窓が残っているため、
> 正しいタイミングで閉じ、再開後も一致させる必要があります。

- 「保存なし側にも不要な窓が残っている」→ S03-U486 で、応答タイミングが終わった時点で閉じるようにした
  （さらに S03-U487 / S03-U488 が、そもそも窓が残る原因だった「召喚成功のイベントを出さない経路」を直した）
- 「再開後も一致させる」→ 本単位で、Journal 再生が開き直した窓を再開の末尾で閉じるようにした
- 「古い召喚窓をそのまま保存する」案は採らなかった

## 7. 未解決

1. 《降霊の儀式》とネクロバレーの関係（墓地ロックを迂回してよいか）は、カードの `auditNote` に残る
   既存の判断で、当時裁定での再確認は未実施（S03-U488 の 5）
2. 当時裁定の「チェーン2以上で召喚し、その後に別の処理がある場合はタイミングを逃す」は未実装（S03-U487 の 6）
3. `onKarakuriPositionChange` など uid を持たない直接発火のイベントは再開後も複製のまま
   （読む側が同一性で比べないので現在は無害、S03-U483 の 4-c）
