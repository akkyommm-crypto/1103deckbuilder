# S03-U298 — Wider real-duel exploration: save / resume at every stop, 150-turn cap, a Flip trigger of a monster that left the field

## Workflow
- Sonnet battle-implementer, user priority of 2026-10-09 (duel completion). Tree s03_u296, the single current tree, after S03-U297.

## Result
- Sweeps, all 78 pairs, random policy, long harness (900 s), 5 new seed sets (390 duels):
  - save / resume at **every** stop, 2 seed sets: 77 + 77 finished clean (about 60,000 round trips, Replay matched); 2 duels passed 900 s only because of the save / resume cost (turn 61 and 46, 1015 and 763 round trips): re-run with a longer timeout they end clean (deckout), so they are slow, not stalled;
  - maxTurns 150, 2 seed sets, and one set with `R1_RESPOND_P=0.9 R1_PASS_Q=0.05`: 234 duels, 233 clean at the first run; the one blocker is the cause below, clean after the fix (turn 60, lp0, Replay matched).
  - No duel ended only by the turn cap (the longest ended at turn 65 by deckout / lp0).
- TG ワーウルフ's hand effect (check only): it is **not** offered right after a Level 4 or lower monster is Special Summoned. In the real flow (死者蘇生 resolves for either player) there is no SEGOC selection and no POINT window for it (Spell Speed 1 is not a response), while the control ドッペル・ウォリアー appears in the SEGOC selection. It stays in the hand and is a Main Phase hand activation afterwards (legal, `strictScriptLegalityV2` ok). Test u87 A is unchanged.

## Cause fixed
1. A forced Flip trigger of a monster that was destroyed after the flip (W星雲隕石 flips ワーム・カルタロス, 激流葬 destroys it, in one chain) is listed in the forced SEGOC group as if on the field (`treatAsField`, logical zone `mz`), but `eventPickV2` judged the pick on the card in the Graveyard: "この場所・タイミングで発動できる効果がありません", and a forced group cannot be skipped, so the duel stopped. The candidate now carries `logicalZoneS298` (engine/40 `collectHandlers`), `eventPickV2` passes it as `logicalZone`, and the trigger-selection descriptor (engine/1O) keeps it over save / resume. Test `test_s03_u298_flip_trigger_left_field` (A: real chain, B: control on the field, C: save / resume with the group open). Negative control on U297: 4 FAIL.

## Open
- None from this sweep.

## Tests
`tools/test_s03_u298_flip_trigger_left_field.js` 14 PASS / 0 FAIL, Replay-audited. Registered in `tools/check.py` after the last U297 test. Existing tests unchanged.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **18144 PASS / 0 FAIL** (= U297 18130 + 14 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U297.
- Coverage: TESTED 2926, ENGINE_GAP 472, NOT_STARTED 921, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 888 declared, 0 off-target.
- Published in the batched checkpoint S03-U298–U299.
