# S03-U05 Recovery — DECK_TO_HAND_LOCK Part B (Spell / Hand-Cost Searchers) (Claude)

Base: `checkpoint_claude_s03_u04_lock_recovery_a_20260911.zip`, SHA256 `9d0643965491e65ab3613123a12c2fdab80bfcbd802ee19373b577df32d7ba3c`.

This unit is recovery part B for C-S03-01 DECK_TO_HAND_LOCK. It follows the U01 foundation and the U04 part A recovery. With it, the safely recoverable (①) consumers identified in the U04 examination are recovered.

## Requirement closure record

- **Requirement:** while ライオウ applies, optional Spells, Traps and hand-activated monster effects whose effect is to add from the Deck cannot be activated. Unlocked play still works correctly.
- **Root cause**
  - CARD_WORK: the consumers had no `blocksIfNoDeckToHand` flag.
  - Two of them also had card-specific inaccuracies found while examining them:
    - 調律 milled the Deck top even when no card was added.
    - 光の援軍 milled its 3 cards at resolution instead of as the activation cost, and allowed a Deck of 3.
- **Closure**
  - **Flag only:** E－エマージェンシーコール, スクラップ・エリア, 神の桎梏グレイプニル, 化石調査, 墓守の司令官, ヘカテリス, 魔轟神グリムロ.
  - **調律:** flag added; a Deck of at least 2 is required; the Deck top is milled only after a successful search.
  - **光の援軍:** flag added; a Deck of at least 4 is required; the 3-card mill is paid as the activation cost; the resolution search uses a registry choice (`p11cards.deck-hand`), so a pending choice survives save/load.
  - **神の居城－ヴァルハラ:** recovered as ヘカテリス's search target. No code change.
- **Consumers:** the 9 searchers above, plus ヴァルハラ.
- **Recovery (IMPLEMENTED → TESTED):** E－エマージェンシーコール, スクラップ・エリア, 神の桎梏グレイプニル, 墓守の司令官, 魔轟神グリムロ, 調律, 光の援軍, 神の居城－ヴァルハラ. 化石調査 and ヘカテリス were already TESTED and are now also covered on the lock path.
- **Remaining dependents of C-S03-01 (after U01, U04 and U05)**
  - **② other dependency**
    - 天空の使者 ゼラディアス: its self-destroy effect is unverified.
    - 六武の門, 暗黒界の術師 スノウ: legacy closure choices (Q5).
    - 封印の黄金櫃: its later add is a manual reservation.
    - アームズ・ホール, 栄誉の贄: no script yet.
  - **③ ruling unresolved:** ジェネレーション・チェンジ, サンライト・ユニコーン, リチュア・ディバイナー, エンシェント・フェアリー・ドラゴン.
  - **Not yet examined:** 58 AUTO_DECK_TABLE `op:'search'` entries (PARTIAL coarse helper), TG ラッシュ・ライノ, TG サイバー・マジシャン.
  - **Not path-tested:** ヴァルハラ's resolution-time check (09/03/03). No TESTED helper creates a monster for its controller mid-chain. It is implemented in the existing script.
- **New requirement found:** C-S03-04 RESOLVED_SPELL_TO_GY.
  - Symptom: unified Normal Spells and Traps whose effect declares an empty `afterResolve` stay on the field after resolving. Measured: 化石調査, トレード・イン, 太陽の書, 調和の宝札, アドバンスドロー, 援軍, 押収.
  - Size: about 309 cards by heuristic scan.
  - This is pre-existing and not caused by U05. In this unit's test, only 化石調査's GY assertion is exempted, with a pointer to C-S03-04. It is the next engine requirement.
- **Practical effect**
  - Under an opponent's ライオウ, search spells and hand-cost searchers can no longer be activated illegally.
  - 調律 and 光の援軍 now follow the 2011 rulings in unlocked play too: mill order and cost timing.

## Rulings

- **General lock ruling:** R1103-RAIOH-004.
- **調律**
  - Mill only after a successful add (KONAMI Q&A, current, confirmed).
  - Cannot be activated with a Deck of 1 or less (reviewed ruling).
- **光の援軍**
  - The 3 cards are an activation cost; the Deck must be 4 or more (reviewed ruling / KONAMI Q&A).
  - If the cost mills the only candidate, it resolves with no add (KONAMI Q&A).
- **ヴァルハラ**
  - Activating the card itself does not Special Summon (10/05/16 wiki).
  - The no-monster check is also applied at resolution (09/03/03 wiki).

## Changed files

- **cards**
  - `cards/30_themes_b.js`: 調律, E－エマージェンシーコール
  - `cards/38_1103_expansion_v380.js`: スクラップ・エリア, 神の桎梏グレイプニル
  - `cards/52_v52_autobuild_batch04.js`: 化石調査
  - `cards/10_themes_a.js`: 墓守の司令官
  - `cards/36_1103_expansion_v340.js`: ヘカテリス
  - `cards/39_1103_expansion_v380b.js`: 魔轟神グリムロ
  - `cards/00_generic_core.js`: 光の援軍
- **tests / audit:** `tools/test_s03_u05_search_flags.js`, `tools/check.py`, `data/s03_status_changes.json` (+8 declared)
- **generated:** `data/script_coverage.json`, `data/s03_status_audit.json`, `docs/SCRIPT_COVERAGE.md`, `dist/battle.html`, `dist/battle_acode.html`

## Verification

- **`node tools/test_s03_u05_search_flags.js`: EXIT 0, 46 PASS.** Every card is checked on both the unlocked real path (activation, choices, chain, add) and the locked path (illegal).
  - グレイプニル is set on an earlier turn and then activated.
  - Hand-cost searchers pay their self-discard or self-send as cost.
  - 調律: search then mill, in order; illegal with a Deck of 1; when the lock is restored mid-chain (スキルドレイン + サイクロン), neither the add nor the mill happens.
  - 光の援軍: cost milled before the chain; resolution choice; illegal with a Deck of 3; no add when the cost mills the only Lightsworn.
  - ヴァルハラ: activation does not Special Summon; the field effect Special Summons a Fairy; once per turn.
  - Replay audits pass on the scenarios.
- **Earlier dedicated tests on the U05 build:** U01 56, U02 76, U03 57, U04 38 PASS.
- **`python tools/check.py`:** EXIT 0, **11736 PASS / 0 FAIL** (log `s03_u05_full_gate.log`).
- **`python tools/build_acode.py data/carddata.json`:** EXIT 0, cards=4996.
- **Coverage:** TESTED 2056 → **2064**; IMPLEMENTED 195 → **187**; NOT_STARTED 1304; PARTIAL 181; ENGINE_GAP 616; GENERIC_OK 644. S03 audit: 15 declared changes, off-target 0.
- **Gated source manifest SHA256** (excluding dist/ and *.log): `4f224b997fd9f8ae8a58053cae1368b203abd7e6fe07237645e464751b3231cc`.
