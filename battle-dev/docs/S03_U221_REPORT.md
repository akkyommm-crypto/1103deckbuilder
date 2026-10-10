# S03-U221 — NOT_STARTED 13

## Engine
- `engine/00` `attackLpCostS03` also adds `attackTaxS03`: 「お互いのプレイヤーは○○ライフポイントを払わなければ、攻撃宣言をする事ができない」 (通行税).
  - A face-up, non-negated card on either field whose script declares `attackTaxS03` adds that amount to every attack's LP cost.
  - The cost is still checked by `canDeclareAttackV48` and paid by the attack declaration (S03-U212).
- `engine/1ZD` `activationTypeLockReasonS03` handles 「このターン相手プレイヤーは魔法・罠カードを発動できない」 (真空イタチ). A player whose turn-stamped temporary
  flag `noSpellTrapActivationS03` equals the current turn cannot activate Spell / Trap cards (card activations).

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZZC_claude_s03_u221_ns13.js
- 通行税: `attackTaxS03` 500.
- 真空イタチ: a forced Flip effect that sets the flag on the opponent.
- 白兵戦: when its controller takes battle or effect damage (`onLPChange`) → 700 damage, +300 per 「白兵戦」 in its GY.
- 英雄変化－リフレクター・レイ: when its controller's 「E・HERO」 Fusion Monster is destroyed by battle and sent to the GY → damage equal to its
  Level × 300.
- 女王の選択: when its controller's 「アマゾネス」 destroys a monster by battle and sends it to the GY → special summons a Level 4 or lower 「アマゾネス」
  from the Deck.
- 侵略の手段:
  - cost: send an 「インヴェルズ」 monster from the Deck to the GY;
  - a targeted own 「インヴェルズ」 gets +800 ATK until the End Phase.
- 野生の咆哮: a Continuous Trap. While it is face-up, when its controller's monster destroys a monster by battle and sends it to the GY → 300 damage
  per face-up Beast its controller has.

## Tests
`tools/test_s03_u221_ns13.js` passes 18/0, on real DUEL paths and Replay-audited.
- 通行税: 500 paid on the attack; 400 LP → no attack; face-down → no cost.
- 真空イタチ: flipped by `doFlipUp`; it locks only the opponent, and only this turn.
- 白兵戦 and リフレクター・レイ after real battles.
- 女王の選択 from the Deck.
- 侵略の手段: the send is a cost, and the ATK gain applies.
- 野生の咆哮: face-up it deals 600; face-down it does nothing.

Other checks:
- `tools/test_s03_u212_ns5.js` (ダーク・エルフ) still passes.
- Negative control on U220: 9 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15642 PASS / 0 FAIL** (= U220 15624 + 18 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U220.
- Coverage: TESTED 2596, ENGINE_GAP 598, NOT_STARTED 1125, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 556 declared, 0 off-target.
