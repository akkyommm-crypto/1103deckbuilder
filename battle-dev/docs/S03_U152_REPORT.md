# S03-U152 — 「バトルフェイズを終了する」 really ends the Battle Phase; 速攻のかかし automated

## Why
- A scan of every property assigned in engine/ for one that is never read (the pattern behind U149 / U150 / U151) found one:
  `battlePhaseV6.endedTurn`, written by `BATTLE_PHASE_V6` 'endNow' (`API.endBattlePhase`).
- Following it showed that the cards whose text says 「バトルフェイズを終了する」 used four different things, and none of them was the
  rule:

  | Card(s) | Used | Effect in a real duel |
  |---|---|---|
  | 攻撃の無力化, 強制終了, ナチュル・スティンクバグ | `endBattle()` (engine/60) | Ended only the **current battle**. The turn player could still attack with its other monsters. |
  | ハーフorストップ ('stop') | `API.endBattlePhase()` | Marked the Battle Phase as ended and cleared the battle, but the phase stayed `battle`. |
  | バトルフェーダー, 薄幸の美少女 | `v350EndBattlePhase()` | Wrote `SET_PHASE main2` directly, skipping the end of the Battle Phase (`BATTLE_PHASE_V6` 'finish', 'battlePhaseEnd' schedules, `onBattlePhaseEnd` triggers). |
  | 速攻のかかし (IMPLEMENTED) | a manual note | Not a quick effect, so never offered as a response in DUEL. Also: any attack instead of only a direct one, and the discard after resolution instead of as the cost. |

## Change
- New `engine/1ZS_end_battle_phase_s03.js` `endBattlePhaseByEffectS03(reason)`:
  - clears the pending attack (Action) and the current battle;
  - marks this turn's Battle Phase as ended (`BATTLE_PHASE_V6` 'endNow'). `canDeclareAttackV48` now refuses every attack while
    it is set;
  - in DUEL, queues the normal transition to Main Phase 2 (`processPhaseV27` with `byEffectS03`: no must-attack
    confirmation; the usual end of the Battle Phase runs). Outside DUEL it sets the phase directly, as before.
  - `BATTLE_PHASE_V6` 'finish' clears the mark, so a repeated Battle Phase starts fresh. `pointActivateV27` does not reopen
    the attack window after such a chain.
- All the cards above now use it:
  - `API.endBattlePhase` and `v350EndBattlePhase` call it;
  - 攻撃の無力化 / 強制終了 / ナチュル・スティンクバグ call it instead of `endBattle()`.

  The other `endBattle()` users (ending one battle without damage calculation) are unchanged.
- 速攻のかかし, rewritten on the バトルフェーダー model:
  - a hand quick effect at a direct attack declaration;
  - the discard is the cost (`a6HandCost`);
  - it negates the attack and ends the Battle Phase.

## Test — `tools/test_s03_u152_end_battle_phase.js` 9/0 (real DUEL path, Replay-audited)
In each case player II attacks with デーモンの召喚; ゴブリン突撃部隊 is the second attacker.
- A 攻撃の無力化: the attack is negated, then Main Phase 2 and no further attacker.
- B 速攻のかかし from the hand at a direct attack: discarded, no damage, Main Phase 2.
- C バトルフェーダー: Special Summoned, no damage, Main Phase 2 through the normal end.
- D ハーフorストップ (the attacker chooses 'stop'): Main Phase 2.
- E control: without a response, still in the Battle Phase and the second monster can attack.
- Negative control on U151 (`dist/battle.html` + this test): 3 FAIL, 0 errors (A, B, D). C already reached Main Phase 2 on U151.
- The existing tests of these cards keep their PASS counts (test_battle_cards, v630 / v830 / v860 batches, auto_cycle02,
  expansion_v350, u40, u49, u88).

## Status
- IMPLEMENTED → TESTED: 速攻のかかし. TESTED 2230 → 2231, IMPLEMENTED 94 → 93.

## Gate
- `python tools/check.py` — `GATE_EXIT=0`, 14326 PASS lines (= U151 14317 + 9 new, exactly), 0 FAIL, no Traceback / ReferenceError
  (one caught `TypeError` stack from `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level function declarations".
- Pre-scan of all 371 gate tests (parallel): every exit code 0, 0 FAIL; per-file PASS / Error counts equal to U151 except the new test.
- `dist/battle.html` SHA256 `55151eac4de0244a63033da96045a7a615535812a2600a1fe0c77052c7b41012` (build output identical to the gate build);
  Acode regenerated after the gate: `dist/battle_acode.html` `9d241dcda11d0b22a5ae810a58b72cf45d06099c98063daa931da2f8b9ed7e51`.
- Coverage: TESTED 2231, IMPLEMENTED 93, ENGINE_GAP 607, GENERIC_OK 644, PARTIAL 174, NOT_STARTED 1247 (4996); 198 declared status
  changes, 0 off-target.
