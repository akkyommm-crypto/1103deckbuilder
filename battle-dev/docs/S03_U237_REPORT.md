# S03-U237 — NOT_STARTED 27

## Workflow (mixed, third Sonnet unit)
- Opus chose a card family (「雲魔物」) and wrote the brief, with the shared helper design in it.
- A **fresh** Sonnet subagent wrote the card script and the test: 36/0 on its first hand-back, with no engine change.
- The main session reviewed it and did the negative control, the declarations, this report and the gate.
- Measured: subagent 159,663 tokens, 36 tool uses, 301 s; rework 0.
  - For comparison, the resumed subagent on U235 used 258,571 tokens. The fresh start was cheaper here, because a resumed run carries all its earlier context.
  - One unit of each; not a controlled comparison.

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZZQ_claude_s03_u237_ns27.js
The common base:
- `battleProof`;
- it destroys itself while face-up in Defense Position (`selfDestroyWhenS03`, engine/1ZZF);
- on Normal Summon, it gets Fog Counters equal to the face-up 「雲魔物」 on the field, itself included. A face-down 「雲魔物」 is not counted.

| Card | Effect |
|---|---|
| アシッド・クラウド | remove 2 from itself (cost) → destroy 1 Spell / Trap card on the field |
| キロスタス | remove 2 from itself (cost) → destroy 1 monster on the field |
| アルトス | remove 3 Fog Counters from anywhere on the field (cost; chosen when they are spread over cards) → the opponent discards 1 random card |
| タービュランス | remove 1 from itself (cost) → special summon 雲魔物－スモークボール from its Deck or either GY |
| ストーム・ドラゴン | cannot be Normal Summoned; special summon procedure: banish 1 「雲魔物」 from its GY; once per turn, put 1 Fog Counter on a face-up monster |
| アイ・オブ・ザ・タイフーン | at its own attack declaration, every face-up non-「雲魔物」 monster changes battle position |

Rulings chosen and reviewed:
- Counters go only on face-up monsters (the general counter rule).
- スモークボール is summoned in Attack Position (the codebase's default for 「特殊召喚する」).
- アシッド・クラウド's 「フィールド上の魔法または罠カード」 includes the Field Zone and Set cards.

## Tests
`tools/test_s03_u237_ns27.js` passes 36/0, on real DUEL paths and Replay-audited. The refusal-only checks have no actions, so they are not audited.
- タイフーン's position changes at a real attack declaration, and battle survival against 究極竜.
- Self-destruction after a real position change to Defense.
- Counter counts 1 / 2 / 3.
- Each cost, and its refusal without enough counters.
- アルトス's counters chosen across 3 cards.
- ストーム・ドラゴン's procedure legal and refused, its missing Normal Summon method, and its once-per-turn limit.

Not tested: ストーム・ドラゴン summoned face-up in Defense Position (the shared self-destruction covers it).

Other checks:
- `test_s03_u135`, `test_v580_batch10` (フォッグ・コントロール), `test_v730_batch25` (雲魔物のスコール), `test_auto_cycle12` (ポイズン・クラウド), `test_s03_u235` and `test_s03_u236` still pass.
- Negative control on U236: 21 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15957 PASS / 0 FAIL** (= U236 15921 + 36 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U236.
- Coverage: TESTED 2686, ENGINE_GAP 598, NOT_STARTED 1035, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 646 declared, 0 off-target.
