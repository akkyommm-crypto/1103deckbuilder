# CLAUDE_RESUME — 再開の正本 (Claude)

- 2026-10-03: Codexが構成だけ整理。以下の進捗は整理前のClaude記録を保持しており、新たな完了を認定したものではない。
- Writer: Claude (active). One writer at a time. 再開時はCURRENT・実ログ・LATESTを照合する。
- Current clean checkpoint: `checkpoints/checkpoint_claude_s03_u302_u302_batch10_20261010.zip`, SHA256 `a155a07610dc86b0f7a34a5bfe9b9f910565a2f2035b9396a393e96bc4d2d040`, gate 18178 PASS lines / 0 FAIL (`GATE_EXIT=0`) — S03-U302–U302, published 2026-10-10.
- Gate: テスト直後のGATE_EXIT、FAIL/Traceback、対象hashを確認する。末尾echoのexit 0は証拠にしない。
- 整理前の全文・過去の完了履歴: `logs/history/CLAUDE_RESUME_before_quality_update_20261003_193906_edce7e95.md`。通常の再開では全読不要。
- 運用: 共有マスタープロンプト冒頭「TESTED判定と再開メモ」。目安80行・12KB、過去の完了履歴をここへ再転記しない。

## 現在 (current)

<!-- CURRENT:BEGIN -->
- GitHub migration (2026-10-10): the published U302 clean checkpoint was imported byte-for-byte into `battle-dev/`; root `battle.html` now mirrors its verified `dist/battle.html`. The old GitHub artifact was U287. The migration branch must pass a fresh baseline gate before it is proposed to `main`.
- Collaboration: Codex writes `codex/work`; Claude Code writes `claude/work`; `main` is PR-only. Separate Git worktrees are mandatory. Use repository-root `scripts/finish-work.ps1` for test -> commit -> push.
- Preservation note: U303 recorded no source change. The U304 scratch tree was not recovered; its idea (duels with the real UI code) was re-implemented as U305 and is not claimed to reproduce U304 numbers.
- Base (shared clean): S03-U302–U302 checkpoint `a155a076…` (18178 PASS / 0 FAIL), log `coordination/S03_U302_U302_BATCH10_PUBLICATION.md`.
- Batch10: U302 — 霞の谷のファルコン, the attack-declaration cost of returning another own card (engine/1ZZQ). The Pearl / Falcon / 禁じられた聖杯 report was not reproduced (U300, 720+ cases); the Falcon had no script before.
- Priority (user, 2026-10-09):
  - Major-deck duels run start → result without stopping, including save / resume and Replay.
  - Sonnet does normal work. One current tree: `1103_work/s03_u296`.
- Major-deck cards: 215/216 TESTED or GENERIC_OK. ドラゴエクィテス is left NOT_STARTED: effect copy is engine-core work.
- Disk: C: was full (0 bytes free) on 2026-10-10. The scratchpad copies were removed (about 550 MB free). Publishing no longer keeps a local ZIP copy.
- Pipeline scripts are backed up in `1103_work/_pipeline`.
- Open: an LP cost equal to the current LP (`lp > cost` vs U292 `lp >= cost`); 死霊の誘い.
- Open rulings: ゾーン・イーター / 異国の剣士, 終焉のカウントダウン, デルタ・アタッカー (PARTIAL), キャトルミューティレーション, インフェルニティ・デス・ドラゴン on a face-down monster.
- U303 (Sonnet, no change): 13 mirror matches x 4 seed sets = 52 duels clean (incl. save / resume every stop).
- Since the GitHub migration (Sonnet, 2026-10-10..12; one report per unit in `docs/S03_U3NN_REPORT.md`, full previous memo in `coordination/history/CLAUDE_RESUME_before_u312_20261012.md`): U305 `HARNESS_UI=1` real-UI duel sweeps (234 duels clean); U306 オネスト hand cost (responder loop); U307 Gem-Knight duals + P4 GEM / GEMKNIGHT; U308 four direct-attack grant cards + `gameState.battleKillsS03`; U309 / U310 all nine トゥーン monsters (+ `sp.freesZoneS03`); U311 six revival Equip Spells (+ link `banishIfDestroyed`); U312 seven restricted Equip Spells (+ P4 NINJA / VYLON, `equipAttackLockS03`); U313 / U314 Union Monsters: `declareUnionS03` + 15 classic Unions (+ `equipSubstituteS03:'battle'`); U315 three Equip Spells (+ P4 XSABER); U316 Alien A Counter penalty + four cards (+ P4 ALIEN); U317 the last four 六武衆; U318 ダイガスタ ×4 + ガスタの神官 ムスト; U319 five BF (ブリーズ, ガスト, アリゼ, エテジア, ヒレン); U320 six ナチュル (モスキート, ローズウィップ, レディバグ, フライトフライ, スタッグ, ホワイトオーク); U321 six コアキメイル (+ engine: a normal draw now drains the queued onDrawCard events); U322 three アルカナフォース (EMPRESS, TEMPERANCE, LIGHT RULER; + targeting negator unwraps wrapper entries); U323 three サイバー・ダーク (+ engine: equipHostSubstituteS03, mulFinalAtk/Def); U324 three 音響戦士; U325 six ラヴァル (+ engine: destroy substitute kind banishGrave); U326 three ワーム (ソリッド, プリンス, ミリディス); U327 氷結界の封魔団 / 風水師 + 墓守の監視者; U328 five 巨大戦艦; U329 紫炎の参謀 / 寄子 / エニシ + ヴォルカニック・ハンマー; U330 ヴァイロン ステラ / プリズム / ハプト; U331 five ゼンマイ; U332 five スクラップ (スクラップ・ゴーレム: ENGINE_GAP override removed).
- Gate after U332 (expected): 19088 PASS = 19061 + 27; coverage TESTED 3046 / NOT_STARTED 802 / ENGINE_GAP 471.
- DISK: C: hit 0 bytes free on 2026-10-13. 38.7 GB is an old session task-output folder (`%TEMP%claudeC--Users-81806-OneDrive-…a897e0c6…	asks`, 2026-10-10) — NOT deleted, the user decides. Gate runs leave ~7 MB each in %TEMP% (gate log, tmp*.js). Workflow notes: `finish-work.ps1` needs `git checkout -- battle-dev/dist/battle.html` first if `dist` was rebuilt by hand; a card added to a hand after `baselineA()` breaks the Replay audit; unified Equip Spells are offered through `getLegalHandActions`.
- OPEN ENGINE ITEM (needs design, Opus): 「cannot be targeted」 — a central filter on target selection. Consumers (9): ヴァイロン・セグメント, ヴァイロン・エプシロン, オベリスクの巨神兵, ジュラック・タイタン, ターボ・ウォリアー, 救世の儀式, 機皇城, 氷結界の御庭番.
- Unions left (see `docs/S03_U314_REPORT.md`): セコンド・ゴブリン / 守護霊アイリン (position-change allowance), ルナタイト (Spell immunity of the equipped monster), and six 「①:」-wording Unions + ギアフレーム (RULING_UNRESOLVED: the 2011 wording is not confirmed). NEXT: `docs/S03_U316_REPORT.md` "Not done" (Alien: リベンジャー needs an own-field uniqueness rule, ガンギル the Tribute rule …), `docs/S03_U315_REPORT.md` (remaining Equip Spells: markers for 草薙剣 / コアバスター, optional substitutes, バオウ negator), other clusters from the NOT_STARTED survey (counters 46, ライフポイントを払 38, 儀式 15, coin / dice 11), fresh `HARNESS_UI=1` sweeps.
- U304 (Sonnet): sweeps with the real UI code running (`S/harness_ui.js`, `S/harness_ui2.js` browse mode): 338 duels clean, 0 UI exceptions, 0 soft findings. Only `tools/r1_duel_driver.js` changed (keeps the real showToast under `HARNESS_UI`); unpublished, goes into the next batch.
- ドラゴエクィテス effect copy: 124 `CARD_SCRIPTS[...]` lookup sites; it needs both its own and the copied script. Deferred as engine design work.
- Waiting on the user: C: disk space (about 0.5 GB free); the LP cost equal to the current LP (ruling); the auto-resume scheduled task (permission).
<!-- CURRENT:END -->

## User-reported bugs — status

- U114 (saved decks v2, Xyz material choice) and U121 (builder launch flow): **confirmed OK on device by the user (2026-09-26)** — RESOLVED.
- U172 (2026-09-26): Player2 could only start with the sample 兎ラギア — fixed; device copy `acode/battle_acode_s03_u172.html`, awaiting the user's check.
- Optional destruction substitutes: the user decided (2026-09-26) — pause at the destruction and let the player choose; S03-U173.

## Known deferred findings

- Pending engine gaps (not user decisions): The splendid VENUS (negation immunity), レベル・スティーラー ① (central cost/effect Tribute path), 霊滅術師 カイクウ ② (acting player of costs in the GY banish lock), スーパイ, 機皇城 ①, ハーピィ・クィーン (name alias), 超古深海王シーラカンス ②, スクラップ・ビースト (attack-target tracking), チェンジ・デステニー (permanent position lock).
- **TOP engine item (TESTED correctness):** about 485 TESTED cards have an effect / procedure Special Summon with no position in the text (the player may choose face-up Attack or Defense), but the scripts pass a fixed 'atk'. Candidate list: scratchpad `ss_position_candidates.txt` (to be copied into the tree's docs with the unit). `API.specialSummon` is synchronous and scripts act on the summoned card right after it, so this needs an engine design: a journaled position choice inside the summon. New cards use `specialSummonPositionsS03` (engine/1ZZK). Until then these cards carry a known deviation; `timing:['mainPhase']` does not check whose turn it is — checked 2026-10-04: not reachable in play (getLegalZoneActions offers field effects to the turn player only; chain responses need Spell Speed 2+), so no change
- Recurring engine needs from the ENGINE_GAP triage (class B): an extra Normal Summon key, a hand-size-limit modifier, a duel-win action, activating a Field Spell from the Deck, an effect-damage source filter, a flip-suppressing position change, missing setcodes. Follow-ups: real-path checks of 黒板消しの罠 / 地獄の扉越し銃 after the U267 LP fix; 銀幕の鏡壁 needs an ATK-halving layer.
- PROPOSAL (not changed, UX-visible): DUEL has priority POINTs only in the Battle Phase. At the end of Draw / Standby / Main / End Phase the non-turn player gets no window, so e.g. サイクロン or a set Trap in the opponent's End Phase is impossible unless something else starts a chain. A phase-end POINT (priority to the opponent; auto-pass when nothing is activatable) would fix it but adds a prompt when the opponent holds an activatable set card — ask the user before changing.
- ギガプラント (U122) / 超融合 (U124): effect Special Summons use Attack Position (API.specialSummon convention); a position choice would be more faithful.
- ガチガチガンテツ: optional destruction substitute needs a new capability (destruction decided in the reducer, no choice point).
- キメラテック・フォートレス・ドラゴン: no Extra Deck summon procedure → cannot be summoned in DUEL; needs an EX procedure path + multi-material selection; confirm the 2011 face-down-material ruling first.

- The U116 must-attack clause only prompts a confirmation when leaving the Battle Phase (existing `doPhase` design).

- Same-shape S/T-immunity cards needing another capability: トラファスフィア, 伝説のフィッシャーマン, サイレント・ソードマン LV5, サイレント・マジシャン LV8, 砂塵の結界, 暴君の威圧, 最後の進軍, 極神聖帝オーディン, 儀式魔人ディザーズ.

- 宝玉の契約 / 宝玉の祈り: setcode used as the 「宝玉獣」 named predicate (needs a P4 overlay group).
- グラファ / ゴルド: "選択して破壊" target chosen at resolution instead of on activation.

## Notes

- `python tools/script_coverage.py --json <path>` WRITES to `<path>` — only ever pass a scratch path.
- Publication: from U268 on, one shared checkpoint per batch of about 3 verified units; LATEST changes only when a checkpoint is published. Each unit keeps its own report (`docs/S03_UNNN_REPORT.md`) and measurement JSON.
