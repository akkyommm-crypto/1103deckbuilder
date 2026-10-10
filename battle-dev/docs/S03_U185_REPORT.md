# S03-U185 — Deck triggers combined with other effects

## Engine
- engine/1ZT `deckTriggerEffectV4S03(name, spec)`: the shared deck trigger as a v4 effect entry (with its passive), so a card can combine
  it with other effects.
- 「リバースした」: `reversedS03` (zone-local) set by the v10 position detection when a card turns face-up from face-down; copied into
  graveInfo at battle destruction.
- BATTLE_CLEANUP graveInfo `battle:true` (「戦闘によって破壊され墓地へ送られた場合、そのバトルフェイズ終了時」).

## Cards (PARTIAL → TESTED; their AUTO_DECK_TABLE entries were 「起動効果でデッキから特殊召喚」)
メカウサー, サイバー・ラーバァ, 電池メン－ボタン型, ガスタ・サンボルト.

## Tests
`tools/test_s03_u185_mixed_triggers.js` 12/0 (real DUEL paths, Replay-audited). Negative control on U179: 5 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **14870 PASS / 0 FAIL** (= U184 14858 + 12 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U184.
- Coverage: TESTED 2337, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 83, GENERIC_OK 644, PARTIAL 125 (4996); audit 298 declared, 0 off-target.
