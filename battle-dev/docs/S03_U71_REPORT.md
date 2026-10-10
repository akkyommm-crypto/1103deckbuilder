# S03-U71 カラクリ守衛 参壱参 + onAttackDeclare forced-trigger dispatch gap (Claude)

Base: shared LATEST `checkpoint_claude_s03_u70_chain_response_mz_kind_guard_20260919.zip` (Claude, U70).

## Why this unit

Fixed fallback order after U70's checkpoint: a follow-up 8/8 clean re-sweep of Dark World vs Agent confirmed
the pair, then a fresh sweep of TG Gadget vs Worm (previously untried) also came back 8/8 clean. Two
consecutive fresh-pair sweeps with no new blocker means priority #6 has diminishing returns right now, so
priority #7 (auditing NOT_STARTED/PARTIAL/IMPLEMENTED/ENGINE_GAP cards within the fixed major-deck lists
directly, prioritized by real-duel impact and consumer count) took over. Cross-referencing all 13 fixed
major-deck lists against `data/script_coverage.json` surfaced a handful of NOT_STARTED cards actually sitting
in the *main deck* (not Extra Deck) of a fixed list — the highest-reachability category. Of these,
**カラクリ守衛 参壱参** (Karakuri Watchdog mdl 313 "Saizan", x1 in the Karakuri list) had no flagged
engine-capability gap in `data/astra_gap_audit_cycle66.json`, unlike the two ENGINE_GAP candidates found in the
same pass (六武衆の影武者, 始祖の守護者ティラス — both need a real new primitive, out of scope here) or the
several other NOT_STARTED main-deck candidates that turned out to need a whole new engine capability
(ドラグニティアームズ－レヴァテイン needs a "GY equip" primitive already logged as a known ENGINE_MISSING gap
blocking 8 cards; a proper Gemini-monster mechanic for E・HERO アナザー・ネオス is a much larger undertaking).

## Card

Karakuri Watchdog mdl 313 "Saizan" (Yugipedia, printed 2010-11-13 OCG / 2011-02-08 TCG, well within the
2011-08-31 cutoff). EARTH/Machine/Tuner, Level 4, ATK 600/DEF 1800. Four clauses:

1. Must attack if able.
2. When this face-up card is selected as an attack target, change its battle position.
3. While in face-up Attack Position, it cannot be destroyed by battle.
4. When you take Battle Damage from a battle involving this card, all face-up "Karakuri" monsters you
   control gain 800 ATK and DEF until the End Phase.

All four clauses are built entirely from existing generic primitives — no new card-facing capability:

- Clause 1 + 3: a single `continuous:{scope:'self',from:['mz'],apply(){return null;},mustAttack(){return
  true;},battleProof(card){return card.pos==='atk';}}` block. `continuous.mustAttack` reuses the exact
  established カラクリ小町 弐弐四 precedent (same file). `continuous.battleProof(card)` reuses an existing,
  already-consumed-generically hook (`battleProofGrantedV15`/`battleProof()` in `engine/00_state_actions.js`)
  that had a working self-scoped consumption path but, before this unit, no card actually used it — this is
  its first real exercise.
- Clause 2: a forced `passive.onAttackDeclare` trigger reusing the same `gameState.pendingAttack.targetUid`
  shape as クレボンス/くず鉄のかかし, resolving via `API.changePosition`.
- Clause 4: reuses `API.modAtk(target, 800, 800, 'endPhase', reason)`, the exact primitive 深海の大ウナギ
  (`cards/B3_auto_cycle11.js`) already uses for an "until the End Phase" archetype-wide buff, and the
  established `x.db.n.indexOf('カラクリ')>=0` archetype-membership filter idiom (カラクリ小町 弐弐四).

Declared in `cards/20_control_counter.js`, alongside the other legacy Karakuri cards.

## A real, previously-undiscovered engine gap found while building clause 2

Building clause 2 (a genuinely *forced*, non-optional `onAttackDeclare` trigger — the real card text has no
"you can") surfaced a real dispatch gap: **a forced, non-`quickEffect`, non-`activationResponseDeclaredS03`
`passive.onAttackDeclare` handler had no working dispatch path at all in DUEL mode.**

- `getChainResponsesV2`/`pointResponsesV27` (the attack-declare POINT window's candidate source) only
  recognizes `quickEffect:true` cards or names declared via `declareActivationResponseS03` (S03-U19) — by
  design, since that list exists for *optional* quick-effect activations a player chooses to respond with.
- The engine's only other `onAttackDeclare` dispatch call site, `emitEvent("onAttackDeclare",...)` in
  `engine/70_summon_procedures.js`, is **dead code**: an instrumented probe (wrapping `emitEvent` to log every
  call during a real `requestProcessorV27(PROCESSOR_V27.ATTACK,...)`) showed it is never reached by the real,
  modern (S03-U39) attack-declare flow — only `onLPChange`/`onBattleDamage` fire from that path.
- Net effect: a forced `passive.onAttackDeclare` monster trigger with no `quickEffect`/`activationResponse`
  declaration simply never fires in a real duel, silently. Two already-declared cards in this codebase
  (ガンバラナイト, インターセプト・デーモン) have exactly this shape and, before this fix, were **also**
  silently non-functional in real play — their own "TESTED" status came from a shallow registration-string
  check (`html.includes("'ガンバラナイト'")`), not real behavioral exercise, so this had never surfaced.

### Fix

`engine/30_processor_chain_battle.js`, `processAttackV27`'s attack-declare branch: before the existing
`attackDeclare` POINT window, enqueue a `PROCESSOR_V27.EVENT_BATCH` step for `onAttackDeclare` — the exact
same dispatch shape `queueDamageWindowV28` already uses for `onDamageStep` (`collectHandlers`-based candidate
collection, `startEventChainV2` chain resolution). This is additive and a no-op whenever no forced
non-quickEffect `onAttackDeclare` candidate exists (`processEventBatchV28` returns immediately when
`cands.length===0`), so it does not change the attack-declare flow for the overwhelming majority of existing
duels.

**A real regression this introduced, found and fixed before publishing:** `collectHandlers` has no
`quickEffect` filter of its own (matching its existing, working use for `onDamageStep`), so my new step
initially ALSO picked up `quickEffect:true` cards with a `passive.onAttackDeclare` handler (クレボンス,
くず鉄のかかし, ...) — creating a second, conflicting dispatch path alongside the pre-existing
`getChainResponsesV2`/POINT-window one for those same cards. Caught by `tools/test_s03_u24_battle_destroy_trigger_timing_2.js`
(a pre-existing regression test: クレボンス stopped being correctly offered as a chain response). Fixed by
adding an opt-in `excludeAlreadyOfferedS03` flag to `processEventBatchV28`'s per-event payload (existing
`EVENT_BATCH` callers, like `queueDamageWindowV28`, don't pass it and are completely unaffected) that filters
out `quickEffect:true` and `activationResponseDeclaredS03`-declared candidates before they're offered through
the new path — only my attack-declare call site sets it.

Empirically confirmed both card and fix via real DUEL path in `tools/test_s03_u71_karakuri_watchdog_saizan.js`
(see below), then confirmed no regression via the Full Gate and a real R1 re-sweep.

## Dedicated test

`node tools/test_s03_u71_karakuri_watchdog_saizan.js` — 10 assertions, all pass, real DUEL path throughout
(`requestProcessorV27(PROCESSOR_V27.ATTACK,...)`, real `eventPickV2`-driven forced-trigger resolution, real
`chainPassV2`, clean Replay audits).

- **A**: a real attack declared against a real face-up カラクリ守衛 参壱参 (weaker attacker, ワイト 300/200):
  confirms clause ① (`mustAttackNow`), then clause ② really flips it ATK→DEF the instant it's selected as the
  target (via the fixed dispatch path), then confirms real reflected battle damage (DEF 1800 − ATK 300 = 1500)
  lands on the *attacker*, not this card — clause ③'s protection never actually applies to this battle, since
  clause ② moved it out of Attack Position first. This is the real card's own intentional design tension, not
  a test artifact.
- **B**: a real Normal Summon (ATK position) plus a second face-up Karakuri (カラクリ小町 弐弐四, TESTED); this
  card is forced to attack (clause ①) into a real, much higher-ATK 青眼の白龍. Clause ② never fires for its
  own attack declaration (only for being selected as a target), so clause ③ genuinely protects it this time:
  confirmed not destroyed, its controller really takes 2400 battle damage, and clause ④'s real `+800/+800`
  buff lands on every face-up Karakuri it controls (both cards, confirmed via `curATK`/`curDEF`). Then confirms
  the buff really expires once the turn actually passes — `clearExpiredMods` only ever fires at `PASS_TURN`, so
  an `until:'endPhase'`-tagged mod is not independently cleared by merely entering the End Phase in this
  engine, a real, pre-existing, shared primitive behavior (identical for 深海の大ウナギ's own buff) and out of
  scope to change here.

Deliberately built without ever naming カラクリ小町 弐弐四 in a way `tools/script_coverage.py`'s text-scan
attribution would notice: `CARD_TEST_FOCUS` was given an explicit `{"カラクリ守衛 参壱参"}` entry for this
file (precedent: U56/U70), since she's used only as a static fixture, not exercised through her own effects.

## Regression fallout from declaring カラクリ守衛 参壱参 for real (found and fixed)

Two pre-existing test files used `'カラクリ守衛 参壱参'` as a deliberately-NOT_STARTED "inert KARAKURI
monster" fixture specifically *because* it had no script and couldn't interfere with `mustAttackNow`/position
assertions for unrelated cards under test (`tools/test_class_a_attack_bulk.js`'s カラクリ武者 六参壱八 suite,
`tools/test_ready25_b2.js`'s カラクリ忍者 七七四九 suite). Now that it has a real, unconditional
`continuous.mustAttack`, both fixtures' assumptions are stale. Fixed by swapping both to a genuinely inert
KARAKURI main-deck monster (`カラクリ忍者 参参九`, still NOT_STARTED). All assertions in both files pass
unchanged otherwise — confirming the underlying card logic under test in each file was never actually
depending on カラクリ守衛 参壱参 being blank, just on it being *some* archetype-tagged, script-free filler.

## Coverage / status audit

- `python tools/script_coverage.py`: `TESTED` 2115→2116 (+1: カラクリ守衛 参壱参). No other card's status
  changed — `CARD_TEST_FOCUS` entries prevent both カラクリ小町 弐弐四 (U71's own test fixture) and any
  incidental card-name mention in a comment from being mis-attributed.
- `python tools/s03_status_audit.py`: EXIT 0, 71 declared status changes, **off-target status changes = 0**.

## Gate

- `python tools/check.py` — EXIT 0, **13098 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no duplicate
  top-level function declarations. (Two intermediate gate runs during this unit's own development caught the
  `quickEffect` double-dispatch regression and the two stale-fixture regressions described above — both fixed
  before this final clean run.)

## Real-duel measurement

Karakuri vs TG Gadget (a previously-confirmed-clean fixed-list pair, and the pair most directly exercising
this unit's new card and engine fix in real play) re-swept across all 8 seed/first-player combinations.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`d7f71ff6ac9ca35a891cd84005ccbb3e1d4f783aa5807fecc8d5f90746b33d0d` (788 files).

## Remaining

- ガンバラナイト and インターセプト・デーモン's own forced `onAttackDeclare` effects should now also actually
  fire for the first time (this unit's dispatch fix is generic, not card-specific) — neither was re-verified
  with a dedicated real-path test in this unit, since neither is reachable from a `1103_MAJOR_DECKS_v1` fixed
  list; left as a follow-up if either ever becomes reachable.
- The other NOT_STARTED main-deck cards found in the same priority #7 audit pass (E・HERO アナザー・ネオス,
  needs the Gemini-monster mechanic; ワーム・ヤガン, needs a face-down GY self-special-summon shape; several
  Extra Deck NOT_STARTED cards) remain open for a future unit.
- Per the fixed fallback order, continuing directly into the next Requirement.
