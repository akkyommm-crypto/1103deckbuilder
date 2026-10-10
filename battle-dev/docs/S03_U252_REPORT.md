# S03-U252 — NOT_STARTED 6 (5 TESTED, 1 PARTIAL)

## Workflow (mixed, fresh Sonnet subagent)
- A fresh Sonnet subagent ran `brief252.md` with seven candidate cards and finished six: 49/0 on its first hand-back, with no engine change. Its own negative control gave 18 FAIL.
- It stopped on マシンナーズ・スナイパー, as the brief asked, and reported why:
  - engine/1ZU `attackTargetForbiddenReasonS03` skips a source whose controller is the attacking player.
  - So 「お互いに…攻撃できない」 cannot restrict its own controller's attacks.
  - The card stays NOT_STARTED and is left for an engine unit.
- The main session reviewed the code. It made 死霊騎士デスカリバー・ナイト PARTIAL rather than TESTED (below) and did the declarations, this report and the gate.
- Measured: subagent 146,133 tokens, 40 tool uses, 338 s. No parent-side code correction.

## Cards (2011 texts) — cards/HZZZZF_claude_s03_u252_ns33.js

| Card | Status | Effect |
|---|---|---|
| 不意打ち又佐 | TESTED | attacks twice per Battle Phase; its control cannot change while face-up (`controlLockS03`, S03-U251) |
| サイレント・マジシャン LV8 | TESTED | summoned only by 「サイレント・マジシャン LV4」 (engine/1ZK, S03-U251); unaffected by the opponent's Spells |
| トラップ処理班 Aチーム | TESTED | when the opponent activates a Trap, release it (cost) → negate and destroy (declared chain response, engine/1P) |
| 神罰 | TESTED | with a face-up 「天空の聖域」 on the field: negate and destroy a monster effect / Spell / Trap activation |
| ガリトラップ－ピクシーの輪－ | TESTED | with 2+ own face-up Attack Position monsters, the opponent cannot target the lowest-ATK monster(s) for attacks |
| 死霊騎士デスカリバー・ナイト | **PARTIAL** (override added) | when a monster effect is activated: release it → negate and destroy. Its text says 「発動する」 (forced), but engine/1P offers declared chain responses only as optional, so it is optional here. Not marked complete. |

Rulings chosen and reviewed:
- Aチーム answers only the opponent's Traps.
- 神罰 works with 「天空の聖域」 in either Field Zone, against any player's activation.
- ガリトラップ:
  - "the lowest ATK" is among its controller's face-up monsters, in any position;
  - on a tie, all of them are protected;
  - a face-down monster is neither counted nor protected.

## Tests
`tools/test_s03_u252_ns33.js` passes 49/0, on real DUEL paths and Replay-audited.

Negative control on U251: 18 FAIL (manifest entry removed). The other checks are controls, negatives and audits.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16506 PASS / 0 FAIL** (= U251 16457 + 49 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U251.
- Coverage: TESTED 2766, ENGINE_GAP 569, NOT_STARTED 984, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 727 declared, 0 off-target.
