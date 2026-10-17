# S03-U405 - Five Fusion / Synchro monsters (カタパルト・ウォリアー, ジャンク・バーサーカー, 重爆撃禽 ボム・フェネクス, 異星の最終戦士, スーパービークロイド－ジャンボドリル)

Base: `claude/work` `584c26f` (U404, gate 20850 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZO_claude_s03_u405_fusions.js`)
- カタパルト・ウォリアー, ボム・フェネクス: once-per-turn ignitions (release cost / card count burn with cannotAttackTurn).
- ジャンク・バーサーカー: ignition with a banish cost and v4RegisterStatModifier, plus an onDamageStep (dsTiming start) trigger destroying Defense Position targets before the damage calculation (a3 helpers).
- 異星の最終戦士: forced onSpecialSummon destroying the other own monsters, summonLockS03 for normal / flip / special.
- ジャンボドリル: continuous piercingDamage.

## Tests
- `tools/test_s03_u405_fusions.js` 21 / 0. Negative control on the previous build (card file removed): 13 FAIL. No existing test changed. Coverage TESTED 3362 -> 3367, NOT_STARTED 508 -> 503, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
