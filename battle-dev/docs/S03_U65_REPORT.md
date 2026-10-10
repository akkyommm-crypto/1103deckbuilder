# S03-U65 C-S03-26 DRAW_REPLACEMENT — GY expansion (Claude)

Base: shared LATEST `checkpoint_claude_s03_u64_resolution_deck_choice_remaining14_20260918.zip` (Claude, U64).

## Why this unit

Fixed fallback order after U64 closed the last of S03-U58's own 21-card scope with a negative finding on
priority #1 (a static scan for the same `cost()` zone/eventName ambiguity class found in 鬼ガエル turned up
only 2 candidates, both structurally sound — no fix needed, documented below). Moved to priority #5 (WORK_QUEUE
Ready head): **C-S03-26 secondary — GY / Field draw-replacement cards**, explicitly left open by S03-U33's own
report/CAPABILITY_NOTES entry ("② Remaining: the GY / Field-based cards with the same wording are undeclared").

## Priority #1 check (negative finding, no fix needed)

Statically scanned every `defineScript` block across `cards/*.js` for the same shape as 鬼ガエル's U64 bug
(a `passive:` trigger block alongside a `cost()` that checks `ctx.zone` without first checking
`ctx.eventName`). Found 2 candidates: トラップ・キャプチャー, マジック・キャプチャー
(`cards/D5_auto_cycle33.js`, `cards/D6_auto_cycle34.js`). Both read in full: their `cost()` branches on
`ctx.zone==='grave'` vs. the implicit `'sz'` branch — two genuinely *different* zone values distinguishing the
two effects (unlike 鬼ガエル, where `ctx.zone` was `'mz'` for *both* branches and only `ctx.eventName`
differed). Both already match their own `condition()`'s branching exactly. No bug; no fix.

## Root cause and engine fix

`engine/1V_draw_replacement_s03.js`'s `drawReplacementCandidatesS03(p)` only scanned the player's face-up
Monster Zone (`P.mz`) for declared cards, even though `prepareDuelActivation`/`strictScriptLegalityV2` already
support Spell/Trap `activateFrom:['grave']` generically (precedent already in the tree: 突風,
`cards/9L_class_a_recovery_04.js`'s Equip Spell) — the gap was purely in the *candidate-scanning* function, not
a missing engine capability. Extended it to also scan `P.grave` for declared cards, and generalized the choice
handler (`s03u33.draw-choice` in `cards/H9_claude_s03_draw_replacement.js`) to activate from the candidate's
real zone (`h.zone`) instead of a hardcoded `'mz'`.

## Cards declared

New file `cards/HG_claude_s03u65_draw_replacement_grave.js` (registered in `build_manifest.json`):

- **コアキメイルの鋼核**, **スピリット・バーナー**: GY self-recursion only (add itself from the GY to hand
  instead of the normal draw). Each card's other, unrelated effect (コアキメイルの鋼核's alternate
  discard-a-Koa'ki-Meiru-monster cost path — a separate Draw Phase activation window, not the draw-replacement
  offer; スピリット・バーナー's equip-monster defense-position ignition effect and its specific-removal-reason
  600 damage trigger) is not implemented — kept **PARTIAL** via `data/script_status_overrides.json`, same
  precedent as ダーク・ジェネラル フリード in S03-U33.
- **マジックブラスト**: both effects implemented — ① a real hand-activated burn effect (200 damage × the
  number of face-up Spellcaster-Type monsters on the controller's field, no target) and ② the GY
  draw-replacement. Promoted straight to **TESTED**.
- **メテオ・プロミネンス**: both effects implemented — the primary Trap effect (discard 2 from hand as a cost,
  requires the opponent's LP above 3000, deals 2000 damage) and the GY draw-replacement. Promoted to
  **TESTED**.
- **スカル・フレイム**: declared from the face-up Monster Zone like the original 3 S03-U33 cards, but its own
  replacement target is a **named GY search** ("バーニング・スカルヘッド"), not a Deck search — needed a new
  factory reusing the resolution-time `API.requestChoice` pattern (never the activation-time anti-pattern this
  session spent S03-U58/U63/U64 removing elsewhere) rather than the existing Deck-pool factory. Its own
  once-per-turn hand Special Summon of "バーニング・スカルヘッド" (with a no-Battle-Phase-this-turn cost) is
  not implemented — kept **PARTIAL**.

Sin World (Field Spell zone; "reveal 3 named cards, the opponent randomly picks 1") was investigated and
explicitly deferred: it needs a genuinely new primitive (opponent-random-pick-among-revealed-cards) that
doesn't exist anywhere in the engine yet, unlike the other 5 cards which only needed the candidate-scan fix
above. Left as future scope (see Remaining).

## Bug found and fixed during testing (test-writing, not a card-behavior regression)

マジックブラスト's ① branch initially gated on `ctx.zone==='hand'`, which never actually holds:
`duelActivateFromHand` moves a Spell/Trap card from hand to the Spell/Trap Zone (`act({type:'MOVE',...})`)
*before* calling `prepareDuelActivation`, so `resolve()`'s real `ctx.zone` is `'sz'` — matching the convention
already used by every other plain hand-activated Spell in this codebase (none of which gate on
`ctx.zone==='hand'` at all). Fixed by removing the incorrect check and declaring `activateFrom:['sz','grave']`
(matching メテオ・プロミネンス's already-correct shape), discovered via a direct legality/state debug probe
before it ever reached a checkpoint.

## Dedicated test

`node tools/test_s03_u65_draw_replacement_grave_expansion.js` — 21 assertions, all pass, real DUEL path
throughout (real activation from hand/GY/a face-down Set trap, real Draw Phase offers). Includes a dedicated
**mixed-offer** case (I) placing one MZ-declared card and one GY-declared card simultaneously, confirming both
now appear together in the same draw-phase choice — the actual proof of the engine fix, not just the
individual per-card paths.

## Pre-existing test fallout

None. Grep across `tools/test_*.js` for the 5 new card names found only unrelated usages: `コアキメイルの鋼核`
appears in `test_auto_cycle32.js` purely as a prop card (placed in hand/field for *other* "コアキメイル"
archetype cards' own effects — its own script is never invoked there); `スカル・フレイム` appears in
`test_auto_cycle21.js` similarly as an unrelated reference. Both re-ran clean, unchanged.

## Gate

- `python tools/check.py` — EXIT 0, **13020 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations (log `s03_u65_full_gate.log`).
- `python tools/s03_status_audit.py` — EXIT 0: 61 declared status changes (56 carried + 5 new this unit), 0
  off-target, TOTAL 4996.
- Coverage: TESTED 2105 → 2107 (+2: マジックブラスト, メテオ・プロミネンス); PARTIAL 176 → 179 (+3:
  コアキメイルの鋼核, スピリット・バーナー, スカル・フレイム); NOT_STARTED 1299 → 1294 (-5).
- Acode build skipped for this unit per current instruction (generate only at release or on explicit
  request).

## Real-duel measurement

None of these 6 cards (5 declared + Sin World deferred) are on a `1103_MAJOR_DECKS_v1` fixed list, so no R1
sweep applies; the dedicated test's real activation paths (hand, GY, Set-trap) are this unit's evidence, each
closed with a Replay audit.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips, this report set aside):
`b6593b032caa0d0cd762b3d80b0bc9ddecab5c6ad69477607d0b984b966b7fc0` (771 files).

## Remaining

- **Sin World**: needs a new "reveal N named cards from the Deck, the opponent randomly picks 1, the rest
  return to the Deck" primitive before it can be declared through C-S03-26 — a candidate for a dedicated future
  unit (the "Sin" archetype has 9 other member cards within the 1103 cutoff, so this is real-duel reachable).
- C-S03-26's own "① Remaining" items (a second copy cannot chain to the first; 閃光の宝札's two normal draws
  not modelled; MANUAL draws don't pass through this DUEL branch) are unchanged — out of this unit's scope.
- Per the fixed fallback order, continuing directly into the next Requirement.
