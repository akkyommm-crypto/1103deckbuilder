# S03-U408 - Buster Mode (バスター・モード) and the six /Buster monsters

Base: `claude/work` `72da4f4` (U407, gate 20907 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZR_claude_s03_u408_buster.js`)
- バスター・モード: release a Synchro (cost), Special Summon the Deck monster named '<Synchro>／バスター'.
- The six Busters share u408Meta / u408ReviveEffect (optional Graveyard revival of the base monster after a destruction on the field) and cannotNormalSummon; the special summon restriction is the text rule of engine/1ZK.
- Individual effects: RDD sweep after damage calculation, HPG drain, Archnite counters (+1000 ATK each, remove 2 to destroy the opponent's cards), Gigantic Fighter ATK reduction and Deck Warrior mill, Stardust negation with End Phase return, Deathkaiser Undead revival with negation and End Phase destruction.

## Tests
- `tools/test_s03_u408_buster.js` 28 / 0. Negative control on the previous build (card file removed): 19 FAIL. Existing test changed (reason): `tools/test_v620_batch14.js` asserted that バスター・モード is a precise ENGINE_GAP in data/script_status_overrides.json; the entry was removed because the card now has a script, so that check is replaced by 'registered and no override' (same check count). Coverage TESTED 3373 -> 3380, NOT_STARTED 497 -> 491, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
