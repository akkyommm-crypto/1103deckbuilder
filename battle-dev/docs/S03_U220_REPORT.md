# S03-U220 — special-summon and activation locks (NOT_STARTED 12)

## Engine
- `engine/40` `scriptSpecialSummonLockS03` (S03-U211) now also reads face-up Spells / Traps in the Spell & Trap Zone and the Field Zone, not
  only monsters.
  - A card still being activated (`activationPending`) applies nothing, and neither does a negated one.
  - The first user is 召喚制限－パワーフィルター, a Continuous Spell.

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZZB_claude_s03_u220_locks.js
- 干ばつ / 業火 / 深淵 / 烈風 / 豪雨 / 閃光の結界像: while face-up, both players may special summon only monsters of the statue's Attribute
  (`specialSummonLockS03`).
- 召喚制限－パワーフィルター: while face-up, no monster with 1000 or less ATK can be special summoned, by either player.
- 虚無の統括者: it cannot be special summoned, and while it is face-up the opponent cannot special summon.
- 漆黒の戦士 ワーウルフ: the opponent cannot activate Trap cards in the Battle Phase (`activationLockS03`, S03-U217).
- 暗黒の侵略者: the opponent cannot activate Quick-Play Spell cards.

## Tests
`tools/test_s03_u220_locks.js` passes 19/0, on real DUEL paths and Replay-audited.
- Each statue is checked with a monster of its own Attribute and one of another Attribute, for both players.
- 死者蘇生 under 豪雨の結界像 skips 青眼 and summons the WATER monster.
- パワーフィルター is activated from the hand; then 死者蘇生 skips ワイト.
- Face-down cards lock nothing.
- 虚無の統括者 locks only the opponent, and cannot be special summoned itself.
- Both activation locks are checked where they apply and where they don't.

Negative control on U219: 15 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15624 PASS / 0 FAIL** (= U219 15605 + 19 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U219.
- Coverage: TESTED 2589, ENGINE_GAP 598, NOT_STARTED 1132, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 549 declared, 0 off-target.
