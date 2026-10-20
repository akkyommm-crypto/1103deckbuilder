# S03-U356 — four monsters with counters, a reflected attack and a delayed return

Base: `claude/work` `8c09e1b` (U355, gate 19887 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZR_claude_s03_u356_counters2.js`)
- 魔鏡導士リフレクト・バウンダー: forced `onAttackDeclare` trigger aimed at it in Attack Position (damage = the attacker's current ATK) + a forced Damage Step `end` trigger (only while in Attack Position) that destroys it.
- 魔導アーマー エグゼ: continuous `cannotAttack` on itself for the turn of `card.summonedTurn`; forced `onStandbyPhase` trigger (both players): `API.removeCounter(…, '魔力', 1)` on a field card of its controller, else destroy.
- 海底に潜む深海竜: forced `onStandbyPhase` trigger adds an オーシャン counter (`API.addCounter`) and mirrors the count in a persistent player flag keyed by uid (the card's own counters are cleared when it leaves); the leave trigger (range Graveyard, events onLeaveField / onSendToGrave / onDestroy / onRemove) gives `v4RegisterStatModifier({atk:200*n})` until the End Phase to the controller's Fish / Sea Serpent monsters.
- 静寂のサイコウィッチ: Graveyard trigger after being destroyed (graveInfo.byDestroy, from the field): banish a Psychic monster with ATK 2000 or less from the Deck; a schedule (`standbyPhase`, turns 1, the player whose Standby Phase comes next) Special Summons it.
- Not part of this unit: 邪悪な儀式 (Standby-Phase-only activation + a position lock lingering after the Spell leaves), 邪狂神の使い (a "choose any number" banish), キラー・ラブカ (ATK drop until my NEXT End Phase), 聖獣セルケト (needs 王家の神殿).

## Tests
- `tools/test_s03_u356_counters2.js` 18 / 0. Negative control on the previous build: 10 FAIL. Coverage TESTED 3180 → 3184, NOT_STARTED 670 → 666; `registration_names_missing_from_db` empty; audit 0 FAIL.
- Authoring lessons: a script that checks a Damage Step `end` trigger must also check the position it needs (the first version destroyed the Defense Position Bounder too); destruction in a test must go through a real path (a battle) — a bare `API.destroy` from the test code queues no events, so no leave / destroyed trigger fires.
