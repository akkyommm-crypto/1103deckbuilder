# S03-U488 — raw な召喚 Action でも、召喚成功のイベントを出す

S03-U487 と同じクラスの欠陥。U487 の走査で残っていた実在経路を閉じた。

## 1. 走査結果（`cards/` の raw な召喚 Action）

`act({type:'FX_SPECIAL_SUMMON' | 'NORMAL_SUMMON' | 'FX_EX_SUMMON' | 'FX_RITUAL_SUMMON'})` を直接発火している箇所は 5 つ。

| 箇所 | 状態 |
|---|---|
| `cards/00_generic_core.js`（血の代償） | S03-U487 で正規の `NORMAL_SUMMON` + `onNormalSummon` に修正済み |
| **`cards/39_1103_expansion_v380b.js`（降霊の儀式）** | **イベントを出していなかった → 本単位で修正** |
| `cards/HD_claude_s03_u53_instant_fusion.js`（簡易融合） | 既に `queueSpecialSummonSuccessV2` を呼んでいる |
| `cards/HZK_claude_s03_u164_dual_summoner.js`（デュアル・サモナー） | 既に `NORMAL_SUMMON` + `onNormalSummon` |
| `cards/40_auto_interpreter.js`（`doExSummon`） | `emitEvent('onSpecialSummon')` を呼ぶ（DUEL のシンクロ・エクシーズは `beginExSummonV2` の正規経路へ分岐） |

`FX_SPECIAL_SUMMON` / `FX_EX_SUMMON` の reducer はどちらも召喚成功のイベントを積まない（呼び出し側の責任）ことを確認した。
正規のヘルパーは `queueSpecialSummonSuccessV2(p, card, kind)`（`engine/30_processor_chain_battle.js:1843`）で、
解決中は `RESOLUTION_SUMMON_BATCH_V2` に入り（同一解決中の複数召喚を 1 回の同時召喚イベントにまとめる）、
それ以外は即 `queueDeferredEventV2('onSpecialSummon', …)` する。`API.specialSummon`（`engine/40:852`）と儀式召喚（`engine/14:312`）がこれを使っている。

## 2. 症状（《降霊の儀式》）

墓地の「墓守の」モンスターは場に出るが、

- `onSpecialSummon` が一度も発火しない → 「特殊召喚に成功した時」の誘発が起きない
- 召喚成功後の応答タイミング（`summonFast` の POINT）も作られない → 相手が《奈落の落とし穴》《激流葬》等で応答できない

実測: 《墓守の司令官》（攻撃力 1600）を蘇生し、相手が前のターンに伏せた《奈落の落とし穴》がある盤面で、
修正前は**除外されずに場に残っていた**。

## 3. 修正

```js
resolve(ctx){
  const t=resolveTarget(ctx.selectedTargets[0]); if(!t || t.zone!=='grave') return;
  const before=t.card; ensureCardUid(gameState,before);
  act({type:'FX_SPECIAL_SUMMON',player:ctx.player,from:'grave',fromIndex:t.index,pos:'atk',reason:'降霊の儀式'});
  const h=findCardByUid(before.uid);
  if(h && h.zone==='mz' && h.p===ctx.player && typeof queueSpecialSummonSuccessV2==='function')
    queueSpecialSummonSuccessV2(ctx.player, h.card, 'effect');
}
```

- カードが `API.specialSummon` を使わず raw な Action を使っているのは
  「ネクロバレーの影響を受けないため API の墓地ロックを迂回する」という既存の設計判断（カードの `auditNote`）。
  **そこは変えていない**（その裁定自体は本単位の範囲外）。イベントを出す呼び出しだけを足した
- 召喚後に uid で居場所を確認してから呼ぶ（`API.specialSummon` と同じ作法）

変更は `cards/39_1103_expansion_v380b.js` だけ。エンジンには手を入れていない。

## 4. 試験

`tools/test_s03_u488_raw_summon_success_event.js`（**20 PASS / 0 FAIL**）。`tools/check.py` と `tools/script_coverage.py` に配線済み。

- **A**: 《降霊の儀式》で《墓守の司令官》（攻撃力 1600 = 奈落の条件を満たす）を蘇生 →
  `onSpecialSummon` 発火 / `summonFast` の POINT が作られる / **相手の《奈落の落とし穴》が応答して除外される**。Replay 監査つき
- **B**: 相手の応答が無い盤面でも召喚自体は今までどおり成立し、特殊召喚として扱われ、イベントと窓は出る
- **C**: 《王家の眠る谷－ネクロバレー》がある状態でも蘇生できる（**墓地ロック迂回の既存の設計判断を壊していない**）
- **D（negative control）**: イベントを出す呼び出しを外すと、蘇生は起きるが
  `onSpecialSummon` が発火せず / POINT も作られず / 相手の奈落も応答できない（場に残る）
- **E（監査ピン）**: `CARD_SCRIPTS` 全体を実行時に走査し、
  **raw な召喚 Action を使いながら召喚成功のイベントを出していないスクリプトが 0 件**であることを固定。
  `CARD_SCRIPTS` から辿れないカード側のグローバル補助関数（`s03BloodOfferTributeThenSummon`、`doExSummon`）も個別に固定し、
  正規ヘルパー `queueSpecialSummonSuccessV2` の二分岐（解決中はバッチ / それ以外は即キュー）も固定した

### 既存試験の組み替え（判定は減らしていない）

`tools/test_s03_u486_summon_timing_window_close.js` の A・C は、
「召喚成功の POINT が作られない実在経路」として当初《血の代償》、次に《降霊の儀式》を使っていた。
U487・U488 でどちらも原因側を直したため、その性質を持つ実在経路が見つからなくなった。

**実測（R1 seed `0x52311015`、`tg_gadget × tg_skill`、`R1_POLICY=random`、`R1_RESPOND=1`）:**

| モード | U486 前 | U486 後 | U487・U488 後 | U487・U488 後＋閉じ手を無効化 |
|---|---|---|---|---|
| 保存なし | 14 | 0 | **0** | **0** |
| `R1_SAVELOAD=1` | 6 | 6 | 6 | 6 |

**閉じ手を無効化しても保存なしの違反が 0** になった。つまり U486 の閉じ手には、現時点で実在の発動契機が残っていない。
U486 の時点では 14 件の実害があり、この閉じ手がそれを 0 にしたのは事実だが、
いまは「POINT が作られない経路が将来できた場合」と再開経路のための**防御**として残っている状態である。

そこで実在経路のふりをやめ、A を**機構の検証**に、C をその機構の negative control に置き換えた
（A は閉じる処理本体と**ガード 5 つ**＝この pump で未処理 / 遅延イベント残 / キュー残 / プロセッサ待ち / メインフェイズ外、
さらにバトル系の窓は閉じないこと、反転の窓も閉じることを固定）。
実際の対局経路での検証は従来どおり B（応答タイミングの途中では閉じない）が担う。**判定は 20 → 25 件に増えた。**

### 関連テスト（期待値の変更なし）

U487 32/0、U484 56/0、U486 25/0（上記の組み替え後）。

### 全体ゲート

`GATE_EXIT=0`、**24496 PASS**、`^FAIL` 0、Traceback 0、ReferenceError 0、最終行は所定の PASS 行。
算術 24496 = 24471（U487 時点）+ 20（本単位の新規試験）+ 5（U486 試験の判定増 20→25）。
PASS ラベル差分は +35 / −10 = +25 で、内訳（新規 20 / U486 の A・C 入替 +15・−10）と一致。
TypeError 1 件は `test_auto_cycle32` の既知（基点にも存在）。

## 5. 未解決

1. **U486 の残課題（ユーザー優先順位③の残り）**: 保存・再開を毎停止点で往復させるモードでの `timingWindow` 不一致。
   同 seed turn 6 に 6 件。本命は `restoreProcessorAfterLoadS296`（`engine/1ZZP:106`）が戻した窓を、
   その待っている unit が終わった時点で閉じること。計測と再現手順は `docs/S03_U486_REPORT.md` の 5
2. 《降霊の儀式》とネクロバレーの関係（墓地ロックを迂回してよいか）は、カードの `auditNote` に残る既存の判断で、
   本単位では検証していない。当時裁定での再確認は未実施
3. 当時裁定の「チェーン2以上で召喚し、その後に別の処理がある場合はタイミングを逃す」は未実装（U487 の 6 と同じ）
