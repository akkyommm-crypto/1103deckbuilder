# S03-U415 - Deck Lock (デッキロック), Dissonance (不協和音), Royal Firewall (王宮の鉄壁), Degeneration Circuit (縮退回路)

Base: `claude/work` `551201d` (U414, gate 21029 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZY_claude_s03_u415_locks.js`)
- デッキロック: continuous.lockDeckToHand + deckSummonBanS03 + a forced Standby Phase countdown (my 2nd Standby Phase).
- 不協和音: summonLockS03 on Synchro Special Summons + End Phase countdown (3rd own End Phase).
- 王宮の鉄壁: banishBanS03.
- 縮退回路: fieldBounceBanishS03 + 500 Life Point upkeep (destroyed when it cannot be paid).

## Engine (small)
- `engine/1ZZU_deck_locks_s03.js` banishLockedS03 / deckSummonBannedS03 / fieldBounceBanishedS03; `engine/00_state_actions.js` FX_BANISH, FX_DESTROY_BANISH and FX_BOUNCE read them; `engine/40_legal_script_engine.js` API.specialSummon refuses a Deck origin under deckSummonBanS03.

## Tests
- `tools/test_s03_u415_locks.js` 35 / 0. Negative control on the previous build (card file removed): 20 FAIL. No existing test changed. Coverage TESTED 3400 -> 3404, NOT_STARTED 471 -> 467, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
