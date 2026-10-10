# S03-U242 — 「宝玉獣」 2 and battle damage of direct attacks (ENGINE_GAP 1, NOT_STARTED 3)

## Workflow
- opus-only: engine additions plus one engine defect.
- Written in parallel with the Sonnet U241, then rebased onto U241.
- The U241 subagent reported the same direct-attack defect independently; it did not patch it, as briefed.

## Engine
- **engine/00, battle damage of direct attacks.**
  - The ATTACK reducer's direct-attack branch skipped the v18 player LP rules (`resolveLpChangeV18`), while monster-vs-monster battle damage applied them.
  - So 「このターン、自分が受ける戦闘ダメージは0」 (宝玉の双璧, S03-U241), 「…半分」 and similar rules did not stop direct attacks.
  - Both branches now use the rules.
  - A rule may also turn the damage into recovery. The monster-battle branch used `Math.abs` and dropped that sign; both branches now handle it.
- **engine/1H:** new LP rule mode `damageToRecover`: 「ダメージを受ける代わりに、その数値分だけライフポイントを回復する」.
- **engine/1ZZH:** `onPlacedAsSpellS03 {uid, player, name}` is queued by both placement paths (destroyed → placed, and `FX_PLACE_SPELL_S03`), for 「「宝玉獣」モンスターが魔法&罠ゾーンに置かれる度に」.

## Cards → TESTED (2011 texts) — cards/HZZZV_claude_s03_u242_crystal_beast2.js

| Card | Was | Effect |
|---|---|---|
| 宝玉の樹 | NOT_STARTED | +1 gem counter per 宝玉獣 placed; send it (cost) → place that many 宝玉獣 from the Deck |
| 究極宝玉神 レインボー・ドラゴン | NOT_STARTED | special summon only with 7 kinds of 宝玉獣 cards in its field / GY; no effect the turn it was special summoned; ① (quick) send every own face-up 宝玉獣 → +1000 ATK each; ② banish every GY 宝玉獣 → every card on the field to its owner's Deck |
| 宝玉の氾濫 | ENGINE_GAP (override removed) | send exactly 4 宝玉獣 cards from its Spell & Trap Zone (cost); every other card on the field to the GY; special summon GY 宝玉獣 up to the number of opponent cards sent |
| レインボー・ライフ | NOT_STARTED | discard 1 (cost); until the End Phase, battle and effect damage becomes recovery |

Notes:
- The v4 / legacy script layer has no per-effect menu, so レインボー・ドラゴン asks for the mode at the cost, when both ① and ② can be activated, and records it (`recordActivationCost`).
- 「宝玉獣」 monsters are identified by name. The project setcode 0x1021 also covers 究極宝玉神 and the 「宝玉の…」 cards. The U242 test exposed this, and the S03-U240 helper was corrected before U240's gate.

## Existing test adjusted (status record; no behavior assertion changed)
- `tools/test_v920_batch43.js` listed 宝玉の氾濫 among the reviewed ENGINE_GAP overrides.
- It moves to a 「crystal flood unlocked」 check, which asserts that the override is gone. This follows the U214 / U238 / U240 precedent.
- The PASS count (30) is unchanged.

## Tests
`tools/test_s03_u242_crystal_beast2.js` passes 19/0, on real DUEL paths and Replay-audited.
- 樹: two destroyed-and-placed 宝玉獣 → 2 counters → 2 placed from the Deck.
- レインボー・ドラゴン:
  - the procedure is refused with 6 kinds and succeeds with 6 in the GY + 1 placed;
  - its effects are locked that turn;
  - ① gives 6000 ATK;
  - ② returns everything on the field to the Deck.
- 氾濫: 2 opponent cards sent → exactly 2 summoned.
- レインボー・ライフ: a direct 3000 → +3000, and a 2700 monster battle → +2700.
- 宝玉の双璧 then a direct attack → 0 damage. This is the engine fix; it would have taken 1900.

Other checks:
- Every test that mentions LP rules or direct attacks still passes, as do `test_battle*`, `test_s03_u185`–`u189`, `u240`, `u241`, `test_v920_batch43` and `test_s03_u135`.
- Negative control on U241: 13 FAIL.
- The test driver answers choices with max > 1 through `answerChoiceV49`, since a single pick only toggles them.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16143 PASS / 0 FAIL** (= U241 16124 + 19 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U241.
- Coverage: TESTED 2717, ENGINE_GAP 594, NOT_STARTED 1009, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 677 declared, 0 off-target.
