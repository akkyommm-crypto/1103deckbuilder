# S03-U33 C-S03-26 DRAW_REPLACEMENT (Claude)

Base: `checkpoint_claude_s03_u32_targeting_negation_2_20260912.zip`, SHA256 `d84b94362ae75e76e1806ddfb902358802927a23b1837a37d60e96c03745a8b1`.

## How it was found

- **U32 left 無敗将軍 フリード PARTIAL** because of its second effect: 「自分のドローフェイズ時に通常のドローを行う代わりに、自分のデッキからレベル4以下の戦士族モンスター1体を手札に加える事ができる」. The U32 test also named that PARTIAL card, a deviation from the TESTED/GENERIC_OK naming rule that was recorded in WORK_QUEUE for this unit to resolve.
- **Measured on the U32 build** (scratchpad `u33_freed_probe.js`):
  - the card comes from `AUTO_DECK_TABLE` as `{op:"search", trig:"ignition"}`;
  - `defineAutoDeckScript` therefore registered a **Main Phase ignition search** (`timing:['mainPhase','free']`, no count limit), and a face-up 無敗将軍 フリード offered 「⚡ 効果を発動」 in Main Phase 1 and searched a Warrior;
  - in the **Draw Phase nothing was offered**, and the normal draw simply happened;
  - `processDrawV27` had **no replacement hook**, and no draw-replacement mechanism existed anywhere in the engine.
- **The same wrong model** applied to ダーク・ジェネラル フリード and 円盤ムスキー. Nine 1103 cards carry the 「通常のドローを行う代わりに」 wording.
- **Rulings (2011 wiki):**
  - 無敗将軍 フリード / ダーク・ジェネラル フリード 10/06/11 — the effect that adds a monster instead of drawing is a **trigger effect**;
  - 無敗将軍 フリード 09/09/30 — with two copies only one card is added, and after one replacement's effect is negated a second cannot be activated in the same Draw Phase;
  - 無敗将軍 フリード 10/03/24 — **effect negated → the player cannot draw; activation negated → the player draws**; it cannot be activated with 0 cards in the Deck;
  - 無敗将軍 フリード 10/07/24 — with 閃光の宝札 it still adds only one card and there is no normal draw;
  - 円盤ムスキー 09/11/14 — any 「エーリアン」 card, Spells and Traps included; 11/01/10 — not applied unless it is face-up on the field at resolution.

## Measurement before the fix

- `tools/test_s03_u33_draw_replacement.js` on the U32 build: **10 PASS / 8 FAIL**.
  - Failing: no offer at the normal draw (A); no replacement (A); the Main Phase search still present (C); nothing for 天罰 to respond to (D setup); nothing for スキルドレイン to negate (E setup, E); no 円盤ムスキー (F) or ダーク・ジェネラル フリード (G) replacement.
  - Two of the passing assertions are **vacuous before the fix**: D's "draws normally" and H's "nothing offered" hold trivially while no replacement exists. The Replay audits passed throughout.

## Requirement closure record

- **Requirement.** A face-up card with 「自分のドローフェイズ時に通常のドローを行う代わりに…」 lets its controller choose, at the normal draw, to activate that effect **instead of drawing**. The effect is not available in the Main Phase. The replacement uses up the normal draw; if its activation is negated the player draws normally, and if only its effect is negated nothing is added and there is no draw.
- **Root cause (MODEL_WRONG + MISSING_RULE).** The cards were modelled by the coarse AUTO_DECK_TABLE as Main Phase ignition searches, and the engine had no point before the normal draw at which a replacement could be offered.
- **Closure.**
  - **`engine/1V_draw_replacement_s03.js` (new).**
    - `declareDrawReplacementS03(name, spec)`.
    - `drawReplacementCandidatesS03(p)`: face-up declared cards whose activation is legal with `{drawReplacementS03:true}`, and none with an empty Deck.
    - `offerDrawReplacementS03(p)`: a choice 「通常のドローを行う／「○○」の効果を発動（通常のドローの代わり）」.
    - `drawReplacementActivationNegatedS03(link)`: performs the normal draw.
  - **`engine/30_processor_chain_battle.js`.**
    - `processDrawV27` offers the replacement before a DUEL normal draw, unless the player already declined it (`declineReplacementS03`).
    - The `drawReplacementS03` marker is carried onto the chain link at both DUEL `CHAIN_ADD` sites, in the same written-only-when-true style as U29's marker.
    - The activation-negated branch of `resolveOnePreparedLinkV27` performs the normal draw for a marked link.
  - **`engine/00_state_actions.js`.** CHAIN_ADD copies the marker. The new journaled action `DRAW_REPLACED_S03` sets `drawnThisTurn`, so the existing guard refuses a second normal draw and a second offer. **No new gameState key.**
  - **`cards/H9_claude_s03_draw_replacement.js` (new).**
    - String-literal `defineScript` registrations for 無敗将軍 フリード (Level 4 or lower Warrior), ダーク・ジェネラル フリード (Level 4 DARK monster) and 円盤ムスキー (any 「エーリアン」 card). The coverage scanner detects only literal first arguments.
    - Each `condition` requires `ctx.drawReplacementS03`, a face-up card in the Monster Zone and a non-empty pool, so the old Main Phase search disappears.
    - Each `resolve` re-checks that the card is still face-up (11/01/10).
    - Two choice handlers: `s03u33.draw-choice` and `s03u33.to-hand`.
  - **Data.**
    - 無敗将軍 フリード and 円盤ムスキー declared **PARTIAL → TESTED** in `data/s03_status_changes.json`: every effect of each card is now implemented and tested.
    - ダーク・ジェネラル フリード kept **PARTIAL** by an explicit override in `data/script_status_overrides.json`. Its continuous negation protecting the controller's other face-up DARK monsters from Spell cards is not implemented.
- **Consumers.** 無敗将軍 フリード, ダーク・ジェネラル フリード, 円盤ムスキー.
- **Recovery.** 無敗将軍 フリード and 円盤ムスキー PARTIAL → TESTED. This also resolves the U32 deviation: the U32 test now names a TESTED card.
- **Dependent classification.**
  - **① Covered by the real-path test** (each case with a Replay audit): offer and replacement; decline; no Main Phase search; activation negated by 天罰 → normal draw; effect negated by スキルドレイン → no card and no draw; 円盤ムスキー; ダーク・ジェネラル フリード; an empty pool gives no offer and a normal draw.
  - **② Remaining.**
    - A second copy cannot be chained to the first replacement: a monster trigger is Spell Speed 1 and is not offered as a chain response. The outcome is still one card, but the 09/09/30 chain line is not reproduced.
    - The six GY / Field-based cards with the same wording (コアキメイルの鋼核, メテオ・プロミネンス, スカル・フレイム, マジックブラスト, スピリット・バーナー, Sin World) are NOT_STARTED and are not declared.
    - 閃光の宝札's two normal draws are not modelled.
    - ダーク・ジェネラル フリード's DARK-protection effect is not implemented.
    - MANUAL mode draws are not routed through `processDrawV27`'s DUEL branch.
  - **③** None.
- **Practical effect.** 無敗将軍 フリード no longer gives a free extra search every Main Phase. At the Draw Phase its controller can trade the draw for the searched card, and negation behaves as ruled. The same applies to ダーク・ジェネラル フリード and 円盤ムスキー.

## Recorded exception to the naming rule

- The U33 test names **ダーク・ジェネラル フリード**, which stays PARTIAL. It is the consumer under test, and the explicit override keeps its status honest: an override outranks a registration in the coverage scanner, so the mention cannot promote it. Every other card the test names is TESTED or GENERIC_OK after this unit.

## Changed files

- `engine/1V_draw_replacement_s03.js`: new; registered in `build_manifest.json` after 1U.
- `cards/H9_claude_s03_draw_replacement.js`: new; registered in `build_manifest.json` after H8.
- `engine/30_processor_chain_battle.js`: the `processDrawV27` offer, the marker at both CHAIN_ADD sites, the activation-negated draw.
- `engine/00_state_actions.js`: the CHAIN_ADD marker copy and the `DRAW_REPLACED_S03` reducer case.
- `data/script_status_overrides.json`: the ダーク・ジェネラル フリード PARTIAL override.
- `data/s03_status_changes.json`: the two promotions.
- `tools/test_s03_u33_draw_replacement.js`: new; wired into `tools/check.py` after U32.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`, `data/s03_status_audit.json`.

The engine edits were applied by a guarded transform (exactly-once patterns; `--dry` first; scratchpad `u33_transform.py`). `dist/*.html` were not edited by hand.

## Verification

- **`node tools/test_s03_u33_draw_replacement.js`.** EXIT 0, **18 PASS**. Before, on the U32 build: 10 PASS / 8 FAIL.
- **Regression suites on the same build, all EXIT 0:** VS1 (21), VS6 (11), VS7 (21), `test_draw_event_cards` (65), U01 (56), U10 (33), U15 (24), U18 (15), U28 (15), U29 (14), U30 (14), U31 (8), U32 (12), `test_v440_activation_replay` (9), `test_v440_native_cards` (18), `test_activation_event_v12` (47), `test_v410_replay_rng` (9).
- **Full gate.** `python tools/check.py` (with S03-U33): EXIT 0, **12370 PASS / 0 FAIL** (U32's 12352 + U33 18). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u33_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- **TESTED 2069 → 2071, PARTIAL 181 → 179**; ENGINE_GAP 614 / NOT_STARTED 1303 / IMPLEMENTED 185 / GENERIC_OK 644 unchanged; TOTAL 4996.
- The **only** status changes versus U32 are the two declared promotions, 無敗将軍 フリード and 円盤ムスキー PARTIAL → TESTED (`data/s03_status_changes.json`, unit S03-U33). ダーク・ジェネラル フリード gains an H9 registration but stays PARTIAL through its explicit override, which outranks a registration in the coverage scanner. The audit reports 0 off-target changes.
- **Changed sources versus U32:** `engine/00_state_actions.js` and `engine/30_processor_chain_battle.js` (the only changed engine files; `engine/1V` is new), `build_manifest.json`, `tools/check.py`, `data/s03_status_changes.json`, `data/script_status_overrides.json`, and the generated `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`, `data/s03_status_audit.json`. **No existing file under `cards/` changed** — the unit adds `cards/H9_claude_s03_draw_replacement.js` (`u33_zipcheck.py` asserts this set).
- Gated source manifest SHA256 (excluding dist/ and *.log, with this report set aside): `d7bc549a7b0f3a946f0c6c248792888e6ef66929d26d38e89035615bb01a600d` (671 files).
