# S03-U411 - Instant-Fusion Bomber (瞬着ボマー), Psychic Parasite (精神寄生体), Handcuffs Dragon (手錠龍)

Base: `claude/work` `686cbc8` (U410, gate 20968 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZU_claude_s03_u411_equipself.js`)
- 瞬着ボマー / 精神寄生体: forced onDamageStep trigger at step 'before' (dsTiming) when the attacked face-down monster is flipped: API.equipMonster onto the attacker; the Bomber destroys the host and the Parasite heals in the opponent's Standby Phase.
- 手錠龍: Graveyard trigger after a battle destruction equipping itself to the destroyer (equipFromGrave), ATK -1800 as a continuous apply, and a revival trigger when its host is destroyed.

## Tests
- `tools/test_s03_u411_equipself.js` 11 / 0. Negative control on the previous build (card file removed): 6 FAIL. No existing test changed. Coverage TESTED 3387 -> 3390, NOT_STARTED 484 -> 481, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
