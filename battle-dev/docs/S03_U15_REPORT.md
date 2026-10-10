# S03-U15 C-S03-12 SUMMON_WINDOW_RESUME (Claude)

Base: `checkpoint_claude_s03_u14_summon_counters_20260911.zip`, SHA256 `867fa72abf8208710a5c36b2e98a4f45a03176c485a24cf1d60a32c873a6be1b`.

## How it was chosen

- **DESTROY_SUBSTITUTION** (the 六武衆 core gap) needs a player choice inside the destruction reducers. It is a broad pipeline design, so it was written up as an Astra consultation (`logs/S03_DESIGN_CONSULT_DESTROY_SUBSTITUTION.md`) instead of being implemented.
- **Q5** (legacy closure choices) was re-checked. After a reload they are already aborted safely (`reconcileChoiceAfterLoadV49`): the effect is lost, but the duel does not stall.
- **Q3** (save/continue inside the summon-negation window) was measured and turned out to be a hard stall.

## Measurement before the fix (U14 build)

- **Why a save lands in the window.** Autosave runs after every Action (`act` → `saveDuelSoon`, 400 ms). `SUMMON_WINDOW_OPEN_V42` is an Action, and the window waits for the opponent's decision, so saves inside the window are routine.
- **Probe with the app's own `saveDuel` / `offerResumeDuel`, in two VMs.** Player 1 Normal Summons ヂェミナイ・エルフ into Player 2's set 昇天の角笛.
  - **Live, without a reload:** committing summons it.
  - **Resumed:**
    - `pendingSummon` is kept, but no window sheet is shown.
    - `duelFlowBusyReasonV30` answers 「召喚無効タイミングの処理中です」 and `ensurePublicDuelFlowV30` refuses every action. The duel cannot continue.
    - Even a programmatic `commitPendingSummonV2()` only closed the window. ヂェミナイ・エルフ stayed in the hand, with the Normal Summon already spent.
- **U15 test on the U14 build: 7 PASS / 2 FAIL, then it threw.**
  - **Undo back into the window after a commit (G):** committing again left the monster in the hand. The closure had been cleared, so Undo hits the same defect.
  - **A:** the continuation is not data.
  - **Resume cases:** the test threw because no reopen exists.

## Requirement closure record

- **Requirement.** A duel saved, reloaded, undone or redone while a summon waits in the summon-negation window can continue.
  - The window is shown again.
  - Committing or negating completes the summon with the same Actions it would have used live.
- **Root cause (INTEGRATION_MISSING).**
  - For a Normal Summon, a hand summon procedure and a Flip Summon, the continuation was a module closure (`PENDING_SUMMON_COMMIT/CANCEL`) outside `gameState`.
  - `pendingSummon.commit` named a global that only called that closure.
  - Resume, Undo and Redo also had no path to show the window again.
  - Synchro/Xyz were already data-driven (`pendingExV2`).
- **Closure.**
  - **`engine/40_legal_script_engine.js`.**
    - `runSummonWindowResumeS03(ps,result)` runs the commit or cancel from `pendingSummon.resumeS03`.
    - The Actions are the same as the old closures: `NORMAL_SUMMON` + `applyNormalSummonMethod` + `onNormalSummon`; `doSpecialFromZoneUidV370`; `FX_SET_STATE` + `onFlip`. Cancel is `MOVE` to the GY, or `FX_TO_GRAVE byDestroy` for a Flip Summon.
    - `__pendingSummonCommit/Cancel(ps)` use it. The closures remain only as a fallback.
  - **The three summon sites store `resumeS03`** and no longer set closures: `engine/70_summon_procedures.js` (normal), `engine/40` (procedure), `runtime/50_actions_save.js` (flip).
  - **`engine/30_processor_chain_battle.js`.**
    - `commitPendingSummonV2` / `cancelPendingSummonV2` pass `ps`.
    - `showSummonWindowSheetV2` is split out of `beginSummonWindowV2`.
    - `reopenSummonWindowAfterLoadS03()` shows the sheet and never auto-commits, so Undo does not re-summon. It leaves chain and choice states to the existing paths.
  - **`runtime/50_actions_save.js`.** `offerResumeDuel`, `undo` and `redo` call the reopen.
- **Consumers.** Every DUEL Normal Summon, hand summon procedure and Flip Summon whose opponent has a legal summon negator: set 神の宣告 / 神の警告 / 昇天の角笛 / 奈落 family negators, face-up ライオウ, and so on. Also Undo and Redo through such windows.
- **Recovery.** No card status change. Every real duel that is saved or reloaded during a summon window can now continue.
- **Dependent classification.**
  - **① Covered by the test:** Normal Summon, procedure and Flip Summon resumes; negation after resume; Undo; an old save.
  - **② Remaining.**
    - A save taken while a negation chain was on the chain inside the window. Resume clears the processor, and chain continuation is the existing generic resume path (not changed here). With `resumeS03`, the final commit or cancel is data-driven once the chain ends.
    - Old saves (from before this unit) that are inside the window cannot restore the summon itself. The window closes, the duel flow is freed, and the log says so.
  - **③ Found while testing, not this unit (COST_READS_TARGETS).**
    - 昇天の角笛 cannot be activated on the real path. `prepareDuelActivation` pays `cost` before `selectTargets`, but its `cost` reads `ctx.selectedTargets`, so activation fails with 「コストを払えません」 and leaves the card face-up.
    - A brace-matched scan finds 24 TESTED legacy scripts with the same shape. Recorded in WORK_QUEUE as the next candidate.
    - For that reason the negation-after-resume case uses ライオウ.
- **Practical effect.** Before, closing or reloading the app while a summon waited for the opponent's negation decision made the saved duel impossible to continue, and Undo into that window lost the summon. Both now continue normally.

## Changed files

- `engine/40_legal_script_engine.js`: continuation registry and procedure site.
- `engine/70_summon_procedures.js`: Normal Summon site.
- `runtime/50_actions_save.js`: Flip Summon site; reopen hooks in resume, undo and redo.
- `engine/30_processor_chain_battle.js`: pass `ps`, sheet split, reopen function.
- `tools/test_s03_u15_summon_window_resume.js`: new; wired into `tools/check.py`.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The edits were applied by a guarded transform (every pattern had to match an exact count; `--dry` first). `dist/*.html` were not edited by hand. Every card named in the test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_u15_summon_window_resume.js`.** EXIT 0, 24 PASS:
  - live control; Undo back into the window;
  - Normal Summon, hand procedure and Flip Summon resumed in a second VM;
  - ライオウ negation after resume;
  - an old save without continuation data;
  - Replay audits after each resumed path.
  - On the unfixed U14 build: 7 PASS / 2 FAIL, then it threw.
- **Full gate.** `python tools/check.py`: EXIT 0, **12016 PASS / 0 FAIL**. The S03 audit observes 19 declared status changes (all from earlier units), with 0 off-target; the Astra01 and Astra02 audits pass (`s03_u15_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2253.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `80d90d3be410d5f6a6f5728e009e3c4718969530d4fa91aa2af76003e0dbf50e` (611 files).
