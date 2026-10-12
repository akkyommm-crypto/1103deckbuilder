# S03-U319 — 「BF」: ブリーズ, ガスト, アリゼ, エテジア, ヒレン

Base: `claude/work` `148f568` (U318, gate 18727 PASS / 0 FAIL). Sonnet 5.5, single writer. All five NOT_STARTED; no engine change (summonProcedure, `destroyedThisTurnV30`, `onAddToHand` of S03-U275, `negateOnSummonS03`, `synchroMaterialRestriction`, S03-U278 position choice).

## Change (`cards/HZZZZZZG_claude_s03_u319_bf.js`)
- ブリーズ: added from the Deck by a card effect → Special Summons itself from the hand; Synchro Material only for a 「BF」 Synchro Monster (`synchroMaterialRestriction` reads the Synchro Monster's db).
- ガスト: hand Special Summon procedure when I control no card; continuous −300 ATK on the opponent monster attacking my 「BF」 during the Damage Step.
- アリゼ: hand Special Summon procedure in a turn in which two or more of my face-up 「BF」 were destroyed (destruction log of engine/1M, distinct uids); +600 LP when sent to the Graveyard as Synchro Material.
- エテジア: quick effect from the hand at the end of the Damage Step when my 「BF」 battled an opponent monster that is still on the field (my BF may be the attacker or the attacked monster, and may itself have been destroyed): cost = itself, 1000 damage.
- ヒレン: from the Graveyard on 2000+ direct battle damage dealt to me by an opponent monster: it and a chosen Lv3-or-less 「BF」 of my Graveyard are Special Summoned with their effects negated; once per Duel (player flag shared by all copies).
- Left (documented in the file): コガラシ (the lock after its Synchro Summon has no ruled duration), ボーラ, アウロラ.

## Tests
- `tools/test_s03_u319_bf.js` 37 / 0 (real battles, hand procedures, Synchro Summons, the end-of-Damage-Step window; negatives per card; Replay audits). Negative control on the previous build: 13 FAIL. Coverage TESTED 2986 → 2991, NOT_STARTED 861 → 856; audit 0 off-target.
- Ruling choice recorded: エテジア's 「自分フィールド上に存在する BF」 is read as the BF that took part in the battle (it may have left the field in that battle).
