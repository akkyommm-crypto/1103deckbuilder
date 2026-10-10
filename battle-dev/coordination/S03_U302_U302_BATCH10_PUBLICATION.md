# S03-U302–U302 霞の谷のファルコン attack-declaration cost — batched publication (Claude, 2026-10-10 JST)

## Checkpoint
- file: `checkpoints/checkpoint_claude_s03_u302_u302_batch10_20261010.zip` (one checkpoint for 1 units)
- SHA256: `a155a07610dc86b0f7a34a5bfe9b9f910565a2f2035b9396a393e96bc4d2d040`
- size: 10,006,284 bytes; entries: 1526; `testzip()` OK; local and shared copies match (SHA / size / entry count); every unit's test, report and measurement are inside.
- base: `checkpoint_claude_s03_u298_u299_batch9_20261010.zip` `477303a11c1fead3601eb878fa51f2276991cf242b6046e3f403439937c78e65` (U301, 18165 PASS).
- source manifest SHA256: `4f8c5e7119f899cb0458086b2de4f4e98fd5f2ce9abf92fa4e885467cd653874` (1523 files) — tree `s03_u302`, the gated tree of the last unit.
- `dist/battle.html` `b2f2a21b1080ee682c12656fdad4bc311d6299b600b134b888e1ffdc351ed6e7`; `dist/battle_acode.html` `bcc7f2a9090141ed90d8777459a3076b6775a9158b8fb72b40f797e7af3f9dbe` (regenerated after the gate; the device HTML is `dist/battle_acode.html` inside the ZIP).

## Units
- S03-U302 — 霞の谷のファルコン: the attack-declaration cost of returning another own card. Test `tools/test_s03_u302_falcon_attack_cost.js` 13/0; negative control: see report; gate 18178 PASS / 0 FAIL (= 18165 + 13). Detail `docs/S03_U302_REPORT.md`.

## Gate (final tree)
- `GATE_EXIT=0`, **18178 PASS / 0 FAIL** (= U301 18165 + 13 new over the batch), no Traceback / ReferenceError; recorded `cycle32` noise only. Each unit's own gate and pre-scan passed in order (above).
- Coverage: TESTED 2927, ENGINE_GAP 472, NOT_STARTED 920, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30; audit 889 declared, 0 off-target.
- Coverage change from U301: TESTED 2926→2927, NOT_STARTED 921→920.

## Not done / references
- Open items and the next work: `logs/CLAUDE_RESUME.md` (current block, known deferred findings).
