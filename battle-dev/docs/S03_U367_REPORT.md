# S03-U367 — three Continuous Traps and a Field Spell

Base: `claude/work` `e06abae` (U366, gate 20117 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZC_claude_s03_u367_contraps.js`)
- 忍法 空蝉の術: the chosen 「忍者」 monster carries the trap's uid in a card flag; `continuous.battleProof` (as 剣闘獣の闘器マニカ) protects it from battle destruction only.
- コア・ブラスト: a Standby trigger once per turn (card flag with the turn) when a 「コアキメイル」 monster is face-up and the opponent has more monsters; the controller chooses which opposing monsters are destroyed until the counts match. **Interpretation**: 「相手フィールド上に存在するカード」 is read as the opponent's monsters (the number being equalised is the monster count).
- スターゲート: a forced Damage Step 'end' trigger adds a ゲート counter when the battle involved an opposing monster; a main-phase ignition (`fieldIgnition:true` is required for an ignition of a face-up Spell / Trap) sends the trap to the Graveyard (cost, the counter count kept in a turn-temporary player flag) and Special Summons a hand monster of Level up to it. The ACTIVATE effect of a Continuous Trap needs `condition: !(zone==='sz' && face==='up')`, otherwise the engine picks it instead of the ignition for the face-up card.
- クローザー・フォレスト: a Field Spell (`LOCATION.FIELD`, `from:['field']`): continuous ATK +100 per monster in the controller's Graveyard for its Beast monsters; `activationLockS03` for every other Field Spell; a Graveyard trigger after being destroyed from the field registers `API.lingerS03` so the lock lasts for the rest of that turn.
- Not part of this unit: コアバスター (an Equip with a 「host left the field」 clause), 極限への衝動 (a Token that cannot be released), マジック・ガードナー (a Spell/Trap counter substitute), 爆弾ウニ (the trap-activation reaction).

## Tests
- `tools/test_s03_u367_contraps.js` 19 / 0. Negative control on the previous build: 9 FAIL. Coverage TESTED 3223 → 3227, NOT_STARTED 627 → 623; `registration_names_missing_from_db` empty; audit 0 FAIL.
- Authoring lessons: `strictScriptLegalityV2(name, player, zone, index, opts)` is the legality check for a test (the older `strictScriptLegality` takes other arguments); a Continuous Trap with an ignition needs `fieldIgnition:true` and a guarded ACTIVATE effect.
