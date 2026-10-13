# S03-U337 — 墓守の大神官 / 大筒持ち, マシンナーズ・カノン, 古代の機械合成獣 / 採掘機

Base: `claude/work` `1e44531` (U336, gate 19234 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Engine change (`engine/1ZV_destroy_substitute_s03.js`)
- New destroy-substitute kind `discardHand` (「代わりに手札から…モンスター1体を捨てる事ができる」): `destroySubstituteS03:{kind:'discardHand', causes:['battle','effect'], filter(card)}`. The option (`kind:'discard'`, key `dis:<uid>`) is offered with the existing journaled choice (decline possible); the apply step discards the chosen hand card with `FX_DISCARD`; a hand card cannot be claimed by two protected cards. Battle and effect sites both use it (tested).

## Cards (`cards/HZZZZZZY_claude_s03_u337_graveworld.js`)
- 墓守の大神官: `normalSummonProcedure` method (1 Tribute, `materialFilter` 「墓守の」), continuous ATK +200 per 「墓守の」 of my Graveyard, `destroySubstituteS03` discardHand.
- 墓守の大筒持ち: forced `onFieldToGraveBatchS03` trigger — each of my 「墓守の」 monsters released (`graveInfo.releasedS03`, Tribute Summon or a cost) other than 大筒持ち → 700 damage each.
- マシンナーズ・カノン: `cannotNormalSummon`, hand `summonProcedure` whose cost lets the controller pick any number (including zero) of Machine monsters of the hand through `API.selectCard` with an extra 「decide」 entry; the number is parked in the turn-temporary player flag `u337CannonN` and copied to the card by its forced self `onSpecialSummon` trigger; continuous ATK ×800.
- 古代の機械合成獣: the Gadget effects read from `summonProvenance.materialSnapshots` (helpers of S03-U144): Green +300 ATK, Red 500 on direct battle damage, Yellow 700 on a battle destruction.
- 古代の採掘機: cost discard; the Deck Spell is moved face-down (`MOVE` Deck → S/T Zone or Field Zone, the old Field Spell goes to the Graveyard) with `setTurn`; the lingering card's `activationLockS03` refuses its activation that turn.
- Left: 墓守の使い魔 (attack-declaration cost), 墓守の長 (player-specific Necrovalley immunity, one on the field), マシンナーズ・フォース (only by 督戦官コヴィントン, 1000 LP to attack), 古代の機械城 / 工場.

## Tests
- `tools/test_s03_u337_graveworld.js` 47 / 0. Negative control on the previous build: 26 FAIL. Coverage TESTED 3071 → 3076, NOT_STARTED 779 → 774; audit 0 off-target. Pre-scan: every test that mentions the destroy-substitute engine or the five cards (and its neighbours) unchanged.
- Authoring notes: a card with more than one normal-summon method opens `openPick` (a no-op in the harness) — tests choose the method with `normalSummonMethodsFor` + `pickTributes` + `finishNormalSummon`; Lv5–6 monsters need one Tribute; `resolveTarget` returns `{card,…}` without `db` (use `dbOf(r.card)`).
- Interpretation: 大筒持ち 「『墓守の大筒持ち』を生け贄に捧げる事はできない」 is implemented as 大筒持ち itself not being counted (the Tribute Summon with it is not refused).
