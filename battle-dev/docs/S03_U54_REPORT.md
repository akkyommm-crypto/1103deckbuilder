# S03-U54 Dark World discard event binding (Codex)

Base: `checkpoint_codex_s03_u53_instant_fusion_20260914.zip`, SHA256 `7b20f34a2d27953bf39cf4fe88260f99a36deb1c2fc7ace0d2d8a7a9fffa08ce`.

## Why this unit

After U53, the remaining major fixed-list routes were measured just far enough to find the first high-value blockers:

- 【TG Gadget】 vs 1103兎ラギア: 14 / 14 completed, 14 / 14 Replay OK, blockers 0.
- 【Debris】 vs 1103兎ラギア: 14 / 14 completed, 14 / 14 Replay OK, blockers 0, with `リミット・リバース:activateSetManual` still unsupported in 5.
- 【Dark World】 vs 1103兎ラギア: 10 / 14 completed, blockers 4, all `RESPOND_LOOP`.
- 【TG Skill】 vs 1103兎ラギア: 5 / 14 completed, blockers 9, all `REPLAY_DIVERGENCE`.

The Dark World stops were selected first because they were a common discard-trigger engine/card boundary and clustered on normal deck-path play. Stopped examples repeatedly offered `暗黒界の術師 スノウ`, `暗黒界の龍神 グラファ`, or `暗黒界の尖兵 ベージ` from the GY on an unrelated later discard, then refused the Spell Speed 1 trigger inside an existing chain.

## Closure

- Tightened `darkWorldDiscard(ctx)` in `cards/20_control_counter.js`.
- The helper now returns a Dark World discard mode only while processing `eventName === 'onDiscard'`.
- It requires the current event `card` or journal-safe `uid` to match `ctx.card`.
- Outside the actual discard trigger event it returns `null`, keeping `暗黒界の龍神 グラファ`'s normal GY Special Summon procedure separate from its discard-trigger destruction effect.
- Added `tools/test_s03_u54_dark_world_discard_event.js` and wired it into `tools/check.py`.
- Promoted the six shared-helper Dark World cards below from `IMPLEMENTED` to `TESTED` in `data/s03_status_changes.json`:
  - `暗黒界の狩人 ブラウ`
  - `暗黒界の武神 ゴルド`
  - `暗黒界の軍神 シルバ`
  - `暗黒界の尖兵 ベージ`
  - `暗黒界の術師 スノウ`
  - `暗黒界の龍神 グラファ`
- Copied the remaining verified major-deck fixed lists into `data/r1_lists/`: `dark`, `debris`, `tg_gadget`, `tg_skill`.

## Dedicated Test

`node tools/test_s03_u54_dark_world_discard_event.js` — EXIT 0.

Covered:

- Stale `discardInfo` on Dark World cards in the GY does not offer triggers on an unrelated `onDiscard` event.
- Each covered Dark World card is still offered on its own effect-discard event.
- The uid-only event payload used by the Replay-safe event journal follows the same matching rule.
- `暗黒界の龍神 グラファ` with stale old discard metadata is legal from the GY as its normal Special Summon procedure, asks for Dark World fodder to return as cost, Special Summons itself, and does not destroy the opponent's field card.
- Real-duel pinned blocker seed `0x52311003`, first player 0, `R1_DECKS=dark,rabbit`, responder mode completes with no blocker, no unsupported action, and Replay OK.

## Real-Duel Effect

Focused R1 resweep after the fix:

- 【Dark World】 vs 1103兎ラギア, Astra fixed lists, responder mode.
- Seeds `0x52311001`-`0x52311007`, both first players.
- Result: 14 / 14 completed, 14 / 14 Replay OK, unsupported/manual-only actions 0, blockers 0.
- This closes the post-U53 Dark World measurement cluster (previously 4 / 14 `RESPOND_LOOP` blockers).

The other measured queues are intentionally not reclassified by this unit:

- 【TG Skill】 still has a replay-divergence cluster around summon/event queue replay and remains the next highest-value measured blocker.
- 【Debris】 still records `リミット・リバース:activateSetManual` as unsupported/manual-only.

## Gate

- `python tools/check.py` — EXIT 0, 12745 PASS / 0 FAIL, no Traceback. Log: `s03_u54_full_gate.log`.
- `python tools/script_coverage.py`:
  - TESTED 2089
  - ENGINE_GAP 613
  - NOT_STARTED 1301
  - IMPLEMENTED 173
  - GENERIC_OK 644
  - PARTIAL 176
  - TOTAL 4996
- `python tools/s03_status_audit.py` — EXIT 0:
  - declared status changes observed: 40
  - off-target status changes: 0
  - promoted cards keep card registrations
  - promoted cards seen by declared tests
  - TOTAL 4996
- `python tools/build_acode.py data/carddata.json` — EXIT 0, cards=4996:
  - raw `dist/battle.html` SHA256 `5115ee9a79a631f192bd556dca52cbe16f7160111bc4d2a3d24655984241aede`
  - raw `dist/battle_acode.html` SHA256 `c055f82153b70c789f7966946f369415b06b242e44d67247c9d3fb32aee6d5e9`
  - build-script LF-normalized `dist/battle.html` digest `9e9ce9b4da8de3c71b69862a8b397dc583eab8abb7ef19600290080efbce042e`
  - build-script LF-normalized `dist/battle_acode.html` digest `9bb90b916cc6d6048bc421534fcb5399c387aeda1360ae881fcdf9ee8012ae22`

## Source Hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips, and this report set aside): `746613f6109dd7e41c220aaf4be7bbd65856ddb03b371c544186bd4e25830dff` (746 files).

## Remaining

- U54 resolves the measured Dark World stale discard-trigger loop.
- The next measured high-value blocker is 【TG Skill】 vs 1103兎ラギア replay divergence (`EVENT_QUEUE_V31` after summon-window/event replay).
- The next measured unsupported/manual-only cluster is 【Debris】 `リミット・リバース:activateSetManual`.
