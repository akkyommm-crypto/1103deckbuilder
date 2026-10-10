# S03-U92 墓穴の道連れ IMPLEMENTED→TESTED + mutual-discard-chooser fix (Claude)

Base: shared LATEST `checkpoint_claude_s03_u91_herald_of_orange_light_20260919.zip` (Claude, U91).

## Why this unit

Continuing priority #7's IMPLEMENTED-tier audit directly after S03-U91. The next-highest-consumer-count
main-deck IMPLEMENTED candidate is 墓穴の道連れ, qty=3, dark main deck.

## Card

墓穴の道連れ — this project's own card database, printed 2003-02-20, within the 2011-08-31 cutoff, a Normal
Spell. Real text (`data/carddata.json`): "①: Both players look at their opponent's hand and choose 1 card
from it to discard. After that, both players each draw 1 card from their Deck."

## What was found

Reading the existing implementation (`cards/39_1103_expansion_v380b.js`) surfaced a real, previously-
undiscovered bug. The card resolves via two sequential legacy choices:

1. The activator picks 1 card from the opponent's hand to discard — correct.
2. A second choice picks 1 card from the **activator's own** hand to discard.

Step 2's `player` was `args.player` (the activator) — letting the activator freely choose which of their
OWN cards to discard, i.e. dump their least valuable card. This directly contradicts:

- The real text: "each player chooses from the *opponent's* hand" — meaning each player's own discard should
  be selected by the *other* player, not by themselves.
- The choice prompt's own title text, already correctly written as "墓穴の道連れ：相手が自分の手札から捨て
  させるカード" ("the card the **opponent** makes you discard") — which the code silently contradicted by
  passing the wrong player.

## Fix

Changed step 2's `player` from `args.player` to `args.opponent`, so the opponent selects which of the
activator's hand cards is discarded, matching both the real text and the prompt's own title.

## Dedicated test

`node tools/test_s03_u92_bribe_of_the_living_dead.js` — 8 assertions, all pass, real DUEL path throughout.

- **A**: a real activation whose real first choice (which opponent hand card to discard) is really made by
  the activator; whose real second choice (which of the activator's own hand cards is discarded) is really
  made by the real opponent (confirmed via the pending choice's own `player` field); both real discards land
  correctly (the activator's chosen opponent card is discarded from the opponent's hand; the
  opponent's-chosen card is discarded from the activator's hand — not the activator's own free pick); both
  real players really draw 1 card each.
- **B**: a real negative control — illegal with an empty opponent hand.
- **C**: a real negative control — illegal with an empty Deck for the activator.

Every segment carries a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `IMPLEMENTED` -1, `TESTED` +1 (墓穴の道連れ).
- `CARD_TEST_FOCUS` given an explicit `{"墓穴の道連れ"}` entry for this test file.
- `python tools/s03_status_audit.py`: EXIT 0, 94 declared status changes (+1 from U91), off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13289 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations.

## Real-duel measurement

Fresh R1 sweep, Dark World vs HERO (Dark World carries 墓穴の道連れ; a pre-fix sweep of this pair was
already clean earlier this session — re-swept here as a regression check on the discard-chooser fix), seeds
0x1-0x4 x first-player {0,1}: **8/8 clean**, every run `completed:true`, `blocker:null`, `errors:[]`,
`unsupported:[]`, `replay.ok:true`.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`2818e8908406821929172569a1c3e2b0c3c9cfc4d4ffde69fff4b7a10bad4d01` (839 files).

## Remaining

Priority #7's IMPLEMENTED-tier main-deck candidates continue: カオス・ソーサラー (qty=3, debris), ライト
ロード・ハンター ライコウ (qty=3, debris), ミラクル・フュージョン (qty=3, hero), plus more at qty=3 and below
not yet fully enumerated — re-run the cross-reference for the complete current list. The Extra Deck tier
remains separately available: A・O・J カタストル / インヴェルズ・ローチ (qty=10 each), 氷結界の龍 ブリュー
ナク (qty=8), No.39 希望皇ホープ (qty=8), TG ハイパー・ライブラリアン (qty=6).
