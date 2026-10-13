# S03-U343 — banish / send / release-condition monsters ×8 (+ 原始太陽ヘリオス)

Base: `claude/work` `c46a4b8` (U342, gate 19445 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZE_claude_s03_u343_banish_procs.js`)
- デザート・ツイスター / フェンリル / デビルドーザー: hand `summonProcedure`s banishing 2 WIND + 1 EARTH / 2 WATER / 2 Insects from the Graveyard (helpers `u342Bad`, `u342PickN` of S03-U342; refused under ネクロバレー). Effects: ツイスター ignition (once per turn: discard cost → destroy a chosen Spell/Trap card of the field); フェンリル forced `onDamageStep` ('leave') kill trigger → `API.skipOwnPhase(opponent, 'draw')` (the engine marks the skip in `phaseSkipV7` and consumes it when the Draw Phase is entered through the phase processor); ドーザー forced `onBattleDamage` → `millTop`.
- メガロック・ドラゴン: the procedure picks any number (≥ 1) of Rock monsters with a 「decide」 entry; the count goes through the turn-temporary player flag `u343MegaN` to a card flag set by a forced self `onSpecialSummon` trigger; continuous `setBaseAtk` / `setBaseDef` = count × 700. モンタージュ・ドラゴン: three hand monsters discarded, the level sum parked the same way → continuous `setAtk` = sum × 300 (ワイト is Level 1).
- マスターモンク: procedure releasing モンク・ファイター; `attackLimit:2`. 原始太陽ヘリオス: continuous `setAtk/setDef` = banished Monster Cards of both players × 100 (its baseline status was already TESTED).
- ヘリオス・デュオ / トリス: procedures releasing 原始太陽ヘリオス / デュオ; continuous set ATK/DEF from the banished count (×200 / ×300); a forced Graveyard trigger after a battle destruction (`a3SelfBattleDestroyed`) schedules an End Phase handler that Special Summons it and adds +300 / +500 as a permanent modifier; トリス' `grantsAttackLimit` 2 while the opponent controls a monster.
- Not part of this unit: ヴァンパイアジェネシス, 天魔神 (エンライズ / ノーレラス), ダーク・ネクロフィア, カオス・ソルジャー, モノケロース, トーチ・ゴーレム.

## Tests
- `tools/test_s03_u343_banish_procs.js` 52 / 0. Negative control on the previous build: 33 FAIL. Coverage TESTED 3104 → 3112, NOT_STARTED 746 → 738; audit 0 off-target. Pre-scan: no other test names these cards.
- Authoring notes: never assign a pile array to a fixture variable *and* the zone (`grave = r`) — a banish splices the zone array and the fixture list shrinks (use `r.slice()`); the Draw Phase skip is consumed by the phase processor, the harness' `startTurn()` draws through a direct DRAW request, so the test checks the `phaseSkippedV7` mark instead of a missing draw.
