# S03-U233 — NOT_STARTED 25

## Workflow
- opus-only: the hard parts were two engine extensions.
- It ran in parallel with U232's gate, in its own tree.
- U232's card, test, manifest, `check.py` and declarations were copied in, so this tree is U232 plus this unit.

## Engine
- `engine/1ZZG` (S03-U214 grave redirect) adds a turn-scoped source for 「このターン、墓地へ送られるモンスターは墓地へは行かず除外される」.
  - The source is a player's `temporaryFlags.graveToBanishTurnS03 = {turn, by}`, written with the journaled `PLAYER_FLAG_SET` and cleared at the next turn.
  - It covers both players' monster cards that turn, wherever they come from.
  - The activating Spell / Trap itself is not a monster, so it still goes to the GY.
- `engine/00` `applyPiercingDamage` adds a one-battle piercing grant: the attacker's `pierceBattleS03 = {turn, target}`.
  - It is written with `API.setCardFlag` (journaled `FX_CARD_FLAG_V46`).
  - It applies only in that turn and only against that target.
  - It stays in force if the granting card leaves.
  - `pierceBattleS03` is in `ZONE_LOCAL_KEYS`, so it disappears when the attacker leaves the field.

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZZO_claude_s03_u233_ns25.js
- 異次元グランド: Normal Trap. For the rest of this turn, monsters sent to the GY are banished instead.
- 黒いペンダント:
  - equip, ATK +500;
  - sent from the field to the GY → 500 damage to the opponent (forced).
- 魔界の足枷:
  - equip; the equipped monster's ATK / DEF become 100 and it cannot attack;
  - at each of its controller's Standby Phases → 500 damage to the equipped monster's controller.
- 明鏡止水の心:
  - equip; the equipped monster is not destroyed by battle or by effects that target it (`protectV21`, with the effect part conditional on `ctx.targeting`);
  - it destroys itself while the equipped monster's ATK is 1300 or more (`selfDestroyWhenS03`).
- 機皇兵ワイゼル・アイン:
  - ATK +100 per other face-up 「機皇」 monster;
  - once per turn, when another of its controller's 「機皇」 monsters declares an attack on a Defense Position monster → that battle inflicts piercing damage.

## Tests
`tools/test_s03_u233_ns25.js` passes 26/0, on real DUEL paths and Replay-audited.
- The battle-destroyed monster is banished that turn and goes to the GY next turn.
- The pendant's damage happens only from the field: 大嵐 → 500, a hand discard as a cost → none.
- The fetters' 100 / 100, attack lock, and Standby damage on its controller's turn only.
- The heart against a targeting effect (シールドクラッシュ), a battle, a non-targeting effect (ブラック・ホール), and its self-destruction at ATK 1300+.
- ワイゼル's ATK bonus, piercing for スキエル・アイン, and none when ワイゼル attacks itself.

Other checks:
- `tools/test_s03_u214_grave_redirect.js`, `test_s03_u135`, `test_s03_u183` and `test_s03_u232_ns24` still pass.
- Negative control on U232: 17 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15876 PASS / 0 FAIL** (= U232 15850 + 26 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U232.
- Coverage: TESTED 2675, ENGINE_GAP 598, NOT_STARTED 1046, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 635 declared, 0 off-target.
