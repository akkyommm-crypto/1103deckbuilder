# S03-U21 C-S03-18 BATTLE_CONTEXT_REPLAY (Claude)

Base: `checkpoint_claude_s03_u20_vs4_battle_damage_slice_20260912.zip`, SHA256 `41d668172aa6ea4a8068d5af2ed8a1523cea6f802e3aac96b53c7c4be82ed30b`.

## How it was found

- **Follow-up of U20 ②.** The U20 Replay audit showed that ボマー・ドラゴン's damage hook read `gameState.battle` inside the ATTACK reducer and diverged in Replay.
- **Scan (U20 build).**
  - About 60 card hooks read `gameState.battle`, directly or through helpers (`a5IsAttackerCard`, `a5BattleOtherOf`, `a5InDamageStep`, …).
  - The ones evaluated inside the ATTACK reducer (③ damage calculation) are `continuous.apply` (damage-step ATK changes), `battleDamage` and `piercingDamage`.
- **Probe (scratchpad, real ATTACK path, Replay audit).**
  - ダッシュ・ウォリアー attacking, エトワール・サイバー attacking directly and ネコ耳族 attacked on the opponent's turn: correct live results, but a Replay digest mismatch at the ATTACK action.
  - A plain battle and 光神機－轟龍's piercing replayed correctly.
- **Cause.**
  - `startBattle` and the damage-step processor set `gameState.battle` outside Actions.
  - The `ATTACK` action carried only `{player, atkIdx, target, declaredAttackCount}`, so Replay calculated the battle without the context.
  - `gameState.battle` is not part of the state digest; only the results differed.

## Measurement before the fix (U20 build)

The U21 test on the U20 build gave **6 PASS / 5 FAIL**:
- every live result and the control pass;
- the Replay audits of ダッシュ・ウォリアー, エトワール・サイバー, ネコ耳族 and the two-attack Battle Phase fail at the ATTACK action;
- the journaled ATTACK carries no battle context.

## Requirement closure record

- **Requirement.** A battle whose damage calculation depends on the damage-step context replays to the same result.
- **Root cause (JOURNAL_MISSING).** The damage-step battle context read inside the ATTACK reducer was not part of the Action.
- **Closure.**
  - **`engine/1Q_battle_context_replay_s03.js` (new):**
    - `battleContextSnapshotS03(b)` makes a JSON snapshot: primitives and arrays of primitives; `flippedCard` becomes its uid.
    - `installBattleContextS03(gs,a)` places the snapshot only when `gs.battle` is absent (Replay).
    - `restoreBattleContextS03` puts the previous value back.
  - **`engine/00_state_actions.js` `applyAction`:** installs before the reducer and restores in `finally`.
  - **`engine/30_processor_chain_battle.js` and `engine/60_damage_segoc_ui_helpers.js`:** both ATTACK dispatch sites attach `battleCtxS03`, the context at damage calculation (`step:'calc'`).
  - Live play is unchanged, because `gs.battle` is already set. Packages without the field replay as before.
- **Consumers.** Damage-step ATK changes read in damage calculation (ダッシュ・ウォリアー, エトワール・サイバー, ネコ耳族, 太陽の戦士, 月の女戦士, 空の昆虫兵, カイザー・グライダー, ディスクライダー, 7つの武器を持つハンター, サブマリンロイド, D－チェーン, …), damage hooks (ボマー・ドラゴン's fallback, クロスカウンター, ダメージ・ダイエット) and piercing hooks (光神機－轟龍, ランサー・デーモン).
- **Recovery.** No status change. Real duels with these cards now pass the Replay audit.
- **Dependent classification.**
  - **① Covered by the real-path test:** ダッシュ・ウォリアー, エトワール・サイバー (direct), ネコ耳族 (opponent's turn), two attacks in one Battle Phase (no leak between battles), the journaled context, and a control.
  - **② Remaining.**
    - Hooks that read card objects inside the context other than `flippedCard` are not covered by the snapshot. The current `gameState.battle` fields hold no other card objects.
    - Actions other than ATTACK that read `gameState.battle` inside a reducer are not yet measured.
    - Test-side: the U17 test's "no chain link was ever added" check filters `pkg.actions` on `x.type`, but package entries wrap the action (`x.action`), so that assertion is vacuous. It needs a correction; the U17 behaviour itself is unchanged.
  - **③** None.
- **Practical effect.** Replays and Replay audits of duels in which these monsters battle now reproduce the game.

## Changed files

- `engine/1Q_battle_context_replay_s03.js`: new; registered in `build_manifest.json`.
- `engine/00_state_actions.js`: `applyAction` install/restore.
- `engine/30_processor_chain_battle.js`, `engine/60_damage_segoc_ui_helpers.js`: `battleCtxS03` on ATTACK.
- `tools/test_s03_u21_battle_context_replay.js`: new; wired into `tools/check.py` after VS4.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The edits were applied by a guarded transform (exactly-once patterns; `--dry` first; scratchpad `u21_transform.py`). `dist/*.html` were not edited by hand. Every card named in the test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_u21_battle_context_replay.js`.** EXIT 0, 11 PASS. On the U20 build: 6 PASS / 5 FAIL.
  - Test-side corrections during the run: create cards after the reset; read journaled actions through the package entry's `action`.
  - Regression suites on the same build: U20 (16), VS4 (25), `test_auto_cycle03` (72), `04` (96), `06` (136), `10` (104), `15` (126), `36` (57): all EXIT 0.
- **Full gate.** `python tools/check.py`: EXIT 0, **12157 PASS / 0 FAIL** (U20's 12146 + U21 11). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u21_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2253.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `383879677c916a589731dcb7891f53cc89a51002138fbf73743266f31bfcae20` (632 files).
