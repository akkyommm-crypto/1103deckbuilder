# S03-U224 — NOT_STARTED 16

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZZF_claude_s03_u224_ns16.js
They use the existing hooks: `specialSummonLockS03` (engine/40), `cannotBeAttackTarget` (engine/1ZU) and activation responses (engine/1P).
- オーロラ・アンギラス: while it is on the field, neither player can special summon. When another monster is Normal Summoned, it destroys itself
  (a forced trigger).
- サボウ・クローザー: it cannot be special summoned. While another face-up Plant is on either field, neither player can special summon.
- ゴーレム・ドラゴン: the opponent cannot choose the controller's other face-up Dragons as attack targets.
- デコイロイド: the opponent cannot choose face-up monsters other than 「デコイロイド」 as attack targets.
- 女王親衛隊: the opponent cannot choose the controller's 「魅惑の女王」 monsters as attack targets.
- Counter Traps, each with a field condition, that negate and destroy:
  - 共同戦線 (2 or more face-up monsters of the same Level): a Trap card activation.
  - 借カラクリ整備蔵 (a face-up Defense Position 「カラクリ」): the opponent's Spell / Trap card activation.
  - 地縛波 (a 「地縛神」 monster): the opponent's Spell / Trap card activation.
  - フェザー・ウィンド (a face-up E・HERO フェザーマン): a Spell / Trap card activation.
  - バスター・カウンター (a 「／バスター」 monster): a monster effect, or a Spell / Trap card activation.

## Tests
`tools/test_s03_u224_ns16.js` passes 20/0, on real DUEL paths and Replay-audited.
- Each Counter Trap answers the opponent's 威嚇する咆哮. The negation is checked by the attack lock not being set.
- Each Counter Trap is also checked with its condition unmet, where it is not offered.
- The attack-target restrictions are checked through `attackTargetForbiddenReasonS03`, plus one refused attack request.
- アンギラス is destroyed after a real Normal Summon.

Negative control on U223: 13 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15695 PASS / 0 FAIL** (= U223 15675 + 20 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U223.
- Coverage: TESTED 2617, ENGINE_GAP 598, NOT_STARTED 1104, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 577 declared, 0 off-target.
