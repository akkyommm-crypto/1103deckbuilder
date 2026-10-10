# S03-U90 ダスト・シュート IMPLEMENTED→TESTED (Claude)

Base: shared LATEST `checkpoint_claude_s03_u89_call_of_the_haunted_20260919.zip` (Claude, U89).

## Why this unit

Continuing priority #7's IMPLEMENTED-tier audit directly after S03-U89. The next-highest-consumer-count
main-deck IMPLEMENTED candidate is ダスト・シュート (Trap Dustshoot), qty=4 across agent/bf/six/worm of the
13 fixed decks.

## Card

ダスト・シュート (Trap Dustshoot) — this project's own card database, printed well before the 2011-08-31
cutoff, a Normal Trap. Real text (confirmed via Yugipedia): "If your opponent has 4 or more cards in their
hand: Look at your opponent's hand and choose 1 monster from it to shuffle into the Deck."

## What was found

The existing implementation (`cards/00_generic_core.js`, unchanged by this unit) was already fully correct:

```js
defineScript("ダスト・シュート", {
  type:"trap", priority:2,
  condition(ctx){
    if(API.foe(ctx).hand.length<4){ ctx.reason = "相手の手札が4枚未満です"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const foe = gameState.players[ctx.opponent];
    const mons = foe.hand.map((c,i)=>({p:ctx.opponent,zone:'hand',index:i,card:c,db:dbOf(c)}))
      .filter(x=>x.db.k==='m');
    if(!mons.length){ showToast("相手の手札にモンスターがいません"); done([]); return; }
    API.selectCard("ダスト・シュート：デッキに戻すモンスター", mons, t=>done([t]), "相手の手札を確認");
  },
  resolve(ctx){
    const t=ctx.selectedTargets[0]; if(!t) return;
    act({type:"FX_RETURN_DECK", player:ctx.opponent, zone:'hand', index:t.index, toBottom:false, reason:"ダスト・シュート"});
    API.shuffle(ctx.opponent);
  }
});
```

Requires the real opponent to have 4+ cards in hand, offers only the real monsters among them as candidates
(Spells/Traps correctly excluded), removes the chosen one and shuffles it into the Deck via the existing
`FX_RETURN_DECK` + `API.shuffle` primitives (matching "shuffle into the Deck" exactly — the position it's
placed at before shuffling is moot). Missing only a dedicated test.

## Fix

None needed to the card itself. Added the missing dedicated real-DUEL-path test.

## Dedicated test

`node tools/test_s03_u90_trap_dustshoot.js` — 8 assertions, all pass, real DUEL path throughout.

- **A**: a real activation against a real 4-card opponent hand (2 monsters, 2 Spells) offers only the 2 real
  monsters as candidates; the real chosen monster is really removed from hand and really shuffled into the
  Deck; the card itself resolves to the grave.
- **B**: a real negative control — illegal with exactly 3 cards in the real opponent's hand.
- **C**: a real negative control — a real 4-card opponent hand with no monster at all correctly resolves as
  a no-op (no choice offered, hand completely untouched, the card still resolves to the grave).

Every segment carries a clean Replay audit.

## Coverage / status audit

- `python tools/script_coverage.py`: `IMPLEMENTED` -1, `TESTED` +1 (ダスト・シュート).
- `CARD_TEST_FOCUS` given an explicit `{"ダスト・シュート"}` entry for this test file.
- `python tools/s03_status_audit.py`: EXIT 0, 92 declared status changes (+1 from U89), off-target = 0.

## Gate

- `python tools/check.py` — EXIT 0, **13272 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations.

## Real-duel measurement

Not a new capability or bug fix, so no fresh R1 sweep was run specifically for this unit; ダスト・シュート
has already been drawn and activated incidentally, blocker-free, across many R1 sweeps this session (present
in 4 of the 13 fixed decks). The dedicated test above is this unit's formal evidence for the TESTED
promotion.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips):
`dc8dab4a9a34a3de7c88c015c9b4727ff752cf45f9ea36604b511976625a43a8` (835 files).

## Remaining

Priority #7's IMPLEMENTED-tier main-deck candidates continue: 朱光の宣告者 (qty=3, agent), 墓穴の道連れ
(qty=3, dark), カオス・ソーサラー (qty=3, debris), ライトロード・ハンター ライコウ (qty=3, debris),
ミラクル・フュージョン (qty=3, hero), plus more at qty=3 and below not yet fully enumerated — re-run the
cross-reference for the complete current list. The Extra Deck tier remains separately available: A・O・J
カタストル / インヴェルズ・ローチ (qty=10 each), 氷結界の龍 ブリューナク (qty=8), No.39 希望皇ホープ
(qty=8), TG ハイパー・ライブラリアン (qty=6). 六武衆の影武者, 天刑王 ブラック・ハイランダー, E・HERO
アブソルートZero, 波動竜騎士 ドラゴエクィテス all remain deferred pending genuinely new capabilities.
