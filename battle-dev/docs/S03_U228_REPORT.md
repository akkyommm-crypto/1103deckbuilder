# S03-U228 — NOT_STARTED 20

## Engine
- `engine/1ZD` `monsterActivationLockReasonS03` (S03-U217) now also reads face-up Spells / Traps and Field Spells, not only monsters.
  - A card still being activated applies nothing.
  - A card never locks its own activation.
  - The first user is 魔法族の里.

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZZJ_claude_s03_u228_ns20.js
- 金剛真力 / ワーム・コール: Continuous Spells.
  - Once per turn, while only the opponent has monsters, special summon from the hand:
    - 金剛真力: a Level 4 or lower Gemini monster;
    - ワーム・コール: a 「ワーム」 Reptile, in face-down Defense Position.
- 機皇帝の賜与: while the field's face-up monsters are exactly two 「機皇」 monsters → draw 2.
  - The Battle Phase is forbidden that turn (`noBattlePhase`, as a cost).
  - Like the other 「発動するターン、バトルフェイズを行えない」 cards, it is activated in Main Phase 1.
- 獣神機王バルバロスUr:
  - its own summon procedure from the hand banishes a Beast-Warrior and a Machine from the hand / face-up field / GY;
  - the opponent takes no battle damage from its battles.
- 魔法族の里 (Field Spell):
  - Spellcasters only on its controller's side → the opponent cannot activate Spell cards;
  - no Spellcaster on its controller's side → its controller cannot.

## Tests
`tools/test_s03_u228_ns20.js` passes 16/0, on real DUEL paths and Replay-audited.
- The hand summons, including the face-down one, and the once-per-turn limit.
- Draw 2 with the Battle Phase forbidden, and its field condition.
- The Ur procedure through `runSummonProcedure` / `finishSummonProcedure`, and its no-damage battle.
- The three field situations of 魔法族の里.

Other checks:
- `tools/test_s03_u213` / `u217` / `u220` / `u221` / `u227` still pass.
- Negative control on U227: 11 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15769 PASS / 0 FAIL** (= U227 15753 + 16 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U227.
- Coverage: TESTED 2641, ENGINE_GAP 598, NOT_STARTED 1080, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 601 declared, 0 off-target.
