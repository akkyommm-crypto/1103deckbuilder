# S03-U352 — four battle / upkeep / control monsters

Base: `claude/work` `9c90cd6` (U351, gate 19808 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZN_claude_s03_u352_battle_upkeep.js`)
- フュージョニストキラー: continuous `setFinalAtk:0` on every face-up Fusion Monster fighting it (the pair is read from `gameState.battle`: attacker slot + `targetUid`).
- マックス・ウォリアー: +400 in the Damage Step when it attacks a monster (the ジェイン pattern); a forced Damage Step `leave` trigger (gearKilledFoeS03) stores an expiry turn in a card flag (`u352MaxUntil` = turn + 2 from my turn, + 1 from the opponent's); `continuous.setLevel` 2 and `setBaseAtk/setBaseDef` halved while `turn < expiry`.
- メンタルプロテクター: forced `onStandbyPhase` trigger on my own Standby Phase (`payCost` 500, else destroy); continuous `cannotAttack` on every face-up non-Psychic monster whose ATK is 2000 or less (both players).
- マジシャンズ・エイプ: `cannotSpecialSummon`; once-per-turn ignition in Attack Position: a hand monster is discarded as the cost, the target is the opponent's face-up Defense monster, `API.changeControl(…, 'endPhase')`, and a card flag with a continuous `cannotChangePosition` locks its position that turn.
- Not part of this unit: the six upkeep 「デーモン」 monsters (デスルークデーモン, ダークビショップデーモン, ヘルポーンデーモン, シャドウナイトデーモン, ジェノサイドキングデーモン, プリズンクインデーモン) — their dice-on-targeting negation needs a target-resolution hook; ワイト夫人 / ワイトメア (name treatment in the Graveyard and a protection aura).

## Tests
- `tools/test_s03_u352_battle_upkeep.js` 26 / 0. Negative control on the previous build: 13 FAIL. Coverage TESTED 3165 → 3169, NOT_STARTED 685 → 681; `registration_names_missing_from_db` empty; audit 0 FAIL.
