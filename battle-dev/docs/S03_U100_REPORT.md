# S03-U100 ジュラック・グアイバ (Jurrac Guaiba) IMPLEMENTED→TESTED (Claude)

Base: shared LATEST `checkpoint_claude_s03_u99_hero_blast_20260920.zip` (Claude, U99).

## Why this unit

Continuing priority #7's IMPLEMENTED-tier audit directly after S03-U99, using U97's corrected
cross-reference: ジュラック・グアイバ (Jurrac Guaiba), qty=3, jurrac main deck — next of the 6 remaining
qty=3 main-deck candidates.

## Card

ジュラック・グアイバ — FIRE/Dinosaur/Effect, Level 4, ATK 1700/DEF 400. Real text (confirmed via
Yugipedia): "If this card destroys an opponent's monster by battle: You can Special Summon 1 'Jurrac'
monster with 1700 or less ATK from your Deck, but it cannot declare an attack this turn."

## What was found

The battle-destroy trigger `condition()` (`ctx.battle.atkCard===ctx.card && ctx.battle.destroyedDef` — read
`engine/00_state_actions.js`'s battle resolution code directly to confirm `destroyedDef` means "the
defending side of the battle was destroyed," i.e. any opponent monster regardless of its own battle
position, not "Defense Position" as the field name might suggest), the optional Special-Summon-from-Deck
target search (`guaibaTargets`: main-deck "Jurrac"-named monsters with ATK ≤ 1700), and the Special Summon
itself were already correct in `cards/30_themes_b.js`.

But the "cannot declare an attack this turn" restriction on the newly Special Summoned monster was
implemented via the raw, **permanent** `card.cannotAttack=true` flag (`engine/00_state_actions.js`), which
only clears when a card leaves the field — never automatically at a turn boundary. This is exactly the same
bug class already found once this session (S03-U93, カオス・ソーサラー), but with an important difference:
here the restricted card is **not** ジュラック・グアイバ itself, but whichever different-named "Jurrac"
monster was Special Summoned by its effect. U93's fix (a self-scoped `continuous.cannotAttack(card)` hook
declared on the restricted card's own script, plus a turn-stamped flag) requires the restricted card's OWN
script to declare the hook — it cannot express "some other card, chosen dynamically at resolution time, is
restricted this turn" without touching every possible target card's own script.

## Fix

A new, small, fully generic engine primitive, added instead of touching every possible "Jurrac" target
card's own script:

- `engine/00_state_actions.js`, `cannotAttackNow(card)`: now also checks `card.cannotAttackTurn===gameState.turn`
  directly — mirroring the exact existing pattern already used for `card.attackLimitTurn` in the same
  function family (`attackLimitV48`). This works for **any** target card, with zero per-card declaration
  needed.
- `engine/00_state_actions.js`, `ZONE_LOCAL_KEYS`: added `'cannotAttackTurn'` alongside the existing
  `'cannotAttack'`/`'attackLimitTurn'` entries, for zone-leave hygiene consistency.
- `cards/30_themes_b.js`, ジュラック・グアイバ's `resolve()`: `API.setCardFlag({card:summoned},
  'cannotAttack', true, ...)` → `API.setCardFlag({card:summoned}, 'cannotAttackTurn', gameState.turn, ...)`.

No card-file-per-target changes needed; a future card with the same "restrict some OTHER card this turn"
shape can reuse `cannotAttackTurn` directly the same way.

## Dedicated test

`node tools/test_s03_u100_jurrac_guaiba.js` — 8 assertions, all pass, real DUEL path throughout.

- **A/B**: a real battle destroy really offers and resolves the optional trigger, really Special Summoning
  the real named Deck target (ジュラック・イグアノン, ATK 1700). The newly summoned monster really cannot
  attack the same real turn (confirmed via a real attack-declaration attempt that does not go through); on a
  real later turn (`gameState.turn+1`) it really can attack (confirming turn-scoping, not permanence).
- **C**: a real negative control — with no qualifying (ATK≤1700) "Jurrac" monster in the real Deck, the real
  battle destroy still happens but no Special Summon occurs.
- **D**: a real negative control — illegal with no real battle-destroy-by-this-card context.

Every segment carries a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `IMPLEMENTED` -1, `TESTED` +1 (ジュラック・グアイバ).
- `CARD_TEST_FOCUS` given an explicit `{"ジュラック・グアイバ"}` entry for this test file.
- `python tools/s03_status_audit.py`: EXIT 0, 101 declared status changes (+1 from U99's 100), off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13350 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations (log `s03_u100_full_gate.log`).

## Real-duel measurement

This unit changed a shared engine function (`cannotAttackNow`), so a fresh R1 sweep was run:

- `R1_DECKS=jurrac,tg_skill R1_RESPOND=1`, seed `0x4`, first=0 — completed cleanly, turn 14, `replay.ok:true`,
  `digestDiff:null`. ジュラック・グアイバ was actually present in P0's opening hand.
- `R1_DECKS=debris,six R1_RESPOND=1`, seed `0x3`, first=0 — completed cleanly, turn 11, `replay.ok:true`,
  `digestDiff:null`. Regression check for カオス・ソーサラー (U93's own `cannotAttack`-restriction card,
  present in this deck) confirming the shared `cannotAttackNow` change introduces no regression there.

Both: `blocker:null`, `errors:[]`, `unsupported:[]`.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`fe3f528a673ffbe6b5c286b587fbfad9a9296782ff9fb5636d881ce2f939de9b` (854 files).

## Remaining

5 more qty=3 main-deck candidates from U97's cross-reference: カラクリ小町 弐弐四 (karakuri), カラクリ解体
新書 (karakuri), 血の代償 (tg_gadget), TG ラッシュ・ライノ (tg_skill), TG1－EM1 (tg_skill) — then the Extra
Deck tier. Re-run the cross-reference fresh at the start of the next unit rather than trusting this list
verbatim.
