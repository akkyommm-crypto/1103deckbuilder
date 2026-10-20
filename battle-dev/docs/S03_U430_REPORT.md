# S03-U430 - Guardian Grarl (ガーディアン・グラール), Guardian Kast (ガーディアン・ケースト), Guardian Elma (ガーディアン・エルマ), Guardian Baou (ガーディアン・バオウ), Guardian Sheel (ガーディアン・シール)

Base: `claude/work` `8b9477a` (U429, gate 21403 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZN_claude_s03_u430_guardians.js`)
- ガーディアン・グラール / ケースト / エルマ / バオウ / シール.

## Engine
- None.

## Tests changed (reason: the ENGINE_GAP overrides of these cards were removed)
- tools/test_v700_batch22.js: ガーディアン・グラール / ケースト moved from the gap list to an unlocked record check.

## Tests
- `tools/test_s03_u430_guardians.js` 22 / 0. Negative control on the previous build (card file removed): 14 FAIL. The ENGINE_GAP overrides of the five cards were removed; gap-record tests that listed them (if any) now record them as unlocked. Coverage TESTED 3467 -> 3472, NOT_STARTED 427 -> 427, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
