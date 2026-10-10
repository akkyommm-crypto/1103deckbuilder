# S03-U274 — Extra Normal Summons: 二重召喚 (a second Normal Summon or Set) and 氷結界の虎将 グルナード (a continuous extra-summon source)

## Workflow
- opus-only engine unit (workflow v3). Profile `delegation-expanded-v3-batch3`. Built in parallel on U273, then rebased onto the final U273.
- The class-B triage named "a generic extra Normal Summon key" as a recurring need.
- インヴェルズの門番 is left out: its 「通常召喚できる」 may or may not include a Set, and its grant condition needs an advance-summon record of 「インヴェルズ」.

## Engine
- **`normalRightFreeS03(P)` / `consumeNormalRightS03(P)` (engine/00):**
  - The Normal Summon / Set reducers and the legality checks use these helpers: engine/40 `getLegalHandActions`, engine/60's summon hint, and the Gemini second summon (engine/1ZI).
  - The temporary turn flag `doubleSummonS03` means: 1 = a second Normal Summon or Set is available; 2 = used. A later 二重召喚 does not give a third.
  - Without the flag the behaviour is exactly the old `normalSummonUsed` check.
- **`continuous.extraNormalS03:{filter(db, player, card)}` (engine/40 `extraNormalSummonKeyV370`):**
  - A face-up source offers an extra Normal Summon (attack position, the existing extra-summon path) of a monster passing the filter, once per turn per source card.
  - The key is `'src:xn'+uid`. `NORMAL_SUMMON_ATTEMPT` marks it used in the turn's temporary flags.

## Cards → TESTED (2011 texts) — cards/HZZZZZC_claude_s03_u274_extra_normal.js
- **二重召喚** (Spell): this turn its controller may Normal Summon (or Set) twice. It cannot be activated again the same turn.
- **氷結界の虎将 グルナード:** while face-up, once per turn, its controller may Normal Summon a 「氷結界」 monster in addition to the Normal Summon, before or after it.

## Existing tests adjusted (status records; no behavior assertion changed)
Each check becomes an "Engine unlocked" check, and every count is unchanged:
- `test_v490_batch01` (二重召喚);
- `test_v670_batch19` (グルナード).

## Tests
`tools/test_s03_u274_extra_normal.js` passes 21/0, on real DUEL paths (activation, then Normal Summon / Set / extra summon through the legal hand actions) and Replay-audited.
- D1: two Normal Summons, then no third.
- D2: activated after the first summon, the second is a Set. Without it, nothing more is offered.
- D3: a second 二重召喚 is not legal; two turns later the flag is gone.
- G1: ワイト Normal Summoned, then 氷結界の武士 extra-summoned. Once per turn, and only for 「氷結界」.
- G2: the extra summon first, then the ordinary Normal Summon.
- G3: a face-down グルナード grants nothing.

Negative control on U273: 8 FAIL, no crash.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17279 PASS / 0 FAIL** (= U273 17258 + 21 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U273.
- Coverage: TESTED 2868, ENGINE_GAP 524, NOT_STARTED 928, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 829 declared, 0 off-target.
- Published in the batched checkpoint S03-U272–U275.
