# Codex takeover — 2026-11-05

Claude 制限中の開発引継ぎ。Claude の記録はそのまま保存し、この記録を追加。

- 作業ブランチ: `codex/battle-u510`
- 作業フォルダ: `worktrees/codex-u510/battle-dev`
- 引継ぎ基点: `d15f2597341cc2832fba931f1a885c4d0a7cebbd`（U509）
- Claude の U497〜U509 の13コミットを含む先端から分岐し、上記 Codex ブランチに push 済み。
  `origin/claude/work` を更新したという意味ではない。
- 基点の GitHub 全体検証: run `41935133683` 成功、25454 PASS / 0 FAIL。
- 引継ぎ時の `worktrees/claude` は clean。Claude の設定・CLAUDE.md・作業ツリーには書き込まない。
- U510 の実装・検証は `docs/S03_U510_REPORT.md`。
- U510 実装 commit: `5cce4ab93573e4a769bfe1bf17008bff29f7822e`、通常 push 成功。
  その後の文書のみの補足も含め、取り込み対象は `origin/codex/battle-u510` の先端。
- U510 の事前検証: 専用41を含む関連436 + 境界52 PASS / 0 FAIL。
  完了スクリプトの AsyncGate で commit/push 後、必ずその SHA の全体CIを確認する。
- main 統合・サイト公開は今回の作業として実施していない。

Claude 再開時はこのブランチの最終 commit / CI を確認してから取り込む。
旧 `claude/work` で同じ未対応課題を並行修正しない。取り込みには通常の merge / fast-forward を使い、
未コミット変更の上書き・force push・hard reset は禁止。

## Claude への再開手順

1. `worktrees/claude/battle-dev` で既存の CLAUDE.md / AGENTS.md / battle-dev スキルを読み、
   `git status --short --branch` と HEAD を確認する。想定ブランチは `claude/work`。
2. `git fetch origin` の後、`git log --oneline HEAD..origin/codex/battle-u510` と
   `git diff --stat HEAD..origin/codex/battle-u510` を確認する。
3. ツリーが clean で、HEAD が Codex 先端の祖先であれば
   `git merge --ff-only origin/codex/battle-u510` で引き継ぐ。
   分岐・未保存変更があれば、上書きせず差分を確認する。
4. この記録と `docs/S03_U510_REPORT.md` を読む。
   引き継いだ SHA の GitHub `verify-battle` を確認。既存の成功結果がある同じ版で
   全体ゲートを重複実行する必要はない。失敗・未完了なら成功とは扱わない。
5. 通常の `git push origin claude/work` で引き継いだ履歴を共有できる。
   Codex の作業ブランチ・worktree は変更しない。

U510 を区切りとして Codex の開発は停止する。次の単位を始めていない。
残件は報告書の一覧を正とし、まず狭い実経路で再現してから修正する。
`byPlayer` 補完は相手による破壊の当時根拠を確認してから、U508 の同時処理・
シンクロ召喚無効は別単位として扱う。共通エンジン全体が完成したとは扱わない。
本ブランチの成功はサイト公開を意味しない。main 統合・公開は別工程。
