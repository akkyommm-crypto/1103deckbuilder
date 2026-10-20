# S03-U391 — 重力崩壊, 賢者の聖杯, スクリーン・オブ・レッド

Base: `claude/work` `807992f` (U390, gate 20616 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZZA_claude_s03_u391_gravity.js`)
- 重力崩壊 (Counter Trap): same answer shape as ライト・バニッシュ (S03-U340): summon-negation window / Special Summon effect link; the cost sends a face-up Synchro Monster of mine to the Graveyard; the resolution negates (and destroys) and applies `banSummonS03` to the opponent for Normal / Flip / Special Summons until the end of the turn.
- 賢者の聖杯 (Normal Spell): only with no monster on my field; the targeted monster of the opponent's Graveyard is Special Summoned to my field (fromPlayer), marked with `cannotTribute`, `noSynchroMaterialTurnS03` and a turn stamp; a scheduled End Phase handler moves its control to the opponent.
- スクリーン・オブ・レッド (Continuous Trap): forced `onEndPhase` upkeep (pay 1000 or destroy), continuous `cannotAttack` on the opponent's monsters while face-up in the Spell & Trap Zone, and a field ignition (with レッド・デーモンズ・ドラゴン on the field) that destroys the card and Special Summons a Level 1 Tuner from my Graveyard.

## Tests
- `tools/test_s03_u391_gravity.js` 28 / 0. Negative control on the previous build: 16 FAIL. No existing test changed. Coverage TESTED 3318 → 3321, NOT_STARTED 550 → 547; `registration_names_missing_from_db` empty; audit 0 FAIL.
