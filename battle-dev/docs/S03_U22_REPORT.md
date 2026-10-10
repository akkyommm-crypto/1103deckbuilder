# S03-U22 C-S03-19 DAMAGE_STEP_TRIGGER_STAT_CHANGE (Claude)

Base: `checkpoint_claude_s03_u21_battle_context_replay_20260912.zip`, SHA256 `fce3a3f2e97469fd08bde23659147f5b07e3e9492e0346709b4aaa1df0ae180f`.

## How it was found

- **C-S03-18 ② probe (U21 build).** Battles followed by journaled trigger resolution replayed correctly. However, ロケット戦士 ② 「このカードがモンスターに攻撃したダメージ計算後に発動する。攻撃対象モンスターの攻撃力はターン終了時まで500ダウン」 was chained and resolved, yet its target kept its ATK, with the toast 「ダメージ計算時以降は攻守を変更できません」.
- **Source measurement.**
  - `canModifyNow` (engine/60) implements 「フリーチェーンの攻守変動は②ダメージ計算前まで」 and is checked when the effect resolves (`API.modAtk`, manual `applyMod`).
  - Only the manual activation path sets `ACTIVE_SCRIPT`. During chain resolution it is null, so every chain block was judged by the free-chain rule (`quickMod`), which is false from damage calculation onward.
  - Chain blocks carry `eventName: null` for normal/quick activations and the trigger event (e.g. `onDamageStep`) for triggers, so the kind of block is known at resolution.
- **Ruling sources (2011 wiki).**
  - ヘル・ツイン・コップ: 「このカードの誘発効果の効果解決時に攻撃力が上がります」, also on the opponent's turn.
  - ファイターズ・エイプ: the ATK-up after battle destruction is a trigger effect that creates a chain block.
  - Damage-step trigger effects therefore change ATK/DEF when they resolve.
- **Dependents (scan).** 16 TESTED scripts are damage-step triggers that call `modAtk`:
  - after damage calculation / battle destruction: 電磁ミノ虫, ダークブレイズドラゴン, ヘル・ツイン・コップ, ファイターズ・エイプ, ジュラック・プティラ, ジュラック・ティラヌス, サテライト・キャノン, BF－激震のアブロオロス, デス・ヴォルストガルフ, ロケット戦士;
  - damage calculation (damageStepOnly): ハーフ・カウンター, ジェム・マーチャント, ガード・ヘッジ;
  - others: BF－アーマード・ウィング (end), スピリット・ドラゴン (start), カース・オブ・ヴァンパイア.

## Measurement before the fix (U21 build)

The U22 test on the U21 build gave **3 PASS / 4 FAIL**:
- ファイターズ・エイプ stays at 1900 (expected 2200);
- ジュラック・ティラヌス stays at 2500 (expected 2800);
- ロケット戦士's target stays at 2000 (expected 1500);
- the resolving-block marker does not exist.

The three Replay audits pass.

## Requirement closure record

- **Requirement.** A trigger effect activated in the damage step changes ATK/DEF when it resolves, at any step. Free-chain ATK/DEF changes stay limited to before damage calculation, and damageStepOnly effects to damage calculation.
- **Root cause (INTEGRATION_MISSING).** The damage-step stat-change rule was checked at resolution without knowing which kind of chain block was resolving.
- **Closure.**
  - **`engine/1R_damage_step_resolution_s03.js` (new):**
    - `beginLinkResolutionS03(link, sc)` / `endLinkResolutionS03()` record the resolving block's `eventName` and `damageStepOnly`.
    - `damageStepModifyAllowedS03(info)` gives true for a trigger block, `info.dsOnly` for a damageStepOnly block, and null otherwise (the existing rule applies).
  - **`engine/30_processor_chain_battle.js`:** `resolveOnePreparedLinkV27` sets the marker before `sc.resolve`. `processChainEndV30` clears it. The marker survives a choice inside the resolution until the next block starts or the chain ends.
  - **`engine/60_damage_segoc_ui_helpers.js` `canModifyNow`:** consults the marker before the existing `ACTIVE_SCRIPT` / `quickMod` rule.
- **Consumers.** The 16 scripts above.
- **Recovery.** No status change (all TESTED). Their damage-step ATK/DEF changes now apply in real duels.
- **Dependent classification.**
  - **① Covered by the real-path test:** ファイターズ・エイプ (2200), ジュラック・ティラヌス (2800) and ロケット戦士 (target 1500; not destroyed and no damage in its own Battle Phase), each with a Replay audit.
  - **① Covered by the rule checks:**
    - outside a chain: after → refused, before → allowed;
    - trigger block: after / end → allowed;
    - free-chain block: after → refused, before → allowed;
    - damageStepOnly block: calc → allowed, after → refused;
    - marker cleared at chain end.
  - **② Remaining.**
    - The damageStepOnly consumers (ハーフ・カウンター, ジェム・マーチャント, ガード・ヘッジ) are covered by the rule checks but not path-tested; their activation needs a damage-calculation response window in the test harness.
    - ヘル・ツイン・コップ destroying a monster and 電磁ミノ虫 destroyed by battle are **never offered** as triggers. This is a separate defect, measured in this unit's probe and not yet classified.
    - The manual (non-chain) `applyMod` path is unchanged.
  - **③** None.
- **Practical effect.** In a duel, ロケット戦士 lowers its attack target, and ファイターズ・エイプ and ジュラック・ティラヌス gain ATK after destroying a monster, as their text says.

## Also in this checkpoint (test-side)

- `tools/test_s03_u17_chainless_procedures.js`: the "no chain link was ever added" check read `entry.type`, but Replay package entries wrap the action (`entry.action.type`), so it could not fail. It now reads `entry.action`. Measured beforehand: it still passes (20 PASS); the three procedures add no chain block.

## Changed files

- `engine/1R_damage_step_resolution_s03.js`: new; registered in `build_manifest.json`.
- `engine/30_processor_chain_battle.js`: marker set / cleared.
- `engine/60_damage_segoc_ui_helpers.js`: `canModifyNow` consults the marker.
- `tools/test_s03_u22_damage_step_trigger_stat_change.js`: new; wired into `tools/check.py` after U21.
- `tools/test_s03_u17_chainless_procedures.js`: journal filter correction.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The engine edits were applied by a guarded transform (exactly-once patterns; `--dry` first; scratchpad `u22_transform.py`). `dist/*.html` were not edited by hand. Every card named in the test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_u22_damage_step_trigger_stat_change.js`.** EXIT 0, 16 PASS. On the U21 build: 3 PASS / 4 FAIL.
  - Regression suites on the same build: U17 (20), U20 (16), U21 (11), VS4 (25), and `test_auto_cycle` 12 (98), 13 (160), 15 (126), 17 (81), 18 (51), 22 (50), 29 (67), 30 (70), 33 (69), 35 (57), 36 (57): all EXIT 0.
- **Full gate.** `python tools/check.py`: EXIT 0, **12173 PASS / 0 FAIL** (U21's 12157 + U22 16). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u22_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2253.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `19b224b1d41ac67a208259d7dba6fde176b39fe4deaaa3ccd8ead85866835773` (635 files).
