# S03-U24 C-S03-20 extension BATTLE_DESTROY_TRIGGER_TIMING (2) (Claude)

Base: `checkpoint_claude_s03_vs5_battle_trigger_slice_20260912.zip`, SHA256 `5ddb51615a20e63e34c3e741400b0893ab7f18f7964d6e30436f0844688324ce`.

## How it was found

- **Follow-up of U23 ②.** U23 fixed the seven scripts that use `c7KilledFoe` / `a3SelfBattleDestroyed` with `dsTiming:'after'`.
- **Scan (U23 build, during the VS5 gate).** 18 more TESTED scripts declare 'after' and read the GY in their condition, directly or through a battle+GY helper.
- **Two real-path probes, each script as scripted vs in-memory `dsTiming='leave'`.** Replays OK in every run.
  - **False positives (7, already work at 'after', unchanged):** ダークブレイズドラゴン, ジュラック・スピノス, ヘルウェイ・パトロール, ブルーサンダーT45, アーマード・サイキッカー, ファイナルサイコオーガ, ガスタ・コドル.
  - **Never offered as scripted; 'leave' fixes them (8):**
    - ハイドロ・ジェネクス (+300 LP)
    - ブレイン・クラッシャー (End Phase Special Summon scheduled)
    - レプティレス・スキュラ (the ATK-0 monster Special Summoned from the GY)
    - スパイダー・スパイダー (an insect Special Summoned from its GY)
    - ダーク・パーシアス (banish a DARK monster, draw 1)
    - ブロッサム・ボンバー (burn equal to the destroyed monster's ATK)
    - カース・サイキック (destroy the attacker, Level × 300)
    - 時の機械－タイム・マシーン (the destroyed monster returns)
  - **Not probed:** 漆黒の魔王 LV4, アルカナフォースVII－THE CHARIOT, BF－激震のアブロオロス.
- **Cause.** Same as C-S03-20: at ④ 'after' the destroyed monster is still on the field, while these conditions need it (or the GY state after battle destruction) at ⑤.

## Measurement before the fix (VS5 build)

The U24 test on the VS5 build gave **10 PASS / 8 FAIL**:
- all eight consumers fail: none is offered and no effect applies;
- the nine Replay audits and the ダークブレイズドラゴン control pass.

## Requirement closure record

- **Requirement.** As C-S03-20: battle-destruction effects whose condition reads the GY are offered at ⑤ and resolve as their text says.
- **Root cause (TIMING_DECLARATION).** Eight more scripts declared `dsTiming:'after'` with a GY-based condition.
- **Closure.** `dsTiming:'leave'`, each with an S03-U24 comment, in:
  - `cards/B6_auto_cycle14.js`: ハイドロ・ジェネクス;
  - `cards/B5_auto_cycle13.js`: スパイダー・スパイダー, ブレイン・クラッシャー;
  - `cards/C0_auto_cycle18.js`: ブロッサム・ボンバー;
  - `cards/C5_auto_cycle23.js`: レプティレス・スキュラ;
  - `cards/C6_auto_cycle24.js`: ダーク・パーシアス;
  - `cards/E1_auto_cycle39.js`: カース・サイキック, 時の機械－タイム・マシーン.
  - No engine change. Contract C-S03-20 extended.
- **Consumers.** The eight scripts above.
- **Recovery.** No status change (all TESTED). They now work in real duels.
- **Dependent classification.**
  - **① Covered by the real-path test (each with a Replay audit):** the eight consumers, including the three set traps, which are offered to P1 as damage-step trigger events. Control: ダークブレイズドラゴン.
  - **② Remaining.**
    - 漆黒の魔王 LV4, アルカナフォースVII－THE CHARIOT and BF－激震のアブロオロス are not probed.
    - ブレイン・クラッシャー: the End Phase Special Summon itself is not asserted beyond the schedule entry.
  - **③** None.
- **Practical effect.** Eight more monsters and traps use their battle-destruction effects in a duel.

## Changed files

- The six card files listed above (eight declarations).
- `tools/test_s03_u24_battle_destroy_trigger_timing_2.js`: new; wired into `tools/check.py` after VS5.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The edits were applied by a guarded transform (exactly-once patterns including each `defineScript` line; `--dry` first; scratchpad `u24_transform.py`). `dist/*.html` were not edited by hand. Every card named in the test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_u24_battle_destroy_trigger_timing_2.js`.** EXIT 0, 18 PASS. On the VS5 build: 10 PASS / 8 FAIL.
  - Test-side correction during the run: the trap check first looked only at the chain-response list. The engine offers these set traps as damage-step trigger events, so the check now accepts either path and verifies the chain block.
  - Regression suites on the same build: `test_auto_cycle13` (160), `14` (112), `18` (51), `23` (66), `24` (94), `39` (51), U22 (16), U23 (16), VS5 (16): all EXIT 0.
- **Full gate.** `python tools/check.py`: EXIT 0, **12223 PASS / 0 FAIL** (VS5's 12205 + U24 18). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u24_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2253.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `9d9b6f65da64df8d743bc00f244e0b4681eef88c2d711e6bec43d2403aa82004` (641 files).
