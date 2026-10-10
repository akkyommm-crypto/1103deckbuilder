# S03-U95 R1 driver per-turn replay-audit cadence fix (Claude)

Base: shared LATEST `checkpoint_claude_s03_u94_ryko_lightsworn_hunter_20260919.zip` (Claude, U94).

## Why this unit

S03-U94's own regression sweep found a real, reproducible 120s VM timeout: `R1_DECKS=debris,agent`
(Debris as player 0), seed `0x3`, `first=0`, `R1_LIST=v1 R1_RESPOND=1`. Confirmed unrelated to U94's own
fix (see that unit's report). Per the standing Master Prompt's fixed fallback priority order, this real R1
hang took priority over continuing straight into further priority #7 IMPLEMENTED-tier candidates.

## Investigation

Using an instrumented copy of `tools/r1_duel_driver.js` (console.log tracing added at every major loop and
branch point; kept only in the session scratchpad, never committed) against the exact reproduction case,
step-by-step tracing showed:

- The live duel simulation itself progresses completely normally through many turns (confirmed with real
  attacks, real Special Summons, real chain responses, etc. all resolving correctly).
- The hang is not in the live game logic at all. Every turn ends with a call to `v41ReplayPackage(gameState)`
  followed by `v44ReplayAuditPackage(pk)` — a full re-simulation of the ENTIRE action journal from action 1,
  used as an early divergence detector. Tracing pinpointed the timeout to inside this audit call.
- Testing with an extended (8-minute) VM timeout confirmed the duel is NOT actually stuck: it completes
  normally at turn 46 with `completed:true`, `replay.ok:true`, `digestDiff:null`, and a clean `deckout` loss
  — no card/engine bug of any kind. This specific debris-vs-agent matchup, at this specific seed and player
  order, simply produces an unusually long (40+ turn), grindy duel.
- Root cause: `v44ReplayAuditPackage` re-simulates the whole journal from scratch on **every single turn**.
  For a duel with N turns and a journal that grows roughly linearly with turn count, auditing every turn
  makes the *total* audit cost across the whole duel O(N^2) in the final journal length — by turn 39 the
  journal held ~1300 actions, and a single from-scratch re-simulation of that size, on top of 38 prior
  audits of smaller-but-still-substantial size, exceeded the driver's own 120-second script timeout even
  though the underlying engine and every card's own behavior were completely correct throughout.

This is a measurement-tooling limitation, not a card or engine correctness bug — `tools/r1_duel_driver.js`
is explicitly documented as "a measurement tool, not a gate test." No `cards/*.js` or `engine/*.js` file
needed any change; only the R1 driver's own per-turn audit cadence needed adjustment.

## Fix

`tools/r1_duel_driver.js`'s per-turn replay-consistency check now runs every turn through turn 20 (preserving
prompt early-divergence detection for the vast majority of duels, which finish well under 20 turns), then
only every 5th turn beyond that. The existing post-loop audit (already unconditional, covering the true
final state) is untouched, so this only delays — never skips — eventual divergence detection for unusually
long duels; a genuine REPLAY_DIVERGENCE occurring past turn 20 would still be caught, just up to 4 turns
later than before.

## Verification

- The exact reproduction case (`R1_DECKS=debris,agent`, seed `0x3`, `first=0`) now completes well within the
  standard 120-second budget: `completed:true`, `turn:25`, `lp0` loss, `replay.ok:true`, `digestDiff:null`,
  `journal:1056`, `errors:[]`, `unsupported:[]`.
- Re-ran twice back-to-back: bit-for-bit identical results both times (`journal:1056`, `opsCount:285`,
  identical LP/turn/loser) — confirms the audit-cadence change is fully deterministic and has zero effect on
  actual gameplay (the audit swaps in a separate replayed `gameState`, does its work, and restores the live
  one — it was always meant to be side-effect-free, and this change only affects how often that
  side-effect-free check runs).
- Full 8-combo R1 sweep, Debris vs Agent (`debris,agent` order), seeds 0x1-0x4 x first-player {0,1}: **8/8
  clean**, including the exact former hang case.
- Regression spot-check on 3 other already-clean pairs (`agent,debris`, `dragunity,rabbit`,
  `karakuri,tg_gadget`, seed 0x1/first=0): all clean, unaffected.

## Gate

- `python tools/check.py` — EXIT 0, **13306 PASS / 0 FAIL** (unchanged from U94 — this is a tooling-only
  change, no `cards/*.js`/`engine/*.js` file touched, so no coverage/status-audit impact).
- No `data/s03_status_changes.json` entry needed (matches the established S03-U78 precedent: a pure
  fix with no card status transition needs no declared-changes entry).

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`c7cf04f96f5ebd38eac8d6aeeb66c495b3f23ca51cebf5ee7b230f35be9a1b1e` (844 files).

## Remaining

Priority #7's IMPLEMENTED-tier audit resumes from where S03-U94 left off: ミラクル・フュージョン (qty=3,
hero), plus more at qty=3 and below not yet fully enumerated. The Extra Deck tier remains separately
available: A・O・J カタストル / インヴェルズ・ローチ (qty=10 each), 氷結界の龍 ブリューナク (qty=8), No.39
希望皇ホープ (qty=8), TG ハイパー・ライブラリアン (qty=6).

Future writers auditing further deck pairs (especially both player-order permutations of a pair, or pairs
prone to long grindy duels) may occasionally still see a duel run long; this fix raises the practical ceiling
substantially but does not remove it entirely (an extremely long duel, e.g. 80+ turns, could still exceed
the budget). If that recurs, first confirm via an extended-timeout re-run whether the duel genuinely
completes correctly (as done here) before assuming a new engine bug — this exact investigation methodology
is reusable.
