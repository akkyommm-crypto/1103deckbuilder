# S03-U222 — NOT_STARTED 14

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZZD_claude_s03_u222_ns14.js
- 真紅眼の不死竜:
  - a Tribute Summon method with 1 Zombie;
  - when it destroys a Zombie by battle and sends it to the GY → special summons that monster to its own field.
- ラヴァル・ウォリアー: when it destroys an opponent's monster by battle while its controller's GY holds 4 or more different 「ラヴァル」 monsters →
  damage equal to the destroyed monster's original ATK.
- ラヴァル炎樹海の妖女: when sent from the field to the GY → its controller's face-up 「ラヴァル」 monsters get +200 ATK per 「ラヴァル」 in the GY,
  until the End Phase.
- 天界王 シナト: when it destroys an opponent's Defense Position monster by battle and sends it to the GY → damage equal to that monster's original
  ATK. Its Ritual Summon is unchanged.
- 対抗魔術: a Counter Trap.
  - Cost: remove 2 Spell Counters from its controller's field, from one or more cards.
  - It negates and destroys a Spell card activation.
- 闇の幻影: a Counter Trap. It negates and destroys a monster effect activation, or a Spell / Trap card activation, that targets a face-up DARK
  monster.

The shared helper `destroyedByThisS03` identifies the monster this card destroyed by battle. It picks the first battle context that carries
`atkCard` (the S03-U218 lesson).

Deferred:
- 紅蓮の炎壁: its cost banishes any number of cards, which needs a multi-select at activation.
- 紅蓮魔闘士: a summon procedure that banishes 2 of exactly 3 Normal Monsters.

## Tests
`tools/test_s03_u222_ns14.js` passes 19/0, on real DUEL paths and Replay-audited. Each card has its negative case:
- a non-Zombie destroyed;
- only 3 「ラヴァル」 kinds;
- an Attack Position monster;
- only 1 Spell Counter;
- a LIGHT target.

Negative control on U221: 8 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15661 PASS / 0 FAIL** (= U221 15642 + 19 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U221.
- Coverage: TESTED 2602, ENGINE_GAP 598, NOT_STARTED 1119, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 562 declared, 0 off-target.
