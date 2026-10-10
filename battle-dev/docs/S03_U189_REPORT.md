# S03-U189 — the Monarchs (雷帝ザボルグ, 氷帝メビウス, 炎帝テスタロス, 光帝クライス)

## Finding
The four 2011 Monarchs had scripts (IMPLEMENTED) but no dedicated test. ザボルグ / メビウス / テスタロス follow the text. 光帝クライス did not:
- every target that was no longer on the field at resolution was counted as destroyed and gave a draw;
- the draw was automatic, but the text says 「破壊されたカードのコントローラーは破壊された数だけデッキからドローできる」.

## Fix (cards/39_1103_expansion_v380b.js)
光帝クライス resolves by uid:
- only targets still on the field are destroyed;
- only those that went to the GY (or a token that vanished) count, so a destroy substitute or an earlier departure gives no draw;
- each controller then chooses whether to draw, turn player first (registered choice `s03u189.krais-draw`, SaveLoad-safe).

## Cards (IMPLEMENTED → TESTED)
雷帝ザボルグ, 氷帝メビウス, 炎帝テスタロス, 光帝クライス.

## Tests
`tools/test_s03_u189_monarchs.js` 17/0 (real DUEL paths, Replay-audited). Tribute Summons go through `doNormalSummon`.
- ザボルグ: the effect resolves on a Tribute Summon, but not when the card is revived by 死者蘇生.
- メビウス: the 2 chosen cards are destroyed.
- テスタロス: a discarded monster deals Level × 100 damage; a discarded Spell deals none.
- クライス:
  - 2 opponent cards destroyed, the opponent draws 2, and クライス cannot attack that turn;
  - targeting itself and an opponent card, the controller declines the draw;
  - a target returned by 強制脱出装置 in response gives no destruction and no draw.

Negative control on U188: D2 fails, because the draw was forced. D3 already passed on U188, since the chain engine drops targets that
have left the field, so it stays as a regression guard.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **14962 PASS / 0 FAIL** (= U188 14945 + 17 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U188.
- Coverage: TESTED 2365, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 59, GENERIC_OK 644, PARTIAL 121 (4996); audit 326 declared, 0 off-target.
