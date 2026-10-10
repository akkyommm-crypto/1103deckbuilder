# S03-U192 — staples 2 (6 script fixes)

## Findings
Ten staple cards had scripts (IMPLEMENTED) but no dedicated test. Six did not follow the text.

| Card | Problem |
|---|---|
| デステニー・ドロー | The 「D－HERO」 discard was chosen as a target and discarded at resolution. It is a cost. |
| 地砕き | The tie-break choice among the highest-DEF monsters could be cancelled, which skipped the mandatory destruction. |
| 非常食 | One card, chosen as a target and sent at resolution. The text says any number of other own Spell / Trap cards, sent as a cost. |
| 抹殺の使徒 | The target was only banished, not destroyed. The clause 「リバース効果モンスターだった場合…同名カードを全て除外」 was only a log line. |
| 魔宮の賄賂 | It targeted any opponent Spell / Trap on the field at any time. It is a Counter Trap that responds to the opponent activating a Spell / Trap card. |
| 死のマジック・ボックス | Both monsters were chosen at resolution, and each choice could be cancelled. The text targets both at activation. |

## Fixes
- デステニー・ドロー: `cost` (discard before CHAIN_ADD).
- 地砕き: the tie choice can't be cancelled.
- 非常食: P1.1 activation choice. The player picks 1 or more cards, which are sent as the cost and recorded with `recordActivationCost`. It
  gains 1000 LP per card at resolution.
- 抹殺の使徒:
  - `API.destroyAndBanish` (FX_DESTROY_BANISH);
  - for a Flip effect monster (`flipEffectMonsterS03`, from the text), every same-name card in both Decks is banished and both Decks are
    shuffled.
- 魔宮の賄賂:
  - `bribeLinkS03` checks that the opponent's top chain link is a card activation (`link.cardActivationS03`);
  - it is declared with `declareActivationResponseS03` (engine/1P), so it is offered as a chain response;
  - `API.negateChainLink(…, 'activation', …, true)`, then the opponent draws 1.
- 死のマジック・ボックス: both targets are chosen in `selectTargets` (recorded in CHAIN_ADD). At resolution it destroys the opponent's monster,
  then gives the controller's monster to the opponent.

## Cards (IMPLEMENTED → TESTED)
The six above, plus 生者の書－禁断の呪術－, 異次元からの埋葬, ソーラー・エクスチェンジ and 鳳翼の爆風 (scripts unchanged, now tested).

## Tests
`tools/test_s03_u192_staples2.js` 26/0 (real DUEL paths, Replay-audited). 魔宮の賄賂 is tested as Player 1's chain response to the opponent's
強欲な壺. Negative control on U191: 8 FAIL. On the old build, 魔宮の賄賂 was offered but the Pot still resolved.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15034 PASS / 0 FAIL** (= U191 15008 + 26 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U191.
- Coverage: TESTED 2388, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 36, GENERIC_OK 644, PARTIAL 121 (4996); audit 349 declared, 0 off-target.
