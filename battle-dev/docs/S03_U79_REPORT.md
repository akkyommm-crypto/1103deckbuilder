# S03-U79 ドラグニティアームズ－レヴァテイン NOT_STARTED→TESTED + P3 effect-context DUEL wiring fix (Claude)

Base: shared LATEST `checkpoint_claude_s03_u78_xyz_energy_fix_20260919.zip` (Claude, U78).

## Why this unit

Two consecutive fresh major-deck-pair sweeps (Agent+Six Samurai, Dragunity+Dark World, both 8/8 clean) found
no new blocker, so per the established "two consecutive clean sweeps → shift to priority #7" convention, this
unit audits NOT_STARTED/PARTIAL/IMPLEMENTED/ENGINE_GAP cards within the fixed major-deck lists directly.
Cross-referencing all 13 deck lists against `script_coverage.py` surfaced ドラグニティアームズ－レヴァテイン
(Dragunity main deck, NOT_STARTED, no flagged engine gap) as a well-scoped candidate.

## Card

ドラグニティアームズ－レヴァテイン (this project's own card database, printed 2010-06-19, within the
2011-08-31 cutoff), a Level 8 WIND Dragon Effect Monster:

1. Banish 1 face-up monster you control equipped with a card named "Dragunity"; Special Summon this card
   from your hand or GY.
2. When this card is Normal or Special Summoned, you can select 1 Dragon-type monster in your GY (other
   than this card by name) and treat it as an Equip Card equipped to this card.
3. When this card is sent to the GY by an opponent's card effect, you can Special Summon 1 monster that was
   equipped to this card as an Equip Card.

## Design — every piece reuses an existing primitive

- **①**: `summonProcedure:{from:['hand','grave'],...}`. The array-of-zones form was already generically
  supported (`summonProcedureZonesV370`, and `pileDuelActionsV370` already scans `sc.summonProcedure` for any
  pile zone including `grave`) — just never exercised by a card declaring both `hand` and `grave` together
  before. Cost: `API.banish` a real own face-up monster whose `equipsOnV15(card,gameState)` includes a card in
  `SETCODE.DRAGUNITY`.
- **②**: the exact grave-equip primitive already used by 3 other Dragunity Synchros in this codebase
  (`cards/F9_astra_system01.js`: `as01Pool`/`as01EquipChoice`/`API.equipFromGrave`/`graveEquipLegalV31`,
  System v31 "Astra 01") — only the predicate differs (any Dragon-type monster, no Level/archetype
  restriction, excluding this card's own name per real text).
- **③**: `API.movedByOpponentEffect` (precedent: 突風, `cards/89_p11_activation_choice_recovery.js`) for
  "sent to the GY by an opponent's card effect." Since `equippedBy`/`equipTo` are zone-local (wiped by
  `reset()` the instant this card itself leaves the field), a new card-local bookkeeping field
  (`u79LevaEquipUid`) records which monster ② last equipped — the same kind of instance-local flag already
  used pervasively in this codebase (e.g. `v46StardustReturnTurn`).

New file `cards/HM_claude_s03u79_dragunity_arms_levateinn.js`.

## Two real bugs found and fixed while building this

**1. Replay-unsafe direct field write.** The first draft wrote `ctx.card.u79LevaEquipUid = target.card.uid`
directly. Since this bypasses the Action/journal system, a fresh Replay never reproduces the write — the
existing engine comment (`engine/40_legal_script_engine.js`, S03-U08) states the rule explicitly: "state flags
set during effect processing must always be written via an Action (for Replay digest consistency)." Fixed by
switching to the established `API.setCardFlag(target, flag, value, reason, {silent:true})` primitive
(`FX_CARD_FLAG_V46`), which journals the write correctly.

**2. A genuine, previously-undiscovered ENGINE_MISSING gap: P3 effect-context was never wired into real
DUEL-mode chain resolution.** `API.movedByOpponentEffect`/`moveProvenance` (`engine/12_provenance_v3.js`)
depend on `p3BeginEffectContextV3(player)`/`p3EndEffectContextV3()` being called around whatever code produces
the move Action, so `p3StampMoveProvenanceV3` can auto-stamp `a.p3` onto `FX_TO_GRAVE`/`FX_DISCARD`/etc.
Auditing every call site found this wrapper is invoked from a legacy/manual resolution path
(`engine/40_legal_script_engine.js`, around its own `ACTIVE_SCRIPT`/`p3EndEffectContextV3()` cleanup calls)
and, separately, directly by test harnesses (`tools/test_p3_provenance_cards.js`'s own `oppSend()` helper
manually calls `p3BeginEffectContextV3(1)` around its test action) — but **never** by
`resolveOnePreparedLinkV27` (`engine/30_processor_chain_battle.js`), the actual function that resolves a real
chain link in DUEL mode. This means `API.movedByOpponentEffect` silently always returned `false` for any card
destroyed via a real chain-resolved effect in actual play — affecting not just this card's clause ③, but all
11 cards in `cards/88_p3_provenance_recovery.js` (カイザー・サクリファイス, ゾルガ, 疾風鳥人ジョー,
エレクトリック・スネーク, 再生ミイラ, 闇よりの恐怖, 闇より出でし絶望) and 突風 — every one of which is TESTED
today only because its own test manually wraps the P3 context, never exercising the real DUEL path for that
part of its condition. Fixed generically: `resolveOnePreparedLinkV27` now wraps `sc.resolve(ctx)` with
`p3BeginEffectContextV3(link.player)` / `p3EndEffectContextV3()` (try/finally) — a minimal, shared fix
benefiting every card using this primitive, not just this one.

## Dedicated test

`node tools/test_s03_u79_dragunity_arms_levateinn.js` — 18 assertions, all pass, real DUEL path throughout.

- **A**: real setup reusing ドラグニティ－アキュリス's own S03-U43 mechanic (Normal Summon → real trigger
  Special Summons ドラグニティ－ファランクス and equips アキュリス onto it) to legitimately produce a real
  "monster equipped with a card named 'Dragunity'"; a real `summonProcedure` Special Summon of レヴァテイン
  from hand banishes that host as the real cost (confirms the orphaned equip is correctly sent to the grave by
  rule); its own real ② trigger then really equips a real Dragon-type GY monster (青眼の白龍) onto itself,
  with the tracking field correctly recorded.
- **B**: with a real equipped Dragon monster, レヴァテイン destroyed by a real opponent Trap (サンダー・ブレイク,
  a real hand-discard-cost activation, precedent: S03-U76) → its own real ③ trigger really Special Summons
  back the real monster that was equipped to it.
- **C**: a real negative control — レヴァテイン destroyed by real battle damage (not a card effect) does NOT
  trigger ③, confirming the real-text scoping ("相手のカードの効果によって" specifically, not battle).
- **D**: ①'s other declared source zone — a real `summonProcedure` Special Summon from the GY, banishing a
  real Dragunity-equipped host already on the field.

Every segment carries a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `NOT_STARTED` -1, `TESTED` +1 (ドラグニティアームズ－レヴァテイン).
- `CARD_TEST_FOCUS` given an explicit `{"ドラグニティアームズ－レヴァテイン"}` entry for this test file —
  サンダー・ブレイク is genuinely exercised as a real fixture but promoting it is out of this unit's scope,
  same precedent as S03-U76.
- `python tools/s03_status_audit.py`: EXIT 0, 79 declared status changes (+1 from U78), off-target = 0.
- Regression check for the P3 engine fix: `node tools/test_p3_provenance_cards.js` — 60/0, no change (this
  test already manually wraps the P3 context itself, so the new automatic wiring is additive, not
  conflicting).

## Gate

- `python tools/check.py` — EXIT 0, **13168 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations.

## Real-duel measurement

Not independently re-confirmed via a fresh R1 sweep of a specific fixed-list pair this unit; the dedicated
real-path test above (including the S03-U43 real-mechanic reuse for setup) is this unit's evidence, and the
shared engine fix's generic-ness was confirmed via the pre-existing `test_p3_provenance_cards.js` regression
check (60/0).

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`46b2073e1348a20fbf7efb6f7d2e425b63223adea6071a4874840bf700ab5194` (810 files).

## Remaining

- 六武衆の影武者 remains the one genuine ENGINE_GAP needing a real new capability (source-aware target
  redirection during Chain construction) — left for a future unit.
- The P3 effect-context fix may be worth a follow-up audit: now that `moveProvenance` is correctly populated
  in real DUEL play, it would be worth re-confirming 突風 and the 11 `cards/88_p3_provenance_recovery.js`
  cards behave correctly end-to-end through a real chain (their own tests still pass, having never relied on
  the previously-missing wiring, so no regression — but a positive real-path confirmation for each is a good
  candidate for a future unit if desired).
- Per the fixed fallback order, continuing directly into the next Requirement.
