# S03-U428 - Greed Grad (グリード・グラード), Balloon Lizard (バルーン・リザード), Blizzard Warrior (ブリザード・ウォリアー), Jurrac Iguanon (ジュラック・イグアノン), Cockroach Knight (コカローチ・ナイト), Infernity Knight (インフェルニティ・ナイト)

Base: `claude/work` `cfa9569` (U427, gate 21352 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZL_claude_s03_u428_provenance.js`)
- グリード・グラード, バルーン・リザード, ブリザード・ウォリアー, ジュラック・イグアノン, コカローチ・ナイト, インフェルニティ・ナイト.

## Engine
- None.

## Tests changed (reason: the ENGINE_GAP overrides of these cards were removed)
- tools/test_v750_batch27.js, test_v760_batch28.js, test_v770_batch29.js, test_v850_batch36.js, test_v860_batch37.js: the names moved from the gap lists to an unlocked record check.

## Tests
- `tools/test_s03_u428_provenance.js` 21 / 0. Negative control on the previous build (card file removed): 9 FAIL. Existing gap-record tests changed (see the report): their lists no longer contain the six cards, an unlocked check records them. Coverage TESTED 3454 -> 3460, NOT_STARTED 427 -> 427, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
