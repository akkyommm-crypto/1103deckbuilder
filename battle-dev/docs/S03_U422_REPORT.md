# S03-U422 - Wound-Up Spring (巻きすぎた発条), Scrap Oil Zone (スクラップ・オイルゾーン), Plant Fertilizer (増草剤), Blood Swamp (血の沼地)

Base: `claude/work` `2affc2a` (U421, gate 21219 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZF_claude_s03_u422_revival_st.js`)
- 巻きすぎた発条: Zenmai revival (negated, no Release, no Synchro Material).
- スクラップ・オイルゾーン: Scrap revival + Battle Phase ban + the two destroy links.
- 増草剤: Plant revival ignition + no Normal Summon + destroyed when the Plant leaves.
- 血の沼地: no activation of Set cards + self-destroy rules + 2nd Standby expiry.

## Engine
- None.

## Tests
- `tools/test_s03_u422_revival_st.js` 26 / 0. Negative control on the previous build (card file removed): 16 FAIL. No existing test changed. Coverage TESTED 3428 -> 3432, NOT_STARTED 443 -> 439, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
