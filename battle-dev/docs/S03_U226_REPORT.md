# S03-U226 — NOT_STARTED 18

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZZH_claude_s03_u226_ns18.js
- 超伝導恐獣: once per turn, and not after it has attacked this turn.
  - Cost: release an own monster (not a `cannotTribute` one).
  - It deals 1000 damage and cannot declare an attack this turn (`cannotAttackTurn`).
- 邪神機－獄炎:
  - a Normal Summon method with no Tribute;
  - if summoned that way, at the End Phase (while no other face-up Zombie is on the field) it goes to the GY and its controller takes damage
    equal to its original ATK.
- キングゴブリン:
  - its ATK / DEF equal the other face-up Fiends on the field × 1000;
  - it cannot be chosen as an attack target while its controller has another face-up Fiend.
- 究極恐獣:
  - it can attack every opponent monster once (`attackAllMonstersS03`, S03-U149);
  - in its controller's Battle Phase, while it can still attack, its controller's other monsters (except 「究極恐獣」) cannot attack.
- グランド・ドラゴン:
  - it can be Normal Summoned only while its controller's field is empty, but it can always be Set;
  - it can attack only while another face-up Dragon is on its side.

## Tests
`tools/test_s03_u226_ns18.js` passes 19/0, on real DUEL paths and Replay-audited.
- 超伝導恐獣: the release and 1000 damage; once per turn; no attack afterwards.
- 獄炎: summoned with no Tribute; End Phase → GY and 2400 damage; nothing while another Zombie is on the field.
- キングゴブリン: its values and protection.
- 究極恐獣: attacks both opponent monsters; the other monster is locked only while 究極恐獣 can still attack.
- グランド・ドラゴン: its summon methods and the attack condition.

Negative control on U225: 11 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15733 PASS / 0 FAIL** (= U225 15714 + 19 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U225.
- Coverage: TESTED 2629, ENGINE_GAP 598, NOT_STARTED 1092, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 589 declared, 0 off-target.
