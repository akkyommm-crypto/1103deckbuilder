# S03-U38 C-S03-29 DUEL_LIFECYCLE_JOURNAL + R1 real-duel completion (Claude)

Base: `checkpoint_claude_s03_u37_manual_prompt_interrupted_activation_20260913.zip`, SHA256 `5625cb7caf27f99f955e332a3802c45b8625d92da4df0ea524b270c672bce11c`.

## How it was found (R1 real-duel run)

- **Priority.** The user instruction of 2026-09-13 makes real-duel completion the first priority: Dragunity / レダメ vs 兎ラギア, normal game path, to a normal win or loss.
- **Deck.** No user 40 / 15 list exists, so a **provisional** Dragunity / レダメ list was defined (`tools/r1_duel_driver.js`). It is validated with `validateStrict1103TestDefinition`: 40 main, 15 extra, 2011-03 limits. It is not a user deck. The opponent is `RABBIT_LAGGIA_DECK`.
- **Driver (`tools/r1_duel_driver.js`).** DUEL mode.
  - **Start:** the same journaled start as the real start paths (LOAD_DECK, SHUFFLE, DRAW 5 for each player), then the first player; RNG seed pinned.
  - **Actions:** only what the UI offers — the `run` strings of `getLegalHandActions` / `getLegalZoneActions` / `pileDuelActionsV370`, EX summons through `exCombos` / `doExSummon`, the attack picker (`battlePickAttackerV29` / `battlePickTargetV29` / `battleDirectV29`), the summon-window button (`commitPendingSummonV2`) and the procedure position button (`finishSummonProcedure`).
  - **Choices:** the first candidate, preferring the opponent's field cards for removal. **Chain responses always pass** (a recorded limitation).
  - **Recording:** every operation is logged. The run stops at a normal result or at the first blocker: an exception, a stuck choice, a loop, a phase or turn not advancing, or a Replay divergence.
- **Driver corrections while measuring (not engine bugs).**
  - Turn 1 has no Battle Phase, so Main Phase 1 goes straight to the End Phase.
  - The summon-negation window is passed with the UI button, not the save-resume handler.
  - A two-position summon procedure opens a sheet; the driver presses 「表側攻撃表示」.
- **Engine findings.**
  1. **Player 2 first breaks Replay at the first draw.** Probed on the real start functions (scratchpad `r1_start_replay_probe.js`): `startTestDuel(…,1)` and `startPresetDuel(…,1)` fail the audit (`finalDigest` right after the start, then digest at the first DRAW). `startRabbitOpponentDuel` and the `applyLoad` autostart have the same direct writes of `activePlayer` / `firstPlayer` / `turn` / `phase`. The engine already had a `SET_FIRST_PLAYER` Action, unused.
  2. **Every duel won in battle ends with a Replay `finalDigest` mismatch.** Three completed duels, all per-Action digests matching. The end-state digest diff (driver diagnosis) shows only `loser` and `duelEndedReason` differ: the ATTACK reducer lowers LP inside the Action, then `markBattleLoserV28` / `adjustStateV27` wrote `gameState.loser` directly.

## Measurement before the fix

- `tools/test_s03_u38_duel_lifecycle_journal.js` on an extracted copy of the U37 checkpoint: **3 PASS / 11 FAIL**. All four Player-2-first start paths and the battle LP-0 end failed their Replay audits.
- R1 duels on the U37 build: seeds `0x52310001` / `0x52310002` / `0x52310003` with Dragunity first completed, but with a Replay `finalDigest` mismatch. Every Player-2-first duel diverged at the first draw.

## Requirement closure record

- **Requirement.** A real duel's start and result are Actions, so Replay and SaveLoad reproduce it from the first Action to the result, for either first player.
- **Root cause (INTEGRATION_MISSING).** Duel lifecycle state was written directly outside `act()`: at the start in the four start functions, and at the end in two processor steps.
- **Closure.**
  - **`data/80_test_decks.js`:** `startPresetDuel`, `startTestDuel`, `startRabbitOpponentDuel` and the `applyLoad` autostart call `act({type:'SET_FIRST_PLAYER', player})`.
  - **`engine/00_state_actions.js`:** new reducer case `DUEL_LOSER_S03 {player, reason}`. It sets `loser` / `duelEndedReason` once, with the existing log line.
  - **`engine/30_processor_chain_battle.js`:** `markBattleLoserV28` and `adjustStateV27` call `act({type:'DUEL_LOSER_S03', …})`. Both are processor steps, not reducers.
  - **No new gameState key.** Existing Replay packages keep their per-Action digests; the new Action only appears after a battle that reaches LP 0.
  - **`tools/r1_duel_driver.js`** (new) and **`tools/test_s03_r1_duel_completion.js`** (new): the real-duel evidence becomes a regression.
- **Consumers.** Every duel. The start path is the normal 「兎ラギアと対戦開始」 (`startRabbitOpponentDuel`), the developer test / preset starts and a loaded-deck autostart. The end is every battle LP-0 finish.
- **Recovery.** No status change.
- **Dependent classification.**
  - **① Covered:**
    - U38 test: the four start paths with Player 2 first, each with a Replay audit, plus a battle LP-0 end with `DUEL_LOSER_S03` and a Replay audit;
    - the R1 regression: two seeded real duels, one per first player, ending normally with Replay matching to the end.
  - **② Remaining.**
    - `setupPresetBoard` developer presets still place cards directly.
    - The driver's policy is passive: no chain responses, first-candidate choices. The opponent never uses its traps in response, so interaction-heavy paths are **not** exercised. This is the next R1 widening: a responder policy.
    - One provisional list; no user deck. The deck-out end path is not reached by these seeds.
  - **③** None.
- **Practical effect.**
  - Duels started with Player 2 going first (for example 「兎ラギアと対戦開始」 as second player) now replay and resume consistently.
  - Every finished duel's Replay now matches its final result.
  - A provisional Dragunity / レダメ deck plays full duels against 1103兎ラギア on the normal game path.

## R1 KPI (U38 build)

| seed | first | result | turn | LP | Actions | Replay |
|---|---|---|---|---|---|---|
| 0x52310001 | 兎ラギア | P1 (Dragunity) loses, LP 0 | 17 | 0 / 3900 | 459 | ok |
| 0x52310002 | Dragunity | P2 (兎ラギア) loses, LP 0 | 5 | 8000 / 0 | 180 | ok |
| 0x52310003 | Dragunity | P1 loses, LP 0 | 22 | 0 / 500 | 721 | ok |
| 0x52310004 | 兎ラギア | P1 loses, LP 0 | 25 | 0 / 2500 | 738 | ok |

- All four: no blocker, no manual-only action.
- Seed `0x52310001` with Dragunity first also completed (turn 16) before the fix; that was the first completed run.
- Limits: passive responder, one provisional list, four seeds.

## Changed files

- `data/80_test_decks.js`: the four start paths.
- `engine/00_state_actions.js`: the `DUEL_LOSER_S03` reducer.
- `engine/30_processor_chain_battle.js`: the two loser writes.
- `tools/r1_duel_driver.js`, `tools/test_s03_u38_duel_lifecycle_journal.js`, `tools/test_s03_r1_duel_completion.js`: new; the tests are wired into `tools/check.py` after U37.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`.

## Verification

- **U38 test.** EXIT 0, **14 PASS**. Before, on the U37 build: 3 PASS / 11 FAIL.
- **R1 regression.** EXIT 0, **10 PASS**.
- **Regressions on the same build, all EXIT 0:** U06 rabbit opponent (21), v430 replay hardening (14), v410 replay rng (9), v440 activation replay (9), U15 (24), VS9 (19).
- **Name scan:** the driver's 36 card names and the U38 test's one name are all TESTED / GENERIC_OK against the U37 baseline.
- **Full gate.** `python tools/check.py`: EXIT 0, **12509 PASS / 0 FAIL** (U37's 12485 + U38). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u38_full_gate.log`).
- **Acode.** EXIT 0, cards=4996.

## Coverage

- Status counts unchanged: TESTED 2071 / ENGINE_GAP 614 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 179 / GENERIC_OK 644 / TOTAL 4996.
- Gated source manifest SHA256 (excluding dist/ and *.log, with this report set aside): `6ee92e2b92c830806d87b69dbba7e167569977087529b74ea5496bdc18eae890` (689 files).
