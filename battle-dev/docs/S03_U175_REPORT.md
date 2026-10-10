# S03-U175 — contact fusion with a full Monster Zone (user priority, 2026-09-27)

## Finding (U174 follow-up)
The special-summon procedure refused 「モンスターゾーンが一杯です」 before its cost was considered, so with five monsters on the field
no contact fusion was possible — although the materials leave the field before the summon.

## Change
- `strictSummonProcedureLegality` (engine/40): a full Monster Zone is not a refusal when the procedure's cost frees one of the
  player's own zones (`summonProcedureFreesZoneS03`, engine/1ZW; contact fusion only).
- `contactCombosS03`: with a full Monster Zone only the material sets that take at least one of the player's own monsters are
  legal / offered (キメラテック・フォートレス・ドラゴン can take only the opponent's monsters — that frees no zone).
- The summon itself is unchanged: the materials move as the cost, then the summon negation window, then the summon into the freed zone.

## Tests
`tools/test_s03_u175_contact_full_zone.js` 8/0 (real DUEL path, Replay-audited):
- A: five own monsters incl. E・HERO ネオス + N・グラン・モール → legal; グラン・ネオス summoned, 4 monsters left.
- B: five own non-Machines, the opponent's サイバー・ドラゴン + メカ・ハンター → not legal (「モンスターゾーンが一杯です」).
- C: one own メカ・ハンター among the five → legal; every offered set includes it; キメラテック summoned, 5 monsters again.
Negative control on U174: A and C fail (refused with a full zone); B passes on both (the guard).

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **14717 PASS / 0 FAIL** (= U174 14709 + 8 new, exactly), no Traceback / ReferenceError; the
  caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan: only the new test differs from U174. Coverage unchanged (TESTED 2292 …); audit 253 declared, 0 off-target.
