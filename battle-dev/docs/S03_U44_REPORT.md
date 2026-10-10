# S03-U44 C-S03-35 TRIGGER_FORCED_PER_EFFECT (Claude)

Base: `checkpoint_claude_s03_u43_dragunity_aklys_20260913.zip`, SHA256 `d484ad9cf13db3ef24012f93ab9316ce41db5886e73061f6829a4d0275d7f849`.

## How it was found

- While implementing U43 (ドラグニティ－アキュリス), a probe showed its forced destroy trigger grouped as optional ('O') in the DUEL SEGOC.
- The SEGOC grouping (engine/40 `startEventChainV2`) and the non-DUEL forced auto path read only the script-level `sc.forced`. `collectHandlers` builds candidates without a forced flag.
- A v4 unified card that declares `forced:true` on one effect (and not on the card meta) had that trigger ranked as optional (groups 2 / 3) and **skippable**.
- 28 unified cards use effect-level `forced:true`: 悪魔の知恵, ガードペナルティ, D・コード, チュウボーン, アイヴィ・ウォール, ナイトメア・デーモンズ, スネークポット, サボウ・ファイター, 魔法吸収, 暗黒の呪縛, 連鎖炸薬, 王立魔法図書館, バベル・タワー, 魔法の操り人形, ブラッド・マジシャン－煉獄の魔術師－, ナチュル・トライアンフ, 天空聖者メルティウス, 救済のレイヤード, 人造天使, ナチュル・ビートル, 闇の芸術家, 勇気の砂時計, D・レトロエンジン, 鉄の騎士 ギア・フリード, 士気高揚, ドラグニティ－アキュリス, …
- **Classification:** INTEGRATION_MISSING (a multi-consumer engine fix, not a 1-card change).

## Measurement before (U43 build)

- `tools/test_s03_u44_trigger_forced_per_effect.js`: **5 PASS / 4 FAIL**.
  - チュウボーン's forced flip trigger was grouped rank 2 (optional) and the skip removed it: **the opponent never received the 3 チュウボーンJr.トークン** (a wrong result).
  - アキュリス's forced destroy trigger was grouped rank 3 (optional).
- Baseline of the 29 test files that name the consumers (U43 build): all pass, 0 FAIL.

## Closure

- New `engine/1ZB_trigger_forced_per_effect_s03.js` (manifest after 1Z) `triggerCandidateForcedS03(c)`: for a v4 unified script with any `forced:true` effect, the effect selected for that candidate's event (`v4SelectEffectForContext` on the candidate context and event) decides forced, falling back to `sc.forced`. Other scripts use `sc.forced` as before.
- engine/40 `startEventChainV2` uses it for the SEGOC rank and the forced flag; the non-DUEL forced auto path in `emitEvent` uses it too.
- No new gameState key or Action; Replay packages are unaffected (the ranking is not part of the digest).
- **Test** (after U43 in `tools/check.py`):
  - A: Flip Summon of チュウボーン → its trigger is the turn player's forced group (rank 0), `eventSkipGroupV2` does not skip it, and accepting it gives the opponent 3 tokens; Replay ok;
  - B: ドラグニティ－アキュリス → its summon trigger stays optional (rank 2); its destroy trigger when the equip is sent by サイクロン is forced (rank 1 for the non-turn player) and resolves; Replay ok.
  - **After: 9 PASS / 0 FAIL.**
- **Consumer regression:** the same 29 test files are unchanged versus the baseline (empty diff). The s03 status audit is unchanged.

## Real-duel check

- Forced groups can no longer be skipped, so a real-duel stall check was run on the U44 build: fixed lists v1, 12 responder duels (`0x52310201`–`0x52310206` × both first players).
  - **12 / 12** end normally with no blocker; Replay reproduces every digest; 0 refused ignition effects.
  - Unsupported only 未来融合 (documented gap).
- R1 gate test (6 duels including the fixed-list v1 case): **37 PASS / 0 FAIL**.
- Data: Claude scratchpad `r1v1_u44/`.

## Gate

- `python tools/check.py` — EXIT 0, **12607 PASS / 0 FAIL** (log `s03_u44_full_gate.log`).
- `python tools/build_acode.py data/carddata.json` — EXIT 0.
- Coverage (unchanged versus U43): TESTED 2074 / ENGINE_GAP 614 / NOT_STARTED 1302 / IMPLEMENTED 183 / PARTIAL 179 / GENERIC_OK 644 (TOTAL 4996); 0 off-target.

## Source hash

- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `aa2658f417832d0f797f09d8849abd906e93710ffb411761332dc337c383c72e` (708 files).

## Remaining

- engine/30 `effectClassV2` (a display label: TRIGGER_F / TRIGGER_O) still reads `sc.forced`. Legacy `defineScript` cards keep the script-level flag.
