# S03-U12 C-S03-09 CHAIN_RESPONSE_SPELL_SPEED (Claude)

Base: `checkpoint_claude_s03_vs1_dragunity_slice_20260911.zip`, SHA256 `67623c9298243ce434e587e8363993394b45a603b2a9436ab9e1efff4cfc70ea`.

## How it was found

- After VS1, I measured whether face-up Continuous/Field effects are reachable as chain responses. That was the next candidate from self-audit #2.
- The refined probe found the opposite problem as well: Spell Speed 1 effects were offered where only Spell Speed 2 and higher are legal.

## Measurement before the fix (VS1 build)

- **Probe with legality forced true.** With a Spell Speed 1 link on the chain, all 5 face-up legacy `fieldIgnition` Spells were offered by `getChainResponsesV2`: 六武の門, 六武衆の結束, 暗黒界の門, カラクリ解体新書 and 神の居城－ヴァルハラ.
- **Real legality (no stubs).** Face-up 神の居城－ヴァルハラ and 暗黒界の門, with their conditions met, were offered:
  - in the opponent's chain window on a Spell Speed 1 link;
  - in the POINT window after the opponent's Normal Summon.
- **U12 test on the unfixed build:** 3 FAIL / 7 PASS. The failures are exactly the defect: the chain-window offer, the summon-POINT offer, and the invariant sweep flagging the 5 Spells.

## Requirement closure record

- **Requirement.** Chain windows and POINT (response) windows offer only Spell Speed 2 and higher activations.
  - A Spell Speed 1 effect, such as the on-field effect of a face-up Continuous or Field Spell, can only be activated in an open game state: the controller's own Main Phase with an empty chain.
  - This is basic game rules.
- **Root cause: INTEGRATION_MISSING.** `getChainResponsesV2` required quick effects or Spell Speed 2 for monster responses, but filtered Spell and Trap responses only by `ss<top`. So a Spell Speed 1 response passed on an empty or Spell Speed 1 chain, and POINT windows reuse the same list.
- **Closure.** In `getChainResponsesV2`, every response source also needs `ss≥2`. `pointResponsesV27` inherits this.
  - Every legitimate response source is Spell Speed 2 or higher in `scriptSpellSpeed`: Traps (Counter Traps 3), Quick-Play Spells, and quick-effect monsters.
  - The own-turn open-state path (`getLegalZoneActions`) is unchanged.
  - The MANUAL `reactableCards` list is out of scope.
- **Consumers.** DUEL chain windows (`openChainPriorityV2`), POINT windows (`processPointV27` / `pointResponsesV27`), and everything that lists responses through `getChainResponsesV2`.
- **Recovery.** 六武の門, 六武衆の結束, 暗黒界の門, カラクリ解体新書 and 神の居城－ヴァルハラ are no longer offered illegally. No status change.
- **Dependent classification.**
  - **① Covered.** A name-free invariant sweep checks every scripted face-up Continuous/Field Spell with `resolve`: none is listed on a Spell Speed 1 chain, even with legality forced. There is also a real-path check on ヴァルハラ.
  - **② Next unit, U13 FIELD_EFFECT_RESPONSE_REACHABILITY.** Spell Speed 2 on-field effects of face-up Continuous Traps are still never listed, because `hasFieldActivatableEffect` requires `fieldIgnition` for legacy scripts and rejects unified cards. That affects about 8 cards: 零式魔導粉砕機, 強制終了, 漆黒のパワーストーン, サンダー・ボトル, 木遁封印式, 水遁封印式, 死霊の巣 and ビーストライザー.
    - U12 had to come first. Otherwise widening that gate would also admit Spell Speed 1 Spells.
  - **③ Ruling unresolved.** None.
- **Practical effect.**
  - In real duels, a player is no longer offered 六武の門, 暗黒界の門, ヴァルハラ and similar effects during the opponent's chain or summon response windows, where activating them is illegal.
  - The controls still work: set Quick-Play Spells and Traps, and set Continuous Trap card activation.

## Changed files

- `engine/30_processor_chain_battle.js`: in `getChainResponsesV2`, responses need `ss≥2`.
- `tools/test_s03_u12_response_spell_speed.js`: new; wired into `tools/check.py`.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The edit was applied by a guarded transform (exactly one match, or nothing is written). `dist/*.html` were not edited by hand.

## Verification

- **`node tools/test_s03_u12_response_spell_speed.js`.** EXIT 0, 10 PASS. It covers:
  - no ヴァルハラ offer in the opponent's chain window, or in the summon POINT window;
  - controls: a set サイクロン in both windows, and a set アイスバーン card activation;
  - ヴァルハラ's own-turn effect offered and resolved, with Replay OK;
  - the invariant sweep.
- **Regressions on the U12 build.** All EXIT 0 (name, PASS): s03_u01_raioh_lock 56; s03_u02_effect_count 76; s03_u03_dragunity 57; s03_u04_lock_recovery 39; s03_u05_search_flags 46; s03_u06_rabbit_opponent 21; s03_u07_spell_to_grave 32; s03_u08_journaled_flags 34; s03_u09_offer_legality 18; s03_u10_card_activation 33; s03_u11_exclusion_restriction 12; s03_vs1_dragunity_slice 21; device_paths_v351 17.
- **Full gate.** `python tools/check.py`: EXIT 0, **11918 PASS / 0 FAIL**; S03 audit off-target status changes = 0. This is the second run. The first run failed at `s03_status_audit.py` (暗黒界の門 IMPLEMENTED → TESTED) because the U12 test's header comment named that card; `script_coverage.py` matches names anywhere in `tools/test*.js`. The comment was rewritten without the name, and nothing was published from the failed run (`s03_u12_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json` EXIT 0.

## Coverage

- TESTED 2064 / ENGINE_GAP 616 / NOT_STARTED 1304 / IMPLEMENTED 187 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2251.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `223720660f980468a6a971c0c3d267aab4d6bd728bcc85464ef0d0bd3be5de3b` (601 files).
