# S03-U232 — NOT_STARTED 24

## Workflow (first mixed unit, workflow v2)
- Opus 5.5 (main session) chose the cards and wrote the brief.
- Sonnet 5.5 (subagent, `model: sonnet`, battle-implementer instructions inline) wrote the card script and the test, in this tree only.
- The main session reviewed the code and did everything else:
  - the negative control;
  - the status declarations and the audit;
  - `check.py` registration;
  - this report;
  - the pre-scan, gate and publication.
- Measured: subagent 185,035 tokens, 60 tool uses, 349 s; rework 0.
- Details: `measurements/s03_u232.json` and `1103_SHARED\logs\WORKFLOW_V2_INTEGRATION.md`.

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZZN_claude_s03_u232_ns24.js
- 熟練の白魔導師 / 熟練の黒魔術師:
  - each Spell activation by either player → 1 Spell Counter (max 3; the v12 helpers in cards/97);
  - release it while it has 3 (cost) → special summon バスター・ブレイダー / ブラック・マジシャン from hand / Deck / GY.
- 魔導獣 ケルベロス:
  - +1 counter per Spell activation (no max), ATK +500 each;
  - at the end of a Battle Phase in which it battled, all its counters are removed. This uses `card.battledTurnS03`, because `API.battledThisPhase` is already cleared when `onBattlePhaseEnd` fires.
- 闇紅の魔導師:
  - Normal Summon → 2 counters;
  - +1 per Spell activation, ATK +300 each;
  - once per turn, remove 2 (cost) → the opponent discards 1 random card.
- 機皇兵グランエル・アイン:
  - ATK +100 per other face-up 「機皇」 monster;
  - on Normal Summon (optional) → a face-up opponent monster's ATK is halved until the End Phase (v4 stat modifier, RESET.END).
- No.56 ゴールドラット: once per turn, detach 1 (`detachCostS03`) → draw 1, then return 1 hand card to the Deck, which is shuffled.

## Tests
`tools/test_s03_u232_ns24.js` passes 26/0, on real DUEL paths and Replay-audited.
- Real Spell activations, own and opponent's.
- The counter maximum, release cost and summon source.
- Counters through a real Battle Phase, including a monster that did not battle.
- The random discard and its once-per-turn limit.
- The ATK halving and its reset at the End Phase.
- Detach, draw and return, and the once-per-turn limit.

Other checks:
- `tools/test_s03_u135` and `tools/test_s03_u231_ns23.js` still pass.
- Negative control on U231: 16 FAIL.

## Noted, not changed in this unit (to be checked separately)
- The other cards in `cards/97_activation_recovery.js` (王立魔法図書館 and others) may lack `passive:{onActivateSuccess}`. A quick real-DUEL check gave 王立魔法図書館 no counter from a real 強欲な壺; their existing tests are unit-level.
- Cards in `cards/91_battle_recovery.js` that read `API.battledThisPhase` in `onBattlePhaseEnd` (ビッグ・ジョーズ, ステルスロイド, …) may not fire in a real DUEL for the same reason.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15850 PASS / 0 FAIL** (= U231 15824 + 26 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U231.
- Coverage: TESTED 2670, ENGINE_GAP 598, NOT_STARTED 1051, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 630 declared, 0 off-target.
