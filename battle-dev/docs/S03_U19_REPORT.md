# S03-U19 C-S03-16 MONSTER_ACTIVATION_RESPONSE (Claude)

Base: `checkpoint_claude_s03_u18_activation_response_20260912.zip`, SHA256 `b042e94f1c6f0028fdb106a3764e20238b76956bc6d151bfc1871123882fe019`.

## How it was found

- **Follow-up of U18 ②.** The three monster negators declared in U18 (ネイビィロイド, ヂェミナイ・デビル, ジャスティス・ブリンガー) were still never offered as responses.
- **Probe (U18 build).**
  - `getChainResponsesV2` scans hand / field monsters only when `quickEffect===true`, and none of the three has it.
  - ネイビィロイド and ヂェミナイ・デビル are unified TRIGGER effects on `onActivateSuccess` with no legacy passive, so they could not be activated at all.
- **Second defect, found while testing ネイビィロイド.** Its condition checks that the activation targets its controller's Spell/Trap.
  - `API.activationTargets(event)` returned `[]` although the chain link of サイクロン targeted P1's set card.
  - `linkTargetsV19` read `t.uid` / `t.card.uid`, but chain links store targets in the serialized ref form `{__yg1103CardRefV2, ref:{uid}}`.
  - Every script that asks what an activation targets was affected: ネイビィロイド, ミドル・シールド・ガードナー, アルカナフォース0－THE FOOL.
- **Consequence of the decode fix, handled in the same unit.** ミドル・シールド・ガードナー and THE FOOL use the targets inside `onActivateSuccess` triggers. With the targets decoded they would start being offered late, after the activation had resolved. That is the same late-offer defect U18 removed, and neither card's automatic targeting negation is modelled correctly. They are now suppressed as late triggers, which keeps their current (unreachable) behaviour until they are implemented.

## Measurement before the fix (U18 build)

The U19 test run on the published U18 build gave **8 PASS / 6 FAIL**:
- ネイビィロイド is not listed and not legal (「この場所・タイミングで発動できる効果がありません」), and サイクロン destroys the set card;
- ヂェミナイ・デビル and ジャスティス・ブリンガー are not listed;
- the chain link of 死者への手向け does not decode to its target.

## Requirement closure record

- **Requirement.**
  - Monsters that respond to an activation (U18 declared) are offered as chain responses in the zone their text names, and negate it.
  - What an activation targets can be read from its chain link.
- **Root cause (INTEGRATION_MISSING).**
  - The monster response scan required `quickEffect`.
  - `linkTargetsV19` did not decode the serialized selection refs.
- **Closure.**
  - **`engine/30_processor_chain_battle.js` `getChainResponsesV2`:** declared activation-response monsters pass the `quickEffect` gate. Zone rules, speed ≥ 2 and legality with the top link's event (U18) still apply.
  - **`engine/1I_effect_category_v19.js` `linkTargetsV19`:** also reads `t.ref.uid`.
  - **`engine/1P_activation_response_s03.js`:** `declareActivationLateTriggerSuppressedS03` / `activationLateTriggerSuppressedS03`. `collectHandlers` (engine/40) skips `onActivateSuccess` for the U18 declared set plus this list.
  - **`cards/H5_claude_s03_activation_response.js`:** declares the suppression for ミドル・シールド・ガードナー and アルカナフォース0－THE FOOL.
- **Consumers.**
  - Response listing: ネイビィロイド, ヂェミナイ・デビル, ジャスティス・ブリンガー.
  - Target decode: every `API.activationTargets` user (ネイビィロイド; ミドル・シールド・ガードナー and THE FOOL, suppressed).
- **Recovery.** No status change (all TESTED); the three monster negators now work on the real path.
- **Dependent classification.**
  - **① Covered by the real-path test:**
    - ネイビィロイド vs サイクロン targeting P1's set card: listed; discard cost; サイクロン negated and destroyed; the set card survives.
    - ヂェミナイ・デビル vs 天使の施し: listed from the hand; sent as cost; 天使の施し negated with no draw for P2; P1 draws 1.
    - ジャスティス・ブリンガー vs a Special Summoned 真六武衆－ミズホ: listed; the effect is negated, so ジャスティス・ブリンガー is not destroyed; no late offer.
    - The 死者への手向け link decodes to ミドル・シールド・ガードナー, which is not offered late.
    - Replay audits.
  - **② Remaining.**
    - ミドル・シールド・ガードナー and アルカナフォース0－THE FOOL: their targeting negations need a correct model (automatic negation, not a trigger); suppressed as late triggers until then.
    - The 「発動した時」 non-negating responders (反魔鏡, トラップ・リアクター・RR, マジック・リアクター・AID, ウィングド・ライノ, 黒板消しの罠, 地獄の扉越し銃, トラップ・キャプチャー, マジック・キャプチャー) still need classification.
    - Legacy `API.selectCard` chooser player (from U18).
  - **③** None.
- **Practical effect.** ネイビィロイド, ヂェミナイ・デビル and ジャスティス・ブリンガー can now negate the opponent's activation in a duel. Effects that ask what an activation targets now see the real targets.

## Changed files

- `engine/30_processor_chain_battle.js`: monster response gate.
- `engine/1I_effect_category_v19.js`: serialized target decode.
- `engine/1P_activation_response_s03.js`: late-trigger suppression list.
- `engine/40_legal_script_engine.js`: `collectHandlers` uses the combined check.
- `cards/H5_claude_s03_activation_response.js`: suppression declaration.
- `tools/test_s03_u19_monster_activation_response.js`: new; wired into `tools/check.py`.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The edits were applied by guarded transforms (exactly-once patterns; `--dry` first). `dist/*.html` were not edited by hand. Every card named in the test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_u19_monster_activation_response.js`.** EXIT 0, 14 PASS. On the unfixed U18 build: 8 PASS / 6 FAIL.
  - Test-side corrections during the run: the ジャスティス・ブリンガー board uses 真六武衆－ミズホ, because レスキューラビット banishes itself as cost; the 死者への手向け cost choice is picked by candidate.
- **Full gate.** `python tools/check.py`: EXIT 0, **12105 PASS / 0 FAIL**. The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u19_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2253.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `76b7a176f8a4000e23c8f907b08861f1008ec7acd5eb197d211550861a6b1d03` (625 files).
