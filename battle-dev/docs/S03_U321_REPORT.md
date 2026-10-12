# S03-U321 — 「コアキメイル」: クルセイダー, ウルナイト, スピード, マキシマム, ルークロード, ヴァラファール (+ engine: normal draw drains onDrawCard)

Base: `claude/work` `89e7bd9` (U320, gate 18800 PASS / 0 FAIL). Sonnet 5.5, single writer. All six NOT_STARTED.

## Engine change (`engine/30_processor_chain_battle.js`, `processDrawV27`)
- The DRAW Action queues one `onDrawCard` deferred event per card (System v8), but a normal draw only enqueued an `onDraw` EVENT and ADJUST: the queued events stayed in `gameState.deferredEvents` until some later drain. A card that reacts to the card drawn in the Draw Phase (コアキメイル・スピード; also 凡骨の意地 / 漆黒のトバリ / 神速の具足, whose unit tests call the condition directly) never saw it at the right time. A `DRAIN_EVENTS` step now follows the `onDraw` event. Existing draw-event tests are unchanged.

## Cards (`cards/HZZZZZZI_claude_s03_u321_koaki.js`; upkeep = `d9KoakiUpkeep` of cycle 30, as a forced End Phase effect of the controller's own turn)
- クルセイダー: battle kill → a 「コアキメイル」 card of my Graveyard to the hand (chosen).
- ウルナイト: once per turn show 鋼核 → Special Summon a Lv4- 「コアキメイル」 (not ウルナイト) from the Deck.
- スピード: normal draw is 鋼核 → show it, draw one more.
- マキシマム: hand procedure (banish 鋼核); own upkeep (鋼核, else a Koaki monster, else destroyed); once per turn targeted destruction.
- ルークロード: one-Tribute Advance method (Koaki tribute only); summon trigger: banish a Koaki card of the GY → destroy up to 2 opponent cards (second target asked via a confirm).
- ヴァラファール: upkeep = 鋼核 only; one-Tribute method; piercing damage; protectV21 against Trap effects only.
- Left: ウォーアームズ, グールズスレイブ (substitute granted to other cards), コアの再練成 / コア・ブラスト / コアバスター.

## Tests
- `tools/test_s03_u321_koaki.js` 38 / 0 (upkeep variants, battle, the real draw, hand procedure, Tribute methods, piercing, protection record; Replay audits). Negative control on the previous build: 17 FAIL. Coverage TESTED 2997 → 3003, NOT_STARTED 850 → 844; audit 0 off-target.
- Authoring note: `resolveTarget` handles carry no `db` — read `dbOf(r.card)` in callbacks.
