# S03-U215 — NOT_STARTED 7

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZW_claude_s03_u215_ns7.js
- 華麗なる潜入工作員: `summonNoTrapS03` (the S03-U213 summon-time Trap lock).
- 智天使ハーヴェスト: destroyed by battle and sent to the GY → may add a targeted Counter Trap from the GY.
- 氷結界の虎将 ガンターラ: once per turn, at its controller's End Phase → special summons a targeted 「氷結界」 monster other than itself from the GY.
- 灼熱工の巨匠カエン: a Main Phase ignition from the GY that banishes itself as the cost → all own face-up 「ラヴァル」 monsters +400 ATK.
- 摩天楼2－ヒーローシティ: a Field Spell ignition, once per turn → special summons a targeted 「E・HERO」 that was destroyed by battle and sent to the GY
  (graveInfo).
- インヴェルズ・ギラファ:
  - an extra Tribute Summon method with 1 「インヴェルズ」;
  - when Tribute Summoned with an 「インヴェルズ」 among its Tributes (`summonProvenance.materialRefs`), it sends a targeted opponent card to the GY and
    gains 1000 LP. There is no LP gain if the target is gone.

## Existing test adjusted (driving only, no assertion changed)
`tools/test_s03_u205_partial8.js` scenario E Tribute Summons ギラファ with two monsters. Now that ギラファ has a second (1-Tribute) method, the summon
asks which method to use. The harness's `openPick` does nothing, so the scenario now picks the standard 2-Tribute method itself. Its assertions and
count (20) are unchanged.

## Tests
`tools/test_s03_u215_ns7.js` passes 20/0, on real DUEL paths and Replay-audited. Negative cases:
- no Counter Trap in the GY;
- ガンターラ in the Main Phase, and in the opponent's End Phase;
- an 「E・HERO」 sent to the GY by an effect;
- ギラファ with non-「インヴェルズ」 Tributes.

ヒーローシティ is tested after a real turn change.

Negative control on U214: 8 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15537 PASS / 0 FAIL** (= U214 15517 + 20 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U214.
- Coverage: TESTED 2556, ENGINE_GAP 598, NOT_STARTED 1165, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 516 declared, 0 off-target.
