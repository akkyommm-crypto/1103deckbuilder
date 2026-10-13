# S03-U333 — 「ジェネクス」: アクセル, ケミストリ, トライアーム, クロキシアン, ヴィンディカイト, ジオ

Base: `claude/work` `5cdf33d` (U332, gate 19087 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change. Left: ベルフレイム (counters from the opponent's Graveyard removals), リバイバー (a negated-activation event), レアル・ジェネクス・オラクル (a Genex-effect search event), the Normal Monsters.

## Cards (`cards/HZZZZZZU_claude_s03_u333_genex.js`; 「ジェネクス」 = name contains ジェネクス)
- アクセル: ignition (Main Phase), cost discard, revive a Lv4- Machine; the revived monster is stamped (`u333AxelTurn`): ATK doubled until the End Phase (`modAtk` = current ATK), `cannotDirectAttack` (アクセル' continuous), banished at my End Phase (`API.schedule`).
- ケミストリ: Quick Effect from the hand (cost: discard itself); the Attribute is declared at resolution, then my face-up 「ジェネクス」 is chosen (`u333.attr-declare` / `u333.attr-apply`), `API.setAttribute` permanent. **Status:** it carried a recorded ENGINE_GAP; both pieces exist now, so the override entry was removed (declaration `ENGINE_GAP → TESTED`).
- トライアーム: three ignitions (風: random hand card of the opponent → GY; 水: destroy a Spell/Trap; 闇: destroy a face-up 光 monster + draw), each costing a hand card, shared once per turn; the Attributes of the non-Tuner materials come from `card.v380SummonMaterials` (recorded by the Synchro Summon, S03-U147).
- クロキシアン: forced Synchro-success trigger: permanent control of the opponent's highest-Level monster. ヴィンディカイト: continuous `cannotBeAttackTarget` + optional search after a battle kill. ジオ: `API.swapBaseStats` until the End Phase (Lv4- 「ジェネクス」 required).

## Tests
- `tools/test_s03_u333_genex.js` 33 / 0 (real Synchro Summons for every card, the three トライアーム attributes, the negatives, restore at the end of the turn; Replay audits). Negative control on the previous build: 12 FAIL. Coverage TESTED 3046 → 3052, NOT_STARTED 802 → 797, ENGINE_GAP 471 → 470; audit 0 off-target.
- Existing test adapted: `test_v690_batch21.js` listed A・ジェネクス・ケミストリ among the recorded gaps — removed from its list (gap lifted).
- Correction: the U332 gate count is 19087 (not 19088 as predicted): `test_v850_batch36.js` has one pin fewer after スクラップ・ゴーレム left its gap list.
