# S03-U359 — four position-dependent 「D」 monsters

Base: `claude/work` `62172f0` (U358, gate 19946 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZU_claude_s03_u359_dmonsters.js`)
- 「D」 = `SETCODE.MORPHTRONIC` (`isSetCardV4`); each hook / condition reads the card's own position (`card.pos`), as D・ラジオン does.
- D・スコープン: ignition (meta `countLimit:1`, Attack Position only): a D Level 4 monster from the hand, destroyed in the End Phase (`v340ScheduleEndDestroy`); `continuous.setLevel` 4 in Defense Position.
- D・マグネンU: Defense Position: `cannotBeAttackTarget` on the controller's other monsters; Attack Position: `cannotBeAttackedByS03(target, attacker, self)` + `cannotBeAttackTargetBothS03` (the restriction is on its own attacks) — only the highest-ATK opposing face-up monster can be chosen.
- D・マグネンI: Defense Position: continuous `cannotAttack` on all the controller's monsters; Attack Position: ignition with exactly two other face-up Attack Position monsters — `v4RegisterStatModifier({atk:sum})` until the End Phase and a turn-stamped card flag that makes `cannotAttack` apply to the other monsters.
- D・キャメラン: Graveyard trigger when destroyed by battle in Attack Position (`graveInfo.battle`, `pos`, `face`): Special Summon a D of Level 4 or lower (not itself) from the hand or the Graveyard; Defense Position: `immuneToTarget` for every D monster on both fields.
- Not part of this unit: D・パッチン (the Defense Position substitute for OTHER D monsters), D・モバホン (dice), D・ライトン (effect damage redirected), D・フィールド / D・パワーユニット / D・フォーメーション / D－シールド (counters / equips).

## Tests
- `tools/test_s03_u359_dmonsters.js` 28 / 0. Negative control on the previous build: 16 FAIL. Coverage TESTED 3191 → 3195, NOT_STARTED 659 → 655; `registration_names_missing_from_db` empty; audit 0 FAIL.
