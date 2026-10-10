# S03-U202 — PARTIAL coarse auto-table entries 6 (searchers)

## Finding
Thirteen PARTIAL cards had only coarse AUTO_DECK_TABLE entries (cards/40): ignition searches without their costs, events or conditions.

## Engine
The engine/1ZT filter gains `ritualOnly` (「儀式モンスター」) and `spellNameAny` (「「A」または「B」と名のついた魔法カード」).

## Cards (PARTIAL → TESTED) — cards/HZZJ_claude_s03_u202_partial6.js
- Hand-discard searchers (`defineDiscardSearchS03`: ignition, own Main Phase, cost discard itself):
  - アトランティスの戦士 → 伝説の都 アトランティス;
  - キラーザウルス → ジュラシックワールド.
- Forced Flip searches (`defineForcedFlipSearchS03`):
  - ウェポンサモナー → a 「ガーディアン」 card;
  - マシンナーズ・ディフェンダー → 督戦官コヴィントン.
- バフォメット: optional, on its Normal / Flip Summon → 幻獣王ガゼル.
- ドラグニティ－トリブル: optional, on its Normal / Special Summon → a Level 3 or lower Dragon to the GY.
- 伝説の白石: forced, when it is sent to the GY → 青眼の白龍.
- Synchro Material searches (`defineSynchroMaterialSearchS03`, optional):
  - シンクロ・フュージョニスト → a 「融合」 / 「フュージョン」 Spell;
  - アーケイン・ファイロ → バスター・モード.
- Search Spells:
  - コール・リゾネーター → a 「リゾネーター」 monster;
  - トゥーンのもくじ → a 「トゥーン」 card;
  - 融合賢者 → 融合;
  - 儀式の準備 → a Level 7 or lower Ritual Monster, then optionally a Ritual Spell from the GY (registered choices `s03u202.ritual-prep*`).

## Tests
`tools/test_s03_u202_partial6.js` 28/0 (real DUEL paths, Replay-audited; near misses are checked as not offered). Negative control on U201:
11 FAIL.

## Left
- ヒーロー・シグナル / デステニー・シグナル and the other traps activated 「…が戦闘によって破壊され墓地へ送られた時」 stay PARTIAL. The engine
  has no response window for a trap card activation on that event.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15281 PASS / 0 FAIL** (= U201 15253 + 28 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U201.
- Coverage: TESTED 2479, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 63 (4996); audit 440 declared, 0 off-target.
