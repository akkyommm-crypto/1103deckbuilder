# S03-U444 - Spider Egg (スパイダー・エッグ), Slip Summon (スリップ・サモン), Pineapple Blast (パイナップル爆弾), Hell Blast (ヘル・ブラスト), Broken Blocker (ブロークン・ブロッカー)

Base: `claude/work` `c4bb694` (U443, gate 21684 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZZB_claude_s03_u444_event_traps.js`)
- スパイダー・エッグ, スリップ・サモン, パイナップル爆弾, ヘル・ブラスト, ブロークン・ブロッカー.

## Engine
- None.

## Tests changed (reason: the ENGINE_GAP overrides of these cards were removed)
- tools/test_v890_batch40.js: the names moved from the gap list to an unlocked record check.

## Tests
- `tools/test_s03_u444_event_traps.js` 16 / 0. Negative control on the previous build (card file removed): 5 FAIL. Existing gap-record tests changed (see the report): their lists no longer contain the cards, an unlocked check records them. Coverage TESTED 3527 -> 3532, NOT_STARTED 419 -> 419, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
