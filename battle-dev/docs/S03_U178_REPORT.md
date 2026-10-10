# S03-U178 — VWXYZ－ドラゴン・カタパルトキャノン, 混沌幻魔アーミタイル (contact fusion with the whole texts)

## Cards (NOT_STARTED → TESTED)
- VWXYZ－ドラゴン・カタパルトキャノン: contact fusion (VW + XYZ banished); ① once per turn, target 1 opponent card → banish;
  ② when it declares an attack on an opponent monster, optional trigger targeting that monster → change its position (a face-down one
  becomes face-up Attack Position without its flip effect).
- 混沌幻魔アーミタイル: contact fusion (ウリア + ハモン + ラビエル banished); +10000 ATK while its controller is the turn player; not
  destroyed by battle.

## Tests
`tools/test_s03_u178_contact4.js` 11/0 (real DUEL paths, Replay-audited): A VWXYZ contact, ① banishes a set card, 2nd use refused;
B ② on attacking face-down メタモルポット — offered, face-up Attack, no flip effect, destroyed by battle (2300); C アーミタイル contact →
10000 ATK; C2 on the opponent's turn 0 ATK and not destroyed by 青眼の白龍 (3000 damage). Negative control on U175: 7 FAIL (no scripts).

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **14760 PASS / 0 FAIL** (= U177 14749 + 11 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U177.
- Coverage: TESTED 2303, ENGINE_GAP 601, NOT_STARTED 1223, IMPLEMENTED 83, GENERIC_OK 644, PARTIAL 142 (4996); audit 264 declared, 0 off-target.
