# S03-VS9 — Vertical Slice #9 (強欲で謙虚な壺 rulings, interrupted activation resume)

Base: `checkpoint_claude_s03_u35_interrupted_activation_20260913.zip`, SHA256 `a20589cf5147d5a566bfae403ff74e0b287f15b71edfb5290b7c971130f7d40b`.

## Purpose

- Representative-deck regression after U34 and U35, played as one real game of three turns across **three VMs** (two resumes), with the RNG seed pinned.
- **VALIDATION unit: no engine or card change.** The closure is a new gate test.
- Reports for the units it covers: `docs/S03_U34_REPORT.md`, `docs/S03_U35_REPORT.md`.

## Deck choice

- **P1:** a provisional Warrior list. Two 《強欲で謙虚な壺》, 《サイクロン》 and 《マジック・ストライカー》 are in the opening hand.
- **P2:** a provisional trap list. 《マジック・ジャマー》 and 《奈落の落とし穴》 are set on T2; 《ワイト》 and discard fodder are in the opening hand.
- Not user decks and not legality-checked. Both lists load in a fixed order.
- No Deck search or shuffle happens before the second 強欲で謙虚な壺 resolves, so its top three are known from the list.

## Path

- **T1 (P1).** Draws; Normal Summons マジック・ストライカー.
- **T2 (P2).** Draws; sets マジック・ジャマー and 奈落の落とし穴; Normal Summons ワイト.
- **T3 (P1), U34.**
  - The first 強欲で謙虚な壺 is activated: nothing is revealed or picked, the chain link exists, and P2 holds priority.
  - P2 negates it with マジック・ジャマー (discard cost). Result: no choice, nothing added, and P1 may still Special Summon.
  - The **second copy is legal the same turn**, and at resolution it offers exactly the top three of the Deck.
  - The chosen card is added, and Special Summons are locked for the turn.
- **T3 (P1), U35.** サイクロン is activated against the set 奈落の落とし穴, and **the duel is saved while the target choice is open**; this choice carries the activation marker.
- **VM2 (resume).**
  - The unfinished activation is undone, with its notice: サイクロン is back in the hand, 奈落 is still set, and there is no choice or chain. Still turn 3, Main Phase 1, and the searched card is still in hand.
  - Replay audits clean.
  - サイクロン is activated again and destroys 奈落.
  - マジック・ストライカー attacks ワイト in a real Battle Phase; Main Phase 2 is reached, and the duel is saved again.
- **VM3 (resume).** Turn 3 Main Phase 2 resumes; T4 begins for P2.
- Replay audits at every stage.

## Findings

- **No engine stop.**
- **Test-side corrections while drafting**, both in the slice, not the engine: the slice's COMMON first lacked the `phase` / `nextTurn` helpers used by VS7 and VS8, and the attack used a guessed helper instead of VS7's `requestProcessorV27(PROCESSOR_V27.ATTACK, …)`.
- After both fixes the draft ran **19 PASS / 0 FAIL**.

## Requirement closure record

- **Requirement.** The units published since VS8 must hold in a real duel, together, across save / resume:
  - 強欲で謙虚な壺's resolution-time reveal and its 10/05/19 release after a negated activation (C-S03-27);
  - the rollback of an activation saved mid-choice, with play continuing (C-S03-28).
- **Root cause.** Not applicable: this is a validation unit.
- **Closure.** `tools/test_s03_vs9_pot_interrupted_resume_slice.js` (new), wired into `tools/check.py` after U35. 19 assertions over VM1 T1–T3, a VM2 resume with continued play, and a VM3 resume.
- **Consumers.** 《強欲で謙虚な壺》, 《マジック・ジャマー》, 《サイクロン》, 《奈落の落とし穴》, 《マジック・ストライカー》.
- **Recovery.** No status change.
- **Dependent classification.**
  - **①** Covered above.
  - **② Remaining.**
    - The chained Special Summon lock (10/05/18) is unit-covered only (U34): no Special Summon source is on this path.
    - The マジック・ジャマー cost-choice interruption and the set-card interruption are unit-covered only (U35).
    - MANUAL routes are not covered by a slice.
    - The ② items recorded by U34 and U35 are unchanged.
  - **③** None.
- **Practical effect.** A regression in the pot's resolution-time choice, in its release after negation, or in the resume of an interrupted activation now fails the gate on a real duel path.

## Changed files

- `tools/test_s03_vs9_pot_interrupted_resume_slice.js`: new; wired into `tools/check.py` after U35.
- Generated: `data/script_coverage.json` (test-evidence lists only).

No engine or card sources were edited. `dist/*.html` were not edited by hand. Every card named in the slice is TESTED or GENERIC_OK (name-scanned against the U34 baseline: 21 names, 16 TESTED and 5 GENERIC_OK).

## Verification

- **VS9 slice.** `node tools/test_s03_vs9_pot_interrupted_resume_slice.js` EXIT 0, 19 PASS.
- **Full gate.** `python tools/check.py` (with S03-VS9): EXIT 0, **12453 PASS / 0 FAIL** (U35's 12434 + VS9 19). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_vs9_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Status counts unchanged: TESTED 2071 / ENGINE_GAP 614 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 179 / GENERIC_OK 644 / TOTAL 4996.
- **Every file under `engine/`, `runtime/` and `cards/`, and both status-data files, are byte-identical to the U35 checkpoint.** `vs9_zipcheck.py` asserts it.
- Gated source manifest SHA256 (excluding dist/ and *.log, with this report set aside): `6e57f83b2216538a3be360f3962a367afec0811679c73a9661a2b207ece2aa6d` (681 files).
