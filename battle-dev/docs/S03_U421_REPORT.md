# S03-U421 - Vampire Genesis (ヴァンパイアジェネシス), Dimension Unicorn Warrior (異次元の一角戦士), Neos Wiseman (ネオス・ワイズマン), Cyber Eltanin (サイバー・エルタニン)

Base: `claude/work` `7451d3a` (U420, gate 21192 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZE_claude_s03_u421_procedures.js`)
- ヴァンパイアジェネシス: banish-Vampire-Lord procedure + discard-and-revive ignition.
- 異次元の一角戦士: Tuner / opponent-monster procedure + banished Level 3 revival with negation.
- ネオス・ワイズマン: ネオス + ユベル procedure, effect-destruction immunity, battle burn and recovery.
- サイバー・エルタニン: banish-all-Machine-LIGHT procedure, ATK / DEF 500 x n, sweeps the other monsters.

## Engine
- None.

## Tests
- `tools/test_s03_u421_procedures.js` 27 / 0. Negative control on the previous build (card file removed): 20 FAIL. No existing test changed. Coverage TESTED 3424 -> 3428, NOT_STARTED 447 -> 443, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
