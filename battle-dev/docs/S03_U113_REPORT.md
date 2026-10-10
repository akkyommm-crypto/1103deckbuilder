# S03-U113 — カードガンナー + デブリ・ドラゴン (debris qty=2 pair)

## Why
Priority #7 IMPLEMENTED tier, main-deck qty=2: both are in `major_decks_v1_debris.txt` (x2 each). Base: U112 source.

## カードガンナー
2011 text: 1ターンに1度、自分のデッキの上からカードを3枚まで墓地へ送る事ができる。この効果で墓地へ送ったカード1枚につき、
このカードの攻撃力はエンドフェイズ時まで500ポイントアップする。また、自分フィールド上に存在するこのカードが破壊され
墓地へ送られた時、自分のデッキからカードを1枚ドローする。

Rules note: in the 2011 wording the sending is part of the effect ("この効果で墓地へ送った"), not a cost; the later
"送って発動できる" errata is deliberately not applied (no retroactive rulings).

Measured on the U112 build: (1) the count could not be chosen — always `min(3, deck)`; (2) the "destroyed and sent to
the GY → draw 1" clause did not exist (destroyed by battle: no draw).

Fix: unified card with two effects — `mill-boost` (ignition, non-skippable 1/2/3 count prompt at resolution via a
registered handler, ATK +500 per card actually sent, `countLimit:{n:1, effects:['mill-boost']}` so the trigger is not
limited) and `destroyed-draw` (forced GY trigger on `onDestroy` when it was destroyed from the monster zone).

## デブリ・ドラゴン
Defects: (1) the Synchro-material restriction ("ドラゴン族モンスターのシンクロ召喚にしか使用できず、他のシンクロ素材
モンスターは全てレベル4以外") was not implemented; (2) resolve() summoned by the stale GY index chosen at activation and
then negated "the last monster in the zone" instead of the card it summoned.
Fix: `synchroMaterialRestriction` (Dragon Extra Deck monster, every other material's current Level ≠ 4); the target is
re-located by identity and must still be in the own GY; only the summoned card is negated.

## Test — `tools/test_s03_u113_debris_pair.js` 20/0 (real DUEL path; Replay-audited except B2, which switches the
active player by direct assignment)
- A: count prompt 1/2/3 (1/2 with 2 cards), cancel attempt, exact number sent, +500 each, once per turn.
- B: battle destruction → draw; effect destruction after using the ignition that turn → still draws; tributed → no draw.
- C: only the ≤500 ATK monster offered; revived in Attack Position, negated; nothing else negated.
- D: `exCombos`: with a Lv3 non-Tuner → ブラック・ローズ・ドラゴン allowed, the Machine パワー・ツール・ドラゴン not;
  with a Lv4 non-Tuner → not even スターダスト・ドラゴン.
- Negative control on the U112 build: A, B1 and both D restriction checks fail.

## Status
- カードガンナー, デブリ・ドラゴン IMPLEMENTED → TESTED (#115, #116).

## Gate
- Full Gate `GATE_EXIT=0`, 13552 PASS lines (U112 13532 + 20), 0 FAIL, no Traceback / ReferenceError; the single caught
  `TypeError` stack at the start of `test_auto_cycle32.js` is the recorded existing noise.
- Coverage: IMPLEMENTED 125 → 123, TESTED 2159 → 2161; audit 116 declared, 0 off-target.
