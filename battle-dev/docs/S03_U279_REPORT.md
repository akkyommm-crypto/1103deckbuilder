# S03-U279 — Special win conditions: 封印されしエクゾディア

## Workflow
- opus-only engine unit (workflow v3). Profile `delegation-expanded-v3-batch3`. A class-B triage item ("a duel-win action").
- Built on U278; rebased onto the final U278.
- 終焉のカウントダウン is left ENGINE_GAP: the exact turn of 「発動ターンより20ターン後」 (which turn counts as the first) needs a ruling.

## Engine — engine/1ZZL_special_win_s03.js (new) + engine/00 tail of applyAction + ui/10
- A script declares `specialWinS03:{hand:[…names], label}`. Its owner wins when every named card is in their hand.
- `specialWinCheckS03(gs)` runs at the end of every applied Action, like the LP-0 check.
  - The win is immediate and Replay-exact, because it is derived from the state.
  - It sets `gs.loser` to the other player and `duelEndedReason:'specialWin'`.
- If both players met a condition after the same Action, the result would be a draw: `gs.loser = -1`, `'draw'`, and the status bar shows 引き分け.
  - That branch is a guard only. Simultaneous draws are still separate Actions in this engine, so it is not exercised by a test.

## Card → TESTED (2011 text) — cards/HZZZZZG_claude_s03_u279_special_win.js
- **封印されしエクゾディア:** when it and 「封印されし者の右腕」「左腕」「右足」「左足」 are all in its owner's hand, that player wins the duel.

## Existing test adjusted (status record; no behavior assertion changed)
- `test_v670_batch19`: the gap check becomes an "Engine unlocked" check; the count is unchanged (48).

## Tests
`tools/test_s03_u279_special_win.js` passes 7/0, Replay-audited.
- X1: four pieces → the game goes on. Drawing the fifth with the normal draw (through the processor) → its owner wins.
- X2: the last piece added from the Deck by an effect (FX_SEARCH) → its owner wins.
- X3: four pieces in the hand plus one on the field, and the opponent holding four → no winner.

Negative control on U278: 2 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17424 PASS / 0 FAIL** (= U278 17417 + 7 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U278.
- Coverage: TESTED 2877, ENGINE_GAP 514, NOT_STARTED 928, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 839 declared, 0 off-target.
- Published in the batched checkpoint S03-U276–U279.
