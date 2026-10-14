# CODEX-C06 — supplied-deck priority automation, batch 2

Base: pushed CODEX-C05 (`0276ddd`) on the isolated `codex/deck-priority-1` branch. Claude's worktree and branch were not edited.

## Scope and result

Two supplied-deck cards previously pinned as `ENGINE_GAP` are now `TESTED`:

- `バイス・ドラゴン`
- `コアキメイル・ドラゴ`

Of the 96 unique cards in the three supplied lists, 92 are now `TESTED` and 1 is `GENERIC_OK`. Three remain deliberately unfinished: `光と闇の竜` (`NOT_STARTED`), `コアキメイル・デビル` (`ENGINE_GAP`), and `連鎖除外` (`ENGINE_GAP`).

## Implementation

- `バイス・ドラゴン`: non-chain hand Special Summon procedure is legal only while only the opponent controls a monster. The procedure records its identity and installs a Replay-safe, face-up-only original-stat layer of ATK 1000 / DEF 1200. Turning it face-down or leaving the field resets the layer; an ordinary revival never receives it.
- `コアキメイル・ドラゴ`: the existing declarative `specialSummonLockS03` primitive now blocks both players from Special Summoning printed LIGHT/DARK monsters while the source is face-up and not negated. Its own End Phase upkeep reuses the established Koa'ki Meiru maintenance path for Iron Core payment, Dragon reveal, or self-destruction.
- Stale `ENGINE_GAP` pins were removed only for these two cards. No engine change was required.

## Validation

- Official Konami card database/Q&A and repository historical texts were checked before implementation.
- `tools/test_codex_c06_deck_priority.js` uses real DUEL procedure, Special Summon, End Phase, effect-negation, face-down reset, and Replay paths.
- Negative control on unchanged CODEX-C05 failed the newly expected behavior without an unhandled harness crash.
- Focused post-change test passes all positive and negative assertions with seven Replay audits.
- Nearby regression tests pass for special-summon locks, Koa'ki Meiru upkeep, summon provenance, original-stat layers, and System v14 modifiers.
- S03 coverage audit: **1,121 declared status changes observed**, **0 off-target changes**, **TOTAL 4,996**. Current counts include `TESTED: 3,160`, `ENGINE_GAP: 466`, and `NOT_STARTED: 693`.
- Generated artifact SHA-256 before the full gate: `b8105b7663317122bff66a111b319897872701e7e21c7eb45321a5b9faf8d86d`.
- Full-gate, commit, and push results are recorded at completion.
