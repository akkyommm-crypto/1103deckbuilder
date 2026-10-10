# S03-U231 — NOT_STARTED 23

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZZM_claude_s03_u231_ns23.js
- プロミネンス・ドラゴン:
  - it cannot be chosen as an attack target while another face-up Pyro is on its side;
  - at its controller's End Phase → 500 damage (forced).
- エクストリオの牙: a Counter Trap usable while its controller has a face-up 「ナチュル」.
  - It negates and destroys the opponent's Spell / Trap card activation.
  - Then its controller sends a card from the hand to the GY.
- 呪術抹消: a Counter Trap.
  - Cost: discard 2.
  - It negates and destroys a Spell card activation, then sends every same-name card in the opponent's hand and Deck to the GY.
- 神聖なる森: a Continuous Spell. Once per turn, counted on the card itself (`protectV21`, `perTurnScope:'source'`), one of its controller's Plant /
  Beast / Beast-Warrior monsters is not destroyed by battle.
- ネクロ・リンカー: release it (cost) → special summon a targeted 「シンクロン」 Tuner from the GY. That monster cannot be a Synchro Material this turn
  (`noSynchroMaterialTurnS03`).
- サシカエル: once per turn, release an Aqua monster (itself possible, as the cost) → special summon a targeted 「ガエル」 from the GY.
- ウィクトーリア:
  - once per turn → special summon a targeted Dragon from the opponent's GY to its own field;
  - the opponent cannot choose the controller's other face-up Fairies as attack targets.

## Tests
`tools/test_s03_u231_ns23.js` passes 17/0, on real DUEL paths and Replay-audited.
- Both Counter Traps answer a real 死者蘇生.
- 呪術抹消 checks both the hand and the Deck.
- The forest's per-turn limit is checked across two real attacks.
- The End Phase damage happens through a real phase change.

Negative control on U230: 13 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15824 PASS / 0 FAIL** (= U230 15807 + 17 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U230.
- Coverage: TESTED 2664, ENGINE_GAP 598, NOT_STARTED 1057, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 624 declared, 0 off-target.
