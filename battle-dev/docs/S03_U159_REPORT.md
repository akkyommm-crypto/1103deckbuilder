# S03-U159 — a Tribute Summon's Tributes and its summon success trigger together

## Why
A summon that Tributes monsters queues its deferred events in this order:
- each Tribute's leave-field events (onSendToGrave / onRemove / onLeaveField),
- then the summon success (onNormalSummon; onSpecialSummon for a Synchro Summon, whose materials leave the same way).

U156 made the Tributes of 2+ cards one simultaneous batch. The summon success was still drained afterwards as its own event. So:
- The Tributed クリッター's trigger was chained and **resolved first**.
- The summoned monarch's 「アドバンス召喚に成功した場合」 trigger was only collected after that chain had resolved.

Under the rules, both happen at the same time: one SEGOC chain, ordered forced / optional × turn / non-turn player.

## Change (`engine/30_processor_chain_battle.js`, `engine/1O_activation_event_continuation_v11.js`)
- `leaveBatchRunS03`: a head run of leave-field events, followed directly by a summon success, is one `EVENT_BATCH` including the summon event. This applies even for a single Tribute.
- The post-summon fast window (`summonFast`, where 奈落の落とし穴-type summon responses and the 「召喚成功直後」 rule are handled) still follows the batch's chain:
  - the batch carries it as `postPointS03`;
  - `processEventBatchV28` enqueues it, including when there are no candidates;
  - the v11 data continuation (`eventSelectionDescriptorV11`) now carries it for EVENT_BATCH units too. The chain's end uses this data path, not the live closure. Before this, the pre-scan showed `test_s03_u03_dragunity` / `test_s03_r1_duel_completion` stuck in the 「召喚成功直後」 window after a batched Synchro Summon; that is fixed.

## Test — `tools/test_s03_u159_tribute_summon_batch.js` 10/0 (real DUEL path, Replay-audited)
- **A**: クリッター Tributed for 風帝ライザー.
  - Both forced triggers are in the same group, in one chain.
  - クリッター searches, and ライザー returns ワイト to the Deck.
  - The summon-success window then closes.
- **B**: 黒き森のウィッチ Tributed for 邪帝ガイウス: the same.
- **C**: after the batch, 奈落の落とし穴 still answers the summon success (風帝ライザー banished), and クリッター still searches.
- **Negative control on U158**: 2 FAIL (A / B are separate chains).
- Pre-scan: every gate test file has the same PASS / Error counts as U158.

## Status
No status change. Totals: TESTED 2265, IMPLEMENTED 85, GENERIC_OK 644, PARTIAL 149, ENGINE_GAP 606, NOT_STARTED 1247.
