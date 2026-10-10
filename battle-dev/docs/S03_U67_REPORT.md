# S03-U67 C-S03-24 secondary, part 2 — 大神官デ・ザード per-battle counter (Claude)

Base: shared LATEST `checkpoint_claude_s03_u66_dark_general_freed_protection_20260918.zip` (Claude, U66).

## Why this unit

Continues C-S03-24 secondary (the WORK_QUEUE item U66 split in two): the ダーク・ジェネラル フリード half
closed in U66; this unit closes the 大神官デ・ザード half — its own AUTO_DECK_TABLE entry was a coarse
"recruit, ignition, no limit" implementation with no counter gate and no release cost, unrelated to the card's
real, more interesting text.

## Card text and design

「このカードが戦闘によってモンスターを破壊する度に以下の効果を得る。●1回目:フィールド上に表側表示で存在す
るこのカードを対象とする魔法・罠カードが発動した時、その発動を無効にし破壊する。●2回目:このカードをリリー
スする事で、自分の手札・デッキから「不死王リッチー」1体を特殊召喚する。」

A real, cumulative per-card counter — the first genuinely new *incrementing* card-attached counter in this
codebase (every prior card-flag use, `v370FrogExtraTurn`/`v380ZephyrosUsed`/etc., was a one-shot boolean).
Implemented as `deZaadoKillCount`, using the same `API.setCardFlag` primitive already used dozens of times this
session — no new `gameState` key, journaled/Replay-safe by construction, and naturally reset whenever the card
leaves the field (a fresh card instance starts at 0).

- **① (count ≥ 1)**: a continuous self-target protection, reusing the existing `declareTargetingNegatorS03`
  dispatch (engine/1T, unchanged) with the counter as an extra gate condition. Distinct from 無敗将軍 フリード's
  「効果を無効にし破壊する」(`mode:'effect'`): デ・ザード's own text says 「その発動を無効にし破壊する」
  (negate the **activation**, `mode:'activation'`), and covers **both** Spell and Trap cards (`srcDb.k==='s'`
  or `'t'`), not Spells only.
- **② (count ≥ 2)**: a new ignition effect — release デ・ザード as a cost (`API.sendToGrave`, the established
  "release" pattern), then a resolution-time choice (S03-U58 pattern: `selectTargets` returns `done([])`,
  `resolve()` opens `API.requestChoice` against the current Hand+Deck) between any copies of 「不死王リッチー」
  in hand or Deck, Special Summoned for real via a new dedicated handler (`s03u66.dezaado-liche-summon` — kept
  its original handler-key string; only file names were renumbered to U67, per this session's own established
  precedent of not worrying about historical unit-number prefixes inside data-only identifiers).

## 不死王リッチー

Now reachable as a real Special Summon target for the first time. Declared its `cannotNormalSummon` restriction
(an existing generic flag, trivial) and its own continuous self-target Spell/Trap-activation negation — the
same shape as デ・ザード's ①, but **unconditional** (no counter; 不死王リッチー's own text has no "1st/2nd"
structure). Its other two effects (once-per-turn self-Set face-down Defense; on-reversal GY-Undead revival) are
out of this unit's scope — kept **PARTIAL** via `data/script_status_overrides.json`.

## Two real bugs found and fixed while building this unit (both caught before any checkpoint)

1. **`forced:true` blocked the card's own manual ② activation.** Setting `forced` at the top level of the
   script (intending it only for the automatic ① counter-increment trigger) made the *entire* card
   forced-trigger-only — `duelActivateZone`'s manual ② request was rejected outright. There is no per-branch
   `forced` for legacy (non-V4) `defineScript` cards (confirmed by reading `triggerCandidateForcedS03`, which
   falls back to the flat `sc.forced` for anything not V4-unified) — this is an accepted limitation of the
   legacy script shape, not something this unit's scope extends to fixing generically. Given デ・ザード's own
   ① text has no "できる" (optional) wording either — it is a mandatory state gain — `forced:true` describes
   the counter-increment branch correctly; the actual fix was declaring `timing:['damageStep','mainPhase']`
   explicitly (see next) so the *manual* ② branch is not restricted to the trigger's own window.
2. **Missing `timing` and `dsTiming` misdirected both branches.** `scriptTimings()` infers a card's manual
   activation window from its `passive` hooks when `timing` is omitted — with only `onDamageStep` present, ②
   was wrongly restricted to "only during the Damage Step" (`このカードは「ダメージステップ中」に発動します`).
   Separately, `dsTiming` (which damage-step sub-phase a passive trigger is checked at) defaults to `'leave'`
   (after the destroyed card has left the field) when omitted, per an explicit engine comment — but this card's
   own passive checks `ctx.step==='after'` (right after damage calculation, since it never looks at the
   destroyed card's post-battle location), so the two never matched and the counter silently never
   incremented. Fixed by declaring both `timing:['damageStep','mainPhase']` and `dsTiming:'after'` explicitly.

## Dedicated test

`node tools/test_s03_u67_dezaado_counter.js` — 15 assertions, all pass, real DUEL path throughout: a real
`ATTACK`/damage-step battle destruction (via `PROCESSOR_V27.ATTACK`, the same primitive `r1_duel_driver.js`
itself uses) confirmed to raise the counter to 1 and enable ① (a real Spell activation negated and destroyed,
with a Replay audit); a **second** real battle destruction on the same card instance raises the counter to 2
and enables ② (a real release + resolution-time choice + real Special Summon of 不死王リッチー from the Deck);
不死王リッチー's `cannotNormalSummon` confirmed via a real legal-actions check; its own self-negation confirmed
via a real Spell activation against it.

## Pre-existing test fallout

None. Grep across `tools/test_*.js` for both card names found no other references; re-ran
`test_s03_u28_targeting_negation.js`, `test_s03_u32_targeting_negation_2.js`,
`test_s03_u66_dark_general_freed_protection.js` (the shared targeting-negation mechanism), and
`test_s03_u24_battle_destroy_trigger_timing_2.js` / `test_s03_u52_auto_table_triggers.js` (real-battle and
AUTO_DECK_TABLE mechanics respectively) — all pass unchanged.

## Gate

- `python tools/check.py` — EXIT 0, **13048 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations (log `s03_u67_full_gate.log`).
- `python tools/s03_status_audit.py` — EXIT 0: 64 declared status changes (62 carried + 2 new this unit), 0
  off-target, TOTAL 4996.
- Coverage: TESTED 2108 → 2109 (+1: 大神官デ・ザード, PARTIAL → TESTED); PARTIAL stays 178 net (+1 不死王
  リッチー NOT_STARTED → PARTIAL, -1 大神官デ・ザード leaving PARTIAL).
- Acode build skipped for this unit per current instruction (generate only at release or on explicit
  request).

## Real-duel measurement

Neither card is on any `1103_MAJOR_DECKS_v1` fixed list, so no R1 sweep applies; the dedicated test's real
battle/activation/negation/release-and-summon paths (each closed with a Replay audit) are this unit's
evidence.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips, this report set aside):
`c853137d64bbf50b14f4a67d7b249152940de17c57b43e822d1baf851488d40a` (778 files).

## Remaining

- 不死王リッチー's once-per-turn self-Set effect and on-reversal GY-Undead-revival effect remain unimplemented
  (PARTIAL) — out of this unit's scope (it exists only to be a Special Summon target of デ・ザード's ②).
- C-S03-24 secondary (WORK_QUEUE's item covering both cards) is now fully closed.
- Per the fixed fallback order, continuing directly into the next Requirement.
