# S03-U236 — 「戦闘を行ったバトルフェイズ終了時」: keep the finished Battle Phase's attack record

## Workflow
- opus-only, engine fix.
- The defect was reported by the S03-U232 Sonnet subagent and confirmed here with a real-DUEL probe: ビッグ・ジョーズ stayed on the field after it attacked.

## Engine
- When leaving the Battle Phase, `BATTLE_PHASE_V6 'finish'` (engine/00) cleared `battlePhaseV6.attacks` **before** the `onBattlePhaseEnd` triggers were collected.
- So `API.battledThisPhase` / `API.attackersAgainst` were always empty for 「戦闘を行ったバトルフェイズ終了時」 effects in a DUEL.
- Fix:
  - 'finish' keeps a copy, `battlePhaseV6.lastPhaseS03 = {turn, attacks}`.
  - engine/15 `battleAttacksRecordV6` reads it when called outside the Battle Phase in the same turn.
  - Inside a Battle Phase, including a repeated one, the current record is read as before.
- The record comes from the ATTACK action (damage calculation), so an attack that was negated before battle does not count.

## Cards affected (all were already TESTED; no status change)
- Fixed in a DUEL and checked here: ビッグ・ジョーズ, ステルスロイド, 始祖の守護者ティラス.
- Fixed by the same change but not checked on a real path here:
  - 剣闘獣セクトル: needs a Gladiator Beast summon;
  - 惑星からの物体A: ATK 0 in Attack Position, so a real check needs a battle-protection setup.
- Note: `tools/test_s03_u76_saigo_no_guardian_tyrannus.js` asserts that the opponent's ワイト is in the GY after the Battle Phase. That happens because ティラス destroys it **in battle**, so that assertion did not exercise the end-of-Battle-Phase effect. It is left unchanged: it does not contradict the text. Test C here covers the effect, using a direct attack and a Set card.

## Tests
`tools/test_s03_u236_bp_end_battled.js` passes 10/0, on real DUEL paths and Replay-audited.
- ビッグ・ジョーズ: after attacking, it is still on the field during the Battle Phase and banished at its end. Without an attack it stays.
- ステルスロイド (with ジャイロイド): after battling, the opponent's Set card is destroyed at the end of the Battle Phase. Without a battle nothing happens.
- ティラス (2 materials): after a direct attack, the Set card survives the battle and is destroyed at the end of the Battle Phase.

Other checks:
- `test_battle_cards`, `test_s03_u76`, `test_s03_u152_end_battle_phase` and `test_s03_u180_gladiators` still pass.
- Negative control on U235 (its base after the merge; also 3 FAIL on U234): 3 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15921 PASS / 0 FAIL** (= U235 15911 + 10 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U235.
- Coverage: TESTED 2680, ENGINE_GAP 598, NOT_STARTED 1041, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 640 declared, 0 off-target.
