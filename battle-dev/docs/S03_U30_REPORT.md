# S03-U30 UI_ACTIVATION_PATHS — hardening for C-S03-07 (Claude)

Base: `checkpoint_claude_s03_u29_negated_activation_to_grave_20260912.zip`, SHA256 `05c943322ffd50fc23c24bca7c042cbdb3b3f4e0b194a7d32674bd592b89112e`.

## How it was found

- **User report (2026-09-12).** Activating 《竜の渓谷》 from the hand in the real `battle.html` was described as: no mode choice, no discard, yet the "send a Dragon from the Deck to the GY" effect ran. The report asked explicitly not to trust the passing U10 test, and to reproduce the **UI operation route** rather than internal API calls.
- **Reproduction attempt on the U29 build, through the UI route** (scratchpad `ravine_ui_probe.js`, `ravine_variants_probe.js`): the action list is built with `getLegalHandActions(0,0)` and the menu's own `run` string is evaluated, exactly as the browser does.
  - The menu offers `{id:'activate', label:'⚡ 発動', run:'duelActivateFromHand(0)'}` and `setST`.
  - Running it: only 竜の渓谷 leaves the hand (no discard), the Deck is untouched, the GY stays empty, **no choice is opened**, the chain link is `cardActivationOnly:true` with `v4EffectKey:null`, the effect's 1/turn is unconsumed, and the card is face-up in the Field Zone.
  - The face-up card then offers `{id:'effect', run:"duelActivateFromZone(0,'field',0)"}`, which asks 効果を選択 → 捨てる手札 → デッキから選択 in that order.
  - Variants also behave: Field Zone occupied → the menu offers nothing; ライオウ lock → card activation only, no mill; a second copy after the 1/turn → not offered as an activation.
  - **So acceptance A–E already hold on this build.** The reported fault is not reproducible here.
- **Mechanism of the reported symptom, identified and reproduced by simulation.** In `prepareDuelActivation`, the P1.1 branch is `if(!cardActivationOnly && typeof sc.activationV11==='function')`, and the `cardActivationOnly` early return follows it. If `cardActivationOnly` is false **and** `sc.activationV11` is absent, control falls through to `finishPrepare()`: the link carries no mode, and 竜の渓谷's `resolve` — `const m=ctx.v4EffectKey, q = m==='dragunity' ? search : dragon-mill` — takes the **mill** branch with no cost and no choice.
  - Simulating that shape (the H2 declaration removed and `activationV11` deleted) reproduced the report exactly: Deck 3→2, 青眼の白龍 to the GY, nothing discarded, no mode choice. That shape is a **pre-U10 runtime**.
- **Stale-build check.** `dist/battle.html` on disk is byte-identical to the copy inside the published U29 checkpoint (`7bdc61f8…`), and a sweep of the work tree, Desktop, OneDrive and Downloads found no other battle HTML on this machine. So no old file is present; an old browser tab / cache (or another synced device) is the remaining explanation for what the user saw.

## Measurement before this unit

- `tools/test_s03_u10_card_activation.js` asserts the split by calling `duelActivateFromHand` / `duelActivateFromZone` directly. **No test built the action menu** (`getLegalHandActions` / `getLegalZoneActions`) or executed the `run` string the browser executes, so the UI route itself was ungated: a menu that offered the wrong entry, or an entry carrying different arguments, would not have failed any test.
- The new test on the U29 build: **14 PASS / 0 FAIL** (it documents current, correct behaviour through the UI route).
- With the pre-U10 shape simulated in memory, the same route mills without cost — the behaviour the test now forbids.

## Requirement closure record

- **Requirement.** The route a player actually uses — the action menu entries for a hand card and for a face-up Field/Continuous card — must perform the **card activation** and the **effect activation** as separate operations: the card activation opens no mode choice, pays no cost, moves nothing out of the Deck and does not consume the effect's 1/turn; the effect asks the mode, then the cost, then resolves only the chosen mode.
- **Root cause (TEST_GAP).** The engine behaviour is correct (C-S03-07, S03-U10), but only internal entry points were tested. The UI menu layer between the player and `prepareDuelActivation` had no regression coverage, which is why a report of the pre-U10 symptom could not be checked against the gate.
- **Closure.**
  - **`tools/test_s03_u30_ui_activation_paths.js` (new):** builds the action list with `getLegalHandActions` / `getLegalZoneActions` and evaluates each action's `run` string, then asserts the acceptance conditions (A: card activation only; B: mode → cost → resolve order; C: mill mode; D: search mode; E: the 1/turn is consumed by the effect, not the card activation), each with a Replay audit.
  - No engine or card change: this unit is validation / hardening of an existing contract.
- **Consumers.** 《竜の渓谷》 as the worked example; the same UI route serves every card in the `declareCardActivationFreeV32` table (C-S03-07).
- **Recovery.** No status change (竜の渓谷 stays TESTED).
- **Dependent classification.**
  - **① Covered by the real-path test:** the hand menu's `activate` entry; the field menu's `effect` entry; the choice order; both modes; the 1/turn accounting; Replay audits on all three activations.
  - **② Remaining.**
    - The other declared card-activation-free cards are not individually driven through the menu (one worked example is covered).
    - `pileDuelActionsV370` emits `duelActivateFromZone(p,'hand',i)`, which for a Field Spell skips the hand→field MOVE and silently does nothing. It is unreachable for 竜の渓谷 today (`canActivateFromZone` is false for it, and the pile chips only open deck / grave / banish / ex), so it is recorded rather than changed.
    - MANUAL / DEVELOPER play modes are not covered; only DUEL.
  - **③** None.
- **Practical effect.** The player-facing activation route is now gated: if a future change made the card activation run an effect, pay a cost, or consume the 1/turn, the gate fails instead of the fault reaching a duel.

## Changed files

- `tools/test_s03_u30_ui_activation_paths.js`: new; wired into `tools/check.py` after U29.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md` (test-evidence lists only).

No engine or card sources were edited in this unit. `dist/*.html` were not edited by hand. Every card named in the test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_u30_ui_activation_paths.js`.** EXIT 0, 14 PASS.
- **Full gate.** `python tools/check.py` (with S03-U30): EXIT 0, **12311 PASS / 0 FAIL** (U29's 12297 + U30 14). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u30_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Status counts unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2253.
- `docs/SCRIPT_COVERAGE.md` is byte-identical to U29. In `data/script_coverage.json` only five cards gained a test-evidence entry — 竜の渓谷, ドラグニティ－ドゥクス, 青眼の白龍, ワイト and the scanner's index card `7` — all naming the new U30 test. No status changes.
- **Every file under `engine/` and `cards/` is byte-identical to the U29 checkpoint**, which is the invariant this unit claims: the closure is a test, not an engine change (`u30_zipcheck.py` asserts it).
- Gated source manifest SHA256 (excluding dist/ and *.log, with this report set aside): `6342472d1ba67c5e179b2d0583cf3321d01e21b435e57bbe461e3ef9e021c3fa` (660 files).
