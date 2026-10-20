# S03-U432 - Element Saurus (エレメント・ザウルス), Element Dragon (エレメント・ドラゴン), Golem (ゴーレム), Mammoth Zombie (マンモス・ゾンビ), Blade Knight (ブレイドナイト)

Base: `claude/work` `c75c345` (U431, gate 21446 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZZP_claude_s03_u432_continuous_rules.js`)
- エレメント・ザウルス, エレメント・ドラゴン, ゴーレム, マンモス・ゾンビ, ブレイドナイト.

## Engine
- `engine/00_state_actions.js`: `declareNegateFromMzS03(name)`; `effectNegated` also reads the continuous.negateEffect of declared face-up MONSTER sources (ゴーレム).
- `engine/1S_battle_destroyed_negation_s03.js`: `battleDestroyedLinkNegatedS03` also handles a link whose source is still on the field as a battle-destroyed victim (Flip effects, ブレイドナイト).

## Tests changed (reason: the ENGINE_GAP overrides of these cards were removed)
- tools/test_v900_batch41.js, test_v910_batch42.js: the names moved from the gap lists to an unlocked record check.

## Tests
- `tools/test_s03_u432_continuous_rules.js` 22 / 0. Negative control on the previous build (card file removed): 9 FAIL. Existing gap-record tests changed (see the report): their lists no longer contain the cards, an unlocked check records them. Coverage TESTED 3478 -> 3483, NOT_STARTED 427 -> 427, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
