# S03-U372 — six PARTIAL cards: the coarse auto-table entries replaced by exact scripts

Base: `claude/work` `4eaf2be` (U371, gate 20199 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

A script defined later replaces the card's `AUTO_DECK_TABLE` entry (the precedent: 沼地の魔神王, S03-U134). Status PARTIAL → TESTED (`from: PARTIAL` in `data/s03_status_changes.json`).

## Cards (`cards/HZZZZZZZZH_claude_s03_u372_autotable.js`)
- ハイエナ: Graveyard trigger after a battle destruction; Special Summons another ハイエナ from the Deck, then `API.shuffle`.
- スーパイ: Graveyard trigger for an effect-caused send from the Monster Zone (`!graveInfo.battle && !graveInfo.releasedS03`); 太陽の神官 from the Deck with `setAtk` doubled; an End Phase schedule (`turns:0`) returns it to the hand.
- クロス・ポーター: ignition (target an own monster -> Graveyard, an 「N」 monster of the hand Special Summoned; `GROUP.N_NEOSPACIAN`) + a Graveyard trigger that searches an 「N」 monster.
- メンタルマスター: once-per-turn ignition; cost = 800 LP and a Psychic monster released; Special Summons a Level 4 or lower Psychic monster from the Deck in Attack Position.
- リバース・オブ・ネオス (Quick-Play Spell): reacts to the destruction of my 「ネオス」 Fusion Monster; E・HERO ネオス from the Deck, +1000 ATK, destroyed at the End Phase. (Neos Fusion Monsters return to the Extra Deck at the End Phase by themselves — that is not a destruction.)
- トライアングル・エリア (Quick-Play Spell): destroys an A Counter monster (`alienCountersS03`), then an 「エーリアン」 Level 4 monster from the Deck, destroyed at the End Phase.
- Left PARTIAL (needs more than a rewrite): ヴァイロン・エレメント / マテリアル, ハーピィ・クィーン, スクラップ・シャーク, シャドウ・リチュア, 見習い魔術師, 魔法の歯車, 人海戦術, ボスラッシュ, 堕天使アスモディウス, 白竜の聖騎士, 超古深海王シーラカンス, 機皇城, ワンハンドレッド・アイ・ドラゴン, 極星宝ドラウプニル and the older partials.

## Test floor adjusted (with the reason)
- `tools/test_s03_u135_auto_table_filters.js` counted the live identity-filter entries of the auto table with a floor of 80; the six replaced cards left the auto table, so the count went from 82 to 76. The floor is now 70 (the same test still checks that no entry leaks a non-matching card and that none loses its target). No expectation about card behaviour changed.

## Tests
- `tools/test_s03_u372_autotable.js` 24 / 0. Negative control on the previous build: 12 FAIL. Coverage TESTED 3241 → 3247, PARTIAL 30 → 24; `registration_names_missing_from_db` empty; audit 0 FAIL.
