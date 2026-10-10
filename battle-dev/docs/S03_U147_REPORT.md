# S03-U147 — A・ジェネクス・トライフォース (Synchro material attributes recorded)

## Why
- A・ジェネクス・トライフォース was the last NOT_STARTED card on the attack-time lock (engine/1ZO, U144).
- Its effects depend on the **attribute** of its non-Tuner Synchro materials. The Synchro Summon recorded each material's name,
  Tuner flag, level, and in one path ATK / DEF (`v380SummonMaterials`), but not its attribute.

## Change
- `engine/00_state_actions.js`: both Synchro paths also record `at`. That is `currentAttributeV17(material)` when the material is
  used, taken at the same moment as its level:
  - `EX_SUMMON_PREPARE_V42` → `synMaterialSnapshot` → `v380SummonMaterials`;
  - `FX_EX_SUMMON`.
- New `cards/HZC_claude_s03_u147_triforce.js` (v4). Its effects depend on the non-Tuner materials' attributes; several attributes
  give several effects. A snapshot written before U147 has no `at`, so the printed attribute of the named material is used.

  | Attribute | Effect |
  |---|---|
  | 地 (EARTH) | the attack-time lock (`declareAttackLockS03` with `active`) |
  | 炎 (FIRE) | a forced trigger when it destroys a monster by battle (`onDamageStep` 'leave'): damage equal to that monster's printed ATK |
  | 光 (LIGHT) | an ignition effect, once per turn (`countLimit` in opts: `{n:1, effects:['light']}`): target 1 LIGHT monster in its GY that the effect can Special Summon (`canEffectSpecialSummonS03`), then Special Summon it face-down in Defense Position |

## Test — `tools/test_s03_u147_triforce.js` 14/0 (real Synchro Summon, phase change, attacks and activation through the processor; Replay-audited)
- A — ジェネクス・コントローラー + ジェネクス・サーチャー (EARTH):
  - The attributes 闇 / 地 are recorded.
  - The opponent's set ミラーフォース is refused while it attacks.
  - The revival is not available.
- B — with 炎の剣豪 (FIRE):
  - There is no lock: the opponent's ミラーフォース destroys it.
  - Destroying ブラッド・ヴォルス deals 600 battle damage + 1900.
  - Control, EARTH only: 600 only.
- C — with ジェネクス・ニュートロン (LIGHT):
  - クィーンズ・ナイト is Special Summoned face-down in Defense Position.
  - The DARK ワイト is not a candidate.
  - A second activation in the same turn is refused.
- Negative control on U146 (`dist/battle.html` + this test): 4 FAIL, 0 errors:
  - the attribute record;
  - the lock, the burn and the revival.

  The refusal checks pass on U146 as well, because the card had no script there.

## Not in this unit (recorded)
- The attribute is read when the material has already been removed from the Monster Zone, as the recorded level already was. An
  attribute given by another card's continuous effect that stops applying off the field would not be seen.

## Status
- NOT_STARTED → TESTED: A・ジェネクス・トライフォース. TESTED 2222 → 2223, NOT_STARTED 1255 → 1254.

## Gate
- `python tools/check.py` — `GATE_EXIT=0`, 14259 PASS lines (= U146 14245 + 14 new, exactly), 0 FAIL, no Traceback / ReferenceError
  (one caught `TypeError` stack from `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level function declarations".
- Pre-scan of all 366 gate tests (parallel): every exit code 0, 0 FAIL; per-file PASS / Error counts equal to U146 except the new test
  (and cycle25, whose U146 fix is now reflected).
- `dist/battle.html` SHA256 `6ce6dc467dfb6a7c99aa8b1d7686a80ad3949359f156e46f35db748b2211d4d9` (build output identical to the gate build);
  Acode regenerated after the gate: `dist/battle_acode.html` `54c943115a18b33fec29c195cd6e223fe3b7301d13e91886763ee2522919d8db`.
- Coverage: TESTED 2223, IMPLEMENTED 94, ENGINE_GAP 607, GENERIC_OK 644, PARTIAL 174, NOT_STARTED 1254 (4996); 190 declared status
  changes, 0 off-target.
