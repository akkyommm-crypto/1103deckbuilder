# S03-U98 デュアルスパーク (Dual Spark / Gemini Spark) IMPLEMENTED→TESTED (Claude)

Base: shared LATEST `checkpoint_claude_s03_u97_super_polymerization_20260920.zip` (Claude, U97).

## Why this unit

Continuing priority #7's IMPLEMENTED-tier audit directly after S03-U97, using U97's own corrected
cross-reference: デュアルスパーク (Dual Spark; OCG name for the international "Gemini Spark"), qty=3, hero
main deck — first of the 8 remaining qty=3 main-deck candidates.

## Card

デュアルスパーク — Normal Spell. Real text (OCG, confirmed via Yugipedia): "You can activate this by
releasing 1 face-up Level 4 Gemini monster on your field, targeting 1 card on the field; destroy that card,
and you draw 1 card from the Deck."

Critically, Konami's own official rulings (both the TCG Gameplay FAQ for this card's release set and the OCG
Card Database, both read directly via Yugipedia's Card Rulings page for this card) state explicitly:

> Destroying the target card and drawing 1 card are resolved at the same time. If you cannot destroy the
> target card, you cannot draw.

## What was found

The cost (release 1 face-up Level 4 Gemini/デュアル monster the controller controls, via the existing
`duelSparkFodder(p)` helper) and the target pool (`API.fieldCards({filter:x=>x.card})` — any 1 card anywhere
on the field, either side, matching real text's unrestricted "1 card on the field") were already correctly
implemented in `cards/30_themes_b.js`.

But `resolve()` unconditionally called `API.draw(ctx.player, 1, ...)` regardless of whether the preceding
`API.destroy(t, ...)` actually succeeded — directly contradicting the ruling above. Empirically confirmed the
engine's real activation order for this card is cost-first, target-second (the cost is paid before the target
is chosen, and the target pool at that point still includes the currently-resolving デュアルスパーク itself,
since it physically remains in the Spell/Trap Zone until it finishes resolving). This means a real destroy
failure is reachable whenever the chosen target cannot actually be destroyed by the time resolution runs —
most simply, a real destruction-immune monster (System v21, e.g. M・HERO ヴェイパー's unconditional
`protectV21:{effect:true}`), or (per a Judge Program Forum ruling for this exact card, noting Stardust
Dragon can respond) an opponent's real response removing or protecting the target. The old code always drew
a card in this case regardless, which is a real, previously-undiscovered correctness bug.

## Fix

`cards/30_themes_b.js`, デュアルスパーク's `resolve()`: re-locate the target's real position via
`resolveTarget(t)` immediately before calling `API.destroy(t, ...)`, then check the target card's real
post-destroy position via `locateCardAnyV4(targetCard)` — only draw if it actually ended up in the real
Graveyard. Both `resolveTarget` and `locateCardAnyV4` are existing primitives already used elsewhere in this
codebase for exactly this kind of post-resolution position check (e.g. `d2FoeSpell`/`d2FaceUpMz` in
`cards/C5_auto_cycle23.js`). No engine change; single-card fix.

## Dedicated test

`node tools/test_s03_u98_dual_spark.js` — 9 assertions, all pass, real DUEL path throughout.

- **A** (regression): a real opponent monster is really targeted and really destroyed (the real Gemini
  monster cost is released first, confirming the engine's real cost-then-target order); since the real
  destroy really succeeds, the controller really draws — the already-correct half of the ruling keeps
  working.
- **B**: a real negative control — illegal with no release candidate.
- **C** (the fix): the real target (M・HERO ヴェイパー, real unconditional effect-destruction immunity via
  System v21) really cannot be destroyed. The real cost (the Tribute) is still really paid regardless — a
  paid cost is never undone by a failed effect — but the controller correctly does **not** draw, matching the
  official ruling exactly.

Every segment carries a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `IMPLEMENTED` -1, `TESTED` +1 (デュアルスパーク).
- `CARD_TEST_FOCUS` given an explicit `{"デュアルスパーク"}` entry for this test file.
- `python tools/s03_status_audit.py`: EXIT 0, 99 declared status changes (+1 from U97's 98), off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13332 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations (log `s03_u98_full_gate.log`).

## Real-duel measurement

A real card-logic fix (not verify+test only), so a fresh R1 sweep was run:

- `R1_DECKS=hero,six R1_RESPOND=1`, seed `0x5`, first=0 — completed cleanly, turn 15, `replay.ok:true`,
  `digestDiff:null`.
- `R1_DECKS=hero,dark R1_RESPOND=1`, seed `0x2`, first=1 — completed cleanly, turn 8, `replay.ok:true`,
  `digestDiff:null`. デュアルスパーク was actually present in P0's opening hand this run.

Both: `blocker:null`, `errors:[]`, `unsupported:[]`.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`bfe0f43bdce632928f0492e4e94fd6bd43e45a34fa5ce31102a0a292ee3228e1` (850 files).

## Remaining

7 more qty=3 main-deck candidates from U97's cross-reference: ヒーロー・ブラスト (hero), ジュラック・グアイバ
(jurrac), カラクリ小町 弐弐四 (karakuri), カラクリ解体新書 (karakuri), 血の代償 (tg_gadget), TG ラッシュ・
ライノ (tg_skill), TG1－EM1 (tg_skill) — then the Extra Deck tier. Re-run the cross-reference fresh at the
start of the next unit rather than trusting this list verbatim (per the lesson from U96/U97).
