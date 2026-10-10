# S03-U283 — Effect Special Summon position choice: which texts fix the position

## Workflow
- opus-only engine fix (workflow v3). Profile `delegation-expanded-v3-batch3`.
- Found by the Sonnet unit S03-U280 (キャトルミューティレーション): the S03-U278 classifier gave no choice whenever a Special Summon sentence contained 表示 anywhere. In 「自分フィールド上に表側表示で存在する…を…特殊召喚する」 the 表示 belongs to another clause.

## Engine — engine/1ZZK `ssPositionFreeS03`
- The position is fixed only when a Special Summon sentence says 「攻撃表示で／守備表示で…特殊召喚」, including 表側攻撃表示 and 裏側守備表示.
- 「表側表示で特殊召喚」 (either face-up position), or a 表示 in another clause, leaves the choice to the summoning player.
- 41 more TESTED cards now get the choice, 523 in all (list: docs/S03_U278_SS_POSITION_CANDIDATES.txt plus this change). Examples: D－スピリッツ, アルティメット・インセクト LV1–LV5, ウイングトータス.

## Tests
`tools/test_s03_u283_ss_position2.js` passes 5/0, Replay-audited.
- P1: D－スピリッツ summons D－HERO ダイヤモンドガイ in Defense, as chosen.
- P2: 早すぎた埋葬 (表側攻撃表示) → no choice.
- P3: the classifier itself: 死者蘇生 and D－スピリッツ are free; 早すぎた埋葬, キラー・トマト and リビングデッドの呼び声 are fixed.

Negative control on U282's classifier: 2 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17577 PASS / 0 FAIL** (= U282 17572 + 5 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U282.
- Coverage: TESTED 2890, ENGINE_GAP 502, NOT_STARTED 927, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 852 declared, 0 off-target.
- Published in the batched checkpoint S03-U280–U283.
