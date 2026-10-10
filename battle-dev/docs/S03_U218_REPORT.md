# S03-U218 — NOT_STARTED 10

## Engine
- `engine/1ZU` `attackTargetForbiddenReasonS03` handles 「このターン、お互いは裏側表示モンスターを攻撃できない」 (陽動作戦).
  - A face-down monster cannot be chosen as an attack target while either player has the turn-stamped temporary flag `noAttackFaceDownS03` set
    to the current turn.
  - The check applies to the target list, the attack request and Replay.

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZZ_claude_s03_u218_ns10.js
- 陽動作戦: sets the flag on both players for this turn.
- デーモンの雄叫び:
  - cost: 500 LP;
  - special summons a 「デーモン」 monster from the GY, chosen at resolution;
  - that monster cannot be Tributed (`cannotTribute`) and is destroyed at the End Phase.
- エレキーパー: special summons a targeted Level 4 or lower 「エレキ」 from the GY, which is destroyed at the End Phase.
- ブラック・サンダー: when its controller's 「BF」 is destroyed by battle and sent to the GY → 400 damage per opponent card on the field.
- TG－SX1: when its controller's 「TG」 destroys an opponent's monster by battle and sends it to the GY (battle context) → special summons a targeted
  「TG」 Synchro Monster from the GY. As always, the Synchro Monster must have been properly summoned.
- エクシーズエフェクト: when its controller Xyz Summons → destroys a targeted card.

## Tests
`tools/test_s03_u218_ns10.js` passes 19/0, on real DUEL paths and Replay-audited.
- The attack on a face-down monster is refused; the next turn is unaffected.
- デーモンの雄叫び: 500 paid, the monster is not a Tribute candidate, and it is destroyed at the End Phase.
- エレキーパー's monster is destroyed at the End Phase.
- ブラック・サンダー: 3 cards → 1200 damage.
- TG－SX1: after a TG battle win; a non-TG attacker → no activation.
- エクシーズエフェクト: after a real Xyz Summon of ホープ; a 死者蘇生 summon → no activation.

Negative control on U217: 7 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15591 PASS / 0 FAIL** (= U217 15572 + 19 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U217.
- Coverage: TESTED 2574, ENGINE_GAP 598, NOT_STARTED 1147, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 534 declared, 0 off-target.
