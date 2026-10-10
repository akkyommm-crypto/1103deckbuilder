# S03-U105 血の代償 (Cost of the Blood) — Tribute-payment fix (Claude)

Base: shared LATEST `checkpoint_claude_s03_u104_cost_of_the_blood_20260920.zip` (Claude, U104).

## Why this unit

Direct follow-up to U104's own flagged top-priority finding: 血の代償's `resolve()` Special-Summoned the
chosen hand monster (treated as a Normal Summon) via a raw `FX_SPECIAL_SUMMON` action with **zero Tribute
payment or Tribute-count check at all**, regardless of the summoned monster's real Level. Confirmed
empirically in U104: a real Level-8 monster (real 2-Tribute requirement) was Special Summoned for free,
paying only the card's own 500 LP cost — a real "wrong result"-class bug on a real-duel-reachable card
(tg_gadget main deck).

## Investigation

No card anywhere in this codebase previously reused the real tribute-selection machinery
(`normalSummonMethodsFor`/`pickTributes`, `engine/70_summon_procedures.js`) from within a script's own
`resolve()` — both are designed as top-level UI-action handlers (`openPick`/`showToast`, reading
`gameState.activePlayer` directly), not safely composable mid-chain-resolution. Reusing them as-is was ruled
out; instead, the pure-logic pieces underneath them were identified as safely reusable:

- `normalSummonMethodsFor(db,p,mode)` — already correctly determines the real required Tribute count
  generically (not naive Level math alone — it also respects any registered alternate summon methods and
  already filters out methods the current real field can't afford).
- `tributeCandidatesForV23(p,db,method,mode)` — the real legal Tribute candidate pool, including any
  material-filter restrictions a summon method might declare.
- `tributeValueOptions(card,targetDb)` — the real 2-for-1-style Tribute value exceptions (e.g. certain
  archetype monsters that can count as 2 Tributes).

## Fix

`cards/00_generic_core.js`:

- `condition()`: now requires a real hand monster with at least one real **affordable** summon method
  (`normalSummonMethodsFor(...).length>0`), not merely "a monster in hand" — this also correctly makes the
  card illegal when the real board can't pay for any hand monster's real Tribute requirement.
- `selectTargets()`: filters candidates the same way, so an unaffordable hand monster is never even offered
  as a target.
- `resolve()`: now calls a new small recursive helper, `s03BloodOfferTributeThenSummon(p, targetCard,
  method, db, chosen)`, which real-selects Tribute monsters one at a time via the same replay-safe
  `API.selectCard` pattern already used throughout this codebase's card scripts (not the raw
  `openPick`/`act()` combo `pickTributes` uses), sends each really-chosen Tribute to the real Graveyard via
  `API.sendToGrave` once enough real Tribute value is gathered, then performs the real Special Summon
  (treated as a Normal Summon) exactly as before.

No engine change; single-card fix (`cards/00_generic_core.js` only), composing existing engine primitives.
血の代償 was already promoted to TESTED in U104 — this is a pure correctness follow-up fix to the same card,
so no `data/s03_status_changes.json` entry is needed for this unit (matches the established S03-U78/S03-U95
precedent for a fix with no status transition).

## Dedicated test

`node tools/test_s03_u105_cost_of_the_blood_tributes.js` — 8 assertions, all pass, real DUEL path throughout.

- **A**: a real Level 6 hand monster (ジュラック・ヘレラ, no special summon procedure) really needs and
  really pays exactly 1 real Tribute before really being Special Summoned.
- **B**: a real Level 8 hand monster (青眼の白龍) really pays BOTH real required Tributes before really
  being Special Summoned — the core fixed bug (previously summoned for free with zero Tributes paid).
- **C**: a real negative control — illegal with only 1 real Tribute available for a real 2-Tribute-requiring
  monster (the other half of the fix: previously any hand monster was offered regardless of real
  affordability).
- **D**: a real mixed-hand confirmation — with both a real affordable and a real unaffordable monster in
  hand, only the real affordable one is really offered as a target candidate.

Every segment carries a clean Replay audit. `tools/test_s03_u104_cost_of_the_blood.js` (11/0, the prior
unit's own dedicated test) was re-run and confirmed still passing unaffected.

## Coverage / status audit

- No status change this unit (血の代償 already TESTED, U104). `CARD_TEST_FOCUS` given an explicit empty-set
  entry for this test file (matches the S03-U70 precedent for a pure fixture-only test file).
- `python tools/s03_status_audit.py`: EXIT 0, 105 declared status changes (unchanged from U104), off-target
  = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13397 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations (log `s03_u105_full_gate.log`).

## Real-duel measurement

A real card-logic fix, so a fresh R1 sweep was run:

- `R1_DECKS=tg_gadget,dragunity R1_RESPOND=1`, seed `0x4`, first=0 — completed cleanly, turn 11,
  `replay.ok:true`.
- `R1_DECKS=tg_gadget,tg_skill R1_RESPOND=1`, seed `0x2`, first=1 — completed cleanly, turn 4,
  `replay.ok:true`, `digestDiff:null`. 血の代償 was actually present in P0's opening hand.

Both: `blocker:null`, `errors:[]`, `unsupported:[]`.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`689f47c946d842de52dbcfe1739843a4a8f4f3be15afbacc8749481876c56f1a` (864 files).

## Remaining

2 more qty=3 main-deck IMPLEMENTED candidates remain from U97's cross-reference: TG ラッシュ・ライノ,
TG1－EM1 (both tg_skill) — then the Extra Deck tier. Re-run the cross-reference fresh at the start of the
next unit rather than trusting this list verbatim.
