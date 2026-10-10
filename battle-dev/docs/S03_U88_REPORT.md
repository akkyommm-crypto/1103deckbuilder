# S03-U88 砂塵の大竜巻 IMPLEMENTED→TESTED (Claude)

Base: shared LATEST `checkpoint_claude_s03_u87_tg_warwolf_striker_20260919.zip` (Claude, U87).

## Why this unit

Continuing priority #7's IMPLEMENTED-tier audit directly after S03-U87. A fresh cross-reference of all 13
fixed deck lists against `script_coverage.py` (output redirected to a scratch path, per the S03-U86 lesson)
showed the main-deck IMPLEMENTED tier was not actually exhausted as previously believed — several main-deck
candidates with qty 3-5 remained unexamined. The highest is 砂塵の大竜巻 (Dust Tornado), qty=5 across
agent/debris/tg_gadget of the 13 fixed decks.

## Card

砂塵の大竜巻 (Dust Tornado) — this project's own card database, printed 2004-03-01, within the 2011-08-31
cutoff, a Normal Trap: "Target 1 Spell/Trap your opponent controls; destroy that target, then you can Set 1
Spell/Trap from your hand."

## What was found

The existing implementation (`cards/20_control_counter.js`, unchanged by this unit) was already fully
correct:

```js
defineScript("砂塵の大竜巻", {
  type:"trap", priority:2, quickEffect:true, targets:true,
  condition(ctx){
    if(!API.fieldCards({zone:'sz', player:ctx.opponent, filter:x=>x.card}).length){
      ctx.reason = "相手フィールドに魔法・罠がありません"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("砂塵の大竜巻：破壊する相手の魔法・罠",
      API.fieldCards({zone:'sz', player:ctx.opponent, filter:x=>x.card}),
      t=>done([t]), "裏側のカードも選べます");
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    if(!t){ API.log("対象が場にないため不発"); return; }
    API.destroy(t, "砂塵の大竜巻");
    const st = API.pileCards(ctx.player,'hand',x=>x.db.k!=='m' && x.card!==ctx.card);
    if(!st.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:"砂塵の大竜巻：セットする魔法・罠（任意）",
      candidates: st, min:1, max:1, cancelable:true,
      note:"セットしない場合は閉じてください",
      resume:{handler:'s03u62.giant-trunade-set', args:{player:ctx.player}},
      meta:{scriptName:"砂塵の大竜巻"}});
  }
});
```

Targets any real Spell/Trap the opponent controls, face-up or face-down alike (matching real text exactly —
no face restriction), destroys it, then optionally Sets 1 Spell/Trap from hand via the existing S03-U62
registered choice handler (`s03u62.giant-trunade-set`).

This exact card was already central to S03-U70's real R1 infinite-loop investigation — a generic
`getChainResponsesV2` mz-zone gating bug (a Trap referenced from a player's `mz` array was incorrectly
offered as a legal chain responder with none of the normal Trap safeguards), fixed generically at the time
and unrelated to this card's own script, which was and remains correct. U70 deliberately used an empty
`CARD_TEST_FOCUS` entry to avoid promoting it via incidental mention, leaving this promotion for a later,
properly-scoped unit. Missing only a dedicated test.

## Fix

None needed to the card itself. Added the missing dedicated real-DUEL-path test.

## Dedicated test

`node tools/test_s03_u88_dust_tornado.js` — 8 assertions, all pass, real DUEL path throughout.

- **A**: a real activation offers a real face-down opponent Trap as a legal target candidate; destroys it;
  really Sets a real Spell from hand as the optional follow-up; the card itself resolves to the grave.
- **B**: a real face-up opponent Spell is also confirmed as a legal target (no face restriction); with an
  empty hand, the optional Set choice is correctly not offered.
- **C**: a real negative control — illegal when the opponent controls no Spell/Trap at all.

Every segment carries a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `IMPLEMENTED` -1, `TESTED` +1 (砂塵の大竜巻).
- `CARD_TEST_FOCUS` given an explicit `{"砂塵の大竜巻"}` entry for this test file (fixtures used:
  リビングデッドの呼び声, サイクロン, 速攻のかかし — none promoted).
- `python tools/s03_status_audit.py`: EXIT 0, 90 declared status changes (+1 from U87), off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13250 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations.

## Real-duel measurement

Not a new capability or bug fix, so no fresh R1 sweep was run specifically for this unit; 砂塵の大竜巻 has
already been drawn and activated incidentally, blocker-free, across many R1 sweeps this session (present in
3 of the 13 fixed decks), and was the direct subject of S03-U70's own real-duel investigation. The dedicated
test above is this unit's formal evidence for the TESTED promotion.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`aabc3cbe12609118eb9db99e4de2d64a809db49c10b8add816ff4fed3fc0e3a0` (831 files).

## Remaining

Priority #7's IMPLEMENTED-tier main-deck candidates are NOT as exhausted as U87's handoff believed — this
unit's fresh cross-reference (with output correctly redirected to a scratch path) surfaced several more:
リビングデッドの呼び声 (qty=5, bf/dark/debris/jurrac/tg_gadget), ダスト・シュート (qty=4,
agent/bf/six/worm), 朱光の宣告者 (qty=3, agent), 墓穴の道連れ (qty=3, dark), カオス・ソーサラー (qty=3,
debris), ライトロード・ハンター ライコウ (qty=3, debris), ミラクル・フュージョン (qty=3, hero), plus more not
yet individually ranked. The Extra Deck tier remains separately available: A・O・J カタストル / インヴェル
ズ・ローチ (qty=10 each), 氷結界の龍 ブリューナク (qty=8), No.39 希望皇ホープ (qty=8), TG ハイパー・ライブラ
リアン (qty=6). 六武衆の影武者, 天刑王 ブラック・ハイランダー, E・HERO アブソルートZero, 波動竜騎士 ドラゴ
エクィテス all remain deferred pending genuinely new capabilities.
