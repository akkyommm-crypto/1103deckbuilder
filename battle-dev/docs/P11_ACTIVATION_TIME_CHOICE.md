# P1.1 Activation-time Choice 完了記録

- 基準: batch040 + P1/P3/P4、2843 PASS / 0 FAIL
- 完了: 2932 PASS / 0 FAIL
- Coverage: TESTED 905 / IMPLEMENTED 198 / GENERIC_OK 644 / PARTIAL 182 / ENGINE_GAP 847 / NOT_STARTED 2220（合計4996）
- 回収: 手動監査済み26枚すべて TESTED、ENGINE_GAP残り0
- Acode: 4996枚
- batch041: 40枚選択済み・未開始を維持

## 共通仕様

- `DECLARE_V11` をAction Journalへ記録
- `link.declaration`、`link.activationCost`、`card.declaration`をJSON-safeな純データとして保持
- 対象は既存`link.targets`、モードは既存`link.v4EffectKey`を使用
- コストsnapshotはP3 `snapshotCardV3()`を再利用し、既存`link.costSnapshots`の意味を維持
- 宣言ChoiceはP1 `CHOICE_OPEN_V49` / `CHOICE_ANSWER_V49`とhandler registryを再利用
- `card.declaration`は領域移動時に消去
- abort、CHAIN_ADD、再発動時に発動途中bufferを消去

## 検証

- 発動途中Save/Load後の継続と未ロード経路の最終digest・Journal一致
- コスト選択Undo/Redo、宣言回答Undo/Redo
- declaration後Save/Load、abort後buffer空、CHAIN_ADD後buffer空
- 永続宣言の領域移動リセット
- metadata無し局面のdigestバイト互換
- Replay / Undo / Redo / SaveLoad / Action Journal / digest 全PASS
