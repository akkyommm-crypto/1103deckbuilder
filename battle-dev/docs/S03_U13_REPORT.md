# S03-U13 C-S03-10 FIELD_EFFECT_RESPONSE_REACHABILITY (Claude)

Base: `checkpoint_claude_s03_u12_response_spell_speed_20260911.zip`, SHA256 `3f6ae6061f21b969b620d1c4c17076e7eb376fd857b958d1c0ce890cc7251127`.

## How it was found

- Self-audit #2 flagged it as the next candidate after VS1.
- The reachability probes showed face-up Continuous/Field S/T enter the DUEL response lists only through `hasFieldActivatableEffect`. For scripted cards, that function required legacy `fieldIgnition`.
  - The lists affected are `getChainResponsesV2` (chain windows) and `pointResponsesV27` (POINT windows).
  - The default chain mode is `AVAILABLE`, which auto-passes when nothing is listed. So a Spell Speed 2 on-field effect of a face-up Continuous Trap was never offered to the player on the opponent's turn.
- U12, which requires Spell Speed ≥ 2 for responses, was published first. Widening this gate before U12 would have admitted Spell Speed 1 Spells.

## Measurement before the fix (U12 build)

- **Refined probe.** Legality forced true inside the probe only.
  - 38 face-up at-will S/T effects are Spell Speed 2 (all Traps). 37 of them were never listed.
  - After excluding Traps whose ACTIVATE effect is the card's own activation, and trigger-only designs, about 8 Continuous Traps have real at-will on-field effects: 零式魔導粉砕機, 強制終了, 漆黒のパワーストーン, サンダー・ボトル, 木遁封印式, 水遁封印式, 死霊の巣, ビーストライザー.
- **U13 test on the unfixed U12 build (no stubs): 3 FAIL / 5 PASS.**
  - Each of the three cards passes strict legality but is not listed:
    - face-up 零式魔導粉砕機 (chain window on a Spell Speed 1 link);
    - 強制終了 (attack-declaration POINT window);
    - 木遁封印式 (chain window).
  - The controls pass: face-up 正統なる血統 is not re-offered, and U12's ヴァルハラ exclusion still holds.

## Requirement closure record

- **Requirement.** A face-up Continuous Trap's Spell Speed 2 on-field effect is offered in chain windows and response (POINT) windows when it is legal.
- **Root cause (INTEGRATION_MISSING).** `hasFieldActivatableEffect` admitted scripted face-up S/T only with legacy `fieldIgnition`. It never admitted:
  - U10-declared legacy scripts;
  - unified cards, whose adapter scripts never carry `fieldIgnition`.
- **Closure.** A scripted face-up S/T now has an at-will on-field effect when one of these holds:
  - legacy `fieldIgnition`;
  - legacy, declared card-activation-free (U10 table), and without a `passive` trigger design;
  - unified, with a native IGNITION or QUICK effect;
  - unified, with a native ACTIVATE effect whose events include `activate`, when the card is declared card-activation-free (e.g. 強制終了, where ACTIVATE is the on-field effect).
  - Unified Traps whose ACTIVATE effect is the card's own activation (e.g. 正統なる血統) are not admitted.
  - The response lists still apply strict legality, `ss≥top`, and U12's `ss≥2`.
- **Consumers.** DUEL chain windows (`getChainResponsesV2` / `openChainPriorityV2`), POINT windows (`pointResponsesV27`), and the MANUAL `reactableCards` list, which shares the gate.
- **Recovery.** Face-up Continuous Trap effects become reachable as responses: 零式魔導粉砕機, 強制終了, 漆黒のパワーストーン, サンダー・ボトル, 木遁封印式, 水遁封印式, 死霊の巣, ビーストライザー.
  - Real-path regression covers 零式魔導粉砕機, 強制終了 and 木遁封印式, plus one response activation.
  - No status change.
- **Dependent classification.**
  - ① Covered: the three real-path cases and the controls.
  - ② Legacy declared cards that have a `passive` trigger design (for example 押し売りゾンビ, エレキャノン, モンスターBOX) stay trigger-driven through SEGOC and are not admitted here. If one of them also has an at-will effect, it needs its own review.
  - ③ None.
- **Practical effect.** A player can now use Continuous Trap effects such as 零式魔導粉砕機 and 木遁封印式 on the opponent's turn, and 強制終了 in the opponent's Battle Phase, whenever they are legal. Before, these were silently auto-passed.

## Changed files

- `engine/20_effect_primitives_ex.js`: the `hasFieldActivatableEffect` at-will rule.
- `tools/test_s03_u13_field_effect_response.js`: new; wired into `tools/check.py`.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The edit was applied by a guarded transform (the pattern had to match exactly once, or nothing was written). `dist/*.html` were not edited by hand. Every card named in the test is TESTED or GENERIC_OK; the source was checked against coverage before the gate.

## Verification

- **`node tools/test_s03_u13_field_effect_response.js`.** EXIT 0, 8 PASS (3 FAIL / 5 PASS on the unfixed U12 build).
- **Regressions on the U13 build.** All EXIT 0 (name, PASS): s03_u01_raioh_lock 56; s03_u02_effect_count 76; s03_u03_dragunity 57; s03_u04_lock_recovery 39; s03_u05_search_flags 46; s03_u06_rabbit_opponent 21; s03_u07_spell_to_grave 32; s03_u08_journaled_flags 34; s03_u09_offer_legality 18; s03_u10_card_activation 33; s03_u11_exclusion_restriction 12; s03_vs1_dragunity_slice 21; s03_u12_response_spell_speed 10; device_paths_v351 17.
- **Full gate.** `python tools/check.py`: EXIT 0, **11926 PASS / 0 FAIL**; S03 audit off-target status changes = 0 (`s03_u13_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json` EXIT 0.

## Coverage

- TESTED 2064 / ENGINE_GAP 616 / NOT_STARTED 1304 / IMPLEMENTED 187 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2251.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `dffabf7d18614330cc99a54e0323388422ccdcad430cca97c8d1491e2b2b263f` (603 files).
