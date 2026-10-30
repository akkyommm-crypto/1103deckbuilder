# S03-U487 — 《血の代償》の効果による通常召喚を、本当の通常召喚として扱う

S03-U486 の測定中に見つけた欠陥。実害が大きいので、U486 の残課題（保存・再開側の `timingWindow` 一致）より先に処理した。

## 1. 症状

《血の代償》の効果で召喚したモンスターについて、**召喚に関する一切の処理が起きなかった**。

- `onNormalSummon` が一度も発火しない → 召喚したモンスター自身の召喚誘発（《E・HERO エアーマン》《グリーン・ガジェット》等）が丸ごと起きない
- 召喚成功後の応答タイミング（`summonFast` の POINT）も作られない → 相手は《奈落の落とし穴》《激流葬》等で応答できない
- 特殊召喚扱い（`specialSummoned` / `ssHistory`）になってしまう
- 「召喚に成功したターン」の記録（`normalSummonSuccessS03`）が付かない
- アドバンス召喚の手順記録（`tributeCount` / `tributeValue` / `normalSummonMethod`）が残らない

《血の代償》は tg_gadget 系の主要デッキに入るカードで、1 ターンに何度も使われる。
その召喚すべてについて双方の誘発・応答が消えていたので、実戦への影響は大きい。

## 2. 当時裁定（根拠）

出典は `1103_SHARED/1103_rulings_complete_v8_154.zip` の `wiki-rulings.js`（2011-08-31 以前の Wiki バックアップ）。《血の代償》のエントリは 46 件。

- **手順**: 「通常召喚は、どのように行いますか？」
  → 「まず、500ライフを払い効果を発動します。その効果はチェーンブロックを作りますので、次にチェーンの有無を確認します。
     そして効果処理の段階で、手札からモンスターを**『通常召喚扱いで』召喚**します。アドバンス召喚の場合は、その効果処理の時点でリリースします。
     《サイクロン》などにより効果処理の時点でこのカードが破壊されている場合、効果は不発となります。」
- **相手の応答**: 「この効果による通常召喚に対し《奈落の落とし穴》を発動できますか？」
  → 「**チェーン1で行っているならば、発動可能です。** チェーン2以上で行い、召喚の後に別の処理がある場合はタイミングを逃すことになり発動できません。」
- **召喚無効**: 「この効果による通常召喚に対し《神の宣告》《キックバック》《神の角笛》などの召喚を無効にするカードを発動できますか？」
  → 同じ（チェーン1なら可能）。（11/08/25）
- **召喚権**: 「まだこのターン通常召喚を行っていない状態で…本来の通常召喚を行わずにこのカードの効果による通常召喚を行うことは出来ますか？」
  → 「**1ターンに1度可能な通常召喚を行う前に、《血の代償》の効果による通常召喚を行う事はできます。**」（10/7/19）
- 「《血の代償》を使って特殊召喚する事は出来ますか？」→ 「いいえ、《血の代償》の効果は『**通常召喚**』になるので…特殊召喚する事は出来ません。」

→ これは通常召喚であり、召喚誘発と召喚成功時の応答が働くのが正解。

## 3. 原因と修正

`cards/00_generic_core.js` の `s03BloodOfferTributeThenSummon` が、召喚を **raw `act({type:'FX_SPECIAL_SUMMON', …})`** で行っていた。
`API.specialSummon` も通らないので、召喚成功のイベントを出す仕組みに一切乗らない。

正規経路（`engine/40_legal_script_engine.js` の `runSummonWindowResumeS03`）と同じ形に変更:

```js
act(Object.assign({type:'NORMAL_SUMMON', player:p, handIndex:hr.index, pos:'atk', prepaid:true,
     tributes:chosen.length, tributeValue:spent, p3Materials:matsS487},
   (method && method.id!=null) ? {summonMethod:method.id} : {}));
const summonedS487=lastSummonedCard(p);
if(summonedS487) queueDeferredEventV2('onNormalSummon',{player:p,name:cardName(summonedS487),card:summonedS487});
```

- `prepaid:true` は「召喚権を別途払った召喚」のための既存の仕組み（reducer が `consumeNormalRightS03` を呼ばない）。
  当時裁定の「本来の通常召喚の前にこの効果の通常召喚を行える」と一致する
- リリースは今までどおりスクリプト側が効果処理の段階で行う（裁定どおり）。その**直前に P3 の素材スナップショットを取る**
  （`engine/70_summon_procedures.js` の `pickTributes` と同じ作法。場を離れた後では現在 ATK 等が取れない。identity は uid）
- `NORMAL_SUMMON` の reducer はリリースを行わない（`tributes` / `tributeValue` は記録のみ）ので、二重リリースにはならない
- **ここで `flushDeferredEventsV2()` は呼ばない**。解決中なのでイベントは積むだけにし、チェーン終了後の通常のドレインに任せる
  （正規経路は解決外なので flush するが、ここで呼ぶと解決の中へ再入する）
- `summonMethod` を渡すことで `applyNormalSummonMethod` が働く（《神獣王バルバロス》を 3 体リリースで召喚した場合の攻撃力など）

変更は `cards/00_generic_core.js` だけ。エンジンには手を入れていない。

## 4. 試験

`tools/test_s03_u487_blood_offering_normal_summon.js`（**32 PASS / 0 FAIL**）。`tools/check.py` と `tools/script_coverage.py` に配線済み。
全ケース Replay 監査つき。

- **A1**: 《血の代償》で《E・HERO エアーマン》を召喚（相手は前のターンに伏せた《奈落の落とし穴》）
  → `onNormalSummon` 発火 / `summonFast` の POINT が作られる / エアーマンがデッキから手札に加える / **相手の奈落で除外される** / LP −500
- **A2（対照）**: 同じ盤面を普通の通常召喚で行い、**A1 と誘発・応答・最終的な置き場所が一致する**ことを固定
- **B**: 「通常召喚扱い」であることの固定 — `specialSummoned` が立たない / `ssHistory` に載らない /
  `normalSummonSuccessS03` が立つ / `summonedTurn` が付く / P3 の召喚由来が `normal` / **通常召喚権を消費しない**（裁定 10/7/19）
- **C**: アドバンス召喚（《サイバー・ドラゴン》＋リリース1体）— リリースが効果処理の段階で行われ、
  `tributeCount` / `tributeValue` / `normalSummonMethod` が記録され、P3 の召喚由来が `tribute` で素材が uid で辿れ、
  **リリース前のスナップショット**（場を離れた後では取れない値）が残る
- **D（negative control）**: 修正前の実装（raw `FX_SPECIAL_SUMMON`）を実行時に入れ直すと、
  `onNormalSummon` が発火せず / POINT も作られず / エアーマンの誘発が起きず / 相手の奈落も発動できず（場に残る）/ 特殊召喚扱いになる

### 既存試験への影響（期待値の緩和ではない）

`tools/test_s03_u486_summon_timing_window_close.js` の A・C は、《血の代償》を
「召喚成功の POINT が作られない実在経路」として使っていた。U487 でその経路に POINT が作られるようになったため、
**同じ性質が残っている実在経路《降霊の儀式》へ fixture を差し替えた**。判定の内容・強さは変えていない
（むしろ「作られた POINT」を数えるように計測を正確化した。以前は「開いた窓」を数えており、
  応答できるカードが無い盤面では「作られていない」ことを示せていなかった）。U486 の negative control も成立したままである。

### 関連テスト（期待値の変更なし）

U104 12/0、U105 8/0、U77 13/0、U476 168/0、U486 20/0、U484 56/0、U42 13/0、`test_summon_timing` 4/0。

### 全体ゲート

`GATE_EXIT=0`、**24471 PASS**、`^FAIL` 0、Traceback 0、ReferenceError 0、最終行は所定の PASS 行。
算術 24471 = 24439（U486 時点）+ 32。TypeError 1 件は `test_auto_cycle32` の既知（基点にも存在）。
U486 時点のログとの PASS ラベル差分を取り、増えた 34 件 / 減った 2 件の内訳が
「本単位の新規試験 32 件」＋「U486 試験の差し替えた 2 ラベル（±2 で相殺）」であることを確認した
（他の試験の件数は 1 件も変わっていない）。

## 5. 同じクラスの未修正経路（本単位では直していない）

`cards/` 内の raw 召喚 Action を走査した結果:

| 箇所 | 状態 |
|---|---|
| `cards/00_generic_core.js`（血の代償） | **本単位で修正** |
| `cards/HZK_claude_s03_u164_dual_summoner.js`（デュアル・サモナー） | 既に正規経路（`NORMAL_SUMMON` + `onNormalSummon`）。《血の代償》が例外だった |
| `cards/39_1103_expansion_v380b.js`（**降霊の儀式**） | **同じ欠陥。未修正** — 墓地から raw `FX_SPECIAL_SUMMON` で蘇生し、`onSpecialSummon` が発火しない。実測: モンスターは場に出るが POINT も作られず、相手の《奈落の落とし穴》が応答できない（本来は除外されるはずが場に残る） |
| `cards/40_auto_interpreter.js`、`cards/HD_claude_s03_u53_instant_fusion.js`（簡易融合） | `FX_EX_SUMMON` 経由。未確認 |

《降霊の儀式》は、U486 の試験が「既存の閉じ手が働かない実在経路」として使っている経路でもある。
次単位の候補として、この raw `FX_SPECIAL_SUMMON` 群を正規経路（`API.specialSummon` 等）へ寄せる作業が残る。

## 6. その他の未解決

1. **U486 の残課題**: 保存・再開を毎停止点で往復させるモードでの `timingWindow` 不一致（同 seed turn 6 に 6 件）。
   `docs/S03_U486_REPORT.md` の 5 に計測と再現手順がある
2. 当時裁定の「チェーン2以上で行い、召喚の後に別の処理がある場合はタイミングを逃す」は、
   本単位では実装していない（エンジンの遅延イベントの仕組みに任せており、他の解決時召喚と同じ扱い）
