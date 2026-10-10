# S03-U43 ドラグニティ－アキュリス on the DUEL path (Claude)

Base: `checkpoint_claude_s03_u42_flip_timing_window_20260913.zip`, SHA256 `a7a86c038d100b0385a5971bdba4539412812d3f88c618ed78395a6b1314f8a3`.

## How it was found (R1-v1: Astra's fixed lists)

- In the 48 after-fix fixed-list duels of U42 (Dragunity / レダメ vs 1103兎ラギア, both first players, responder / passive), ドラグニティ－アキュリス was **Normal Summoned 28 times and its effects never happened**. It was NOT_STARTED with no script, so it played as a vanilla monster: a silent wrong result on the real-duel path, more frequent than the manual-only 未来融合 (25 offers).
- The widening sweep on U42 (24 more responder duels, `0x52310201`–`0x5231020c`) found no other blocker: 24 / 24 complete with Replay ok, 0 refused ignition effects; unsupported only 未来融合.

## 2011 text and rulings

- Text: 「このカードが召喚に成功した時、手札から「ドラグニティ」と名のついたモンスター1体を特殊召喚し、このカードを装備カード扱いとして装備する事ができる。モンスターに装備されているこのカードが墓地へ送られた時、フィールド上に存在するカード1枚を選択して破壊する。」
- yugioh-wiki 《ドラグニティ－アキュリス》 age 85 (2011-08-21):
  - both are Trigger Effects; the equip follows the Special Summon, not simultaneously (10/06/19); the effect still resolves if this card left the field during resolution (10/09/11);
  - the destroy effect targets 1 card (10/06/19);
  - it does not activate if the equipped monster left the field first (10/08/20) or became Xyz Material (11/08/20); it does activate when destroyed together with the monster (10/09/11).

## Measurement before

- `tools/test_s03_u43_dragunity_aklys.js` on the U42 build: **3 PASS / 6 FAIL** (no script: no Special Summon, no equip, no destroy).

## Closure

- **Classification:** CARD_WORK; engine assets only, no engine change.
- New `cards/H8_claude_s03_u43_dragunity_aklys.js` (manifest after H7):
  - **Summon effect:** v4 TRIGGER on `onNormalSummon`, optional. Resolution choice `u43.aklys-special` (P1; U41 makes the chain wait for it) → `API.specialSummon` from the hand → `API.equipMonster(self → summoned)` only if this card is still face-up on the field.
  - **Destroy effect:** v4 TRIGGER in the GY on `onLeaveField` with `fromZone:'sz'` → grave, excluding `graveInfo.rule:'equip'` (equip sent by rule after the host left; engine/1N `sendOrphanEquipV31`). Targets 1 field card at activation (P1.1 `p11cOpen` / `p11cards.commit-targets`), then destroys it if it is still on the field.
  - `activationV11` selects the destroy branch by `d.eventName==='onLeaveField'`: trigger descriptors carry `v4EffectKey:null` at activation. The first draft used the key only and committed without a target (found by a probe: 8 / 1 → fixed).
- `data/s03_status_changes.json`: ドラグニティ－アキュリス NOT_STARTED → TESTED.
- **Test** (after U42 in `tools/check.py`):
  - A: Normal Summon → ドラグニティ－ファランクス Special Summoned from the hand → アキュリス equipped (`v46MonsterEquip`, `equipTo` = ファランクス); Replay ok;
  - B: the opponent's サイクロン destroys the equipped アキュリス → its effect destroys the targeted ワイト; Replay ok;
  - C: 強制脱出装置 returns the equipped ファランクス first → the equip goes to the GY by rule (`graveInfo.rule:'equip'`) → no destroy; Replay ok.
  - **After: 9 PASS / 0 FAIL.**
- **Regressions:** `test_astra01_cards` 76 / 0, `test_s03_u42_flip_timing_window` 13 / 0, `test_s03_u41_resolution_choice_summon_event` 13 / 0.

## Real-duel effect

- Fixed lists v1 on the U43 build, 24 responder duels (`0x52310201`–`0x5231020c` × both first players; the same seeds as the U42 widening sweep):
  - **24 / 24** end normally with Replay ok, 0 refused ignition effects; unsupported only 未来融合 (6 hand / 5 set, documented gap).
  - ドラグニティ－アキュリス: **13 Normal Summons, 18 trigger activations, 8 Special-Summon-and-equip choices, 10 destroy-target choices**. Before U43 its effects never happened.
  - More destroy choices than equip choices is expected: ドラグニティ－ドゥクス / レギオン also equip it from the GY, and the destroy condition is "equipped and sent to the GY".
- Data: Claude scratchpad `r1v1_u43/`.

## Gate

- `python tools/check.py` — EXIT 0, **12598 PASS / 0 FAIL** (log `s03_u43_full_gate.log`).
- `python tools/build_acode.py data/carddata.json` — EXIT 0.
- Coverage: TESTED 2074 / ENGINE_GAP 614 / NOT_STARTED 1302 / IMPLEMENTED 183 / PARTIAL 179 / GENERIC_OK 644 (TOTAL 4996). Versus U42: ドラグニティ－アキュリス NOT_STARTED → TESTED (declared), 0 off-target.

## Source hash

- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `26447914136520af1289e1690ffcf9297573d8133391f09b98c28717ffb4827d` (705 files).

## Remaining / deferred

- The destroy trigger is offered as optional; the 2011 text makes it mandatory. v4 unified effects have no per-effect `forced` flag, and the engine change is deferred under the 1-card rule. Recorded.
- Same self-equip shape, not in the R1 decks: ドラグニティ－ピルム (NOT_STARTED; needs an equip-granted direct attack with halved damage), ドラグニティ－パルチザン (ENGINE_GAP; the equipped monster is treated as a Tuner). Dependent candidates.
- 未来融合－フューチャー・フュージョン stays the documented known gap on the fixed lists (Astra consult).
