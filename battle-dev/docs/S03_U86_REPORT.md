# S03-U86 盗賊の七つ道具 / ナチュル・パルキオン IMPLEMENTED→TESTED + activation-response ENGINE_MISSING fix (Claude)

Base: shared LATEST `checkpoint_claude_s03_u85_book_of_moon_20260919.zip` (Claude, U85).

## Why this unit

Continuing priority #7's IMPLEMENTED-tier audit directly after S03-U85's 月の書. The next-highest-consumer-count
main-deck IMPLEMENTED candidate is 盗賊の七つ道具 (Seven Tools of the Bandit, qty=7 across jurrac/karakuri/
tg_skill of the 13 fixed decks).

## What was found

Real text: "When a Trap Card is activated: You can pay 1000 Life Points, then target that Trap Card; negate
the activation, and if you do, destroy it." Reading the existing implementation (`cards/20_control_counter.js`)
surfaced a real, previously-undiscovered **ENGINE_MISSING** bug, shared identically by ナチュル・パルキオン
(Naturia Barkion) in the same file:

- Neither script ever read `ctx.event` — the S03-U18/C-S03-15 activation-response mechanism
  (`engine/1P_activation_response_s03.js`) that lets a script's `condition()`/`resolve()` see the chain link
  it is responding to. Every other "when a card is activated, negate it" card in this codebase (マジック・
  ジャマー, 王宮の陥落, and 19 more — `cards/H5_claude_s03_activation_response.js`) uses this pattern.
- Instead, both scripts freely scanned `API.fieldCards({zone:'sz', filter:x=>x.db.k==='t'})` and let the
  player manually pick **any** Trap card sitting in either player's Spell/Trap Zone as the target — with no
  gating on whether a Trap Card activation was actually in progress at all.
- Confirmed empirically: `strictScriptLegalityV2('盗賊の七つ道具',0,'sz',0,{})` returned `{ok:true}` even with
  **no chain open whatsoever** and no Trap Card ever activated — meaning either card could destroy an already-
  resolved, unrelated Continuous Trap sitting on the field at any time the controller had priority. This is not
  what the real card does.
- This bug class fell outside the original C-S03-15 audit's scope, which was explicitly limited to the 23
  scripts (of 52 using `onActivateSuccess`) that already referenced `ctx.event`/`onActivateSuccess` in source
  — these two scripts never did, so a text-search-based audit never surfaced them.

## Fix

Converted both scripts to the same `ctx.event` + `API.negateChainLink(ctx.event,'activation',name,true)`
pattern as 王宮の陥落/マジック・ジャマー (`cards/20_control_counter.js`):

- `condition()` now requires `ctx.event && ctx.event.kind==='trap'` (i.e. really responding to a real Trap
  Card's activation) before checking the card's own cost feasibility (LP>1000 / 2+ Graveyard cards).
- `selectTargets` removed entirely — the target is implicitly the chain link being responded to, exactly like
  every other declared activation-response card (none of them have a `selectTargets`).
- `resolve()` now calls `API.negateChainLink(ctx.event,'activation',name,true)` instead of manually resolving
  a stale `ctx.selectedTargets[0]` via `API.negate`+`API.destroy`.
- Both card names added to `ACTIVATION_RESPONSE_S03` in `cards/H5_claude_s03_activation_response.js`, which
  wires `ctx.event` into real `condition()`/`resolve()` calls during real chain-response legality checking and
  resolution (`engine/1P_activation_response_s03.js`, `engine/30_processor_chain_battle.js`) — pure additive
  reuse, **no engine change needed**.

ナチュル・パルキオン was fixed as a "dependent recovery" in the same unit (generic-ness check): it shares the
exact same file, same root cause, same fix shape. It is not part of any of the 13 fixed major decks, but the
final goal is full 4996-card correctness, so leaving a known-identical bug unfixed in the same file made no
sense.

## Dedicated test

`node tools/test_s03_u86_seven_tools_activation_response.js` — 10 assertions, all pass, real DUEL path
throughout:

- **A**: 盗賊の七つ道具 is illegal with no chain open (the original bug, now fixed); it really joins a real
  chain as a response to a real opponent Trap Card activation (トラップ・スタン); resolution really negates
  and destroys that Trap (confirmed its own `resolve()` never ran — the `trapStun` flag is never set); the
  real 1000 LP cost is really paid; 盗賊の七つ道具 itself resolves normally to the Graveyard.
- **B**: ナチュル・パルキオン (as a real face-up monster effect) really joins the same kind of real chain
  response, really banishing 2 real cards from the Graveyard as cost, and really negates+destroys the real
  Trap Card activation.
- **C**: negative control — with the controller's own LP not more than 1000, 盗賊の七つ道具 is correctly
  excluded from the real chain responses even while a real Trap Card is genuinely on the chain.
- **D**: negative control — with no chain open at all, ナチュル・パルキオン is not a legal activation either.

Every segment carries a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `IMPLEMENTED` -2, `TESTED` +2 (盗賊の七つ道具, ナチュル・パルキオン).
- `CARD_TEST_FOCUS` given an explicit `{"盗賊の七つ道具", "ナチュル・パルキオン"}` entry for this test file.
- `python tools/s03_status_audit.py`: EXIT 0, 87 declared status changes (+2 from U85), off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13226 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations.

## Real-duel measurement

Fresh R1 sweep, Jurrac vs Karakuri (both decks carry 盗賊の七つ道具 — the first fixed-list pair able to
exercise the fixed real-chain-response legality), seeds 0x1-0x4 x first-player {0,1}: **8/8 clean**, every run
`completed:true`, `blocker:null`, `errors:[]`, `unsupported:[]`, `replay.ok:true`.

## An operational note for future writers (self-correction during this unit)

Early in this unit, `python tools/script_coverage.py --json cards/00_generic_core.js` was run intending to
just query coverage stats for that file — but `--json <path>` is actually an **output-file** flag for
`script_coverage.py`, and it overwrote the entire 97,308-line `cards/00_generic_core.js` with a bare JSON
coverage report, destroying every card script definition in it. This project's work copy is not a git
repository, so `git checkout` was not available. Recovery: the U85 checkpoint zip (packed, copied, and
integrity-verified in the shared folder immediately before this mistake) still held the correct file; it was
extracted from `checkpoints/checkpoint_claude_s03_u85_book_of_moon_20260919.zip` and used to restore
`cards/00_generic_core.js` byte-for-byte, then `python tools/build.py` was re-run and the rebuilt `dist/
battle.html` was confirmed to parse and run correctly again before any further work continued. No other file
was affected (confirmed: only that one command's `--json` flag was destructive; nothing else in this session
writes to `cards/*.js`). **Lesson for future writers: `script_coverage.py --json <path>` writes coverage JSON
to `<path>` — it does not accept a card-file path to scope a query. Never pass an existing source file as that
argument.**

## Remaining

- Priority #7's IMPLEMENTED tier remains large — re-run the cross-reference (`script_coverage.py --json
  <output-file>` — note the corrected understanding of this flag above — against all 13 fixed deck lists) to
  regenerate the current ranked list. As of this unit, the next-highest by consumer count (from U85's own
  report): A・O・J カタストル (qty=10, Extra Deck), インヴェルズ・ローチ (qty=10, Extra Deck), 氷結界の龍
  ブリューナク (qty=8, Extra Deck), No.39 希望皇ホープ (qty=8, Extra Deck Xyz), TG ハイパー・ライブラリアン
  (qty=6, Extra Deck), TG ワーウルフ / TG ストライカー (qty=6 each, main deck).
- 六武衆の影武者, 天刑王 ブラック・ハイランダー, E・HERO アブソルートZero, 波動竜騎士 ドラゴエクィテス all
  remain deferred pending genuinely new capabilities.
