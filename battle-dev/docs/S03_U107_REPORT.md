# S03-U107 TG1－EM1 IMPLEMENTED→TESTED (Claude)

Base: shared LATEST `checkpoint_claude_s03_u106_tg_rush_rhino_20260920.zip` (Claude, U106).

## Why this unit

Continuing priority #7's IMPLEMENTED-tier audit directly after S03-U106, using U97's corrected
cross-reference: TG1－EM1, qty=3, tg_skill main deck — the last of the qty=3 main-deck candidates from that
cross-reference. Closes out that entire tier.

## Card

TG1－EM1 — Normal Trap. Real text (this project's own authoritative `data/carddata.json` 'e' field; no
Yugipedia page found under this romanization): "相手フィールド上に存在するモンスター1体と、自分フィールド上
に表側表示で存在する『TG』と名のついたモンスター1体を選択して発動する。選択したモンスターのコントロールを
入れ替える。" ("Target 1 monster on the opponent's field and 1 face-up monster named 'TG' on your own field;
swap control of the two.")

## What was found

Already fully correct in `cards/20_control_counter.js`. It reuses the established, shared
`defineControlSwap`/`swapCandidates`/`changeControl` infrastructure (already proven by the sibling card
強制転移) with a `mine()` filter matching exactly "face-up, name starts with 'TG'" for the controller's own
side, and correctly applies **no** face-up restriction for the opponent's side (matching the real text,
which does not require the opponent's monster to be face-up — a real, easy-to-miss detail this unit's test
deliberately confirms rather than just assuming). This unit's entire scope was the missing dedicated test.

## Dedicated test

`node tools/test_s03_u107_tg1em1.js` — 8 assertions, all pass, real DUEL path throughout.

- **A**: a real face-up "TG" monster and a real face-up opponent monster really swap control both ways.
- **B**: a real face-down opponent monster is also confirmed a real legal target, with a real correct swap
  — the "no face-up requirement on the opponent's side" detail.
- **C**: a real negative control — illegal with no real face-up "TG" monster on the controller's own field.
- **D**: a real negative control — illegal with no real monster on the opponent's field.

Every segment carries a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `IMPLEMENTED` -1, `TESTED` +1 (TG1－EM1).
- `CARD_TEST_FOCUS` given an explicit `{"TG1－EM1"}` entry for this test file.
- `python tools/s03_status_audit.py`: EXIT 0, 108 declared status changes (+1 from U106's 107), off-target
  = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13419 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations (log `s03_u107_full_gate.log`).

## Real-duel measurement

No card/engine bug found (verify+test unit), but a fresh R1 sweep was still run for extra confidence since
this closes out the qty=3 main-deck tier:

- `R1_DECKS=tg_skill,dragunity R1_RESPOND=1`, seed `0x6`, first=0 — completed cleanly, turn 8,
  `replay.ok:true`, `digestDiff:null`, `blocker:null`, `errors:[]`, `unsupported:[]`.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`179238e4d2411c91d118f55157e926ae5560d1645aaa54a84dd0fdc949db05bc` (868 files).

## Fresh cross-reference: the qty=3 main-deck tier is now genuinely exhausted

A fresh `script_coverage.py` run (redirected to a scratch path) cross-referenced against all 13
`data/r1_lists/major_decks_v1_*.txt`, restricted to `status==='IMPLEMENTED'`, confirms **no remaining
qty=3 main-deck candidates** — this tier is genuinely closed (unlike U96's premature claim, which a fresh
scan in U97 immediately disproved; this time the fresh scan itself is what's being reported, not an assumed
claim). Remaining candidates by consumer count:

- **Extra Deck tier** (unchanged from earlier units' notes): A・O・J カタストル / インヴェルズ・ローチ
  (qty=10 each), 氷結界の龍 ブリューナク / No.39 希望皇ホープ (qty=8 each, the latter Xyz), TG ハイパー・
  ライブラリアン (qty=6), ガチガチガンテツ / フォーミュラ・シンクロン / キメラテック・フォートレス・ドラゴン
  (qty=3 each).
- **Main-deck qty=2 tier** (not previously enumerated this session): 大天使クリスティア (agent), ゴッドバード
  アタック (bf), 暗黒界の門 (dark), デブリ・ドラゴン (debris), カードガンナー (debris), カラクリ忍者 九壱九
  (karakuri), カラクリ参謀 弐四八 (karakuri), トラップ・スタン (karakuri), 精神操作 (rabbit/tg_gadget), 禁じ
  られた聖槍 (rabbit).

## Remaining

Per the fresh cross-reference above, the next unit should choose between the main-deck qty=2 tier (no
summon-procedure infrastructure risk, matching this session's established main-deck-first preference) or the
Extra Deck qty≥3 tier (higher consumer count but more infrastructure risk). Re-run the cross-reference fresh
again at the start of that unit regardless, per the established lesson (a "current" list decays fast).
