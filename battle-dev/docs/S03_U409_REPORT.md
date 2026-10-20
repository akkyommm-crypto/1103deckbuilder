# S03-U409 - Explode Wing Dragon, Chaos Goddess, Black Flare Knight and Mirage Knight

Base: `claude/work` `70c1f84` (U408, gate 20935 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZS_claude_s03_u409_blackflare.js`)
- エクスプロード・ウィング・ドラゴン: optional onDamageStep trigger destroying the weaker battle partner before the calculation and dealing its ATK.
- カオス・ゴッデス: ignition with a LIGHT discard cost reviving a Level 5+ DARK monster that gets the permanent no-Synchro-material mark.
- 黒炎の騎士: battleDamage 0 for its controller and a battle-destruction Graveyard trigger summoning the Mirage Knight.
- 幻影の騎士: continuous damage-step ATK gain, stamp trigger and End Phase banish.

## Engine (small)
- `engine/20_effect_primitives_ex.js` materialCandidates: noSynchroMaterialS03 (and the key in the zone-local flag list of engine/00).

## Tests
- `tools/test_s03_u409_blackflare.js` 18 / 0. Negative control on the previous build (card file removed): 10 FAIL. No existing test changed. Coverage TESTED 3380 -> 3384, NOT_STARTED 491 -> 487, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
