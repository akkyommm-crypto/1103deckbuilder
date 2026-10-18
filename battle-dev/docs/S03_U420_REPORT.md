# S03-U420 - Alien Skull (エーリアン・スカル), Volcanic Queen (ヴォルカニック・クイーン), Torch Golem (トーチ・ゴーレム), Lava Golem (溶岩魔神ラヴァ・ゴーレム)

Base: `claude/work` `f9be4a8` (U419, gate 21168 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZD_claude_s03_u420_foe_field.js`)
- エーリアン・スカル / ヴォルカニック・クイーン / トーチ・ゴーレム / 溶岩魔神ラヴァ・ゴーレム: procedures with toFoeS03 (onto the opponent field), the Normal Summon ban of the turn, the A Counter, the Queen's burn / upkeep, the Lava Golem's Standby damage, the Torch tokens.

## Engine (small)
- `engine/40_legal_script_engine.js` summonProcedure.toFoeS03 / freesFoeZoneS03 (legality and doSpecialFromZoneUidV370 summon the card for the opponent: FX_SPECIAL_SUMMON player = opponent, fromPlayer = summoner).

## Tests
- `tools/test_s03_u420_foe_field.js` 24 / 0. Negative control on the previous build (card file removed): 17 FAIL. No existing test changed. Coverage TESTED 3420 -> 3424, NOT_STARTED 451 -> 447, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
