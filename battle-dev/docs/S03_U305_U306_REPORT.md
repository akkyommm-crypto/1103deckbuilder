# S03-U305 / S03-U306 — real-UI duel sweep (redo of U304) and オネスト hand cost

Base: clean U302 (`dist/battle.html` `b2f2a21b…`, gate 18178 PASS / 0 FAIL, re-run on the GitHub worktree 2026-10-10 with `GATE_EXIT=0`).
Workflow: Sonnet 5.5, single writer, tree `claude/work`. U304's unpublished scratch tree (`S/harness_ui*.js`) was not recovered; U305 re-implements the idea from the CLAUDE_RESUME description and does **not** claim to reproduce U304's 338-duel result.

## U305 — HARNESS_UI=1: duels with the real UI code running
- `tools/astra_harness.js`: with `HARNESS_UI=1` the real `render`, `showToast`, `closeSheet`, `openChainPriorityV2`, `openPick` run against the stub DOM instead of no-ops. Each call is counted (`HARNESS_UI_CALLS`); an exception is recorded in `HARNESS_UI_ERRORS` and swallowed (a failing click handler does not stop the engine). Default behaviour (no env) is unchanged.
- `tools/r1_duel_driver.js`: under `HARNESS_UI` the real `showToast` stays (wrapped to record the message); the result gains a `ui` block (`calls`, `errors`, `errorCount`).
- Limit: the DOM is a Proxy stub, so this finds UI-code exceptions, not layout / visual defects.
- Test `tools/test_s03_u305_ui_harness.js` 16 / 0: two real duels (first-candidate; responder + save/resume at every stop) complete, Replay audit matches, the real render ran, no UI exception, the end state equals the no-UI run, plus a control that a render exception is recorded and not thrown, and that without the env render stays a no-op.
- Negative control (previous harness + driver, same test): 5 FAIL (no `ui` block, no recording).

## U306 — オネスト: the Graveyard send is the cost
- Found by the first UI sweep: worm vs agent, seed `0x53040018`, responder policy never returned (120 s vm timeout): the same オネスト (one uid) was put on the chain again and again, the chain and journal growing without end.
- Cause (`cards/00_generic_core.js`): the script discarded itself in `afterResolve`, so while on the chain it stayed in the hand and every chain window offered it again. 1103 text: 「このカードを手札から墓地へ送って発動できる」 — the send is the cost.
- Fix: `cost(ctx, done){ a6HandCost(...) }` and an empty `afterResolve` (the same shape as 速攻のかかし, U152).
- Test `tools/test_s03_u306_honest_cost.js` 8 / 0, Real DUEL path, Replay-audited: one copy — in the Graveyard at activation, chain 1, not offered again, resolves (opponent takes 1900); two copies — chain of 2, both in the Graveyard, opponent takes 2200.
- Negative control (pre-fix build, same test): 3 FAIL (card still in hand at activation; offered again, 2 extra offers).
- Existing `test_s03_u299_honest_damage_step.js` still 7 PASS / 0 FAIL. オネスト stays TESTED (no status change; `CARD_TEST_FOCUS` entry added for the new test).
- TESTED check for オネスト: single-effect card; activation timing (Damage Step start up to before damage calculation, own LIGHT battler), cost, ATK source (the opposing battler), and the end-of-turn duration are covered by U299 + U306. No known deviation.

## Sweep (evidence for U305, not a gate test)
- 13 major decks (`data/r1_lists`), 78 duels with `HARNESS_UI=1`, `R1_LIST=v1`, responder on, max 150 turns: 26 first-candidate, 26 random policy, 26 random policy + save/resume at every stop, both first players.
- First pass (before the U306 fix): 57 completed; 1 hang (the オネスト loop, also without the UI), 21 timeouts. After the fix: the オネスト duel completes (turn 9, Replay 333 OK); the other 21 were slow, not stuck — random policy / save-resume at every stop replays the journal at each stop, which exceeds the driver harness's fixed 120 s vm timeout for 100+ turn duels. Re-run with a scratch harness with a 1500 s timeout: **78 / 78 completed**, Replay audit OK, 0 blocker, 0 unsupported action, 0 UI exceptions.
- Not changed: the 120 s vm timeout in `astra_harness.js` (gate tests rely on it as a hang detector). Save/resume at every stop on very long duels is slow by design; use `R1_SAVELOAD_EVERY=N` for long sweeps.

## Not done
- U304's original sweep tooling (`harness_ui2.js` browse mode) is not rebuilt.
- Open items from CLAUDE_RESUME are unchanged.
