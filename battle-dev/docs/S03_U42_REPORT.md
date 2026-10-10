# S03-U42 C-S03-34 FLIP_TIMING_WINDOW_SCOPE (Claude)

Base: `checkpoint_claude_s03_u41_resolution_choice_summon_event_20260913.zip`, SHA256 `e32a0182b35dcb7feb47ee0121b9dd224c0627a6e3112eaa1c59f5386497f7f2`.

## How it was found (R1-v1: Astra's fixed major-deck lists)

- **Lists.** `logs/1103_MAJOR_DECKS_v1/dragunity.txt` (Main 40 / Extra 15) and `rabbit.txt` load through the normal text import (`parseDeckText`) with 0 missing names and 0 limit violations.
- **Duel.** Seed `0x52310101`, Dragunity first, responder policy, DUEL, normal game path. It ends normally with Replay ok.
- **Wrong result.** The rule-invariant scan of the operations found that on turn 3 the opponent activated a set 強制脱出装置. For the rest of Main Phase 1, the ignition effects of レッドアイズ・ダークネスメタルドラゴン and ドラグニティナイト－ガジャルグ were refused with 「1103ルール（2011/3/19以降）：召喚成功直後にモンスターの起動効果は発動できません」.
- **Evidence at the refusal.** The processor is idle: queue empty, nothing waiting, no chain, no deferred events. `timingWindow` = `{kind:'flip', action:'FX_SET_STATE'}`. The journal shows `FX_SET_STATE {zone:'sz', face:'up', reason:'発動'}` for the activated trap (seq 191).

## Diagnosis

- `runtime/50_actions_save.js updateTimingWindow` (run by `act()` and by the Replay runner) opened `kind:'flip'` for every `FX_SET_STATE` with `face:'up'`. That includes a set Spell / Trap turned face-up by its own activation, and monsters turned face-up by battle or by effects.
- Only the processor's summon POINT closes such a window, and these state changes queue no POINT. The window therefore stayed until the phase changed, and `strictScriptLegalityV2` refused every monster ignition effect in that phase.
- **2011 sources.** yugioh-wiki 「起動効果」 age 82 (2011-05-23) and 「優先権」 age 69 (2011-07-28): the priority rule concerns summon success (Normal / Flip / Special Summon); after both players pass, ignition effects can be used. A card being activated, or a monster flipped by battle or an effect, is not a summon.
- **Classification:** INTEGRATION_MISSING. Consumers: every monster ignition effect in any phase in which a set Spell / Trap was activated (by either player), or a monster was flipped face-up without a Flip Summon.

## Measurement before the fix

- `tools/test_s03_u42_flip_timing_window.js` on the U41 build: **8 PASS / 5 FAIL**.
- Fixed-list sweep before the fix: 48 duels (seeds `0x52310101`–`0x5231010c` × both first players × responder / passive, fixed lists v1, U41 build):
  - **48 / 48** end normally with Replay ok;
  - **3 refused ignition effects in 2 duels**: `0x52310101` Dragunity first responder, turn 3, レッドアイズ・ダークネスメタルドラゴン and ドラグニティナイト－ガジャルグ; `0x52310106` Dragunity first responder, turn 28, スノーマンイーター;
  - 未来融合－フューチャー・フュージョン recorded as unsupported (offered only as a manual activation) in 16 runs from the hand and 10 runs as a set card.
  - Data: Claude scratchpad `r1v1_sweep/`.

## Requirement closure record

- **Requirement.** Only a Flip Summon opens the flip timing window. Activating a set card and non-summon flips leave the open state unchanged.
- **Closure.**
  - `updateTimingWindow` opens `'flip'` only when `zone:'mz'`, face-up, and the Action is a Flip Summon: `flipSummon:true`, or reason `反転召喚成功` / `反転召喚` for journal entries recorded before this unit.
  - The two Flip Summon commits carry `flipSummon:true`: engine/40 `runSummonWindowResumeS03` (DUEL) and runtime/50 `doFlipUp` (MANUAL / non-DUEL Attack Position).
  - `timingWindow` is not part of the state digest, so existing Replay packages keep their digests.
- **Test** (after U41 in `tools/check.py`):
  - A: a set 強制脱出装置 is activated and resolves; no window remains; レッドアイズ・ダークネスメタルドラゴン's ignition effect is legal; Replay ok;
  - B: a Flip Summon of ワイト is journaled with `flipSummon:true`; its window closes after both pass; the ignition effect is legal; Replay ok;
  - C: the rule on a detached state (set-card activation / battle flip → no window; Flip Summon, flagged or older reason → flip window).
  - **After: 13 PASS / 0 FAIL.**
- **Regressions on the same build:** `test_s03_u41_resolution_choice_summon_event` 13 / 0, `test_s03_u15_summon_window_resume` 24 / 0, `test_s03_u40_attack_declaration_window` 18 / 0, `test_s03_u35_interrupted_activation` 27 / 0, `test_summon_timing` 4 / 0. The s03 status audit is unchanged (24 declared, 0 off-target).
- **Fixed lists kept as a reproduction condition (driver `R1_LIST=v1`).**
  - `data/r1_lists/major_decks_v1_dragunity.txt` / `major_decks_v1_rabbit.txt` are copies of Astra's `1103_MAJOR_DECKS_v1` lists, loaded through `parseDeckText`. The provisional list stays the default.
  - `data/r1_lists/known_gaps_v1.json` documents the only tolerated unsupported action (未来融合, CARD_WORK + RULING_UNRESOLVED).
  - The R1 gate test gained case `0x52310101` (fixed lists, Dragunity first, responder): **37 PASS / 0 FAIL** in total. The case ends normally on turn 14 with Replay ok (617 actions), the lists load 40 / 15 with 0 missing / 0 violations, and no ignition effect is refused.

## Sweep after the fix

- The same 48 duels on the U42 build (fixed lists v1, seeds `0x52310101`–`0x5231010c` × both first players × responder / passive):
  - **48 / 48** end normally with no blocker;
  - Replay reproduces every digest in all 48;
  - **0 refused ignition effects** (before: 3 in 2 duels);
  - 未来融合－フューチャー・フュージョン is still recorded as unsupported (15 runs from the hand, 10 as a set card): a documented known gap.
- Data: Claude scratchpad `r1v1_sweep/` (before), `r1v1_sweep_after/` (after).

## Gate

- `python tools/check.py` — EXIT 0, **12589 PASS / 0 FAIL** (log `s03_u42_full_gate.log`).
- `python tools/build_acode.py data/carddata.json` — EXIT 0.
- Coverage (unchanged versus U41): TESTED 2073 / ENGINE_GAP 614 / NOT_STARTED 1303 / IMPLEMENTED 183 / PARTIAL 179 / GENERIC_OK 644 (TOTAL 4996).

## Source hash

- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `04448d8bfecbd4f2b00dafa6844d4e53b25dacb5bf06317e1367f909813b5e93` (702 files).

## Not changed / deferred

- 未来融合－フューチャー・フュージョン is offered only as a manual action in the fixed list (CARD_WORK; 2011 text / ruling source still needed). This is the next candidate from R1-v1.
- ドラグニティアームズ－レヴァテイン (its old "no equip from GY" note is stale: `API.equipFromGrave` exists) and ドラグニティ－アキュリス: NOT_STARTED; dependent recovery candidates.
