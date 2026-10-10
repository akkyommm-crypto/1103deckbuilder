# S03-U262 — Forced chain responses: 死霊騎士デスカリバー・ナイト PARTIAL → TESTED

## Workflow
- opus-only, because it is engine work.
- In S03-U252, 死霊騎士デスカリバー・ナイト was declared PARTIAL. Its text 「①:モンスターの効果が発動した時、このカードをリリースして発動する。」 is forced, but engine/1P offered declared chain responses only as optional.
- Built on U260, then rebased onto U261 (`rebase_unit.py`).

## Engine
- **engine/1P:** `declareForcedActivationResponseS03(names)` declares a chain response that is forced (it is also a normal declared response).
- **Pass handling.** `forcedResponseForS03(p)` finds one of the priority player's forced responses that is legal against the top link. `chainPassV2` and `openChainPriorityV2` then activate it instead of passing, through the usual `duelActivateResponseV2` (cost, CHAIN_ADD — journaled).
- **Each (link, card) pair is tried once.** This uses a WeakMap keyed by the chain link object, so it lives outside the game state. A key of chain id + uid would repeat after a reset, Undo or Load, because those numbers restart; the test caught exactly that.

## Card → TESTED — cards/HZZZZP_claude_s03_u262_forced.js (script from S03-U252, cards/HZZZZF)
- 死霊騎士デスカリバー・ナイト is declared forced, and its PARTIAL override was removed.
- The declaration is NOT_STARTED → TESTED against the frozen baseline. It was NOT_STARTED → PARTIAL in S03-U252.

## Tests
`tools/test_s03_u262_forced.js` passes 7/0, through the chain-window pass itself. Replay-audited.
- A: the opponent's アームド・ドラゴン LV5 effect: デスカリバー is released by force; the activation is negated and destroyed; the target survives.
- B: its controller's own LV5 effect is negated too (「モンスターの効果が発動した時」, either player).
- C: a Spell (強欲な壺) does not trigger it; a face-down copy does nothing.

Negative control on U261: 2 FAIL (A and B, the forced cases).

`tools/test_s03_u252_ns33.js` (49/0) and all 261 tests touching chain responses still pass.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16817 PASS / 0 FAIL** (= U261 16810 + 7 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U261.
- Coverage: TESTED 2817, ENGINE_GAP 561, NOT_STARTED 942, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 778 declared, 0 off-target.
