# S03-U170 — the Battle Phase Start Step + 威嚇する咆哮

## Why
Entering the Battle Phase went straight to the battle command (choose an attacker). There was no response window for either player at the Start Step. The opponent could not, for example, activate 威嚇する咆哮 at the start of the turn player's Battle Phase, a standard play. 威嚇する咆哮 itself had no script (NOT_STARTED).

## Change
- **engine/30** `processPhaseV27`: entering the Battle Phase queues a POINT kind `'battleStart'` (「バトルフェイズ開始時（スタートステップ）」). The turn player has priority; the battle command follows when both pass. With no response anywhere it passes by itself: the pre-scan shows no gate test changes.
- **engine/00** `cannotAttackNow`: a turn-stamped player flag `temporaryFlags.noAttackDeclareS03 === turn` forbids that player's attack declarations. Per-turn flags are reset at the turn change.
- **Card**: 威嚇する咆哮 (`cards/HZP_claude_s03_u170_threatening_roar.js`), a Normal Trap. It sets the flag on the opponent.

## Test — `tools/test_s03_u170_start_step.js` 6/0 (real DUEL path: processor phases and turns; Replay-audited)
- **A**:
  - player II enters the Battle Phase; the processor stops at the Start Step, and player I is offered the set 威嚇する咆哮;
  - after it resolves, ゴブリン突撃部隊 cannot declare an attack;
  - an attack request is refused (no declaration, no damage).
- **C**: in player II's next turn it can attack again.
- **B**: with no response, the Start Step passes by itself and the battle command is ready.
- **Negative control on U169**: 3 FAIL.

## Status
- NOT_STARTED → TESTED: 威嚇する咆哮.
- Totals: TESTED 2284, IMPLEMENTED 85, GENERIC_OK 644, PARTIAL 145, ENGINE_GAP 602, NOT_STARTED 1236.
