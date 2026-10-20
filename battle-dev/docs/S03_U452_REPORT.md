# S03-U452 - Gravedigger Ghoul (墓掘りグール), System Down (システム・ダウン), Miraculous Excavation (奇跡の発掘), Troy Bomb (トロイボム)

Base: `claude/work` `4a0a1ae` (U451, gate 21864 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZZI_claude_s03_u452_grave_banish.js`)
- 墓掘りグール, システム・ダウン, 奇跡の発掘, トロイボム.

## Engine
- None.

## Tests
- `tools/test_s03_u452_grave_banish.js` 14 / 0. Negative control on the previous build (card file removed): 9 FAIL. Existing gap-record tests changed (test_v820_batch33, test_v900_batch41, test_v920_batch43): their lists no longer contain the cards, an unlocked check records them. Coverage TESTED 3563 -> 3567, NOT_STARTED 419 -> 419, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
