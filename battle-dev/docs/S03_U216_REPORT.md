# S03-U216 — NOT_STARTED 8

## Engine
- `engine/30`: when a Continuous / Field card activation resolves as "card activation only" (`fieldIgnition`), the script's
  `onCardActivationResolvedS03(ctx)` runs. It does bookkeeping on the card, not an effect. 波動キャノン uses it to record the turn it was activated.

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZX_claude_s03_u216_ns8.js
- 波動キャノン:
  - the card activation records its turn;
  - the Main Phase ignition counts the controller's turns since then, each of which had a Standby Phase before this Main Phase;
  - it sends itself to the GY as the cost (the count is recorded with the cost, `recordActivationCost`) and deals 1000 damage per Standby Phase.
- 道連れ: when a monster from the field is sent to its controller's GY (including by battle) → destroys a targeted field monster.
- 炎塵爆発:
  - cost: banish every 「ラヴァル」 monster in the GY (the count is recorded with the cost);
  - destroys up to that many field cards, chosen at resolution.
- 猛吹雪: when its controller's Trap is destroyed by an opponent's card effect and sent from the field to the GY → destroys a Spell / Trap on the
  field, chosen at resolution.

Deferred: 英知の代行者 マーキュリー. Its condition is checked at the opponent's End Phase without a chain link, which needs a rule-time record that
the engine does not have yet. It stays NOT_STARTED.

## Tests
`tools/test_s03_u216_ns8.js` passes 15/0, on real DUEL paths and Replay-audited.
- 波動キャノン:
  - activated from the hand, it records the turn;
  - fired the same turn, it deals 0;
  - activated in turn 1 and fired in turn 5, it deals 2000;
  - the send happens before CHAIN_ADD.
- 道連れ after a battle; the opponent's monster going to its own GY → no activation.
- 炎塵爆発 with 2 「ラヴァル」; not activatable with none.
- 猛吹雪 after the opponent's サイクロン; its own サイクロン → no activation.

Negative control on U215: 10 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15552 PASS / 0 FAIL** (= U215 15537 + 15 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U215.
- Coverage: TESTED 2560, ENGINE_GAP 598, NOT_STARTED 1161, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 520 declared, 0 off-target.
