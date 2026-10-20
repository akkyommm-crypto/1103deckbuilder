# S03-U410 - Sun Dragon Inti, Moon Shadow Dragon Quila and Speed King Skull Flame

Base: `claude/work` `498828d` (U409, gate 20953 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZT_claude_s03_u410_inti.js`)
- 太陽龍インティ: one forced Graveyard effect (battle destruction part + scheduled revival of 月影龍クイラ at the next turn's Standby Phase).
- 月影龍クイラ: forced onAttackDeclare recovery and an optional Graveyard revival of 太陽龍インティ.
- スピード・キング☆スカル・フレイム: summonProcedure with a banish cost, once-per-turn burn, optional Graveyard revival of スカル・フレイム.

## Tests
- `tools/test_s03_u410_inti.js` 15 / 0. Negative control on the previous build (card file removed): 10 FAIL. No existing test changed. Coverage TESTED 3384 -> 3387, NOT_STARTED 487 -> 484, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
