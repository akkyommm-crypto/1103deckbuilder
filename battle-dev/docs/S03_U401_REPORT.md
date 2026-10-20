# S03-U401 - Ouija Board (ウィジャ盤) and the four Death Messages

Base: `claude/work` `19357a7` (U400, gate 20803 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZK_claude_s03_u401_ouija.js`)
- ウィジャ盤: ACTIVATE resets the stage flag; a forced onEndPhase trigger in the opponent's turn places 「E」, 「A」, 「T」, 「H」 in order (act MOVE hand/Deck -> Spell & Trap Zone); specialWinS03 {field} makes the controller win when all five stand there; selfDestroyWhenS03 sends the rest to the Graveyard when one is missing.
- 死のメッセージ「E」「A」「T」「H」: scripts refusing every activation, registered with literal names.

## Engine
- `engine/1ZZL_special_win_s03.js`: specialWinMetS03 also reads `specialWinS03.field` (every named card face-up in the player's Spell & Trap Zone).

## Tests
- `tools/test_s03_u401_ouija.js` 10 / 0. Negative control on the previous build (card file removed): 6 FAIL. No existing test changed. Coverage TESTED 3349 -> 3354, NOT_STARTED 521 -> 516, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
