# S03-U223 — NOT_STARTED 15

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZZE_claude_s03_u223_ns15.js
- 畳返し: a Counter Trap. It negates and destroys a monster effect activated at its summon success: the chain link was triggered by `onNormalSummon`.
- ツバメ返し: a Counter Trap. It does the same for the special summon success: the link was triggered by `onSpecialSummon`.
- 黒光りするG: when the opponent special summons exactly one Synchro Monster → it banishes itself from the GY (cost) and destroys that monster. It
  works in either turn.
- 黒蠍－棘のミーネ: when it inflicts battle damage, its controller chooses a mode:
  - add a 「黒蠍」 card from the Deck, or
  - add a 「黒蠍」 card from the GY.
  Only the modes that are available are offered.
- スケイルモース: while it is face-up, a player who has already special summoned this turn cannot special summon again.
  - It uses `specialSummonLockS03`.
  - It reads `P.ssHistory`, which records every summon path: effects, Synchro / Xyz / Fusion, and Ritual.

## Tests
`tools/test_s03_u223_ns15.js` passes 14/0, on real DUEL paths and Replay-audited.
- Each Counter Trap is activated in the chain window of the summon trigger. The 死者蘇生 window is passed first.
- ツバメ返し is not offered against a Normal Summon trigger.
- 黒光りするG answers a real Synchro Summon by the opponent.
- ミーネ: both modes.
- スケイルモース: a first 死者蘇生, then the lock; the other player is unaffected.

Negative control on U222: 7 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15675 PASS / 0 FAIL** (= U222 15661 + 14 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U222.
- Coverage: TESTED 2607, ENGINE_GAP 598, NOT_STARTED 1114, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 567 declared, 0 off-target.
