# S03-U257 — Lingering effects of used cards: シャブティのお守り, BF－蒼天のジェット

## Workflow
- opus-only, because it is engine work.
- The Sonnet subagent of S03-U254 implemented these two cards with the クリボー pattern: the used card stays in the GY as a `from:['grave']` continuous source.
- That pushed `graveContinuousNamesV29()` to 22. The System v29 design budget asserted by `tools/test_grave_continuous_v29.js` E3 is ≤ 20 (GY-source cards are opt-in and kept rare, because the GY is scanned for them).
- That assertion does not contradict any 1103 text, so it was kept. Both cards were removed from U254, and this unit adds the missing primitive.

## Engine
- **Action `LINGER_ADD_S03 {player, uid}` / `API.lingerS03(p, card, reason)`.** Journaled. It adds the used card's uid to `players[p].temporaryFlags.lingerUidsS03`; temporaryFlags is cleared at every turn start.
- **Collection.** `collectSources(['linger'])` collects exactly those cards, wherever they are, when their script declares `continuous.from:['linger']`.
- **Order.** `continuousSources()` appends them last, after the GY sources, and only when some player registered one this turn. Nothing scans the GY for them, and they do not count toward the v29 budget.
- **Scope.** The card keeps its own precise checks (turn stamp, battle uids), exactly as before. All existing continuous hooks work unchanged: battleDamage, protectV21, and so on.

## Cards → TESTED (2011 texts) — cards/HZZZZK_claude_s03_u257_linger.js (code from S03-U254, moved)
- **シャブティのお守り:** discard it from the hand (quick effect) → for the rest of the turn, its controller takes no battle damage from battles involving its own 「墓守の」 monsters.
- **BF－蒼天のジェット:** at the damage calculation, send it from the hand to the GY → its controller's 「BF」 monster in that battle is not destroyed by that battle.

## Tests
`tools/test_s03_u257_linger.js` passes 11/0, on real DUEL paths and Replay-audited.
- A:
  - discarded at the opponent's attack declaration (`pointActivateV27`): 墓守の偵察者 is destroyed and its controller takes 0 damage;
  - registered as a lingering source and not a GY source;
  - a later battle with ワイト deals 1700;
  - control without the card: 1800;
  - a copy that merely lies in the GY with a stamp but is not registered does nothing.
- B: at the damage-calculation POINT, BF－尖鋭のボーラ survives 青眼 and 1700 damage is still dealt; control: destroyed.
- C: `graveContinuousNamesV29().size` stays at 20.

Negative control on U256: 5 FAIL. The rest are controls, audits and the budget check.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16640 PASS / 0 FAIL** (= U256 16629 + 11 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U256.
- Coverage: TESTED 2791, ENGINE_GAP 566, NOT_STARTED 962, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 752 declared, 0 off-target.
