# S03-U155 — エネミーコントローラー (permanent control), 異次元からの帰還 / 封印の黄金櫃 (reminders) carried out

## Why
The remaining kind-less `RESERVE_ADD` reminders in scripts in effect, after U154:

| Card | Status | Before |
|---|---|---|
| エネミーコントローラー | IMPLEMENTED | `API.changeControl` was called **without `'endPhase'`**, so the monster stayed under the activating player's control for the rest of the duel. The reserve after it was only a reminder. Also: the release was done at resolution although it is the activation cost, and face-down monsters could be targeted although the text says 表側表示. |
| 異次元からの帰還 | IMPLEMENTED | 「エンドフェイズ時にゲームから除外される」 was a reminder; the monsters stayed. |
| 封印の黄金櫃 | TESTED | 「発動後2回目の自分スタンバイフェイズに…手札に加える」 was a reminder; the banished card never came back. |

(レスキューラビット's reserve already has `kind:'destroyUids'` and is carried out.)

## Change
- エネミーコントローラー (`cards/00_generic_core.js`):
  - `changeControl(…, 'endPhase', null, {noAttack:false, noTribute:false})`; the text gives no attack / Tribute restriction;
  - the release is paid in the activation step, before choosing the target;
  - only face-up opponent monsters can be targeted, and at resolution the target must still be face-up on the opponent's field.
- 異次元からの帰還:
  - each monster it Special Summons gets the zone-local mark `u155ReturnTurn`;
  - `s03u155.return-banish` is scheduled for this End Phase and banishes the monsters that still carry the mark.
- 封印の黄金櫃 (`cards/20_control_counter.js`):
  - the banished card gets the mark `u155CoffinTurn`;
  - `s03u155.coffin-return` is scheduled for the Standby Phase of turn T+4, the 2nd own Standby Phase after activation in turn T.
    It adds the card to the hand if it is still banished with that mark.
- `engine/00_state_actions.js` `ZONE_LOCAL_KEYS`: `u155ReturnTurn`, `u155CoffinTurn`.

## Test — `tools/test_s03_u155_reminders2.js` 10/0 (real DUEL path: activations, choices, phases and turns; Replay-audited)
- A エネミーコントローラー: ワイト released, デーモンの召喚 under player I's control, back to player II at the End Phase.
- B 異次元からの帰還: LP 8000 → 4000, both banished monsters Special Summoned, banished again at the End Phase.
- C 封印の黄金櫃: サイクロン banished; still banished at turn 7's Standby Phase; added to the hand at turn 9's.
- Negative control on U154 (`dist/battle.html` + this test): 3 FAIL, 0 errors (the control stayed with player I, the monsters
  stayed, the card stayed banished).
- `test_s03_u64_resolution_deck_choice_remaining14.js` (封印の黄金櫃's choice) keeps 46/46.

## Status
- IMPLEMENTED → TESTED: エネミーコントローラー, 異次元からの帰還. 封印の黄金櫃 stays TESTED, now for its full text.
- TESTED 2236 → 2238, IMPLEMENTED 88 → 86.

## Gate
- `python tools/check.py` — `GATE_EXIT=0`, 14364 PASS lines (= U154 14354 + 10 new, exactly), 0 FAIL, no Traceback / ReferenceError
  (one caught `TypeError` stack from `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level function declarations".
- Pre-scan of all 374 gate tests (parallel): every exit code 0, 0 FAIL; per-file PASS / Error counts equal to U154 except the new test.
- `dist/battle.html` SHA256 `aa650b677bb095b20df20bb5a89304482bfd9dbabec2e3f3b8abc57fd8d3807e` (build output identical to the gate build);
  Acode regenerated after the gate: `dist/battle_acode.html` `2d6b5d8d4aed096d9164d035e81d5e740449b5c5079d178be71c33ed0c8228b7`.
- Coverage: TESTED 2238, IMPLEMENTED 86, ENGINE_GAP 607, GENERIC_OK 644, PARTIAL 174, NOT_STARTED 1247 (4996); 205 declared status
  changes, 0 off-target.
