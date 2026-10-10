# S03-U134 — Fusion Material substitutes + 沼地の魔神王

## Why
- 「このカードは、融合モンスターカードにカード名が記された融合素材モンスター1体の代わりにできる」 (沼地の魔神王, 融合呪印生物－地 /
  闇; 融合呪印生物－光's older wording) was not implemented. None of the fusion procedures could use a substitute.
- 沼地の魔神王 (PARTIAL) came from AUTO_DECK_TABLE. Its coarse "search" ② had three problems (measured on U133):
  - it let the player add ANY Deck card (ワイト was added);
  - it did not discard 沼地の魔神王 as the cost, so the card stayed in the hand;
  - it was legal in the Battle Phase and with no 融合 in the Deck.

## Change
- `engine/1ZL_fusion_spell_s03.js`:
  - `fusionSubstituteCardS03(card, zone)`: a substitute is recognised from its text. It works in the hand, in the GY, or
    face-up on the field.
  - `fusionNoSubstituteS03(db)`: Fusion Monsters that must use the printed materials refuse substitutes
    (「このカードの融合召喚は上記のカードでしか行えない」, 「上記(の)カードを融合素材にした融合召喚でのみ」; 13 cards).
  - `fusionCombosS03(pool, spec, fusionDb)`: the normal combinations, plus those where exactly one substitute stands in for
    one name-listed material (`nameExact` slot). The other materials must be the real ones, so a second substitute only
    matches as itself. 「E・HERO」モンスター / race / attribute slots cannot be substituted.
  - Used by the Fusion-Spell procedure (融合, ダーク・フュージョン, 龍の鏡, オーバーロード・フュージョン, パワー・ボンド,
    ジェムナイト・フュージョン), 超融合 (`superPolyOptions`) and ミラクル・フュージョン (`miracleOptions`).
- `cards/HS_claude_s03_u130_fusion.js` 沼地の魔神王: a card-specific script replaces the auto-table one. ② is an ignition
  from the hand in the Main Phase; its cost discards the card, and it adds 融合 only. It needs 融合 in the Deck.

## Test — `tools/test_s03_u134_fusion_substitute.js` 16/0 (real DUEL path, Replay-audited)
- A: 融合 with 沼地の魔神王 + バーストレディ in the hand.
  - フレイム・ウィングマン (沼地 for フェザーマン) and ランパートガンナー (沼地 for クレイマン) are offered.
  - The シャイニング (「E・HERO」モンスター＋光属性) is not offered.
  - フレイム・ウィングマン is summoned, and both materials go to the GY as Fusion Materials.
- B:
  - Two 沼地 and no real material: illegal.
  - A face-down 沼地 on the field: illegal; face-up: legal.
  - サイバー・ツイン・ドラゴン with 1 サイバー・ドラゴン + 沼地: illegal (it refuses substitutes).
- C:
  - ミラクル・フュージョン with 沼地 in the GY + バーストレディ on the field → フレイム・ウィングマン (both banished).
  - 超融合 with an own face-up 沼地 + the opponent's フェザーマン → フレイム・ウィングマン.
- D: 沼地 ② discards it and adds 融合 (not the ワイト in front of it). It is illegal with no 融合 in the Deck, or in the
  Battle Phase.
- Negative control on U133: 11 FAIL.
- Pre-scan of all 353 gate tests (parallel): 0 FAIL.

## Not in this unit (recorded)
- 融合呪印生物 ② (release materials → Special Summon a Fusion Monster of its attribute) is not implemented, so the cards stay
  NOT_STARTED even though ① now works through the engine.
- 未来融合 (sends from the Deck) does not consider substitutes.

## Status
- 沼地の魔神王 PARTIAL → TESTED (focus registered). TESTED 2201 → 2202, PARTIAL 172 → 171.
