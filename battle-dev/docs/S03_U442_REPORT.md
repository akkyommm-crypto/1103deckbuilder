# S03-U442 - Dangerous Machine TYPE-6 (デンジャラスマシン TYPE－6), Gladiator Change (グラディアル・チェンジ), Dark Scheme (暗黒の謀略), Bad End Queen Dragon (バッド・エンド・クイーン・ドラゴン)

Base: `claude/work` `092bd88` (U441, gate 21647 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZZ_claude_s03_u442_dice_discard.js`)
- デンジャラスマシン TYPE－6, グラディアル・チェンジ, 暗黒の謀略, バッド・エンド・クイーン・ドラゴン.

## Engine
- None.

## Tests changed (reason: the ENGINE_GAP overrides of three cards were removed)
- tools/test_v530_batch05.js, test_v630_batch15.js, test_v910_batch42.js: the names moved from the gap lists to an unlocked record check.

## Tests
- `tools/test_s03_u442_dice_discard.js` 24 / 0. Negative control on the previous build (card file removed): 16 FAIL. Existing gap-record tests changed (see the report): their lists no longer contain the cards, an unlocked check records them. Coverage TESTED 3519 -> 3523, NOT_STARTED 420 -> 419, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
