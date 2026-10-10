# S03-VS8 — Vertical Slice #8 (draw replacement, targeting negation 2)

Base: `checkpoint_claude_s03_u33_draw_replacement_20260913.zip`, SHA256 `2da9338ad953ab9c7dd3bb760519bc79b2c8a7fbe70a30587bbafa7ae4be5ec2`.

## Purpose

- Representative-deck regression after U31, U32 and U33, played as one real game of five turns plus a save / resume.
- **VALIDATION unit: no engine or card change.** The closure is a new gate test.
- Reports for the units it covers: `docs/S03_U31_REPORT.md`, `docs/S03_U32_REPORT.md`, `docs/S03_U33_REPORT.md`.
- U31 is MANUAL-only. Slices are DUEL games, so U31 stays covered by its own test.

## Deck choice

- **P1:** a provisional Warrior list. 《無敗将軍 フリード》 and 《ADチェンジャー》 are in the opening hand; Level 4 or lower Warriors (《異次元の女戦士》, 《ダッシュ・ウォリアー》, 《マジック・ストライカー》) sit in the Deck so the draw replacement has a pool.
- **P2:** a provisional Spellcaster list. 《ワイト》, 《カオス・マジシャン》 and 《ソウルテイカー》 are in the opening hand.
- Not user decks and not legality-checked. Both lists load in a fixed order, and the RNG seed is pinned (`0x58080008`) before the journal is re-baselined (VS7's lesson), so the path is reproducible.

## Path

- **T1 (P1).** Normal draw (no replacer on the field yet), then 《ADチェンジャー》 is Normal Summoned.
- **T2 (P2).** 《ワイト》 is Normal Summoned.
- **T3 (P1).** 《無敗将軍 フリード》 is Tribute Summoned face-up through the real one-tribute prompt, releasing 《ADチェンジャー》.
- **T4 (P2).** 《カオス・マジシャン》 is Tribute Summoned, releasing 《ワイト》. P2 then activates 《ソウルテイカー》 targeting フリード. フリード negates it automatically and destroys it, **with no chain block** (U32). フリード survives, and P1's LP is unchanged: 「その後、相手は1000LP回復する」 is never reached.
- **T5 (P1), the draw replacement.**
  - At the normal draw P1 is offered 「通常のドローを行う」 or 「「無敗将軍 フリード」の効果を発動（通常のドローの代わり）」 (U33). P1 takes the effect and searches 《異次元の女戦士》.
  - **Checked by identity**, because a Deck search shuffles the Deck: the hand grows by exactly one, the card that was on top is still in the Deck, the Deck shrinks by exactly one, and the normal draw is used up.
  - In Main Phase 1 フリード offers **no** search effect.
  - P1 banishes 《ADチェンジャー》 from the GY as the cost, targeting 《カオス・マジシャン》 only. The effect is negated (U32): カオス・マジシャン's position is unchanged, and the cost stays paid.
  - The Battle Phase is passed through to Main Phase 2, and the duel is saved.
- **VM2.** The save resumes at turn 5 Main Phase 2 with the same board. フリード and カオス・マジシャン are on the field and 《異次元の女戦士》 is in P1's hand. T6 begins for P2 and the game continues.
- Every stage ends with a Replay audit (seven audits in total).

## Findings

- **No engine stop.** All the units behave on a real path, including through save / load.
- **One test-side correction while drafting** (in the slice, not the engine):
  - the first draft checked "no normal draw" by comparing the Deck's top card before and after;
  - the search shuffles the Deck, so the top changed (はにわ → ダーク・グレファー) even though no card was drawn;
  - the assertion is now identity-based (the former top card's zone is still `deck`, and the Deck count drops by exactly one). The draft ran 18 PASS / 1 FAIL before the correction and **19 PASS / 0 FAIL** after.

## Requirement closure record

- **Requirement.** The DUEL units published since VS7 must hold in a real duel, together, and survive save / resume:
  - the draw replacement offered at the normal draw, replacing it, and gone from the Main Phase (C-S03-26);
  - 無敗将軍 フリード's automatic negation of a Spell that targets it, with no chain block (C-S03-24 / U32);
  - カオス・マジシャン's negation of a monster effect that targets only it (C-S03-24 / U32).
- **Root cause.** Not applicable: this is a validation unit.
- **Closure.** `tools/test_s03_vs8_draw_replacement_slice.js` (new), wired into `tools/check.py` after U33. 19 assertions, seven Replay audits, VM1 five turns + VM2 resume.
- **Consumers.** 《無敗将軍 フリード》, 《カオス・マジシャン》, 《ソウルテイカー》, 《ADチェンジャー》, 《異次元の女戦士》.
- **Recovery.** No status change.
- **Dependent classification.**
  - **①** Covered above.
  - **② Remaining.**
    - The slice takes the replacement. Declining it, and the two negation variants (天罰 / スキルドレイン), stay covered by the U33 unit test.
    - 円盤ムスキー and ダーク・ジェネラル フリード are not on this path.
    - U31 (MANUAL) is not covered by a slice.
    - The ② items recorded by U32 and U33 are unchanged.
  - **③** None.
- **Practical effect.** A representative game now exercises the newest DUEL units end to end. A regression in the draw hook or in either targeting negation fails the gate on a real duel path, not only in an isolated fixture.

## Changed files

- `tools/test_s03_vs8_draw_replacement_slice.js`: new; wired into `tools/check.py` after U33.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

No engine or card sources were edited. `dist/*.html` were not edited by hand. Every card named in the slice is TESTED or GENERIC_OK (checked against `data/script_coverage.json`: 24 names, 19 TESTED and 5 GENERIC_OK).

## Verification

- **VS8 slice.** `node tools/test_s03_vs8_draw_replacement_slice.js` EXIT 0, 19 PASS.
- **Full gate.** `python tools/check.py` (with S03-VS8): EXIT 0, **12389 PASS / 0 FAIL** (U33's 12370 + VS8 19). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_vs8_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Status counts unchanged: TESTED 2071 / ENGINE_GAP 614 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 179 / GENERIC_OK 644 / TOTAL 4996.
- **Every file under `engine/` and `cards/`, and both status-data files, are byte-identical to the U33 checkpoint.** This is the invariant a validation unit must satisfy; `vs8_zipcheck.py` asserts it.
- Gated source manifest SHA256 (excluding dist/ and *.log, with this report set aside): `5d546f4a5f1d79056c4af0763059aa2b0f71f0cd4f99f53e7e94a4207e60a72c` (673 files).
