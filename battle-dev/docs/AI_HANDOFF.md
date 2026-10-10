# ChatGPT / Claude handoff

## 最初に読む
1. `README.md`
2. `docs/ARCHITECTURE.md`
3. `docs/SCRIPT_GUIDE.md`
4. 問題に対応する `engine/` または `cards/` のファイル

## 修正原則
- `dist/battle.html` は編集禁止。
- まず再現条件を固定する。
- 複数カードに共通する問題はカード側のif文で直さず、engineへ上げる。
- カード固有裁定だけをcardsへ書く。
- `gameState` の直接変更は必要最小限。既存Action/APIを優先する。
- ADS/EDOProのソースコード/Luaの直接コピーは禁止。公式テキスト・公式裁定・観察した挙動を仕様として独自実装する。
- 修正後は `python tools/check.py` を実行する。

## バグ報告テンプレート
- カード名:
- ターン/フェイズ:
- 自分の場/手札/墓地:
- 相手の場/手札/墓地:
- 実際の操作:
- 実際の結果:
- 正しい結果:
