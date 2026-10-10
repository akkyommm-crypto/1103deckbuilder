# S03-U273 — Hand size limit at the end of the turn (rule) + 衰弱の霧, ヒエログリフの石版, 無限の手札

## Workflow
- opus-only engine unit (workflow v3). Profile `delegation-expanded-v3-batch3`. Built in parallel on U271, then rebased onto U272. Its full pre-scan before the rebase showed no other test changed apart from its 3 status records.
- Found while checking the class-B triage item "hand-limit modifier": DUEL had **no hand size limit at all**.
  - `processTurnV27` went straight to PASS_TURN, so a turn player could end the turn with any number of cards.
  - That is a real-duel rule gap, not only a card gap.

## Engine — engine/1ZZJ_hand_limit_s03.js (new) + engine/30 `processTurnV27`
- **`handLimitS03(gs, p)`:** the current limit of player p.
  - The default is 6.
  - A duel-long player flag `effectFlags.handLimitS03` sets it to a number.
  - A continuous source hook `continuous.handLimitS03(player, card, controller)` returns a number, or Infinity for no limit.
  - Any "no limit" wins. Otherwise the smallest number from a source applies over the flag.
- **The turn end in DUEL:** before the turn ends, a turn player over the limit chooses exactly the excess.
  - The choice is a journaled ChoiceRequest, and the processor waits on it.
  - The chosen cards are discarded as a rule discard: `FX_DISCARD byEffect:false`, reason 手札制限.
  - That discard is not 「効果で捨てられた」: no `onDiscard`, no `discardInfo`. `onDiscardAnyS03` fires with `byEffect:false`.
  - Then the turn passes. The non-turn player is not checked.

## Cards → TESTED (2011 texts) — cards/HZZZZZB_claude_s03_u273_hand_limit.js
- **衰弱の霧** (Continuous Spell): the opponent's limit is 5.
- **ヒエログリフの石版** (Spell): pay 1000 LP; the activator's limit is 7 for the rest of the duel (player flag).
- **無限の手札** (Continuous Spell): while it is face-up, neither player has a limit.

## Existing tests adjusted (status records; no behavior assertion changed)
Each check becomes an "Engine unlocked" check, and every count is unchanged:
- `test_v500_batch02` (衰弱の霧);
- `test_v510_batch03` (ヒエログリフの石版);
- `test_v520_batch04` (無限の手札).

## Tests
`tools/test_s03_u273_hand_limit.js` passes 23/0, on real DUEL paths (the turn end through the processor, the discard choice, activation) and Replay-audited.
- H1: 8 cards → choose 2. They are rule discards, then the turn passes.
- H2: 6 cards → no choice, and the non-turn player's 8 do not matter.
- I1–I2: 無限の手札 face-up → no limit; Set → limit 6.
- F1–F2: the opponent's 衰弱の霧 → limit 5; its controller is not limited.
- S1–S3: ヒエログリフの石版 → limit 7 that turn and on its next turn. It cannot be activated with 900 LP.

Negative control on U272 (engine/30 and the manifest of U272, after the rebase): 11 FAIL, no crash.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17258 PASS / 0 FAIL** (= U272 17235 + 23 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U272.
- Coverage: TESTED 2866, ENGINE_GAP 526, NOT_STARTED 928, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 827 declared, 0 off-target.
- Published in the batched checkpoint S03-U272–U275.
