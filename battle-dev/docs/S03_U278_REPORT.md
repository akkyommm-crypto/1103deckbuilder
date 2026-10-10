# S03-U278 — The summoning player chooses the position of an effect Special Summon whose text gives no position

## Workflow
- opus-only engine unit (workflow v3). Profile `delegation-expanded-v3-batch3`. Built on U277; rebased onto the final U277.
- Found by the 2026-10-03 「TESTED判定」 review:
  - 「特殊召喚する」 with no position lets the summoning player choose face-up Attack or Defense.
  - The scripts pass a fixed `'atk'`.
  - About 485 TESTED cards have such a sentence (list: `docs/S03_U278_SS_POSITION_CANDIDATES.txt`).
- `API.specialSummon` is synchronous, and scripts act on the summoned card right after it, so the fix lives in the engine rather than in each script.

## Engine — engine/1ZZK (+ 00, 19, 30, 40, 1Z)
1. `API.specialSummon` summons as before (face-up Attack).
2. When the call comes while a chain link resolves, with the caller not choosing (`'atk'` from a script, and not the S03-U271 helper), and every Special Summon sentence of the resolving card's text names no position (`ssPositionFreeS03`):
   - the card is queued with the journaled `SS_POS_S03` op `queue`.
3. When the script has finished and no other choice is pending, `ssPositionPumpS03` opens one option choice per queued card: face-up Attack or face-up Defense.
   - It opens from the processor's chain-resolution step, and after a resolution-time choice is answered (`resumeAfterResolutionChoiceS03`).
4. Defense sets the position as part of the summon (`SS_POS_S03` op `set`).
   - The position-change detector (engine/19) refreshes its snapshot for that action, so no `onPositionChange` is raised. It is not a change from Attack to Defense.
5. A card that left the field or changed meanwhile is skipped.
- Not covered: Special Summons outside a resolving chain link, such as delayed handlers, and texts where one summon names a position and another does not. Those stay Attack, as before.

## Test harness (Opus decision)
- 13 older test files on `tools/astra_harness.js` drive their flows with their own pickers. The queued choice stalled them, because the position choice now comes before the next choice they expect.
- `astra_harness.js` now acts as the player for this one choice (handler `s03.ss-position-free`) and answers face-up Attack, the position those tests were written for. The choice is still opened, journaled and replayed.
- Tests that check positions set `globalThis.__MANUAL_SS_POSITION_S03=true`.
- No assertion was changed. All 13 files are back to their previous PASS counts:
  - astra01 76, astra02 21, u03 57, u08 34, u10 33, u110 34, u112 32, u14 50, u156 84;
  - vs1 21, vs2 16, vs3 22, vs4 25.

## Tests
`tools/test_s03_u278_ss_position.js` passes 11/0, on real DUEL paths and Replay-audited.
- S1: 死者蘇生 → Defense chosen; `onSpecialSummon` but no `onPositionChange`.
- S2: Attack chosen.
- S3: 早すぎた埋葬 (its text says Attack) → no choice.
- S4: the opponent's 死者蘇生 → the opponent chooses.
- S5: 氷結界の武士 revived in Defense → not destroyed, nothing drawn.

Negative control on U277 (engine files of U277): 3 FAIL, no crash.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17417 PASS / 0 FAIL** (= U277 17406 + 11 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U277.
- Coverage: TESTED 2876, ENGINE_GAP 515, NOT_STARTED 928, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 838 declared, 0 off-target.
- Published in the batched checkpoint S03-U276–U279.
