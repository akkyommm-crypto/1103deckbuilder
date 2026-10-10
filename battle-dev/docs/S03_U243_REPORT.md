# S03-U243 — NOT_STARTED 30

## Workflow (mixed, fresh Sonnet subagent)
- Opus chose the cards and wrote the brief.
- A fresh Sonnet subagent wrote the card script and the test: 61/0 on its first hand-back, with no engine change. It also ran its own negative control (card file removed from the manifest: 25 FAIL).
- The main session reviewed it (`SETCODE.SCRAP` covers exactly the スクラップ cards) and did the negative control on the U242 build, the declarations, this report and the gate.
- Measured: subagent 214,926 tokens, 55 tool uses, 449 s; rework 0.

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZZW_claude_s03_u243_ns30.js

| Card | Effect |
|---|---|
| ワンショット・キャノン | once per turn: destroy a face-up monster; its controller takes half its ATK |
| ベビー・トラゴン | Main Phase 1, detach 1: an own Level 1 monster can attack directly this turn |
| シャインエルフ | the opponent summons → may detach 1: that monster −500 ATK |
| スクラップ・ビースト | ① face-up Defense and attacked → destroyed at the end of that Battle Phase; ② destroyed by a 「スクラップ」 effect → add another 「スクラップ」 monster from the GY |
| ミラー・レディバグ | hand procedure (a face-up monster, no monster in the GY); its Level becomes the total of the others; destroyed at Level 13+ |
| カラクリ忍者 参参九 | must attack; attacked in Attack Position → Defense Position; FLIP: a face-up monster to the GY; may attack directly the turn it flipped |

Rulings chosen and reviewed:
- Xyz Monsters have Ranks, not Levels, so they are excluded from トラゴン's targets and from レディバグ's total. Face-down monsters add 0.
- スクラップ・ビースト's own ① destruction is destruction by a 「スクラップ」 card's effect, so ② can follow.
- 参参九's direct-attack permission is set when its FLIP effect resolves.

## Existing tests adjusted (filler card, no assertion changed)
- `tools/test_class_a_attack_bulk.js` and `tools/test_ready25_b2.js` used カラクリ忍者 参参九 as an unscripted 「カラクリ」 filler for a negative must-attack check.
- Now that it has its own must-attack rule (correctly), that check failed in the first pre-scan, and the gate was not run.
- The filler is now カラクリ蜘蛛, a 「カラクリ」 monster with no must-attack text. The assertions and counts (67 / 94) are unchanged, as in the S03-U230 precedent.

## Tests
`tools/test_s03_u243_ns30.js` passes 61/0, on real DUEL paths. Scenarios with actions are Replay-audited.
- Every card has a negative case.
- レディバグ's Level 12 / 13 boundary.
- ビースト's ① → ② chain, and no ② after ブラック・ホール.

Not checked:
- save / load in the middle of the new detach-cost choices;
- simultaneous summons for シャインエルフ.

Other checks:
- `test_s03_u135` still passes.
- Negative control on U242: 25 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16204 PASS / 0 FAIL** (= U242 16143 + 61 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U242.
- Coverage: TESTED 2723, ENGINE_GAP 594, NOT_STARTED 1003, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 683 declared, 0 off-target.
