# S03-U287 — The hand-size discards trigger 「捨てられた時」 effects: 魔轟神ルリー, 魔轟神獣キャシー

## Workflow
- opus-only engine fix (workflow v3). Profile `delegation-expanded-v3-batch3`.
- The Sonnet unit S03-U285 found a defect in S03-U273 (later defect of U273):
  - the discards of the hand-size rule queued `onDiscardAnyS03` / `onSendToGrave`;
  - `processTurnV27` then went straight to the turn end, and nothing drained the queue;
  - so no 「手札から墓地へ捨てられた時」 trigger fired, and the events stayed queued into the next turn.
- Sonnet parked the two cards with its scripts and scenarios; this unit applies the fix and integrates them.

## Engine — engine/30 `processTurnV27`
- After the hand-size discards (`handLimitDoneS03`), a `DRAIN_EVENTS` step runs before `onTurnEnd`, so their triggers are resolved before the turn ends.

## Cards → TESTED (2011 texts) — cards/HZZZZZN_claude_s03_u287_hand_discard.js (scripts by Sonnet U285)
- **魔轟神ルリー:** forced; when it is discarded from the hand (a cost, an effect or the hand-size rule), it Special Summons itself from the GY. The player chooses the position.
- **魔轟神獣キャシー:** forced; when it is discarded from the hand, it targets 1 face-up card on the field and destroys it.

## Existing test adjusted (status record; no behavior assertion changed)
- `test_v820_batch33`: two "Engine unlocked" checks replace the two gap checks; the count is unchanged (64).

## Tests
`tools/test_s03_u287_hand_limit_triggers.js` passes 19/0, Replay-audited. The scenarios were written by Sonnet in U285.
- R1–R4 (ルリー): discarded as a cost, by the opponent's 手札抹殺, or by the hand-size rule → summoned. Negative: no free zone.
- K1–K5 (キャシー): the same discard paths → the chosen face-up card is destroyed.
- Test setup fixed when lifting the sections into their own file:
  - the hand is created after the reset;
  - the baseline is re-taken after the extra setup;
  - the manual position flag is set.

Negative control on U286: 9 FAIL. Only the drain reverted: 2 FAIL, exactly the hand-size paths R3 and K5.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17714 PASS / 0 FAIL** (= U286 17695 + 19 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U286.
- Coverage: TESTED 2902, ENGINE_GAP 496, NOT_STARTED 921, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 864 declared, 0 off-target.
- Published in the batched checkpoint S03-U284–U287.
