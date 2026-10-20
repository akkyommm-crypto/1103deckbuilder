# S03-U455 - regression fixes for two U454 cards: 成功確率0% (only Fusion Monsters), 同姓同名同盟条約 (4+ same-name monsters)

Base: `claude/work` `491dcfc` (U454). Sonnet 5.5, single writer. Scope was switched mid-unit from the "お互いを縛る永続カード" restriction-card theme to these two fixes; that theme produced no files (only read-only preflight, nothing committed).

## Baseline gate (measured on the clean tree 491dcfc before any change)
- 21922 PASS / 0 FAIL / 0 Traceback / 0 ReferenceError, `GATE_EXIT=0`, last line `PASS no duplicate top-level function declarations` (= U453 21895 + U454 27). The only `TypeError` in the log is the recorded `test_auto_cycle32` noise. The coordinator's separate measurement on `worktrees/parity` gave the same 21922.

## Cards changed (extended in place; no new card file, no new test file)
Files: `cards/HZZZZZZZZZZZK_claude_s03_u454_scope_unity.js`, `tools/test_s03_u454_scope_unity.js` (kept one owner per card).

- 成功確率0% (text, `data/carddata.json`: 「相手の融合デッキから融合モンスター2体をランダムに墓地に送る。」)
  - Bug: U454 drew from the whole Extra Deck (`ex`), so Synchro / Xyz Monsters could be sent.
  - Fix: the candidates are the Extra Deck cards whose `db.st` contains 融合; up to two are drawn from that subset with `duelRandomInt(pool.length, gameState)` (journaled xorshift, no `Math.random`), then sent to the Graveyard.
  - `condition` stays `true`: the text has no activation condition, so 0 or 1 Fusion Monsters still allow the activation (all that exist are sent).
- 同姓同名同盟条約 (text: 「2体以上存在する場合に発動できる。…●2体:…1枚破壊 ●3体:…全て破壊」)
  - Bug: U454 treated 4 or more as the 3-monster effect (`n>=3`).
  - Fix: the 3-monster effect applies at exactly 3; with 4 or more the card is still activatable (the activation requirement is 「2体以上」) but neither bullet applies.

## RULING_UNRESOLVED (the repo holds no ruling data for these cards: grep of `battle-dev/`, `docs/`, `data/` found only card text and the U454 test)
1. 成功確率0% with 0 or exactly 1 Fusion Monster in the opponent's Extra Deck: can it be activated, and with 1 does it send that one? Chosen: activatable in both cases (the text has no 「…場合に発動できる」 condition; the general 2011 rule is that an effect that can only partly or not at all be applied can still be activated unless the text sets a condition), and with 1 it sends that 1. Question: does the 2011 ruling for 《成功確率0%》 require 2 or more Fusion Monsters for the activation?
2. 同姓同名同盟条約 with 4 or more same-name monsters: chosen the literal text (activatable, no effect). Question: does the 2011 ruling treat 4+ as "no effect applies" (chosen) or as "3体以上 = all", or forbid the activation?
3. 同姓同名同盟条約 with two different-name groups (e.g. 2 of A and 3 of B, or 4 of A and 2 of B): kept the existing "largest group decides" reading (not changed in this unit, not covered by a new assertion). Question: which group's count is 「その同名モンスターの数」?

## Engine changes
- None.

## Tests
- `tools/test_s03_u454_scope_unity.js`: 27 -> 49 PASS (22 new assertions, none changed or removed), 0 FAIL. Net new = 22.
  - 成功確率0%: mixed Fusion + Synchro + Xyz over 24 seeds (always exactly two Fusion sent; no Synchro / Xyz ever sent; each of 3 Fusion survives in some seed = random within the subset; picks equal the seeded `duelRandomInt` draws), 4 Fusion + 3 Synchro with Replay audit, same-seed determinism, 0 Fusion (activatable, nothing sent, trap used), exactly 1 Fusion (activatable, only that one sent, no Synchro in its place, Replay audit), exactly 2 Fusion.
  - 同姓同名同盟条約: boundary 2 (one destroyed), 3 (all destroyed), 4 (activatable, nothing destroyed, Replay audit), 5 (nothing destroyed). The existing below-threshold (1 monster, different names) negatives are unchanged.
- Negative control (fix reverted by restoring the committed U454 card file, rebuilt, new test): 9 FAIL / 40 PASS (the audit lines and the 2 / 3 boundary asserts pass without the fix, as expected); restored fix: 0 FAIL / 49 PASS.
- Nearby: `test_v690_batch21.js`, `test_v740_batch26.js`, `test_v630_batch15.js` 0 FAIL.

## Full gate (`python tools/check.py > log 2>&1; rc=$?; echo "GATE_EXIT=$rc" >> log`)
- 21944 PASS = 21922 + 22, 0 FAIL, 0 Traceback / ReferenceError, `GATE_EXIT=0`, last line `PASS no duplicate top-level function declarations`: PASS.
- Coverage before / after (unchanged, no status change): `{ENGINE_GAP: 344, GENERIC_OK: 644, IMPLEMENTED: 3, NOT_STARTED: 419, PARTIAL: 10, TESTED: 3576}`; `data/script_coverage.json` differs only in two source line numbers.
- No `data/s03_status_changes.json` declaration (both cards were already TESTED in U454). No ENGINE_GAP records in this unit.

## Not done / next
- The three RULING_UNRESOLVED questions above need the 2011 ruling source.
- The abandoned restriction-card theme (生贄封じの仮面, 魔力の枷, カイザーコロシアム, サモンリミッター, 墓守の使い魔, 地盤沈下, 闇からの呼び声) is still NOT_STARTED. Preflight notes: a summon lock hook exists (`summonLockS03` in `engine/1ZZS_summon_lock_s03.js`) and a Special Summon lock (`specialSummonLockS03`); a global Release lock, a per-turn summon counter across both players and a hand-action LP cost were not found in the engine by grep (not confirmed by a probe, so no ENGINE_GAP was recorded).
