# S03-U425 - Monoceros (モノケロース), Hawk Flying over the Crimson Zone (紅蓮地帯を飛ぶ鷹), Resonance Blast (共鳴破), Trapa (トラパート)

Base: `claude/work` `99982d8` (U424, gate 21290 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZI_claude_s03_u425_synchro_mats.js`)
- モノケロース: hand-Spell-banish procedure + Beast Tuner revival after a Synchro Summon with it.
- 紅蓮地帯を飛ぶ鷹: revival when used as a Synchro Material with 3 kinds of 「ラヴァル」 in the Graveyard.
- 共鳴破: destroys an opponent card per 「リゾネーター」 sent as a Synchro Material; expires at my 2nd End Phase.
- トラパート: Warrior-only Synchro Material and the Trap lock of its Synchro Monster's attack.

## Engine (one hook)
- `engine/1ZD_activation_type_lock_s03.js` synchroMatTrapLockS03: the attacker's v380SummonMaterials locks the opponent's Trap activation.

## Tests
- `tools/test_s03_u425_synchro_mats.js` 22 / 0. Negative control on the previous build (card file removed): 11 FAIL. No existing test changed. Coverage TESTED 3439 -> 3443, NOT_STARTED 432 -> 428, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
