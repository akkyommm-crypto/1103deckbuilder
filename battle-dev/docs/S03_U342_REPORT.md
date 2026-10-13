# S03-U342 — Special-Summon-condition monsters ×6

Base: `claude/work` `2b32494` (U341, gate 19412 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZD_claude_s03_u342_procs.js`)
- ゲート・ガーディアン / カード・ブレイカー / ギガストーン・オメガ / ジャイアントワーム: hand `summonProcedure`s. The cost sends the three 魔神 (one of each name) to the Graveyard / sends a Spell & Trap Zone card / banishes two EARTH monsters / banishes an Insect; a banish out of the Graveyard is refused in the condition while ネクロバレー applies (`graveMoveBlocked`). カード・ブレイカー comes out face-up Attack only (`positions:['atk']`).
- ギガストーン・オメガ: forced Graveyard trigger on `onFieldToGraveBatchS03` (its uid among the items) when the `graveInfo` says: from a Monster Zone, face-up, not battle, not released, not Synchro material → destroy every Spell/Trap of the opponent.
- ジャイアントワーム: forced `onBattleDamage` trigger (own attacker, the opponent took damage) → `API.millTop(opponent, 1)`.
- カゲトカゲ / シンクロ・マグネーター: optional hand triggers (`onNormalSummon` / `onSpecialSummon` with `specialSummonKind==='synchro'`) in the pattern of サイバー・ダイナソー; カゲトカゲ declares `cannotSynchroMaterial`.
- Not part of this unit: スーパーバグマン (one on the field + swapping every Attack-Position monster's ATK/DEF), グラヴィティ・ベヒモス, カオス・ソルジャー, the Invader / Demon / Amazoness groups.

## Tests
- `tools/test_s03_u342_procs.js` 33 / 0. Negative control on the previous build: 14 FAIL. Coverage TESTED 3098 → 3104, NOT_STARTED 752 → 746; audit 0 off-target. Pre-scan: no other test names these cards.
- Authoring notes: a hand trigger that answers *another* monster's summon needs `onOtherSummon:true` in the meta (otherwise `summonTriggerApplies` only lets the summoned card itself react); in a DUEL such an optional trigger is taken in the post-summon window — the test answers it with `pointActivateV27(0,'hand',index,0)`; do not edit a card's `summonedTurn` after `baselineA()` (Replay audit).
