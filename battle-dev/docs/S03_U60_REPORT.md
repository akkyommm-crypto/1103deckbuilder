# S03-U60 field-reactivation guard for Continuous/Field/Equip Spells (Claude)

Base: shared LATEST `checkpoint_claude_s03_u59_future_fusion_20260917.zip` (Claude, U59).

## Why this unit

U59 found and fixed a real R1 bug: `getLegalZoneActions` offered "⚡ 効果を発動" (`duelActivateFromZone`) for
**any** face-up card whose `CARD_SCRIPTS` entry has a scripted `resolve()`, with no distinction between a
genuine repeatable field ignition effect and a one-shot Continuous/Field/Equip Spell activation that should
never be re-offered once it has resolved. U59 fixed only 未来融合－フューチャー・フュージョン itself, with a
dedicated per-card resolved-flag, and flagged the other TESTED/GENERIC_OK Continuous/Field/Equip Spells as an
explicit follow-up (`logs/S03_U59_FUTURE_FUSION_PUBLICATION.md`, WORK_QUEUE.md Ready #2). This unit is that
follow-up.

## Audit

`script_coverage.json`, `kind==='spell'`, `subtype` in (永続 Continuous / フィールド Field / 装備 Equip),
`status` in (TESTED, GENERIC_OK): **195 cards**. Sampled across every registration cluster (legacy
`defineScript` cards scattered one-off across the `*_auto_cycleNN.js` files, V4-unified `defineUnifiedCardV4`
cards, and the autobuild helper factories `v50Field`/`v70Equip`/`v71DynamicEquip`/`v6DefineDirectGrantEquip` —
the largest single template cluster, `v70Equip`, alone accounts for 26 of the 195 Equip Spells).

Confirmed on the real DUEL path (`tools/astra_harness.js`, no rigged boards):

- **Real, state-corrupting bug** — エルフの光 (a `v70Equip`-template Equip Spell, ATK+400/DEF−200 to a
  LIGHT monster once equipped): once resolved and equipped to a monster, `getLegalZoneActions` kept offering
  "⚡ 効果を発動" from the field. Clicking it re-ran the equip's `target`/`operation`, letting the *same
  already-resolved copy* re-target and move its stat bonus to a **different** monster for free — not a real
  Yu-Gi-Oh action (an Equip Spell cannot spontaneously retarget itself without a card effect that says so).
  Every card built from the same `v70Equip`/`v71DynamicEquip` templates (32 of the 195) shares this exact
  operation shape and was therefore exposed the same way.
- **Harmless-but-noisy instance** — the `v50Field` terrain Field Spells (山/森/荒野/草原/湿地草原/海/闇, 13 of
  the 195): their registered `ACTIVATE` effect's `operation(){}` is empty (the actual passive stat boost is a
  separate `continuous.apply` hook, unaffected either way), so the old bug never corrupted state here — but it
  still offered a dead button an R1 AI driver could otherwise pick.

## Root cause and fix (ENGINE_MISSING, not CARD_WORK)

The engine already has the exact primitive needed and simply never consulted it here:
`hasFieldActivatableEffect()` (`engine/20_effect_primitives_ex.js`, S03-U13/U46) already distinguishes a
genuine field-repeatable effect (`sc.fieldIgnition===true`, a name declared in
`CARD_ACTIVATION_FREE_V32` via S03-U10's `declareCardActivationFreeV32`, or a V4-native card with a real
`EFFECT_TYPE.IGNITION`/`QUICK` effect) from a plain one-shot `resolve()` — it is exactly the gate
`reactableCards()` already applies for the opponent's chain-response window. `getLegalZoneActions` (the
player's own-turn action menu) and the actual `duelActivateFromZone`/`prepareDuelActivation` execution path
never called it.

Traced (mirroring U59's own finding) why this can't be modeled as a per-card flag or a simple zone check
applied generically: `strictScriptLegalityV2`'s `ctx.zone` is always the *logical* zone (`sz`/`field`) for
both "about to activate from hand" and "already resolved on the field" — genuinely indistinguishable from
inside a card script's own `condition()`. The *engine's own* positional `zone` argument and the card's actual
`.face`, however, **are** reliable — but only at specific call sites, not inside the shared
`strictScriptLegalityV2`/`prepareDuelActivation` pipeline: that pipeline is reused by multiple hand-activation
callers (`duelActivateFromHand` in DUEL mode, `activateFromHand` in MANUAL mode) that move the card into its
resting zone *before* calling it, and only the DUEL-mode caller marks the call with `opts.cardActivation:true`
— MANUAL mode's `activateFromHand` does not. Gating inside `strictScriptLegalityV2` itself was tried first and
reverted after it broke a legitimate first activation (confirmed by a real-duel regression test); the correct,
narrowly-scoped insertion points are the two call sites that *only* ever mean "activate a card already
sitting in a real board zone" — never a fresh hand move:

- `duelActivateFromZone()` (the exact function named in the U59 bug report's R1 trace).
- `duelActivateResponseV2()`'s opponent-owned-card branch (S03-U46, "use the opponent's face-up field card's
  effect").

Both now call a new shared predicate, `fieldReactivationBlockedS03U60(sc, db, zone, card)`
(`engine/40_legal_script_engine.js`): true only when `db.k==='s'`, `db.sub` is 永続/フィールド/装備, the
positional `zone` is not `'hand'`, `card.face==='up'` (a face-down Set card's first activation is
untouched), and `hasFieldActivatableEffect(card)` is false. `getLegalZoneActions`'s own `strictScriptLegality`
(only ever called for a card already resolved and sitting in a real zone — never mid-activation) applies the
same predicate directly, so the UI action list and the two real execution entry points stay consistent by
construction — a forced/direct `duelActivateFromZone` call is refused exactly like the hidden button, not just
hidden from a menu.

No new Capability, no new persistent state, no per-card change: the existing S03-U10/U13/U46 classification
(`fieldIgnition` / `CARD_ACTIVATION_FREE_V32` / V4 `IGNITION`/`QUICK` effect type) was already complete enough
to drive this — it was simply never wired into the two places that needed it. Scoped to `db.k==='s'`
(Spells) only, matching the audited class; Continuous Traps share the same shape but are not touched here
(flagged as a follow-up below).

### Regression coverage — the genuine field-repeatable cases must keep working

Verified on the real DUEL path that this does **not** apply a blanket "continuous/field/equip spells can
never be re-activated" rule — only `hasFieldActivatableEffect()`'s existing classification:

- カードトレーダー (legacy, declared in `CARD_ACTIVATION_FREE_V32`) still offers and correctly executes its
  field ignition ability.
- 機動要塞フォルテシモ (V4-native フィールド魔法 with an explicit second `EFFECT_TYPE.IGNITION` effect
  alongside its no-op `ACTIVATE` effect) still offers its Special Summon ignition ability as the Field Spell.
- スパークガン (a 装備 Spell with a genuine repeatable Spark-Blaster-style `EFFECT_TYPE.IGNITION` position-
  change ability) is confirmed, at the gate level, **not** blanket-blocked just because it is an Equip Spell —
  the guard is per-effect-type, not per-subtype.

## Dedicated test

`node tools/test_s03_u60_field_reactivation_guard.js` — 9 assertions, all pass, on the real DUEL path:

- **A.** エルフの光 resolves and equips for real (ATK 3000→3400 confirmed); the field button disappears; a
  **direct** `duelActivateFromZone` call (bypassing the hidden button) is also refused — the equip bonus
  never moves to a second monster; a Replay audit confirms the digest.
- **B.** 山 (terrain Field Spell) no longer offers the harmless dead button once resolved.
- **C/D.** カードトレーダー and 機動要塞フォルテシモ still offer their genuine field ignition effects
  (regression).
- **E.** スパークガン's `hasFieldActivatableEffect()` gate is confirmed open (regression, equip-with-
  ignition case).

## Real-duel measurement

R1 sweeps (`R1_LIST=v1`, `R1_RESPOND=1`), normal DUEL game path, no rigged boards:

- 【Dragunity】 vs 1103兎ラギア (the same fixed pair U59 measured; includes 竜の渓谷, a
  `CARD_ACTIVATION_FREE_V32`-declared Continuous Spell, in the actual decklist), seeds `0x60310001`–
  `0x60310004`, both first-player orders (8 duels): **8 / 8 completed**, `blocker: null`, `unsupported: []`,
  Replay ok.
- 【六武衆】 vs 1103兎ラギア (六武の門/六武衆の結束 field-ignition Continuous Spells in the actual
  decklist), seeds `0x60320001`–`0x60320002`, both first-player orders (4 duels): **4 / 4 completed**, no
  blocker, no unsupported, Replay ok.

## Gate

- `python tools/check.py` — EXIT 0, **12903 PASS / 0 FAIL** (12894 + this unit's 9), no `Traceback`, no
  `ReferenceError`, no duplicate top-level function declarations (log `s03_u60_full_gate.log`).
- `python tools/s03_status_audit.py` — EXIT 0: 45 declared status changes observed (unchanged from U59 — no
  card status changed in this unit), 0 off-target, TOTAL 4996.
- Coverage counts unchanged from U59 (TESTED 2094, etc.) — this unit is a pure engine-legality fix, not a new
  card; `data/script_coverage.json` only gained this unit's new test file in the relevant cards' `tests`
  arrays.
- Acode build skipped for this unit per current instruction (generate only at release or on explicit
  request).

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips, this report set aside):
`21cd0f1e520f369b4c38e68d93720cfe2a2e3314d4f4067c6b5fc28682635a29` (760 files).

## Remaining

- Continuous Traps share the same `getLegalZoneActions`/`hasFieldActivatableEffect` shape but were not
  audited or touched in this unit (scope was `db.k==='s'`, matching U59's own follow-up note) — a candidate
  for a later, similarly-scoped unit if a real-duel measurement surfaces one.
- フューチャー・グロウ and 超栄養太陽 (both explicitly reviewed and left undecided by the original S03-U10
  audit under its "cost" not-declared category) are among the 91 continuous/field Spells this unit's guard
  now blocks from field re-activation, consistent with `hasFieldActivatableEffect()`'s pre-existing
  classification (already used by `reactableCards()` before this unit) — not a new restriction introduced
  here, but worth a dedicated look if a fixed-list deck ever needs フューチャー・グロウ's field-repeat
  behavior for real.
- Continue measurement-first major fixed-list/preset routes and pick the highest-value shared Requirement
  from the first fresh blocker, Replay divergence, unsupported action, or repeated manual-only pattern (per
  WORK_QUEUE).
