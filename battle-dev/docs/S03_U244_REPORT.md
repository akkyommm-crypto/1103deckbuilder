# S03-U244 — スピリットモンスター (ENGINE_GAP 7)

## Workflow
- opus-only: an engine record that kept a group of ENGINE_GAP cards blocked.
- Written in parallel with the Sonnet U243, then rebased onto U243.
- Picked by grouping the ENGINE_GAP reasons. 7 cards shared one reason: "Needs a per-card record of 'was flipped face-up this turn'".

## Engine
- `engine/19`: every face-down → face-up change of a monster stamps `card.flippedTurnS03 = turn`. This covers Flip Summon, being flipped by an attack, and flipping by an effect. The key is zone-local and sits beside the U185 `reversedS03`.
- `engine/30` `processDrawV27`: the turn's normal draw reads two turn-stamped player flags (`effectFlags`, set through the journaled `API.setFlag`):
  - `handDiscardBeforeDrawS03`: that player discards its whole hand before the draw (「次のターンのドローフェイズのドロー前に…手札を全て捨てる」);
  - `skipDrawTurnS03`: the normal draw is not made (new `DRAW_SKIPPED_S03`). This approximates 「ドローフェイズをスキップする」: the draw is not made, and the phase itself still passes.

## Spirit helper (cards/HZZZX_claude_s03_u244_spirits.js)
- 「このカードは特殊召喚できない」 = `cannotSpecialSummon`.
- 「召喚・リバースしたターンのエンドフェイズ時に持ち主の手札に戻る」 is the card's only forced trigger, at the End Phase. It reads `summonedTurn` or `flippedTurnS03`.
- The existing cycle-13 helper (cards/B5, `c2Spirit`) marks the turn with an extra forced trigger at the summon / flip, i.e. a chain link that a real Spirit does not have. The new helper needs none. (Test A: no trigger at the summon.) The cycle-13 cards are unchanged.

## Cards (ENGINE_GAP → TESTED; overrides removed)

| Card | Effect |
|---|---|
| 不死之炎鳥 | battle damage to the opponent → recover that amount |
| 偉大天狗 | battle damage → the opponent's next Battle Phase is skipped |
| 八俣大蛇 | battle damage → draw until 5 cards in hand |
| 八汰烏 | battle damage → the opponent's next Draw Phase: no normal draw |
| 火之迦具土 | battle damage → at the next turn's Draw Phase, before the draw, the opponent discards its whole hand |
| 軍荼利 | battling a Synchro Monster: no damage calculation; both back to their owners |
| 雷帝神 | the battle damage it deals is halved |

## Existing test adjusted (status record; no behavior assertion changed)
- `tools/test_auto_cycle13.js` asserted that these 7 were unimplemented 「リバースしたターンの記録が engine に無い」. That premise is no longer true.
- They now get a positive check (registered and `cannotSpecialSummon`). The 3 Spirits still unimplemented (因幡之白兎, 阿修羅, 大和神) keep the SKIP assertion.
- The PASS count (160) is unchanged.

## Tests
`tools/test_s03_u244_spirits.js` passes 26/0, on real DUEL paths and Replay-audited.
- A Normal Summon with no trigger at the summon, then back to the hand at the End Phase.
- Flipped face-up by ワイト's attack in the opponent's turn → back to the hand at that turn's End Phase.
- 死者蘇生 cannot choose a Spirit.
- Each card's battle-damage effect, including the skipped draw (with a control that draws), the skipped Battle Phase, and the discard before the draw.
- 軍荼利 vs ガイアナイト.
- 雷帝神's halving.
- In this harness the normal draw is requested in the Draw Phase, as the UI does.

Other checks:
- Every test mentioning flips / リバース / スピリット / the draw (`processDraw`, `DRAW_REPLACED`, `drawnThisTurn`) still passes, as do `test_auto_cycle13` and `test_s03_u243`.
- Negative control on U243: 12 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16230 PASS / 0 FAIL** (= U243 16204 + 26 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U243.
- Coverage: TESTED 2730, ENGINE_GAP 587, NOT_STARTED 1003, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 690 declared, 0 off-target.
