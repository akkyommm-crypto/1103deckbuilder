# S03-U423 - Field Barrier (フィールドバリア), Court Customs (宮廷のしきたり), Safe Zone (安全地帯)

Base: `claude/work` `167eccd` (U422, gate 21245 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZG_claude_s03_u423_st_shields.js`)
- フィールドバリア: Field Spell destruction immunity + activation lock + one-copy rule.
- 宮廷のしきたり: Continuous Trap destruction immunity + one-copy rule.
- 安全地帯: target immunity / battle and effect destruction immunity / no direct attack for the host + the two destroy links.

## Engine
- None.

## Tests
- `tools/test_s03_u423_st_shields.js` 22 / 0. Negative control on the previous build (card file removed): 13 FAIL. No existing test changed. Coverage TESTED 3432 -> 3435, NOT_STARTED 439 -> 436, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
