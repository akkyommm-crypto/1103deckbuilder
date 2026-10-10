# S03-U141 — 六武衆の影武者 (target redirection during chain building)

## Why
六武衆の影武者 is in the fixed Six Samurai list x3. `data/script_status_overrides.json` forced it to ENGINE_GAP: "Needs
source-aware Spell, Trap and monster-effect target redirection during Chain construction for a targeted canonical Six
Samurai monster." It had no script, so a Six Samurai deck could never protect its key monsters.

## Change
- `engine/00_state_actions.js`: new journaled reducer `CHAIN_RETARGET_S03 {chainId, targets, reason}`. It replaces the
  link's `targets` and `selection`; `preparedChainContext` reads `selection` first. Replay moves the target the same way.
- New `cards/HY_claude_s03_u141_kagemusha.js` (added to `build_manifest.json`):
  - 影武者 is a quick-speed response declared in `ACTIVATION_RESPONSE_S03`, so it answers the top chain link.
  - It is legal while it is face-up on the field and the top link meets all of these:
    - it comes from a Spell, a Trap or a monster effect (activation event `kind`);
    - it is not negated;
    - it targets exactly one card, which is an own face-up 「六武衆」 monster (P4 group `SIX_SAMURAI_NAMED`, passcode-based)
      other than 影武者.
  - At resolution, if all of that still holds and 影武者 is still face-up on the field, it dispatches `CHAIN_RETARGET_S03`
    with itself as the only target.
- `data/script_status_overrides.json`: the 六武衆の影武者 ENGINE_GAP entry is removed; the gap is what this unit implements.
- `tools/test_v710_batch23.js`: following that file's own convention, 影武者 moves from `gaps` to a new `retargetUnlocked`
  record list ("当時 ENGINE_GAP だった記録として残す"). It is asserted like the other unlocked lists: no override remains.

## Test — `tools/test_s03_u141_kagemusha.js` 11/0 (real DUEL path, Replay-audited)
- A: the opponent's 月の書 targets 六武衆－イロウ. 影武者 is offered as a response; 月の書 then turns 影武者 face-down DEF, イロウ
  stays face-up, and the log shows the redirection.
- B: 影武者 is not offered when:
  - 月の書 targets ワイト (not 「六武衆」);
  - 月の書 targets 影武者 itself;
  - the effect is サンダー・ボルト (no target);
  - 影武者 is face-down (then 月の書 turns イロウ face-down as normal).
- Negative control on U140: A fails.
- Pre-scan of all 360 gate tests (parallel): 0 FAIL after the `test_v710_batch23` list update.

## Status
- 六武衆の影武者 ENGINE_GAP → TESTED (focus registered). TESTED 2217 → 2218, ENGINE_GAP 609 → 608.
