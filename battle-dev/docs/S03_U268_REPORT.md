# S03-U268 — Equip instead of the GY on destruction: ドラグニティ－ジャベリン

## Workflow
- opus-only (engine). The U265 Sonnet subagent returned ドラグニティ－ジャベリン as needing an engine change; this unit adds it.
- Started under workflow v2 and finished during the switch to v3; it goes out in the first batched checkpoint, so it is recorded as `transition-mixed`.

## Engine
- `engine/1ZV`: a new destruction-substitute kind, `equipInstead`, which a script declares as `equipInsteadS03:{hostFilter(host)}`.
  - It is offered when the card is destroyed in a Monster Zone, by battle or by an effect during a chain link (the U173 reach).
  - There is one option per own face-up host that passes the filter, and only with a free Spell & Trap Zone.
  - The card is still destroyed: it is not spared like a substitute.
- `engine/1ZZG`: `graveRedirectPileS03` calls `equipInsteadPileS03`, which turns the GY move into an Equip Card for the chosen host.
  - It uses the same fields as an Equip Card from the GY (engine/1N).
  - If the host is gone or the zone is full, the card goes to the GY.

## Card → TESTED (2011 text) — cards/HZZZZU_claude_s03_u268_equip_instead.js
**ドラグニティ－ジャベリン:** when it is destroyed in a Monster Zone, its controller may equip it, instead of sending it to the GY, to a face-up Winged Beast 「ドラグニティ」 monster they control.

## Tests
`tools/test_s03_u268_equip_instead.js` passes 8/0, on real DUEL paths and Replay-audited.
- A: destroyed by battle, it becomes an Equip Card of ドラグニティ－アングス.
- B: 地割れ destroys it, and it is equipped. B2: declined, it goes to the GY.
- C: the only host is a Dragon (ドラグニティ－アキュリス), so nothing is offered and it goes to the GY.

Negative control on U267: 2 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17035 PASS / 0 FAIL** (= U267 17027 + 8 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U267.
- Coverage: TESTED 2844, ENGINE_GAP 548, NOT_STARTED 928, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 805 declared, 0 off-target.
- Published in the batched checkpoint S03-U268–U271.
