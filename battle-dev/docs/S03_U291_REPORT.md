# S03-U291 — Integration of CODEX-C01 (Exodia special-win boundary) and CODEX-C02 (six cards) onto S03-U288–U290

## Workflow
- Opus integration unit. Profile `delegation-expanded-v3-batch3`.
- Source: `checkpoints/checkpoint_codex_c01_c02_batch.zip`. SHA256 `cfe31c68…b8d8`, checked against `logs/CODEX_C02_HANDOFF.md`.
  - It is cumulative on published U287 and includes C01.
  - Codex gate on that base: 17772 PASS / 0 FAIL.
- Method: the C02 tree's changes against U287 were re-applied to the S03-U290 tree (`rebase_unit.py s03_u287 codex_c02 s03_u290 s03_u291`), hunk by hunk. The codex tree was not copied over.

## Merge
- Patched without conflict:
  - `engine/00_state_actions.js` and `engine/30_processor_chain_battle.js`. These also carry the U290 event summary; the C01 `SPECIAL_WIN_DEFER_S03` boundary sits in SOLVE_CHAIN, the U290 summary in `processDrainEventsV27`.
  - `engine/06_replay_rng_v41.js`, `engine/1ZZL_special_win_s03.js`, `engine/1Z_resolution_choice_wait_s03.js`, `tools/script_coverage.py`.
  - Tests: `test_s03_u10_card_activation`, `test_v500_batch02`, `test_v550_batch07`, `test_v840_batch35`, `test_v890_batch40`.
- New: `cards/HZZZZZO_codex_c02_cards.js`, the tests `test_codex_c01_special_win.js` and `test_codex_c02_cards.js`, `docs/CODEX_C01_REPORT.md`, `docs/CODEX_C02_REPORT.md`, `measurements/codex_c01.json` and `measurements/codex_c02.json`.
- By hand:
  - `tools/test_v750_batch27.js`: both sides removed a card from the same gap list (U290 魔力の棘, C02 風林火山). C02's three edits were re-applied: the `c02Unlocked` record, the gap list without 風林火山, and the unlocked check.
  - `tools/check.py`: the two codex tests are registered where C02 placed them.
  - `data/s03_status_changes.json`: C02's six declarations were appended (878).
  - `build_manifest.json`: the codex card file keeps C02's position.
- The six ENGINE_GAP overrides were removed, as in C02.
- No card name or top-level function name overlaps between C02 and U288–U290.

## Review (Opus)
- C01: the special-win check runs once per resolved chain link (journaled automatic action; Replay-visible; no Undo checkpoint). It is independent of the U290 drain summary.
- C02: the six scripts were read against their 2011 texts. The LP cost check `lp > 1000` follows the repo convention. Mass destruction and discards one by one follow existing practice. Accepted as TESTED.
- Interaction checked: いたずら好きな双子悪魔's two discards fall into one `onDiscardBatchS03` group, since they are queued in the same resolution.

## Tests on the integrated tree
| Test | PASS / FAIL |
|---|---|
| test_codex_c01_special_win | 18 / 0 |
| test_codex_c02_cards | 40 / 0 |
| test_s03_u288_gap8 | 116 / 0 |
| test_s03_u289_token_position | 6 / 0 |
| test_s03_u290_event_summary | 20 / 0 |
| test_s03_u279_special_win | 7 / 0 |
| test_s03_u10_card_activation | 33 / 0 |
| test_v500 / v550 / v700 / v750 / v840 / v890 | 44 / 45 / 47 / 43 / 38 / 38, 0 FAIL |
| test_s03_u233_ns25 | 26 / 0 |
| test_s03_u278_ss_position | 11 / 0 |
| test_s03_u287_hand_limit_triggers | 19 / 0 |

Codex negative controls (in their reports): C01 on U287 7 FAIL; C02 on C01 14 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17914 PASS / 0 FAIL** (= U290 17856 + 58 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U290.
- Coverage: TESTED 2916, ENGINE_GAP 482, NOT_STARTED 921, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 878 declared, 0 off-target.
- Published in the batched checkpoint S03-U288–U291.
