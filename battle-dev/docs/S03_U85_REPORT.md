# S03-U85 月の書 IMPLEMENTED→TESTED (Claude)

Base: shared LATEST `checkpoint_claude_s03_u84_torrential_tribute_20260919.zip` (Claude, U84).

## Why this unit

Continuing priority #7's IMPLEMENTED tier directly after S03-U83/U84. 月の書 (Book of Moon) is a
highest-consumer-count **main-deck** IMPLEMENTED candidate remaining (qty=7 across 7 of the 13 fixed decks).

## Card

月の書 (Book of Moon) — this project's own card database, printed 2003-04-24, within the 2011-08-31 cutoff,
a Quick-Play Spell: "Target 1 face-up monster on the field; change that target to face-down Defense
Position."

## What was found

The existing implementation (`cards/00_generic_core.js`, unchanged by this unit) was already fully correct:

```js
defineScript("月の書", {
  targets:true,
  type:"quick-play", priority:2,
  condition(ctx){
    const t = API.fieldCards({zone:'mz', filter:x=>x.card.face==='up'});
    if(!t.length){ ctx.reason = "表側表示のモンスターがいません"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const t = API.fieldCards({zone:'mz', filter:x=>x.card.face==='up'});
    API.selectCard("月の書：裏側守備にするモンスター", t, x=>done([x]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0]; if(!t) return;
    API.flip(t, 'down', "月の書");
    API.changePosition(t, 'def', "月の書");
  }
});
```

Targets a real face-up monster on either side (no restriction, matching real text exactly — this is a
targeting effect any player can use offensively or defensively). `resolve()` doesn't re-resolve the stale
target stub itself, but `API.flip`/`API.changePosition` both internally call `resolveTarget` and safely no-op
if the target has left the field — no bug. Missing only a dedicated test.

## Fix

None needed to the card itself. Added the missing dedicated real-DUEL-path test.

## Dedicated test

`node tools/test_s03_u85_book_of_moon.js` — 5 assertions, all pass, real DUEL path throughout.

- **A**: a real activation targeting a real face-up opponent ATK-position monster flips it real face-down
  Defense Position.
- **B**: a real activation targeting the controller's own real face-up monster produces the same real result
  (confirming no side restriction, matching the real text).
- **C**: a real negative control — illegal with no face-up monster anywhere on the field.

Every segment carries a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `IMPLEMENTED` -1, `TESTED` +1 (月の書).
- `CARD_TEST_FOCUS` given an explicit `{"月の書"}` entry for this test file.
- `python tools/s03_status_audit.py`: EXIT 0, 85 declared status changes (+1 from U84), off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13216 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations.

## Real-duel measurement

Not a new capability or bug fix, so no fresh R1 sweep was run specifically for this unit; 月の書 has already
been drawn and activated incidentally, blocker-free, across many R1 sweeps this session (present in 7 of the
13 fixed decks). The dedicated test above is this unit's formal evidence for the TESTED promotion.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`08d054b713d7f5f9f572f19d22be0a0748fe89501a5ab4bb1d00aeb984baa829` (825 files).

## Remaining

- 六武衆の影武者, 天刑王 ブラック・ハイランダー, E・HERO アブソルートZero, 波動竜騎士 ドラゴエクィテス all
  remain deferred pending genuinely new capabilities.
- Priority #7's IMPLEMENTED tier remains large (57 more candidates after this unit) — top remaining by
  consumer count: A・O・J カタストル / インヴェルズ・ローチ (qty=10 each, Extra Deck), 氷結界の龍 ブリューナク
  (qty=8, Extra Deck), No.39 希望皇ホープ (qty=8, Extra Deck Xyz), 盗賊の七つ道具 (qty=7, main deck), TG
  ハイパー・ライブラリアン (qty=6, Extra Deck), TG ワーウルフ / TG ストライカー (qty=6 each, main deck).
- Per the fixed fallback order, continuing directly into the next Requirement.
