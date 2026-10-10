# S03-U26 C-S03-22 DAMAGE_STEP_END_AFTER_DESTRUCTION (Claude)

Base: `checkpoint_claude_s03_u25_battle_destroyed_effect_negation_20260912.zip`, SHA256 `ca1593b2d01bb247fa2ecc945791a7920c7eb1dd30e6878a92930c594e95f476`.

## How it was found

- **Damage-step reachability sweep (during the U25 gate).** All 204 monster scripts with `passive.onDamageStep` were run in three standard real-path battles; 93 were never offered.
- **Text triage.** Most need a board condition the standard battles lack. Two groups needed outcome checks instead of offer checks: chainless end-of-damage-step effects, and unconditional ones.
- **Outcome probe (U25 build, real path, Replays OK).** It split cleanly by battle side:
  - **Works as the defender:** ゴロゴル, ケルベク, 幻影の壁, 霞の谷の戦士, ハイパーハンマーヘッド, 伝説の柔術家, 針千本, 針二千本.
  - **Fails as the attacker (never offered):** 電動刃虫, アックス・ドラゴニュート, スピア・ドラゴン, パワー・ブレイカー, ライライダー, アマゾネスの賢者.
- **Source measurement.**
  - `processDamageStepV27` stage 'enter' calls `syncBattleIndicesV28()` for every step and ends the damage step when a combatant is no longer in the Monster Zone ("combatant left field").
  - At ⑥ 'end', `BATTLE_CLEANUP` has already sent battle-destroyed monsters to the GY (⑤). So after every battle destruction the end-of-damage-step window was never opened.
  - All failing cases destroyed a monster; all working cases had both combatants survive.
  - The conditions themselves were fine: `battleContextV28` falls back to the journaled `lastBattle` cards.

## Measurement before the fix (U25 build)

The U26 test on the U25 build gave **8 PASS / 5 FAIL**, measured with パワー・ブレイカー still in the test:
- the five destroying attackers fail (none is offered);
- the six Replay audits and both controls pass.

## Requirement closure record

- **Requirement.** After damage calculation, the end of the damage step (⑥) takes place even when a monster destroyed in the battle has already been sent to the GY, so 「ダメージステップ終了時」 effects of the attacking monster apply. A combatant leaving **before** damage calculation still ends the battle.
- **Root cause (FLOW_ABORT).** The ⑥ entry reused the before-calculation "combatant left" abort.
- **Closure.**
  - **`engine/30_processor_chain_battle.js` `processDamageStepV27`:** at stage 'enter' the abort is skipped when `step==='end' && b.battled===true`. The end-of-damage-step window then opens with the `lastBattle` context.
  - No card change.
- **Consumers.** 電動刃虫, アックス・ドラゴニュート, スピア・ドラゴン, アマゾネスの賢者. Any other end-of-damage-step effect of a monster whose battle destroyed a monster benefits too.
- **Recovery.** No status change (all TESTED). Their effects now apply in real duels.
- **Dependent classification.**
  - **① Covered by the real-path test (each with a Replay audit):**
    - 電動刃虫: the opponent draws 1;
    - アックス・ドラゴニュート, スピア・ドラゴン: Defense Position;
    - アマゾネスの賢者: destroys the set サイクロン;
    - control ゴロゴル (no destruction): the attacker turned face-down; the battle closes normally.
  - **② Remaining.**
    - パワー・ブレイカー: its script applies the Defense Position change at the end of the Battle Phase (`onBattlePhaseEnd`), because its single `dsTiming` serves its other effect. Per-effect damage-step timing in one script is needed; removed from this test.
    - ライライダー when it is itself destroyed: not tested (no 2011 ruling found for the lock in that case).
    - The remaining never-offered sweep entries are classified as board-condition cases and are not probed individually.
  - **③** None.
- **Practical effect.** In a duel, 電動刃虫 makes the opponent draw, アックス・ドラゴニュート and スピア・ドラゴン switch to Defense Position, and アマゾネスの賢者 destroys a Spell/Trap, also after destroying a monster.

## Changed files

- `engine/30_processor_chain_battle.js`: ⑥ entry after damage calculation.
- `tools/test_s03_u26_damage_step_end_after_destruction.js`: new; wired into `tools/check.py` after U25.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The edit was applied by a guarded transform (exactly-once pattern; `--dry` first; scratchpad `u26_transform.py`). `dist/*.html` were not edited by hand. Every card named in the test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_u26_damage_step_end_after_destruction.js`.** EXIT 0, 11 PASS. On the U25 build: 8 PASS / 5 FAIL (with パワー・ブレイカー).
  - Test-side correction: パワー・ブレイカー was removed after its script timing was found to be a separate item.
  - Regression suites on the same build: U20–U25, VS1–VS5, `test_auto_cycle` 05 / 06 / 07 / 08 / 12 / 13 / 18 — all EXIT 0.
- **Full gate.** `python tools/check.py`: EXIT 0, **12247 PASS / 0 FAIL** (U25's 12236 + U26 11). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u26_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2253.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `315e8188afc153c8279bdbd5d3b213ef79836670dfb9af50a44251cb62bc670f` (647 files).
