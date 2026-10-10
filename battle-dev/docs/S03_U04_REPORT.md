# S03-U04 Recovery — DECK_TO_HAND_LOCK Part A (Trigger Offering, Mode and Mandatory Excavation) (Claude)

Base: `checkpoint_claude_s03_u03_dragunity_recovery_20260911.zip`, SHA256 `f92371d99bbc58bfe16ef7f03eb88bde9e5f86cde6d6f9b167f9de9b7134260a`.

This is a dependent-recovery unit for C-S03-01 DECK_TO_HAND_LOCK (foundation from U01). Recovery is split: Part A is here, and Part B (spell and hand-cost searchers) is U05. C-S03-01 stays open until U05 is published.

## Requirement closure record

- **Requirement**
  - While ライオウ applies, an optional effect that must add from the Deck cannot be activated. That includes not being offered as a trigger.
  - Cards with a choice keep only their non-Deck option.
  - Mandatory excavators send the card that would have been added to the GY.
- **Root cause**
  - INTEGRATION_MISSING: SEGOC offering (`collectHandlers`) never checked activation-block flags, so a trigger that cannot be activated was still offered and then failed when picked.
  - CARD_WORK: the consumers had no flag, mode filter or lock branch.
- **Closure**
  - `triggerBlockedByDeckLockV32(sc,p,ctx)` added, and `collectHandlers` (DUEL) now skips optional triggers whose `blocksIfNoDeckToHand` applies.
  - Only the deck-to-hand flag is honoured at offering. The Special Summon lock at offering is a separate candidate and is not changed.
  - Forced effects do not declare the flag, so they still activate.
- **Consumers**
  - Optional search triggers: ポケ・ドラ, グリーン・ガジェット, レッド・ガジェット, イエロー・ガジェット, 神秘の代行者 アース, ドラグニティ－コルセスカ (Dragunity battle search).
  - Mode consumers:
    - 竜の渓谷 hides "ドラグニティを手札へ" while locked. It can still be activated when a Dragon is in the Deck.
    - E・HERO フォレストマン offers only the GY 融合 while locked, via `v340ForestmanFusion`. Its passive now also requires a selectable 融合.
  - Mandatory excavation:
    - 魔導雑貨商人: the Spell/Trap goes to the GY.
    - 水晶の占い師: the chosen card goes to the GY and the other card to the bottom, via handler arg `lockToGrave`.
- **Recovery**
  - No status change. All consumers were already TESTED; the three ガジェット are PARTIAL because they are registered in a `forEach` without literal names.
  - Their locked-path behaviour was wrong before and is now path-tested.
- **Remaining dependents**
  - **U05 (① safe, ready):** E－エマージェンシーコール, スクラップ・エリア, 神の桎梏グレイプニル, 化石調査, 墓守の司令官, ヘカテリス, 魔轟神グリムロ, 調律 (plus mill only after a search), 光の援軍 (plus the mill as cost and a Deck of 4+). Also 神の居城－ヴァルハラ, needed as ヘカテリス's search target.
  - **② other dependency:** 天空の使者 ゼラディアス (self-destroy unverified), 六武の門 and 暗黒界の術師 スノウ (legacy closure choices, Q5), 封印の黄金櫃 (manual reservation for the later add), アームズ・ホール and 栄誉の贄 (no script).
  - **③ ruling unresolved:** ジェネレーション・チェンジ, サンライト・ユニコーン, リチュア・ディバイナー, エンシェント・フェアリー・ドラゴン.
  - **Not yet examined:** 58 AUTO_DECK_TABLE `op:'search'` entries, TG ラッシュ・ライノ, TG サイバー・マジシャン.
- **Practical effect**
  - Under an opponent's ライオウ, a Dragunity player's 竜の渓谷 still mills, and コルセスカ no longer offers an impossible search.
  - Summon-search monsters no longer show a trigger that cannot be activated.
  - The flip excavators resolve according to the 2009 rulings.

## Rulings

- **R1103-RAIOH-004** (reviewed): optional searches cannot be activated; mandatory effects activate but do not add.
- **R1103-SIXGATE-009** (六武の門) and **アームズ・ホール 08/06/15**: activation is allowed, but a Deck add is not.
  - Applied by analogy to フォレストマン's "Deck or GY" choice and 竜の渓谷's mode choice. This is an inference.
- **2009-03-02 wiki**
  - 魔導雑貨商人: every excavated card goes to the GY.
  - 水晶の占い師: the card that would be added goes to the GY; the rest go to the bottom.

## Changed files

- engine: `engine/40_legal_script_engine.js` (`triggerBlockedByDeckLockV32`, `collectHandlers` filter)
- cards:
  - `cards/59_v59_autobuild_batch11.js` (ポケ・ドラ)
  - `cards/10_themes_a.js` (ガジェット ×3, アース)
  - `cards/C8_auto_cycle26.js` (コルセスカ)
  - `cards/89_p11_activation_choice_recovery.js` (竜の渓谷)
  - `cards/36_1103_expansion_v340.js` (フォレストマン)
  - `cards/45_v45_native.js` (魔導雑貨商人)
  - `cards/9V_class_a_flip_bulk.js` (水晶の占い師 and the shared handler, opt-in through `lockToGrave`)
- tests: `tools/test_s03_u04_lock_recovery.js`, `tools/check.py`
- generated: `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`, `dist/battle.html`, `dist/battle_acode.html`

## Verification

- **`node tools/test_s03_u04_lock_recovery.js`:** EXIT 0, 38 PASS.
  - ポケ・ドラ, グリーン・ガジェット and アース: not offered under the lock; offered and searching without it.
  - コルセスカ: real Dux path (summon → equip trigger → Battle Phase → attack → destroy). Not offered under the lock; offered and searching without it.
  - 竜の渓谷: only the mill mode under the lock (resolves with no FX_SEARCH); both modes without it.
  - フォレストマン: real Standby Phase. Under the lock only the GY 融合 is a candidate, and there is no offer when only a Deck copy exists.
  - 魔導雑貨商人: under the lock both excavated cards go to the GY, with no FX_DECK_TO_HAND.
  - 水晶の占い師: under the lock the chosen card goes to the GY and the other to the bottom (order checked). The pending choice saved in VM1 resumes in VM2 with `lockToGrave` intact and an equal final digest.
  - Replay audit on each scenario.
- U01 (56), U02 (76) and U03 (57) dedicated tests pass on the U04 build.
- `test_expansion_v340.js` (covers フォレストマン) passes: 16 PASS.
- **`python tools/check.py`:** EXIT 0, 11690 PASS / 0 FAIL (log `s03_u04_full_gate.log`).
- **`python tools/build_acode.py data/carddata.json`:** EXIT 0, cards=4996.
- **Coverage** is unchanged from U03: TESTED 2056, ENGINE_GAP 616, NOT_STARTED 1304, IMPLEMENTED 195, PARTIAL 181, GENERIC_OK 644. S03 audit: 7 declared changes (from earlier units), off-target 0.
- **Gated source manifest SHA256** (excluding dist/ and *.log): `e7866127f8a70934d07db46ca8d0ca43e6e57395817ff091c064b1498c4ab032`.
