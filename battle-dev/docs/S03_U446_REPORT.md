# S03-U446 - Fiendish Bargain (魔の取引), Dark Spirit Art - Greed (闇霊術－「欲」), Acid Trap Hole (硫酸のたまった落とし穴), Cattle Mutilation (キャトルミューティレーション), Clockwork Rewind (発条の巻き戻し), Telekinetic Power (念導力)

Base: `claude/work` `f4ae1dc` (U445, gate 21720 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZZD_claude_s03_u446_traps_more.js`)
- 魔の取引, 闇霊術－「欲」, 硫酸のたまった落とし穴, 発条の巻き戻し, 念導力.
- キャトルミューティレーション: already implemented and tested by S03-U280 (`tools/test_s03_u280_gap5.js`); only its stale ENGINE_GAP override is removed here (a duplicate definition first written in this unit broke that test and was dropped).

## Engine
- None.

## Tests changed (reason: the ENGINE_GAP overrides of these cards were removed)
- tools/test_v550_batch07.js, test_v620_batch14.js, test_v690_batch21.js: the names moved from the gap lists to an unlocked record check.

## Tests
- `tools/test_s03_u446_traps_more.js` 15 / 0. Negative control on the previous build (card file removed): 9 FAIL. Existing gap-record tests changed (see the report): their lists no longer contain the cards, an unlocked check records them. Coverage TESTED 3537 -> 3543, NOT_STARTED 419 -> 419, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
