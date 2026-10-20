# S03-U412 - Equipment of Calamity (災いの装備品), D Power Unit (D・パワーユニット), Core Buster (コアバスター)

Base: `claude/work` `faf9a90` (U411, gate 20979 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZV_claude_s03_u412_equips.js`)
- u412Define/u412EquipEffect: u312Define with the already-equipped guard, own/opponent host choice and an optional after-callback.
- 災いの装備品: continuous -600 x my monsters on an opponent host, Graveyard re-equip trigger (equipFromGrave).
- D・パワーユニット: original ATK doubled, turn stamp, destroy + damage at the 2nd own Standby Phase.
- コアバスター: pre-damage destruction of a LIGHT / DARK battle partner, return to the hand when the host leaves.

## Tests
- `tools/test_s03_u412_equips.js` 14 / 0. Negative control on the previous build (card file removed): 7 FAIL. No existing test changed. Coverage TESTED 3390 -> 3393, NOT_STARTED 481 -> 478, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
