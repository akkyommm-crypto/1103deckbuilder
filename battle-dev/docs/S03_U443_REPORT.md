# S03-U443 - Overlimit (オーバーリミット), Illusion of the Ritual Mirror (儀水鏡の幻影術), Prayer to the Gusta (ガスタへの祈り), Scarlet Carpet (スカーレッド・カーペット)

Base: `claude/work` `456dc74` (U442, gate 21671 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZZA_claude_s03_u443_traps_revive.js`)
- オーバーリミット, 儀水鏡の幻影術, ガスタへの祈り, スカーレッド・カーペット.

## Engine
- None.

## Tests changed (reason: the ENGINE_GAP overrides of these cards were removed)
- tools/test_v820_batch33.js (names removed from the gap list and from the activation-time list, an unlocked record added inside the try block), tools/test_v830_batch34.js.

## Tests
- `tools/test_s03_u443_traps_revive.js` 14 / 0. Negative control on the previous build (card file removed): 7 FAIL. Existing gap-record tests changed (see the report): their lists no longer contain the cards, an unlocked check records them. Coverage TESTED 3523 -> 3527, NOT_STARTED 419 -> 419, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
