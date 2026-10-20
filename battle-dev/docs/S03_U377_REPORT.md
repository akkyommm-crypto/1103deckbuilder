# S03-U377 — five negation cards

Base: `claude/work` `62ee301` (U376, gate 20330 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZM_claude_s03_u377_negators.js`)
- Shared helper `u377DestroysMonsters(link, side)`: the chain link has the engine EffectCategory `destroy` (`linkHasCategoryV19`) AND its object is a monster — a target on the Monster Zone (of `side`, or any) or, without targets, the card text names monsters in its destruction sentence (and `side` controls a monster). Effects that destroy only Spells / Traps are refused.
- 我が身を盾に (Quick-Play, 1500 LP cost) and デストラクション・ジャマー (Counter Trap, hand discard cost): negate and destroy (`negatePreviousChainLinkV2`). ボム・ガード: same for a link that would destroy MY monster, plus 500 damage to the opponent.
- ライフ・コーディネイター (hand) and 椿姫ティタニアル (field): quick effects on `onActivateSuccess` (`declareActivationResponseS03`, as S03-U327 / U325), `API.negateChainLink(chainId, 'activation', reason, true)`. Coordinator: the opponent's link has the category `damage`; cost = discard itself. Titania: the link has a target on the field (monster / Spell / Trap Zone); cost = release another face-up Plant.

## Tests
- `tools/test_s03_u377_negators.js` 22 / 0. Negative control on the previous build: 10 FAIL. Coverage TESTED 3263 → 3268, NOT_STARTED 601 → 596; `registration_names_missing_from_db` empty; audit 0 FAIL.
