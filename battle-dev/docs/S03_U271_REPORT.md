# S03-U271 — Damage origin: LP rules limited to the opponent's effects (リフレクト・ネイチャー) and battle damage treated as effect damage (墓守の従者)

## Workflow
- opus-only engine unit (workflow v3: engine work stays with Opus), done while Sonnet ran S03-U270, then rebased onto U270. Profile `delegation-expanded-v3-batch3`.
- The class-B triage named five cards as needing a "post-effect-damage event with a source". The engine already has `onLPChange`, which carries the source card and player (白兵戦 uses it), so 防御輪, ドッペル・ゲイナー, ダメージ・ワクチンΩMAX and 悪夢の拷問部屋 are left for a normal Sonnet unit.
- Only two capabilities were actually missing; this unit adds them.

## Engine
- **LP rule origin (`engine/1H`, `engine/00`):**
  - `API.addLpRule({…, originPlayer})` stores `originPlayerS03` on the rule. Older rules keep their JSON shape: the field is added only when given.
  - The rule then applies only to damage whose `byPlayer` matches. `byPlayer` is the resolving link's player for effect damage (already on the LP action since S03-U50), and the inflicting side for battle damage.
  - `continuous.lpChange` also receives `byPlayer`.
- **Battle damage treated as effect damage (`engine/00`, `battleDamageCauseS03`):**
  - A script with `battleDamageAsEffectS03:true` makes the battle damage the monster inflicts on its controller's opponent count as effect damage.
  - This holds for a direct attack, when it attacks, and when it is attacked. It needs the monster face-up with its effect not negated.
  - That damage goes through the LP rules with cause `effect`, and `onLPChange` carries cause `effect`.
  - No `onBattleDamage` / `onDirectBattleDamage` is raised for it.
  - It is not battle damage, so the battle-damage layer (redirect and filters such as スピリットバリア's 「戦闘ダメージは0」) does not touch it. The amount is the battle's damage figure, and the effect-damage rules apply instead.
  - Damage its own controller takes stays battle damage.

- **Position choice for effect Special Summons (`engine/1ZZK_ss_position_s03.js`):**
  - `specialSummonPositionsS03(player, [{uid, from}], reason, after)` asks the summoning player face-up Attack or Defense for each card (one journaled option choice each).
  - Then it summons them together and runs an optional registered `after` step.
  - 「特殊召喚する」 without a position lets the player choose, while `API.specialSummon` callers mostly pass `'atk'`, a known engine-wide convention gap (recorded in CLAUDE_RESUME).
  - The S03-U269 cards that summon (救急救命, トライワイトゾーン, 光神化) now use it, so they are not published with that gap.

## Cards → TESTED (2011 texts) — cards/HZZZZY_claude_s03_u271_damage_origin.js
- **リフレクト・ネイチャー** (Trap):
  - For the rest of the turn, damage to its activator from effects the opponent activated is taken by the opponent instead (a redirect rule with an origin).
  - Its controller's own damage effects are not affected, nor is damage with no activating opponent.
- **墓守の従者:** the battle damage it inflicts on the opponent is treated as effect damage.

## Corrections of S03-U270 cards (Opus review of the Sonnet unit)
No status change: both cards are already TESTED by S03-U270, and this checkpoint publishes them corrected.
- **ホーリーライフバリアー** — 「相手から受ける全てのダメージを0にする」: its rule now carries the opponent as its origin (`originPlayer`), so damage with no opponent origin is not prevented.
- **氷結界の武士** — 「このカードを破壊し、デッキからカードを1枚ドローする」: it draws only when it was destroyed. Before, it also drew when it had already left the field.

## Existing tests adjusted (status records; no behavior assertion changed)
Each check becomes an "Engine unlocked" check, and every count is unchanged:
- `test_v540_batch06` (リフレクト・ネイチャー, 46);
- `test_v780_batch30` (墓守の従者, 45).

## Tests
`tools/test_s03_u271_damage_origin.js` passes 37/0, on real DUEL paths and Replay-audited.
- A1–A3: chained to the opponent's ファイヤー・ボール, then キャノン・ソルジャー the same turn → both reflected. An effect damage with no activating opponent is taken normally.
- A4–A5: activated in its own turn → its own burn still hits the opponent. The next turn, the opponent's burn hits normally.
- B1: a direct attack → `onLPChange` cause `effect`, and no battle-damage events.
- B2: under an opponent's effect-damage-prevention rule it inflicts 0, while ワイト's battle damage still lands.
- B3 / B5: attacking, or being attacked by, a weaker monster → effect damage to the opponent.
- B4: attacking a stronger monster → its controller takes ordinary battle damage.
- R1: ホーリーライフバリアー chained to the opponent's burn prevents it; damage with no opponent origin still lands.
- R2: 強制脱出装置 returns 氷結界の武士 in response to its trigger → no destruction, no draw.
- B6: under the opponent's スピリットバリア, ジェネティック・ワーウルフ's battle damage is 0, while 墓守の従者's 400 lands.
- P1–P3: 救急救命 summons in Defense when chosen. トライワイトゾーン summons with one position per monster. 光神化 summons in Defense, its ATK is still halved, and it is destroyed in the End Phase.
- A deferred-event spy in the test records which events were queued.

Negative control on U270: 17 FAIL. Engine only reverted (card kept, on U269): 7 FAIL. R1 / R2 fail with the uncorrected U270 card file.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17196 PASS / 0 FAIL** (= U270 17159 + 37 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U270.
- Coverage: TESTED 2859, ENGINE_GAP 533, NOT_STARTED 928, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 820 declared, 0 off-target.
- Published in the batched checkpoint S03-U268–U271.
