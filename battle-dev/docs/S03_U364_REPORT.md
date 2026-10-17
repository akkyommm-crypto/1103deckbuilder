# S03-U364 — Counter monsters, Combo monsters and the destroy-substitute kind "counter"

Base: `claude/work` `7807901` (U363, gate 20054 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Engine change (small, additive; engine/1ZV_destroy_substitute_s03.js)
- New substitute kind `destroySubstituteS03:{kind:'counter', counter:'カウンター', causes:[...], mandatory:true}`: one counter of the protected card itself is removed instead of the destruction (`COUNTER_REMOVE` action; options key `cnt:uid`; candidate label for a non-mandatory use). A `mandatory:true` replacement with exactly one option is taken without asking (the other kinds keep the existing optional choice), so 「代わりに…カウンターを1つ取り除く」 is not declinable.

## Cards (`cards/HZZZZZZZZ_claude_s03_u364_counters3.js`)
- デス・モスキート (battle) / メタル・シューター (effects): a forced summon trigger puts 2 counters (`API.addCounter`), a continuous ATK modifier counts them (500 / 800 each), and the substitute above.
- コンボファイター / コンボマスター: a forced `onActivateSuccess` trigger in my Main Phase 1 stamps a card flag with the turn; `attackLimit(card)` returns 2 for that turn (as 重装武者－ベン・ケイ).
- Not part of this unit: 魔導騎士 ディフェンダー (a counter-for-another-Spellcaster substitute), 手錠龍 (equips itself to the attacker), サイコ・コマンダー (a payment in the Damage Step).

## Tests
- `tools/test_s03_u364_counters3.js` 20 / 0. Negative control on the previous build: 8 FAIL. Coverage TESTED 3212 → 3216, NOT_STARTED 638 → 634; `registration_names_missing_from_db` empty; audit 0 FAIL.
