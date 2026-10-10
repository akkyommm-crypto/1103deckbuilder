# System v30 — Destroy / SpecialSummon / Destruction-history provenance (B1 / B2 / B3)

Baseline: `checkpoint_ready25_claude_live_20260905.zip`
(SHA256 `faa1dacd53befd0aa77e5fe7867f40d40ccddd0a723953a281cf679161862915`)

`python tools/check.py`: **7206 PASS → 7264 PASS / 0 FAIL** (+58 new).

## Why these three, and what was actually measured

Every one of B1/B2/B3 was **probed on the running build before any engine edit**, because
E1 had previously been misdiagnosed as an engine defect. The probe measured both the
producer and the consumer path.

| | consumer already existed? | producer already existed? | verdict |
|---|---|---|---|
| B1 destroyer `byPlayer` | **yes** — `graveInfo.byPlayer`, `onDestroy.byPlayer`, read by e.g. スクラップ・ドラゴン, 突風 | **partly** — `BATTLE_CLEANUP` filled it; effect destruction never did (`API.destroy` had no `byPlayer` argument at all) | real gap |
| B2 `specialSummonedFromPlayer` | no | **data present but discarded** — `FX_SPECIAL_SUMMON` already receives `a.fromPlayer` and uses it to pick the source pile, then stored only the zone name | real gap |
| B3 destroyed-position history | no | no — `graveInfo` carried `face` (up/down) but never `pos` (atk/def); `battlePhaseV6` is battle-phase scoped and cleared | real gap |

Measured before/after (`onDestroy` on an effect-destroyed Set card):

```
before: {turn:6, from:'sz', byDestroy:true, lv:null, face:'down'}            byPlayer absent
after : {turn:6, from:'sz', byDestroy:true, byPlayer:0, lv:null, face:'down', pos:null}
```

## B1 — destroyer byPlayer

`destroyerPlayerV30(gs, a)`: explicit `a.byPlayer` → else the **resolving chain link's**
`player` → else `null`.

This deliberately reuses the pattern already established by v21
(`destroyerKindV21`, `destroyerTargetingV21` both read `gs.chain[last]`), so no parallel
provenance system is introduced. Because `gs.chain` is part of `gameState` and is built by
journalled `CHAIN_ADD` actions, the derivation is replay-safe.

* Wired into `FX_TO_GRAVE` and `FX_DESTROY_BANISH`.
* `API.destroy(t, reason, byPlayer)` — the third argument is optional and only needed when
  an effect must attribute the destruction to someone other than the resolving player.
* **Never guesses.** Outside a chain (rule processing, costs) it stays `null` rather than
  defaulting to `0`. A card that cannot identify the destroyer does not activate.

Known remaining hole (pre-existing, **not** introduced here): `FX_WIPE_ZONE` sets no
`graveInfo` and emits no `onDestroy` at all. It is used only by 激流葬 / ブラック・ホール /
神獣王バルバロス / ブラック・ローズ・ドラゴン. The mass S/T destroyers that matter for
コザッキーの自爆装置 — 大嵐, ハーピィの羽根帚 — issue per-card `API.destroy`, so they route
through `FX_TO_GRAVE` and are covered.

## B2 — specialSummonedFromPlayer

`FX_SPECIAL_SUMMON` now records `card.specialSummonedFromPlayer` (and `ssHistory[].fromPlayer`)
from the `a.fromPlayer` it already had. Added to `ZONE_LOCAL_KEYS`, so it is dropped when the
card leaves the field — same lifecycle as `specialSummonedFrom`.

Helpers: `specialSummonFromPlayerV30(card)`, `summonedFromOpponentV30(card, controller, zone)`.

**Owner is not a substitute.** A card summoned from the opponent's Graveyard keeps
`owner === controller === 1` while sitting in player 0's Monster Zone, so owner-based
inference is both wrong in principle and unreadable in practice.

The `onSpecialSummon` payload was **not** extended: the event already carries the card
(as `cards`/`card`, stored as `uids` and rehydrated by `flushDeferredEventsV2`), and the card
is authoritative. Adding a second copy of the fact would be exactly the parallel provenance
channel this design avoids.

## B3 — destroyedThisTurnV30

The handoff framed B3 as *battle* destruction provenance. The card text is not
battle-restricted — 「相手フィールド上に守備表示で存在するモンスターを破壊したターン」 counts
destruction by effect too — so a battle-only record would have been wrong. Implemented as a
turn-scoped log covering both paths:

```
{turn, byPlayer, victimPlayer, from, pos, face, lv, uid, battle}   // pure JSON
```

* Appended from `FX_TO_GRAVE`, `FX_DESTROY_BANISH` and `BATTLE_CLEANUP`.
* Pruned at `PASS_TURN` (entries whose `turn` is not the current turn), so it cannot grow without bound.
* Query: `destroyedDefenseMonsterThisTurnV30(gs, byPlayer, victimPlayer)`.
* 裏側守備表示 counts as 守備表示 (recorded as `pos:'def'` regardless of `face`).
* Survives the destroyed card leaving the Graveyard — a grave scan would not.

`graveInfo.pos` was added alongside the existing `face`/`lv` in the same two destruction paths.

## Cards unlocked

| card | was | needed |
|---|---|---|
| コザッキーの自爆装置 | ENGINE_GAP (READY25 SKIP) | B1 |
| 王墓の罠 | ENGINE_GAP | B2 |
| 破壊神の系譜 | ENGINE_GAP | B3 |

Implementation `cards/A2_engine_b123_unlocked.js`, verification `tools/test_provenance_v30.js`.

Historical ENGINE_GAP records were **moved, not deleted**: each card left the `gaps` list of
its original batch test and entered an `engineRepairUnlockedV30` list asserting `!ov[n]`
(`test_v530_batch05.js`, `test_v690_batch21.js`, `test_v830_batch34.js`), the override entry
was removed from `data/script_status_overrides.json`, and the READY25 SKIP rationale in
`cards/9Z_ready25_b1.js` was annotated rather than removed.

## Replay note

`API.specialSummon` called outside a正規 resolution queues its success event outside the
Action Journal, so a bare call mismatches `finalDigest`. **This predates v30** — it was
reproduced on the untouched checkpoint:

```
pristine: specialSummon only => {ok:false, why:'finalDigest'}
pristine: destroy only       => {ok:true}
```

The engine was therefore not changed. `test_provenance_v30.js` asserts the full replay digest
for the destruction path, and verifies the special-summon provenance by re-applying the Action
Journal to the initial state and comparing the resulting values.
