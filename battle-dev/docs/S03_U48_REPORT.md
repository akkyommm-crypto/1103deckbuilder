# S03-U48 BF－大旆のヴァーユ resolution stop (Claude)

Base: `checkpoint_claude_s03_u47_special_summon_effect_decl_20260914.zip`, SHA256 `92d9aed65ee6e9788228a072451359f9cd45c847a52d7065006197ea56d9c0d4`.

## How it was found (R1 on two more fixed-list pairings)

- Astra's lists `hero` and `bf` were copied to `data/r1_lists/major_decks_v1_<id>.txt` and paired with 兎ラギア (`R1_DECKS`, responder, both first players). U47 build.
- **【HERO】 vs 兎ラギア** (`0x52310401`–`0x52310407`): 14 / 14 completed, Replay ok, unsupported []. Wrong-step review of the ops (`u48_sweep_evidence.js`): 冥府の使者ゴーズ was activated from the hand in Main Phase with no damage taken (7 times); recorded for a later unit.
- **【BF】 vs 兎ラギア** (`0x52310501`–`0x52310507`): 11 / 14 completed (Replay ok).
  - **Stop:** `0x52310501` first 1, turn 14 — SYSTEM_FAULT 「BF－大旆のヴァーユ 解決エラー：Cannot read properties of undefined (reading 'undefined')」.
  - `0x52310501` / `0x52310506` first 0 hit the 120 s harness timeout; a 600 s scratch harness showed `0x52310501` first 0 is a `RESPOND_LOOP` (バトルフェーダー from the hand offered again and again on top of the first バトルフェーダー; next unit).

## Diagnosis

- A scratch `R1_HARNESS` wrapper printed the stack: `resolveTarget` ← `API.setCardFlag` ← the card's resolve.
- The resolve set the negation flag on `{card:h.card}` with `h = locateCard(s.ex.card)`. `locateCard` returns `{p, zone, index}` (no card), so `resolveTarget` got an object without card / p / zone and read `players[undefined][undefined]`.
- Scan for the same pattern (a `locateCard` result's `.card`) in cards / engine: 1 hit (this card).
- Classification: CARD_WORK on a serious blocker (real-duel stop).

## 2011 source

yugioh-wiki 《ＢＦ－大旆のヴァーユ》 age 62 (2011-03-23):
- ignition effect in the GY; this card and the targeted non-Tuner 「ＢＦ」 in its own GY are banished at resolution (09/04/18, 09/05/06, 10/03/27);
- if either left the GY before resolution, neither is banished and nothing is summoned (09/05/12);
- negated by 王宮の弾圧, the materials stay in the GY (09/04/18);
- not a Synchro Summon (09/04/18); the summoned monster's effects are negated.

## Measurement before (U47 build)

- `tools/test_s03_u48_vayu_resolution.js` (with a then-included case B): **9 PASS / 3 FAIL** — every resolution faulted with the same SYSTEM_FAULT.

## Closure

- **cards/38 BF－大旆のヴァーユ:** the flag is set on `{card:s.ex.card}`.
- **Test** `tools/test_s03_u48_vayu_resolution.js` (after U47 in `tools/check.py`), **after: 9 PASS / 0 FAIL**:
  - A: ヴァーユ + BF－漆黒のエルフェン → BF－アーマード・ウィング, both banished, effects negated, not a Synchro Summon; Replay ok;
  - A2: the R1 pattern with BF－アームズ・ウィング as the material; Replay ok;
  - C: 王宮の弾圧 negates it, the materials stay in the GY; Replay ok.
- **Status:** BF－大旆のヴァーユ IMPLEMENTED → TESTED.
- **data/r1_lists:** `major_decks_v1_hero.txt`, `major_decks_v1_bf.txt` (copies of Astra's lists).

## Not covered / found during the unit

- The 09/05/12 case (a target leaves the GY in response) is not in the test: the TESTED response tried, 転生の予言, did not reach the chain after its two target picks in DUEL (`v70SelectExactly`, about 23 uses in 10 card files). Recorded as a separate defect.
- The negation flag is cleared when the monster leaves the field, but not when it is turned face-down (2011 note); pre-existing, recorded.

## Real-duel effect

- **【HERO】 vs 1103兎ラギア**, fixed lists, responder, seeds `0x52310401`–`0x52310407` × both first players, U47 build: **14 / 14 completed**, Replay ok, blocker none, unsupported []. Wrong-step review: 冥府の使者ゴーズ activated from the hand without taking damage (recorded).
- **【BF】 vs 1103兎ラギア**, seeds `0x52310501`–`0x52310507` × both first players, U47 build: **11 / 14 completed** (Replay ok).
  - `0x52310501` first 1: the ヴァーユ SYSTEM_FAULT fixed by this unit (the test reproduces the same resolution).
  - `0x52310501` first 0: a 600 s scratch harness showed a `RESPOND_LOOP` (バトルフェーダー; prepared as U49, before 6 / 1 fail).
  - `0x52310506` first 0: 120 s harness timeout, not yet diagnosed.
- The sweep after the fix is run with U49 (the 【BF】 loop would stop the same seeds again).

## Gate

- `python tools/check.py` — EXIT 0, **12672 PASS / 0 FAIL**, no Traceback (log `s03_u48_full_gate.log`).
- The two `ReferenceError` lines in the log (c1ElementOnField, isEffectNegated) are pre-existing (also in the U45–U47 logs).

## Source hash

`bd0ba12898ca5932a6b57b3a34906554ec651266352ee2e2a3db027bc9f1984b` (722 files, excluding dist/ and *.log; this report set aside).
