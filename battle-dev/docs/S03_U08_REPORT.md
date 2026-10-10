# S03-U08 C-S03-05 JOURNALED_CARD_FLAGS (Claude)

Base: `checkpoint_claude_s03_u07_spell_to_grave_20260911.zip`, SHA256 `e19c872285b9dcdf0245890adb18843883047361008948dac6154d82905d2765`.

## How it was found (vertical slice #1)

- **Setup.** A provisional Dragunity list (P1) against the 1103兎ラギア sample (P2), on the real game path:
  - T1: normal draw → 竜の渓谷 → NS ドゥクス and equip ファランクス → ファランクス SS → Synchro ヴァジュランダ and equip → set 奈落.
  - T2: NS レスキューラビット → SS 2 セイバーザウルス; P1 chains 奈落 and both are banished.
  - T3: ヴァジュランダ doubles its ATK and attacks directly → Main 2 → save → VM2 → End Phase → turn 4.
- **Result.** Everything ran, and the VM2 digest matched. But `v44ReplayAuditPackage` on the live T1–T3 journal failed with a digest mismatch at action 83 of 127 (RNG matched), the second FX_SPECIAL_SUMMON of レスキューラビット.
- **Two more findings** are queued as separate Requirements:
  - F1 CARD_ACTIVATION_VS_EFFECT (竜の渓谷 and similar cards);
  - F2 TRIGGER_OFFER_CONDITION (an illegal 奈落 is offered).

## Requirement closure record

- **Requirement:** card-state fields and player flags written while an effect is activated or resolved must be written by journaled Actions, so Replay reproduces every live digest. This is a system guarantee, not a card ruling.
- **Root cause:** INTEGRATION_MISSING.
  - `v41CardDigest` includes every primitive card field, and `v41PlayerDigest` includes `temporaryFlags` / `effectFlags`.
  - Card scripts assigned such fields directly, for example `summoned.rabbitEndDestroyTurn = gameState.turn`. The live journal recorded the digest with the field; the replay never set it.
  - The reserve processor also removed its level-reset flag with `delete` outside an Action.
- **Closure**
  - `FX_CARD_FLAG_V46` accepts `silent` (no log line). `API.setCardFlag(t, flag, value, reason, opts)` forwards `{silent:true}`.
  - All direct card-state writes in card scripts (28 sites) now use `API.setCardFlag({card}, …, {silent:true})`.
  - The 2 direct player-flag writes now use `API.setFlag(p, key, value, true)` (`PLAYER_FLAG_SET_V42`).
  - `resolveReservedEffectsV30` clears `levelResetUids` expiry flags with a silent `FX_CARD_FLAG_V46`.
  - The values and the readers are unchanged.
- **Consumers:** every effect that marks a card or player during activation or resolution. Also Undo/Redo, SaveLoad and Replay, which all depend on the journal reproducing the state.
- **Recovery (cluster)**
  - **Card fields:**
    - エフェクト・ヴェーラー, 禁じられた聖杯, シャイニング・アブソーブ (`negatedUntilTurn`)
    - ゾンビキャリア, バトルフェーダー, ボルト・ヘッジホッグ, 魔天使ローズ・ソーサラー (`banishWhenLeavesField`)
    - デブリ・ドラゴン, BF－大旆のヴァーユ (`negated`)
    - スポーア, レベル・スティーラー, 魔轟神レイヴン (`lvMod`)
    - ジュラック・グアイバ, 六武衆－ヤイチ (`cannotAttack`)
    - 禁じられた聖槍 (`spearProof`), 光の護封壁 (`wallValue`), 超融合 (`fusionMaterialCount`)
    - レスキューラビット (`rabbitEndDestroyTurn`), and the v340 end-destroy helper used by 天罰 / 真六武衆－ミズホ / 真六武衆－エニシ (`v340EndDestroyTurn`)
    - Per-card turn markers: カラクリ大将軍 無零怒, 鬼ガエル, トラゴエディア ×3, ブラック・ローズ・ドラゴン, BF－精鋭のゼピュロス, 諸刃の活人剣術, ライトロード・マジシャン ライラ
  - **Player flags:** 鬼ガエル, BF－暁のシロッコ.
  - **No status change.** TESTED cards stay TESTED. The IMPLEMENTED cards (禁じられた聖杯, 禁じられた聖槍, 光の護封壁, デブリ・ドラゴン, スポーア, レベル・スティーラー, ジュラック・グアイバ, BF－大旆のヴァーユ, ライラ, 魔轟神レイヴン, 超融合) are covered by the card-name-free lint only and are not promoted.
- **Dependent classification**
  - ① covered:
    - all card-script sites above; the lint enforces that none remain;
    - real-path Replay regression on レスキューラビット, 鬼ガエル, BF－暁のシロッコ, ボルト・ヘッジホッグ, トラゴエディア.
  - ② other dependency: the IMPLEMENTED cards above keep their existing, unrelated gaps (for example デブリ・ドラゴン validation Q8).
  - ③ ruling unresolved: none.
  - **Not yet examined (engine-side direct writes; classified by caller, not in this unit):**
    - applyNormalSummonMethod (`70_summon_procedures`), protConsumeV21, flippedFaceDownV9, provenance attach helpers.
    - Reducer-side, fine: ensureBattlePermissionV6, ensureLinkStateV9, clearExpiredProtV21, applyGraveEquipV31, reconcileEquipLinksV31, activatePendingProcedureBaseStats.
    - Non-DUEL legacy paths: cardCountConsume, cancelBattle, doAttack (before its DUEL early return).
- **Practical effect**
  - Replay audits and replay packages are reliable again whenever these cards are used, including the 兎ラギア sample's main line (レスキューラビット).
  - Flag writes add no developer text to the duel log.

## Changed files

- `engine/00_state_actions.js` (`FX_CARD_FLAG_V46` `silent`)
- `engine/40_legal_script_engine.js` (`API.setCardFlag` opts)
- `engine/30_processor_chain_battle.js` (reserve level-reset flag clear through an Action)
- `cards/00_generic_core.js`, `cards/10_themes_a.js`, `cards/20_control_counter.js`, `cards/30_themes_b.js`, `cards/36_1103_expansion_v340.js`, `cards/37_1103_expansion_v350.js`, `cards/38_1103_expansion_v380.js`, `cards/39_1103_expansion_v380b.js`, `cards/85_v85_autobuild_batch36.js`, `cards/F7_auto_cycle55.js`
- Historical source-shape assertions widened to accept the journaled form, intent unchanged:
  - `tools/test_effect_negation.js` (line 82)
  - `tools/test_expansion_v350.js` (lines 46, 55)
  - `tools/check.py` ('v3.5 leave-field banish', 'Effect Veiler cost before resolve')
- `tools/test_s03_u08_journaled_flags.js` (new), wired into `tools/check.py`
- generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`

The edits were applied by guarded transforms: every pattern had to match exactly once, or nothing was written. `dist/*.html` were not edited by hand.

## Verification

- **`node tools/test_s03_u08_journaled_flags.js`:** EXIT 0, 34 PASS.
  - The lint (3 checks).
  - レスキューラビット: two Deck Special Summons, both marks written by silent `FX_CARD_FLAG_V46`, no log text, Replay OK; the End Phase destroys both, Replay OK.
  - 鬼ガエル ③: the cost returns ライオウ, the extra Normal Summon right is written by `PLAYER_FLAG_SET_V42`, Replay OK.
  - BF－暁のシロッコ: the ATK gain and the only-attacker uid through `PLAYER_FLAG_SET_V42`, Replay OK.
  - ボルト・ヘッジホッグ: it Special Summons itself with the banish mark, Replay OK; when it leaves, it is banished, Replay OK.
  - トラゴエディア ④: it copies Level 4 with the mark, Replay OK; the End Phase restores Level 10 and clears the mark with a silent Action, Replay OK.
  - VM2: the saved mid-turn state has a matching digest, the mark survives, and the End Phase after resuming restores the Level and clears the mark.
- **Vertical slice probe re-run on the U08 build:** the live T1–T3 Replay audit is OK (129 actions).
- **Earlier dedicated tests on the U08 build:** U01–U07 = 56 / 76 / 57 / 38 / 46 / 21 / 32 PASS.
- **Affected legacy tests on the U08 build:** test_effect_negation, test_expansion_v350, test_v370, test_v380, test_auto_cycle25/27/29/41/55/58, test_v850_batch36, test_p1_choice_recovery_minibatch, test_bottomless_batch_v361, test_v410_replay_rng, test_expansion_v340, test_negation_v13, test_smoke_v351. All EXIT 0.
- **Full gate:** `python tools/check.py` — EXIT 0, **11823 PASS / 0 FAIL**; S03 audit off-target status changes = 0 (`s03_u08_full_gate.log`).
- **Acode:** `python tools/build_acode.py data/carddata.json` EXIT 0.

## Coverage

- Unchanged: TESTED 2064 / ENGINE_GAP 616 / NOT_STARTED 1304 / IMPLEMENTED 187 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2251.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `659cc852b4e101f15f8b082030891104554b9d711d47ff3cc8300548a39718e9` (590 files).
