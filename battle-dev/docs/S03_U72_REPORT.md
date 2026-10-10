# S03-U72 グリーン/レッド/イエロー・ガジェット PARTIAL→TESTED (Claude)

Base: shared LATEST `checkpoint_claude_s03_u71_karakuri_watchdog_saizan_20260919.zip` (Claude, U71).

## Why this unit

Fixed fallback order after U71: four consecutive fresh major-deck-pair R1 sweeps (TG Gadget vs Worm, Six
Samurai vs HERO, Jurrac vs TG Skill, Dragunity vs BF — all 8/8 clean) found no new blocker, and Q10 (Journal
2000-action truncation) was closed via code-read + evidence with no fix needed. Priority #7 continued: with
every NOT_STARTED main-deck card in the fixed lists already either declared (カラクリ守衛 参壱参, U71) or
needing a bigger capability first (E・HERO アナザー・ネオス, ワーム・ヤガン — deliberately deferred), the next
tier is PARTIAL cards on the fixed lists. **グリーン・ガジェット / レッド・ガジェット / イエロー・ガジェット**
(all in the TG Gadget main deck, core engine pieces drawn in nearly every game) were all classified PARTIAL
with the identical reason "AUTO_DECK_TABLE coarse implementation; requires card-specific historical review".

## Card

All three (Yugipedia / db.yugioh-card.com, printed well before the 2011-08-31 cutoff): "When this card is
Normal Summoned or Special Summoned, you can add 1 [color] Gadget from your Deck to your hand." Green → Red,
Red → Yellow, Yellow → Green (a 3-way cycle) — confirmed via a live web search independent of the codebase.

## What was actually wrong (nothing, functionally)

The pre-existing `AUTO_DECK_TABLE` entries in `cards/40_auto_interpreter.js` already implemented this
correctly and generically: the exact cardCode cross-references form the right cycle (independently verified
against `data/carddata.json`), `timing:['summon']` plus `passive.onNormalSummon`/`onSpecialSummon` (both,
matching the real "Normal Summoned or Special Summoned" text), no `forced` flag (matching "you can"), and
`resolve()` calling the real `API.searchDeck` primitive. No card-specific bug was found.

The reason these stayed PARTIAL is structural, not behavioral: `tools/script_coverage.py`'s status
classification checks `elif regs: status='TESTED' if tests else 'IMPLEMENTED'` **before** `elif auto:
status='PARTIAL'` — but `regs` (literal `cards/*.js` registrations found by the registration scanner) is empty
for any card sourced purely from the `AUTO_DECK_TABLE` dictionary. This means the `auto` branch always wins for
these cards regardless of test coverage — **no amount of testing alone can promote a pure-table card**;
promotion requires a real, literal `defineScript` registration, matching the codebase's own established
precedent (e.g. U68's 魔力掌握 replacement).

## Fix

New file `cards/HH_claude_s03u72_gadget_search.js`: three literal `defineScript` calls (via a small shared
`s03u72GadgetSearch(name, targetName)` helper) reproducing the exact same, already-correct behavior as the
table version. `defineScript` unconditionally overwrites `CARD_SCRIPTS[name]` (no self-guard), and the table's
own loader (`if(CARD_SCRIPTS[nm]) return;`) only protects *earlier*-registered scripts from being clobbered by
the table — so a later literal registration always wins regardless of file load order, matching every other
AUTO_DECK_TABLE replacement this session.

**A real regression found and fixed during development**: the first version of this file omitted
`blocksIfNoDeckToHand:true` — a flag every other real, literal Deck-to-hand search script in this codebase
declares (ポケ・ドラ, 化石調査, ...), which makes ライオウ/similar deck-lock effects correctly refuse to even
*offer* the trigger (not just fail silently on resolution). Caught by the pre-existing
`tools/test_s03_u04_lock_recovery.js` ("グリーン・ガジェット search trigger is not offered under ライオウ").
Added the flag, matching established convention; re-ran the regression test clean.

## Dedicated test

`node tools/test_s03_u72_gadget_search_cycle.js` — 8 assertions, all pass, real DUEL path throughout (real
`doNormalSummon`, a real `FX_SPECIAL_SUMMON` action followed by the real `queueSpecialSummonSuccessV2` success
hook every card script's own `API.specialSummon` uses internally, real `eventPickV2`/`__choicePickV49`-driven
resolution, clean Replay audits).

- **A**: real Normal Summon of グリーン・ガジェット (レッド・ガジェット in deck) → real search adds it to hand,
  deck really shrinks by 1.
- **B**: real Normal Summon of レッド・ガジェット (イエロー・ガジェット in deck) → real search confirms the
  next leg of the cycle.
- **C**: real Special Summon (not Normal Summon) of イエロー・ガジェット → confirms the `onSpecialSummon`
  branch specifically also fires (real text explicitly covers both), closing the cycle back to グリーン・ガジェ
  ット.
- **D** (negative control): グリーン・ガジェット Normal Summoned with no レッド・ガジェット anywhere in the
  deck → `condition()` correctly refuses; nothing searched, deck untouched.

## Coverage / status audit

- `python tools/script_coverage.py`: `PARTIAL` 177→174 (-3), `TESTED` 2116→2119 (+3).
- `python tools/s03_status_audit.py`: EXIT 0, 74 declared status changes, **off-target status changes = 0**.

## Gate

- `python tools/check.py` — EXIT 0, **13106 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no duplicate
  top-level function declarations. (One intermediate gate run caught the `blocksIfNoDeckToHand` regression
  above — fixed before this final clean run.)

## Real-duel measurement

TG Gadget vs Karakuri (already-confirmed-clean pair, directly exercises all three newly-registered cards in
real play) re-swept across all 8 seed/first-player combinations — **8/8 clean**, every run `completed:true`,
`blocker:null`, `errors:[]`, `unsupported:[]`, `replay.ok:true`, confirming no regression from the new literal
registrations.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`c5547bd99ce8626c12f63d3b45108f96f5ed3153e77cfec9c13db27c2f30aed3` (791 files).

## Remaining

- Other PARTIAL AUTO_DECK_TABLE cards remain on the fixed lists (e.g. トゥルース・リインフォース in TG Gadget,
  シューティング・クェーサー・ドラゴン in Debris, ワーム・ゼクス/W星雲隕石 in Worm) — each would need the same
  "verify the table entry, add a literal registration + dedicated test" treatment; left for a future unit.
- Per the fixed fallback order, continuing directly into the next Requirement.
