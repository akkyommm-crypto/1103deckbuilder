# S03-U16 C-S03-13 COST_SELECTION_FIRST (Claude)

Base: `checkpoint_claude_s03_u15_summon_window_resume_20260912.zip`, SHA256 `bd5ed0b6be7b509febc1e318406756ff874656fc8c1e2b5379187ace6211e43b`.

## How it was found

- **While testing U15, 昇天の角笛 could not be activated on the real path.**
  - `prepareDuelActivation` pays `cost` before `selectTargets`, but its `cost` reads `ctx.selectedTargets`.
  - The activation stops with 「コストを払えません」, and the set card is left face-up with no chain.
- **Brace-matched scan** (scratchpad `cost_target_scan.js` / `cost_target_bodies.js`): 24 legacy scripts, all TESTED, have the same generated shape.
  - `selectTargets` picks the card used as **cost** (tribute, banish, discard, returned card); `cost` reads it.
  - Their TESTED status comes from `test_auto_cycle*` files that call condition / selectTargets / cost / resolve directly on one shared `ctx`, never through the real activation path.
- **Second loss** (`cost_ctx_extras.js` plus usage grep): 9 of the cost bodies write values on `ctx` that the resolution reads (for example `ctx.e4BanishedAtk`, `ctx.d5SyncLv`, `ctx.e6GrowLv`, `ctx.d4BanishedUid`).
  - Real resolution rebuilds `ctx` from the chain link (`preparedChainContext`), so these values were lost even when the activation somehow passed.

## Ruling basis and scope (local `1103_rulings_complete_v3_2`, 2011 wiki snapshots)

- **The choice is a cost for the declared 21 cards.** Their text says 「…して発動する／できる」 or 「…する事で」, and rulings confirm cost or effect classification where available:
  - ジュラック・ティラヌス (08/12/06: リリースはコスト; 起動効果);
  - ダーク・ダイブ・ボンバー (08/11/16: リリースはコスト);
  - ダーク・パーシアス (08/09/13: 除外はコスト);
  - アサルト・スピリッツ (10/12/11: 手札を墓地へ送るのはコスト; チェーンブロックを作る);
  - ビーストライザー (10/04/23–24: 「このカードのコストで除外」);
  - XX－セイバー ガトムズ and D・クリーナン (起動効果).
- **Excluded (3): chain-less Special Summon procedures written as effects.**
  - 異次元の精霊: wiki 10/11/17 「召喚ルール効果」; 10/11/15 the banish is part of the procedure, not a cost.
  - マジック・ストライカー: text 「除外し、手札から特殊召喚できる」.
  - パワー・ジャイアント: text 「墓地へ送り、手札から特殊召喚する事ができる」; wiki 11/08/12 インヴェルズ・ローチ can negate the Special Summon.
  - Making them activatable through a chain would open response windows that do not exist. They stay unusable and are recorded as CARD_WORK (convert to summon procedures).

## Measurement before the fix (U15 build)

The U16 test run on the published U15 build gave **1 PASS / 2 FAIL**, then threw.
- The first real case, キング・オブ・ビースト activated from the hand, showed 「コストを払えません」 and never offered the tribute choice.
- The declaration does not exist there.
- During U15, the same failure was seen for 昇天の角笛 in the summon-negation window.

## Requirement closure record

- **Requirement.** A script whose `selectTargets` picks the card used as cost can be activated on the real path:
  - the cost card is chosen, and the cost is paid;
  - the cost card is not left as a chain-link target, while a real target that the cost does not move stays;
  - values the cost records (original ATK, Level) reach the resolution.
- **Root cause (INTEGRATION_MISSING).**
  - The generated scripts assumed selection before cost; the engine pays cost first.
  - Resolution rebuilds `ctx` without anything recorded during cost.
- **Closure.**
  - **`engine/1O_cost_selection_first_s03.js`:** declaration set and before/after helpers.
  - **`cards/H4_claude_s03_cost_selection.js`:** 21 declared names, with the exclusion notes.
  - **`engine/30_processor_chain_battle.js` `prepareDuelActivation`,** for declared names only:
    1. `selectTargets`;
    2. record context keys and each selection's uid + zone;
    3. `cost`;
    4. drop selections whose card changed zone, and collect JSON primitives newly written on `ctx` into `ctx.costCtxS03`;
    5. `finishPrepare`.
    - The rule order itself (cost, then target) is unchanged. Only the cost card's selection comes first, and a real target that the cost does not move stays.
  - **`CHAIN_ADD`** carries `costCtxS03`. The reducer writes it only when non-empty, so earlier digests are unchanged.
  - **`preparedChainContext`** restores it onto the resolution `ctx` without overwriting existing keys.
- **Consumers.** キング・オブ・ビースト, 昇天の角笛, XX－セイバー ガトムズ, 吹き荒れるウィン, D・チャッカン, ジュラック・ティラヌス, ダーク・ダイブ・ボンバー, ヘル・ドラゴン, ギョッ!, フレムベルカウンター, ダーク・パーシアス, シンクロ・チェンジ, 泣き神の石像, ビーストライザー, ドラグニティナイト－ゲイボルグ, フューチャー・グロウ, ユニバード, 鬼ゴブリン, アサルト・スピリッツ, D・クリーナン, ジェムエレファント.
  - The 24 `test_auto_cycle*` direct-call tests are unchanged; the scripts themselves are not edited.
- **Recovery.** No status change. The cards were already TESTED; they now work on the real path. That makes their status accurate for these paths.
- **Dependent classification.**
  - **① Covered by the real-path test:**
    - キング・オブ・ビースト (tribute from the hand activation);
    - ビーストライザー (card activation, then effect; original ATK carried);
    - シンクロ・チェンジ (Level carried; Extra Deck summon negated);
    - 昇天の角笛 (negates a Normal Summon in the window);
    - アサルト・スピリッツ (not equipped: the real equip target stays).
  - **② Declared but not individually path-tested:** ガトムズ, 吹き荒れるウィン, D・チャッカン, ジュラック・ティラヌス, ダーク・ダイブ・ボンバー, ヘル・ドラゴン, ギョッ!, フレムベルカウンター, ダーク・パーシアス, 泣き神の石像, ゲイボルグ (Damage Step), フューチャー・グロウ, ユニバード, 鬼ゴブリン, D・クリーナン, ジェムエレファント.
    - They share the same code shape, so the engine change covers them. Each has its own timing conditions; a per-card real-path check remains to be done.
  - **③**
    - CARD_WORK: 異次元の精霊 / マジック・ストライカー / パワー・ジャイアント as summon procedures.
    - Pre-existing: an aborted activation leaves a set S/T face-up (not changed).
- **Practical effect.** Counter traps such as 昇天の角笛, ギョッ! and フレムベルカウンター, and cards such as キング・オブ・ビースト, ビーストライザー and シンクロ・チェンジ, can now actually be activated in a duel and apply their full effect. Before, every one of them stopped with 「コストを払えません」.

## Changed files

- `engine/1O_cost_selection_first_s03.js`: new; in the manifest after 1N.
- `cards/H4_claude_s03_cost_selection.js`: new; in the manifest after H3.
- `engine/30_processor_chain_battle.js`: declared branch in `prepareDuelActivation`; `costCtxS03` on `CHAIN_ADD`; restore in `preparedChainContext`.
- `engine/00_state_actions.js`: `CHAIN_ADD` reducer writes `costCtxS03` when non-empty.
- `tools/test_s03_u16_cost_selection_first.js`: new; wired into `tools/check.py`.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The edits were applied by a guarded transform (every pattern had to match exactly once; `--dry` first). `dist/*.html` were not edited by hand. Every card named in the test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_u16_cost_selection_first.js`.** EXIT 0, 18 PASS: declaration coverage; the 3 procedures not declared; the five real-path cases above, each with a Replay audit. On the unfixed U15 build: 1 PASS / 2 FAIL, then it threw.
- **Superseded first gate** (24 declared, before the ruling-based scope correction): not used for publication.
- **Full gate.** `python tools/check.py`: EXIT 0, **12034 PASS / 0 FAIL**. The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u16_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2253.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `a3fc6c0a9606475bc4eb449bd3d94d5601d3b636a82e465d767e259b046377fa` (615 files).
