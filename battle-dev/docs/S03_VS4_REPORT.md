# S03-VS4 Vertical Slice #4 — 真六武衆 + negators vs 1103兎ラギア (Claude)

Base: `checkpoint_claude_s03_u19_monster_activation_response_20260912.zip`, SHA256 `7ab1f2215122da06d05538621376e0090dad64fde6b167e4bed9065896e63dff`. Published together with S03-U20 (the engine stop this slice found).

## Purpose

- Representative-deck regression after three Requirement units (U17, U18, U19).
- It checks, in one real game, that their fixes work together on the normal play path, not only in isolated unit tests.

## Path (real game flow; decks loaded in a fixed arranged order)

- **P1:** a provisional 40-card 真六武衆 list based on VS3's, with ネイビィロイド, マジック・ストライカー, マジック・ジャマー, 奈落の落とし穴 ×2 and 昇天の角笛.
- **P2:** the 1103兎ラギア sample (built at runtime; only its arranged top cards are named).
- **T1 (P1).** 増援 adds 真六武衆－カゲキ. Normal Summon ネイビィロイド; set 奈落の落とし穴 and マジック・ジャマー.
- **T2 (P2).**
  - サイクロン targets the set 奈落. P1's responses list ネイビィロイド (U19; the target decode lets its condition see the targeted own S/T) and マジック・ジャマー (a Spell).
  - ネイビィロイド discards 紫炎の足軽, then negates and destroys サイクロン. 奈落 and マジック・ジャマー stay set.
  - レスキューラビット is Normal Summoned (奈落 is not offered for 300 ATK). Its effect Special Summons two セイバーザウルス, and P1's 奈落 is offered and banishes both.
- **T3 (P1).**
  - マジック・ストライカー's chain-less procedure (U17) banishes 増援; no chain link.
  - Direct attacks with ネイビィロイド 1000 and マジック・ストライカー 600 take P2 to 6400.
  - Replay audit, then save in Main Phase 2.
- **VM2.**
  - The save resumes.
  - **T4 (P2):** 死者蘇生 targets 紫炎の足軽 in P1's GY. P1's set マジック・ジャマー (U18) discards 真六武衆－カゲキ, then negates and destroys it; nothing is summoned.
  - P2 Normal Summons ジェネティック・ワーウルフ (no summon window: P1 has no set cards left) and attacks マジック・ストライカー. It is destroyed and P1 takes no battle damage (text ③).
  - T5 begins for P1. Replay audit.

## Findings

- **Engine stop → S03-U20 C-S03-17 BATTLE_DAMAGE_BEFORE_DESTRUCTION.** On the U19 build the T4 battle dealt 1400 to P1: `processAttack` confirmed battle destruction before dealing damage, so マジック・ストライカー's damage text no longer applied. Fixed in U20 (see `docs/S03_U20_REPORT.md`).
- **Test-side correction.** None beyond tightening assertions to printed ATK values.
- **Practical effect.** Monster and counter-trap negation, a chain-less procedure, a Bottomless response to a Special Summon, save / resume and battle with a damage-text monster run together as a real duel. Any later change that breaks this line fails the gate.

## Changed files

- `tools/test_s03_vs4_activation_negation_slice.js`: new; wired into `tools/check.py` after U20.

Every card named in the test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_vs4_activation_negation_slice.js`.** On the U19 build: 24 PASS / 1 FAIL (the T4 damage). On the U20 build: EXIT 0, 25 PASS (VM1 T1–T3 and VM2 T4–T5, each with a Replay audit).
- **Full gate.** `python tools/check.py` (with S03-U20): EXIT 0, **12146 PASS / 0 FAIL**; 0 off-target status changes (`s03_u20_vs4_full_gate.log`).
- **Coverage.** Unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996.
- **Gated source manifest SHA256** (excluding dist/ and *.log; this report and `docs/S03_U20_REPORT.md` set aside): `b1cc28a960b5ff160e5ecb01c88214d5b3345aae3726539589b6366be122fdae` (628 files).
