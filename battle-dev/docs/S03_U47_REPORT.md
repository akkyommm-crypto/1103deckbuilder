# S03-U47 SPECIAL_SUMMON_EFFECT declarations across the fixed lists (Claude)

Base: `checkpoint_claude_s03_u46_royal_oppression_20260914.zip`, SHA256 `b703c20d1c22417017271b851b940622f80aafdfded072c30f34b65fa36abc16`.

## Why this unit

- U46 (C-S03-37) made 《神の警告》 (in 12 of Astra's 13 fixed lists) and 《王宮の弾圧》 (5 lists) answer a chain link only when `specialSummonEffectLinkS03` is true. U46 declared only the six / rabbit cards.
- Classification: INTEGRATION_MISSING, dependent recovery of U46; it advances every fixed list that runs 神の警告.

## Measurement before (U46 build)

- Read-only scan of `logs/1103_MAJOR_DECKS_v1` (`u47_ss_decl_scan_all.js`): 216 distinct cards, 61 with a Special Summon sentence in an effect, 19 visible to the helper, **42 unseen**.
- Text and script review of the 42 (`u47_script_probe.js` over the loaded scripts: v4 effect keys, legacy trigger events, whether the resolution Special Summons):
  - false positives by text: 神の警告, 神の宣告, エヴォルカイザー・ラギア (negators); キメラテック・フォートレス・ドラゴン, カオス・ソーサラー, ダーク・アームド・ドラゴン (summon-rule procedures);
  - unscripted (cannot form a chain link): 12 cards;
  - scripted Special Summon effects: 21 cards (5 with other activated effects that do not Special Summon);
  - not declared for lack of a 2011 ruling or a chain-less own summon: 冥府の使者ゴーズ, 暗黒界の術師 スノウ, 暗黒界の龍神 グラファ.
- 2011 《神の警告》 (yugioh-wiki age 35, 2011-08-03): only activations whose effect includes a Special Summon are answered, and **not the effect activation of a Spell / Trap** (10/04/17; ヴァルハラ's card activation is not answered either, 11/01/05). U46's helper counted 六武の門's 6-counter effect for 神の警告 as well.
- `tools/test_s03_u47_special_summon_effect_decl.js` on the U46 build: **7 PASS / 8 FAIL** (BF－極北のブリザード's trigger could not be answered; 神の警告 was offered against 六武の門 m6; the per-effect checks failed).

## Closure

- **New `cards/HA_claude_s03_u47_special_summon_effect_decl.js`:** declarations for the 21 scripted cards.
  - Per effect: スターダスト・ドラゴン (`end-return`), アームズ・エイド (`unequip-self`), カラクリ大将軍 無零怒 and カラクリ将軍 無零 (`onSpecialSummon`), TG ワーウルフ (not `onEndPhase`).
  - Whole card: BF－極北のブリザード, BF－精鋭のゼピュロス, BF－蒼炎のシュラ, BF－大旆のヴァーユ, カラクリ忍者 九壱九, ジュラック・グアイバ, スケープ・ゴート, スポーア, ダンディライオン, デブリ・ドラゴン, ドッペル・ウォリアー, ハイドロゲドン, ローンファイア・ブロッサム, ワン・フォー・ワン, 暗黒界の尖兵 ベージ, 創造の代行者 ヴィーナス, 墓守の偵察者.
- **engine/1ZC:** `specialSummonEffectLinkS03(link, opts)`; `opts.excludeSpellTrapEffect` skips a Spell / Trap link without `cardActivationS03`.
- **cards/00 神の警告:** passes `{excludeSpellTrapEffect:true}`. 王宮の弾圧 keeps answering Spell / Trap effect activations (age 42).
- **build_manifest.json:** HA after H9. **tools/check.py:** the U47 test after U46.
- **Test** `tools/test_s03_u47_special_summon_effect_decl.js`, **after: 15 PASS / 0 FAIL**:
  - A: Normal Summon of BF－極北のブリザード → its trigger (target BF－蒼炎のシュラ) → 神の警告 answers; the target stays in the GY; Replay ok;
  - B: 六武の門 6-counter effect: 神の警告 is not offered; a face-up 王宮の弾圧 negates it (紫炎の足軽 stays in the GY); Replay ok;
  - C: per-effect declarations and the 神の警告 exclusion.
- **Targeted regressions on the final build:** U14 summon counters 50 / 0, VS3 six gate slice 22 / 0, VS2 six slice 16 / 0, U45 9 / 0, U46 26 / 0, raiou summon window 16 / 0, R1 gate 44 / 0.
- Coverage unchanged (declarations only); status audit PASS.

## Real-duel effect

- 六武衆 (six) vs 1103兎ラギア, Astra's fixed lists, responder, seeds `0x52310301`–`0x52310307` × both first players, U47 build: **14 / 14 completed**, Replay ok in all 14, blocker none, unsupported [] in all 14 (same as U46).
- Representative duels (due after U44–U46), Dragunity vs 1103兎ラギア fixed lists (`R1_LIST=v1`), seeds `0x52310001`–`0x52310007` × both first players, U46 build: **14 / 14 completed**, Replay ok, blocker none; the only unsupported action is 未来融合－フューチャー・フュージョン (known gap, Astra consult) in 5 duels.

## Gate

- **Process note:** the first full gate run stopped at `tools/test_astra02_cards.js` with `ReferenceError: MAT_SPEC_CACHE is not defined`, because `tools/build_acode.py` (run concurrently to a scratchpad output) starts a `tools/build.py` rebuild and rewrote `dist/battle.html` while the test loaded it. The test passed standalone (21 / 0); nothing in the tree changed, and the full gate was rerun from the start with no concurrent job.
- `python tools/check.py` — EXIT 0, **12663 PASS / 0 FAIL**, no Traceback (log `s03_u47_full_gate.log`).
- The two `ReferenceError` lines in the log (c1ElementOnField, isEffectNegated) are pre-existing (also in the U45 / U46 logs).

## Source hash

`580d6f92dba4a7268823aabadef53efb6b859799cf39e4602787c9d9cbe5fd78` (718 files, excluding dist/ and *.log; this report set aside).

## Remaining

- Unscripted fixed-list cards with Special Summon effects (12) need their scripts first; declare them when they are scripted.
- 冥府の使者ゴーズ is modelled as an activated effect although its own Special Summon is chain-less; スノウ / グラファ declarations need a 2011 ruling.
