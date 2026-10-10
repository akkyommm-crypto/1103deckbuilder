# S03-U99 ヒーロー・ブラスト (Hero Blast) IMPLEMENTED→TESTED (Claude)

Base: shared LATEST `checkpoint_claude_s03_u98_dual_spark_20260920.zip` (Claude, U98).

## Why this unit

Continuing priority #7's IMPLEMENTED-tier audit directly after S03-U98, using U97's corrected
cross-reference: ヒーロー・ブラスト (Hero Blast), qty=3, hero main deck — next of the 7 remaining qty=3
main-deck candidates.

## Card

ヒーロー・ブラスト — Normal Trap. Real text (confirmed via Yugipedia): "Target 1 'Elemental HERO' Normal
Monster in your GY; add that target to your hand, then if your opponent controls any monsters with ATK less
than or equal to that target's ATK, destroy 1 of them."

## What was found

The GY target search (`heroNormalInGrave`, `cards/30_themes_b.js`) already correctly reuses the existing
`treatedAsNormal(card)` helper, so a "Dual"/Gemini "E・HERO" monster such as E・HERO アナザー・ネオス
correctly counts as a Normal Monster while sitting in the GY (matching real rulings — Gemini monsters are
treated as Normal Monsters everywhere except while "re-summoned" on the field). The add-to-hand and the
ATK-threshold opponent-monster filter (`curATK(x.card) <= atk`) were also already correct.

But the real text has no "you can" before "destroy" — Konami's phrasing convention makes the destroy
**mandatory** once its own condition (the opponent controls a qualifying monster) is met; only *which*
qualifying monster to destroy is a free choice, not *whether* to destroy at all. The existing `resolve()`
declared the destroy-target `API.requestChoice` with `cancelable:true`, letting the controller illegally
decline the entire destroy even when a real qualifying opponent monster existed. A real, previously-
undiscovered bug — the same "mandatory vs optional" bug class already found once this session (S03-U94's
ライコウ), but the opposite shape: there the mandatory half was wrongly nested inside an optional choice
handler; here the whole clause was wrongly made optional via `cancelable:true`.

## Fix

`cards/30_themes_b.js`, ヒーロー・ブラスト's `resolve()`: the destroy-target `API.requestChoice` now declares
`cancelable:false`. Confirmed via `engine/09_choice_request_v49.js`: a non-cancelable pending choice rejects
`__choiceCancelV49()` outright (`if(!pc.cancelable){...return false;}`) and stays pending. No engine change;
single-card fix.

## Dedicated test

`node tools/test_s03_u99_hero_blast.js` — 9 assertions, all pass, real DUEL path throughout.

- **A**: a real "E・HERO" Normal-treated GY monster (E・HERO アナザー・ネオス, ATK 1900) is really targeted
  and added to hand. The real opponent controls one real qualifying monster (もけもけ, ATK 300) and one real
  non-qualifying monster (青眼の白龍, ATK 3000) — the destroy choice is confirmed real `cancelable:false`; a
  real `__choiceCancelV49()` attempt really fails and the choice really stays pending (the fix under test);
  once answered, only the real qualifying monster is really destroyed, the non-qualifying one untouched.
- **B**: a real negative control — illegal with no "E・HERO" Normal-treated GY monster.
- **C**: with the real opponent controlling only a real non-qualifying monster, the real add-to-hand still
  happens but no destroy choice is offered at all — confirming the fix does not turn a genuinely-absent
  qualifying target into a forced (impossible) destroy.

Every segment carries a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `IMPLEMENTED` -1, `TESTED` +1 (ヒーロー・ブラスト).
- `CARD_TEST_FOCUS` given an explicit `{"ヒーロー・ブラスト"}` entry for this test file.
- `python tools/s03_status_audit.py`: EXIT 0, 100 declared status changes (+1 from U98's 99), off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13342 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations (log `s03_u99_full_gate.log`).

## Real-duel measurement

A real card-logic fix, so a fresh R1 sweep was run:

- `R1_DECKS=hero,karakuri R1_RESPOND=1`, seed `0x4`, first=0 — completed cleanly, turn 7, `replay.ok:true`,
  `digestDiff:null`.
- `R1_DECKS=hero,six R1_RESPOND=1`, seed `0x8`, first=1 — completed cleanly, turn 10, `replay.ok:true`,
  `digestDiff:null`. ヒーロー・ブラスト was actually present in P0's opening hand this run.

Both: `blocker:null`, `errors:[]`, `unsupported:[]`.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`28f7119c355c946cd296c945b30a436ffc4f37d659973f3610224f3e9fd59826` (852 files).

## Remaining

6 more qty=3 main-deck candidates from U97's cross-reference: ジュラック・グアイバ (jurrac), カラクリ小町
弐弐四 (karakuri), カラクリ解体新書 (karakuri), 血の代償 (tg_gadget), TG ラッシュ・ライノ (tg_skill),
TG1－EM1 (tg_skill) — then the Extra Deck tier. Re-run the cross-reference fresh at the start of the next
unit rather than trusting this list verbatim.
