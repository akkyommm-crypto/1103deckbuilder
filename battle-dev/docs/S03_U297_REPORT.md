# S03-U297 — Random-policy major-deck duels, hand-size resume, TG spell speed

## Workflow
- Sonnet battle-implementer, user priority of 2026-10-09 (duel completion). Tree s03_u296, the single current tree, after S03-U296.

## Result
- R1 driver `R1_POLICY=random` (own PRNG; `R1_POLICY_SEED`, `R1_RESPOND_P`, `R1_PASS_Q`): random choices, triggers, responses, main-phase actions and attacks. Default unchanged. Also `R1_NODIGEST`, `R1_SAVESIZE`.
- Sweeps, all 78 pairs:
  - random policy on 3 seed sets: 78 / 78 clean each;
  - random policy with save / resume every 3 stops, 2 seed sets: 77 and 73 before the fix, 78 / 78 each after (about 17,500 round trips, Replay matched).
- Real save size (long duel, 43 turns, without the driver's digestText): 285 KB (state 30 KB + replay 246 KB). The 9–13 MB seen in the sweeps comes from the driver's per-action digestText. No action needed.

## Causes fixed
1. The End Phase hand-size choice was saved open and resumed, and then the turn did not advance: `offerResumeDuel` dropped the waiting TURN unit. `restoreProcessorAfterLoadS296` (engine/1ZZP) now puts it back. Test `test_s03_u297_hand_limit_resume`. Negative control on U296: 2 FAIL.
2. TG ワーウルフ / TG ストライカー registered spell speed 2. They are spell speed 1 (Opus ruling); the hand condition reads the summoned monster of the event. Test `test_s03_u297_tg_werewolf_speed`. Negative control on U296: 5 FAIL.

## Open
- Making TG ワーウルフ's hand effect a real SEGOC trigger (like ドッペル・ウォリアー) would fail assertion A of `test_s03_u87_tg_warwolf_striker`, which assumes the old non-trigger model. Not done; it does not stop duels.

## Tests
The 2 tests above: 21 PASS / 0 FAIL, Replay-audited. Existing tests are unchanged.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **18130 PASS / 0 FAIL** (= U296 18109 + 21 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U296.
- Coverage: TESTED 2926, ENGINE_GAP 472, NOT_STARTED 921, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 888 declared, 0 off-target.
- Published in the batched checkpoint S03-U296–U297.
