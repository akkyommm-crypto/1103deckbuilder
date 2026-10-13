# S03-U310 — トゥーン monsters, part 2 (デーモン, マーメイド, ドラゴン・エッガー, ブラック・マジシャン・ガール, ブルーアイズ・トゥーン・ドラゴン)

Base: `claude/work` `b07eb6e` (U309, gate 18325 PASS / 0 FAIL). Sonnet 5.5, single writer. Requirement: the nine トゥーン monsters (shared clauses, S03-U309) — the five with a Special Summon procedure. All five were NOT_STARTED.

## Change (`cards/HZZZZZW_claude_s03_u310_toon2.js`, on `toonCommonS03`)
- Procedure (`summonProcedure`, from the hand, no chain): needs the controller's トゥーン・ワールド and releases N own monsters (デーモン 1, マーメイド 0, エッガー 2, BMG 1, BEWD 2); the monsters are chosen first, then released together as the cost. 「通常召喚できない」 comes from the text (engine/70).
- Common additions in `toonCommonS03`: `special` (the summon-turn ban applies to Special Summons), `noBan` (BMG has no such clause), `mustToon` (engine/1ZU `cannotBeAttackedByS03` with `cannotBeAttackTargetBothS03`: with a face-up Toon on the opposing field only a Toon may be the attack target), `lpCost` (`attackLpCostS03` 500, paid at the declaration).
- BMG: ATK +300 per 「ブラック・マジシャン」 / 「マジシャン・オブ・ブラックカオス」 in both Graveyards (by card name).
- Engine (engine/1ZW): `sp.freesZoneS03(p)` — a procedure whose cost releases own monsters may be used with a full Monster Zone (Tribute-Summon-like).
- Ruling used: デーモン 「(レベル5以上はリリースが必要)」 = the Tribute Summon count for its Level (Lv6 → 1 monster).

## Tests
- `tools/test_s03_u310_toon2.js` 78 / 0 (procedure with / without トゥーン・ワールド, release counts, full zone, summon-turn ban, 500 LP, attack-target rule incl. a face-down monster, destruction with トゥーン・ワールド, BMG ATK); negative control on the previous build: 45 FAIL. `test_s03_u309_toon.js` still 34 / 0.
- Coverage: TESTED 2937 → 2942, NOT_STARTED 910 → 905; audit 0 off-target. All nine トゥーン monsters are now TESTED / GENERIC_OK.
