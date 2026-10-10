# S03-U171 — 和睦の使者

## Why
和睦の使者 is a staple defensive Trap: 「このターン、自分のモンスターは戦闘では破壊されず、自分が受ける戦闘ダメージは0になる。」 It was ENGINE_GAP because there was no turn-duration battle protection for all of a player's monsters, and no battle-damage prevention for that player.

## Change
- **engine/00** `battleProof`: a turn-stamped flag of the monster's controller, `temporaryFlags.noBattleDestroyS03 === turn`, protects all of that player's monsters, including ones that arrive later in the turn. Per-turn flags are reset at the turn change.
- **Card** (`cards/HZQ_claude_s03_u171_peace_messenger.js`): a Normal Trap that sets the flag and adds a System v18 LP rule `{cause:'battle', mode:'prevent', turns:0}` for its controller.
- **`test_v740_batch26.js`**: 和睦の使者 moved from its ENGINE_GAP list to an "unlocked" list, following the test's own convention (count unchanged).
- The override was removed.

## Test — `tools/test_s03_u171_peace_messenger.js` 5/0 (real DUEL path; Replay-audited)
- **A**: activated at player II's attack declaration.
  - Neither ワイト attacked by ゴブリン突撃部隊 / ギガンテス is destroyed.
  - Player I's LP is unchanged.
- **B**: in the next turn it no longer applies: ギガンテス destroys ワイト, 1600 damage.
- **Negative control on U170**: 3 FAIL.

## Status
- ENGINE_GAP → TESTED: 和睦の使者.
- Totals: TESTED 2285, IMPLEMENTED 85, GENERIC_OK 644, PARTIAL 145, ENGINE_GAP 601, NOT_STARTED 1236.
