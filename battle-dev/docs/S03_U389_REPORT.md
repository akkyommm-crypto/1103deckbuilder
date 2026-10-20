# S03-U389 — three NOT_STARTED cards

Base: `claude/work` `5db46d3` (U388, gate 20571 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZY_claude_s03_u389_traps3.js`)
- 死神の巡遊 (Continuous Trap; the card activation only places it): a forced trigger of the opponent's Standby Phase; the coin is `duelRandomInt(2)` (0 = heads): heads -> `banSummonS03` on the opponent for this turn (Normal / Flip Summon), tails -> on me for my next turn.
- 神の威光 (Continuous Trap): the targeted 極神 monster's uid is a card flag of the Trap; `continuous.immuneToTarget` protects it from every source (both players); a forced Standby trigger sends the Trap to the Graveyard at my 2nd Standby Phase after the activation (turn stamp).
- ミラクル・フリッパー: `summonConditionS03` (a second copy cannot be summoned for the three kinds), `continuous.cannotBeAttackTarget` (+ `cannotBeAttackTargetBothS03`) for the other monsters of its controller, a Graveyard trigger after a battle destruction (Special Summon on the opponent's field) and one after a Spell / Trap destruction (`graveInfo.srcUidS03`: a Spell or Trap source) that destroys a chosen opposing monster.
- Not done: 安全地帯 (direct-attack prohibition and the paired destruction).

## Tests
- `tools/test_s03_u389_traps3.js` 17 / 0 (the coin is chosen with `seedCoin(want)`). Negative control on the previous build: 8 FAIL. Coverage TESTED 3311 → 3314, NOT_STARTED 553 → 550; `registration_names_missing_from_db` empty; audit 0 FAIL.
