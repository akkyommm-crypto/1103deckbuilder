# S03-U102 カラクリ解体新書 (Karakuri Anatomy) IMPLEMENTED→TESTED (Claude)

Base: shared LATEST `checkpoint_claude_s03_u101_karakuri_komachi_224_20260920.zip` (Claude, U101).

## Why this unit

Continuing priority #7's IMPLEMENTED-tier audit directly after S03-U101, using U97's corrected
cross-reference: カラクリ解体新書, qty=3, karakuri main deck — next of the 4 remaining qty=3 main-deck
candidates. Conveniently sits in the same file (`cards/20_control_counter.js`) as U71's and U101's cards.

## Card

カラクリ解体新書 — Continuous Spell. Real text (Japanese/OCG, confirmed via Yugipedia): "「カラクリ」と
名のついたモンスターの表示形式が変更される度に、このカードにカラクリカウンターを１つ置く(最大２つまで)。
また、フィールド上に存在するこのカードを墓地へ送る事で、このカードに乗っているカラクリカウンターの数だけ
自分のデッキからカードをドローする。" ("Each time a monster named 'Karakuri' has its battle position
changed, place 1 Karakuri Counter on this card, max 2. Also, by sending this card, which is on the field, to
the GY, draw from your Deck a number of cards equal to the Karakuri Counters on this card.") Notably, the
counter-placement clause carries **no "you control" restriction** — any "Karakuri" monster's position
change counts, including the opponent's.

## What was found

The counter cap at 2 (`onKarakuriPositionChange` passive) and the emission wiring
(`notifyKarakuriPositionChangeV350`, called from both `API.changePosition` and `togglePosition` with the
changed monster's own real controller, broadcast generically rather than scoped to "self only" — correctly
matching the missing "you control" restriction) were already correct in `cards/20_control_counter.js`.

But building the real DUEL-path test surfaced a real, previously-undiscovered bug: `cost()` captured the
counter count into a custom `ctx.bookCount` property, and `resolve()` read it back the same way — but in the
**real activation pipeline** (`duelActivateFromZone` → chain add → chain resolve), `resolve()` receives an
**independently reconstructed** `ctx` object, not the one `cost()` wrote to; any custom property set on
`cost()`'s `ctx` is silently lost by the time `resolve()` runs (confirmed empirically via an instrumented
wrapper around both functions — `ctx.bookCount` was `2` right after `cost()` completed, but `undefined`
inside `resolve()`). The card's own real counters are themselves zone-local
(`engine/00_state_actions.js`'s `ZONE_LOCAL_KEYS` strips `'counters'` the instant the card leaves `sz` as the
cost), so simply re-reading them in `resolve()` was never an option either — **the real draw was always 0**,
regardless of how many counters had genuinely accumulated.

A parallel-shaped card, シンクロ・チェンジ (`cards/C8_auto_cycle26.js`), uses the identical
`ctx.xxx` cost→resolve pattern, but its own only existing test (`tools/test_auto_cycle26.js`) calls
`cost()`/`resolve()` directly on one shared `ctx` object rather than through the real pipeline, so the same
gap was never exercised there either. **Flagged for a future dedicated investigation** — this "custom ctx
property lost between cost() and resolve()" shape is reproduced by grep across roughly 20 `cards/*.js` files;
determining how many of those actually rely on it (vs. merely using `ctx.xxx` within a single phase) is
outside this unit's scope.

## Fix

`cards/20_control_counter.js`: `cost()` now persists the captured counter count onto the real card object
itself via `API.setCardFlag({card:ctx.card}, 'karakuriBookCount', n, ..., {silent:true})` — a real game
object that survives `cost()` intact (unlike `ctx`) and is not zone-local (a fresh custom flag name, not
listed in `ZONE_LOCAL_KEYS`). `resolve()` reads it back via `ctx.card.karakuriBookCount`. No engine change;
single-card fix.

## Dedicated test

`node tools/test_s03_u102_karakuri_anatomy.js` — 8 assertions, all pass, real DUEL path throughout.

- **A/B**: two real Karakuri monsters (カラクリ守衛 参壱参, カラクリ小町 弐弐四) on the controller's own
  field each really have their battle position changed by a real opponent attack declaration targeting them
  — each really places 1 real Karakuri Counter (capped at 2). A real activation then really sends the card
  from the real field to the real Graveyard as the cost, and really draws 2 real cards — the fixed bug
  (previously always 0 regardless of counter count).
- **C**: a real cross-player confirmation — even the OPPONENT's real Karakuri monster having its real
  battle position changed correctly places a real counter, matching the real text's missing "you control"
  restriction.
- **D**: a real negative control — illegal with zero real Karakuri Counters.

Every segment carries a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `IMPLEMENTED` -1, `TESTED` +1 (カラクリ解体新書).
- `CARD_TEST_FOCUS` given an explicit `{"カラクリ解体新書"}` entry for this test file.
- `python tools/s03_status_audit.py`: EXIT 0, 103 declared status changes (+1 from U101's 102), off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13370 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations (log `s03_u102_full_gate.log`).

## Real-duel measurement

- `R1_DECKS=karakuri,six R1_RESPOND=1`, seed `0x3`, first=1 — completed cleanly, turn 5, `replay.ok:true`,
  `digestDiff:null`, `blocker:null`, `errors:[]`, `unsupported:[]`.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`97bbbfc786100016431d49ba45a1359d4460ebfce5d067e1bef690c4d656d0c0` (858 files).

## Remaining

3 more qty=3 main-deck candidates from U97's cross-reference: 血の代償 (tg_gadget), TG ラッシュ・ライノ
(tg_skill), TG1－EM1 (tg_skill) — then the Extra Deck tier. **Higher priority than continuing that list**:
investigate the "custom ctx property lost between cost() and resolve()" bug class flagged above — it may
affect many more cards across ~20 files, matching fallback priority #1 (same bug class in unaudited area).
Re-run the qty=3 cross-reference fresh regardless, rather than trusting this list verbatim.
