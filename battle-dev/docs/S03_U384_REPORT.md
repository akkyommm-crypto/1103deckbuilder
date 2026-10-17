# S03-U384 — summon locks by kind (new engine module)

Base: `claude/work` `5d38558` (U383, gate 20475 PASS / 0 FAIL). Sonnet 5.5, single writer. ENGINE CHANGE (additive; the rest of the summon logic is unchanged).

## Engine
- New `engine/1ZZS_summon_lock_s03.js`: `summonLockReasonS03(p, db, kind)` and `banSummonS03(p, from, to, kinds, match, label)`.
  Sources: (1) the SUMMONED card's own condition `summonConditionS03(p, db, kind)`; (2) a face-up card on the field with `summonLockS03({p, db, kind, src, srcPlayer})` (negated / still-activating cards apply nothing); (3) turn-ranged bans `effectFlags.summonBanS03 = [{from, to, kinds, match, label}]` (`match` {effect} / {synchro} narrows the summoned monster by its type).
- `engine/40_legal_script_engine.js`: `v46FaceUpSummonRestrictionReason(p, db, kind)` asks the module first; `v46SpecialSummonRestrictionReason` passes `'special'`, `canFlipSummonLegal` `'flip'`, the hand action list `'normal'`. `engine/70_summon_procedures.js` (`doNormalSummon`, `doExtraNormalSummonV370`) and `engine/1ZI_gemini_s03.js` pass `'normal'`. A caller that names no kind is checked against nothing kind-specific.
- `engine/1ZK_summon_only_s03.js` (`canEffectSpecialSummonS03`): the same lock also removes banned monsters from effect candidate lists. `engine/1ZM_targeted_self_destroy_s03.js`: `declareTargetedSelfDestroyS03(name, {kinds:['s','t']})` narrows the source of the targeting effect.

## Cards (`cards/HZZZZZZZZT_claude_s03_u384_summon_locks.js`)
- ジェノサイドキングデーモン (`summonConditionS03`, battle-victim negation `declareBattleDestroyedNegatorS03`, upkeep 800 and dice 2 / 5 from S03-U383).
- レプティレス・サーヴァント (`selfDestroyWhenS03`, targeted self-destroy for Spells / Traps only, `summonLockS03` for the Normal Summon).
- 大熱波 / 完全防音壁: 「メインフェイズ1の開始時」 is read as Main Phase 1 with an empty chain and nothing done yet that turn (no Normal Summon / Set, no card activated by me); the bans last this turn and the opponent's next turn.

## Tests
- `tools/test_s03_u384_summon_locks.js` 25 / 0. Negative control on the previous build: 5 FAIL then the script aborts at the missing cards. 23 summon / Gemini / Dual / Flip / lock regression tests: 0 failures. Coverage TESTED 3292 → 3296, NOT_STARTED 572 → 568; `registration_names_missing_from_db` empty; audit 0 FAIL.

## Existing test changed (with the reason)
- `tools/test_auto_cycle21.js` listed 《大熱波》 among the cards that must have NO script (「対応する consumer が engine に無い」). This unit adds that consumer (summon bans by kind), so, as S03-U267 / U211 / U217 did for other cards of the same list, the SKIP assertion for 大熱波 became "has a script with its consumer"; the number of assertions is unchanged.
