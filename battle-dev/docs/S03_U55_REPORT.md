# S03-U55 Normal Summon method replay completeness (Codex)

Base: `checkpoint_codex_s03_u54_dark_world_discard_event_20260915.zip`, SHA256 `71c5854c1a1e963c6f7a823bd03e6f91abaac5009e68a900ad96f33548e27c9d`.

## Why this unit

After U54, the remaining measured major fixed-list routes were:

- 【TG Gadget】 vs 1103兎ラギア: 14 / 14 completed, 14 / 14 Replay OK, blockers 0.
- 【Debris】 vs 1103兎ラギア: 14 / 14 completed, 14 / 14 Replay OK, blockers 0, with `リミット・リバース:activateSetManual` still unsupported in 5.
- 【Dark World】 vs 1103兎ラギア: 14 / 14 completed, 14 / 14 Replay OK, blockers 0 after U54.
- 【TG Skill】 vs 1103兎ラギア: 5 / 14 completed, 9 / 14 `REPLAY_DIVERGENCE`.

TG Skill was selected because the failures shared one Replay/actionization boundary around Normal Summon method state. Representative failures diverged at `EVENT_QUEUE_V31`, then after the first fix at `EVENT_DEQUEUE_V31`, and finally at `ATTACK_DECLARE_V48` when `神獣王バルバロス` had been summoned by its 0-tribute method and later negated by `エフェクト・ヴェーラー` or `スキルドレイン`.

## Closure

- `NORMAL_SUMMON` and `SET_MONSTER` actions now apply `summonMethod` state inside `engine/00_state_actions.js`.
- Direct post-`act()` calls to `applyNormalSummonMethod(...)` were removed from:
  - `engine/70_summon_procedures.js`
  - `engine/40_legal_script_engine.js`
- `engine/00_state_actions.js` now reconciles `procedureBaseStats` inside action replay after effect-negation or face-down expiry.
- `FX_CARD_FLAG_V46` also clears `loseOnNegate` procedure stats when a negation flag is applied.
- `tools/r1_duel_driver.js` now records richer action/digest diagnostics for future R1 blocker measurement.
- Added `tools/test_s03_u55_normal_summon_method_replay.js` and wired it into `tools/check.py`.
- Promoted `神獣王バルバロス` from `IMPLEMENTED` to `TESTED` in `data/s03_status_changes.json`.

## Dedicated Test

`node tools/test_s03_u55_normal_summon_method_replay.js` -- EXIT 0.

Covered:

- `NORMAL_SUMMON` with `summonMethod:'barbaros0'` applies `procedureBaseStats` and leaves `神獣王バルバロス` at ATK 1900 before event queue replay.
- Queued summon events replay cleanly.
- `FX_CARD_FLAG_V46` negation clears the summon-method stat override and restores ATK 3000.
- Event dequeue after that negation replays cleanly.
- Face-up `スキルドレイン` causes the same action to reconcile away the summon-method stats.
- `SET_MONSTER` records the set-side summon method and replays cleanly.

## Real-Duel Effect

Focused R1 resweep after the fix:

- 【TG Skill】 vs 1103兎ラギア, Astra fixed lists, responder mode.
- Seeds `0x52311301`-`0x52311307`, both first players.
- Result: 14 / 14 completed, 14 / 14 Replay OK, unsupported/manual-only actions 0, blockers 0.

This closes the post-U54 TG Skill replay-divergence cluster (previously 5 / 14 completed, 9 / 14 replay failures).

## Gate

- `python tools/check.py` -- EXIT 0, 12753 PASS / 0 FAIL, no Traceback. Log: `s03_u55_full_gate.log`.
- `python tools/script_coverage.py`:
  - TESTED 2090
  - ENGINE_GAP 613
  - NOT_STARTED 1301
  - IMPLEMENTED 172
  - GENERIC_OK 644
  - PARTIAL 176
  - TOTAL 4996
- `python tools/s03_status_audit.py` -- EXIT 0:
  - declared status changes observed: 41
  - off-target status changes: 0
  - promoted cards keep card registrations
  - promoted cards seen by declared tests
  - TOTAL 4996
- `python tools/build_acode.py data/carddata.json` -- EXIT 0, cards=4996:
  - raw `dist/battle.html` SHA256 `fb894b0856f6336fbb884d028d84c962083014d23efb534eec3a320ef5d1db73`
  - raw `dist/battle_acode.html` SHA256 `c64c47d49aadac1747d31c970f2076107bc19037783994f26027e6c3ac01be2a`
  - build-script LF-normalized `dist/battle.html` digest `c5a98adb30740b4936c3cc8223221b078a6eb3835ce71f103814b75a2382f90b`
  - build-script LF-normalized `dist/battle_acode.html` digest `f0c052d6947ddda2972730cdc729d6b51015c13bbf270b9ed231e9e3abc8c3c5`

## Source Hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips, and this report set aside): `ce362108f270c35b180487f452386297ed151618f327bf076ee35c05a858fcd8` (748 files).

## Remaining

- U55 resolves the measured TG Skill Normal Summon method Replay divergence.
- The next measured unsupported/manual-only cluster is 【Debris】 `リミット・リバース:activateSetManual`.
- The next unit should measure that Debris cluster only as far as needed, then implement the highest-value shared activation path rather than repeating the U53/U54 audits.
