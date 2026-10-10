# S03-U293 — Monsters sent from the field to the GY together: one summary event in the same batch (死の演算盤, バックファイア)

## Workflow
- opus-only engine unit (workflow v3). Profile `delegation-expanded-v3-batch3`.
- Built on S03-U291 while the Sonnet unit S03-U292 runs; it is rebased onto U292 before its gate.
- Engine gap from the gap queue: 「フィールド上に存在するモンスターが墓地へ送られる度に…1枚につき」 (死の演算盤) and 「表側表示の炎属性モンスターが破壊され墓地へ送られる度に」 (バックファイア) need one event per group of monsters that went to the GY together, with each card's owner, controller and last known state.

## Engine
- engine/00:
  - The GY record (`graveInfo`) of a monster that leaves a Monster Zone now also keeps its Attribute and its controller on the field (`attrS03`, `ctrlS03`).
  - This covers all four moves: an effect (FX_TO_GRAVE), mass destruction (FX_WIPE_ZONE), battle (BATTLE_CLEANUP) and Synchro material.
- engine/1ZZN:
  - New summary `onFieldToGraveBatchS03`, one per group (both owners): `{count, count0, count1, uids, items[{uid, owner, ctrl, byDestroy, battle, face, attr, reason}]}`. It is built from the queued onSendToGrave events of monsters whose `graveInfo.from` is 'mz' in this turn.
  - Every summary (also U290's mill / discard summaries) is now inserted right after the last queued event of its group, not at the end of the queue.
- engine/30:
  - The leave-field batch (S03-U156) includes the summaries. A single card's events plus its summary are one batch too.
  - The summary therefore triggers in the same SEGOC as the per-card triggers: 死の演算盤 and クリッター are chained together.
  - Before this, U290's summaries started a separate chain after the per-card triggers had resolved.
  - The battle cleanup batch gets the summary of the monsters destroyed by that battle.

## Cards (cards/HZZZZZR)
- 死の演算盤: forced, once per group. Each owner takes 500 × its own monsters in the group (both at once).
  - Any way to the GY counts: destruction, battle, Tribute, Synchro material.
  - Spell / Trap cards do not count. Tokens do not reach the GY.
- バックファイア: forced, once per group. If at least one monster was a face-up FIRE monster on its controller's field, and was destroyed (battle or effect) and sent to the GY, the opponent takes 500.
- ENGINE_GAP overrides removed. Status records `test_v730_batch25` and `test_v740_batch26` keep the record.

## Tests
`tools/test_s03_u293_field_to_grave.js` passes 26/0, Replay-audited.

| Case | Situation | Result |
|---|---|---|
| C1 | ブラック・ホール: 1 + 2 monsters, one face-down | 500 / 1000 |
| C2 | Battle | 1500 + 500 |
| C3 | Mutual battle destruction | 500 each |
| C4 | Tribute | 500 |
| C5 | Trap card destroyed | No trigger |
| C6 | 死の演算盤 face-down | No trigger |
| C7 | クリッター + 死の演算盤 | One chain |
| B1 | 2 FIRE monsters by サンダー・ボルト | One trigger, 500 |
| B2 | Face-down FIRE / DARK | No trigger |
| B3 | FIRE monster Tributed | No trigger |
| B4 | Battle | 500 |
| B5 | Opponent's FIRE monster | No trigger |
| E1 | Summary contents | As specified above |

- The U290 test's capture helper now finds new queue items by identity, because summaries are inserted after their group. Its assertions are unchanged; it still passes 20/0.

Negative controls:
- U291 build: 8 FAIL (no crash).
- The leave-batch change stubbed alone: 1 FAIL (C7).

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **18040 PASS / 0 FAIL** (= U292 18014 + 26 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U292.
- Coverage: TESTED 2926, ENGINE_GAP 472, NOT_STARTED 921, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 888 declared, 0 off-target.
- Published in the batched checkpoint S03-U292–U295.
