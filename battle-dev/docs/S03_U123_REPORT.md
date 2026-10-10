# S03-U123 — カラクリ将軍 無零 (Synchro trigger ran the wrong effect; shared once-per-turn)

## Why
Remaining fixed-list tier after U122 (karakuri x2). Measured on U122: 無零 was one `defineScript` whose passive
`onSpecialSummon` (its own Synchro Summon) and ignition ② shared condition / selectTargets / resolve. The trigger therefore
asked for a monster and **changed its position** instead of Special Summoning a カラクリ from the Deck, and `countLimit:1`
covered the whole script, so using the trigger also consumed ②'s once-per-turn.

## Change
- `cards/20_control_counter.js`: 無零 is a unified v4 card with two keyed effects:
  - `synchro-recruit` (TRIGGER, onSpecialSummon, optional): only for its own Synchro Summon (`s03SelfSynchroSummonedU121`);
    the Deck Special Summon choice is a registered ChoiceRequest handler (`s03u123.muzero-recruit`).
  - `position` (IGNITION, target 1 monster, change its battle position) with `countLimit:{n:1, effects:['position']}`.

## Test — `tools/test_s03_u123_karakuri_shogun.js` 9/0 (real DUEL path, Replay-audited)
- A: real Synchro Summon (カラクリ参謀 弐四八 + カラクリ忍者 九壱九) → the chosen カラクリ商人 壱七七 is Special Summoned from the
  Deck (the opponent's ワイト keeps its position); ② is still available; ② changes the targeted ワイト to Defense Position;
  once per turn.
- B: revived by 死者蘇生 → no trigger.
- Negative control on the U122 build: ① did not summon, ② was blocked ("1ターンに1度までです") — A fails.
- Tests naming カラクリ / togglePosition re-run on the U123 build: 0 FAIL.

## Deferred (found while scouting this tier)
- ガチガチガンテツ: its optional destruction substitute (「破壊される場合、代わりにX素材を1つ取り除く事ができる」) needs a
  new capability — destruction is decided inside the reducer (battle kill / FX_TO_GRAVE byDestroy) with no point for a
  player choice. Not implemented (auto-applying it would misrepresent an optional effect).
- キメラテック・フォートレス・ドラゴン: its own summon procedure (send サイバー・ドラゴン + Machine monsters from either field)
  does not exist, so in DUEL it cannot be summoned (the EX list refuses Fusion Monsters). Needs an Extra Deck summon
  procedure path with multi-material selection; the 2011 ruling on face-down materials must be confirmed first.
- 超融合: selectTargets always uses the first material combination (`combos[0]`) — the player cannot choose materials.

## Status
- カラクリ将軍 無零 IMPLEMENTED → TESTED. TESTED 2190 → 2191, IMPLEMENTED 109 → 108.

## Gate
- `python tools/check.py` — `GATE_EXIT=0`, 13882 PASS lines, 0 FAIL, no Traceback (one caught `TypeError` stack from
  `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level function declarations".
- `dist/battle.html` SHA256 `5246c37dcaefe06b6b01de81d15ffa87ef52fe64b77f3f51e3565b44d11e282d`; Acode regenerated after the gate: `dist/battle_acode.html` `227d10ca914ae0dcddcb6fa30d7eae87c0f2d59d5e9f00cd2438392b39d4454c`.
- Coverage: TESTED 2191, IMPLEMENTED 108, ENGINE_GAP 609, GENERIC_OK 644, PARTIAL 172, NOT_STARTED 1272 (4996);
  146 declared status changes, 0 off-target.
