# S03-VS5 Vertical Slice #5 — beatdown with battle triggers vs 1103兎ラギア (Claude)

Base: `checkpoint_claude_s03_u23_battle_destroy_trigger_timing_20260912.zip`, SHA256 `8dfe54cde91871e4bf82b68aa2f69abb3d8bdbf570397055ad98a0a865a19c61`.

## Purpose

- Representative-deck regression after three Requirement units since VS4 (U21, U22, U23), including U20, which was published with VS4.
- It checks, in one real game, that the battle fixes work together on the normal play path, not only in isolated unit tests.
- This is a VALIDATION unit: no engine or card changes.

## Deck choice

- The sample decks in `data/80_test_decks.js` (TEST_DECK, FEATURE_DECK, RABBIT_LAGGIA_DECK) contain none of the cards these units fixed.
- The confirmed TEST_DECK also holds many IMPLEMENTED cards, which a test may not name.
- **P1:** a provisional 40-card beatdown list — the TESTED / GENERIC_OK core of TEST_DECK plus ハイドロゲドン ×3, ロケット戦士 ×2 and 電磁ミノ虫.
- **P2:** the 1103兎ラギア sample (built at runtime; only its arranged top cards are named).

## Path (real game flow; decks loaded in a fixed arranged order)

- **T1 (P1).** Set 電磁ミノ虫.
- **T2 (P2).** Normal Summon セイバーザウルス; it attacks the set 電磁ミノ虫, which is flipped and destroyed. Its ② (battle destruction, U23) lowers セイバーザウルス to 1400 / 0.
- **T3 (P1).** Normal Summon ハイドロゲドン; it destroys セイバーザウルス and sends it to the GY. Its trigger (U23) Special Summons ハイドロゲドン from the Deck, which attacks directly (P2 at 6200).
- **T4 (P2).** Normal Summon ジェネティック・ワーウルフ; it destroys one ハイドロゲドン (P1 at 7600).
- **T5 (P1).**
  - Normal Summon ロケット戦士; it attacks the wolf in P1's Battle Phase. It is not destroyed and P1 takes no damage (text ①; damage text on the battle path, U20). After damage calculation its ② lowers the wolf to 1500 (U22).
  - ハイドロゲドン destroys the weakened wolf and Special Summons another ハイドロゲドン (U23), which attacks directly (P2 at 4500).
  - Replay audit (123 actions; battles with damage-step context, U21), then save in Main Phase 2.
- **VM2.** The save resumes. **T6 (P2):** セイバーザウルス destroys ロケット戦士 in P2's Battle Phase, where ① does not apply (P1 at 7200). T7 begins for P1. Replay audit (145 actions).

## Findings

- **No engine stop.**
- **Test-side correction.** In the first draft the T3 draw took a ハイドロゲドン from the Deck, so at T5 no 「ハイドロゲドン」 was left and its trigger was correctly not offered. The draws are now arranged so that two copies stay in the Deck.
- **Practical effect.** Battle-destruction triggers, damage-step ATK changes, damage text in the owner's Battle Phase, save / resume and Replay run together as a real duel. Any later change that breaks this line fails the gate.

## Changed files

- `tools/test_s03_vs5_battle_trigger_slice.js`: new; wired into `tools/check.py` after U23.

Every card named in the test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_vs5_battle_trigger_slice.js`.** EXIT 0, 16 PASS on the U23 build (VM1 T1–T5 and VM2 T6–T7, each with a Replay audit). The first draft stopped at T5 on the test-side deck arrangement described above.
- **Full gate.** `python tools/check.py`: EXIT 0, **12205 PASS / 0 FAIL** (U23's 12189 + VS5 16). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_vs5_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2253.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `6e8ffbc674139d3ba7f80651ae5715e3d8ddf87e1efcbc46a2cea1f77b5ca0c4` (639 files).
