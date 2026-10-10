# S03-U122 — デュアル (Gemini) batch 2

## Why
After U119 (Gemini Summon capability + 6 cards), 18 Gemini monsters remained NOT_STARTED. This batch takes the ones whose
gained effect maps onto existing capabilities only (no new engine code).

## Cards (`cards/HQ_claude_s03_u122_gemini2.js`, all via `defineGeminiS03`)
- 巨人ゴーグル — original ATK 2100 (`setBaseAtk`).
- サンライズ・ガードナー — original DEF 2300 (`setBaseDef`).
- 未来サムライ — once per turn: banish 1 GY monster (cost) → destroy 1 face-up monster (not targeted, chosen at resolution).
- シャドウ・ダイバー — once per turn: target 1 face-up DARK Level 4 or lower monster you control; it may attack directly
  this turn (`API.grantDirectAttack`, which works in DUEL since U117).
- インフィニティ・ダーク — at its attack declaration, optionally change the position of 1 face-up opponent monster.
- ギガプラント — once per turn, Main Phase: Special Summon 1 Insect / Plant from the hand or GY.
Resolution-time choices use registered ChoiceRequest handlers (SaveLoad-safe).

## Test — `tools/test_s03_u122_gemini2.js` 18/0 (real DUEL path, Replay-audited)
- A ATK 1500 → 2100 / DEF 500 → 2300 only after もう1度召喚.
- B 未来サムライ refused before; after: GY monster banished (cost), chosen monster destroyed; once per turn.
- C シャドウ・ダイバー → ワイト attacks directly past ジェネティック・ワーウルフ (300).
- D インフィニティ・ダーク → the chosen ワイト becomes Defense Position; no trigger as a Normal Monster.
- E ギガプラント → ローンファイア・ブロッサム from the GY; once per turn.
- Negative control on the U121 build: all effect checks fail. Card-state lint (`test_s03_u08_journaled_flags.js`): 0 FAIL.

## Not included (need other capabilities)
ヴァリュアブル・アーマー (attack every opponent monster once), 古代の機械騎士 (S/T activation lock during its attack),
水面のアレサ (random discard), 竜影魚レイ・ブロント (position lock until the next turn), 魔族召喚師 / 地獄の門番イル・ブラッド
(destroy the summoned monsters when it leaves), エーリアン・ヒュプノ, クルセイダー・オブ・エンディミオン, ダーク・ヴァルキリア,
エヴォルテクター シュバリエ, フェニックス・ギア・フリード, 炎妖蝶ウィルプス, デュアル・ソルジャー (PARTIAL), マジック・スライム (ENGINE_GAP).
- Note: ギガプラント Special Summons in face-up Attack Position (engine convention for API.specialSummon); the text does not
  fix the position, so a position choice would be more faithful — recorded as a follow-up.

## Status
- 6 cards NOT_STARTED → TESTED. TESTED 2184 → 2190, NOT_STARTED 1278 → 1272.

## Gate
- `python tools/check.py` — `GATE_EXIT=0`, 13873 PASS lines, 0 FAIL, no Traceback (one caught `TypeError` stack from
  `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level function declarations".
- `dist/battle.html` SHA256 `cb78733990bd3d1bb50449e3de081cde5249e6ac1e5f998762abd4448c7d6baf`; Acode regenerated after the gate: `dist/battle_acode.html` `449f94d10b39c810ed9f2ef4ec0102e273f5e169020393d2fe5bb8ff7034914f`.
- Coverage: TESTED 2190, IMPLEMENTED 109, ENGINE_GAP 609, GENERIC_OK 644, PARTIAL 172, NOT_STARTED 1272 (4996);
  145 declared status changes, 0 off-target.
