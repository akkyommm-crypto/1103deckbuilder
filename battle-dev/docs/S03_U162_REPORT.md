# S03-U162 — マイン・モール (banished when it leaves the field by the opponent's card effect)

## Why
マイン・モール was ENGINE_GAP. Its reason: 「相手のカードの効果によってフィールドから離れた場合に除外」 could not be expressed, because `banishWhenLeavesField` is unconditional and does not look at the cause. Until S03-U158 the text fallback also made it always battle-indestructible.

## Engine
- `banishWhenLeavesByOpponentEffectS03(card, fromZone, toZone, a)` (engine/00) is consulted by `v350BanishWhenLeavesField`.
- It applies to FX_TO_GRAVE, FX_WIPE_ZONE, FX_BOUNCE and FX_RETURN_DECK when the card leaves the field.
- The card must declare `banishIfLeavesByOpponentEffectS03`.
- The cause is the move action's P3 stamp (`a.p3.reason==='effect'`, `a.p3.actingPlayer` ≠ `a.player`). It is written when the action is committed and replayed with it; the live effect context is not used inside the action.
- Battle destruction, costs and Synchro / Xyz materials are not 「効果によって」.
- P3 auto-stamping (engine/12) now also covers FX_BOUNCE and FX_RETURN_DECK. Only actions committed during an effect's resolution get the stamp.

## Card (`cards/HZJ_claude_s03_u162_mine_mole.js`)
- **Protection**: `protectV21`, once per turn.
- **Synchro draw**: a forced trigger from the GY on the Synchro-material event, only when the Synchro Monster is a Beast by its current Type. It draws 1.
- **Banish on leaving**: `banishIfLeavesByOpponentEffectS03`.

## Test — `tools/test_s03_u162_mine_mole.js` 14/0 (real DUEL path; legal Synchro materials from exCombos; Replay-audited)
- **A**: TG ストライカー + マイン・モール → ナチュル・ビースト (Beast). The forced trigger draws 1.
- **B**: カラクリ参謀 弐四八 + マイン・モール → ゴヨウ・ガーディアン (Warrior). No trigger.
- **C**: it survives the 1st battle of the turn. The 2nd battle destroys it and sends it to the GY.
- **D**: the opponent's サンダー・ボルト → banished.
- **E**: the opponent's 強制脱出装置 → banished (not to the hand).
- **F**: its controller's own ブラック・ホール → GY.
- **G**: the opponent's ブラック・ホール → マイン・モール banished, ワイト to the GY.
- **Negative control on U161**: 5 FAIL.

## Also fixed
`test_s03_u156_deck_triggers.js` D Synchro Summoned ゴヨウ・ガーディアン with ジャンク・シンクロン, which is DARK; ゴヨウ needs an EARTH Tuner. It used `doExSummon` with hand-picked indexes, which does not check materials. The test now takes a legal combo from `exCombos` (カラクリ参謀 弐四八) and asserts the materials are legal: 83 → 84 PASS.

## Status
- ENGINE_GAP → TESTED: マイン・モール (override removed).
- Totals: TESTED 2271, IMPLEMENTED 85, GENERIC_OK 644, PARTIAL 149, ENGINE_GAP 604, NOT_STARTED 1243.
