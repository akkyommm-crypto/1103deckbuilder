# S03-U353 — a Continuous Spell and two Continuous Traps that hold monsters down

Base: `claude/work` `2b633b7` (U352, gate 19834 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZO_claude_s03_u353_holds.js`)
- 闇の呪縛 / 拷問車輪: the trap targets one opposing face-up monster; the monster gets a card flag (the trap's uid), the trap's continuous source (from the Spell & Trap Zone, so it ends with the trap) reads it for the ATK -700 (闇の呪縛 only), `cannotAttack` and `cannotChangePosition`; `API.linkOnLeave(trap, monster, 'destroy')` destroys the trap when the monster leaves. 拷問車輪's forced `onStandbyPhase` trigger (my own Standby Phase, only while the flagged monster is in the Monster Zone) deals 500.
- 平和の使者: continuous `cannotAttack` on every face-up monster with ATK 1500 or more (both players); forced `onStandbyPhase` trigger on my Standby Phase (`payCost` 100, else destroy).
- Not part of this unit: the Equip-Trap cards (植物連鎖, 燃える闘志: a Trap that becomes an Equip), 閃光弾 (skipping to the End Phase), 窮鼠の進撃, 絶対不可侵領域, 融合禁止エリア, 王宮の鉄壁, 生贄封じの仮面 (rule locks without engine hooks).

## Tests
- `tools/test_s03_u353_holds.js` 20 / 0. Negative control on the previous build: 12 FAIL. Coverage TESTED 3169 → 3172, NOT_STARTED 681 → 678; `registration_names_missing_from_db` empty; audit 0 FAIL.
