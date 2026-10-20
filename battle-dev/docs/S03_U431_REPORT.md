# S03-U431 - Mother Spider (マザー・スパイダー), Rose Fairy (薔薇の妖精), Rose Bird (ローズ・バード), Warrior Raz (戦士ラーズ), Dark Verger (ダーク・ヴァージャー), Hope of the Fifth (ホープ・オブ・フィフス)

Base: `claude/work` `76e9106` (U430, gate 21425 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZO_claude_s03_u431_gap_misc.js`)
- マザー・スパイダー, 薔薇の妖精, ローズ・バード, 戦士ラーズ, ダーク・ヴァージャー, ホープ・オブ・フィフス.

## Engine
- None.

## Tests changed (reason: the ENGINE_GAP overrides of these cards were removed)
- tools/test_v670_batch19.js, test_v680_batch20.js, test_v760_batch28.js, test_v860_batch37.js, test_v870_batch38.js: the names moved from the gap lists to an unlocked record check.

## Tests
- `tools/test_s03_u431_gap_misc.js` 21 / 0. Negative control on the previous build (card file removed): 10 FAIL. Existing gap-record tests changed (see the report): their lists no longer contain the cards, an unlocked check records them. Coverage TESTED 3472 -> 3478, NOT_STARTED 427 -> 427, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
