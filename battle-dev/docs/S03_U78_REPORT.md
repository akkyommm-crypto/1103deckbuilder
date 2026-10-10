# S03-U78 エクシーズエナジー real-target field-name bug fix (Claude)

Base: shared LATEST `checkpoint_claude_s03_u77_sin_world_20260919.zip` (Claude, U77).

## Why this unit

WORK_QUEUE Ready item #7: a real, already-diagnosed bug found incidentally in S03-U76 (flagged via
`spawn_task`, not fixed at the time to stay in scope) — a good, well-scoped next unit per the fixed fallback
order (priority #5, Ready list head), with no fresher unaudited bug class or multi-deck Requirement pending.

## Card

エクシーズエナジー (this project's own card database, printed 2011-03-19, within the 2011-08-31 cutoff), a
Normal Spell: "You can activate this by removing 1 Xyz Material from your field. Select 1 face-up monster your
opponent controls and destroy it."

## The bug

`cards/56_v56_autobuild_batch08.js`'s pre-existing script checked `card.materials` to find a legal Xyz monster
to detach a material from — both in `condition()` (is there a legal cost source at all) and in `cost()`'s
`selectCard` pool. But the real production Xyz-Summon/detach code (`engine/00_state_actions.js`,
`FX_EX_SUMMON`/`FX_DETACH`) stores attached materials on `card.xyz`, a field never set as `.materials` anywhere
for a real Xyz monster (confirmed while building S03-U76's 始祖の守護者ティラス, which itself correctly uses
`card.xyz`). This meant `condition()` could never find a legal cost source in any real duel — the card was
permanently illegal to activate — despite carrying `TESTED` status: its own dedicated test
(`tools/test_v560_batch08.js`) only checks that the registration string exists in the built HTML, never
exercises real behavior (the same shallow-test pattern found for ガンバラナイト/インターセプト・デーモン in
S03-U71).

## Fix

Both `card.materials` references changed to `card.xyz` in `cards/56_v56_autobuild_batch08.js`. No other change
needed — `API.detachMaterial(p, mzIndex, reason)` already operates on the real production field correctly (it
always did; only the script's own legality/pool check was wrong).

## Dedicated test

`node tools/test_s03_u78_xyz_energy_material_field_fix.js` — 5 assertions, all pass, real DUEL path throughout.

- **A**: a real Xyz Summon (2 real Level 5 monsters → 始祖の守護者ティラス, same combo as S03-U76's own test)
  attaches 2 real materials (`card.xyz`); confirms `strictScriptLegalityV2` now finds エクシーズエナジー legal
  to activate — before the fix this was always illegal regardless of field state.
- **B**: a real activation from hand really detaches 1 material from the real Xyz monster (2→1) and really
  destroys a real face-up opponent monster. Clean Replay audit.
- **C**: illegal when the only real Xyz monster on the field has 0 materials — confirms the condition
  correctly re-checks live `card.xyz` state.

## Coverage / status audit

No status change: the card was already (incorrectly) `TESTED`; this is a pure correctness fix, not a
promotion. `python tools/s03_status_audit.py`: EXIT 0, 78 declared status changes (unchanged from U77),
off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13150 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no duplicate
  top-level function declarations.

## Real-duel measurement

エクシーズエナジー's real reachability within `1103_MAJOR_DECKS_v1` was not independently re-confirmed via a
fresh R1 sweep (no deck in the fixed lists is known to run it specifically); this unit's evidence is the
dedicated real-path test above. No regression to any fixed-list deck is expected (the change only affects this
one card's own legality/cost logic).

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`47af5f80cba00b51de1b7a25833ee1d9f0d0e4c48f16b97905b699c7cc07999b` (806 files).

## Remaining

- 六武衆の影武者 remains the one genuine ENGINE_GAP needing a real new capability — left for a future unit.
- Per the fixed fallback order, continuing directly into the next Requirement.
