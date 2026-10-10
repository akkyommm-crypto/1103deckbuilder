# S03-U213 — NOT_STARTED 6: 「このカードが召喚に成功した時、罠カードを発動する事はできない」

## Engine
- `engine/1ZD` `noteSummonTrapLockS03` / `summonTrapLockReasonS03` (read by `activationTypeLockReasonS03`, so every legality consumer sees it: response
  lists, trigger candidates, the activation itself).
  - When the `onNormalSummon` event of a face-up, non-negated monster whose script declares `summonNoTrapS03:true` is dispatched
    (`processEventV27` and `processEventBatchV28`, engine/30), `gameState.summonTrapLockS03` is recorded.
  - While the lock holds, neither player can activate a Trap card. The effects of face-up Traps are not card activations.
  - It holds:
    - in the chain built at that summon-success timing: its triggers, and everything chained to them;
    - at the post-summon response point (`summonFast`), when no chain was built there.
  - After a chain built at that timing has resolved, the timing has passed.
  - The record is cleared:
    - when the post-summon point ends (`queuePointContinuationV27`);
    - when it goes stale on a turn or phase change.
  - Flip and Special Summons do not set it: 「召喚」 means Normal Summon (including Tribute Summon).

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZU_claude_s03_u213_ns6.js
- イーグル・アイ, 侵略の炎, 忍び寄るデビルマンタ: `summonNoTrapS03`.
- 増幅する悪意: while it is face-up, at the opponent's Standby Phase, mills the opponent's Deck by the number of 「増幅する悪意」 in its controller's
  GY. It is forced.

## Tests
`tools/test_s03_u213_ns6.js` passes 17/0, on real DUEL paths and Replay-audited.
- The three cards are Normal Summoned against a set 激流葬. It is not offered, and the lock is gone afterwards.
- Controls, where 激流葬 is offered:
  - ワイト Normal Summoned;
  - イーグル・アイ special summoned by 死者蘇生.
- Flip and Special Summon events record no lock.
- The lock reason is seen during the summon-success timing.
- 増幅する悪意 mills 2 across a real turn change; its controller's own Standby Phase mills nothing.

Negative control on U212: the three summon cases fail (3 FAIL), then a ReferenceError (no lock functions).

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15499 PASS / 0 FAIL** (= U212 15482 + 17 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U212.
- Coverage: TESTED 2546, ENGINE_GAP 599, NOT_STARTED 1173, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 31 (4996); audit 506 declared, 0 off-target.
