# S03-U344 — summon-condition monsters ×11

Base: `claude/work` `adad182` (U343, gate 19497 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZF_claude_s03_u344_spirits.js`)
- `u344Proc(label, groups, banishes)` builds the hand `summonProcedure` from groups of cards to banish / release (helpers `u342Bad`, `u342PickN` of S03-U342; the banish groups are refused under ネクロバレー): 霊魂の護送船 (1 LIGHT), 神聖なる魂 (2 LIGHT), ガルーダ (1 WIND), アクエリア (1 WATER), 氷炎の双竜 (2 WATER + 1 FIRE), 電池メン－業務用 (2 「電池メン」), 真紅眼の闇竜 (release 真紅眼の黒竜), 降雷皇ハモン (send 3 face-up Continuous Spells).
- 神聖なる魂: continuous (`oppMonsters`) −300 ATK while it is the opponent's Battle Phase. ガルーダ: optional `onEndPhase` trigger in the opponent's End Phase → `changePosition` of the chosen face-up monster. アクエリア: optional `onStandbyPhase` trigger in the opponent's Standby Phase → `changePosition` + a card flag read by its continuous `cannotChangePosition` for the rest of that turn.
- 氷炎の双竜 / 業務用: ignition effects (discard cost → destroy a monster / banish a Thunder from the Graveyard cost → destroy a monster and a Spell/Trap). 真紅眼の闇竜: continuous +300 per Dragon of my Graveyard. ハモン: continuous `cannotBeAttackTarget` for my other monsters while it is face-up in Defense Position + the battle-kill 1000 damage (`gearKilledFoeS03`, S03-U144).
- 邪龍アナンタ: the procedure banishes *every* Reptile of mine on the field and in the Graveyard (the count through a temporary player flag, copied to the card) → set ATK/DEF count × 600; a forced End Phase trigger destroys a chosen card of the field. マグネット・バルキリオン: procedure releasing α / β / γ from the hand or field; ignition: release itself (cost) and Special Summon α / β / γ from the Graveyard (needs three free zones). 虚栄の大猿: the procedure sends a Beast from the hand; the Level choice (`modLevel ±`) on a forced self `onSpecialSummon` trigger.
- Not part of this unit: 神炎皇ウリア (an effect nothing can be chained to), 青眼の光龍 (the targeting-negation clause), 天魔神, カオス・ソルジャー, ラビエル / 邪神 (release-three Normal Summons).

## Tests
- `tools/test_s03_u344_spirits.js` 70 / 0 (the 11 cards, their procedures with negatives, Standby / End Phase triggers, ignition effects, a level choice; Replay audits). Negative control on the previous build: 48 FAIL. Coverage TESTED 3112 → 3123, NOT_STARTED 738 → 727; audit 0 off-target. Pre-scan: no other test names these cards.
- Authoring note: an effect that triggers on every opponent's Standby Phase (アクエリア) re-fires in a later `endTurn()`, so a "lock ends" check must stop at the next own turn.
