# S03-U427 - Masked Chopper (マスクド・チョッパー), Atomic Firefly (原子ホタル), Time Eater (タイム・イーター), Big One Warrior (ビッグ・ワン・ウォリアー), Fabled Chawa (魔轟神獣チャワ), Korobokkuri (コロボックリ), Matsubokkuru (マツボックル)

Base: `claude/work` `79093ff` (U426, gate 21329 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZK_claude_s03_u427_gap_cards.js`)
- マスクド・チョッパー / タイム・イーター: battle-destroy triggers (2000 damage / skip of the opponent's next Main Phase 1).
- 原子ホタル: 1000 damage to the destroyer's controller.
- ビッグ・ワン・ウォリアー / 魔轟神獣チャワ / コロボックリ + マツボックル: hand ignition Special Summons with a discard / send cost and the Matsubokkuru revival.

## Engine (one word)
- `engine/16_scheduler_v7.js` main1 added to SKIPPABLE_PHASE_V7.

## Tests changed (reason: the ENGINE_GAP overrides of these cards were removed)
- tools/test_v610_batch13.js, test_v760_batch28.js, test_v770_batch29.js, test_v780_batch30.js, test_v860_batch37.js: the names moved from the gap lists to an unlocked record check.

## Tests
- `tools/test_s03_u427_gap_cards.js` 23 / 0. Negative control on the previous build (card file removed): 14 FAIL. Existing gap-record tests changed (see the report): their lists no longer contain the seven cards, an unlocked check records them. Coverage TESTED 3447 -> 3454, NOT_STARTED 427 -> 427, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
