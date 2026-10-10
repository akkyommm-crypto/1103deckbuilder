# S03-U184 — 剣闘獣 stage 3

## Engine
- v9 linked leave: new `onGone:'toDeck'` (FX_RETURN_DECK + SHUFFLE) — 「このカードがフィールドから離れた時にそのモンスターは持ち主のデッキに戻る」.
- FX_SPECIAL_SUMMON `negateOnSummonS03`: 「効果を無効にして特殊召喚する」 — the v13 permanent negation is part of the summon action. (A negated
  monster's trigger may still be activated and is negated at resolution — the engine's existing rule, 「効果無効中（発動は可能）」.)

## Cards (PARTIAL → TESTED; they were coarse AUTO_DECK_TABLE entries)
剣闘獣ダリウス (revive with negated effects + return to the Deck when ダリウス leaves; tag-out), 剣闘獣ラニスタ (banish a GY 「剣闘獣」, same name
until the End Phase; tag-out), 剣闘訓練所, ハンディキャップマッチ!, スレイブタイガー (texts as in carddata).

## Tests
`tools/test_s03_u184_gladiators3.js` 13/0 (real DUEL paths, Replay-audited). Negative control on U179: 7 FAIL.

## Left
剣闘獣の檻－コロッセウム (ENGINE_GAP: counters on every Deck Special Summon, discard-substitute).

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **14858 PASS / 0 FAIL** (= U183 14845 + 13 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U183.
- Coverage: TESTED 2333, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 83, GENERIC_OK 644, PARTIAL 129 (4996); audit 294 declared, 0 off-target.
