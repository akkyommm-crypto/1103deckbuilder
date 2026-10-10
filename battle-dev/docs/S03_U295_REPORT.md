# S03-U295 — Group summaries per move group: two chain links are two occurrences

## Workflow
- opus-only engine unit (workflow v3). Profile `delegation-expanded-v3-batch3`. Built on S03-U294.
- Found while planning 死霊の誘い: a chain whose two links each mill cards drains all its events at the chain end.
  - The S03-U290 / U293 summaries grouped everything drained together.
  - So パラライズ・チェーン (published in batch6) triggered once (300) instead of once per link (600).

## Engine
- engine/12 `p3StampMoveProvenanceV3` adds the move group to the journaled P3 stamp:
  - `L<chainId>` for a chain link's resolution;
  - `C<uid>:<seq>` for an activation's cost;
  - `E/K<player>` for a resolution outside a chain.
- engine/00 / 1ZZN:
  - The queued events carry the group (`provS03.grp`; now also for effect destruction and mass destruction).
  - The reducer makes one summary per group.
- engine/30:
  - In a leave-field batch, each summary is its own occurrence: a card may trigger once per summary (the per-card dedupe still applies to other events).
  - `safeActivationEventV11` keeps a summary's plain-JSON lists (`summaryS03`), because the SEGOC continuation rebuilds the remaining candidates from that descriptor. Before, the second candidate lost `reasons` and its condition failed.
- engine/1ZZN `cardBeingActivatedS03(card)`: 「このカードの発動中」 means a card-activation link of the card is on the chain. A face-up card's own trigger on the chain also sets `activationPending`, which stopped its second trigger.
  - Used by パラライズ・チェーン, 魔力の棘, 死の演算盤 and バックファイア, and (after the rebase onto S03-U292) ライト・オブ・デストラクション and 強制接収.

## Tests
`tools/test_s03_u295_move_groups.js` passes 5/0, Replay-audited.

| Case | Situation | Result |
|---|---|---|
| G1 | Two 針虫の巣窟 links in one chain | Two triggers in one SEGOC, 600 |
| G2 | Activation descriptor | Keeps the summary lists; other events stay scalar-only |
| G3 | One link | One trigger, 300 |

- The U290, U293 and U294 tests still pass.
- Negative control on U294: 2 FAIL (G1, G2).

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **18058 PASS / 0 FAIL** (= U294 18053 + 5 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U294.
- Coverage: TESTED 2926, ENGINE_GAP 472, NOT_STARTED 921, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 888 declared, 0 off-target.
- Published in the batched checkpoint S03-U292–U295.
