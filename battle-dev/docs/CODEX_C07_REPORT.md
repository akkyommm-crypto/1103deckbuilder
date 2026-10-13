# CODEX-C07 — supplied-deck priority automation, batch 3

Base: pushed CODEX-C06 (`1c81553`) on the isolated `codex/deck-priority-1` branch. Claude's worktree and branch were not edited.

## Scope and result

`連鎖除外`, used in the supplied レヴァライダー side deck, moved from the stale `ENGINE_GAP` pin to `TESTED`.

Of the 96 unique cards in the three supplied lists, 93 are now `TESTED` and 1 is `GENERIC_OK`. Two remain unfinished: `光と闇の竜` (`NOT_STARTED`) and `コアキメイル・デビル` (`ENGINE_GAP`).

## Implementation

- Reacts to Normal, Flip, or Special Summon success of any face-up monster whose current ATK is 1000 or less.
- Uses the summon-batch event, so every qualifying monster in a simultaneous summon is processed.
- Takes no target and rechecks face-up status/current ATK at resolution.
- After a summoned monster is actually banished, all cards with that card's printed canonical name are automatically banished from the activator's opponent hand and Deck; the Deck is then shuffled through deterministic Replay actions.
- The old hidden-information gap required no new engine primitive because there is no hidden choice: every matching card is removed.

## Validation

- Official Konami card database and four published Q&A entries were checked before implementation.
- Negative control on CODEX-C06 failed every new behavior assertion without an unhandled harness crash.
- `tools/test_codex_c07_chain_disappearance.js` covers real DUEL response windows for opponent and own Normal Summons, simultaneous Special Summon events, non-targeting behavior, resolution-time ATK/face-up rechecks, hidden hand/Deck copies, and five Replay audits.
- The legacy batch-41 test now records `連鎖除外` as unlocked rather than requiring its removed gap pin.
- Coverage/status audit: **1,122 declared status changes observed**, **0 off-target changes**, **TOTAL 4,996**. Current counts include `TESTED: 3,161`, `ENGINE_GAP: 465`, and `NOT_STARTED: 693`.
- Generated artifact SHA-256 before the full gate: `86f4880746c32a77a96fbcfee0518074889aa85956ef705c879603891d052fd8`.
- Full repository gate is run before commit.
