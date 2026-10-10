# S03-U133 — パワー・ボンド + ジェムナイト・フュージョン; Fusion Summon position for 超融合 / ミラクル・フュージョン

## Why
- パワー・ボンド (サイバー流) and ジェムナイト・フュージョン (ジェムナイト) were NOT_STARTED, blocking those decks. Both fit the
  U130/U132 Fusion-Spell profiles.
- Deferred finding: 超融合 and ミラクル・フュージョン always Fusion Summoned in Attack Position. A Fusion Summon is face-up ATK or
  DEF, and the player chooses.

## Change
- `engine/1ZL_fusion_spell_s03.js`, new profiles:
  - パワー・ボンド: hand + field → GY, 機械族. After-step `powerBond` adds a permanent MOD_ADD of the monster's original
    ATK (`baseAtkV14`), then schedules this turn's End Phase damage with System v7 (`s03u133.power-bond-damage` →
    `API.damageLP`). The damage happens even if the monster has left the field.
  - ジェムナイト・フュージョン: hand + field → GY. The new profile field `exNameIncludes:'ジェムナイト'` limits it to
    「ジェムナイト」 Fusion Monsters.
- `cards/HS_claude_s03_u130_fusion.js`:
  - パワー・ボンド is defined with `defineFusionSpellS03`.
  - ジェムナイト・フュージョン is a v4 card:
    - `fusion` (ACTIVATE) uses the procedure.
    - `salvage` (IGNITION in the GY) has a cost that banishes a chosen 「ジェムナイト」 monster from the own GY (chosen at
      activation), then returns the card from the GY to the hand. It is illegal while ネクロバレー stops GY banishing.
- `cards/10_themes_a.js` 超融合 and `cards/30_themes_b.js` ミラクル・フュージョン: after the material choice, the player chooses
  face-up ATK / DEF (handlers `s03u133.superpoly-pos` / `s03u133.miracle-pos`). The commit then re-validates as before.
- `tools/test_s03_u124_super_polymerization_choice.js`: the driver answers the new position question (assertions
  unchanged).

## Test — `tools/test_s03_u133_power_bond_gem_fusion.js` 18/0 (real DUEL path, Replay-audited)
- A: パワー・ボンド with 2 サイバー・ドラゴン in the hand.
  - Only Machine Fusion Monsters are offered.
  - サイバー・ツイン・ドラゴン has ATK 5600, with no damage until the End Phase, then 2800.
  - Destroyed before the End Phase, it still deals 2800.
- B: ジェムナイト・フュージョン.
  - ① ガネット + サフィア → ジェムナイト・ルビーズ in DEF. Both 「ジェムナイト」 Fusion Monsters are offered, but not
    ガトリング・ドラゴン.
  - ② from the GY banishes the chosen サフィア and returns the spell to the hand. It is illegal with no 「ジェムナイト」
    monster in the GY.
- C: 超融合 → E・HERO アブソルートZero in DEF; ミラクル・フュージョン → フレイム・ウィングマン in DEF. Both ask the position.
- Negative control on U132: 14 FAIL.
- The U124 / U96 / U97 / U126 / U130 / U132 fusion tests pass on the U133 build.
- Pre-scan of all 352 gate tests (parallel): 0 FAIL.

## Not in this unit (recorded)
- 未来融合 still summons in ATK: its summon runs inside a scheduled Standby Phase handler, where opening a choice is not
  proven safe.

## Status
- パワー・ボンド NOT_STARTED → TESTED, ジェムナイト・フュージョン NOT_STARTED → TESTED. 超融合 / ミラクル・フュージョン stay
  TESTED (focus added).
- TESTED 2199 → 2201, NOT_STARTED 1267 → 1265.
