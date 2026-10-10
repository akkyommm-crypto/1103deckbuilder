# S03-U289 — Tokens summoned by a text that gives no position: the summoning player chooses

## Workflow
- opus-only engine unit (workflow v3). Profile `delegation-expanded-v3-batch3`.
- A follow-up of the S03-U278 / U283 position choice.
  - Tokens are created by `API.createToken` / `API.createTokens`, outside the `API.specialSummon` hook.
  - The scripts give them a position the text often does not (default Defense, or a fixed `pos` in the Token spec).
  - About 18 TESTED cards have a Token sentence with no position, for example スネークポット, アリの増殖, レプティレス・スポーン and ゼータ・レティキュラント.

## Engine — engine/40 `createToken` / `createTokens`, engine/1ZZK
- When Tokens are created while a chain link resolves and the resolving card's Special Summon sentences name no position (`ssPositionFreeS03`), each new Token is queued for the same journaled position choice as S03-U278.
  - The text decides: a position written only in the script does not count.
- The queued choice now accepts a card in either starting position and sets the chosen one only when it differs.
- Texts with 「守備表示で／攻撃表示で…特殊召喚」 are unchanged (スケープ・ゴート).

## Test harness (Opus decision, extends S03-U278)
- `tools/astra_harness.js` answers the queued choice for older tests by keeping the position the card was summoned in: face-up Attack for a monster, the script's position for a Token. Their boards are unchanged.
- Tests that check positions set `globalThis.__MANUAL_SS_POSITION_S03=true`.

## Tests
`tools/test_s03_u289_token_position.js` passes 6/0, Replay-audited.
- T1 / T2: スネークポット Flip Summoned → 毒蛇トークン in Defense, or in Attack, as chosen.
- T3: スケープ・ゴート → no choice; 4 Tokens in Defense.

Negative control on U287 (engine/40 and 1ZZK of U287): 2 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17836 PASS / 0 FAIL** (= U288 17830 + 6 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U288.
- Coverage: TESTED 2908, ENGINE_GAP 490, NOT_STARTED 921, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 870 declared, 0 off-target.
- Published in the batched checkpoint S03-U288–U291.
