# S03-U380 — four counter / recursion cards

Base: `claude/work` `3d01484` (U379, gate 20387 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZP_claude_s03_u380_counters4.js`)
- 創世神: ignition once per turn; cost = discard a hand card, target = a Graveyard monster (`canEffectSpecialSummonS03`, so another 創世神 is excluded by the 「墓地からの特殊召喚はできない」 rule).
- 魂を喰らう者 バズー: ignition once per turn; cost = banish 1-3 Graveyard monsters (`v46PickAnyAtLeastOne`), count in a player flag; `+300 x n` ATK as a stat modifier that resets with `RESET.OPPO_TURN` (the end of the opponent's turn).
- マシン・デベロッパー / 世界樹 (Continuous Spells; the card activation only places them): the counters follow 魔法族の結界 (S03-U239) but, because the engine offers a card's forced `onDestroy` trigger once per window when two monsters are destroyed together, the trigger counts EVERY not-yet-counted destroyed monster of both Graveyards (`graveInfo` byDestroy / from mz / face up / this turn) and stores the counted uids in a zone-local card flag `{turn, uids}`; the activation marks the monsters already destroyed that turn as seen.
  デベロッパー: `continuous.apply` +200 ATK for face-up Machine monsters of both fields; 2 ジャンクカウンター per Machine; ignition: the card is sent to the Graveyard as the cost (the counter count is kept in a player flag), a Machine monster of Level <= that count is revived.
  世界樹: one flower counter per Plant; ONE ignition effect, the cost asks with `API.confirm` (highest usable option first) whether to remove 3 (revive a Graveyard Plant), 2 (destroy a field card) or 1 (a Plant +400 ATK/DEF until the End Phase) counter(s); the chosen number is kept in a player flag for the target and the operation.

## Tests
- `tools/test_s03_u380_counters4.js` 29 / 0. Negative control on the previous build: 17 FAIL. Coverage TESTED 3275 → 3279, NOT_STARTED 589 → 585; `registration_names_missing_from_db` empty; audit 0 FAIL.
