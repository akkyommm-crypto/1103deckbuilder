# S03-U35 C-S03-28 INTERRUPTED_ACTIVATION_RECOVERY (Claude)

Base: `checkpoint_claude_s03_u34_pot_resolution_20260913.zip`, SHA256 `879ba59ab77fd50f9a00d412074f1e9d4cc737b0ec4a47bad744bbf379984125`.

## How it was found

- **U34** showed that 強欲で謙虚な壺, saved while its old activation-time reveal was open, reloaded stranded in the Spell & Trap Zone. The question for this unit was whether the same happens to every Spell/Trap whose cost or target is chosen through a legacy closure choice (WORK_QUEUE Q5, previously noted as "aborted safely after reload").
- **Why a save can land there.** `act()` calls `saveDuelSoon()` after every Action (a 400 ms timer). Activating from the hand journals `MOVE` hand → zone, and activating a set card journals `FX_SET_STATE` face-up, **before** the cost / target choice is answered. On load, `reconcileChoiceAfterLoadV49` releases a legacy choice whose closure is gone, and nothing undoes the Actions already taken.
- **Measured on the U34 build** (scratchpad `u35_cyclone_save_probe.js`, `u35_shapes_probe.js`; save with the choice open, resume in a fresh VM):
  - サイクロン from the hand → face-up in the Spell & Trap Zone, no chain link, no choice, empty hand;
  - a set サイクロン → left face-up, no chain link;
  - マジック・ジャマー activated in chain to 天使の施し, discard choice open → left face-up; the chain window was also gone, so the duel reported 「チェーン処理中です」 with nobody holding priority;
  - 増援 (its search choice opens at activation) → face-up in the zone.
- **Scale.** About 130 `selectTargets` / `cost` sites in `cards/` use legacy `API.selectCard` choices (41 in `selectTargets`, 90 in `cost`), plus 23 `API.confirm` calls.

## Measurement before the fix

- `tools/test_s03_u35_interrupted_activation.js` run on an extracted copy of the U34 checkpoint: **7 PASS / 20 FAIL**.
- Every scenario failed:
  - no marker;
  - no rollback notice;
  - the card stranded face-up;
  - the re-activation impossible;
  - **the Replay audit after the resume failed with `finalDigest`**, because the load released the pending choice without an Action, so the saved Journal no longer described the state.
- The passing assertions were the registry / truncated-Journal controls, which behave the same before and after.

## Requirement closure record

- **Requirement.** Resuming a save taken while an activation is still choosing its cost or target must not leave the game in a state that is illegal or stuck. The activation is undone back to the position before it began — including any cost already paid — and play continues from there, with Replay still consistent.
- **Root cause (INTEGRATION_MISSING).**
  - Legacy choices store their continuation in a closure that cannot be saved.
  - The activation's earlier Actions are journaled.
  - The load released the choice but had no record of where the activation began.
- **Closure.**
  - **`engine/1X_interrupted_activation_s03.js` (new).**
    - `beginActivationPrepS03(p, card, name)` records `afterSeq`, the last Journal seq before the activation's first Action.
    - `endActivationPrepS03()` / `settleActivationPrepS03()` clear it: always, or when no choice is pending.
    - `activationPrepMetaS03()` supplies it to the choice.
    - `recoverInterruptedActivationAfterLoadS03()`:
      - acts only on a pending **legacy** choice carrying the marker, when its closure is gone and `v44ReplayReady` holds;
      - rebuilds the state from the Journal's initial state through the last entry with `seq <= afterSeq`, using `v44ApplyReplayEntry` (digest- and RNG-checked);
      - adopts that prefix with `v44ReplayAdoptPrefix` and applies the load's processor normalisation;
      - restores the saved `chainWindow` when the same chain is still open (the window is written directly, not by an Action);
      - shows 「保存時に途中だった「○○」の発動を取り消し、発動前の状態に戻しました」.
    - On any mismatch, or with a truncated Journal, it changes nothing, and the old release applies.
  - **`engine/09_choice_request_v49.js`.** `requestChoiceV49` copies the marker into `choice.meta.activationPrepS03` for legacy choices only. It is JSON, part of CHOICE_OPEN_V49, saved and replayed. The legacy continuation calls `settleActivationPrepS03` after `onPick` / `onCancel`.
  - **`engine/30_processor_chain_battle.js`.**
    - `prepareDuelActivation` begins the marker after the uid is ensured, keeping an existing marker for the same card.
    - It ends the marker on a legality refusal, before the P1.1 path (registry choices are restorable) and right after `CHAIN_ADD`, and settles it before returning.
    - `duelActivateFromHand` and the hand route of `duelActivateResponseV2` begin the marker before their `MOVE`.
  - **`runtime/50_actions_save.js`.** `offerResumeDuel` calls the recovery just before `reconcileChoiceAfterLoadV49`.
  - **No new gameState key; no card file changed.**
- **Consumers.** Every DUEL activation whose cost or target uses a legacy choice. Covered by test: サイクロン (from the hand and from the set state), マジック・ジャマー (cost in chain), 増援 (choice at activation).
- **Recovery.** No status change.
- **Dependent classification.**
  - **① Covered** (each scenario saves with the choice open, resumes in a fresh VM, audits Replay, then plays on):
    - サイクロン back in the hand, re-activated, destroys its target;
    - the set サイクロン face-down again, re-activated;
    - マジック・ジャマー set again, P2 keeps both hand cards, 天使の施し still chain link 1 with P2 holding priority; P2 responds again and negates it;
    - 増援 back in the hand, Deck untouched, re-activated, searches.
    - Controls: a registry choice (強欲で謙虚な壺 at resolution) is restored, not rolled back; with a truncated Journal nothing is rolled back and nothing throws.
  - **② Remaining.**
    - **MANUAL** entry points (`activateFromHand` / `activateFromZone` → `askChain` closure → `runEffect`) set no marker. A save during `askChain` has no pending choice at all. The MANUAL player can still move the card by hand.
    - Legacy choices **during resolution** are released as before; the resolution is not rolled back.
    - Summon-procedure `cost(ctx,done)` closures are not covered.
    - The underlying fix — migrating the ~130 legacy cost / target choices to registry choices — is not done. This unit makes an interrupted save safe, not restorable in place.
  - **③** None.
- **Practical effect.** Closing or reloading the app in the middle of choosing a target or cost no longer leaves a card stuck face-up on the field, a lost chain window, or a Replay that no longer matches. The duel resumes just before that activation.

## Changed files

- `engine/1X_interrupted_activation_s03.js`: new; registered in `build_manifest.json` after 1W.
- `engine/09_choice_request_v49.js`: marker in the legacy choice meta; settle after the legacy continuation.
- `engine/30_processor_chain_battle.js`: begin / end / settle in `prepareDuelActivation`; begin in the two hand routes.
- `runtime/50_actions_save.js`: the recovery call in `offerResumeDuel`.
- `tools/test_s03_u35_interrupted_activation.js`: new; wired into `tools/check.py` after U34.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`.

`dist/*.html` were not edited by hand. No file under `cards/` changed.

## Verification

- **U35 test.** `node tools/test_s03_u35_interrupted_activation.js` EXIT 0, **27 PASS**. Before, on the U34 build: 7 PASS / 20 FAIL.
- **Regression suites on the same build, all EXIT 0:**
  - S03 units and slices: U01 (56), U03 (57), U04 (39), U15 (24), U16 (18), U17 (20), U18 (15), U29 (14), U31 (8), U34 (18), VS3 (22), VS4 (25), VS8 (19);
  - choice and activation suites: `test_p1_choice_recovery_minibatch` (67), `test_p1_choice_request` (83), `test_p11_activation_context` (32), `test_astra01_cards` (76), `test_ritual_v5` (63).
- **Before the gate:** every card named in the new test was checked against the U34 baseline coverage — all TESTED / GENERIC_OK. This is the U34 lesson.
- **Full gate.** `python tools/check.py` (with S03-U35): EXIT 0, **12434 PASS / 0 FAIL** (U34's 12407 + U35 27). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u35_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Status counts unchanged: TESTED 2071 / ENGINE_GAP 614 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 179 / GENERIC_OK 644 / TOTAL 4996.
- Gated source manifest SHA256 (excluding dist/ and *.log, with this report set aside): `fc073b0b2b6a8b837ee9c9bbe9ae223e8634764d45bda9d00f4f7c7f0c638fba` (679 files).
