# CODEX-C08 — supplied-deck priority automation, batch 4

Base: pushed CODEX-C07 (`7568055`) on the isolated `codex/deck-priority-1` branch. Claude's worktree and branch were not edited.

## Scope and result

`コアキメイル・デビル`, used three times in the supplied ガリスフルモン main deck, moved from `ENGINE_GAP` to `TESTED`.

Of the 96 unique cards in the three supplied lists, 94 are now `TESTED` and 1 is `GENERIC_OK`. Only `光と闇の竜` remains unfinished (`NOT_STARTED`).

## Implementation

- Added a generic chain-resolution hook for a live face-up monster to selectively negate an activated monster effect. It does not mark the source monster as globally negated and therefore does not suppress continuous effects.
- `コアキメイル・デビル` declares the predicate: monster effect, activation phase `main1` or `main2`, and current/printed attribute LIGHT or DARK.
- The hook works for effects activated from the hand, Graveyard, or Monster Zone, checks the continuous source at resolution, and skips a face-down or negated source.
- End Phase maintenance reuses the established Koa'ki Meiru upkeep path: send Iron Core, reveal a Fiend, or destroy itself.

## Validation

- Official Konami card database/Q&A was checked before implementation; it explicitly covers hand/GY activation, continuous effects, and non-Main-Phase effects.
- Negative control on CODEX-C07 failed all new LIGHT/DARK Main-Phase behavior assertions while all scope negatives passed.
- `tools/test_codex_c08_koaki_doom.js` exercises real DUEL activations of D.D.クロウ, エフェクト・ヴェーラー, ゾンビキャリア, and 魔導戦士 ブレイカー, verifies costs remain paid, continuous ATK is not globally negated, verifies Battle Phase / face-down / negated-source negatives, upkeep, and seven Replay audits.
- Coverage/status audit: **1,123 declared status changes observed**, **0 off-target changes**, **TOTAL 4,996**. Current counts include `TESTED: 3,162`, `ENGINE_GAP: 464`, and `NOT_STARTED: 693`.
- Generated artifact SHA-256 before the full gate: `5e59996399eb890a7418953ae45dfad189c495b11aed0bbd619db8df7ae92779`.
- Full repository gate is run before commit.
