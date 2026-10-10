# S03-U132 — Fusion-Spell profiles: 龍の鏡 + オーバーロード・フュージョン

## Why
With 融合 on a generic procedure (U130), the next NOT_STARTED fusion spells that 2011 decks use are cheap to add.
- 龍の鏡: F・G・D, 青眼の究極竜.
- オーバーロード・フュージョン: キメラテック・オーバー・ドラゴン.
Both banish materials from the field / GY instead of sending hand / field materials to the GY.

## Change
- `engine/1ZL_fusion_spell_s03.js`: the procedure now reads a per-spell profile, `FUSION_SPELL_PROFILES_S03[spell]`:
  - `zones`: hand / mz / grave;
  - `dispose`: grave or banish;
  - `race` / `attr`: which Fusion Monsters can be summoned;
  - `after`: a named after-summon step.
  The choice handlers carry only the spell name, so every handler argument stays JSON-safe.
  - 融合: hand + field → GY.
  - ダーク・フュージョン: hand + field → GY, 悪魔族, after `oppTargetImmuneTurn`.
  - 龍の鏡: field + GY → banished, ドラゴン族.
  - オーバーロード・フュージョン: field + GY → banished, 機械族・闇属性.
- GY materials are not offered while ネクロバレー stops that move (`graveMoveBlocked`); banishing from the GY is always
  stopped by it.
- Banished materials are not marked `fusionMaterialS03` (that marker is for GY materials).
- `cards/HS_claude_s03_u130_fusion.js`: `defineFusionSpellS03(name, reason)` defines all four spells. Coverage registers them
  as `helper:defineFusionSpellS03`.

## Test — `tools/test_s03_u132_dragon_mirror_overload.js` 12/0 (real DUEL path, Replay-audited)
- A: 龍の鏡 with 1 field + 2 GY 青眼の白龍.
  - Only 青眼の究極竜 is offered (the Machine ガトリング・ドラゴン is not). It is Fusion Summoned, all 3 materials are banished,
    and 龍の鏡 goes to the GY.
  - A material in the hand does not count, so the spell is illegal.
- B: under ネクロバレー the GY materials are unusable (illegal); with all 3 on the field it is legal.
- C: オーバーロード・フュージョン with サイバー・ドラゴン on the field and サイバー・ドラゴン / リボルバー・ドラゴン in the GY.
  - Only キメラテック・オーバー・ドラゴン is offered; the LIGHT サイバー・ツイン・ドラゴン is not.
  - 「機械族モンスター1体以上」 gives several combinations, labelled with their zones. With the 3-material combination all are
    banished and `fusionMaterialCount` is 3.
- `tools/test_s03_u130_polymerization.js` still passes 24/0 on the refactored procedure.
- Negative control on U131: 10 FAIL (no scripts).
- Pre-scan of all 351 gate tests on the U132 build (parallel): 0 FAIL.

## Status
- 龍の鏡 NOT_STARTED → TESTED, オーバーロード・フュージョン NOT_STARTED → TESTED (focus registered).
- TESTED 2197 → 2199, NOT_STARTED 1269 → 1267.
