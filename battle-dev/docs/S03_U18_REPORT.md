# S03-U18 C-S03-15 ACTIVATION_RESPONSE_EVENT (Claude)

Base: `checkpoint_claude_s03_u17_chainless_procedures_20260912.zip`, SHA256 `7bba589aaca69cc4057ec596f7a840fad57ba08c1d5c0434d429e0a0b81bc175`.

## How it was found

- Started as the U16 ② per-card path check of the counter traps ギョッ! and フレムベルカウンター.
- **Probe 1 (real path, U17 build).**
  - P2 activates サイクロン with P1's set フレムベルカウンター and a FIRE DEF 200 monster in P1's GY. P1's response list is empty, and legality from the S/T Zone fails with 「魔法・罠カードが発動した時に発動します」. サイクロン resolves and destroys the set card.
  - ギョッ! against P2's レスキューラビット effect behaves the same way.
- **Probe 2 (late offer).** After レスキューラビット's effect has resolved and the chain is empty, ギョッ! is offered as a SEGOC trigger from the deferred `onActivateSuccess`. Picking it pays its cost and resolves with nothing to negate.
- **Cause.**
  - These scripts read the activation from `ctx.event`, but the chain-response path passes no event (`getChainResponsesV2` and `duelActivateFromZone` use `{}`).
  - The `onActivateSuccess` event is drained only after the chain.
- **Cluster** (scratchpad `activation_event_scan2.js`): 52 scripts, all TESTED, use `onActivateSuccess`.
  - 23 negate activations, and all 23 read `ctx.event` in condition and resolve.
  - The other 29 are 「発動する度に」 or 「発動した時」 reactions with mixed semantics.

## Measurement before the fix (U17 build)

The U18 test run on the published U17 build gave **4 PASS / 11 FAIL**:
- フレムベルカウンター, ギョッ! and 魔力終了宣告 are never in the response list;
- サイクロン destroys its target, レスキューラビット Special Summons, and 六武の門 resolves;
- フレムベルカウンター and ギョッ! are offered late as triggers (in the no-response case too);
- the declaration does not exist.

## Requirement closure record

- **Requirement.** A card that negates an activation can be activated as a chain response to that activation while it is on the chain, and resolves against it. It is not offered afterwards as a late trigger.
- **Root cause (INTEGRATION_MISSING).**
  - The response path did not supply the activation event these scripts depend on.
  - The deferred trigger path offered them after the target had resolved.
- **Closure.**
  - **`engine/1P_activation_response_s03.js`:** declaration set, top-link activation event (`makeActivationEventV12`), response options.
  - **`cards/H5_claude_s03_activation_response.js`:** 21 declared names.
  - **`engine/30_processor_chain_battle.js`.**
    - `getChainResponsesV2` judges declared scripts with the top link's activation as `ctx.event`.
    - `prepareDuelActivation` adds the same event to `opts`. `CHAIN_ADD` keeps it, so resolution negates the right link.
  - **`engine/40_legal_script_engine.js` `collectHandlers`:** declared scripts are not collected for `onActivateSuccess`.
  - With no chain, no event is made and the scripts stay illegal.
- **Consumers (21).**
  - Counter traps: 王宮の陥落, 魔力終了宣告, 蛇神の勅命, 威風堂々, ダメージ・ポラリライザー, フュージョン・ガード, ゴブリンのその場しのぎ, 誤作動, ギョッ!, フレムベルカウンター, アーマーブレイク, オーバーウェルム, マジック・ジャマー, マジック・ドレイン, 鋼核の輝き.
  - Normal traps: 墓場からの呼び声, グリフォンの翼. Quick-Play Spell: 壺盗み.
  - Monsters: ネイビィロイド, ヂェミナイ・デビル, ジャスティス・ブリンガー.
- **Recovery.** No status change (all TESTED); the declared cards now work on the real path. Their existing direct-call tests are unchanged.
- **Dependent classification.**
  - **① Covered by the real-path test:**
    - フレムベルカウンター vs サイクロン: the response is listed; the cost uses U16's order; the link carries the activation event; サイクロン is negated and destroyed and P1's other set card survives; no late offer.
    - ギョッ! vs レスキューラビット: the effect is negated, with no Special Summon; the cost returns アクア・スネーク to the Deck; no late offer.
    - No response: レスキューラビット resolves and ギョッ! stays set, not offered.
    - Unified 魔力終了宣告 vs 六武の門's card activation: negated and destroyed.
    - Replay audits.
  - **② Remaining.**
    - The 17 other declared scripts are not individually path-tested. The monster negators (ネイビィロイド, ヂェミナイ・デビル, ジャスティス・ブリンガー) also depend on `getChainResponsesV2` listing their zone, which needs `quickEffect` or speed ≥ 2 and the zone rules; not yet measured.
    - Not declared and still to be classified with rulings: ミドル・シールド・ガードナー and アルカナフォース0－THE FOOL (reactions to targeting effects); the non-negating 「発動した時」 responders 反魔鏡, トラップ・リアクター・RR, マジック・リアクター・AID, ウィングド・ライノ, 黒板消しの罠, 地獄の扉越し銃, トラップ・キャプチャー, マジック・キャプチャー.
    - Side finding: legacy `API.selectCard` records the active player as chooser during an opponent-turn response (cosmetic in hot-seat play).
  - **③** None.
- **Practical effect.** Counter traps and similar negators such as マジック・ジャマー, 魔力終了宣告, 王宮の陥落, フレムベルカウンター and ギョッ! can now actually negate the opponent's activation in a duel. Before, they could never be activated in time and were wasted if activated late.

## Changed files

- `engine/1P_activation_response_s03.js`: new; in the manifest after 1O.
- `cards/H5_claude_s03_activation_response.js`: new; in the manifest after H4.
- `engine/30_processor_chain_battle.js`: response legality and prepare-time event.
- `engine/40_legal_script_engine.js`: `collectHandlers` skip.
- `tools/test_s03_u18_activation_response.js`: new; wired into `tools/check.py`.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The edits were applied by a guarded transform (exactly-once patterns; `--dry` first). `dist/*.html` were not edited by hand. Every card named in the test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_u18_activation_response.js`.** EXIT 0, 15 PASS. On the unfixed U17 build: 4 PASS / 11 FAIL.
- **Full gate.** `python tools/check.py`: EXIT 0, **12091 PASS / 0 FAIL**. The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u18_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2253.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `d3b5a51c27f40353c9d86986968930bffef878fd3ffc6beff787502670a1bfaa` (623 files).
