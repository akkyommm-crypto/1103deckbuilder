# S03-U267 — 7 cards (心鎮壷, A・O・J サウザンド・アームズ, ヴェノム・スワンプ, カーム・マジック, 白銀のバリア, エネルギー吸収板, 痛魂の呪術) + LP rules scoped to a chain link

## Workflow (mixed, fresh Sonnet subagent + parent engine fix)
- A fresh Sonnet subagent ran `brief267.md` and finished five cards.
- It wrote エネルギー吸収板 and 痛魂の呪術 too, but stopped, as the brief asked, because they did not work in a real chain:
  - An LP rule scoped to a chain link (`API.addLpRule({chainId})`) was active only while that link was still in `gs.chain`.
  - A link leaves the chain before it resolves (CHAIN_RESOLVE_TOP), so the rule never applied to that link's own damage.
- The subagent proposed a 58-line fix. The parent reviewed it and applied it here:
  - `engine/1R` `beginLinkResolutionS03` keeps the resolving link's `chainId`.
  - `API.damageLP` (engine/40) writes it into the journaled LP action (`chainIdS03`).
  - The LP reducer (engine/00) passes it to `resolveLpChangeV18`.
  - `lpRuleActiveV18` (engine/1H) accepts a rule whose `chainId` equals the damage's own link.
  - Replay stays deterministic, because the id is in the Action.
- 黒板消しの罠 and 地獄の扉越し銃 use the same chain-link rules. Their tests are unit-level and still pass; a real-path check of them is a follow-up.
- The subagent's test (89 asserts) passes 89/0 with the fix.
- Measured: subagent 305,313 tokens, 108 tool uses, 1025 s. Parent-side work: the engine fix, the ENGINE_GAP override removal and 2 status-record tests.

## Cards → TESTED (2011 texts) — cards/HZZZZT_claude_s03_u267_ns38.js
- **心鎮壷:** targets 2 Set Spells/Traps at activation; they cannot be activated while it is face-up (`activationLockS03`).
- **A・O・J サウザンド・アームズ:**
  - It attacks each opponent LIGHT monster once (`attackAllMonstersS03` plus an attacker-aware ban on non-LIGHT targets).
  - It destroys itself before damage calculation against a non-LIGHT monster.
- **ヴェノム・スワンプ** (ENGINE_GAP override removed):
  - End Phase Venom Counters on all non-「ヴェノム」 monsters, −500 ATK each;
  - a monster this effect brings from above 0 ATK to 0 is destroyed.
- **カーム・マジック:** Main Phase 1 before its controller did anything; neither player can Normal / Flip / Special Summon in this turn's Main Phases and Battle Phase.
- **白銀のバリア－シルバーフォース－:** negates and destroys the opponent's damaging Trap, then destroys the opponent's face-up Spells/Traps.
- **エネルギー吸収板:** the opponent's burn effect becomes recovery, for that link only.
- **痛魂の呪術:** the opponent's burn effect is taken by its activator, for that link only.

## Existing tests adjusted (status records; no behavior assertion changed)
Each check becomes an "unlocked" / "has a script" check, and every count is unchanged:
- `test_auto_cycle21`: the カーム・マジック SKIP (74);
- `test_v920_batch43`: the ヴェノム・スワンプ precise gap (30).

## Tests
`tools/test_s03_u267_ns38.js` passes 89/0, on real DUEL paths and Replay-audited.
- Chain windows and attack-declaration responses are covered.
- The burn cards also show that a later effect damage is taken normally, i.e. the rule is scoped to one link.

Negative control on U266: 41 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17027 PASS / 0 FAIL** (= U266 16938 + 89 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U266.
- Coverage: TESTED 2843, ENGINE_GAP 548, NOT_STARTED 929, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 804 declared, 0 off-target.
