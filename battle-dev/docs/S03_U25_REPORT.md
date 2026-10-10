# S03-U25 C-S03-21 BATTLE_DESTROYED_EFFECT_NEGATION (Claude)

Base: `checkpoint_claude_s03_u24_battle_destroy_trigger_timing_2_20260912.zip`, SHA256 `5d48de9f7e1f29503193ad89b199048fca42d1f8494a0be23213f88eb12b47d8`.

## How it was found

- **U24 probe 3.** 漆黒の魔王 LV4 destroyed 紫炎の足軽, and 紫炎の足軽 still activated its battle-destruction trigger and Special Summoned 六武衆の露払い. The text 「このカードが戦闘によって破壊した相手モンスターの効果は無効化される」 should prevent this.
- **Text scan.** Three TESTED cards have this kind of effect: 漆黒の魔王 LV4, ワーム・ウォーロード and エレメント・デビル (EARTH condition). Twelve NOT_STARTED / ENGINE_GAP cards are out of scope.
- **Ruling sources (2011 wiki).**
  - ワーム・ウォーロード: the negation is a continuous effect; in mutual destruction it cannot negate effects conditioned on 「戦闘破壊された」 (11/07/18).
  - 漆黒の魔王 LV6: 「発動した《キラー・トマト》の効果を無効にし戦闘破壊した場合」 (10/12/15) — the destroyed monster's trigger is activated and its effect is negated.
- **Source measurement.**
  - 漆黒の魔王 LV4 and エレメント・デビル resolved at ④ and put FX_NEGATE (`card.negated`) on the destroyed monster while it was still on the field. `negated` is in `ZONE_LOCAL_KEYS`, so `BATTLE_CLEANUP` erased it when the monster was sent to the GY.
  - Chain resolution checked a source's negation only for monster-zone links (`link.from==='mz'`).
  - `graveInfo` did not record the destroying card.

## Measurement before the fix (U24 build)

The U25 test on the U24 build gave **9 PASS / 4 FAIL**:
- fail: 漆黒の魔王 LV4's negation and its destroyer record, ワーム・ウォーロード, and エレメント・デビル with an EARTH monster on the field (each time 紫炎の足軽 Special Summons);
- pass: エレメント・デビル without EARTH, the mutual-destruction case, the control, and all Replay audits.

## Requirement closure record

- **Requirement.** While the destroying monster is face-up on the field, the effect that the monster it destroyed by battle activates from the GY is negated (activated, then negated). There is no negation in mutual destruction, and only effect monsters are affected.
- **Root cause (STATE_LOST + INTEGRATION_MISSING).** The negation was stored as a zone-local flag that battle cleanup erases, and GY-activated links were never checked.
- **Closure.**
  - **`engine/1S_battle_destroyed_negation_s03.js` (new):**
    - `declareBattleDestroyedNegatorS03(name, spec)` (`effectOnly` default, optional `condition`);
    - `battleNegatorUidForVictimS03(gs, victim)` returns the destroyer from the journaled `lastBattle` uids, only when the destroyer was not destroyed and is declared;
    - `battleDestroyedLinkNegatedS03(link, srcCard)`.
  - **`engine/00_state_actions.js` `BATTLE_CLEANUP`:** writes `graveInfo.battleNegatorUidS03`, only for declared destroyers, so other battles' digests are unchanged.
  - **`engine/30_processor_chain_battle.js` `resolveOnePreparedLinkV27`:** `effectNegatedNow` also includes `battleDestroyedLinkNegatedS03`. It applies when the source was recorded this turn and is in the GY, and the recorded destroyer is face-up in the Monster Zone, not effect-negated, and meets the spec.
  - **`cards/H6_claude_s03_battle_destroyed_negation.js` (new):** declares 漆黒の魔王 LV4, ワーム・ウォーロード, and エレメント・デビル (condition: an EARTH monster face-up on the field, checked at resolution).
- **Consumers.** 漆黒の魔王 LV4, ワーム・ウォーロード, エレメント・デビル.
- **Recovery.** No status change (all TESTED). Their negation now works in real duels.
- **Dependent classification.**
  - **① Covered by the real-path test (each with a Replay audit):**
    - 漆黒の魔王 LV4, ワーム・ウォーロード (extra attack kept), エレメント・デビル with EARTH: 紫炎の足軽's trigger is chained and has no effect;
    - the destroyer is recorded in `graveInfo`;
    - エレメント・デビル without EARTH: not negated;
    - mutual destruction with クリッター: not negated, ワイト added;
    - control ジェネティック・ワーウルフ: summons, and `graveInfo` carries no record.
  - **② Remaining.**
    - The negation is applied to links resolved during the turn of the destruction. Later GY effects of the same card (e.g. on a later turn) are not covered.
    - The destroyer leaving the field before resolution ends the negation (continuous effect); not tested.
    - The NOT_STARTED / ENGINE_GAP cards with the same text are not declared.
    - 漆黒の魔王 LV4's LV-up still records its kill turn by its own trigger at ④ (unchanged).
  - **③** None.
- **Practical effect.** In a duel, monsters destroyed by 漆黒の魔王 LV4, ワーム・ウォーロード or エレメント・デビル (with EARTH) no longer get their battle-destruction effects.

## Changed files

- `engine/1S_battle_destroyed_negation_s03.js`: new; registered in `build_manifest.json`.
- `cards/H6_claude_s03_battle_destroyed_negation.js`: new; registered in `build_manifest.json`.
- `engine/00_state_actions.js`: `BATTLE_CLEANUP` record.
- `engine/30_processor_chain_battle.js`: resolution negation.
- `tools/test_s03_u25_battle_destroyed_effect_negation.js`: new; wired into `tools/check.py` after U24.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The engine edits were applied by a guarded transform (exactly-once patterns; `--dry` first; scratchpad `u25_transform.py`). `dist/*.html` were not edited by hand. Every card named in the test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_u25_battle_destroyed_effect_negation.js`.** EXIT 0, 13 PASS. On the U24 build: 9 PASS / 4 FAIL.
  - Implementation correction before the build: the EARTH condition calls `currentAttributeV17(card)` directly (`API.attrOf` resolves through `resolveTarget`).
  - Regression suites on the same build: `test_auto_cycle12` (98), `18` (51), U20 (16), U21 (11), U23 (16), U24 (18), VS3 (22), VS5 (16): all EXIT 0.
- **Full gate.** `python tools/check.py`: EXIT 0, **12236 PASS / 0 FAIL** (U24's 12223 + U25 13). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u25_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2253.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `07745e141257ae47cfcf8495a4d5f45aedcd59df833a116e8126570e7d7e0b93` (645 files).
