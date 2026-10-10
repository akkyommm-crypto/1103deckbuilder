# S03-U77 Sin World NOT_STARTED→TESTED (Claude)

Base: shared LATEST `checkpoint_claude_s03_u76_saigo_no_guardian_tyrannus_20260919.zip` (Claude, U76).

## Why this unit

With 六武衆の影武者 confirmed as the one genuine ENGINE_GAP needing a large new capability (left open) and no
fresh unaudited bug class or Requirement pending, the fixed fallback order moves to priority #5 (WORK_QUEUE
Ready list head): Sin World, the last remaining declared item of C-S03-26 DRAW_REPLACEMENT, explicitly deferred
since S03-U65 with the note "needs a new random-reveal-pick primitive."

## Card

Sin World (this project's own card database, printed 2011-02-24, within the 2011-08-31 cutoff), a Field Spell
in the "Sin" archetype. Full text: "①: Instead of your normal draw during your Draw Phase, you can activate
this: show your opponent 3 "Sin" cards from your Deck, your opponent randomly picks 1, add that 1 to your
hand, and return the rest to the Deck." Not part of any `1103_MAJOR_DECKS_v1` fixed deck — this closes out the
secondary "all 4996 cards" goal, not the primary major-deck KPI.

## The gap note was stale

WORK_QUEUE.md's note implied a new engine primitive was needed. It wasn't — matching the exact pattern already
proven one unit earlier for 始祖の守護者ティラス (S03-U76), every needed piece already existed:

- `duelRandomInt` (`engine/06_replay_rng_v41.js`, precedent: `v80DiscardRandom`) is the established,
  Replay-safe RNG primitive for "opponent randomly picks 1."
- A resolution-time multi-select `API.requestChoice` with `min===max===N` (precedent: 酒呑童子,
  `cards/C6_auto_cycle24.js`) lets the controller choose which up-to-3 "Sin" cards to reveal, processed in its
  registered handler exactly like every other S03-U58-shaped resolution-time Deck choice in this codebase.
- `fieldIgnition:true` (precedent: 大樹海／血の代償) makes the ordinary Field-Spell placement-from-hand fully
  generic — `cardActivationOnlyV32` (`engine/30_processor_chain_battle.js`) skips `condition()`/`resolve()`
  entirely for that path, so no script logic is needed for "just place it on the field."

The one genuinely new piece: `drawReplacementCandidatesS03` (`engine/1V_draw_replacement_s03.js`) only scanned
`P.mz` and `P.grave` (the S03-U65 extension), never `P.field`. Extended it with a third branch — same shape as
the U65 grave extension, `P.field` being a single card rather than an array.

## Fix

- `engine/1V_draw_replacement_s03.js`: `drawReplacementCandidatesS03` gained a `P.field` branch (face-up check,
  `strictScriptLegalityV2(name, p, 'field', 0, {drawReplacementS03:true})`).
- `cards/H9_claude_s03_draw_replacement.js`: the `'s03u33.draw-choice'` resume handler hardcoded its accepted
  zones to `mz`/`grave` only (`if(!h || (h.zone !== 'mz' && h.zone !== 'grave') || h.p !== p) return
  drawNormally();`) — the exact same kind of hardcoded-elsewhere gotcha the U65 grave extension also had to fix
  once before. Widened to also accept `'field'`, otherwise the new field-zone candidate would have been offered
  but then silently rejected the moment it was chosen, falling back to a normal draw.
- New file `cards/HL_claude_s03u77_sin_world.js`: `defineScript('Sin World', {...})` — `activateFrom:['field']`,
  `fieldIgnition:true`; `condition()` requires `ctx.drawReplacementS03`, a face-up field-zone card, and at least
  1 "Sin"-named card in the Deck; `resolve()` re-checks face-up/field-zone (11/01/10 円盤ムスキー-shaped
  resolve-time guard) then opens a `min=max=Math.min(3, pool.length)` `requestChoice` for which "Sin" cards to
  reveal — fewer than 3 if the Deck has fewer, matching the standard "reveal as many as you have" ruling for a
  reveal-N effect rather than a hard requirement of exactly 3. The registered handler
  (`s03u77.sin-world-reveal`) re-resolves each revealed stub, picks one index via `duelRandomInt`, searches it
  to hand (`API.searchDeck`), and shuffles.

## Dedicated test

`node tools/test_s03_u77_sin_world.js` — 12 assertions, all pass, real DUEL path throughout.

- **A**: a real hand activation places Sin World face-up on the field zone with no chain effect resolving
  (card-activation-only).
- **B**: with 5 real "Sin" cards + 2 filler cards in the Deck, a real Draw Phase offers Sin World; choosing it
  opens a real `min=max=3` reveal choice restricted to the 5 "Sin" candidates (filler correctly excluded);
  after revealing 3 and letting `duelRandomInt` pick, exactly 1 of the 3 actually revealed lands in hand, the
  other 2 stay in the Deck (reshuffled), and the normal draw is replaced.
- **C**: with only 1 "Sin" card in the Deck, the reveal choice correctly shrinks to `min=max=1` (not a hard 3).
- **D**: with zero "Sin" cards in the Deck, Sin World is not offered at all — the normal draw proceeds.
- **E**: a face-down Sin World on the field is not offered either (must be face-up).

Every segment carries a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `NOT_STARTED` 1289→1288 (-1), `TESTED` 2122→2123 (+1); all other buckets
  unchanged (`ENGINE_GAP` 612, `GENERIC_OK` 644, `IMPLEMENTED` 157, `PARTIAL` 172). `TOTAL` 4996.
- `CARD_TEST_FOCUS` given an explicit `{"Sin World"}` entry for this test file — its own comments name
  大樹海／血の代償／酒呑童子／始祖の守護者ティラス only as prior-art precedent, none of their own effects are
  exercised, and without the focus entry `血の代償` (already `IMPLEMENTED`) was incidentally flagged as an
  off-target promotion candidate purely from its comment mention. Caught and fixed before publication.
- `python tools/s03_status_audit.py`: EXIT 0, 78 declared status changes (+1 from U76), **off-target status
  changes = 0**.

## Gate

- `python tools/check.py` — EXIT 0, **13145 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations.

## Real-duel measurement

Not fixed-list reachable (Sin World is not part of any `1103_MAJOR_DECKS_v1` deck) — no R1 sweep applies to
this card directly; per-card real-path test + Replay audit is this unit's evidence, matching the established
precedent for other off-fixed-list units (e.g. U74/U75).

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`742a29e7eeb2a91a4d9f9689bbd88dc638dfd3e801200b20e756f5da6f87512d` (805 files).

## Remaining

- C-S03-26 DRAW_REPLACEMENT is now fully closed (all declared items: mz-declared monsters, grave-recursion
  Spells/Traps, and the field-zone Field Spell).
- 六武衆の影武者 remains the one genuine ENGINE_GAP needing a real new capability (source-aware target
  redirection during Chain construction) — left for a future unit.
- エクシーズエナジー's `.materials`-vs-`.xyz` bug (S03-U76) remains flagged via `spawn_task`, not fixed here.
- Per the fixed fallback order, continuing directly into the next Requirement.
