# S03-U124 — 超融合: the player chooses the Fusion Monster and materials at resolution

## Why
Found while scouting U123 (hero deck plays 超融合 x3). Measured on U123:
- The Fusion Monster was chosen at activation (`selectTargets`), although 超融合 does not target — by rule both the Fusion
  Monster and the materials are chosen when it resolves.
- The materials were always `combos[0]`, the first combination found, and `superPolyOptions` searched at most 5
  combinations: e.g. with own E・HERO エアーマン + own アンモ・ナイト + the opponent's アンモ・ナイト, the player could not
  choose to fuse the opponent's monster (the point of the card).

## Change (`cards/10_themes_a.js`)
- `selectTargets` → no targets. `resolve` asks (registered ChoiceRequest handlers, uid-based, SaveLoad-safe):
  1. the Fusion Monster (options recomputed at resolution);
  2. the material combination (skipped when there is only one), labels show 自分 / 相手 for every material;
  then re-validates (the materials are still on the field and still a legal combination), sends them to their owners'
  GYs and Fusion Summons (`API.specialSummon(..., {summonKind:'fusion'})` → `specialSummonKind:'fusion'`;
  `fusionMaterialCount` kept for キメラテック・フォートレス・ドラゴン).
- `superPolyOptions`: combination cap 5 → 60 (the engine default).
- The U97 chain lock (no responses to its activation) is unchanged.

## Test — `tools/test_s03_u124_super_polymerization_choice.js` 10/0 (real DUEL path, Replay-audited)
- A: at activation only the discard cost; on the chain nothing chosen, nobody can respond; at resolution the Fusion
  Monster, then 2 combinations labelled 自分 / 相手 → choosing the opponent's アンモ・ナイト sends it to the opponent's GY,
  own アンモ・ナイト stays; アブソルートZero Fusion Summoned (kind fusion, 2 materials).
- B: a single combination → no material question.
- Negative control on U123: A fails (the Fusion Monster was chosen at activation, no material choice existed).
- `tools/test_s03_u97_super_polymerization.js`: its `drive()` stopped at the (new) resolution-time choices — it now
  answers them (single option) before the unchanged assertions; 11/0.

## Status
- No status change (超融合 already TESTED; focus registration added for the new test).

## Notes
- Fusion Summons by effects are placed in Attack Position (`API.specialSummon` convention in this engine); a position
  choice would be more faithful (same note as ギガプラント, U122).
- Face-down monsters are not offered as materials (unchanged; the 2011 ruling was not re-verified here).

## Gate (combined U124 + U125, tree s03_u125)
- `python tools/check.py` — `GATE_EXIT=0`, 13907 PASS lines, 0 FAIL, no Traceback (one caught `TypeError` stack from
  `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level function declarations".
- `dist/battle.html` SHA256 `09ffbc089d07f63b5c10ab16ec800ec0afc5d049ac5dd7fb5561c39932e3585d`; Acode regenerated after the gate: `dist/battle_acode.html` `ec4afebbfe5e1fb6686825da45c17f8610f6b6a3aed0a92ee9a5d476b20b09aa`.
- Coverage: TESTED 2191, IMPLEMENTED 108, ENGINE_GAP 609, GENERIC_OK 644, PARTIAL 172, NOT_STARTED 1272 (4996);
  146 declared status changes, 0 off-target.
