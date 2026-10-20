# S03-U362 — five Light / Dark monsters

Base: `claude/work` `8d2bf45` (U361, gate 20008 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZX_claude_s03_u362_lightdark.js`)
- ライトロード・ドルイド オルクス: continuous `immuneToTarget` for every 「ライトロード」 monster of both players + a forced `onEndPhase` trigger of its controller (`API.millTop(…, 2)`).
- ライトエンド・ドラゴン: optional trigger on `onAttackDeclare` while it is the attacker or the target of a battle with an opposing monster (`gameState.pendingAttack`); `v4RegisterStatModifier` -500 / -500 on itself (while face-up) and -1500 / -1500 on the opponent monster until the End Phase.
- ライトニング・トライコーン: Graveyard trigger after a destruction by the opponent (`graveInfo.byDestroy`, `byPlayer`); Special Summons サンダー・ユニコーン / ボルテック・バイコーン (a Synchro Monster in the Graveyard must have been properly summoned — `properlySummonedS03` — to be revived).
- ダーク・クリエイター: `cannotNormalSummon`, hand `summonProcedure` (empty field, 5+ DARK monsters in the Graveyard), once-per-turn ignition with a banish cost and a Graveyard target.
- ダーク・カタパルター: a 'カウンター' counter (`API.addCounter`) on my Standby Phase in Defense Position; the ignition banishes N Graveyard cards (cost, N stored with `API.setCardFlag`) and destroys N Spell / Trap cards, then removes the counters.
- Not part of this unit: ダーク・ネクロフィア (an equip-from-Graveyard clause), ダークネス・ネオスフィア (a summon in the attack-declaration window), ダーク・フラット・トップ / ブラック・レイ・ランサー (Synchro / Xyz with unsupported clauses), the Equip-Trap cards パワー・フレーム / パワー・ブレイク / パワーアップ・コネクター.

## Tests
- `tools/test_s03_u362_lightdark.js` 26 / 0. Negative control on the previous build: 12 FAIL. Coverage TESTED 3203 → 3208, NOT_STARTED 647 → 642; `registration_names_missing_from_db` empty; audit 0 FAIL.
- Authoring lesson: a Synchro Monster placed in the Graveyard by a fixture needs `properlySummonedS03 = true` to be revivable (the engine's proper-summon rule); set it before `baselineA()`.
