# S03-U61 Continuous Trap field-reactivation guard (Claude)

Base: shared LATEST `checkpoint_claude_s03_u60_field_reactivation_guard_20260917.zip` (Claude, U60).

## Why this unit

Per the fixed fallback order (measured-first, no idle stop on a clean sweep): with U60 just closed and the
follow-on sweeps clean (0 blocker), fallback priority #1 is "the same bug class as the immediately-prior unit,
in an unaudited area." U60's own report explicitly flagged this: Continuous Traps share `getLegalZoneActions`'s
"any face-up scripted card with `resolve()` is re-offered" shape, but U60 scoped its fix to `db.k==='s'`
(Spells) only.

## Audit

`script_coverage.json`, `kind==='trap'`, `subtype==='永続'` (Continuous Trap), `status` in (TESTED,
GENERIC_OK): **80 cards**. Same methodology as U60: placed each card face-up in `sz` and called
`hasFieldActivatableEffect()` directly (the S03-U13/U46 primitive U60 reused for Spells).

- **9 already correctly classified as genuine field-repeatable**: サンダー・ボトル, ビーストライザー,
  強制終了, 木遁封印式, 死霊の巣, 水遁封印式, 漆黒のパワーストーン, 王宮の弾圧, 零式魔導粉砕機 (via
  `fieldIgnition`, `onFieldEffectS03`, `CARD_ACTIVATION_FREE_V32`, or a real V4 `IGNITION`/`QUICK` effect).
- **66 share the one-shot shape and were completely unguarded** (U60's `fieldReactivationBlockedS03U60()`
  never applied to `db.k==='t'`).

Confirmed a **real, state-corrupting bug** on the real DUEL path: リミット・リバース
(`cards/HE_claude_s03_u56_limit_reverse.js`) Special Summons a ≤1000 ATK monster from the GY on activation and
then sits as a Continuous Trap (with an unrelated, automatic `TRIGGER`-type "destroy on defense" effect). Once
resolved and sitting face-up in `sz`, `getLegalZoneActions` kept offering "⚡ 効果を発動" — re-clicking it
opened a fresh target-selection choice and illegally Special Summoned a **second** GY monster for free, with
no cost, no chain-negatable window, repeatable every time it's clicked. Confirmed via a direct real-duel
reproduction (Set the trap, activate it for real, then re-click it): the second Special Summon actually
happened before the fix (`mz: ["ワイト","ワイト"]`), moving a card from GY to the field for free — a clean
advantage-generation exploit, arguably higher-value than U59's bug since Special Summon effects from the GY
are common and Continuous Traps stay on the field indefinitely.

## Fix

Extended `fieldReactivationBlockedS03U60()` (`engine/40_legal_script_engine.js`) — introduced in U60 — to also
cover `db.k==='t' && db.sub==='永続'`. No new call-site changes were needed: unlike Spells (which can be
activated directly from hand via `duelActivateFromHand`, creating the ambiguity U60's report documents at
length), a Trap's first activation is *always* "Set face-down in a real zone, then later activated from that
same zone" — which already goes through `duelActivateFromZone` (the same function U60 already gated). The
existing `card.face!=='up'` exclusion inside the guard already correctly leaves a first activation (still
face-down at the point the guard runs, before it flips) untouched, so a Trap's genuine first activation is
unaffected.

No new Capability, no new persistent state, no per-card changes — same `hasFieldActivatableEffect()`
classification U60 already trusted, now consulted for one more card kind.

### Regression coverage

Verified on the real DUEL path that the 9 genuine field-repeatable Continuous Traps are not affected:

- 強制終了 (declared `CARD_ACTIVATION_FREE_V32`): placed already face-up on the field (simulating "already
  used once, still there"), confirmed it still offers and correctly executes its effect (ends the current
  battle — `gameState.battle` becomes `null`, its GY-discard cost is paid for real) during a later Battle
  Phase.
- 王宮の弾圧, 零式魔導粉砕機, 死霊の巣, 木遁封印式, 水遁封印式: confirmed at the gate level
  (`hasFieldActivatableEffect()` still returns `true` for each) — not blanket-blocked just for being a trap.

## Dedicated test

`node tools/test_s03_u61_trap_field_reactivation_guard.js` — 11 assertions, all pass:

- **A.** リミット・リバース: real first activation (Set → activated → Special Summons g1 for real), the field
  button confirmed gone, a **direct** forced `duelActivateFromZone` call also refused (g2 stays safely in the
  GY, no illegal second Special Summon), Replay audit.
- **B.** 強制終了 regression: still offers and correctly executes its genuine repeatable effect once already
  face-up on the field.
- **C.** Gate-level regression for the other four declared field-repeatable Continuous Traps.

## Real-duel measurement

R1 sweeps (`R1_LIST=v1`, `R1_RESPOND=1`), real DUEL game path: 【Dragunity】 vs 兎ラギア (竜の渓谷 in the
decklist — a `CARD_ACTIVATION_FREE_V32` Continuous Spell, unaffected since this unit only extends the Trap
side), seeds `0x61010001`–`0x61010003`, both first-player orders (6 duels), plus one 【Debris】 vs 【Karakuri】
cross-pair (seed `0x61020001`, both orders, 2 duels): **8 / 8 completed**, `blocker: null`, `unsupported: []`,
Replay ok in every duel.

## Gate

- `python tools/check.py` — EXIT 0, **12914 PASS / 0 FAIL** (12903 + this unit's 11), no `Traceback`, no
  `ReferenceError`, no duplicate top-level function declarations (log `s03_u61_full_gate.log`).
- `python tools/s03_status_audit.py` — EXIT 0: 45 declared status changes (unchanged — pure engine-legality
  fix, no card status changed), 0 off-target, TOTAL 4996.
- Coverage counts unchanged from U60 (TESTED 2094, etc.).
- Acode build skipped for this unit per current instruction (generate only at release or on explicit
  request).

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips, this report set aside):
`dd08ab9a17daa6987a86b5b2e7b018de66bb6cbc735bef5339eb4be59e177fd3` (762 files).

## Remaining

- U60/U61 together cover `db.k` in `('s','t')` with the continuous-style subtypes (永続/フィールド/装備 for
  Spells, 永続 for Traps) among TESTED/GENERIC_OK cards only — NOT_STARTED/PARTIAL/IMPLEMENTED/ENGINE_GAP
  cards of the same shape are unaudited by design (out of the measured, already-registered-script population
  this bug class applies to; they don't have a `resolve()` to be re-offered in the first place until they're
  actually scripted).
- Per the fixed fallback order, the next Ready-queue item is the `openPick`-bypasses-`requestChoice` legacy
  `resolve()` choice cluster (37 scripts) — continuing directly into it as the next unit.
