# S03-U206 — PARTIAL coarse auto-table entries 9

## Finding
Eight PARTIAL cards had only coarse AUTO_DECK_TABLE entries (cards/40), without their costs, conditions or locks.

## Engine
- `players[p].lv8ToGraveTurnS03`: set by the FX_TO_GRAVE, FX_WIPE_ZONE and BATTLE_CLEANUP reducers when a Level 8 or higher monster goes
  from player p's Monster Zone to the GY.
- It supports 「レベル8以上の自分フィールド上のモンスターが墓地へ送られたターン」 (デーモンとの駆け引き). The mark is set inside the Action, so
  Replay reproduces it.

## Cards (PARTIAL → TESTED) — cards/HZZN_claude_s03_u206_partial9.js
| Card | 2011 text implemented |
|---|---|
| インフェルニティ・インフェルノ | Discard up to 2; as many 「インフェルニティ」 cards from the Deck to the GY. |
| コンバート・コンタクト | No own monster. An 「N」 from the hand and one from the Deck to the GY, then draw 2. |
| フェザー・ウィンド・アタック | Cost: a face-up 「BF」 back to the Deck. A 「BF」 monster from the Deck to the hand. |
| 督戦官コヴィントン | Cost: the 3 named マシンナーズ to the GY. マシンナーズ・フォース from the hand or the Deck. |
| ロード・ウォリアー | Once per turn: a Level 2 or lower Warrior / Machine from the Deck. |
| 黒魔術のカーテン | Not after a summon this turn. Cost: half the LP. ブラック・マジシャン from the Deck; the turn's summon lock is applied after that summon. |
| デーモンとの駆け引き | After the mark above: バーサーク・デッド・ドラゴン from the hand or the Deck. |
| 魔轟神獣ペガラサス | ① discarded (any discard, `onDiscardAnyS03`): special summons itself face-down. ② Flip: show a 「魔轟神」, then a 「魔轟神」 from the Deck to the GY. |

## Tests
`tools/test_s03_u206_partial9.js` 22/0 (real DUEL paths, Replay-audited). Negative control on U205: 13 FAIL.

## Left
超古深海王シーラカンス stays PARTIAL. Its ② negation (Tributing a Fish in response to an effect that targets it) is not implemented.

## Follow-up (found by `tools/test_s03_u135` before the gate)
コンバート・コンタクト's Deck pool spec (`nameHas:'N・'`) is registered in `DECK_TRIGGER_S03`, so the auto-table identity check keeps
counting its entry.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15365 PASS / 0 FAIL** (= U205 15343 + 22 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U205.
- Coverage: TESTED 2507, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 35 (4996); audit 468 declared, 0 off-target.
