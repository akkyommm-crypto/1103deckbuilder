# S03-U56 Limit Reverse scripted activation (Codex)

Base: `checkpoint_codex_s03_u55_normal_summon_method_replay_20260915.zip`, SHA256 `1c229a270ccde0aeae4914af986f0871def8366e28e14a2737e7ec94e3e0c9ca`.

## Why this unit

After U55, the already-measured major fixed-list routes showed no blockers and no replay divergence. The remaining measured manual-only gap was:

- 【Debris】 vs 1103兎ラギア: 14 / 14 completed, 14 / 14 Replay OK, blockers 0.
- Unsupported/manual-only action: `リミット・リバース:activateSetManual` in 5 / 14 routes.

This was selected because it was the next common real-duel path still escaping into manual set-trap activation. The card appears at three copies in the Debris fixed list, so removing the fallback improves an actual major deck route rather than an isolated fixture.

## Closure

- Added `cards/HE_claude_s03_u56_limit_reverse.js`.
- `リミット・リバース` now has a DUEL `ACTIVATE` path from a set Continuous Trap.
- The activation targets an own GY monster with ATK 1000 or less, Special Summons it in Attack Position, and leaves the trap face-up.
- The trap and revived monster are linked through the existing v9 mutual leave-link state.
- If the linked monster becomes Defense Position, both the monster and `リミット・リバース` are destroyed.
- If either linked card leaves the field, the other is destroyed by the mutual link.
- Added `tools/test_s03_u56_limit_reverse.js` and wired it into `tools/check.py`.
- Added a focused coverage rule so the U56 fixture monsters do not accidentally promote unrelated cards to TESTED.
- Promoted `リミット・リバース` from `NOT_STARTED` to `TESTED` in `data/s03_status_changes.json`.

## Dedicated Test

`node tools/test_s03_u56_limit_reverse.js` -- EXIT 0.

Covered:

- A set `リミット・リバース` offers scripted `activateSet`, not `activateSetManual`.
- Activation revives a legal ATK 1000-or-less monster from the controller's GY in Attack Position.
- The trap and revived monster receive replay-safe v9 JSON mutual links.
- Activation and link creation replay cleanly.
- A linked monster changing to Defense Position offers and resolves the trap trigger, destroying both cards.
- The Defense Position branch replays cleanly.
- Destroying the revived monster destroys the trap through the mutual link.
- Removing the trap destroys the revived monster through the mutual link.

## Real-Duel Effect

Focused R1 resweep after the fix:

- 【Debris】 vs 1103兎ラギア, fixed lists v1, responder mode.
- Seeds `0x52311101`-`0x52311107`, both first players.
- Result: 14 / 14 completed, 14 / 14 Replay OK, unsupported/manual-only actions 0, blockers 0.
- The sweep includes an opening-hand `リミット・リバース` case that now completes through the scripted activation route.

This closes the measured Debris `リミット・リバース:activateSetManual` cluster, previously observed in 5 / 14 otherwise completed routes.

## Gate

- `python tools/check.py` -- EXIT 0, 12762 PASS / 0 FAIL, no Traceback. Log: `s03_u56_full_gate.log`.
- `python tools/script_coverage.py`:
  - TESTED 2091
  - ENGINE_GAP 613
  - NOT_STARTED 1300
  - IMPLEMENTED 172
  - GENERIC_OK 644
  - PARTIAL 176
  - TOTAL 4996
- `python tools/s03_status_audit.py` -- EXIT 0:
  - declared status changes observed: 42
  - off-target status changes: 0
  - promoted cards keep card registrations
  - promoted cards seen by declared tests
  - TOTAL 4996
- `python tools/build_acode.py data/carddata.json` -- EXIT 0, cards=4996:
  - raw `dist/battle.html` SHA256 `75a7d3b0db7e707134264e69d73a73d63d02bf739d184689223f03db5ca1e9c7`
  - raw `dist/battle_acode.html` SHA256 `a1e30c9aae8b774839c080a02d3237bd9391503dcc3ecfc89775461368d02c32`
  - build-script LF-normalized `dist/battle.html` digest `f1675f9a8a0f3ad5a94593f4c5016bf95f53a7f7fbbffc7e2cbfbf8d3752d86c`
  - build-script LF-normalized `dist/battle_acode.html` digest `475384a1eb9177766c9ea7cf70ce9e6596d680d878d82343d9b580b0289597cc`

## Source Hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips, and this report set aside): `26ff5dec299873fce548eddf04b3108c0c5342013839a646e90cf1409df4e0de` (751 files).

## Remaining

- U56 resolves the measured Debris `リミット・リバース` manual-only activation gap.
- The next unit should measure major fixed-list/preset routes beyond the already-clean Dragunity, 六武衆, TG Gadget, Dark World, TG Skill, and Debris pairs, then select the highest-value shared Requirement from the first fresh blocker, replay divergence, or unsupported/manual-only action.
