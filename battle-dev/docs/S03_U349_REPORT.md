# S03-U349 — event Traps ×3 and a Spell

Base: `claude/work` `06fcb86` (U348, gate 19721 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZK_claude_s03_u349_event_traps.js`)
- ヘル・ポリマー: `onOtherSummon:true` + passive `onSpecialSummon` (the pattern of 奈落の落とし穴): the event's card is an opponent monster face-up in the Monster Zone with `specialSummonKind==='fusion'`; the cost sends a monster of mine to the Graveyard; `API.changeControl` (permanent).
- 痛恨の訴え: passive `onDirectBattleDamage` (the damaged player is me, the attacker the opponent's); the highest-DEF face-up opposing monster (a choice among ties) is taken with `API.changeControl`, `API.negateEffectUntil(…, 'permanent')` and the card flag `cannotAttack`; an End Phase schedule (`turns: 1` from the opponent's turn, `0` from mine) returns it, clearing the negation and the flag — `until:'endPhase'` would have returned it at the opponent's own End Phase.
- 破壊輪: `countLimit:1`, opponent's turn only, `selectTargets` among the opposing face-up monsters whose ATK ≤ their LP; destroy, then `damageLP` to me and the same amount to them (printed ATK).
- 融合回収: two targets (a 「融合」 and a Graveyard monster carrying `fusionMaterialS03`, written by the engine's Fusion Summon) → `returnToHand`.
- Not part of this unit: 調律師の陰謀 (「破壊された場合ゲームから除外される」 — banished instead of the Graveyard needs a replacement effect on another player's card), 栄誉の贄 (a token releasable only for 地縛神 Advance Summons), 賢者の聖杯 (cannot be released / used as Synchro Material for good).

## Tests
- `tools/test_s03_u349_event_traps.js` 19 / 0. Negative control on the previous build: 7 FAIL. Coverage TESTED 3149 → 3153, NOT_STARTED 701 → 697; `registration_names_missing_from_db` empty; audit 0 off-target. Pre-scan: no other test names these cards.
