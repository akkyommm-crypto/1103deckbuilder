# S03-U396 - Magic-Sealing Aroma (魔封じの芳香), Frozen-Realm Spell Breaker (氷結界の破術師), Eight-Hand Scorpion (八つ手サソリ), A.O.J. Reverse Break

Base: `claude/work` `faa3baa` (U395, gate 20722 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZZF_claude_s03_u396_scent.js`)
- 魔封じの芳香 (Continuous Trap) and 氷結界の破術師 share `u396SpellLock`: activationLockS03 (engine/1ZD) refuses a Spell activated from the hand and a Set Spell until two turns after its setTurn; the monster only while another 「氷結界」 monster is face-up on its controller's field.
- 八つ手サソリ: once-per-turn ignition (face-down Defense Position) and a damage-step ATK of 2400 when the attacked monster was face-down (gameState.battle.flipped).
- A・O・J リバース・ブレイク: a3PreDamageDestroy for the face-down Defense target and selfDestroyWhenS03 while a face-up LIGHT monster is on the field.

## Tests
- `tools/test_s03_u396_scent.js` 19 / 0. Negative control on the previous build (card file removed): 10 FAIL. No existing test changed. Coverage TESTED 3332 -> 3336, NOT_STARTED 538 -> 534; `registration_names_missing_from_db` empty; audit 0 FAIL.
