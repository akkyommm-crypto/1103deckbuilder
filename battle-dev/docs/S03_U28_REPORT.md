# S03-U28 C-S03-24 TARGETING_NEGATION (Claude)

Base: `checkpoint_claude_s03_vs6_battle_negation_slice_20260912.zip`, SHA256 `a9d470ef1cc2862efc6a4bf5d867322ba498bb079b4ab2e74c172ef73f36209b`.

## How it was found

- **C-S03-16 ② (from U19).** ミドル・シールド・ガードナー and アルカナフォース0－THE FOOL were scripted as `onActivateSuccess` trigger effects. U19 had to suppress them as late triggers, so neither negated anything.
- **Texts.**
  - ミドル・シールド・ガードナー: 「裏側表示のこのモンスター1体を対象とする魔法カードの発動を無効にする。その時、このカードは表側守備表示になる。」
  - アルカナフォース0－THE FOOL: 「●表:このカードを対象にする自分のカードの効果を無効にし破壊する。●裏:このカードを対象にする相手のカードの効果を無効にし破壊する。」
- **Ruling source (2011 wiki).** THE FOOL's heads/tails effects are 永続効果 (continuous effects) (08/02/23). No local ruling was found for MSG; the declaration follows its text (any player's Spell card).
- **Source measurement.**
  - DUEL activations are put on the chain by `CHAIN_ADD` in `commitPreparedActivationV11` and in `prepareDuelActivation` (`finishPrepare`), with serialized targets.
  - `negateChainLinkV13` journals `CHAIN_NEGATE_LINK` (activation or effect) and can destroy the source with `FX_TO_GRAVE`.
  - THE FOOL's coin toss is a working summon trigger that records `e9FoolCoin` (1 heads, 2 tails).

## Measurement before the fix

- The corrected U28 test with the new hook disabled (pre-fix behaviour) gives **11 PASS / 4 FAIL**. The four functional cases fail:
  - MSG destroyed by シールドクラッシュ;
  - MSG destroyed by 死者への手向け;
  - THE FOOL destroyed by P2's ソウルテイカー on tails;
  - P1's own ハーフ・シャット not negated on heads.
- The Trap control and all Replay audits pass.
- The first test draft on the VS6 build had two test-side errors, both corrected:
  - the active player and phase were set after the Replay baseline;
  - 死者への手向け was wrongly used as a Trap control; it is a Normal Spell.

## Requirement closure record

- **Requirement.** Continuous effects that negate an activation or effect targeting the card apply automatically when that activation is put on the chain, without a chain block.
  - MSG (face-down) negates the activation of a Spell card targeting it and becomes face-up Defense Position.
  - THE FOOL negates the effect of its controller's (heads) or the opponent's (tails) card targeting it, and destroys that card.
- **Root cause (MODEL_WRONG).** The continuous negations were modelled as trigger effects, which cannot respond at the right time and were suppressed.
- **Closure.**
  - **`engine/1T_targeting_negation_s03.js` (new):** `declareTargetingNegatorS03(name, {applies, after})` and `applyTargetingNegatorsS03()`. Right after a link is added, its decoded targets in the Monster Zone are checked for a declared negator (not effect-negated). When `applies` holds, `negateChainLinkV13` negates the link (and destroys the source if requested), then `after` runs, using Actions.
  - **`engine/30_processor_chain_battle.js`:** the hook runs after both DUEL `CHAIN_ADD` sites.
  - **`cards/H7_claude_s03_targeting_negation.js` (new):**
    - MSG: a Spell card targeting face-down MSG → activation negated; `FX_SET_STATE` face-up DEF.
    - THE FOOL: face-up, and the link's player matches its coin side → effect negated, source destroyed.
  - The old trigger scripts stay suppressed (S03-U19).
- **Consumers.** ミドル・シールド・ガードナー, アルカナフォース0－THE FOOL.
- **Recovery.** No status change (both TESTED). Their negation now works in real duels.
- **Dependent classification.**
  - **① Covered by the real-path test (each with a Replay audit):**
    - MSG vs シールドクラッシュ and vs 死者への手向け (a Spell with a discard cost): negated, MSG face-up DEF, no chain block for MSG;
    - control: face-up MSG is destroyed;
    - control: the Trap 六芒星の呪縛 is not negated;
    - THE FOOL tails vs P2's ソウルテイカー: negated and destroyed, no LP change;
    - THE FOOL heads vs its controller's ハーフ・シャット: negated and destroyed;
    - THE FOOL heads vs the opponent's ハーフ・シャット: not negated.
  - **② Remaining.**
    - Activations added through the manual / legacy `CHAIN_ADD` paths (engine/20, engine/40 `addChainLink`, engine/70) are not hooked; DUEL mode uses the two hooked paths.
    - A Spell card whose activation MSG negated: whether it is sent to the GY at resolution follows the existing negated-link handling (not asserted here).
    - No 2011 ruling found for MSG against its own controller's Spell cards; the declaration follows the text.
  - **③** None.
- **Practical effect.** In a duel, a face-down ミドル・シールド・ガードナー survives Spell cards that target it, and アルカナフォース0－THE FOOL negates and destroys the cards its coin toss names.

## Changed files

- `engine/1T_targeting_negation_s03.js`: new; registered in `build_manifest.json`.
- `cards/H7_claude_s03_targeting_negation.js`: new; registered in `build_manifest.json`.
- `engine/30_processor_chain_battle.js`: hook after both CHAIN_ADD sites.
- `tools/test_s03_u28_targeting_negation.js`: new; wired into `tools/check.py` after VS6.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The engine edits were applied by a guarded transform (exactly-once patterns; `--dry` first; scratchpad `u28_transform.py`). `dist/*.html` were not edited by hand. Every card named in the test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_u28_targeting_negation.js`.** EXIT 0, 15 PASS. With the hook disabled (pre-fix behaviour): 11 PASS / 4 FAIL.
  - Regression suites on the same build: U13 (8), U18 (15), U19 (14), U27 (10), VS4 (25), VS6 (11), `test_auto_cycle28` (80), `40` (45): all EXIT 0.
- **Full gate.** `python tools/check.py` (with S03-U28): EXIT 0, **12283 PASS / 0 FAIL** (VS6's 12268 + U28 15). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u28_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Status counts unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2253.
- `data/script_coverage.json` differs from VS6 only in test-evidence lists, which now include the U28 test file. No status changes.
- Gated source manifest SHA256 (excluding dist/ and *.log, with this report set aside): `7fc1c07a6328fc8ef3d29c4883e2dc94a3cbae102cf5dea9dff6afd1407ed1ee` (655 files).
