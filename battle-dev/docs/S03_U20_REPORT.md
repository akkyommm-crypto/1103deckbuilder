# S03-U20 C-S03-17 BATTLE_DAMAGE_BEFORE_DESTRUCTION (Claude)

Base: `checkpoint_claude_s03_u19_monster_activation_response_20260912.zip`, SHA256 `7ab1f2215122da06d05538621376e0090dad64fde6b167e4bed9065896e63dff`.

## How it was found

- **Vertical slice #4 (VS4), due after U17–U19.** In VM2 T4, ジェネティック・ワーウルフ (2000) attacks and destroys マジック・ストライカー (600), and P1 takes 1400 battle damage. Card text ③ 「このカードの戦闘で発生する自分への戦闘ダメージは0になる」 makes it 0.
- **Source measurement.**
  - `processAttack` (engine/00_state_actions.js) calls `killDef()` / `killAtk()` before `dealDamage()`; these set `battleDestroyed`.
  - `collectSources` skips `battleDestroyConfirmed` cards, so a monster destroyed in the battle no longer supplies its `continuous.battleDamage` when the damage is calculated.
  - By the engine's own step comments, damage (③-ⅳ) comes before destruction is confirmed (③-ⅴ).
- **Ruling source.** The 2011 wiki entry on アマゾネスの格闘戦士 (backup 2010-08-30) says the monster is destroyed, and only its controller's damage becomes 0. So the self hook applies in a battle that destroys the monster.
- **Second defect, found by the U20 Replay audit.** Once destroyed monsters were no longer skipped, ボマー・ドラゴン's hook ran in its own destroying battle. It reads `gameState.battle` (through `a5IsAttackerCard`), which is set outside Actions, so the ATTACK reducer answered differently in Replay (digest mismatch at seq 2). The hook now uses `info.atkCard`.

## Measurement before the fix (U19 build)

The U20 test on the U19 build gave **10 PASS / 6 FAIL**. The failures are exactly the six consumer battles; both controls pass:
- マジック・ストライカー attacked: 1400;
- マジック・ストライカー attacking: 1400;
- レスキュー・ウォリアー attacked: 400;
- アマゾネスの格闘戦士 attacking: 500;
- モンク・ファイター pierced by E・HERO エッジマン: 1600;
- ボマー・ドラゴン attacking: 1000.

## Requirement closure record

- **Requirement.** Battle damage is calculated before battle destruction is confirmed. A monster destroyed in the battle still applies its own damage text to that battle.
- **Root cause (ORDERING).**
  - `processAttack` confirmed destruction before dealing damage (attack-position battles and piercing).
  - ボマー・ドラゴン's damage hook depended on unjournaled `gameState.battle`.
- **Closure.**
  - **`engine/00_state_actions.js` `processAttack`:** `dealDamage` runs before `killDef` / `killAtk` in the attacker-wins, attacker-loses and piercing branches. Log text and `lastBattle` are unchanged; ties are unchanged.
  - **`cards/A8_auto_cycle06.js` ボマー・ドラゴン:** `battleDamage` identifies the attacker by `info.atkCard` (falling back to `a5IsAttackerCard` only for direct calls without `atkCard`).
- **Consumers.** マジック・ストライカー, レスキュー・ウォリアー, アマゾネスの格闘戦士, モンク・ファイター, ボマー・ドラゴン.
- **Recovery.** No status change (all TESTED); their damage text now works in battles that destroy them.
- **Dependent classification.**
  - **① Covered by the real-path test:** the six consumer battles above, each with a Replay audit; controls (レスキュー・ウォリアー still deals 1300 to the opponent; ワイト takes 1700; ワイト in defense takes 2400 piercing).
  - **② Remaining.** Other `battleDamage` hooks that read `gameState.battle` (クロスカウンター) are not yet checked under Replay.
  - **③** None.
- **Practical effect.** In a duel, these monsters no longer pass damage to their controller when they are destroyed in battle.

## Changed files

- `engine/00_state_actions.js`: damage before destruction in `processAttack`.
- `cards/A8_auto_cycle06.js`: ボマー・ドラゴン hook uses `info.atkCard`.
- `tools/test_s03_u20_battle_damage_before_destruction.js`: new; wired into `tools/check.py`.
- `tools/test_s03_vs4_activation_negation_slice.js`: new (vertical slice #4, published in the same checkpoint; `docs/S03_VS4_REPORT.md`); wired into `tools/check.py` after U20.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The edits were applied by guarded transforms (exactly-once patterns; `--dry` first; scratchpad `u20_transform.py`, `u20b_transform.py`). `dist/*.html` were not edited by hand. Every card named in the tests is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_u20_battle_damage_before_destruction.js`.** EXIT 0, 16 PASS. On the unfixed U19 build: 10 PASS / 6 FAIL.
  - After the order fix alone: 15 PASS / 1 FAIL (the ボマー・ドラゴン Replay audit), which led to the hook fix.
  - Consumer unit tests on the same build: `test_auto_cycle06` (ボマー・ドラゴン), `test_auto_cycle23` (マジック・ストライカー), `test_auto_cycle12` (レスキュー・ウォリアー) and `test_class_a2_recovery_06` (アマゾネスの格闘戦士, モンク・ファイター): all EXIT 0.
- **Full gate.** `python tools/check.py`: EXIT 0, **12146 PASS / 0 FAIL** (U20 16 + VS4 25 on top of U19's 12105). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u20_vs4_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2253.
- Gated source manifest SHA256 (excluding dist/ and *.log; this report and `docs/S03_VS4_REPORT.md` set aside): `b1cc28a960b5ff160e5ecb01c88214d5b3345aae3726539589b6366be122fdae` (628 files).
