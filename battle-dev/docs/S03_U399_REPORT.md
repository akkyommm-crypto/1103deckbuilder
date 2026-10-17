# S03-U399 - Princess's Trial (王女の試練), Princess of Magic Land Piquel and Clan

Base: `claude/work` `4dbdc2e` (U398, gate 20778 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZI_claude_s03_u399_princess.js`)
- 王女の試練: equip activation (u312EquipEffect, own host only, guarded against re-activation of an equipped card), ATK +800 through a continuous apply; forced onDamageStep stamp (u399KillTurn) when the equipped monster destroys a Level 5+ monster in battle; ignition releasing host and card and Special Summoning the matching Princess from the hand / Deck.
- 魔法の国の王女－ピケル / クラン: Standby Phase recovery 800 x own monsters / damage 600 x opponent monsters; cannotNormalSummon, special summon only through 王女の試練 (text rule of engine/1ZK).

## Tests
- `tools/test_s03_u399_princess.js` 15 / 0. Negative control on the previous build (card file removed): 6 FAIL. No existing test changed. Coverage TESTED 3342 -> 3345, NOT_STARTED 528 -> 525, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
