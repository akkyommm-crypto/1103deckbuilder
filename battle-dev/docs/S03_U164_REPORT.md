# S03-U164 — デュアル・サモナー

## Why
ENGINE_GAP, with the reason "no Gemini mechanic". That reason is outdated since S03-U119, which added the Gemini Summon (`doGeminiSummonS03`, `GEMINI_SUMMON_S03`). The only missing piece was a Normal Summon granted by an effect in the opponent's turn.

## Card (`cards/HZK_claude_s03_u164_dual_summoner.js`)
- **When it can be used**: offered at the opponent's End Phase through the `onEndPhase` event. It is available only to this face-up card's controller when they are not the turn player, once. Cost: 500 LP.
  - Engine note: the text is not a trigger. It is represented as an optional effect of the End Phase event, which gives the non-turn player one chance in that phase, as the text allows.
- **Resolution**: the Gemini monster is chosen at resolution (journaled choice).
  - **From the hand**: a Normal Summon by the effect, `NORMAL_SUMMON` with `prepaid`, so the player's own Normal Summon is neither checked nor used. It is summoned face-up in Attack Position. Lv5-6 needs 1 Tribute and Lv7+ needs 2 (`tributesNeeded`), chosen at resolution.
  - **A face-up Gemini on the field**: the Gemini Summon (`GEMINI_SUMMON_S03`).
  - Either way it is followed by the `onNormalSummon` event.
  - A summon made during a resolution has no summon-negation window.
- **Protection**: `protectV21`, once per turn.

## Test — `tools/test_s03_u164_dual_summoner.js` 10/0 (real DUEL path: processor phases, the End Phase event, chain, choices; Replay-audited)
- **A**: チューンド・マジシャン Gemini-Summoned in the opponent's End Phase. LP −500; player I's Normal Summon is not used.
- **B**: デュアル・ランサー (Lv4) Normal Summoned from the hand.
- **C**: ギガプラント (Lv6) with ワイト Tributed.
- **D**: not offered in its controller's own End Phase.
- **E**: not offered with no Gemini monster.
- **F**: survives the 1st battle of the turn and is destroyed by the 2nd.
- **Negative control on U163**: 4 FAIL.
- `test_auto_cycle15.js`: its check 「デュアル・サモナーは未実装」 is now "implemented in S03-U164", with the history kept (PASS count unchanged).
- The ENGINE_GAP override was removed.

## Status
- ENGINE_GAP → TESTED: デュアル・サモナー.
- Totals: TESTED 2272, IMPLEMENTED 85, GENERIC_OK 644, PARTIAL 149, ENGINE_GAP 603, NOT_STARTED 1243.
