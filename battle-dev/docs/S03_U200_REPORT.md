# S03-U200 — PARTIAL coarse auto-table entries 4 (summon / Flip searches, Deck Spells)

## Finding
Thirteen PARTIAL cards had only coarse AUTO_DECK_TABLE entries (cards/40).

## Engine
The engine/1ZT filter (`deckTriggerFilterS03`) gains three keys:
- `nameHas` — 「「X」と名のついた」 where X has no setcode (レアル・ジェネクス);
- `effectOnly` — 「効果モンスター」;
- `normalOnly` — 「通常モンスター」.

## Cards (PARTIAL → TESTED) — cards/HZZH_claude_s03_u200_partial4.js
- Summon searches (`defineSummonSearchS03`: optional, own summon event, pool examined at resolution):
  - ジェネクス・パワー・プランナー: a Lv3 「ジェネクス」 effect monster.
  - ジェネクス・ブラスト: a DARK 「ジェネクス」 (Special Summon only).
  - ジェムレシス: a 「ジェムナイト」.
  - レアル・ジェネクス・クラッシャー / マグナ: a Lv4 / Lv2 「レアル・ジェネクス」.
  - レアル・ジェネクス・ターボ: a Lv1 「ジェネクス」.
  - リチュア・アビス: a 「リチュア」 with DEF 1000 or less, not リチュア・アビス; on a Normal, Flip or Special Summon.
- Flip searches (`defineFlipSearchS03`):
  - リチュア・エリアル: a 「リチュア」.
  - ジェムタートル: ジェムナイト・フュージョン.
- Deck Spells (`defineDeckSpellS03`):
  - 召喚師のスキル: a Lv5 or higher Normal Monster.
  - 氷結界の紋章: a 「氷結界」 monster.
  - 精神統一: 精神統一; 1ターンに1枚 (`countLimit`).
  - 緊急鋼核処分: コアキメイルの鋼核 to the GY.

## Tests
`tools/test_s03_u200_partial4.js` 29/0 (real DUEL paths, Replay-audited). Each search keeps a near miss in the Deck and checks that it is
not offered (the candidate labels carry the card names). Negative control on U199: 10 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15229 PASS / 0 FAIL** (= U199 15200 + 29 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U199.
- Coverage: TESTED 2456, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 86 (4996); audit 417 declared, 0 off-target.
