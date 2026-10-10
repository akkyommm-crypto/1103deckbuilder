# S03-U94 ライトロード・ハンター ライコウ IMPLEMENTED→TESTED + mandatory-mill-vs-optional-destroy fix (Claude)

Base: shared LATEST `checkpoint_claude_s03_u93_chaos_sorcerer_20260919.zip` (Claude, U93).

## Why this unit

Continuing priority #7's IMPLEMENTED-tier audit directly after S03-U93. The next-highest-consumer-count
main-deck IMPLEMENTED candidate is ライトロード・ハンター ライコウ (Ryko, Lightsworn Hunter), qty=3, debris
main deck.

## Card

ライトロード・ハンター ライコウ (Ryko, Lightsworn Hunter) — LIGHT/Beast/Flip/Effect, Level 2, ATK 200/DEF
100. Real text (confirmed via Yugipedia): "FLIP: Apply these effects (simultaneously). ● You can destroy 1
card on the field. ● Send the top 3 cards of your Deck to the GY."

## What was found

Reading the existing implementation (`cards/30_themes_b.js`) surfaced a real, previously-undiscovered bug.
The two bullet effects are real-text-confirmed to be **independent** — the destroy is optional, the deck-mill
is mandatory. The old code, however, performed the mandatory mill only as a side effect of the registered
choice handler for the optional destroy:

```js
API.registerChoiceHandler('s03u62.ryko-destroy', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(!h) return;                              // <- declining the destroy exits here...
  API.destroy(h, "ライトロード・ハンター ライコウ");
  API.millTop(args.player, 3, "ライコウ");     // <- ...skipping the mandatory mill too
});
```

This traces back to a legacy "cancel = nothing happens at all" pattern preserved during the S03-U62
SaveLoad migration (a correct pattern for cards whose whole effect is genuinely conditional on a single
choice) — but it never should have applied to ライコウ's mandatory mill, which real text explicitly
separates from the optional destroy.

## Fix

Moved the mandatory mill directly into `resolve()`, unconditional on the destroy choice; the registered
handler now only performs the optional destroy:

```js
resolve(ctx){
  API.millTop(ctx.player, 3, "ライコウ");
  const cands = API.fieldCards({filter:x=>x.card});
  if(!cands.length) return;
  API.requestChoice({... resume:{handler:'s03u62.ryko-destroy', ...} ...});
}
```

## Dedicated test

`node tools/test_s03_u94_ryko_lightsworn_hunter.js` — 8 assertions, all pass, real DUEL path throughout.

- **A**: a real Flip Summon with the real destroy declined still really performs the mandatory 3-card
  deck-mill (the fixed bug — the opponent's monster survives untouched, confirming the destroy really was
  skipped, while the mill still ran).
- **B**: a real Flip Summon with a real destroy chosen really destroys the target AND still really performs
  the mandatory mill.
- **C**: a real negative control with an empty real Deck — resolves cleanly with nothing to mill.

Every segment carries a clean Replay audit. (A genuine test-authoring pitfall was found and fixed while
building this test: `__choicePickV49(-1)` is NOT a cancel — it silently no-ops on an out-of-range index,
leaving the choice pending; `driveAll()`'s own fallback loop then auto-picks candidate index 0 on the next
call, which for this card is the card itself, destroying it. The real cancel function is
`__choiceCancelV49()`, called after stopping at the choice with a single `drive()` — not `driveAll()`, which
auto-resolves through any pending choice before a test can intervene.)

## Coverage / status audit

- `python tools/script_coverage.py`: `IMPLEMENTED` -1, `TESTED` +1 (ライトロード・ハンター ライコウ).
- `CARD_TEST_FOCUS` given an explicit `{"ライトロード・ハンター ライコウ"}` entry for this test file.
- `python tools/s03_status_audit.py`: EXIT 0, 96 declared status changes (+1 from U93), off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13306 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations.

## Real-duel measurement

Fresh R1 sweep, Debris vs Agent, seeds 0x1-0x4 x first-player {0,1}: **7/8 clean**; seed 0x3/first=0 hit a
genuine 120s VM timeout (a real infinite loop, not a driver artifact — reproduced twice). **Root-caused as a
pre-existing bug unrelated to this unit's fix**: the exact same hang reproduces identically against the
pre-U94 card file extracted from the U93 checkpoint (swapped in, rebuilt, re-run — same timeout at the same
seed/first/deck-order). `agent,debris` order at the same seed completes cleanly in 9 turns; only
`debris,agent` order (Debris as player 0) hangs — this specific matchup/seed/player-order permutation had
never been swept before this unit (the earlier "Agent vs Debris" sweep this session used the reverse
player-order assignment). Given the discovery is real but demonstrably outside this unit's own scope
(reproduces with or without the Ryko fix), it is deliberately **not fixed in this unit** — see the
Publication log and `NEXT_WRITER_HANDOFF.md` for the flagged next-unit investigation
(fixed fallback priority #2/#6: a fresh-pair hang takes precedence over further IMPLEMENTED-tier audits).

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`393367a737a93b44c6792cfd79661aaee0a9fbf7e102cfb3c797aae87c84c68e` (843 files).

## Remaining

- **New priority #2/#6 blocker found this unit, not yet fixed**: a genuine real R1 infinite-loop hang,
  `R1_DECKS=debris,agent` (Debris as player 0), seed `0x3`, `first=0`, `R1_LIST=v1 R1_RESPOND=1`. Reproduced
  twice against both the U94-fixed and pre-U94 card files, confirming it is unrelated to this unit's fix.
  `ops` log is empty at the point of the hang (no journaled actions before the timeout), suggesting the hang
  may occur very early (deck/hand setup or the first turn's opening actions) rather than deep in card-effect
  resolution — needs the same instrumented-tracing methodology as S03-U70's prior infinite-loop fix.
- Priority #7's IMPLEMENTED-tier main-deck candidates continue: ミラクル・フュージョン (qty=3, hero), plus
  more at qty=3 and below not yet fully enumerated. The Extra Deck tier remains separately available: A・O・
  J カタストル / インヴェルズ・ローチ (qty=10 each), 氷結界の龍 ブリューナク (qty=8), No.39 希望皇ホープ
  (qty=8), TG ハイパー・ライブラリアン (qty=6).
