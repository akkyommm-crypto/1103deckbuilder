# S03-U158 — battleProof() text fallback limited to the unconditional self protection

## Why
`battleProof(card)` (`engine/00_state_actions.js`) decides whether a monster is destroyed by battle. When the card's script declared nothing, it fell back to the card text. It matched 「戦闘では破壊されない」 / 「戦闘によっては破壊されない」 **anywhere** in the text and cached the answer per card name.

Audit at U157: 88 cards contain the phrase. 62 relied on the fallback, 48 of them monsters (Spells / Traps never battle, so the fallback did not affect them). Only 22 of these monsters really have the unconditional 「このカードは戦闘では破壊されない」. The other 26 became battle-indestructible for good:

- **once per turn**: ジャイロイド, 混沌球体, スターダスト・シャオロン (TESTED); スカー・ウォリアー, マイン・モール, デュアル・サモナー, デュアル・ソルジャー
- **conditional**: ホワイトポータン (only with a face-up Tuner), サテライト・キャノン (only vs Lv7 or lower) (TESTED); 薄幸の乙女, D・ステープラン, サイバー・ブレイダー, 万力魔神バイサー・デス, フリントロック
- **protects other monsters**: D・ボードン (TESTED; itself is not protected), アマゾネス女王 (TESTED), イレカエル, E・HERO テンペスター, エレキーウィ, トラスト・ガーディアン
- **an effect used from the hand / GY**: シールド・ウォリアー (TESTED), BF－蒼天のジェット, 紫炎の寄子, 幻獣サンダーペガス

battleProof is checked before the System v21 protections (`protectV21`), so the fallback also **masked** the correct v21 declarations the TESTED cards already had. Their tests only checked the first battle, so nothing noticed. The pre-scan confirmed it: no test result changes when the fallback is fixed.

## Change
`unconditionalBattleProofTextS03(db)` accepts only a monster text sentence that *is* the unconditional self protection: 「（①:／また、）このカードは戦闘では（によっては）破壊されない」. Everything else must be declared by the card: `sc.battleProof`, `continuous.battleProof`, or `protectV21`.

The fallback still covers 雲魔物 ×7, 巨大戦艦 ×5, X－セイバー パシウル, レプティレス・ナージャ, ジェルエンデュオ, 柴戦士タロ, ダークネス・ネオスフィア, ナイトメアを駆る死霊, 混沌幻魔アーミタイル, 漆黒のズムウォルト, スクラップ・ゴブリン and ダイガスタ・スフィアード, plus the declared マシュマロン etc.

## Test — `tools/test_s03_u158_battle_proof_text.js` 27/0 (real DUEL path: the turn player's attacks, second attacks in the same turn; Replay-audited)
- **A**: ジャイロイド / 混沌球体 / スターダスト・シャオロン survive the 1st battle of the turn and are destroyed by the 2nd.
- **B**: ホワイトポータン is protected with a face-up Tuner (ジャンク・シンクロン) and destroyed without one.
- **C**: サテライト・キャノン survives a Lv4 attacker and is destroyed by the Lv8 青眼の白龍.
- **D**: D・ボードン in Defense Position protects D・リモコン; D・ボードン itself is destroyed.
- **E**: シールド・ウォリアー / BF－蒼天のジェット / 紫炎の寄子 on the field are destroyed by battle.
- **F**: アマゾネス女王 protects アマゾネスの剣士 and herself.
- **G**: X－セイバー パシウル / 雲魔物－アルトス survive two battles in one turn.
- **H**: the text rule accepts / rejects the listed texts.
- **Negative control on U157**: 9 FAIL + 1 error (A ×3, B, C, D, E ×3; H has no rule function).

## Status
No status change. The TESTED cards above now behave as their texts say. The not-yet-scripted cards with conditional or partial protection now have **no** battle protection until they are declared. That is recorded in `FOLLOW_UP_GAPS.md`; they are NOT_STARTED / ENGINE_GAP / PARTIAL.
Totals unchanged: TESTED 2265, IMPLEMENTED 85, GENERIC_OK 644, PARTIAL 149, ENGINE_GAP 606, NOT_STARTED 1247.
