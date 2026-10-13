# S03-U340 — Spell / Trap ×5

Base: `claude/work` `66a6a31` (U339, gate 19346 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZB_claude_s03_u340_traps.js`)
- ストライク・ショット: Trap answered at my attack declaration (`gameState.pendingAttack`, passive `onAttackDeclare` from the Spell & Trap Zone); `modAtk +700 'endTurn'`; the used card lingers (`API.lingerS03`) and its `continuous.piercingDamage` pierces for the flagged attacker that turn.
- チェンジ・デステニー: Trap at the opponent's attack declaration: `API.negateAttack`, `changePosition` to Defense, a card flag on the monster read by the lingering card's `continuous.cannotChangePosition` (long linger: turn + 500); the attacker's controller answers a journaled registry choice (`u340.destiny-pick`): recover half the ATK or deal it to the trap's controller.
- ライト・バニッシュ: counter trap like エレキャンセル (S03-U336): `summonNegate`, `negatePreviousChainLinkV2` for an effect Special Summon link; the cost releases a 「ライトロード」 monster.
- ヴィクティム・カウンター: counter trap against a Spell Card activation of the opponent (the chain top link is read — `ctx.event` is missing when the response is chosen from the chain window); the cost turns a Gemini monster face-down Defense (`FX_SET_STATE`); `negatePreviousChainLinkV2`.
- ワンダー・クローバー: Normal Spell; the cost sends a Level 4 Plant from the hand to the Graveyard; lingering `grantsAttackLimit` (2) for the chosen monster and `cannotAttack` for the others, stamped with the turn.
- Not part of this unit: リニアキャノン (no "other Spell activated this turn" record), デストラクション・ジャマー / ボム・ガード (classifying chain links that destroy), サモンリミッター, 不協和音 (the 3rd End Phase counting), ブラック・アロー (the lingering kill trigger).

## Tests
- `tools/test_s03_u340_traps.js` 32 / 0. Negative control on the previous build: 17 FAIL. Coverage TESTED 3087 → 3092, NOT_STARTED 763 → 758; audit 0 off-target. Pre-scan: no other test names these cards.
- Authoring notes: use a stronger attacker than the target in two-attack tests (a ワイト vs ワイト destroys the attacker, and `idx(card)` of a destroyed card is −1); a trap that answers a Spell activation must read the chain top, not `ctx.event`.
