# S03-U126 — 「〜でしか特殊召喚できない」 summon conditions + E・HERO アブソルートZero + ミラクル・フュージョン choice

## Why
- E・HERO アブソルートZero (hero extra x2) was NOT_STARTED — it was even Fusion Summoned in U124's test without any effect.
- No summon condition was enforced: E・HERO The シャイニング / Great TORNADO / ガイア / ノヴァマスター (hero extra) and 34 other
  cards say 「このカードは融合召喚（S召喚）でしか特殊召喚できない」, yet 死者蘇生 etc. could Special Summon them.
- ミラクル・フュージョン (hero x3) had the same problems as 超融合 before U124: Fusion Monster and materials fixed at activation
  to the first combination (max 5 searched), and its summon was not marked as a Fusion Summon.

## Change
- `engine/1ZK_summon_only_s03.js`: `summonOnlyByS03(db)` parses 「(融合召喚|シンクロ召喚|S召喚|エクシーズ召喚|X召喚|儀式召喚)でしか
  特殊召喚できない」 and 「「A」／このカード／「A」またはこのカード の効果でしか特殊召喚できない」 (all 38 cards of the 2011 pool
  parse); `summonOnlyReasonS03`. Enforced in `API.specialSummon` (allowed only with the matching `summonKind`, or when the
  summoning effect is the named card). The Extra Deck summon pipeline itself is unaffected.
- `engine/40_legal_script_engine.js`: the enforcement; `collectHandlers` also scans the Extra Deck for `onLeaveField` (a
  Fusion Monster bounced to the Extra Deck still triggers "フィールド上から離れた時").
- `cards/HR_claude_s03_u126_absolute_zero.js`: ATK +500 per other face-up WATER monster on the field (current attribute;
  other アブソルートZero excluded); mandatory "leaves the field (face-up from the Monster Zone) → destroy all opponent monsters".
- `cards/30_themes_b.js` ミラクル・フュージョン: no target; Fusion Monster and materials (labels フィールド / 墓地) chosen at
  resolution (registered handlers), re-validated, banished, Fusion Summoned with `summonKind:'fusion'`; combination cap 5 → 60.

## Test — `tools/test_s03_u126_fusion_only_absolute_zero.js` 12/0 (real DUEL path, Replay-audited)
- A: conditions parsed; 死者蘇生 cannot revive The シャイニング (message shown); スターダスト・ドラゴン still revivable.
- B: ミラクル・フュージョン — nothing chosen on activation; at resolution アブソルートZero with エアーマン + the GY アンモ・ナイト
  (the field one stays) → banished, Fusion Summon (kind fusion).
- C: ATK 2500 + 2×500 (face-down WATER and the opponent's アブソルートZero not counted).
- D: destroyed by サンダー・ボルト → all opponent monsters destroyed; bounced by 強制脱出装置 → back in the Extra Deck, still
  triggers.
- Negative control on U125: every section fails.
- `tools/test_s03_u96_miracle_fusion.js`: its driver answered only activation-time choices — it now answers the
  resolution-time ones (assertions unchanged; 6/0). Broad rescan (38 files naming the 38 cards / ミラクル・フュージョン /
  leave-field): 0 FAIL after that update.

## Status
- E・HERO アブソルートZero NOT_STARTED → TESTED. TESTED 2191 → 2192, NOT_STARTED 1272 → 1271.

## Not in this unit
- The "properly summoned first" rule for other special-summon monsters (ダーク・アームド・ドラゴン, any Synchro revived
  without a proper summon, …) — next unit.

## Gate
- `python tools/check.py` — `GATE_EXIT=0`, 13919 PASS lines, 0 FAIL, no Traceback (one caught `TypeError` stack from
  `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level function declarations".
- `dist/battle.html` SHA256 `24891dac74d7e65b50d8d94d2071ca2ea50bdfa853517298d923c35e180ab960`; Acode regenerated after the gate: `dist/battle_acode.html` `c2b62d781847cb33591399485d13cc38f3c9e396ff756adea6f1d75904e2fd61`.
- Coverage: TESTED 2192, IMPLEMENTED 108, ENGINE_GAP 609, GENERIC_OK 644, PARTIAL 172, NOT_STARTED 1271 (4996);
  147 declared status changes, 0 off-target.
