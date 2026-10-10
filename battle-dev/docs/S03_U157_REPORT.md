# S03-U157 — the six attribute recruiters on the shared deck-trigger engine

## Why
The six attribute recruiters are キラー・トマト, シャインエンジェル, 巨大ネズミ, グリズリーマザー, ドラゴンフライ and UFOタートル. They were TESTED as a v4 Unified Effect (`cards/42_v41_native.js` `v41DefineAttributeRecruiter`, System v4.1), with three errors against the 1103 behaviour:
- The Deck monster was chosen **at activation**, in the target step, although the effect does not target. The 1103 effect examines the Deck at resolution.
- The trigger could not be activated when the Deck held no candidate. The 1103 effect can be activated; it resolves doing nothing, and the Deck is shuffled. This is the same rule engine/1ZT applies to every recruiter (仮面竜 etc.).
- The Special Summon lock was checked only through the turn flag `noSpecialSummon`. Under 大天使クリスティア (お互いに特殊召喚できない), 巨大ネズミ was still offered.

2011 text:

> このカードが戦闘によって破壊され墓地へ送られた時、デッキから攻撃力1500以下の○属性モンスター1体を表側攻撃表示で特殊召喚する事ができる。

## Change
- `v41DefineAttributeRecruiter(name, attribute)` now declares the card on engine/1ZT (S03-U156). The name and the six calls are kept:

  ```js
  declareDeckTriggerS03(name, {when:'battleToGrave', action:'summon', optional:true, pos:'atk', filter:{at, atkmax:1500}})
  ```

  - The helper `v41RecruiterPool` was removed (no other user).
  - The Extra Deck is excluded and summon conditions apply (engine/1ZT pool).
- `tools/script_coverage.py`: a local helper that wraps `declareDeckTriggerS03` counts as a registration helper, like `defineScript` / `defineUnifiedCardV4`. So the six keep their `cards/` registrations and their statuses.

## Test — `tools/test_s03_u157_attribute_recruiters.js` 26/0 (real DUEL path, fixed seed, Replay-audited)
- **A, each recruiter:**
  - destroyed by an attack → optional trigger;
  - the choice opens **after the chain link** (at resolution);
  - it offers only the ATK ≤ 1500 monster of its Attribute, e.g. キラー・トマト: ゲート・キーパー. It does not offer the same Attribute at 1600+ (アイアン・ハート) or another Attribute at 1500 (ひょうすべ);
  - the monster is summoned face-up in Attack Position, with no position choice;
  - the battle goes on.
- **B:**
  - no candidate: the trigger is activated and resolves doing nothing; the Deck is shuffled.
  - it can be declined.
  - under 大天使クリスティア: not offered.
  - ドラゴンフライ → ドラゴンフライ → ドラゴンフライ across two attacks (a chain of recruiters).
- **Negative control on U156** (checkpoint `dist/battle.html` + this test): 8 FAIL, 0 errors. The six "examined at resolution" checks, the no-candidate case, and the クリスティア case fail.
- `tools/test_v410_native_cards.js` keeps 20/20. Its assertions encoded the v4.1 representation and the old activation-time behaviour; they now say the same things on the new path:
  - "declared on the shared engine (optional, face-up Attack, ATK ≤ 1500 ○)";
  - summon through the resolution-time choice;
  - "invalid Deck — still activatable, resolves with no summon and the Deck shuffled";
  - "noSpecialSummon blocks activation", through the central legality `strictScriptLegalityV2`. A control run without the lock returns legal, so the assertion is not vacuous.

## Status
No status change: the six stay TESTED, now for the 1103 behaviour. Totals unchanged from U156: TESTED 2265, IMPLEMENTED 85, GENERIC_OK 644, PARTIAL 149, ENGINE_GAP 606, NOT_STARTED 1247.
