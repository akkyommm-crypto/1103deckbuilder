# Codex takeover — 2026-11-08（S03-U542 から）

Claude の週次上限が残り少ないため、次の単位（S03-U542）から Codex に引き継ぐ。
Claude の記録は消さずにこの記録を追加する。Claude の worktree・設定・CLAUDE.md には書き込まない。

## 1. 引継ぎ基点

- 引継ぎ基点: **`099cbb8af88316122fc205206fb6c78dcdf573f8`**（S03-U541）= `origin/claude/work` の先端。
- 作業ブランチ: この SHA から `codex/battle-u542`（または `codex/*`）を切って作業する。
  `claude/work` には書き込まない。`main` へ直接 push しない。
- 引継ぎ時の `worktrees/claude` は clean（未コミットの変更なし）。
- ローカル全体ゲート: U539〜U541 をまとめた最終状態で 1 回、`GATE_VERIFY OK` / **26063 PASS / FAIL 0**
  （`python -I tools/check.py` 37.4 分）。
- **GitHub の `verify-battle` は U536〜U541 の各 SHA について未確認**。取り込む前に `099cbb8a` の
  CI 結果を確認する。失敗・未完了なら成功として扱わない。
- main 統合・サイト公開は未実施（別工程）。

## 2. 現在の実装率（`data/script_coverage.json`）

DB 4996 枚。スクリプト不要（GENERIC_OK）644。

- 作業対象（未実装・部分実装）: **709**
  = NOT_STARTED 351 / ENGINE_GAP 344 / PARTIAL 12 / IMPLEMENTED 2
- TESTED 3643。
- サンプルデッキ（`data/80_test_decks.js` の 87 種）の未実装は **0 枚**（S03-U517 で確認済み。再確認不要）。

## 3. ユーザー指示（2026-11-07 時点。これを守る）

1. 1103 対象カードの**実装率 100%** を目指す。優先度: ①サンプルデッキ（済）→ ②その他の未実装・部分実装
   → ③特殊裁定の精密化。
2. **既存の共通処理で実装できるカードを優先**し、**同じ仕組みのカードはまとめて 1 単位**にする。
3. 各カードの**専用テストと negative control はその場で**行う。
4. **ローカル全体ゲートは原則 3 単位をまとめた最終状態で 1 回**。途中で全体ゲートが必要になった場合だけ、
   その理由を報告書とコミットメッセージに記録する。
5. 3 単位ごとに「要対応が何枚減ったか」「全体ゲートを何回・何分回したか」を報告してから次へ進む。
6. 登録だけ・空実装・手動対応は実装済みに数えない。分類やテストを緩めない。
7. engine を直すのは、カード実装を妨げる・対戦が止まる・状態が壊れる・保存/Replay が一致しない場合だけ。
   それ以外で気づいた点は報告書の「未対応・後続課題」に記録する。
8. 報告は日本語。コミットメッセージ末尾は `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
   （Codex 自身の規約があればそちらに従う）。

## 4. 1 単位の手順（U536〜U541 で実際に回した形）

1. 候補を選ぶ: `data/script_coverage.json` の NOT_STARTED から、既存の共通処理に乗るものを
   同じ仕組みでまとめる（装備・ユニオン・LV・融合魔法など）。
2. **当時裁定を全部読む**: `worktrees/codex-rulings/wiki-rulings.js`（2011-08-31 以前）をカード名で引く。
   問い文中の `《…》` でも引く。0 件なら「当時の根拠なし」と報告書に書く。
   現行 Q&A は同フォルダの `official-current.js`（`retro1103` の `class` が C 推定なら、その旨を書く）。
3. 実装: `cards/HZZZZZZZZZZZZ?_claude_s03_u5NN_*.js` を新規作成し、**カード冒頭に裁定 ID と根拠**を書く。
   `build_manifest.json` に 1 行追加（`cards/40_auto_interpreter.js` より前）。
4. テスト: `tools/test_s03_u5NN_*.js`。`tools/astra_harness.js` の `harness(body,{expect:N})`。
   盤面の作り込みは **`baselineA()` の前**。Action が 0 件の場面は Replay 監査に出さない。
   各場面の最後に Replay 監査（`v41ReplayPackage` → `v44ReplayAuditPackage` → `v41StateDigest` 比較）。
5. 登録: `tools/check.py` に 1 行、`tools/script_coverage.py` のテスト→カード名表に 1 件。
6. 区分の申告: `data/s03_status_changes.json` に `{name,from,to,unit,tests,evidence}` を追加し、
   `python -I tools/s03_status_audit.py` が通ることを確認（未申告だと落ちる）。
7. 報告書: `docs/S03_U5NN_REPORT.md`（裁定→実装の対応、測った場面、未対応・未確定、実装率の増減）。
8. ビルド: `python -I tools/build.py`。3 単位目だけ全体ゲート →
   `python -I tools/check.py > LOG 2>&1` の後に **必ず** `python -I tools/gate_verify.py LOG`
   （バックグラウンドの exit code は判定に使えない）。
9. コミット: ルートの `battle.html` を `battle-dev/dist/battle.html` で上書きしてから
   `scripts/finish-work.ps1 -Message $msg -AsyncGate`（`-AsyncGate` は quick ゲート）。
   `-Message` に二重引用符を入れない（`Get-Content -Raw -Encoding utf8` で渡す）。

## 5. つまずきやすい点（この数単位で実際に踏んだもの）

- **母集団の件数のテスト**: 召喚・反転の `passive` を持つスクリプトが増えると
  `test_s03_u484` / `u493` / `u494` / `u495` / `u496` の 5 本が落ちる。
  **数え方は変えず期待値だけ**を直す（U536/U538 ではカード 523→525・強制 260→262、
  組 680→682・強制 321→323）。ラベルの「S03-U… で各 1 枚増」にも単位名を足す。
- **`baselineA()` の後に盤面を触ると Replay の digest が合わない**。手札・セットカードの配置も前で行う。
- **`duelActivateFromZone(p,zone,i,{v4EffectKey})` は、その効果の条件を再判定しない**
  （`strictScriptLegalityV2` も同様）。「1ターンに1度」等は**条件関数そのもの**を呼んで測る
  （`makeContext(p,card,zone,index,'legalCheck',{v4EffectKey})` → `effect.condition(ctx)`）。
- 儀式魔法は**魔法＆罠ゾーンから**発動する（手札からは発動できない）。
- `summonProcedure` の `positions` が 2 通りのカードは `runSummonProcedure` が UI を開くので、
  テストでは `finishSummonProcedure(name,p,zone,index,'atk')` を呼ぶ。
- シンクロ・融合モンスターを手札に戻す効果は **EX デッキ**へ戻る（`zone==='ex'`）。
- 装備カード扱いにしたモンスターは engine がゾーン移動で**表側**にする。裏側のまま装備する裁定は
  S03-U528/U539/U540/U541 の既知の限界として記録済み（印で代用）。
- `engine/40_legal_script_engine.js` ほか一部ファイルは **CRLF**。行ベースで直すか、改行を保って書く。
- Bash のヒアドキュメントでバックスラッシュや一部の日本語が壊れることがある。patch スクリプトは
  ファイルに書いて `python -I` で実行する。

## 6. 次の候補（下調べ済み。U542 以降）

いずれも「モンスター／装備魔法を装備カード扱いにして自分を強化する」系で、共通処理は揃っている
（`API.equipMonster(..., {sourceUidS03})`・`equipHostSubstituteS03`（強制）・
`equipHostSubstituteOptionalS03`（任意、S03-U541 で追加）・`equipSubstituteOptionalS03`（装備カード側）・
`declareAttackLockS03`・`summonProcedure`・`u539EquippedS03`）。

- 《パワー・ツール・ドラゴン》＋《パワー・ブレイク》: ドラゴン側は「装備魔法カードを 1 枚墓地へ送る」
  任意の身代わりなので、`equipHostSubstituteOptionalS03` を**装備魔法カード（破壊ではなく墓地送り）**に
  広げる必要がある。デッキから 3 枚見せて相手がランダムに 1 枚選ぶ処理も必要。
- 《コアキメイル・ウォーアームズ》: 墓地のレベル3以下の戦士族を装備（攻撃力は装備したものの半分）、
  強制の身代わり、エンドフェイズ毎の鋼核の維持コスト（`v57CoreInHand` 等の既存処理あり）。
- 《スーパービークロイド－ステルス・ユニオン》: 機械族以外を装備、全体攻撃、攻撃時に元々の攻撃力が半分。
- 《D－HERO Bloo－D》: 相手の表側表示モンスターの効果を全て無効（重い永続）＋装備＋攻撃力半分加算。
- 《ヴァイロン》系（スフィア・テトラ・シグマ・アルファ・ポリトープ・オメガ）: 装備魔法との連携。
- 後回しのまま（共通処理が無い）: 《脳開発研究所》（LP コストの置換）、
  《アルカナフォースXXI》（ターンスキップ）、《セイヴァー・スター・ドラゴン》、《イクイップ・シュート》、
  《ヴィシャス・クロー》、《シンクロ・マテリアル》、《平行世界融合》。

## 7. 禁止事項（共有ルール）

- force push / hard reset / 共有履歴の squash・rebase / `main` への直接 push は禁止。
- 他エージェントのブランチ・worktree を削除・変更しない。`worktrees/codex*`・`repo-main`・
  裁定 DB（`worktrees/codex-rulings`）・デッキビルダー（ルートの `index.html` 等）は編集しない。
- テストを削除したり期待値を緩めて通さない。
- 「正しい」「安全」と断定しない。不明点は「未確定」と記録する。

## 8. Claude 再開時

1. `git fetch origin` → `git log --oneline HEAD..origin/codex/battle-u542` と
   `git diff --stat` を確認。
2. ツリーが clean で HEAD が Codex 先端の祖先なら `git merge --ff-only origin/codex/battle-u542`。
   分岐していたら上書きせず差分を確認する。
3. 取り込んだ SHA の GitHub `verify-battle` を確認する。同じ版で成功している全体ゲートは再実行しない。
4. `handoffs/CLAUDE_START_HERE.md`（リポジトリ外）と Codex の報告書を読んでから次の単位に入る。
