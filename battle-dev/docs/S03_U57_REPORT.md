# S03-U57 Attack declaration battle context (Codex)

Base: local U56 work tree, after `リミット・リバース` scripted activation. Shared publication was still at U55 when this unit began, so U57 publication also supplements the missing U56 shared checkpoint before making U57 latest.

## Why this unit

After U56, additional fixed-list probes found no fresh blocker:

- 【BF】 vs 1103兎ラギア: 14 / 14 completed, 14 / 14 Replay OK, unsupported/manual-only actions 0, blockers 0.
- 【Agent】 vs 1103兎ラギア: 14 / 14 completed, 14 / 14 Replay OK, unsupported/manual-only actions 0, blockers 0.
- 【HERO】 vs 1103兎ラギア: 14 / 14 completed, 14 / 14 Replay OK, unsupported/manual-only actions 0, blockers 0.

The next highest-value ready common Requirement was `C-S03-32 ATTACK_DECLARATION_INFO`: attack-declaration cards depended on `gameState.battle`, `battleContextV28()`, `API.battleContext()`, or `API.redirectAttack()`, but DUEL creates `gameState.battle` only after the attack-declaration response window, when Damage Step begins. That left a class of already-scripted attack-declaration cards unable to read the declared attack in the real DUEL path, and `API.redirectAttack()` still mutated battle state directly.

## Closure

- `currentBattleIdentityV6()` now falls back to `gameState.pendingAttack` and returns attacker uid, defender uid, direct flag, owners, and `step:'attackDeclare'` before Damage Step exists.
- `battleContextV28()` now returns pending attack card handles and names at the attack-declaration POINT without creating `gameState.battle` early.
- `API.redirectAttack()` now records redirects through Actions:
  - `ATTACK_PENDING_RETARGET_S03` while the attack is pending.
  - `BATTLE_REDIRECT_V6` while `gameState.battle` exists.
- `ATTACK_PENDING_RETARGET_S03` can store pure-JSON `redirectV6` metadata.
- Direct-redirect attacks such as `アストラルバリア` no longer trigger attack replay merely because defender monsters remain on the field.
- DUEL activation preparation now preserves the v4 effect key selected during legality checking, so attack-declaration effects resolve as the same effect that was proven legal.
- At an attack-declaration POINT, event-specific `onAttackDeclare` activation is preferred over the generic "card activation only" path for declared Continuous Traps.
- Added `tools/test_s03_u57_attack_declaration_info.js` and wired it into `tools/check.py`.
- Marked the U57 test as a common-engine regression in `tools/script_coverage.py`, so it does not promote card statuses by name.

No card-specific status was promoted in this unit; S03 declared status changes remain 42.

## Dedicated Test

`node tools/test_s03_u57_attack_declaration_info.js` -- EXIT 0.

Covered:

- DUEL reaches the attack-declaration POINT before `gameState.battle` exists.
- `API.battleContext()` exposes the pending attacker / defender uid and `step:'attackDeclare'`.
- `battleContextV28()` exposes pending attack card handles.
- `アストラルバリア` is offered, resolves as `onAttackDeclare`, journals `ATTACK_PENDING_RETARGET_S03` with `{toDirect:true}`, and proceeds as a direct attack without attack replay despite defender monsters.
- `地縛霊の誘い` is offered and journals a target uid change before Damage Step.
- `ディフェンド・スライム` is offered and redirects the attack target to `リバイバルスライム`.
- All three paths replay cleanly.

## Gate

- `python tools/check.py` -- EXIT 0, 12777 PASS / 0 FAIL, no Traceback. Log: `s03_u57_full_gate.log`.
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
  - raw `dist/battle.html` SHA256 `d6f351b1943f5c2b4516ac4b659ec5df6422109dd2767b0292cce26b27beeb64`
  - raw `dist/battle_acode.html` SHA256 `a1e30c9aae8b774839c080a02d3237bd9391503dcc3ecfc89775461368d02c32`
  - build-script LF-normalized `dist/battle.html` digest `99a4bb905b3b3a3f31e95ad55eea478025b0e577f9a305bfa31aeeb7b68f8516`
  - build-script LF-normalized `dist/battle_acode.html` digest `9de3fbf3d815129b88fccd59df4008ac0330b7d861344d1ed0fd92bde80ca6cc`

## Source Hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips, and this report set aside): `25414a931205449ff0b8ab6aad83b9ffd546ae2c0da10cc4beb6bc465b9558fb` (753 files).

## Remaining

- U57 closes the shared attack-declaration information/redirect plumbing gap for scripted attack-declaration cards without creating `gameState.battle` early.
- Continue measurement-first major fixed-list/preset routes and pick the highest-value shared Requirement from the first fresh blocker, replay divergence, or unsupported/manual-only action.
