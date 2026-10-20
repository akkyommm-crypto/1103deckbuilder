# S03-U357 — three Ritual Spells and 大邪神 レシェフ

Base: `claude/work` `83c1bf1` (U356, gate 19905 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZS_claude_s03_u357_rituals.js`)
- 踊りによる誘発 / 亀の誓い / ハンバーガーのレシピ: `registerRitualSpecV24(name, {monsters, level, levelMode:'atLeast'})` (6 / 8 / 6) and the shared factory `v5DefineRitualSpell(name)` (cards/90). Material choice, Level counting and provenance stay in the engine's ritual path (`API.ritualCanActivate` / `API.ritualSummon`).
- 大邪神 レシェフ: ignition effect (meta `countLimit:1`) with a hand-discard cost (a Spell), a target among the opposing face-up monsters, `API.changeControl(…, 'endPhase')`.
- The three Ritual Monsters were already GENERIC_OK (their text is only the ritual condition).
- Not part of this unit: 救世の儀式 / 破滅の儀式 / 宣告者の預言 (each has a second Graveyard effect — a target immunity, a banish-to-Deck replacement, a return of a released monster), サクリファイス (equips a monster and copies its stats), 神光の宣告者.

## Tests
- `tools/test_s03_u357_rituals.js` 25 / 0. Negative control on the previous build: 15 FAIL. Coverage TESTED 3184 → 3188, NOT_STARTED 666 → 662; `registration_names_missing_from_db` empty; audit 0 FAIL.
- Authoring lesson: a `forEach` parameter named `mon` shadowed the test helper `mon()` (TypeError); keep helper names out of loop variables.
