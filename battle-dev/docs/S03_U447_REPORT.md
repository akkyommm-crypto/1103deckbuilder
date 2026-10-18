# S03-U447 - Provoke (挑発), Wave Barrier (波動障壁), Castle-Breaker Lance (城壁壊しの大槍), Two-Man Cell Battle (ツーマンセルバトル), Mirror of Sealing Gods (封神鏡)

Base: `claude/work` `78ecf95` (U446, gate 21735 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZZE_claude_s03_u447_lock_lance.js`)
- 挑発, 波動障壁, 城壁壊しの大槍, ツーマンセルバトル, 封神鏡.

## Engine
- None.

## Tests changed (reason: the ENGINE_GAP overrides of these cards were removed)
- tools/test_v690_batch21.js, test_v700_batch22.js, test_v710_batch23.js: the names moved from the gap lists to an unlocked record check.

## Tests
- `tools/test_s03_u447_lock_lance.js` 19 / 0. Negative control on the previous build (card file removed): 11 FAIL. Existing gap-record tests changed (see the report): their lists no longer contain the cards, an unlocked check records them. Coverage TESTED 3543 -> 3548, NOT_STARTED 419 -> 419, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
