# S03-U400 - The First Sarcophagus cluster (第一〜第三の棺, スピリッツ・オブ・ファラオ)

Base: `claude/work` `51aae3a` (U399, gate 20793 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZJ_claude_s03_u400_coffin.js`)
- 第一の棺: ACTIVATE sets the stage flag; a forced onEndPhase trigger in the opponent's turn places 第二の棺 then 第三の棺 (act MOVE hand/Deck -> Spell & Trap Zone, face-up) and, when all three are present, sends them to the Graveyard and Special Summons スピリッツ・オブ・ファラオ (reason 第一の棺, conditions ignored). selfDestroyWhenS03 (engine/1ZZF) sends the remaining coffins to the Graveyard when a required one is missing.
- 第二の棺 / 第三の棺: scripts that refuse every activation.
- スピリッツ・オブ・ファラオ: cannotNormalSummon, text rule for the special summon, optional revive of up to 4 Level 2 or lower Undead Normal Monsters.

## Tests
- `tools/test_s03_u400_coffin.js` 10 / 0. Negative control on the previous build (card file removed): 5 FAIL. No existing test changed. Coverage TESTED 3345 -> 3349, NOT_STARTED 525 -> 521, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
