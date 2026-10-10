# S03-U290 — Grouped Deck-to-GY and discard events with counts; forced Spell / Trap triggers cannot be skipped

## Workflow
- opus-only engine unit (workflow v3). Profile `delegation-expanded-v3-batch3`.
- Engine gap from the gap queue: 「…が墓地へ送られる度に」 and 「捨てたカードの数×500」 need one event per group of cards that moved together, with the count and how they moved. The engine queued one event per card only.

## Engine
- engine/1ZZN (new):
  - When the processor starts draining queued events (`processDrainEventsV27`, engine/30), the journaled automatic action `EVENT_SUMMARY_S03` (reducer in engine/00) adds one summary per player for the events queued so far:
    - `onMillBatchS03` (Deck → GY);
    - `onDiscardBatchS03` (discard from the hand).
  - Each summary carries `{player, count, uids, actingPlayers, reasons, byEffect}`.
  - The per-card events are kept, so existing triggers are unchanged.
- Provenance on the queued event (`evt.provS03`, engine/00):
  - FX_MILL, FX_MILL_TOP, FX_DISCARD, and FX_TO_GRAVE from the Deck copy the action's P3 stamp onto the event.
  - FX_TO_GRAVE from the Deck now queues a Deck-to-GY event, which it never did before.
  - The card's own `moveProvenance` is not read: an unstamped move leaves an older one on the card.
- Costs of chain activations (engine/12 `p3StampMoveProvenanceV3`):
  - A move made while a chain activation is being prepared (`ACTIVATION_PREP_S03`) and outside any effect context is stamped `{reason:'cost', actingPlayer}`.
  - Before this, costs paid through `prepareDuelActivation` had no stamp, so they looked like effects to a reader of the reason.
- Forced Spell / Trap triggers (engine/40, SEGOC ranks 4 / 5):
  - A forced trigger of a face-up Spell or Trap (`forcedSTS03`) keeps its place after the monster trigger groups (S03-U27), but the player can no longer skip it.
  - `eventSkipGroupV2` drops only the optional candidates of that group.
  - This applies to every forced Spell / Trap trigger (つまずき, 冥界の宝札, 底なし流砂 …). Before, skipping the group declined them.
  - The flag is kept in the P1.1 continuation descriptor (engine/1O), so it survives a restored event selection.

## Cards (cards/HZZZZZP)
- パラライズ・チェーン: each time cards are sent from the opponent's Deck to the GY by a card effect → 300 to the opponent.
  - One trigger per group of cards (not per card).
  - Any card's effect counts, the opponent's own included; a cost does not.
- 魔力の棘: the opponent's hand discarded → 500 × the number of cards discarded together.
  - Covers a cost, an effect, or the hand-size rule (the text names no cause).
- The ENGINE_GAP overrides were removed. The old status tests (`test_v700_batch22`, `test_v750_batch27`) keep the record.

## Tests
`tools/test_s03_u290_event_summary.js` passes 20/0, Replay-audited.

| Case | Situation | Result |
|---|---|---|
| P1 | 針虫の巣窟 sends 5 cards of the opponent's Deck | One trigger, 300 |
| P1b | The trigger group is declined 3 times | The trigger stays and resolves |
| P2 | Two separate activations | Two triggers, 600 |
| P3 | The controller's own Deck | No trigger |
| P4 | ナチュル・ビースト pays a cost of 2 cards from its Deck to negate a Spell | No trigger |
| T1 | 手札抹殺: the opponent discards 3 together | 1500 once |
| T2 | Hand-size rule discards 2 | 1000 |
| T3 | Only own cards discarded | No trigger |
| T4 | 魔力の棘 set face-down | No trigger |
| E1 | Summary contents | One onMillBatchS03, count 5, reasons [effect], acting player 1 |

Negative controls:
- U289 build: 6 FAIL.
- Cost stamp and forced-skip fix stubbed: 2 FAIL (P4, P1b).

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17856 PASS / 0 FAIL** (= U289 17836 + 20 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U289.
- Coverage: TESTED 2910, ENGINE_GAP 488, NOT_STARTED 921, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 872 declared, 0 off-target.
- Published in the batched checkpoint S03-U288–U291.
