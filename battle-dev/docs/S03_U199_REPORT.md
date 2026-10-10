# S03-U199 — PARTIAL coarse auto-table entries 3 (Flip, 「カードの効果によって」, returned to the Deck, both players)

## Finding
Five PARTIAL cards had only coarse AUTO_DECK_TABLE entries declared `trig:"ignition"`.

## Engine
`collectHandlers` (engine/40), on `onLeaveField`: it also scans the Deck, but only for cards whose script declares `activateFrom:'deck'`.
Other Deck cards are passed as null, which keeps the Deck indices intact. This supports 「フィールド上に表側表示で存在するこのカードがデッキに
戻った場合」 (ナーガ). The existing EX-Deck scan (S03-U126) is the same idea.

## Cards (PARTIAL → TESTED) — cards/HZZG_claude_s03_u199_partial3.js
- デスハムスター / 素早いビッグハムスター: optional Flip effects (`defineFlipRecruitS03`). They special summon face-down in Defense
  Position: another デスハムスター, or a Level 3 or lower Beast.
- 素早いマンタ: engine/1ZT fieldToGrave. It fires only when the card was sent by a card effect (`moveProvenance.reason==='effect'`), not by a
  cost, a Tribute or battle. Any number of 素早いマンタ.
- ナーガ: a forced trigger when it returns face-up from the field to the Deck; a Level 3 or lower monster from the Deck.
- 冥界の使者: forced, when it is sent from the field to the GY. Each player chooses a Level 3 or lower Normal Monster from their own Deck,
  its controller first (registered choice `s03u199.underworld-search`).

## Tests
`tools/test_s03_u199_partial3.js` 12/0 (real DUEL paths, Replay-audited).
- A Flip Summon, and a flip by an attack.
- マンタ by ブラック・ホール versus as a Tribute.
- ナーガ returned by ライトロード・モンク エイリン's attack.
- 冥界の使者 by ブラック・ホール: both players add their card, and each makes their own choice.

Negative control on U198: 5 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15200 PASS / 0 FAIL** (= U198 15188 + 12 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U198.
- Coverage: TESTED 2443, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 99 (4996); audit 404 declared, 0 off-target.
