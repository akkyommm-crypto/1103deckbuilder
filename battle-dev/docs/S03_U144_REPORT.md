# S03-U144 — attack-time Spell/Trap lock (engine/1ZO) + 死者蘇生 candidate filter

## Why
- 「このカードが攻撃する場合、相手はダメージステップ終了時まで魔法・罠カードを発動できない」 appears on 11 cards of the 2011 pool.
  There was no mechanism for it:
  - 古代の機械巨人 was pinned ENGINE_GAP for exactly this.
  - 古代の機械巨竜 (IMPLEMENTED) declared `lockOpponentSpells`, but `antiqueGearLock()` was never called anywhere, so its lock
    did nothing. Its ① (effects gained from the Gadgets released for its Tribute Summon) was also missing. The fixed TG
    Gadget list plays 3 of each Gadget.
- Found while testing 古代の機械巨人: 死者蘇生 offered monsters it cannot Special Summon — 「特殊召喚できない」, a U126 summon
  condition, or a U127 never-properly-summoned monster. The activation went through and the summon then silently failed.

## Change
- New `engine/1ZO_attack_lock_s03.js`: `declareAttackLockS03(name, {whenBattling, allEffects, active})` and
  `attackLockReasonS03(p, card, zone, db, opts)`.
  - The window runs from the attack declaration (`gs.pendingAttack`) to the end of the Damage Step (`gs.battle`, cleared
    by `finishDamageStepV28`).
  - The locking card must be the attacker, or either battler with `whenBattling`. It must be face-up, with its effects not
    negated, and `active(card)` must hold when declared.
  - What is locked for the other player:
    - by default, Spell / Trap **card** activations (from the hand, or a set card). Effects of face-up Continuous cards stay
      allowed, as in the ショック・ルーラー reading;
    - with `allEffects`, every Spell / Trap / monster activation.
  - It is checked in `activationTypeLockReasonS03` (engine/1ZD), which both legality paths use.
- New `cards/HZ_claude_s03_u144_attack_lock.js`:
  - 古代の機械兵士: the lock.
  - 古代の機械巨人: `cannotSpecialSummon`, the lock and piercing. Its ENGINE_GAP override is removed.
  - インフェルニティ・ビースト: the lock while its controller's hand is empty.
  - ジェムナイト・マディラ: the lock whenever it battles, covering all effects.
  - 古代の機械騎士: the lock once Gemini Summoned.
  - 古代の機械巨竜: now a v4 card with ② the lock and ① the Gadgets read from `summonProvenance.materialSnapshots`.
    Green gives piercing, Red a forced 400 `onBattleDamage`, and Yellow a forced 600 when it destroys a monster by battle.
- engine/1ZK: new `canEffectSpecialSummonS03(card, from, reason, summonKind)` — false for `cannotSpecialSummon`, a
  summon-condition refusal, or the proper-summon rule. `cards/00_generic_core.js` 死者蘇生 uses it for its candidates and
  reports 「墓地に特殊召喚できるモンスターがいません」 when monsters exist but none can be summoned.
- `tools/test_s03_u126_fusion_only_absolute_zero.js` / `tools/test_s03_u127_properly_summoned.js`: the refusal now comes at
  activation. The assertions still check the rule's own message (`summonOnlyReasonS03` / `properlySummonedReasonS03`).
  U126's case A has nothing left to replay, so its audit is replaced by "nothing was journaled".

## Test — `tools/test_s03_u144_attack_lock.js` 24/0 (real DUEL path; attacks and Tribute Summons through the processor; Replay-audited)
- A — 古代の機械兵士:
  - During its battle, the opponent's set ミラーフォース is never offered and is refused with the lock message.
  - The lock ends with the Damage Step.
  - Control: with ワイト attacking, ミラーフォース is offered.
- B — 古代の機械巨人: locked; 2800 piercing damage; 死者蘇生 cannot target it.
- C — インフェルニティ・ビースト: with 1 card in hand, no lock; with an empty hand, locked.
- D — ジェムナイト・マディラ, when attacked:
  - The attacker's Quick-Play サイクロン and its monster effects are refused during the battle.
  - Its own controller is not locked.
- E — 古代の機械騎士: as a Normal Monster, no lock; Gemini Summoned, locked.
- F — 古代の機械巨竜, Tribute Summoned:
  - Green + Red: locked, then 2800 piercing + 400.
  - Yellow + Green: destroys ゴブリン突撃部隊, 700 battle + 600.
- Negative control on U143: 11 FAIL plus 2 ReferenceError chunks.
- Pre-scan of all 363 gate tests (parallel): 0 FAIL.
- Test-side note: an unjournaled `gameState.phase='battle'` after the baseline breaks the Replay audit for any monster. The
  test moves to the Battle Phase through the processor.

## Not in this unit (recorded)
- 古代の機械工兵, 古代の機械究極巨人, 古代の機械獣, E－HERO ワイルド・サイクロン and A・ジェネクス・トライフォース use the same lock
  but have other effects still to implement.
- マディラ's summon condition 「融合召喚でのみエクストラデッキから特殊召喚できる」 is one of the 「でのみ」 wordings not enforced
  yet (engine-wide follow-up).

## Status
- NOT_STARTED → TESTED: 古代の機械兵士, インフェルニティ・ビースト, ジェムナイト・マディラ, 古代の機械騎士.
- ENGINE_GAP → TESTED: 古代の機械巨人. IMPLEMENTED → TESTED: 古代の機械巨竜.
- TESTED 2212 → 2218, NOT_STARTED 1263 → 1259, ENGINE_GAP 608 → 607, IMPLEMENTED 95 → 94.
