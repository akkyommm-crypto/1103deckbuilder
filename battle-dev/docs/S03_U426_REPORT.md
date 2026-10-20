# S03-U426 - Flare Resonator (フレア・リゾネーター), Needle Gunner (ニードル・ガンナー), Trust Guardian (トラスト・ガーディアン), Chain Dog (チェーンドッグ)

Base: `claude/work` `a4cfee1` (U425, gate 21312 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZJ_claude_s03_u426_material_gifts.js`)
- フレア・リゾネーター: +300 ATK for the Synchro Monster.
- ニードル・ガンナー: piercing for the Synchro Monster.
- トラスト・ガーディアン: once-per-turn battle immunity (then -400 ATK / DEF), Level 7+ Synchro only.
- チェーンドッグ: Graveyard procedure with exactly two Beasts, Beast Synchro only.

## Engine (three options)
- `engine/00_state_actions.js` synchroMatModS03 (EX_SUMMON_COMMIT_V42 / FX_EX_SUMMON), synchroMatPierceS03 (applyPiercingDamage), afterUseS03 in the battle kill functions; `engine/1K_destruction_protection_v21.js` synchroMatProtectV21.

## Tests
- `tools/test_s03_u426_material_gifts.js` 17 / 0. Negative control on the previous build (card file removed): 8 FAIL. Existing tests changed with the reason that three cards left ENGINE_GAP: `tools/test_v580_batch10.js` (フレア・リゾネーター moved from the ENGINE_GAP list to an unlocked check) and `tools/test_v860_batch37.js` (ニードル・ガンナー the same); the three overrides were removed from `data/script_status_overrides.json` (フレア・リゾネーター, ニードル・ガンナー, チェーンドッグ). Coverage TESTED 3443 -> 3447, NOT_STARTED 428 -> 427, ENGINE_GAP 468 -> 465, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
