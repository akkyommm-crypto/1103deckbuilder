# S03-U435 - Newt (ニュート), Genesis Dragon (創世竜), Same-Race Shock Virus (同族感電ウィルス), Zero Guardner (ゼロ・ガードナー), Lesser Fiend (レッサー・デーモン)

Base: `claude/work` `dc5b3e6` (U434, gate 21518 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZS_claude_s03_u435_misc_gap.js`)
- ニュート, 創世竜, 同族感電ウィルス, ゼロ・ガードナー, レッサー・デーモン.

## Engine
- None.

## Tests changed (reason: the ENGINE_GAP overrides of these cards were removed)
- tools/test_v910_batch42.js, test_v920_batch43.js: the names moved from the gap lists to an unlocked record check.

## Tests
- `tools/test_s03_u435_misc_gap.js` 24 / 0. Negative control on the previous build (card file removed): 13 FAIL. Existing gap-record tests changed (see the report): their lists no longer contain the cards, an unlocked check records them. Coverage TESTED 3494 -> 3499, NOT_STARTED 427 -> 427, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
