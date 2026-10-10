# S03-U23 C-S03-20 BATTLE_DESTROY_TRIGGER_TIMING (Claude)

Base: `checkpoint_claude_s03_u22_damage_step_trigger_stat_change_20260912.zip`, SHA256 `c0bb48401aee7dc2ba5a6fc71cf72d598f4f9b7acc1d5ceb9328416e5842da9e`.

## How it was found

- **U22 probe.** ヘル・ツイン・コップ destroying ワイト, and 電磁ミノ虫 destroyed by ジェネティック・ワーウルフ, were never offered as triggers (no event, no chain block).
- **Source measurement.**
  - The damage-step event collection gives a script its `onDamageStep` event only at its declared `dsTiming` (`(sc.dsTiming||'leave')!==step` → skip).
  - At ④ 'after' (ダメージ計算後) a destroyed monster is still on the field; battle destruction is only confirmed (`battleDestroyed`). It moves to the GY at ⑤ 'leave' (`BATTLE_CLEANUP`).
  - `c7KilledFoe` (cards/C0) requires the destroyed opponent **in the GY**, and all six of its consumers declare 'after'.
  - `a3SelfBattleDestroyed` (cards/A3) requires the card itself in the GY. Thirty of its consumers use the default 'leave' and work; 電磁ミノ虫 alone declares 'after'.
  - So these seven scripts could never meet their condition at their timing.
- **What-if probe (in-memory `dsTiming='leave'`, real ATTACK path).** All seven are offered and resolve as their text says, and all Replays pass. In the probe フレムベル・ヘルドッグ was not offered only because its Deck had no legal FIRE target.
- **Text timing.** 「戦闘で（相手）モンスターを破壊し墓地へ送った時」 and 「このカードが（モンスターとの）戦闘で破壊された場合」 describe the state after the destroyed monster has been sent to the GY, which is damage step ⑤.

## Measurement before the fix (U22 build)

The U23 test on the U22 build gave **9 PASS / 7 FAIL**: all seven consumers fail (none is offered). The eight Replay audits and the ファイターズ・エイプ control pass.

## Requirement closure record

- **Requirement.** Battle-destruction triggers whose condition needs the destroyed monster in the GY are offered at ⑤, after it has been sent there, and resolve as their text says.
- **Root cause (TIMING_DECLARATION).** The seven scripts declared `dsTiming:'after'` (④) while their condition looks at the GY (true only from ⑤).
- **Closure.** `dsTiming:'leave'` for:
  - `cards/C0_auto_cycle18.js`: ハイドロゲドン, フレムベル・ヘルドッグ, A・O・J リーサル・ウェポン, ライトニング・ウォリアー, ヘル・ツイン・コップ, ワーム・ウォーロード;
  - `cards/B5_auto_cycle13.js`: 電磁ミノ虫.
  - Each carries an S03-U23 comment. No engine change.
- **Consumers.** The seven scripts above.
- **Recovery.** No status change (all TESTED). They now work in real duels.
- **Dependent classification.**
  - **① Covered by the real-path test (each with a Replay audit):**
    - ヘル・ツイン・コップ: ATK 3000 and 2 attacks this turn;
    - ワーム・ウォーロード: 2 attacks;
    - ライトニング・ウォリアー: +600 for 2 cards in hand;
    - ハイドロゲドン: Special Summons 「ハイドロゲドン」 from the Deck;
    - フレムベル・ヘルドッグ: Special Summons アイツ from the Deck;
    - A・O・J リーサル・ウェポン: draws 1 after destroying a LIGHT monster;
    - 電磁ミノ虫: destroyer at 1500 / 0;
    - control: ファイターズ・エイプ (「破壊した場合」, still at ④).
  - **② Remaining.**
    - ワーム・ウォーロード's 「戦闘で破壊した効果モンスターの効果は無効化される」 is scripted inside the same trigger; its timing relative to the destroyed monster's own trigger is not checked.
    - Scripts that use other GY-based helpers with 'after' were not found by this scan (only `c7KilledFoe` / `a3SelfBattleDestroyed` / `a3BattleOther` were scanned).
    - ジュラック・ティラヌス (「破壊し墓地へ送った時」) uses a flag-based condition and still resolves at ④, one step early. The result is the same in a plain battle.
  - **③** None.
- **Practical effect.** ヘル・ツイン・コップ, ライトニング・ウォリアー, ハイドロゲドン, フレムベル・ヘルドッグ, A・O・J リーサル・ウェポン, ワーム・ウォーロード and 電磁ミノ虫 now use their battle-destruction effects in a duel.

## Changed files

- `cards/C0_auto_cycle18.js`: six `dsTiming` declarations.
- `cards/B5_auto_cycle13.js`: 電磁ミノ虫 `dsTiming`.
- `tools/test_s03_u23_battle_destroy_trigger_timing.js`: new; wired into `tools/check.py` after U22.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The edits were applied by a guarded transform (exactly-once patterns including each `defineScript` line; `--dry` first; scratchpad `u23_transform.py`). `dist/*.html` were not edited by hand. Every card named in the test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_u23_battle_destroy_trigger_timing.js`.** EXIT 0, 16 PASS. On the U22 build: 9 PASS / 7 FAIL.
  - Regression suites on the same build: `test_auto_cycle01` (112), `04` (96), `06` (136), `13` (160), `18` (51), U17 (20), U20 (16), U21 (11), U22 (16), VS4 (25): all EXIT 0.
- **Full gate.** `python tools/check.py`: EXIT 0, **12189 PASS / 0 FAIL** (U22's 12173 + U23 16). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u23_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2253.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `d831b3e2b3f8b6cd5b757085f8674c3182cb5b6fc54bc57d90dd38d825cd6fab` (637 files).
