# S03-U163 — Synchro / Xyz Summons check their materials

## Why
S03-U162 found that the U156 test had Synchro Summoned ゴヨウ・ガーディアン with a DARK Tuner. ゴヨウ needs an EARTH Tuner. The summon entry point `beginExSummonV2` (reached from the EX deck UI and from `doExSummon`) trusted whatever materials it was given. The UI only offers legal sets from `exCombos`, but tests, replays and effects calling the entry point were not checked. A test could therefore "prove" a card with an impossible summon.

## Change
- `exCombos(p, db, onlyIdx)` can be restricted to given candidate indexes (engine/20).
- `exMaterialsLegalS03(p, exDb, materials)`: the given materials must form a legal set by themselves — exCombos restricted to exactly them, so the combination limit (60) cannot hide a legal set. No duplicates, no empty set. Permissive specs (no parsed material text) stay accepted.
- `beginExSummonV2` refuses an illegal set before anything moves: toast 「素材の条件を満たしていません」, no summon window, materials stay.

## Tests
`tools/test_s03_u163_ex_material_check.js` 9/0:
- **Synchro**: ゴヨウ・ガーディアン with ジャンク・シンクロン (DARK) is refused; with カラクリ参謀 弐四八 (EARTH) it succeeds.
- **Xyz**: エヴォルカイザー・ラギア with two Lv4 Warriors is refused; with two Lv4 Dinosaurs (セイバーザウルス / ワイルド・ラプター) it succeeds.
- **Level total**: a wrong total Level is refused; a legal pair picked among four monsters (not the first combination) is accepted.
- **Helper**: `exMaterialsLegalS03` on duplicated / missing / empty sets.
- **Negative control on U162**: 3 FAIL + 1 error.

Gate tests with illegal materials, found by the pre-scan with the new check:
- `test_s03_u46_royal_oppression.js` G Xyz Summoned エヴォルカイザー・ラギア (「恐竜族レベル4モンスター×2」) with 真六武衆－キザン and 六武衆－ザンジ (Warriors). It now uses two Lv4 Dinosaur Normal Monsters: 26/26, assertions unchanged.
- `test_s03_u156_deck_triggers.js` D was already fixed in U162.
- No other gate test was affected (pre-scan: every other file unchanged).

## Status
No status change. Totals: TESTED 2271, IMPLEMENTED 85, GENERIC_OK 644, PARTIAL 149, ENGINE_GAP 604, NOT_STARTED 1243.
