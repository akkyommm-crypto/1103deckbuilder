# S03-U234 — unified-card trigger passives and the manual position-change drain

## Workflow
- opus-only. The fix is in the shared engine, and it started from a defect the Sonnet subagent noticed in S03-U232.
- That subagent's claim was checked first with a probe over the whole build. The probe found 31 v4 unified cards with TRIGGER effects but no matching `passive`.

## Engine
- `engine/45` `defineUnifiedCardV4`:
  - In a DUEL, a trigger reaches the SEGOC candidates only through `passive[eventName]` (`collectHandlers`, engine/40).
  - Cards declared with `EFFECT_TYPE.TRIGGER` + `events` but no matching passive never fired. Their existing tests call the scripts directly.
  - The missing passive entries are now derived from the effects. The event has a TRIGGER effect whose range and condition hold: the same test `v4SelectEffectForContext` makes when the effect is activated.
  - Passives a script declares are kept as written.
  - Forced / optional comes from each effect, as before (S03-U44).
- `engine/70` `zAct`:
  - A manual position change (`TOGGLE_POS`) queued `onPositionChange` (engine/19), but nothing drained it.
  - Now, in a DUEL with no chain or trigger window open, the deferred events are flushed right away, as after a summon.
  - The カラクリ hook (`notifyKarakuriPositionChangeV350`) runs first, unchanged.

## Cards affected (all were already TESTED; no status change)
The probe after the change reports 0 missing.

| Event | Cards |
|---|---|
| onActivateSuccess | 魔法吸収, 暗黒の呪縛, 連鎖炸薬, 王立魔法図書館, バベル・タワー, 魔法の操り人形, ブラッド・マジシャン－煉獄の魔術師－, ナチュル・トライアンフ, 天空聖者メルティウス, 救済のレイヤード, 人造天使, トラップ・リアクター・RR, マジック・リアクター・AID, ウィングド・ライノ, ナチュル・ビートル, ネイビィロイド, ヂェミナイ・デビル |
| onPositionChange | ブレードラビット, 悪魔の知恵, ヤドカリュー, ガードペナルティ, D・コード |
| onLeaveField | アイヴィ・ウォール, ナイトメア・デーモンズ, スネークポット, 黄金の邪神像, D・レトロエンジン, アイヴィ・シャックル |
| onBattleDestroy | サボウ・ファイター |
| onEquipAttached | 鉄の騎士 ギア・フリード |
| onEquipAttached + onLeaveField | 士気高揚 |

Notes on the table:
- ネイビィロイド and ヂェミナイ・デビル still respond through the S03-U18 activation-response path. Their late `onActivateSuccess` trigger stays suppressed by `activationLateTriggerSuppressedS03`.
- Five cards are now checked on real DUEL paths in this unit (see Tests).
- The other 26 get the same generic passive. Their existing unit-level tests still pass, but this unit does not check each of them on a real path.

## Tests
`tools/test_s03_u234_unified_passives.js` passes 15/0, on real DUEL paths and Replay-audited.

| Card | Checked |
|---|---|
| 王立魔法図書館 | real 強欲な壺 activations → 1, then 3 counters; a 4th adds none; remove 3 → draw 1 |
| 魔法吸収 | the opponent's Spell → its controller +500 |
| ブレードラビット | a manual Attack → Defense change destroys an opponent monster; Defense → Attack does nothing |
| サボウ・ファイター | battle destruction → a ニードルトークン in Defense Position on the opponent's field |
| 士気高揚 | 黒いペンダント equipped → +1000; destroyed by サイクロン → −1000 (and the pendant's 500) |

Other checks:
- `test_activation_cards`, `test_position_cards`, `test_token_cards`, `test_equip_cards`, `test_characteristic_cards`, `test_stat_modifier_cards`, `test_effect_category_cards`, `test_s03_u18`, `test_s03_u19`, `test_s03_u204`, `test_s03_u232`, `test_s03_u233` still pass.
- The 36 tests that use `zAct` / `TOGGLE_POS` / カラクリ still pass.
- Negative control on U233: 7 FAIL.

Test-harness note:
- The shared harness `baselineA()` sets `gameState.positionSnapV10`, but engine/19 reads `gameState.posSnapV10`.
- The position scenarios here set `posSnapV10` before the baseline. The shared harness is unchanged.

## Still open (seen while checking; not changed here)
Cards in `cards/91_battle_recovery.js` that read `API.battledThisPhase` in `onBattlePhaseEnd` (ビッグ・ジョーズ, ステルスロイド, …) may not fire in a real DUEL. The value is already cleared when the event fires (reported by the S03-U232 subagent).

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15891 PASS / 0 FAIL** (= U233 15876 + 15 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U233.
- Coverage: TESTED 2675, ENGINE_GAP 598, NOT_STARTED 1046, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 635 declared, 0 off-target.
