# S03-VS7 — Vertical Slice #7 (targeting negation, negated activation, UI route)

Base: `checkpoint_claude_s03_u30_ui_activation_paths_20260912.zip`, SHA256 `ea3a5abcab0d943baade1a88c711d2d8550d3724fab9967ff7c59b0c19286986`.

## Purpose

- Representative-deck regression after U28, U29 and U30, played as one real game to completion of five turns plus a save / resume.
- **VALIDATION unit: no engine or card change.** The closure is a new gate test.
- Report for the units it covers: `docs/S03_U28_REPORT.md`, `docs/S03_U29_REPORT.md`, `docs/S03_U30_REPORT.md`.

## Deck choice

- **P1:** a provisional Dragunity-ish list built on VS1's, with 《ミドル・シールド・ガードナー》, 《アルカナフォース0－THE FOOL》 and 《ハーフ・シャット》 added so the targeting negations can occur on a real path.
- **P2:** a provisional removal list holding 《シールドクラッシュ》 and 《ソウルテイカー》 — the two cards whose targeting the negators must answer — plus beatdown filler.
- Not user decks and not legality-checked. Both lists load in a fixed order, so the opening hands and every draw are reproducible.

## Path

- **T1 (P1), through the UI action menu.** `getLegalHandActions` offers 《竜の渓谷》's `activate`; running that entry performs the **card activation only** — no mode choice, no discard, Deck untouched, the effect's 1/turn unused (U10 / U30). Then `getLegalZoneActions` offers `effect` on the face-up card, which asks the mode, takes 《ドラグニティ－ファランクス》 as the discard cost and adds 《ドラグニティ－ドゥクス》. 《ミドル・シールド・ガードナー》 is then set face-down.
- **T2 (P2).** 《シールドクラッシュ》 targets the face-down MSG. Its activation is negated automatically with **no chain block for MSG**, MSG flips face-up in Defense Position (U28), and the negated Spell is sent to **P2's GY** rather than staying in the Spell & Trap Zone (U29).
- **T3 (P1).** 《アルカナフォース0－THE FOOL》 is Normal Summoned; its forced summon trigger resolves the coin toss. The slice pins the RNG seed (`0x57070007`), so the toss is reproducible and lands **tails (2)** — the side that names the opponent's cards.
- **T4 (P2).** 《ソウルテイカー》 targets THE FOOL. On tails THE FOOL negates the effect of the **opponent's** card targeting it and destroys that card (U28): ソウルテイカー goes to the GY, THE FOOL survives, and neither player's LP changes — P2 never reaches 「その後、相手は1000LP回復する」. The heads case (only its own controller's cards are stopped) is covered by the U28 unit test, and the slice keeps a 《ハーフ・シャット》 branch for it.
- **T5 (P1).** THE FOOL is still on the field. 《ドラグニティ－ドゥクス》 is Normal Summoned and equips 《ドラグニティ－ファランクス》 from the GY; with P2's Monster Zone empty it attacks directly for its current ATK (1900 with the equip). Main Phase 2 is reached through the legal main1 → battle → main2 transition, then the duel is saved.
- **VM2.** The save resumes at turn 5 Main Phase 2 with the same board; the negated 《シールドクラッシュ》 is still in P2's GY after the round trip; T6 begins for P2 and the game continues.

## Findings

- **No engine stop.** All three units behave on a real path, including through save / load.
- **Test-side corrections while drafting** (all in the slice, none in the engine):
  - the slice's `settle()` auto-answers a pending choice, which swallowed 《竜の渓谷》's Deck pick — explicit picks must be separated with `drive()`, which stops *at* a choice without answering it;
  - `phase('main2')` straight from Main Phase 1 is refused in DUEL mode (`legalPhaseTransitionV28`), so the save captured Main Phase 1; the slice now plays a real Battle Phase first;
  - 《ソウルテイカー》's 「相手は1000LP回復する」 credits the **opponent of the activating player**, not the activator;
  - **the slice was not reproducible at first.** THE FOOL's coin toss consumes the duel RNG, whose seed is created per game, so three runs of the same slice gave tails, tails, heads and the path forked. The slice now pins the seed (`gameState.rngInitialSeed = gameState.rngState = 0x57070007`, `__v41Seq = 0`) and re-baselines the action journal before the decks load — the same pattern the v4.3 / v4.4 replay tests use — so the toss is fixed at tails. The coin branch is kept as a safety net rather than an expectation.

## Requirement closure record

- **Requirement.** The units published since VS6 must hold in a real duel, together, and survive save / resume: the automatic targeting negation with no chain block (C-S03-24), the negated card reaching the GY (C-S03-25), and the card-vs-effect activation split as reached through the player's own action menu (C-S03-07 / U30).
- **Root cause.** Not applicable: this is a validation unit.
- **Closure.** `tools/test_s03_vs7_targeting_negation_slice.js` (new), wired into `tools/check.py` after U30. 21 assertions, six Replay audits, VM1 five turns + VM2 resume.
- **Consumers.** 《ミドル・シールド・ガードナー》, 《アルカナフォース0－THE FOOL》, 《竜の渓谷》, 《ドラグニティ－ドゥクス》, 《シールドクラッシュ》, 《ソウルテイカー》.
- **Recovery.** No status change.
- **Dependent classification.**
  - **①** Covered above.
  - **② Remaining.** THE FOOL's heads branch is not on this path (the pinned seed lands tails); it stays covered by the U28 unit test. The slice drives the UI menu for 《竜の渓谷》 only. MANUAL / DEVELOPER play modes are not covered. The pinned seed means the slice does not exercise other RNG outcomes; a second seed would be a separate slice.
  - **③** None.
- **Practical effect.** A representative game now exercises the newest three units end to end, so a regression in any of them fails the gate on a real duel path rather than only in an isolated fixture.

## Changed files

- `tools/test_s03_vs7_targeting_negation_slice.js`: new; wired into `tools/check.py` after U30.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md` (test-evidence lists only).

No engine or card sources were edited. `dist/*.html` were not edited by hand. Every card named in the slice is TESTED or GENERIC_OK.

## Verification

- **VS7 slice.** `node tools/test_s03_vs7_targeting_negation_slice.js` EXIT 0, 21 PASS (VM1 T1–T5 and VM2, each stage with a Replay audit).
- **Full gate.** `python tools/check.py` (with S03-VS7): EXIT 0, **12332 PASS / 0 FAIL** (U30's 12311 + VS7 21). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_vs7_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Status counts unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2253.
- `docs/SCRIPT_COVERAGE.md` is byte-identical to U30. In `data/script_coverage.json`, 41 cards gained a test-evidence entry naming the VS7 slice — the cards the two provisional lists contain. No status changes.
- **Every file under `engine/` and `cards/` is byte-identical to the U30 checkpoint**, which is the invariant a validation unit must satisfy: the closure is a slice test, not an engine change (`vs7_zipcheck.py` asserts it).
- Gated source manifest SHA256 (excluding dist/ and *.log, with this report set aside): `8d2c442954262e0ec9edf15fa676b3ceaf5296ecd5cb62c251b1054f943f09a2` (662 files).
