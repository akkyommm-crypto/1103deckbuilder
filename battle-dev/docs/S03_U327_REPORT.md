# S03-U327 — 「氷結界」封魔団 / 風水師 and 墓守の監視者

Base: `claude/work` `7d086b4` (U326, gate 18956 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZO_claude_s03_u327_icebarrier.js`)
- 封魔団: hand 氷結界 to the GY (cost), once per turn; a card flag `u327SealUntil` (= turn + 2) read by its own `activationLockS03` locks every Spell activation of both players while it is face-up in the Monster Zone, through the End Phase of the controller's next turn.
- 風水師: discard cost (once while face-up, card flag `u327Used`), Attribute declared at resolution and stored as a card flag; `continuous.cannotBeAttackedByS03` (the attacker's current Attribute).
- 監視者: declared activation response from the hand (cost: itself to the GY); recognises 「自らの手札を捨てる効果を含む」 from the activated card's text (heuristic: a sentence with 手札…捨てる, not 相手の手札, not the cost first sentence of a longer text; an override list of one card). The limitation is recorded in the card's status evidence.
- Not done: 氷結界の舞姫 — a recorded ENGINE_GAP (the shown cards are an activation cost and the targets are chosen at activation; P1 resumes only resolution operations), and 伝道師 (Level 5+ Special Summon lock), 御庭番 (cannot be targeted), 破術師, 虎将 ライホウ, 魔酔虫, ロイヤル・ナイト; 墓守の大筒持ち (no Tribute event), 使い魔 (a Deck-top mill as an attack cost), 大神官 / 長.
- A first draft implemented 舞姫 with the shown cards chosen at resolution; the status audit refused it (ENGINE_GAP baseline) and it was removed rather than marked TESTED with a deviation.

## Tests
- `tools/test_s03_u327_icebarrier.js` 18 / 0 (the lock through two turns and its lifting, the declared Attribute vs 光 / 闇 attackers, the hand response and its negatives; Replay audits). Negative control on the previous build: 10 FAIL. Coverage TESTED 3021 → 3024, NOT_STARTED 826 → 823; audit 0 off-target.
