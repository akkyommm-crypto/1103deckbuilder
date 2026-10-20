# S03-U441 - Hand Destruction Quick-Play (手札断殺), Rigras Reaper (リグラス・リーパー), Offering to the Fiend (悪魔への貢物), Fake Hero (フェイク・ヒーロー)

Base: `claude/work` `55978ea` (U440, gate 21630 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZY_claude_s03_u441_hand_choices.js`)
- 手札断殺, リグラス・リーパー, 悪魔への貢物, フェイク・ヒーロー.

## Engine
- None.

## Tests changed (reason: the ENGINE_GAP overrides of these cards were removed)
- tools/test_v720_batch24.js, test_v770_batch29.js, test_v910_batch42.js: the names moved from the gap lists to an unlocked record check.

## Tests
- `tools/test_s03_u441_hand_choices.js` 17 / 0. Negative control on the previous build (card file removed): 8 FAIL. Existing gap-record tests changed (see the report): their lists no longer contain the cards, an unlocked check records them. Coverage TESTED 3515 -> 3519, NOT_STARTED 420 -> 420, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
