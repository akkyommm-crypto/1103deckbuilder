# S03-U212 — NOT_STARTED 5

## Engine
- `engine/00` `attackLpCostS03(card)`: 「このカードは○○ライフポイント払わなければ攻撃できない」.
  - A script declares `attackLpCostS03` (a number, or `fn(card)`).
  - `canDeclareAttackV48` refuses the attack when the controller's LP are below the cost (a face-down or negated card has no cost).
  - `engine/30` pays it as an `LP` cost Action right before `ATTACK_DECLARE_V48`.
  - The same hook can serve トゥーン・デーモン, トゥーン・マーメイド and マシンナーズ・フォース later.
- `engine/20` `materialCandidates`: `cannotSynchroMaterial` may be a function of the card (BF－東雲のコチ: only once special summoned).

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZT_claude_s03_u212_ns5.js
- ダーク・エルフ: pays 1000 LP to attack.
- BF－東雲のコチ: once special summoned, it cannot be a Synchro Material.
- フレンドッグ: destroyed by battle → adds an 「E・HERO」 card and 「融合」 from the GY. It is forced, and adds each one that exists.
- ヴォルカニック・リボルバー: destroyed by battle → may place a 「ヴォルカニック」 monster from the Deck on top, after a shuffle.
- ワーム・テンタクルス: once per turn, banishes a 「ワーム」 Reptile from the GY (cost) → can attack twice this turn.
- 竜の尖兵:
  - ① cost: send a Dragon from the hand → ATK +300;
  - ② when sent from the field to the GY by the opponent's effect → special summons a Dragon Normal Monster from either GY.
- アテナ:
  - ① once per turn, cost: send another face-up Fairy → revives a Fairy other than アテナ;
  - ② when another Fairy is Normal / Flip / Special Summoned while アテナ is already on the field → 600 damage.

## Tests
`tools/test_s03_u212_ns5.js` passes 28/0, on real DUEL paths and Replay-audited. Negative cases:
- ダーク・エルフ with 900 LP;
- a special summoned コチ;
- ワーム・テンタクルス used twice;
- 竜の尖兵 destroyed by its own ブラック・ホール;
- a non-Fairy summon;
- a face-down アテナ.

Negative control on U211: 16 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15482 PASS / 0 FAIL** (= U211 15454 + 28 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U211.
- Coverage: TESTED 2542, ENGINE_GAP 599, NOT_STARTED 1177, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 31 (4996); audit 502 declared, 0 off-target.
