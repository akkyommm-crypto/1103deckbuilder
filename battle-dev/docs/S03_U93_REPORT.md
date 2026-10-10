# S03-U93 カオス・ソーサラー IMPLEMENTED→TESTED + turn-scoped attack-restriction fix (Claude)

Base: shared LATEST `checkpoint_claude_s03_u92_bribe_of_the_living_dead_20260919.zip` (Claude, U92).

## Why this unit

Continuing priority #7's IMPLEMENTED-tier audit directly after S03-U92. The next-highest-consumer-count
main-deck IMPLEMENTED candidate is カオス・ソーサラー (Chaos Sorcerer), qty=3, debris main deck.

## Card

カオス・ソーサラー (Chaos Sorcerer) — DARK/Spellcaster/Effect, Level 6, ATK 2300/DEF 2000. Real text
(confirmed via Yugipedia): "Cannot be Normal Summoned/Set. Must first be Special Summoned (from your hand)
by banishing 1 LIGHT and 1 DARK monster from your GY. Once per turn: You can target 1 face-up monster on
the field; banish that target. This card cannot attack the turn you activate this effect."

## What was found

Reading the existing implementation (`cards/00_generic_core.js`) surfaced a real, previously-undiscovered
bug: the field-ignition effect's `resolve()` only ever called `API.log("カオス・ソーサラー：この効果を発動
したターン攻撃できない")` — a pure log message, never an actual restriction. Confirmed empirically: setting
up a real board, activating the field effect, and declaring a real attack the same turn succeeded and
destroyed the opponent's monster — the restriction had never been enforced at all.

The "Cannot be Normal Summoned/Set" clause was separately confirmed already correctly enforced by the
engine's generic Normal Summon eligibility gate (`toasts: ['この方法で通常召喚できません']` when probed
directly) — no bug there.

## Fix

Used the engine's existing dynamic `continuous.cannotAttack(card)` hook (already proven by 光の護封剣,
`cards/00_generic_core.js:1629`) combined with a turn-number-stamped card flag written via
`API.setCardFlag`:

```js
continuous:{scope:'self', apply(){ return null; },
  cannotAttack(card){ return card.csNoAttackTurnS03U93===gameState.turn; }},
```

and in `resolve()`, after the real banish: `API.setCardFlag({card:ctx.card}, 'csNoAttackTurnS03U93',
gameState.turn, "カオス・ソーサラー", {silent:true});`

A plain `card.cannotAttack=true` (the pattern used by several other cards in this codebase, e.g.
六武衆－ヤイチ) was deliberately NOT used here: `engine/00_state_actions.js` only clears `card.cannotAttack`
when the card leaves the field, never automatically at a turn boundary — using it directly would have made
the restriction permanent instead of turn-scoped, contradicting the real "the turn you activate this
effect" wording.

## Dedicated test

`node tools/test_s03_u93_chaos_sorcerer.js` — 9 assertions, all pass, real DUEL path throughout.

- **A**: a real hand-based Special Summon really banishes 1 real LIGHT and 1 real DARK monster from the
  Graveyard and really Special Summons itself in real Attack Position.
- **B**: a real field ignition activation confirms both itself and a real opponent monster are legal targets
  (no side restriction, matching real text exactly) and really banishes the chosen one.
- **C**: a real attack declared the same real turn now correctly fails (the fixed bug).
- **D**: a real attack on a real LATER turn correctly succeeds, confirming the restriction is turn-scoped,
  not permanent.
- **E**: a real negative control for a Graveyard with 2 LIGHT and 0 DARK monsters.

Every segment carries a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `IMPLEMENTED` -1, `TESTED` +1 (カオス・ソーサラー).
- `CARD_TEST_FOCUS` given an explicit `{"カオス・ソーサラー"}` entry for this test file.
- `python tools/s03_status_audit.py`: EXIT 0, 95 declared status changes (+1 from U92), off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13298 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations.

## Real-duel measurement

Fresh R1 sweep, Debris vs Six Samurai (Debris carries カオス・ソーサラー; a pre-fix sweep of this pair was
already clean earlier this session — re-swept here as a regression check on the attack-restriction fix),
seeds 0x1-0x4 x first-player {0,1}: **8/8 clean**, every run `completed:true`, `blocker:null`, `errors:[]`,
`unsupported:[]`, `replay.ok:true`.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`778d27719df8e925f6a625fd9a446286449440a031e444c01cac4a8ff5a312ce` (841 files).

## Remaining

Priority #7's IMPLEMENTED-tier main-deck candidates continue: ライトロード・ハンター ライコウ (qty=3,
debris), ミラクル・フュージョン (qty=3, hero), plus more at qty=3 and below not yet fully enumerated — re-run
the cross-reference for the complete current list. The Extra Deck tier remains separately available: A・O・J
カタストル / インヴェルズ・ローチ (qty=10 each), 氷結界の龍 ブリューナク (qty=8), No.39 希望皇ホープ (qty=8),
TG ハイパー・ライブラリアン (qty=6).
