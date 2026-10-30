# S03-U486 — 召喚・反転の応答タイミングの窓を、終わった所で閉じる

U483 の 4-a。ユーザー優先順位③。**保存なし側に残っている不要な窓を閉じる**方針（「古い窓をそのまま保存する」のは不適切、というユーザー判断）。

## 1. 症状

`gameState.timingWindow` の `{kind:'summon'}` が、開いたメインフェイズに戻った後も**そのフェイズの間ずっと残る**。
その間 `currentTimings()`（engine/40）に `'summon'` が含まれるため、`timing:['summon']` のカード（《グリーン・ガジェット》等）が
ゾーンのメニューに出続け、発動しようとすると 1103 のルールで断られる。

さらにこの窓は Journal にも Replay digest にも入っておらず、`offerResumeDuel`（`runtime/50_actions_save.js:117`）がロード時に
召喚系の窓を捨てる。そのため**同じ盤面で、保存・再開した側だけメニューが違う**。U483 は R1 の 1 組でこれを直接計測していた。

## 2. 原因

窓を開くのは `runtime/50_actions_save.js` の `updateTimingWindow`:
`NORMAL_SUMMON` / `FX_SPECIAL_SUMMON` / `FX_EX_SUMMON` / `FX_RITUAL_SUMMON` → `open('summon')`、`FLIP` ほか → `open('flip')`。
閉じるのは `SET_PHASE` / `PASS_TURN` だけ。

実際にタイミングを終わらせているのは `queuePointContinuationV27`（engine/30）の `clearTimingOnPass` で、
これは**「召喚成功後のクイックエフェクト確認（`summonFast` / `flipFast`）の POINT を両者がパスした時」にしか走らない**。
その POINT が一度も作られない経路では閉じる処理が存在しなかった。

同じファイルの `FX_SET_STATE` の分岐には S03-U42 のコメントが既にあり
（「その窓は閉じる処理が無いため、そのフェイズの間モンスターの起動効果を誤って禁止していた」）、**同じ型の欠陥**である。

### 実測した具体例

R1 seed `0x52311015`（`R1_DECKS=tg_gadget,tg_skill`, `R1_LIST=v1`, `R1_POLICY=random`, `R1_RESPOND=1`）turn 7:

```
{act:"FX_SPECIAL_SUMMON", reason:"血の代償（通常召喚扱い）", from:null, to:"summon"}
{act:"SPECIAL_WIN_DEFER_S03", from:"summon", to:"summon"}
{act:"EVENT_DEQUEUE_V31",     from:"summon", to:"summon"}
{act:"EVENT_DEQUEUE_V31",     from:"summon", to:"summon"}
{act:"SET_PHASE",  phase:"battle", from:"summon", to:null}      ← ここまで開いたまま
```

イベントは処理されているのに `summonFast` の POINT が一度も作られず、バトルフェイズへ移るまで窓が残っていた。
この間の `getLegalZoneActions` **14 回**がすべて `'summon'` の窓を見ていた。

## 3. 修正（engine だけ、3 ファイル）

| # | ファイル | 変更 |
|---|---|---|
| 1 | `engine/30_processor_chain_battle.js` | `closeStaleSummonTimingS03(drained)` を追加し、`pumpProcessorV27` の末尾と `processorResumeV27` から呼ぶ |
| 2 | `engine/1X_interrupted_activation_s03.js` | 発動中断の復旧の live コピーが、召喚・反転の窓を引き継がない |
| 3 | `engine/1ZZP_resume_processor_s03.js` | 切れた Journal の復旧の live コピーが、同じく引き継がない |

閉じる条件（すべて満たす時だけ）:
`drained`（この pump で 1 つ以上処理した）/ 窓が `summon` または `flip` / フェイズが `main1`・`main2` /
プロセッサが paused でなく waiting も無くキューも空 / チェーン・保留召喚・選択待ち・バトルが無い / `deferredEvents` が空 / `EVT_V2_STATE` が無い。

`drained=false` で閉じないのは、**召喚の Action とそのイベント登録の間に挟まった空振りの pump** で、
これから始まる応答タイミングを先に閉じてしまわないため。

2・3 は「プロセッサのキューを捨てる復旧経路」で、窓を閉じる POINT はそのキューの中にある。
窓だけ引き継ぐと閉じ手が居なくなるので引き継がない（`offerResumeDuel` がロード時に同じ理由で捨てているのと同じ扱い）。
判定は共有の `summonTimingWindowS03(w)`（`summon` / `flip` / `summonFast` / `flipFast`）。バトル系の窓は閉じ手がバトル処理側にあるので引き継ぐ。

`timingWindow` は `engine/06_replay_rng_v41.js` の digest に含まれない（0 箇所）ため、Journal 化せず直接閉じている。
これは既存の同種の処理（`engine/30` の `ATTACK_PENDING_CLEAR_S03` 周辺など）と同じ作法。

## 4. 試験

`tools/test_s03_u486_summon_timing_window_close.js`（**20 PASS / 0 FAIL**）。`tools/check.py` と `tools/script_coverage.py` に配線済み。

- **A**（《血の代償》の実経路）: 召喚後、開いたメインフェイズで窓が **null**、《グリーン・ガジェット》は発動できない。
  この経路で `summonFast` の POINT が一度も作られないことも確認（＝閉じ手が無かった経路であることの固定）。Replay 監査つき
- **B（正の対照）**: 《E・HERO エアーマン》の通常召喚で、**応答タイミングの途中では窓を閉じない**（閉じると召喚誘発と応答が死ぬ）。
  `summonFast` の窓が実際に開き、そのタイミングが終わった後に窓が閉じ、効果も解決している
- **C（negative control）**: `closeStaleSummonTimingS03` を無効化すると A の盤面で窓が `summon` のまま残り、
  《グリーン・ガジェット》が発動可能になる — これが修正前の挙動
- **D**: 復旧経路の判定が召喚・反転の窓だけを対象にし、バトル系は引き継ぐこと、
  および engine/1X・engine/1ZZP の両方が実際にこの判定を通していることを固定

### 計測（修正の効果）

R1 seed `0x52311015`、開いたメインフェイズで召喚系の窓を見た `getLegalZoneActions` の回数:

| モード | 修正前 | 修正後 |
|---|---|---|
| 保存なし | 14 | **0** |
| `R1_SAVELOAD=1`（毎停止点で保存・再開） | 6 | **6（未解決、下記）** |

### 関連テスト（期待値の変更なし）

U42 13/0、`test_summon_timing` 4/0、U484 56/0、U483 361/0。

### 全体ゲート

`GATE_EXIT=0`、**24439 PASS**、`^FAIL` 0、Traceback 0、ReferenceError 0、最終行は所定の PASS 行。
算術 24439 = 24419（U485 時点）+ 20。TypeError 1 件は `test_auto_cycle32` の既知（基点にも存在）。

## 5. 未解決 — ③は完了していない

**保存・再開を毎停止点で往復させるモードでは、同 seed の turn 6 に 6 件の違反が残っている。**

計測で分かっていること:
- 窓は `{kind:'summon', action:'NORMAL_SUMMON'}`、読み手は p=1
- その時の状態は**完全なアイドル**（`paused:false, waiting:null, queue:0, deferredEvents:0, chain:0, pendingChoice:false, pendingSummon:false, battle:false, EVT_V2_STATE:null`）
  — つまり `closeStaleSummonTimingS03` のガードはすべて通る
- しかし `closeStaleSummonTimingS03` は**その main1 で一度も呼ばれていない**（turn 6 の呼び出しは battle フェイズでの 2 回だけ、どちらもキューが残った状態）
- 窓の書き込みはすべて正当な `updateTimingWindow`（`runSummonWindowResumeS03` / `s03BloodOfferTributeThenSummon` / `API.specialSummon` / `EX_SUMMON_COMMIT_V42`）

→ 再開時に復元された窓が、閉じ手（`pumpProcessorV27` / `processorResumeV27`）を通らない経路で生き残っている。
候補は `restoreProcessorAfterLoadS296`（`engine/1ZZP:106`）が `saved.timingWindow` を戻す経路。
ここは「待っている EVENT の窓であり《魔導戦士 ブレイカー》の誘発が読む」ため**戻す必要がある**ので、
単に戻さない形にはできない。戻した窓を、その待っている unit が終わった時点で確実に閉じる必要がある。

再現:
```
R1_HARNESS=<計測ハーネス> R1_DECKS=tg_gadget,tg_skill R1_LIST=v1 R1_POLICY=random R1_RESPOND=1 R1_SAVELOAD=1 \
  R1_OUT=<dir> node tools/r1_duel_driver.js 0x52311015 0 40
```
（計測ハーネスは `getLegalZoneActions` を包み、開いたメインフェイズで `timingWindow.kind` が `summon` / `summonFast` / `flipFast` の読み取りを数えるだけのもの。）

## 6. その他の未解決（この単位の範囲外）

1. **《血の代償》の「通常召喚扱い」の特殊召喚で、召喚成功後のクイックエフェクト確認（`summonFast` POINT）が一度も開かない。**
   本単位の測定で分かった別の欠陥。これは通常召喚扱いなので、本来は「召喚に成功した時」の誘発と、その後の応答窓が発生するはず。
   窓を閉じる話とは独立なので触っていない。U484 と同じ「応答機会が失われる」類の実害がある可能性が高く、優先度は高い
2. `onKarakuriPositionChange` など uid を持たない直接発火のイベントは再開後も複製のまま（読む側が同一性で比べないので現在は無害、U483 の 4-c）
