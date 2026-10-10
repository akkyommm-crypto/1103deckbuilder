# S03-U138 — fixed-list singles 2: アーカナイト・マジシャン rewrite, 魔轟神レイヴン limits; audits of エスクリダオ / バルブ / レイジオン / レヴュアタン

## Why
These are the remaining IMPLEMENTED singles of the fixed major-deck lists (hero, debris, dark). Measured on U137:
- アーカナイト・マジシャン (debris x1) was one legacy script.
  - ① 「S召喚に成功した場合に魔力カウンターを2つ置く」 and ② 「攻撃力はカウンターの数×1000アップ」 did not exist.
  - Its passive `onSpecialSummon` only offered ③, whose condition needs a counter, so the card never got any counters and ③
    was unusable on its own.
  - ③ removed the counter at resolution instead of as the activation cost.
- 魔轟神レイヴン (dark x1):
  - 「1ターンに1度」 was missing, so it could be activated again the same turn.
  - The Level boost was a permanent `lvMod` flag, not 「エンドフェイズ時まで」 (it stayed Level 3 after the turn).
- E・HERO エスクリダオ, グローアップ・バルブ, 魔轟神レイジオン and 魔轟神レヴュアタン behaved correctly but had no real-duel test.

## Change
- New `cards/HV_claude_s03_u138_fixed_singles.js` (added to `build_manifest.json`): アーカナイト・マジシャン as a v4 card.
  It replaces the `00_generic_core.js` definition.
  - `counters`: a forced trigger on its own Synchro Summon (`s03SelfSynchroSummonedU121`) that places 2 魔力 counters.
  - The `continuous` block gives ATK +1000 per counter.
  - `destroy`: an ignition whose cost removes 1 counter from a card on its controller's field (chosen at activation), then
    targets 1 opponent card and destroys it.
  - Explicit `timing:['summon','mainPhase']`: inferred timing would have been "summon" only (the known pitfall).
- `cards/39_1103_expansion_v380b.js` 魔轟神レイヴン: `countLimit:1`, and `API.modLevel(…, 'endTurn')` replaces the permanent
  `lvMod` flag.

## Test — `tools/test_s03_u138_fixed_list_singles2.js` 19/0 (real DUEL path, Replay-audited)
- A: エスクリダオ with 4 E・HERO in its controller's GY (not ワイト, not the opponent's) → ATK 2900.
- B: アーカナイト.
  - ジャンク・シンクロン + マジシャンズ・ヴァルキリア → 2 counters, ATK 2400.
  - ③ destroys the set ミラーフォース, leaving 1 counter and ATK 1400.
- C: バルブ revives with the top card milled. Back in the GY, it is illegal for the rest of the Duel.
- D: レイジオン is Synchro Summoned with an empty hand, and 2 cards are drawn.
- E: レイヴン.
  - With 2 of 3 cards discarded (the player stops after 2): Level 4 / ATK 2100, then illegal again this turn.
  - With 1 card discarded: Level 3 / ATK 1700, back to Level 2 / ATK 1300 after the turn.
- F: レヴュアタン destroyed by the opponent's サンダー・ボルト. The player picks ケルベラル and レイヴン and stops; ワイト is
  never offered.
- Negative control on U137: B ① / ③ and E (once per turn, duration) fail.
- Pre-scan of all 357 gate tests (parallel): 0 FAIL.

## Status
- E・HERO エスクリダオ, アーカナイト・マジシャン, グローアップ・バルブ, 魔轟神レイジオン, 魔轟神レイヴン, 魔轟神レヴュアタン
  IMPLEMENTED → TESTED (focus registered). TESTED 2209 → 2215, IMPLEMENTED 101 → 95.
- Fixed lists still not TESTED:
  - 六武衆の影武者 (ENGINE_GAP);
  - 天刑王 ブラック・ハイランダー, 波動竜騎士 ドラゴエクィテス (NOT_STARTED);
  - シューティング・クェーサー・ドラゴン (PARTIAL);
  - ガチガチガンテツ, キメラテック・フォートレス・ドラゴン (IMPLEMENTED; deferred findings).
