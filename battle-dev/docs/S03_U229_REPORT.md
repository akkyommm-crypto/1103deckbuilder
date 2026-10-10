# S03-U229 — NOT_STARTED 21

## Engine
- `engine/1ZD` supports turn-ranged activation bans.
  - A player's `effectFlags.activationBanS03` holds entries `{from, to, kinds:['s'|'t'], label}`.
  - Spell / Trap card activations of those kinds are refused while `from ≤ turn ≤ to`.
  - The helper `banActivationS03` (cards/HZZZK) adds an entry and drops expired ones.
  - It covers both 「次のターン」 (from = to = next turn) and 「このターン／エンドフェイズまで」 (this turn).

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZZK_claude_s03_u229_ns21.js
- 平穏の賢者 / 静寂の聖者: when it destroys an opponent's monster by battle → the opponent cannot activate Trap / Spell cards next turn.
- 言語道断侍: pay 800 LP (cost) → no Spell / Trap card can be activated by either player this turn.
- 強引な安全協定: discard 1 (cost) → no Trap card can be activated by either player this turn.
- C・シューター: once per turn, send a 「C」 monster on its controller's field (itself included) to the GY (cost) → 800 damage.
- 炎熱刀プロミネンス: once per turn, also in the opponent's turn, banish a 「ラヴァル」 from the GY (cost) → +300 ATK until the End Phase.
- 燃え盛るヒータ / 荒ぶるアウス / 逆巻くエリア: once per turn.
  - Cost: release another face-up FIRE / EARTH / WATER monster.
  - Special summon a monster of that Attribute from the hand.
  - That monster is linked to the card (a v9 link) and is destroyed when the card leaves the field.
- 勝利の導き手フレイヤ:
  - its controller's face-up Fairies get +400 / +400;
  - it cannot be chosen as an attack target while another face-up Fairy (not フレイヤ) is on its side.

## Tests
`tools/test_s03_u229_ns21.js` passes 19/0, on real DUEL paths and Replay-audited.
- The bans are checked turn by turn (5 / 6 / 7), per card kind, and per player.
- The costs are paid as costs.
- ヒータ's summoned monster is destroyed when ヒータ is destroyed by the opponent's attack.
- フレイヤ's values and protection.

Negative control on U228: 16 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15788 PASS / 0 FAIL** (= U228 15769 + 19 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U228.
- Coverage: TESTED 2651, ENGINE_GAP 598, NOT_STARTED 1070, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 611 declared, 0 off-target.
