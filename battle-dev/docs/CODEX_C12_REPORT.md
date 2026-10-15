# CODEX-C12 — Activation cancellation and first-turn Battle Phase

Base: pushed CODEX-C11 (`d7fb425`) on `codex/phase-priority`. Claude's worktree and branch were not edited.

## Reported symptoms

- After mistakenly activating `サイクロン`, the target-selection screen could be cancelled, but the duel did not return any further: the card remained face-up in the Spell & Trap Zone without entering the chain.
- The first player could still select the Battle Phase button on turn 1, although that turn cannot have a Battle Phase.

## Cause and fix

- Activation-time legacy choices already carried the pre-activation Journal sequence for save/resume recovery, but live cancellation discarded that marker. Cancellation now walks the normal Undo snapshots back to that sequence, restoring hand/Set position, paid costs, Journal, and Replay together. The UI labels this action `発動を取り消す`; ordinary resolution choices remain `やめる` and do not roll back unrelated actions.
- The phase rail previously checked only the generic route `main1 -> battle`. It now also applies the shared Battle-Phase prohibition, and the processor rejects a prohibited BP before opening any phase-end priority window. Main Phase 1's normal Next action already routes directly to End and remains unchanged.

## Validation

- Negative control on the pre-fix generated build reproduced both Cyclone failures and the enabled turn-1 BP button.
- `tools/test_codex_c12_activation_cancel_first_turn.js` covers hand and Set Cyclone cancellation, a response Trap's cost-choice cancellation, reactivation after cancellation, a non-activation-choice negative control, turn-1 UI/direct-request/End routing, turn-2 Battle Phase availability, and Replay digest equality.
- Existing interrupted-activation save/resume, P1 choices, phase-priority, UI, nearby Cyclone tests, and the mandatory 大天使クリスティア target-choice regression are run before the full repository gate. Mandatory triggers are explicitly excluded from player-requested activation rollback.
