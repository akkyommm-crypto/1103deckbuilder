# S03-U338 — 「ジェムナイト」融合モンスター ×5

Base: `claude/work` `be18865` (U337, gate 19281 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change. Every card is Fusion Summoned through 「融合」 (S03-U130) in its test before the effect is checked.

## Cards (`cards/HZZZZZZZ_claude_s03_u338_gemknight.js`)
- アクアマリナ: forced `onBattlePhaseEnd` → Defense Position when it attacked (`attackCountV48`); forced Graveyard trigger on `onFieldToGraveBatchS03` (its uid in the items — any cause) → the controller chooses an opponent's card (Monster / Spell & Trap / Field Zone) → `returnToHand`.
- アメジス: the same Graveyard trigger → every face-down Spell/Trap/Field card of both players returns to its owner's hand.
- パーズ: `attackLimit = 2` and the `dsTiming 'leave'` battle-kill reading of 古代の機械巨竜 → damage = the destroyed monster's printed ATK.
- プリズムオーラ: ignition, once per turn; the cost sends a 「ジェムナイト」 card from the hand to the Graveyard (`API.sendHandToGrave`, not a discard); the target is a face-up card of either field (itself included); destroy.
- ルビーズ: ignition, once per turn; releases another face-up 「ジェム」 monster (its ATK read into a card flag before it leaves) → `modAtk … 'endTurn'`; continuous `piercingDamage`.
- Not part of this unit: the other ジェムナイト Fusion Monsters (マディラ, パール) are separate cards with their own status.

## Tests
- `tools/test_s03_u338_gemknight.js` 31 / 0 (the five Fusion Summons incl. a refused material, each effect and its negatives, the Defense Position, the bounce of a Set card, the Set cards of both players, two attacks and the burn, the destroy cost and target filtering, the release boost and piercing; Replay audits). Negative control on the previous build: 10 FAIL. Coverage TESTED 3076 → 3081, NOT_STARTED 774 → 769; audit 0 off-target. Pre-scan: no other test names these cards.
- Authoring note: a hand card or a position change made after `baselineA()` breaks the Replay audit — put the Black Hole into the `fuse` hand list and build face-down monsters inside the factory.
