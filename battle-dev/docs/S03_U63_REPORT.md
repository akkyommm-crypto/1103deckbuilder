# S03-U63 resolution-time Deck choice expansion (Claude)

Base: shared LATEST `checkpoint_claude_s03_u62_legacy_choice_migration_20260918.zip` (Claude, U62).

## Why this unit

Fixed fallback order after U62 closed the resolve()/operation()-time legacy-choice bug class (0 remaining):
priority #3 (Ready Requirement affecting multiple major decks). S03-U58's own report explicitly scoped
itself to "the representative non-target Deck choice timing gap" and left the rest for later measurement.
Confirmed for real before committing: クリッター's `selectTargets` picked its GY-search target at
activation time (before the chain even resolves) — the exact same architectural anti-pattern U58 fixed for
増援/テラ・フォーミング/おろかな埋葬/ワン・フォー・ワン, just not yet applied here.

## Audit

`CARD_SCRIPTS` entries whose `selectTargets` pulls candidates from the `'deck'` pile for a **non-targeting**
effect (`sc.targets` falsy — the U58 anti-pattern signature): **21 cards**. Cross-referenced against
`1103_MAJOR_DECKS_v1` (`data/r1_lists/major_decks_v1_*.txt`): **7 reachable from a fixed-list deck** —
クリッター, E・HERO エアーマン, ローンファイア・ブロッサム, 神秘の代行者 アース, 創造の代行者 ヴィーナス,
カラクリ商人 壱七七, カラクリ大将軍 無零怒. Fixed all 7 in this unit; the remaining 14 (not reachable from a
fixed-list deck) are left for a later, similarly-scoped unit if a real-duel measurement surfaces one.

## Fix

Moved each card's Deck-choice from `selectTargets` (activation-time) into `resolve()` (resolution-time),
using `API.requestChoice` against the **current** Deck state at resolution — reusing U58's own generic
registered handlers (`s03u58.deck-search`, `s03u58.deck-special`) wherever the shape matched exactly, and
writing one small dedicated handler (`s03u63.venus-summon-sphere`) for 創造の代行者 ヴィーナス, whose
candidates span both Deck **and** Hand (U58's `deck-*` handlers are Deck-only).

Two cards needed care beyond a direct search→resolution move:

- **E・HERO エアーマン**: a "choose 1: destroy (targets) or search (doesn't target)" effect. The mode
  choice and the destroy branch's real target both correctly stay at activation (destroying is itself a
  targeting effect); only the search branch's specific card choice moves to resolution.
- **ローンファイア・ブロッサム** / **カラクリ大将軍 無零怒**: the release/cost half stays at activation (a
  real cost declaration); only the Special Summon target moves to resolution. Both previously worked around
  activation-time staleness by re-searching the Deck for "another copy with the same name" as the
  originally-picked (now possibly stale) card at resolution — a band-aid, not a fix, for the same underlying
  wrong-timing bug. Since resolution now asks the player directly from the *current* Deck, that indirection
  is no longer needed and was removed — the player gets a real, direct choice, matching U58's own precedent
  and real card text ("Special Summon 1 [Type]-Type monster from your Deck," not "an unspecified same-named
  copy").

## Pre-existing test fallout

One existing test (`tools/test_s03_u04_lock_recovery.js`) asserted on 神秘の代行者 アース's search result
immediately after a single `pick()`+`pass()` cycle, assuming the old activation-time choice. Updated it to
answer the now-separate resolution-time choice too (test fix matching the corrected architecture, not a card
behavior change) — the other 46 files referencing these 7 card names needed no change.

## Dedicated test

`node tools/test_s03_u63_resolution_deck_choice_expansion.js` — 23 assertions, all pass, real DUEL path
throughout (each card triggered via its actual game-path activation — hand activation, a real Normal or
Special Summon, or a synthetic-but-real `onSpecialSummon(kind:'synchro')` event for 無零怒, whose own trigger
needs a synchro-classified summon `API.specialSummon` doesn't provide a way to construct directly):

- **A.** クリッター: resolution-time choice confirmed via a real SaveLoad round-trip (same rigor as U58/U62).
- **B.** E・HERO エアーマン: mode confirm stays at activation, search choice at resolution.
- **C.** ローンファイア・ブロッサム: release (cost) + resolution-time Special Summon, full cycle.
- **D–G.** 神秘の代行者 アース, 創造の代行者 ヴィーナス, カラクリ商人 壱七七, カラクリ大将軍 無零怒: each
  confirmed with a real resolution-time choice and a completed search/Special Summon.

## Real-duel measurement

R1 sweeps (`R1_LIST=v1`, `R1_RESPOND=1`), real DUEL game path: 【Dragunity】 vs 兎ラギア (4 duels) and
【HERO】 vs 【Six Samurai】 (the fixed pair exercising E・HERO エアーマン for real, 2 duels): **6 / 6
completed**, `blocker: null`, `unsupported: []`, Replay ok.

## Gate

- `python tools/check.py` — EXIT 0, **12953 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations (log `s03_u63_full_gate.log`).
- `python tools/s03_status_audit.py` — EXIT 0: 50 declared status changes (48 carried + 2 new promotions
  this unit), 0 off-target, TOTAL 4996.
- Coverage: TESTED 2097 → 2099 (+2: ローンファイア・ブロッサム, 創造の代行者 ヴィーナス, IMPLEMENTED →
  TESTED). The other 5 converted cards were already TESTED.
- Acode build skipped for this unit per current instruction (generate only at release or on explicit
  request).

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips, this report set aside):
`9a862474d5a0ab29bdf5b921abc96f079b68e7fa90587574d39c5f5180140811` (766 files).

## Remaining

- 14 of the 21 audited cards (not reachable from a `1103_MAJOR_DECKS_v1` fixed-list deck) still have the
  activation-time Deck-choice shape: 終末の騎士, ダーク・グレファー, ゴブリンゾンビ, 極星獣タングニョースト,
  封印の黄金櫃, コーリング・ノヴァ, 鬼ガエル, XX－セイバー エマーズブレイド, マシンナーズ・ギアフレーム,
  スクラップ・エリア, ヒーローアライブ, 神の桎梏グレイプニル, ピラミッド・タートル, 魔轟神グリムロ — a
  candidate for a later, similarly-scoped unit if a real-duel measurement surfaces one.
- Per the fixed fallback order, continuing directly into a fresh real-duel sweep / the next Ready item.
