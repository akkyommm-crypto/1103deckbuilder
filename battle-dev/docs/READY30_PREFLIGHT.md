# READY30 — next Class A batch (preflight complete, NOT implemented)

Produced after System v30. All 30 are `NOT_STARTED`, released on or before the
`2011-08-31` cutoff, and were checked against the 5-point preflight standard.

**Stop point: this batch is specified but deliberately not implemented.**

## Event producer survey (preflight check 2)

Producers were located by scanning `engine/`, `ui/` and `runtime/` for every emit shape
(`queueDeferredEventV2(...)`, `emitEvent(...)`, and `{eventName:'...'}` pushes) rather than
trusting the `EVENTS` name list.

**LIVE (producer confirmed):** `onActivateSuccess`, `onAddToHand`, `onAttackDeclare`,
`onBattleDamage`, `onBattleDestroy`, `onBattlePhaseEnd`, `onControlChange`, `onCounterTrap`,
`onDamageStep`, `onDestroy`, `onDirectBattleDamage`, `onDiscard`, `onDraw`, `onDrawCard`,
`onEndPhase`, `onFlip`, `onLPChange`, `onLeaveField`, `onNormalSummon`, `onPhaseChange`,
`onPositionChange`, `onRemove`, `onSendToGrave`, `onSpecialSummon`, `onStandbyPhase`,
`onTokenSummon`, `onTurnEnd`, `onTurnStart`.

**DEAD (declared, no producer) — must not be used:**
`onCardActivate`, `onChainStart`, `onChainResolve`, `onSet`, `onSummon`, `onTargetDeclared`
(all six already known), **plus four newly confirmed dead this pass:**
`onCounterPlaced`, `onCounterRemoved`, `onEquipAttached`, `onEquipDetached`.

## The 30

Grouped by the single primitive family each relies on.

### A. 戦闘破壊され墓地へ送られた時 (13)
Producer `onSendToGrave` / `onDestroy` with battle reason — LIVE, heavily precedented.

1. 氷結界の番人ブリズド — デッキから1枚ドロー
2. 迷走悪魔 — お互い800回復
3. マイン・ゴーレム — 相手に500ダメージ
4. ニュードリュア — フィールドのモンスター1体を破壊
5. フレムベル・パウン — デッキから守備力200のモンスター1体を手札へ（任意）
6. モジャ — 墓地のレベル4獣族1体を手札へ（任意）
7. サイレントアビス — 表側の水属性以外を全破壊
8. シャインスピリッツ — 表側の光属性以外を全破壊
9. ダークネスソウル — 表側の闇属性以外を全破壊
10. デスサイクロン — 表側の風属性以外を全破壊
11. ヘルプロミネンス — 表側の炎属性以外を全破壊
12. A・ボム — 光属性との戦闘で破壊された時、フィールドのカード2枚を破壊
13. チェイス・スカッド — 守備表示モンスターが戦闘破壊された時、相手に500ダメージ

### B. ダメージ計算前 / ダメージ計算を行わず破壊 (8)
`dsTiming:'start'`. Precedent: ライトロード・モンク エイリン (`cards/10_themes_a.js`),
which already returns the attacked Defense-Position monster to the Deck before damage calculation.

14. ドリルロイド — 守備表示を攻撃した場合、ダメージ計算前に破壊
15. ズババナイト — 表側守備表示を攻撃した場合、ダメージ計算を行わず破壊
16. 忍者マスター SASUKE — 同上
17. ナノブレイカー — レベル3以下の表側表示を攻撃した場合
18. 円盤闘士 — 守備力2000以上の守備表示を攻撃した場合
19. 一刀両断侍 — 裏側守備表示を攻撃した場合、裏側のまま破壊
20. A・O・J コアデストロイ — 光属性と戦闘を行う場合
21. BF－空風のジン — 自身の攻撃力以下の守備力を持つ表側モンスターと戦闘を行う場合

### C. 戦闘に関わる除外 (4)
22. 異次元の狂獣 — 戦闘破壊したモンスターは除外
23. 異次元の戦士 — 戦闘を行った時、相手と自身を除外
24. A・O・J アンノウン・クラッシャー — 光属性と戦闘を行った時、そのモンスターを除外
25. レッサー・デーモン — 表側表示で存在する限り、戦闘破壊したモンスターは墓地へ行かず除外

### D. 戦闘ダメージを与えた時 (3)
Producer `onBattleDamage` / `onDirectBattleDamage` — LIVE.

26. ブラッド・サッカー — 相手デッキトップ1枚を墓地へ
27. 黒蠍盗掘団 — 相手がデッキから魔法カード1枚を墓地へ
28. ボルテック・コング — 自分の表側光属性の数だけ相手デッキトップを墓地へ

### E. 継続効果による攻撃制限 (2)
Consumer confirmed: `continuous.cannotAttack(card, source)` → `cannotAttackNow()` →
`canDeclareAttackV48()`, with `continuous.scope` for reach.

29. グラヴィティ・バインド－超重力の網－ — レベル4以上は攻撃できない
30. 怨霊の湿地帯 — 召喚・反転召喚・特殊召喚されたモンスターはそのターン攻撃できない

## Evaluated and rejected

| card / group | reason |
|---|---|
| 結界像 5枚 (干ばつ・業火・深淵・烈風・豪雨) | `v46GlobalSpecialSummonRestrictionReason` is a **hard-coded card-name list**; `v46FaceUpSummonRestrictionReason` only implements *field-uniformity* (群雄割拠 style), not a fixed-attribute lock. Needs a new declarative summon-restriction primitive. Adding names to the list would be a card-specific engine hack. |
| 威嚇する咆哮, 陽動作戦, 悪夢の鉄檻, 通行税, ダーク・エルフ, 霞の谷のファルコン | No turn-scoped attack-ban consumer and no attack-cost hook exist. `cannotAttackNow` only reads per-card `cannotAttack` and live `continuous` sources, so a resolved Normal Trap has no way to bind the restriction — and per-card flagging would miss monsters summoned later that turn (faking the ruling). |
| 融合／儀式素材のみのモンスター | Needs the Fusion/Ritual summon pipeline, not a card script. |
| カウンター設置・装備装着トリガー | `onCounterPlaced` / `onCounterRemoved` / `onEquipAttached` / `onEquipDetached` are DEAD. |

## RULING-CHECK carried into implementation

* **一刀両断侍** — 「裏側守備表示のまま破壊」: the monster must be destroyed without being flipped, so no Flip effect may trigger.
* **異次元の戦士** — 「戦闘を行った時」 fires on both attack and defence, and banishes itself even when it is not destroyed.
* **A・ボム / A・O・J コアデストロイ / アンノウン・クラッシャー** — attribute is read from DB `at`; no SETCODE authority involved.
* **チェイス・スカッド** — triggers on *any* Defense-Position monster destroyed by battle, either side's, not only its controller's.
* **ボルテック・コング** — the count is taken at resolution, not at damage step.
* **怨霊の湿地帯** — applies to monsters summoned that turn including ones summoned before the card resolved; the "that turn" window follows the summon, not the card.
