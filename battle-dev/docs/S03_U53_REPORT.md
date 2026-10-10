# S03-U53 簡易融合 (Codex)

Base: `checkpoint_claude_s03_u52b_acode_refresh_20260914.zip`, SHA256 `670c6095afaa1b8f29cf7dcf1bdd07c2d697b9bbbbeceeb91c4328cfd9ec112d`.

## Takeover audit

- Claude stopped under the weekly limit before starting new source work.
- Compared `C:\Users\81806\1103_work\s03` against the extracted U52b clean checkpoint by file hash before editing.
- Result: `CLEAN_ONLY 0`, `WIP_ONLY 0`, `CHANGED 0`.
- Preservation: no stopped WIP existed, so no WIP archive or patch was needed. Shared audit log: `logs/CODEX_TAKEOVER_WIP_AUDIT_20260914.md`.

## Why this unit

U52's first 【Karakuri】 vs 1103兎ラギア measurement completed 14 / 14 duels but recorded `簡易融合` as unsupported/manual-only in 13 duels. `簡易融合` was `NOT_STARTED`, so it became the next real-duel blocker candidate.

Before U53, a direct activation probe confirmed the card had no automatic script and returned `自動実行スクリプトがありません`.

## Closure

- Added `cards/HD_claude_s03_u53_instant_fusion.js`.
- Registered it in `build_manifest.json` after the U52 trigger script.
- Added `tools/test_s03_u53_instant_fusion.js` and wired it into `tools/check.py`.
- Promoted `簡易融合` from `NOT_STARTED` to `TESTED` in `data/s03_status_changes.json`.
- Added one shared engine bookkeeping fix in `engine/00_state_actions.js`: `FX_EX_SUMMON` now records Extra Deck special summons in `ssHistory` with `from:'ex'` and `fromPlayer`, matching other Special Summon paths that downstream legality/trigger checks inspect.

Implemented behavior:

- Normal Spell activation on the DUEL path.
- Requires more than 1000 LP, an open monster zone, and an own Extra Deck Fusion Monster with Level 5 or lower.
- Pays 1000 LP as activation cost.
- Chooses the Fusion Monster at resolution, not activation.
- Fusion Summons the chosen Extra Deck monster through `FX_EX_SUMMON`.
- Marks the summoned monster unable to attack.
- Schedules End Phase destruction only for the same card instance if it remains on the field.
- Queues the summon-success event immediately after the resolution-time summon.
- Releases the one-card-per-turn activation count when the activation is negated by `神の警告`.

## Dedicated test

`node tools/test_s03_u53_instant_fusion.js` — EXIT 0.

Covered:

- Activation creates a chain link, pays 1000 LP, and does not choose a target/card at activation.
- Resolution choice offers `メカ・ザウルス` and excludes high-Level Fusion Monsters such as `青眼の究極竜`.
- The chosen Fusion Monster is Special Summoned from the Extra Deck as a Fusion Summon.
- The monster cannot attack and `ssHistory` records the Extra Deck summon.
- The Spell goes to the GY and its name limit is consumed.
- End Phase destruction is journaled and replay-stable.
- If the summoned monster leaves the field and returns, the old scheduled destruction does not destroy it.
- `神の警告` is offered and can negate the activation; after negation, the Fusion remains in the Extra Deck and a second copy of `簡易融合` is legal in the same turn.
- Special Summon locks and LP cost gates are enforced.

## Real-duel effect

Focused R1 sweep after U53:

- 【Karakuri】 vs 1103兎ラギア, Astra fixed lists, responder mode.
- Seeds `0x52310801`-`0x52310807`, both first players.
- Result: 14 / 14 completed, 14 / 14 replay OK, unsupported/manual-only actions 0, blockers 0.
- This closes the U52 observation where `簡易融合` appeared as unsupported in 13 / 14 duels.

## Gate

- `python tools/check.py` — EXIT 0, 12730 PASS / 0 FAIL, no Traceback. Log: `s03_u53_full_gate.log`.
- `python tools/script_coverage.py`:
  - TESTED 2083
  - ENGINE_GAP 613
  - NOT_STARTED 1301
  - IMPLEMENTED 179
  - GENERIC_OK 644
  - PARTIAL 176
  - TOTAL 4996
- `python tools/s03_status_audit.py` — EXIT 0:
  - declared status changes observed: 34
  - off-target status changes: 0
  - promoted cards keep card registrations
  - promoted cards seen by declared tests
  - TOTAL 4996
- `python tools/build_acode.py data/carddata.json` — EXIT 0:
  - `dist/battle.html` SHA256 `ff71fc767ee889ca79c26da23669bdf32008620af45d145267adf6d0623155e0`
  - `dist/battle_acode.html` SHA256 `c781cccb22b12750ef500aca462cb308bc35160f63ff1ff470a9ed6a292f01ec`
  - cards=4996

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, and this report set aside): `b3d554371d42206102524473fbbd0c7fccaeb874651f0517e3d418ec80574f94` (740 files).

## Remaining

- `簡易融合` is now covered for the real DUEL path, activation negation, End Phase destruction, replay, and the R1 Karakuri blocker.
- Next queue item remains measurement-first major-deck work; a shared candidate from existing measurements is 王宮の弾圧 ENGINE_GAP in several decks, but the next unit should be chosen from a fresh first-blocker measurement rather than guessed.
- Existing Karakuri side note remains from U52: カラクリ兵 弐参六's must-attack and "attack target -> defense position" effects are not scripted.
