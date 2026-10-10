# S03-U209 — NOT_STARTED 2

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZQ_claude_s03_u209_ns2.js
- ウォール・シャドウ: registration only. 「「迷宮変化」の効果でしか特殊召喚できない」 is enforced by the engine from the text.
- カウンター・カウンター: a Counter Trap response to a Counter Trap card activation (engine/1P); negate and destroy.
- エヴォルド・ゲフィロス: destroyed by battle → special summons a targeted 「エヴォルダー」 from the GY.
- ガスタ・ファルコ (engine/1ZT): leaves the field face-up to the GY other than by battle → a 「ガスタ」 from the Deck, face-down Defense.
- X－セイバー パロムロ: when an own 「セイバー」 is destroyed by battle, it pays 500 and special summons itself from the GY.
- X－セイバー アクセル: while face-up, when a 「セイバー」 is destroyed by battle, draws 1 (forced).
- ジャンクBOX: revives a targeted Level 4 or lower 「D」, which is destroyed at the End Phase.
- インフェルニティ・ブレイク: with an empty hand, banishes a targeted 「インフェルニティ」 card from the GY and destroys a targeted opponent card.
- D－HERO ドレッドサーヴァント:
  - on its Normal Summon, puts a clock counter on 幽獄の時計塔;
  - when destroyed by battle, destroys a targeted own Spell / Trap.

## Tests
`tools/test_s03_u209_ns2.js` 21/0 (real DUEL paths, Replay-audited). カウンター・カウンター is tested as a response to the opponent's 魔宮の賄賂,
which was itself responding to ブラック・ホール. Negative control on U208: 9 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15409 PASS / 0 FAIL** (= U208 15388 + 21 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U208.
- Coverage: TESTED 2524, ENGINE_GAP 599, NOT_STARTED 1195, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 31 (4996); audit 484 declared, 0 off-target.
