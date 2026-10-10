# S03-U230 — NOT_STARTED 22

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZZL_claude_s03_u230_ns22.js
- ヒーローズルール2: a Counter Trap. It negates and destroys a monster effect activation, or a Spell / Trap card activation, that targets a card in a
  GY.
- 極星將テュール:
  - it destroys itself while no other face-up 「極星」 monster is on the field (`selfDestroyWhenS03`, S03-U227);
  - the opponent cannot choose the controller's other 「極星」 monsters as attack targets.
- ヴォルカニック・カウンター: while it is in the GY and its controller takes battle damage (a forced trigger):
  - it banishes itself;
  - if another FIRE monster is in the GY, the opponent takes the same damage.
- 黒魔導の執行官:
  - its own summon procedure releases a face-up ブラック・マジシャン;
  - each Normal Spell card activation, by either player → 1000 damage to the opponent.
- 守護神エクゾード:
  - its own summon procedure releases a face-up 「スフィンクス」 monster;
  - whenever an EARTH monster is Flip Summoned → 1000 damage to the opponent (it declares the S03-U225 `onOtherFlipS03` opt-in).
- 地縛神の咆哮: a Continuous Trap (forced, once per turn). At the opponent's attack declaration, if the attacker's ATK is lower than a face-up
  「地縛神」's ATK → it destroys the attacker and deals half that ATK as damage.

## Existing test adjusted (filler card, no assertion changed)
`tools/test_class_a_attack_bulk.js` used 極星將テュール as a plain 「極星」 filler, with the comment 「登録なしなので昇格しない」.
- Now that the card has its script, it destroys itself (correctly) when it is the only 「極星」 there, so the filler vanished before the scenario.
- The filler is now 極星獣ガルム; the variable was already named `garm`.
- The assertions and the count (67) are unchanged.

## Tests
`tools/test_s03_u230_ns22.js` passes 19/0, on real DUEL paths and Replay-audited.
- The Counter Trap answers a real 死者蘇生.
- テュール's self-destruction happens at rule processing.
- The counter damage is checked with and without another FIRE monster.
- The summon procedures run through `runSummonProcedure`.
- A real Flip Summon.
- A real attack declaration for 地縛神の咆哮, including an attacker that is not weaker.

Negative control on U229: 12 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15807 PASS / 0 FAIL** (= U229 15788 + 19 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U229.
- Coverage: TESTED 2657, ENGINE_GAP 598, NOT_STARTED 1064, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 617 declared, 0 off-target.
