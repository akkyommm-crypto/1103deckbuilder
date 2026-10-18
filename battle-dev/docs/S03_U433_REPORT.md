# S03-U433 - Core Chimera Devil (コアキメイル・デビル), Core Chimera Power Hand (コアキメイル・パワーハンド), G Kozaky (G・コザッキー), Turret Warrior (ターレット・ウォリアー), Vice Dragon (バイス・ドラゴン), Death Kangaroo (デス・カンガルー)

Base: `claude/work` `956fe7a` (U432, gate 21468 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZQ_claude_s03_u433_koaki_misc.js`)
- コアキメイル・デビル, コアキメイル・パワーハンド, G・コザッキー, ターレット・ウォリアー, バイス・ドラゴン, デス・カンガルー.

## Engine
- `engine/00_state_actions.js`: `mzNegateS03(card, loc)` — collectSources(['mz'], true) also drops a monster negated by a declared face-up monster source (ゴーレム and the two new コアキメイル), so its continuous effect stops too (ゴーレム's gap noted in U432 closed).

## Tests changed (reason: the ENGINE_GAP overrides of these cards were removed)
- tools/test_v570_batch09.js, test_v650_batch17.js, test_v660_batch18.js, test_v690_batch21.js: the names moved from the gap lists to an unlocked record check.

## Tests
- `tools/test_s03_u433_koaki_misc.js` 32 / 0. Negative control on the previous build (card file removed): 13 FAIL. Existing gap-record tests changed (see the report): their lists no longer contain the cards, an unlocked check records them. Coverage TESTED 3483 -> 3489, NOT_STARTED 427 -> 427, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
