# S03-U167 — オシャレオン / ジェイドナイト / 機皇兵スキエル・アイン / バイオファルコン; 「罠カードの効果では破壊されない」 in the real path

## Why
These are recruiters and searchers left out of S03-U156 because their texts also have a continuous effect.
- **オシャレオン** had no script.
- **ジェイドナイト**, **機皇兵スキエル・アイン** and **バイオファルコン** were coarse AUTO-table entries.

While testing ジェイドナイト (「罠カードの効果では破壊されない」) an engine bug surfaced. The v21 effect-destruction context took the source kind from the top of `gs.chain`, but the resolving link has already left the chain when its effect destroys. So `sourceKind` was always null in the real DUEL path, and every sourceKind-limited protection never applied. That includes 氷結界の大僧正 (TESTED since System v21, 「魔法・罠カードの効果では破壊されない」).

## Engine
- **`effectDestroyCtxV21`** (engine/1K) takes the source kind from the action's source stamp `a.srcS03.k`. The stamp is set by engine/1ZG when the action is committed during a resolution and is replayed with it; the chain-top lookup remains as a fallback.
- **`declareDeckTriggerS03`** accepts `spec.continuous`, the card's continuous effects next to its deck trigger.

## Cards (`cards/HZN_claude_s03_u167_deck_triggers2.js`)
- **オシャレオン**:
  - battle trigger: search an ATK ≤ 500 Reptile;
  - continuous `cannotBeAttackTarget` for monsters other than 「オシャレオン」 (canonical identity) while face-up in Attack Position.
- **ジェイドナイト**:
  - battle trigger (face-up): search a Machine / LIGHT / Lv4;
  - `protectV21` (effect, sourceKind 't') for own Machine monsters with current ATK ≤ 1200, while it is face-up in Attack Position.
- **機皇兵スキエル・アイン**:
  - battle trigger: Special Summon a 「機皇兵」 monster (GROUP.MEKLORD_ARMY, monsters only), face-up, the player's choice;
  - ATK +200 per other face-up 「機皇」 monster (GROUP.MEKLORD) on the field.
- **バイオファルコン**: an optional trigger of this face-up card when another Machine its controller controlled is destroyed by battle. It searches an ATK ≤ 1000 Machine; the Deck is examined at resolution.

## Test — `tools/test_s03_u167_deck_triggers2.js` 17/0 (real DUEL path; Replay-audited)
- **A オシャレオン**:
  - only オシャレオン is a target, not ワイト; in Defense Position the restriction is off;
  - destroyed by battle → only the ATK ≤ 500 Reptile is offered and added.
- **B ジェイドナイト**:
  - 聖なるバリア －ミラーフォース－ leaves ジェイドナイト and D・ビデオン and destroys X－ヘッド・キャノン;
  - サンダー・ボルト (a Spell) destroys them;
  - destroyed by battle → only D・ビデオン is offered.
- **C 機皇兵スキエル・アイン**:
  - 1200 → 1600 with two face-up 「機皇」 monsters (one of them the opponent's; a face-down one is not counted);
  - destroyed by battle → only 機皇兵ワイゼル・アイン is offered and Special Summoned.
- **D バイオファルコン**:
  - D・ビデオン destroyed → only サイバー・ジラフ is offered and added;
  - no trigger for ワイト, nor for バイオファルコン itself.
- **E (engine fix)**: the opponent's サンダー・ボルト does not destroy 氷結界の大僧正 or 氷結界の修験者; ワイト is destroyed.
- **Negative control on U166**: 8 FAIL, E included. Pre-scan: every other gate test file is unchanged.

## Status
- PARTIAL → TESTED: ジェイドナイト, 機皇兵スキエル・アイン, バイオファルコン.
- NOT_STARTED → TESTED: オシャレオン.
- Totals: TESTED 2280, IMPLEMENTED 85, GENERIC_OK 644, PARTIAL 145, ENGINE_GAP 603, NOT_STARTED 1239.

## Found, not done
`destroyerTargetingV21` has the same empty-chain problem, for protections from non-targeting effects only (nonTargetingOnly). It is recorded in FOLLOW_UP_GAPS.
