# S03-U395 - Fallen Angel Asmodius (堕天使アスモディウス) and Undead King Lich (不死王リッチー)

Base: `claude/work` `3eeac1b` (U394, gate 20702 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZE_claude_s03_u395_asmo.js`)
- 堕天使アスモディウス: ignition (once per turn) sending an Angel from the Deck to the Graveyard; forced Graveyard trigger after a destruction on the field creating アスモトークン and ディウストークン (two free zones needed) with permanent protections through API.grantProtection (Asmo: effect, Dius: battle).
- 不死王リッチー: ignition once per turn (face-down Defense Position) and an optional Flip trigger Special Summoning an Undead from my Graveyard; keeps cannotNormalSummon and the targeting negation of S03-U66 / U67 (declareTargetingNegatorS03 in cards/H8C).

## Engine (small)
- `engine/1ZK_summon_only_s03.js` noGraveSummonReasonS03: also from the Deck, and the text 'このカードはデッキ・墓地からの特殊召喚はできない'.
- `data/script_status_overrides.json`: the PARTIAL entry of 不死王リッチー removed.

## Tests
- `tools/test_s03_u395_asmo.js` 20 / 0. Negative control on the previous build (card file removed): 3 FAIL. No existing test changed. Coverage TESTED 3330 -> 3332, PARTIAL 12 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
