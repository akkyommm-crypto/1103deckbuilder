# S03-U368 — 大火葬, アヌビスの裁き, ギブ&テイク

Base: `claude/work` `771a0c9` (U367, gate 20136 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZD_claude_s03_u368_linktraps.js`)
- 大火葬: reads the chain top link as 王家の呪い (S03-U355): the opponent's link with a target in a Graveyard that is a monster (`linkTargetsV19`); resolution banishes every monster of both Graveyards (`u342Bad` = ネクロバレー check).
- アヌビスの裁き: the top link is an opponent's Spell whose text destroys 「魔法・罠カード」; cost = discard one hand card; `negatePreviousChainLinkV2(…, true)`, then an optional choice (`API.requestChoice` with `min:0`, handler `u368.anubis`, as 森のざわめき) of an opposing face-up monster to destroy and deal its ATK.
- ギブ&テイク: two targets chosen in order (as 融合回収); `API.specialSummon(opponent, 'grave', index, 'def', reason, me)` puts my Graveyard monster on the opponent's field; `API.modLevel(…, 'endTurn')` raises my monster by its Level.
- Not part of this unit: 偽物のわな, 心鎮壷のレプリカ, 捨て身の宝札, 王宮の重税 / 不吉な占い (private hand reveal and guessing).

## Tests
- `tools/test_s03_u368_linktraps.js` 16 / 0. Negative control on the previous build: 9 FAIL. Coverage TESTED 3227 → 3230, NOT_STARTED 623 → 620; `registration_names_missing_from_db` empty; audit 0 FAIL.
- Authoring lesson: a Trap that opens an optional choice (`min:0`) at its resolution needs the test driver to stop there (`driveToOptional`) — the normal driver answers a `min:0` choice with nothing.
