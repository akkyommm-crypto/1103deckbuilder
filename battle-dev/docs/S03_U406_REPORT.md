# S03-U406 - Hell Puppet Fiend (地獄の傀儡魔人), Dark Balter the Terrible (魔人 ダーク・バルター), Unyielding Warrior (不退の荒武者)

Base: `claude/work` `5aa5b30` (U405, gate 20871 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZP_claude_s03_u406_puppet.js`)
- 地獄の傀儡魔人: ignition with a hand discard cost, API.changeControl(… 'endPhase', {noTribute}), negateEffectUntil and the Synchro-material stamp.
- 魔人 ダーク・バルター: QUICK effect with a 1000 LP cost negating the effect of a Normal Spell; declareBattleDestroyedNegatorS03.
- 不退の荒武者: protectV21 battle protection as the defender against a higher ATK attacker plus a forced onDamageStep trigger destroying the attacker after the calculation.

## Tests
- `tools/test_s03_u406_puppet.js` 15 / 0. Negative control on the previous build (card file removed): 6 FAIL. No existing test changed. Coverage TESTED 3367 -> 3370, NOT_STARTED 503 -> 500, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
