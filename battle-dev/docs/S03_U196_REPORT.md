# S03-U196 — the last testable IMPLEMENTED singles (9 cards)

## Engine
- `engine/1ZZF_field_dependent_s03.js`: 「フィールドに「X」が存在しない場合にこのカードは破壊される」.
  - A script declares `destroyWithoutFieldS03:'X'`.
  - While the monster is face-up and not negated, and no face-up X is in either Field Zone, it is destroyed at the rule processing point
    (`act()`, after the Sin upkeep) as a journaled FX_TO_GRAVE.
- FX_DISCARD queues `onDiscardAnyS03` for every discard, including costs and the hand-size rule. `onDiscard` keeps its meaning
  「効果で捨てられた」 for its existing listeners (暗黒界 …).
- 魔轟神 cards trigger on `onDiscardAnyS03`: their text is 「手札から墓地へ捨てられた時」, with no 「効果によって」.

## Cards (IMPLEMENTED → TESTED)
| Card | Fix |
|---|---|
| 天空の使者 ゼラディアス | ① own Main Phase only (before: no timing). ② destruction without 天空の聖域 (before: missing). |
| 豊穣のアルテミス | Forced (before: optional). It now fires on the activation event of a Counter Trap (`onActivateSuccess`, sub counter). The legacy `onCounterTrap` event is only emitted by the manual `runScript` path. |
| 墓守の巫女 | The 「墓守」 +200 no longer stops when a Field Spell is face-up; only the ネクロバレー part does. |
| 墓守の暗殺者 | Any face-up opponent monster, chosen at its attack declaration (before: only the attack target, and never on a direct attack). |
| ジェネクス・ウンディーネ | Optional (before: forced), and only for its own summon. |
| ゾンビ・マスター | 1ターンに1度 added, plus the resolution check that it is still face-up. |
| 魔轟神クルス / 魔轟神獣ケルベラル | Any discard of the card itself (before: discards by an effect only, read from a possibly stale `discardInfo`). Forced. |
| スクラップ・サーチャー | ② forced (`forcedForEventS03`); ① stays optional. |

## Tests
`tools/test_s03_u196_singles.js` 26/0 (real DUEL paths, Replay-audited). Existing tests that name these cards still pass: u110, u129, u138.
Negative control on U195: 9 FAIL.

## Left (IMPLEMENTED, pending engine gaps — not marked complete)
- The splendid VENUS: needs negation immunity for its controller's Spell / Trap activations and their effects.
- レベル・スティーラー ①: needs a central path for Tributes made as costs or by effects.
- 霊滅術師 カイクウ ②: 「相手はお互いの墓地のカードをゲームから除外できない」 needs the acting player of costs and summon procedures in the
  grave lock.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15138 PASS / 0 FAIL** (= U195 15112 + 26 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U195.
- Coverage: TESTED 2421, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 121 (4996); audit 382 declared, 0 off-target.
