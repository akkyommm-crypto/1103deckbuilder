# S03-U385 — five NOT_STARTED cards

Base: `claude/work` `ec02bbc` (U384, gate 20500 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZU_claude_s03_u385_misc7.js`)
- 紅蓮魔竜の壺: needs a face-up レッド・デーモンズ・ドラゴン; draws 2; `banSummonS03` (S03-U384) bans MY Normal / Special Summons this turn and the opponent's next turn.
- 究極・背水の陣 (Normal Trap): cost = pay LP down to 100 (LP must exceed 100); one 「六武衆」 per name from the Graveyard (names on the field excluded, as many as free zones).
- ゼンマイマニュファクチャ (Continuous Spell): `onActivateSuccess` of a 「ゼンマイ」 monster effect (`u331Zen`) -> optional search of a Level 4 or lower 「ゼンマイ」, once per turn (`countLimit`).
- 邪狂神の使い: optional trigger of the opponent's Standby Phase; cost = free multi-pick banish of DARK monsters from my Graveyard; DEF +500 each until the End Phase.
- 不吉な占い (Continuous Trap): forced trigger of my Standby Phase; the random card (`duelRandomInt`) is kept by uid, the player declares モンスター / 魔法 / 罠 in a `declare` choice (`u385.omen`); a right guess = 700 damage.

## Tests
- `tools/test_s03_u385_misc7.js` 21 / 0. Negative control on the previous build: 11 FAIL. Coverage TESTED 3296 → 3301, NOT_STARTED 568 → 563; `registration_names_missing_from_db` empty; audit 0 FAIL.
