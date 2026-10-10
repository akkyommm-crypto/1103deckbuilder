# S03-U247 — turn-duration Level changes (ENGINE_GAP 4)

## Workflow
- opus-only: a re-examination of ENGINE_GAP reasons.
- The four ENGINE_GAP reasons said a 「first-class turn-duration Level modifier shared by summon legality, UI, save and replay」 was needed.
- The v16 Level layer already is that modifier:
  - `LEVEL_MOD_V16` through `API.modLevel` / `API.setLevel` with `until 'endPhase'`, which is journaled and zone-local;
  - it is read by `curLV`, which Synchro material legality uses (engine/20 `materialCandidates`);
  - it expires through `clearExpiredMods`.
- No engine change was needed. The overrides are removed.

## Cards → TESTED (2011 texts) — cards/HZZZZA_claude_s03_u247_level_mods.js

| Card | Effect |
|---|---|
| ダーク・スパイダー | once per turn: an own face-up Insect (current Race) +2 Levels until the End Phase |
| タイムパッセージ | an own face-up 「フォーチュンレディ」 +3 Levels until the End Phase; its ATK follows (S03-U238) |
| コピー・プラント | once per turn: its Level becomes another face-up Plant's Level until the End Phase |
| フルエルフ | once per turn: reveal a hand monster (cost, journaled `REVEAL_ADD_V20`; its Level recorded with the cost) → +that Level until the End Phase |

## Existing tests adjusted (status records; no behavior assertion changed)
- `tools/test_v700_batch22.js` (タイムパッセージ), `test_v760_batch28.js` (ダーク・スパイダー), `test_v850_batch36.js` (コピー・プラント) and `test_v860_batch37.js` (フルエルフ) listed the card as a precise ENGINE_GAP.
- Each card moves to a 「Level layer unlocked」 check, which asserts that the override is gone. This follows the U214 / U238 / U240 / U242 precedent.
- The counts (47 / 43 / 41 / 38) are unchanged.

## Tests
`tools/test_s03_u247_level_mods.js` passes 12/0, on real DUEL paths and Replay-audited.
- Insect 4 → 6, also as a Synchro material Level; once per turn; back to 4 after the End Phase.
- ライティー 1 → 4 with ATK 800, and refused without a 「フォーチュンレディ」.
- コピー・プラント 1 → 4, copying the opponent's スネーク・パーム.
- フルエルフ 2 → 6 with the revealed card kept in the hand, and refused without a hand monster.

Other checks:
- Negative control on U246: 7 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16359 PASS / 0 FAIL** (= U246 16347 + 12 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U246.
- Coverage: TESTED 2744, ENGINE_GAP 577, NOT_STARTED 999, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 704 declared, 0 off-target.
