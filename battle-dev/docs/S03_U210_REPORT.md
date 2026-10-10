# S03-U210 — NOT_STARTED 3

## Engine
- engine/30: when the Battle Phase ends, the engine destroys each face-up monster that attacked (`attackCount > 0`) and whose script declares `destroyAfterAttackS03`.

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZR_claude_s03_u210_ns3.js
- D－フォーチュン:
  - a set Trap, activated when the opponent declares a direct attack;
  - cost: banish a 「D－HERO」 from the GY;
  - the Battle Phase ends.
- 無視加護:
  - a Continuous Spell; the face-up card's effect is offered in the attack-declaration event group (`fieldIgnition` + `onAttackDeclare` passive);
  - cost: banish an Insect from the GY;
  - the attack is negated.
  - An earlier draft treated it as a Trap. This was corrected to match the card type.
- ジュラック・ヘレラ: when another own Defense Position 「ジュラック」 is destroyed by battle (graveInfo `pos`), it special summons itself from the hand or the GY.
- ガスタの賢者 ウィンダール:
  - when it destroys a monster by battle, special summons a targeted Level 3 or lower 「ガスタ」 from the GY in face-up Defense;
  - the battle pair is read from `ctx.battle`, `battleContextV28()` or `gameState.lastBattle`, in that order.
- スクラップ・ワーム:
  - can attack directly;
  - is destroyed at the end of the Battle Phase if it attacked (the engine hook above);
  - retrieves a 「スクラップ」 from the GY when destroyed by a 「スクラップ」 effect, like スクラップ・コング.

## Tests
`tools/test_s03_u210_ns3.js` passes 15/0, on real DUEL paths and Replay-audited. It includes negative cases:
- an Attack Position 「ジュラック」 → no activation;
- the Battle-Phase-end destruction of スクラップ・ワーム → no retrieval.

Negative control on U209: 7 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15424 PASS / 0 FAIL** (= U209 15409 + 15 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U209.
- Coverage: TESTED 2529, ENGINE_GAP 599, NOT_STARTED 1190, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 31 (4996); audit 489 declared, 0 off-target.
