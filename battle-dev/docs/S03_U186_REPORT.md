# S03-U186 — sample-deck cards without a dedicated test (IMPLEMENTED → TESTED)

## Finding
A survey of the sample decks (data/80_test_decks.js) found 10 cards with scripts but no dedicated test. Their first real-path tests
found three incomplete scripts:
- 裁きの龍 had no summon procedure (「墓地の「ライトロード」モンスターが4種類以上の場合のみ特殊召喚できる」): it could not be summoned in DUEL.
- Sin サイバー・エンド・ドラゴン had no summon procedure (banish サイバー・エンド・ドラゴン from the EX Deck) and no 「Sin」 uniqueness.
- 強制転移 did not apply 「そのモンスターはこのターン表示形式を変更できない」.

## Changes
- cards/HZZC: 裁きの龍 / Sin サイバー・エンド・ドラゴン summon procedures (Sin: one face-up 「Sin」 on the field).
- engine/19 v10 `cannotChangePositionV10`: turn-stamped zone-local `noPosChangeTurnS03`; 強制転移's swap sets it on both monsters.

## Cards (IMPLEMENTED → TESTED)
強制転移, 禁じられた聖杯, 馬頭鬼, 裁きの龍, ダブルコストン, カイザー・シーホース, トロイホース, 可変機獣 ガンナードラゴン, Sin サイバー・エンド・ドラゴン,
No.11 ビッグ・アイ.

## Notes
- 裁きの龍 ② uses the shared automatic ライトロード End Phase mill (resolveEndPhaseMills — not a chain link), as the other ライトロード.
- The tribute-value choice (1 / 2 体分) is a DOM pick (openPick, not journaled); the Normal Summon action carries the chosen value, so
  Replay reproduces the summon. The test captures openPick (the harness stubs it).
- Negative control on U180: the three fixed cards fail (A position lock, D summon, G summon); the other seven were already correct, so
  their tests pass on U180 too — this unit adds their first dedicated tests.

## Tests
`tools/test_s03_u186_sample_deck_cards.js` 26/0 (real DUEL paths, Replay-audited). The ライトロード names used as GY fodder are already
TESTED (so their statuses do not change).

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **14896 PASS / 0 FAIL** (= U185 14870 + 26 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U185.
- Coverage: TESTED 2347, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 73, GENERIC_OK 644, PARTIAL 125 (4996); audit 308 declared, 0 off-target.
