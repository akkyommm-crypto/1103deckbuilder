# S03-U36 C-S03-28 on the MANUAL routes (Claude)

Base: `checkpoint_claude_s03_vs9_pot_interrupted_resume_slice_20260913.zip`, SHA256 `2cbd9c6671503be9daa55d9d70c7a89529684c83338a91f5d523f08b4450c323`.

## How it was found

- U35 recorded as ② that its marker is set only on the DUEL entry points. The user plays in MANUAL, so this was measured first.
- **Measured on the U35 engine** (scratchpad `u36_manual_interrupt_probe.js`): MANUAL `activateFromHand` → `askChain` → `runEffect` → `runScript`, saved while the legacy choice was open and resumed in a fresh VM.
  - サイクロン (target choice) and 増援 (search choice) both reloaded **stranded face-up in the Spell & Trap Zone**.
  - The choice carried no activation marker, and **the Replay audit after the resume failed (`finalDigest`)**.
- **Side finding** (scratchpad `u36_hurricane_probe.js`), not a bug:
  - MANUAL ハリケーン apparently did nothing in the harness because `confirmTargets` shows a 「チェーンしますか？」 sheet when the opponent holds a card that can respond, and waits for a click. The same activation resolves normally in DUEL.
  - That sheet, like `askChain`, is a UI closure with no pending choice. A save while it is open is recorded as ②.

## Measurement before the fix

- `tools/test_s03_u36_manual_interrupted_activation.js` on the U35 engine (tree at VS9, identical engine): **0 PASS / 18 FAIL**.
- Every scenario failed:
  - no marker;
  - no rollback notice;
  - the card stranded;
  - a Replay digest mismatch after the resume.

## Requirement closure record

- **Requirement.** C-S03-28 on the MANUAL routes the user plays:
  - openHand 「⚡ 発動（効果を自動処理）」 → `activateFromHand`;
  - a set card's menu → `activateFromZone`.
  - Resuming a save taken while such an activation's legacy cost / target / search choice is open undoes the activation, and Replay stays consistent.
- **Root cause (INTEGRATION_MISSING).** U35 began the marker only in the DUEL entry points and `prepareDuelActivation`. The MANUAL routes reach `runScript` without it.
- **Closure** (guarded transform `u36_transform.py`, exactly-once patterns, dry run first):
  - **`engine/60_damage_segoc_ui_helpers.js` `activateFromHand`.**
    - Captures `prepSeqU36 = V41_ACTION_SEQ` before the `MOVE`.
    - The legacy `askChain` continuation calls `beginActivationPrepS03(p, placedU31, nm, prepSeqU36)` before `runEffect`, and `settleActivationPrepS03()` after it.
  - **`engine/70_summon_procedures.js` `activateFromZone`.** The same, capturing the seq before `FX_SET_STATE` face-up.
  - The marker exists only while the effect is being processed. An `askChain` that is never answered leaves no stale marker. A MANUAL activation that finishes without a choice clears it at once, as test case D shows.
  - **No new gameState key; no card file changed. The U35 recovery itself is unchanged.**
- **Consumers.** Every MANUAL activation whose effect uses a legacy choice. Tested: サイクロン from the hand, a set サイクロン, 増援.
- **Recovery.** No status change.
- **Dependent classification.**
  - **① Covered** (save with the choice open → fresh VM → resume → Replay audit):
    - A: MANUAL サイクロン back in the hand, re-activated in MANUAL, destroys its target;
    - B: set サイクロン face-down again;
    - C: 増援 back in the hand, Deck untouched;
    - D: ハリケーン resolved first (its bounce stays), then サイクロン saved mid-choice — only サイクロン is undone.
  - **② Remaining.**
    - A save while a MANUAL 「チェーンしますか？」 sheet (`askChain` / `confirmTargets`) is open — no pending choice exists.
    - MANUAL P1.1 cards go through `prepareDuelActivation` (U35); their marker starts after the MOVE, but their choices are registry choices and restore in place.
    - The U35 ② items are unchanged.
  - **③** None.
- **Practical effect.** In MANUAL — the mode the user plays — closing or reloading mid target / cost / search choice no longer strands the card, and Replay no longer breaks. The duel resumes just before that activation.

## Changed files

- `engine/60_damage_segoc_ui_helpers.js`: `activateFromHand` captures the seq, and begins / settles the marker around `runEffect`.
- `engine/70_summon_procedures.js`: `activateFromZone`, the same.
- `tools/test_s03_u36_manual_interrupted_activation.js`: new; wired into `tools/check.py` after VS9.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`.

`dist/*.html` were not edited by hand. No file under `cards/` changed.

## Verification

- **U36 test.** `node tools/test_s03_u36_manual_interrupted_activation.js` EXIT 0, **18 PASS**. Before, on the U35 engine: 0 PASS / 18 FAIL.
- **Regression suites on the same build, all EXIT 0:** U31 MANUAL card activation (8), U35 (27), VS9 (19), U01 (56), U34 (18).
- **Before the gate:** every card named in the new test was checked against the U35 baseline — all TESTED / GENERIC_OK.
- **Full gate.** `python tools/check.py` (with S03-U36): EXIT 0, **12471 PASS / 0 FAIL** (VS9's 12453 + U36 18). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u36_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Status counts unchanged: TESTED 2071 / ENGINE_GAP 614 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 179 / GENERIC_OK 644 / TOTAL 4996.
- Gated source manifest SHA256 (excluding dist/ and *.log, with this report set aside): `3b0b89d3d7aae5e6266a069880dcf02347fceffc52585fdb4d72ebdfe1938c54` (683 files).
