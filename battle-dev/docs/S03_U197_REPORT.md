# S03-U197 — PARTIAL coarse auto-table entries 1 (C・ ×6, 共鳴虫, ガスタ・スクイレル, ベビケラサウルス, レプティレス・ガードナー)

## Finding
These ten cards were PARTIAL: their only implementation was a coarse AUTO_DECK_TABLE entry (cards/40) declared `trig:"ignition"`, i.e.
an effect activated at will. Their 2011 texts are a cost ignition (C・) or triggers.

## Implementation (cards/HZZE_claude_s03_u197_partial1.js)
- **C・チッキー / ドルフィーナ / パンテール / ピニー / モーグ / ラーバ** (`defineChrysalisS03`)
  - Text: 「フィールド上に「ネオスペース」が存在する時、このカードを生け贄に捧げる事で手札またはデッキから「N・X」1体を特殊召喚する」.
  - An ignition effect (own Main Phase), activatable only while ネオスペース is face-up; the cost is Tributing this card.
  - The Neo-Spacian is chosen at resolution from the hand or the Deck: the engine/1ZT pool, the journaled `s03u156.deck-trigger` choice,
    face-up in the player's chosen position.
  - The pool spec is registered in `DECK_TRIGGER_S03`, so `tools/test_s03_u135` still checks these identity filters (without it the count fell to 74; the floor is 80).
- **Deck triggers on engine/1ZT**
  - 共鳴虫: battleToGrave, optional, an Insect with ATK 1500 or less.
  - ガスタ・スクイレル: fieldToGrave + destroyed by a card effect, optional, a Level 5 or higher 「ガスタ」.
  - ベビケラサウルス: fieldToGrave + destroyed by a card effect, forced, a Level 4 or lower Dinosaur.
  - レプティレス・ガードナー: fieldToGrave + destroyed, forced, a 「レプティレス」 monster to the hand.

## Cards (PARTIAL → TESTED)
The ten above.

## Tests
`tools/test_s03_u197_partial1.js` 32/0 (real DUEL paths, Replay-audited).
- All six C・ cards, with a near-miss Neo-Spacian left in the Deck and the Tribute recorded before CHAIN_ADD.
- A copy in the hand; no ネオスペース; the Battle Phase.
- 共鳴虫 destroyed by battle.
- ガスタ・スクイレル destroyed by effect and by battle.
- ベビケラサウルス; レプティレス・ガードナー.

Negative control on U196: 19 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15170 PASS / 0 FAIL** (= U196 15138 + 32 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U196.
- Coverage: TESTED 2431, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 111 (4996); audit 392 declared, 0 off-target.
