# S03-U374 — three PARTIAL cards: the coarse auto-table entries replaced by exact scripts

Base: `claude/work` `081c6f2` (U373, gate 20255 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZJ_claude_s03_u374_autotable3.js`)
- D・バリア (Counter Trap): the opponent's Spell / Trap whose chain link has the engine category `destroy` (`linkHasCategoryV19`) and that hits one of my face-up 「D」 monsters — with targets: a target is such a monster; without targets: the text names monsters (so サイクロン / 大嵐 are refused). Negated and destroyed (`negatePreviousChainLinkV2`), then one 「D」 card is added from the Deck.
- D・リモコン: two ignition effects selected by the card's own Position; each mode has its own once-per-turn turn-stamped card flag (the text gives each Position a separate 「1ターンに1度」). Attack: target a GY 「D」 monster, banish it, search a same-Level 「D」 monster. Defense: cost = send a hand 「D」 monster to the GY; return a different same-Level 「D」 monster from the GY. The cost stores its Level in card flags (a `cost` value written to `ctx` is not visible at `operation`).
- 超古深海王シーラカンス: ① once per turn, discard 1; Special Summons every Level 4 or lower Fish of the Deck that fits the Monster Zones (Attack Position), each negated (`API.negateEffectUntil` permanent) and marked `cannotAttack` (the engine's zone-local flag). ② quick response (as ラヴァル・ステライド, S03-U325) when a chain link targets it: release another face-up own Fish, negate and destroy (`API.negateChainLink`).
- Not done (stay PARTIAL): ハーピィ・クィーン (「カード名は墓地でもハーピィ・レディ」 — `continuousCharV17` uses `locateCard`, which does not find Graveyard cards); 堕天使アスモディウス (token protections, 「デッキ・墓地からの特殊召喚はできない」).

## Existing test changed (with the reason)
- `tools/test_s03_u135_auto_table_filters.js` section B drove the OLD coarse D・リモコン (any 「D」 monster from the Deck). The exact card needs a GY 「D」 monster and a same-Level Deck partner, so section B now sets that up and still checks that the Deck choice offers only the matching 「D」 monster (nothing else), and that it is added to the hand. Same intent (group filter of a real activation), the card text as authority.

## Tests
- `tools/test_s03_u374_autotable3.js` 28 / 0. Negative control on the previous build: 11 FAIL. Coverage TESTED 3252 → 3255, PARTIAL 19 → 16; `registration_names_missing_from_db` empty; audit 0 FAIL.
