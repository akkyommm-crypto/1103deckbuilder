# S03-U266 — Outdated ENGINE_GAP reasons 2: 因幡之白兎, 阿修羅, サーチライトメン, きつね火, ワンショット・ブースター

## Workflow
- opus-only. I re-checked the ENGINE_GAP reasons again after S03-U264.
- These five now hold only in part; three small engine additions close them.
- Built on U264 while U265 ran, then rebased onto U265 (`rebase_unit.py`).

## Engine
- **One-sided Set ban.** `SET_MONSTER` and `SET_ST` refuse a player whose `temporaryFlags.noSetS03` is this turn (「このターン相手プレイヤーはフィールド上にカードをセットする事ができない」). The old `continuous.noFaceDownSet` is symmetric and takes no player.
- **Tribute ban, function form.** `tributeCandidates` (engine/70) accepts a function form of the script declaration `noAdvanceTributeS03` (S03-U169), for 「表側表示で存在する限り」.
- **Normal Summon record.** `NORMAL_SUMMON` records `temporaryFlags.normalSummonSuccessS03`: 「自分がモンスターの召喚に成功したターン」, Normal / Tribute Summons only. The older `summonedThisTurnS03` also counts Flip Summons.

## Cards → TESTED (2011 texts; ENGINE_GAP overrides removed) — cards/HZZZZS_claude_s03_u266_unlocks2.js
- **因幡之白兎:**
  - cannot be Special Summoned;
  - returns to the hand at the End Phase of its summon / flip turn (S03-U244 spirit return);
  - while the opponent has monsters it must attack directly (attacker-aware restriction on itself, S03-U264, plus the script's `canDirectAttack`).
- **阿修羅:** cannot be Special Summoned; the spirit return; can attack each opponent monster once (`attackAllMonstersS03`, S03-U149).
- **サーチライトメン:** flip effect: this turn the opponent cannot Set cards.
- **きつね火:** destroyed by battle while face-up → special summoned from the GY at that End Phase (forced); cannot be Tributed for a Tribute Summon while face-up.
- **ワンショット・ブースター:**
  - special summon from the hand in a turn its controller Normal Summoned;
  - release it → destroy an opponent monster that battled its controller's monster this turn (battle record, S03-U236).

## Existing tests adjusted (status records; no behavior assertion changed)
Each check becomes an "implemented" / "unlocked" check, and every count is unchanged:
- `test_auto_cycle12`: the きつね火 SKIP (149);
- `test_auto_cycle13`: the サーチライトメン, 因幡之白兎 and 阿修羅 SKIPs (160);
- `test_v920_batch43`: the ワンショット・ブースター precise gap (30).

## Tests
`tools/test_s03_u266_unlocks2.js` passes 22/0, on real DUEL paths with turns and phases through the processor. Replay-audited.

Negative control on U265: 13 FAIL.

Two first-run fixes:
- 因幡之白兎's direct attack needs the script-level `canDirectAttack`: a continuous `grantsDirectAttack` is reach-checked with the card's `oppMonsters` scope.
- A test changed a position after the baseline.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16938 PASS / 0 FAIL** (= U265 16916 + 22 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U265.
- Coverage: TESTED 2836, ENGINE_GAP 549, NOT_STARTED 935, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 797 declared, 0 off-target.
