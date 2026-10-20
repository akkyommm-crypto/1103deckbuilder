# S03-U451 - Shallow Grave-Digger (浅すぎた墓穴), Red Oni (赤鬼), Air Circulator (エア・サーキュレーター), Dark Repairer (ダーク・リペアラー), Dark World Demon Rain (暗黒界の魔神 レイン)

Base: `claude/work` `bc6b513` (U450, gate 21835 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZZH_claude_s03_u451_mixed_gap.js`)
- 浅すぎた墓穴, 赤鬼, エア・サーキュレーター, ダーク・リペアラー, 暗黒界の魔神 レイン.

## Engine
- None.

## Tests
- `tools/test_s03_u451_mixed_gap.js` 30 / 0. Negative control on the previous build (card file removed): 11 FAIL. Existing gap-record tests changed (test_v700_batch22, test_v720_batch24, test_v760_batch28, test_v810_batch32, test_v920_batch43): their lists no longer contain the cards, an unlocked check records them. Coverage TESTED 3558 -> 3563, NOT_STARTED 419 -> 419, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
