# S03-U160 — 薄幸の乙女 / スカー・ウォリアー: conditional battle protections with their full texts

## Why
Until S03-U158 both monsters were battle-indestructible through the text fallback, with no script. U158 removed the wrong unconditional protection. This unit implements their full texts. Two common pieces were missing:
- **「このカードと戦闘を行ったモンスター」**: the engine only kept a Battle-Phase attack log (`battlePhaseV6`), which ends with the Battle Phase.
- **「相手は…を攻撃対象に選択できない」**: the only attack-target restriction was 立ちはだかる強敵's lock (U150), which also forbids direct attacks and forces attacks.

## Engine
- **Battle record**: the ATTACK action (damage calculation) stores the other monster's uid in both monsters' `battledWithS03` (engine/00; zone-local, in `ZONE_LOCAL_KEYS`). `battledTogetherS03(a, b)` is true when both still carry it, so neither has left the field since. The record is written inside the action, so it is replayed.
- **`engine/1ZU_attack_target_restriction_s03.js`**: `continuous.cannotBeAttackTarget(target, src)`, reached through `continuous.scope`. Only the source controller's opponent is restricted. It is checked through `forcedAttackTargetReasonS03`, so at the target list, the attack request and the replay pick. A direct attack is not affected.

## Cards (`cards/HZH_claude_s03_u160_battle_conditions.js`)
- **薄幸の乙女**:
  - `protectV21` only in face-up Attack Position;
  - `cannotAttack` / `cannotChangePosition` for the monsters it battled, while it is face-up in Attack Position.
- **スカー・ウォリアー**:
  - `cannotBeAttackTarget` for the other face-up Warriors (current Type);
  - `protectV21` once per turn.

## Test — `tools/test_s03_u160_battle_conditions.js` 12/0 (real DUEL path: attacks, the processor's phases and turns; Replay-audited)
- **A 薄幸の乙女**:
  - not destroyed by ギガンテス in Attack Position (1500 damage still taken);
  - the battle is recorded on both monsters;
  - in player II's next turn ギガンテス cannot change position or attack, while ゴブリン突撃部隊 can;
  - in Defense Position it is destroyed.
- **B スカー・ウォリアー**:
  - the other face-up Warrior is not in the target list, and an attack request at it is refused (no attack declared);
  - ワイト and a face-down Warrior are targets;
  - it survives the 1st 青眼の白龍 and is destroyed by the 2nd;
  - afterwards the Warrior is a target again.
- **Negative control on U159**: 4 FAIL + 1 error. Pre-scan: every other gate test file is unchanged.

## Status
- NOT_STARTED → TESTED: 薄幸の乙女, スカー・ウォリアー (declared).
- Totals: TESTED 2267, IMPLEMENTED 85, GENERIC_OK 644, PARTIAL 149, ENGINE_GAP 606, NOT_STARTED 1245.
