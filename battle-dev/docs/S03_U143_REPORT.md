# S03-U143 — status honesty: TESTED cards whose own auditNote admits a missing part → PARTIAL

## Why
While looking into destruction-replacement effects I read the scripts of the TESTED Six Samurai cards. Three of them, all in
the fixed Six Samurai list, say in their own `auditNote` that part of their text is not automated:
- 六武衆－ザンジ and 六武衆－ヤイチ: 「六武衆による破壊代替は未自動化」.
- 真六武衆－シエン: 「②六武衆による破壊代替は未自動化」.

A scan of every script's `auditNote` for 未自動化 / 未実装 / 次段階 / 手動 / 未対応 / 省略 found 6 such cards, all TESTED. That
reports an unsupported part as a success.

## Change (data only; no behaviour change)
- `data/script_status_overrides.json` pins the 6 cards to PARTIAL, each with a reason naming the missing part:

  | Card | Missing part |
  |---|---|
  | 真六武衆－シエン | ② destruction substitute by another 「六武衆」 |
  | 六武衆－ヤイチ | destruction substitute |
  | 六武衆－ザンジ | destruction substitute |
  | 魔法都市エンディミオン | ③ counter-cost substitute and ④ self-destruction substitute are partly manual |
  | マシンナーズ・ギアフレーム | ② Union equip / unequip |
  | マシンナーズ・フォートレス | ② discard when targeted by an opponent monster effect |

- `data/s03_status_changes.json`: 6 entries TESTED → PARTIAL.
- New gate test `tools/test_s03_u143_audit_note_status.js`: every script whose `auditNote` admits a missing / manual /
  next-stage part must be pinned PARTIAL or ENGINE_GAP with a reason. A future note-with-gap on a TESTED card fails the
  gate. Its coverage focus is empty, so it promotes nothing.

## Test — 8/0
- The 6 scripts are found.
- Each is pinned (none is TESTED).
- The 6 pins are named.
- Pre-scan of all 362 gate tests (parallel): 0 FAIL.

## The underlying gap (recorded; needs a design decision)
「破壊される場合、代わりに…できる」 is an optional replacement: the player decides at the moment of destruction. That moment
is often in the middle of a card's resolution or inside the battle reducer. The engine can open a choice only at the end of a
step, not pause a resolution in the middle. There are 63 such cards in the 2011 pool (57 NOT_STARTED, including more Six
Samurai, ガチガチガンテツ, 巨星のミラ, ライフ・ストリーム・ドラゴン and ラヴァル・グレイター). Two ways forward:
1. a pause-and-resume destruction step (engine work across destroy / battle paths);
2. a per-card player setting ("always use the substitute when possible").
This affects play, so it is listed for the user's decision in the handoff rather than guessed.

## Status
- TESTED 2218 → 2212, PARTIAL 168 → 174 (on top of U142). The fixed Six Samurai list now honestly has 3 PARTIAL cards.
