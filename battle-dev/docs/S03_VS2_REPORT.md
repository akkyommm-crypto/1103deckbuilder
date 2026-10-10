# S03-VS2 Vertical Slice #2 Regression — 真六武衆 (provisional) vs 1103兎ラギア (Claude)

Base: `checkpoint_claude_s03_u13_field_effect_response_20260911.zip`, SHA256 `954bd73aa80a964211ddc34ae52f2bd5edfa07f123d50488b1c45eb79cf78f48`.

## Purpose

- A representative-deck check on the real game path, run after U12 and U13 as the Master Prompt's cadence calls for (about every 3 clean units).
- It uses a second archetype, so the regression gate covers more than the Dragunity line.

## The path (fixed deck order, no shuffle)

- **T1 (P1, 真六武衆 provisional 40):**
  - normal draw;
  - **紫炎の狼煙** searches **真六武衆－カゲキ** (Lv3);
  - Normal Summon カゲキ; its summon trigger is offered through SEGOC and Special Summons **六武衆－ザンジ** from hand;
  - **真六武衆－キザン** uses its hand Special Summon procedure (another 六武衆 is on the field);
  - continuous boosts: カゲキ 1700 (+1500), キザン 2100 (+300), ザンジ 1800;
  - set 奈落の落とし穴; End Phase.
- **T2 (P2, 1103兎ラギア sample):**
  - Normal Summon レスキューラビット; P1's 奈落 is **not offered** for 300 ATK (U09);
  - レスキューラビット Special Summons two セイバーザウルス; 奈落 **is offered** and banishes both.
- **T3 (P1):**
  - three direct attacks (1700 + 1800 + 2100) take P2 to 2400;
  - Main Phase 2; Replay audit of the whole live journal (92 actions); save.
- **VM2:**
  - the saved state loads with a matching digest;
  - End Phase → turn 4 for P2, with the continuous boosts intact;
  - Replay audit.

## Findings

- **Test fixture:** the provisional list first added up to 38 cards; it was corrected to 40.
- **Test harness, not the engine:** キザン's summon procedure allows attack or defense position.
  - With two positions, `runSummonProcedure` renders a position sheet whose buttons call `finishSummonProcedure(name, p, zone, index, pos)`.
  - The harness stubs the sheet, so the test calls that button handler directly, just as the UI does.
- **Note (low priority):** this position sheet is a legacy `sheet.innerHTML` UI, not a V49 choice. A save taken while it is open cannot restore it. Low impact, because no Action is committed until the button is pressed.
- **No engine stop.**
- **Scope limits found while planning.** These are recorded in WORK_QUEUE as the next candidates:
  - **真六武衆－シエン** needs a 六武衆 Tuner (六武衆の影武者, ENGINE_GAP), so the Synchro line is not in this slice.
  - **六武の門** (IMPLEMENTED) is the deck's engine. Its effect resolves through legacy closures (`API.confirm` + `selectCard`, the carried Q5), so it needs its own validation and declared-promotion unit.
  - Key 1103 六武衆 cards have no script (NOT_STARTED): 六武衆－イロウ, カモン, ニサシ, ヤリザ, 大将軍 紫炎, 真六武衆－シナイ, 紫炎の老中 エニシ.

## Requirement closure record

- **Requirement.** A representative real-path regression for the 真六武衆 summon line against the sample opponent (VALIDATION).
- **Root cause.** Not applicable; this unit changes no engine code.
- **Closure.** New `tools/test_s03_vs2_six_samurai_slice.js`, wired into `tools/check.py`.
- **Consumers.** The regression gate.
- **Recovery.** None. Every card named in the test is TESTED or GENERIC_OK; the source was scanned against coverage before the gate. No status change.
- **Remaining.** The deck is provisional and not legality-checked. The Synchro line and 六武の門 are out of scope, as above.
- **Practical effect.** Any future change that breaks this line fails the gate. The line covers search, the summon trigger, a summon procedure, continuous boosts, 奈落, direct attacks, SaveLoad and Replay.

## Changed files

- `tools/test_s03_vs2_six_samurai_slice.js`: new.
- `tools/check.py`: wiring.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

## Verification

- **`node tools/test_s03_vs2_six_samurai_slice.js`:** EXIT 0, 16 PASS (VM1 Replay 92 actions OK; VM2 OK).
- **Full gate:** `python tools/check.py` — EXIT 0, **11942 PASS / 0 FAIL**; S03 audit off-target status changes = 0 (`s03_vs2_full_gate.log`).
- **Acode:** `python tools/build_acode.py data/carddata.json` EXIT 0.

## Coverage

- TESTED 2064 / ENGINE_GAP 616 / NOT_STARTED 1304 / IMPLEMENTED 187 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2251.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `ce90ad4e35d87951c6cf188d2be92ca798048808fb3b2788f9a6de470996b6fa` (605 files).
