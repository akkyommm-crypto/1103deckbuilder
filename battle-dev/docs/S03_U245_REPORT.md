# S03-U245 — NOT_STARTED 4 + ENGINE_GAP 2

## Workflow (mixed, fresh Sonnet subagent)
- The first subagent run hit the session limit before writing any file. A fresh subagent ran the same brief (`brief245.md`): 103/0 on its first hand-back, with no engine change.
- The main session reviewed it and made the test's static checks null-safe (`?.forced`, `(…||[]).length`). Before that, the negative control crashed instead of failing. The assertions are unchanged.
- The main session then removed the two ENGINE_GAP overrides and did the negative control, the declarations, this report and the gate.
- Line endings were normalized here (`normalize_eol.py`), for files that a Windows-Python text write had converted to CRLF since S03-U242. Content is unchanged.
- Measured: subagent 258,872 tokens, 77 tool uses, 711 s (retry run); parent-side correction 1.

## Cards → TESTED (2011 texts) — cards/HZZZY_claude_s03_u245_ns31.js

| Card | Was | Effect |
|---|---|---|
| 寡黙なるサイコプリースト | ENGINE_GAP (override removed) | Normal / Flip Summon → Defense Position; once per turn, discard (cost) → banish a GY Psychic (recorded); sent from the field to the GY → revive one it banished |
| 沈黙のサイコウィザード | ENGINE_GAP (override removed) | Normal Summon → may banish a GY Psychic (recorded); sent from the field to the GY → revive it |
| 疾風!凶殺陣 | NOT_STARTED | an own 「六武衆」 battled → own 「六武衆」 +300 ATK until the End Phase |
| 風雲カラクリ城 | NOT_STARTED | own 「カラクリ」 targets an opponent monster → may change its position; destroyed → may revive a Level 4+ 「カラクリ」 |
| 底なし流砂 | NOT_STARTED | each opponent End Phase: destroy the highest-ATK face-up monster(s); own Standby with ≤ 4 cards in hand → destroys itself |
| 化石発掘 | NOT_STARTED | discard (cost), revive a Dinosaur with its effects negated; the two are linked both ways |

Notes:
- The Psychic pair's ENGINE_GAP reason (optional and forced triggers on one script) predates per-effect `forced` (S03-U44).
- The banished record is a journaled card flag that is not zone-local. Documented limit: if the card leaves the field another way (bounce / banish), the old record stays until its next revive.

Rulings chosen and reviewed:
- Revived monsters come back in Attack Position.
- Ties for the highest ATK: all are destroyed.
- 凶殺陣 counts monster battles only.
- 風雲カラクリ城: a plain send to the GY (not destruction) does nothing.

## Tests
`tools/test_s03_u245_ns31.js` passes 103/0, on real DUEL paths. Scenarios with actions are Replay-audited. Negatives cover every card.

Other checks:
- `test_s03_u135` still passes.
- Negative control on U244: 40 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16333 PASS / 0 FAIL** (= U244 16230 + 103 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U244.
- Coverage: TESTED 2736, ENGINE_GAP 585, NOT_STARTED 999, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 696 declared, 0 off-target.
