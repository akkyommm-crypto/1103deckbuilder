# S03-U355 — four Counter Traps that read the top chain link

Base: `claude/work` `160f810` (U354, gate 19871 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZQ_claude_s03_u355_counters.js`)
- The top chain link (`gameState.chain[last]`) carries `name`, `player`, `from` (the zone the effect was activated from), `eventName` and `targets`; the engine's own effect category is read with `linkHasCategoryV19(gameState, link, 'destroy')` and the targets with `linkTargetsV19`. `negatePreviousChainLinkV2(reason, destroySource)` negates the link (at resolution the chain top is the previous link).
- 透破抜き: the link is a monster effect activated from the hand or the Graveyard → negate without destroying, then `API.banish` the monster.
- 王家の呪い: a Spell/Trap link with the 「destroy」 category and exactly one target, which is a Spell/Trap card → negate and destroy.
- 六尺瓊勾玉: I control a face-up 「六武衆」 monster and the opponent's top link has the 「destroy」 category → negate and destroy.
- エンペラー・オーダー: a monster effect link with `eventName === 'onNormalSummon'` → negate; the link's owner draws 1.
- Not part of this unit: ボム・ガード / デストラクション・ジャマー / 我が身を盾に (the engine's categories do not tell "destroys MONSTERS" from "destroys cards"), スターライト・ロード (2 or more of my cards), 封魔の呪印 (a duel-long ban on the Spell's name), 王者の看破.

## Tests
- `tools/test_s03_u355_counters.js` 16 / 0. Negative control on the previous build: 8 FAIL. Coverage TESTED 3176 → 3180, NOT_STARTED 674 → 670; `registration_names_missing_from_db` empty; audit 0 FAIL.
- The chain is started by the opponent as the turn player (`gameState.activePlayer = 1`, `duelActivateFromHand`); a summon trigger is taken with `eventPickV2(0)` at the group that holds it (the driver would pass the answering window), and the Counter Trap is answered with `duelActivateResponseV2(0, 'sz', index)`.
