# S03-U84 激流葬 IMPLEMENTED→TESTED (Claude)

Base: shared LATEST `checkpoint_claude_s03_u83_dark_hole_20260919.zip` (Claude, U83).

## Why this unit

Continuing priority #7's IMPLEMENTED tier directly after S03-U83's ブラック・ホール. 激流葬 (Torrential
Tribute) is the highest-consumer-count **main-deck** IMPLEMENTED candidate remaining (qty=9 across 9 of the
13 fixed decks — the only two higher-qty IMPLEMENTED candidates, A・O・J カタストル and インヴェルズ・
ローチ, are both Extra Deck monsters, matching this session's own established preference for main-deck
candidates first).

## Card

激流葬 (Torrential Tribute) — a foundational Normal Trap: "When a monster(s) is Summoned: Destroy all
monsters on the field."

## What was found

The existing implementation (`cards/00_generic_core.js`, unchanged by this unit) was already fully correct:

```js
defineScript("激流葬", {
  onOtherSummon:true,
  type:"trap", priority:2,
  condition(ctx){
    const mons = API.fieldCards({zone:'mz'});
    if(!mons.length){ ctx.reason = "フィールドにモンスターがいません"; return false; }
    return true;
  },
  resolve(ctx){ API.destroyAll('mz', null, "激流葬"); },
  passive:{
    onNormalSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; },
    onSpecialSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; },
    onFlip(ctx){ return ctx.card.face==='down' && ctx.zone==='sz' && !!(ctx.event&&ctx.event.flipSummon); },
  }
});
```

A real Trap responding to **any** real Normal/Special/Flip Summon by **either** player — gated only on the
Trap's own face-down/set-in-`sz` state (no restriction on whose summon triggered it, correctly matching the
real "either player" scoping) — resolving via the same generic `API.destroyAll('mz', null, reason)` primitive
ブラック・ホール (S03-U83) uses. No bug, no gap — missing only a dedicated test.

## Fix

None needed to the card itself. Added the missing dedicated real-DUEL-path test.

## Dedicated test

`node tools/test_s03_u84_torrential_tribute.js` — 4 assertions, all pass, real DUEL path throughout.

- **A**: a real set Trap responds to a real opponent Normal Summon (of a low-Level monster needing no
  tribute), destroying every real monster on both sides — the newly-Summoned monster and an already-present
  ally of the Trap's own controller alike — with the Trap itself resolving normally to the GY.
- **B**: a real negative control — illegal to activate with no monster anywhere on the field.

Both segments carry a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `IMPLEMENTED` -1, `TESTED` +1 (激流葬).
- `CARD_TEST_FOCUS` given an explicit `{"激流葬"}` entry for this test file (board fixtures are GENERIC_OK,
  no off-target risk, but added proactively matching established precedent).
- `python tools/s03_status_audit.py`: EXIT 0, 84 declared status changes (+1 from U83), off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13211 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations.

## Real-duel measurement

Not a new capability or bug fix, so no fresh R1 sweep was run specifically for this unit; 激流葬 has already
been drawn and activated incidentally, blocker-free, across many R1 sweeps this session (present in 9 of the
13 fixed decks). The dedicated test above is this unit's formal evidence for the TESTED promotion.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`199c643d665d79dc8e2d0370ab41ed471ac6a98b28391fa10bd8170a1a68de32` (823 files).

## Remaining

- 六武衆の影武者, 天刑王 ブラック・ハイランダー, E・HERO アブソルートZero, 波動竜騎士 ドラゴエクィテス all
  remain deferred pending genuinely new capabilities.
- Priority #7's IMPLEMENTED tier remains large (58 more candidates after this unit) — top remaining by
  consumer count: A・O・J カタストル / インヴェルズ・ローチ (qty=10 each, Extra Deck), 氷結界の龍 ブリューナク
  (qty=8, Extra Deck), No.39 希望皇ホープ (qty=8, Extra Deck Xyz), 月の書 (qty=7, main deck), 盗賊の七つ道具
  (qty=7, main deck), TG ハイパー・ライブラリアン (qty=6, Extra Deck), TG ワーウルフ / TG ストライカー
  (qty=6 each, main deck).
- Per the fixed fallback order, continuing directly into the next Requirement.
