# S03-U285 — ENGINE_GAP re-check 7: イビー, A・O・J サイクロン・クリエイター, 絶対魔法禁止区域, マーダーサーカス (魔轟神ルリー, 魔轟神獣キャシー parked)

## Workflow (mixed, Sonnet 5.5 battle-implementer)
- Brief `brief285.md`: six ENGINE_GAP cards, no engine change allowed. Four finished; two parked (below).
- Dedicated test `tools/test_s03_u285_gap7.js`: 54 asserts, real DUEL paths (hand / field ignition, chain windows, POINT responses, Flip Summon, manual and effect position changes, Battle Phase), Replay-audited.

## Cards → TESTED (2011 texts) — cards/HZZZZZL_claude_s03_u285_gap7.js
- **イビー:** forced trigger from the Graveyard on `onDiscardAnyS03`; only a discard from the hand by an effect (discardInfo set) whose acting player (`moveProvenance.actingPlayer`, stamped by the engine) is the opponent of its owner. 1000 damage to the opponent. A cost discard, the hand-size rule and its own controller's effect do not count.
- **A・O・J サイクロン・クリエイター:** ignition, once per turn, cost discard 1. Opus ruling: not activatable without a face-up Tuner or without a Spell/Trap on the field. Nothing is targeted: at resolution the face-up Tuners of both fields are counted (itself included) and the activating player chooses that many Spell/Trap cards (fewer if fewer exist; Set cards and Field Zones included), returned to their owners' hands by uid.
- **絶対魔法禁止区域:** Continuous Spell; `continuous.grantUnaffectedS03` (S03-U249 on the S03-U115 effect-source stamp): every face-up non-Effect Monster of both players (no 効果 in its types; Tokens too) is unaffected by Spell effects while it is face-up. Effect Monsters, face-down monsters, Trap and monster effects are unchanged.
- **マーダーサーカス:** forced `onPositionChange` trigger from Defense (face-up or face-down) to face-up Attack (manual change, Flip Summon, effect). The target (1 opponent monster, face-down too) is chosen at activation (P1.1) and returned to its owner's hand; with no opponent monster it does not activate.

## Parked (left ENGINE_GAP): 魔轟神ルリー, 魔轟神獣キャシー
Both are forced triggers on any discard from the hand, the hand-size rule included. The scripts and tests worked on the cost and effect paths, but the hand-size rule path loses the trigger:
- `handLimitStepS03` (engine/1ZZJ) opens the choice; its handler discards with `act({type:'FX_DISCARD', byEffect:false, ...})`, which queues `onDiscardAnyS03` and `onSendToGrave` in `gameState.deferredEvents`.
- `processTurnV27` (engine/30) then resumes with `handLimitDoneS03` and goes straight to onTurnEnd / PASS_TURN; nothing drains the queue (it stays in `gameState.deferredEvents` through the next turn).
- Verified fix (tried in a scratch copy only, not in this tree): in `processTurnV27`, prepend `{type:PROCESSOR_V27.DRAIN_EVENTS,payload:{}}` when `pl.handLimitDoneS03` to the list enqueued before onTurnEnd. With it the Ruri trigger fires in the End Phase and the position question is asked.
- The saved scripts and test sections are in the scratchpad (`u285_parked_ruri_cassy.js`, `u285_parked_ruri_cassy_test.txt`) for the follow-up unit.

## Existing tests adjusted (status records; no behavior assertion changed)
Each check moves from the "precise ENGINE_GAP" list to an "unlocked" check, with `/* S03-U285: implemented and tested; kept as a record */`, and every count is unchanged:
- `test_v750_batch27`: イビー;
- `test_v640_batch16`: A・O・J サイクロン・クリエイター;
- `test_v520_batch04`: 絶対魔法禁止区域;
- `test_v660_batch18`: マーダーサーカス.
`test_v820_batch33` (魔轟神 cards) is unchanged: the two cards stay ENGINE_GAP.

Negative control on U284: 22 FAIL (the test fails, no crash).

## Opus review
- イビー, A・O・J サイクロン・クリエイター, 絶対魔法禁止区域 and マーダーサーカス are accepted as TESTED.
- 絶対魔法禁止区域 also protects Tokens; they are non-Effect monsters.
- The hand-size rule discards of S03-U273 left their events undrained, so no 「捨てられた時」 trigger fired. This unit found it. It is fixed in S03-U287 together with 魔轟神ルリー / 魔轟神獣キャシー.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17680 PASS / 0 FAIL** (= U284 17626 + 54 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U284.
- Coverage: TESTED 2898, ENGINE_GAP 498, NOT_STARTED 923, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 860 declared, 0 off-target.
- Published in the batched checkpoint S03-U284–U287.
