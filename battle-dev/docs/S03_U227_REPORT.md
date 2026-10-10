# S03-U227 — NOT_STARTED 19

## Engine
- `engine/1ZZF` also handles 「…の場合、このカードを破壊する」.
  - A face-up card (monster, Spell or Trap) whose script declares `selfDestroyWhenS03(card, player)` is destroyed at rule processing while the
    declaration holds. The declaration returns `true` or a reason string.
  - It is enforced where the field-dependent destruction runs (act(), as a journaled FX_TO_GRAVE).
  - A card still being activated, or negated, is not destroyed by its own text.
- `engine/1ZD` handles 「次のターンのエンドフェイズ終了時まで、相手は魔法カードを発動できない」.
  - The locked player's `effectFlags.noSpellActivationUntilS03` holds the last locked turn.
  - Spell card activations are refused while the turn is less than or equal to it.

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZZI_claude_s03_u227_ns19.js
- 暴君の暴飲暴食: a Continuous Trap.
  - Cost: release an own monster.
  - Neither player can special summon a Level 6 or higher monster (Xyz Monsters have no Level).
  - It destroys itself while its controller holds 3 or more cards.
- ハンター・アウル:
  - +500 ATK per face-up WIND monster its controller has (itself included);
  - it cannot be chosen as an attack target while another face-up WIND monster is on its side.
- 切り込み隊長 / 夜薔薇の騎士: when Normal Summoned → special summon a Level 4 or lower monster (夜薔薇: a Plant) from the hand. The opponent
  cannot choose the controller's other Warriors (夜薔薇: Plants) as attack targets.
- フェアリー・アーチャー: once per turn, and not after it attacked → 400 damage per face-up LIGHT monster its controller has. It cannot attack that
  turn.
- ソニックジャマー: its Flip effect locks the opponent's Spell card activations until the end of the next turn.
- アマゾネスの剣士: battle damage its controller would take from its battles is taken by the opponent instead (`battleDamageRedirect`).

## Tests
`tools/test_s03_u227_ns19.js` passes 20/0, on real DUEL paths and Replay-audited.
- 暴君の暴飲暴食 is destroyed after a real draw brings the hand to 3.
- The summon triggers pull monsters from the hand; non-matching monsters stay.
- ソニックジャマー's lock is checked across turns 5 / 6 / 7.
- The redirect is checked in both directions.

Other checks:
- Tests that name these cards still pass: auto_cycle16 / 19, U158, U193, U194, U58 and the v450–v710 batches.
- Negative control on U226: 12 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15753 PASS / 0 FAIL** (= U226 15733 + 20 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U226.
- Coverage: TESTED 2636, ENGINE_GAP 598, NOT_STARTED 1085, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 596 declared, 0 off-target.
