# S03-U312 — restricted Equip Spells: 漆黒の名馬, 古代の機械戦車, 風魔手裏剣, 磁力の指輪, レアゴールド・アーマー, ヴァイロン・コンポーネント, ヴァイロン・フィラメント

Base: `claude/work` `821c9a7` (U311, gate 18436 PASS / 0 FAIL). Sonnet 5.5, single writer. All seven were NOT_STARTED.

## Change
- P4 authority P4-v8 → P4-v9 (`tools/gen_setcode_overlay.py`): `GROUP.NINJA` (「忍者」, 11 cards, names containing 忍者) and `GROUP.VYLON` (「ヴァイロン」, 26 cards). Counts: predicate 40, authority 547, overlay 401, membership 569 (`test_p4_setcode_authority.js` pins updated; no new overlaps).
- `cards/HZZZZZY_claude_s03_u312_limited_equips.js` (unified Equip Spells, helper `u312Define`, on the S03-U233 equip pattern): host restriction by P4 group; stat bonuses; 漆黒の名馬 `equipSubstituteS03`; 古代の機械戦車 / 風魔手裏剣 damage triggers from the GY (only a destruction of the Equip Spell for the tank; any route from the field for the shuriken); 磁力の指輪 / レアゴールド・アーマー attack-target restriction (engine/1ZU `cannotBeAttackTarget`; the latter protects the equipped monster's controller); ヴァイロン・コンポーネント piercing + the optional deck search when sent from the field face-up (engine/1ZT `deckTriggerHappenedS03` + the shared choice handler, Vylon Spells only); ヴァイロン・フィラメント the attack lock.
- Engine (engine/1ZO): `equipAttackLockS03` — `declareAttackLockS03` also works for an Equip Spell on the attacking monster (the lock is gone when a host destroyed in the battle takes the Equip Spell with it).

## Tests
- `tools/test_s03_u312_limited_equips.js` 41 / 0 (real activation, host choice, stats, attacks, サイクロン / ブラック・ホール, GY triggers, refusals through `getLegalHandActions`, Replay audits); negative control on the previous build: 29 FAIL. `test_s03_u144_attack_lock` 24 / 0, `test_s03_u145_mass_destroy_attack_lock` 36 / 0, `test_s03_u233_ns25` 26 / 0, `test_p4_setcode_authority` 103 / 0.
- Coverage: TESTED 2948 → 2955, NOT_STARTED 899 → 892; audit 0 off-target.
- Test note: unified Equip Spells are offered through `getLegalHandActions` (an `activate` action); `strictScriptLegalityV2` reports them as not activatable, so a negative check built on it would pass for the wrong reason.

## Not done — recorded engine need
- ヴァイロン・セグメント (「相手の罠・効果モンスターの効果の対象にならない」) stays NOT_STARTED: there is no 「cannot be targeted」 capability (the existing targeting negator negates a link after it was chosen). Nine cards need it: ヴァイロン・セグメント, ヴァイロン・エプシロン, オベリスクの巨神兵, ジュラック・タイタン, ターボ・ウォリアー, 救世の儀式, 機皇城 (PARTIAL), 氷結界の御庭番 (ENGINE_GAP). It needs a central filter on target selection (design work).
