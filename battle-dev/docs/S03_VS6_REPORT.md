# S03-VS6 Vertical Slice #6 — battle effects vs 真六武衆 (Claude)

Base: `checkpoint_claude_s03_u27_segoc_spell_trap_order_20260912.zip`, SHA256 `ea02368ccc813078bc3bcef2ed261309f91780589e7a7d0829c98e77a7b03ce7`.

## Purpose

- Representative-deck regression after the units since VS5 (U24, U25, U26), published after U27, the engine stop this slice found.
- It checks, in one real game, that the battle-destruction fixes work together on the normal play path.
- This is a VALIDATION unit: no engine or card changes.

## Deck choice

- **P1:** the VS5 beatdown list with 漆黒の魔王 LV4 and 電動刃虫 in place of the two ロケット戦士, and 時の機械－タイム・マシーン in place of 昇天の角笛. All TESTED / GENERIC_OK.
- **P2:** the provisional 真六武衆 list of VS3. The 1103兎ラギア sample has no monster with a battle-destruction trigger, so it could not show U25.
- Both lists are named in the test and loaded in a fixed arranged order.

## Path (real game flow)

- **T1 (P1).** Normal Summon 漆黒の魔王 LV4; set 時の機械－タイム・マシーン.
- **T2 (P2).** Normal Summon 紫炎の足軽.
- **T3 (P1).** 漆黒の魔王 LV4 destroys 紫炎の足軽 (P2 at 7700).
  - 紫炎の足軽's trigger is activated but negated, so nothing is Special Summoned (U25).
  - P1 declines 時の機械, which since U27 is offered after the trigger effects.
- **T4 (P2).** Normal Summon 六武衆の露払い; it destroys 漆黒の魔王 LV4 (P1 at 7400). P1's 時の機械 returns it in Attack Position (U24).
- **T5 (P1).**
  - Normal Summon 電動刃虫; it destroys 六武衆の露払い. At the end of the damage step P2 draws 1 (U26).
  - 漆黒の魔王 LV4 attacks directly (P2 at 5900).
  - Replay audit (108 actions), then save in Main Phase 2.
- **VM2.** The save resumes; T6 begins for P2; Replay audit (110 actions).

## Findings

- **Engine stop → S03-U27 C-S03-23 SEGOC_SPELL_TRAP_ORDER.** On the U26 build, at T3 P1's set 時の機械 was ranked among the trigger effects and chained before P2's 紫炎の足軽 trigger. The trigger was then refused 「スペルスピードが足りません」 and offered again forever. Fixed in U27 (see `docs/S03_U27_REPORT.md`).
- **Test-side correction.** Event choices are made by card name. P1 declines 時の機械 at T3 and activates it at T4; a first draft always took the first offered card.
- **Practical effect.** Battle-destruction negation, a trap that returns a destroyed monster, and an end-of-damage-step effect after a destruction run together as a real duel with save / resume and Replay.

## Changed files

- `tools/test_s03_vs6_battle_negation_slice.js`: new; wired into `tools/check.py` after U27.

Every card named in the test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_vs6_battle_negation_slice.js`.** EXIT 0, 11 PASS (VM1 T1–T5 and VM2, each with a Replay audit).
  - On the U26 build the first draft stalled at T3 (the U27 stop).
- **Full gate.** `python tools/check.py` (with S03-U27): EXIT 0, **12268 PASS / 0 FAIL** (U27's 12257 + VS6 11). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_vs6_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2253.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `a92e1ccca54554e4fe4710b2a51196679ec0b52e3e9a5cca2e51334bffadf625` (651 files).
