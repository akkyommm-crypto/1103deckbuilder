# S03-U106 TG ラッシュ・ライノ / TG サイバー・マジシャン IMPLEMENTED→TESTED (Claude)

Base: shared LATEST `checkpoint_claude_s03_u105_cost_of_the_blood_tributes_20260920.zip` (Claude, U105).

## Why this unit

Continuing priority #7's IMPLEMENTED-tier audit directly after S03-U105, using U97's corrected
cross-reference: TG ラッシュ・ライノ, qty=3, tg_skill main deck — next of the 2 remaining qty=3 main-deck
candidates.

## Card

TG ラッシュ・ライノ (T.G. Rush Rhino) — EARTH/Beast/Effect, Level 4, ATK 1600/DEF 800. Real text (confirmed
via Yugipedia): "If this card attacks, it gains 400 ATK during the Damage Step only. Once per turn, during
the End Phase, if this card is in the GY because it was destroyed on the field and sent there this turn: You
can add 1 'T.G.' monster from your Deck to your hand, except 'T.G. Rush Rhino'."

## What was found

Clause 1 (the continuous +400 ATK during the Damage Step while attacking) was already correct. Clause 2's
implementation in `cards/20_control_counter.js` only checked "is this card currently in the Graveyard" — no
destroyed-this-turn / End-Phase-only / once-per-turn restrictions at all.

**The investigation surfaced something more significant than a single missing check.** This is the exact
same real-text clause, in the exact same shape, already correctly and completely implemented for TG
ワーウルフ / TG ストライカー (`cards/10_themes_a.js`, S03-U87, via the shared helpers
`tgGraveClause`/`tgGraveResolve`/`tgDestroyedThisTurnS03U87`/`tgOtherPool`). Rewriting TG ラッシュ・ライノ to
reuse those same helpers directly should have been a trivial, complete fix — but a dedicated test still
failed on the "must be End Phase" case. Instrumented debugging (dumping `CARD_SCRIPTS['TG サイバー・
マジシャン'].condition.toString()` directly) revealed why: a **legacy post-processing retrofit block**
in `cards/30_themes_b.js` (predating S03-U87, running after all card files load) unconditionally
**overwrote** `.condition` for `['TG ラッシュ・ライノ','TG サイバー・マジシャン']` with an inferior shared
function, `tgEndSearchCondition`, which itself **never checked `gameState.phase==='end'` at all** — silently
discarding whatever correct implementation either card's own `defineScript` call had declared.

The same retrofit block **also** touched `['TG ワーウルフ','TG ストライカー']` — S03-U87's own cards — by
reassigning their `.passive.onEndPhase` (the trigger-*offering* hook) to a version using the bare
`destroyedThisTurn` helper instead of S03-U87's own `tgDestroyedThisTurnS03U87` (which additionally enforces
the once-per-turn flag and the "from mz" specificity). Their own `.condition` (the actual legality gate) was
left untouched, so final activation legality for TG ワーウルフ/TG ストライカー was not actually broken by
this — only the trigger-offering timing was quietly downgraded.

## Fix

- `cards/30_themes_b.js`: removed the entire obsolete retrofit block. All four named cards
  (TG ラッシュ・ライノ, TG サイバー・マジシャン, TG ワーウルフ, TG ストライカー) now already carry complete,
  correct implementations of their own — the retrofit's original purpose (retroactively adding the missing
  End-Phase trigger) is fully superseded.
- `cards/20_control_counter.js`: TG ラッシュ・ライノ and TG サイバー・マジシャン rewritten to call
  `tgGraveClause(ctx)` / `tgGraveResolve(ctx,name)` directly (S03-U87's own proven functions), plus a
  matching `passive:{onEndPhase(ctx){return ctx.zone==='grave' && tgDestroyedThisTurnS03U87(ctx) &&
  tgOtherPool(ctx).length>0;}}` hook. TG ラッシュ・ライノ's own clause-1 continuous ATK boost is unchanged.
- `cards/10_themes_a.js`: preventively added the missing `gameState.phase!=='end'` check to
  `tgEndSearchCondition` itself (the shared template used by the still-dormant `makeTgEndSearch` fallback),
  in case a future "TG" card reuses it.

No new engine primitive — this unit is entirely about correctly reusing S03-U87's own existing, proven
generic implementation and removing code that was silently defeating it.

## Dedicated test

`node tools/test_s03_u106_tg_rush_rhino.js` — 14 assertions, all pass, real DUEL path throughout.

- **A**: real clause 1 regression — a real attack by TG ラッシュ・ライノ (base ATK 1600) really gains +400
  ATK during the real Damage Step (real effective ATK 2000), really winning a real battle against a 1700
  ATK opponent monster it would otherwise lose to.
- **B**: real clause 2, the fixed bug — illegal right after a real battle-destroy while still in the real
  Main Phase; legal at the real End Phase; resolution really adds a real other "TG" monster from the Deck
  (excluding itself).
- **C**: real negative control — discarded (not destroyed on the field) does not offer clause 2 even at the
  real End Phase.
- **D**: TG サイバー・マジシャン (dependent recovery) — the identical real destroyed-this-turn +
  End-Phase-only legality confirmed, including the same before-End-Phase negative control.
- **E**: real negative control — illegal with no real other "TG" monster in the Deck.

Every segment carries a clean Replay audit. S03-U87's own dedicated test
(`tools/test_s03_u87_tg_warwolf_striker.js`, 13/13) was re-run and confirmed still passing unaffected by the
retrofit-block removal.

## Coverage / status audit

- `python tools/script_coverage.py`: `IMPLEMENTED` -2, `TESTED` +2 (TG ラッシュ・ライノ, TG サイバー・
  マジシャン).
- `CARD_TEST_FOCUS` given an explicit `{"TG ラッシュ・ライノ","TG サイバー・マジシャン"}` entry.
- `python tools/s03_status_audit.py`: EXIT 0, 107 declared status changes (+2 from U105's 105), off-target
  = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13411 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations (log `s03_u106_full_gate.log`). This includes S03-U87's own
  regression tests, confirming the shared-helper reuse and retrofit-block removal are both correct.

## Real-duel measurement

A real card-logic fix touching shared TG infrastructure used by both tg_skill and tg_gadget decks, so a
fresh R1 sweep was run:

- `R1_DECKS=tg_skill,tg_gadget R1_RESPOND=1`, seed `0x3`, first=0 — completed cleanly, turn 10,
  `replay.ok:true`. TG ストライカー drawn.
- `R1_DECKS=tg_skill,karakuri R1_RESPOND=1`, seed `0x8`, first=1 — completed cleanly, turn 12,
  `replay.ok:true`, `digestDiff:null`. TG ワーウルフ drawn.

Both: `blocker:null`, `errors:[]`, `unsupported:[]`.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`a2284e943c876598deeabb89a6029499183ac0b96cf60f615b62b0355e49098a` (866 files).

## Remaining

1 more qty=3 main-deck IMPLEMENTED candidate remains from U97's cross-reference: TG1－EM1 (tg_skill) — then
the Extra Deck tier. Re-run the cross-reference fresh at the start of the next unit rather than trusting
this list verbatim.
