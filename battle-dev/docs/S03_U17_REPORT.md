# S03-U17 C-S03-14 CHAIN_LESS_PROCEDURE_DATA (Claude)

Base: `checkpoint_claude_s03_vs3_six_samurai_gate_slice_20260912.zip`, SHA256 `32fb02b9ee2d4f3ac84ba99d50b75163a3451f4cc706cb2746384ae08833d4be`.

## How it was found

- **U16 classification.** マジック・ストライカー, パワー・ジャイアント and 異次元の精霊 matched the COST_READS_TARGETS code shape, but were excluded from U16's declaration.
  - Their text makes them chain-less Special Summon procedures: 「…し、手札から特殊召喚できる」.
  - 異次元の精霊 is a 召喚ルール効果 (wiki 10/11/17), and its banish is part of the procedure, not a cost (10/11/15).
  - The Special Summon of パワー・ジャイアント can be negated by インヴェルズ・ローチ (11/08/12), which applies to chain-less summons.
- **Consequence.** The scripts were activated effects whose cost read the selection before it was made, so none of the three could be used in a real duel. Making the effects work would have opened chain windows that do not exist.

## Measurement before the fix (VS3 build)

- The U17 test run on the published VS3 build gave **0 PASS / 3 FAIL**, then threw at the first card.
- マジック・ストライカー in the hand offered only an effect activation (`handEffect`), plus Normal Summon and Set.
- The procedure path answered 「特殊召喚手順がありません」.

## Requirement closure record

- **Requirement.** The three cards Special Summon themselves from the hand by a chain-less summon procedure.
  - The card the procedure uses (the banished Spell, the sent monster, the banished monster) is part of the procedure.
  - The card-specific follow-up is applied on the summon, including after a save inside the summon-negation window:
    - パワー・ジャイアント lowers its level by the sent monster's level;
    - 異次元の精霊 schedules the return of the banished monster.
- **Root cause (CARD_WORK plus ENGINE_MISSING).**
  - The scripts modeled procedures as activated effects.
  - The legacy procedure path had no way to carry data from its cost to the summon, and no post-summon hook.
- **Closure.**
  - **Engine (`engine/40_legal_script_engine.js`).**
    - `finishSummonProcedure` copies a JSON `ctx.procedureDataS03`, set by the procedure cost, into `pendingSummon.resumeS03.data`.
    - The procedure commit passes it on.
    - `doSpecialFromZoneUidV370` calls `summonProcedure.afterSummonS03(handle,data)` right after `FX_SPECIAL_SUMMON` and before `onSpecialSummon`, only when data was recorded.
  - **Cards.**
    - `cards/C5_auto_cycle23.js` マジック・ストライカー: procedure banishing a GY Spell. Direct attack and battle-damage effects are kept.
    - `cards/C9_auto_cycle27.js` パワー・ジャイアント: procedure sending a hand monster of current Level 4 or lower (Star Blast cases in the wiki). The hook lowers its level by the sent monster's GY level, and the drop persists (10/07/18). The effect-damage protection is kept.
    - `cards/C7_auto_cycle25.js` 異次元の精霊: procedure banishing an own face-up monster (tokens allowed, 10/11/15). The hook schedules `d4.returnBanishedUid` for the next Standby Phase with the banished uid.
    - None of them has `resolve` any more, so the hand offers only the procedure.
- **Consumers.** The three cards. The data carry and hook are available to future procedures. Existing procedures (for example キザン) are unchanged: no data, no hook.
- **Recovery.** No status change (all three were TESTED); they now work on the real path. The `test_auto_cycle23/25/27` cases were rewritten from the effect model to the procedure model, and U16's label was updated.
- **Dependent classification.**
  - **① Covered by the real-path test:**
    - each card's hand offers the procedure and no effect;
    - マジック・ストライカー summons and can attack directly;
    - パワー・ジャイアント at Level 6 − 1 = 5, and ライオウ negation with the sent monster not returned;
    - 異次元の精霊 saved inside the ライオウ window, resumed, committed, and the banished monster returning in the next Standby Phase;
    - Replay audits with no chain link added.
  - **② Approximations kept.**
    - The return is a scheduler action, while the wiki (10/11/15) says it uses a chain block.
    - パワー・ジャイアント's level drop does not revert when its effects are negated (10/07/18).
    - With five monsters on the field, 異次元の精霊's procedure is refused by the zone check, even though banishing one would free a zone.
  - **③** None.
- **Practical effect.** マジック・ストライカー, パワー・ジャイアント and 異次元の精霊 can now be Special Summoned from the hand in a duel as rule procedures. The opponent can negate them with summon negators, and cannot chain to them as effects.

## Changed files

- `engine/40_legal_script_engine.js`: procedure data carry and post-summon hook.
- `cards/C5_auto_cycle23.js`, `cards/C9_auto_cycle27.js`, `cards/C7_auto_cycle25.js`: the three script blocks.
- `tools/test_s03_u17_chainless_procedures.js`: new; wired into `tools/check.py`.
- `tools/test_auto_cycle23.js`, `tools/test_auto_cycle25.js`, `tools/test_auto_cycle27.js`: the three cases rewritten to the procedure model.
- `tools/test_s03_u16_cost_selection_first.js`: label only.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The edits were applied by guarded transforms (exact-count patterns; `--dry` first). `dist/*.html` were not edited by hand. Every card named in the new test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_u17_chainless_procedures.js`.** EXIT 0, 20 PASS. On the unfixed VS3 build: 0 PASS / 3 FAIL, then it threw.
  - One test-side correction during the run: the 異次元の精霊 board needed decks so the turn could advance through P2's Draw Phase.
- **Rewritten and neighboring tests on the U17 build:** test_auto_cycle23 66, test_auto_cycle25 99, test_auto_cycle27 79, U16 18, U15 24 PASS (all EXIT 0).
- **Full gate.** `python tools/check.py`: EXIT 0, **12076 PASS / 0 FAIL**. The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u17_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2253.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `063656afb60954481298896e1670972aded84ffc6cc9374f98a22813f79b02e4` (619 files).
