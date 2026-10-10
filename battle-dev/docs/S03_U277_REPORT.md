# S03-U277 — Summon negation that returns the monster to the hand: キックバック

## Workflow
- opus-only engine unit (workflow v3). Profile `delegation-expanded-v3-batch3`.
- The Sonnet unit S03-U272 parked キックバック with a reproduction: a negated summon always sent the monster to the GY.
- Built in its own tree on U275 while Sonnet ran S03-U276; rebased onto U276 afterwards.

## Engine
- `summonNegatePendingV2(reason, {toHand:true})` (engine/30) stamps the journaled `SUMMON_WINDOW_NEGATE_V42` action with `toHandS03`.
- The reducer (engine/00) marks the pending summon with `negateToHandS03`.
- `runSummonWindowResumeS03` (engine/40) cancels a marked summon:
  - **Normal Summon:** the monster never reached the field, so it simply stays in its owner's hand. The Normal Summon is used, and Tributes stay paid.
  - **Flip Summon:** the monster is returned from the Monster Zone to its owner's hand (`FX_BOUNCE`).
- Without the flag, nothing changes: a Normal Summon's monster goes to the GY, a Flip Summon's is destroyed.

## Card → TESTED (2011 text) — cards/HZZZZZF_claude_s03_u277_kickback.js
- **キックバック** (Counter Trap): 「モンスターの召喚・反転召喚を無効にし、そのモンスターを持ち主の手札に戻す。」
  - It negates a Normal Summon (including a Tribute Summon) or a Flip Summon by either player, and the monster goes to its owner's hand.
  - It does not respond to Special Summons.

## Existing test adjusted (status record; no behavior assertion changed)
- `test_v530_batch05`: the "Engine unlocked" check replaces the gap check; the count is unchanged (41).

## Tests
`tools/test_s03_u277_kickback.js` passes 12/0, on real DUEL paths (summon windows, summon negation) and Replay-audited.
- K1: the opponent's Normal Summon → back to the hand, and the summon is used.
- K2: a Tribute Summon → back to the hand; the Tribute stays in the GY.
- K3: a Flip Summon → from the Monster Zone back to the hand.
- K4: 死者蘇生 → not offered.

Negative control on U275: 6 FAIL. Engine change alone reverted: 3 FAIL. Rebased onto U276 afterwards.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17406 PASS / 0 FAIL** (= U276 17394 + 12 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U276.
- Coverage: TESTED 2876, ENGINE_GAP 515, NOT_STARTED 928, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 838 declared, 0 off-target.
- Published in the batched checkpoint S03-U276–U279.
