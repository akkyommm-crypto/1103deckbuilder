# S03-U111 — ゴッドバードアタック + "an activated Spell/Trap cannot target itself" (4 cards)

## Why
Priority #7 IMPLEMENTED tier, main-deck qty=2: ゴッドバードアタック (fixed list `major_decks_v1_bf.txt` x2).
Base: clean U110 (`16c929f2…`).

## ゴッドバードアタック (2011 text)
自分フィールド上に存在する鳥獣族モンスター1体をリリースして発動する。フィールド上に存在するカード2枚を選択して破壊する。

Probe on the U110 build (set card, 1 face-up BF bird, 1 opponent monster) measured three defects:
1. the release was not a cost — the bird was picked like a target and only sent to the GY at resolution
   (a negated activation released nothing);
2. activation was legal although only 1 card besides itself and the bird existed (2 targets are required);
3. the activated card itself was offered as a target.

Fix (`cards/00_generic_core.js`): `cost()` releases the bird before targeting (the デュアルスパーク U98 pattern,
only birds that leave 2 targets are offered); 2 distinct targets excluding the card itself and the released
bird; `condition()` requires such a bird; `resolve()` destroys the targets still on the field.

## Survey: self-targeting across all targeting Spell/Traps
Every scripted Spell/Trap with `targets:true` (371) was activated from a set position on a rich board and every
prompt in its first 5 steps inspected for the activated card itself. Before: 5 offered themselves —
サンダー・ブレイク, デュアルスパーク, ツイスター, 宝玉の契約, 宝玉の祈り. After this unit: only the 2 宝玉 cards.
- サンダー・ブレイク (IMPLEMENTED → TESTED), デュアルスパーク (hero x3), ツイスター: target pools and `condition()`
  exclude the card itself (the サイクロン convention). デュアルスパーク's condition also newly requires a target to
  remain after the release (it previously had no target check at all). U98's test comment, which called the
  self-target legal, is corrected.
- 宝玉の契約 / 宝玉の祈り are a **different defect**, deferred: they use `isSetCardV4(SETCODE.CRYSTAL_BEAST)` as the
  「宝玉獣」 named predicate, which `engine/04_setcode_authority_v4.js` explicitly forbids (setcode includes theme
  support cards, so the cards match themselves). The fix needs a 宝玉獣 group in the P4 named-predicate overlay
  (`tools/gen_setcode_overlay.py`); neither card is on a fixed list.

## Test — `tools/test_s03_u111_god_bird_attack.js` 27/0 (real DUEL path, every segment Replay-audited)
- A: legality (1 vs 2 targets besides itself and the bird; no bird).
- B: cost prompt first (only the bird), bird in the GY before targeting, itself not a candidate, 2 targets destroyed.
- B2: another own bird can be a target; the released one cannot.
- C: negated by a real 神の宣告 chain response → the bird stays released, both targets survive.
- S1–S3: サンダー・ブレイク (full flow + illegal with nothing else on the field), デュアルスパーク (not offered; illegal
  with only the released Gemini besides itself), ツイスター (not offered; destroys the opponent's face-up card).
- Negative control: the same test on the pre-fix U110 build fails 10 assertions across all four cards.
- Existing tests touching the changed cards pass: U98 9/0, auto_cycle20 85/0, effect_category_cards 48/0,
  U76 11/0, U79 18/0, v510_batch03 44/0.

## Status
- ゴッドバードアタック IMPLEMENTED → TESTED (#110), サンダー・ブレイク IMPLEMENTED → TESTED (#111).
- Coverage: IMPLEMENTED 130 → 128, TESTED 2154 → 2156; audit 111 declared, 0 off-target.

## Gate
- Full Gate EXIT 0, 13500 PASS lines (U110 13473 + 27), 0 FAIL, no Traceback / ReferenceError; the single caught
  `TypeError` stack at the start of `test_auto_cycle32.js` is the recorded existing noise.
