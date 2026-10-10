# S03-U10 C-S03-07 CARD_ACTIVATION_VS_EFFECT (Claude)

Base: `checkpoint_claude_s03_u09_offer_legality_20260911.zip`, SHA256 `ad6a837671292d7c368ca70c7d77a323c56a744886e5883a7583f8da8418bf82`.

## How it was found

- Vertical slice #1 (Dragunity provisional vs 1103兎ラギア, real path), finding F1.
- 竜の渓谷 activated from the hand also ran its effect (discard → mode → search) in the same chain link, which consumed its 1/turn.
- The 2011 wiki says the effect cannot be activated at the same time as the card: 竜の渓谷 10/07/04, 神の居城－ヴァルハラ, and コア転送ユニット / 擬似空間 10/09/23. インフェルニティガン is the stated exception.

## Measurement before the fix (U09 build)

- **Merge.** Activating 竜の渓谷, 神の居城－ヴァルハラ, 暗黒界の門, アポート, ミイラの呼び声 or ウィルスメール from the hand ran the effect's cost, choice and resolution, and consumed the effect's 1/turn.
- **Blocker.** On an empty board the card itself could not be activated, because the effect's condition blocked it.
  - This is decisive for 六武の門 and 六武衆の結束: they need counters that only accumulate once the card is on the field, so they could never be activated in a real duel.
- **Sweep of all 188 scripted Continuous/Field S/T.** On an empty board (spells from the hand through the DUEL hand list, traps from a set), only 51 could be activated. 135 were refused: TESTED 120, IMPLEMENTED 8, PARTIAL 7.
- **Why the tests missed it.** Existing tests place these cards face-up and activate the effect directly, so they never exercised card activation.
- **False positive in U05.** The U05 assertion 「ヴァルハラ activation does not Special Summon (10/05/16)」 was true only because `pass()` stops at a pending choice: activating from the hand had opened the Special Summon target choice, which was not yet answered.

## Requirement closure record

- **Requirement.** A Continuous Spell, Field Spell or Continuous Trap whose text puts no requirement on activating the card itself can be activated from the hand or from a set as a card activation only. Its effects are activated or applied separately once it is face-up.
- **Root cause (INTEGRATION_MISSING).**
  - Card activation and effect activation shared one legality and preparation path: `strictScriptLegalityV2` and `prepareDuelActivation` checked the script's effect-level condition, timing and count limit.
  - `prepareDuelActivation` ran the effect's `activationV11`, cost and targets. Resolution then ran the effect.
  - For unified cards, the adapter selected the on-field ignition effect at card activation.
- **Closure.**
  - **Declaration.** `cardActivationOnlyV32` applies to legacy `fieldIgnition:true` and to the reviewed table in `cards/H2_claude_s03_card_activation.js`. There is no auto-detection, because some unified cards carry real activation conditions inside non-ACTIVATE effects (ゴブリンの小役人, 便乗).
  - **When it applies.** The card is being activated from the hand, from a face-down set, or with `opts.cardActivation` (passed by `duelActivateFromHand`). In that case:
    - legality returns ok before any effect-level check;
    - `prepareDuelActivation` skips `activationV11`, cost and targets, and sends no count-consume payload;
    - `CHAIN_ADD` carries `cardActivationOnly:true`;
    - resolution skips `resolve` and `afterResolve`, while spell-counter observers still apply;
    - SEGOC does not offer card-activation-only candidates, which stay available as chain responses.
  - **Effect path.** Once the card is face-up, its effect is activated through the existing path (「⚡ 効果を発動」).
- **Consumers.** The DUEL hand list, set-card activation (`getLegalZoneActions`), chain responses (`getChainResponsesV2`), `duelActivateFromHand` / `duelActivateFromZone`, SEGOC, and chain resolution.
- **Recovery (cluster).** 104 declared cards:
  - 6 legacy `fieldIgnition` cards;
  - 36 legacy scripts with on-field effects only;
  - 54 unified cards without an ACTIVATE effect;
  - 8 unified cards whose ACTIVATE effect is really the on-field effect.
  - This includes key-deck cards: 竜の渓谷, 六武の門, 六武衆の結束, 一族の結束, 黒い旋風, 神の恵み, 暗黒の呪縛, 冥界の宝札, 生還の宝札, 魂吸収, ヴァルハラ.
  - Classification: a text review of every refusal, from the scratchpad `u10_classify.js` heuristic plus hand correction.
  - Six cards the heuristic called A were moved to B, because their 「選択」 wording belongs to the on-field effect: 竜の渓谷, ウィルスメール, 押し売りゴブリン, 押し売りゾンビ, 「A」細胞増殖装置, ライトロード・バリア.
  - No status change.
- **Dependent classification.**
  - **① Covered.**
    - All 104 are covered by the name-free sweep: every declared card is activatable as a card, has no effect, uses no count, and replays OK.
    - Real-path regressions: 竜の渓谷 (card, then effect from the field, including VM2), アポート (unified), 木遁封印式 (set trap), 一族の結束 (continuous boost after activation), the SEGOC exclusion (アイスバーン), and 神の居城－ヴァルハラ (U05 corrected).
  - **Not declared (A: the card activation itself has a requirement; current legality kept, 30).**
    - Target or selection: リビングデッドの呼び声, デモンズ・チェーン, 正統なる血統, 蘇りし魂, ブレインハザード, 奇跡の光臨, 闇次元の解放, 化石岩の解放, 携帯型バッテリー, エンジェル・リフト, 魂の共有－コモンソウル, グレイモヤ不発弾, 鉄壁の布陣, ミニチュアライズ, 六芒星の呪縛, 罅割れゆく斧.
    - Cost: 光の護封壁, ヒステリック・パーティー, 超栄養太陽, 忍法 変化の術, フューチャー・グロウ, エレメンタル・アブソーバー.
    - Declaration: DNA移植手術, DNA改造手術, 夜霧のスナイパー.
    - Activation condition or timing: ゴブリンの小役人, 便乗, ボスラッシュ, デプス・アミュレット.
    - Plus マクロコスモス.
    - Control card: 正統なる血統 is still not offered without a target, and with a target its activation still Special Summons.
  - **② Other dependency.**
    - マクロコスモス: an optional activation-time Special Summon.
    - 光のピラミッド: its ACTIVATE operation links the Sphinxes present at activation, so the leave-field effect needs a model change.
    - Chain-response reachability of face-up declared cards still depends on `hasFieldActivatableEffect` (`fieldIgnition` for legacy scripts).
    - 血の代償: `duelActivateFromHand` has no defensive Trap guard. This is not reachable from the UI.
  - **③ Ruling unresolved.** None.
  - **Separate finding F5.** Activating 御前試合 or 群雄割拠 throws `r.violations is not a function`.
- **Practical effect.** In real duels, 104 Continuous/Field Spells and Traps can now be played. Before, most could not be activated at all, and the rest fired their effect illegally at activation. This matters most for 六武衆 (六武の門), Dragunity (竜の渓谷), BF (黒い旋風), and 一族の結束 decks.

## Measurement after the fix (U10 build)

- **Sweep.** 155 of 188 scripted Continuous/Field S/T can be activated as cards on an empty board. The 31 still refused are exactly the 30 A cards plus 光のピラミッド (②). The F5 exceptions are unchanged.

## Changed files

- `engine/30_processor_chain_battle.js`: the declaration registry and `cardActivationOnlyV32`; legality; preparation (`finishPrepare`, `CHAIN_ADD`, V11 / cost bypass); `duelActivateFromHand`; resolution.
- `engine/00_state_actions.js`: the `CHAIN_ADD` link flag.
- `engine/40_legal_script_engine.js`: the `collectHandlers` SEGOC exclusion.
- `cards/H2_claude_s03_card_activation.js`: new, the declaration table and classification basis. Registered in `build_manifest.json` after H1.
- **Tests corrected to the rule-correct path, intent unchanged.**
  - `tools/test_s03_u04_lock_recovery.js`: 竜の渓谷 under ライオウ now activates the card first, then its effect from the field, and still offers only the mill mode.
  - `tools/test_s03_u05_search_flags.js`: the ヴァルハラ assertion now also requires no pending choice and an empty chain after the card activation. This removes the false positive.
- `tools/test_s03_u10_card_activation.js`: new; wired into `tools/check.py`.
- **Generated:** `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The edits were applied by a guarded transform (every pattern had to match exactly once, or nothing was written). `dist/*.html` were not edited by hand.

## Verification

- **`node tools/test_s03_u10_card_activation.js`: EXIT 0, 33 PASS.**
  - Sweep: the table is loaded (104 names); every declared card activates as a card (no effect choice, no effect, no count use, face-up); every one replays OK.
  - 竜の渓谷: no mode or discard choice at card activation; face-up with nothing discarded or searched; 1/turn unused. Its effect is offered from the field (mode, then discard, then search), uses the 1/turn, and replays OK.
  - アポート: the card activation pays no LP and summons nothing; the effect pays 800 and Special Summons. Replay OK.
  - 木遁封印式: set activation with no release or target. Replay OK.
  - 一族の結束: can be activated with an empty GY; the +800 boost applies once face-up. Replay OK.
  - アイスバーン (set): not offered as a SEGOC trigger, but still a chain response.
  - 正統なる血統 (control): the activation requirement is kept, and the activation effect is kept.
  - VM2: the 竜の渓谷 card-activation state loads with a matching digest, the 1/turn is unused, and the effect can be activated after resuming.
- **Earlier dedicated tests on the U10 build.** U01–U09 = 56 / 76 / 57 / 39 (U04 corrected; was 38) / 46 / 21 / 32 / 34 / 18 PASS.
- **Affected legacy tests on the U10 build.** test_p11_activation_cards, test_p1_choice_recovery_minibatch, test_v560_batch08, test_v590_batch11, test_battle_cards, test_v840_batch35 and test_expansion_v350 all EXIT 0.
- **Full gate.** `python tools/check.py`: EXIT 0, **11875 PASS / 0 FAIL**; S03 audit off-target status changes = 0 (`s03_u10_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json` EXIT 0.

## Coverage

- TESTED 2064 / ENGINE_GAP 616 / NOT_STARTED 1304 / IMPLEMENTED 187 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2251.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `05bfc0e9be11d12e494cdfbe9f17c2fd95e9177c9c0d7ebe0d983b68f411d273` (595 files).
