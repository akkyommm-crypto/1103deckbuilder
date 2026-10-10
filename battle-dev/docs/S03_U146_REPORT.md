# S03-U146 — who destroyed it (DUEL); 「このカードが…」 leave-field triggers only for their own destruction, once

## Why
- U145 found scripts whose 「このカードが破壊された／墓地へ送られた」 trigger fired on *another* card's event. Leave-field events are
  broadcast to every card; each script's passive handler decides.
- This unit audited all 153 scripts that have a leave-field handler (`onSendToGrave` / `onDestroy` / `onBattleDestroy` /
  `onRemove`) through the real candidate path (`collectHandlers`, which includes the DUEL legality check). Two questions:
  - **Q1: another card's event.** Is the script offered for another card's event, with the script card in the GY / field / hand /
    banished zone? 10 cards are. 7 are correct by their text, because they trigger on other cards: エンシェント・クリムゾン・エイプ,
    クラッキング, ゼロ・フォース, 棺桶売り, 神海竜ギシルノドン, 虚無空間, 魂吸収. 3 are wrong: D－HERO ダブルガイ, ハネクリボー,
    六武衆の師範.
  - **Q2: two events for one destruction.** One destruction raises several events: `onDestroy` + `onSendToGrave`, plus
    `onBattleDestroy` in battle. Is the script offered for two of them? D－HERO ダブルガイ (effect and battle) and 魔轟神レヴュアタン
    (battle) are.
- 六武衆の師範 ③ 「このカードが相手の効果で破壊された場合」 also needs the destroying player. `graveInfo.byPlayer` was wrong in DUEL:
  - `destroyerPlayerV30` read the top of `gs.chain`, but the resolving link has already left the chain (`CHAIN_RESOLVE_TOP`);
  - so `byPlayer` was `null` for a one-link chain;
  - and it was the player of the **next link down** for a longer chain. The negative control shows player II's サイクロン recorded as
    destroyed by player I.

## Change
- `engine/1M_provenance_v30.js` `destroyerPlayerV30`: after an explicit `byPlayer`, it takes the resolving effect's controller
  from the Action's P3 stamp (`a.p3.actingPlayer`, reason `effect`). `act()` writes that stamp into the Action (runtime/50), so
  it is Replay-safe. The chain fallback is kept only for non-DUEL callers.
- `engine/12_provenance_v3.js`: `FX_WIPE_ZONE` (mass destruction) is P3-stamped like `FX_TO_GRAVE`, so its destroyed cards get
  `moveProvenance` and `byPlayer`.
- Cards (all use U145's `eventIsSelfS03`):

  | Card | Before | Now |
  |---|---|---|
  | D－HERO ダブルガイ | listened to `onDestroy` and `onSendToGrave`, with no self check | `onDestroy` only, own event only |
  | ハネクリボー | no self check | own event only |
  | 魔轟神レヴュアタン | listened to `onBattleDestroy` and `onDestroy` | `onDestroy` only (it covers both battle and effect destruction), own event only |
  | 六武衆の師範 | fired on any card destroyed by any effect | ③ needs its own `onDestroy`, reason `effect`, and `byPlayer` = the opponent (event or graveInfo) |

- `tools/test_auto_cycle25.js`: its ダブルガイ checks called `passive.onSendToGrave` directly. They now call `passive.onDestroy`, with the
  same assertions: positive when destroyed, negative when sent to the GY without being destroyed.
  - The first gate run exposed this. The call threw a TypeError, the harness caught it, and the file exited 0 with 14 of its 99
    PASS, so the gate total fell by 68 instead of rising. The pre-scan had checked exit codes and FAIL lines only.
  - The pre-scan now also compares per-file PASS / `Error:` counts with the previous tree. After the fix, cycle25 is the only file
    that differs from U145, and it is back to 99/99.

## Test — `tools/test_s03_u146_self_event_destroyer.js` 17/0 (real DUEL path, Replay-audited)
- P:
  - player I's サイクロン destroys a set card → `byPlayer` 0.
  - In a two-link chain (player I ブラック・ホール, player II chains サイクロン on player I's set card):
    - the set card → `byPlayer` 1;
    - the ワイト destroyed by ブラック・ホール → `byPlayer` 0.
- S 六武衆の師範:
  - destroyed by the opponent's ブラック・ホール together with another 六武衆 → ③ once, and one 六武衆 returns to the hand;
  - destroyed by its controller's own ブラック・ホール → no activation.
- S ダブルガイ / ハネクリボー:
  - destroyed together with 2 other monsters → each activates exactly once;
  - ダブルガイ destroyed by battle → once;
  - ハネクリボー already in the GY → no activation when another monster is destroyed by battle.
- S レヴュアタン: destroyed by battle → activates once (it may choose itself; a Synchro "added to the hand" returns to the Extra
  Deck).
- Negative control on U145 (`dist/battle.html` + this test): 7 FAIL, 0 errors:
  - `byPlayer` null / wrong player;
  - 師範: twice for the opponent's effect, and once for its own effect;
  - ダブルガイ: **6 activations** in the mass-destruction case;
  - ハネクリボー: activated for another monster's battle destruction.

  The レヴュアタン and "ハネクリボー destroyed with others" cases already passed on U145: in the real paths a second offer was not
  reached. The probe showed both events offered it, and the fix removes that.
- Probes rerun on U146:
  - Q1 lists only the 7 legitimate "another card" triggers.
  - Q2 finds none.

## Not in this unit (recorded)
- D－HERO ダブルガイ's tokens 「特殊召喚できる」 are summoned without asking (`d4.tokens` schedule); the optional choice is not
  offered.
- The 7 legitimate "another card" triggers were not re-verified against their texts in this unit. The probe only confirms they
  react to other cards, as their texts say.

## Status
- No status change (all four cards stay TESTED; their tests now also check these cases).

## Gate
- `python tools/check.py` — `GATE_EXIT=0`, 14245 PASS lines (= U145 14228 + 17 new, exactly), 0 FAIL, no Traceback / ReferenceError
  (one caught `TypeError` stack from `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level function
  declarations". (A first run before the cycle25 update had 14160 — see above; not published.)
- Pre-scan of all 365 gate tests (parallel): every exit code 0, 0 FAIL; per-file PASS / Error counts equal to U145 except the new test
  (and cycle25, fixed).
- `dist/battle.html` SHA256 `90ee7dcc23b81cf1238019d7b7830b0973297eaaca9276cd7afe37b8dbf72c62` (build output identical to the gate build);
  Acode regenerated after the gate: `dist/battle_acode.html` `a158d3226e6402a7f2e1dd00d5d386c1b13e35e19ce4c67218297d22799fe085`.
- Coverage: TESTED 2222, IMPLEMENTED 94, ENGINE_GAP 607, GENERIC_OK 644, PARTIAL 174, NOT_STARTED 1255 (4996); 189 declared status
  changes, 0 off-target (unchanged).
