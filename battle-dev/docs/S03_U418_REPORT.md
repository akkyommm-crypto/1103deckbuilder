# S03-U418 - Alector (神禽王アレクトール), Shibui Ninja (渋い忍者), Gagaga Magician (ガガガマジシャン), Jester Confi (ジェスター・コンフィ)

Base: `claude/work` `d6d5f13` (U417, gate 21109 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZB_claude_s03_u418_unique_name.js`)
- 神禽王アレクトール: hand procedure + once-per-turn negation of a face-up card until the End of the turn.
- 渋い忍者: Flip trigger Special Summoning 「忍者」 face-down from the hand / Graveyard.
- ガガガマジシャン: Level declaration 1-8 (setLevel until End Phase), no Synchro Material.
- ジェスター・コンフィ: hand Special Summon + next opponent End Phase bounce of both.

## Engine (small)
- `engine/1ZZM_earthbound_s03.js` uniqueNameS03 ('any' / 'own') generalizes the face-up uniqueness; `engine/40_legal_script_engine.js` passes the player to uniqueFaceUpReasonS03.

## Tests
- `tools/test_s03_u418_unique_name.js` 26 / 0. Negative control on the previous build (card file removed): 14 FAIL. No existing test changed. Coverage TESTED 3412 -> 3416, NOT_STARTED 459 -> 455, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
