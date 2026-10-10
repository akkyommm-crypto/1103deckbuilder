# S03-U219 — Counter Traps (NOT_STARTED 11)

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZZA_claude_s03_u219_counters.js
Each is a chain response to the top link's card activation (`onActivateSuccess`, declared with `declareActivationResponseS03`, engine/1P). Each
negates that activation and destroys the card (`API.negateChainLink(…, 'activation', …, true)`).
- ツタン仮面: a Spell / Trap card activation that targets exactly one face-up Zombie. The targets come from `linkTargetUidsS03`.
- フォースフィールド: a Spell card activation that targets exactly one monster on the field.
- トラップ・ジャマー: only in the Battle Phase, the opponent's Trap card activation.
- ディザーム / パリィ: cost: return a 「剣闘獣」 card from the hand to the Deck, which is then shuffled. They answer a Spell (ディザーム) or a Trap (パリィ)
  card activation.

## Tests
`tools/test_s03_u219_counters.js` passes 14/0, on real DUEL paths and Replay-audited. In each case the opponent activates the card, then the
Counter Trap is offered and activated as a chain response.

Negations, checked by the effect not applying:
- 月の書 leaves the monster face-up;
- 威嚇する咆哮 sets no attack lock;
- 死者蘇生 leaves the monster in the GY.

Negative cases:
- a non-Zombie target;
- a non-targeting Spell;
- the Main Phase for トラップ・ジャマー;
- no 「剣闘獣」 in the hand.

Negative control on U218: 5 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15605 PASS / 0 FAIL** (= U218 15591 + 14 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U218.
- Coverage: TESTED 2579, ENGINE_GAP 598, NOT_STARTED 1142, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 539 declared, 0 off-target.
