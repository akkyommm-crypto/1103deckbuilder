# S03-U70 getChainResponsesV2 mz-zone kind guard (real R1 infinite-loop hang) (Claude)

Base: shared LATEST `checkpoint_claude_s03_u69_schedule_handler_args_bugfix_20260918.zip` (Claude, U69).

## Why this unit

Fixed fallback order after U69: no remaining scope for U69's bug class (a static scan confirmed every buggy
`registerScheduleHandler` registration was fixed), so per priority #6 (an additional real-duel sweep of an
under-measured major-deck pair) a fresh R1 sweep of a not-yet-tried `1103_MAJOR_DECKS_v1` pair (Dark World vs
Agent) was run. It found a genuine, reproducible **infinite-loop hang** — the harness's own 120-second VM
timeout was hit (`Error: Script execution timed out after 120000ms`), not a driver artifact. This overrides
priority #6's own result: a hang blocking a major-deck pair is itself a Ready Requirement (priority #3: adjacent
paths causing DUEL state corruption) and was pursued to completion before any further sweeping.

## Reproduction

`R1_LIST=v1 R1_RESPOND=1 R1_DECKS=dark,agent R1_OUT=<dir> node tools/r1_duel_driver.js 0x1 1 500` hangs past the
120s VM timeout. Custom instrumentation (temporary `tools/_dbg_r1_instrumented.js`, a copy of the driver with
`[SAFE-BEGIN]`/`[SAFE-END]`/heartbeat/targeted-note tracing, run in the background with output redirected to a
file, deleted after the investigation) showed `gameState.chain` growing without bound — 85, 86, 87, 88, 89...
links, each topped by the same card — confirming a real chain-response dispatch loop, not a scheduler or AI
decision-loop issue.

## Root cause

`getChainResponsesV2` (`engine/30_processor_chain_battle.js`) builds the legal chain-response candidate list. Its
generic "declared quick-effect responder" scan iterates `['hand','grave','banish','mz']` and, for `zone==='mz'`
specifically, skips the normal `canActivateFromZone` gate entirely
(`if(!canActivateFromZone(db,z)&&z!=='mz') return;`) — an exemption that exists for real on-field monster
quick-effects (e.g. クレボンス negating an attack declared against itself). The scan never checked `db.k`, so
any card whose script has `quickEffect:true` — including a Spell/Trap card, if a reference to it is ever
scanned from a player's `mz` array — is offered as a legal responder from mz with none of the real zone/timing
safeguards a Trap normally gets from the `P.sz` branch (in particular the `c.setTurn===gameState.turn`
same-turn-Set guard). In the reproduced duel this let a Trap (砂塵の大竜巻, confirmed via the instrumented
trace) be repeatedly "activated" from mz; each activation opened a fresh chain link that itself became eligible
to respond to, since nothing in that path ever removed the underlying reference. The chain never received two
consecutive passes, so `SOLVE_CHAIN` never fired, and `gameState.chain` grew forever.

The precise mechanism by which a Trap reference ended up scanned from `P.mz` in the first place was **not**
further traced within this unit's scope (see Remaining) — `SET_ST`'s action handler was checked and correctly
targets `P.sz` only; `pointActivateV27`'s point-window-reopening behavior (`CHAIN_AFTER_V2` re-enqueues the same
POINT window after a chain resolves) was noted as a plausible contributor to the loop's *persistence*, not
necessarily its *origin*. This matches this session's own established precedent (e.g. S03-U60's field-reactivation
fix) of fixing the shared gatekeeper generically rather than chasing every possible corruption pathway, once a
generic, unambiguously-correct dispatch-level fix is found and verified.

## Fix

`engine/30_processor_chain_battle.js`, the mz-zone branch of the quick-effect scan: additionally require
`db.k==='m'` before offering a card found via the mz exemption. A Spell/Trap card must never be offered as a
chain-response candidate through this path, regardless of how a reference to it ends up scanned there. Real
on-field monster quick-effects (`db.k==='m'`, e.g. クレボンス, エフェクト・ヴェーラー) are completely
unaffected — the added check sits strictly before the existing `canActivateFromZone` exemption and changes
nothing for `db.k==='m'`.

```js
if(z==='mz'&&db.k!=='m') return;
if(!canActivateFromZone(db,z)&&z!=='mz') return;
```

Empirically confirmed against the exact original reproduction case after rebuild: `R1_DECKS=dark,agent`,
seed=0x1, first=1 now completes cleanly at turn 16 (`deckout`, `replay.ok:true`), no timeout.

## Dedicated test

`node tools/test_s03_u70_chain_response_mz_kind_guard.js` — 8 assertions, all pass, real DUEL path throughout.
Deliberately built on two cards that are already TESTED (クレボンス, くず鉄のかかし) rather than 砂塵の大竜巻
(the real card from the reproduction, named only in this file's explanatory header comment) — this is an
engine-dispatch-level fix, not a card-behavior fix, and using an already-TESTED fixture keeps
`tools/script_coverage.py`'s text-scan-based test attribution from mis-promoting an unrelated card's status as
an incidental side effect of a comment mentioning its name. (`script_coverage.py`'s `CARD_TEST_FOCUS` was given
an explicit empty-set entry for this file, matching the pre-existing U56 precedent, so no card is ever
attributed to this file even if a future edit mentions one in a comment.)

- **A**: a real `requestProcessorV27(PROCESSOR_V27.ATTACK, ...)` declares an attack against a real, face-up
  クレボンス sitting in mz; confirms it is still correctly offered by `getChainResponsesV2` (regression safety
  for the exemption's legitimate use case), then drives it through a real activation and a clean Replay audit —
  the attack is genuinely negated for 800 LP, no battle damage.
- **B**: a Trap card (くず鉄のかかし) placed directly in a player's `mz` array (simulating the corrupted/mis-scanned
  reference the real R1 hang exhibited) is confirmed **not** offered by `getChainResponsesV2` — the direct fix
  verification. The fix's guard fires before `condition()`/legality are ever consulted, so this isolates the
  dispatch-level bug from either card's own logic.
- **C** (control): the same Trap, correctly Set in `sz` on an earlier turn, real attack declared against its
  controller — confirms it is still legally offered from `sz` and, driven to resolution with a clean Replay
  audit, still really negates the attack. Confirms the fix does not disturb the normal, correct Trap-response
  path.

## Coverage / status audit

- `python tools/script_coverage.py`: unchanged distribution vs. U69 (`TESTED` 2115, `IMPLEMENTED` 157) after the
  `CARD_TEST_FOCUS` fix — this unit declares no new cards and promotes no card's status.
- `python tools/s03_status_audit.py`: EXIT 0, 70 declared status changes (unchanged from U69), **off-target
  status changes = 0**.

## Gate

- `python tools/check.py` — EXIT 0, **13088 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no duplicate
  top-level function declarations (log `s03_u70_full_gate.log`).

## Real-duel measurement

The Dark World vs Agent pair (`data/r1_lists/major_decks_v1_dark.txt` / `major_decks_v1_agent.txt`) had reached
7/8 clean before this unit; the 1 hang is this unit's fix. A follow-up re-sweep (same day, same checkpoint,
measurement only — no code change) confirmed **8/8 clean** across seeds 0x1-0x4 x first-player {0,1}
(`R1_LIST=v1 R1_RESPOND=1 R1_DECKS=dark,agent`, maxTurns=500): every run `completed:true`, `blocker:null`, no
errors/unsupported, `replay.ok:true`. The exact original reproduction case (seed=0x1, first=1) completes at
turn 16 (deckout). Dark World vs Agent is now a fully confirmed clean major-deck pair.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`5cd1c6166bdb4833b548f4b17d83cefe3e99101c2b11aafb47e200400d0c1219` (786 files).

## Remaining

- The precise pathway by which a Spell/Trap reference ends up in a player's `mz` array was not fully traced
  (see Root cause). The dispatch-level fix is generic and unambiguously correct regardless of the pathway, so
  this was a deliberate, bounded stop rather than an open risk to the fix itself — but if a similar hang
  resurfaces on a different card/deck pair, the mz-corruption source itself (not this guard) would be the next
  place to look.
- Dark World vs Agent re-swept to a full 8/8 clean confirmation (see Real-duel measurement above). Per the
  fixed fallback order, continuing directly into the next Requirement (fresh major-deck-pair sweeps / WORK_QUEUE
  Ready items).
