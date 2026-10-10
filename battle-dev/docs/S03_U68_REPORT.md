# S03-U68 C-S03-27 ACTIVATION_NEGATED_RELEASE secondary (Claude)

Base: shared LATEST `checkpoint_claude_s03_u67_dezaado_counter_20260918.zip` (Claude, U67).

## Why this unit

Fixed fallback order after U67: WORK_QUEUE's Ready head — **C-S03-27 secondary**, S03-U34's own explicitly-flagged
"② Remaining" list of "1ターンに1枚しか発動できない" cards left undeclared: オーバー・レンチ, 無欲な壺,
限定解除 (all NOT_STARTED), 魔力掌握 (AUTO_DECK_TABLE coarse), plus the note "黒羽の宝札 sets `noSpecialSummon`
in its cost, so it stays locked even if its activation is negated (unverified ruling)."

## Ruling research

Researched 黒羽の宝札's English print ("Cards for Black Feathers") and the closely analogous, much better
documented "the turn you activate this card" restriction on Instant Fusion via web search (Yugipedia/db.yugioh-card.com/ygoprodeck).
No source gave a definitive ruling for this exact interaction, but reading the card's own engine
(`declareActivationNegatedReleaseS03`'s `noSpecialSummonWhileChained`) resolved the real question: the
restriction does **not** need to be a permanent cost-time flag to correctly block Special Summons for the
whole window the card is on the chain — the engine's own chain-scoped check already does that. The card only
needs to make the lock *persist after resolution*, which should not happen when the activation itself never
resolves. This reframes "unverified ruling" as a **confirmed architecture mismatch**: 黒羽の宝札 bypassed the
established C-S03-27 pattern (강欲で謙虚な壺 itself sets its `noSpecialSummon` in `resolve()`, not `cost()`)
and hand-rolled an incorrect cost-time version.

## Cards declared

New file `cards/H8D_claude_s03u68_activation_negated_release_secondary.js`, each declared through
`declareActivationNegatedReleaseS03(name, {count:true})` (a negated activation refunds the once-per-turn-by-name
count, the 2011 wiki 10/05/19 ruling for 強欲で謙虚な壺 applied here as the same general OCG principle — none
of the five cards below have a published card-specific exception to it):

- **オーバー・レンチ**: doubles a targeted face-up "Wind-Up" monster's ATK/DEF, schedules its return to hand at
  the real End Phase via the System v7 scheduler (`API.schedule` / `API.registerScheduleHandler`).
- **無欲な壺**: selects 2 cards total from either player's GY, returns each to its owner's Deck, banishes
  itself instead of going to the GY.
- **限定解除**: pays 1000 LP, Special Summons a Ritual Monster from hand via a resolution-time choice (S03-U58
  pattern), flags it `cannotAttack` (existing generic flag), schedules its destruction at the real End Phase.
- **魔力掌握**: replaced its AUTO_DECK_TABLE coarse entry (a later literal `defineScript` is never overwritten
  by the table loader's own `if(CARD_SCRIPTS[nm])return;` guard — same precedent as every other AUTO_DECK_TABLE
  replacement this session) with a real script: places a Spell Counter on a counter-capable card (reusing the
  existing System v22 counter primitive, `API.counterCapableCards`/`API.addCounter`), then a real yes/no choice
  for the optional Deck search of another copy.
- **黒羽の宝札** (bug fix, not a new script): moved the `noSpecialSummon` flag-set from `cost()` to `resolve()`
  and declared `noSpecialSummonWhileChained:true` alongside `count:true`.

## Two real bugs found and fixed while building this unit

1. **`afterResolve` semantics misunderstanding, resolved via a debug probe.** The engine's own resolution
   completion path (`engine/40_legal_script_engine.js`) is `if(sc.afterResolve) sc.afterResolve(ctx); else
   selfToGrave(ctx);` — providing *any* `afterResolve` (even an empty `{}`) suppresses the default "send to
   grave" behavior entirely. Cards that want default grave behavior must **omit** `afterResolve`; cards that
   want to redirect the destination (like 無欲な壺's self-banish) must provide `afterResolve(ctx)` and do it
   explicitly. Confirmed empirically with a throwaway debug script before writing 無欲な壺's real
   `afterResolve`.
2. **A systemic `registerScheduleHandler` callback-signature bug, found while debugging オーバー・レンチ's own
   End Phase return.** `runDueSchedulesV7` calls each handler as `fn(Object.assign({}, e.args||{}), e)` — the
   **first** parameter is already the unwrapped `args` object; the full entry is the *second* parameter. My
   own first draft used `(entry) => { entry.args.uid }`, which silently no-ops (`entry.args` is `undefined`,
   so the guard `if(uid==null) return;` returns immediately with no error, no journal entry, no visible
   symptom other than "nothing happens"). Fixed to `(args) => { args.uid }`. **A grep afterward found this
   exact same `(entry) => entry.args.X` shape in roughly 30 other `registerScheduleHandler` registrations
   across a dozen `cards/*.js` files (A8, A9, B1, B3–B8, C0–C2)** — a real, previously-undetected, wide-reaching
   latent bug (their scheduled End-Phase/delayed effects likely silently never fire), left as the next
   Requirement (see Remaining) rather than folded into this unit's own scope, since fixing and re-verifying ~30
   handlers across a dozen files is a substantial unit on its own.

## Dedicated test

`node tools/test_s03_u68_activation_negated_release_secondary.js` — 22 assertions, all pass, real DUEL path
throughout: real Set-Trap and hand activations, a real `PROCESSOR_V27.PHASE` transition to a genuine End Phase
(not a direct `gameState.phase` mutation — that shortcut, still used by some legacy synchronous test files in
this codebase, does not journal the transition and produces Replay-audit digest mismatches), a real chain
response by 神の宣告 (negates both a Trap and a Spell activation, confirmed exactly-half-LP cost), and a real
`getLegalZoneActions`/`v46GlobalSpecialSummonRestrictionReason` check for the cannotAttack/noSpecialSummon
restrictions.

## Pre-existing test fallout

None found. Re-ran `test_s03_u34_pot_resolution.js`, `test_s03_u01_raioh_lock.js` (the existing C-S03-27
mechanism's own tests), `test_expansion_v340.js`, and `test_auto_cycle07.js` (references 思い出のブランコ,
which shares the discovered scheduler-callback bug but was not itself touched this unit) — all pass unchanged.

## Gate

- `python tools/check.py` — EXIT 0, **13071 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations (log `s03_u68_full_gate.log`).
- `python tools/s03_status_audit.py` — EXIT 0: 70 declared status changes (64 carried + 6 new this unit), 0
  off-target, TOTAL 4996.
- Coverage: TESTED 2109 → 2115 (+6: オーバー・レンチ, 無欲な壺, 限定解除, 魔力掌握, 黒羽の宝札, 神の宣告).
- Acode build skipped for this unit per current instruction (generate only at release or on explicit
  request).

## Real-duel measurement

None of these cards are on any `1103_MAJOR_DECKS_v1` fixed list; the dedicated test's real activation/
negation/scheduling paths (each closed with a Replay audit) are this unit's evidence.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips, this report set aside):
`5c51532cf032d84b3b6b84b01ea3317e7493eae90faee245d47052acfe7d8baf` (781 files).

## Remaining

- **The `registerScheduleHandler` callback-signature bug found in ~30 other registrations** across
  `cards/A8_auto_cycle06.js`, `A9_auto_cycle07.js`, `B1_auto_cycle09.js`, `B3_auto_cycle11.js` through
  `B8_auto_cycle16.js`, `C0_auto_cycle18.js` through `C2_auto_cycle20.js` — every one shaped
  `(entry) => { entry.args.X }` instead of `(args) => { args.X }` silently no-ops. This is priority #1 in the
  fixed fallback order (the same bug class just confirmed, in an unaudited area) and is the natural next unit.
- C-S03-27 secondary is otherwise fully closed.
