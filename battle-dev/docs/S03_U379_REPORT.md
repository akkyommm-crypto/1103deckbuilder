# S03-U379 — four Spell / Trap cards

Base: `claude/work` `44edf72` (U378, gate 20368 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZO_claude_s03_u379_spells.js`)
- 増殖 (Quick-Play): cost = release a face-up クリボー; `API.createToken` fills the free Monster Zones with クリボートークン (Defense, 300/200, `noAdvanceTributeS03`).
- 百機夜工 (Quick-Play): on resolution all 「D」 monsters of the Graveyard are banished (ネクロバレー respected), a face-up Machine monster is chosen and gets +200 ATK each (stat modifier until the End Phase).
- スターライト・ロード (Trap): `u379MyLosses(link, me)` counts MY cards the chain link destroys (its targets on my side, or the mass 全て wording of the text narrowed by 相手… and モンスター / 魔法・罠); 2 or more; negate and destroy, then an optional yes / no Special Summon of スターダスト・ドラゴン from the Extra Deck.
- マジシャンズ・クロス (Normal Spell): target one of two or more face-up Attack Position Spellcasters; `setAtk 3000` until the End Phase; the used Spell is a lingering source (`API.lingerS03`, turn stamp + target uid) whose `continuous.cannotAttack` (from:['linger']) stops the other Spellcasters of its controller.

## Tests
- `tools/test_s03_u379_spells.js` 19 / 0. Negative control on the previous build: 9 FAIL. Coverage TESTED 3271 → 3275, NOT_STARTED 593 → 589; `registration_names_missing_from_db` empty; audit 0 FAIL.
