# S03-U150 — 立ちはだかる強敵's lock for the rest of the turn; legacy choices answered by the effect's controller

## Why
- 立ちはだかる強敵 (TESTED), text: 「発動ターン相手は選択したモンスターしか攻撃対象にできず、全ての表側攻撃表示モンスターで選択した
  モンスターを攻撃しなければならない」.
  - Its script redirected the current attack and wrote `BATTLE_GRANT_V6` 'lock' (`battlePermission.attackLockUid` /
    `attackLockTurn`).
  - The lock was read nowhere, the same pattern as the 'multi' grant fixed in U149. For the rest of the turn the opponent could
    attack any monster or attack directly, and no monster had to attack the selected one.
- Found while testing it in a real duel: the **target of the Trap was chosen by the turn player**, i.e. the opponent of the
  Trap's controller.
  - `requestChoiceV49` defaults `player` to `gameState.activePlayer`, and the legacy `API.selectCard` / `selectPlayer` /
    `selectZone` / `confirm` never passed one.
  - So every such choice made by an effect of the non-turn player was put to the wrong player. Examples: a Trap or Quick-Play
    effect activated in the opponent's turn, its target chosen at activation or resolution.
  - For effects of the turn player (most Main Phase activity) the default happened to be right.

## Change
- New `engine/1ZR_forced_attack_target_s03.js`. While a face-up monster in player X's Monster Zone carries this turn's lock
  (`battlePermission` is zone-local, so the restriction ends when that monster leaves the field), player Y:
  - may choose only that monster as an attack target; no other monster and no direct attack. Wired into the target list
    (`battleTargetsV29`), the attack request check and the battle-replay pick (engine/30);
  - must attack it with every face-up Attack Position monster that can attack (`mustAttackNow`, engine/00, which feeds the
    existing `pendingMustAttack` confirmation when leaving the Battle Phase).
- `legacyChooserS03()` (same file) returns the effect's controller:
  - the activating player during the activation preparation (`ACTIVATION_PREP_S03`);
  - otherwise the controller of the resolving effect (`P3_EFFECT_CONTEXT`, set for chain resolution and `runScript`);
  - outside an effect it is undefined, which keeps the old default.

  `API.selectCard` / `selectPlayer` / `selectZone` / `confirm` (engine/40) pass it as the choice's `player`.

## Test — `tools/test_s03_u150_forced_attack_target.js` 10/0 (real DUEL path, Replay-audited)
- A — player II's ゴブリン突撃部隊 attacks ワイト; player I activates 立ちはだかる強敵 at the attack declaration (the UI path
  `pointActivateV27`) and selects ビッグ・シールド・ガードナー:
  - **player I** is asked for the target;
  - the attack is redirected (300 damage to player II);
  - for the rest of the turn only ビッグ・シールド・ガードナー is offered and there is no direct attack;
  - デーモンの召喚 must attack; its attack on ワイト is refused; its attack on ビッグ・シールド・ガードナー goes through (100 damage);
  - afterwards no monster must attack.
- B — control without the Trap: both monsters are targets, nothing must attack, and デーモンの召喚 attacks ワイト.
- Negative control on U149 (`dist/battle.html` + this test): 5 FAIL, 0 errors:
  - the chooser (player II);
  - the target list;
  - the must-attack;
  - the refusal;
  - the damage (the second attack went to ワイト).

## Flaky test made deterministic
- The first U150 gate run failed in `tools/test_s03_vs5_battle_trigger_slice.js` (T5: 「ハイドロゲドン」 trigger not offered; `seen:[]`).
  The test passes 16/16 alone and passed in the pre-scan, so the failure was not caused by this unit.
  - Cause: the duel RNG is seeded from `Date.now()` (`v41SeedFromNow`) unless a test sets a seed.
  - The Deck shuffle after T3's Special Summon from the Deck sometimes put the last 「ハイドロゲドン」 on top.
  - T5's draw took it, and the T5 trigger then correctly had no copy left in the Deck (about 1 run in 29).
- The test now fixes the seed (`0x5331a5e5`) right after `resetForTestDuel()` and resets the journal, so the Replay audit starts
  from the seeded state. Its assertions are unchanged; 3 runs 16/16.
- Recorded follow-up: other test files that start a duel through `resetForTestDuel()` without a seed may carry the same kind of
  flakiness.

## Not in this unit (recorded)
- The must-attack stays a confirmation when leaving the Battle Phase (the existing rule for every must-attack card), not a hard
  block.
- Other `requestChoiceV49` callers in card files pass `player` themselves; only the four legacy helpers had no player.

## Status
- No status change. 立ちはだかる強敵 stays TESTED; its lock now actually applies.

## Gate
- First run: `GATE_EXIT=1` at `test_s03_vs5_battle_trigger_slice.js` (the time-seeded flake above; not published).
- Second run: `python tools/check.py` — `GATE_EXIT=0`, 14310 PASS lines (= U149 14300 + 10 new, exactly), 0 FAIL, no Traceback /
  ReferenceError (one caught `TypeError` stack from `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level
  function declarations".
- Pre-scan of all 369 gate tests (parallel): every exit code 0, 0 FAIL; per-file PASS / Error counts equal to U149 except the new test.
- `dist/battle.html` SHA256 `e88b9c5d263969aeac0dcbea81491b699652a45702d0be9386c24da16169365f` (build output identical to the gate build);
  Acode regenerated after the gate: `dist/battle_acode.html` `896ca21562f7494b88e4747fb704429b3799e50ac4a005d7cd1044ab0107c0f8`.
- Coverage unchanged: TESTED 2230, IMPLEMENTED 94, ENGINE_GAP 607, GENERIC_OK 644, PARTIAL 174, NOT_STARTED 1247 (4996); 197 declared
  status changes, 0 off-target.
