# S03-U407 - Jurrac Titan (ジュラック・タイタン), Thunder Unicorn (サンダー・ユニコーン), Destruction Dragon Gandora (破壊竜ガンドラ)

Base: `claude/work` `d6ee09b` (U406, gate 20886 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZQ_claude_s03_u407_titan.js`)
- ジュラック・タイタン: cannotSpecialSummon, immuneToTarget (Trap / Effect Monster sources), once-per-turn boost with a banish cost (v4RegisterStatModifier until the End Phase).
- サンダー・ユニコーン: once-per-turn ATK reduction of a face-up opponent monster by 500 x my monsters; a card stamp makes my other monsters unable to attack that turn.
- 破壊竜ガンドラ: cannotSpecialSummon, half-LP cost purge (destroy then banish from the Graveyard) with a permanent ATK modifier, forced End Phase self-send in its Summon turn.

## Tests
- `tools/test_s03_u407_titan.js` 21 / 0. Negative control on the previous build (card file removed): 11 FAIL. No existing test changed. Coverage TESTED 3370 -> 3373, NOT_STARTED 500 -> 497, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
