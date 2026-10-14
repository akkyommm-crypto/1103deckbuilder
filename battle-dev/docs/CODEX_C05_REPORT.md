# CODEX-C05 — supplied-deck priority automation

Base: verified `codex/safe-zone` CODEX-C04 (`d5c8177`) on the isolated `codex/deck-priority-1` branch. Claude's worktree and branch were not edited.

## Audit

The three supplied deck lists contain 96 unique card names across Main, Extra, and Side Decks. Before this unit, coverage was:

- 87 `TESTED`
- 1 `GENERIC_OK` (`ジェムナイト・パール`)
- 4 `ENGINE_GAP`
- 4 `NOT_STARTED`

CODEX-C05 promotes three high-priority `NOT_STARTED` Main Deck cards to `TESTED`:

- `ミンゲイドラゴン`
- `時械神メタイオン`
- `究極時械神セフィロン`

The supplied lists now contain 90 `TESTED`, 1 `GENERIC_OK`, and five known unfinished cards. `光と闇の竜` remains `NOT_STARTED`; `コアキメイル・デビル`, `コアキメイル・ドラゴ`, `バイス・ドラゴン`, and `連鎖除外` remain explicit `ENGINE_GAP` items. They are not represented as complete.

## Implementation

- `ミンゲイドラゴン`: Dragon-only double-Tribute value, optional all-Dragon-GY Standby revival, and banish-on-leave after that revival.
- `時械神メタイオン`: Deck Special Summon restriction, zero-Tribute Normal Summon condition, battle/effect destruction protection, controller battle-damage prevention, mandatory Battle Phase-end mass return plus exact return-count damage, and owner-Deck Standby return.
- `究極時械神セフィロン`: non-chain hand procedure at ten GY monsters, plus the non-targeting once-per-turn hand/GY Level 8+ Fairy summon with effect negation and face-up ATK 4000.
- Added a reusable declarative source-zone Special Summon restriction. Both candidate filtering and actual resolution enforce it; effects explicitly ignoring summon conditions retain that documented bypass.

## Validation

- Official Konami card database/Q&A and the repository's historical card text were cross-checked before implementation.
- `tools/test_codex_c05_deck_priority.js` uses real DUEL summon, phase, battle, chain, choice, and leave-field paths. Every completed scenario is Replay-audited.
- Negative control on unchanged CODEX-C04: 25 new assertions failed as expected and the harness did not crash.
- Focused post-change test: all assertions pass, including negative conditions and the summon-condition-ignore compatibility check.
- Nearby regression tests pass for Standby revival fixtures, Battle Phase-end tracking, destruction protection, leave-field replacement, proper-summon records, permanent effect negation, and stat modifiers.
- S03 coverage audit: **1,119 declared status changes observed**, **0 off-target changes**, **TOTAL 4,996**. Current counts include `TESTED: 3,158` and `NOT_STARTED: 693`.
- Generated artifact SHA-256 before the full gate: `43cc51e8be411a77a930ca02ce9e9140c5e1b7323c68c83cb92af635a2cf8b2c`.
- Full-gate, final artifact, commit, and push results are recorded at completion.
