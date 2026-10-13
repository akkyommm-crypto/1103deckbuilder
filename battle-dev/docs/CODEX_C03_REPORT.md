# CODEX-C03 — source/controller-aware targeting immunity

Base: verified `claude/work` U349 (`0a5866c`) merged with public `main` (`14ed6cb`) on the isolated `codex/engine-target-immunity` branch. Claude's worktree and branch were not edited.

## Engine

- `targetEffectSourceS03()` normalizes the targeting effect's controller, card identity, Monster/Spell/Trap type, subtype, current Level, Effect Monster flag, and Synchro flag across activation preparation, chain resolution, and direct `runScript` execution.
- `continuous.immuneToTarget(target, self, effectInfo)` receives that normalized source as an optional third argument. Existing two-argument declarations are unchanged.
- `filterTargetable()` remains the central enforcement point. No new persistent duel state or functions are stored in `gameState`; Replay and save formats are unchanged.
- `API.targetableCardsS03()` exposes the same filter for activation conditions that must reject an effect when no legal target remains.

## First consumer

`氷結界の御庭番` is fully implemented as a face-up continuous effect. It protects its controller's face-up canonical Ice Barrier monsters, including itself, only from the opponent's Effect Monster effects. Own Effect Monster effects and both players' Spell/Trap effects remain legal; a face-down monster has no public Ice Barrier name; negating the Garden Warden disables the protection.

This primitive is intended for the other recorded consumers such as ヴァイロン・セグメント, ジュラック・タイタン, ターボ・ウォリアー, 機皇城, and ヴァイロン・エプシロン. Those cards are not claimed complete in this unit.

## Focused validation

- `tools/test_codex_c03_target_immunity.js`: real DUEL activation/choice/chain resolution with fixed RNG and Replay audit.
- Negative control on unchanged U349: 3 expected failures (script registration and two opponent-Effect-Monster candidate exclusions); all category/control/negation/face-down controls pass and Replay audits remain clean.
- Post-change focused result: 21 PASS / 0 FAIL.
- Nearby regression set: CODEX-C03, S03-U130, S03-U336, auto-cycle23, and S03-U135 all pass with Replay audits clean.
- Coverage after regeneration: TESTED 3154 (+1), ENGINE_GAP 468 (-1), NOT_STARTED 697 (unchanged); status audit reports 0 off-target changes.

The authoritative full-gate result, artifact hash, commit, and push result are emitted by `scripts/finish-work.ps1` at completion.
