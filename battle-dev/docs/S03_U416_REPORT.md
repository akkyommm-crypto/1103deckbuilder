# S03-U416 - Savior Dragon (救世竜 セイヴァー・ドラゴン), Real Genex Oracle (レアル・ジェネクス・オラクル), Mingei Dragon (ミンゲイドラゴン), Undead Samurai (不死武士)

Base: `claude/work` `3d3eeec` (U415, gate 21064 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZ_claude_s03_u416_revivers.js`)
- 救世竜 セイヴァー・ドラゴン / レアル・ジェネクス・オラクル: synchroMaterialRestriction; オラクル also Special Summons itself from the hand when a 「ジェネクス」 monster added it from the Deck.
- ミンゲイドラゴン: tributeValue 2 (Dragons) + Graveyard Standby Phase revival (banished when it leaves the field).
- 不死武士: Graveyard Standby Phase revival + Tribute only for Warrior Advance Summons.

## Engine
- None.

## Tests
- `tools/test_s03_u416_revivers.js` 23 / 0. Negative control on the previous build (card file removed): 9 FAIL. No existing test changed. Coverage TESTED 3404 -> 3408, NOT_STARTED 467 -> 463, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
