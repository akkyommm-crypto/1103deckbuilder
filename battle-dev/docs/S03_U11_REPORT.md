# S03-U11 C-S03-08 EXCLUSION_RESTRICTION (Claude)

Base: `checkpoint_claude_s03_u10_card_activation_20260911.zip`, SHA256 `503dd57af7dce04941a3e58a48069e6e8b37d0936b2b24e9f39aaa24473735d9`.

## How it was found

- **During U10 measurement.** The broad probe over every scripted Continuous/Field S/T raised an exception when activating 御前試合 or 群雄割拠: `r.violations is not a function`. It was recorded as finding F5.
- **Reading the code showed the real impact.**
  - `enforceExclusions()` is the rules pass that runs after every committed action outside battle (`runtime/50_actions_save.js:188`) and inside the damage step (`engine/60_damage_segoc_ui_helpers.js:242`).
  - It calls `exclusionViolations()`, which threw while either card was face-up.
  - So every later action threw, not only the activation. Any duel containing one of these cards face-up broke.

## Requirement closure record

- **Requirement.** While 御前試合 (Attributes) or 群雄割拠 (Types) is face-up, a player who controls face-up monsters of 2 or more kinds keeps one kind and sends the rest to the GY. No chain block is made. This is the rules pass that runs after actions.
- **Root cause: INTEGRATION_MISSING (redefinition drift).**
  - The legacy script (`cards/30_themes_b.js:805-826`) defined `restriction:{key, jp, violations()}`.
  - The later v49 unified redefinition (`cards/49_v49_autobuild_batch01.js:10-11`) replaced it with `restriction:{key, jp}` only. `violations` was dropped.
  - `exclusionViolations()` (`30_themes_b.js:878`) still called `r.violations()`.
  - The engine's v4.6 summon restriction (`40_legal_script_engine.js:72`) reads only `key` / `jp` and was unaffected.
- **Closure.**
  - `exclusionViolations()` keeps a script's own `violations()` when present.
  - Otherwise it derives violations from `restriction.key` with the same rule, through the new `exclusionViolationsByKeyV32(key)`: a player whose face-up monsters have 2 or more distinct values of `key`.
  - Nothing else changes: the keep choice (`__exclPick`, which sends the rest to the GY with journaled `FX_TO_GRAVE` Actions), the damage-step handling, and the v4.6 summon restriction.
- **Consumers.** `enforceExclusions` after every committed action outside battle and in the damage step; `__exclPick`.
- **Recovery.** 御前試合, 群雄割拠 (both TESTED; no status change).
- **Why tests missed it.** `tools/test_v460_native_cards.js:8` stubs `enforceExclusions=()=>{}`, so the rules pass never ran with these cards face-up in any test. The U11 test does not stub it.
- **Dependent classification.**
  - ① covered: both cards, on a real path.
  - ② and ③: none.
  - Not examined: other effects that rely on `restriction` objects. A source scan shows only these two cards define `restriction`.
- **Practical effect.** Duels that use 御前試合 or 群雄割拠 no longer throw on every action. The one-kind rule is enforced as the card text says.

## Measurement

- **Before (U10 build and earlier).** Broad probe error list: `御前試合 r.violations is not a function`, `群雄割拠 r.violations is not a function`.
- **After (U11 build).** Broad probe: `scripted Continuous/Field S/T: 188 | activated: 157 | refused: 31 | errors: 0`. No activation errors: the errors section is absent.

## Changed files

- `cards/30_themes_b.js`: `exclusionViolations` fallback and `exclusionViolationsByKeyV32`.
- `tools/test_s03_u11_exclusion_restriction.js`: new; wired into `tools/check.py`.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The edit was applied by a guarded transform: the pattern had to match exactly once, or nothing was written. `dist/*.html` were not edited by hand.

## Verification

- **`node tools/test_s03_u11_exclusion_restriction.js`: EXIT 0, 12 PASS.** `enforceExclusions` is not stubbed.
  - 御前試合 set, with ライオウ (LIGHT) and E・HERO エアーマン (WIND) face-up:
    - it activates from the set without an exception;
    - the violation is reported for that player (光 / 風);
    - the next committed action (a phase change) runs the rules pass without an exception;
    - keeping LIGHT sends エアーマン to the GY, and no violation remains;
    - Replay OK.
  - 群雄割拠 with the same monsters (雷 / 戦士): the same checks pass; keeping Warrior sends ライオウ to the GY; Replay OK.
  - Control: with a single Attribute there is no violation.
- **Dedicated and existing tests on the U11 build.**
  - U01–U10: 56 / 76 / 57 / 39 / 46 / 21 / 32 / 34 / 18 / 33 PASS.
  - test_v460_native_cards: 51 PASS. test_v490_batch01: 44 PASS.
- **Full gate.** `python tools/check.py`: EXIT 0, **11887 PASS / 0 FAIL**; S03 audit off-target status changes = 0 (`s03_u11_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json` EXIT 0.

## Coverage

- TESTED 2064 / ENGINE_GAP 616 / NOT_STARTED 1304 / IMPLEMENTED 187 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2251.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `b5282380b3f3845d2e53c56e2a87333db3ac25e2883768e4eb66f80d59b6498f` (597 files).
