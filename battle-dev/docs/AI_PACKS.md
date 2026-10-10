# AIミニパック運用

Claude/ChatGPTに巨大な `dist/battle.html` を読ませないための仕組みです。

## 原則
- Acodeで遊ぶ: `dist/battle_acode.html`（カードDB内蔵版）
- 開発する: 分割ソースを編集
- AIに相談する: `tools/make_ai_pack.py` で必要部分だけZIP化

## 例
```bash
python tools/make_ai_pack.py --area chain --card "E・HERO エアーマン" --note "召喚時サーチ後、双方パスで解決しない"
python tools/make_ai_pack.py --area battle --note "攻撃対象が消えた後のReplayがおかしい"
python tools/make_ai_pack.py --area summon --card "サイバー・ドラゴン"
```

## area
- `chain`: チェーン・優先権・効果解決
- `summon`: 通常/特殊/EX召喚・召喚無効
- `battle`: Battle Step / Damage Step / Replay
- `card`: カード固有効果
- `data`: テストデッキ・カードDB周辺
- `ui`: 盤面・ボタン・選択UI
- `save`: 保存/再開/起動
- `core`: エンジン全体（必要な時だけ）

AIが修正したら、分割ソースへ反映して `python tools/check.py` で再ビルド/チェックします。
