# S03-U288 — ENGINE_GAP re-check 8: 森のざわめき, 機械複製術, 大波小波, ドラゴンを呼ぶ笛, バグ・ロード, 錬金生物 ホムンクルス

## Workflow
- Sonnet battle-implementer (workflow v3). Profile `delegation-expanded-v3-batch3`. Category: reuse. No engine change.
- All six ENGINE_GAP reasons ("replay-safe resolution-time hand / Deck selection and simultaneous Special Summon", "Attribute override") are covered by existing primitives.

## Cards → TESTED (2011 texts) — cards/HZZZZZO_claude_s03_u288_gap8.js
- **森のざわめき:** target (face-up opponent monster) chosen at activation → face-down Defense (FX_SET_STATE, not a Flip); only if that happened, the optional (0–1) return of a Field Spell (either side, a Set one too) to its owner hand.
- **機械複製術:** target an own face-up Machine with current ATK ≤ 500; if it is still a face-up monster, the player chooses 1–2 same-name monsters from the Deck (limited by free zones) and Special Summons them.
- **大波小波:** needs an own face-up WATER monster; destroys them all; the number actually destroyed is the limit of the optional Special Summon of WATER monsters from the hand.
- **ドラゴンを呼ぶ笛:** needs a face-up 「ロード・オブ・ドラゴン－ドラゴンの支配者－」 on the field at activation and at resolution; 1–2 Dragons from the hand.
- **バグ・ロード (Quick-Play):** the activator, then the opponent, each may Special Summon from their own hand a monster with the Level of a face-up Level ≤ 4 monster they control; both are summoned together.
- **錬金生物 ホムンクルス:** ignition, once per turn, own Main Phase; the Attribute (not the current one) is declared at activation; it becomes that Attribute while it stays face-up on the field (characteristic override, faceUpOnly).

## Rulings / notes
- 「2体まで」 (機械複製術, ドラゴンを呼ぶ笛): at least 1 is chosen when possible (standard "up to" reading); 「できる」 (大波小波, バグ・ロード, 森のざわめき' return): the choice may be declined.
- 森のざわめき: a Set card in a Field Zone is a Field Spell card and is offered.
- Special Summon positions: asked of the summoning player by the engine (S03-U278 / U283).

## Tests
`tools/test_s03_u288_gap8.js` passes 116/0, Replay-audited. Negative control on U287: 89 FAIL (no crash; Sonnet's run, before the review case was added).
- Status-record tests `test_v580_batch10`, `test_v600_batch12`, `test_v610_batch13`: the finished cards move from the "precise ENGINE_GAP" list to an "unlocked" list (checks `!ov[n]`); the number of checks is unchanged (46 / 54 / 50).

## Opus review (TESTED rule)
- 機械複製術: the resolution did not recheck the targeting condition. Fixed: a target that is no longer a Machine with ATK 500 or less at resolution is not affected. New case M7b: 突進 (+700) in response → nothing is summoned. Without the fix, M7b FAILs.
- The other five cards match their texts; TESTED accepted.
- Sonnet hit its weekly usage limit while the gate ran (it ended with GATE_EXIT=0, 17828 PASS). Opus read the results and finished the hand-back. The gate is rerun after the fix.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17830 PASS / 0 FAIL** (= U287 17714 + 116 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U287.
- Coverage: TESTED 2908, ENGINE_GAP 490, NOT_STARTED 921, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 870 declared, 0 off-target.
- Published in the batched checkpoint S03-U288–U291.
