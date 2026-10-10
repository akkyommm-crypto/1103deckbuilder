# S03-U190 — ライトロード (ガロス, ジェニス, ウォルフ, ルミナス, ライニャン, 光の召集) + three engine rules

## Findings
Six ライトロード cards had scripts (IMPLEMENTED) but no dedicated test. Tests showed:
- ガロス had no trigger at all.
- ウォルフ had no trigger at all.
- ジェニス fired at every End Phase.
- ルミナス's ignition effect was usable in any phase and in the opponent's turn.
- ライニャン put the returned card on top of the Deck and drew it straight back.
- 光の召集's mandatory add step could be cancelled.

Three engine-wide gaps showed up along the way:
1. **Events queued by the End Phase processing were never dispatched in that End Phase.** The ライトロード End Phase mills therefore
   triggered nothing (ウォルフ, ガロス, ジェニス) until the next chain, in a later turn.
2. **「このカードは通常召喚できない」 was not enforced.** Every such monster in the hand was offered a Normal Summon / Set with the standard
   Tributes. This hit 140 monsters (Sin, カオス・ソーサラー, ウォルフ, …) and all 33 Ritual Monsters.
3. **The `mainPhase` timing (「自分のメインフェイズ」) did not check whose turn it was.**

## Engine
- `engine/1ZZE_lightsworn_mill_s03.js`:
  - `lswStampMillS03` (called from `act()`) stamps a FX_MILL_TOP / FX_MILL Action with the resolving 「ライトロード」 link (`lswSrcS03`).
    Costs are not stamped, so ケルビム's cost does not count.
  - The End Phase mills stamp their own source.
  - The reducers call `lswMillAppliedS03`. It records `players[p].lswMillTurnS03` and queues `onLightswornMillS03` {player, src, srcUid, uids}.
- `engine/30` `processEndPhaseV30`: when events are pending it enqueues DRAIN_EVENTS, so they are dispatched in this End Phase.
- `engine/70` `cannotNormalSummonS03(db)`: a text restriction, `cannotNormalSummon`, or a Ritual Monster gives no Normal Summon / Set
  method.
- `engine/30` `strictScriptLegalityV2`: a monster's non-quick effect whose timing is only `mainPhase` is legal only in its controller's turn.
  Only monsters: a Trap's effect is Spell Speed 2 whatever timing its script declares (零式魔導粉砕機, `tools/test_s03_u13` — caught by the
  pre-scan).

## Cards (IMPLEMENTED → TESTED)
- ガロス: a forced trigger on `onLightswornMillS03` from another own-field 「ライトロード」 monster. It mills 2, then draws 1 per
  「ライトロード」 monster among them.
- ジェニス: fires only in a turn with a 「ライトロード」 effect mill of its controller's Deck, including that End Phase's mills. Once per
  turn (`jenisTurnS03`).
- ウォルフ: a forced `onSendToGrave` trigger when sent from the Deck.
- ルミナス: `timing:['mainPhase']`.
- ライニャン: the Deck is shuffled before the draw.
- 光の召集: the add step is mandatory.

## Tests
`tools/test_s03_u190_lightsworn.js` 24/0 (real DUEL paths: End Phase, flip summon, ignition; Replay-audited).
Negative control on U189: 8 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **14986 PASS / 0 FAIL** (= U189 14962 + 24 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U189.
- Coverage: TESTED 2371, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 53, GENERIC_OK 644, PARTIAL 121 (4996); audit 332 declared, 0 off-target.
