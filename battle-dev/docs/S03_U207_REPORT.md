# S03-U207 — PARTIAL 10 (スカル・フレイム completed, コア転送ユニット, 霞の谷の神風, 迷宮変化)

## Cards (PARTIAL → TESTED) — cards/HZZO_claude_s03_u207_partial10.js
- スカル・フレイム (completed; S03-U65 had its Draw Phase replacement).
  - Added: 「1ターンに1度、手札から「バーニング・スカルヘッド」1体を特殊召喚する事ができる。この効果を発動するターン、自分はバトルフェイズを
    行う事ができない」.
  - Main Phase 1 only, because in Main Phase 2 the Battle Phase has already been conducted. The once-per-turn mark and `noBattlePhase` are
    set at activation.
  - The script keeps both paths: the draw path is recognised from `ctx.drawReplacementS03`, or from the chain link at resolution. A first
    version missed the chain-link case, and `test_s03_u65` caught it; it is back to 19/0.
  - Its PARTIAL override was removed from `data/script_status_overrides.json`, and its U65 declaration was updated to TESTED.
- コア転送ユニット: a face-up Continuous Spell ignition (`fieldIgnition`), once per turn, cost discard 1 → コアキメイルの鋼核.
- 霞の谷の神風: a Field Spell trigger, optional and once per turn, when an own face-up WIND monster returns to the hand → a Level 4 or lower
  WIND from the Deck.
- 迷宮変化: equips to 迷宮壁－ラビリンス・ウォール－. Its ignition Tributes the wall and itself → ウォール・シャドウ.
  - The equip effect is limited to a not-yet-equipped card, so the face-up card uses the ignition.

## Tests
`tools/test_s03_u207_partial10.js` 12/0 (real DUEL paths, Replay-audited). Negative control on U206: 7 FAIL.

## Left
ハーピィ・クィーン stays PARTIAL. 「このカードのカード名は…「ハーピィ・レディ」として扱う」 needs a name alias, which the canonical identity
does not yet provide.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15377 PASS / 0 FAIL** (= U206 15365 + 12 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U206.
- Coverage: TESTED 2511, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 31 (4996); audit 471 declared, 0 off-target.
