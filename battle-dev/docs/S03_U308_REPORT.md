# S03-U308 — direct-attack grant cards: バトル・テレポーテーション, マジック・ホール・ゴーレム, クロス・アタック, 中央突破

Base: `claude/work` `61c1e5d` (U307, gate 18238 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Requirement
- Cards that let a chosen monster attack directly this turn. The capability already existed (`API.grantDirectAttack`, engine/15 `grantedDirectAttackV6`; lingering effects of used cards, S03-U257), so this is CARD_WORK plus one small engine record. All four were NOT_STARTED.

## Cards (`cards/HZZZZZU_claude_s03_u308_direct_grant.js`)
- バトル・テレポーテーション (Trap): exactly one face-up Psychic of mine is chosen; it may attack directly this turn; at the end of the Battle Phase control passes to the opponent (scheduler `battlePhaseEnd` → `API.changeControl`; skipped if the opponent has no free Monster Zone or the monster has left).
- マジック・ホール・ゴーレム: once per turn, a face-up monster of mine is chosen; ATK halved until the End Phase (`modAtk 'endTurn'`, which lasts through the End Phase as for every card), direct attack this turn; every other monster cannot attack this turn — a lingering lock (`API.lingerS03`, continuous `cannotAttack`, scope all monsters) that covers later arrivals and outlives the Golem.
- クロス・アタック (Spell): two face-up Attack Position monsters of mine with the same ATK are chosen on activation — the first may attack directly, the second cannot attack this turn (`cannotAttackTurn`).
- 中央突破 (Trap): a face-up 「六武衆」 is chosen; if it destroys a monster by battle this turn, my 六武衆 / 大将軍 紫炎 monsters may attack directly during the Battle Phase (lingering `continuous.grantsDirectAttack`).

## Engine (engine/00_state_actions.js, BATTLE_CLEANUP)
- New record `gameState.battleKillsS03 = {turn, uids}`: the uids of this turn's battle destroyers. The existing `card.battleKillTurnS03` (S03-U251) is zone-local — it is lost when the destroyer leaves the field — so it cannot express 「…破壊した場合」 once the condition has been met. The new record is derived only from BATTLE_CLEANUP, so Replay reproduces it; the Replay audits of the new test and of the existing battle tests are unchanged.

## Tests
- `tools/test_s03_u308_direct_grant.js` 53 / 0, real DUEL path, Replay-audited; negative control on the previous build: 23 FAIL.
- Nearby: `test_s03_u251_lv` 38 / 0, `test_s03_u255_lv2` 33 / 0, `test_s03_r1_duel_completion` 44 / 0.
- Coverage: TESTED 2929 → 2933, NOT_STARTED 918 → 914; audit 0 off-target (declared in `data/s03_status_changes.json`, `changes`).

## Not done
- 「ご」 Toon direct-attack cards (トゥーン・* ), N・グロー・モス, エレキリム and ソニック・シューター are other conditions (Toon World, drawn card, innate) and stay open.
