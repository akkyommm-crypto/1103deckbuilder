# S03-U39 C-S03-30 ATTACK_STATE_JOURNAL + R1 responder mode (Claude)

Base: `checkpoint_claude_s03_u38_duel_lifecycle_journal_20260913.zip`, SHA256 `618fa40edf34b7800a9c2edc95ff79f670814aebcea3cc529aa4c1e5419a7ea6`.

## How it was found (R1 widening)

- After U38 the real-duel driver was widened with a **responder mode**: the player with priority uses the first response offered at chain windows, POINT windows and summon-negation windows.
- **Seeds 5–12.** All 8 passive duels completed with Replay ok. In responder mode, **2 of 8 stopped with a REPLAY_DIVERGENCE**:
  - `0x52310007`, Dragunity first, turn 4, after 聖なるバリア －ミラーフォース－ was activated at an attack declaration;
  - `0x5231000a`, 兎ラギア first, turn 2, after 次元幽閉 was activated at an attack declaration.
  - Both diverged at the first Action journaled after `ATTACK_DECLARE_V48`.
- **Diagnosis** (the digest text captured after every Action, part diff at the diverging seq): the only differing part was **`pendingAttack`**.
  - `processAttackV27` wrote `gameState.pendingAttack` directly right after the declaration Action, and cleared it directly on every exit path. The attack-replay re-target mutated its fields directly.
  - `attackNegated` was written directly by the processor and by two card scripts (No.39 希望皇ホープ, くず鉄のかかし), plus the "end the Battle Phase" helper `v350EndBattlePhase`.
  - Passive duels never journal an Action while an attack is pending, so the bug had stayed hidden.
- **Second divergence, same run.** After the first fix, seed `0x52310007` reached turn 23 and ended with a Replay `finalDigest` mismatch in **`runtimeEffects`**: スターダスト・ドラゴン's return effect was gone live but still present after replay. `processEndPhaseV30` called `v4ResetRuntimeEffects('endPhase')` directly. The phase and turn-change resets already run inside `applyAction`.
- **Driver / test lessons (not engine bugs).**
  - At a POINT the UI activates a response with `pointActivateV27`, which reopens the POINT after the chain. Calling `duelActivateResponseV2` directly left the attack un-continued.
  - The battle replay step (re-target or cancel) must be answered.

## Measurement before the fix

- `tools/test_s03_u39_attack_state_journal.js` on the extracted U38 checkpoint: **3 PASS / 6 FAIL**. The Replay audits failed for 強制脱出装置 at attack declaration, for くず鉄のかかし, and for the End-Phase runtime-effect expiry.

## Requirement closure record

- **Requirement.** The attack in progress (`pendingAttack` / `attackNegated`) and the End-Phase expiry of runtime effects change only through Actions. Duels with responses during battle, and effects that end in the End Phase, then replay and resume exactly.
- **Root cause (INTEGRATION_MISSING).** Direct state writes outside `act()`: in the battle processor, in two card scripts and a card helper, and in the End-Phase processor step.
- **Closure.**
  - **`engine/00_state_actions.js`:**
    - `ATTACK_DECLARE_V48` takes an optional `pending` payload and sets `pendingAttack` / `attackNegated` in the reducer; old records without it are unchanged;
    - new `ATTACK_PENDING_CLEAR_S03` and `ATTACK_PENDING_RETARGET_S03`;
    - new `V4_EFFECT_RESET_S03`, which runs `v4ResetRuntimeEffects` inside the reducer.
  - **`engine/30_processor_chain_battle.js`:**
    - the declaration passes `pending`;
    - the five clears (negated, attacker gone, no direct attack, damage step, replay cancel) and the replay re-target use the new Actions;
    - `processEndPhaseV30` journals `V4_EFFECT_RESET_S03` when an End-Phase effect exists.
  - **`cards/30_themes_b.js`** (No.39 希望皇ホープ) and **`cards/38_1103_expansion_v380.js`** (くず鉄のかかし): `API.negateAttack` (the journaled `NEGATE_ATTACK_V45`).
  - **`cards/37_1103_expansion_v350.js`** `v350EndBattlePhase`: clears the attack state with `ATTACK_PENDING_CLEAR_S03`. `battle` / `timingWindow` are not in the digest and are unchanged.
  - **`tools/r1_duel_driver.js`:** responder mode (`R1_RESPOND=1`), `pointActivateV27` at POINTs, battle-replay handling.
  - **`tools/test_s03_r1_duel_completion.js`:** two responder cases added.
  - **No new gameState key.**
- **Consumers.**
  - every attack answered at declaration or battle step (強制脱出装置, くず鉄のかかし, ミラーフォース, 次元幽閉, …);
  - No.39 希望皇ホープ, くず鉄のかかし;
  - the cards that end the Battle Phase through `v350EndBattlePhase`;
  - every runtime effect with `RESET.END` (スターダスト・ドラゴン's return).
- **Recovery.** No status change.
- **Dependent classification.**
  - **① Covered:**
    - U39 test: 強制脱出装置 at attack declaration; くず鉄のかかし; a control attack with no response; the End-Phase runtime effect;
    - R1 responder duels, seeds 7 and 10.
  - **② Remaining.**
    - **Illegal-processing finding, the next unit:** 聖なるバリア －ミラーフォース－ (cards/00) only checks Battle Phase and opponent attack-position monsters. The attacking player was offered, and activated, its own ミラーフォース (seed 7, turn 4). 次元幽閉 looks similar. Candidate C-S03-31.
    - 攻撃の無力化 (v4 unified, `events:['onAttackDeclare']`) is not offered through `getChainResponsesV2` at the attack-declaration POINT; its event route is unverified.
    - MANUAL `doAttack` (engine/70) still writes `attackNegated` directly (MANUAL-only).
    - The load normalisation clears `pendingAttack` (runtime/50).
  - **③** None.
- **Practical effect.** Duels where traps or quick effects answer an attack now replay and resume exactly, as do duels where effects end in the End Phase. R1 now exercises responses on the real path.

## R1 KPI (U39 build)

- **Passive:** seeds 1–12, both first players, all complete with Replay ok (seeds 1–4 on U38, 5–12 measured on the U38 tree before these changes).
- **Responder:** seeds 3, 4, 7, 10 complete with Replay ok on this build: turns 14, 13, 16 and 19.
  - Responses seen: 強制脱出装置 at summon success and at attack declaration; 神の警告 and エヴォルカイザー・ラギア as summon negators; ミラーフォース / 次元幽閉 at attack declaration; 奈落 / 激流葬 as triggers.
  - Seed `0x5231000a` also reached **deck-out** once, before the replay-handling driver fix.

## Changed files

- `engine/00_state_actions.js`, `engine/30_processor_chain_battle.js`, `cards/30_themes_b.js`, `cards/37_1103_expansion_v350.js`, `cards/38_1103_expansion_v380.js`.
- `tools/r1_duel_driver.js`, `tools/test_s03_r1_duel_completion.js` (responder mode and cases).
- `tools/test_s03_u39_attack_state_journal.js`: new; wired into `tools/check.py` after the R1 test.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`.

## Verification

- **U39 test.** EXIT 0, **9 PASS**. Before, on the U38 build: 3 PASS / 6 FAIL.
- **R1 regression.** EXIT 0, **20 PASS** (4 duels).
- **Regressions on the same build, all EXIT 0:** 33 suites touching the attack state, battle negation, End-Phase runtime effects, U38 and R1.
- **Name scan:** clean.
- **Full gate.** `python tools/check.py`: EXIT 0, **12528 PASS / 0 FAIL**. The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u39_full_gate.log`).
- **Acode.** EXIT 0, cards=4996.

## Coverage

- Status counts unchanged: TESTED 2071 / ENGINE_GAP 614 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 179 / GENERIC_OK 644 / TOTAL 4996.
- Gated source manifest SHA256 (excluding dist/ and *.log, with this report set aside): `49daa0d9dfeafee809f25e94cb4faec0bef1a5de3e67e7d5284155ce491bfef5` (691 files).
