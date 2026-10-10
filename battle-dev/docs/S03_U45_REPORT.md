# S03-U45 C-S03-36 LEGACY_CHOICE_PICKED_DB (Claude)

Base: `checkpoint_claude_s03_u44_trigger_forced_per_effect_20260913.zip`, SHA256 `fac775bc742e76fe37460db16a8f63ea17384bf2fc8b05f0038a02d475074573`.

## How it was found (R1 on a second pairing of Astra's fixed lists)

- After U42–U44 the Dragunity / 兎ラギア fixed-list path had no blocker except the 未来融合 gap (Astra consult). The first real-duel blocker of the other major decks was unmeasured.
- The R1 driver gained `R1_DECKS=<p0>,<p1>`, which pairs any two fixed lists (`data/r1_lists/major_decks_v1_<id>.txt`, loaded through `parseDeckText`). `R1_LIST=v1` and the provisional default are unchanged.
- **六武衆 (six) vs 1103兎ラギア**, responder, seeds `0x52310301`–`0x52310307` × both first players (14 duels, U44 build): **only 2 / 14 completed**.
  - `0x52310301`, both first players: SYSTEM_FAULT 「諸刃の活人剣術 解決エラー：Cannot read properties of null (reading 'card')」. ナチュル・パルキオン banished one of its 2 chosen GY targets as a cost in response.
  - 10 of the other 12: EXCEPTION `answerChoice` "Cannot read properties of undefined (reading 'n')", as early as turn 1.

## Diagnosis

- **answerChoice exception.** A hook on `answerChoiceV49` (seed `0x52310303`, 六武衆 first, turn 1) caught the legacy choice 「六武衆の荒行：対象の「六武衆」」. Its callback ran `v340SixDeck(... x.db.n!==a.db.n ...)`, and `a.db` was undefined.
  - In DUEL a legacy `API.selectCard` goes through ChoiceRequest. The callback received the object from `choiceResolveCandidateV49` (`{p,zone,index,uid,card}`), which has **no `db`**.
  - Outside DUEL the old picker passed `{card, db}`, so the card was TESTED but crashed in real duels.
  - Scope: an upper-bound scan found 121 legacy callback sites reading `.db` near the picked card. Restored `ctx.selectedTargets` already have `db` (`findCardByUidInState`), and `serializeChainSelectionV2` intentionally strips `db` from chain selections.
  - **Classification: INTEGRATION_MISSING** (multi-consumer).
- **Resolution faults (same cause class: a card chosen at activation left its zone before resolution, so `deserializeChainSelectionV2` returns `null` for it).**
  - 諸刃の活人剣術 read `ctx.selectedTargets.map(x=>x.card)` without a guard (the only unguarded `map` in cards/).
    - 2011 ruling (yugioh-wiki 《諸刃の活人剣術》 age 51, 2011-08-04): if one of the 2 targets is banished in response, only the remaining 1 is Special Summoned (11/08/03). The End Phase destroy + damage applies only to monsters it summoned (07/07/21).
  - 六武衆の荒行: in `0x52310305` (兎ラギア first, turn 6), two chained 荒行 chose the same Deck card. The upper link summoned it, and the lower link's `s.summon.card` threw. The Deck monster is not a target and, by the text, is taken at resolution.

## Measurement before (U44 build)

- `tools/test_s03_u45_legacy_choice_picked_db.js` (cases A / B): **2 PASS / 3 FAIL** (no `db` on the resolved candidate; the legacy callback threw; 六武衆－ザンジ not summoned).
- 六武衆 vs 兎ラギア sweep above: 2 / 14 complete.

## Closure

- **engine/09 `choiceResolveCandidateV49`:** the resolved candidate carries `db` in both the uid branch and the coordinate branch. Replay-safe: `CHOICE_ANSWER_V49` journals keys only, and `serializeChainSelectionV2` strips `db`.
- **cards/38 諸刃の活人剣術:** drops targets that left the GY and Special Summons each remaining one while a zone is free. The End Phase reserve covers only the monsters it summoned.
- **cards/36 六武衆の荒行:** uses the chosen Deck card if it is still in the Deck; otherwise a remaining Deck 六武衆 with the target's ATK and a different name; otherwise no summon (the existing no-summon behaviour is unchanged).
- **tools/r1_duel_driver.js:** `R1_DECKS` pairing, plus `data/r1_lists/major_decks_v1_six.txt` (a copy of Astra's list).
- **Test** (after U44 in `tools/check.py`):
  - A: a resolved candidate carries `db`;
  - B: 六武衆の荒行 → target 真六武衆－キザン → Special Summon 六武衆－ザンジ from the Deck, with no exception; Replay ok;
  - C: two chained 荒行 whose only matching Deck card is ザンジ → summoned once, no fault; Replay ok.
  - **After: 9 PASS / 0 FAIL.**
- **R1 gate test:** a new case for 六武衆 vs 兎ラギア on the fixed lists (seed `0x52310303`, 六武衆 first, responder (it stopped on turn 1 before U45; it now ends on turn 10 with Replay ok). The case runs the driver with `R1_DECKS=six,rabbit`; the R1 gate test now has 7 duels, 44 PASS / 0 FAIL (7 real duels incl. the new 六武衆 vs 兎ラギア case)).
- **Regressions:** U44 9 / 0, U43 9 / 0, U41 13 / 0, U34 18 / 0, U35 27 / 0, VS9 19 / 0, astra01 cards 76 / 0; status audit unchanged.

## Real-duel effect

- 六武衆 vs 兎ラギア on the U45 build, responder, seeds `0x52310301`–`0x52310307` × both first players (the same 14 duels as before):
  - **14 / 14** end normally with no blocker (before: 2 / 14); Replay reproduces every digest; 0 refused ignition effects.
  - The previously failing `0x52310305` (兎ラギア first) now ends on turn 24.
  - Unsupported: only 王宮の弾圧 (1 manual activation offer; ENGINE_GAP shared by 5 major decks, the next candidate).
- The fix went through three measured steps on the same seeds, all with Replay ok:
  - after the `db` fix + 諸刃 guard: 13 / 14, 0x52310305 stopping on the 荒行 `s.summon` null;
  - after the 荒行 guard: 13 / 14, stopping on `a.db.n` — engine/40 `resolveTarget` returns no `db`;
  - after using `dbOf(a.card)`: 14 / 14.
- Data: Claude scratchpad `u45_after/`, `u45_after2/`, `u45_after3/`.

## Gate

- `python tools/check.py` — EXIT 0, **12623 PASS / 0 FAIL** (log `s03_u45_full_gate.log`).
- `python tools/build_acode.py data/carddata.json` — EXIT 0.
- Coverage (unchanged versus U44): TESTED 2074 / ENGINE_GAP 614 / NOT_STARTED 1302 / IMPLEMENTED 183 / PARTIAL 179 / GENERIC_OK 644 (TOTAL 4996); 0 off-target.

## Source hash

- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `41ab897eb30f3118f47599bb067068f924e6f854b8e3799c30fac0fc2b24f770` (711 files).

## Remaining

- D.D.クロウ discards itself in `afterResolve` rather than as an activation cost (IMPLEMENTED; noted, not changed).
- Early Deck picks at activation (Ready item; 六武衆の荒行 is one example) remain a separate unit.
