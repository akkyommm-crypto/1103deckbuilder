# S03-U429 - Ice Queen (氷の女王), D-HERO Disc Guy (D－HERO ディスクガイ), Coachimeil Drago (コアキメイル・ドラゴ), Tyrant Desperation (暴君の自暴自棄), Worm Bait (ワーム・ベイト), Lost Lamb (迷える仔羊), Slime Reactor (スライム増殖炉)

Base: `claude/work` `884d8dc` (U428, gate 21373 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZM_claude_s03_u429_summon_rules.js`)
- 氷の女王, D－HERO ディスクガイ, コアキメイル・ドラゴ, 暴君の自暴自棄, ワーム・ベイト, 迷える仔羊, スライム増殖炉.

## Engine (two words)
- `engine/1ZZS_summon_lock_s03.js` banSummonS03 match {lvmax}; `engine/1ZK_summon_only_s03.js` the text rule 「墓地へ送られたターンには墓地からの特殊召喚はできない」.

## Tests changed
- None of the existing tests listed these cards; their ENGINE_GAP overrides were removed from data/script_status_overrides.json.

## Tests
- `tools/test_s03_u429_summon_rules.js` 30 / 0. Negative control on the previous build (card file removed): 16 FAIL. No existing test changed (none listed these seven cards); the seven ENGINE_GAP overrides were removed. Coverage TESTED 3460 -> 3467, NOT_STARTED 427 -> 427, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
