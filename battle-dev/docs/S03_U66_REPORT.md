# S03-U66 C-S03-24 extension — ダーク・ジェネラル フリード DARK protection (Claude)

Base: shared LATEST `checkpoint_claude_s03_u65_draw_replacement_grave_expansion_20260918.zip` (Claude, U65).

## Why this unit

Fixed fallback order after U65: priority #5, WORK_QUEUE's Ready head — **C-S03-24 secondary**, which named
two cards: 大神官デ・ザード (a per-battle-destruction counter — deferred, see Remaining) and
**ダーク・ジェネラル フリード DARK protection** (this unit). The card was kept PARTIAL since S03-U33 for
exactly this reason: its draw-replacement was implemented through C-S03-26, but its continuous protection
effect was not.

## Root cause and engine extension

ダーク・ジェネラル フリード's real text: 「自分フィールド上に表側表示で存在する闇属性モンスターを対象にする
魔法カードの効果を無効にし破壊する。」— this protects **every** face-up DARK monster the controller has, not
only itself. That is meaningfully different from 無敗将軍 フリード's already-declared self-only version
(「このカードを対象にする...」, S03-U32): `applyTargetingNegatorsS03()` only ever calls `spec.applies()` for a
card that is *itself* one of the chain link's targets (the declared name is looked up on the targeted card),
so it structurally cannot express "protects some other card."

Added `engine/1ZE_targeting_protection_s03.js` — a small, additive sibling mechanism:
`declareTargetingProtectorS03(name, spec)` / `applyTargetingProtectorsS03()`. For each Monster Zone card that
is a target of the newly-added chain link, it now also scans that target's controller's *other* face-up
Monster Zone cards for a declared protector, and calls `spec.applies({link, srcDb, protector, target, targets})`.
Wired into the same two call sites as the existing negator check (`engine/30_processor_chain_battle.js`,
right after `applyTargetingNegatorsS03()`), reusing the same `negateChainLinkV13` negation primitive — no
chain block, same as every other C-S03-24 card.

ダーク・ジェネラル フリード is now declared under **both** mechanisms in `cards/H8B_claude_s03u66_dark_general_freed_protection.js`:
the existing self-negator (covers the case where it is itself targeted) and the new protector (covers the case
where another of the controller's face-up DARK monsters is targeted). Also wired up its "このカードは特殊召喚
できない" restriction via the already-generic `cannotSpecialSummon` flag (`cards/H9_claude_s03_draw_replacement.js`,
trivial reuse — no new engine work). All three clauses of the card's text are now implemented, and its
`data/script_status_overrides.json` PARTIAL entry (whose stated reason no longer holds) was removed.

## Dedicated test

`node tools/test_s03_u66_dark_general_freed_protection.js` — 13 assertions, all pass, real DUEL path
throughout (real Spell activation via `duelActivateFromHand`/`duelActivateFromZone`, real chain
negation/destruction, a real `API.specialSummon` attempt, and a real Draw Phase regression check):

- **A.** Self-target: ソウルテイカー targeting フリード itself is negated and destroyed (the pre-existing
  self-negator path, confirmed still works).
- **B.** **The actual new capability**: ソウルテイカー targeting a *different* face-up DARK monster (ワイト)
  the same controller has is also negated and destroyed.
- **C.** Control: a LIGHT monster (青眼の白龍) the controller also has is *not* protected — confirms the
  DARK-attribute scoping.
- **D.** Control: without フリード on the field, a DARK monster is *not* protected — confirms the effect
  genuinely comes from フリード's presence, not a blanket rule.
- **E.** Control (2011 wiki 10/06/11-style ruling, same as 無敗将軍 フリード): a Trap targeting フリード is
  *not* negated — Spell cards only.
- **F.** A real `API.specialSummon` attempt against フリード in the Graveyard does not place it on the field
  (`cannotSpecialSummon`).
- **G.** Regression: the S03-U33 Draw Phase replacement still adds a Level 4 DARK monster from the Deck
  correctly after this unit's changes.

## Pre-existing test fallout

None. Re-ran `test_s03_u28_targeting_negation.js`, `test_s03_u32_targeting_negation_2.js`, and
`test_s03_u33_draw_replacement.js` (the three existing files most likely to interact with the shared
targeting-negation mechanism or this specific card) — all pass unchanged.

## Gate

- `python tools/check.py` — EXIT 0, **13033 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations (log `s03_u66_full_gate.log`).
- `python tools/s03_status_audit.py` — EXIT 0: 62 declared status changes (61 carried + 1 new promotion this
  unit), 0 off-target, TOTAL 4996.
- Coverage: TESTED 2107 → 2108 (+1: ダーク・ジェネラル フリード, PARTIAL → TESTED); PARTIAL 179 → 178 (-1).
- Acode build skipped for this unit per current instruction (generate only at release or on explicit
  request).

## Real-duel measurement

ダーク・ジェネラル フリード is not on any `1103_MAJOR_DECKS_v1` fixed list, so no R1 sweep applies; the
dedicated test's real activation/negation/Special-Summon-attempt paths (each closed with a Replay audit) are
this unit's evidence.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips, this report set aside):
`adcf62cccb44d78ae68f64a2f9127204e7709dc1350a96b941a37b0c9deed365` (775 files).

## Remaining

- **大神官デ・ザード** (the other half of C-S03-24 secondary): needs a genuinely new per-card
  battle-destruction counter (an incrementing state, not the boolean flags used elsewhere) plus two
  counter-gated effects — a candidate for a dedicated future unit rather than folding into this one.
- Per the fixed fallback order, continuing directly into the next Requirement.
