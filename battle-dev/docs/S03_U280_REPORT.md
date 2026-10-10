# S03-U280 — ENGINE_GAP re-check 5: 深海の戦士, 砲弾ヤリ貝, 魚雷魚, ライバル登場!, 魂の氷結 (5 cards) + キャトルミューティレーション parked

## Workflow (mixed, v3 batch3)
- A Sonnet subagent (`claude-sonnet-5-5`) owned the unit from the brief: cards, tests, status records, declarations, audit, pre-scan and gate. The parent publishes.
- No engine change. Existing mechanisms only:
  - `unaffectedByS03` (S03-U115) for the three sea monsters;
  - the ChoiceRequest primitive with registered resume handlers;
  - `API.specialSummon` with the S03-U278 position question;
  - `API.skipPhase` (System v7).

## Cards → TESTED (2011 texts) — cards/HZZZZZH_claude_s03_u280_gap5.js
- **深海の戦士 / 砲弾ヤリ貝 / 魚雷魚:**
  - Face-up monsters are unaffected by Spell effects while a face-up 「海」 (or a card treated as 「海」) is in either Field Zone.
  - Chain-link and continuous Spell effects are both covered (Opus ruling): 魚雷魚 and 砲弾ヤリ貝 do not get 「海」's +200/+200.
  - Trap and monster effects still apply; a face-down 「海」 does not count.
- **ライバル登場!:**
  - The face-up opponent monster is chosen at activation.
  - At resolution, a monster with the target's current Level is chosen from the hand and Special Summoned, only if the target is still a face-up monster.
  - Activation needs a free Monster Zone (the 死者蘇生 convention).
- **魂の氷結:**
  - Own LP at least 2000 below the opponent's.
  - The opponent's next Battle Phase is skipped with `API.skipPhase`, and the skip really goes to Main Phase 2:
    - this turn's when activated before the opponent's Battle Phase;
    - otherwise the next turn's.

## Parked (stays ENGINE_GAP)
- **キャトルミューティレーション:** the script and its tests are in place and pass, but the Level used for "同じレベル" is an open ruling.
  - The script uses the Level the monster had on the field just before it returned. The text may also be read as the printed Level in the hand.
  - The two readings differ only when the Beast's Level was changed on the field.
  - The override and the status-record test are left unchanged. Decide the ruling, then declare it.
- The text's only Special Summon sentence also contains 「表側表示」, so the engine's no-position detection (`ssPositionFreeS03`) does not queue the question. The script asks the position itself with `specialSummonPositionsS03`.

## Existing tests adjusted (status records; no behavior assertion changed)
Each check becomes an "unlocked" check (`!ov[n]`) with the comment `S03-U280: implemented and tested; kept as a record`, and every count is unchanged:
- `test_v600_batch12` (深海の戦士);
- `test_v610_batch13` (砲弾ヤリ貝, 魚雷魚);
- `test_v630_batch15` (ライバル登場!);
- `test_v640_batch16` (魂の氷結).

## Tests
`tools/test_s03_u280_gap5.js` passes 67/0, on real DUEL paths and Replay-audited.

Negative control on U279: 36 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17491 PASS / 0 FAIL** (= U279 17424 + 67 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U279.
- Coverage: TESTED 2882, ENGINE_GAP 509, NOT_STARTED 928, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 844 declared, 0 off-target.
- Published in the batched checkpoint S03-U280–U283.
