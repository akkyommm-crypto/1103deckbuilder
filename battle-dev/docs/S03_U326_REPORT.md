# S03-U326 — 「ワーム」: ソリッド, プリンス, ミリディス

Base: `claude/work` `cdae28c` (U325, gate 18938 PASS / 0 FAIL). Sonnet 5.5, single writer. All three NOT_STARTED; no engine change (left: ワーム・ゼロ — Fusion with a variable number of kinds).

## Cards (`cards/HZZZZZZN_claude_s03_u326_worm.js`; 「ワーム」 Reptile = SETCODE.WORM + race 爬虫類)
- ソリッド: continuous DEF + 100 × Worm Reptiles in my Graveyard; a forced `onBattleDamage` stamp (this card was the defender, the attacker's player took damage) and a forced targeted destruction of an opponent Spell / Trap at the end of the Damage Step (`dsTiming:'end'`).
- プリンス: optional search after a battle kill; forced End Phase destruction (every End Phase) when no other face-up Worm Reptile is on my field.
- ミリディス: optional Flip trigger equips itself (`API.equipMonster`) to a face-up opponent monster; forced Standby Phase trigger from the Spell & Trap Zone: 400 damage to the equipped monster's current controller in both players' Standby Phases.

## Tests
- `tools/test_s03_u326_worm.js` 18 / 0 (DEF count, attacker damage in Attack / Defense Position, the stamp negatives, search / End Phase, Flip equip incl. a stronger attacker and two Standby Phases; Replay audits). Negative control on the previous build: 10 FAIL. Coverage TESTED 3018 → 3021, NOT_STARTED 829 → 826; audit 0 off-target.
