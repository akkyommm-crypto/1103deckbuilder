# S03-U81 BF－孤高のシルバー・ウィンド NOT_STARTED→TESTED + protectV21 per-source perTurn extension (Claude)

Base: shared LATEST `checkpoint_claude_s03_u80_jurrac_velophnyx_20260919.zip` (Claude, U80).

## Why this unit

Continuing priority #7 directly from S03-U79's own cross-reference pass (candidate list logged in
WORK_QUEUE.md). BF－孤高のシルバー・ウィンド (BF main deck) was the next candidate assessed after ジュラック・
ヴェルヒプト (U80) and found tractable.

## Card

BF－孤高のシルバー・ウィンド (this project's own card database, printed 2009-07-18, within the 2011-08-31
cutoff), a DARK Winged Beast Synchro Effect Monster, Level 8 ("BF"-named Tuner + 2 or more non-Tuner
monsters):

1. When this card is Synchro Summoned, you can select up to 2 monsters on the field with DEF lower than this
   card's ATK and destroy them. The turn you activate this effect, you cannot conduct your Battle Phase.
2. Once during the opponent's turn, as long as this card exists face-up on the field, your "BF"-named
   monsters are not destroyed by battle.

## Design

- **Clause 1** reuses `s03SynchroSelf` (the established "this card was really Synchro Summoned" check,
  `cards/H1_claude_s03_dragunity.js`), the shared `v380SelectUpTo` "select up to N" targeting helper
  (precedent: 氷帝メビウス, `cards/39_1103_expansion_v380b.js` — an identically-shaped monster-trigger "select
  up to 2, destroy" real card), and the established `temporaryFlags.noBattlePhase` primitive (precedent:
  裁きの代行者 サターン / エンシェント・フェアリー・ドラゴン, S03-U73) for "cannot conduct your Battle Phase
  this turn."
- **Clause 2** reuses System v21 destruction protection (`sc.continuous.protectV21`) — but surfaced a real
  gap.

## A real gap found and fixed while building this

`protectV21`'s `perTurn` limit tracks usage **on the protected card** (`card.protUsedV21`), not on the card
**granting** the protection. That's correct for the common "this specific monster is protected once per turn"
shape (every existing consumer), but BF－孤高のシルバー・ウィンド's real text is different: it grants ONE
protection per opponent's turn, shared across *any* of the controller's "BF" monsters — a source-side limit,
not a per-target one. With the un-extended primitive, each target card tracked its own independent counter,
so two *different* BF monsters could each be saved once in the same opponent's turn — twice the real text
allows.

Fixed with a small, generic, opt-in extension (`engine/1K_destruction_protection_v21.js`):
`sc.continuous.protectV21` (or `sc.protectV21`) can now declare `perTurnScope:'source'`. `resolveProtSpecV21`
records the granting card on the resolved record; `protectionRecordV21` and `applyDestructionProtectionV21`
consult a new `protCountCardV21(record, target)` helper to decide which card's counter to check/consume —
the source's when `perTurnScope==='source'`, the target's (the pre-existing, default behavior) otherwise.
Every existing `protectV21` consumer (20 other cards) keeps its default per-target behavior unchanged, since
none of them pass `perTurnScope` — confirmed via the two pre-existing dedicated regression suites,
`tools/test_destruction_protection_v21.js` and `tools/test_destruction_protection_cards.js` (both still
0 FAIL).

New file `cards/HO_claude_s03u81_bf_silverwind.js`.

## Dedicated test

`node tools/test_s03_u81_bf_silverwind.js` — 12 assertions, all pass, real DUEL path throughout.

- **A**: a real Synchro Summon (BF－空風のジン, Tuner + BF－蒼炎のシュラ + BF－月影のカルート, 2 real
  non-Tuners) really produces BF－孤高のシルバー・ウィンド (ATK 2800). Its real ① trigger destroys exactly 2
  of 3 real legal opponent targets — the test explicitly avoids a naive index-0 auto-pick, since this card's
  own DEF (2000) is below its own ATK and is technically a legal target too (real raw text does not exclude
  self-targeting). Confirms the real `temporaryFlags.noBattlePhase` flag is set, and — via the real
  `nextPhaseIdV27` production function — that leaving Main Phase 1 is genuinely redirected straight to the
  End Phase that turn.
- **B**: a real BF monster survives real battle destruction once during a real opponent's turn; a second
  real battle-destroy attempt against a *different* real BF monster in the *same* opponent's turn is
  correctly **not** protected — the new `perTurnScope:'source'` extension working as intended.
- **C**: a real negative control — a non-BF monster is never protected, destroyed by normal real battle even
  on the first attack of the turn.

Every segment carries a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `NOT_STARTED` -1, `TESTED` +1 (BF－孤高のシルバー・ウィンド).
- `CARD_TEST_FOCUS` given an explicit `{"BF－孤高のシルバー・ウィンド"}` entry for this test file — the BF
  material fixtures and 青眼の究極竜 are genuinely exercised as real fixtures but promoting them is out of
  this unit's scope, same precedent as U76/U79/U80.
- `python tools/s03_status_audit.py`: EXIT 0, 81 declared status changes (+1 from U80), off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13189 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations.

## Real-duel measurement

Not independently re-confirmed via a fresh R1 sweep of a specific fixed-list pair this unit; the dedicated
real-path test above is this unit's evidence. A future BF-including sweep would exercise this card
incidentally.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`ab6c84a0cf837f6831f894f3fc9ebd06020894afd9296de820f6251316fdfc04` (816 files).

## Remaining

- 六武衆の影武者 remains the one genuine ENGINE_GAP needing a real new capability — left for a future unit.
- The optional P3 real-path confirmation follow-up (突風 + 11 `cards/88_p3_provenance_recovery.js` cards,
  surfaced in S03-U79) remains open, no known bug.
- Remaining unresearched candidates from S03-U79's own cross-reference pass (see WORK_QUEUE.md Ready): 天刑王
  ブラック・ハイランダー (needs a genuinely new Synchro-Summon-specific global lock — the existing
  `v46GlobalSpecialSummonRestrictionReason` is a hardcoded name list scoped to Special Summons broadly, not
  Synchro specifically; assessed but not started), A・O・J ディサイシブ・アームズ (a 3-mode selectable
  effect, moderate complexity, not yet assessed in depth), E・HERO アブソルートZero, 波動竜騎士 ドラゴエクィテス
  (both Extra Deck Fusions — Fusion material-legality checking in this engine remains uninvestigated).
- Per the fixed fallback order, continuing directly into the next Requirement.
