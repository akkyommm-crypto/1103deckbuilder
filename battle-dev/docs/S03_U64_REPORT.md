# S03-U64 resolution-time Deck choice expansion, part 3 (Claude)

Base: shared LATEST `checkpoint_claude_s03_u63_resolution_deck_choice_expansion_20260918.zip` (Claude, U63).

## Why this unit

Fixed fallback order after U63 closed the 7 major-deck-reachable cards of its own 21-card audit: priority
#1 (the same bug class just confirmed in the prior unit, in an unaudited area — here, the same unit's own
explicitly-flagged remainder). U63's report explicitly listed the 14 of 21 audited cards not reachable from
a `1103_MAJOR_DECKS_v1` fixed-list deck as "a candidate for a later, similarly-scoped unit." This unit closes
that list, finishing the scope S03-U58 first opened.

## Scope

The 14 cards left open by U63: 終末の騎士, ダーク・グレファー, ゴブリンゾンビ, 極星獣タングニョースト,
封印の黄金櫃, コーリング・ノヴァ, 鬼ガエル, XX－セイバー エマーズブレイド, マシンナーズ・ギアフレーム,
スクラップ・エリア, ヒーローアライブ, 神の桎梏グレイプニル, ピラミッド・タートル, 魔轟神グリムロ.

## Fix

Moved each card's Deck-choice from `selectTargets` (activation-time) into `resolve()` (resolution-time),
using `API.requestChoice` against the **current** Deck state at resolution. Reused U58's own generic
registered handlers (`s03u58.deck-search`, `s03u58.deck-mill`, `s03u58.deck-special`) for every card whose
candidate pool is Deck-only (11 of 14). Two cards needed dedicated handling:

- **鬼ガエル** ①: its candidate pool spans the Deck **and** the player's own field (mz) — U58's `deck-*`
  handlers are Deck-only, so this got one small dedicated handler (`s03u63.oni-gaeru-to-grave`) that
  reproduces the original's mill-vs-sendToGrave branch based on the resolved target's zone.
- **封印の黄金櫃**: already had its own dedicated handler from U63 (`s03u63.gold-sarcophagus-banish`, which
  also registers the standby-phase reserve reminder) — no change needed here beyond the `selectTargets`
  move that U63 already made; confirmed with a new real-path test in this unit.

## Pre-existing bug found and fixed: 鬼ガエル `cost()` zone/eventName confusion

Driving 鬼ガエル's ① effect (send a Level ≤2 WATER monster from Deck/field to the GY on Normal/Special
Summon or flip) through a **real** Normal Summon for the first time (prior tests only ever exercised the
unrelated ③ ignition effect via direct `mz`-zone activation) surfaced a genuine pre-existing bug unrelated to
this unit's Deck-choice-timing fix: `cost()` branched on `ctx.zone==='mz'` alone, with no check of
`ctx.eventName`. Since the passive's own `onNormalSummon(ctx){return ctx.zone==='mz';}` guard means `ctx.zone`
is *also* `'mz'` when the ① trigger fires (the card is already on the field by then), `cost()` incorrectly
ran the ③ ignition effect's cost logic — silently forcing the player to return one of their own monsters to
hand — every time ① actually fired for real. `condition()` already had the correct ordering (checks
`ctx.eventName` against the trigger-name list *first*, falling through to the `ctx.zone==='mz'` branch only
when it doesn't match); `cost()` did not. Fixed by adding the same eventName-first check to `cost()`
(`cards/37_1103_expansion_v350.js`), matching `condition()`'s own established structure. Re-ran the two
pre-existing tests that exercise 鬼ガエル's real ③ effect (`tools/test_v370.js`,
`tools/test_s03_u08_journaled_flags.js`) after the fix — both still pass unchanged.

## Pre-existing test fallout

Three real-DUEL-path assertions in `tools/test_s03_u05_search_flags.js` (スクラップ・エリア, 神の桎梏グレイ
プニル, 魔轟神グリムロ) called `pick(target)` immediately after `duelActivateFromHand`/`activateAt`,
assuming the old activation-time choice; since the choice now opens only after the chain resolves, each was
updated to drive the chain to that point first (`pass()`/`if(!pendingChoiceV49(...))pass()` before `pick()`,
matching the established pattern already used for 光の援軍 in the same file). One assertion in
`tools/test_v380.js` (ヒーローアライブ) called `sc.selectTargets`/`sc.resolve` directly and expected the
target synchronously; added a `pendingChoiceV49`+`__choicePickV49(0)` drain after `sc.resolve(ctx)`. All
other files referencing these 14 card names (deck-list entries in slice tests with a generic
`pendingChoiceV49`→auto-pick driver, or unrelated targeting/placement of the same card by a different card's
test) needed no change — confirmed by grep across `tools/test_*.js` and running every match.

## Dedicated test

`node tools/test_s03_u64_resolution_deck_choice_remaining14.js` — 42 assertions, all pass, real DUEL path for
11 of 14 (hand/field/Graveyard activation, or a real Normal Summon trigger via `doNormalSummon` +
`flushDeferredEventsThroughProcessorV27`); for the 3 cards whose real trigger is a battle-destruction event
(コーリング・ノヴァ, XX－セイバー エマーズブレイド, ピラミッド・タートル), reproducing a full attack/damage-step
sequence would exercise the already-covered battle pipeline rather than this fix, so each is driven through
its own real, unmodified `condition()`/`resolve()` against a synthetic `onBattleDestroy(card=self)` event —
the same precedent set for カラクリ大将軍 無零怒 in S03-U63. Every card's assertions confirm the choice opens
with `resume.mode==='registry'` (not the old activation-time legacy shape) and that the real effect (mill /
search / Special Summon / banish) completes correctly; each block closes with a Replay audit.

## Gate

- `python tools/check.py` — EXIT 0, **12999 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations (log `s03_u64_full_gate.log`).
- `python tools/s03_status_audit.py` — EXIT 0: 56 declared status changes (50 carried + 6 new promotions
  this unit), 0 off-target, TOTAL 4996.
- Coverage: TESTED 2099 → 2105 (+6: 終末の騎士, ゴブリンゾンビ, 極星獣タングニョースト, 極星獣タングリスニ
  [promoted as a side effect of being a real Special Summon target in the new test, not itself converted],
  封印の黄金櫃, ピラミッド・タートル — IMPLEMENTED → TESTED). The other 8 converted cards were already
  TESTED or GENERIC_OK before this unit.
- Acode build skipped for this unit per current instruction (generate only at release or on explicit
  request).

## Real-duel measurement

None of these 14 cards are reachable from a `1103_MAJOR_DECKS_v1` fixed-list deck (that is precisely why
U63 deferred them), so an R1 sweep over the fixed pairs would not exercise any of them — the dedicated test
above is this unit's real-DUEL-path evidence instead, per-card, including a Replay audit for each. No new R1
sweep was run this unit; the existing clean sweep history from U58/U60–U63 stands unchanged.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips, this report set aside):
`33fbc5b2d66017ca5414f65d622ed87caa953ebdecf0ed135ad95f5e68ea3ee3` (768 files).

## Remaining

- S03-U58's "beyond the representative set" scope (21 cards sharing the activation-time Deck-choice
  anti-pattern) is now fully closed: all 21 converted across U58/U63/U64.
- Per the fixed fallback order, continuing directly into a fresh real-duel sweep / the next Ready item.
