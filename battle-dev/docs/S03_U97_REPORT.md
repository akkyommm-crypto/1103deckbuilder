# S03-U97 超融合 (Super Polymerization) IMPLEMENTED→TESTED (Claude)

Base: shared LATEST `checkpoint_claude_s03_u96_miracle_fusion_20260920.zip` (Claude, U96).

## Why this unit

Continuing priority #7's IMPLEMENTED-tier audit directly after S03-U96. U96's own report/publication
incorrectly stated that "priority #7's IMPLEMENTED-tier main-deck sub-tier is now exhausted at qty≥3." A
fresh cross-reference (`script_coverage.py` regenerated to a scratch path, cross-referenced against all 13
`data/r1_lists/major_decks_v1_*.txt` files, restricted to `status==='IMPLEMENTED'`) found this was wrong: 9
more qty=3 main-deck IMPLEMENTED candidates exist (超融合, デュアルスパーク, ヒーロー・ブラスト, ジュラック・
グアイバ, カラクリ小町 弐弐四, カラクリ解体新書, 血の代償, TG ラッシュ・ライノ, TG1－EM1), all ranked above
every remaining Extra Deck candidate by the qty-first main-deck-first preference. This unit corrects that
stale claim and picks the first of the 9: 超融合 (Super Polymerization), qty=3, hero main deck.

## Card

超融合 (Super Polymerization) — Quick-Play Spell. Real text (confirmed via Yugipedia, this project's target
era 2008-2011, well before the later "negate its effects" errata): "Discard 1 card; Fusion Summon 1 Fusion
Monster from your Extra Deck, using monsters from either field. **Neither player can activate cards or
effects in response to this card's activation.**"

## What was found

The existing implementation (`cards/10_themes_a.js`) already correctly implemented the discard cost and the
"either field" material search: `superPolyOptions(p)` scans **both** players' face-up `mz` monsters (no
player restriction, no Graveyard) as the material pool, reusing the same `parseMaterialSpec`/
`findMaterialCombos` primitives already proven by Synchro/Xyz material matching and by S03-U96's Miracle
Fusion. This is correct and required no change.

But the hard chain lock — **"neither player can activate cards or effects in response to this card's
activation"** — was entirely missing. No such restriction appeared anywhere in `condition`/`cost`/
`selectTargets`/`resolve`, and no generic "cannot be responded to" primitive existed anywhere in `engine/`
(confirmed by grepping the whole `engine/` directory for `noResponse`/`cannotChain`/`chainBan`/`chainLock`/
`respondBlocked`-style names, and by reading `engine/1P_activation_response_s03.js` in full — that file only
implements the unrelated S03-U18/C-S03-15 "respond to and negate an activation" mechanism, not a "cannot be
responded to" mechanism). Without this, real opponent responses (e.g. a set counter trap like マジック・
ジャマー) were wrongly offered as legal chain responses to 超融合's own activation — an ENGINE_MISSING gap,
not a card-specific typo.

## Fix

Added a minimal, generic primitive, reusable by any future card with the same real clause:

- `engine/1P_activation_response_s03.js`: new `CHAIN_RESPONSE_LOCKED_S03` declaration set with
  `declareChainResponseLockedS03(names)` / `chainResponseLockedS03()`. The latter checks whether the current
  top of `gameState.chain` is a declared name.
- `engine/30_processor_chain_battle.js`: `getChainResponsesV2(p)` — the single shared function behind both
  the chain-priority window (`openChainPriorityV2`) and the quick-effect POINT window (`pointResponsesV27`,
  used by `processPointV27`) — now returns no candidates at all whenever the top of the chain is a declared
  name, before building any candidate list (including the 王宮の弾圧-style shared-use candidates from
  `sharedUseResponseCandidatesS03`).
- `cards/H5_claude_s03_activation_response.js`: `declareChainResponseLockedS03(['超融合'])`.

This is fully generic (a future card with the same real clause needs only one declaration line) and
self-limiting by construction: it only suppresses responses while the locking card is literally on top of
the chain. Once it resolves and is removed from `gameState.chain` (normal `SOLVE_CHAIN`), later independent
activations are completely unaffected — matching the real card text's scope ("in response to **this card's**
activation").

## Dedicated test

`node tools/test_s03_u97_super_polymerization.js` — 11 assertions, all pass, real DUEL path throughout.

- **A**: 超融合 discards a real hand card and really Fusion Summons E・HERO アブソルートZero from the real
  Extra Deck, using one real material from **each** field (P0's field monster and P1's field monster — a real
  exercise of "either field"). While 超融合 sits on top of the real chain, `getChainResponsesV2` returns **no**
  candidates for **either** player — even though P1 has a real, otherwise-legal set マジック・ジャマー (negates
  a Spell Card's activation) with a real discardable hand card ready for its cost. The real Fusion Summon,
  the real material sends to each field's real grave, the real discard cost, and 超融合 itself resolving to
  the real grave are all regression-checked correct; the real chain is empty afterward; マジック・ジャマー never
  activates (stays set).
- **B** (contrast): the exact same set マジック・ジャマー **is** a real legal chain response to an ordinary real
  opponent Spell activation (サイクロン) that carries no chain-lock declaration — proving the exclusion in A is
  specific to 超融合's own lock, not a setup mistake or a generally-broken responder.
- **C**: a real negative control — illegal with no satisfiable real material combination on either field.

Every segment carries a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `IMPLEMENTED` -1, `TESTED` +1 (超融合).
- `CARD_TEST_FOCUS` given an explicit `{"超融合"}` entry for this test file.
- `python tools/s03_status_audit.py`: EXIT 0, 98 declared status changes (+1 from U96's 97), off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13323 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations (log `s03_u97_full_gate.log`).

## Real-duel measurement

This unit changed a shared engine function (`getChainResponsesV2`), so a fresh R1 sweep was run (not just the
dedicated test) to check for regressions in general chain-response behavior across unrelated decks:

- `R1_DECKS=hero,six R1_RESPOND=1`, seed `0x1`, first=0 — completed cleanly, turn 6, `replay.ok:true`,
  `digestDiff:null`.
- `R1_DECKS=hero,six R1_RESPOND=1`, seed `0x3`, first=1 — completed cleanly, turn 8, `replay.ok:true`,
  `digestDiff:null` (ライオウ negations, 六武衆 chain plays all functioning normally alongside the fix).
- `R1_DECKS=hero,dark R1_RESPOND=1`, seed `0x7`, first=0 — completed cleanly, turn 12, `replay.ok:true`,
  `digestDiff:null`. 超融合 was actually present in P0's opening hand this run.
- `R1_DECKS=debris,agent R1_RESPOND=1`, seed `0x3`, first=0 (the exact matchup/seed from S03-U95's 120s-hang
  investigation, unrelated to 超融合/hero) — completed cleanly, turn 25, `replay.ok:true`, `digestDiff:null`,
  confirming U95's audit-cadence fix still holds and this unit's engine change introduces no new hang.

All four sweeps: `blocker:null`, `errors:[]`, `unsupported:[]`.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`b1a5a6d6971c408afcd1d6c19b12ba68aa2fb9f0f7a0c8f97d16805c3306dfa5` (847 files).

## Remaining

The main-deck IMPLEMENTED-tier qty=3 sub-tier still has 8 more candidates after this unit: デュアルスパーク,
ヒーロー・ブラスト, ジュラック・グアイバ, カラクリ小町 弐弐四, カラクリ解体新書, 血の代償, TG ラッシュ・ライノ,
TG1－EM1 — all outranking the remaining Extra Deck tier (A・O・J カタストル / インヴェルズ・ローチ qty=10 each,
氷結界の龍 ブリューナク qty=8, No.39 希望皇ホープ qty=8, TG ハイパー・ライブラリアン qty=6, ガチガチガンテツ /
フォーミュラ・シンクロン / キメラテック・フォートレス・ドラゴン qty=3) per the established main-deck-first
preference. Priority #7 continues directly into these next.
