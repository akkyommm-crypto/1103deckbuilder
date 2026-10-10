# S03-U51 C-S03-39 ACTIVATION_TYPE_LOCK — No.16 色の支配者ショック・ルーラー + R1 driver Battle Phase skip (Claude)

Base: `checkpoint_claude_s03_u50_gorz_20260914.zip`, SHA256 `47bb8daa15df8abe2410633870ad46378481eaf5f103d2673452735281a609e4`.

## How it was found (R1 on two more fixed-list pairings, U50 build, 600 s scratch harness)

- **【Agent】 vs 1103兎ラギア** (`0x52310601`–`0x52310607` × both first players): 4 / 14 completed; 10 stopped on the R1 driver's `PHASE_NOT_REACHED` (Main Phase 1 → Battle Phase).
  - Toast: 「カードの効果によりこのターンはバトルフェイズを行えません」 after 天空の宝札. The engine refused correctly (`battlePhaseForbiddenV340`; the DUEL flow goes from Main Phase 1 to the End Phase); the driver always requested the Battle Phase and then Main Phase 2. A measurement-tool defect.
- **【Jurrac】 vs 1103兎ラギア** (`0x52310701`–`0x52310707`): 13 / 14 completed.
  - **Stop:** `0x52310705` first 1, turn 20 — SYSTEM_FAULT 「No.16 色の支配者ショック・ルーラー 解決エラー：Cannot read properties of undefined (reading 'n')」 after the declaration choice showed 「選択肢」 three times.
  - The same duel used ジュラック・ヴェロー's Deck recruit at will in Main Phase (recorded; next unit).

## Diagnosis

- The declaration offered fake card objects `{zone:'declare', card:null, db:{n:…}, key}` to the legacy `API.selectCard`. In DUEL a card-less candidate is resolved by coordinates (`choiceResolveCandidateV49`), so the pick kept its `key` but lost `db` and its label; the resolve read `k.db.n`. Scan of legacy card-less selectCard calls: this card is the only one.
- The lock it recorded (`effectFlags.shockRuler`) was never read: `shockRulerBlocks` had no caller, and the flag had no end. Even without the crash, the declaration locked nothing.
- In 5 of Astra's 13 fixed lists (hero, jurrac, rabbit, tg_gadget, worm). Classification: real-duel stop + INTEGRATION_MISSING (no consumer).

## 2011 source

yugioh-wiki 《Ｎｏ.１６ 色の支配者ショック・ルーラー》 age 8 (2011-08-31):
- until the end of the opponent's next turn, neither player can activate cards of the declared type;
- monster declared: monster effects cannot be activated in any location; summons stay legal (11/08/19);
- spell / trap declared: card activations are blocked; effect activations of face-up Continuous Spells / Traps stay legal (11/08/19);
- the lock keeps applying after the monster leaves the field (11/08/19).

## Measurement before (U50 build)

- `tools/test_s03_u51_shock_ruler_lock.js`: **0 PASS / 1 FAIL** — the declaration offered 「選択肢」 ×3 (the same defect as the real-duel stop); the run could not continue.

## Closure

- **New `engine/1ZD_activation_type_lock_s03.js`** (C-S03-39): `activationTypeLockReasonS03(p, card, zone, db, opts)` — the lock applies while `gameState.turn <= untilTurn`; monster declared → every monster effect; spell / trap declared → card activations only (from the hand, a set card, or `opts.cardActivation`). A flag without `untilTurn` (older saves) is ignored.
- **engine/30 `strictScriptLegalityV2`** and **engine/40 `strictScriptLegality`** refuse locked activations, so response lists, trigger candidates, hand / zone actions and the activation itself agree.
- **cards/20 ショック・ルーラー:** plain choices `{key, label, value}`; the resolve records `{kind, turn, untilTurn}` on both players (untilTurn = this turn + 1 on its own turn).
- **tools/r1_duel_driver.js:** skips Battle Phase and Main Phase 2 when the Battle Phase is forbidden.
- **Status:** No.16 色の支配者ショック・ルーラー IMPLEMENTED → TESTED. **tools/check.py:** the U51 test after U50. **data/r1_lists:** `major_decks_v1_agent.txt`, `major_decks_v1_jurrac.txt`.
- **Test** (after: **16 PASS / 0 FAIL**):
  - A: declare 罠 → no fault, both players locked until turn 6, one material detached; Replay ok;
  - B: under the 罠 lock 死者蘇生 is still activated; a set 神の警告 is not offered (lock reason), the face-up 王宮の弾圧 is; Replay ok;
  - C: locked on turns 5 and 6, released on turn 7;
  - D: declare モンスター → Normal Summon of BF－極北のブリザード is legal, its trigger is not offered, ショック・ルーラー's own effect is locked; Replay ok.
- **Regressions on the final build:** test_battle_cards 170 / 0, test_lp_change_cards 44 / 0, test_lp_change_v18 43 / 0, raiou summon window 16 / 0, R1 gate 44 / 0, U14 50 / 0, U40 18 / 0, U41 13 / 0, U42 13 / 0, U43 9 / 0, U44 9 / 0, U45 9 / 0, U46 26 / 0, U47 15 / 0, U48 9 / 0, U49 7 / 0, U50 9 / 0, U51 16 / 0, VS3 six gate slice 22 / 0.

## Real-duel effect

- **【Agent】 vs 1103兎ラギア**, Astra's fixed lists, responder, seeds `0x52310601`–`0x52310607` × both first players, U51 build (600 s scratch harness): **14 / 14 completed**, Replay ok, blocker none, unsupported [] (was 4 / 14: 10 `PHASE_NOT_REACHED` driver stops after 天空の宝札).
- **【Jurrac】 vs 1103兎ラギア**, seeds `0x52310701`–`0x52310707`: **14 / 14 completed**, Replay ok, unsupported [] (was 13 / 14); `0x52310705` first 1 — the ショック・ルーラー stop — now ends normally on turn 20.
- The same 【Jurrac】 duels still use ジュラック・ヴェロー's Deck recruit at will (AUTO_DECK_TABLE; prepared as U52).

## Gate

- `python tools/check.py` — EXIT 0, **12704 PASS / 0 FAIL**, no Traceback (log `s03_u51_full_gate.log`).
- The two `ReferenceError` lines in the log (c1ElementOnField, isEffectNegated) are pre-existing (also in the U45–U50 logs).

## Source hash

`c17ea65cb3ea1019f07c5bc0dbaf907f0db2a8a1407c208beff38253398d0d8e` (732 files, excluding dist/ and *.log; this report set aside).

## Remaining

- Unscripted cards activated through the manual / legacy action paths are not checked against the lock.
- AUTO_DECK_TABLE `trig:"ignition"` recruiters / searchers offered at will in DUEL (ジュラック・ヴェロー, カラクリ兵 弐参六, ワーム・カルタロス) — next unit.
