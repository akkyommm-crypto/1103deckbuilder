# S03-U34 C-S03-27 ACTIVATION_NEGATED_RELEASE (Claude)

Base: `checkpoint_claude_s03_vs8_draw_replacement_slice_20260913.zip`, SHA256 `29cfc1083e798cf6bdf2aff68ad1d2d84de66ba537a404691006129242ae688e`.

## How it was found

- **Selection.** After VS8 the ② backlog was measured read-only. 強欲で謙虚な壺 (WORK_QUEUE Q9, "reveals at activation instead of resolution") was chosen: it sits in every provisional slice list and in real 2011 decks, and the measurement showed more than a timing slip.
- **Measured on the VS8 build** (scratchpad `u34_pot_probe.js`, `u34_pot_probe2.js`, `u34_pot_probe3.js`):
  - **A.** Activating it from the hand opened the reveal of the top three **before any chain link existed**. The player picked first, and only then did the link appear and the opponent get priority.
  - **B.** After マジック・ジャマー negated it, there was no Special Summon restriction.
  - **C.** A save while the reveal was open (autosave runs after every Action) reloaded with the card **face-up in the Spell & Trap Zone, no chain link, and nothing to answer**. The card was stranded.
  - **D.** After マジック・ジャマー negated it, a second copy was refused 「1ターンに1度までです」.
- **Rulings** (2011 wiki 《強欲で謙虚な壺》, the revision of 2011/08/25, the last before 2011-08-31):
  - 10/04/17 — the three cards are revealed and one is chosen **at resolution**; the revealed and chosen cards are shown to the opponent, and the Deck is shuffled afterwards;
  - 10/05/18 — no Special Summon in chain to its activation (e.g. 緊急テレポート); if the Deck has fewer than three cards at resolution, reveal what there is;
  - 10/05/19 — if its **activation is negated**, the player can Special Summon that turn and can activate another copy.
- So B was already correct, while A, C and D were wrong. The Special Summon restriction was also applied only at resolution, so a Special Summon in chain to the activation was not refused (10/05/18).

## Measurement before the fix

- `tools/test_s03_u34_pot_resolution.js` run on an extracted copy of the VS8 checkpoint: **5 PASS / 13 FAIL**.
- The reveal opened at activation with no chain link, so every later case failed its setup. The passes were vacuous (e.g. "P1 can Special Summon" after a negation that never happened) or Replay audits.

## Requirement closure record

- **Requirement.** A Spell with 「1ターンに1枚しか発動できず、発動するターン特殊召喚できない」:
  - reveals and chooses at resolution;
  - forbids Special Summons from its activation on;
  - when its **activation** is negated, neither restriction nor the once-per-turn count applies that turn.
- **Root cause (MODEL_WRONG + MISSING_RULE).**
  - The script chose its card in `selectTargets` through `revealPick`, a UI closure that runs before `CHAIN_ADD` and cannot be saved.
  - The engine consumed the count limit in `CHAIN_ADD` with no path to release it when the activation is negated.
  - Nothing refused a Special Summon while the activation was on the chain.
- **Closure.**
  - **`engine/1W_activation_negated_release_s03.js` (new).**
    - `declareActivationNegatedReleaseS03(name, {count, noSpecialSummonWhileChained})`.
    - `activationNegatedReleaseS03(link)`: for a `count` card, rebuilds the consumed payload with `countConsumePayloadV44` and journals `COUNT_REFUND_S03`.
    - `chainedActivationNoSpecialSummonS03(p)`: returns a reason while an own, not-activation-negated link of a `noSpecialSummonWhileChained` card is on the chain.
  - **`engine/00_state_actions.js`.** The `COUNT_REFUND_S03` reducer decrements the name store (deleting a zero key, so the state equals "never consumed") or the per-card counter. **No new gameState key and no new chain-link field.**
  - **`engine/30_processor_chain_battle.js`.** The activation-negated branch of `resolveOnePreparedLinkV27` calls `activationNegatedReleaseS03(link)`, after the U29 and U33 hooks.
  - **`engine/40_legal_script_engine.js`.** `v46GlobalSpecialSummonRestrictionReason` consults `chainedActivationNoSpecialSummonS03`.
  - **`cards/00_generic_core.js` 強欲で謙虚な壺.**
    - `selectTargets` / `revealPick` are removed. `resolve` sets `noSpecialSummon` and reveals the top `min(3, Deck)` cards in the log (public), then asks a **V49 choice** (handler `s03u34.pot-pick`, JSON descriptor, restorable after load).
    - The handler logs the choice and adds it, or, under a chain-restored ライオウ lock, sends it to the GY (S03-U01 branch kept). `searchDeck` / `FX_MILL` shuffle the Deck.
    - The card declares `{count:true, noSpecialSummonWhileChained:true}`.
- **Consumers.** 強欲で謙虚な壺.
- **Recovery.** No status change; 強欲で謙虚な壺 stays TESTED, now with its rulings covered.
- **Dependent classification.**
  - **① Covered** by the real-path test, each case with a Replay audit:
    - activation reveals nothing, the link exists and the opponent has priority;
    - Special Summon refused while the link is on the chain;
    - the choice at resolution is exactly the top three; the chosen card is added and the pot goes to the GY;
    - Special Summon refused after resolution; reveal and choice logged;
    - マジック・ジャマー negates it → GY, no choice, Special Summon allowed, a second copy legal and resolving, a third refused;
    - save during the resolution choice → fresh VM → the same choice pending → answered.
    - The MANUAL route (`activateFromHand`) was probed separately and resolves through the same choice.
  - **② Remaining.**
    - Other 「1ターンに1枚しか発動できない」 cards (オーバー・レンチ, 無欲な壺, 限定解除 NOT_STARTED; 魔力掌握 PARTIAL; 黒羽の宝札) are not declared, and no 2011 negation ruling was checked for them.
    - 黒羽の宝札 sets `noSpecialSummon` in its cost, so a negated activation keeps the lock (unverified).
    - The Deck dropping below three cards **during** resolution is not path-tested.
    - The generic CHAIN_RESOLVE_TOP log line says 「効果は手動で処理してください」 even for automatic resolutions (pre-existing, cosmetic).
  - **③** None.
- **Practical effect.**
  - 強欲で謙虚な壺 now plays as ruled: the opponent responds before anything is revealed, and the pick happens at resolution.
  - A save or autosave mid-pick no longer strands the card.
  - A negated pot no longer burns the turn's activation.

## Changed files

- `engine/1W_activation_negated_release_s03.js`: new; registered in `build_manifest.json` after 1V.
- `engine/00_state_actions.js`: the `COUNT_REFUND_S03` reducer case.
- `engine/30_processor_chain_battle.js`: the call in the activation-negated branch.
- `engine/40_legal_script_engine.js`: the chained Special Summon lock.
- `cards/00_generic_core.js`: 強欲で謙虚な壺 only.
- `tools/test_s03_u34_pot_resolution.js`: new; wired into `tools/check.py` after VS8.
- `tools/test_s03_u01_raioh_lock.js`: its two 強欲で謙虚な壺 cases now answer the resolution-time choice (same assertions, same count).
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

`dist/*.html` were not edited by hand.

## Verification

- **U34 test.** `node tools/test_s03_u34_pot_resolution.js` EXIT 0, **18 PASS**. Before, on the VS8 build: 5 PASS / 13 FAIL.
- **Regression suites on the same build, all EXIT 0:** U01 (56), U02 (76), U29 (14), U31 (8), U33 (18), `test_v440_activation_replay` (9), `test_expansion_v340` (16).
- **Full gate.**
  - The first run stopped in `tools/s03_status_audit.py`: 神の宣告 IMPLEMENTED → TESTED, because the new test's header comment named it (the coverage scanner counts any mention in a test). The comment was reworded ("by a Counter Trap"); no assertion changed. Every card the test names is TESTED or GENERIC_OK against the VS8 baseline. That run's log is kept in the scratchpad only.
  - `python tools/check.py` (with S03-U34): EXIT 0, **12407 PASS / 0 FAIL** (VS8's 12389 + U34 18). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u34_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Status counts unchanged: TESTED 2071 / ENGINE_GAP 614 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 179 / GENERIC_OK 644 / TOTAL 4996.
- Gated source manifest SHA256 (excluding dist/ and *.log, with this report set aside): `3933fbf72e38adc01ddeee864e7ec33a0eeb0327c66c72840b5fa6779b8ba953` (676 files).
