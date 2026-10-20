# S03-U387 — control and seal Traps

Base: `claude/work` `04d3113` (U386, gate 20538 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZW_claude_s03_u387_control.js`)
- 洗脳光線: ACTIVATE effect with a target (an opposing monster with an A Counter, `alienCountersS03`): `API.changeControl`, `API.linkControlReturn(monster, trap, {onFaceDown:false})` (the monster goes back when the Trap leaves), `API.linkOnLeave(trap, monster, 'destroy')` (the Trap is destroyed when the monster leaves); the monster's uid is kept in a card flag; a forced End Phase trigger of my turns removes 1 A Counter and destroys the Trap at 0.
- 集団催眠: needs an face-up 「エーリアン」 of mine; up to three A Counter monsters (`v46PickAnyAtLeastOne`, limited by the free zones) change control with the same control link; a forced End Phase trigger destroys the Trap in the activation turn (turn-stamp flag).
- 破邪の刻印: optional trigger of the opponent's Standby Phase (once per turn flag) that negates the chosen face-up card until the end of the turn (`API.negateEffectUntil … 'endTurn'`), and a forced trigger of my Standby Phase with a yes / no: pay 500 or destroy the Trap (destroyed when the LP are short). The two triggers have mutually exclusive conditions.

## Tests
- `tools/test_s03_u387_control.js` 17 / 0. Negative control on the previous build: 11 FAIL. Coverage TESTED 3304 → 3307, NOT_STARTED 560 → 557; `registration_names_missing_from_db` empty; audit 0 FAIL.
