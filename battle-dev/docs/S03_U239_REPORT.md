# S03-U239 — NOT_STARTED 28

## Workflow (mixed, fresh Sonnet subagent)
- The first subagent run was stopped at the usage limit before it wrote any file. A fresh subagent then ran the same brief (`brief239.md`).
- Sonnet wrote the card script and the test: 55/0 on its first hand-back, with no engine change.
- The main session reviewed it and replaced two name-substring checks with the setcode groups. The 「ロイド」 and 「レプティレス」 groups exist in the setcode overlay as `GROUP.ROID` / `GROUP.REPTILIANNE`, so for example マジカル・アンドロイド is not counted. The test is still 55/0.
- The main session then did the negative control, the declarations, this report and the gate.
- Measured: subagent 174,915 tokens, 46 tool uses, 369 s (retry run); parent-side correction 1.

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZZS_claude_s03_u239_ns28.js

| Card | Effect |
|---|---|
| マジカル・コンダクター | +2 Spell Counters per Spell activation by either player; once per turn, remove N (declared, cost) → special summon a Level N Spellcaster from hand or GY |
| エクスプローシブ・マジシャン | remove 2 Spell Counters from anywhere on its controller's field (cost) → destroy 1 targeted opponent Spell / Trap card (no once-per-turn limit in the text) |
| 魔法族の結界 | +1 Spell Counter (max 4) each time a face-up Spellcaster is destroyed; send it + 1 own face-up Spellcaster to the GY (cost) → draw that many |
| デモニック・モーター・Ω | ① once per turn +1000 ATK until the end of the turn; ② and ③ at its controller's End Phase: destroy itself if ① was used, then 1 モータートークン in Attack Position |
| レスキューロイド | an own 「ロイド」 monster destroyed by battle and sent to the GY → may return it to the hand |
| レプティレス・スポーン | cost: banish a 「レプティレス」 monster from the GY → 2 レプティレストークン |

Rulings and limits, reviewed:
- Ω's ② and ③ are one forced End Phase effect, because the v4 unified framework resolves one TRIGGER per event per card. The order is destroy, then token; the result is the same as resolving them as a chain.
- レプティレストークン are summoned in Defense Position. The text names no position, and the token helper takes one fixed position.
- The コンダクター / 結界 ignitions need at least 1 counter. コンダクター also needs a Spellcaster in hand or GY that could be summoned.

## Tests
`tools/test_s03_u239_ns28.js` passes 55/0 over about 20 scenarios, on real DUEL paths. Every scenario that performs actions is Replay-audited.
- Counters from real Spell activations, own and opponent's.
- The declared-N cost, and its no-match negative.
- Two destructions in one turn.
- 結界 counters from battle and effect destruction, its maximum of 4, and the draw.
- Ω with and without ①, and the opponent's End Phase.
- レスキューロイド's negatives: ワイト, a 「ロイド」 destroyed by an effect, the opponent's 「ロイド」.
- スポーン's zone-space and GY negatives.

Other checks:
- `test_activation_cards`, `test_token_cards`, `test_battle_cards`, `test_s03_u232`, `u234`, `u238`, `test_v910_batch42` and `test_s03_u135` still pass.
- Negative control on U238: 25 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16032 PASS / 0 FAIL** (= U238 15977 + 55 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U238.
- Coverage: TESTED 2698, ENGINE_GAP 597, NOT_STARTED 1025, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 658 declared, 0 off-target.
