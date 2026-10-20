# S03-U436 - Drill Synchron (ドリル・シンクロン), Arcana Force IV - The Emperor (アルカナフォースIV－THE EMPEROR), Legendary Gambler (伝説の賭博師), Chaos Black Magician (混沌の黒魔術師)

Base: `claude/work` `4c6d36e` (U435, gate 21542 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZT_claude_s03_u436_coin_pierce.js`)
- ドリル・シンクロン, アルカナフォースIV－THE EMPEROR, 伝説の賭博師, 混沌の黒魔術師.

## Engine
- None.

## Tests changed (reason: the ENGINE_GAP overrides of these cards were removed)
- tools/test_v840_batch35.js, test_v870_batch38.js: the names moved from the gap lists to an unlocked record check.

## Tests
- `tools/test_s03_u436_coin_pierce.js` 23 / 0. Negative control on the previous build (card file removed): 14 FAIL. Existing gap-record tests changed (see the report): their lists no longer contain the cards, an unlocked check records them. Coverage TESTED 3499 -> 3503, NOT_STARTED 427 -> 427, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
