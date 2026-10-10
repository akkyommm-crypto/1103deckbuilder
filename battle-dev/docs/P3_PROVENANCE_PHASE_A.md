# P3 Provenance 第1弾 — **P3 READY FOR MERGE**

作業コピー: `work/1103_duel_v48_claude_p3`（Codex live tree には一切書き込んでいない）
基準: 2676 PASS / 0 FAIL → **2843 PASS / 0 FAIL**
（+107 P3共通テスト / +60 P3カードテスト。既存2676件は増減なし・全PASS）
※ 統合前レビューで指摘された「古いイベント情報の残留」を検証し、実欠陥2件を修正済み（下記 §7）。

## 1. 実装した3系統（承認範囲のみ）

| 系統 | 保存先 | 形 |
|---|---|---|
| summon provenance | `card.summonProvenance` / 素材側 `card.usedAsMaterial` | `{summonType, materialRefs:[uid], materialSnapshots:[snap]}` |
| cost snapshot | チェーンリンクの `link.costSnapshots` | `[snap]` |
| move provenance | `card.moveProvenance` | `{reason, actingPlayer, fromZone}` |

`snap` = `snapshotCardV3(card, fields)` の疎な結果。`uid` と `code` は identity なので常に入り、
それ以外は呼び出し側が明示した項目だけ入る。カード名は一切入らない。

destruction provenance / damage provenance / event bus / delayed scheduler /
ActivationContext / Battle / ContinuousRule / Token は**実装していない**。

## 2. 変更ファイル（差分行数）

| ファイル | 行 | 内容 |
|---|---:|---|
| `engine/12_provenance_v3.js` | 244 (新規) | schema・helper・reader・効果コンテキスト・直列化検査 |
| `engine/00_state_actions.js` | 52 | 付与ヘルパ2本 + NORMAL_SUMMON / FX_TO_GRAVE / FX_DISCARD / FX_MILL / FX_MILL_TOP / FX_HAND_SEND_GRAVE / CHAIN_ADD / newGame |
| `engine/40_legal_script_engine.js` | 53 | カードスクリプト向け API 8本 + `runScript` での効果コンテキスト開閉 |
| `engine/70_summon_procedures.js` | 16 | `pickTributes` でリリース**前**に snapshot、`payment.p3Materials` を NORMAL_SUMMON へ |
| `engine/06_replay_rng_v41.js` | 7 | digest に条件付きで追記 |
| `engine/30_processor_chain_battle.js` | 6 | コスト前に buffer 初期化、`finishPrepare` で CHAIN_ADD へ引き渡し |
| `runtime/50_actions_save.js` | 3 | `act()` で移動 Action へ provenance を焼き込む |
| `build_manifest.json` | 6 | `engine/12` と `cards/88` を登録 |
| `tools/check.py` | 2 | P3テスト2本を regression に追加 |
| `tools/script_coverage.py` | 1 | `test_p3_provenance.js` を「カード個別テスト検出」から除外 |
| `cards/88_p3_provenance_recovery.js` | 161 (新規) | PHASE B の11枚 |
| `tools/test_p3_provenance.js` | 403 (新規) | 81 assertion |
| `tools/test_p3_provenance_cards.js` | 183 (新規) | 51 assertion |
| `docs/P3_PROVENANCE_PHASE_A.md` | 93 (新規) | この文書 |

`cards/` の既存ファイル、`data/script_status_overrides.json`、`data/script_coverage.json`、
`data/next_script_batch.json`、`docs/NEXT_SCRIPT_BATCH.md`、`docs/CODEX_CURRENT_TASK.md`、
`docs/SCRIPT_COVERAGE.md` はバイト単位で無変更（確認済み）。全ファイル LF 維持。

## 3. 制約の遵守状況

- **既存フィールドの意味を変更していない。** `discardInfo.byPlayer`（＝捨てさせた側）は
  従来の意味のまま触っていない。`moveProvenance.actingPlayer` は別フィールドとして併設し、
  discardInfo が存在しないデッキ・フィールドからの移動にも付く点だけが違う。
  `v380SummonMaterials` / `tributeCount` / `tributeValue` / `graveInfo` / `banishInfo` も置換していない。
- **provenance の無い既存 Action は digest を変えない。** `v41CardDigest` の固定キー配列末尾に
  3キーを追加したが `card[k]!=null` のときだけ載る。`v41StateDigestText` の `P3C` セグメントも
  `costSnapshots` が非空のチェーンリンクが存在するときだけ追記する。
  → テストで「provenance 無し局面の digest 文字列に P3C が出ない」「provenance を外すと
  カード digest が元の文字列に完全一致で戻る」を確認済み。
- **identity は uid / passcode。** snapshot にカード名は入らない（テストで JSON 内に
  カード名が現れないことを assertion 化）。配列 index も authority にしていない。
- **JSON のみ。** function / Promise / Map / DOM を保持しない。
  `assertProvenanceSerializableV3` と gameState 全体の関数スキャンで検証。
- **gameState に無制限の履歴を作らない。** 情報はカード上とチェーンリンク上に置く。
  一時 buffer は `gs.pendingCostSnapshots` 1本だけで、CHAIN_ADD が消費して空に戻す。
- **`onDiscard` / `onSendToGrave` の発火条件は変更していない。**

## 4. 設計判断（レビュー対象）

**(a) セットは召喚ではない。**
アドバンスセットのリリースに対して `summonProvenance` も `usedAsMaterial` も付けない。
付けてしまうと「アドバンス召喚のためにリリースされた」を条件にするカードが
アドバンスセットで誤誘発する。リリースされた事実自体は
`moveProvenance{reason:'tribute'}` 側に残るので情報は失われない。

**(b) snapshot はリリース前に取る。**
`pickTributes` は `FX_TO_GRAVE` の**前**に snapshot を作り `payment.p3Materials` へ載せる。
場を離れた後では継続効果込みの現在ATKが取得できないため。

**(c) 現在値と元々の値を分離。**
`snapshotCardV3(card,['atk'])` は継続効果・mods 込みの現在値、
`snapshotCardV3(card,['originalAtk'])` と `snapshotOriginalCardV3` は「元々の数値」
（`procedureBaseStats` と `setBase` 継続層まで、一時修正は含めない）。
バーストブレス／モームは前者、ガーゼット2種は後者を使う。

**(d) 未知 reason は `effect` へ正規化。**
不正値でスキーマが壊れないようにするため。許可値は
`cost / effect / rule / battle / tribute / material` の6つだけ。

## 5. カードスクリプト向け API（`engine/40_legal_script_engine.js`）

```
API.recordCostSnapshot(card, fields)     コスト支払い時の値を記録
API.costSnapshots(ctx)                   そのチェーンリンクのコスト snapshot
API.summonProvenance(card)               召喚由来
API.materialSnapshots(card)              素材の snapshot 一覧
API.usedAsMaterial(card, summonType)     素材として使われたか
API.moveProvenance(card)                 移動由来
API.movedByOpponentEffect(card, me)      相手の効果で動かされたか
```

## 6. PHASE A の結果

全回帰 PASS（この時点で 2743 PASS / 0 FAIL）。PHASE B へ進んだ。

---

# PHASE B — provenance で解消した11枚

`cards/88_p3_provenance_recovery.js`（161行・新規）。カード名で分岐する処理は書いていない。
テストは `tools/test_p3_provenance_cards.js`（51 assertion、全カードに positive と negative）。

| カード | 使った由来情報 |
|---|---|
| カイザー・サクリファイス | `usedAsMaterial.summonedUid` と召喚されたモンスターの uid が一致するか |
| ゾルガ | 同上 |
| 偉大魔獣 ガーゼット | `materialSnapshots[0].originalAtk × 2` |
| 合成魔獣 ガーゼット | `materialSnapshots[0..1].originalAtk` の合計 |
| 疾風鳥人ジョー | `materialSnapshots.some(attribute==='風')` |
| バーストブレス | リリース時の `costSnapshots[0].atk` |
| モーム | 同上（自身をリリースできる） |
| エレクトリック・スネーク | `movedByOpponentEffect` + `graveInfo.from==='hand'` |
| 再生ミイラ | 同上 |
| 闇よりの恐怖 | `movedByOpponentEffect` + `graveInfo.from` が hand / deck |
| 闇より出でし絶望 | 同上 |

## 実装しなかった1枚

**ナチュル・ラグウィード は ENGINE_GAP のまま残した。**
テキストは「相手がドローフェイズ以外でカードをドローした時、フィールド上のこのカードを
墓地へ送って発動できる。デッキからカードを2枚ドローする」で、由来metadataを一切必要としない。
P3単独解消候補として数えたのは私の分類誤りで、実際は provenance とは無関係の
通常のカード実装（Codex側の担当範囲）。勝手に実装せず、bulk reclassify もしていない。

## PHASE A の設計を1点だけ拡張した

**provenance の自動付与**（`p3StampMoveProvenanceV3`）。
当初の設計はカードスクリプトが `p3:{...}` を明示的に渡す opt-in 方式だったが、
それでは「相手のカードの効果によって墓地へ送られた」系の4枚が成立しない。
既存の押収・墓穴の道連れ等は `p3` を渡さないし、それらを書き換えるのは私の担当範囲外のため。

そこで `runScript` が解決中の効果のコントローラを保持し、`act()` が Journal へ入れる**前**に
移動 Action へ `p3` を焼き込むようにした。対象は
`FX_TO_GRAVE / FX_DISCARD / FX_MILL / FX_MILL_TOP / FX_HAND_SEND_GRAVE` の5種。

- 既存カードスクリプトは1行も変更していない。
- 隠れた global に依存しない。provenance は Action に載って Journal に残るので、
  再生は Journal だけで完全に決まる（テストで Journal 内の `action.p3` と
  replay digest 一致を確認済み）。
- 明示的に `p3` を渡した Action は上書きしない。
- 効果解決中でなければ何も付けない（ルール処理による移動には provenance が付かない）。

`originalAtk` / `originalDef` を snapshot の指定可能フィールドに追加した。
ガーゼット2種が「元々の攻撃力」を必要とするため。`procedureBaseStats`（妥協召喚などが
変える元々の数値）と `setBase` 継続層まで反映し、オネスト等の一時修正は含めない。

`API.costSnapshots` はチェーンリンクに無ければ支払いバッファを見る。
チェーンに乗らない発動でも自分の払ったコストを読めるようにするため。
バッファは `runScript` 開始時と発動準備時に毎回空にするので、別の効果のコストは混ざらない。

## coverage について

`data/script_coverage.json` と `docs/SCRIPT_COVERAGE.md` は check.py が再生成するが、
**両方とも元の内容へ戻してある**（私は読むだけの約束のため）。統合後に Codex 側で再生成してほしい。
再生成すると registration 名が 1067 → 1078 に増える。status は
`data/script_status_overrides.json` が優先されるため、11枚を ENGINE_GAP から外すかどうかは
Codex の判断に委ねる（私は overrides を触っていない）。

なお、テストの小道具に使うカードは coverage を動かさないよう TESTED 済みのものだけを選んだ
（`聖なるバリア －ミラーフォース－` が IMPLEMENTED → TESTED へ誤昇格するのを確認したため
`くず鉄のかかし` へ差し替えた）。共通テスト `tools/test_p3_provenance.js` の方は
カード実装テストではないので `tools/script_coverage.py` の除外リストへ追加した。

## 最終確認

- `python tools/check.py` → **2808 PASS / 0 FAIL**
- `python tools/build_acode.py data/carddata.json` → **cards=4996**
- 保護対象ファイル（`cards/` 既存・`data/script_status_overrides.json`・
  `data/script_coverage.json`・`data/next_script_batch.json`・`docs/NEXT_SCRIPT_BATCH.md`・
  `docs/CODEX_CURRENT_TASK.md`・`docs/SCRIPT_COVERAGE.md`）はバイト単位で無変更
- 全ファイル LF 維持
- batch041 には着手していない


---

# 7. 統合前レビュー対応 — 由来情報の鮮度・世代検証

指摘された4項目を実機テストしました。**うち2項目で実欠陥を検出し、修正しました。**
テストは `tools/test_p3_provenance.js` の §10（27 assertion）と
`tools/test_p3_provenance_cards.js` の実カード検証（9 assertion）です。

## 7-1. 検出した欠陥①: 由来metadataが領域ローカルでなかった

**症状（修正前に実際にFAILした内容）**

| テスト | 修正前の結果 |
|---|---|
| 場を離れたら召喚由来は残らない | FAIL — `{summonType:'tribute', materialRefs:[...]}` が残存 |
| 特殊召喚後に古い素材情報を参照しない | FAIL — 蘇生後も素材snapshotが読めた |
| 手札へ戻った後に古い「相手の効果」が残らない | FAIL — `{reason:'effect',actingPlayer:1,fromZone:'hand'}` が残存 |
| ルール処理の移動を「相手の効果」と誤認しない | FAIL |
| 除外された後に古い手札由来を今回の移動として使えない | FAIL |

実害の例:
- **偉大魔獣 ガーゼット** … アドバンス召喚でATK3800 → 破壊 → 蘇生した後も **3800のまま**だった。
  正しくは素材情報が無いので0。
- **エレクトリック・スネーク / 再生ミイラ / 闇よりの恐怖 / 闇より出でし絶望** …
  相手の効果で捨てられた後に手札へ戻り、**ルール処理**（手札制限など）で墓地へ送られても
  「相手の効果で送られた」と判定され、誤誘発していた。

**原因**

`ZONE_LOCAL_KEYS`（`reset(card)` が落とすキー一覧）に P3 の3キーが入っていなかった。
`v380SummonMaterials` は既にこの一覧に入っており、そちらに揃っていなかったのが漏れです。

**修正**（`engine/00_state_actions.js`、3語の追加）

```
'summonProvenance','moveProvenance','usedAsMaterial',
```

`pushZone` → `reset` → その後に `applyMoveProvenanceP3` が新しい値を書く順序なので、
今回の移動の provenance は消えません。場・墓地を移った時点で古い由来だけが落ちます。

## 7-2. 検出した欠陥②: usedAsMaterial に世代が無かった

**症状**

`usedAsMaterial.summonedUid === summoned.uid` の比較では世代を区別できません。
uid は「どのカード実体か」しか表さないためです。テストで次を確認しました。

```
P3 世代: uid一致だけでは世代を区別できないことを確認
  → aStale.usedAsMaterial.summonedUid === secondX.uid が true
```

実害: **ゾルガ**は素材にされた後も墓地に残るため、同じモンスターが
（別の素材で）再びアドバンス召喚されると **2回目でも2000回復してしまう**状態でした。

**修正**（Replay-safe、mutable array index 不使用）

`gameState.summonSeq` を新設し、召喚1回ごとに採番します。既存の `chainSeq` と同じ方式です。

- `summonProvenance.summonInstance` … その召喚の通し番号
- `usedAsMaterial.summonInstance` … 素材側にも同じ番号を書く
- 新API `API.usedAsMaterialFor(material, summoned, summonType)` が両者の番号一致で判定

Replay 安全性: カウンタは gameState 上にあり applyAction 内で加算されるので、
再生でも Undo/Redo でも決定的に復元されます。値は整数のみで、配列 index も参照も持ちません。

修正後、カードレベルで次を確認:

```
PASS ゾルガ 1回目: 自身を素材にした召喚で誘発する
PASS ゾルガ 2回目: 同じuidのモンスターの再召喚では誘発しない（古い世代）
     usedAsMaterial{summonInstance:1} vs summonProvenance{summonInstance:2}
PASS ゾルガ 2回目: 今回の素材Bの方は誘発条件を満たす
PASS 偉大魔獣 ガーゼット: 蘇生後は古い素材情報を使わず0に戻る（3800 → 0）
PASS エレクトリック・スネーク 2回目: ルール処理では古い「相手の効果」で誘発しない
PASS 再生ミイラ 2回目: 自分の効果では古い記録で誘発しない
```

## 7-3. 欠陥が無かった項目

**cost snapshot buffer** … 7 assertion 全てPASS、修正不要でした。

- 正常な CHAIN_ADD 後 → バッファ空、リンク側にのみ残る
- 発動を中断／失敗した場合 → 次の発動準備（`prepareDuelActivation`）と
  次のスクリプト開始（`runScript`）の両方が必ず初期化するため漏れない
- チェーンに乗らない発動後 → 同上
- 別効果の costSnapshots を参照しないことをテストで確認

## 7-4. schema と digest への影響

**schema 追加は2フィールドだけです。**

| フィールド | 型 | 場所 |
|---|---|---|
| `summonProvenance.summonInstance` | 整数 | 召喚されたカード |
| `usedAsMaterial.summonInstance` | 整数 | 素材にされたカード |
| `gameState.summonSeq` | 整数 | gameState（`chainSeq` と同格） |

**digest への影響**

- provenance を持たないカード・局面の digest は**バイト単位で不変**です
  （`v41CardDigest` は `card[k]!=null` のときだけ載せるため）。テストで確認済み:
  「provenance が無いカードの digest に新キーが出ない」「provenance を外すと元の digest 文字列に完全一致で戻る」。
- provenance を持つカードの digest には `summonInstance` が1整数分増えます。
  ただしこの状態は今回の P3 で初めて生まれるものなので、**既存の Replay パッケージには影響しません**。
- `gameState.summonSeq` は state digest には入れていません（既存の `chainSeq` と同じ扱い）。
  世代の食い違いは card digest 側の `summonInstance` で検出されます。
- 由来情報が領域ローカルになったことで、**カードが場を離れた後の digest は修正前より小さくなります**
  （残っていた provenance が消えるため）。これは P3 由来の状態にだけ現れる変化です。

## 7-5. 最終回帰

| 項目 | 結果 |
|---|---|
| `tools/test_p3_provenance.js` | 107 PASS / 0 FAIL |
| `tools/test_p3_provenance_cards.js` | 60 PASS / 0 FAIL |
| `python tools/check.py` | **2843 PASS / 0 FAIL** |
| 既存回帰2676件 | 増減なし・全PASS |
| Replay / Undo / Redo / SaveLoad / Action Journal / digest | 全PASS（§10-5 で世代情報込みの再生一致を確認） |
| `python tools/build_acode.py data/carddata.json` | cards=4996 |

保護対象ファイルはバイト単位で無変更（`cards/` 既存・`script_status_overrides.json`・
`script_coverage.json`・`next_script_batch.json`・`NEXT_SCRIPT_BATCH.md`・
`CODEX_CURRENT_TASK.md`・`SCRIPT_COVERAGE.md`）。全ファイル LF。

## 7-6. 状態

**P3 READY FOR MERGE。**
Codex live tree へは統合していません。batch041 も開始していません。

