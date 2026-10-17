# S03-U392 - Nightmare Iron Cage (悪夢の鉄檻), Big Cold Wave (大寒波), Flash Bomb (閃光弾)

Base: `claude/work` `24afe1e` (U391, gate 20644 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZB_claude_s03_u392_freeze.js`)
- 悪夢の鉄檻: Normal Spell that stays on the field (like 光の護封剣): continuous `cannotAttack` on all monsters while in the Spell & Trap Zone; a scheduled destroy at the End Phase of the opponent's 2nd turn.
- 大寒波: Main Phase 1 start only (like 大熱波); a lingering `activationLockS03` + `locksStEffectsS03` for Spell / Trap cards and effects of both players until my next Draw Phase, and the Set ban below.
- 閃光弾: optional trap trigger on the opponent's direct battle damage to me; resolves by requesting the End Phase.

## Engine (small)
- `engine/1ZZT_set_ban_s03.js` `setBannedS03(gs, P)`: effectFlags.setBanS03 = [{from,to}]; `SET_ST` in `engine/00_state_actions.js` refuses to Set while the turn is inside a range. Pure function of state.

## Tests
- `tools/test_s03_u392_freeze.js` 21 / 0. Negative control on the previous build (card file removed): 11 FAIL. No existing test changed. Coverage TESTED 3321 -> 3324, NOT_STARTED 547 -> 544; `registration_names_missing_from_db` empty; audit 0 FAIL.
