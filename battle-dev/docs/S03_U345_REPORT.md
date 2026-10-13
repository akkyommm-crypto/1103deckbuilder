# S03-U345 — defensive / battle-reactive monsters ×7

Base: `claude/work` `2eef08b` (U344, gate 19567 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZG_claude_s03_u345_defenders.js`)
- デッド・ガードナー / カードブロッカー: optional `onAttackDeclare` trigger (pattern of 宝玉獣 アンバー・マンモス, S03-U240) → `API.redirectAttack({targetUid: self})` while the attack targets another face-up monster of mine. デッド・ガードナー: forced Graveyard trigger after a destruction → a chosen opposing monster `modAtk −1000 'endTurn'`. カードブロッカー: forced Defense-Position trigger on its Normal / Flip / Special Summon; a third `onAttackDeclare` trigger when it is the target: choose 0–3 (`millTop` + `modAtk 0/+500n`).
- シャトルロイド: the trigger on the declaration aimed at it banishes it and schedules (`standbyPhase`, my next one) a Special Summon from the banished zone + 1000 damage. The attack whose target left becomes the engine's Replay (`attackReplayNeededV28`): the attacker cancels it with `battleReplayCancelV28()`.
- ロックストーン・ウォリアー: continuous `battleDamage` 0 for me in its battles; a forced Graveyard trigger when it was destroyed in battle as the attacker → `API.createToken` ×2 (`noAdvanceTributeS03`).
- 魔力吸収球体: a speed-2 QUICK effect from the Monster Zone in the opponent's turn against the chain top Spell; the cost releases itself; `negatePreviousChainLinkV2`. 傀儡虫: hand IGNITION, the discard of itself is the cost, the target a face-up Fiend / Zombie of the opponent, `API.changeControl(…, 'endPhase')`.
- クリボン: `dsTiming:'calc'` effect when it is the battle target: the attacker's ATK recovered by the opponent (the text), itself returned to the hand, then flagged and lingering (`API.lingerS03`) as the source of a `battleDamage` 0 for me that turn.
- Not part of this unit: デス・モスキート / メタル・シューター / カードガード (a mandatory "remove a counter instead" destruction substitute — the engine's substitutes are optional choices), 一角獣の使い魔 (the attacker must attack), ライフ・コーディネイター (classifying burn effects).

## Tests
- `tools/test_s03_u345_defenders.js` 31 / 0. Negative control on the previous build: 15 FAIL. Coverage TESTED 3123 → 3130, NOT_STARTED 727 → 720; audit 0 off-target. Pre-scan: no other test names these cards.
