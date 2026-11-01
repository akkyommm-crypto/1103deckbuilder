# Battle integration through S03-U496

## Fixed inputs

- Main: `550cb40a42d6055a6edcc4f9e9edd4379773f993` (includes rulings v8.154).
- Claude: `00837c937c1b8f388dad787b685548d58d2aa81a` (U496).
- This is a merge on `integration/battle-u496-publication`, not a replacement of main with the Claude tree.
- Root deck-builder and rulings assets remain byte-identical to main. No existing Codex card implementation, sample recipe, or regression test is removed.

## Conflict decisions

- Build manifest and check.py retain both parents' modules/tests.
- Status declarations retain both parents' promotions; status overrides use the newer U496 decisions. Coverage, status audit and HTML artifacts are regenerated, not hand-merged.
- Target-source helper uses U496's superset, including off-field immunity and variable target counts.
- Choice cancellation uses U471's journaled transaction when present. C12's published rollback remains a fallback for a preparation without a live transaction; it never runs after a transaction-owned cancellation.
- C12's assertion that cancellation deletes all Journal entries is replaced by an exact five-action transaction assertion, unchanged final state digest, cleared transaction and the existing Replay audit. No gameplay guarantee is relaxed; U471 explicitly requires cancellation to remain replayable in the Journal.
- Main's continuous-trap response fix, first-turn Battle Phase prohibition, phase-end priority, field-effect negation, card implementations and sample deck remain included.

## Verification and release boundary

- The standalone U496 local log reports 24,841 PASS / 0 FAIL / GATE_EXIT=0. This is NOT reused as the integrated tree's full-gate result.
- Integration coverage audit: 1,559 declared changes, zero off-target changes, 4,996 cards.
- Targeted checks include published CODEX-C01 through C14 and U471/U474/U479 through U496. C12's obsolete Journal-shape assertion was corrected as described above. U490 initially failed to find Python in this sandbox; rerun with the bundled Python directory on PATH, without test edits.
- A successful GitHub `verify-battle` run on the exact integration candidate is required before merging its PR. Public deployment must subsequently be checked against the merged artifact.
- Missed-timing support is limited to the confirmed 44-card / 65-event-pair scope. Unconfirmed effects, summon-negation timing and other documented gaps remain incomplete; publication does not claim all timing rules are implemented.

The GitHub PR and its checks are the authoritative record of the final merge/deployment outcome. This document does not predeclare CI or deployment success.
