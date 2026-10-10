# S03-VS3 Vertical Slice #3 — 真六武衆 + 六武の門 vs 1103兎ラギア (Claude)

Base: `checkpoint_claude_s03_u16_cost_selection_first_20260912.zip`, SHA256 `6c7f05cf2411cb58fcdd69f511030808d5aa816d652b819ce6043d6d85d1674b`.

## Purpose

- Representative-deck regression after three Requirement units (U14, U15, U16).
- It checks, in one real game, that their fixes work together on the normal play path, not only in isolated unit tests.
- This is a VALIDATION unit: no engine or card changes.

## Path (real game flow; decks loaded in a fixed arranged order)

- **P1:** a provisional 40-card 真六武衆 list with 六武の門 ×2, 六武衆の結束 and 昇天の角笛.
- **P2:** the 1103兎ラギア sample (built at runtime; only its arranged top cards are named).
- **T1 (P1).**
  - 六武の門 and 六武衆の結束 are activated as cards (U10); they stay face-up with no counters.
  - Normal Summon 真六武衆－カゲキ: 2 counters. Its trigger Special Summons 六武衆－ザンジ: 4 counters; 結束 at 2 (U14).
  - 真六武衆－キザン hand procedure: P2 has no negator, so it summons immediately. 六武の門 reaches 6; 結束 stays at its maximum of 2.
  - 六武の門 with 6 counters offers the 2- and 4-counter effects.
    - The cost choice lets P1 pay 4 counters from 六武の門 itself and keep 結束's.
    - The 4-counter effect adds 真六武衆－キザン from the Deck.
  - Set 昇天の角笛.
- **T2 (P2).** Normal Summon ライオウ. The summon waits because P1's set 昇天の角笛 can negate it; P1 declines and ライオウ is summoned.
- **T3 (P1).** The second キザン procedure waits in the summon-negation window facing ライオウ. Replay audit (75 actions), then save.
- **VM2.**
  - The save resumes with the window shown again (U15).
  - ライオウ is sent to the GY as cost and negates the procedure; キザン goes to the GY and the counters do not change.
  - Direct attacks take P2 to 2400.
  - 六武衆の結束 is sent as cost and draws 2 (U14).
  - **T4 (P2):** the Normal Summon of セイバーザウルス waits for 昇天の角笛. P1 activates it from the set position, tributing ザンジ (U16), and negates the summon.
  - Replay audit (139 actions).

## Findings

- **No engine stop.** One test-side correction during conversion: with counters on two cards, the U14 counter-unit choice appears, and the test must choose the 4 units.
- **Practical effect.** The 真六武衆 / 六武の門 line runs as a real duel through counter placement, gate effects, a saved and resumed summon window, a ライオウ negation, battle, and a counter-trap negation. Any later change that breaks this line fails the gate.

## Changed files

- `tools/test_s03_vs3_six_samurai_gate_slice.js`: new; wired into `tools/check.py`.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md` (rebuilt by the gate; content unchanged).

Every card named in the test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_vs3_six_samurai_gate_slice.js`.** EXIT 0, 22 PASS (VM1 T1–T3 and VM2 T3–T4, each with a Replay audit).
- **Full gate.** `python tools/check.py`: EXIT 0, **12056 PASS / 0 FAIL**. The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_vs3_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2253.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `d5bab9c7dbd6aae8a7cb8738df4b2dffa30e0fcb7ceb6e615af16bb7d75aa106` (617 files).
