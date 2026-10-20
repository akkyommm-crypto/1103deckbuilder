# S03-U393 - Seal of Spell (封魔の呪印), Tyrant's Outburst (暴君の暴言), Book of the Dark World (暗黒界の書物)

Base: `claude/work` `9568a74` (U392, gate 20665 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZC_claude_s03_u393_seal.js`)
- 封魔の呪印: Counter Trap copied from ヴィクティム・カウンター (S03-U340): onActivateSuccess of the opponent's Spell; cost = discard a Spell; negate and destroy; the Spell's name is written to the opponent's effectFlags.activationBanNamesS03.
- 暴君の暴言: Continuous Trap; the cost releases two of my monsters (u342PickN); activationLockS03 forbids monster effects activated in the hand or on the field for both players.
- 暗黒界の書物: Continuous Spell (the hand activation guard uses locateCardAnyV4); handLimitDiscardS03 asks (confirm + card choice) for the Special Summon of one discarded monster.

## Engine (small)
- `engine/1ZD_activation_type_lock_s03.js` monsterActivationLockReasonS03: a Spell whose name is in the activating player's effectFlags.activationBanNamesS03 cannot be activated.
- `engine/1ZZJ_hand_limit_s03.js`: after the hand-limit discard every face-up Spell / Trap / Field card whose script has handLimitDiscardS03(player, uids, card) is called (negated cards skipped).

## Tests
- `tools/test_s03_u393_seal.js` 20 / 0. Negative control on the previous build (card file removed): 10 FAIL. No existing test changed. Coverage TESTED 3324 -> 3327, NOT_STARTED 544 -> 541; `registration_names_missing_from_db` empty; audit 0 FAIL.
