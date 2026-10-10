# S03-U37 C-S03-28 for MANUAL chain-prompt sheets (Claude)

Base: `checkpoint_claude_s03_u36_manual_interrupted_activation_20260913.zip`, SHA256 `f51f1c56a0694d84c72265aeded30e40cb7f13356e5e6f98d1f1665e46e12449`.

## How it was found

- U36 recorded as ② a save while a MANUAL 「チェーンしますか？」 sheet is open. The user plays MANUAL, so this was measured next.
- **Measured on the U36 build** (scratchpad `u37_manual_sheet_probe.js`, `ASK_CHAIN` on):
  - **`askChain`** — ハリケーン activated from the hand while the opponent held a set マジック・ジャマー: the sheet waits (`PENDING_CONTINUE`). A save then resumed with **ハリケーン stranded face-up in the Spell & Trap Zone**.
  - **`confirmTargets`** — サイクロン after choosing 奈落の落とし穴 as its target, while the opponent could still chain: the sheet waits (`TG_RESOLVE`). A save resumed with **サイクロン stranded**.
  - Neither sheet creates a pending choice, so the U35 / U36 recovery (a marker on a legacy choice) cannot see them. Replay stays consistent, because only the MOVE was journaled.
- **Why a plain "prompt open" flag is not enough** (`engine/20` `openReact`): the 「チェーンする」 buttons close the sheet and open the reaction panel **without clearing the pending continuation**. A save taken after the opponent reacted would still show the prompt as open, and rolling back would erase that reaction.

## Measurement before the fix

- `tools/test_s03_u37_manual_prompt_interrupted_activation.js` on an extracted copy of the U36 checkpoint: **11 PASS / 3 FAIL**.
- The failures are exactly the two stranded cases: A (twice) and B.
- The two controls pass unchanged on both builds, as intended: C, where something was journaled after the prompt, and D, where the prompt was answered.

## Requirement closure record

- **Requirement.** In MANUAL, a save taken while a chain-prompt sheet waits during an activation — with **nothing journaled after the sheet opened** — resumes with that activation undone. If anything was journaled after the sheet opened, nothing is rolled back.
- **Root cause (INTEGRATION_MISSING).** The prompts wait in module-global closures outside gameState. Nothing saved records that a prompt was open or where the activation began.
- **Closure** (guarded transform `u37_transform.py`, exactly-once patterns, dry run first):
  - **`engine/1X_interrupted_activation_s03.js`.**
    - `PROMPT_OPEN_S03 = {seq}` via `notePromptOpenS03` / `notePromptClosedS03`.
    - The MANUAL prompt marker `noteManualActivationPromptS03(p, card, name, afterSeq)`, which also records `promptSeq`, and `clearManualActivationPromptS03`.
    - `interruptedPromptSaveMetaS03()` returns a marker only if a prompt is open, no V49 choice is pending, the current Journal seq equals the prompt's seq, and an activation marker exists (the U35 / U36 marker, or the MANUAL prompt marker with the same `promptSeq`).
    - `settleActivationPrepS03` keeps the activation marker while a prompt is open.
    - `recoverInterruptedActivationAfterLoadS03(savedPromptS03)` uses the saved marker when no choice is pending. The Replay-prefix rollback itself is unchanged.
  - **`engine/40_legal_script_engine.js`.** `askForce` and the waiting branch of `confirmTargets` note the prompt open. `__forceYes` / `__tgResolve` note it closed and settle the marker; `__forceNo` notes it closed and ends the marker.
  - **`cards/40_auto_interpreter.js`.** `askChain` notes the prompt open when it waits; `chainPassed` notes it closed. **This is the unit's only `cards/` change: engine plumbing that lives in that file, not card behaviour.**
  - **`engine/60` `activateFromHand` / `engine/70` `activateFromZone`.** They note the MANUAL prompt marker before `askChain`; the continuation clears it before beginning the U36 marker.
  - **`runtime/50_actions_save.js`.** `saveDuel` adds `interruptedPromptS03` to the save payload, next to `state` / `replay`, outside gameState and the digest. `offerResumeDuel` passes `d.interruptedPromptS03` to the recovery.
  - **No new gameState key.** Saves without the field behave exactly as before.
- **Consumers.** MANUAL activations waiting on `askChain`, `confirmTargets` or `askForce`. Tested: ハリケーン (`askChain`), サイクロン (`confirmTargets`).
- **Recovery.** No status change.
- **Dependent classification.**
  - **① Covered** (save → fresh VM → resume → Replay audit):
    - A: the `askChain` sheet waiting → ハリケーン back in the hand; activated again with the prompt off, it bounces マジック・ジャマー;
    - B: the `confirmTargets` sheet waiting → サイクロン back in the hand, 奈落 still set;
    - C: control — an Action journaled after the sheet opened → no marker saved, nothing rolled back;
    - D: control — the sheet answered and the effect resolved → no marker, result kept.
  - **② Remaining.**
    - `askForce` is wired like `confirmTargets`, but not individually path-tested: its sheet appears only when a timing or condition check fails in MANUAL.
    - A MANUAL prompt opened outside an activation (e.g. around a summon) carries no marker.
    - The harness cannot run the `setTimeout` that arms `TG_RESOLVE` / `FORCE_CB`. The marker is noted synchronously, so the save path is tested; answering those two sheets is not driven in the test.
    - The U35 / U36 ② items are unchanged.
  - **③** None.
- **Practical effect.** In MANUAL, closing or reloading the app while 「チェーンしますか？」 is on screen during an activation no longer strands the card; the duel resumes just before that activation. If the opponent has already acted, nothing is undone.

## Changed files

- `engine/1X_interrupted_activation_s03.js`: the prompt marker, save meta, settle rule and recovery parameter.
- `engine/40_legal_script_engine.js`: `askForce`, `confirmTargets` and their handlers.
- `cards/40_auto_interpreter.js`: `askChain`, `chainPassed`.
- `engine/60_damage_segoc_ui_helpers.js`, `engine/70_summon_procedures.js`: the MANUAL prompt marker around `askChain`.
- `runtime/50_actions_save.js`: the save payload field and the load call.
- `tools/test_s03_u37_manual_prompt_interrupted_activation.js`: new; wired into `tools/check.py` after U36.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`.

`dist/*.html` were not edited by hand.

## Verification

- **U37 test.** `node tools/test_s03_u37_manual_prompt_interrupted_activation.js` EXIT 0, **14 PASS**. Before, on the U36 build: 11 PASS / 3 FAIL.
- **Regression suites on the same build, all EXIT 0:** U31 (8), U35 (27), U36 (18), VS9 (19), U01 (56), `test_p1_choice_recovery_minibatch` (67).
- **Before the gate:** every card named in the new test was checked against the VS9 baseline — all TESTED / GENERIC_OK.
- **Full gate.** `python tools/check.py` (with S03-U37): EXIT 0, **12485 PASS / 0 FAIL** (U36's 12471 + U37 14). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u37_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Status counts unchanged: TESTED 2071 / ENGINE_GAP 614 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 179 / GENERIC_OK 644 / TOTAL 4996.
- Gated source manifest SHA256 (excluding dist/ and *.log, with this report set aside): `ca6bf94f4c2a9ca8adf6d04ecae30dc708a4368cd6d046907a7e2fea452f9fca` (685 files).
