# S03-U31 MANUAL_CARD_ACTIVATION — C-S03-07 MANUAL integration (Claude)

Base: `checkpoint_claude_s03_vs7_targeting_negation_slice_20260912.zip`, SHA256 `bafcb7c9401533db5ae385263eb3f4e5d5a50bccddac50da3976f50d7209b4df`.

## How it was found

- **User report (2026-09-12), second message.** Activating 《竜の渓谷》 from the hand ran the "send a Dragon from the Deck to the GY" effect with no mode choice and no discard. The user then supplied the decisive fact: **the play mode in use is MANUAL**, and pointed at MANUAL's legacy route `openHand()` → `activateFromHand()` → `runEffect()` → `runScript()`.
- **U30's limit was real.** U30 gated the DUEL route (`getLegalHandActions` → `duelActivateFromHand`) and explicitly recorded "MANUAL / DEVELOPER play modes are not covered; only DUEL". The earlier conclusion that the report was a stale browser tab was therefore premature, and is retracted here.
- **Reproduced in MANUAL on the VS7 build** (scratchpad `ravine_manual_probe.js`, then `tools/test_s03_u31_manual_card_activation.js` run before the fix): activating 竜の渓谷 from the hand placed it face-up and immediately opened 「竜の渓谷：デッキから選択」 — no mode choice, no discard — and **consumed the effect's 1/turn** (`left:0`).
- **Source measurement.**
  - `openHand()` (engine/60) offers 「⚡ 発動（効果を自動処理）」 whose onclick is `activateFromHand(i)`.
  - `activateFromHand(i)` MOVEs the card face-up, logs 発動, then `askChain(..., () => runEffect(p, nm, {zone, index, keep}))`. `askChain` runs its continuation immediately when the opponent has no reactable card.
  - `runEffect` (cards/10_themes_a.js:368) forwards scripted cards to `runScript(name, p, zone, index, {keep})`.
  - `runScript` (engine/40) builds `makeContext(..., 'activate', opts)` — it never calls `activationV11` — and checks `countLimit`. So for 竜の渓谷, `ctx.v4EffectKey` is `undefined`, its `resolve` (`m==='dragunity' ? search : dragon-mill`) takes the **mill** branch with no cost, and the card activation burns the 1/turn.
  - `activateFromZone` (engine/70) has the same shape, so the *effect* activation of an already face-up Field/Continuous card in MANUAL also skipped its mode and cost.
  - Nothing on either path consulted `cardActivationOnlyV32`.
- **Feasibility measured before designing** (scratchpad `manual_p11_feasibility_probe.js`, `manual_resolve_probe.js`, `manual_cardact_resolve_probe.js`):
  - `cardActivationOnlyV32` already answers correctly for MANUAL's arguments (歯車街 set → true, 六芒星の呪縛 → false), so the existing declaration table is the generic gate.
  - Under MANUAL, `prepareDuelActivation` performs a correct card activation, and with `activationV11` it opens the mode choice.
  - A committed P1.1 link is **not** resolved in MANUAL by pumping alone: only `resolveWholeChainV2()` (→ `requestProcessorV27` → synchronous `pumpProcessorV27`) starts `SOLVE_CHAIN`. That was the missing piece.

## Measurement before the fix

- `tools/test_s03_u31_manual_card_activation.js` on the VS7 build: **3 PASS / 5 FAIL**.
  - Failing: the hand card activation ran the mill; it consumed the 1/turn; the effect route never asked mode → cost → Deck pick (search and mill both).
  - Already passing (baseline to preserve): a set 歯車街 became face-up without running an effect; the undeclared targeting Continuous Trap 六芒星の呪縛 kept its legacy route.

## Requirement closure record

- **Requirement.** In MANUAL (and DEVELOPER, which shares these routes), activating a declared Field/Continuous card from the hand or from the set state performs the **card activation only**: it is placed face-up, no mode choice opens, no cost is paid, nothing leaves the Deck, and the effect's 1/turn is not consumed. The effect is a separate operation on the face-up card that asks the mode, then the cost, then resolves only the chosen mode.
- **Root cause (MODE_GAP).** C-S03-07 was implemented only in the DUEL pipeline (`prepareDuelActivation` / `cardActivationOnlyV32` / `activationV11`). MANUAL kept the pre-U10 route, so neither the card-vs-effect split nor the P1.1 choice chain existed there.
- **Closure — three sites, all generic (no card names in the engine).**
  - **`engine/60_damage_segoc_ui_helpers.js` `activateFromHand`:** after the MOVE, if `cardActivationOnlyV32(nm, sc, db, to, placed, {cardActivation:true})` holds, log the card activation and return — no `askChain`/`runEffect`. Otherwise, if the script has `activationV11`, route through `prepareDuelActivation(nm, p, to, idx, {noPriority:true})` so the mode and cost run. Everything else keeps the legacy `runEffect` path.
  - **`engine/70_summon_procedures.js` `activateFromZone`:** decide `cardActivationOnlyV32` **before** the face-down card is flipped (a set card's activation is a card activation); after the flip, a card activation logs and returns; a P1.1 script routes through `prepareDuelActivation`; everything else keeps `runEffect`.
  - **`engine/30_processor_chain_battle.js` `commitPreparedActivationV11`:** when `PLAY_MODE !== PLAY_MODES.DUEL`, start the committed link's resolution with `resolveWholeChainV2()`. Without this the MANUAL commit left the link unresolved.
- **Consumers.** Every card in the `declareCardActivationFreeV32` table (C-S03-07) — 血の代償, 六武の門, 竜の渓谷, 歯車街, 黒い旋風, 暗黒界の門, 神の居城－ヴァルハラ and the rest — plus every P1.1 (`activationV11`) script activated in MANUAL.
- **Recovery.** No status change; 竜の渓谷 stays TESTED. The fault was mode-specific, not card-specific.
- **Dependent classification.**
  - **① Covered by the real-path test:** MANUAL hand card activation (no mode / no cost / no Deck movement / 1-turn unused / face-up in the Field Zone); the MANUAL effect route in both modes with the correct choice order; a set declared Continuous Spell as a card activation; an undeclared targeting Continuous Trap still on the legacy route.
  - **② Remaining.**
    - `handActivate` (MANUAL 「発動（チェーンへ）」) hand-rolls its own `CHAIN_ADD` without `cardActivationOnly` / `cardActivationS03`, so U10's split and U29's GY settle do not apply there. `openChain()` states that effects are processed by hand on that path, so it is left as a deliberate manual route.
    - MANUAL card activations create no chain link (the fix places the card and stops), so a response to a MANUAL card activation is not modelled; DUEL is the mode with chain semantics.
    - DEVELOPER mode shares these routes and is covered by the same fix, but has no separate test.
  - **③** None.
- **Practical effect.** In the mode the user actually plays, 《竜の渓谷》 now goes to the Field Zone quietly when activated, and its effect — chosen mode, one discarded card, one resolution — happens only when they activate the face-up card. The same holds for every declared Field/Continuous card.

## Changed files

- `engine/60_damage_segoc_ui_helpers.js`, `engine/70_summon_procedures.js`, `engine/30_processor_chain_battle.js`: the three sites above.
- `tools/test_s03_u31_manual_card_activation.js`: new; wired into `tools/check.py` after VS7.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The engine edits were applied by a guarded transform (exactly-once patterns; `--dry` first; scratchpad `u31_transform.py`). `dist/*.html` were not edited by hand. Every card named in the test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_u31_manual_card_activation.js`.** EXIT 0, **8 PASS** (before: 3 PASS / 5 FAIL on the VS7 build).
- **Regression suites on the same build, all EXIT 0:** U10 (33), U18 (15), U19 (14), U28 (15), U29 (14), U30 (14), VS1 (21), VS7 (21), `test_auto_cycle14` (112), `test_effect_category_cards` (48), `test_negation_cards` (84), `test_v440_activation_replay` (9), `test_v440_native_cards` (18), `test_v460_native_cards` (51), `test_activation_event_v12` (47).
- **Full gate.** `python tools/check.py` (with S03-U31): EXIT 0, **12340 PASS / 0 FAIL** (VS7's 12332 + U31 8). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u31_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Status counts unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2253.
- `docs/SCRIPT_COVERAGE.md` is byte-identical to VS7; in `data/script_coverage.json` seven cards gained a test-evidence entry — the cards the MANUAL test names (竜の渓谷, ワイト, ドラグニティ－ドゥクス, 青眼の白龍, 歯車街, 六芒星の呪縛, and the scanner's index card `7`). No status changes.
- **Changed sources versus VS7: exactly the three patched engine files** (`engine/30_processor_chain_battle.js`, `engine/60_damage_segoc_ui_helpers.js`, `engine/70_summon_procedures.js`). **No file under `cards/` changed** — the fix is generic and names no card in the engine (`u31_zipcheck.py` asserts this).
- Gated source manifest SHA256 (excluding dist/ and *.log, with this report set aside): `995fdf77b5dff037805a0faa8e911a50f37f726ba1b55cd10d183137c44645b9` (664 files).
