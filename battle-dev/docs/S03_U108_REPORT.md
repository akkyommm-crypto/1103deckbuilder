# S03-U108 Codex Takeover: Deck Selection Boundary + Xyz Material Choice

## Summary

Codex took over from the shared S03-U107 clean checkpoint and addressed the three user-reported issues:

- A. saved deck list missing in DUEL
- B. selecting only Player2's deck initializes the duel
- C. users cannot choose which Xyz Material to detach

The original Claude work tree `C:\Users\81806\1103_work\s03` was compared against the U107 checkpoint before work began. Source contents matched U107 exactly; only extra full-gate logs and the checkpoint zip itself were present. Work continued in a fresh Codex copy, not by editing the Claude tree in place.

## Implementation

Changed files:

- `data/80_test_decks.js`
- `engine/00_state_actions.js`
- `engine/60_damage_segoc_ui_helpers.js`
- `engine/70_summon_procedures.js`
- `tools/check.py`
- `tools/script_coverage.py`
- `tools/test_s03_u108_deck_select_xyz_material.js`

### A/B: Deck Selection Boundary

- Added read-only saved-deck schema compatibility for:
  - `deck1103:<name>`
  - `deck1103:decks`
  - `deck1103:list`
  - `yg1103_decks`
  - `1103_decks`
  - `decks1103`
  - work deck fallbacks `work1103:current`, `deck1103:work`, `yg1103_work_deck`
- Added Player1 / Player2 selection tabs to the DUEL deck-load screen.
- Added `SET_NEXT_DECK`, which records the selected next-start deck in `loadedDeckV32` without changing the current hand, deck, field, GY, turn, phase, or active player.
- Changed saved-deck selection and text-deck selection to update the next-start deck only.
- Added explicit `startSelectedDeckDuel()`, which initializes a new duel only when the user chooses the new-duel action.
- Preserved the existing `startRabbitOpponentDuel()` route.

### C: Xyz Material Choice

- Extended `FX_DETACH` to accept `materialIndex` and `materialUid`.
- Manual Xyz-material removal now opens a choice only when multiple materials are attached.
- Single-material removal remains direct, so unnecessary prompts are not added.
- Detached materials still go to their owner’s GY, and Replay records the selected material identity.

## Verification

Focused:

- `node tools/test_s03_u108_deck_select_xyz_material.js`: PASS

Adjacent regressions:

- `node tools/test_s03_u78_xyz_energy_material_field_fix.js`: PASS
- `node tools/test_ui_v360.js`: PASS
- `node tools/test_s03_u38_duel_lifecycle_journal.js`: PASS
- `node tools/test_s03_u30_ui_activation_paths.js`: PASS

Coverage / audit:

- `python tools/script_coverage.py`: unchanged distribution from U107
  - ENGINE_GAP 612
  - GENERIC_OK 644
  - IMPLEMENTED 131
  - NOT_STARTED 1284
  - PARTIAL 172
  - TESTED 2153
- `python tools/s03_status_audit.py`: 108 declared status changes observed, off-target 0, total 4996

Full Gate:

- `python tools/check.py`: exit 0
- PASS lines: 13431
- `FAIL`, `Traceback`, `ReferenceError`: no matches in `s03_u108_full_gate.log`
- Note: `test_auto_cycle32.js` still prints a caught `TypeError` stack to the log while the gate exits 0; this appears to be pre-existing test-output noise, not a U108 failure.

Acode:

- `python tools/build_acode.py`: exit 0
- `dist/battle.html` SHA256: `13e67aedf700884d023a02637dc31da7c36b73755b013a25d8b95961cfcaf38f`
- `dist/battle_acode.html` SHA256: `c1b2b78bc5599f595034bd6064aa41ebc6d8176ed9e1dd94b1440918d8715e96`

## UI Verification Note

The focused regression runs the real DUEL-screen functions in the bundled VM harness:

- renders the saved-deck screen for Player2,
- verifies saved deck rows are visible,
- verifies Player2 selection does not mutate the current duel,
- starts a new duel through the explicit selected-deck start path,
- verifies Xyz-material choice UI opens only for multiple materials.

No live browser/manual visual pass was performed in this environment.

## Source Manifest

- Source files, excluding `dist/`, logs, and zips: 870
- Final source manifest and checkpoint ZIP integrity are recorded in the S03-U108 publication log.
