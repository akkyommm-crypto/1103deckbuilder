# S03-U382 — four NOT_STARTED cards

Base: `claude/work` `fdfa1ac` (U381, gate 20430 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZR_claude_s03_u382_misc6.js`)
- 摩天楼 －スカイスクレイパー－ (Field Spell): `continuous.apply` — only the ATTACKING 「E・HERO」 (`SETCODE.ELEMENTAL_HERO`) in the damage step (`a5InDamageStep` / `a5IsAttackerCard` / `a5BattleOtherOf`) whose current ATK, read without this bonus (re-entrancy guard around `curATK`), is lower than its battle partner's gets +1000.
- 極星宝グングニル (Trap): cost = banish an own face-up 極神 / 極星 monster (its uid goes to a schedule handler `u382.gungnir-return`); target = a field card, destroyed; the monster returns face-up in Attack Position at the controller's 2nd End Phase after the activation (`API.schedule` turns 2 in the own turn, 3 in the opponent's).
- 紅蓮魔闘士: `summonProcedure` from the hand when exactly 3 Normal Monsters are in the Graveyard (2 banished with `u342PickN`); ignition once per turn: a Level 4 or lower Normal Monster of the Graveyard is Special Summoned.
- 樹海の射手: `cannotNormalSummon` + a `summonProcedure` condition (2+ Normal Monsters in the Graveyard, no cost); the release effect is the cost (sent to the Graveyard), the Deck search of a Dual Monster follows.

## Tests
- `tools/test_s03_u382_misc6.js` 25 / 0. Negative control on the previous build: 16 FAIL. Coverage TESTED 3282 → 3286, NOT_STARTED 582 → 578; `registration_names_missing_from_db` empty; audit 0 FAIL.
