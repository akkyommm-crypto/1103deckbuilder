# CODEX-C04 — 安全地帯

Base: verified `codex/engine-target-immunity` CODEX-C03 (`ce361fa`) on the isolated `codex/safe-zone` branch. Claude's worktree and branch were not edited.

## Implementation

- A previously Set `安全地帯` can be activated at Spell Speed 2 during either player's turn and targets one face-up Attack Position monster on either field.
- The linked monster cannot be targeted or destroyed by effects controlled by the opponent of `安全地帯`'s controller, cannot be destroyed by battle, and cannot attack the opponent directly.
- The controller's own effects may still target and destroy the monster.
- Existing System v9 mutual links implement both printed lifecycle clauses: if `安全地帯` leaves, destroy the monster; if the monster leaves, destroy `安全地帯`.
- Existing CODEX-C03 source/controller metadata, System v21 destruction protection, the central direct-attack gate, and Replay-safe link state are reused. No new engine or save format is introduced.

## Validation

- `tools/test_codex_c04_safe_zone.js` uses real DUEL activation, choice, chain resolution, battle processing, and Replay audit.
- Negative control on unchanged CODEX-C03: registration, opponent-turn activation, protections, direct-attack restriction, and mutual destruction all fail as expected; no crash.
- Focused post-change result: **21 PASS / 0 FAIL**, including six Replay audits.
- Nearby regression tests pass for CODEX-C03 target immunity, System v21 destruction protection, System v9 leave-field links, non-targeting protection, staple Continuous Trap links, destruction provenance, and automatic-table filters.
- S03 coverage audit: **1,116 declared changes observed**, **0 off-target changes**, **TOTAL 4,996**. Current counts include `TESTED: 3,155` and `NOT_STARTED: 696`.
- Generated artifact SHA-256 before the full gate: `6c34df291199845ecdfa64dfe0af34adf1b9500903488aea1dd300fb5378ff06`.
- Full-gate, final artifact, commit, and push results are recorded at completion.
