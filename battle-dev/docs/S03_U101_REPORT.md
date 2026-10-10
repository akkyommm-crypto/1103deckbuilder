# S03-U101 カラクリ小町 弐弐四 (Karakuri Komachi mdl 224 "Ninishi") IMPLEMENTED→TESTED (Claude)

Base: shared LATEST `checkpoint_claude_s03_u100_jurrac_guaiba_20260920.zip` (Claude, U100).

## Why this unit

Continuing priority #7's IMPLEMENTED-tier audit directly after S03-U100, using U97's corrected
cross-reference: カラクリ小町 弐弐四, qty=3, karakuri main deck — next of the 5 remaining qty=3 main-deck
candidates.

## Card

カラクリ小町 弐弐四 — EARTH/Machine/Tuner, Level 3, ATK 0/DEF 1900. Real text (confirmed via Yugipedia):
"This card must attack if able. When this face-up card is selected as an attack target, change its battle
position. While this card is face-up on the field, once per turn during your Main Phase, you can Normal
Summon 1 'Karakuri' monster in addition to your Normal Summon or Set. (You can only gain this effect once
per turn.)"

## What was found

Two real, previously-undiscovered bugs in `cards/20_control_counter.js`:

1. **Clause 2 (position-flip on being selected as an attack target) was entirely missing.** Only clause 1
   (`continuous.mustAttack`) and clause 3 (the extra Normal Summon grant) existed. This is the exact same
   real-text clause already correctly implemented in the same file for カラクリ守衛 参壱参 (Karakuri Watchdog
   mdl 313 "Saizan", S03-U71) via a forced `onAttackDeclare` trigger keyed on `gameState.pendingAttack.targetUid`.

2. **Clause 3's grant was completely non-functional.** `resolve()` set a flag (`karakuriExtraSummon`) read by
   exactly one function (`karakuriExtraSummonAvailable`) that nothing else in the entire codebase ever
   called (confirmed by a full-codebase grep). The real generic mechanism for "an effect grants 1 additional
   Normal Summon" is `extraNormalSummonKeyV370` (`engine/40_legal_script_engine.js`) — a numeric
   `temporaryFlags` counter consulted by `getLegalHandActions` to actually offer the `extraNormalSummon` hand
   action (existing precedent: 鬼ガエル's `v370FrogExtraNormal`, the 極星獣 archetype's
   `v380NordicExtraNormal`). カラクリ小町 弐弐四 was never wired into it — activating this card's grant had
   **zero real effect** on what the player could actually do.

## Fix

- `cards/20_control_counter.js`: added clause 2, mirroring 参壱参's forced `onAttackDeclare` pattern exactly.
  Added an explicit `timing:['mainPhase','attackDeclare']` declaration to prevent the newly-added
  `passive.onAttackDeclare` hook from auto-narrowing clause 3's own manual-activation timing window to
  attack-declaration-only (the same trap already documented for 大神官デ・ザード, S03-U67). Clause 3's
  `resolve()` now increments a new `karakuriExtraNormal` counter, mirroring 鬼ガエル's exact
  `v370FrogExtraNormal` shape. Removed the dead `karakuriExtraSummon`/`karakuriExtraSummonAvailable` code.
- `engine/40_legal_script_engine.js`: `extraNormalSummonKeyV370` gained a matching Karakuri case
  (`Number(f.karakuriExtraNormal||0)>0 && db.n.includes('カラクリ')`). `getLegalHandActions`'s UI label
  ternary (previously a binary choice between exactly the Nordic and Frog labels) was generalized to a small
  lookup so the Karakuri grant gets its own correct label instead of silently falling through to "鬼ガエル".

## Dedicated test

`node tools/test_s03_u101_karakuri_komachi_224.js` — 11 assertions, all pass, real DUEL path throughout.

- **A/B**: `mustAttackNow` confirmed true (clause 1, unchanged); a real weak opponent attacker (もけもけ,
  300 ATK) selects the real face-up カラクリ小町 弐弐四 (1900 DEF) as its attack target — it really flips to
  Defense Position before damage calculation (clause 2, the fixed missing clause), and the real ATK/DEF gap
  reflects real battle damage onto the real attacker.
- **C**: a real ignition activation of clause 3 really increments the real `karakuriExtraNormal` counter;
  `extraNormalSummonKeyV370` really returns the key for a real "Karakuri" hand card; a real ordinary Normal
  Summon and the real GRANTED additional Normal Summon both really succeed in the same real turn (the fixed
  bug — previously had zero real effect); the granted right is really consumed afterward.
- **D**: a real negative control — illegal with no real "Karakuri" monster in hand.

Every segment carries a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `IMPLEMENTED` -1, `TESTED` +1 (カラクリ小町 弐弐四).
- `CARD_TEST_FOCUS` given an explicit `{"カラクリ小町 弐弐四"}` entry for this test file.
- `python tools/s03_status_audit.py`: EXIT 0, 102 declared status changes (+1 from U100's 101), off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13362 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations (log `s03_u101_full_gate.log`). This includes the pre-existing
  regression tests exercising `extraNormalSummonKeyV370`'s other two consumers (鬼ガエル, the 極星獣
  archetype) — both still pass unaffected.

## Real-duel measurement

This unit changed a shared engine function (`extraNormalSummonKeyV370`/`getLegalHandActions`), so a fresh R1
sweep was run:

- `R1_DECKS=karakuri,tg_gadget R1_RESPOND=1`, seed `0x6`, first=0 — completed cleanly, turn 3, `replay.ok:true`.
- `R1_DECKS=karakuri,worm R1_RESPOND=1`, seed `0x9`, first=1 — completed cleanly, turn 10, `replay.ok:true`,
  `digestDiff:null`. カラクリ小町 弐弐四 was actually present in P0's opening hand (2 copies).

Both: `blocker:null`, `errors:[]`, `unsupported:[]`.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`bafc3fc15d7f14295f83221e2f7f91ba35ae888218bd3590491c4d547585bc18` (856 files).

## Remaining

4 more qty=3 main-deck candidates from U97's cross-reference: カラクリ解体新書 (karakuri), 血の代償
(tg_gadget), TG ラッシュ・ライノ (tg_skill), TG1－EM1 (tg_skill) — then the Extra Deck tier. Re-run the
cross-reference fresh at the start of the next unit rather than trusting this list verbatim.
