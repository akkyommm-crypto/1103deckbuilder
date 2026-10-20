# S03-U369 — two monsters, a Spell and a Trap; a Ritual Summon now queues its success event

Base: `claude/work` `19d9865` (U368, gate 20152 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Engine change (small)
- `engine/14_ritual_v5.js` (the end of the Ritual Summon): in DUEL mode the summoned monster is queued as a Special Summon success (`queueSpecialSummonSuccessV2(player, card, 'ritual')`, the same call `API.specialSummon` makes). Before this a Ritual Summon raised no `onSpecialSummon` event, so no card could react to 「儀式召喚に成功した時」.
- `engine/00_state_actions.js` (`FX_RITUAL_SUMMON` reducer): `card.specialSummonKind = 'ritual'`, so a script can tell a Ritual Summon from other Special Summons (Replay-safe: it is in the action reducer).
- The existing ritual tests (`test_ritual_cards`, `test_ritual_v5`, `test_ritual_registry_v24`, `test_p24_unlocked_cards`, `test_s03_u357_rituals`) still pass.

## Cards (`cards/HZZZZZZZZE_claude_s03_u369_misc4.js`)
- 地獄詩人ヘルポエマー: Graveyard trigger on `onBattlePhaseEnd`, limited to the opponent's turn in which it was destroyed by battle (`graveInfo.battle`, `turn`); `API.discard` of a random opponent hand card (`duelRandomInt`).
- 闇晦ましの城: Flip trigger + a Standby trigger counted in a card flag (up to 4); every step is `v4RegisterStatModifier({atk:200, def:200})` on all face-up Undead monsters on the field at that moment.
- レベル調整: the opponent draws 2; `API.specialSummon(…, {ignoreSummonConditionS03:true})` of a 「LV」 monster from my Graveyard, `API.negateEffectUntil(…, 'permanent')` and the flag `cannotAttackTurn`.
- リチュアルバスター: onOtherSummon trap reacting to a Special Summon of kind 'ritual'; `API.lingerS03` until the end of the opponent's turn with `activationLockS03` + `locksStEffectsS03:true` for the opponent.
- Not part of this unit: 冥界の魔王 ハ・デス (the effect negation of a monster in the Graveyard), カースド・フィグ (a lock tied to its own presence in the Graveyard), 絶対不可侵領域 (a Normal / Special Summon lock).

## Tests
- `tools/test_s03_u369_misc4.js` 17 / 0. Negative control on the previous build: 8 FAIL. Coverage TESTED 3230 → 3234, NOT_STARTED 620 → 616; `registration_names_missing_from_db` empty; audit 0 FAIL.
