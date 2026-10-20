# S03-U456 - Codex CODEX-C03（出所を見る対象耐性）の統合と、解決時に対象耐性が消えるバグの修正

基点: `claude/work` `6e454b4`（U455）。Sonnet 5.5、単一writer。Opus の統合ドライラン（別の使い捨てworktree）の手順をそのまま適用した。

## バグ（実測済み）
- `cards/HZZZZZZZZN_claude_s03_u378_targetlocks.js` の `u378Source()` は `ACTIVATION_PREP_S03` がある間しか効果の出所を返さない。
- `engine/30_processor_chain_battle.js:1464`（S03-U35「チェーンに乗った」）が発動がチェーンに乗った時点でそれを消すため、**解決時に対象を選ぶ効果では出所が失われ、対象耐性が黙って外れる**。
- 実測（`filterTargetable`）: 発動準備中は保護対象が除外される（kept=0）が、準備を消した解決時は再び候補に出る（kept=1）。
- 影響カード（同じ `u378Source()` を使う3枚）: 氷結界の御庭番（U439）、ヴァイロン・セグメント（U378）、闇の侯爵ベリアル（U378）。
- 解決時の対象選択は本コードベースの主流（`resolve`/`operation` 内に348箇所・193ファイル）なので、実戦で到達する。

## `ce361fa`（CODEX-C03）から取ったもの
- `engine/1ZZR_target_source_s03.js`（新規）。`build_manifest.json` には `engine/1ZZQ_attack_cost_s03.js` の直後に登録。
- エンジン差分4ファイル（すべて `git apply --3way` で衝突なし。追加的で後方互換）:
  - `00_state_actions.js`: `targetImmune(card, effectInfo)`、`filterTargetable(cands, byPlayer, effectInfo)`。`immuneToTarget` が省略可能な第3引数を受け取る。
  - `12_provenance_v3.js`: `p3BeginEffectContextV3(player, source, sourceName)`。
  - `30_processor_chain_battle.js`: 解決時に `p3BeginEffectContextV3(link.player, link.uid, link.name)`。
  - `40_legal_script_engine.js`: `runScript` が出所を渡す。`API.targetEffectInfoS03` / `API.targetableCardsS03`。

## 取らなかったもの（理由）
- `cards/I0_codex_c03_target_immunity.js`（登録もしない）: Codex版の氷結界の御庭番。`claude/work` は U439 で実装済みなので `defineScript` が重複し、ゲートが拒否する。
- `tools/test_codex_c03_target_immunity.js`: 上記Codex版カードに対して書かれたテスト。
- `tools/check.py` / `script_coverage.py` のCodex側の行（同上の理由）。

## カード側の修正
- `u378SrcOf(effectInfo)` を `u378Source()` の直前に追加。`filterTargetable()` が1回だけ正規化して第3引数で渡す `effectInfo`（`player!=null && db` を満たすもの）を最優先で使い、無ければ従来の `u378Source()` へフォールバックする。発動準備・チェーン解決・直接 `runScript` の3経路をカバーする。
- 3つの `immuneToTarget(card, self)` を `immuneToTarget(card, self, effectInfo)` に変更し、`u378Source()` を `u378SrcOf(effectInfo)` に置換（`u378_targetlocks.js` に2、`u439_garden_rock.js` に1）。`u378Source()` 本体は不変。
- `u378Source()` 自体を `targetEffectSourceS03()` へ委譲する案も測ったが、候補×永続源ごとに正規化をやり直す上、`targetEffectSourceS03()` が `player:null` のオブジェクトを返すため `player!=null && db` のガードが要る。`filterTargetable` が計算済みの `effectInfo` を使う方が設計として良く、所要時間はどちらも同じ（重い対戦で45〜49秒）。

## テスト
- 新規 `tools/test_s03_u456_target_source.js`: **28 PASS / 0 FAIL**（`check.py` に登録、`script_coverage.py` に3枚を対応付け）。実際の `filterTargetable` 経路で、出所の文脈は `beginActivationPrepS03`（発動準備）と `endActivationPrepS03()` → `p3EndEffectContextV3()` → `p3BeginEffectContextV3()`（解決時）で作る。ヴァイロン・セグメントは実際の `cast` 経路で装備する（`API.equip` では装備が成立しない）。
  - 3枚それぞれ: 発動準備中に保護対象が対象に取れない／**解決時にも取れない（本単位の退行）**／解決時の前提（`ACTIVATION_PREP_S03` が空で旧 `u378Source()` が `null`）。
  - 御庭番: 御庭番自身も保護される、氷結界でないモンスターは守られない、自分の効果・相手の通常モンスター・相手の罠は対象に取れる、御庭番が無ければ取れる。
  - セグメント: 相手の罠と効果モンスターが取れない、相手の魔法・自分の効果・装備されていないモンスター・装備なしの場合は取れる。Replay audit（`count:10`）あり。
  - ベリアル: 相手の魔法と罠が取れない、ベリアル自身は守られない、相手の効果モンスター・自分の効果・ベリアル不在は取れる。
- **Negative control**: `u378SrcOf` のカード側修正だけを戻して再ビルド → **6 FAIL / 22 PASS**（御庭番2、セグメント2、ベリアル2。すべて解決時の主張。準備中の主張・ネガティブは変わらず PASS）。修正を戻すと 28 PASS / 0 FAIL。
- 近接: `u378_targetlocks` 16/0、`u439_garden_rock` 17/0、`u336_elec` 36/0、`u130_polymerization` 24/0、`v670_batch19` 48/0、`u04_lock_recovery` 39/0、`u135_auto_table_filters` 12/0（すべて 0 FAIL）。

## フルゲート（逐次 `python tools/check.py > log 2>&1; rc=$?; echo "GATE_EXIT=$rc" >> log`）
- **21972 PASS = 21944（U455）+ 28**、0 FAIL、0 Traceback / ReferenceError、`GATE_EXIT=0`、最終行 `PASS no duplicate top-level function declarations`。
- `test_s03_u305_ui_harness.js` のタイムアウト（既知の負荷脆弱性）は今回は発生しなかった。
- カバレッジ（変更なし、3枚は既に TESTED）: 前 `{ENGINE_GAP: 344, GENERIC_OK: 644, IMPLEMENTED: 3, NOT_STARTED: 419, PARTIAL: 10, TESTED: 3576}` → 後 同じ。`data/s03_status_changes.json` の宣言は無し（状態変化なし）。
- 生成物（`dist/battle.html`、`dist/battle_acode.html`、`data/script_coverage.json`）は `tools/build.py` / `build_acode.py` / `script_coverage.py` で再生成した。ルート `battle.html` は `finish-work.ps1` が `dist` から同期する。

## 裁定（RULING_UNRESOLVED、変更なし）
- 氷結界の御庭番の「氷結界」判定は印刷名の部分一致（`dbOf(card).n`）。Codex版は正規グループ `GROUP.ICE_BARRIER`。カードテキストは「『氷結界』と名のついた」なので名前一致は忠実だが、名前が別カードとして扱われる場合（`currentNameV17`）の扱いが両者で異なる。ユーザーの裁定待ち。

## Not done / next
- このプリミティブを使う残りの記録済み消費者はまだ未実装: ヴァイロン・エプシロン、オベリスクの巨神兵、ジュラック・タイタン、ターボ・ウォリアー、救世の儀式、機皇城。原始が入ったので通常のカード単位になった。`CLAUDE_RESUME.md` の「OPEN ENGINE ITEM: cannot be targeted」は本統合で解決したので取り消した。
- 他のCodexブランチ7本（`codex/deck-priority-1`、`engine-target-immunity` の残り、`flip-suppress-position`、`invellz-gatekeeper`、`phase-priority`、`rabbit-laggia`、`safe-zone`）は未統合。すべて `0a5866c` から分岐し、エンジン中核と生成物で `claude/work` と重なる。ブランチマージではなく、機能コミットのcherry-pickと生成物の再生成で進める。
- CIのゲート検証手順は `check_parallel.py` の最終行規則（インラインPython検証を先に出し、Node出力を後で再生するため最終行が `PARALLEL_NODE_DONE …` になり、PASS数も異なる）に合わせて更新が必要。CIワークフローは本単位の対象外なので記録のみ。
- 詳細な調査メモ: `docs/CODEX_INTEGRATION_FINDINGS_20261020.md`（Opus、CI並列ゲート・Codex競合・ドライラン）。
