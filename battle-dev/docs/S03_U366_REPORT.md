# S03-U366 — four battle Traps

Base: `claude/work` `375d7ba` (U365, gate 20100 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZB_claude_s03_u366_battletraps.js`)
- ファイヤー・ウォール (Continuous Trap): a no-op activation, a speed-2 optional trigger on `onAttackDeclare` for a direct attack aimed at me (cost: banish a Pyro from my Graveyard; refused under ネクロバレー via `u342Bad`), `API.negateAttack`; a forced Standby trigger pays 500 or destroys it.
- 吠え猛る大地 (Continuous Trap): `continuous.piercingDamage` for the controller's Beast monsters attacking a Defense Position monster (as 憎悪の棘); a forced `onBattleDamage` trigger (the event carries `attackerUid` / `defenderUid`, the defender's position is read from the field or `graveInfo.pos`) lets me choose an opposing face-up monster for -500 / -500.
- 援護射撃: the Damage Step 'calc' window (`dsTiming:'calc'`, `timing:['damageStep']`, passive `onDamageStep`, as クリボン): the attacked monster gets the ATK of another of my face-up monsters via `v4RegisterStatModifier`.
- 奇跡の軌跡: `API.lingerS03` makes the used trap a continuous source (`grantsAttackLimit` 2 and a `battleDamage` hook returning 0 for damage to the opponent), exactly as ワンダー・クローバー; the opponent draws 1; ATK +1000 until the End Phase.
- Not part of this unit: カウンターパンチ (a destruction at the end of the Damage Step), 沈黙の邪悪霊 (re-targeting an attack to another monster), 閃光弾 (skipping to the End Phase).

## Tests
- `tools/test_s03_u366_battletraps.js` 17 / 0. Negative control on the previous build: 8 FAIL. Coverage TESTED 3219 → 3223, NOT_STARTED 631 → 627; `registration_names_missing_from_db` empty; audit 0 FAIL.
- Authoring lessons: a trigger that asks for a target (`API.selectCard`) chooses the FIRST candidate in a test unless `PREFER` names it — the first candidate here was the monster that was about to be destroyed; `targetRange` / `targetSide` on a forced trigger without a `target` step are unnecessary.
