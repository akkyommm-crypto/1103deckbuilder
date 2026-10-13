# S03-U336 — 「エレキ」×5

Base: `claude/work` `1a3276f` (U335, gate 19198 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZX_claude_s03_u336_elec.js`)
- エレキツネ: forced Graveyard trigger when destroyed by the opponent (`graveInfo.byDestroy/byPlayer`, same turn) → card flag + `API.lingerS03` + `activationLockS03` / `locksStEffectsS03` (the pattern of エレキリン, S03-U260) for the Spell / Trap / monster effect activations, and the turn-temporary player flag `noSpecialSummon` for the Special Summon ban.
- エレキャンセル: counter trap like 神の警告 (`summonNegate` kinds + `negatePreviousChainLinkV2` for a Special Summon effect link of the opponent); the cost discards a 「エレキ」 monster chosen from the hand; only the opponent's summon.
- エレキリギリス: `continuous.cannotBeAttackTarget` (scope ownMonsters) for the other face-up 「エレキ」 monsters; `continuous.immuneToTarget` that answers false when the targeting player (`ACTIVATION_PREP_S03` / `P3_EFFECT_CONTEXT`) is its own controller, so only the opponent is shut out.
- エレキリム: Synchro (the material text is parsed by the engine); `grantsDirectAttack`; forced `onDirectBattleDamage` trigger → choose a Deck card, `API.banish`, schedule (`standbyPhase`, `turns:4` = my 2nd Standby Phase, as D－HERO デビルガイ) → `MOVE` banish → hand.
- エレキンモグラ: `a3PreDamageDestroy` (the face-down Defense Position monster is destroyed before damage calculation, as 一刀両断侍) + `attackLimit = 2` (as エレキツツキ).
- Left: エレキ spells/other monsters already done earlier; エレキーパー / エレキャッシュ etc. not touched.

## Tests
- `tools/test_s03_u336_elec.js` 36 / 0 (destroyed-by-opponent vs by-me, Spell / monster-effect / Special Summon locks and their end, real summon-negation window, chain response against 死者蘇生, negatives; attack-target and effect-target filtering for both players incl. a real エネミーコントローラー; real Synchro Summon with refusals, direct attack, banish and the 2nd-Standby return; two face-down destructions and no third attack; Replay audits). Negative control on the previous build: 15 FAIL. Coverage TESTED 3066 → 3071, NOT_STARTED 784 → 779; audit 0 off-target.
- Authoring note: the 「相手は…対象にできない」 limitation for opponent-only target immunity is solved per card by reading the targeting player in `immuneToTarget`; the engine capability itself (a targeting-player argument) is still open.
