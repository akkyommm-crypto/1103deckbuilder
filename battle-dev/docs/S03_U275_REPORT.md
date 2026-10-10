# S03-U275 — Searches raise 「デッキから手札に加わった」: ワタポン, 強烈なはたき落とし

## Workflow
- opus-only engine unit (workflow v3). Profile `delegation-expanded-v3-batch3`. Built in parallel on U274, then rebased onto the final U274. Its full pre-scan before the rebase showed no other test changed apart from its status records.
- The Sonnet unit S03-U270 parked ワタポン with this reproduction:
  - `API.searchDeck` (`FX_SEARCH`) raised no `onAddToHand`; only `API.deckToHand` (`FX_DECK_TO_HAND`) did.
  - Most search effects (増援, エアーマン, deck triggers such as クリッター, …) use `searchDeck`, so Deck-to-hand triggers never saw them.

## Engine — engine/00 `FX_SEARCH`
- After the shuffle, the reducer now calls `emitAddToHandV8` with the same payload as `FX_DECK_TO_HAND`: player (whose hand), uid, `from:'deck'`, reason.
- The event is a deferred DUEL event raised inside the journaled Action, so Replay is unchanged.

## Cards → TESTED (2011 texts) — cards/HZZZZZD_claude_s03_u275_add_to_hand.js
- **ワタポン:** an optional hand trigger. When a card effect adds it from its owner's Deck to the hand, it may Special Summon itself in face-up Attack or Defense: the player chooses, via `specialSummonPositionsS03` from engine/1ZZK. A draw is not an add-to-hand event.
- **強烈なはたき落とし** (Counter Trap): when the opponent adds a card from their Deck to their hand, the opponent discards that card. It is an effect discard by its controller.

## Existing tests adjusted (status records; no behavior assertion changed)
Each check becomes an "Engine unlocked" check, and every count is unchanged:
- `test_v590_batch11` (ワタポン);
- `test_v540_batch06` (強烈なはたき落とし).

## Tests
`tools/test_s03_u275_add_to_hand.js` passes 14/0, on real DUEL paths and Replay-audited.
- W1: クリッター is destroyed by battle, its deck trigger searches ワタポン, and ワタポン Special Summons itself.
- W2: a drawn ワタポン stays in the hand.
- W3: Defense is chosen for its Special Summon.
- K1: the opponent's 増援 search → 強烈なはたき落とし discards the searched コマンド・ナイト.
- K2: the opponent's normal draw → not activated.
- K3: its own controller's search → not activated.

Negative control on U274 (after the rebase): 4 FAIL, no crash. Before the rebase, the engine change alone reverted with the cards kept gave 3 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17293 PASS / 0 FAIL** (= U274 17279 + 14 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U274.
- Coverage: TESTED 2870, ENGINE_GAP 522, NOT_STARTED 928, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 831 declared, 0 off-target.
- Published in the batched checkpoint S03-U272–U275.
