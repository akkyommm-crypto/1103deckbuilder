# S03-U403 - Dimension Isolation Machine (異次元隔離マシーン) and Calling Magic (コーリング・マジック)

Base: `claude/work` `5adfa1a` (U402, gate 20831 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZM_claude_s03_u403_isolate.js`)
- 異次元隔離マシーン: plain-placement ACTIVATE, an ignition (once, card flag u403Used) banishing one monster per side with a player-flag record, and a forced Graveyard trigger after its destruction returning them in the recorded Battle Position.
- コーリング・マジック: Graveyard trigger when the Set card is destroyed by the opponent's Spell / Trap: Quick-Play Spell from the Deck Set face-down.

## Tests
- `tools/test_s03_u403_isolate.js` 7 / 0. Negative control on the previous build (card file removed): 3 FAIL. No existing test changed. Coverage TESTED 3357 -> 3359, NOT_STARTED 513 -> 511, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
