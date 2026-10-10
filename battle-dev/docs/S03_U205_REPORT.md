# S03-U205 — PARTIAL coarse auto-table entries 8

## Finding
Six PARTIAL cards had only coarse AUTO_DECK_TABLE entries (cards/40).

## Cards (PARTIAL → TESTED) — cards/HZZM_claude_s03_u205_partial8.js
- XX－セイバー ガルセム (engine/1ZT, fieldToGrave).
  - Destroyed by a card effect (not battle): a 「X－セイバー」 to the hand (forced).
  - Continuous: ATK +200 per own face-up 「X－セイバー」.
- 死の花－ネクロ・フルール (engine/1ZT): destroyed by a card effect: 時花の魔女－フルール・ド・ソルシエール (optional).
- アームド・ドラゴン LV3: an optional trigger at its controller's Standby Phase. Cost: this face-up card to the GY. Then LV5 from the hand
  or the Deck.
- おジャマジック: forced when it is sent to the GY from the hand or the field. おジャマ・グリーン / イエロー / ブラック, one each.
- インヴェルズを呼ぶ者 / スカル・ナイト: GY triggers on the Normal Summon of the monster they were Tributed for. The Tribute records it:
  `usedAsMaterial.summonedUid`, and the script declares `onOtherSummon`.
  - 呼ぶ者: an 「インヴェルズ」 → a Level 4 or lower 「インヴェルズ」 (optional).
  - スカル・ナイト: a Fiend → another スカル・ナイト (forced).

## Tests
`tools/test_s03_u205_partial8.js` 20/0 (real DUEL paths, Replay-audited). The negative cases: destroyed by battle; a non-「インヴェルズ」 or
non-Fiend Tribute Summon. Negative control on U204: 7 FAIL.

## Left
- スーパイ needs a temporary ATK doubling plus an End Phase return to the hand.
- 機皇城 ① needs immunity to Synchro Monster effects.

## Follow-up (found by `tools/test_s03_u135` before the gate)
おジャマジック's pool spec (the three named おジャマ, filter `names`) is registered in `DECK_TRIGGER_S03`, so the auto-table identity
check keeps counting its entry. Without it, the live count fell to 79, below the floor of 80.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15343 PASS / 0 FAIL** (= U204 15323 + 20 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U204.
- Coverage: TESTED 2499, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 43 (4996); audit 460 declared, 0 off-target.
