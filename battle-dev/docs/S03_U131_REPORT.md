# S03-U131 — 王家の眠る谷－ネクロバレー in DUEL chain resolution

## Why
Found while checking which engine paths still depend on MANUAL-only globals, after U130's `API.selectCard` fix.
`graveMoveBlocked(zone, kind)` (`cards/10_themes_a.js`) decides whether ネクロバレー stops a GY move:
- banish: always blocked;
- other moves (revival, salvage, return to Deck): blocked only while "an effect is resolving"
  (`SCRIPT_PHASE === 'resolve'`);
- exceptions: effects activated in the GY (the 1103 ruling, `SCRIPT_ZONE === 'grave'`) and `ignoresNecrovalley` scripts
  (`ACTIVE_SCRIPT`).

Only the MANUAL `runScript` sets those globals. The DUEL chain resolution (`resolveOnePreparedLinkV27`) never did, so in
real duels 死者蘇生 revived a monster under the opponent's ネクロバレー (measured on U130: ワイト ended on the field). Only
banishing was stopped.

## Change
- `engine/1R_damage_step_resolution_s03.js`: `RESOLVING_LINK_S03` also records the block's activation zone (`from`). The
  S03-U22 marker is set when a block starts resolving and kept after a mid-resolution choice, until the next block or the
  end of the chain.
- `cards/10_themes_a.js` `graveMoveBlocked` treats the resolving chain block like `runScript`'s resolve phase:
  - it is "resolving" unless a cost is being paid;
  - "activated in the GY" comes from `RESOLVING_LINK_S03.from`;
  - `ignoresNecrovalley` is read from the resolving block's script.
  The MANUAL path is unchanged.
- Activation legality is unchanged: 死者蘇生 can still be activated, and its revival does not happen at resolution. This is
  the rule the MANUAL path already applied.

## Test — `tools/test_s03_u131_necrovalley_duel.js` 8/0 (real DUEL path, Replay-audited)
- A: under the opponent's ネクロバレー, 死者蘇生 resolves and ワイト stays in the GY; no block is left marked after the chain.
  Control: without ネクロバレー, ワイト is revived.
- B: グローアップ・バルブ, activated in the GY, still revives itself under ネクロバレー (1103 ruling).
- C: 墓守の石版 (`ignoresNecrovalley`) still returns 2 墓守 monsters under its controller's own ネクロバレー.
- Negative control on U130: A fails (ワイト revived).
- Pre-scan of all 350 gate tests on the U131 build (parallel): 0 FAIL.

## Status
- No status change: 王家の眠る谷－ネクロバレー is already TESTED; its focus is registered.
