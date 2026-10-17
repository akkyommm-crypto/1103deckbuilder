# S03-U371 — four monsters

Base: `claude/work` `2162440` (U370, gate 20181 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZG_claude_s03_u371_misc5.js`)
- 魔知ガエル: `continuous.nameOverride` (scope self) = 「デスガエル」, `cannotBeAttackTarget` for the controller's other monsters, and a Graveyard trigger limited to the turn it left the Monster Zone that adds a 「ガエル」 monster from the Deck (`API.searchDeck`) or the Graveyard (`API.returnToHand`).
- 赤蟻アスカトル: Graveyard trigger after a battle destruction (`graveInfo.battle`): a Level 5 monster of my Graveyard is Special Summoned (`canEffectSpecialSummonS03`), negated (`API.negateEffectUntil`, permanent) and sent to the Graveyard by an End Phase schedule (`turns:0` = the End Phase of the current turn; `turns` counts from the current turn, not from the owner's turn).
- 神竜アクアバザル: once-per-turn ignition; cost = send another face-up WATER monster to the Graveyard (release); target = a Continuous / Field Spell in my Graveyard, `API.returnToDeck(…, false)` puts it on top.
- 英知の代行者 マーキュリー: a forced `onEndPhase` trigger in the opponent's turn (face-up, my hand empty) registers a schedule for my next Standby Phase (`standbyPhase`, turns 1) that draws.
- Not part of this unit: ジュラック・タイタン (immunity from Traps / Effect Monsters only — the immunity hook does not see the source type), 太陽龍インティ (Synchro with a named material), 奇跡の代行者 ジュピター (the 天空の聖域 clause).

## Tests
- `tools/test_s03_u371_misc5.js` 18 / 0. Negative control on the previous build: 8 FAIL. Coverage TESTED 3237 → 3241, NOT_STARTED 613 → 609; `registration_names_missing_from_db` empty; audit 0 FAIL.
- Authoring lesson: `API.schedule({turns})` counts from the CURRENT turn (0 = this turn, 1 = next turn); S03-U349's `turns:(active===me?0:1)` meant "my own End Phase" — pick the value for the phase you want, not by owner.
