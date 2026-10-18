# S03-U424 - D-Lighton (D・ライトン), Extra Veiler (エクストラ・ヴェーラー), Life Stream Dragon (ライフ・ストリーム・ドラゴン), Blackfeather Dragon (ブラックフェザー・ドラゴン)

Base: `claude/work` `5589d46` (U423, gate 21267 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZH_claude_s03_u424_lp_replace.js`)
- D・ライトン: Attack Position redirect of the opponent's effect damage + Defense Position battle damage rule.
- エクストラ・ヴェーラー: hand Special Summon on the opponent's Special Summon + redirect rule for the turn.
- ライフ・ストリーム・ドラゴン: LP 4000 on Synchro Summon, effect damage 0, Equip Spell banish substitute.
- ブラックフェザー・ドラゴン: effect damage to counters, ATK down, counter-removal bolt.

## Engine (two small options)
- `engine/1H_lp_change_v18.js` continuous.lpChange may return {delta, redirectTo}; `engine/1ZV_destroy_substitute_s03.js` banishGrave anyKind.

## Tests
- `tools/test_s03_u424_lp_replace.js` 23 / 0. Negative control on the previous build (card file removed): 11 FAIL. No existing test changed. Coverage TESTED 3435 -> 3439, NOT_STARTED 436 -> 432, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
