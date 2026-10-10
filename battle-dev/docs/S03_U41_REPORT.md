# S03-U41 C-S03-33 RESOLUTION_CHOICE_SUMMON_EVENT (Claude)

Base: `checkpoint_claude_s03_u40_attack_declaration_window_20260913.zip`, SHA256 `efd1b934ff05a7fb6f8571e3904706adc95c39d2cc0359aa5b5927fb16fff593`.

## How it was found (R1 widening)

- **Sweep.** R1 responder mode, seeds `0x52310010`–`0x52310027` × both first players = 48 duels, using the provisional Dragunity / レダメ list (not a user deck) vs 1103兎ラギア, DUEL, normal game path.
  - All 48 ended normally with Replay ok. No journal truncation (max 935 actions), no errors, no unsupported steps.
- **Wrong-result scan.** A rule-invariant scan over the 48 operation lists raised 25 flags:
  - normal summon twice;
  - attack on turn 1 / by the non-turn player;
  - the same name attacking or activating twice in a turn;
  - a set trap activated the turn it was set;
  - refusals (no-op toasts).
- **Flag classification.**
  - *Legal:* 強欲で謙虚な壺's Special Summon lock (9); Normal / Field Spells set and activated the same turn (7); two different サイバー・ドラゴン (one revived from the opponent's GY); two copies of レッドアイズ・ダークネスメタルドラゴン.
  - *Wrong result (5 refusals in 4 duels):* ドラグニティ－ブラックスピア's ignition effect refused with 「1103ルール（2011/3/19以降）：召喚成功直後にモンスターの起動効果は発動できません」 for the rest of Main Phase 1, after レッドアイズ・ダークネスメタルドラゴン's effect Special Summoned it.

## Diagnosis

- **At the refusal** (seed `0x52310024`, 兎ラギア first, turn 6) the processor is idle: queue empty, nothing waiting, no chain.
  - `timingWindow` = `{kind:'summon', action:'FX_SPECIAL_SUMMON'}`;
  - `deferredEvents` = `['onSpecialSummon']`.
- **Action journal.** seq 307 `CHAIN_RESOLVE_TOP` → 308 `CHOICE_OPEN_V49` → 309 `EVENT_DEQUEUE_V31` → 310 `CHOICE_ANSWER_V49` → 311 `FX_SPECIAL_SUMMON` → 312 `EVENT_QUEUE_V31 onSpecialSummon` → 313 `SET_PHASE`. The event is dequeued only after the next turn's chain.
- **Cause.** `processSolveChainV27` always continued. When a link's resolution opened a choice (`requestChoice` registry or legacy), the processor ran `ADJUST` / `CHAIN_END` / `DRAIN_EVENTS` before the answer. The answer's continuation then Special Summoned after everything was drained.
  - Nothing processed the summon event: no Special Summon success timing, no response window, and summon triggers such as 奈落の落とし穴 miss it or fire later.
  - The stale summon window blocked legal ignition effects.
  - With several links, the lower links would also resolve before the upper link's choice is answered.
- **2011 sources.**
  - yugioh-wiki 「起動効果」 age 82 (2011-05-23): since STARTER DECK (2011), priority must be passed after a summon before ignition effects can be used.
  - 「優先権」 age 69 (2011-07-28), ruling 11/07/27: at the Special Summon success timing after chain processing, the turn player acts first.
  - Once both players pass, ignition effects can be activated.
- **Classification:** INTEGRATION_MISSING. Scope: 23 registry choice handlers that summon (about 55 cards; in the R1 decks レッドアイズ・ダークネスメタルドラゴン and ドラグニティ－レギオン), plus every resolution-time choice for ordering.

## Measurement before the fix

- `tools/test_s03_u41_resolution_choice_summon_event.js` on the U40 build: **5 PASS / 8 FAIL**.
- New R1 gate case (seed `0x52310024`, 兎ラギア first, responder, 80 turns) on the U40 build: the duel ends normally (turn 12, Replay ok, 591 actions), but the ops show **2 refused ignition effects** (ドラグニティ－ブラックスピア, turns 6 and 8). The new assertion "no ignition effect is refused after the summon timing has passed" fails before the fix.
- 48-duel sweep before the fix (U40 build, `R1_RESPOND=1`, seeds `0x52310010`–`0x52310027`, both first players, a journal scan counting phase / turn changes while a queued event is not yet dequeued): **13 of 48 duels, 55 phase changes** with an undrained `onSpecialSummon`. The monsters were ドラグニティ－ブラックスピア, ドラグニティ－ファランクス, ボマー・ドラゴン, ドラグニティ－コルセスカ and ドラグニティ－ブランディストック; in one duel an event from turn 1 was still queued after the turn passed.

## Requirement closure record

- **Requirement.** In DUEL, when a chain link's resolution opens a choice, the game waits for the answer. The answer's summons and other events are processed at their timing: Special Summon success timing, response window, then back to the open state. This holds across save / resume while the choice is open.
- **Closure.**
  - **New `engine/1Z_resolution_choice_wait_s03.js`** (manifest after 1Y):
    - `resolutionChoiceWaitS03`;
    - `resumeAfterResolutionChoiceS03`;
    - `resolutionWaitMetaS03`;
    - `restoreResolutionChoiceWaitAfterLoadS03`.
  - **`engine/30_processor_chain_battle.js` `processSolveChainV27`:** the continuation is queued as before; when a choice is open the unit returns WAIT.
  - **`engine/09_choice_request_v49.js`:**
    - the continuation (registry handler, legacy pick, legacy cancel) resumes the waiting `SOLVE_CHAIN` when no further choice is open;
    - a choice opened while `SOLVE_CHAIN` is current records `meta.resolutionWaitS03` inside `CHOICE_OPEN_V49`, so Replay matches.
  - **`runtime/50_actions_save.js` `offerResumeDuel`:** loading discards the processor. For a registry resolution choice with that meta, the chain continuation is queued again and waits.
  - No new gameState key and no new Action.
- **Test** (after U40 in `tools/check.py`):
  - A: the processor waits at the choice;
  - B: the summon event is dequeued right after the answer and the summon window closes after both pass;
  - C: ドラグニティ－ブラックスピア's ignition effect is legal; Replay ok;
  - D: saved while waiting → resumed → answered → the chain continues, the event is processed, the window closes; Replay ok.
  - **After: 13 PASS / 0 FAIL.**
- **Regressions on the same build:** `test_s03_u40_attack_declaration_window` 18 / 0, `test_s03_u39_attack_state_journal` 9 / 0, `test_s03_u34_pot_resolution` 18 / 0, `test_s03_u35_interrupted_activation` 27 / 0, `test_s03_vs9_pot_interrupted_resume_slice` 19 / 0, `test_s03_u36_manual_interrupted_activation` 18 / 0, `test_s03_u37_manual_prompt_interrupted_activation` 14 / 0. The s03 status audit is unchanged (24 declared, 0 off-target).
- **R1 gate test** (`tools/test_s03_r1_duel_completion.js`, now 5 cases, each also checking that no ignition effect is refused after the summon timing): **30 PASS / 0 FAIL**.
  - The new case `0x52310024` / 兎ラギア first / responder ends normally on turn 8 (before the fix: turn 12, with 2 refusals) with Replay ok (475 actions) and 0 refusals.
  - The different outcome is expected: ドラグニティ－ブラックスピア's effect can now be used.

## Sweep after the fix

- The same 48 duels on the U41 build (`R1_RESPOND=1`, seeds `0x52310010`–`0x52310027`, both first players, same journal scan):
  - **48 / 48** end normally with no blocker;
  - Replay reproduces every digest in all 48 (no truncation);
  - **0 duels / 0 phase changes** with an undrained event (before: 13 duels / 55);
  - **0** ignition effects refused as 「召喚成功直後」 (before: 5 in 4 duels).
- Data: Claude scratchpad `r1measure_before/`, `r1measure_after/`.

## Gate

- `python tools/check.py` — EXIT 0, **12569 PASS / 0 FAIL** (log `s03_u41_full_gate.log`).
- `python tools/build_acode.py data/carddata.json` — EXIT 0.
- Coverage (unchanged versus U40): TESTED 2073 / ENGINE_GAP 614 / NOT_STARTED 1303 / IMPLEMENTED 183 / PARTIAL 179 / GENERIC_OK 644 (TOTAL 4996).

## Source hash

- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `d53d458c073283246dd5d18d52a83221f90db4323835f488316555a115253f03` (697 files).

## Not changed / deferred

- Legacy `openPick` choices inside `resolve` that do not go through `requestChoice` (Ready: legacy choices in `resolve`).
- `CHAIN_AFTER_V2` closures are still lost across a save (existing).
- C-S03-32 ATTACK_DECLARATION_INFO (widening, Ready).
