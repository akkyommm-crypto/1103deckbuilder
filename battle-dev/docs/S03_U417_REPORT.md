# S03-U417 - Plant Chain (植物連鎖), Burning Spirit (燃える闘志), Sword-Body Unity (身剣一体), Evil Blast (イービル・ブラスト)

Base: `claude/work` `fc086de` (U416, gate 21087 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZA_claude_s03_u417_trap_equips.js`)
- 植物連鎖 / 燃える闘志 / 身剣一体 / イービル・ブラスト: Normal Traps that become Equip Cards (u417TrapEquip: ACTIVATE + API.equipSpell), continuous stat via equippedS03.
- 植物連鎖: Graveyard revival after an effect destruction; 燃える闘志: setFinalAtk in the Damage Step; 身剣一体: lone 「X－セイバー」 condition + draw after a battle destruction; イービル・ブラスト: answers the opponent's Special Summon, 500 damage each opponent Standby Phase.

## Engine
- None.

## Tests
- `tools/test_s03_u417_trap_equips.js` 22 / 0. Negative control on the previous build (card file removed): 11 FAIL. No existing test changed. Coverage TESTED 3408 -> 3412, NOT_STARTED 463 -> 459, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
