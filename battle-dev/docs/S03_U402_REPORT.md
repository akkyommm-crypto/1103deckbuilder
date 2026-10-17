# S03-U402 - Chosen One (選ばれし者), Wild Tornado (荒野の大竜巻), Dragon Manipulation (竜操術)

Base: `claude/work` `0a622a5` (U401, gate 20813 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZL_claude_s03_u402_chosen.js`)
- 選ばれし者: selectCard + u342PickN for the three hand cards, duelRandomInt for the opponent's pick, then specialSummon or sendHandToGrave.
- 荒野の大竜巻: ACTIVATE targeting a face-up Spell / Trap Zone card, destroy, optional Set (act SET_ST) by the destroyed card's controller; Graveyard trigger after a Set destruction.
- 竜操術: Continuous Spell with a once-per-turn ignition (fieldIgnition) equipping a Dragunity Dragon of the hand through the new API.equipMonsterFromHand and +500 ATK for the hosts.

## Engine (small)
- `engine/00_state_actions.js` FX_MONSTER_EQUIP_V46: `fromHandS03` takes the monster from the hand instead of the Monster Zone; `engine/40_legal_script_engine.js` API.equipMonsterFromHand.

## Tests
- `tools/test_s03_u402_chosen.js` 18 / 0. Negative control on the previous build (card file removed): 13 FAIL. No existing test changed. Coverage TESTED 3354 -> 3357, NOT_STARTED 516 -> 513, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
