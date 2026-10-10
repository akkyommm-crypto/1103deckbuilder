# S03-U103 スポーア (Spore) IMPLEMENTED→TESTED (Claude)

Base: shared LATEST `checkpoint_claude_s03_u102_karakuri_anatomy_20260920.zip` (Claude, U102).

## Why this unit

Direct follow-up to S03-U102's flagged top-priority investigation into the "custom ctx property lost
between cost() and resolve()" bug class. A precise scan narrowed the candidates significantly:

1. `grep -rlP 'cost\(ctx,\s*done\)\{' cards/ | xargs grep -lP '^\s+ctx\.\w+\s*='` — the raw superficial
   pattern — matched ~51 files (far too broad; matches any file containing both a `cost(ctx,done){` and
   ANY `ctx.xxx=` assignment anywhere).
2. A Python scan parsed each `cost(ctx,done){...}` body for `ctx.PROPNAME =` writes (excluding the ctx
   fields confirmed to survive reconstruction: `gameState, player, opponent, card, zone, index, phase, turn,
   chainDepth, priority, eventName, targetCandidates, selectedTargets, reason, debug, event, chainId,
   effectClass, chainLink, v4EffectKey, keep`), then checked whether the immediately-following `resolve(ctx)`
   body reads that same custom property name. This narrowed the list to **12 genuine candidates**.
3. Cross-referencing those 12 against all 13 `data/r1_lists/major_decks_v1_*.txt` found exactly **one**
   real-duel-reachable hit: スポーア (Spore), in the debris main deck.

## Card

スポーア — WIND/Plant/Tuner/Effect, Level 1, ATK 400/DEF 800. Real text (confirmed via Yugipedia): "If this
card is in your GY: You can banish 1 other Plant monster from your GY; Special Summon this card, and if you
do, increase its Level by the Level of that banished monster. You can only use this effect of 'Spore' once
per Duel."

## What was found

The GY-recursion Special Summon (`cards/30_themes_b.js`) was already correct. But two real,
previously-undiscovered bugs surfaced:

1. **The exact same cost→resolve ctx-persistence bug as U102.** `cost()` captured the banished monster's
   real Level into a custom `ctx.sporeLv` property, and `resolve()` read it back the same way — but
   `resolve()` receives an independently reconstructed `ctx` in the real pipeline, so `ctx.sporeLv` was
   always `undefined`. Confirmed empirically: banishing a real Level-3 Plant monster left スポーア's own
   real Level at 1, not the real 4 it should become.

2. **A missing `nameLimit:true`.** The real text explicitly names the card in its restriction ("You can only
   use this effect of **'Spore'** once per Duel"). This codebase's engine has an explicit, documented 1103-
   ruling convention (`RULING_1103_PER_CARD_LIMIT`, `engine/40_legal_script_engine.js`): count limits default
   to per-physical-card-instance tracking (matching real cards like Breaker the Magical Warrior, where 2
   copies can each use their own once-per-turn effect), but a card whose real text explicitly names itself
   in the restriction (precedent cited directly in the engine's own comment: Rescue Rabbit) must instead be
   tracked per player across ALL copies via `nameLimit:true`. スポーア's `countLimit:{n:1,scope:'duel'}` was
   declared without `nameLimit:true`, so with 2+ real copies in the Graveyard, each could independently use
   the effect once — a real rules violation (3 real copies could combine for 3 Level-boosted Special
   Summons in one Duel instead of the correct 1).

## Fix

`cards/30_themes_b.js`, both within スポーア's own `defineScript`:

- `cost()` now persists the captured Level onto the real card object via `API.setCardFlag`, read back in
  `resolve()` via `ctx.card` — the same pattern established in S03-U102.
- `nameLimit:true` added alongside the existing `countLimit:{n:1,scope:'duel'}`.

No engine change; single-card fix for both bugs.

## Dedicated test

`node tools/test_s03_u103_spore.js` — 8 assertions, all pass, real DUEL path throughout.

- **A**: a real other Plant monster (ローンファイア・ブロッサム, real Level 3) is really banished as the real
  cost; スポーア is really Special Summoned from the real Graveyard, and its real current Level really
  becomes 1+3=4 (the fixed Level-increase bug).
- **B**: a real negative control — illegal with no real other Plant monster in the Graveyard.
- **C**: with two real physical スポーア copies and two real Plant fodder in the Graveyard, after really
  using the effect once, the real second copy is correctly illegal too, with the reason confirmed as the
  real once-per-duel limit specifically (`デュエル中に1度までです`), not merely "no fodder" — confirming the
  fixed `nameLimit:true` bug.

Every segment carries a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `IMPLEMENTED` -1, `TESTED` +1 (スポーア).
- `CARD_TEST_FOCUS` given an explicit `{"スポーア"}` entry for this test file.
- `python tools/s03_status_audit.py`: EXIT 0, 104 declared status changes (+1 from U102's 103), off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13377 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations (log `s03_u103_full_gate.log`).

## Real-duel measurement

- `R1_DECKS=debris,karakuri R1_RESPOND=1`, seed `0x7`, first=0 — completed cleanly, turn 12, `replay.ok:true`.
- `R1_DECKS=debris,agent R1_RESPOND=1`, seed `0x1`, first=1 — completed cleanly, turn 8, `replay.ok:true`.

Both: `blocker:null`, `errors:[]`, `unsupported:[]`. スポーア was not drawn in either opening hand, but both
sweeps regression-confirm the debris deck (which carries it) is unaffected.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`cefd6dd68dc952e044b5fb6ec42190aa2a0fb85dbabeb9b89a2852cba9e6953d` (860 files).

## Remaining

The other 11 candidates from the ctx cost→resolve scan are not real-duel-reachable on the 13 fixed major
decks (confirmed via the cross-reference above), so they are deferred (lower real-duel priority, matching
this session's established preference — see `docs/S03_U102_REPORT.md` / the shared handoff for the full
candidate list: 光の護封壁, 受け継がれる力, シンクロ・チェンジ, ダーク・ダイブ・ボンバー, アサルト・アーマー,
アサルト・スピリッツ, ビーストライザー, ドラグニティナイト－ゲイボルグ, プライドの咆哮, フューチャー・グロウ,
ユニバード). 3 more qty=3 main-deck IMPLEMENTED candidates remain from U97's cross-reference: 血の代償
(tg_gadget), TG ラッシュ・ライノ (tg_skill), TG1－EM1 (tg_skill) — then the Extra Deck tier.
