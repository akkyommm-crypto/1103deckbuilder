# S03-U339 — enabler-backed cards ×6

Base: `claude/work` `6ae7d5f` (U338, gate 19312 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Defect fixed on the way
- `騎士の称号` (`cards/82_v82_autobuild_batch33.js`) Special Summoned the Knight through the `batch32.special-summon` handler without a `reason`, so the engine's proper-summon check (engine/1ZK, 「…の効果でのみ特殊召喚できる」) refused the Knight with its own enabler ("ブラック・マジシャンズ・ナイトは「騎士の称号」の効果でしか特殊召喚できません"). The summon now carries `reason:'騎士の称号'`. The earlier TESTED status of the Spell only covered its shape, not the real summon.

## Cards (`cards/HZZZZZZZA_claude_s03_u339_enablers.js`)
- ブラック・マジシャンズ・ナイト: forced `onSpecialSummon` self trigger, target = any card on the field (itself included) → destroy.
- サイバー・バリア・ドラゴン: speed-2 `onAttackDeclare` trigger from the Monster Zone (the pattern of 魔轟神獣ルビィラーダ), Attack Position only, `countLimit` once per turn, `API.negateAttack`.
- サイバー・レーザー・ドラゴン: ignition once per turn; candidates are the other face-up monsters (both sides) whose ATK or DEF is at least its current ATK; destroy.
- ブラック・バック: target = a 「BF」 monster with ATK ≤ 2000 in my Graveyard (own turn only); after the Special Summon the Normal Summon right is used up with the journaled `MANUAL_TOGGLE_NORMAL_RIGHT_V43` (when still available).
- 氷結界のロイヤル・ナイト: forced `onNormalSummon` self trigger when the summon was a Tribute Summon (`summonProvenance.summonType === 'tribute'`) → `API.createToken` on the opponent's side (Attack Position, `noAdvanceTributeS03`).
- ヴァイロン・マター: three Equip Spells of my Graveyard chosen with `v380SelectExactly`, shuffled into the Deck (`returnToDeck` + shuffle), then the mode choice (draw / destroy an opponent's card) among the usable ones.
- Left (not part of this unit): ブラック・アロー (a lingering battle-kill trigger), サイバー・ヴァリー / エルタニン / オーガ・2 / ブレイダー, 氷結界の伝道師 (a Level-5+ Special Summon ban for the turn), ヴァイロン・テトラ / スフィア / ポリトープ / シグマ / アルファ / エプシロン / オメガ.

## Tests
- `tools/test_s03_u339_enablers.js` 34 / 0. Negative control on the previous build: 16 FAIL. Coverage TESTED 3081 → 3087, NOT_STARTED 769 → 763; audit 0 off-target. Pre-scan: every test that mentions 騎士の称号 or one of the six cards unchanged.
- Authoring notes: the optional trigger of a monster on the field is chosen by the event driver (`eventPickV2(0)`) at the attack declaration — a test only needs `drive()`; a Normal Summon block is verified with `getLegalHandActions` (the harness's `doNormalSummon` does not re-check it); with several summon methods use `normalSummonMethodsFor` + `pickTributes`.
