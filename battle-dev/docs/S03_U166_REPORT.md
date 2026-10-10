# S03-U166 — D・ステープラン

## Why
Until S03-U158 the text fallback made D・ステープラン battle-indestructible in any position. Its protection is Defense Position only, and it had no script.

## Card (`cards/HZM_claude_s03_u166_d_stapler.js`)
- **Attack Position**:
  - continuous `cannotBeAttackTarget` for its controller's other monsters (engine/1ZU, S03-U160);
  - a forced GY trigger when destroyed by battle in Attack Position (graveInfo.pos): the monster that destroyed it (the other side of `gameState.lastBattle`) loses 300 ATK, permanently. It is not a target.
- **Defense Position**:
  - `protectV21` (battle);
  - a forced trigger after damage calculation (dsTiming 'after') when it was attacked in Defense Position (the live battle's `defPosAtCalc`): target an opponent's face-up Attack Position monster → Defense Position, and this card → Attack Position.

## Test — `tools/test_s03_u166_d_stapler.js` 8/0 (real DUEL path; Replay-audited)
- **A (Attack Position)**:
  - only D・ステープラン is an attack target, not ワイト;
  - destroyed by ゴブリン突撃部隊 → ゴブリン 2300 → 2000.
- **B (Defense Position)**:
  - ワイト is a target;
  - D・ステープラン is not destroyed and swaps positions with ゴブリン突撃部隊.
- **C (destroyed while attacking)**: ギガンテス, which destroyed it, drops 1900 → 1600.
- **Negative control on U165**: 4 FAIL. Pre-scan: every other gate test file is unchanged.

## Status
- NOT_STARTED → TESTED: D・ステープラン.
- Totals: TESTED 2276, IMPLEMENTED 85, GENERIC_OK 644, PARTIAL 148, ENGINE_GAP 603, NOT_STARTED 1240.
