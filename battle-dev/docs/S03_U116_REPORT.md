# S03-U116 — カラクリ common clauses (弐参六 / 壱七七 / 弐四八 / 九壱九) + 九壱九 battle-kill trigger + 禁じられた聖槍 promotion

## Why
Remaining main-deck qty=2 tier. Measured on the U115 build (fixed karakuri list: 弐参六 x3, 壱七七 x3, 弐四八 x2, 九壱九 x2):
- カラクリ兵 弐参六 and カラクリ商人 壱七七 had neither common clause ("攻撃可能な場合には攻撃しなければならない" /
  "表側攻撃表示のこのカードが攻撃対象に選択された時、守備表示にする"). U52 had recorded the 弐参六 gap.
- カラクリ参謀 弐四八 (must attack only) and カラクリ忍者 九壱九 (must attack only) lacked the attack-target position change.
- 九壱九's "戦闘によって相手モンスターを破壊し墓地へ送った時" trigger fired only as the attacker, did not check that the
  destroyed monster reached the GY, and Special Summoned by the index remembered at activation.
The same clause already existed on カラクリ守衛 参壱参 / カラクリ小町 弐弐四 (U101).

## Change
- `cards/HM_claude_s03_u116_karakuri_common.js`: `karakuriAddCommonClausesS03(name, mode)` wraps each card's existing
  script — adds `continuous.mustAttack`, a mandatory `onAttackDeclare` trigger when this face-up card is the attack
  target (`atkToDef`: Attack → Defense; `toggle` (九壱九): change position), dispatches condition / targets / resolve by
  `eventName` so the card's own trigger is untouched, and appends `attackDeclare` to an explicit timing list.
- `engine/1ZB_trigger_forced_per_effect_s03.js`: `triggerCandidateForcedS03` consults `sc.forcedForEventS03(eventName)`
  before `sc.forced` — the position change is mandatory while 弐参六's recruit stays optional ("できる").
- `cards/20_control_counter.js` 九壱九: trigger when it destroys the opponent's monster by battle as attacker **or** as
  the attack target, only if that monster is in the GY (step `leave`, `dsTiming:'leave'`); the GY target selected on
  activation is re-located at resolution (`resolveTarget`).

## Test — `tools/test_s03_u116_karakuri_common.js` 30/0 (real DUEL path: `requestProcessorV27(ATTACK)`, Replay-audited)
- must attack: each card is in `pendingMustAttack()` (the list the Battle Phase exit checks; leaving the Battle Phase
  with such a monster asks for confirmation).
- A: 弐参六 / 壱七七 / 弐四八 targeted in Attack Position by ダーク・アームド・ドラゴン → the trigger is a chain link →
  Defense Position before damage (no battle damage); in Defense Position no trigger.
- B: 九壱九 Attack → Defense (no damage); Defense → Attack (then destroyed, 1100 damage).
- C: 弐参六's recruit on battle destruction is still optional; `forcedForEventS03` per event; 壱七七's summon search
  and 弐四八's summon position change still work.
- D: 九壱九 as attacker destroys ワイト → the chosen 壱七七 is Special Summoned in face-up Defense Position; as the
  attack target in Defense Position it flips to Attack, destroys the weaker attacker → the trigger resolves (impossible
  before); destroyed itself → no trigger.
- Negative control on the U115 build: must-attack (弐参六 / 壱七七), A, B and D2 fail.
- All other tests naming カラクリ re-run on the U116 build: 0 FAIL.
- Not testable yet: the "sent to the GY" half against a banish replacement (no such replacement exists in the engine);
  the guard is in place.

## Status
- カラクリ参謀 弐四八, カラクリ忍者 九壱九 IMPLEMENTED → TESTED (U116 test).
- 禁じられた聖槍 IMPLEMENTED → TESTED via the published U115 test (focus registered; U115 left it IMPLEMENTED).
- 弐参六 / 壱七七 were already TESTED (their own triggers); now also covered by the U116 test.
- TESTED 2163 → 2166, IMPLEMENTED 123 → 120; ENGINE_GAP 610 unchanged.

## Gate
- `python tools/check.py` — `GATE_EXIT=0`, 13688 PASS lines, 0 FAIL, no Traceback (one caught `TypeError` stack from
  `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level function declarations".
- `dist/battle.html` SHA256 `23463ff74e69c540f1e9fb4663dcf6eed805d3bf49dd17f8519a558c3371fe04`; Acode not regenerated (`dist/battle_acode.html` `c0bfdbba…`).
- Coverage: TESTED 2166, IMPLEMENTED 120, ENGINE_GAP 610, GENERIC_OK 644, PARTIAL 172, NOT_STARTED 1284 (4996);
  121 declared status changes, 0 off-target.
