# S03-U419 - Alien Revenger (エーリアン・リベンジャー), Amazoness Pet Tiger (アマゾネスペット虎), Reptilianne Vaskii (レプティレス・ヴァースキ), Ice Barrier Missionary (氷結界の伝道師)

Base: `claude/work` `2ac005b` (U418, gate 21135 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZC_claude_s03_u419_unique_more.js`)
- エーリアン・リベンジャー: counter-removal hand procedure, mass A Counter ignition, uniqueness (own).
- アマゾネスペット虎: ATK scaling, attack protection of the other アマゾネス, uniqueness (own).
- レプティレス・ヴァースキ: release procedure of two ATK 0 monsters, destroy ignition, uniqueness (any).
- 氷結界の伝道師: hand procedure + no Level 5+ Special Summon this turn, release ignition reviving a 「氷結界」 monster.

## Engine (one line)
- `engine/1ZZS_summon_lock_s03.js` summonBanMatchS03 supports {lvmin}.

## Tests
- `tools/test_s03_u419_unique_more.js` 33 / 0. Negative control on the previous build (card file removed): 23 FAIL. No existing test changed. Coverage TESTED 3416 -> 3420, NOT_STARTED 455 -> 451, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
