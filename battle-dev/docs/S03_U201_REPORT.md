# S03-U201 — PARTIAL coarse auto-table entries 5

## Finding
Ten PARTIAL cards had only coarse AUTO_DECK_TABLE entries (cards/40): ignition "mill / search / recruit" actions without their
conditions, costs or second effects.

## Cards (PARTIAL → TESTED) — cards/HZZI_claude_s03_u201_partial5.js
| Card | Implementation (2011 text) |
|---|---|
| スクラップ・ハンター | Ignition, once per turn, targets another own face-up 「スクラップ」: destroy it, then a Tuner from the Deck to the GY. |
| スクラップ・リサイクラー | ① optional trigger on its own Normal / Special Summon: a Machine from the Deck to the GY. ② ignition, once per turn (zone-local `recyclerTurnS03`), cost: 2 Machine / EARTH / Level 4 from the GY to the Deck; draw 1. |
| ジェネクス・ニュートロン | Optional trigger at the End Phase of the turn it was Normal Summoned (summonProvenance): a Machine Tuner from the Deck. |
| ラヴァル炎火山の侍女 | Optional trigger when sent to the GY while another 「ラヴァル」 is in the GY: a 「ラヴァル」 from the Deck to the GY. |
| ヴォルカニック・バレット | Ignition in the GY, once per turn, cost 500 LP: another バレット from the Deck. |
| 宝玉の導き | Needs 2 or more face-up 「宝玉獣」 in the Spell & Trap Zone: a 「宝玉獣」 from the Deck. |
| 賢者の宝石 | Needs ブラック・マジシャン・ガール: ブラック・マジシャン from the hand or the Deck. |
| 氷結界の決起隊 | Ignition, cost: Tribute this card; targets a face-up WATER monster: destroy it, then a 「氷結界」 monster from the Deck. |
| スモール / ミッド・ピース・ゴーレム | Optional trigger on its own Normal / Flip / Special Summon while ビッグ・ピース・ゴーレム is face-up: the other one from the Deck, its effect negated (`negateOnSummonS03`, registered choice `s03u201.peace-golem`). |

## Tests
`tools/test_s03_u201_partial5.js` 24/0 (real DUEL paths, Replay-audited; near misses left in the Deck are checked as not offered).
Existing tests naming these cards still pass: class_a_recruit_bulk, u147, v660_batch18. Negative control on U200: 10 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15253 PASS / 0 FAIL** (= U200 15229 + 24 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U200.
- Coverage: TESTED 2466, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 76 (4996); audit 427 declared, 0 off-target.
