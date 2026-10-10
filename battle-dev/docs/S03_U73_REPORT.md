# S03-U73 トゥルース・リインフォース PARTIAL→TESTED (Claude)

Base: shared LATEST `checkpoint_claude_s03_u72_gadget_search_cycle_20260919.zip` (Claude, U72).

## Why this unit

Continues U72's priority #7 pass over the remaining PARTIAL AUTO_DECK_TABLE cards on the fixed major-deck
lists. トゥルース・リインフォース (Reinforce Truth), a x1+ TG Gadget deck Normal Trap, was classified PARTIAL
under the same "AUTO_DECK_TABLE coarse implementation" reason as U72's three Gadgets.

## Card

Reinforce Truth (Yugipedia, printed 2009-04-18 OCG, well within the 2011-08-31 cutoff — text independently
confirmed against this project's own card database, `data/carddata.json`): "Special Summon 1 Level 2 or lower
Warrior-Type monster from your Deck. You cannot conduct your Battle Phase the turn you activate this card."

## What was actually wrong — a genuine functional gap, unlike U72

Unlike U72's three Gadgets (which the table already implemented correctly), the pre-existing
`AUTO_DECK_TABLE` entry for this card (`{op:"recruit",trig:"ignition",f:{lvmax:2,ra:"戦士",tk:"m"}}`) correctly
filters the Special Summon target but has **no way to express the card-specific "cannot conduct your Battle
Phase this turn" restriction at all** — the generic auto-interpreter only ever encodes a search/mill/recruit
filter, never a standalone restriction clause. This is a real, previously-unimplemented rules effect.

## Fix

New file `cards/HI_claude_s03u73_reinforce_truth.js`: a real, literal `defineScript`, reusing two
already-established primitives rather than inventing anything new:

- The Special Summon target is a **non-targeting** Deck choice (the real text never says "target"), so per
  this session's own established C-S03-26 / S03-U58 precedent (a non-targeting Deck-search/recruit choice is
  made at *resolution* time, not activation time) it is resolved via the existing registered
  `s03u58.deck-special` handler — the same one ローンファイア・ブロッサム and ワン・フォー・ワン already use
  (`cards/00_generic_core.js`) — not `selectTargets`/`targets:true`.
- The Battle-Phase lock is set in `cost()` (`API.setFlag(ctx.player,'noBattlePhase',true,true)`), so it applies
  immediately upon activation regardless of whether the effect later resolves — matching this codebase's own
  established precedent for the identical real-rules shape (裁きの代行者 サターン,
  `cards/36_1103_expansion_v340.js`; エンシェント・フェアリー・ドラゴン, `cards/47_v47_native.js`, both
  "Condition"-type Battle-Phase locks tied to activation, not resolution).

## Dedicated test

`node tools/test_s03_u73_reinforce_truth.js` — 6 assertions, all pass, real DUEL path throughout (a real Set
Trap, `duelActivateFromZone`, real `s03u58.deck-special` resolution-time choice, clean Replay audit).

- **A**: real Trap Set on an earlier turn, real activation from `sz` during Main Phase 1. Confirms the
  Battle-Phase lock is paid as a real cost before the resolution-time choice even opens; confirms a real
  resolution-time choice opens correctly filtered to exactly the Level≤2 Warrior monsters present (TG
  ストライカー, already registered, used only as the real Special-Summon-target fixture); confirms the real
  Special Summon happens; then confirms the actual real-rules point of this card via the real production
  function every phase transition in this engine goes through — `nextPhaseIdV27()` — genuinely returns `'end'`
  (not `'battle'`) for the rest of this turn.
- **B** (negative control): activated with no Level≤2 Warrior anywhere in the deck → a real
  `strictScriptLegalityV2` check correctly refuses activation.

## Coverage / status audit

- `python tools/script_coverage.py`: `PARTIAL` 174→173 (-1), `TESTED` 2119→2120 (+1). `CARD_TEST_FOCUS` given
  an explicit `{"トゥルース・リインフォース"}` entry for this test file (precedent: U56/U70/U71) so the
  already-registered TG ストライカー fixture is not incidentally promoted.
- `python tools/s03_status_audit.py`: EXIT 0, 75 declared status changes, **off-target status changes = 0**.

## Gate

- `python tools/check.py` — EXIT 0, **13112 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no duplicate
  top-level function declarations.

## Real-duel measurement

TG Gadget vs Worm (already-confirmed-clean pair, directly exercises the newly-registered card in real play)
re-swept across all 8 seed/first-player combinations — **8/8 clean**, every run `completed:true`,
`blocker:null`, `errors:[]`, `unsupported:[]`, `replay.ok:true`.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`8d5bb7a6c2880e6700bb149a258b04991a82524ced1aa0b9ee16c4e254984965` (794 files).

## Remaining

- Other PARTIAL AUTO_DECK_TABLE cards remain on the fixed lists: シューティング・クェーサー・ドラゴン
  (Debris), ワーム・ゼクス / W星雲隕石 (Worm) — same audit-then-fix treatment needed; left for a future unit.
- Per the fixed fallback order, continuing directly into the next Requirement.
