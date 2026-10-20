# S03-U373 — five PARTIAL cards: the coarse auto-table entries replaced by exact scripts

Base: `claude/work` `2e2002b` (U372, gate 20223 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

Status PARTIAL → TESTED (`from: PARTIAL` in `data/s03_status_changes.json`). A script defined later replaces the card's `AUTO_DECK_TABLE` entry.

## Cards (`cards/HZZZZZZZZI_claude_s03_u373_autotable2.js`)
- ヴァイロン・マテリアル: `u312Define` (S03-U312) Equip Spell for 「ヴァイロン」 monsters, ATK +600, with the shared Vylon Deck search when it is sent face-up from the field to the Graveyard.
- 極星宝ドラウプニル: the same equip pattern for 「極神」/「極星」 monsters, ATK +800; the search of one 「極星宝」 card (Traps, except itself — `nameHas`, any card kind) happens only after a destruction BY A CARD EFFECT (`graveInfo.byDestroy`, not battle, not the equip rule / self rule / equip substitution).
- スクラップ・シャーク: forced trigger on `onActivateSuccess` (Spell, Trap or monster-effect activation) that destroys the face-up Shark; its destruction by a 「スクラップ」 card's effect (`graveInfo.srcUidS03`, as スクラップ・コング S03-U208) allows sending one 「スクラップ」 monster from the Deck to the Graveyard (ネクロバレー respected).
- 見習い魔術師: Normal / Flip / Special Summon success places a Spell Counter on a face-up capable card (`counterCapableCardsV22`); destroyed by battle -> a Level 2 or lower Spellcaster from the Deck, face-down in Defense (shared Deck trigger, `deckTriggerEffectV4S03`).
- 機皇城 (Field Spell): `continuous.immuneToTarget` protects my 「機皇帝」 monsters from targeting effects whose source (`ACTIVATION_PREP_S03.uid`) is a Synchro Monster on the field; the Deck search of a 「機皇帝」 monster after the Field Spell is destroyed.
- Left PARTIAL: D・バリア, D・リモコン, シャドウ・リチュア, ハーピィ・クィーン, ボスラッシュ, ワンハンドレッド・アイ・ドラゴン, ヴァイロン・エレメント, 人海戦術, 堕天使アスモディウス, 白竜の聖騎士, 超古深海王シーラカンス, 魔法の歯車 (and the non-auto-table PARTIALs).

## Test floor adjusted (with the reason)
- `tools/test_s03_u135_auto_table_filters.js` floor for the live identity-filter entries lowered from 70 to 50 (five more cards left the auto table; the floor would otherwise break with every batch). No expectation about card behaviour changed.

## Notes
- The 機皇城 Replay audits first failed when the test switched `gameState.activePlayer` by hand after `baselineA()`; the final test plays the opponent's turn with the real `endTurn()`.

## Tests
- `tools/test_s03_u373_autotable2.js` 32 / 0. Negative control on the previous build: 12 FAIL. Coverage TESTED 3247 → 3252, PARTIAL 24 → 19; `registration_names_missing_from_db` empty; audit 0 FAIL.

## Existing test expectation changed (with the reason)
- `tools/test_s03_u239_ns28.js` case A: マジカル・コンダクター removes 2 of 4 counters to Special Summon the Level 2 見習い魔術師 from the hand. With the exact 見習い魔術師 script, that Special Summon success places a Spell Counter (text ①) on a capable card — here マジカル・コンダクター — so the count is 3, not 2. The old expectation came from the coarse auto-table entry that had no such effect; the card text is the authority. Only this number (and its label) changed.
