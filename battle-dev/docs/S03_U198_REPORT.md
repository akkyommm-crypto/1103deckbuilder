# S03-U198 — PARTIAL coarse auto-table entries 2 (summon triggers, ignition costs, ペーテン)

## Finding
Seven PARTIAL cards had only coarse AUTO_DECK_TABLE entries (cards/40):
- summon-time recruits with no self check;
- ignition recruits / searches without their costs;
- 充電池メン without its continuous ATK / DEF.

## Implementation (cards/HZZF_claude_s03_u198_partial2.js)
All seven use the engine/1ZT pool (`deckTriggerPoolS03`; specs registered in `DECK_TRIGGER_S03`) and its journaled resolution choice
(`s03u156.deck-trigger`).
- `defineSummonRecruitS03`: an optional trigger on the card's own summon event.
  - 深海のディーヴァ: Normal Summon → a Level 3 or lower Sea Serpent.
  - ヒーロー・キッズ: Special Summon → any number of 「ヒーロー・キッズ」.
  - 充電池メン: Normal Summon → a 「電池メン」 other than 充電池メン, from the hand or the Deck. Continuous: +300 ATK / DEF per own face-up
    Thunder.
- Ignition effects with a cost:
  - バスター・ビースト: discard itself from the hand → 「バスター・モード」.
  - ビーストライカー: once per turn, discard 1 → モジャ.
  - ネフティスの導き手: Tribute another own monster and itself → ネフティスの鳳凰神, from the hand or the Deck.
- 闇・道化師のペーテン: an optional trigger when it is sent to the GY. Its cost banishes itself; another ペーテン comes from the hand or the Deck.

## Cards (PARTIAL → TESTED)
The seven above.

## Tests
`tools/test_s03_u198_partial2.js` 18/0 (real DUEL paths, Replay-audited). Existing tests that name these cards still pass: auto_cycle15,
class_a_recovery_02. Negative control on U197: 9 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15188 PASS / 0 FAIL** (= U197 15170 + 18 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U197.
- Coverage: TESTED 2438, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 104 (4996); audit 399 declared, 0 off-target.
