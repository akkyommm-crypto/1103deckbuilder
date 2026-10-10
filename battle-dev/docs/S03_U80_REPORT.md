# S03-U80 ジュラック・ヴェルヒプト NOT_STARTED→TESTED + Synchro-material atk/def snapshot extension (Claude)

Base: shared LATEST `checkpoint_claude_s03_u79_dragunity_arms_levateinn_20260919.zip` (Claude, U79).

## Why this unit

Continuing priority #7 directly from S03-U79's own cross-reference pass (all 13 fixed deck lists against
`script_coverage.py`), which logged a short list of unresearched NOT_STARTED main-deck candidates in
WORK_QUEUE.md. ジュラック・ヴェルヒプト (Jurrac main deck) was the first assessed and found tractable — every
piece composes from existing primitives, needing only a small additive engine extension.

## Card

ジュラック・ヴェルヒプト (this project's own card database, printed 2009-04-14, within the 2011-08-31
cutoff), a FIRE Dinosaur Synchro Effect Monster, Level 5 (1 Tuner + 1 or more non-Tuner Dinosaur-type
monsters):

1. This card's ATK/DEF become equal to the total original ATK of the monsters used as its Synchro Material.
2. If this card attacks a face-down Defense Position monster, it can destroy that monster without damage
   calculation, while that monster remains face-down Defense Position.

## Design — reusing existing primitives, plus one small additive extension

- **Clause 1** needed the total *original* ATK of its own Synchro Materials — the same shape as
  合成魔獣ガーゼット/偉大魔獣ガーゼット's (`cards/88_p3_provenance_recovery.js`) "sum of original ATK of
  Tribute materials," but for Synchro materials, which had no such data at all. The engine already snapshots
  Synchro materials per-card (`engine/00_state_actions.js`, `EX_SUMMON_PREPARE_V42`:
  `card.v380SummonMaterials`, an established, Replay-safe, already-consumed-by-2-other-cards mechanism) — but
  it only recorded `name`/`tuner`/`lv`, never `atk`/`def`. Extended it to also record `atk`/`def` via
  `p3OriginalStatV3` (the same "original stat" getter the P3 system already uses for Tribute materials, so a
  material whose own base ATK had been overwritten by a prior effect is still honored correctly) — captured
  at the same pre-reset/pre-move point in the code as the pre-existing `lv` snapshot, for consistency. No new
  state model; this fills in fields the exact same snapshot mechanism already had room for.
- **Clause 2** reuses the shared "no damage calculation, destroy before damage step" pattern already used by
  14 other cards in `cards/A3_auto_cycle01.js` (`a3PreDamageDestroy` factory, `a3IsAttacker`/`a3AttackTarget`
  helpers; precedent: ズババナイト — same shape, but face-up Defense Position instead of face-down). Written
  directly (not via the factory function) so it could share one script registration with clause 1's own
  `continuous` block.

New file `cards/HN_claude_s03u80_jurrac_velophnyx.js`.

## Dedicated test

`node tools/test_s03_u80_jurrac_velophnyx.js` — 9 assertions, all pass, real DUEL path throughout.

- **A**: a real Synchro Summon (ジュラック・アウロ, Level 1 Tuner, ATK 200 + ジュラック・グアイバ, Level 4
  non-Tuner Dinosaur, ATK 1700) confirms real ATK/DEF become 1900 (the real total), and the extended
  `v380SummonMaterials` snapshot really records each material's `atk`.
- **B**: a real attack on a real face-down Defense Position monster destroys it with real no damage
  calculation (LP unchanged on both sides).
- **C**: a real negative control — attacking a real face-up Defense Position monster does NOT trigger clause
  2; the monster is destroyed by normal real battle damage instead (same end state, different real cause,
  confirming the face-down-specific scoping).

Every segment carries a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `NOT_STARTED` -1, `TESTED` +1 (ジュラック・ヴェルヒプト).
- `CARD_TEST_FOCUS` given an explicit `{"ジュラック・ヴェルヒプト"}` entry for this test file — ジュラック・
  アウロ／ジュラック・グアイバ are genuinely exercised as real Synchro-material fixtures, but promoting them
  is out of this unit's scope (ジュラック・グアイバ was caught as an off-target `IMPLEMENTED`→`TESTED` flip
  before this entry was added; fixed before publication, same precedent as U76/U79's own サンダー・ブレイク
  handling).
- `python tools/s03_status_audit.py`: EXIT 0, 80 declared status changes (+1 from U79), off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13177 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations.

## Real-duel measurement

Not independently re-confirmed via a fresh R1 sweep of a specific fixed-list pair this unit; the dedicated
real-path test above is this unit's evidence. A future Jurrac-including sweep would exercise this card
incidentally.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`cf3fe6d59f7fd01d2c317a4866756d687d9e76a3bf389bbb3cc5c6362efe4fd6` (813 files).

## Remaining

- 六武衆の影武者 remains the one genuine ENGINE_GAP needing a real new capability — left for a future unit.
- The optional P3 real-path confirmation follow-up (突風 + 11 `cards/88_p3_provenance_recovery.js` cards,
  surfaced in S03-U79) remains open, no known bug.
- Remaining unresearched candidates from S03-U79's own cross-reference pass (see WORK_QUEUE.md Ready): BF－孤
  高のシルバー・ウィンド, 天刑王 ブラック・ハイランダー, A・O・J ディサイシブ・アームズ (all Extra Deck
  Synchros), E・HERO アブソルートZero, 波動竜騎士 ドラゴエクィテス (both Extra Deck Fusions).
- Per the fixed fallback order, continuing directly into the next Requirement.
