# S03-U52 AUTO_DECK_TABLE ignition entries → triggers — ジュラック・ヴェロー, カラクリ兵 弐参六, ワーム・カルタロス (Claude)

Base: `checkpoint_claude_s03_u51_shock_ruler_lock_20260914.zip`, SHA256 `0917247c964a89ba757788e5907043391c69e7b038568f31c666dde9f999db95`.

## How it was found

- R1 【Jurrac】 vs 1103兎ラギア (U50 build), seed `0x52310705` first 1, turn 20: player 0 used ジュラック・ヴェロー's Deck recruit from the field in Main Phase (op `effect`), before the ショック・ルーラー stop fixed in U51.
- ジュラック・ヴェロー was PARTIAL, built only from `AUTO_DECK_TABLE` (cards/40) with `trig:"ignition"`: `defineAutoDeckScript` turns it into a Main Phase effect with no zone check and no event, so any face-up copy could recruit at will.
- A DUEL probe of every fixed-list card that is built only from that table (`u51_auto_table_probe.js`) found the same illegal step on three cards: ジュラック・ヴェロー (jurrac), カラクリ兵 弐参六 (karakuri), ワーム・カルタロス (worm) — each offered `effect` in Main Phase with legality ok. (The three ガジェット already have summon-trigger scripts; シューティング・クェーサー・ドラゴン is not offered; トゥルース・リインフォース and W星雲隕石 cannot be activated from a set position — recorded.)
- Classification: CARD_WORK on a real-duel illegal step shared by three major decks.

## 2011 sources

- 《ジュラック・ヴェロー》 age 33 (2011-08-20): trigger effect (08/12/06) when destroyed by battle while face-up attack position; Special Summon an ATK 1700 or lower 「ジュラック」 from the Deck.
- 《カラクリ兵 弐参六》 age 12 (2011-08-04): trigger effect when destroyed by battle; Special Summon a Level 4 or lower 「カラクリ」 in face-up attack position.
- 《ワーム・カルタロス》 age 13 (2009-11-06, the last revision before 2011-09): flip effect; add a Level 4 or lower 「ワーム」 Reptile from the Deck to the hand.

## Measurement before (U51 build)

- `tools/test_s03_u52_auto_table_triggers.js`: **4 PASS / 6 FAIL** — the three at-will Main Phase effects, and none of the real triggers (B / D / E).

## Closure

- **New `cards/HC_claude_s03_u52_auto_triggers.js`** (after HB in the manifest; replaces the table-built scripts by name):
  - ジュラック・ヴェロー and カラクリ兵 弐参六: GY triggers on `onBattleDestroy` (the 紫炎の足軽 pattern, `dsTiming:'leave'`), Deck pool by setcode; ヴェロー also requires that it was face-up attack position in that battle (attacker, or the defender's position at damage calculation);
  - ワーム・カルタロス: a forced v4 flip trigger that adds the card to the hand.
- **Setcodes:** the pools use the numeric `SETCODE` constants of engine/05 with `isSetCardV4` (a first draft used the engine/04 `GROUP` names and found no card: 7 / 3 fail until fixed).
- **Status:** the three cards PARTIAL → TESTED. **tools/check.py:** the U52 test after U51. **data/r1_lists:** `major_decks_v1_karakuri.txt`, `major_decks_v1_worm.txt`.
- **Test** (after: **10 PASS / 0 FAIL**):
  - A: no effect at will in Main Phase for each of the three;
  - B: ヴェロー destroyed by battle in attack position → ジュラック・ガリム Special Summoned; Replay ok;
  - C: ヴェロー destroyed in defense position → not offered;
  - D: 弐参六 destroyed by battle → another copy Special Summoned in face-up attack position; Replay ok;
  - E: カルタロス flipped by an attack → another copy added to the hand; Replay ok.
- **Regressions on the final build:** test_battle_cards 170 / 0, R1 gate 44 / 0, U33 draw replacement (auto-table user) 18 / 0, U40 18 / 0, U41 13 / 0, U42 13 / 0, U43 9 / 0, U44 9 / 0, U45 9 / 0, U46 26 / 0, U47 15 / 0, U48 9 / 0, U49 7 / 0, U50 9 / 0, U51 16 / 0, U52 10 / 0, VS3 six gate slice 22 / 0.

## Real-duel effect

- **【Jurrac】 vs 1103兎ラギア**, Astra's fixed lists, responder, seeds `0x52310701`–`0x52310707` × both first players, U52 build (600 s scratch harness): **14 / 14 completed**, Replay ok, unsupported []. ジュラック・ヴェロー in the ops: **0 at-will uses** (U51 build, same seeds: 24 — 19 in Main Phase 1, 5 in Main Phase 2 — plus one chain response); it triggered 3 times after being destroyed by battle.
- **【Karakuri】 vs 1103兎ラギア** (first measurement), seeds `0x52310801`–`0x52310807`: **14 / 14 completed**, Replay ok; カラクリ兵 弐参六 triggered 5 times. Unsupported: 簡易融合 (unscripted; manual-only) in 13 duels — recorded as the next candidate.
- **【Worm】 vs 1103兎ラギア** (first measurement), seeds `0x52310901`–`0x52310907`: **14 / 14 completed**, Replay ok, unsupported []; ワーム・カルタロス was not flipped in these duels (covered by the test).

## Gate

- `python tools/check.py` — EXIT 0, **12714 PASS / 0 FAIL**, no Traceback (log `s03_u52_full_gate.log`).
- The two `ReferenceError` lines in the log (c1ElementOnField, isEffectNegated) are pre-existing (also in the U45–U51 logs).

## Source hash

`df25813b92bd3673db14f026ca4e420aa7f600355d691c1be785759a056f0b4b` (737 files, excluding dist/ and *.log; this report set aside).

## Remaining

- カラクリ兵 弐参六's must-attack and "attack target → defense position" effects are not scripted.
- Other table-built PARTIAL fixed-list cards: シューティング・クェーサー・ドラゴン (not offered), トゥルース・リインフォース and W星雲隕石 (no set activation).
