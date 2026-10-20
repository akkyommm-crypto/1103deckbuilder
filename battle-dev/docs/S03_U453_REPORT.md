# S03-U453 - Eye of the Gorgon (ゴーゴンの眼), Light of Judgment (裁きの光), Chain Banishment (連鎖除外)

Base: `claude/work` `4a0a1ae` (U452, gate 21878 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZZJ_claude_s03_u453_gorgon_light.js`)
- ゴーゴンの眼, 裁きの光, 連鎖除外.

## Engine
- `engine/00_state_actions.js` effectNegated(): lingering sources (zone 'linger') are consulted for continuous.negateEffect (ゴーゴンの眼). Additive: no existing script declares negateEffect from 'linger'.

## Tests
- `tools/test_s03_u453_gorgon_light.js` 17 / 0. Negative control on the previous build (card file removed): 7 FAIL. Existing gap-record tests changed (test_v730_batch25, test_v900_batch41): their lists no longer contain the cards, an unlocked check records them. Coverage TESTED 3567 -> 3570, NOT_STARTED 419 -> 419, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
