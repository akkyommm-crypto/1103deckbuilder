# S03-U413 - Gem-Knight Fusion Trap (輝石融合), Particle Fusion (パーティカル・フュージョン), No-Fusion Area (融合禁止エリア)

Base: `claude/work` `bf6f17a` (U412, gate 20993 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZW_claude_s03_u413_fusion.js`)
- 輝石融合 and パーティカル・フュージョン: profiles of the Fusion-Spell subsystem (S03-U130/U133) + the Gem-Knight boost trigger of the Spell.
- 融合禁止エリア: Continuous Trap with the fusionSummonBanS03 flag.

## Engine (small)
- `engine/40_legal_script_engine.js` API.specialSummon refuses summonKind 'fusion' while deckLockSourceS03(…, 'fusionSummonBanS03'); `engine/1ZL_fusion_spell_s03.js` fusionSpellOptionsS03 returns nothing then.

## Tests
- `tools/test_s03_u413_fusion.js` 14 / 0. Negative control on the previous build (card file removed): 8 FAIL. No existing test changed. Coverage TESTED 3393 -> 3396, NOT_STARTED 478 -> 475, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
