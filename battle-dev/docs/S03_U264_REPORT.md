# S03-U264 — Attacker-aware attack restriction, multi-turn lingering effects, and 7 outdated ENGINE_GAP reasons

## Workflow
- opus-only, because it is engine work.
- ヒーロー・ヘイロー was returned by the U261 Sonnet subagent: its restriction depends on the attacker, and no hook received the attacker.
- A re-scan of ENGINE_GAP reasons against the recent primitives found seven more that now hold only in part or not at all. Lingering sources (U257), activation locks (U259), the control lock (U251), turn-limited Levels (U247) and the v7 scheduler cover them.

## Engine
- **Attacker-aware restriction (engine/1ZU).** `continuous.cannotBeAttackedByS03(target, attacker, self)` has the same reach and the same 「相手は」 rule as `cannotBeAttackTarget`. `forcedAttackTargetReasonS03` (engine/1ZR) now passes the attacker from its three call sites in engine/30:
  - the target list;
  - the replay pick;
  - the attack request.
- **Multi-turn lingering effects.**
  - `API.lingerS03(p, card, reason, untilTurn)` → `LINGER_ADD_S03 {untilTurn}` stores `{uid, player, untilTurn}` in `gs.lingerLongS03` (only when used, so existing digests are unchanged).
  - These entries are collected for continuous effects and activation locks while `turn ≤ untilTurn`, and pruned at the start of a later turn.

## Cards → TESTED (2011 texts) — cards/HZZZZQ_claude_s03_u264_hooks.js
- **ヒーロー・ヘイロー** (NOT_STARTED): a Trap → Equip Card for a face-up Warrior with ATK ≤ 1500. The opponent's monsters with ATK ≥ 1900 cannot attack the equipped monster.
- ENGINE_GAP overrides removed for these seven:
  - **エレメント・ソルジャー:** WATER on the field → its control cannot change; EARTH → the effect monsters it destroys are negated.
  - **ネクロ・ディフェンダー:** banished from the GY in its controller's Main Phase. Until the next opponent End Phase the chosen monster is not destroyed by battle, and its controller takes no battle damage from that monster's battles (a multi-turn lingering source).
  - **メテオ・レイン:** this turn its controller's monsters inflict piercing damage (lingering `piercingDamage`).
  - **泉の精霊:** an Equip Spell from the GY to the hand; that card cannot be activated this turn (lingering activation lock).
  - **味方殺しの女騎士:** at each own Standby Phase, release another own monster or it is destroyed.
  - **能力調整:** own face-up monsters −1 Level until the End Phase (`API.modLevel`).
  - **D－HERO デビルガイ:**
    - once per turn, while it is in Attack Position, banish an opponent monster;
    - its player cannot battle this turn (a lingering `cannotAttack`);
    - the monster returns in the same position at the 2nd own Standby Phase. The return is scheduled (engine/16) and is a MOVE, not a summon.

## Existing tests adjusted (status records; no behavior assertion changed)
Each test listed a card as unimplemented or as a precise ENGINE_GAP. Each check becomes an "unlocked" check, and every count is unchanged:
- `test_auto_cycle12` (エレメント・ソルジャー, 149);
- `test_v720_batch24` (能力調整, 46);
- `test_v780_batch30` (味方殺しの女騎士, 45);
- `test_v830_batch34` (メテオ・レイン, 42).

## Tests
`tools/test_s03_u264_hooks.js` passes 30/0, on real DUEL paths. Turns are advanced through the processor with phases in order. Replay-audited.

Negative control on U263: 18 FAIL.

A first run had vacuous checks: the test's turn helper could not leave the Draw Phase, so later turns never happened. The helpers now step through the phases, and the checks are real.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16855 PASS / 0 FAIL** (= U263 16825 + 30 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U263.
- Coverage: TESTED 2825, ENGINE_GAP 554, NOT_STARTED 941, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 786 declared, 0 off-target.
