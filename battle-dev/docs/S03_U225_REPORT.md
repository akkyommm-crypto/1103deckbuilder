# S03-U225 — NOT_STARTED 17 (+ アテナ Flip Summon fix)

## Engine
- `engine/40` `flipTriggerApplies`: until now only the flipped card itself was offered `onFlip`.
  - A script that declares `onOtherFlipS03:true` now receives other monsters' `onFlip` events too, including Flip Summons (`evt.flipSummon`).
  - Found with グレイヴ・オージャ. It also shows that アテナ (S03-U212) ② 「…反転召喚…された場合に発動する」 could never fire on another Fairy's Flip
    Summon. U212 only tested the negative case (a face-down アテナ).
  - アテナ now declares the opt-in (cards/HZZT), and this unit tests the positive case.

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZZG_claude_s03_u225_ns17.js
- 猛毒の風: a Continuous Spell.
  - Neither player can special summon WIND monsters (`specialSummonLockS03`; the lock has read face-up Spells since S03-U220).
  - Face-up WIND monsters get -500 ATK.
- 電池メン－単一型: the opponent cannot choose the controller's face-up Thunder monsters other than 「電池メン－単一型」 as attack targets.
- 氷結界の術者: while another face-up 「氷結界」 is on its side, no Level 4 or higher monster can declare an attack (`continuous.cannotAttack`).
- 氷結界の守護陣: while another face-up 「氷結界」 is on its side, opponent monsters with ATK equal to or higher than its DEF cannot declare an attack.
- 蜃気楼の筒: a Quick-Play Spell that cannot be activated from the hand. When its controller's face-up monster is chosen as an attack target → 1000
  damage.
- ジャンク・ブレーダー: banish a 「ジャンク」 monster from the GY (cost) → +400 ATK until the End Phase.
- グレイヴ・オージャ:
  - it cannot be chosen as an attack target while a face-down Defense monster is on its side;
  - each Flip Summon by its controller → 300 damage.

## Tests
`tools/test_s03_u225_ns17.js` passes 19/0, on real DUEL paths and Replay-audited.
- 蜃気楼の筒 at the real attack-declaration point.
- The attack locks through `canDeclareAttackV48`, plus a refused attack request.
- グレイヴ・オージャ and アテナ after a real `doFlipUp` Flip Summon; a non-Fairy Flip Summon deals no damage.

Other checks:
- Negative control on U224: 12 FAIL.
- `tools/test_s03_u212_ns5.js` still passes.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15714 PASS / 0 FAIL** (= U224 15695 + 19 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U224.
- Coverage: TESTED 2624, ENGINE_GAP 598, NOT_STARTED 1097, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 584 declared, 0 off-target.
