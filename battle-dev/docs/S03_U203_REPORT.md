# S03-U203 — Traps activated on the destruction of an own monster

## Finding
ヒーロー・シグナル, デステニー・シグナル, スネーク・ホイッスル and 蛇神降臨 were PARTIAL. Their coarse AUTO_DECK_TABLE entries were
`trig:"ignition"`, so they could be activated at any time. Their texts are 「…が（戦闘によって）破壊され（墓地へ送られた）時に発動する事ができる」.

## Mechanism
- A set Normal Trap with a passive on the destruction event (`onBattleDestroy` / `onDestroy`) is collected into the event group. Spell /
  Trap candidates are ranked after the monster triggers (SEGOC ranks 4 / 5) and are optional. No new engine path was needed; the probe
  confirmed the existing one.
- Engine fix found by the test: `collectHandlers` now skips a set Trap / Quick-Play Spell set this turn, the same rule the chain-response
  lists already applied. Before, the event path offered it.

## Cards (PARTIAL → TESTED) — cards/HZZK_claude_s03_u203_battle_loss_traps.js
- `defineBattleLossTrapS03`: the own monster was destroyed by battle this turn, by the opponent (graveInfo).
  - ヒーロー・シグナル: a Level 4 or lower 「E・HERO」 from the hand or the Deck.
  - デステニー・シグナル: a Level 4 or lower 「D－HERO」 from the hand or the Deck.
- `defineDestroyedTrapS03`: an own monster destroyed from the Monster Zone this turn.
  - スネーク・ホイッスル: a Reptile → a Level 4 or lower Reptile from the Deck.
  - 蛇神降臨: face-up 毒蛇王ヴェノミノン, other than by battle → 毒蛇神ヴェノミナーガ from the hand or the Deck.

## Tests
`tools/test_s03_u203_loss_traps.js` 14/0 (real DUEL paths, Replay-audited).
- The Signals: the own monster destroyed by battle; a Signal set this turn is not offered; the opponent's monster destroyed does not
  offer it.
- スネーク・ホイッスル / 蛇神降臨: the own monster destroyed by the opponent's サンダー・ボルト; 蛇神降臨 is not offered when destruction
  is by battle.

Negative control on U202: 4 FAIL. The old ignition entries never resolved these paths.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15295 PASS / 0 FAIL** (= U202 15281 + 14 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U202.
- Coverage: TESTED 2483, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 59 (4996); audit 444 declared, 0 off-target.
