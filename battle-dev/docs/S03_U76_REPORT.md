# S03-U76 始祖の守護者ティラス ENGINE_GAP→TESTED (Claude)

Base: shared LATEST `checkpoint_claude_s03_u75_target_immune_cache_fix_20260919.zip` (Claude, U75).

## Why this unit

After U75's preventive audit closed out the cache-poisoning bug class, this unit returns to priority #7
(NOT_STARTED/PARTIAL/IMPLEMENTED/ENGINE_GAP cards within the fixed major decks). Re-examined the two
ENGINE_GAP candidates identified in an earlier priority #7 pass (六武衆の影武者, 始祖の守護者ティラス) — the
first genuinely needs a large new capability (source-aware target redirection during chain construction); the
second's flagged gap turned out to be stale.

## Card

始祖の守護者ティラス (this project's own card database, printed 2011-04-16, within the 2011-08-31 cutoff), a
x1+ Worm major-deck Xyz monster. LIGHT/Angel/Xyz/Effect, Rank 5 (2 Level 5 monsters), ATK 2600/DEF 1700: "This
card's effects are not applied if it has no Xyz Materials. This card cannot be destroyed by card effects. At
the end of the Battle Phase in which this card battled, select 1 card your opponent controls and destroy it.
Remove 1 Xyz Material from this card during each of your End Phases."

## The gap-audit note was stale

`data/script_status_overrides.json` forced this card to ENGINE_GAP with reason "Needs generic
effect-destruction immunity/replacement support." That capability already exists:
`engine/1K_destruction_protection_v21.js` (System v21, `sc.protectV21`), an established primitive supporting
both `battle` and `effect` destruction causes with function-valued conditions, `perTurn` limits, source-kind
filters, etc. — evidently built sometime after the gap note was written, with no later pass re-auditing this
specific card against it. No new engine capability was needed at all.

## Fix

Declared via `defineUnifiedCardV4` (new file `cards/HK_claude_s03u76_saigo_no_guardian_tyrannus.js`), reusing
three already-established primitives:

- `protectV21:{effect:(target)=>s03u76HasMaterials(target)}` — the "cannot be destroyed by card effects" clause,
  gated by a function so the "effects not applied without Xyz Materials" restriction applies directly to the
  destruction-immunity clause itself, matching the established v21 precedent
  (`cards/9G_destruction_protection_recovery.js`).
- `API.battledThisPhase(ctx.card)` — the real "at the end of the Battle Phase in which this card battled"
  gate, precedent: ビッグ・ジョーズ／ステルスロイド (`cards/91_battle_recovery.js`).
- `API.detachMaterial(p, mzIndex, reason)` — the real per-End-Phase material removal.

**A real, unrelated bug found incidentally and separately flagged (not fixed in this unit):** researching the
material-removal primitive revealed that `エクシーズエナジー` (`cards/56_v56_autobuild_batch08.js`) checks
`card.materials` to find a legal Xyz monster to detach from, but the real production Xyz-summon/detach code
(`engine/00_state_actions.js`, `FX_EX_SUMMON`/`FX_DETACH`) stores materials on `card.xyz`, a different field
never set as `.materials` anywhere. This means エクシーズエナジー can never find a legal target in a real duel,
despite carrying TESTED status — its own dedicated test only checks that the registration string exists in
the built HTML, never exercises the card's real behavior. Flagged via `spawn_task` for a separate follow-up;
out of this unit's scope. (My own card correctly uses `card.xyz`, confirmed via a real Xyz Summon in the
dedicated test below.)

## Dedicated test

`node tools/test_s03_u76_saigo_no_guardian_tyrannus.js` — 11 assertions, all pass, real DUEL path throughout
(a real `exCombos`/`doExSummon` Xyz Summon with 2 real Level 5 monsters, real attack + real Battle-Phase-end
resolution, real End-Phase material removal, real effect-destroy attempts via サンダー・ブレイク).

- **A**: a real Xyz Summon combo is found and executed; confirms 2 real materials attach (`card.xyz`); a real
  attack + real Battle Phase end genuinely destroys a real opponent monster; confirms materials are untouched
  by this clause.
- **B**: a real End Phase removes exactly 1 real material (2→1).
- **C**: a real effect-destroy attempt (サンダー・ブレイク, a real Trap requiring a real hand-discard cost)
  fails to destroy it while materials>0 (clean Replay audit); once materials are manually zeroed (a documented
  test-harness shortcut — B above already covers a real End-Phase removal with a clean Replay audit, so this
  segment only needs to confirm the re-evaluation), the same real effect-destroy attempt genuinely succeeds —
  confirming `protectV21` correctly re-evaluates live state every time rather than trusting any stale answer,
  matching the S03-U74/U75 discipline established this session.

## Coverage / status audit

- Removed the stale `始祖の守護者ティラス` entry from `data/script_status_overrides.json`.
- `python tools/script_coverage.py`: `ENGINE_GAP` 613→612 (-1), `TESTED` 2121→2122 (+1).
- `python tools/s03_status_audit.py`: EXIT 0, 77 declared status changes, **off-target status changes = 0**
  (`CARD_TEST_FOCUS` given an explicit `{"始祖の守護者ティラス"}` entry for this test file, precedent:
  U56/U70/U71/U73, so サンダー・ブレイク — genuinely exercised as a fixture but out of this unit's own scope —
  is not incidentally promoted).

## Gate

- `python tools/check.py` — EXIT 0, **13132 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no duplicate
  top-level function declarations.

## Real-duel measurement

Worm vs Six Samurai — a previously-untried fresh pair, chosen to both confirm no regression from this unit
and extend fresh-pair coverage — **8/8 clean**, every run `completed:true`, `blocker:null`, `errors:[]`,
`unsupported:[]`, `replay.ok:true`.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`ef34d040bfb4ba22de6cd731055e49a8abb1dbb210146b615d1d15e56101ae18` (802 files).

## Remaining

- 六武衆の影武者 remains the one genuine ENGINE_GAP card found in this priority #7 pass that needs a real new
  capability (source-aware Spell/Trap/monster-effect target redirection during Chain construction) — left for
  a future unit.
- エクシーズエナジー's `.materials`-vs-`.xyz` bug flagged via `spawn_task`, not fixed here.
- Per the fixed fallback order, continuing directly into the next Requirement.
