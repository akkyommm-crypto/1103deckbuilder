# S03-U286 — 地縛神 Chacu Challhua and 地縛神 Cusillu: Battle Phase prohibition, release-type destruction substitute

## Workflow
- opus-only engine unit (workflow v3). Profile `delegation-expanded-v3-batch3`.
- The Sonnet unit S03-U284 parked these two 地縛神 as engine work. Built on U284; rebased onto U285.

## Engine
- **engine/30 `battlePhaseForbiddenV340`:** a continuous source of the other player with `continuous.noOpponentBattlePhaseS03(card)` → the turn player cannot conduct the Battle Phase. From Main Phase 1 the next phase is the End Phase.
- **engine/1ZV:** a destruction-substitute kind `releaseOwn`, `{kind:'releaseOwn', causes:[…], after(player, card)}`.
  - The protected card's controller may release any other monster they control, face-up or face-down, instead of the destruction.
  - The release is an `FX_TO_GRAVE` (not a destruction, tribute provenance). Then the declared `after` step runs.
  - Options, keys, labels and the reducer log follow the existing kinds. The decision is the same journaled substitute choice.

## Cards → TESTED (2011 texts) — cards/HZZZZZM_claude_s03_u286_earthbound3.js (common clauses via earthboundCommonS03, S03-U282)
- **地縛神 Chacu Challhua:**
  - Once per turn, in its controller's Main Phase: damage equal to half its DEF. It cannot attack that turn, and it cannot be used after it attacked.
  - While it is face-up in Defense Position, the opponent cannot conduct the Battle Phase.
- **地縛神 Cusillu:** when it would be destroyed by battle face-up, its controller may release another monster they control instead. Then the opponent's LP become half; it is not damage, and a fraction rounds up.

## Tests
`tools/test_s03_u286_earthbound3.js` passes 15/0, on real DUEL paths and Replay-audited.
- C1–C3: Chacu Challhua's effect, once per turn and no attack after it; not after attacking. In Defense the opponent's Battle Phase is forbidden; not in Attack, and not for its own controller.
- K1–K3: Cusillu attacks 青眼の白龍 → ワイト is released instead and the opponent goes 8000 → 4000. Declined → destroyed. No other monster → destroyed.

Negative control on U284 (engine/30, 1ZV and the manifest of U284): 5 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17695 PASS / 0 FAIL** (= U285 17680 + 15 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U285.
- Coverage: TESTED 2900, ENGINE_GAP 498, NOT_STARTED 921, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 862 declared, 0 off-target.
- Published in the batched checkpoint S03-U284–U287.
