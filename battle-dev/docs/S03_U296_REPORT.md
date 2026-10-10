# S03-U296 — Major-deck duels complete with a save / resume round trip at every stop

## Workflow
- Sonnet battle-implementer, user priority of 2026-10-09: duel completion, including save / resume and Replay.
- Tree s03_u296, the single current tree.

## Result
- The R1 driver has a new opt-in mode `R1_SAVELOAD` (`R1_SAVELOAD_EVERY`). At every stop of the duel it runs saveDuel → reset → offerResumeDuel and continues.
- Sweep of all 78 pairs of the 13 fixed major lists, `R1_RESPOND=1`, `R1_SAVELOAD=1`:
  - before the fixes: 0 / 78 clean;
  - after: 78 / 78 clean, 16863 round trips. Without the mode: 78 / 78 clean.
- Also fixed: the stall found by the parent's wider sweep (debris / tg_skill, End Phase SEGOC spell speed).

## Causes fixed (cause → fix; regression test, negative control on U295)
1. The open trigger selection was lost on resume. The selection descriptor is now saved, and the waiting unit, queue, pendingAttack and timingWindow are restored (engine/1ZZP). Test `test_s03_u296_trigger_selection_resume`: 1 FAIL.
2. The POINT window was lost and a chain started from it lost its follow-up. The POINT unit and pendingAttack are restored; `pointChainAfterV27` rebuilds the follow-up; `ATTACK_PENDING_CLEAR_S03` is journaled. Test `test_s03_u296_point_window_resume`: 8 FAIL.
3. Releasing a legacy choice on resume left `CHOICE_OPEN_V49` open (Replay mismatch). It now journals `CHOICE_CANCEL_V49`. Test `test_s03_u296_choice_release_replay`: 2 FAIL.
4. A legacy choice open while a chain link resolves left the link half-resolved. The state is rebuilt at the choice's start seq and the link resolves again. Test `test_s03_u296_resolution_choice_resume`: 6 FAIL.
5. In one SEGOC selection, monster triggers refused each other for spell speed. Monster triggers of the same selection are no longer checked against each other. Test `test_s03_u296_segoc_peer_speed`: 2 FAIL.
6. Battle references broke after resume (`lastBattle`, plus `battle` / `timingWindow` in the rebuild). They are relinked by uid and carried over. Test `test_s03_u296_battle_refs_resume`: 2 FAIL.
7. No.39 希望皇ホープ ② was legal again on top of its own link, so the chain grew forever. It is refused while its own link is on the chain. Test `test_s03_u296_hope_no_material_chain`: 2 FAIL.

## Open (for S03-U297)
- TG ワーウルフ registers its effects at spell speed 2 (`priority:2`). Opus ruling: both are monster trigger effects, spell speed 1.
- The largest save in the sweep was 9.0 MB. Measure it without the driver's per-action `digestText`. If a real save exceeds the browser localStorage limit (about 5 MB), `saveDuel` fails silently.

## Tests
The 7 tests above: 51 PASS / 0 FAIL in total, Replay-audited. Existing tests are unchanged.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **18109 PASS / 0 FAIL** (= U295 18058 + 51 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U295.
- Coverage: TESTED 2926, ENGINE_GAP 472, NOT_STARTED 921, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 888 declared, 0 off-target.
- Published in the batched checkpoint S03-U296–U297.
