# S03-U254 — NOT_STARTED 5 (棘の妖精, D・バインド, 絶対服従魔人, ワーム・イーロキン, ニトロ・シンクロン)

## Workflow (mixed, fresh Sonnet subagent)
- A fresh Sonnet subagent ran `brief254.md` and finished all seven cards: 58/0 on its first hand-back, with no engine change.
- Its negative control (manifest entry removed) gave 26 FAIL and no crash.
- The brief asked it to flag any forced effect it could only implement as optional. It reported none.
- The main session reviewed the code and rulings and did the declarations, this report and the gate.
- **Correction after the first pre-scan** (it failed on two existing tests):
  - `test_s03_u210_ns3` E2: the new helper `wormTargetsS03` had the same name as a global in cards/HZZR (スクラップ・ワーム). The later declaration replaced it, so スクラップ・ワーム's trigger was never offered. Renamed `eloquinWormTargetsS03`.
  - `test_grave_continuous_v29` E3: the System v29 design budget (≤ 20 cards declaring GY-source continuous effects) was exceeded (22) by シャブティのお守り and BF－蒼天のジェット, which used the クリボー pattern.
  - The assertion does not contradict any 1103 text, so it was kept. The two cards were removed from the unit and stay NOT_STARTED; they need a turn-scoped lingering-effect primitive that does not scan the GY.
  - Their test scenarios and declarations were removed.
- Measured: subagent 195,717 tokens, 69 tool uses, 542 s. Parent-side correction 1 (above).

## Cards → TESTED (2011 texts) — cards/HZZZZH_claude_s03_u254_ns34.js

| Card | Effect / reuse |
|---|---|
| 棘の妖精 | the opponent cannot target its face-up Insects for attacks (`continuous.cannotBeAttackTarget`); the monster that battled it becomes Defense Position at the end of the Damage Step |
| D・バインド | with a face-up 「D」 monster (GROUP.D_MORPHTRONIC, exact; setcode 4140 is not), the opponent's face-up Level 4+ monsters cannot attack or change position |
| 絶対服従魔人 | it attacks only when it is the only card on its controller's field and the hand is empty; it negates effect monsters it destroys (engine/1S) |
| ワーム・イーロキン | cannot be Special Summoned; once per turn, a face-up 「ワーム」 Reptile → face-down Defense Position |
| ニトロ・シンクロン | used as Synchro Material for a 「ニトロ」 Synchro Monster → draw 1 |

Rulings chosen and reviewed:
- A face-down monster has no name or race, so it neither counts for nor is affected by the name / race conditions.
- 棘の妖精's position change also applies when it is destroyed in that battle.
- 「ニトロ」: there is no setcode, so the name is used. It is exact for the 2011 Synchro pool.

## Tests
`tools/test_s03_u254_ns34.js` passes 44/0 after the correction, on real DUEL paths and Replay-audited.

Negative control on U253: 21 FAIL (the remaining checks are negatives, controls and audits).

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16571 PASS / 0 FAIL** (= U253 16527 + 44 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U253.
- Coverage: TESTED 2774, ENGINE_GAP 569, NOT_STARTED 976, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 735 declared, 0 off-target.
